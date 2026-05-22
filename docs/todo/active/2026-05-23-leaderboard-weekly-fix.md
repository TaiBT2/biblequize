# 2026-05-23 — Leaderboard "Hàng Tuần" logic fixes

> **Source**: User report — "check lại logic flow của điểm hàng tuần này tôi thấy sai sai"
> **Scope**: Fix 6 issues trong flow weekly leaderboard (`/api/leaderboard/weekly`, `*/my-rank`, UDP queries) + cache TTL + i18n copy. Mỗi sub-task = 1 commit riêng.
> **Status**: TODO

### Tasks

- LBW-1 Filter zero-point users khỏi list (weekly/monthly/season/all-time)
  - Status: `[ ]` TODO · Files: `apps/api/src/main/java/com/biblequiz/modules/quiz/repository/UserDailyProgressRepository.java` · Test: thêm BE unit test `LeaderboardControllerTest` — user có UDP row nhưng SUM(points)=0 không xuất hiện trong list
  - **Spec impact**: `[ ]` None `[x]` SPEC_USER §Leaderboard (clarify "appears on leaderboard" = có ≥1 point)
  - **Spec strategy**: `[x]` (a) update inline
  - Checklist: thêm `HAVING SUM(COALESCE(points_counted,0)) > 0` vào 3 query (weekly + all-time + monthly count) · Tầng 1+2+3 pass · spec ghi rule · `audit.sh` no NEW broken · commit

- LBW-2 `my-rank` weekly/monthly trả entry với `points: 0` thay vì `null` khi user có UDP row trong range
  - Status: `[ ]` TODO · Files: `apps/api/src/main/java/com/biblequiz/api/LeaderboardController.java` (lines 207-239, 241-274, 276-...) · Test: BE test 2 case: (a) user có UDP row 0 điểm → trả `{rank: N, points: 0}` (b) user không có UDP row → trả null
  - **Spec impact**: `[x]` None (consistency fix, no behavior promise changes)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: bỏ early-return `if (myPoints == 0) return null` · compute rank bằng `countUsersAheadInDateRange` rồi +1 · Tầng 1+2+3 pass · commit

- LBW-3 Sửa copy "Cập nhật theo bảng hôm nay" → "Cập nhật theo 7 ngày gần nhất" cho tab weekly
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/Leaderboard.tsx`, `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` · Test: Vitest snapshot `Leaderboard.test.tsx` cập nhật assertion
  - **Spec impact**: `[x]` None (copy only)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: add i18n key dynamic theo activeTab (`leaderboard.myRank.subtitle.{weekly|season|all_time}`) · validator `npm run validate:i18n` không tăng debt · Tầng 1+2+3 pass · commit

- LBW-4 Giảm `LEADERBOARD_TTL` 5min → 60s + invalidate cache khi ghi điểm
  - Status: `[ ]` TODO · Files: `apps/api/src/main/java/com/biblequiz/infrastructure/service/CacheService.java`, `RankedController.java` (sau submitRankedAnswer), `DailyChallengeService.java` (sau creditCompletionXp) · Test: BE integration test — ghi điểm → GET /weekly → cache miss → fresh data
  - **Spec impact**: `[x]` None (perf tuning, observable behavior unchanged)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: TTL = 60s · invalidate pattern `leaderboard:weekly:*` + `leaderboard:season:*` + `leaderboard:all-time:*` + `leaderboard:daily:*` (giữ monthly nếu dùng) · Tầng 1+2+3 pass · commit

- LBW-5 Đổi window weekly sang Asia/Ho_Chi_Minh (ICT) đồng bộ reader + writer
  - Status: `[ ]` TODO · Files: `LeaderboardController.java` (weekly + my-rank + monthly + season clamp), `SessionService.java:535` (`creditNonRankedProgress`), `DailyChallengeService.java` (LocalDate.now), `RankedController.java` (UDP write date), `PrestigeService.java` (reset date) · Test: BE test — credit lúc 06:00 ICT (23:00 UTC previous day) → UDP date = today ICT, không phải hôm qua UTC
  - **Spec impact**: `[x]` SPEC_USER §Leaderboard + §Daily Challenge — ghi rõ "ngày" = ICT
  - **Spec strategy**: `[x]` (a) update inline
  - Checklist: định nghĩa constant `ZoneId GAME_ZONE = ZoneId.of("Asia/Ho_Chi_Minh")` (shared util) · grep `LocalDate.now(ZoneOffset.UTC)` toàn BE — replace có chủ đích · migration không cần (UDP rows giữ nguyên, chỉ shift tính từ bây giờ — note trong commit msg) · Tầng 1+2+3 pass · spec update · commit
  - **Lưu ý**: file "nhạy cảm" — chạy Tầng 3 đầy đủ. Có thể spawn task con nếu phát hiện > 5 call site khác cần đụng.

- LBW-6 Đổi tab "Hàng Tuần" rolling 7-day → calendar week (T2 00:00 ICT → CN 23:59:59 ICT)
  - Status: `[ ]` TODO · Files: `LeaderboardController.java` (weekly + my-rank) · Test: BE test — 2026-05-23 (Sat) request → start = 2026-05-18 (Mon), end = 2026-05-23 (today, clamp)
  - **Spec impact**: `[x]` SPEC_USER §Leaderboard — đổi định nghĩa "weekly window"
  - **Spec strategy**: `[x]` (a) update inline
  - Checklist: depends on LBW-5 (cần ICT trước) · helper `weekStart(LocalDate today) → today.with(DayOfWeek.MONDAY)`; `weekEnd = min(today, weekStartNext - 1)` · cập nhật BL-N nếu spec đang nói rolling · countdown "Reset thứ Hai" trên FE (sub-task FE riêng nếu cần) · Tầng 1+2+3 pass · commit
  - **Quyết định cần xác nhận**: user (Bui) có muốn keep rolling 7-day không? Nếu rolling là intentional → cancel LBW-6, chỉ rename label sang "7 ngày gần nhất".
