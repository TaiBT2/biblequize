# 2026-06-16 — Edit câu hỏi: dùng chung modal cho Questions + Review Queue (QED)

> **Source**: User — muốn sửa câu hỏi được cả trong Review Queue, không chỉ Questions. Chốt (AskUser): GIỮ edit ở Questions + THÊM vào Review Queue, **dùng chung modal**. · **Lý do giữ ở Questions**: Review Queue chỉ chứa PENDING; câu ACTIVE (phần lớn pool) chỉ sửa được ở Questions.

### Tasks

- **QED-1 Tách modal editor thành component dùng chung** ✅
  - Status: [x] DONE (2026-06-16) · Files: `questionTypes.ts` (mới — types + EMPTY_QUESTION + optionDefaults + QCheck + evaluateQuestionQuality), `QuestionEditModal.tsx` (mới — self-contained draft + save PUT/POST + duplicate + QEV), `Questions.tsx` (bỏ ~200 dòng inline modal/handlers, render component)
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: [x] impl · [x] tsc sạch · [x] Tầng 3 FE (1278 pass) · [~] verify: ReviewQueue.test render OK + HMR no-error; UI tương tác cần login → user kiểm · [ ] commit

- **QED-2 Dùng QuestionEditModal trong Review Queue** ✅
  - Status: [x] DONE (2026-06-16) · Files: `ReviewQueue.tsx` (nút "Sửa" mỗi câu pending → modal với `reviewStatus:'PENDING'`; onSaved → toast + invalidate)
  - **Spec impact**: [ ] SPEC_ADMIN §8 (review queue thêm edit) · **Spec strategy**: [ ] (a)
  - Checklist: [x] impl · [x] tsc sạch · [x] Tầng 3 FE (ReviewQueue.test pass) · [ ] spec · [ ] commit

### Out of scope
- Đưa câu ACTIVE về PENDING từ Review Queue — không làm; câu active sửa ở Questions.
