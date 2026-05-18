# 2026-05-18 — Profile Edit modal redesign (Sacred Modernist + avatar preset)

> **Source**: User prompt 2026-05-18 — "Làm lại modal Chỉnh sửa hồ sơ"
> **Scope**: Rewrite [`EditProfileModal.tsx`](../../../apps/web/src/components/profile/EditProfileModal.tsx) (drop URL input, add preset grid + Google-avatar awareness + initial fallback), polish per Sacred Modernist. FE only — backend untouched.

### Tasks

- PRO-S5-1 Avatar resolver utility + preset library
  - New `apps/web/src/utils/avatar.ts` — `resolveAvatar(avatarUrl, name) → { kind, ... }` (3 branches: img, preset, initial).
  - New `apps/web/src/data/avatars.ts` — 12 emoji-based presets (✝️🕊️📖📜⛪✨🌿🌟🛐👑🦁🐟).
  - Vitest unit: `utils/__tests__/avatar.test.ts` cover 3 branches + Google URL + preset prefix.
  - Status: [x] DONE
  - Files: `utils/avatar.ts`, `data/avatars.ts`, `utils/__tests__/avatar.test.ts`
  - Spec impact: SPEC_USER §21.2 update inline.

- PRO-S5-2 Rewrite EditProfileModal.tsx
  - Drop URL input. Add scrim `rgba(6,7,12,0.78)` + blur, X button, 92px gold-ring preview, "Đổi ảnh" toggles inline preset grid, name field with `person` icon + focus ring `#e8a832`, dashed email row with 🔒 chip, footer "Hủy" (flex-1 outline) + "Lưu thay đổi" (flex-1.5 gold gradient).
  - Fallback initial uses `font-verse italic text-secondary`.
  - PATCH `/api/me` payload unchanged: `{ name, avatarUrl }` (preset → `preset:<id>`).
  - Status: [x] DONE
  - Files: `components/profile/EditProfileModal.tsx`

- PRO-S5-3 HeroCompact + Leaderboard render via resolveAvatar
  - [HeroCompact.tsx:48-50](../../../apps/web/src/components/profile/HeroCompact.tsx#L48-L50) — branch on `resolveAvatar`; initial uses Cormorant italic gold.
  - [Leaderboard.tsx:340,372](../../../apps/web/src/pages/Leaderboard.tsx#L340-L372) — same branch helper so `preset:xxx` doesn't render as broken image.
  - Status: [x] DONE
  - Files: `components/profile/HeroCompact.tsx`, `pages/Leaderboard.tsx`

- PRO-S5-4 i18n + spec sync
  - Remove obsolete keys: `profile.editFieldAvatarUrl`, `profile.editAvatarUrlHint` (vi + en).
  - Add: `profile.editAvatarLabel`, `profile.editAvatarChange`, `profile.editAvatarUseGoogle`, `profile.editAvatarPresetsHeading`, `profile.editEmailReadOnlyChip`, `profile.editClose`.
  - Update SPEC_USER §21.2 — clarify avatar = OAuth picture > preset library > initial fallback.
  - Status: [x] DONE
  - Files: `i18n/vi.json`, `i18n/en.json`, `docs/spec/SPEC_USER_v3.1.md`

- PRO-S5-5 Tests (Vitest + Playwright)
  - Vitest unit: `components/profile/__tests__/EditProfileModal.test.tsx` — render, click preset, submit calls PATCH with `preset:xxx`, close via X.
  - Playwright smoke: extend `tests/e2e/smoke/web-user/W-M10-tier.spec.ts` or add new spec `W-M10-profile-edit.spec.ts` — open modal, change name, pick preset, save, modal closes.
  - Status: [x] DONE

### Common

- **Spec impact**: [x] SPEC_USER §21.2 (avatar mechanism clarified)
- **Spec strategy**: [x] (a) update inline
- **Sensitive files touched**: none (modal + 2 view components + i18n + spec). No backend, no auth, no Flyway.
- Commit: `feat(profile): edit modal redesign + avatar preset library` (single commit per user request, awaiting push approval).

### Verification

- Vitest delta vs baseline (`apps/web` full suite):
  - Before: 125 failed | 1167 passed (1292)
  - After: 125 failed | 1184 passed (1309) — +17 net passing, 0 new failures
  - Same 17 fail-test-files pre-existing (RoomOverlays, LiveFeed, ReactionBar, ErrorContext, dateFormat, ReviewQueue, …) — unrelated to this task.
- TypeScript: `npx tsc --noEmit` reports the same pre-existing errors; no new errors in `utils/avatar.ts`, `data/avatars.ts`, `EditProfileModal.tsx`, `HeroCompact.tsx`, or `Leaderboard.tsx`.
- Playwright: spec added (`W-M10-L1-009` + `W-M10-L1-010` in `tests/e2e/smoke/web-user/W-M10-tier.spec.ts`). Not executed locally — runner requires Node ≥ 18.19; local Node is 18.12. Run via CI or with newer Node.
- i18n validator: 9 missing keys are all pre-existing in unrelated files (NotificationPanel/CreateRoom/GroupAnalytics/GroupDetail/Multiplayer/RoomQuiz); my new keys are present in both `vi.json` + `en.json`.
