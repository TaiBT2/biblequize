# Spec Audit Report

**Generated:** 2026-05-10T01:28:26Z
**Specs scanned:** 6 files in `docs/spec/`

## Summary

| Metric | Count |
|---|---|
| Total spec sections | 434 |
| Sections with code refs | 127 |
| Total code refs | 305 |
| Unique code files referenced | 164 |
| **Broken refs (HIGH)** | **55** |
| Orphan sections (MEDIUM) | 307 |
| Undocumented business files (MEDIUM) | 200 |

## Stats — file-level coverage

| Concern | Files in scope | Files referenced | Coverage |
|---|---|---|---|
| BE Controller | 37 | 2 | 5% |
| BE Service | 51 | 3 | 6% |
| FE User Page | 92 | 5 | 5% |
| FE Admin Page | 35 | 5 | 14% |

## Broken Refs (HIGH)

> Spec đề cập file:line không tồn tại — code đã đổi, spec chưa update.

| Spec | Section | File | Lines | Spec line | Reason |
|---|---|---|---|---|---|
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/Multiplayer.tsx` | (no line) | 250 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/Multiplayer.tsx` | (no line) | 251 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/CreateRoom.tsx` | (no line) | 251 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/JoinRoom.tsx` | (no line) | 251 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/RoomLobby.tsx` | (no line) | 251 | file_not_found |
| BACKLOG.md | BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`) | `pages/RoomQuiz.tsx` | (no line) | 251 | file_not_found |
| BACKLOG.md | BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented | `RoomQuizPlayer.tsx` | (no line) | 256 | bare_filename_not_found |
| BACKLOG.md | BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented | `pages/RoomQuizHost.tsx` | (no line) | 257 | file_not_found |
| BACKLOG.md | BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented | `pages/RoomQuizPlayer.tsx` | (no line) | 257 | file_not_found |
| BACKLOG.md | BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented | `pages/RoomQuiz.tsx` | (no line) | 257 | file_not_found |
| BACKLOG.md | BL-AUDIT-3 — Migration filename refs in SPEC_USER use bare names | `add_basic_quiz_unlock.sql` | (no line) | 262 | bare_filename_not_found |
| BACKLOG.md | BL-AUDIT-3 — Migration filename refs in SPEC_USER use bare names | `add_xp_surge_to_users.sql` | (no line) | 262 | bare_filename_not_found |
| BACKLOG.md | BL-AUDIT-3 — Migration filename refs in SPEC_USER use bare names | `add_daily_completions.sql` | (no line) | 262 | bare_filename_not_found |
| BACKLOG.md | BL-AUDIT-4 — Variety mode pages referenced but don't exist (`MysteryMode.tsx`, `SpeedRound.tsx`, `WeeklyQuiz.tsx`) | `pages/MysteryMode.tsx` | (no line) | 267 | file_not_found |
| BACKLOG.md | BL-AUDIT-4 — Variety mode pages referenced but don't exist (`MysteryMode.tsx`, `SpeedRound.tsx`, `WeeklyQuiz.tsx`) | `pages/SpeedRound.tsx` | (no line) | 267 | file_not_found |
| BACKLOG.md | BL-AUDIT-4 — Variety mode pages referenced but don't exist (`MysteryMode.tsx`, `SpeedRound.tsx`, `WeeklyQuiz.tsx`) | `pages/WeeklyQuiz.tsx` | (no line) | 267 | file_not_found |
| BACKLOG.md | BL-AUDIT-5 — `Groups.tsx` ambiguous (admin vs user page) | `Groups.tsx` | (no line) | 271 | bare_filename_ambiguous_(2_matches) |
| BACKLOG.md | BL-AUDIT-5 — `Groups.tsx` ambiguous (admin vs user page) | `Groups.tsx` | (no line) | 272 | bare_filename_ambiguous_(2_matches) |
| SPEC_ADMIN_v3.1.md | 2. Admin Panel Routes | `Groups.tsx` | (no line) | 76 | bare_filename_ambiguous_(2_matches) |
| SPEC_ADMIN_v3.1.md | 14.2 Schema (`audit_events` V4) | `infrastructure/audit/AuditEvent.java` | (no line) | 512 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.1 Multiplayer (`pages/Multiplayer.tsx`) | `pages/Multiplayer.tsx` | (no line) | 627 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.2 CreateRoom (`pages/CreateRoom.tsx`) | `pages/CreateRoom.tsx` | (no line) | 634 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.3 JoinRoom (`pages/JoinRoom.tsx`) | `pages/JoinRoom.tsx` | (no line) | 656 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.4 RoomLobby (`pages/RoomLobby.tsx`) — mode-aware + role-aware | `pages/RoomLobby.tsx` | (no line) | 664 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.5 RoomQuiz — split routes (Sprint 4) | `pages/RoomQuiz.tsx` | (no line) | 713 | file_not_found |
| SPEC_MULTIPLAYER.md | 7.5 RoomQuiz — split routes (Sprint 4) | `pages/RoomQuizHost.tsx` | (no line) | 733 | file_not_found |
| SPEC_USER_v3.1.md | 3.5 Basic Quiz gate (catechism → unlock Ranked) | `add_basic_quiz_unlock.sql` | (no line) | 155 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 4.7 Milestone Burst (XP surge) | `add_xp_surge_to_users.sql` | (no line) | 236 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 5.3 Daily Challenge | `add_daily_completions.sql` | (no line) | 290 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 5.4 Variety Modes | `pages/MysteryMode.tsx` | (no line) | 313 | file_not_found |
| SPEC_USER_v3.1.md | 5.4 Variety Modes | `pages/SpeedRound.tsx` | (no line) | 323 | file_not_found |
| SPEC_USER_v3.1.md | 5.4 Variety Modes | `pages/WeeklyQuiz.tsx` | (no line) | 332 | file_not_found |
| SPEC_USER_v3.1.md | 5.6 Liturgical Seasons (4 mùa canonical) | `DailyThemeService.java` | (no line) | 351 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 6.3 UI | `pages/Journey.tsx` | (no line) | 386 | file_not_found |
| SPEC_USER_v3.1.md | 6.3 UI | `components/BibleJourneyCard.tsx` | (no line) | 386 | file_not_found |
| SPEC_USER_v3.1.md | 8.1 Sound effects | `apps/web/src/lib/soundManager.ts` | (no line) | 457 | file_not_found |
| SPEC_USER_v3.1.md | 9. Lifeline System | `add_lifeline_system.sql` | (no line) | 507 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 10. Cosmetics — Frames + Themes | `add_user_cosmetics_table.sql` | (no line) | 554 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 10. Cosmetics — Frames + Themes | `pages/Cosmetics.tsx` | (no line) | 554 | file_not_found |
| SPEC_USER_v3.1.md | 11. Prestige System | `add_prestige_fields_to_users.sql` | (no line) | 583 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 12. Comeback Bridge | `add_comeback_fields_to_users.sql` | (no line) | 612 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 13. Daily Mission | `add_daily_mission_table.sql` | (no line) | 641 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 13. Daily Mission | `DailyMissionsWidget.tsx` | (no line) | 641 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 17.1 Activity Feed | `components/ActivityFeed.tsx` | (no line) | 762 | file_not_found |
| SPEC_USER_v3.1.md | 17.2 Daily Verse banner | `components/DailyVerseBanner.tsx` | (no line) | 770 | file_not_found |
| SPEC_USER_v3.1.md | 17.2 Daily Verse banner | `DailyThemeService.java` | (no line) | 770 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 18. Tutorial Overlay | `components/TutorialOverlay.tsx` | (no line) | 780 | file_not_found |
| SPEC_USER_v3.1.md | 19. Question Sets (user-created) | `question_sets.sql` | (no line) | 805 | bare_filename_not_found |
| SPEC_USER_v3.1.md | 19. Question Sets (user-created) | `pages/MySets.tsx` | (no line) | 805 | file_not_found |
| SPEC_USER_v3.1.md | 19. Question Sets (user-created) | `pages/SetEditor.tsx` | (no line) | 805 | file_not_found |
| SPEC_USER_v3.1.md | 20. Achievements | `pages/Achievements.tsx` | (no line) | 831 | file_not_found |
| SPEC_USER_v3.1.md | 21. Profile & Stats | `pages/Profile.tsx` | (no line) | 854 | file_not_found |
| SPEC_USER_v3.1.md | 22. Leaderboard | `pages/Leaderboard.tsx` | (no line) | 885 | file_not_found |
| SPEC_USER_v3.1.md | 25.4 Bible book names | `apps/web/src/data/bookNames.ts` | (no line) | 1036 | file_not_found |
| SPEC_USER_v3.1.md | 25.5 Validator | `apps/web/scripts/validate-i18n.ts` | (no line) | 1043 | file_not_found |

## Orphan Sections (MEDIUM)

> Spec sections không có file:line ref — possible vaporware hoặc cần thêm refs.

_(Showing first 30 — full list via `node parse-spec-refs.js --orphans`.)_

| Spec | Section | Spec line |
|---|---|---|
| BACKLOG.md | Critical (chặn user-visible feature parity với spec) | 10 |
| BACKLOG.md | BL-1 — Bible version: BTT 1926 → BTTHĐ 2011 | 12 |
| BACKLOG.md | BL-2 — Q-A scoring: filter group leaderboard by source | 23 |
| BACKLOG.md | BL-4 — i18n wording normalize: "Đấu Hạng" | 48 |
| BACKLOG.md | High (cleanup — small but visible) | 84 |
| BACKLOG.md | BL-7 — Sentry: remove placeholder mentions | 99 |
| BACKLOG.md | Medium (tech debt) | 112 |
| BACKLOG.md | BL-8 — i18n hardcoded VN strings (baseline 116 lines) | 114 |
| BACKLOG.md | BL-9 — Verify TanStack Query coverage in admin pages | 126 |
| BACKLOG.md | Lower priority | 142 |
| BACKLOG.md | BL-11 — Mobile feature parity gaps vs web | 144 |
| BACKLOG.md | BL-12 — Group Leaderboard endpoint test for Q-A fix | 155 |
| BACKLOG.md | Added 2026-05-09 (Phase 2 spec refinement) | 161 |
| BACKLOG.md | BL-AD-2 — Configuration: build `app_config` table + admin CRUD | 201 |
| BACKLOG.md | BL-AD-3 — Notification broadcast: lightweight campaign system | 206 |
| BACKLOG.md | BL-AD-4 — Audit log: standardize via `AuditEventService.record(...)` | 211 |
| BACKLOG.md | BL-AD-5 — Question soft delete (30-day retention) | 216 |
| BACKLOG.md | Done (recent — keep until next sprint review) | 228 |
| BACKLOG.md | Added 2026-05-09 (First spec-audit run — `tools/spec-audit/`) | 241 |
| BACKLOG.md | BL-AUDIT-6 — Coverage critically low across all concerns | 276 |
| BACKLOG.md | BL-AUDIT-7 — 304 orphan spec sections (no code refs) | 281 |
| BACKLOG.md | Cross-references | 288 |
| SPEC_ADMIN_v3.1.md | Mục lục | 13 |
| SPEC_ADMIN_v3.1.md | 1. Mục đích & Roles | 39 |
| SPEC_ADMIN_v3.1.md | 1.1 Mục đích | 41 |
| SPEC_ADMIN_v3.1.md | 1.2 Roles & Quyền | 44 |
| SPEC_ADMIN_v3.1.md | 1.4 Audit hành vi admin | 57 |
| SPEC_ADMIN_v3.1.md | 3. Dashboard | 88 |
| SPEC_ADMIN_v3.1.md | 3.1 Mục đích | 90 |
| SPEC_ADMIN_v3.1.md | 4. User Management | 138 |

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
