# 2026-05-19 — Mobile rewrite S2: beta launch internal track

> **Source**: Master roadmap [`2026-05-18-mobile-rewrite-roadmap.md`](2026-05-18-mobile-rewrite-roadmap.md) Sprint 2
> **Scope**: Ship được Expo Go dev build + EAS internal track invite — config + crash monitoring + branding polish. KHÔNG App Store / Play Store production (defer S7).
> **Why now**: Sau S1, 5 stub đã wired. App đủ chức năng để invite tester. Cần infra trước khi share APK/IPA.

> **Decisions cố định lúc start**:
> - Sentry: un-defer cho mobile (SPEC_ROADMAP §2.9 sẽ noted "mobile shipped, web defer")
> - Analytics SDK: defer S6 (chưa quyết PostHog/Mixpanel/Amplitude — không block beta)
> - Icon redesign: defer (cần designer)
> - DSN/EAS projectId: user fill in `.env` sau, code dùng env-driven no-op fallback

> **Sprint status (2026-05-19)**: ✅ DONE — 5 task + plan + finalize, M1 milestone reached.
> **Commits**: 8e8f613 (plan) · dbae4c0 (S2-1 app.json) · 45f223d (S2-2 eas.json) · c2c4bd0 (S2-3 Sentry) · baaf8f6 (S2-4 .env) · 2dad14b (S2-5 beta docs).
> **Regression**: mobile jest 33/33 PASS · mobile tsc CLEAN · web untouched.
> **Manual next step (user)**: `cd apps/mobile && eas login && eas init` + thêm `EXPO_PUBLIC_SENTRY_DSN` vào `.env` → `eas build --profile preview --platform android` cho APK đầu tiên.

### Tasks

- **S2-1 app.json branding + dark theme polish**
  - `name: "mobile"` → `"BibleQuiz"`; `slug: "mobile"` → `"biblequiz"`
  - `userInterfaceStyle: "light"` → `"dark"` (app dark theme, colors.bgPrimary #11131e)
  - `splash.backgroundColor: "#ffffff"` → `"#11131e"` (match brand dark)
  - `android.adaptiveIcon.backgroundColor: "#ffffff"` → `"#11131e"`
  - iOS: add `bundleIdentifier: "com.biblequiz.app"` (parity với android.package)
  - Status: [x] DONE
  - Files: `apps/mobile/app.json`
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S2-2 eas.json — 3 build profiles**
  - `development`: dev client, `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080` (Android emulator localhost)
  - `preview`: internal distribution APK/IPA, point staging API
  - `production`: store-ready (defer actual submit to S7)
  - `cli.appVersionSource: "remote"` để EAS quản version
  - Status: [x] DONE
  - Files: `apps/mobile/eas.json` (new)
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S2-3 Sentry mobile install + init**
  - `pnpm --filter mobile add @sentry/react-native`
  - Add `@sentry/react-native/expo` plugin to app.json
  - `apps/mobile/src/lib/sentry.ts` — init wrapper, no-op khi DSN missing
  - `App.tsx` — call `initSentry()` trước render, wrap với `Sentry.wrap()`
  - `ErrorBoundary.tsx` — call `Sentry.captureException(error, { contexts: { react: { componentStack } } })` trong componentDidCatch
  - Status: [x] DONE
  - Files: `apps/mobile/src/lib/sentry.ts` (new), `apps/mobile/App.tsx`, `apps/mobile/src/components/feedback/ErrorBoundary.tsx`, `apps/mobile/app.json` (plugin), `apps/mobile/package.json`
  - Spec impact: SPEC_ROADMAP §2.9 — un-defer Sentry cho mobile. Strategy: (a) update SPEC_ROADMAP inline.

- **S2-4 .env.example update + EXPO_PUBLIC_SENTRY_DSN**
  - Add `EXPO_PUBLIC_SENTRY_DSN=` (empty default → Sentry no-op)
  - Add `EXPO_PUBLIC_ENV=` (development|preview|production) — passed to Sentry environment tag
  - Status: [x] DONE
  - Files: `apps/mobile/.env.example`
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S2-5 Beta tester docs**
  - New `docs/dev/mobile-beta.md` — Expo Go setup, EAS internal track invite flow, manual QA checklist (5 stubs từ S1, single-player flow, group features)
  - Status: [x] DONE
  - Files: `docs/dev/mobile-beta.md` (new)
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S2-6 Tầng 3 regression + mark sprint DONE**
  - mobile jest ≥ 33 baseline
  - mobile tsc clean
  - Web không touched (skip vitest)
  - Update roadmap S2 → DONE, S2 file all tasks DONE, TODO.md index, M1 milestone reached
  - Status: [x] DONE

### Common

- **Spec impact**: SPEC_ROADMAP §2.9 Sentry status updated (mobile shipped) trong S2-3 commit.
- **Spec strategy**: (a) inline update SPEC_ROADMAP cho S2-3; còn lại (c) `[no-spec-impact]`.
- **Sensitive files**: `App.tsx` (root) — Tầng 3 BẮT BUỘC; `ErrorBoundary.tsx` (no-fallback chain). Cả 2 chỉ thêm Sentry call, no behavior change ngoài crash reporting.
- **Risk + rollback**:
  - @sentry/react-native plugin có thể break Expo Go (cần dev build). Fallback: comment plugin trong app.json + dùng pure JS init (Sentry RN package có graceful Expo Go fallback theo docs SDK 5+).
  - eas.json sai schema → `eas build` fail. Verify với `npx eas-cli config --json`.
- **Out of scope S2 (defer)**:
  - Push notifications, deep links beyond scheme://, App Store / Play Store submit, analytics SDK, icon/splash redesign, in-app updates (`expo-updates`).

### Verification

- Sau S2: app.json branded BibleQuiz dark, eas.json valid, Sentry installed + init code present (no-op without DSN), ErrorBoundary integrated với Sentry, docs cho beta tester.
- User có thể: `cd apps/mobile && eas login && eas init && eas build --profile preview` để ship APK.
- Master roadmap S2 → ✅ DONE. M1 (beta nội bộ) reached.

### Manual QA punch list (cho beta tester sau khi build)

1. App khởi động, splash hiển thị dark, navigate đúng
2. Onboarding flow → TryQuiz 3 câu → result screen
3. Login Google OAuth → Home tier card render đúng totalPoints
4. Practice flow: chọn book + difficulty → Quiz → Result → Review
5. Daily Challenge: hôm nay status, play, claim XP
6. Ranked: tier display, energy bar, play 1 game
7. Multiplayer: tạo room → invite code → 2nd device join → start → SPEED_RACE flow → results
8. Tournament: list view + bracket render
9. Groups: create, join code, member list, leaderboard
10. Profile: edit name, avatar preset, stats grid
11. Force crash (dev) → Sentry capture event (verify trong Sentry dashboard)
