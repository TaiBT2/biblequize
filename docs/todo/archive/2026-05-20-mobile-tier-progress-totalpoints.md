# 2026-05-20 — Mobile: query `/api/me/tier-progress` để lấy totalPoints (web parity)

> **Source**: phát hiện trong khi audit "+0 XP" trên Daily Result — root cause là `/api/me` UserResponse DTO không có field `totalPoints`, mobile đọc `me?.totalPoints` luôn undefined → fallback 0. Web tránh bug này bằng cách query `/api/me/tier-progress` riêng.
> **Scope**: 3 file mobile (HomeScreen, RankedScreen, QuizScreen invalidate). ~30 LOC.

## Root cause

`UserResponse` Java DTO (`apps/api/src/main/java/com/biblequiz/api/dto/UserResponse.java`) **chỉ có** `id, name, email, avatarUrl, role, createdAt, updatedAt, currentStreak, longestStreak, earlyRankedUnlock, practiceCorrectCount, practiceTotalCount, earlyRankedUnlockedAt`. **Không có** `totalPoints`.

Web `HomeBanner.tsx:50-68` xử lý đúng:
```ts
const { data: meData } = useQuery({ queryKey: ['me'], queryFn: () => api.get('/api/me')... })
const { data: tierProgress } = useQuery<TierProgressData>({
  queryKey: ['tier-progress'],
  queryFn: () => api.get('/api/me/tier-progress')...
})
const totalPoints = tierProgress?.totalPoints ?? meData?.totalPoints ?? 0  // tier-progress là primary
```

Mobile HomeScreen + RankedScreen chỉ query `['me']` → totalPoints = `me?.totalPoints ?? 0` = 0 mãi mãi. Đó là lý do HomeBanner mobile + tier card RankedScreen luôn show `Tân Tín Hữu 0 XP` dù user có credit XP thực qua Ranked/Daily.

### Tasks

- M4-1 HomeScreen — thêm `useQuery(['tier-progress'])` querying `/api/me/tier-progress`; đọc totalPoints từ tier-progress với fallback `me` (web parity)
  - Status: [x] DONE (tsc + 33 jest pass)
  - Files: `apps/mobile/src/screens/main/HomeScreen.tsx`
  - **Spec impact**: [x] None (parity fix)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

- M4-2 RankedScreen — thêm `useQuery(['tier-progress'])` để tier card hiển thị tier thực thay vì 0 XP fallback
  - Status: [x] DONE (tsc + 33 jest pass)
  - Files: `apps/mobile/src/screens/quiz/RankedScreen.tsx`
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

- M4-3 QuizScreen — invalidate `['tier-progress']` khi finish quiz (parity với `['me']` invalidate đã có), để HomeBanner refresh ngay sau Daily/Ranked/Practice complete
  - Status: [x] DONE (tsc + 33 jest pass)
  - Files: `apps/mobile/src/screens/quiz/QuizScreen.tsx`
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

## Out of scope

- Backend: thêm `totalPoints` field vào UserResponse DTO. Cleaner nhưng cần migration cho web (web đang dùng tier-progress làm primary nguồn). Defer — mobile parity-fix đủ resolve immediate complaint.
- Other mobile screens đọc `me?.totalPoints`: ProfileScreen, OtherProfileScreen, LeaderboardScreen — defer (smaller blast radius vs HomeBanner).
