# 2026-05-18 — Profile Sprint 4: Edit Profile modal (wire dead button)

> **Source**: User report 2026-05-18 — "sao không chỉnh sửa hồ sơ được". Sprint 1 disabled the Edit button assuming BE wasn't ready, but `PATCH /api/me` already exists at `UserController.java:159` (supports `name` + `avatarUrl`).
> **Scope**: New inline edit modal + remove disabled state from HeroCompact button.

### Task

- PRO-S4-1 EditProfileModal + wire button
  - New `apps/web/src/components/profile/EditProfileModal.tsx` (~90 LOC)
    - Form fields: name (required, max 50), avatarUrl (optional)
    - Email shown read-only per SPEC §21.2
    - Submit → `PATCH /api/me` with `{ name, avatarUrl }`
    - useMutation → on success, invalidate `['profile']` query + close modal
    - Validation inline: name not empty, max 50 chars
  - Update `HeroCompact.tsx`:
    - Remove `disabled`/`aria-disabled`/`opacity-50 cursor-not-allowed`/`title`
    - `useState(editing)` + onClick toggle
    - Render `<EditProfileModal open={editing} onClose={...} profile={profile} />`
  - i18n keys (vi + en):
    - `profile.editModalTitle`, `profile.editFieldName`, `profile.editFieldAvatarUrl`,
      `profile.editAvatarUrlHint`, `profile.editEmailReadOnly`,
      `profile.editSubmit`, `profile.editSaving`,
      `profile.editErrorEmpty`, `profile.editErrorTooLong`, `profile.editErrorGeneric`
  - Remove obsolete `profile.editProfileComingSoon` key (no longer used)
  - Status: [x] DONE
  - Files: new `EditProfileModal.tsx` + `HeroCompact.tsx` + `i18n/vi.json` + `i18n/en.json`
  - Test: Tầng 3 + Profile test 10/10 still green
  - Commit: `feat: Profile Edit modal (wire PATCH /api/me) [no-spec-impact]`

### Note

- Sprint 1 incorrectly disabled this button. Audit memo: when deferring a feature, always grep BE for the underlying endpoint first.

### Common

- **Spec impact**: [x] None — SPEC §21.2 already lists "Account (name, avatar, email read-only)" as required.
- **Spec strategy**: [x] (c) [no-spec-impact] (catch-up to existing canonical feature, no spec edit).
