# 2026-06-16 — Seed distractor rewrite to Haladyna/NBME (VN)

> **Source**: user request — toàn bộ seed VN vi phạm chuẩn distractor (Haladyna/NBME). Viết tool chạy hàng loạt (loop until done / song song theo sách) giống "Đề xuất cải thiện" nhưng tự động.
> **Scope**: seed VN (`apps/api/src/main/resources/seed/questions/*_quiz.json`), chỉ `multiple_choice_single`. Provider: Bedrock DeepSeek (default chain, AWS_PROFILE đã có).

**Quyết định (user 2026-06-16):**
- Ghi kết quả vào **file seed JSON** (giữ nguyên `content` → UUID không đổi → seeder tự upsert; có git diff để review).
- Mỗi câu: **viết lại 3 distractor + regenerate explanation**, giữ nguyên câu hỏi + text đáp án đúng.
- **Pilot Genesis trước** (150 câu: 144 single + 6 multi) rồi mới full 66 sách.

### Tasks
- SDR-1 Tool `scripts/seed/rewrite_distractors.py` (Bedrock converse + Haladyna improve-prompt + quality-gate retry + parallel + resumable sidecar + clean-diff round-trip guard)
  - Status: [ ] TODO · Files: `scripts/seed/rewrite_distractors.py` · Test: dry-run + round-trip self-check
  - **Spec impact**: [x] SPEC_ADMIN §7 (seed/AI) — ghi chú tool · BL: none
  - **Spec strategy**: [ ] (b) sau pilot nếu cần · tạm (c) [no-spec-impact] cho tool
  - Checklist: dry-run pilot · review chất lượng · full Genesis · commit
- SDR-2 Pilot run Genesis + review diff + quality summary
  - Status: [ ] TODO
- SDR-3 (sau khi user duyệt pilot) full 66 sách
  - Status: [ ] TODO

### Notes
- Quota 200/ngày KHÔNG áp (gọi thẳng Bedrock, không qua endpoint).
- Resumable: sidecar `scripts/seed/.rewrite_progress.json` (key = content-hash) → re-run skip câu đã xong = "loop until done".
- KHÔNG thêm field lạ vào JSON (tránh seeder fail unknown-prop) — dùng sidecar.
- Round-trip guard: serialize bản gốc == file gốc trước khi ghi → đảm bảo diff sạch.
