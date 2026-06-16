# 2026-06-16 — Trang sửa câu hỏi: wrap đáp án + nút đánh giá chất lượng (QEV)

> **Source**: User — modal "Sửa câu hỏi". (1) đáp án dài bị tràn ngang, cần xuống hàng. (2) nút đánh giá đáp án có đúng nguyên tắc (length parity / distractor hợp lý / vị trí / explanation) — AI hoặc heuristic. · **Scope**: `apps/web/.../admin/Questions.tsx` + BE AI evaluate endpoint.

### Tasks

- **QEV-1 Wrap input đáp án (bỏ scroll ngang)** ✅
  - Status: [x] DONE (2026-06-16) · Files: `Questions.tsx` — option `<input h-8>` → `<textarea>` auto-rows (`ceil(len/46)`, cap 4) + container `items-start` + `break-words`
  - **Spec impact**: [x] None (UI) · **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: [x] impl · [x] Tầng 3 FE (1278 pass) · [ ] commit

- **QEV-2 Nút "Đánh giá chất lượng" — evaluator tức thời phía FE** ✅
  - Status: [x] DONE (2026-06-16) · Files: `Questions.tsx` — `evaluateQuestionQuality()` (module fn) + state `quality` + nút cạnh nhãn Lựa chọn + panel checklist pass/warn/info
  - Phủ 4/5 nguyên tắc tức thời (không endpoint, không quota): (1) đủ+không trùng, (2) length-parity (correct dài nhất & ≥1.5× → warn), (3) vị trí (đúng ở A → info), (4) explanation đủ/đủ dài. (5) distractor-plausibility gắn cờ ℹ "cần người/AI".
  - **Spec impact**: [x] None (UI/tool) · **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: [x] impl · [x] tsc sạch · [x] Tầng 3 FE (1278 pass) · [ ] commit

### Out of scope / defer
- **QEV-3 AI deep-review** (judge distractor plausibility): cần endpoint `/api/admin/ai/evaluate-question` + generic AI completion path (provider hiện chỉ có generate→questions) + 1 quota unit. Để follow-up nếu user muốn chấm "distractor có hợp lý không" bằng AI.
- Auto-fix (AI rewrite distractor) ngay trong modal — defer.
- i18n: label evaluator hardcode tiếng Việt (admin tool) — accepted debt.
