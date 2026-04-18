# i18n Baseline Report

**Generated:** 2026-04-18 (before Phase 1 of i18n Full Coverage Migration)
**Tool:** `npm run validate:i18n` (see `scripts/validate-i18n.mjs`)
**Unit test baseline:** 746 passing (apps/web)

## Summary

| Metric                     | Count |
|----------------------------|-------|
| Source files scanned       |   109 |
| Hardcoded Vietnamese lines |   578 |
| Missing i18n keys (calls)  |    32 |
| Files with at least 1 leak |    30 |

> **Ratchet rule:** every Phase 1–4 task must reduce at least one of these
> numbers and MUST NOT increase any of them. The final target is 0/0.

## Top offenders (hardcoded Vietnamese lines per file)

| Count | File |
|-------|------|
| 58 | `src/pages/admin/AIQuestionGenerator.tsx` |
| 30 | `src/data/verses.ts` |
| 16 | `src/pages/admin/Configuration.tsx` |
| 13 | `src/pages/admin/ai-generator/DraftCard.tsx` |
| 12 | `src/pages/Register.tsx` |
| 12 | `src/components/BookProgress.tsx` |
| 11 | `src/pages/GroupDetail.tsx` |
|  7 | `src/components/ShareCard.tsx` |
|  7 | `src/components/MilestoneBanner.tsx` |
|  6 | `src/pages/admin/dashboard/ActionItems.tsx` |
|  6 | `src/pages/Achievements.tsx` |
|  6 | `src/data/tiers.ts` |
|  6 | `src/components/ErrorBoundary.tsx` |
|  5 | `src/pages/admin/dashboard/KpiCards.tsx` |
|  5 | `src/components/WeaknessWidget.tsx` |
|  4 | `src/pages/admin/Events.tsx` |
|  3 | `src/pages/admin/ai-generator/types.ts` |
|  3 | `src/pages/admin/ExportCenter.tsx` |
|  3 | `src/pages/Profile.tsx` |
|  3 | `src/components/ui/SearchableSelect.tsx` |

(+ 10 more files with 1–2 lines each.)

## Missing i18n keys (32)

All calls whose key is absent from vi.json and en.json (will silently
fall back to the raw key string at runtime — reproduces the
`room.modes.speed_race` bug class):

```
src/components/DailyMissionsCard.tsx:49     home.dailyMissions
src/components/DailyMissionsCard.tsx:104    home.received
src/pages/GroupAnalytics.tsx:58             groupAnalytics.connectionError
src/pages/GroupDetail.tsx:414               groups.totalXP
src/pages/GroupDetail.tsx:602               groups.rankColumn
src/pages/GroupDetail.tsx:603               groups.memberColumn
src/pages/GroupDetail.tsx:604               groups.roleColumn
src/pages/GroupDetail.tsx:605               groups.totalXP
src/pages/GroupDetail.tsx:638               groups.you
src/pages/GroupDetail.tsx:641               groups.levelUpSoon
src/pages/GroupDetail.tsx:684               groups.memberColumn
src/pages/GroupDetail.tsx:685               groups.roleColumn
src/pages/GroupDetail.tsx:686               groups.joinedColumn
src/pages/GroupDetail.tsx:688               groups.actionsColumn
src/pages/Home.tsx:139                      home.dayStreak
src/pages/Profile.tsx:185                   profile.totalSessions
src/pages/Profile.tsx:186                   profile.correctRate
src/pages/Profile.tsx:232                   profile.joinedOn
src/pages/Quiz.tsx:788                      quiz.correctAnswerIs
src/pages/Quiz.tsx:818                      quiz.bookmarkForReview
src/pages/Register.tsx:29                   auth.passwordMismatch
src/pages/Register.tsx:33                   auth.passwordTooShort
src/pages/Register.tsx:49                   auth.errorRegister
src/pages/Register.tsx:68                   auth.joinUs
src/pages/Register.tsx:69                   auth.journeyBegins
src/pages/Register.tsx:72                   auth.registerHero
src/pages/Register.tsx:98                   auth.createAccount
src/pages/Register.tsx:101                  auth.alreadyHaveAccount
src/pages/Register.tsx:118                  auth.name
src/pages/Register.tsx:131                  auth.namePlaceholder
src/pages/Register.tsx:179                  auth.confirmPassword
src/pages/Register.tsx:207                  auth.registering
```

## E2E ratchet (W-M13 all-pages)

`tests/e2e/smoke/web-user/W-M13-i18n-all-pages.spec.ts` visits 9 user
routes in English and asserts no Vietnamese diacritics leak through. All
9 tests fail today; they turn green page-by-page as migration advances.

## How to reproduce

```bash
cd apps/web
npm run validate:i18n                                  # script-level
npx playwright test tests/e2e/smoke/web-user/W-M13-i18n-all-pages.spec.ts
```
