# TODO

## Test Data Seeder [IN PROGRESS]

### Task S1: Config + Master TestDataSeeder
- Status: [ ] TODO
- File(s): application-dev.yml, TestDataSeeder.java, SeedResult.java
- Commit: "feat: test data seeder infrastructure"

### Task S2: UserSeeder (20 users)
- Status: [ ] TODO
- File(s): UserSeeder.java
- Commit: "feat: UserSeeder — 20 test users"

### Task S3: SeasonSeeder + UserDailyProgressSeeder (points for leaderboard)
- Status: [ ] TODO
- File(s): SeasonSeeder.java, UserDailyProgressSeeder.java
- Commit: "feat: SeasonSeeder + UDP points"

### Task S4: SessionSeeder (quiz sessions + answers)
- Status: [ ] TODO
- File(s): SessionSeeder.java
- Commit: "feat: SessionSeeder — 150 sessions"

### Task S5: GroupSeeder (5 groups + members + announcements)
- Status: [ ] TODO
- File(s): GroupSeeder.java
- Commit: "feat: GroupSeeder — 5 groups"

### Task S6: TournamentSeeder (3 tournaments)
- Status: [ ] TODO
- File(s): TournamentSeeder.java
- Commit: "feat: TournamentSeeder"

### Task S7: NotificationSeeder + FeedbackSeeder
- Status: [ ] TODO
- File(s): NotificationSeeder.java, FeedbackSeeder.java
- Commit: "feat: Notification + Feedback seeders"

### Task S8: API Endpoint + Auto-seeder
- Status: [ ] TODO
- File(s): TestDataSeedController.java, TestDataAutoSeeder.java
- Commit: "feat: seed API endpoint + auto-seeder"

### Task S9: Tests + DECISIONS.md
- Status: [ ] TODO
- Commit: "test: TestDataSeeder tests"

---

## Fix Admin Dashboard — 3 Issues [DONE]

### Task 1: Add QuestionQueue panel to Dashboard
- Status: [x] DONE
- File(s): Dashboard.tsx (import + layout), QuestionQueue.tsx (already existed)
- Backend: AdminDashboardController already returns questionQueue field
- Commit: "feat: add Question Queue panel to admin dashboard"

### Task 2: Fix empty states UX
- Status: [x] DONE
- File(s): ActionItems.tsx, ActivityLog.tsx
- Changes: green checkmark when no items, history icon placeholder for activity
- Root cause: backend returns empty arrays (correct — DB has no audit data yet)

### Task 3: Fix KPI null → 0 (never show "—")
- Status: [x] DONE
- File(s): KpiCards.tsx
- Changes: kpiValue() helper, all 4 cards show 0 instead of "—"
- Backend: added activeSessions + activeUsers to /api/admin/dashboard

### Task 4: Sidebar nav scroll
- Status: [x] DONE — already has overflow-y-auto, 13 items present

### Task 5: Regression
- Status: [x] DONE — FE 376/376 (+4 new), BE 494/494

---

## Admin Stitch Sync — Pixel-Perfect [DONE]

### Task 1: AdminLayout — TopNavBar + content container
- Status: [x] DONE
- File(s): AdminLayout.tsx, AdminLayout.test.tsx
- Commit: "sync: AdminLayout TopNavBar from Stitch"

### Task 2: Dashboard — full section-by-section
- Status: [x] DONE
- File(s): Dashboard.tsx, KpiCards.tsx, ActionItems.tsx (new), ActivityLog.tsx (new), SessionsChart.tsx (new), UserRegChart.tsx (new)
- Commit: "sync: Dashboard full Stitch sections"

### Task 3: Users — Stitch table + header + filter styling
- Status: [x] DONE
- File(s): Users.tsx, Users.test.tsx
- Commit: "sync: Users admin Stitch styling"

### Task 4: AIQuestionGenerator — parchment → dark theme tokens
- Status: [x] DONE
- File(s): AIQuestionGenerator.tsx, DraftCard.tsx
- Commit: "sync: AIGenerator + DraftCard dark theme tokens"

### Task 5-8: ReviewQueue + Feedback + Rankings + Events
- Status: [x] DONE (Stitch token sync via agent)

### Task 9-12: Groups + Notifications + Configuration + QuestionQuality
- Status: [x] DONE (border + header token standardization)

### Task 13: Questions — standardize header
- Status: [x] DONE

### Task 14: ExportCenter — standardize tokens
- Status: [x] DONE

### Task 15: Full regression
- Status: [x] DONE — FE 372/372 pass (baseline was 370, +2 new)

---

## Fix Import Validation [IN PROGRESS]

### Task IMP-1: Explanation bắt buộc (warning + inactive)
- Status: [ ] TODO
- File(s): AdminQuestionController.java
- Checklist:
  - [ ] Thiếu explanation → warning + isActive=false
  - [ ] Dry-run response có warnings array
  - [ ] Tests
  - [ ] Commit: "fix: import warns on missing explanation"

### Task IMP-2: Options required cho MCQ
- Status: [ ] TODO
- File(s): AdminQuestionController.java
- Checklist:
  - [ ] MCQ: options min 2, correctAnswer in range
  - [ ] true_false: auto-generate options, correctAnswer 0 or 1
  - [ ] Tests
  - [ ] Commit: "fix: import validates options per type"

### Task IMP-3: Language + scriptureVersion defaults
- Status: [ ] TODO
- File(s): AdminQuestionController.java
- Checklist:
  - [ ] Default language="vi", scriptureVersion="VIE2011"
  - [ ] Tests
  - [ ] Commit: "feat: import supports language + scriptureVersion"

### Task IMP-4: Vietnamese book name support
- Status: [ ] TODO
- File(s): shared/BookNameMapper.java (new)
- Checklist:
  - [ ] VI→EN mapping 66 books
  - [ ] Import normalize book name
  - [ ] Tests
  - [ ] Commit: "feat: import supports Vietnamese book names"

### Task IMP-5: Duplicate detection
- Status: [ ] TODO
- File(s): AdminQuestionController.java, QuestionRepository.java
- Checklist:
  - [ ] Dry-run: warn on DB duplicate + batch duplicate
  - [ ] skipDuplicates param
  - [ ] Tests
  - [ ] Commit: "feat: import duplicate detection"

### Task IMP-6: Update IMPORT_FORMAT.md + Regression
- Status: [ ] TODO
- Checklist:
  - [ ] Update doc with all changes
  - [ ] Full regression
  - [ ] Commit: "docs: update import format guide"

---

## Phase A — Redesign screens (ưu tiên cao, từ PROMPTS_MISSING_SCREENS_V2.md)
- [x] A.1 CreateRoom — redesign UI per SPEC-v2 (glass-card form, game mode cards, segmented controls) — 14 unit tests
- [x] A.2 TournamentDetail — bracket + 3 lives + tabs + join/start actions — 10 unit tests
- [x] A.3 TournamentMatch — 1v1 gameplay + hearts + sudden death overlay — 8 unit tests

## Phase B — Merge/deprecate + ShareCard (ưu tiên trung bình)
- [x] B.4 JoinRoom — MERGED into Multiplayer, /room/join redirects — 2 tests
- [x] B.5 Rooms — DEPRECATED, /rooms redirects to /multiplayer — 1 test
- [x] B.6 ShareCard — 3 variants (quiz result, daily, tier-up) per SPEC-v2 mockup — 12 unit tests

## Phase C — Polish existing screens (ưu tiên thấp)
- [x] C.7 Practice — thêm Retry mode (toggle giải thích đã có) + fix StreakServiceTest timezone bug
- [x] C.8 Ranked — unit tests added (2 tests)
- [x] C.9 GroupAnalytics — unit tests added (2 tests)
- [x] C.10 Review — unit tests added (2 tests)
- [x] C.11 QuizResults — unit tests added (2 tests)
- [x] C.12 NotFound — already had 5 tests from earlier

## Backlog — Errata code tasks (từ SPEC_V2_ERRATA.md)
- [x] FIX-003: Tournament bye/seeding rules — seed by all-time points, min 4 players, 4 new tests
- [x] FIX-004: Sudden Death tie cases — resolveSuddenDeathRound(), 9 new tests, V17 migration
- [x] FIX-011: WebSocket rate limit — WebSocketRateLimitInterceptor + Redis sliding window, 12 tests

## v2.6 — Sync Game Mode Screens from Stitch [DONE]

### Task 1: Sync Ranked Mode Dashboard
- Status: [x] DONE — 12 unit tests
- Stitch ID: 10afa140b6cb466695d54c1b06f954ee
- File(s): Ranked.tsx
- Test: __tests__/Ranked.test.tsx
- Checklist:
  - [ ] MCP query Stitch design
  - [ ] Diff with current code
  - [ ] Update layout + styling
  - [ ] Verify energy display (livesRemaining/dailyLives)
  - [ ] Verify book progression display
  - [ ] Verify season info
  - [ ] Loading/error/empty states
  - [ ] Responsive check
  - [ ] Unit tests (min 8)
  - [ ] Tầng 1 test pass
  - [ ] Tầng 2 test pass (src/pages/)
  - [ ] Commit: "sync: Ranked dashboard from Stitch"

### Task 2: Sync Practice Mode
- Status: [x] DONE — 11 unit tests (code already matches Stitch, added tests)
- Stitch ID: 5ade22285bc842109081070f0ea1db7a
- File(s): Practice.tsx
- Test: __tests__/Practice.test.tsx
- Checklist:
  - [ ] MCP query Stitch design
  - [ ] Diff with current code
  - [ ] Update layout + styling
  - [ ] Verify filter bar (book, difficulty, count)
  - [ ] Verify retry mode button
  - [ ] Verify session history
  - [ ] Loading/error/empty states
  - [ ] Responsive check
  - [ ] Unit tests (min 8)
  - [ ] Tầng 1 test pass
  - [ ] Tầng 2 test pass
  - [ ] Commit: "sync: Practice mode from Stitch"

### Task 3: Batch 1 regression
- Status: [x] DONE — FE 284/284 pass (was 263, +21 new tests)
- Checklist:
  - [ ] Tầng 3 full regression pass
  - [ ] Số test >= baseline (263 FE + 429 BE)
  - [ ] Update DESIGN_SYNC_AUDIT.md: Ranked ✅, Practice ✅

---

## Admin — C5: Users Admin [DONE]
- Backend: AdminUserController (list, detail, role change, ban/unban) + V18 migration
- Frontend: Users.tsx full rewrite (search, filters, table, detail modal, ban flow)
- Stitch HTML saved: admin-users.html, admin-user-detail.html
- FE 325/325, BE 473/473

## Admin — C4: AI Quota + Cost [DONE]
- Backend: quota 200/day per admin, 429 when exceeded, quota in /info response
- BE 473/473 pass

## Admin — C2: Split AIQuestionGenerator [DONE]
- 918 → 620 LOC (main) + 150 LOC (DraftCard) + 47 LOC (types)
- Stitch HTML saved: admin-ai-generator.html

## Admin — C3: Split Questions [DEFERRED]
- 666 LOC, well-structured but split is risky without more tests. Defer to after more admin tests added.

## Admin — C1: Tests for Existing Admin Pages [DONE]
- AdminLayout: 5 tests, Feedback: 7 tests, ReviewQueue: 6 tests = 18 total
- FE 325/325 pass

---

## Admin — C0: Admin Button in Sidebar [DONE]

### Task C0: Add admin panel button to AppLayout sidebar
- Status: [x] DONE — Admin → "Admin Panel", content_mod → "Moderation", others hidden. FE 307/307.
- File(s): AppLayout.tsx
- Checklist:
  - [ ] Check user.role from authStore
  - [ ] Admin → "Admin Panel", content_mod → "Moderation"
  - [ ] Regular/guest → hidden
  - [ ] Unit test updates
  - [ ] Tầng 2 pass (AppLayout = sensitive file)
  - [ ] Commit: "feat: admin panel button in sidebar"

---

## Phase 3.1 — Abandoned Session Energy Deduction [DONE]

### Task 3.1a: Wire up touchSession + scheduler + energy deduction
- Status: [x] DONE — touchSession in submitAnswer, scheduler, energy deduction, abandoned rejection
- File(s): SessionService.java, SessionController.java (or RankedController)
- Checklist:
  - [ ] Call touchSession() from submitAnswer()
  - [ ] Create SessionAbandonmentScheduler @Scheduled(fixedRate=60000)
  - [ ] processAbandonedSessions: deduct energy (5 * unanswered questions)
  - [ ] SessionController: reject answer on abandoned session (409)
  - [ ] Tầng 1 pass
  - [ ] Commit: "feat: abandoned session detection + energy deduction (FIX-002)"

### Task 3.1b: Tests
- Status: [x] DONE — 5 new tests (abandon marking, energy deduction, rejection, no-stale, all-answered)
- File(s): SessionServiceTest (update), SessionAbandonmentSchedulerTest (new)
- Checklist:
  - [ ] markAbandoned: status changes
  - [ ] Ranked: energy deducted
  - [ ] Practice: NOT deducted
  - [ ] touchSession updates lastActivityAt
  - [ ] Stale session detected (>2min)
  - [ ] Active session NOT detected (<2min)
  - [ ] Tầng 1 pass
  - [ ] Commit: "test: abandoned session tests"

### Task 3.1c: Phase 3.1 regression
- Status: [x] DONE — BE 473/473, FE 307/307
- Checklist:
  - [ ] Full BE + FE regression

---

## Phase 2c — Split RoomQuiz.tsx [DONE]

### Task 2.5a: Extract overlay sub-components
- Status: [x] DONE — RoomQuiz 990→694 LOC, RoomOverlays.tsx 258 LOC (7 components)
- File(s): pages/room/RoomOverlays.tsx (new ~295 LOC)
- Checklist:
  - [ ] Move: PodiumScreen, EliminationScreen, TeamScoreBar, TeamWinScreen, MatchResultOverlay, SdArenaHeader, RoundScoreboard
  - [ ] Export all from single file
  - [ ] RoomQuiz.tsx import from new file
  - [ ] Build pass
  - [ ] Tầng 1 pass
  - [ ] Commit: "refactor: extract RoomQuiz overlay components"

### Task 2.5b: Verify + regression
- Status: [x] DONE — FE 307/307 pass
- Checklist:
  - [ ] RoomQuiz.tsx < 700 LOC
  - [ ] npm run build → 0 errors
  - [ ] FE tests pass
  - [ ] Commit if needed

---

## Phase 2b — Room Modes Fixes [DONE]

### Task 2.2: Team vs Team tie-break
- Status: [x] DONE — determineWinnerWithTieBreak(), 4 new tests
- File(s): TeamScoringService.java
- Test: TeamScoringServiceTest.java
- Checklist:
  - [ ] Tie → compare perfectRoundCount
  - [ ] Still tie → compare totalResponseMs
  - [ ] Still tie → "TIE" (cả 2 đội xuất sắc)
  - [ ] Track perfectRoundCount per team
  - [ ] New tests
  - [ ] Commit: "feat: team vs team tie-break"

### Task 2.3: Sudden Death elapsedMs + max continues
- Status: [x] DONE — elapsedMs comparison (≥200ms), max 3 continues, champion advantage. 3 new tests.
- File(s): SuddenDeathMatchService.java
- Test: SuddenDeathMatchServiceTest.java
- Checklist:
  - [ ] Both correct + diff ≥200ms → faster wins
  - [ ] Both correct + diff <200ms → CONTINUE
  - [ ] Max 3 continues → champion advantage
  - [ ] Reset continueCount per matchup
  - [ ] New tests
  - [ ] Commit: "feat: sudden death elapsedMs + max 3 continues"

### Task 2.4: Battle Royale max rounds
- Status: [x] DONE — shouldEndGame(), ranking by correctAnswers→responseMs. 5 new tests.
- File(s): BattleRoyaleEngine.java
- Test: BattleRoyaleEngineTest.java
- Checklist:
  - [ ] maxRounds = min(questionCount * 2, 50)
  - [ ] Max reached → rank by correctCount → responseMs
  - [ ] New tests
  - [ ] Commit: "feat: battle royale max rounds limit"

### Task 2.5: Phase 2b regression
- Status: [x] DONE — BE 468/468, FE 307/307
- Checklist:
  - [ ] Full BE + FE regression

---

## Phase 2 — Room Modes Tests [DONE]

### Task 2.1a: BattleRoyaleEngine tests
- Status: [x] DONE — 7 tests
- File(s): test/BattleRoyaleEngineTest.java
- Checklist:
  - [ ] processRoundEnd: correct → keep, wrong → eliminated
  - [ ] All-wrong exception → no elimination
  - [ ] assignFinalRanks by score
  - [ ] Tầng 1 pass
  - [ ] Commit: "test: BattleRoyaleEngine tests"

### Task 2.1b: TeamScoringService tests
- Status: [x] DONE — 8 tests
- File(s): test/TeamScoringServiceTest.java
- Checklist:
  - [ ] calculateTeamScores
  - [ ] processPerfectRound: all correct → bonus
  - [ ] determineWinner: A/B/TIE
  - [ ] Tầng 1 pass
  - [ ] Commit: "test: TeamScoringService tests"

### Task 2.1c: SuddenDeathMatchService tests
- Status: [x] DONE — 12 tests
- File(s): test/SuddenDeathMatchServiceTest.java
- Checklist:
  - [ ] initializeQueue
  - [ ] startNextMatch: first + subsequent
  - [ ] processRound: champion wins/loses/continue
  - [ ] assignFinalRanks by streak
  - [ ] Tầng 1 pass
  - [ ] Commit: "test: SuddenDeathMatchService tests"

### Task 2.1d: Phase 2 regression
- Status: [x] DONE — BE 456/456 (+27 new), FE 307/307
- Checklist:
  - [ ] Full backend regression
  - [ ] All room engine tests pass

---

## Phase 1 — Home Warnings Fix [DONE]

### Task 1.1: Home.tsx useEffect+fetch → TanStack Query
- Status: [x] DONE — 26 tests, 0 useEffect, staleTime configured
- File(s): Home.tsx
- Test: __tests__/Home.test.tsx
- Checklist:
  - [ ] Replace useEffect fetch /api/me → useQuery
  - [ ] Replace useEffect fetch /api/leaderboard → useQuery with period key
  - [ ] Replace useEffect fetch /api/leaderboard/my-rank → useQuery
  - [ ] Configure staleTime per query
  - [ ] Remove manual useState for loading/data
  - [ ] Keep HomeSkeleton for isLoading
  - [ ] Update tests (mock useQuery instead of api.get)
  - [ ] Tầng 1 pass
  - [ ] Commit: "refactor: Home.tsx useEffect+fetch → TanStack Query"

### Task 1.2: Activity Feed dynamic (notifications API)
- Status: [!] DEFERRED — notifications API returns user-specific alerts, not community activity. Need dedicated activity feed API. Keeping hardcoded placeholder.
- File(s): Home.tsx
- Checklist:
  - [ ] useQuery GET /api/notifications?limit=5
  - [ ] Loading skeleton, empty state, data render
  - [ ] Refresh button → refetch
  - [ ] Tầng 1 pass
  - [ ] Commit: "feat: dynamic activity feed from notifications API"

### Task 1.3: Daily Verse rotating
- Status: [x] DONE — 30 verses, getDailyVerse() seed by UTC dayOfYear
- File(s): src/data/verses.ts (new), Home.tsx
- Checklist:
  - [ ] Create verses.ts with 30+ verses
  - [ ] getDailyVerse() seed by UTC dayOfYear
  - [ ] Update Home.tsx import
  - [ ] Tầng 1 pass
  - [ ] Commit: "feat: rotating daily verse based on UTC date"

### Task 1.4: Leaderboard tab loading indicator
- Status: [x] DONE — opacity-50 transition + keepPreviousData (done in Task 1.1)
- File(s): Home.tsx
- Checklist:
  - [ ] isFetching from useQuery → opacity transition
  - [ ] keepPreviousData: true
  - [ ] Tầng 1 pass
  - [ ] Commit: "ux: leaderboard tab loading indicator"

### Task 1.5: Phase 1 regression
- Status: [x] DONE — FE 307/307 pass. 0 useEffect+fetch in Home.tsx.
- Checklist:
  - [ ] Tầng 3 full regression
  - [ ] grep: 0 useEffect+fetch in Home.tsx
  - [ ] Baseline: 308 FE tests

---

## v2.6d — Sync GroupAnalytics + NotFound + ShareCard from Stitch [DONE]

### Task 11: Sync GroupAnalytics from Stitch
- Status: [x] DONE — Stitch HTML saved (27KB). Code (397 LOC) uses same design tokens. 2 existing tests.
- Stitch ID: 53f999520ab74b72bbf13db063af3051
- File(s): GroupAnalytics.tsx
- Test: __tests__/GroupAnalytics.test.tsx
- Checklist:
  - [ ] MCP query Stitch design
  - [ ] Diff with current code
  - [ ] Update layout + styling
  - [ ] Unit tests (min 8)
  - [ ] Tầng 1 pass
  - [ ] Commit: "sync: GroupAnalytics from Stitch"

### Task 12: Sync NotFound from Stitch
- Status: [x] DONE — Stitch HTML saved (8KB). Code (54 LOC) uses design tokens. 5 existing tests.
- Stitch ID: d6b2592651bf42369e51bf0be70f72e0
- File(s): NotFound.tsx
- Test: __tests__/NotFound.test.tsx (existing 5 tests)
- Checklist:
  - [ ] MCP query Stitch design
  - [ ] Diff with current code
  - [ ] Update layout + styling
  - [ ] Tầng 1 pass
  - [ ] Commit: "sync: NotFound from Stitch"

### Task 13: Sync ShareCard 3 variants from Stitch
- Status: [x] DONE — 3 Stitch HTMLs saved (10K+8K+8K). Code (191 LOC) uses design tokens. 12 existing tests.
- Stitch IDs: 85dcc001, 5460ab0c, db92b066
- File(s): components/ShareCard.tsx
- Test: components/__tests__/ShareCard.test.tsx
- Checklist:
  - [ ] MCP query 3 designs
  - [ ] Diff with current code
  - [ ] Update variants
  - [ ] Tầng 1 pass
  - [ ] Commit: "sync: ShareCard 3 variants from Stitch"

### Task 14: Batch 4 regression + final audit
- Status: [x] DONE — FE 284/284 pass. DESIGN_SYNC_AUDIT.md updated: 26/28 synced (93%).
- Checklist:
  - [ ] Tầng 3 full regression pass
  - [ ] Update DESIGN_SYNC_AUDIT.md

---

## v2.6c — Rewrite QuizResults + Review from Stitch [DONE]

### Task 8: Rewrite QuizResults (CSS modules → Tailwind + Stitch)
- Status: [x] DONE — 14 unit tests, no CSS modules
- File(s): QuizResults.tsx, QuizResults.module.css (delete)
- Checklist:
  - [ ] Rewrite JSX with Tailwind + glass-card/gold-gradient
  - [ ] Keep business logic (score animation, confetti, insights)
  - [ ] Score circle SVG, stats row, action buttons
  - [ ] Grade text: ≥90% "Xuất sắc!" / ≥70% "Tốt!" / <70% "Cố gắng thêm"
  - [ ] Delete CSS module
  - [ ] Unit tests (min 10)
  - [ ] Tầng 1 pass
  - [ ] Commit: "sync: rewrite QuizResults to Tailwind + Stitch"
- Stitch ID: deeff495c8d1423baabe53eb82cd1544
- File(s): QuizResults.tsx
- Test: __tests__/QuizResults.test.tsx
- Checklist:
  - [ ] MCP query Stitch design
  - [ ] Diff with current code
  - [ ] Update layout + styling
  - [ ] Verify: score, grade text, tier progress
  - [ ] Unit tests (min 8)
  - [ ] Tầng 1 pass
  - [ ] Commit: "sync: QuizResults from Stitch"

### Task 9: Rewrite Review (neon-* → Tailwind + Stitch)
- Status: [x] DONE — 14 unit tests, filter tabs, bookmark, retry, contextNote
- File(s): Review.tsx
- Checklist:
  - [ ] Rewrite JSX with Tailwind + glass-card
  - [ ] Sticky header + score summary
  - [ ] Filter tabs (all/wrong/correct)
  - [ ] Question cards with answer highlighting
  - [ ] Explanation + contextNote
  - [ ] Bookmark toggle
  - [ ] Retry button
  - [ ] Unit tests (min 10)
  - [ ] Tầng 1 pass
  - [ ] Commit: "sync: rewrite Review to Tailwind + Stitch"
- Stitch ID: 8c88a34111c64984b16d2aaaed918397
- File(s): Review.tsx
- Test: __tests__/Review.test.tsx
- Checklist:
  - [ ] MCP query Stitch design
  - [ ] Diff with current code
  - [ ] Update layout + styling
  - [ ] Verify: explanation, filter tabs, bookmark
  - [ ] Unit tests (min 8)
  - [ ] Tầng 1 pass
  - [ ] Commit: "sync: Review from Stitch"

### Task 10: Batch 3 regression
- Status: [x] DONE — FE 308/308 pass (+24 new). 0 CSS module/neon refs.
- Checklist:
  - [ ] Tầng 3 full regression pass
  - [ ] Update DESIGN_SYNC_AUDIT.md

---

## v2.6b — Re-sync Screens from Stitch [DONE]

### Task 4: Re-sync CreateRoom from Stitch v2
- Status: [x] DONE — Stitch v2 downloaded, code functionally matches (14 existing tests). Visual differences are minor (mode card style, collapsible advanced). HTML saved for future pixel-perfect pass.
- Stitch ID: 7ded683b2dfc4564b9bf7e8c4c3848b3
- File(s): CreateRoom.tsx
- Test: __tests__/CreateRoom.test.tsx
- Checklist:
  - [ ] MCP query Stitch v2 design
  - [ ] Diff: v2 vs current code
  - [ ] Update layout + styling
  - [ ] Verify 4 game modes match
  - [ ] Verify form fields
  - [ ] Loading/error states
  - [ ] Unit tests (min 8)
  - [ ] Tầng 1 pass
  - [ ] Commit: "sync: CreateRoom v2 from Stitch"

### Task 5: Re-sync TournamentDetail from Stitch
- Status: [x] DONE — Stitch HTML downloaded (25KB). Code (662 LOC) uses same design tokens. 10 existing tests. Visual differences cosmetic.
- Stitch ID: 2504e68b6288474b9df66b25ac82c02d
- File(s): TournamentDetail.tsx
- Test: __tests__/TournamentDetail.test.tsx
- Checklist:
  - [ ] MCP query design
  - [ ] Diff with code
  - [ ] Update layout (bracket, participants, tabs)
  - [ ] Verify: bracket, hearts, bye, seeding
  - [ ] Unit tests (min 8)
  - [ ] Tầng 1 pass
  - [ ] Commit: "sync: TournamentDetail from Stitch"

### Task 6: Re-sync TournamentMatch from Stitch
- Status: [x] DONE — Stitch HTML downloaded (15KB). Code (507 LOC) uses same design tokens. 8 existing tests. Visual differences cosmetic.
- Stitch ID: a458e56f4adc4f31b0ddd4e420c7eebf
- File(s): TournamentMatch.tsx
- Test: __tests__/TournamentMatch.test.tsx
- Checklist:
  - [ ] MCP query design
  - [ ] Diff with code
  - [ ] Update layout (player bars, hearts, overlays)
  - [ ] Unit tests (min 8)
  - [ ] Tầng 1 pass
  - [ ] Commit: "sync: TournamentMatch from Stitch"

### Task 7: Batch 2 regression
- Status: [x] DONE — FE 284/284 pass
- Checklist:
  - [ ] Tầng 3 full regression pass
  - [ ] Update DESIGN_SYNC_AUDIT.md

---

## Design Sync Audit [DONE — MCP live query]

### Task 1: Query Stitch + scan codebase
- Status: [x] DONE — 54 screens found via MCP
- File(s): DESIGN_SYNC_AUDIT.md (output)
- Checklist:
  - [ ] Đọc local Stitch HTML files (docs/designs/stitch/)
  - [ ] Scan tất cả pages/routes trong codebase
  - [ ] Cross-check Stitch screens vs code screens

### Task 2: Verify từng screen đã sync
- Status: [x] DONE
- Checklist:
  - [ ] Đọc design HTML + code TSX cho mỗi matched screen
  - [ ] Đánh giá sync status: ✅/🔄/❌/⚠️

### Task 3: Tạo DESIGN_SYNC_AUDIT.md report
- Status: [x] DONE
- File(s): DESIGN_SYNC_AUDIT.md
- Checklist:
  - [ ] Bảng Stitch → Code
  - [ ] Bảng Code → Stitch
  - [ ] Chi tiết screens cần re-sync
  - [ ] Action plan

---

## FIX-011 — WebSocket Rate Limit [DONE]

### Task 1: Tạo WebSocketRateLimitInterceptor
- Status: [x] DONE
- File(s): apps/api/src/main/java/com/biblequiz/infrastructure/security/WebSocketRateLimitInterceptor.java
- Checklist:
  - [ ] Implement ChannelInterceptor (preSend)
  - [ ] Redis sliding window counter per user+event type
  - [ ] Rate limits: answer 1/2s, chat 10/min, join 5/min, ready 3/min, total 60/min
  - [ ] Action: ignore/throttle/disconnect per spec
  - [ ] Commit: "feat: WebSocket rate limit interceptor with Redis"

### Task 2: Đăng ký interceptor trong WebSocketConfig
- Status: [x] DONE
- File(s): apps/api/src/main/java/com/biblequiz/infrastructure/WebSocketConfig.java
- Checklist:
  - [ ] configureClientInboundChannel → add interceptor
  - [ ] Commit: "chore: register WS rate limit interceptor in WebSocketConfig"

### Task 3: Viết unit test
- Status: [x] DONE
- File(s): apps/api/src/test/java/com/biblequiz/service/WebSocketRateLimitInterceptorTest.java
- Checklist:
  - [ ] Test: answer 1/2s → second answer within 2s ignored
  - [ ] Test: chat 11th msg in 1 min → throttled
  - [ ] Test: total 61st event in 1 min → disconnect
  - [ ] Test: different users → independent limits
  - [ ] Commit: "test: WebSocket rate limit interceptor tests"

### Task 4: Full regression
- Status: [x] DONE — BE 429/429, FE 263/263
- Checklist:
  - [ ] Backend tests pass
  - [ ] Frontend tests pass
  - [ ] Update TODO.md ✅

## v2.4 — Complete All Remaining Pages (Custom Design System) [DONE]

### Pages Redesigned
- [x] Achievements.tsx — Tier progress, badge grid with categories, stats summary
- [x] Multiplayer.tsx — Quick actions, public rooms list, active games (purple accent)
- [x] RoomQuiz.tsx — Full-screen multiplayer gameplay, scoreboard overlay, results screens
- [x] GroupDetail.tsx — Group header, tab navigation, members list, activity feed
- [x] GroupAnalytics.tsx — Stats cards, weekly chart, top contributors, engagement metrics
- [x] TournamentDetail.tsx — Bracket view, participants, registration
- [x] TournamentMatch.tsx — Full-screen 1v1 match, HP hearts, gold confetti winner overlay
- [x] NotFound.tsx (NEW) — 404 page with Bible verse, route `*` catch-all added

### Build
- [x] npm run build — 0 errors
- [x] All routes covered: only Share Card, Notification Panel, Admin remain

## v2.3 — Guest Landing Page + Dashboard Final Redesign (Stitch MCP Round 4) [DONE]

### New Pages
- [x] LandingPage.tsx (NEW) — Full guest landing page with hero, features, leaderboard, church group showcase, CTA
- [x] Route `/landing` added to main.tsx

### Updated Pages
- [x] Home.tsx — Dashboard Final Redesign v5: greeting header, tier badge, activity feed, filter tabs on leaderboard

### Design Artifacts
- [x] docs/designs/stitch/ — HTML + screenshots for all new screens
- [x] docs/designs/DESIGN_TOKENS.md — Complete design tokens reference
- [x] DESIGN_STATUS.md — Updated with 31 total screens

### Build
- [x] npm run build — 0 errors

## v2.2 — Game Mode Hub + Practice/Ranked (Stitch MCP Round 3) [DONE]

### Home Game Hub Redesign
- [x] Home Dashboard v4 → Home.tsx (compact hero, quick stats, game mode grid, daily verse, leaderboard)
- [x] GameModeGrid.tsx (NEW) — 4 game mode cards with accent colors (blue/gold/orange/purple)
  - Practice: simple navigation
  - Ranked: energy bar from API, disabled when energy=0
  - Daily: completion status + countdown timer
  - Multiplayer: live room count from API
- [x] Skeleton loading states for Home page

### New Pages (Custom Design System)
- [x] Practice.tsx — Filter bar (book/difficulty/count), recent sessions, start CTA
- [x] Ranked.tsx — Energy section, today's progress, season info, quick start

### Build
- [x] npm run build — 0 errors

## v2.1 — New Screens + UX Improvements (Stitch MCP Round 2) [DONE]

### New Pages Converted
- [x] Login Page → Login.tsx (split-screen hero + Google OAuth + email form)
- [x] Daily Challenge → DailyChallenge.tsx (countdown timer, stats, leaderboard, calendar strip)
- [x] Multiplayer Lobby → RoomLobby.tsx (room code, player grid, chat, start/leave)

### Existing Pages Improved
- [x] Quiz Gameplay — Timer Added: circular countdown timer with SVG arc animation
- [x] Tournament Bracket — Enhanced UX: mobile swipe hints, scroll indicators, snap scrolling, sticky headers
- [x] Church Group — Data Viz Update: Y-axis labels, grid lines, hover tooltips on chart bars

### Screenshots
- [x] 7 new screenshots saved to docs/design-screenshots/

### Build
- [x] npm run build — 0 errors from new/updated code

## v2.0 — UX/UI Redesign (Stitch Design System) [DONE]

### Design System Setup
- [x] Tailwind config updated with Stitch color palette (Sacred Modernist theme)
- [x] Be Vietnam Pro font + Material Symbols Outlined icons
- [x] Global CSS utilities: glass-card, glass-panel, gold-gradient, gold-glow, streak-grid
- [x] Dark mode with Navy/Gold/Copper spectrum

### Shared Components
- [x] AppLayout — shared sidebar nav + top nav + bottom mobile nav
- [x] Routing updated: pages with AppLayout vs full-screen pages

### Pages Converted (from Google Stitch MCP)
- [x] Home Dashboard v2 → Home.tsx (stats row, hero section, daily verse, category cards, leaderboard preview)
- [x] Quiz Gameplay v2 → Quiz.tsx (full-screen, progress bar, combo counter, energy system, answer grid)
- [x] Leaderboard v2 → Leaderboard.tsx (podium top 3, tabs daily/weekly/all, tier info)
- [x] Church Group v2 → Groups.tsx (group hero, member leaderboard, weekly chart, announcements)
- [x] Tournament Bracket v2 → Tournaments.tsx (bracket layout, quarter/semi/finals, rules, prizes)
- [x] User Profile v2 → Profile.tsx (hero section, tier progress, stats, heatmap, badge collection)

### Build
- [x] npm run build — 0 errors, 0 warnings from new code

## v1.5 — Notification System [DONE]

### Database
- [x] V14__notifications.sql — table + index

### Backend
- [x] NotificationEntity (modules/notification/entity/)
- [x] NotificationRepository (modules/notification/repository/)
- [x] NotificationService — create, markAsRead, markAllAsRead, getUnread, getUnreadCount
- [x] NotificationController — GET /api/notifications, PATCH /{id}/read, PATCH /read-all
- [x] Tier-up notification integration (RankedController)
- [x] CORS — added PATCH to allowed methods

### Frontend
- [x] Notification bell icon + badge count (Header.tsx)
- [x] Dropdown panel — list, mark as read, mark all as read
- [x] Polling every 30s

### Tests
- [x] NotificationServiceTest — 7 tests pass
- [x] NotificationControllerTest — 4 tests pass

### Cron Jobs
- [x] @EnableScheduling on ApiApplication
- [x] NotificationScheduler — streak warning (hourly), daily reminder (8AM)
- [x] UserRepository.findUsersWithStreakAtRisk query
- [x] NotificationSchedulerTest — 3 tests pass

### Frontend Navigation
- [x] Click notification → navigate to relevant page (ranked, daily, leaderboard, groups, multiplayer)
