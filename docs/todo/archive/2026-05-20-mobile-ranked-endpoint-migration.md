# 2026-05-20 — Mobile Ranked: migrate sang `/api/ranked/sessions` (web parity)

> **Source**: user report — màn hình Rank intro stuck loading, không vào chơi được; đồng thời giải thích root cause XP không cộng prior task.
> **Scope**: `apps/mobile/src/screens/quiz/RankedScreen.tsx` + `apps/mobile/src/screens/quiz/QuizScreen.tsx` (~80 LOC).

## Root cause

Mobile dùng generic `POST /api/sessions { mode: 'ranked' }` thay vì ranked-specific `POST /api/ranked/sessions`:

| Concern | Generic `/api/sessions` | Ranked `/api/ranked/sessions` |
|---|---|---|
| Catechism gate | THROW BusinessLogicException nếu `basicQuizPassed != true` | Không gate (HomeScreen tự gate qua `basic-quiz-status`) |
| Trả về | `{ sessionId, questions }` | `{ sessionId, currentBook, bookProgress }` — phải GET `/api/questions` riêng |
| Per-answer endpoint | `/api/sessions/{id}/answer` → SessionService.submitAnswer (no ranked scoring) | `/api/ranked/sessions/{id}/answer` → energy decrement + tier-scaled XP + season ranking + leaderboard cache invalidate + achievement check + book progression |
| Hậu quả | (a) Mobile catch silently swallows 400 → button stuck spin → user không biết lỗi gì.<br>(b) Energy/lives không decrement.<br>(c) Points không cộng vào `UserDailyProgress.pointsCounted` → XP không show trên HomeBanner/Leaderboard. | Đúng pipeline. |

User trong screenshot có 75/100 năng lượng (đã từng chơi ranked trên web → BE đã trừ energy), nên `basicQuizPassed` có thể vẫn `null/false` (web bypass gate). Mobile mới enforce gate → 400 → silent fail.

### Tasks

- M2-1 RankedScreen: switch start flow sang `POST /api/ranked/sessions` → `GET /api/questions` (web parity Ranked.tsx:30-83), surface error qua `Alert.alert` khi catch fires
  - Status: [x] DONE (tsc + 33 jest pass)
  - Files: `apps/mobile/src/screens/quiz/RankedScreen.tsx`
  - Test: typecheck + manual smoke on Expo
  - **Spec impact**: [x] None (parity bug fix)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: 2-step start flow · error Alert · askedQuestionIds exclude (web parity) · commit

- M2-2 QuizScreen: route per-question answer sang `/api/ranked/sessions/{sessionId}/answer` khi `mode === 'ranked'` để trigger ranked scoring pipeline (energy/XP/leaderboard)
  - Status: [x] DONE (tsc + 33 jest pass)
  - Files: `apps/mobile/src/screens/quiz/QuizScreen.tsx`
  - Test: typecheck + jest
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: branch endpoint on mode · giữ daily + practice path nguyên · commit

## Out of scope

- BE consolidation (merge 2 session endpoints): scope quá lớn, ngoài task fix.
- Mobile add `basicQuizPassed` gate ở RankedScreen: HomeScreen đã gate qua `basic-quiz-status`. Nếu cần defense-in-depth, tách task riêng.
- Migrate Practice mode sang ranked-style scoring: practice không có energy/leaderboard impact, giữ generic endpoint OK.
