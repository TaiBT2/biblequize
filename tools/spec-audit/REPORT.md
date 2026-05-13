# Spec Audit Report

**Generated:** 2026-05-13T08:01:18Z
**Specs scanned:** 6 files in `docs/spec/`

## Summary

| Metric | Count |
|---|---|
| Total spec sections | 457 |
| Sections with code refs | 131 |
| Total code refs | 311 |
| Unique code files referenced | 172 |
| **Broken refs (HIGH)** | **61** |
| Orphan sections (MEDIUM) | 326 |
| Undocumented business files (MEDIUM) | 212 |

## Stats — file-level coverage

| Concern | Files in scope | Files referenced | Coverage |
|---|---|---|---|
| BE Controller | 37 | 2 | 5% |
| BE Service | 53 | 3 | 6% |
| FE User Page | 102 | 6 | 6% |
| FE Admin Page | 36 | 5 | 14% |

## Broken Refs (HIGH)

> Spec đề cập file:line không tồn tại — code đã đổi, spec chưa update.

| Spec | Section | File | Lines | Spec line | Reason |
|---|---|---|---|---|---|
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/Multiplayer.tsx` | (no line) | 294 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/Multiplayer.tsx` | (no line) | 295 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/CreateRoom.tsx` | (no line) | 295 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/JoinRoom.tsx` | (no line) | 295 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/RoomLobby.tsx` | (no line) | 295 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/RoomQuiz.tsx` | (no line) | 295 | file_not_found |
| BACKLOG.md | BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented | `RoomQuizPlayer.tsx` | (no line) | 300 | bare_filename_not_found |
| BACKLOG.md | BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented | `pages/RoomQuizHost.tsx` | (no line) | 301 | file_not_found |
| BACKLOG.md | BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented | `pages/RoomQuizPlayer.tsx` | (no line) | 301 | file_not_found |
| BACKLOG.md | BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented | `pages/RoomQuiz.tsx` | (no line) | 301 | file_not_found |
| BACKLOG.md | BL-AUDIT-3 — Migration filename refs in SPEC_USER use bare names | `add_basic_quiz_unlock.sql` | (no line) | 306 | bare_filename_not_found |
| BACKLOG.md | BL-AUDIT-3 — Migration filename refs in SPEC_USER use bare names | `add_xp_surge_to_users.sql` | (no line) | 306 | bare_filename_not_found |
| BACKLOG.md | BL-AUDIT-3 — Migration filename refs in SPEC_USER use bare names | `add_daily_completions.sql` | (no line) | 306 | bare_filename_not_found |
| BACKLOG.md | BL-AUDIT-4 — Variety mode pages referenced but don't exist (`MysteryMode.tsx`, `SpeedRound.tsx`, `WeeklyQuiz.tsx`) | `pages/MysteryMode.tsx` | (no line) | 311 | file_not_found |
| BACKLOG.md | BL-AUDIT-4 — Variety mode pages referenced but don't exist (`MysteryMode.tsx`, `SpeedRound.tsx`, `WeeklyQuiz.tsx`) | `pages/SpeedRound.tsx` | (no line) | 311 | file_not_found |
| BACKLOG.md | BL-AUDIT-4 — Variety mode pages referenced but don't exist (`MysteryMode.tsx`, `SpeedRound.tsx`, `WeeklyQuiz.tsx`) | `pages/WeeklyQuiz.tsx` | (no line) | 311 | file_not_found |
| BACKLOG.md | BL-AUDIT-5 — `Groups.tsx` ambiguous (admin vs user page) | `Groups.tsx` | (no line) | 315 | bare_filename_ambiguous_(2_matches) |
| BACKLOG.md | BL-AUDIT-5 — `Groups.tsx` ambiguous (admin vs user page) | `Groups.tsx` | (no line) | 316 | bare_filename_ambiguous_(2_matches) |
| BACKLOG.md | BL-AD-8 — Quiz Set Editor unified page | `QuizSetCreate.tsx` | (no line) | 383 | bare_filename_not_found |
| BACKLOG.md | BL-AD-8 — Quiz Set Editor unified page | `api/quizSets.ts` | (no line) | 389 | file_not_found |
| BACKLOG.md | BL-AD-8 — Quiz Set Editor unified page | `CreateQuizSetModal.tsx` | (no line) | 392 | bare_filename_not_found |
| BACKLOG.md | BL-AD-8 — Quiz Set Editor unified page | `QuizSetCreate.tsx` | (no line) | 392 | bare_filename_not_found |
| SPEC_ADMIN_v3.1.md | 2. Admin Panel Routes | `Groups.tsx` | (no line) | 76 | bare_filename_ambiguous_(2_matches) |
| SPEC_ADMIN_v3.1.md | 14.2 Schema (`audit_events` V4) | `infrastructure/audit/AuditEvent.java` | (no line) | 513 | file_not_found |
| SPEC_GROUP_v1.3.md | 6.B Quiz Set Editor Page (BL-AD-8, 2026-05-13) | `apps/web/src/components/group/CreateQuizSetModal.tsx` | (no line) | 698 | file_not_found |
| SPEC_GROUP_v1.3.md | 6.B Quiz Set Editor Page (BL-AD-8, 2026-05-13) | `QuizSetCreate.tsx` | (no line) | 699 | bare_filename_not_found |
| SPEC_MULTIPLAYER.md | 7.1 Multiplayer (`pages/Multiplayer.tsx`) | `pages/Multiplayer.tsx` | (no line) | 627 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.2 CreateRoom (`pages/CreateRoom.tsx`) | `pages/CreateRoom.tsx` | (no line) | 634 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.3 JoinRoom (`pages/JoinRoom.tsx`) | `pages/JoinRoom.tsx` | (no line) | 656 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.4 RoomLobby (`pages/RoomLobby.tsx`) — mode-aware + role-aware | `pages/RoomLobby.tsx` | (no line) | 664 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.5 RoomQuiz — split routes (Sprint 4) | `pages/RoomQuiz.tsx` | (no line) | 713 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.5 RoomQuiz — split routes (Sprint 4) | `pages/RoomQuizHost.tsx` | (no line) | 733 | file_not_found |
| SPEC_USER_v3.1.md | 3.5 Basic Quiz gate (catechism → unlock Ranked) | `add_basic_quiz_unlock.sql` | (no line) | 155 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 4.7 Milestone Burst (XP surge) | `add_xp_surge_to_users.sql` | (no line) | 236 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 5.3 Daily Challenge | `add_daily_completions.sql` | (no line) | 295 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 5.4 Variety Modes | `pages/MysteryMode.tsx` | (no line) | 318 | file_not_found |
| SPEC_USER_v3.1.md | 5.4 Variety Modes | `pages/SpeedRound.tsx` | (no line) | 328 | file_not_found |
| SPEC_USER_v3.1.md | 5.4 Variety Modes | `pages/WeeklyQuiz.tsx` | (no line) | 337 | file_not_found |
| SPEC_USER_v3.1.md | 5.6 Liturgical Seasons (4 mùa canonical) | `DailyThemeService.java` | (no line) | 356 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 6.3 UI | `pages/Journey.tsx` | (no line) | 391 | file_not_found |
| SPEC_USER_v3.1.md | 6.3 UI | `components/BibleJourneyCard.tsx` | (no line) | 391 | file_not_found |
| SPEC_USER_v3.1.md | 8.1 Sound effects | `apps/web/src/lib/soundManager.ts` | (no line) | 462 | file_not_found |
| SPEC_USER_v3.1.md | 9. Lifeline System | `add_lifeline_system.sql` | (no line) | 512 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 10. Cosmetics — Frames + Themes | `add_user_cosmetics_table.sql` | (no line) | 559 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 10. Cosmetics — Frames + Themes | `pages/Cosmetics.tsx` | (no line) | 559 | file_not_found |
| SPEC_USER_v3.1.md | 11. Prestige System | `add_prestige_fields_to_users.sql` | (no line) | 588 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 12. Comeback Bridge | `add_comeback_fields_to_users.sql` | (no line) | 617 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 13. Daily Mission | `add_daily_mission_table.sql` | (no line) | 646 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 13. Daily Mission | `DailyMissionsWidget.tsx` | (no line) | 646 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 17.1 Activity Feed | `components/ActivityFeed.tsx` | (no line) | 767 | file_not_found |
| SPEC_USER_v3.1.md | 17.2 Daily Verse banner | `components/DailyVerseBanner.tsx` | (no line) | 775 | file_not_found |
| SPEC_USER_v3.1.md | 17.2 Daily Verse banner | `DailyThemeService.java` | (no line) | 775 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 18. Tutorial Overlay | `components/TutorialOverlay.tsx` | (no line) | 785 | file_not_found |
| SPEC_USER_v3.1.md | 19. Question Sets (user-created) | `question_sets.sql` | (no line) | 810 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 19. Question Sets (user-created) | `pages/MySets.tsx` | (no line) | 810 | file_not_found |
| SPEC_USER_v3.1.md | 19. Question Sets (user-created) | `pages/SetEditor.tsx` | (no line) | 810 | file_not_found |
| SPEC_USER_v3.1.md | 20. Achievements | `pages/Achievements.tsx` | (no line) | 836 | file_not_found |
| SPEC_USER_v3.1.md | 21. Profile & Stats | `pages/Profile.tsx` | (no line) | 859 | file_not_found |
| SPEC_USER_v3.1.md | 22. Leaderboard | `pages/Leaderboard.tsx` | (no line) | 890 | file_not_found |
| SPEC_USER_v3.1.md | 25.4 Bible book names | `apps/web/src/data/bookNames.ts` | (no line) | 1041 | file_not_found |
| SPEC_USER_v3.1.md | 25.5 Validator | `apps/web/scripts/validate-i18n.ts` | (no line) | 1048 | file_not_found |

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
| BACKLOG.md | BL-4 — i18n wording normalize: "Đấu Hạng" | 58 |
| BACKLOG.md | High (cleanup — small but visible) | 94 |
| BACKLOG.md | BL-7 — Sentry: remove placeholder mentions | 109 |
| BACKLOG.md | Medium (tech debt) | 122 |
| BACKLOG.md | BL-8 — i18n hardcoded VN strings (baseline 116 lines) | 124 |
| BACKLOG.md | BL-9 — Verify TanStack Query coverage in admin pages | 136 |
| BACKLOG.md | Lower priority | 152 |
| BACKLOG.md | BL-11 — Mobile feature parity gaps vs web | 154 |
| BACKLOG.md | BL-12 — Group Leaderboard endpoint test for Q-A fix | 165 |
| BACKLOG.md | Added 2026-05-09 (Phase 2 spec refinement) | 171 |
| BACKLOG.md | BL-AD-2 — Configuration: build `app_config` table + admin CRUD | 211 |
| BACKLOG.md | BL-AD-3 — Notification broadcast: lightweight campaign system | 216 |
| BACKLOG.md | BL-AD-4 — Audit log: standardize via `AuditEventService.record(...)` | 221 |
| BACKLOG.md | BL-AD-5 — Question soft delete (30-day retention) | 226 |
| BACKLOG.md | BL-16 — Group leaderboard endpoint `410 Gone` (Q-A sunset) | 236 |
| BACKLOG.md | Done (recent — keep until next sprint review) | 272 |
| BACKLOG.md | Added 2026-05-09 (First spec-audit run — `tools/spec-audit/`) | 285 |
| BACKLOG.md | BL-AUDIT-6 — Coverage critically low across all concerns | 320 |
| BACKLOG.md | BL-AUDIT-7 — 304 orphan spec sections (no code refs) | 325 |
| BACKLOG.md | Sprint 5 (Quiz Set Professional) — Deferred items | 332 |
| BACKLOG.md | BL-S5-1 — Mastery hook into QuizSession.completeSession | 334 |
| BACKLOG.md | BL-S5-2 — i18n keys cho 3 FE pages Sprint 5 | 345 |
| BACKLOG.md | BL-S5-3 — Auto-derive Difficulty cho quiz set | 353 |
| BACKLOG.md | BL-S5-4 — Folder UI trong QuizSetList + QuizSetCreate | 358 |
| BACKLOG.md | BL-S5-5 — Pixel-perfect mockup match | 363 |

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
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/AdminUserController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/AuthController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/BasicQuizController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/BookController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/ChallengeController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/DailyChallengeController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/FeedbackController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/HealthController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/LeaderboardController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/MobileAuthController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/NotificationController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/PublicController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/QuestionController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/QuestionSetController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/RankedController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/RoomController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/ScheduledQuizController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/SeasonController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/SessionController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/SessionLifelineController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/ShareCardController.java` |
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/TestDataSeedController.java` |

---

_Run `bash tools/spec-audit/audit.sh` to regenerate. See `tools/spec-audit/README.md`._
