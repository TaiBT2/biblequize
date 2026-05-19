# 2026-05-19 — Fix: Daily Challenge AnswerButton flashes 'wrong' state khi trả lời đúng

> **Source**: User follow-up 2026-05-19 (after commit `ba658ac` — feedback footer fix). User vẫn thấy "hiệu ứng lỗi" (đỏ + X badge) flash trên đáp án vừa chọn trước khi chuyển xanh.
> **Scope**: `apps/web/src/pages/DailyChallenge.tsx` — gate AnswerButton state computation trên `isCorrect !== null` (giống fix cho footer + pill ở commit trước)

## Root cause

Commit `ba658ac` chỉ gate footer + explanation pill trên `isCorrect !== null`. AnswerButton state computation (line 532) vẫn dùng `if (answered)` only. Trong window ~100ms giữa `setAnswered(true)` (T+0) và `setCorrectAnswerIndices([...])` (T+API):

```js
if (answered) {                                    // TRUE ngay T+0
  if (correctAnswerIndices.includes(i)) ...        // FALSE (array rỗng)
  else if (i === selectedAnswer) state = 'wrong'   // ← BUG: picked option = 'wrong'
}
```

Picked button render với state `'wrong'` = red bg + red border + ✗ badge + `answer-wrong-anim`. Khi API về thì state recompute → 'correct' (xanh). User thấy đỏ → xanh.

### Tasks

- DAILY-FLASH-2 Gate AnswerButton reveal branch trên `isCorrect !== null`
  - Status: [x] DONE
  - Files: `apps/web/src/pages/DailyChallenge.tsx`
  - Test: Tầng 1 DailyChallenge 6/7 pass (cùng baseline, no new failure)
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: ✅ impl · ✅ test · ✅ commit · ⏳ redeploy
