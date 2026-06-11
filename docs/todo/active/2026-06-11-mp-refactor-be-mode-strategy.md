# 2026-06-11 — MP refactor BE: RoomModeStrategy + answer-path split

> **Source**: Refactor review 2026-06-11 (branch `refactor/multiplayer`). Mode dispatch scattered in 3 layers
> (RoomQuizService.runQuiz switch, RoomWebSocketController scoring branch, RoomService leaderboard duo).
> **Scope**: Structure only — NO behavior change. STOMP contract, anti-cheat invariants, payload shapes frozen.
> **Status**: DONE (2026-06-11) — all RMS-1..10 complete, full suite green (1034 tests, 0 failures) after each gate.
> **Baseline**: BE tests green (828+, `./mvnw test` exit 0 @ ad5378a).

### Code prefix: `RMS` (Room Mode Strategy)

### Invariants (must not break)
- STOMP message types + payload shapes unchanged (QUESTION_START, ROUND_END, ANSWER_SUBMITTED, SCORE_UPDATE, PLAYER_ELIMINATED, TEAM_*, MATCH_*, SEQUENTIAL_*, …).
- Anti-cheat: 1 answer/player/round; host silent-reject in Quản trò mode; only ACTIVE players answer (BR/Team); server-side validation of answerIndex vs correctAnswer[0].
- Mode ranking semantics: SPEED_RACE score DESC · BR finalRank · SD winningStreak · TVT team scores · SEQ 100/0.
- Reconnect (LEFT→ACTIVE) + host-promotion flows untouched.

### Tasks

- [x] RMS-1 Define `RoomModeStrategy` interface + Spring registry (mode → strategy bean) — **DONE**
  - Contract landed: `calculateScore(...)`, `defersAnswerFeedback()`, `leaderboardComparator()`, loop hooks (`beforeLoop`/`shouldStopBeforeRound`/`expectedAnswers`/`afterRound`/`finishGame`) + `hasCustomGameLoop()/runGameLoop()` escape hatch. Registry = EnumMap, null/unknown → SPEED_RACE fallback (mirrors legacy `default ->`).
  - Files: `modules/room/service/mode/RoomModeStrategy.java`, `RoomModeRegistry.java`, `GameLoopContext.java` (per-run context so strategies don't inject the WS controller → no bean cycle)
- [x] RMS-2 `SpeedRaceStrategy` (default) — **DONE** — `mode/SpeedRaceStrategy.java`; wraps SpeedRaceScoringService; no extra hooks beyond shared loop
- [x] RMS-3 `BattleRoyaleStrategy` — **DONE** — `mode/BattleRoyaleStrategy.java`; beforeLoop (initial BR_UPDATE + totalPlayers in ctx.modeState), stop at ≤1 active, afterRound elimination/amnesty broadcasts, finishGame assignFinalRanks + finalRank order
- [x] RMS-4 `TeamVsTeamStrategy` — **DONE** — `mode/TeamVsTeamStrategy.java`; TEAM_ASSIGNMENT beforeLoop, perfect-round + team-score afterRound, winner/endData payload in finishGame
- [x] RMS-5 `SuddenDeathStrategy` — **DONE** — `mode/SuddenDeathStrategy.java`; fits the standard loop (expectedAnswers=2); match choreography (MATCH_END + 2s pause + next challenger, legacy pre-break sleep quirk) in afterRound
- [x] RMS-6 `SequentialStrategy` — **DONE** — `mode/SequentialStrategy.java`; `hasCustomGameLoop()=true` (latch waits, QUESTION_REVEALED, no pause/end-early checks, no ROUND_END/between-question sleep — genuinely different, kept as custom loop per task allowance); `defersAnswerFeedback()=true`
- [x] RMS-7 `RoomQuizService.runQuiz` dispatch qua registry — **DONE** — switch + 5 `run{Mode}` → `runStandardLoop(ctx, strategy)` for SPEED_RACE/BR/TVT/SUDDEN_DEATH + `strategy.runGameLoop(ctx)` for GROUP_LIVE_SEQUENTIAL. Timing model untouched (GAME_STARTING 5s, Thread.sleep 3000 between questions, waitForRoundEnd 250ms poll, SD 2s match pause). Note: active-player count now taken once at top of each round (BR position) and reused for expectedAnswers — SR/TvT previously counted a few ms later (after QUESTION_START broadcast); same query, no logical change. Unused engine fields dropped from RoomQuizService.
- [x] RMS-8 `RoomAnswerProcessor` extracted — **DONE** — `modules/room/service/RoomAnswerProcessor.java`: duplicate check → Quản-trò host silent-reject → ELIMINATED/SPECTATOR reject → server-side correctness vs correctAnswer[0] → scoring via strategy → RoomAnswer/RoomPlayer persist; returns AnswerResult (displayName, masked isCorrect/points for Sequential, ScoreSnapshot). Controller keeps principal extraction, payload parsing, SCORE_UPDATE → ANSWER_SUBMITTED → SEQUENTIAL_PROGRESS broadcasts (exact legacy order). Test wiring updated (`RoomWebSocketControllerTest` builds a real processor over the same mocks); no assertion weakened.
- [x] RMS-9 Dedupe leaderboard — **DONE** — `RoomService.buildLeaderboard(roomId, Comparator)` + public `ORDER_BY_SCORE_DESC` / `ORDER_BY_FINAL_RANK_ASC`; both legacy methods delegate; strategies expose `leaderboardComparator()` used by finishGame. Note: score ordering moved from DB `ORDER BY score DESC` to stable in-memory sort — tie order (never guaranteed) may differ; payload shape unchanged. `findByRoomIdOrderByScoreDesc` left in repository (now unused by RoomService).
- [x] RMS-10 Full `./mvnw test` — **DONE** — 1034 tests, 0 failures/errors at all 3 gates (after RMS-1..6, after RMS-7, after RMS-8..9). No tests added → `.test-baseline` unchanged.

### Deferred (ghi nhận, KHÔNG làm sprint này)
- Redis-externalize pause/skip/SD-continue (multi-instance) — review finding #4, cần design riêng.
- Event-driven round end thay 250ms poll — đổi timing model, rủi ro cao.
- Rename `hostPlaysGame` — đụng FE + DB migration.

### Order: RMS-1 → (RMS-2..6 parallel) → RMS-7 → RMS-8 → RMS-9 → RMS-10.

### Notes
- Mỗi task < 100 LOC diff nếu được; commit riêng từng RMS-n, tests pass trước mỗi commit (English commit message).
- Khi extract: copy hành vi nguyên trạng, kể cả quirks (vd silent reject) — pin bằng test nếu chưa có.
