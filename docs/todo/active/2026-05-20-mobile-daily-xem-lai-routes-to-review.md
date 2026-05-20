# 2026-05-20 — Mobile Daily "Xem lại" route đúng sang Review thay vì Start

> **Source**: user report — tap "Xem lại" trên HomeScreen DailyCompletedStrip thì lại bị đưa vào Start screen "Bắt đầu thử thách" (vẫn có thể replay), không phải review answers.
> **Scope**: 3 file mobile. ~25 LOC.

## Root cause

`HomeScreen.tsx:167` (trước fix): `onReview={navTo('QuizTab', 'DailyChallenge')}`. Navigate sang **DailyChallenge** (start screen), không phải **DailyResults** (review screen).

DailyChallengeScreen render unconditionally hero "Bắt đầu thử thách" — không kiểm `challenge.alreadyCompleted`. User tap Start → POST `/api/daily-challenge/start` mới return 409 → Alert "Đã hoàn thành" → goBack. Bypass logic chỉ chặn sau khi tap, không pre-empt UI.

DailyResultScreen yêu cầu `stats` route param từ quiz session. Khi vào qua "Xem lại" (không qua quiz), không có stats → `correct`/`total` fallback 0/5 → ring hiển thị 0%.

Web parity: web "/daily" route render conditional dựa trên `done`/`alreadyCompleted` — cùng URL nhưng UI 2 state khác nhau. Mobile có 2 screens riêng (DailyChallenge + DailyResults) nên cần route đúng từ caller.

### Tasks

- M5-1 HomeScreen `onReview` — navigate trực tiếp sang `DailyResults` với stats `{ correctAnswers, totalQuestions, mode: 'daily' }` từ `daily` query (đã có sẵn `correctCount` + `totalCount` từ `/api/daily-challenge` payload khi alreadyCompleted=true)
  - Status: [x] DONE (tsc + 33 jest pass)
  - Files: `apps/mobile/src/screens/main/HomeScreen.tsx`
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

- M5-2 DailyResultScreen — fall back `correct`/`total` sang BE result (`/api/daily-challenge/result.correctCount + totalQuestions`) khi stats route param thiếu. Extend `DailyResultResponse` interface để type-safe.
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/quiz/DailyResultScreen.tsx`
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

- M5-3 DailyChallengeScreen guard — `useEffect` watch `challenge.alreadyCompleted`, nếu true → `navigation.replace('DailyResults', {...})`. Defense-in-depth cho các entry points khác (tab nav, deeplink, back-stack).
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/quiz/DailyChallengeScreen.tsx`
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

## Out of scope

- Consolidate DailyChallenge + DailyResults thành 1 screen with conditional render (web parity). Bigger refactor; defer.
- `DailyResultScreen.stats.questionScores` undefined trong "Xem lại" path → 5 dots breakdown row hidden. Acceptable (BE chưa expose `resultsBreakdown` từ `/api/daily-challenge/result` — TODO BE follow-up).
