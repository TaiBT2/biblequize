# 2026-05-18 — Avatar preset rework: people + Bible characters

> **Source**: User prompt 2026-05-18 — "mấy ảnh này ko hợp làm avatar" (modal Chỉnh sửa hồ sơ)
> **Scope**: Replace the 12 abstract religious icons in [`apps/web/src/data/avatars.ts`](../../../apps/web/src/data/avatars.ts) with 12 people + Bible character archetypes. Sync i18n (vi + en) and unit tests. FE only.

### Tasks

- AVT-1 Swap preset library to 12 Bible-character archetypes
  - New IDs/emoji: `disciple` 🧔, `king` 🤴, `queen` 👸, `prophet` 🧙, `elder` 👴, `matriarch` 👵, `angel` 👼, `scholar` 🧑‍🎓, `teacher` 🧑‍🏫, `sower` 🧑‍🌾, `judge` 🧑‍⚖️, `saint` 🙏.
  - Preserve `AvatarPreset` shape and `preset:<id>` storage convention — `getPreset()` already falls back to initial for unknown IDs, so any orphan `preset:lion` etc. from the brand-new PRO-S5 commit gracefully degrades.
  - Status: [x] DONE
  - Files: `apps/web/src/data/avatars.ts`
  - **Spec impact**: SPEC_USER §21.2 says "12 emoji-based options" + points to `apps/web/src/data/avatars.ts` as source-of-truth (no enumerated list in spec). Count unchanged → no spec edit needed.
  - **Spec strategy**: (c) [no-spec-impact]

- AVT-2 Update i18n labels (vi + en)
  - Replace 12 keys under `profile.avatarPresets.*` in both files. VN: Môn Đồ / Vua / Hoàng Hậu / Tiên Tri / Trưởng Lão / Bà Tổ / Thiên Sứ / Môn Sinh / Thầy Dạy / Người Gieo / Thẩm Phán / Tín Hữu. EN: Disciple / King / Queen / Prophet / Elder / Matriarch / Angel / Scholar / Teacher / Sower / Judge / Believer.
  - Status: [x] DONE
  - Files: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`

- AVT-3 Update unit tests
  - `utils/__tests__/avatar.test.ts` — switched `'preset:lion'` / `'🦁'` assertions to `'preset:disciple'` / `'🧔'`.
  - `components/profile/__tests__/EditProfileModal.test.tsx` — switched `edit-profile-preset-lion` → `-disciple` and `-dove` → `-king`; updated expected emoji and `preset:<id>` payload.
  - Status: [x] DONE
  - Files: `apps/web/src/utils/__tests__/avatar.test.ts`, `apps/web/src/components/profile/__tests__/EditProfileModal.test.tsx`

- AVT-4 Regression
  - `npm run test -- --run` (vitest): **1253 passed** / 56 failed — failures all in admin pages (`Rankings`, `ReviewQueue`) with pre-existing "No QueryClient set" errors, untouched by this task. Pass count 1253 ≥ baseline 1212 ✓.
  - Targeted re-run of `avatar.test.ts` + `EditProfileModal.test.tsx`: 17/17 pass.
  - Status: [x] DONE

### Notes
- PRO-S5 (avatar preset feature) commit `ffb7d77` shipped on 2026-05-18 — feature is < 1 day old, so DB orphans are essentially zero. Acceptable to rename IDs.
- Background hex chosen to stay within Sacred Modernist palette (warm gold / sage / royal indigo accents).
