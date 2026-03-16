# Ranking System Improvement Plan

> Trang thai: DONE (Backend)
> Ngay tao: 2026-03-16
> Branch: refactor/api

---

## Tong quan

Cai thien he thong ranking/leaderboard tu mot he thong xep hang tuong doi don gian thanh mot he thong chuyen nghiep voi tier, season, achievement va bao mat tot hon.

---

## Phase 1 — Bao mat & Bug fix (Uu tien CAO)

### 1.1 Chong gian lan — Xoa client-side `isCorrect`

- **File:** `apps/api/src/main/java/com/biblequiz/api/RankedController.java` (dong 122-123)
- **Van de:** Client gui `isCorrect` trong payload, co the hack de dang
- **Cach sua:**
  - Xoa nhanh `if (payload.containsKey("isCorrect"))` — chi giu lai server-side validation
  - Bat buoc gui `questionId` + `answer`, server tu validate
  - Frontend: da xoa tu truoc (FIX #5 trong Quiz.tsx)
- **Trang thai:** [x] Hoan thanh — Xoa branch `isCorrect` khoi backend, chi giu server-side validation

### 1.2 Fix book progression reset moi ngay

- **File:** `apps/api/src/main/java/com/biblequiz/api/RankedController.java` (dong 400-420)
- **Van de:** Khi tao record moi cho ngay moi, `currentBook` reset ve "Genesis"
- **Cach sua:**
  - Lay `currentBook`, `currentBookIndex`, `isPostCycle`, `currentDifficulty` tu record ngay gan nhat
  - Chi reset `livesRemaining`, `questionsCounted`, `pointsCounted`
- **Trang thai:** [x] Hoan thanh — Carry over book progression tu ngay truoc

### 1.3 Rate limiting cho submit answer

- **File:** `apps/api/src/main/java/com/biblequiz/infrastructure/security/RateLimitingFilter.java`
- **Van de:** Khong co gioi han rieng cho ranked endpoint, co the spam submit
- **Cach sua:**
  - Them tier `ranked` vao RateLimitingFilter: 30 req / 60 giay
  - Them config `app.rate-limit.ranked` vao application.yml
  - Dung key rieng `ip:ranked` de tach biet voi general rate limit
- **Trang thai:** [x] Hoan thanh — 30 req/60s cho /api/ranked/sessions/*/answer

---

## Phase 2 — Hieu nang (Uu tien CAO)

### 2.1 Toi uu leaderboard query

- **File:** `apps/api/src/main/java/com/biblequiz/api/LeaderboardController.java` (dong 77-131)
- **Van de:** Weekly va all-time load TOAN BO records roi group trong Java — chet khi du lieu lon
- **Cach sua:**
  - Viet native SQL voi `GROUP BY user_id`, `SUM(points_counted)`, `ORDER BY`, `LIMIT/OFFSET`
  - Them vao `UserDailyProgressRepository`
  - Controller chi goi repository, khong xu ly logic
- **Trang thai:** [x] Hoan thanh — 3 native SQL queries voi GROUP BY + LIMIT/OFFSET, controller goi truc tiep repository

### 2.2 Cache leaderboard trong Redis

- **Van de:** Moi request deu query database
- **Cach sua:**
  - Dung CacheService co san, cache ket qua voi key `leaderboard:{type}:{params}` (TTL 5 phut)
  - Invalidate `leaderboard:*` trong RankedController khi save progress
- **Trang thai:** [x] Hoan thanh — Cache hit tra ket qua tu Redis, invalidate sau moi answer submit

---

## Phase 3 — Gameplay (Uu tien TRUNG BINH)

### 3.1 He thong Tier co dinh

- **File moi:** `apps/api/src/main/java/com/biblequiz/modules/ranked/model/RankTier.java`
- **Thiet ke:**
  ```
  Tan Tin Huu    :      0 diem
  Mon Do         :    500 diem
  Thay Giang     :  2,000 diem
  Truong Lao     :  8,000 diem
  Tien Tri       : 25,000 diem
  Su Do          : 80,000 diem
  ```
- **Logic:** Tinh dua tren tong diem all-time cua user
- **API moi:** `GET /api/me/tier` — tra ve tier hien tai, diem can de len tier tiep
- **Frontend:** Hien thi tier icon + progress bar tren trang Ranked va Leaderboard (chua lam FE)
- **Trang thai:** [x] Hoan thanh (Backend) — Enum RankTier + endpoint GET /api/me/tier tra ve tier, progress%, pointsToNextTier

### 3.2 Can bang lai cong thuc tinh diem

- **File:** `apps/api/src/main/java/com/biblequiz/api/RankedController.java`
- **Thay doi da thuc hien:**
  | Thanh phan        | Truoc                           | Sau                                  |
  |-------------------|---------------------------------|--------------------------------------|
  | Base score        | Easy:10, Med:20, Hard:30        | Easy:10, Med:25, Hard:50             |
  | Diff multiplier   | 1.0 / 1.2 / 1.5 (chong cheo)   | Xoa — da tinh vao base score         |
  | Streak bonus      | 5+:50, 10+:120, 15+:200        | 3+: +10/streak (tuyen tinh)          |
  | Perfect bonus     | >=25s con lai: +5               | >=15s con lai: +5                    |
- **Trang thai:** [x] Hoan thanh

### 3.3 Cai thien he thong mang (Lives)

- **File:** `apps/api/src/main/java/com/biblequiz/api/RankedController.java`
- **Thay doi da thuc hien:**
  - Hoi phuc mang: +1 mang moi 30 phut (tinh tu `lastUpdatedAt`), cap 30
  - Bonus: +3 mang khi dat streak 10 (chi 1 lan moi streak)
  - Apply recovery trong `submitRankedAnswer` (truoc khi check blocked) va `getRankedStatus`
- **Trang thai:** [x] Hoan thanh

---

## Phase 4 — Feature moi (Uu tien THAP)

### 4.1 Season system (Mua giai)

- **Database:** Flyway V7 — bang `seasons`, `season_rankings`
- **Backend:**
  - Entity: `Season`, `SeasonRanking`
  - Repository: `SeasonRepository`, `SeasonRankingRepository` (voi native SQL leaderboard)
  - Service: `SeasonService` — `addPoints()` tich luy diem moi answer
  - Controller: `SeasonController` — endpoints: active season, season leaderboard, my-rank, list seasons
  - Tich hop: `RankedController` goi `seasonService.addPoints()` sau moi answer dung
- **Trang thai:** [x] Hoan thanh

### 4.2 Achievement / Badge system

- **Database:** Flyway V7 — bang `achievements`, `user_achievements` + 7 seed badges
- **Backend:**
  - Entity: `Achievement`, `UserAchievement`
  - Repository: `AchievementRepository`, `UserAchievementRepository`
  - Service: `AchievementService` — `checkAndAward()` kiem tra va trao badge tu dong
  - Controller: `AchievementController` — endpoint `GET /api/achievements/me`
  - Tich hop: `RankedController` goi `achievementService.checkAndAward()` sau moi answer
- **Badges:** Ngon Lua, Hoc Gia, Vo Dich, Kien Tri, Hoan Hao, Truong Lao, Su Do
- **Luu y:** Frontend can thay fake badges trong Leaderboard.tsx bang data that tu API
- **Trang thai:** [x] Hoan thanh (Backend)

### 4.3 Monthly leaderboard

- **Backend:**
  - Repository: Them `countUsersAheadInMonth` native query
  - Controller: Them `GET /api/leaderboard/monthly` va `GET /api/leaderboard/monthly/my-rank`
  - Cache: Redis TTL 5 phut giong weekly/all-time
- **Frontend:** Can them tab "THANG" trong Leaderboard.tsx
- **Trang thai:** [x] Hoan thanh (Backend)

### 4.4 Tach logic ra Service layer

- **Tao moi:** `ScoringService` — tinh diem, validate answer (server-side)
  - `calculate()`: base score + time bonus + perfect bonus + streak bonus
  - `validateMultipleChoiceSingle()`, `validateFillInBlank()`
- **Refactor:** RankedController giam tu 663 dong xuong 628 dong
  - Validation block: dung `scoringService.validateXxx()` thay vi inline
  - Scoring block: dung `scoringService.calculate()` thay vi inline
- **Trang thai:** [x] Hoan thanh

---

## Checklist tong hop

| #   | Muc                               | Uu tien     | Trang thai |
|-----|-----------------------------------|-------------|------------|
| 1.1 | Xoa client-side isCorrect         | CAO         | [x]        |
| 1.2 | Fix book reset moi ngay           | CAO         | [x]        |
| 1.3 | Rate limiting submit answer       | CAO         | [x]        |
| 2.1 | Toi uu leaderboard query          | CAO         | [x]        |
| 2.2 | Cache leaderboard Redis           | CAO         | [x]        |
| 3.1 | He thong Tier                     | TRUNG BINH  | [x]        |
| 3.2 | Can bang cong thuc diem           | TRUNG BINH  | [x]        |
| 3.3 | Cai thien he thong mang           | TRUNG BINH  | [x]        |
| 4.1 | Season system                     | THAP        | [x]        |
| 4.2 | Achievement / Badge               | THAP        | [x]        |
| 4.3 | Monthly leaderboard               | THAP        | [x]        |
| 4.4 | Tach Service layer                | THAP        | [x]        |
