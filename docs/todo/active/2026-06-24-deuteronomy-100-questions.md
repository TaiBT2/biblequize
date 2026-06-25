# 2026-06-24 — Soạn 100 câu Phục Truyền Luật Lệ Ký mới (Haladyna × Bloom)

> **Source**: User prompt — "dùng skill bible-quiz-authoring tạo 100 câu Phục Truyền Luật Lệ Ký".
> **Scope**: seed VN `apps/api/src/main/resources/seed/questions/deuteronomy_quiz.json` (đang có 70 câu) → +100 câu mới. Dùng skill `.claude/skills/bible-quiz-authoring`. Bản dịch RVV11/BTTHĐ 2011. EN gen sau bằng skill `translate-quiz-en`.
> **Status**: IN PROGRESS

### Quyết định (user 2026-06-24)
- "Tạo 100 câu" → soạn full 100 → validate → append (không review theo lô).
- Phân bổ tổng: **40 easy / 40 medium / 20 hard** (chuẩn skill, giống Genesis/Exodus/Leviticus 100).
- Chia 10 lát chương rời nhau → 10 câu/lát (4e/4m/2h) → tránh trùng chéo.
  Lát: 1-2 / 3-4 / 5-6 / 7-8 / 9-11 / 12-14 / 15-17 / 18-20 / 21-25 / 26-34.
- Rule error_type: 3 lỗi độc lập (nhãn được trùng nếu khác đoạn).

### Tasks
- D100-1 Dedup baseline: rút 70 stem hiện có theo lát chương
  - Status: `[x]` DONE
- D100-2 Soạn 100 câu (10 lát × 10) — dispatch agent song song, mỗi lát 1 file tmp
  - Status: `[x]` DONE · 10 agent song song (1-2/3-4/5-6/7-8/9-11/12-14/15-17/18-20/21-25/26-34), mỗi lát 10 câu (4e/4m/2h), mỗi lát tự validate 0 ERROR
  - **Spec impact**: `[x]` (c) `[no-spec-impact]` (nội dung seed)
- D100-3 Merge + validate (`validate_questions.py` dedup+schema+length-bias) → fix → append vào `deuteronomy_quiz.json`
  - Status: `[x]` DONE · merge 100 → rebalance vị trí đáp án về 25/25/25/25 (ban đầu dồn 42/100 vào index 0) → sửa 2 length-bias (#2 ch1:15, #5 ch2:5) → validator 0 ERROR/0 WARN dedup vs 70 → append → 170 câu
- D100-FINAL Audit: 70→170 câu, 100 mới = 40e/40m/20h, 0 trùng stem, mọi câu có explanation + error_type tags
  - Status: `[x]` DONE · 170 câu · 170/170 stem duy nhất (0 trùng) · phủ cả 34 chương · tổng độ khó 61e/72m/37h
  - `[x]` gen EN bằng skill `translate-quiz-en` — dịch song song (claude -p sonnet, concurrency 3), EN 70→170, 100 câu mới correctAnswer khớp 100%, tag error_type giữ verbatim
  - `[x]` refresh EN idx53 (ch11:13) — bug có sẵn: VI đã viết lại distractor Haladyna nhưng EN giữ bản cũ → splice 1 entry cho khớp → 0/170 mismatch
  - `[x]` user commit
  - **Status tổng**: DONE
