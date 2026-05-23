# 2026-05-23 — Leaderboard "Hàng Tuần" logic fixes — DONE

> **Source**: User report — "check lại logic flow của điểm hàng tuần này tôi thấy sai sai"
> **Scope**: 6 issues trong flow weekly leaderboard. 4 commit thực tế (LBW-1, LBW-4, LBW-5+LBW-6 gộp). LBW-2 + LBW-3 thành no-op sau khi LBW-1 fix root cause.
> **Status**: DONE 2026-05-23

### Tasks

- LBW-1 Filter zero-point users khỏi list — **DONE** commit `99e177c6`
  - `apps/api/.../UserDailyProgressRepository.java`: thêm `WHERE points_counted > 0` (daily) + `HAVING SUM(points_counted) > 0` (weekly + all-time)
  - Schema-lock test trong `UserDailyProgressRepositoryTest` guard cả 3 query
  - 20/20 BE tests pass

- LBW-2 ~~`my-rank` null vs list inclusion~~ — **SUPERSEDED** bởi LBW-1
  - Sau khi LBW-1 ẩn 0-point users khỏi list, behavior `my-rank null cho 0 pts` thành consistent với list. Không còn mismatch.

- LBW-3 ~~Copy "Cập nhật theo bảng hôm nay"~~ — **NOT-A-BUG**
  - Copy thuộc `LeaderboardRankWidget` (sidebar), widget này fetch `/leaderboard/daily/my-rank` (luôn daily). Copy "hôm nay" chính xác.

- LBW-4 Cache TTL 5min → 60s + invalidate on writes — **DONE** commit `e09ecd3d`
  - `LEADERBOARD_TTL = Duration.ofSeconds(60)` (was 5 min)
  - `CacheService.invalidateLeaderboards()` helper wipes `leaderboard:*`
  - Called from `DailyChallengeService.creditCompletionXp` (mới) + `RankedController` (đã có, refactor sang helper)
  - 70/70 BE tests pass

- LBW-5 + LBW-6 ICT timezone + calendar-week — **DONE** commit `736dac82`
  - New helper `infrastructure/time/GameClock.java` — `GAME_ZONE = Asia/Ho_Chi_Minh`, `today()`, `weekStart(anchor)` = Monday-of-week
  - Migrated 7 files khỏi `LocalDate.now(ZoneOffset.UTC)`: `LeaderboardController` (8 sites), `RankedController` (12), `SessionService` (2), `DailyChallengeService` (10), `StreakService` (1), `DailyMissionService` (4)
  - Weekly window: `start = GameClock.weekStart(today)`, `end = GameClock.today()` (clamp future)
  - `GameClockTest` (6 tests) + `weekly_startsOnMonday_ofCurrentIctWeek_LBW6` integration test với ArgumentCaptor
  - 988/988 BE tests pass
  - Spec updated: `SPEC_USER_v3.1.md §22.1 Periods` — ICT day boundary + ISO calendar week + zero-point filter + cache TTL ghi rõ

### Out of scope / follow-up

- Admin tools (`AdminTestController`, `AdminDashboardController` etc.), season seeder, cron schedulers, coverage analytics: vẫn dùng `LocalDate.now(ZoneOffset.UTC)`. Khác semantic (admin/audit), migrate piecemeal nếu cần.
- FE countdown "Reset thứ Hai HH:MM" trên tab weekly: không bắt buộc, có thể add sau nếu user muốn.
- Migration 1 lần data: existing UDP rows trước commit này giữ UTC date — 7h seam ở deploy day, không backfill (current scale chấp nhận được).
