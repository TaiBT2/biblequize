# 2026-06-24 — Soạn 100 câu Lê-vi Ký mới (Haladyna × Bloom)

> **Source**: User prompt — "dùng skill bible-quiz-authoring tạo thêm 100 câu cho sách Lê-vi Ký, tạo xong 1 lần".
> **Scope**: seed VN `apps/api/src/main/resources/seed/questions/leviticus_quiz.json` (đang có 75 câu) → +100 câu mới. Dùng skill `.claude/skills/bible-quiz-authoring`. Bản dịch RVV11/BTTHĐ 2011. EN gen sau bằng `scripts/translate_to_en.py`.
> **Status**: IN PROGRESS

### Quyết định (user 2026-06-24)
- "Tạo xong 1 lần" → KHÔNG review theo lô; soạn full 100 → validate → append.
- Phân bổ tổng: **40 easy / 40 medium / 20 hard** (theo chuẩn skill, giống Genesis 100).
- Chia 4 cụm chương rời nhau (1-7 / 8-15 / 16-22 / 23-27) → 25 câu/cụm (10e/10m/5h) → tránh trùng chéo.
- Rule error_type: 3 lỗi độc lập (nhãn được trùng nếu khác đoạn).

### Tasks
- L100-1 Dedup baseline: rút 75 stem hiện có theo cụm chương
  - Status: `[x]` DONE
- L100-2 Soạn 100 câu (4 cụm × 25) — dispatch agent song song, mỗi cụm 1 file tmp
  - Status: `[x]` DONE · 4 agent song song (ch1-7/8-15/16-22/23-27), mỗi cụm 25 câu (10e/10m/5h), mỗi cụm validate 0 ERROR
  - **Spec impact**: `[x]` (c) `[no-spec-impact]` (nội dung seed)
- L100-3 Merge + validate (`validate_questions.py` dedup+schema+length-bias) → fix → append vào `leviticus_quiz.json`
  - Status: `[x]` DONE · merge 100 → rebalance vị trí đáp án về 25/25/25/25 (ban đầu dồn 78/100 vào A/B) → validator 0 ERROR/0 WARN dedup vs 75 → append → 175 câu
- L100-FINAL Audit: 75→175 câu, 100 mới = 40e/40m/20h, 0 trùng stem, mọi câu có explanation + error_type tags
  - Status: `[x]` DONE · 175 câu · 0 trùng stem/175 · mọi câu có explanation · 100 mới phủ cả 27 chương · tổng độ khó 75e/65m/35h
  - `[x]` gen EN bằng skill `translate-quiz-en` — dịch song song 5 chunk×20 (claude -p sonnet), EN 75→175, correctAnswer khớp 100%, method tag giữ verbatim · `[ ]` user commit
  - **Status tổng**: DONE (chờ user duyệt + commit)
