# 2026-05-18 — Fix: Daily Challenge button "Vào chơi" còn hiện sau khi đã hoàn thành (vào không chơi được)

> **Source**: User bug report 2026-05-18 — "Chế độ daily challenge bị lỗi lúc mà chơi xong rồi mà thỉnh thoảng vẫn hiện button vào chơi, nhưng vào là ko chơi được."
> **Scope**: BE `DailyChallengeController#startChallenge` + FE `FeaturedDailyChallenge.tsx`, `DailyChallenge.tsx` — đóng race giữa cache stale và state thật.

## Root cause (4 lỗ hổng cộng dồn → bug "thỉnh thoảng")

1. **BE `/api/daily-challenge/start` không guard** — luôn trả `sessionId` mới dù đã `hasCompletedToday`. Client nào gọi cũng được. (`DailyChallengeController.java:84-93`)
2. **Home card `staleTime: 60_000`** — sau khi complete trên 1 device hoặc giữa lúc invalidation đang background-refetch, useQuery trả ngay cached `alreadyCompleted: false` (vài trăm ms ~ 60s) → button State A vẫn hiện. (`FeaturedDailyChallenge.tsx:85`)
3. **`isCompleted` derive từ `dailyResult` state local không reset** — useEffect chỉ set khi truthy, không clear khi `alreadyCompleted: false`. Cross-user / state stale có thể chốt nhầm. (`DailyChallenge.tsx:224-244`)
4. **`handleStart` không re-validate `alreadyCompleted`** — chỉ check `!challengeData`. Vào quiz view dù đã completed → câu hỏi reveal `correctAnswer` (BE reveal khi completed) + `/complete` idempotent guard từ chối save → user cảm giác "vào không chơi được".

### Tasks

- DC-STALE-1 BE guard `/api/daily-challenge/start` — trả 409 `{error:"already_completed", alreadyCompleted:true}` nếu `hasCompletedToday(userId)`. Idempotent + bulletproof.
  - Status: [ ] TODO
  - Files: `apps/api/src/main/java/com/biblequiz/api/DailyChallengeController.java`
  - Test: BE Tầng 1 DailyChallengeControllerTest (case already-completed → 409); Tầng 3 BE JUnit no regression
  - **Spec impact**: [x] None (defensive guard, không đổi BE contract khi user chưa complete)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · BE Tầng 1+3 pass · commit

- DC-STALE-2 FE `handleStart` catch 409 từ /start — invalidate `['daily-challenge', 'daily-challenge-result']`, fallback gọi `/result` để set `dailyResult` → page tự refresh sang State Done. Show toast (i18n `daily.alreadyCompletedToast`).
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/DailyChallenge.tsx`, `apps/web/src/locales/{vi,en}.json`
  - Test: Vitest DailyChallenge handleStart 409 → invalidate + dailyResult set; Tầng 3 FE no regression
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+3 pass · commit

- DC-STALE-3 Home card refresh stale — `FeaturedDailyChallenge` query `['daily-challenge', lang]` đổi `staleTime` xuống 10s + `refetchOnMount: 'always'` để mỗi lần về Home đều validate lại status. (Cost: +1 request mỗi mount, chấp nhận được vì endpoint cheap.)
  - Status: [ ] TODO
  - Files: `apps/web/src/components/FeaturedDailyChallenge.tsx`
  - Test: Vitest FeaturedDailyChallenge refetch behavior; Tầng 3 FE no regression
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+3 pass · commit

- DC-STALE-4 Reset `dailyResult` khi `alreadyCompleted=false` — useEffect `DailyChallenge.tsx:224-244` thêm else-branch `setDailyResult(null)` để tránh state cũ rò sang user/session khác.
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/DailyChallenge.tsx`
  - Test: Vitest DailyChallenge — chuyển từ completed=true → false (refetch) → dailyResult null → render State Ready
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+3 pass · commit

- DC-STALE-M1 Mobile `HomeScreen` query refresh stale — `useQuery(['daily-challenge', lang])` đổi `staleTime: 60_000` → `10_000` + `refetchOnMount: 'always'` để Home refresh sau mỗi lần focus. (Bonus: thêm `refetchOnReconnect: true` cho case mất mạng.) Phụ thuộc DC-STALE-3 đã merge để share approach.
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/main/HomeScreen.tsx`
  - Test: RN test stub (jest) verify queryOptions; manual: complete daily web → switch về mobile Home → button đổi sang completed state trong ≤ 10s
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+3 pass · commit

- DC-STALE-M2 Mobile `DailyChallengeScreen.handleStart` catch 409 — hiện `console.warn` rồi vẫn navigate Quiz (`DailyChallengeScreen.tsx:34-59`). Sửa: catch HTTP 409 → invalidate `['daily-challenge', lang]` + `['daily-challenge-result', lang]` → show Alert/Toast i18n `daily.alreadyCompletedToast` → đứng lại trên Home, KHÔNG navigate. Phụ thuộc DC-STALE-1 BE guard.
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/quiz/DailyChallengeScreen.tsx`, `apps/mobile/src/i18n/{vi,en}.json` (hoặc shared package)
  - Test: jest DailyChallengeScreen mock 409 → assert no `navigation.navigate('Quiz')` + invalidate called; manual: complete daily web → ngay sau đó bấm CTA mobile → toast hiện
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+3 pass · commit
