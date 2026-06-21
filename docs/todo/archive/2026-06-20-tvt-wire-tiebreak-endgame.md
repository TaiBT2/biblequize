# 2026-06-20 — Wire Team vs Team tie-break vào endgame

> **Source**: User prompt (đào sâu MP modes — phát hiện `determineWinnerWithTieBreak` là dead code)
> **Scope**: BE — TvT endgame phân thắng khi 2 đội bằng điểm (perfect-round count → tốc độ). Hiện `finishGame` dùng `determineWinner` đơn giản → trả "TIE". Method tie-break + 4 unit test đã tồn tại nhưng chưa wire; tầng #2 (perfect-round count) còn THIẾU nguồn dữ liệu (afterRound không tích lũy).
> **Status**: IMPL DONE — chờ commit

### Bối cảnh (verified)
- `TeamScoringService.determineWinnerWithTieBreak(roomId, perfectRoundsA, perfectRoundsB)` — tồn tại từ commit `b883e4a2`, **0 caller production** (chỉ test). 3 tầng: tổng điểm → số perfect round → tổng thời gian phản hồi → "TIE".
- Endgame thật: `RoomQuizService.runStandardLoop` → `TeamVsTeamStrategy.finishGame:90` → `determineWinner(finalScores)` (đơn giản, "TIE" khi bằng).
- `TeamVsTeamStrategy.afterRound` gọi `processPerfectRound` rồi vứt kết quả → **không đếm** perfectRoundsA/B.
- FE `useTeamVsTeam.applyQuizEnd` nhận `summary.teamWinner` = "A"/"B"/"TIE" → đã sẵn sàng, KHÔNG cần đổi.
- SPEC §3.3 hiện chỉ ghi "Đội score cao hơn thắng" — KHÔNG mô tả tie-break → cần update inline (strategy a).

### Tasks

- TVT-1 Tích lũy perfect-round count per đội + wire `determineWinnerWithTieBreak` vào `finishGame`
  - Status: `[x]` DONE · Files: `apps/api/.../mode/TeamVsTeamStrategy.java` (beforeLoop init `modeState=int[2]`; afterRound increment khi perfA/perfB; finishGame gọi tie-break, dùng `result.winningTeam` + `result.scores`; log thêm `reason`) · Test: `TeamScoringServiceTest` 12 pass + room module 81 pass
  - **Spec impact**: `[ ]` None `[x]` SPEC_MULTIPLAYER §3.3
  - **Spec strategy**: `[x]` (a) update inline
  - Checklist: ✅ impl · ✅ Tầng 1+2 pass (Tầng 3 full-suite flake môi trường ở module unrelated — pass isolation) · ✅ SPEC §3.3 updated · ✅ `audit.sh` no NEW broken từ edit này · ⏳ commit

- TVT-2 SPEC §3.3 — document 3-tầng tie-break
  - Status: `[x]` DONE · Files: `docs/spec/SPEC_MULTIPLAYER.md` §3.3 Scoring · Test: `bash tools/spec-audit/audit.sh`
  - **Spec impact**: `[x]` SPEC_MULTIPLAYER §3.3
  - **Spec strategy**: `[x]` (a) update inline
  - Checklist: ✅ edit spec · ✅ audit no NEW broken từ §3.3 (broken refs đều pre-existing) · ⏳ commit cùng TVT-1

### Ghi chú thiết kế
- Payload STOMP QUIZ_END GIỮ NGUYÊN shape (`teamWinner`, `scoreA`, `scoreB`, `leaderboard`) — chỉ đổi cách tính `teamWinner`. Không thêm field `reason` (FE không dùng) để tránh đổi contract.
- `modeState` của GameLoopContext là scratch per-run (BR đã dùng cho initial count) → dùng `int[]{countA, countB}` cho TvT, thread-safe vì 1 game = 1 loop thread.
