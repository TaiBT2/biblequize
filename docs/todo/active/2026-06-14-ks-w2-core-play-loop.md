# 2026-06-14 — KS W2: Core Play Loop

> **Source**: [Khung Sáng master plan](2026-06-14-khung-sang-migration-plan.md) · **Scope**: vòng chơi cốt lõi (quiz + kết quả + ôn). Cần W0 xong trước.
> **Prefix**: `KS-W2`. ⚠️ Quiz full-screen: giữ độ tập trung; **giữ answer colors C5** (A=Coral/B=Sky/C=Gold/D=Sage), jewel chỉ cho khung.

### Tasks (mỗi page = 1 sub-task)
- KS-W2-1 `/quiz` Quiz — Files: `pages/Quiz.tsx` + `components/quiz/*` · gameplay focus, header/HUD Khung Sáng, đáp án giữ C5
- KS-W2-2 `/basic-quiz` BasicQuiz — Files: `pages/BasicQuiz.tsx`, `components/BasicQuizCard.tsx`
- KS-W2-3 `/practice` Practice — Files: `pages/Practice.tsx` (lưu ý IN PROGRESS task 2026-05-06)
- KS-W2-4 QuizResults — Files: `pages/QuizResults.tsx` · hero điểm + spectrum, CTA action
- KS-W2-5 `/review` Review — Files: `pages/Review.tsx`
- KS-W2-6 `components/quiz/*` shared (AnswerButton, timer, explanation panel) — nền paper, lửa/đèn cho feedback "đúng"
  - Mỗi task: Status [ ] TODO · Test: vitest page tests + e2e smoke · **Spec impact** [ ] None [ ] SPEC_USER §quiz · **Spec strategy** [ ] (c) visual
### Checklist: impl · Tầng 1+2+3 · giữ data-testid + answer colors · commit (EN)
