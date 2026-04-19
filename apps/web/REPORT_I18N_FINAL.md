# i18n Migration — Final Report

**Date:** 2026-04-19 (session spanning 04-18 → 04-19)
**Tool:** `npm run validate:i18n` + `tests/e2e/smoke/web-user/W-M13-i18n-all-pages.spec.ts`

## Headline

| Metric | Baseline (Phase 0) | Final (Phase 4) | Δ |
|--------|-------------------|-----------------|---|
| Hardcoded Vietnamese lines | 578 | **116** | **−462** (−80%) |
| Missing i18n keys | 32 | **0** | **−32** |
| Files with leaks | 30 | ~8 | −22 |
| Unit tests passing | 733 | **821** | +88 |

## What landed

### Phase 0 — Test infrastructure (5 commits)
Key parity tests, `renderWithI18n` + `useKey` helpers, `validate-i18n.mjs`
script with `npm run validate:i18n`, W-M13 e2e ratchet (9 routes),
baseline report.

### Phase 1 — User-facing components (4 commits)
Header (nav/notifications/time/menu), four celebration modals
(DailyBonus/TierUp/Comeback/StarPopup), BookProgress + MilestoneBanner
+ `utils/tierLabels.ts`, ShareCard + ErrorToast + locale-aware
date formatting.

### Phase 2 — Room pages (1 commit)
RoomQuiz fully converted to `room.quiz.*`. JoinRoom/Rooms are
deprecated redirect stubs. Also restored proper Vietnamese diacritics
on strings that had been stripped ("Phong", "Cau", "bi loai" → proper
"Phòng", "Câu", "bị loại").

### Phase 3 — Admin pages (13 commits + docs)
Configuration, Users, Rankings, Feedback, Events, Notifications,
Groups, Questions (biggest page, ~90 keys), ExportCenter,
ReviewQueue, QuestionQuality, AIQuestionGenerator + DraftCard + types,
Dashboard + 7 subcomponents. One commit per admin page per the
original plan — admin.* namespace sharded by screen.

### Phase 4 — Fine-grain sweep (5 commits + docs)
Missing keys cleared: Register (12), GroupDetail (11), Profile (3),
DailyMissionsCard (2), Home (1), Quiz (2), GroupAnalytics (1). User
pages swept: Practice, Onboarding + OnboardingTryQuiz, MysteryMode,
SpeedRound, Cosmetics, Achievements, RoomLobby, ErrorBoundary
(class component via i18n.t.bind), WeaknessWidget, SearchableSelect,
AdminLayout, WeeklyQuiz, plus residual AIQuestionGenerator fallbacks.
`utils/tierLabels.ts` helper and trimmed the duplicate `name` field
from `data/tiers.ts`.

## Accepted debt (remaining 116 lines)

These are intentionally not migrated:

| File | Lines | Reason |
|------|-------|--------|
| `data/verses.ts` | 30 | Bible verse text content — needs separate localization workflow, not UI copy |
| `pages/PrivacyPolicy.tsx` | 29 | Legal text, bilingual via `isVi` ternary — works today |
| `pages/TermsOfService.tsx` | 28 | Same as above |
| `pages/LandingPage.tsx` | 10 | Marketing copy — would need editorial pass for English |
| `pages/admin/AIQuestionGenerator.tsx` DEFAULT_PROMPT | 8 | Literal prompt sent to the AI model — not admin-visible UI |
| `pages/Practice.tsx` MOCK_SESSIONS | 3 | Placeholder records shown until real API lands |
| `pages/OnboardingTryQuiz.tsx` demo questions | 3 | Sample content, editorial localization |
| `pages/Home.tsx` activity feed names | 3 | Mock sample data |
| misc 1-liners | 2 | Dev-only banners, enum literal fallbacks |

## Validator state

```
$ cd apps/web && npm run validate:i18n
Summary: {"filesScanned":111,"hardcodedCount":116,"missingKeyCount":0}
```

**Exit code 1** — validator still fails because accepted debt contributes
to the count. If we want `npm run validate:i18n` to return 0 for CI, the
ratchet can either:
  1. Accept the 116 current state as the new baseline (change exit logic
     to fail only when count > 116),
  2. Add file-level allowlist for the debt categories,
  3. Or localize the remaining accepted debt (next sprint).

Recommended: option 2 — mark `data/verses.ts`, `PrivacyPolicy.tsx`,
`TermsOfService.tsx`, `LandingPage.tsx` in an `.i18nignore`-style list.

## Test coverage

- **Unit tests (Vitest)**: 821 pass, 0 fail. Zero regressions across 36
  commits.
- **E2E ratchet**: `W-M13-L1-ALL-*` tests still fail (as designed) because
  legal pages and marketing page keep Vietnamese strings in English mode.
  Turn green per-page as the accepted debt gets picked up.
- **Key parity**: vi.json and en.json have identical key sets (enforced
  by `src/i18n/__tests__/i18n.test.ts`).

## CI recommendation

Add to pre-merge CI:
```yaml
- run: cd apps/web && npx vitest run src/i18n/__tests__/i18n.test.ts
- run: cd apps/web && npm run validate:i18n
```

Once the debt list is gated via allowlist, `validate:i18n` exits 0 on a
clean branch and any new Vietnamese leak fails the build.
