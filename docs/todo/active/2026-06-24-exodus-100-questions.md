# 2026-06-24 — Soạn 100 câu Xuất Ê-díp-tô Ký mới (Haladyna × Bloom)

> **Source**: User prompt — "chạy skill bible-quiz-authoring cho sách Xuất Ê-díp-tô Ký tạo 100 câu mới nữa đảm bảo không trùng".
> **Scope**: seed VN `apps/api/src/main/resources/seed/questions/exodus_quiz.json` (đang có 151 câu) → +100 câu mới. Dùng skill `.claude/skills/bible-quiz-authoring`. Bản dịch RVV11/BTTHĐ 2011. EN gen sau bằng `scripts/translate_to_en.py`.
> **Status**: IN PROGRESS

### Quyết định (user 2026-06-24)
- Quy trình: **soạn hết 100 → validate → review 1 lần** → mới append seed.
- Phân bổ độ khó: **~30 easy / 45 medium / 25 hard** (cân bằng ~ hiện trạng).
- Dedup nền: 151 stem hiện có đã rút (rải khắp 40 chương) → câu mới phải khác chi tiết được hỏi.

### Tasks
- EX100-1 Bước 0 dedup: rút 151 stem + ref hiện có, lập map chương/chi tiết đã hỏi
  - Status: `[x]` DONE
- EX100-2 Soạn 100 câu mới (file lô tạm) — mỗi câu self-critique đủ checklist, rải đều 40 chương, nhắm chi tiết chưa hỏi
  - Status: `[x]` DONE · Files: `tmp/exodus_new100.json` (38/40 chương, 30e/45m/25h)
  - **Spec impact**: `[x]` (c) `[no-spec-impact]` (nội dung seed)
- EX100-3 Validate lô bằng `validate_questions.py` (schema/option/index/dedup/length-bias) → 0 ERROR
  - Status: `[x]` DONE — 0 ERROR / 0 warning / 0 trùng (sau 24 fix length-bias + 1 fix tag)
- EX100-4 Trình review tổng hợp → user duyệt → append vào `exodus_quiz.json`
  - Status: `[x]` DONE — append 151 → 251 câu (text-splice, diff sạch)
- EX100-5 Gen bản EN cho 100 câu mới (skill translate-quiz-en, `claude -p`)
  - Status: `[x]` DONE — EN 151 → 251; verify: 100 câu mới correctAnswer khớp VI, alignment khớp, language==en, giữ tag error_type
- EX100-FINAL Audit 151→251 câu, 100 mới đúng tỉ lệ độ khó, 0 trùng stem, mọi câu có explanation
  - Status: `[x]` DONE — VI 251/EN 251, 0 trùng stem nội bộ, mọi câu có explanation; toàn sách 75e/114m/62h · `[ ]` user commit
- EX100-6 Fix bug có sẵn câu cũ #149 (Ex 34:6) — bản EN distractor lệch hẳn khỏi VI (correctAnswer VI=[0] vs EN=[2])
  - Status: `[x]` DONE — re-dịch EN #149 sát VI (ESV, giữ thứ tự option + correctAnswer=[0] + tag); verify toàn bộ 251 VI/EN correctAnswer + alignment khớp 100%
