# E2E Specs — Master Tracking Index

> Cập nhật sau mỗi phase. Legend: ⬜ not started · 🔄 in progress · ✅ done · ⏭️ deferred · ❌ blocked

---

## Web User (Playwright) — prefix `W-`

| Module | Route(s) | L1 Smoke | L2 Happy | L3 Edge | Notes |
|--------|---------|----------|----------|---------|-------|
| W-M01 Auth & Onboarding | `/login`, `/onboarding`, `/onboarding/try`, `/auth/callback` | ✅ 9/9 | — | — | Phase 1 done |
| W-M02 Home & Profile | `/`, `/profile` | ✅ 9/9 | — | — | Phase 1 done |
| W-M03 Practice Mode | `/practice`, `/quiz`, `/review` | ✅ 8/8 | — | — | Phase 1 done |
| W-M04 Ranked Mode | `/ranked` | ✅ 7/7 | — | — | Phase 1 done |
| W-M05 Daily Challenge | `/daily` | ✅ 5/5 | — | — | Phase 2 done |
| W-M06 Multiplayer (Lobby only) | `/rooms`, `/multiplayer`, `/room/create`, `/room/join`, `/room/:id/lobby` | ✅ 6/6 | — | — | Phase 2 done · Gameplay ⏭️ WebSocket phase |
| W-M07 Tournaments | `/tournaments`, `/tournaments/:id`, `/tournaments/:id/match/:matchId` | ✅ 6/6 | — | — | Phase 2 done |
| W-M08 Bible Journey Map | `/journey` | ✅ 4/4 | — | — | Phase 2 done |
| W-M09 Church Groups | `/groups`, `/groups/:id`, `/groups/:id/analytics` | ✅ 5/5 | — | — | Phase 2 done |
| W-M10 Tier Progression | `/` (tier display), `/profile`, `/cosmetics` | ✅ 8/8 | — | — | Phase 1 done |
| W-M11 Variety Modes | `/weekly-quiz`, `/mystery-mode`, `/speed-round` | ✅ 6/6 | — | — | Phase 2 done |
| W-M12 Notifications | AppLayout notification bell | ✅ 3/3 | — | — | Phase 2 done · panel ⏭️ NOT IMPL |
| W-M13 i18n | Cross-cutting | ✅ 4/4 | — | — | Phase 2 done |
| W-M14 | — | ⏭️ skip | — | — | Mobile-specific |
| W-M15 Cross-cutting | Error boundary, offline, loading | ✅ 5/5 | — | — | Phase 2 done |

---

## Web Admin (Playwright) — prefix `A-`

| Module | Route | L1 Smoke | L2 Happy | L3 Edge | Notes |
|--------|-------|----------|----------|---------|-------|
| A-M01 Dashboard | `/admin` | ✅ 4/4 | — | — | Phase 2 done |
| A-M02 Users Management | `/admin/users` | ✅ 4/4 | — | — | Phase 2 done |
| A-M03 Questions CRUD | `/admin/questions` | ✅ 4/4 | — | — | Phase 2 done (combined w/ A-M04) |
| A-M04 Duplicate Detection | `/admin/questions` (inline) | ✅ 1/1 | — | — | Phase 2 done · in A-M03-M04 file |
| A-M05 AI Question Generator | `/admin/ai-generator` | ✅ 4/4 | — | — | Phase 2 done |
| A-M06 Review Queue | `/admin/review-queue` | ✅ 4/4 | — | — | Phase 2 done |
| A-M07 Feedback & Moderation | `/admin/feedback` | ✅ 4/4 | — | — | Phase 2 done |
| A-M08 Seasons & Rankings | `/admin/rankings` | ✅ 4/4 | — | — | Phase 2 done |
| A-M09 Events & Tournaments | `/admin/events` | ✅ 4/4 | — | — | Phase 2 done · create ⏭️ NOT IMPL |
| A-M10 Church Groups Admin | `/admin/groups` | ✅ 4/4 | — | — | Phase 2 done |
| A-M11 Notifications Broadcast | `/admin/notifications` | ✅ 2/2 | — | — | Phase 2 done · send ⏭️ NOT IMPL |
| A-M12 Configuration | `/admin/config` | ✅ 2/2 | — | — | Phase 2 done · save ⏭️ NOT IMPL |
| A-M13 Export Center | `/admin/export` | ✅ 2/2 | — | — | Phase 2 done · all exports ⏭️ NOT IMPL |
| A-M14 Question Quality | `/admin/question-quality` | ✅ 2/2 | — | — | Phase 2 done · quality score static |

---

## Mobile App (Maestro) — prefix `APP-` — Phase 3

| Module | Screens | L1 Smoke | Notes |
|--------|---------|----------|-------|
| APP-M01 Auth & Onboarding | SplashScreen, LanguageSelection, WelcomeSlides, TryQuiz | ⬜ — | Phase 3 |
| APP-M02 Home & Profile | HomeScreen, ProfileScreen | ⬜ — | Phase 3 |
| APP-M03 Practice Mode | PracticeSelectScreen, QuizScreen, QuizResultsScreen | ⬜ — | Phase 3 |
| APP-M04 Ranked Mode | RankedScreen | ⬜ — | Phase 3 |
| APP-M05 Daily Challenge | DailyChallengeScreen | ⬜ — | Phase 3 |
| APP-M06 Multiplayer (Lobby) | MultiplayerLobbyScreen, RoomWaitingScreen | ⬜ — | Phase 3 |
| APP-M07 Social / Groups | GroupsListScreen, GroupDetailScreen | ⬜ — | Phase 3 |
| APP-M08 Journey Map | JourneyMapScreen | ⬜ — | Phase 3 |
| APP-M09 Achievements | AchievementsScreen | ⬜ — | Phase 3 |
| APP-M10 Settings | SettingsScreen | ⬜ — | Phase 3 |

> **No admin screens on mobile** — confirmed by codebase scan.

---

## Phase Progress

| Phase | Status | Commit |
|-------|--------|--------|
| Phase 0 — Framework Setup | ✅ done | f9b140e, 8e32255 |
| Phase 1 — L1 Smoke Web User core (M01/02/03/04/10) | ✅ done | 7a3100e |
| Phase 2 — L1 Smoke Web User rest + Admin | ✅ done | (commit pending) |
| Phase 3 — Mobile Maestro Smoke | ⬜ | — |
| Phase 4+ — L2 Happy Path + WebSocket | ⬜ | — |

---

## Stats

| Metric | Value |
|--------|-------|
| Total spec files created | 23 (Phase 1: 5 + Phase 2: 18) |
| Total test cases written | ~130 (Phase 1: 33 + Phase 2: ~97) |
| Total [NEEDS TESTID] | ~190 elements |
| Total [NOT IMPLEMENTED] | ~12 (OAuth, Forgot password, Edit Profile, Notif panel, Config save, Export APIs, Events create, Quality score, Daily complete helper, Group seed) |
| Total [DEFERRED - WEBSOCKET] | 3 (Multiplayer gameplay, ready state sync, player join/leave) |
