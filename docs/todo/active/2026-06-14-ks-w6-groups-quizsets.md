# 2026-06-14 — KS W6: Groups & Quiz Sets & Scheduled

> **Source**: [Khung Sáng master plan](2026-06-14-khung-sang-migration-plan.md) · **Scope**: nhóm giáo xứ + quiz set (group + personal) + lịch quiz. Cần W0. Spec: SPEC_GROUP (Q-A..Q-O locked).
> **Prefix**: `KS-W6`. Nhiều editor phức tạp — ưu tiên chrome/shell trước, form sau.

### Tasks
- KS-W6-1 `/groups` Groups — Files: `pages/Groups.tsx`
- KS-W6-2 `/groups/:id` GroupDetail — Files: `pages/GroupDetail.tsx` (có task mobile redesign TODO — phối hợp) · C6 roles màu
- KS-W6-3 `/groups/:id/analytics` GroupAnalytics — Files: `pages/GroupAnalytics.tsx`
- KS-W6-4 QuizSetList — Files: `pages/group/QuizSetList.tsx`
- KS-W6-5 QuizSetDetail — Files: `pages/group/QuizSetDetail.tsx`
- KS-W6-6 QuizSetEditor (group) — Files: `pages/group/QuizSetEditor.tsx` + `quizset-editor/*` (EditorTopBar, sidebars, modals, AI panels)
- KS-W6-7 GroupQuizSetEditor — Files: `pages/group/GroupQuizSetEditor.tsx`
- KS-W6-8 `/my-sets` MySets — Files: `pages/MySets.tsx`
- KS-W6-9 PersonalQuizSetEditor — Files: `pages/PersonalQuizSetEditor.tsx`
- KS-W6-10 ScheduledQuizCreate — Files: `pages/ScheduledQuizCreate.tsx`
- KS-W6-11 ScheduledQuizDetail — Files: `pages/ScheduledQuizDetail.tsx`
- KS-W6-12 ScheduledQuizPlay — Files: `pages/ScheduledQuizPlay.tsx` (gameplay focus, ref W2)
  - Status [ ] TODO · Test: vitest page tests · **Spec impact** [ ] None [ ] SPEC_GROUP §X · **Spec strategy** [ ] (c) (giữ Q-A..Q-O verbatim)
### Checklist: impl · Tầng 1+2+3 · i18n editor (có task riêng) · commit (EN)
