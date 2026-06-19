# Spec Audit Report

**Generated:** 2026-06-19T01:37:02Z
**Specs scanned:** 8 files in `docs/spec/`

## Summary

| Metric | Count |
|---|---|
| Total spec sections | 673 |
| Sections with code refs | 190 |
| Total code refs | 426 |
| Unique code files referenced | 199 |
| **Broken refs (HIGH)** | **100** |
| Orphan sections (MEDIUM) | 483 |
| Undocumented business files (MEDIUM) | 233 |

## Stats — file-level coverage

| Concern | Files in scope | Files referenced | Coverage |
|---|---|---|---|
| BE Controller | 40 | 2 | 5% |
| BE Service | 59 | 4 | 7% |
| FE User Page | 124 | 12 | 10% |
| FE Admin Page | 31 | 3 | 10% |

## Broken Refs (HIGH)

> Spec đề cập file:line không tồn tại — code đã đổi, spec chưa update.

| Spec | Section | File | Lines | Spec line | Reason |
|---|---|---|---|---|---|
| BACKLOG.md | BL-15 — Deprecate `useWebSocket.ts` (legacy raw WS hook) | `useWebSocket.ts` | (no line) | 193 | bare_filename_not_found |
| BACKLOG.md | BL-15 — Deprecate `useWebSocket.ts` (legacy raw WS hook) | `apps/web/src/hooks/useWebSocket.ts` | (no line) | 198 | file_not_found |
| BACKLOG.md | BL-15 — Deprecate `useWebSocket.ts` (legacy raw WS hook) | `apps/web/src/hooks/__tests__/useWebSocket.test.ts` | (no line) | 198 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/Multiplayer.tsx` | (no line) | 291 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/Multiplayer.tsx` | (no line) | 292 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/CreateRoom.tsx` | (no line) | 292 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/JoinRoom.tsx` | (no line) | 292 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/RoomLobby.tsx` | (no line) | 292 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/RoomQuiz.tsx` | (no line) | 292 | file_not_found |
| BACKLOG.md | BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented | `RoomQuizPlayer.tsx` | (no line) | 297 | bare_filename_not_found |
| BACKLOG.md | BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented | `pages/RoomQuizHost.tsx` | (no line) | 298 | file_not_found |
| BACKLOG.md | BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented | `pages/RoomQuizPlayer.tsx` | (no line) | 298 | file_not_found |
| BACKLOG.md | BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented | `pages/RoomQuiz.tsx` | (no line) | 298 | file_not_found |
| BACKLOG.md | BL-AUDIT-3 — Migration filename refs in SPEC_USER use bare names | `add_basic_quiz_unlock.sql` | (no line) | 303 | bare_filename_not_found |
| BACKLOG.md | BL-AUDIT-3 — Migration filename refs in SPEC_USER use bare names | `add_xp_surge_to_users.sql` | (no line) | 303 | bare_filename_not_found |
| BACKLOG.md | BL-AUDIT-3 — Migration filename refs in SPEC_USER use bare names | `add_daily_completions.sql` | (no line) | 303 | bare_filename_not_found |
| BACKLOG.md | BL-AUDIT-4 — Variety mode pages referenced but don't exist (`MysteryMode.tsx`, `SpeedRound.tsx`, `WeeklyQuiz.tsx`) | `pages/MysteryMode.tsx` | (no line) | 308 | file_not_found |
| BACKLOG.md | BL-AUDIT-4 — Variety mode pages referenced but don't exist (`MysteryMode.tsx`, `SpeedRound.tsx`, `WeeklyQuiz.tsx`) | `pages/SpeedRound.tsx` | (no line) | 308 | file_not_found |
| BACKLOG.md | BL-AUDIT-4 — Variety mode pages referenced but don't exist (`MysteryMode.tsx`, `SpeedRound.tsx`, `WeeklyQuiz.tsx`) | `pages/WeeklyQuiz.tsx` | (no line) | 308 | file_not_found |
| BACKLOG.md | BL-AUDIT-5 — `Groups.tsx` ambiguous (admin vs user page) | `Groups.tsx` | (no line) | 312 | bare_filename_ambiguous_(2_matches) |
| BACKLOG.md | BL-AUDIT-5 — `Groups.tsx` ambiguous (admin vs user page) | `Groups.tsx` | (no line) | 313 | bare_filename_ambiguous_(2_matches) |
| BACKLOG.md | BL-AD-8 — Quiz Set Editor unified page | `QuizSetCreate.tsx` | (no line) | 401 | bare_filename_not_found |
| BACKLOG.md | BL-AD-8 — Quiz Set Editor unified page | `api/quizSets.ts` | (no line) | 407 | file_not_found |
| BACKLOG.md | BL-AD-8 — Quiz Set Editor unified page | `CreateQuizSetModal.tsx` | (no line) | 410 | bare_filename_not_found |
| BACKLOG.md | BL-AD-8 — Quiz Set Editor unified page | `QuizSetCreate.tsx` | (no line) | 410 | bare_filename_not_found |
| BACKLOG.md | BL-MP-QM — Quick Match (Đấu Nhanh) — 🚧 ACTIVE SPRINT (2026-05-15) | `SoloArenaEntryCard.tsx` | (no line) | 452 | bare_filename_not_found |
| BACKLOG.md | BL-MP-QM — Quick Match (Đấu Nhanh) — 🚧 ACTIVE SPRINT (2026-05-15) | `SoloArenaPlaceholder.tsx` | (no line) | 454 | bare_filename_not_found |
| BACKLOG.md | BL-MP-QM — Quick Match (Đấu Nhanh) — 🚧 ACTIVE SPRINT (2026-05-15) | `api/rooms.ts` | (no line) | 459 | file_not_found |
| BACKLOG.md | BL-MOBILE-COMPONENT-TEST-INFRA — RN component-test infrastructure | `RankedScreen.test.tsx` | (no line) | 524 | bare_filename_not_found |
| SPEC_ADMIN_v3.1.md | 2. Admin Panel Routes | `Groups.tsx` | (no line) | 76 | bare_filename_ambiguous_(2_matches) |
| SPEC_ADMIN_v3.1.md | 2. Admin Panel Routes | `Configuration.tsx` | (no line) | 78 | bare_filename_not_found |
| SPEC_ADMIN_v3.1.md | 2. Admin Panel Routes | `ExportCenter.tsx` | (no line) | 79 | bare_filename_not_found |
| SPEC_ADMIN_v3.1.md | 13.2 Status — UI shell only | `apps/web/src/pages/admin/Configuration.tsx` | (no line) | 474 | file_not_found |
| SPEC_ADMIN_v3.1.md | 14.2 Schema (`audit_events` V4) | `infrastructure/audit/AuditEvent.java` | (no line) | 517 | file_not_found |
| SPEC_ADMIN_v3.1.md | 16.1 Status — UI stub | `apps/web/src/pages/admin/ExportCenter.tsx` | (no line) | 572 | file_not_found |
| SPEC_GROUP_v1.3.md | 6.B Quiz Set Editor Page (BL-AD-8, 2026-05-13) | `apps/web/src/components/group/CreateQuizSetModal.tsx` | (no line) | 698 | file_not_found |
| SPEC_GROUP_v1.3.md | 6.B Quiz Set Editor Page (BL-AD-8, 2026-05-13) | `QuizSetCreate.tsx` | (no line) | 699 | bare_filename_not_found |
| SPEC_MULTIPLAYER.md | 5.1 Connection | `useWebSocket.ts` | (no line) | 500 | bare_filename_not_found |
| SPEC_MULTIPLAYER.md | 7.2 CreateRoom (`pages/CreateRoom.tsx`) | `pages/CreateRoom.tsx` | (no line) | 644 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.3 JoinRoom (`pages/JoinRoom.tsx`) | `pages/JoinRoom.tsx` | (no line) | 666 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.4 RoomLobby (`pages/RoomLobby.tsx`) — mode-aware + role-aware | `pages/RoomLobby.tsx` | (no line) | 674 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.5 RoomQuiz — split routes (Sprint 4) | `pages/RoomQuiz.tsx` | (no line) | 723 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.5 RoomQuiz — split routes (Sprint 4) | `pages/RoomQuizHost.tsx` | (no line) | 743 | file_not_found |
| SPEC_MULTIPLAYER.md | 10. Known Issues | `useWebSocket.ts` | (no line) | 865 | bare_filename_not_found |
| SPEC_MULTIPLAYER.md | Appendix B — Resolved questions (2026-05-09) | `useWebSocket.ts` | (no line) | 1122 | bare_filename_not_found |
| SPEC_ROADMAP.md | 2.9 Sentry monitoring (PARTIALLY SHIPPED — mobile only) | `App.tsx` | (no line) | 91 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 3.5 Basic Quiz gate (catechism → unlock Ranked) | `add_basic_quiz_unlock.sql` | (no line) | 157 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 4.7 Milestone Burst (XP surge) | `add_xp_surge_to_users.sql` | (no line) | 238 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 5.3 Daily Challenge | `add_daily_completions.sql` | (no line) | 297 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 5.4 Variety Modes | `pages/MysteryMode.tsx` | (no line) | 320 | file_not_found |
| SPEC_USER_v3.1.md | 5.4 Variety Modes | `pages/SpeedRound.tsx` | (no line) | 330 | file_not_found |
| SPEC_USER_v3.1.md | 5.4 Variety Modes | `pages/WeeklyQuiz.tsx` | (no line) | 339 | file_not_found |
| SPEC_USER_v3.1.md | 5.6 Liturgical Seasons (4 mùa canonical) | `DailyThemeService.java` | (no line) | 358 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 6.3 UI | `pages/Journey.tsx` | (no line) | 393 | file_not_found |
| SPEC_USER_v3.1.md | 6.3 UI | `components/BibleJourneyCard.tsx` | (no line) | 393 | file_not_found |
| SPEC_USER_v3.1.md | 8.1 Sound effects | `apps/web/src/lib/soundManager.ts` | (no line) | 464 | file_not_found |
| SPEC_USER_v3.1.md | 9. Lifeline System | `add_lifeline_system.sql` | (no line) | 514 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 10. Cosmetics — Frames + Themes | `add_user_cosmetics_table.sql` | (no line) | 561 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 10. Cosmetics — Frames + Themes | `pages/Cosmetics.tsx` | (no line) | 561 | file_not_found |
| SPEC_USER_v3.1.md | 11. Prestige System | `add_prestige_fields_to_users.sql` | (no line) | 590 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 12. Comeback Bridge | `add_comeback_fields_to_users.sql` | (no line) | 619 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 13. Daily Mission | `add_daily_mission_table.sql` | (no line) | 648 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 13. Daily Mission | `DailyMissionsWidget.tsx` | (no line) | 648 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 17.1 Activity Feed | `components/ActivityFeed.tsx` | (no line) | 769 | file_not_found |
| SPEC_USER_v3.1.md | 17.2 Daily Verse banner | `components/DailyVerseBanner.tsx` | (no line) | 777 | file_not_found |
| SPEC_USER_v3.1.md | 17.2 Daily Verse banner | `DailyThemeService.java` | (no line) | 777 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 18. Tutorial Overlay | `components/TutorialOverlay.tsx` | (no line) | 787 | file_not_found |
| SPEC_USER_v3.1.md | 19. Question Sets (user-created) | `question_sets.sql` | (no line) | 812 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 20. Achievements | `pages/Achievements.tsx` | (no line) | 845 | file_not_found |
| SPEC_USER_v3.1.md | 21. Profile & Stats | `pages/Profile.tsx` | (no line) | 868 | file_not_found |
| SPEC_USER_v3.1.md | 22. Leaderboard | `pages/Leaderboard.tsx` | (no line) | 905 | file_not_found |
| SPEC_USER_v3.1.md | 25.4 Bible book names | `apps/web/src/data/bookNames.ts` | (no line) | 1065 | file_not_found |
| SPEC_USER_v3.1.md | 25.5 Validator | `apps/web/scripts/validate-i18n.ts` | (no line) | 1072 | file_not_found |
| SPEC_USER_v3.2.md | 3.5 Basic Quiz gate (catechism → unlock Ranked) | `add_basic_quiz_unlock.sql` | (no line) | 157 | bare_filename_not_found |
| SPEC_USER_v3.2.md | 4.7 Milestone Burst (XP surge) | `add_xp_surge_to_users.sql` | (no line) | 238 | bare_filename_not_found |
| SPEC_USER_v3.2.md | 5.3 Daily Challenge | `add_daily_completions.sql` | (no line) | 297 | bare_filename_not_found |
| SPEC_USER_v3.2.md | 5.4 Variety Modes | `pages/MysteryMode.tsx` | (no line) | 331 | file_not_found |
| SPEC_USER_v3.2.md | 5.4 Variety Modes | `pages/SpeedRound.tsx` | (no line) | 341 | file_not_found |
| SPEC_USER_v3.2.md | 5.4 Variety Modes | `pages/WeeklyQuiz.tsx` | (no line) | 350 | file_not_found |
| SPEC_USER_v3.2.md | 5.6 Liturgical Seasons (4 mùa canonical) | `DailyThemeService.java` | (no line) | 369 | bare_filename_not_found |
| SPEC_USER_v3.2.md | 6.3 UI | `pages/Journey.tsx` | (no line) | 404 | file_not_found |
| SPEC_USER_v3.2.md | 6.3 UI | `components/BibleJourneyCard.tsx` | (no line) | 404 | file_not_found |
| SPEC_USER_v3.2.md | 8.1 Sound effects | `apps/web/src/lib/soundManager.ts` | (no line) | 1575 | file_not_found |
| SPEC_USER_v3.2.md | 9. Lifeline System | `add_lifeline_system.sql` | (no line) | 1625 | bare_filename_not_found |
| SPEC_USER_v3.2.md | 10. Cosmetics — Frames + Themes | `add_user_cosmetics_table.sql` | (no line) | 1672 | bare_filename_not_found |
| SPEC_USER_v3.2.md | 10. Cosmetics — Frames + Themes | `pages/Cosmetics.tsx` | (no line) | 1672 | file_not_found |
| SPEC_USER_v3.2.md | 11. Prestige System | `add_prestige_fields_to_users.sql` | (no line) | 1701 | bare_filename_not_found |
| SPEC_USER_v3.2.md | 12. Comeback Bridge | `add_comeback_fields_to_users.sql` | (no line) | 1730 | bare_filename_not_found |
| SPEC_USER_v3.2.md | 13. Daily Mission | `add_daily_mission_table.sql` | (no line) | 1759 | bare_filename_not_found |
| SPEC_USER_v3.2.md | 13. Daily Mission | `DailyMissionsWidget.tsx` | (no line) | 1759 | bare_filename_not_found |
| SPEC_USER_v3.2.md | 17.1 Activity Feed | `components/ActivityFeed.tsx` | (no line) | 1880 | file_not_found |
| SPEC_USER_v3.2.md | 17.2 Daily Verse banner | `components/DailyVerseBanner.tsx` | (no line) | 1888 | file_not_found |
| SPEC_USER_v3.2.md | 17.2 Daily Verse banner | `DailyThemeService.java` | (no line) | 1888 | bare_filename_not_found |
| SPEC_USER_v3.2.md | 18. Tutorial Overlay | `components/TutorialOverlay.tsx` | (no line) | 1898 | file_not_found |
| SPEC_USER_v3.2.md | 19. Question Sets (user-created) | `question_sets.sql` | (no line) | 1923 | bare_filename_not_found |
| SPEC_USER_v3.2.md | 20. Achievements | `pages/Achievements.tsx` | (no line) | 1956 | file_not_found |
| SPEC_USER_v3.2.md | 21. Profile & Stats | `pages/Profile.tsx` | (no line) | 1979 | file_not_found |
| SPEC_USER_v3.2.md | 22. Leaderboard | `pages/Leaderboard.tsx` | (no line) | 2016 | file_not_found |
| SPEC_USER_v3.2.md | 25.4 Bible book names | `apps/web/src/data/bookNames.ts` | (no line) | 2173 | file_not_found |
| SPEC_USER_v3.2.md | 25.5 Validator | `apps/web/scripts/validate-i18n.ts` | (no line) | 2180 | file_not_found |

## Orphan Sections (MEDIUM)

> Spec sections không có file:line ref — possible vaporware hoặc cần thêm refs.

_(Showing first 30 — full list via `node parse-spec-refs.js --orphans`.)_

| Spec | Section | Spec line |
|---|---|---|
| BACKLOG.md | Critical (chặn user-visible feature parity với spec) | 10 |
| BACKLOG.md | BL-1 — Bible version: BTT 1926 → BTTHĐ 2011 | 12 |
| BACKLOG.md | BL-2 — Q-A scoring: filter group leaderboard by source | 23 |
| BACKLOG.md | BL-3 — Wire XP Surge bonus (Milestone Burst) — Consume | 34 |
| BACKLOG.md | BL-3-trigger — XP Surge auto-trigger (Milestone Burst) | 44 |
| BACKLOG.md | High (cleanup — small but visible) | 90 |
| BACKLOG.md | BL-7 — Sentry: remove placeholder mentions | 105 |
| BACKLOG.md | Medium (tech debt) | 118 |
| BACKLOG.md | BL-8 — i18n hardcoded VN strings (baseline 116 lines) | 120 |
| BACKLOG.md | BL-9 — Verify TanStack Query coverage in admin pages | 132 |
| BACKLOG.md | Lower priority | 148 |
| BACKLOG.md | BL-11 — Mobile feature parity gaps vs web | 150 |
| BACKLOG.md | BL-12 — Group Leaderboard endpoint test for Q-A fix | 163 |
| BACKLOG.md | Added 2026-05-09 (Phase 2 spec refinement) | 169 |
| BACKLOG.md | BL-AD-2 — Configuration: build `app_config` table + admin CRUD | 208 |
| BACKLOG.md | BL-AD-3 — Notification broadcast: lightweight campaign system | 213 |
| BACKLOG.md | BL-AD-4 — Audit log: standardize via `AuditEventService.record(...)` | 218 |
| BACKLOG.md | BL-AD-5 — Question soft delete (30-day retention) | 223 |
| BACKLOG.md | BL-16 — Group leaderboard endpoint `410 Gone` (Q-A sunset) | 233 |
| BACKLOG.md | Done (recent — keep until next sprint review) | 269 |
| BACKLOG.md | Added 2026-05-09 (First spec-audit run — `tools/spec-audit/`) | 282 |
| BACKLOG.md | BL-AUDIT-6 — Coverage critically low across all concerns | 317 |
| BACKLOG.md | BL-AUDIT-7 — 304 orphan spec sections (no code refs) | 322 |
| BACKLOG.md | Sprint 5 (Quiz Set Professional) — Deferred items | 329 |
| BACKLOG.md | BL-S5-1 — Mastery hook into QuizSession.completeSession | 331 |
| BACKLOG.md | BL-S5-2 — i18n keys cho 3 FE pages Sprint 5 | 342 |
| BACKLOG.md | BL-S5-3 — Auto-derive Difficulty cho quiz set | 350 |
| BACKLOG.md | BL-S5-4 — Folder UI trong QuizSetList + QuizSetCreate | 355 |
| BACKLOG.md | BL-S5-5 — Pixel-perfect mockup match | 360 |
| BACKLOG.md | BL-AD-7 — DeepSeek V3.2 Bedrock integration | 365 |

## Undocumented Files (MEDIUM)

> Files thuộc business logic core không được reference trong spec nào.

_(Showing first 30 — full list via `node parse-spec-refs.js --undocumented`.)_

| Label | File |
|---|---|
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/AchievementController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/AdminAuditController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/AdminDashboardController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/AdminGroupController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/AdminMetricsController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/AdminQuestionController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/AdminSeasonController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/AdminSeasonPairingController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/AdminUserController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/AuthController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/BasicQuizController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/BookController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/ChallengeController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/CoverageController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/DailyChallengeController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/FeedbackController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/HealthController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/LeaderboardController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/MobileAuthController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/NotificationController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/PublicController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/PublicLeaderboardController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/QuestionController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/QuestionSetController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/RankedController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/RoomController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/ScheduledQuizController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/SeasonController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/SessionController.java` |

---

_Run `bash tools/spec-audit/audit.sh` to regenerate. See `tools/spec-audit/README.md`._
