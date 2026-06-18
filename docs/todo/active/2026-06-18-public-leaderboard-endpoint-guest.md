# 2026-06-18 — Public leaderboard endpoint + guest leaderboard UX

> **Source**: Bug report tiếp theo guest-aware chrome. Khách vào /leaderboard thấy bảng rỗng + nhãn "Tôi/New Believer/0đ" giả + bão 401 (list/my-rank/tier-progress/seasons đều require auth → 401 → session-expiry handler spam refresh/logout). Quyết định: **cho khách xem** qua **endpoint public riêng** (không sửa SecurityConfig — `/api/public/**` đã permitAll).
> **Scope**: BE `PublicLeaderboardController` (độc lập) + FE `Leaderboard.tsx` (guest-aware) + `LandingPage.tsx` (scroll-to + wire data thật). KHÔNG sửa `SecurityConfig`, KHÔNG sửa `LeaderboardController` cũ.

### Tasks

- LBG-1 BE: PublicLeaderboardController
  - Status: [x] DONE · Files: `apps/api/.../api/PublicLeaderboardController.java`, test · Test: @WebMvcTest slice (guest 200)
  - Detail: `GET /api/public/leaderboard?period=all-time|weekly|season&size=20` → top-N `{userId,name,avatarUrl,points,questions}`. Reuse `UserDailyProgressRepository` + `SeasonService` + `CacheService` (cùng cache key với authed). Nằm dưới `/api/public/**` (đã permitAll) → no auth.
  - **Spec impact**: [x] None (đọc public, không đổi business rule) · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · BE test guest-200 · Tầng 3 BE (SecurityConfig là sensitive — nhưng KHÔNG sửa; chạy slice tests) · commit

- LBG-2 FE: Leaderboard.tsx guest-aware
  - Status: [x] DONE · Files: `apps/web/src/pages/Leaderboard.tsx` · Test: Vitest (LBG-3)
  - Detail: guest → list query gọi `/api/public/leaderboard?period=`; `my-rank` + `tier-progress` thêm `enabled: isAuthenticated` (hết 401/storm); ẩn nhãn "Tôi" trên tier ladder khi guest + thêm dòng CTA "Đăng nhập để xem hạng của bạn".
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+2 · commit

- LBG-3 FE: Leaderboard guest tests
  - Status: [x] DONE · Files: `apps/web/src/pages/__tests__/Leaderboard.test.tsx` · Test: Vitest
  - Detail: guest → dùng public endpoint, KHÔNG gọi my-rank/tier-progress, KHÔNG nhãn "Tôi", có CTA đăng nhập.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 3 full FE · commit

- LBG-4 FE: LandingPage scroll-to + real preview data
  - Status: [x] DONE · Files: `apps/web/src/pages/LandingPage.tsx` · Test: Vitest (LandingPage.test)
  - Detail: nav "Xếp hạng" → smooth-scroll tới section preview (id="leaderboard"), bỏ Link sang /leaderboard. `LeaderboardPreview` query `/api/public/leaderboard?period=all-time&size=10` (TanStack) hiện top-N thật (fallback hardcode khi loading/empty), tier từ `getTierByPoints`. Thêm nút "Xem bảng đầy đủ" → /leaderboard.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 3 full FE · commit
