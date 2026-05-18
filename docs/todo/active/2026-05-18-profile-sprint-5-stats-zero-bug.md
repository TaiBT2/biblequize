# 2026-05-18 — Profile Sprint 5: Stats hiển thị 0 dù user đã chơi

> **Source**: User report 2026-05-18 — screenshot Profile show `TỔNG ĐIỂM 0`, `TỔNG PHIÊN 0`, `TỈ LỆ ĐÚNG 0%` nhưng `CHUỖI HIỆN TẠI 2 ngày`. Inconsistent — user đã chơi 2 daily challenge nhưng stats hiển thị rỗng.

### Root cause (2 FE bug độc lập)

1. **TỔNG ĐIỂM = 0**: `/api/me` trả `UserResponse` DTO không có field `totalPoints` (`UserResponse.java:7-20`). Tổng điểm thật sự được compute server-side qua `UserTierService.getTotalPoints(userId)` (sum `UserDailyProgress.pointsCounted` across all days) và chỉ exposed qua `GET /api/me/tier-progress`. FE đọc `profile.totalPoints` = `undefined` → `?? 0`. Daily Challenge BE credit XP đúng vào ledger (`DailyChallengeService.java:266-284`), data BE chính xác — FE đọc sai endpoint.

2. **TỔNG PHIÊN = 0 + TỈ LỆ ĐÚNG = 0%**: BE `/api/me/history` trả `{ items, totalPages, totalItems, currentPage, hasMore }` (`UserController.java:379-385`). FE expect `{ content: [...] }` (`Profile.tsx:55`). Shape mismatch → defensive fallback rơi vào `[]` → totalSessions/totalQuestions/correctRate hiển thị 0. Audit Sprint 2 P3 #15 đã flag điều này.

### Tasks

- PRO-S5-1 Fix 2 stats bugs trong Profile.tsx
  - Fetch `/api/me/tier-progress` cho `totalPoints` (new useQuery)
  - Change `useQuery<{ content?: ... }>` → `useQuery<{ items?: ... }>` cho history
  - `historyData?.content ?? Array.isArray(...) ? ...` → `historyData?.items ?? []` (clean)
  - Update mock `Profile.test.tsx`: add `/api/me/tier-progress` handler + change history shape `content` → `items`
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Profile.tsx` + `apps/web/src/pages/__tests__/Profile.test.tsx`
  - Test: ✅ Tầng 3 1167/125 = clean state, 0 regression. Profile 10/10 pass.
  - Commit: `fix: Profile stats reading wrong API shape — totalPoints + history (2 bugs) [no-spec-impact]`

### Common

- **Spec impact**: [x] None (read-side bugfix, không đổi data/behavior).
- **Spec strategy**: [x] (c) [no-spec-impact]
