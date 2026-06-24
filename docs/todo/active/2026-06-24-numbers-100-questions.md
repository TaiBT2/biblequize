# 2026-06-24 — Soạn 100 câu Dân Số Ký mới + bản EN (Haladyna × Bloom)

> **Source**: User prompt — "dùng skill bible-quiz-authoring tạo 100 câu cho sách Dân Số Ký".
> **Scope**: seed VN `apps/api/src/main/resources/seed/questions/numbers_quiz.json` (đang có 75 câu) → +100 câu mới; gen bản EN `numbers_quiz_en.json`. Dùng skill `.claude/skills/bible-quiz-authoring` + `.claude/skills/translate-quiz-en`. Bản dịch RVV11/BTTHĐ 2011.
> **Status**: DONE

### Quyết định (user 2026-06-24)
- Fan-out 10 subagent, mỗi agent 1 lát chương RỜI NHAU (1-3 / 4-6 / 7-9 / 10-12 / 13-15 / 16-18 / 19-21 / 22-25 / 26-30 / 31-36), mỗi lát 10 câu (4 easy / 4 medium / 2 hard).
- Phân bổ tổng: **40 easy / 40 medium / 20 hard**. Index đáp án đúng rải đều (đã fix 2 lát bị dồn index 0).
- Sau append → dịch EN incremental bằng `translate-quiz-en` (Claude/Max).

### Tasks
- N100-1 Fan-out 10 agent soạn 100 câu (lát chương rời nhau) + self-critique
  - Status: `[x]` DONE · Files: `tmp/numbers-batch/slice_*.json`
- N100-2 Merge + validate toàn lô (dedup vs 75 cũ + chéo lát, schema, length-bias)
  - Status: `[x]` DONE — `validate_questions.py` exit 0, 0 ERROR
- N100-3 Append vào seed VN
  - Status: `[x]` DONE — `numbers_quiz.json` 75 → 175
  - **Spec impact**: `[x]` (c) `[no-spec-impact]` (nội dung seed, không đổi behavior/luật)
- N100-4 Gen bản EN (`translate-quiz-en`, Claude/Max) + verify alignment
  - Status: `[x]` DONE — `numbers_quiz_en.json` 75 → 175; VI↔EN khớp 175/175 (correctAnswer + chapter/verse + language). Vá luôn legacy drift #71 (verseStart 7:84→7:1) trong câu cũ.
  - **Spec impact**: `[x]` (c) `[no-spec-impact]`
