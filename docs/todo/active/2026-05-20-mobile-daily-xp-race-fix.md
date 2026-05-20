# 2026-05-20 — Mobile Daily Challenge: fix race condition gây +0 XP

> **Source**: user report — chơi Daily Challenge xong đúng 4/5 mà "XP nhận được +0 XP" (screenshot 2026-05-20 09:25), streak 0.
> **Scope**: `apps/mobile/src/screens/quiz/QuizScreen.tsx` (FE race) + `apps/api/.../DailyChallengeService.java` (BE backstop). ~25 LOC tổng.

## Root cause

**FE race condition trong daily mode**:

1. Daily mode bắt buộc `await POST /api/daily-challenge/answer` để biết đáp án đúng (BE strip `correctAnswer` khỏi GET payload vì security).
2. `setShowResult(true)` fire SYNC trước await (QuizScreen.tsx:125). Result bar (chứa nút "Câu tiếp theo"/"Xem kết quả") render ngay.
3. `setCorrectCount(c => c + 1)` chỉ fire SAU await (cần `correct` từ BE response).
4. User tap "Xem kết quả" giữa lúc await chưa resolve → `nextQuestion` chạy với `correctCount` STALE (vd 3 thay vì 4).
5. POST `/api/daily-challenge/complete` gửi correctCount sai → BE cache `xpEarned: false` (3 < `DAILY_XP_MIN_CORRECT=4`) + UDP không credit +50 XP.
6. `hasCompletedToday` idempotency lock cache trong 48h → user replay không sửa được → UI stuck "+0 XP" cả ngày.

Local `stats.correctAnswers` (route param) match 4 vì setCorrectCount cũng fire (chỉ muộn). UI breakdown 4 ✅ dots match — nhưng POST đã sent trước đó với 3.

**BE secondary**: `getResultData` trust cached `xpEarned` boolean. Nếu cache state lệch (correct≥4 nhưng xpEarned=false do race trên hoặc Redis JSON roundtrip type mismatch), display vĩnh viễn sai.

### Tasks

- M3-1 QuizScreen — fire-and-forget non-daily POST `/api/sessions/{id}/answer` (correct đã tính local nên không cần await) + gate result bar render trên `isCorrect !== null` (chặn user tap Next trước khi state flush trong daily mode)
  - Status: [x] DONE (tsc + 33 jest pass)
  - Files: `apps/mobile/src/screens/quiz/QuizScreen.tsx`
  - **Spec impact**: [x] None (parity bug fix — chuẩn hóa state flow)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

- M3-2 DailyChallengeService.getResultData — recompute `xpEarned` từ cached `correctCount` thay vì trust cached boolean (defensive backstop)
  - Status: [x] DONE (14 DailyChallengeControllerTest pass)
  - Files: `apps/api/src/main/java/com/biblequiz/modules/daily/service/DailyChallengeService.java`
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

## Hệ quả còn lại / cần làm tay

- User đã hit bug hôm nay: BE đã KHÔNG credit +50 XP vào UDP (vì markCompleted ran với correctCount=3). Cache backstop chỉ fix display +50 XP, KHÔNG retroactive credit. Để correct lại totalPoints cần SQL update — defer.
- Streak update có thể đã chạy (`streakService.recordActivity` fire regardless of xpEarned), nhưng UI shows 0 vì authStore user object chưa refresh. Should resolve trên next login/checkAuth.

## Out of scope

- **Mobile HomeBanner / RankedScreen showing 0 XP everywhere**: separate root cause — `/api/me` UserResponse DTO thiếu field `totalPoints`. Mobile đọc `me?.totalPoints` → luôn undefined → fallback 0. Web tránh bug này bằng cách query `/api/me/tier-progress` (HomeBanner.tsx:50-68). Cần follow-up task: thêm tier-progress query vào mobile HomeScreen + RankedScreen (web parity).
- Retroactive XP backfill cho user đã bị bug hôm nay.
