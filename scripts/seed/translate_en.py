#!/usr/bin/env python3
"""Translate the rewritten VN distractors + explanation into the parallel EN
seed files, so EN reaches the same Haladyna standard as VN.

VN (*_quiz.json) and EN (*_quiz_en.json) are index-parallel with identical
correctAnswer indices. For each single-MCQ question whose VN distractors changed
since the pre-rewrite baseline, we translate the new VN distractors + explanation
to English and drop them into the matching EN row — keeping the EN correct-answer
text and EN question content untouched.

Usage:
  PYTHONUTF8=1 python scripts/seed/translate_en.py --books all --file-workers 4 --workers 4
"""
from __future__ import annotations
import argparse, concurrent.futures as cf, hashlib, json, re, subprocess, sys, threading, time
from pathlib import Path
import importlib.util
from botocore.exceptions import ClientError

spec = importlib.util.spec_from_file_location("rw", "scripts/seed/rewrite_distractors.py")
rw = importlib.util.module_from_spec(spec); spec.loader.exec_module(rw)

try:
    sys.stdout.reconfigure(encoding="utf-8"); sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

SEED = Path("apps/api/src/main/resources/seed/questions")
PROGRESS = Path("scripts/seed/.translate_progress.json")
REPORT = Path("scripts/seed/translate_report.json")
BASELINE = "5e09e81"  # commit before any VN distractor rewrite

SYSTEM = ("You translate Vietnamese Protestant Bible-quiz text into natural English. "
          "Use standard English Bible names and terms (e.g. Môi-se->Moses, Đức Giê-hô-va->the LORD, "
          "Đức Chúa Trời->God, Đấng Christ->Christ). Return ONLY a JSON object, no prose.")

PROMPT = """Dịch các phương án SAI (distractor) và phần giải thích sau sang tiếng Anh tự nhiên, giữ NGUYÊN ý nghĩa, dùng thuật ngữ Kinh Thánh tiếng Anh chuẩn (Protestant). Giữ đúng số lượng distractor và đúng thứ tự.

Distractors (VN):
{numbered}

Giải thích (VN): "{explanation}"

Trả về JSON: {{"distractors": [{slots}], "explanation": "..."}}"""

_t = threading.local()


def baseline_options(gitpath):
    out = subprocess.run(["git", "show", f"{BASELINE}:{gitpath}"], capture_output=True, text=True, encoding="utf-8").stdout
    if not out:
        return None
    return [q.get("options") for q in json.loads(out)]


def translate(distractors, explanation, attempts=4):
    numbered = "\n".join(f"{i}. {d}" for i, d in enumerate(distractors))
    prompt = PROMPT.format(numbered=numbered, explanation=explanation or "",
                           slots=", ".join(['"..."'] * len(distractors)))
    last = ""
    for a in range(attempts):
        try:
            obj = rw.parse_obj(_call(prompt, 0.2))
            d = [str(x).strip() for x in (obj.get("distractors") or [])]
            e = str(obj.get("explanation") or "").strip()
            if len(d) == len(distractors) and all(d) and e:
                return d, e
            last = "shape mismatch"
        except (ClientError, ValueError, json.JSONDecodeError) as ex:
            last = str(ex); time.sleep(1.0 * (a + 1))
    return None, last


def _call(prompt, temp):
    if not hasattr(_t, "c"):
        import boto3
        from botocore.config import Config
        _t.c = boto3.client("bedrock-runtime", region_name="ap-northeast-1",
                            config=Config(retries={"max_attempts": 4, "mode": "adaptive"}))
    r = _t.c.converse(modelId="deepseek.v3.2", system=[{"text": SYSTEM}],
                      messages=[{"role": "user", "content": [{"text": prompt}]}],
                      inferenceConfig={"maxTokens": 1200, "temperature": temp})
    txt = r["output"]["message"]["content"][0]["text"].strip()
    if txt.startswith("```"):
        txt = re.sub(r"^```(?:json)?\s*", "", txt); txt = re.sub(r"```\s*$", "", txt).strip()
    return txt


def process(vn_path: Path, args, report, lock):
    en_path = SEED / vn_path.name.replace("_quiz.json", "_quiz_en.json")
    if not en_path.exists():
        return
    vn = json.loads(vn_path.read_text(encoding="utf-8"))
    raw = en_path.read_text(encoding="utf-8"); trailing = raw.endswith("\n"); en = json.loads(raw)
    base = baseline_options(vn_path.as_posix())
    prog = json.loads(PROGRESS.read_text(encoding="utf-8")) if PROGRESS.exists() else {}

    targets = []
    for i, (v, e) in enumerate(zip(vn, en)):
        if v.get("type") != "multiple_choice_single":
            continue
        if v.get("correctAnswer") != e.get("correctAnswer") or v.get("chapter") != e.get("chapter") or v.get("verseStart") != e.get("verseStart"):
            continue  # misaligned pair — skip for safety
        if base and i < len(base) and base[i] == v.get("options"):
            continue  # VN unchanged since baseline → EN already fine
        h = hashlib.sha1((vn_path.name + "|" + str(i)).encode()).hexdigest()
        if prog.get(h) == "done":
            continue
        targets.append((i, v, e, h))
    if not targets:
        print(f"[DONE] {en_path.name}: nothing to do."); return
    print(f"[FILE] {en_path.name}: {len(targets)} câu cần dịch")

    ci_of = lambda q: (q.get("correctAnswer") or [0])[0]
    changed = 0

    def work(t):
        i, v, e, h = t
        opts = v.get("options") or []; ci = ci_of(v)
        vn_dist = [opts[j] for j in range(len(opts)) if j != ci]
        d, expl = translate(vn_dist, v.get("explanation", ""), args.max_attempts)
        return i, e, h, d, expl

    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        for i, e, h, d, expl in ex.map(work, targets):
            ref = rw.ref_of(en[i])
            if d is None:
                with lock: report.append({"file": en_path.name, "ref": ref, "status": "failed", "note": expl})
                print(f"  - {ref}: failed ({expl})"); continue
            eo = en[i].get("options") or []; ci = ci_of(en[i])
            slots = [j for j in range(len(eo)) if j != ci]
            for slot, val in zip(slots, d):
                eo[slot] = val
            if not args.dry_run:
                en[i]["options"] = eo; en[i]["explanation"] = expl
                with lock:
                    prog[h] = "done"
            changed += 1
            with lock: report.append({"file": en_path.name, "ref": ref, "status": "translated"})
            print(f"  - {ref}: translated")

    if changed and not args.dry_run:
        rw.save_json(en_path, en, trailing)
        with lock:
            PROGRESS.write_text(json.dumps(prog, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[WROTE] {en_path.name}: {changed} câu")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--books", default="genesis")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--file-workers", type=int, default=4)
    ap.add_argument("--max-attempts", type=int, default=4)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.books == "all":
        files = sorted(p for p in SEED.glob("*_quiz.json") if not p.name.endswith("_en.json"))
    else:
        files = [SEED / f"{b.strip()}_quiz.json" for b in args.books.split(",")]
        files = [f for f in files if f.exists()]
    report, lock = [], threading.Lock()
    t0 = time.time()

    def safe(f):
        try:
            process(f, args, report, lock)
        except Exception as ex:
            print(f"[ERROR] {f.name}: {ex}")

    with cf.ThreadPoolExecutor(max_workers=args.file_workers) as ex:
        list(ex.map(safe, files))
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    by = {}
    for r in report:
        by[r["status"]] = by.get(r["status"], 0) + 1
    print(f"\n=== SUMMARY ({time.time()-t0:.0f}s) === {by}\nReport: {REPORT}")


if __name__ == "__main__":
    main()
