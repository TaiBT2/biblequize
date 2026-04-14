# E2E Specs — Master Tracking Index

> Cập nhật sau mỗi phase. Legend: ⬜ not started · 🔄 in progress · ✅ done · ⏭️ deferred · ❌ blocked

---

## Web User (Playwright) — prefix `W-`

| Module | Route(s) | L1 Smoke | L2 Happy | L3 Edge | Notes |
|--------|---------|----------|----------|---------|-------|
| W-M01 Auth & Onboarding | `/login`, `/onboarding`, `/onboarding/try`, `/auth/callback` | ⬜ 0/? | — | — | |
| W-M02 Home & Profile | `/`, `/profile` | ⬜ 0/? | — | — | |
| W-M03 Practice Mode | `/practice`, `/quiz`, `/review` | ⬜ 0/? | — | — | |
| W-M04 Ranked Mode | `/ranked` | ⬜ 0/? | — | — | |
| W-M05 Daily Challenge | `/daily` | ⬜ 0/? | — | — | |
| W-M06 Multiplayer (Lobby only) | `/rooms`, `/multiplayer`, `/room/create`, `/room/join`, `/room/:id/lobby` | ⬜ 0/? | — | — | Gameplay ⏭️ WebSocket phase |
| W-M07 Tournaments | `/tournaments`, `/tournaments/:id`, `/tournaments/:id/match/:matchId` | ⬜ 0/? | — | — | |
| W-M08 Bible Journey Map | `/journey` | ⬜ 0/? | — | — | |
| W-M09 Church Groups | `/groups`, `/groups/:id`, `/groups/:id/analytics` | ⬜ 0/? | — | — | |
| W-M10 Tier Progression | `/` (modal), `/cosmetics` | ⬜ 0/? | — | — | |
| W-M11 Variety Modes | `/weekly-quiz`, `/mystery-mode`, `/speed-round` | ⬜ 0/? | — | — | |
| W-M12 Notifications | AppLayout notification bell | ⬜ 0/? | — | — | |
| W-M13 i18n | Cross-cutting | ⬜ 0/? | — | — | |
| W-M14 | — | ⏭️ skip | — | — | Mobile-specific |
| W-M15 Cross-cutting | Error boundary, offline, loading | ⬜ 0/? | — | — | |

---

## Web Admin (Playwright) — prefix `A-`

| Module | Route | L1 Smoke | L2 Happy | L3 Edge | Notes |
|--------|-------|----------|----------|---------|-------|
| A-M01 Dashboard | `/admin` | ⬜ 0/? | — | — | |
| A-M02 Users Management | `/admin/users` | ⬜ 0/? | — | — | |
| A-M03 Questions CRUD | `/admin/questions` | ⬜ 0/? | — | — | |
| A-M04 Duplicate Detection | `/admin/questions` (inline) | ⬜ 0/? | — | — | 3-layer check |
| A-M05 AI Question Generator | `/admin/ai-generator` | ⬜ 0/? | — | — | |
| A-M06 Review Queue | `/admin/review-queue` | ⬜ 0/? | — | — | 2-admin approval flow |
| A-M07 Feedback & Moderation | `/admin/feedback` | ⬜ 0/? | — | — | |
| A-M08 Seasons & Rankings | `/admin/rankings` | ⬜ 0/? | — | — | |
| A-M09 Events & Tournaments | `/admin/events` | ⬜ 0/? | — | — | |
| A-M10 Church Groups Admin | `/admin/groups` | ⬜ 0/? | — | — | |
| A-M11 Notifications Broadcast | `/admin/notifications` | ⬜ 0/? | — | — | |
| A-M12 Configuration | `/admin/config` | ⬜ 0/? | — | — | Feature flags |
| A-M13 Export Center | `/admin/export` | ⬜ 0/? | — | — | |
| A-M14 Question Quality | `/admin/question-quality` | ⬜ 0/? | — | — | |

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
| Phase 0 — Framework Setup | 🔄 in progress | — |
| Phase 1 — L1 Smoke Web User core (M01/02/03/04/10) | ⬜ | — |
| Phase 2 — L1 Smoke Web User rest + Admin | ⬜ | — |
| Phase 3 — Mobile Maestro Smoke | ⬜ | — |
| Phase 4+ — L2 Happy Path + WebSocket | ⬜ | — |

---

## Stats

| Metric | Value |
|--------|-------|
| Total spec files created | 0 |
| Total test cases written | 0 |
| Total [NEEDS TESTID] | 0 |
| Total [NOT IMPLEMENTED] | 0 |
| Total [DEFERRED - WEBSOCKET] | 0 |
