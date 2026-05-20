# 2026-05-20 — Group Detail mobile redesign (compact header + 3-dot menu + drop Phân tích)

> **Source**: User mockup 2026-05-20 — "sửa lại như thế này bỏ tab phân tích"
> **Scope**: Group Detail page (`/groups/:id`) compact mobile redesign. Replaces inline action buttons with a "..." menu, drops the Phân tích tab entirely, renames "Bộ câu hỏi" → "Câu hỏi", redesigns the Thông báo empty state.
> **Status**: TODO

### Tasks

- GD-1 Top app bar — back link + "..." menu trigger
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/GroupDetail.tsx` · Test: smoke render mobile
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- GD-2 Header layout — smaller avatar, inline title + Thành viên badge, subtitle "X thành viên · 👑 Trưởng nhóm: Y", "Tham gia từ M/YYYY" small line
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/GroupDetail.tsx` · Test: smoke
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- GD-3 Invite code — rename "MÃ" → "MÃ MỜI", add share button (3rd icon)
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/GroupDetail.tsx`, i18n keys · Test: smoke
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- GD-4 Header actions → 3-dot menu (Rời nhóm + Báo cáo)
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/GroupDetail.tsx` · Test: smoke + manual menu open/close
  - Inline buttons removed, behavior preserved via dropdown menu (click-outside close, ESC close).
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- GD-5 Remove Phân tích tab + route handling
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/GroupDetail.tsx` · Test: existing tests still pass
  - User confirmed: drop entirely (not move to menu). `GroupAnalyticsTab` component kept un-mounted as dead code for now (no-spec-impact); to be evaluated for full removal in a future cleanup.
  - **Spec impact**: `[ ]` SPEC_GROUP §X (verify Phân tích isn't a locked Q-A...Q-O decision)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]` (assume non-locked; if spec mandates, switch to (b) BL-N entry)

- GD-6 Rename tab label "Bộ câu hỏi" → "Câu hỏi"
  - Status: `[ ]` TODO · Files: `apps/web/src/i18n/{vi,en}.json` (key: `groups.quizSetsTab`) · Test: existing tests still pass
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- GD-7 Thông báo empty state redesign
  - Status: `[ ]` TODO · Files: existing announcements tab section in `GroupDetail.tsx` · Test: smoke
  - Megaphone icon (campaign) + heading + description + bottom helper note.
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- GD-8 Tests + verification
  - Status: `[ ]` TODO · Files: — · Test: `npx vitest run`, `npx tsc --noEmit`, `npm run validate:i18n`
  - Confirm Tầng 3 pass, no new hardcoded VN, baseline preserved.
