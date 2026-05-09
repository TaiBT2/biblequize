# AUDIT_INVENTORY.md — Phase 1 Step 1.1

**Generated:** 2026-05-09
**Source:** Code walk of `apps/api/`, `apps/web/`, `apps/mobile/`
**Latest Flyway migration:** V48

---

## 1. Backend — Entities (by module)

### auth
| Entity | Table | Key fields |
|---|---|---|
| AuthIdentity | auth_identities | id, user_id (FK), provider, external_id, access_token, refresh_token |

### user
| Entity | Table | Key fields |
|---|---|---|
| User | users | id, email (UK), name, avatar_url, password_hash, role (USER/ADMIN), current_streak, longest_streak, prestige_level, prestige_at (JSON), tier6_reached_at, days_at_tier6, basic_quiz_passed, early_ranked_unlock, early_ranked_unlocked_at, practice_correct_count, practice_total_count, xp_surge_until, last_active_date, comeback_claimed_at |

### quiz
| Entity | Table | Key fields |
|---|---|---|
| Book | books | id, name, name_vi, testament (OLD/NEW), order_index |
| Question | questions | id, book, chapter, verse_start, verse_end, difficulty, type, content, options (JSON), correct_answer (JSON), language (vi/en), category, review_status |
| Answer | answers | id, question_id, session_id, selected_option, is_correct, time_taken |
| QuizSession | quiz_sessions | id, user_id, status, score, correct_answers, total_questions, started_at, ended_at |
| QuizSessionQuestion | quiz_session_questions | id, session_id, question_id (soft ref), order_index, player_answer, is_correct |
| UserBookProgress | user_book_progress | id, user_id, book_id, correct_count, total_count, last_attempted |
| UserDailyProgress | user_daily_progress | id, user_id, date, points_counted, questions_counted |
| UserQuestionHistory | user_question_history | id, user_id, question_id, correct, attempted_at |
| Bookmark | bookmarks | id, user_id, question_id, created_at |
| DailyMission | daily_missions | id, name, description, xp_reward, created_at |
| QuestionReview | question_reviews | id, question_id, submitter_id, status, feedback, created_at |
| QuestionSet | question_sets | id, owner_id, name, visibility (PRIVATE/PUBLIC), created_at |
| QuestionSetItem | question_set_items | id, question_set_id, question_id, order_index |

### room
| Entity | Table | Key fields |
|---|---|---|
| Room | rooms | id, room_code (UK), room_name, max_players, current_players, question_count, time_per_question, status (LOBBY/IN_PROGRESS/ENDED/CANCELLED), mode (SPEED_RACE/BATTLE_ROYALE/TEAM_VS_TEAM/SUDDEN_DEATH/GROUP_LIVE_SEQUENTIAL), difficulty, book_scope, question_source (DATABASE/CUSTOM), question_set_id, group_quiz_set_id, custom_question_ids (JSON), host_id, started_at, ended_at |
| RoomPlayer | room_players | id, room_id, user_id, status, score, team, joined_at |
| RoomAnswer | room_answers | id, room_id, player_id, round_id, question_id, selected_option, is_correct, time_taken |
| RoomRound | room_rounds | id, room_id, round_number, question_id (soft ref), current_question, started_at, ended_at |
| Challenge | challenges | id, room_id, challenger_id, challenged_id, status, winner_id |

### group
| Entity | Table | Key fields |
|---|---|---|
| ChurchGroup | church_groups | id, name, description, leader_id, member_count, deleted_at, locked_at, created_at |
| GroupMember | group_members | id, group_id, user_id, role (LEADER/MOD/MEMBER), joined_at, last_active_at |
| GroupQuizSet | group_quiz_sets | id, group_id, created_by, name, **question_ids (JSON)**, created_at |
| GroupAnnouncement | group_announcements | id, group_id, created_by, content, created_at |
| GroupKickLog | group_kick_logs | id, group_id, kicked_by_id, kicked_user_id, reason, kicked_at |
| GroupReport | group_reports | id, group_id, reported_by_id, target_user_id, reason, status, created_at |
| ScheduledQuiz | scheduled_quizzes | id, group_id, name, question_ids (JSON), scheduled_at, created_at |
| ScheduledQuizAttempt | scheduled_quiz_attempts | id, scheduled_quiz_id, user_id, score, correct_answers, completed_at |

### Other modules
| Module | Entities |
|---|---|
| achievement | Achievement, UserAchievement |
| daily | DailyCompletion |
| season | Season, SeasonRanking |
| lifeline | LifelineType (HINT only v1; ASK_OPINION deferred), LifelineUsage |
| notification | Notification |
| feedback | Feedback |
| share | ShareCard |
| tournament | Tournament, TournamentParticipant, TournamentMatch, TournamentMatchParticipant |

---

## 2. Backend — REST Controllers + Endpoints

| Controller | Base | Method · Endpoint | Auth |
|---|---|---|---|
| AuthController | /api/auth | POST /exchange · POST /refresh · POST /logout | mixed |
| MobileAuthController | /api/mobile/auth | POST /google · POST /refresh | public |
| UserController | /api/users | GET /me · PUT /me · GET /{id} · GET /{id}/progress | mixed |
| BookController | /api/books | GET / · GET /{id}/questions | public |
| SessionController | /api/sessions | POST / · GET /{id} · POST /{id}/answer · POST /{id}/lifeline/hint · GET /{id}/lifeline/status | required |
| RankedController | /api/ranked | POST /session · POST /answer · POST /sync-progress · GET /status · GET /tier | required |
| BasicQuizController | /api/basic-quiz | POST / · GET /{id} · POST /{id}/submit | required |
| DailyChallengeController | /api/daily-challenge | GET / · POST /complete | required |
| VarietyQuizController | /api/variety | GET /seasonal · GET /mystery · GET /weekly · GET /speed | required |
| LeaderboardController | /api/leaderboard | GET /daily · /weekly · /monthly · /all-time · /season | public |
| SeasonController | /api/seasons | GET / · GET /{id} · GET /{id}/rankings | public |
| AchievementController | /api/achievements | GET / | required |
| RoomController | /api/rooms | POST / · POST /join · GET /{id} · POST /{id}/start · POST /{id}/leave · POST /{id}/switch-team · POST /{id}/kick · GET /{id}/current-question · GET /public · GET /{id}/leaderboard | mixed |
| ChurchGroupController | /api/groups | POST / · GET /{id} · POST /{id}/members · DELETE /{id}/members/{memberId} · **POST /{id}/live-rooms** · **GET /{id}/live-rooms** · GET /{id}/leaderboard · POST /{id}/announcement | required |
| ScheduledQuizController | /api/scheduled-quizzes | POST / · GET / · POST /{id}/attempt | required |
| TournamentController | /api/tournaments | POST / · GET /{id} · POST /{id}/join · GET /{id}/matches | required |
| FeedbackController | /api/feedback | POST / · GET / | mixed |
| NotificationController | /api/notifications | GET / · PUT /{id}/read | required |
| ShareCardController | /api/share-cards | POST / · GET /{id} | mixed |
| QuestionReviewController | /api/question-reviews | POST / · GET / · PUT /{id} | mixed |
| HealthController | /api/health | GET / | public |
| AdminUserController | /api/admin/users | GET / · GET /{id} · POST /{id}/ban | admin |
| AdminGroupController | /api/admin/groups | GET / · POST /{id}/lock | admin |
| AdminSeasonController | /api/admin/seasons | POST / · PUT /{id} | admin |
| AdminQuestionController | /api/admin/questions | POST / · PUT /{id} | admin |
| AdminMetricsController | /api/admin/metrics | GET /dashboard | admin |
| AdminAuditController | /api/admin/audit | GET /events | admin |
| AdminDashboardController | /api/admin/dashboard | GET / | admin |
| AdminTestController | /api/admin/test | POST set-state · refill-energy · set-streak · reset-history · set-mission-state · seed-points | admin (dev/staging) |

---

## 3. Backend — Services (by module)

| Module | Services |
|---|---|
| auth | AuthService, AuthCodeService, JwtService, TokenBlacklistService, MobileAuthService |
| user | UserService, AccountDeletionService |
| quiz | QuestionService, BookProgressionService, BookMasteryService, DailyMissionService, SessionService, BasicQuizService, UserQuestionService, DailyThemeService |
| ranked | RankedSessionService, ScoringService, EnergyService |
| room | RoomService, RoomQuizService, RoomStateService, RoomPresenceListener, RoomAbandonmentScheduler, RoomCleanupScheduler, SequentialScoringService, SpeedRaceScoringService, SuddenDeathMatchService, TeamScoringService, BattleRoyaleEngine |
| group | ChurchGroupService, ScheduledQuizService, GroupStreakService |
| daily | (covered by quiz/DailyMissionService) |
| share | ShareCardService |
| tournament | TournamentService, TournamentMatchService |
| achievement | AchievementService |
| season | SeasonService |
| lifeline | LifelineService, LifelineConfigService, HintAlgorithmService |
| notification | NotificationService |
| premium/cosmetic | CosmeticService |
| prestige | PrestigeService |
| progress | ComebackService, TierProgressService, UserTierService |
| adminai | AIGenerationService, DuplicateDetectionService |
| presence | OnlineService, PresenceTracker |

---

## 4. Backend — WebSocket (STOMP)

**File:** `apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java`

| Handler | Destination | Purpose |
|---|---|---|
| handlePlayerJoin | /room/{roomId}/join | Player enters → broadcast PLAYER_JOINED |
| handlePlayerLeave | /room/{roomId}/leave | Player leaves, sync count |
| handlePlayerReady | /room/{roomId}/ready | Ready signal, check all-ready |
| handleGameStart | /room/{roomId}/start | Host starts, init rounds |
| handlePlayerAnswer | /room/{roomId}/answer | Submit answer, broadcast result + next Q |
| handleAdvance | /room/{roomId}/advance | Host manual advance (GROUP_LIVE_SEQUENTIAL only) |
| handleReaction | /room/{roomId}/reaction | Emoji reaction broadcast |
| handleChat | /room/{roomId}/chat | Chat message broadcast |

**Broadcast topic:** `/topic/room/{roomId}`
**Events:** PLAYER_JOINED, PLAYER_READY, QUESTION_START, ANSWER_SUBMITTED, SEQUENTIAL_PROGRESS, ROOM_ENDED, HOST_CHANGED, HOST_GONE, ALL_DISCONNECTED, EMPTY_LOBBY, STUCK_GAME, REACTION, CHAT

---

## 5. Backend — Flyway Migrations (V1–V48)

| V | Filename | Adds |
|---|---|---|
| V1 | init.sql | users, questions, books, quiz_sessions, answers |
| V2 | achievements.sql | achievements, user_achievements |
| V3 | rooms.sql | rooms, room_players, room_rounds, room_answers |
| V4 | add_audit_events_table.sql | audit_events |
| V5 | add_correct_answer_text_to_questions.sql | correct_answer_text col |
| V6 | add_password_hash_to_users.sql | password_hash col |
| V7 | add_seasons_and_achievements.sql | seasons, season_rankings |
| V8 | add_question_review_workflow.sql | question_reviews |
| V9 | fix_question_reviews_schema.sql | review schema fixes |
| V10 | add_room_game_modes.sql | mode/difficulty/book_scope enums |
| V11 | spec_v2_energy_streak.sql | current_streak, longest_streak |
| V12 | tournament_group_sharecard.sql | tournaments, church_groups, share_cards |
| V13 | add_deleted_at_to_church_groups.sql | soft delete |
| V14 | notifications.sql | notifications |
| V15 | fix_utf8_double_encoding.sql | UTF-8 fix |
| V16 | add_abandoned_session_support.sql | session abandonment |
| V17 | add_sudden_death_support.sql | Sudden Death mode |
| V18 | add_user_ban_fields.sql | user ban |
| V19 | add_group_lock_fields.sql | group lock_at |
| V20 | add_user_question_history.sql | user_question_history |
| V21 | add_challenges_table.sql | challenges (peer challenges) |
| V22 | add_question_search_indexes.sql | search indexes |
| V23 | add_daily_mission_table.sql | daily_missions |
| V24 | add_xp_surge_to_users.sql | xp_surge_until (Milestone Burst) |
| V25 | add_comeback_fields_to_users.sql | comeback fields |
| V26 | add_user_cosmetics_table.sql | user_cosmetics (frames+themes JSON) |
| V27 | add_prestige_fields_to_users.sql | prestige_level, prestige_at, days_at_tier6 |
| V28 | add_lifeline_system.sql | lifeline_types, lifeline_usages (HINT only) |
| V29 | add_early_ranked_unlock.sql | early_ranked_unlock + practice counters |
| V30 | add_early_ranked_unlocked_at.sql | unlock timestamp |
| V31 | add_basic_quiz_unlock.sql | basic_quiz_* fields, question.category |
| V32 | add_last_active_to_group_members.sql | group last_active_at |
| V33 | add_bible_fields_to_rooms.sql | question_source, book_scope refinement |
| V34 | user_questions_and_room_question_source.sql | QuestionSource enum |
| V35 | question_sets.sql | question_sets (user-created, distinct from group sets) |
| V36 | room_custom_question_ids.sql | custom_question_ids JSON |
| V37 | add_group_quiz_set_id_to_rooms.sql | group_quiz_set_id FK |
| V38 | add_daily_completions.sql | daily_completions |
| V39 | add_group_live_sequential_room_mode.sql | GROUP_LIVE_SEQUENTIAL |
| V40 | scheduled_quizzes.sql | scheduled_quizzes + attempts |
| V41 | group_kick_log_and_reports.sql | kick logs + reports |
| V42 | room_rounds_question_soft_ref.sql | soft FK |
| V43 | drop_hibernate_room_rounds_fk.sql | drop Hibernate FK |
| V44 | user_question_history_question_fk_cascade.sql | CASCADE |
| V45 | drop_room_players_collection.sql | Hibernate cleanup |
| V46 | abandon_orphan_practice_sessions.sql | purge orphans |
| V47 | dedup_streak_notifications.sql | dedup notif |
| V48 | rooms_fk_cascade_for_cleanup.sql | CASCADE for cleanup (R3) |

**Repeatable:** R__data.sql (66 books seed), R__seed_admin.sql (admin user)

---

## 6. Backend — Seeders

| Type | Class | Purpose |
|---|---|---|
| ApplicationReadyEvent | BookSeeder | 66 Bible books (OLD/NEW) |
| ApplicationReadyEvent | QuestionSeeder | Load `seed/questions/*.json` (VI + EN), idempotent |
| Repeatable migration | R__seed_admin.sql | Admin user |
| Controller | TestDataSeedController | QA endpoint /api/test-data/seed |

---

## 7. Web — Pages (apps/web/src/pages)

### User pages (route in main.tsx)
| File | Route | Auth |
|---|---|---|
| Home.tsx | / | mixed (guest→Landing) |
| LandingPage.tsx | /landing | none |
| Login.tsx | /login | none |
| Register.tsx | /register | none |
| AuthCallback.tsx | /auth/callback | none |
| Onboarding.tsx | /onboarding | none |
| OnboardingTryQuiz.tsx | /onboarding/try | none |
| Practice.tsx | /practice | mixed |
| Quiz.tsx | /quiz | mixed |
| BasicQuiz.tsx | /basic-quiz | RequireAuth |
| Ranked.tsx | /ranked | mixed |
| DailyChallenge.tsx | /daily | mixed |
| MysteryMode.tsx | /mystery-mode | RequireAuth |
| SpeedRound.tsx | /speed-round | RequireAuth |
| WeeklyQuiz.tsx | /weekly-quiz | RequireAuth |
| Review.tsx | /review | mixed |
| QuizResults.tsx | (internal) | — |
| Multiplayer.tsx | /multiplayer | RequireAuth |
| Rooms.tsx | /rooms | RequireAuth |
| CreateRoom.tsx | /room/create | RequireAuth |
| JoinRoom.tsx | /room/join | RequireAuth |
| RoomLobby.tsx | /room/:roomId/lobby | RequireAuth |
| RoomQuiz.tsx | /room/:roomId/quiz | RequireAuth |
| Tournaments.tsx | /tournaments | RequireAuth |
| TournamentDetail.tsx | /tournaments/:id | RequireAuth |
| TournamentMatch.tsx | /tournaments/:id/match/:matchId | RequireAuth |
| MySets.tsx | /my-sets | RequireAuth |
| SetEditor.tsx | /my-sets/:setId | RequireAuth |
| Groups.tsx | /groups | RequireAuth |
| GroupDetail.tsx | /groups/:id | RequireAuth |
| GroupAnalytics.tsx | /groups/:id/analytics | RequireAuth |
| ScheduledQuizCreate.tsx | /groups/:id/scheduled-quizzes/new | RequireAuth |
| ScheduledQuizDetail.tsx | /groups/:id/scheduled-quizzes/:quizId | RequireAuth |
| ScheduledQuizPlay.tsx | /groups/:id/scheduled-quizzes/:quizId/play | RequireAuth |
| Profile.tsx | /profile | RequireAuth |
| Achievements.tsx | /achievements | public |
| Journey.tsx | /journey | public |
| Cosmetics.tsx | /cosmetics | RequireAuth |
| Leaderboard.tsx | /leaderboard | public |
| Help.tsx | /help | public |
| PrivacyPolicy.tsx | /privacy | none |
| TermsOfService.tsx | /terms | none |

### Admin pages (RequireAdmin, prefix `/admin`)
Dashboard, Users, Questions, Feedback, Rankings, Events, Groups, Notifications, Configuration, ExportCenter, QuestionQuality, EarlyUnlockMetrics, AIQuestionGenerator, ReviewQueue, TestPanel.

---

## 8. Web — Components (top-level)

AnswerButton, GameModeGrid, ActivityFeed, BibleJourneyCard, BookProgress, BookCompletionModal, ComebackModal, DailyBonusModal, DailyMissionsCard, DailyMissionsWidget, DailyVerseBanner, EmptyLeaderboardCTA, EmptyState, ErrorBoundary, ErrorToast, FeaturedCard, FeaturedDailyChallenge, GreetingCard, LeaderboardRankWidget, LeaderboardSeasonWidget, LiveFeed, MilestoneBanner, MotivationCard, NotificationPanel, OfflineBanner, PageMeta, QuizLanguageSelect, RankedFeaturedCard, ReactionBar, SeasonGoalWidget, ShareCard, Skeleton, StarPopup, StreakWidget, TierPerksTeaser, TierProgressBar, TierUpModal, TutorialOverlay, WeaknessWidget, WeekComboWidget, WinRateWidget.

## 9. Web — Hooks
useBookName, useLifeline, useOnlineStatus, useRankedDataSync, useRankedPage, useStomp, useWebSocket.

## 10. Web — Stores
| Store | Fields |
|---|---|
| authStore | isAuthenticated, user, isLoading, checkAuth, login, logout, setUser |
| onboardingStore | hasSeenOnboarding |

## 11. Web — API
- `api/client.ts` — axios + JWT interceptor (FIXED 2026-04 per Known Issues 1/2/3)
- `api/tokenStore.ts` — token persistence

---

## 12. Mobile — Screens (apps/mobile/src/screens)

| Folder | Screens |
|---|---|
| Onboarding | SplashScreen, LanguageSelectionScreen, WelcomeSlidesScreen, TryQuizScreen, TryQuizResultScreen |
| Auth | LoginScreen |
| Main/Home | HomeScreen |
| Quiz | PracticeSelectScreen, QuizScreen, QuizReviewScreen, QuizResultsScreen, DailyChallengeScreen, RankedScreen |
| Progress | JourneyMapScreen |
| Multiplayer | MultiplayerLobbyScreen, CreateRoomScreen, RoomWaitingScreen, MultiplayerQuizScreen, MultiplayerResultsScreen, TournamentBracketScreen |
| Social | GroupsListScreen, GroupDetailScreen, GroupCreateScreen, GroupJoinScreen, LeaderboardScreen |
| User | ProfileScreen, OtherProfileScreen, AchievementsScreen, SettingsScreen |
| System | TierUpScreen, NotificationsScreen, LegalScreen |

## 13. Mobile — Logic / Stores / API / Navigation

- **Logic:** scoring.ts, streaks.ts, tierProgression.ts
- **Stores:** authStore, onboardingStore, settingsStore (language/notifications/theme)
- **API:** client.ts (axios, same endpoints as web)
- **Navigation:** RootNavigator → OnboardingNavigator / AuthNavigator / MainTabNavigator (5 tabs: Home, Quiz, Multiplayer, Groups, Profile)

## 14. Mobile — Feature parity gaps vs web
1. Multiplayer realtime — STOMP stub only (`Tính năng quiz multiplayer realtime sẽ được tích hợp với WebSocket STOMP`)
2. Cosmetics page — missing
3. Admin panel — none (intentional)
4. Tournament detail/match scoring — partial (only bracket view)
5. Set Editor — missing
6. Scheduled quizzes — missing
7. Variety modes (Weekly/Mystery/Speed) — present but less prominent than web
