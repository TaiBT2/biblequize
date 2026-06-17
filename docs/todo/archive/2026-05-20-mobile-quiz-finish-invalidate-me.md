# 2026-05-20 — Mobile: invalidate `['me']` sau khi finish Ranked/Practice (XP không cộng)

> **Source**: user report — bản mobile, chơi xong Daily Challenge và Đấu Hạng (Ranked), điểm XP không được cộng vào HomeBanner và Leaderboard.
> **Scope**: `apps/mobile/src/screens/quiz/QuizScreen.tsx` (1 file, ~15 LOC).

## Root cause

`apps/mobile/src/screens/quiz/QuizScreen.tsx:206-220` — block `queryClient.invalidateQueries` nằm **bên trong** `if (isDailyMode) { … }`. Khi `mode === 'ranked'` (hoặc `practice`), không invalidate query nào → `['me']`, `['ranked-status']`, `['leaderboard']` giữ cache 5 phút cũ → HomeBanner hiển thị `totalPoints` stale, Leaderboard không refresh.

Web parity: `apps/web/src/pages/Quiz.tsx:217-227` invalidate `['me']` + `['me-tier-progress']` qua `useEffect([isQuizCompleted])` cho **tất cả mode**. Daily-specific keys được handle ở `pages/DailyChallenge.tsx:370-387`.

Daily mode trên mobile thực ra cũng đang bị bug nhẹ: report nói "Daily không cộng XP" — nhưng đoạn invalidate Daily ở line 213-219 đã có `['me']`. Có thể là do thực tế Daily flow trên mobile cũng đang fail (Q: BE có hợp thực update XP cho Daily không? Hoặc invalidate fire sau khi `navigation.replace`?). Cần verify khi test thực.

### Tasks

- M1 Tách invalidate `['me']` (+ liên quan) ra ngoài `if (isDailyMode)` để fire cho **mọi mode** khi finish
  - Status: [x] DONE (typecheck + 33 jest pass; chờ runtime verify)
  - Files: `apps/mobile/src/screens/quiz/QuizScreen.tsx`
  - Test: build + Tier 1 (run QuizScreen + smoke test trên Expo Go)
  - **Spec impact**: [x] None (parity bug fix — không thay đổi behavior canonical)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: tách invalidate · giữ Daily-specific keys inside isDailyMode · ranked-status + leaderboard + season cho mọi mode kết thúc · commit

## Out of scope

- Backend XP award logic (`/api/sessions/.../answer` đã handle; Daily POST `/complete` đã handle) — không động vào.
- `me-tier-progress` query: mobile không có, không cần invalidate.
- Verify XP thực tế cộng đúng (BE trả về có `totalPoints` tăng) — phải test runtime, ngoài scope code fix.
