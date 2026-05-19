# 2026-05-19 — Mobile rewrite S5: Scheduled quizzes + Tournament detail + Group Analytics

> **Source**: Master roadmap [`2026-05-18-mobile-rewrite-roadmap.md`](2026-05-18-mobile-rewrite-roadmap.md) Sprint 5
> **Scope**: Scheduled quiz CRUD + play flow (3 screens), Tournament detail + match (2 screens), Group analytics dashboard. Defer: real-time multiplayer match play (linkage to MultiplayerQuiz nếu BE expose roomId — verify khi impl).
> **Why now**: BL-11 còn 4 gap (scheduled, tournament detail, group analytics, cosmetics). S5 đóng 3 trong 4 (cosmetics defer S6).

> **Recon (2026-05-19)**: ScheduledQuiz endpoints đầy đủ trong web `api/scheduledQuiz.ts` (list, create, detail, start, submit, leaderboard). Tournament: match detail embedded trong bracket response — chỉ có forfeit endpoint riêng. Group analytics: `GET /api/groups/{id}/analytics` (leader/mod only) — weeklyActivity + topContributors.

### Tasks

- **S5-1 scheduledQuiz API wrapper**
  - New `apps/mobile/src/api/scheduledQuiz.ts` — port web shape:
    - `listScheduledQuizzes(groupId, status?)`, `getScheduledQuizDetail(groupId, quizId)`, `createScheduledQuiz(groupId, body)`
    - `startScheduledQuizAttempt(groupId, quizId)`, `submitScheduledQuizAttempt(groupId, quizId, body)`
    - `getScheduledQuizLeaderboard(groupId, quizId)`
  - All inline TypeScript interfaces (ScheduledQuizSummary, ScheduledQuizDetail, etc.)
  - Status: [ ] TODO
  - Files: `apps/mobile/src/api/scheduledQuiz.ts` (new)
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S5-2 ScheduledQuizListScreen — in group context**
  - New `apps/mobile/src/screens/scheduled/ScheduledQuizListScreen.tsx` — list per group với status filter pills (ACTIVE / ENDED)
  - Card: name, deadline countdown, questionCount, status badge, tap → Detail
  - FAB "+ Tạo lịch" (leader/mod only — check role from group cache)
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/scheduled/ScheduledQuizListScreen.tsx` (new)
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S5-3 ScheduledQuizCreateScreen — leader/mod form**
  - New `apps/mobile/src/screens/scheduled/ScheduledQuizCreateScreen.tsx`:
    - Quiz set picker: GET group's PUBLISHED quiz sets, single-select
    - Name + description (auto-default from quiz set name)
    - Deadline picker (date + time input)
    - Max attempts (number, default 3)
    - isLeaderboardPublic toggle
    - sendNotifications toggle
    - Submit → createScheduledQuiz → navigate Detail
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/scheduled/ScheduledQuizCreateScreen.tsx` (new)
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S5-4 ScheduledQuizDetailScreen — status + leaderboard**
  - New `apps/mobile/src/screens/scheduled/ScheduledQuizDetailScreen.tsx`:
    - Status banner (ACTIVE countdown đến deadline / ENDED + winner card)
    - "Bắt đầu thi" gold button (nếu ACTIVE + attemptsRemaining > 0) → ScheduledQuizPlay
    - My stats: attemptsUsed, bestScore, bestCorrectCount
    - Leaderboard table với rank + name + score + correctCount + timeSeconds
    - Auto-refresh leaderboard mỗi 30s (refetchInterval)
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/scheduled/ScheduledQuizDetailScreen.tsx` (new)
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S5-5 ScheduledQuizPlayScreen — question carousel + submit**
  - New `apps/mobile/src/screens/scheduled/ScheduledQuizPlayScreen.tsx`:
    - Mount → startScheduledQuizAttempt → questions array
    - Question carousel với current index state, prev/next buttons
    - 4-option grid với ANSWER_COLORS tints
    - Progress bar top
    - Submit khi answer cuối: collect answers + timeSeconds → submitScheduledQuizAttempt → result screen
    - Result: score + correctCount + back to detail
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/scheduled/ScheduledQuizPlayScreen.tsx` (new)
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S5-6 TournamentDetailScreen — hero + actions + bracket link**
  - New `apps/mobile/src/screens/multiplayer/TournamentDetailScreen.tsx`:
    - Hero header: name + status badge (LOBBY / IN_PROGRESS / COMPLETED) + bracketSize (e.g., "8 người")
    - Meta cards: currentRound/totalRounds, creator name
    - Action buttons: "Tham gia" (POST /join) khi LOBBY + not joined; "Bắt đầu" (POST /start) khi creator + LOBBY
    - "Xem bracket" button → existing TournamentBracketScreen (S1-6)
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/multiplayer/TournamentDetailScreen.tsx` (new), `apps/mobile/src/api/tournaments.ts` (new minimal)
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S5-7 TournamentMatchScreen — match info + forfeit**
  - New `apps/mobile/src/screens/multiplayer/TournamentMatchScreen.tsx`:
    - 3-col layout: P1 card | VS badge | P2 card
    - Each participant card: name + score + lives (3 hearts ❤️)
    - Match status badge
    - Forfeit button (red) với confirm → POST /matches/{matchId}/forfeit
    - "Trở về bracket" button
    - Live gameplay defer — TBD nếu BE expose roomId hoặc separate flow
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/multiplayer/TournamentMatchScreen.tsx` (new)
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S5-8 GroupAnalyticsScreen — dashboard**
  - New `apps/mobile/src/screens/social/GroupAnalyticsScreen.tsx`:
    - GET /api/groups/{id}/analytics (leader/mod only)
    - Top stats grid: totalMembers, activeToday, activeWeek, accuracy
    - Weekly activity simple bar chart (7 bars proportional)
    - Top contributors list (rank + name + score + questionsAnswered)
    - Empty state khi group <7 days old (GD-2 rule)
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/social/GroupAnalyticsScreen.tsx` (new)
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S5-9 Navigation wiring + CTAs**
  - types.ts add 5 routes: ScheduledQuizList, ScheduledQuizCreate, ScheduledQuizDetail, ScheduledQuizPlay, TournamentDetail, TournamentMatch, GroupAnalytics
  - Register screens vào MainTabNavigator GroupsStack + MultiplayerStack
  - GroupDetailScreen: add CTAs "📅 Lịch thi đấu" → ScheduledQuizList + "📊 Phân tích" (leader/mod only) → GroupAnalytics
  - Tournament list trong MultiplayerStack (nếu chưa có) — link từ MultiplayerLobby
  - Update TournamentBracketScreen tap match → TournamentMatchScreen
  - Status: [ ] TODO
  - Files: `apps/mobile/src/navigation/types.ts`, `MainTabNavigator.tsx`, `screens/social/GroupDetailScreen.tsx`, `screens/multiplayer/TournamentBracketScreen.tsx`
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S5-10 Tầng 3 regression + mark sprint DONE**
  - mobile jest ≥ 33 baseline, mobile tsc clean
  - Update roadmap S5 → DONE, BL-11 Scheduled + Tournament detail + Group analytics rows closed
  - Status: [ ] TODO

### Common

- **Spec impact**: BL-11 3 rows closed (Scheduled, Tournament detail, Group analytics); chỉ còn Cosmetics + Group SetEditor + advanced filters defer S6.
- **Spec strategy**: tất cả (c) `[no-spec-impact]`.
- **Sensitive files**: KHÔNG đụng. ProfileScreen/GroupDetail/TournamentBracket thêm CTAs only.
- **Out of scope S5 (defer)**:
  - Tournament match real-time gameplay (BE flow chưa clear cho mobile linkage — TBD)
  - Push notifications cho scheduled quiz deadline
  - Advanced analytics charts (sparklines, heatmap)
  - Tournament cancellation
  - Quiz set picker search/filter (chỉ basic list)
  - Date/time picker native (dùng plain TextInput format YYYY-MM-DDTHH:MM)
  - GROUP_LIVE_SEQUENTIAL per-player reveal (defer S6 polish)

### Verification

- Sau S5: BL-11 còn 1 row (Cosmetics) cần defer S6 polish + Group SetEditor (defer dài hạn).
- Master roadmap S5 → ✅ DONE. M2 milestone gần (chỉ thiếu S6 polish).
