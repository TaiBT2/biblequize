# 2026-06-16 — Sửa câu hỏi: chuyển sang PAGE + AI đề xuất đáp án (QPG)

> **Source**: User — (1) edit nên là trang riêng (popup chật, cần tập trung phân tích), (2) đánh giá cần "làm nhiều hơn" → AI đề xuất đáp án cải thiện + Apply. · Chốt (AskUser): page mới + GET-by-id refresh-safe; AI suggest làm luôn đợt này.

### Tasks

- **QPG-1 BE `GET /api/admin/questions/{id}`**
  - Status: [ ] TODO · Files: `AdminQuestionController` (getOne) · Test: `AdminQuestionControllerTest`
  - Trả Question theo id, 404 nếu không có. Phục vụ page load/F5.
  - **Spec impact**: [ ] SPEC_ADMIN §5 · **Spec strategy**: [ ] (a)
  - Checklist: impl · Tầng 1 · spec · commit

- **QPG-2 BE `POST /api/admin/ai/improve-question` (AI đề xuất)**
  - Status: [ ] TODO · Files: `AIAdminController` (improve) + `AIGenerationService.improveQuestion` (prompt + Gemini/Claude call, fail-soft) + DTO · Test: controller test (fail-soft khi no provider)
  - Input: content/options/correctAnswer/explanation/type/language/difficulty. Output: `{ aiAvailable, suggestion?{options[4], correctAnswer, explanation, rationale, weakDistractors[]} }`. Quota `tryAcquire(1)`. No provider → aiAvailable:false (heuristic FE vẫn chạy).
  - **Spec impact**: [ ] SPEC_ADMIN §7 · **Spec strategy**: [ ] (a)
  - Checklist: impl · Tầng 1 · spec · commit

- **QPG-3 FE: QuestionFields + QuestionEditPage (2 cột)** ✅
  - Status: [x] DONE (2026-06-16) · Files: `QuestionFields.tsx` (mới, fields thuần), `QuestionEditPage.tsx` (mới — route `/admin/questions/:id/edit` + `/new`; fetch GET-by-id / state; 2 cột: form trái · heuristic live + "Đề xuất cải thiện" AI → suggestion + "Áp dụng"), `main.tsx` routes
  - **Spec impact**: [x] None (UI) · **Spec strategy**: [x] (c)
  - Checklist: [x] impl · [x] tsc sạch · [x] Tầng 3 FE (1278 pass) · [ ] commit

- **QPG-4 FE: điều hướng sang page; xoá modal** ✅
  - Status: [x] DONE (2026-06-16) · Files: `Questions.tsx` (edit/create → navigate page, bỏ editing/modal/saveSuccess), `ReviewQueue.tsx` (Sửa → navigate `?from=review` + state), **xoá** `QuestionEditModal.tsx`
  - **Spec impact**: [x] None (UI) · **Spec strategy**: [x] (c)
  - Checklist: [x] impl · [x] tsc sạch · [x] Tầng 3 FE · [~] verify: ReviewQueue.test pass + HMR no-error; UI cần login admin → user kiểm · [ ] commit

### Ghi chú
- Dev BE hiện không có GEMINI/Claude key → improve-question trả `aiAvailable:false`; cần cấu hình key để test AI thật. Heuristic vẫn hoạt động.
