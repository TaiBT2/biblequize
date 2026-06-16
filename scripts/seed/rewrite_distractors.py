#!/usr/bin/env python3
"""
Rewrite seed-question distractors to the Haladyna/NBME standard (Vietnamese).

Mirror of the in-app "Đề xuất cải thiện" feature, but batched: for every
multiple_choice_single question it KEEPS the question text + correct answer text
verbatim, and asks DeepSeek (via AWS Bedrock — same provider the app uses) to
rewrite the 3 distractors + the explanation following the distractor-quality
rules encoded in AIGenerationService.buildPrompt (keep this prompt in sync).

Writes back into the *_quiz.json seed files (content unchanged → deterministic
seed UUID unchanged → QuestionSeeder upserts options/explanation on next start).

Resumable via a sidecar progress file (no schema change to the JSON). A
round-trip guard refuses to write if re-serializing the untouched file would
not reproduce it byte-for-byte (keeps git diffs clean).

Usage:
  PYTHONUTF8=1 python scripts/seed/rewrite_distractors.py --books genesis
  PYTHONUTF8=1 python scripts/seed/rewrite_distractors.py --books all --workers 6
  ... --dry-run            # don't write files, just produce the report
  ... --limit 5            # only first N eligible questions (smoke test)

Requires: boto3, AWS creds (AWS_PROFILE / env), region with Bedrock DeepSeek.
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import hashlib
import json
import re
import sys
import threading
import time
from pathlib import Path

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

# Force UTF-8 I/O on Windows consoles (cp1252 chokes on Vietnamese).
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

SEED_DIR = Path("apps/api/src/main/resources/seed/questions")
PROGRESS_FILE = Path("scripts/seed/.rewrite_progress.json")
REPORT_FILE = Path("scripts/seed/rewrite_report.json")

MODEL_ID = "deepseek.v3.2"
REGION = "ap-northeast-1"
MAX_TOKENS = 1500
LENGTH_BIAS_RATIO = 1.5  # mirror QuestionQualityChecker

# Absolute/extreme cue words (mirror evaluateQuestionQuality Rule E).
CUE_WORDS_VI = ["luôn luôn", "không bao giờ", "tất cả", "ngay từ đầu",
                "hoàn toàn", "đầy dẫy", "tuyệt đối", "duy nhất", "mãi mãi"]

SYSTEM_PROMPT = (
    "Bạn là chuyên gia viết câu hỏi trắc nghiệm Kinh Thánh (Tin Lành, BTT tiếng Việt). "
    "Chỉ trả về MỘT object JSON hợp lệ — không markdown, không lời dẫn."
)

# Mirrors the 5-type taxonomy + rules in AIGenerationService.buildPrompt.
PROMPT_TEMPLATE = """Đây là việc CẢI THIỆN một câu hỏi trắc nghiệm đã có — KHÔNG tạo câu mới khác chủ đề.

Tham chiếu: {ref}
Câu hỏi (GIỮ NGUYÊN, không sửa): "{content}"
Đáp án ĐÚNG (GIỮ NGUYÊN Ý NGHĨA, không đưa vào danh sách distractor): "{correct}"

Nhiệm vụ: viết lại {n} ĐÁP ÁN SAI (distractor) tiếng Việt + viết lại phần giải thích, theo ĐÚNG chuẩn Haladyna/NBME:
- ĐỒNG NHẤT: distractor cùng độ dài, cùng giọng văn, cùng cấu trúc ngữ pháp với đáp án đúng. TUYỆT ĐỐI không để đáp án đúng dài/đầy đủ hơn hẳn.
- MỖI DISTRACTOR MỘT LOẠI LỖI KHÁC NHAU (chọn {n} loại khác nhau, không lặp), từ:
  nhầm passage gần / sai chi tiết (số, tên, thứ tự) / sai phạm vi / hiểu lầm phổ biến / đúng văn bản nhưng lạc câu hỏi.
- PHẢI có ÍT NHẤT 1 distractor "gần đúng" (almost-right): đúng ~90%, chỉ sai 1 chi tiết then chốt.
- HỢP LÝ với người đọc lướt; KHÔNG bịa đáp án vô lý/buồn cười/lạc đề.
- MỖI distractor PHẢI là đáp án SAI RÕ RÀNG cho đúng câu hỏi này — TUYỆT ĐỐI không đồng nghĩa, không bao hàm, không "cũng có thể đúng" như đáp án đúng (vd đáp án đúng "Đức Chúa Trời" thì KHÔNG dùng "Đấng Tạo Hóa"/"Chúa"/"Đấng Toàn Năng").
- KHÔNG để riêng distractor chứa từ tuyệt đối lộ liễu (luôn luôn / không bao giờ / hoàn toàn / đầy dẫy...).
- explanation: trích đoạn cụ thể, nêu vì sao đáp án đúng đúng VÀ vì sao mỗi distractor sai.

Trả về JSON đúng dạng:
{{
  "distractors": [{distractor_slots}],
  "errorTypes": [{error_type_slots}],
  "almostRightIndex": 0,
  "explanation": "..."
}}
errorTypes là một trong: "nearby_passage", "wrong_detail", "wrong_scope", "common_misconception", "true_but_off".
{n} errorTypes phải KHÁC nhau. almostRightIndex là chỉ số (0-based) của distractor gần đúng."""

_thread_local = threading.local()


def _client():
    if not hasattr(_thread_local, "client"):
        _thread_local.client = boto3.client(
            "bedrock-runtime", region_name=REGION,
            config=Config(retries={"max_attempts": 4, "mode": "adaptive"}))
    return _thread_local.client


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def q_hash(q: dict) -> str:
    key = f"{q.get('book')}|{q.get('chapter')}|{q.get('verseStart')}|{q.get('verseEnd')}|{norm(q.get('content',''))}"
    return hashlib.sha1(key.encode("utf-8")).hexdigest()


def ref_of(q: dict) -> str:
    r = f"{q.get('book')} {q.get('chapter')}:{q.get('verseStart')}"
    if q.get("verseEnd") and q["verseEnd"] != q.get("verseStart"):
        r += f"-{q['verseEnd']}"
    return r


def find_cues(text: str) -> list[str]:
    lc = (text or "").lower()
    return [w for w in CUE_WORDS_VI if w in lc]


def length_bias(options: list[str], correct_idx: int) -> bool:
    """Mirror QuestionQualityChecker.lengthBias — True == biased (bad)."""
    lens = [len((o or "").strip()) for o in options]
    if len(lens) < 2 or correct_idx < 0 or correct_idx >= len(lens):
        return False
    correct_len = lens[correct_idx]
    distractors = [l for i, l in enumerate(lens) if i != correct_idx]
    avg = sum(distractors) / len(distractors) if distractors else 0
    longest = correct_len > 0 and correct_len >= max(lens)
    ratio = (correct_len / avg) if avg else 0
    return longest and ratio >= LENGTH_BIAS_RATIO


def call_bedrock(prompt: str, temperature: float) -> str:
    resp = _client().converse(
        modelId=MODEL_ID,
        system=[{"text": SYSTEM_PROMPT}],
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": MAX_TOKENS, "temperature": temperature},
    )
    text = resp["output"]["message"]["content"][0]["text"].strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"```\s*$", "", text).strip()
    return text


def parse_obj(text: str) -> dict:
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("no JSON object in model output")
    return json.loads(text[start:end + 1])


def gate(correct: str, distractors: list[str], error_types: list[str],
         almost_idx, n: int) -> list[str]:
    """Return list of failure reasons (empty == passes)."""
    reasons = []
    if len(distractors) != n or any(not (d or "").strip() for d in distractors):
        reasons.append(f"need {n} non-empty distractors")
        return reasons  # nothing else is meaningful
    pool = [norm(d) for d in distractors] + [norm(correct)]
    if len(set(pool)) != len(pool):
        reasons.append("distractors not distinct (or equal to correct)")
    if len(error_types) != n or len(set(error_types)) != n:
        reasons.append("errorTypes missing/duplicated")
    if not isinstance(almost_idx, int) or not (0 <= almost_idx < n):
        reasons.append("almostRightIndex invalid")
    # length parity: build final option set with correct kept at index 0 for the check
    if length_bias([correct] + distractors, 0):
        reasons.append("length bias (correct still longest ≥1.5x)")
    # cue asymmetry (Rule E): cues must not sit on only one side
    correct_has = bool(find_cues(correct))
    distr_has = any(find_cues(d) for d in distractors)
    if correct_has != distr_has:
        reasons.append("telltale cue asymmetry")
    return reasons


def rewrite_one(q: dict, max_attempts: int) -> dict:
    """Return {status, options?, explanation?, note}."""
    correct_list = q.get("correctAnswer") or []
    if q.get("type") != "multiple_choice_single" or len(correct_list) != 1:
        return {"status": "skipped", "note": f"type={q.get('type')}"}
    options = q.get("options") or []
    ci = correct_list[0]
    if not isinstance(ci, int) or ci < 0 or ci >= len(options):
        return {"status": "skipped", "note": "bad correct index"}
    correct = options[ci]
    distractor_slots = [i for i in range(len(options)) if i != ci]
    n = len(distractor_slots)
    if n < 2:
        return {"status": "skipped", "note": "too few options"}

    prompt = PROMPT_TEMPLATE.format(
        ref=ref_of(q), content=q.get("content", ""), correct=correct, n=n,
        distractor_slots=", ".join(['"..."'] * n),
        error_type_slots=", ".join(['"..."'] * n))

    last = ""
    for attempt in range(max_attempts):
        try:
            raw = call_bedrock(prompt, 0.6 + 0.1 * attempt)
            obj = parse_obj(raw)
        except (ClientError, ValueError, json.JSONDecodeError) as e:
            last = f"call/parse: {e}"
            time.sleep(1.5 * (attempt + 1))
            continue
        distractors = [str(d).strip() for d in (obj.get("distractors") or [])]
        error_types = [str(t).strip() for t in (obj.get("errorTypes") or [])]
        almost = obj.get("almostRightIndex")
        reasons = gate(correct, distractors, error_types, almost, n)
        if reasons:
            last = "; ".join(reasons)
            continue
        new_options = list(options)
        for slot, d in zip(distractor_slots, distractors):
            new_options[slot] = d
        return {
            "status": "rewritten",
            "options": new_options,
            "explanation": str(obj.get("explanation") or q.get("explanation") or "").strip(),
            "errorTypes": error_types,
            "note": f"attempt {attempt + 1}",
        }
    return {"status": "failed", "note": last}


def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        return json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
    return {}


def save_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def roundtrip_ok(path: Path, data) -> bool:
    """True if re-serializing matches the file byte-for-byte (clean-diff guard)."""
    return path.read_text(encoding="utf-8") == json.dumps(data, ensure_ascii=False, indent=2) + "\n"


def process_file(path: Path, progress: dict, args, report: list, lock: threading.Lock) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not roundtrip_ok(path, data):
        print(f"[SKIP] {path.name}: format mismatch — would dirty whole file, refusing.")
        return

    eligible = [(i, q) for i, q in enumerate(data)
                if q.get("type") == "multiple_choice_single"
                and q.get("language", "vi") == "vi"
                and progress.get(q_hash(q)) != "done"]
    if args.limit:
        eligible = eligible[:args.limit]
    if not eligible:
        print(f"[DONE] {path.name}: nothing to do.")
        return

    print(f"[FILE] {path.name}: {len(eligible)} câu cần xử lý (workers={args.workers})")
    changed = 0

    def work(item):
        i, q = item
        res = rewrite_one(q, args.max_attempts)
        return i, q, res

    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        for i, q, res in ex.map(work, eligible):
            h = q_hash(q)
            entry = {"file": path.name, "ref": ref_of(q), "status": res["status"], "note": res.get("note")}
            if res["status"] == "rewritten":
                entry["before"] = q.get("options")
                entry["after"] = res["options"]
                if not args.dry_run:
                    q["options"] = res["options"]
                    q["explanation"] = res["explanation"]
                changed += 1
                with lock:
                    progress[h] = "done"
            with lock:
                report.append(entry)
            print(f"  - {entry['ref']}: {res['status']} ({res.get('note')})")

    if changed and not args.dry_run:
        save_json(path, data)
        PROGRESS_FILE.write_text(json.dumps(progress, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[WROTE] {path.name}: {changed} câu cập nhật.")
    elif args.dry_run:
        print(f"[DRY] {path.name}: {changed} câu sẽ cập nhật (không ghi).")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--books", default="genesis", help="'all' hoặc list slug ngăn cách dấu phẩy (vd genesis,exodus)")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--max-attempts", type=int, default=4)
    ap.add_argument("--limit", type=int, default=0, help="chỉ N câu đầu mỗi file (smoke test)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not SEED_DIR.exists():
        print(f"ERROR: {SEED_DIR} not found — run from repo root.")
        sys.exit(1)

    if args.books == "all":
        files = sorted(p for p in SEED_DIR.glob("*_quiz.json") if not p.name.endswith("_en.json"))
    else:
        files = [SEED_DIR / f"{b.strip()}_quiz.json" for b in args.books.split(",")]
        files = [f for f in files if f.exists()]
    if not files:
        print("ERROR: no matching VN seed files.")
        sys.exit(1)

    progress = load_progress()
    report: list = []
    lock = threading.Lock()
    t0 = time.time()
    for f in files:
        process_file(f, progress, args, report, lock)

    REPORT_FILE.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    by = {}
    for r in report:
        by[r["status"]] = by.get(r["status"], 0) + 1
    print(f"\n=== SUMMARY ({time.time()-t0:.0f}s) ===")
    print(by)
    print(f"Report: {REPORT_FILE}")


if __name__ == "__main__":
    main()
