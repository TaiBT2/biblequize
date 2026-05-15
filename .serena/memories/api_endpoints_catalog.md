# API Endpoints Catalog

## Domain: Admin

### AdminAuditController
**Base path:** `/api/admin/audit`
**File:** `apps/api/src/main/java/com/biblequiz/api/AdminAuditController.java`
**Class-level auth:** `hasRole('ADMIN')`

#### `GET /api/admin/audit/events`
- **Method:** `getAuditEvents()`
- **Auth:** `hasRole('ADMIN')`
- **Query params:** `page: int = 0, size: int = 20, userId: String?, eventType: String?, action: String?`
- **Response:** `Map<String, Object>`
- **Purpose:** Paginated list of audit events with optional filters by userId/eventType/action.

#### `GET /api/admin/audit/events/user/{userId}`
- **Method:** `getUserAuditEvents()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `userId: String`
- **Response:** `List<AuditEvent>`
- **Purpose:** All audit events for a specific user, newest first.

#### `GET /api/admin/audit/events/recent`
- **Method:** `getRecentAuditEvents()`
- **Auth:** `hasRole('ADMIN')`
- **Query params:** `hours: int = 24`
- **Response:** `List<AuditEvent>`
- **Purpose:** Audit events within the trailing N hours.

#### `GET /api/admin/audit/stats`
- **Method:** `getAuditStats()`
- **Auth:** `hasRole('ADMIN')`
- **Response:** `Map<String, Object>`
- **Purpose:** Audit event counts by type plus 24-hour totals.

---

### AdminDashboardController
**Base path:** `/api/admin/dashboard`
**File:** `apps/api/src/main/java/com/biblequiz/api/AdminDashboardController.java`
**Class-level auth:** `hasAnyRole('ADMIN', 'CONTENT_MOD')`

#### `GET /api/admin/dashboard`
- **Method:** `getDashboard()`
- **Auth:** `hasAnyRole('ADMIN', 'CONTENT_MOD')`
- **Response:** `Map<String, Object>`
- **Purpose:** KPIs, question queue, action items, coverage summary for admin dashboard.

---

### AdminGroupController
**Base path:** `/api/admin/groups`
**File:** `apps/api/src/main/java/com/biblequiz/api/AdminGroupController.java`
**Class-level auth:** `hasRole('ADMIN')`

#### `GET /api/admin/groups`
- **Method:** `listGroups()`
- **Auth:** `hasRole('ADMIN')`
- **Response:** `List<Map<String, Object>>`
- **Purpose:** List non-deleted ChurchGroups.

#### `GET /api/admin/groups/{id}`
- **Method:** `getGroup()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Get a single group by id.

#### `PATCH /api/admin/groups/{id}/lock`
- **Method:** `lockGroup()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `id: String`
- **Request body:** `Map<String, String>` (requires `reason`)
- **Response:** `Map<String, Object>`
- **Purpose:** Lock a group (reason min 10 chars).

#### `PATCH /api/admin/groups/{id}/unlock`
- **Method:** `unlockGroup()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Unlock a group.

#### `DELETE /api/admin/groups/{id}`
- **Method:** `deleteGroup()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `id: String`
- **Request body:** `Map<String, String>` (optional)
- **Response:** `Map<String, Object>`
- **Purpose:** Soft-delete a group.

---

### AdminMetricsController
**Base path:** `/api/admin/metrics`
**File:** `apps/api/src/main/java/com/biblequiz/api/AdminMetricsController.java`
**Class-level auth:** `hasAnyRole('ADMIN', 'CONTENT_MOD')`

#### `GET /api/admin/metrics/early-unlock`
- **Method:** `getEarlyUnlockMetrics()`
- **Auth:** `hasAnyRole('ADMIN', 'CONTENT_MOD')`
- **Response:** `Map<String, Object>`
- **Purpose:** Early Ranked Unlock adoption + quality metrics with 30-day timeline.

---

### AdminQuestionController
**Base path:** `/api/admin/questions`
**File:** `apps/api/src/main/java/com/biblequiz/api/AdminQuestionController.java`
**Class-level auth:** `hasRole('ADMIN')`

#### `GET /api/admin/questions/ping`
- **Method:** `ping()`
- **Auth:** `hasRole('ADMIN')`
- **Response:** `Map<String, Object>`
- **Purpose:** Liveness ping for admin questions module.

#### `GET /api/admin/questions`
- **Method:** `list()`
- **Auth:** `hasRole('ADMIN')`
- **Query params:** `page: int = 0, size: int = 25, book: String?, difficulty: String?, type: String?, reviewStatus: String?, search: String?, language: String?, category: String?`
- **Response:** `Map<String, Object>` containing `Page<Question>` content
- **Purpose:** Paginated, multi-filter admin question listing.

#### `GET /api/admin/questions/coverage`
- **Method:** `getCoverage()`
- **Auth:** `hasRole('ADMIN')`
- **Response:** `Map<String, Object>`
- **Purpose:** Pool size per book per difficulty + meetsMinimum flag.

#### `POST /api/admin/questions`
- **Method:** `create()`
- **Auth:** `hasRole('ADMIN')`
- **Query params:** `pending: boolean = false, forceCreate: boolean = false`
- **Request body:** `Question`
- **Response:** `Question` (or 409 on duplicate)
- **Purpose:** Create a question with duplicate detection.

#### `POST /api/admin/questions/check-duplicate`
- **Method:** `checkDuplicate()`
- **Auth:** `hasRole('ADMIN')`
- **Request body:** `Map<String, Object>`
- **Response:** `DuplicateCheckResult`
- **Purpose:** Pre-flight duplicate check before create.

#### `POST /api/admin/questions/import`
- **Method:** `importQuestions()`
- **Auth:** `hasRole('ADMIN')`
- **Query params:** `dryRun: boolean = false, skipDuplicates: boolean = false`
- **Request body:** `MultipartFile file` (.json or .csv)
- **Response:** `Map<String, Object>`
- **Purpose:** Bulk import questions from JSON/CSV; validates + de-dupes; flips to PENDING.

#### `PUT /api/admin/questions/{id}`
- **Method:** `update()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `id: String`
- **Request body:** `Question`
- **Response:** `Question`
- **Purpose:** Update a question (with Bible Basics safeguard).

#### `DELETE /api/admin/questions/{id}`
- **Method:** `delete()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `id: String`
- **Response:** `void`
- **Purpose:** Delete a question (with safeguard).

#### `DELETE /api/admin/questions`
- **Method:** `bulkDelete()`
- **Auth:** `hasRole('ADMIN')`
- **Request body:** `Map<String, List<String>>` (`ids`)
- **Response:** `Map<String, Object>`
- **Purpose:** Bulk-delete a list of questions.

---

### AdminSeasonController
**Base path:** `/api/admin/seasons`
**File:** `apps/api/src/main/java/com/biblequiz/api/AdminSeasonController.java`
**Class-level auth:** `hasRole('ADMIN')`

#### `GET /api/admin/seasons`
- **Method:** `listSeasons()`
- **Auth:** `hasRole('ADMIN')`
- **Response:** `List<Map<String, Object>>`
- **Purpose:** List all seasons newest start-date first.

#### `POST /api/admin/seasons`
- **Method:** `createSeason()`
- **Auth:** `hasRole('ADMIN')`
- **Request body:** `Map<String, String>` (`name`, `startDate`, `endDate`)
- **Response:** `Map<String, Object>`
- **Purpose:** Create a new season.

#### `POST /api/admin/seasons/{id}/end`
- **Method:** `endSeason()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Mark a season inactive and set endDate=today.

---

### AdminTestController
**Base path:** `/api/admin/test`
**File:** `apps/api/src/main/java/com/biblequiz/api/AdminTestController.java`
**Class-level auth:** `hasRole('ADMIN')` (active in profiles `dev`, `staging`, `docker` only)

#### `GET /api/admin/test/users/{userId}/preview-questions`
- **Method:** `previewQuestions()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `userId: String`
- **Query params:** `count: int = 10, book: String?, language: String = "vi"`
- **Response:** `Map<String, Object>`
- **Purpose:** Preview the SmartQuestionSelector's pick for a user.

#### `POST /api/admin/test/users/{userId}/set-tier`
- **Method:** `setTier()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `userId: String`
- **Query params:** `tierLevel: int` (1-6)
- **Response:** `Map<String, Object>`
- **Purpose:** Force a user's tier by adjusting points.

#### `POST /api/admin/test/users/{userId}/reset-history`
- **Method:** `resetHistory()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `userId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Delete a user's question history.

#### `POST /api/admin/test/users/{userId}/mock-history`
- **Method:** `mockHistory()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `userId: String`
- **Query params:** `percentSeen: int = 50, percentWrong: int = 10`
- **Response:** `Map<String, Object>`
- **Purpose:** Seed mock UserQuestionHistory rows.

#### `POST /api/admin/test/users/{userId}/refill-energy`
- **Method:** `refillEnergy()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `userId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Reset livesRemaining to 100.

#### `POST /api/admin/test/users/{userId}/set-streak`
- **Method:** `setStreak()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `userId: String`
- **Query params:** `days: int`
- **Response:** `Map<String, Object>`
- **Purpose:** Override user's current/longest streak.

#### `POST /api/admin/test/users/{userId}/full-reset`
- **Method:** `fullReset()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `userId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Reset streak, history, daily progress points.

#### `POST /api/admin/test/users/{userId}/set-state`
- **Method:** `setState()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `userId: String`
- **Request body:** `SetStateRequest`
- **Response:** `Map<String, Object>`
- **Purpose:** Partial-update of UDP/User state fields for E2E.

#### `POST /api/admin/test/users/{userId}/seed-points`
- **Method:** `seedPoints()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `userId: String`
- **Request body:** `SeedPointsRequest`
- **Response:** `Map<String, Object>`
- **Purpose:** Wipe daily progress and seed exact totalPoints.

#### `POST /api/admin/test/users/{userId}/set-mission-state`
- **Method:** `setMissionState()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `userId: String`
- **Request body:** `SetMissionStateRequest`
- **Response:** `Map<String, Object>`
- **Purpose:** Override DailyMission progress/completion state.

#### `POST /api/admin/test/daily-complete`
- **Method:** `dailyComplete()`
- **Auth:** `hasRole('ADMIN')`
- **Request body:** `Map<String, Object>` (`email`, `score?`)
- **Response:** `Map<String, Object>`
- **Purpose:** Force-mark today's daily challenge complete for a user.

#### `POST /api/admin/test/seed-group`
- **Method:** `seedGroup()`
- **Auth:** `hasRole('ADMIN')`
- **Request body:** `Map<String, Object>` (`ownerEmail`, `groupName?`, `memberEmails?`)
- **Response:** `Map<String, Object>`
- **Purpose:** Create a test ChurchGroup + memberships.

#### `POST /api/admin/test/seed-tournament`
- **Method:** `seedTournament()`
- **Auth:** `hasRole('ADMIN')`
- **Request body:** `Map<String, Object>` (`tournamentName?`, `participantEmails`)
- **Response:** `Map<String, Object>`
- **Purpose:** Create a LOBBY tournament with participants.

#### `POST /api/admin/test/seed-review-queue`
- **Method:** `seedReviewQueue()`
- **Auth:** `hasRole('ADMIN')`
- **Request body:** `Map<String, Object>` (`count?`)
- **Response:** `Map<String, Object>`
- **Purpose:** Flip N active questions to PENDING for the review queue.

#### `POST /api/admin/test/seed-feedback`
- **Method:** `seedFeedback()`
- **Auth:** `hasRole('ADMIN')`
- **Request body:** `Map<String, Object>` (`userEmail`, `count?`)
- **Response:** `Map<String, Object>`
- **Purpose:** Create N pending feedback rows for a user.

#### `POST /api/admin/test/seed-ranked-progress`
- **Method:** `seedRankedProgress()`
- **Auth:** `hasRole('ADMIN')`
- **Request body:** `Map<String, Object>` (`email`, `questionsAnswered?`, `correctAnswers?`)
- **Response:** `Map<String, Object>`
- **Purpose:** Seed today's ranked questions + points.

---

### AdminUserController
**Base path:** `/api/admin/users`
**File:** `apps/api/src/main/java/com/biblequiz/api/AdminUserController.java`
**Class-level auth:** `hasRole('ADMIN')`

#### `GET /api/admin/users`
- **Method:** `listUsers()`
- **Auth:** `hasRole('ADMIN')`
- **Query params:** `page: int = 0, size: int = 20, role: String?, search: String?, banned: Boolean?`
- **Response:** `Map<String, Object>`
- **Purpose:** Paginated user listing with role/search/banned filters.

#### `GET /api/admin/users/{id}`
- **Method:** `getUser()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Get a single user DTO.

#### `PATCH /api/admin/users/{id}/role`
- **Method:** `changeRole()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `id: String`
- **Request body:** `Map<String, String>` (`role`)
- **Response:** `Map<String, Object>`
- **Purpose:** Change another user's role.

#### `PATCH /api/admin/users/{id}/ban`
- **Method:** `banUser()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>` (`banned`, `reason`)
- **Response:** `Map<String, Object>`
- **Purpose:** Ban / unban a user (reason ≥10 chars on ban).

---

### AIAdminController (AI)
**Base path:** `/api/admin/ai`
**File:** `apps/api/src/main/java/com/biblequiz/modules/adminai/AIAdminController.java`
**Class-level auth:** `hasRole('ADMIN')`

#### `GET /api/admin/ai/models`
- **Method:** `listModels()`
- **Auth:** `hasRole('ADMIN')`
- **Response:** `List<?>`
- **Purpose:** List configured AI models.

#### `GET /api/admin/ai/info`
- **Method:** `info()`
- **Auth:** `hasRole('ADMIN')`
- **Response:** `Map<String, Object>`
- **Purpose:** Provider configuration + today's quota snapshot.

#### `POST /api/admin/ai/generate`
- **Method:** `generate()`
- **Auth:** `hasRole('ADMIN')`
- **Request body:** `AIGenerationRequest`
- **Response:** `Map<String, Object>`
- **Purpose:** Generate AI questions via provider router (with quota gate).

---

### TestDataSeedController
**Base path:** `/api/admin/seed`
**File:** `apps/api/src/main/java/com/biblequiz/api/TestDataSeedController.java`
**Class-level auth:** `hasRole('ADMIN')` (active in profile `!prod`)

#### `POST /api/admin/seed/test-data`
- **Method:** `seedTestData()`
- **Auth:** `hasRole('ADMIN')`
- **Request body:** `Map<String, Object>` (optional `reset`)
- **Response:** `Map<String, Object>`
- **Purpose:** Seed all canonical test data (optional reset).

#### `DELETE /api/admin/seed/test-data`
- **Method:** `clearTestData()`
- **Auth:** `hasRole('ADMIN')`
- **Response:** `void`
- **Purpose:** Wipe seeded test data.

---

## Domain: Auth

### AuthController
**Base path:** `/api/auth`
**File:** `apps/api/src/main/java/com/biblequiz/api/AuthController.java`
**Class-level auth:** `(none)`

#### `GET /api/auth/oauth/success`
- **Method:** `oauthSuccess()`
- **Auth:** `PUBLIC` (relies on Spring Security OAuth2 principal)
- **Response:** `Map<String, Object>`
- **Purpose:** Return access/refresh tokens after Google OAuth login.

#### `POST /api/auth/exchange`
- **Method:** `exchangeCode()`
- **Auth:** `PUBLIC`
- **Request body:** `Map<String, String>` (`code`)
- **Response:** `Map<String, Object>`
- **Purpose:** Exchange one-time OAuth code for access token (refresh cookie set).

#### `POST /api/auth/refresh`
- **Method:** `refreshToken()`
- **Auth:** `PUBLIC` (uses refresh-token cookie)
- **Response:** `Map<String, Object>`
- **Purpose:** Refresh access token using HttpOnly cookie.

#### `POST /api/auth/logout`
- **Method:** `logout()`
- **Auth:** `authenticated`
- **Response:** `Map<String, String>`
- **Purpose:** Blacklist JWT + clear refresh cookie.

#### `POST /api/auth/register`
- **Method:** `register()`
- **Auth:** `PUBLIC`
- **Request body:** `Map<String, String>` (`name`, `email`, `password`)
- **Response:** `Map<String, Object>`
- **Purpose:** Local password registration.

#### `POST /api/auth/login`
- **Method:** `loginLocal()`
- **Auth:** `PUBLIC`
- **Request body:** `Map<String, String>` (`email`, `password`, `rememberMe?`)
- **Response:** `Map<String, Object>`
- **Purpose:** Local password login.

---

### MobileAuthController
**Base path:** `/api/auth/mobile`
**File:** `apps/api/src/main/java/com/biblequiz/api/MobileAuthController.java`
**Class-level auth:** `(none)`

#### `POST /api/auth/mobile/login`
- **Method:** `mobileLogin()`
- **Auth:** `PUBLIC`
- **Request body:** `MobileLoginRequest`
- **Response:** `MobileAuthResponse`
- **Purpose:** Mobile password login.

#### `POST /api/auth/mobile/refresh`
- **Method:** `mobileRefresh()`
- **Auth:** `PUBLIC`
- **Request body:** `MobileRefreshRequest`
- **Response:** `MobileAuthResponse`
- **Purpose:** Mobile refresh-token exchange.

#### `POST /api/auth/mobile/google`
- **Method:** `mobileGoogleLogin()`
- **Auth:** `PUBLIC`
- **Request body:** `MobileGoogleRequest`
- **Response:** `MobileAuthResponse`
- **Purpose:** Mobile Google ID-token login.

---

## Domain: DevTest

### SimpleTestController
**Base path:** `/simple`
**File:** `apps/api/src/main/java/com/biblequiz/infrastructure/auth/SimpleTestController.java`
**Class-level auth:** `(none)`

#### `GET /simple/test`
- **Method:** `test()`
- **Auth:** `PUBLIC`
- **Response:** `String`
- **Purpose:** Trivial liveness probe.

---

### TestController
**Base path:** `/test`
**File:** `apps/api/src/main/java/com/biblequiz/infrastructure/auth/TestController.java`
**Class-level auth:** `(none)`

#### `GET /test/oauth2`
- **Method:** `testOAuth2()`
- **Auth:** `authenticated` (OAuth2 principal required)
- **Response:** `String`
- **Purpose:** Echo OAuth2 attributes for debugging.

---

## Domain: Group

### ChurchGroupController
**Base path:** `/api/groups`
**File:** `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java`
**Class-level auth:** `(none)`

#### `GET /api/groups/me`
- **Method:** `getMyGroup()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Current user's primary group (or `hasGroup=false`).

#### `GET /api/groups/mine`
- **Method:** `listMyGroups()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** All groups the user belongs to with weekly summary.

#### `GET /api/groups/public`
- **Method:** `listPublicGroups()`
- **Auth:** `PUBLIC`
- **Query params:** `limit: int = 10, featured: boolean = false`
- **Response:** `Map<String, Object>`
- **Purpose:** Public group discovery list.

#### `GET /api/groups/{id}`
- **Method:** `getGroupDetails()`
- **Auth:** `authenticated` (viewer-aware)
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Group details with viewer's myRole.

#### `GET /api/groups/{id}/members`
- **Method:** `listMembers()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Query params:** `search: String?, sort: String = "score", order: String = "desc", filter: String?, limit: int = 20, cursor: String?`
- **Response:** `Map<String, Object>`
- **Purpose:** Paginated, searchable, filterable member list.

#### `GET /api/groups/{id}/leaderboard`
- **Method:** `getLeaderboard()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Query params:** `period: String = "weekly"`
- **Response:** `Map<String, Object>`
- **Purpose:** Group leaderboard for a period.

#### `GET /api/groups/{id}/analytics`
- **Method:** `getAnalytics()`
- **Auth:** `authenticated` (leader/mod only)
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Group analytics for leader/mod.

#### `GET /api/groups/{id}/streak`
- **Method:** `getGroupStreak()`
- **Auth:** `authenticated` (member only)
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Group streak (≥1 active member/day).

#### `GET /api/groups/{id}/quiz-sets`
- **Method:** `listQuizSets()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Query params:** `status: String?, folder: String?, search: String?, sort: String = "recent", page: int = 0, size: int = 50`
- **Response:** `Map<String, Object>`
- **Purpose:** Filtered + sorted quiz set listing for a group.

#### `GET /api/groups/{id}/quiz-sets/{setId}/full`
- **Method:** `getQuizSetFull()`
- **Auth:** `authenticated`
- **Path params:** `id: String, setId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Quiz set + ordered questions in one round trip.

#### `GET /api/groups/{id}/quiz-sets/{setId}/my-mastery`
- **Method:** `getMyMastery()`
- **Auth:** `authenticated`
- **Path params:** `id: String, setId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Personal mastery for a quiz set.

#### `GET /api/groups/{groupId}/quiz-sets/{setId}/my-attempts`
- **Method:** `getMyAttempts()`
- **Auth:** `authenticated`
- **Path params:** `groupId: String, setId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Last 10 completed solo replays + mastery summary.

#### `GET /api/groups/{groupId}/quiz-sets/{setId}/leaderboard`
- **Method:** `getQuizSetLeaderboard()`
- **Auth:** `authenticated`
- **Path params:** `groupId: String, setId: String`
- **Query params:** `limit: int = 20`
- **Response:** `Map<String, Object>`
- **Purpose:** Per-quiz-set leaderboard from mastery.

#### `GET /api/groups/{id}/my-masteries`
- **Method:** `getMyMasteries()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** All masteries of the requester within a group.

#### `GET /api/groups/{id}/quiz-set-folders`
- **Method:** `listFolders()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** List quiz-set folders for a group.

#### `GET /api/groups/{id}/announcements`
- **Method:** `getAnnouncements()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Query params:** `limit: int = 20, offset: int = 0`
- **Response:** `Map<String, Object>`
- **Purpose:** Paginated group announcements.

#### `GET /api/groups/{id}/ai-quota`
- **Method:** `getAiQuota()`
- **Auth:** `authenticated` (leader/mod only)
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Shared global AI quota snapshot.

#### `GET /api/groups/{id}/live-rooms`
- **Method:** `listActiveRooms()`
- **Auth:** `authenticated` (member only)
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Active live/lobby rooms for the group.

#### `POST /api/groups`
- **Method:** `createGroup()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Create a new ChurchGroup.

#### `POST /api/groups/join`
- **Method:** `joinGroup()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, String>` (`code` / `groupCode`)
- **Response:** `Map<String, Object>`
- **Purpose:** Join a group by code.

#### `POST /api/groups/{id}/quiz-sets`
- **Method:** `createQuizSet()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>` (`name`, `questionIds`)
- **Response:** `Map<String, Object>`
- **Purpose:** Create a quiz set from existing question ids.

#### `POST /api/groups/{id}/quiz-sets/custom`
- **Method:** `createCustomQuizSet()`
- **Auth:** `authenticated` (leader/mod)
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>` (`name`, `questions[]`)
- **Response:** `Map<String, Object>`
- **Purpose:** Save leader-authored questions + quiz set atomically.

#### `POST /api/groups/{id}/quiz-sets/{setId}/questions`
- **Method:** `addQuestionToSet()`
- **Auth:** `authenticated` (leader/mod)
- **Path params:** `id: String, setId: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Add one custom question to a set.

#### `POST /api/groups/{id}/quiz-sets/{setId}/questions/reorder`
- **Method:** `reorderQuestionsInSet()`
- **Auth:** `authenticated` (leader/mod)
- **Path params:** `id: String, setId: String`
- **Request body:** `Map<String, Object>` (`questionIds`)
- **Response:** `Map<String, Object>`
- **Purpose:** Reorder questions in a quiz set (no add/remove).

#### `POST /api/groups/{id}/quiz-sets/{setId}/ai-generate`
- **Method:** `aiGenerateForSet()`
- **Auth:** `authenticated` (leader/mod)
- **Path params:** `id: String, setId: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Set-scoped AI generation (saves drafts, appends to set).

#### `POST /api/groups/{id}/quiz-sets/{setId}/questions/{qid}/ai-rewrite`
- **Method:** `aiRewriteQuestion()`
- **Auth:** `authenticated` (leader/mod)
- **Path params:** `id: String, setId: String, qid: String`
- **Request body:** `Map<String, Object>` (optional `hint`)
- **Response:** `Map<String, Object>`
- **Purpose:** Return one rewritten draft without saving.

#### `POST /api/groups/{id}/quiz-sets/{setId}/solo-practice`
- **Method:** `startSoloPractice()`
- **Auth:** `authenticated`
- **Path params:** `id: String, setId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Start a private practice session from a group quiz set.

#### `POST /api/groups/{groupId}/quiz-sets/{setId}/play`
- **Method:** `playQuizSet()`
- **Auth:** `authenticated`
- **Path params:** `groupId: String, setId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Create a co-play room from a group quiz set.

#### `POST /api/groups/{id}/live-rooms`
- **Method:** `createLiveQuiz()`
- **Auth:** `authenticated` (leader/mod)
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Create GROUP_LIVE_SEQUENTIAL room for a quiz set.

#### `POST /api/groups/{id}/ai-generate`
- **Method:** `aiGenerateQuestions()`
- **Auth:** `authenticated` (leader/mod)
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Generate draft AI questions (not saved) for a group.

#### `POST /api/groups/{id}/announcements`
- **Method:** `createAnnouncement()`
- **Auth:** `authenticated` (leader/mod)
- **Path params:** `id: String`
- **Request body:** `Map<String, String>` (`content`)
- **Response:** `Map<String, Object>`
- **Purpose:** Create a group announcement.

#### `POST /api/groups/{id}/report`
- **Method:** `reportGroup()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Request body:** `Map<String, String>` (`reason`, `note`)
- **Response:** `Map<String, Object>`
- **Purpose:** Report a group (one open report per user/group).

#### `POST /api/groups/{id}/quiz-set-folders`
- **Method:** `createFolder()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Create a quiz-set folder.

#### `PATCH /api/groups/{id}`
- **Method:** `updateGroup()`
- **Auth:** `authenticated` (leader only)
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Update group metadata.

#### `PATCH /api/groups/{id}/members/{userId}/role`
- **Method:** `changeMemberRole()`
- **Auth:** `authenticated` (leader only)
- **Path params:** `id: String, userId: String`
- **Request body:** `Map<String, String>` (`role`)
- **Response:** `Map<String, Object>`
- **Purpose:** Promote / demote a member (MEMBER ↔ MOD).

#### `PATCH /api/groups/{id}/quiz-sets/{setId}`
- **Method:** `updateQuizSet()`
- **Auth:** `authenticated`
- **Path params:** `id: String, setId: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Update quiz set metadata + name + questions.

#### `PATCH /api/groups/{id}/quiz-sets/{setId}/publish`
- **Method:** `publishQuizSet()`
- **Auth:** `authenticated`
- **Path params:** `id: String, setId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Publish a DRAFT quiz set.

#### `PATCH /api/groups/{id}/quiz-sets/{setId}/archive`
- **Method:** `archiveQuizSet()`
- **Auth:** `authenticated`
- **Path params:** `id: String, setId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Archive a quiz set.

#### `PATCH /api/groups/{id}/quiz-sets/{setId}/unarchive`
- **Method:** `unarchiveQuizSet()`
- **Auth:** `authenticated`
- **Path params:** `id: String, setId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Unarchive a quiz set.

#### `PATCH /api/groups/{id}/quiz-sets/{setId}/questions/{qid}`
- **Method:** `updateQuestionInSet()`
- **Auth:** `authenticated` (leader/mod)
- **Path params:** `id: String, setId: String, qid: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Partial update of a question in a set.

#### `PATCH /api/groups/{id}/quiz-set-folders/{folderId}`
- **Method:** `updateFolder()`
- **Auth:** `authenticated`
- **Path params:** `id: String, folderId: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Update folder metadata.

#### `POST /api/groups/{id}/quiz-sets/{setId}/clone`
- **Method:** `cloneQuizSet()`
- **Auth:** `authenticated`
- **Path params:** `id: String, setId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Clone a quiz set.

#### `DELETE /api/groups/{id}`
- **Method:** `deleteGroup()`
- **Auth:** `authenticated` (leader only)
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Soft-delete a group.

#### `DELETE /api/groups/{id}/leave`
- **Method:** `leaveGroup()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Leave a group (leader cannot leave).

#### `DELETE /api/groups/{id}/members/{userId}`
- **Method:** `kickMember()`
- **Auth:** `authenticated` (leader/mod)
- **Path params:** `id: String, userId: String`
- **Request body:** `Map<String, String>` (optional `reason`)
- **Response:** `Map<String, Object>`
- **Purpose:** Kick a member (7-day rejoin cooldown logged).

#### `DELETE /api/groups/{id}/quiz-sets/{setId}`
- **Method:** `deleteQuizSet()`
- **Auth:** `authenticated`
- **Path params:** `id: String, setId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Soft-delete a quiz set.

#### `DELETE /api/groups/{id}/quiz-sets/{setId}/questions/{qid}`
- **Method:** `deleteQuestionFromSet()`
- **Auth:** `authenticated` (leader/mod)
- **Path params:** `id: String, setId: String, qid: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Remove a question from a set (hard-delete if group-owned).

#### `DELETE /api/groups/{id}/quiz-set-folders/{folderId}`
- **Method:** `deleteFolder()`
- **Auth:** `authenticated`
- **Path params:** `id: String, folderId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Delete a folder.

---

## Domain: Health

### HealthController
**Base path:** `/health/simple`
**File:** `apps/api/src/main/java/com/biblequiz/api/HealthController.java`
**Class-level auth:** `(none)`

#### `GET /health/simple`
- **Method:** `health()`
- **Auth:** `PUBLIC`
- **Response:** `Map<String, Object>`
- **Purpose:** Lightweight DB-only health snapshot.

---

### HealthCheckController
**Base path:** `/health`
**File:** `apps/api/src/main/java/com/biblequiz/infrastructure/health/HealthCheckController.java`
**Class-level auth:** `(none)`

#### `GET /health`
- **Method:** `health()`
- **Auth:** `PUBLIC`
- **Response:** `Map<String, Object>`
- **Purpose:** Combined DB + Redis health summary.

#### `GET /health/detailed`
- **Method:** `detailedHealth()`
- **Auth:** `PUBLIC`
- **Response:** `Map<String, Object>`
- **Purpose:** Detailed DB / Redis / configuration / performance info.

#### `GET /health/readiness`
- **Method:** `readiness()`
- **Auth:** `PUBLIC`
- **Response:** `Map<String, Object>`
- **Purpose:** K8s readiness probe.

#### `GET /health/liveness`
- **Method:** `liveness()`
- **Auth:** `PUBLIC`
- **Response:** `Map<String, Object>`
- **Purpose:** K8s liveness probe + uptime.

---

## Domain: Multiplayer

### RoomController
**Base path:** `/api/rooms`
**File:** `apps/api/src/main/java/com/biblequiz/api/RoomController.java`
**Class-level auth:** `(none)`

#### `GET /api/rooms/public`
- **Method:** `getPublicRooms()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** List public rooms in lobby (viewer-aware joinable flag).

#### `GET /api/rooms/{id}`
- **Method:** `getRoomDetails()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Room details with caller's viewerUserId.

#### `GET /api/rooms/{id}/current-question`
- **Method:** `getCurrentQuestion()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Cached current question for rehydration; 204 if none.

#### `GET /api/rooms/{id}/leaderboard`
- **Method:** `getLeaderboard()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** In-room leaderboard.

#### `GET /api/rooms/{id}/analytics`
- **Method:** `getRoomAnalytics()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Post-game per-round analytics.

#### `POST /api/rooms`
- **Method:** `createRoom()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Create a new multiplayer room.

#### `POST /api/rooms/join`
- **Method:** `joinRoom()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, String>` (`roomCode`)
- **Response:** `Map<String, Object>`
- **Purpose:** Join a room by code.

#### `POST /api/rooms/{id}/start`
- **Method:** `startRoom()`
- **Auth:** `authenticated` (host only)
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Start the room's quiz.

#### `POST /api/rooms/{id}/leave`
- **Method:** `leaveRoom()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Leave a room.

#### `POST /api/rooms/{id}/switch-team`
- **Method:** `switchTeam()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Swap team (Team vs Team lobby).

#### `POST /api/rooms/{id}/kick`
- **Method:** `kickPlayer()`
- **Auth:** `authenticated` (host only)
- **Path params:** `id: String`
- **Request body:** `Map<String, String>` (`userId`)
- **Response:** `Map<String, Object>`
- **Purpose:** Kick a player (lobby only).

#### `POST /api/rooms/{id}/host/pause`
- **Method:** `pauseGame()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Pause the active game (Quản trò).

#### `POST /api/rooms/{id}/host/resume`
- **Method:** `resumeGame()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Resume a paused game.

#### `POST /api/rooms/{id}/host/skip-question`
- **Method:** `skipQuestion()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Host-skip the current question.

#### `POST /api/rooms/{id}/host/broadcast`
- **Method:** `broadcastHostMessage()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Request body:** `Map<String, String>` (`message`)
- **Response:** `Map<String, Object>`
- **Purpose:** Host broadcast message to room.

#### `POST /api/rooms/{id}/host/end-early`
- **Method:** `endGameEarly()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** End the game early.

---

### SessionController
**Base path:** `/api/sessions`
**File:** `apps/api/src/main/java/com/biblequiz/api/SessionController.java`
**Class-level auth:** `(none)`

#### `GET /api/sessions/practice/recent`
- **Method:** `recentPracticeSessions()`
- **Auth:** `authenticated`
- **Query params:** `limit: int = 3`
- **Response:** `Map<String, Object>`
- **Purpose:** Recent practice sessions for current user.

#### `GET /api/sessions/practice/wrong-questions/count`
- **Method:** `wrongQuestionCount()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Wrong-answer count from last completed practice.

#### `GET /api/sessions/{id}`
- **Method:** `get()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Get session by id.

#### `GET /api/sessions/{id}/review`
- **Method:** `review()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Full session review (questions + answers).

#### `POST /api/sessions`
- **Method:** `create()`
- **Auth:** `authenticated`
- **Request body:** `CreateSessionRequest`
- **Response:** `Map<String, Object>`
- **Purpose:** Create a quiz session.

#### `POST /api/sessions/{id}/answer`
- **Method:** `answer()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Request body:** `SubmitAnswerRequest`
- **Response:** `Map<String, Object>`
- **Purpose:** Submit an answer for a question.

#### `POST /api/sessions/{id}/retry`
- **Method:** `retry()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Clone a session config into a new session.

#### `POST /api/sessions/practice/retry-wrong`
- **Method:** `retryWrong()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Create a session of last-practice wrong questions.

#### `POST /api/sessions/{id}/complete`
- **Method:** `complete()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Mark a session completed (idempotent).

---

### SessionLifelineController
**Base path:** `/api/sessions/{sessionId}/lifeline`
**File:** `apps/api/src/main/java/com/biblequiz/api/SessionLifelineController.java`
**Class-level auth:** `(none)`

#### `GET /api/sessions/{sessionId}/lifeline/status`
- **Method:** `getStatus()`
- **Auth:** `authenticated`
- **Path params:** `sessionId: String`
- **Query params:** `questionId: String?`
- **Response:** `LifelineStatusResponse`
- **Purpose:** Remaining hints + eliminated options for current question.

#### `POST /api/sessions/{sessionId}/lifeline/hint`
- **Method:** `useHint()`
- **Auth:** `authenticated`
- **Path params:** `sessionId: String`
- **Request body:** `UseHintRequest`
- **Response:** `HintResponse`
- **Purpose:** Use a hint (eliminate one wrong option).

---

## Domain: Public/Misc

### FeedbackController
**Base path:** `(none)`
**File:** `apps/api/src/main/java/com/biblequiz/api/FeedbackController.java`
**Class-level auth:** `(none)`

#### `POST /api/feedback`
- **Method:** `submitFeedback()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, String>`
- **Response:** `Map<String, Object>`
- **Purpose:** Submit feedback (report/question/general).

#### `GET /api/admin/feedback`
- **Method:** `list()`
- **Auth:** `hasAnyRole('ADMIN', 'CONTENT_MOD')`
- **Query params:** `status: String?, type: String?, page: int = 0, size: int = 20`
- **Response:** `Map<String, Object>`
- **Purpose:** Admin paginated feedback list.

#### `PATCH /api/admin/feedback/{id}`
- **Method:** `updateStatus()`
- **Auth:** `hasRole('ADMIN')`
- **Path params:** `id: String`
- **Request body:** `Map<String, String>`
- **Response:** `Map<String, Object>`
- **Purpose:** Update feedback status + admin note.

---

### NotificationController
**Base path:** `/api/notifications`
**File:** `apps/api/src/main/java/com/biblequiz/api/NotificationController.java`
**Class-level auth:** `(none)`

#### `GET /api/notifications`
- **Method:** `getNotifications()`
- **Auth:** `authenticated`
- **Query params:** `unread: boolean = false, limit: int = 20`
- **Response:** `Map<String, Object>`
- **Purpose:** Get notifications + unread count.

#### `PATCH /api/notifications/{id}/read`
- **Method:** `markAsRead()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Mark one notification as read.

#### `PATCH /api/notifications/read-all`
- **Method:** `markAllAsRead()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Mark all notifications as read.

---

### PublicController
**Base path:** `/api/public`
**File:** `apps/api/src/main/java/com/biblequiz/api/PublicController.java`
**Class-level auth:** `(none)`

#### `GET /api/public/sample-questions`
- **Method:** `getSampleQuestions()`
- **Auth:** `PUBLIC`
- **Query params:** `language: String = "vi", count: int = 3`
- **Response:** `List<Map<String, Object>>`
- **Purpose:** Random easy sample questions for marketing.

---

### ShareCardController
**Base path:** `/api/share`
**File:** `apps/api/src/main/java/com/biblequiz/api/ShareCardController.java`
**Class-level auth:** `(none)`

#### `GET /api/share/session/{sessionId}`
- **Method:** `getSessionCard()`
- **Auth:** `authenticated`
- **Path params:** `sessionId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Get/create session share card.

#### `GET /api/share/tier-up/{tierId}`
- **Method:** `getTierUpCard()`
- **Auth:** `authenticated`
- **Path params:** `tierId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Get/create tier-up share card.

#### `GET /api/share/og/session/{sessionId}`
- **Method:** `ogSessionCard()`
- **Auth:** `PUBLIC`
- **Path params:** `sessionId: String`
- **Response:** `String` (HTML)
- **Purpose:** OG meta for session (bots) or redirect.

#### `GET /api/share/og/tier-up/{tierKey}`
- **Method:** `ogTierUpCard()`
- **Auth:** `PUBLIC`
- **Path params:** `tierKey: String`
- **Response:** `String` (HTML)
- **Purpose:** OG meta for tier-up.

#### `GET /api/share/og/daily`
- **Method:** `ogDailyChallenge()`
- **Auth:** `PUBLIC`
- **Response:** `String` (HTML)
- **Purpose:** OG meta for daily challenge.

#### `GET /api/share/render/session/{sessionId}`
- **Method:** `renderSessionCard()`
- **Auth:** `PUBLIC`
- **Path params:** `sessionId: String`
- **Response:** `String` (HTML)
- **Purpose:** Self-contained HTML of session share card.

#### `GET /api/share/render/tier-up/{tierKey}`
- **Method:** `renderTierUpCard()`
- **Auth:** `authenticated`
- **Path params:** `tierKey: String`
- **Response:** `String` (HTML)
- **Purpose:** Self-contained HTML of tier-up share card.

#### `POST /api/share/{id}/view`
- **Method:** `incrementViewCount()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `void`
- **Purpose:** Bump a share card's view counter.

---

## Domain: Question

### BookController
**Base path:** `/api`
**File:** `apps/api/src/main/java/com/biblequiz/api/BookController.java`
**Class-level auth:** `(none)`

#### `GET /api/books`
- **Method:** `getAllBooks()`
- **Auth:** `authenticated`
- **Response:** `List<Book>`
- **Purpose:** All Bible books.

#### `GET /api/books/{name}/structure`
- **Method:** `getBookStructure()`
- **Auth:** `authenticated`
- **Path params:** `name: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Canonical chapter/verse counts for a book.

---

### QuestionController
**Base path:** `/api`
**File:** `apps/api/src/main/java/com/biblequiz/api/QuestionController.java`
**Class-level auth:** `(none)`

#### `GET /api/questions`
- **Method:** `getQuestions()`
- **Auth:** `authenticated`
- **Query params:** `book: String?, difficulty: String?, language: String = "vi", chapterFrom: Integer?, chapterTo: Integer?, verseFrom: Integer?, verseTo: Integer?, limit: int = 10, excludeIds[]: List<String>?`
- **Response:** `List<Question>`
- **Purpose:** Random filtered questions.

#### `GET /api/questions/qotd`
- **Method:** `questionOfTheDay()`
- **Auth:** `authenticated`
- **Query params:** `language: String = "vi"`
- **Response:** `Map<String, Object>`
- **Purpose:** Question of the day.

---

### QuestionReviewController
**Base path:** `/api/admin/review`
**File:** `apps/api/src/main/java/com/biblequiz/api/QuestionReviewController.java`
**Class-level auth:** `hasAnyRole('ADMIN', 'CONTENT_MOD')`

#### `GET /api/admin/review/pending`
- **Method:** `listPending()`
- **Auth:** `hasAnyRole('ADMIN', 'CONTENT_MOD')`
- **Query params:** `page: int = 0, size: int = 20`
- **Response:** `Map<String, Object>`
- **Purpose:** PENDING questions not yet reviewed by current admin.

#### `GET /api/admin/review/stats`
- **Method:** `stats()`
- **Auth:** `hasAnyRole('ADMIN', 'CONTENT_MOD')`
- **Response:** `Map<String, Object>`
- **Purpose:** Personalized review stats.

#### `GET /api/admin/review/my-history`
- **Method:** `myHistory()`
- **Auth:** `hasAnyRole('ADMIN', 'CONTENT_MOD')`
- **Query params:** `page: int = 0, size: int = 20`
- **Response:** `Map<String, Object>`
- **Purpose:** Current admin's review history.

#### `POST /api/admin/review/{questionId}/approve`
- **Method:** `approve()`
- **Auth:** `hasAnyRole('ADMIN', 'CONTENT_MOD')`
- **Path params:** `questionId: String`
- **Request body:** `Map<String, String>` (optional `comment`)
- **Response:** `Map<String, Object>`
- **Purpose:** Approve a pending question (2-approval threshold).

#### `POST /api/admin/review/{questionId}/reject`
- **Method:** `reject()`
- **Auth:** `hasAnyRole('ADMIN', 'CONTENT_MOD')`
- **Path params:** `questionId: String`
- **Request body:** `Map<String, String>` (optional `comment`)
- **Response:** `Map<String, Object>`
- **Purpose:** Reject a pending question.

---

### QuestionSetController
**Base path:** `/api/question-sets`
**File:** `apps/api/src/main/java/com/biblequiz/api/QuestionSetController.java`
**Class-level auth:** `(none)`

#### `GET /api/question-sets`
- **Method:** `listMine()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** User's quiz sets.

#### `GET /api/question-sets/public`
- **Method:** `listPublic()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Public quiz sets.

#### `GET /api/question-sets/{id}`
- **Method:** `get()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Quiz set + items.

#### `POST /api/question-sets`
- **Method:** `create()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Create a new quiz set.

#### `POST /api/question-sets/{id}/items`
- **Method:** `addItem()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>` (`questionId`)
- **Response:** `Map<String, Object>`
- **Purpose:** Add a question to a set.

#### `POST /api/question-sets/{id}/share`
- **Method:** `share()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>` (`email`)
- **Response:** `Map<String, Object>`
- **Purpose:** Share/copy a set to another user.

#### `POST /api/question-sets/{id}/copy`
- **Method:** `copyPublic()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Copy a public set into user library.

#### `PUT /api/question-sets/{id}`
- **Method:** `update()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Update set name/description.

#### `PUT /api/question-sets/{id}/items`
- **Method:** `replaceItems()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>` (`questionIds`)
- **Response:** `Map<String, Object>`
- **Purpose:** Bulk replace/reorder items.

#### `PATCH /api/question-sets/{id}/visibility`
- **Method:** `setVisibility()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>` (`visibility`)
- **Response:** `Map<String, Object>`
- **Purpose:** Toggle PUBLIC/PRIVATE.

#### `DELETE /api/question-sets/{id}`
- **Method:** `delete()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Delete a set.

#### `DELETE /api/question-sets/{id}/items/{questionId}`
- **Method:** `removeItem()`
- **Auth:** `authenticated`
- **Path params:** `id: String, questionId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Remove a question from a set.

---

### UserQuestionController
**Base path:** `/api/user-questions`
**File:** `apps/api/src/main/java/com/biblequiz/api/UserQuestionController.java`
**Class-level auth:** `(none)`

#### `GET /api/user-questions`
- **Method:** `list()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** User's personal questions.

#### `GET /api/user-questions/room/{roomId}`
- **Method:** `getRoomQuestions()`
- **Auth:** `authenticated`
- **Path params:** `roomId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Questions assigned to a room.

#### `POST /api/user-questions`
- **Method:** `create()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Manually add a user question.

#### `POST /api/user-questions/generate`
- **Method:** `generate()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** AI-generate + save user questions.

#### `POST /api/user-questions/assign-to-room`
- **Method:** `assignToRoom()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, Object>` (`roomId`, `questionIds`)
- **Response:** `Map<String, Object>`
- **Purpose:** Bulk-assign user questions to a room.

#### `PUT /api/user-questions/{id}`
- **Method:** `update()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Edit a user question.

#### `DELETE /api/user-questions/{id}`
- **Method:** `delete()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Delete a user question.

#### `DELETE /api/user-questions/room/{roomId}/{questionId}`
- **Method:** `removeFromRoom()`
- **Auth:** `authenticated`
- **Path params:** `roomId: String, questionId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Remove a question from a room.

---

## Domain: Quiz

### BasicQuizController
**Base path:** `/api/basic-quiz`
**File:** `apps/api/src/main/java/com/biblequiz/api/BasicQuizController.java`
**Class-level auth:** `(none)`

#### `GET /api/basic-quiz/status`
- **Method:** `getStatus()`
- **Auth:** `authenticated`
- **Response:** `BasicQuizStatusResponse`
- **Purpose:** Passed flag + cooldown + attempts.

#### `GET /api/basic-quiz/questions`
- **Method:** `getQuestions()`
- **Auth:** `authenticated`
- **Query params:** `language: String = "vi"`
- **Response:** `List<BasicQuizQuestionResponse>`
- **Purpose:** 10 shuffled questions (no answers).

#### `POST /api/basic-quiz/submit`
- **Method:** `submit()`
- **Auth:** `authenticated`
- **Request body:** `BasicQuizSubmitRequest`
- **Response:** `BasicQuizResultResponse`
- **Purpose:** Score 10 answers + pass/fail + review.

---

### ChallengeController
**Base path:** `/api/challenges`
**File:** `apps/api/src/main/java/com/biblequiz/api/ChallengeController.java`
**Class-level auth:** `(none)`

#### `GET /api/challenges/pending`
- **Method:** `getPending()`
- **Auth:** `authenticated`
- **Response:** `List<Map<String, Object>>`
- **Purpose:** Pending challenges received.

#### `POST /api/challenges`
- **Method:** `createChallenge()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, String>` (`challengedUserId`)
- **Response:** `Map<String, Object>`
- **Purpose:** Send a challenge.

#### `POST /api/challenges/{id}/accept`
- **Method:** `accept()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, String>`
- **Purpose:** Accept a challenge.

#### `POST /api/challenges/{id}/decline`
- **Method:** `decline()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, String>`
- **Purpose:** Decline a challenge.

---

### DailyChallengeController
**Base path:** `/api/daily-challenge`
**File:** `apps/api/src/main/java/com/biblequiz/api/DailyChallengeController.java`
**Class-level auth:** `(none)`

#### `GET /api/daily-challenge`
- **Method:** `getDailyChallenge()`
- **Auth:** `PUBLIC` (guests allowed; user-aware extras)
- **Query params:** `language: String = "vi"`
- **Response:** `Map<String, Object>`
- **Purpose:** Today's 5 daily-challenge questions.

#### `GET /api/daily-challenge/result`
- **Method:** `getResult()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Post-completion result payload.

#### `GET /api/daily-challenge/history`
- **Method:** `getHistory()`
- **Auth:** `authenticated`
- **Query params:** `days: int = 30`
- **Response:** `List<Map<String, Object>>`
- **Purpose:** Per-day heatmap of completions.

#### `GET /api/daily-challenge/yesterday-summary`
- **Method:** `getYesterdaySummary()`
- **Auth:** `PUBLIC` (returns false for unauthenticated)
- **Response:** `Map<String, Object>`
- **Purpose:** Recap for State A hero card.

#### `POST /api/daily-challenge/start`
- **Method:** `startChallenge()`
- **Auth:** `PUBLIC`
- **Response:** `Map<String, Object>`
- **Purpose:** Begin a daily session (returns sessionId).

#### `POST /api/daily-challenge/answer`
- **Method:** `checkAnswer()`
- **Auth:** `PUBLIC`
- **Request body:** `Map<String, Object>` (`questionId`, `answer`)
- **Response:** `Map<String, Object>`
- **Purpose:** Check a single answer.

#### `POST /api/daily-challenge/complete`
- **Method:** `complete()`
- **Auth:** `authenticated`
- **Request body:** `CompleteDailyChallengeRequest`
- **Response:** `Map<String, Object>`
- **Purpose:** Persist completion (idempotent).

---

### ScheduledQuizController
**Base path:** `/api/groups/{groupId}/scheduled-quizzes`
**File:** `apps/api/src/main/java/com/biblequiz/api/ScheduledQuizController.java`
**Class-level auth:** `(none)`

#### `GET /api/groups/{groupId}/scheduled-quizzes`
- **Method:** `list()`
- **Auth:** `authenticated`
- **Path params:** `groupId: String`
- **Query params:** `status: String?`
- **Response:** `Map<String, Object>`
- **Purpose:** List scheduled quizzes (optional status filter).

#### `GET /api/groups/{groupId}/scheduled-quizzes/{quizId}`
- **Method:** `getDetail()`
- **Auth:** `authenticated`
- **Path params:** `groupId: String, quizId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Detail + viewer's own attempt summary.

#### `GET /api/groups/{groupId}/scheduled-quizzes/{quizId}/leaderboard`
- **Method:** `getLeaderboard()`
- **Auth:** `authenticated`
- **Path params:** `groupId: String, quizId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Live/frozen leaderboard for a scheduled quiz.

#### `POST /api/groups/{groupId}/scheduled-quizzes`
- **Method:** `create()`
- **Auth:** `authenticated` (leader/mod only)
- **Path params:** `groupId: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Create a scheduled quiz.

#### `POST /api/groups/{groupId}/scheduled-quizzes/{quizId}/start`
- **Method:** `startAttempt()`
- **Auth:** `authenticated`
- **Path params:** `groupId: String, quizId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Start an attempt (returns ordered questions).

#### `POST /api/groups/{groupId}/scheduled-quizzes/{quizId}/submit`
- **Method:** `submitAttempt()`
- **Auth:** `authenticated`
- **Path params:** `groupId: String, quizId: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Submit answers + timeSeconds.

#### `DELETE /api/groups/{groupId}/scheduled-quizzes/{quizId}`
- **Method:** `cancel()`
- **Auth:** `authenticated` (leader/mod only)
- **Path params:** `groupId: String, quizId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Cancel an active scheduled quiz.

---

### VarietyQuizController
**Base path:** `/api/quiz`
**File:** `apps/api/src/main/java/com/biblequiz/api/VarietyQuizController.java`
**Class-level auth:** `(none)`

#### `GET /api/quiz/weekly`
- **Method:** `getWeeklyQuiz()`
- **Auth:** `authenticated`
- **Query params:** `language: String = "vi"`
- **Response:** `Map<String, Object>`
- **Purpose:** Weekly themed quiz + questions.

#### `GET /api/quiz/weekly/theme`
- **Method:** `getWeeklyTheme()`
- **Auth:** `PUBLIC`
- **Query params:** `language: String = "vi"`
- **Response:** `Map<String, Object>`
- **Purpose:** Weekly theme metadata only.

#### `GET /api/quiz/speed-round`
- **Method:** `getSpeedRound()`
- **Auth:** `authenticated`
- **Query params:** `language: String = "vi"`
- **Response:** `Map<String, Object>`
- **Purpose:** 10 easy questions with 10s timer.

#### `GET /api/quiz/daily-bonus`
- **Method:** `getDailyBonus()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Per-user/day random bonus.

#### `GET /api/quiz/seasonal`
- **Method:** `getSeasonalContent()`
- **Auth:** `PUBLIC`
- **Query params:** `language: String = "vi"`
- **Response:** `Map<String, Object>`
- **Purpose:** Christmas / Easter / normal seasonal info.

#### `POST /api/quiz/mystery`
- **Method:** `startMysteryQuiz()`
- **Auth:** `authenticated`
- **Query params:** `language: String = "vi"`
- **Response:** `Map<String, Object>`
- **Purpose:** Random 10 questions across all books/difficulties.

---

## Domain: Ranked

### LeaderboardController
**Base path:** `/api/leaderboard`
**File:** `apps/api/src/main/java/com/biblequiz/api/LeaderboardController.java`
**Class-level auth:** `(none)`

#### `GET /api/leaderboard/daily`
- **Method:** `daily()`
- **Auth:** `PUBLIC`
- **Query params:** `date: LocalDate?, page: int = 0, size: int = 20`
- **Response:** `List<Map<String, Object>>`
- **Purpose:** Daily leaderboard.

#### `GET /api/leaderboard/weekly`
- **Method:** `weekly()`
- **Auth:** `PUBLIC`
- **Query params:** `page: int = 0, size: int = 20`
- **Response:** `List<Map<String, Object>>`
- **Purpose:** Weekly leaderboard (last 7 days).

#### `GET /api/leaderboard/monthly`
- **Method:** `monthly()`
- **Auth:** `PUBLIC`
- **Query params:** `page: int = 0, size: int = 20`
- **Response:** `List<Map<String, Object>>`
- **Purpose:** Monthly leaderboard.

#### `GET /api/leaderboard/all-time`
- **Method:** `allTime()`
- **Auth:** `PUBLIC`
- **Query params:** `page: int = 0, size: int = 20`
- **Response:** `List<Map<String, Object>>`
- **Purpose:** All-time leaderboard.

#### `GET /api/leaderboard/season`
- **Method:** `season()`
- **Auth:** `PUBLIC`
- **Query params:** `page: int = 0, size: int = 20`
- **Response:** `List<Map<String, Object>>`
- **Purpose:** Active-season leaderboard.

#### `GET /api/leaderboard/daily/my-rank`
- **Method:** `getMyDailyRank()`
- **Auth:** `authenticated`
- **Query params:** `date: LocalDate?`
- **Response:** `Map<String, Object>`
- **Purpose:** Caller's daily rank.

#### `GET /api/leaderboard/weekly/my-rank`
- **Method:** `getMyWeeklyRank()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Caller's weekly rank.

#### `GET /api/leaderboard/monthly/my-rank`
- **Method:** `getMyMonthlyRank()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Caller's monthly rank.

#### `GET /api/leaderboard/season/my-rank`
- **Method:** `getMySeasonRank()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Caller's season rank.

#### `GET /api/leaderboard/all-time/my-rank`
- **Method:** `getMyAllTimeRank()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Caller's all-time rank.

---

### RankedController
**Base path:** `/api`
**File:** `apps/api/src/main/java/com/biblequiz/api/RankedController.java`
**Class-level auth:** `(none)`

#### `GET /api/me/ranked-status`
- **Method:** `getRankedStatus()`
- **Auth:** `PUBLIC` (returns enriched data when authenticated)
- **Response:** `Map<String, Object>`
- **Purpose:** Today's ranked progress, energy, daily caps, season placement.

#### `GET /api/me/tier`
- **Method:** `getMyTier()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Current tier + next tier progress.

#### `GET /api/me/game-modes`
- **Method:** `getGameModes()`
- **Auth:** `authenticated`
- **Response:** `List<?>`
- **Purpose:** Unlocked game modes for user's tier.

#### `POST /api/ranked/sessions`
- **Method:** `startRankedSession()`
- **Auth:** `PUBLIC` (enriches when authenticated)
- **Response:** `Map<String, Object>`
- **Purpose:** Start a ranked session.

#### `POST /api/ranked/sessions/{id}/answer`
- **Method:** `submitRankedAnswer()`
- **Auth:** `PUBLIC` (server-side enriched when authenticated)
- **Path params:** `id: String`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Submit a ranked answer (energy, tier, surge, achievements).

#### `POST /api/ranked/sync-progress`
- **Method:** `syncProgress()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Sync today's ranked progress with DB.

---

### SeasonController
**Base path:** `/api/seasons`
**File:** `apps/api/src/main/java/com/biblequiz/api/SeasonController.java`
**Class-level auth:** `(none)`

#### `GET /api/seasons`
- **Method:** `listSeasons()`
- **Auth:** `PUBLIC`
- **Response:** `List<Map<String, Object>>`
- **Purpose:** All seasons newest start-date first.

#### `GET /api/seasons/active`
- **Method:** `getActiveSeason()`
- **Auth:** `PUBLIC`
- **Response:** `Map<String, Object>`
- **Purpose:** Current active season (or `active=false`).

#### `GET /api/seasons/{seasonId}/leaderboard`
- **Method:** `seasonLeaderboard()`
- **Auth:** `PUBLIC`
- **Path params:** `seasonId: String`
- **Query params:** `page: int = 0, size: int = 20`
- **Response:** `List<Map<String, Object>>`
- **Purpose:** Season leaderboard.

#### `GET /api/seasons/{seasonId}/my-rank`
- **Method:** `mySeasonRank()`
- **Auth:** `authenticated`
- **Path params:** `seasonId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Caller's rank in a specific season.

---

### TournamentController
**Base path:** `/api/tournaments`
**File:** `apps/api/src/main/java/com/biblequiz/api/TournamentController.java`
**Class-level auth:** `(none)`

#### `GET /api/tournaments/upcoming`
- **Method:** `getUpcoming()`
- **Auth:** `PUBLIC`
- **Response:** `Map<String, Object>`
- **Purpose:** Count + first lobby tournament for Home hint.

#### `GET /api/tournaments/{id}`
- **Method:** `getTournament()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Tournament metadata.

#### `GET /api/tournaments/{id}/bracket`
- **Method:** `getBracket()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Tournament bracket snapshot.

#### `POST /api/tournaments`
- **Method:** `createTournament()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, Object>`
- **Response:** `Map<String, Object>`
- **Purpose:** Create a tournament.

#### `POST /api/tournaments/{id}/join`
- **Method:** `joinTournament()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Join a tournament.

#### `POST /api/tournaments/{id}/start`
- **Method:** `startTournament()`
- **Auth:** `authenticated`
- **Path params:** `id: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Start a tournament.

#### `POST /api/tournaments/{id}/matches/{matchId}/forfeit`
- **Method:** `forfeitMatch()`
- **Auth:** `authenticated`
- **Path params:** `id: String, matchId: String`
- **Response:** `Map<String, Object>`
- **Purpose:** Forfeit a match.

---

## Domain: User

### AchievementController
**Base path:** `/api/achievements`
**File:** `apps/api/src/main/java/com/biblequiz/api/AchievementController.java`
**Class-level auth:** `(none)`

#### `GET /api/achievements/me`
- **Method:** `myAchievements()`
- **Auth:** `PUBLIC` (returns `[]` if unauthenticated)
- **Response:** `List<Map<String, Object>>`
- **Purpose:** Achievement progress list for current user.

---

### UserController
**Base path:** `/me`, `/api/me`
**File:** `apps/api/src/main/java/com/biblequiz/api/UserController.java`
**Class-level auth:** `(none)`

#### `GET /me`, `GET /api/me`
- **Method:** `getCurrentUser()`
- **Auth:** `authenticated`
- **Response:** `UserResponse`
- **Purpose:** Current user's profile.

#### `GET /me/history`, `GET /api/me/history`
- **Method:** `getHistory()`
- **Auth:** `authenticated`
- **Query params:** `limit: int = 20, page: int = 0, mode: String?`
- **Response:** `Map<String, Object>`
- **Purpose:** Paginated session history.

#### `GET /me/journey`, `GET /api/me/journey`
- **Method:** `getJourney()`
- **Auth:** `authenticated`
- **Query params:** `language: String = "vi"`
- **Response:** `Map<String, Object>`
- **Purpose:** Bible-mastery journey overview.

#### `GET /me/question-coverage`, `GET /api/me/question-coverage`
- **Method:** `getQuestionCoverage()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Per-book coverage + mastery + review counts.

#### `GET /me/tier-progress`, `GET /api/me/tier-progress`
- **Method:** `getTierProgress()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Tier + star + surge info.

#### `GET /me/daily-missions`, `GET /api/me/daily-missions`
- **Method:** `getDailyMissions()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Today's daily missions.

#### `GET /me/comeback-status`, `GET /api/me/comeback-status`
- **Method:** `getComebackStatus()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Comeback reward status.

#### `GET /me/cosmetics`, `GET /api/me/cosmetics`
- **Method:** `getCosmetics()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Available + active cosmetics.

#### `GET /me/prestige-status`, `GET /api/me/prestige-status`
- **Method:** `getPrestigeStatus()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Prestige eligibility info.

#### `GET /me/weaknesses`, `GET /api/me/weaknesses`
- **Method:** `getWeaknesses()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Weak/strong book recommendations.

#### `POST /me/promote-admin`, `POST /api/me/promote-admin`
- **Method:** `promoteToAdmin()`
- **Auth:** `hasRole('ADMIN')`
- **Request body:** `PromoteAdminRequest`
- **Response:** `Map<String, Object>`
- **Purpose:** Promote a user to ADMIN.

#### `POST /me/bootstrap-admin`, `POST /api/me/bootstrap-admin`
- **Method:** `bootstrapAdmin()`
- **Auth:** `PUBLIC` (only succeeds when no admin exists) 🔒 MISSING_AUTH (bootstrap endpoint — intentional but worth flagging)
- **Request body:** `Map<String, String>` (`email`)
- **Response:** `Map<String, Object>`
- **Purpose:** Bootstrap the first admin user.

#### `POST /me/comeback-claim`, `POST /api/me/comeback-claim`
- **Method:** `claimComeback()`
- **Auth:** `authenticated`
- **Response:** `Map<String, Object>`
- **Purpose:** Claim a comeback reward.

#### `POST /me/prestige`, `POST /api/me/prestige`
- **Method:** `executePrestige()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, Object>` (`confirm`)
- **Response:** `Map<String, Object>`
- **Purpose:** Execute prestige reset.

#### `PATCH /me`, `PATCH /api/me`
- **Method:** `updateCurrentUser()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, String>`
- **Response:** `Map<String, Object>`
- **Purpose:** Update name/avatar.

#### `PATCH /me/cosmetics`, `PATCH /api/me/cosmetics`
- **Method:** `updateCosmetics()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, String>`
- **Response:** `Map<String, Object>`
- **Purpose:** Set active frame/theme.

#### `DELETE /me/account`, `DELETE /api/me/account`
- **Method:** `deleteAccount()`
- **Auth:** `authenticated`
- **Request body:** `Map<String, String>` (`confirmPhrase`)
- **Response:** `Map<String, Object>`
- **Purpose:** Self-delete account.

---

## Summary
- Total endpoints: 232
- Total controllers: 40
- By HTTP method: GET=104, POST=85, PUT=6, PATCH=22, DELETE=15
- Flagged duplicates: none (note: `UserController` is dual-mapped to both `/me` and `/api/me` via class-level `@RequestMapping({"/me","/api/me"})` — these are intentional aliases, not duplicates across controllers)
- Flagged missing auth (🔒): none on `/api/admin/**` — every `/api/admin/**` controller has a class-level `@PreAuthorize` or `@PreAuthorize` at the method level. (`/api/me/bootstrap-admin` is intentionally public-but-self-locking and was flagged inline for awareness, but is not under `/api/admin/**`.)

### Notes / observations
- `RankedController.submitRankedAnswer` is declared with `@RequestMapping(value = "/ranked/sessions/{id}/answer", method = RequestMethod.POST)` — equivalent to `@PostMapping`.
- `RankedController`, `DailyChallengeController`, and `LeaderboardController` accept unauthenticated calls but enrich responses when an Authentication is present (marked `PUBLIC`).
- `AdminTestController` and `TestDataSeedController` are profile-gated (`dev/staging/docker` and `!prod` respectively) — they will not be exposed in production builds.
- `UserController` is dual-mapped to both `/me` and `/api/me`; both URL prefixes are live for every method.
- `TestController` (`/test/oauth2`) and `SimpleTestController` (`/simple/test`) live under `com.biblequiz.infrastructure.auth` — kept here under DevTest as instructed.
- `QuestionSetController.copyPublic` and `QuestionSetController.share` both POST under `/api/question-sets/{id}/...` — distinct paths (`/copy`, `/share`), no collision.
- `FeedbackController` has no class-level `@RequestMapping`; method-level paths absolute (`/api/feedback`, `/api/admin/feedback`).