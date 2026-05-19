# 2026-05-19 — Fix: Daily Challenge feedback flashes "Sai rồi!" trước khi hiện đúng

> **Source**: User bug report 2026-05-19 (trả lời đúng nhưng panel "Sai rồi!" hiện 1 nhịp trước khi update thành "Đúng")
> **Scope**: `apps/web/src/pages/DailyChallenge.tsx` — gate feedback render trên `isCorrect !== null` để chờ API response

## Root cause

`handleAnswer` set `setAnswered(true)` ngay khi user click (line 350), nhưng `setIsCorrect(correct)` chỉ chạy sau khi POST `/api/daily-challenge/answer` resolved (line 360). Giữa 2 thời điểm này, `isCorrect = null` (initial state). Feedback footer + explanation pill render với `isCorrect ? 'verified/correct/secondary' : 'cancel/incorrect/error'` → `null` falsy → fallback "wrong" branch. Khi API về thì re-render thành "correct". Bug pre-existing, không phải regression từ 3 commit gần đây.

### Tasks

- DAILY-FLASH-1 Gate feedback footer + explanation render trên `isCorrect !== null`
  - Status: [x] DONE
  - Files: `apps/web/src/pages/DailyChallenge.tsx`
  - Test: Tầng 1 DailyChallenge 6/7 pass (cùng baseline, no new failure)
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact] (bug fix, không đổi behavior khi API resolved)
  - Checklist: ✅ impl · ✅ test · ✅ commit · ⏳ redeploy (đang chạy)
