# 2026-05-10 — Quiz Set card: thêm action buttons (Chơi cùng nhau / Đặt lịch)

> **Source**: User request. Card quiz set trong [QuizSetList.tsx#L566](apps/web/src/pages/group/QuizSetList.tsx#L566) hiện chỉ có 1 click → detail. Thêm 2 icon button footer để tăng shortcut.
> **Scope**: 2 button — 👥 Chơi cùng nhau (mở mode picker modal) · 📅 Đặt lịch (Leader/Mod only). Không có "Chơi lại" (đã bỏ).

### Tasks
- QSC-1 Extract `ModePickerModal` từ QuizSetDetail.tsx → `components/group/ModePickerModal.tsx` (refactor)
  - Status: `[ ]` TODO · Files: `QuizSetDetail.tsx`, `components/group/ModePickerModal.tsx` (new) · Test: existing QuizSetDetail tests pass
  - **Spec impact**: `[x]` None (refactor nội bộ)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: extract · re-import in QuizSetDetail · Tầng 1+2 pass · commit

- QSC-2 Thêm 2 icon button vào QuizSetList card (desktop + mobile)
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/group/QuizSetList.tsx` · Test: render test
  - **Spec impact**: `[x]` SPEC_GROUP §Sprint 5 Quiz Set card
  - **Spec strategy**: `[x]` (a) update inline (in QSC-4)
  - Checklist: replace `<Link>` wrap → div+navigate; add footer icons (e.stopPropagation); permission check (myRole) cho Đặt lịch

- QSC-3 Wire actions: mode picker modal mở trong QuizSetList + scheduled navigation
  - Status: `[ ]` TODO · Files: `QuizSetList.tsx` · Test: Vitest
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: state showModePicker · onPick → createLiveRoomFromQuizSet · busy state · Tầng 3 pass · commit

- QSC-4 Update SPEC_GROUP_v1.3.md §Sprint 5 — Quick actions on card
  - Status: `[ ]` TODO · Files: `docs/spec/SPEC_GROUP_v1.3.md`
  - **Spec impact**: `[x]` SPEC_GROUP §Quiz Set Sprint 5
  - **Spec strategy**: `[x]` (a) update inline

---
