# 2026-06-16 — Trang sửa câu hỏi: wrap đáp án + nút đánh giá chất lượng (QEV)

> **Source**: User — modal "Sửa câu hỏi". (1) đáp án dài bị tràn ngang, cần xuống hàng. (2) nút đánh giá đáp án có đúng nguyên tắc (length parity / distractor hợp lý / vị trí / explanation) — AI hoặc heuristic. · **Scope**: `apps/web/.../admin/Questions.tsx` + BE AI evaluate endpoint.

### Tasks

- **QEV-1 Wrap input đáp án (bỏ scroll ngang)** ✅
  - Status: [x] DONE (2026-06-16) · Files: `Questions.tsx` — option `<input h-8>` → `<textarea>` auto-rows (`ceil(len/46)`, cap 4) + container `items-start` + `break-words`
  - **Spec impact**: [x] None (UI) · **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: [x] impl · [x] Tầng 3 FE (1278 pass) · [ ] commit

- **QEV-2 BE endpoint đánh giá chất lượng câu hỏi (hybrid)**
  - Status: [ ] TODO · Files: `AIAdminController` (POST `/api/admin/ai/evaluate-question`) + DTO + reuse `QuestionQualityChecker.lengthBias` (deterministic) + AI cho phần "distractor có hợp lý không" · Test: controller test
  - Trả: `{ lengthBias{biased,ratio}, position, score, distractorPlausibility, suggestions[] }`. lengthBias + position tính cục bộ (không tốn quota); phần AI judge plausibility tốn 1 quota unit (`AIQuotaService.tryAcquire(1)`), fail-soft nếu không có provider.
  - **Spec impact**: [ ] SPEC_ADMIN §7 · **Spec strategy**: [ ] (a)
  - Checklist: impl · Tầng 1+3 · spec · commit

- **QEV-3 FE nút "Đánh giá chất lượng" + panel kết quả**
  - Status: [ ] TODO · Files: `Questions.tsx` (nút trong modal + gọi endpoint + render checklist pass/warn) · Test: `Questions.test.tsx`
  - Instant: hiện ngay length/position (local) ; bấm "AI review sâu" mới gọi endpoint cho plausibility.
  - **Spec impact**: [x] None (UI) · **Spec strategy**: [x] (c)
  - Checklist: impl · Tầng 1+3 · commit

### Out of scope
- Auto-fix (rewrite distractor) ngay trong modal — defer.
