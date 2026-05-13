# 2026-05-07 — BasicQuiz UX parity (sound + haptic + full review) [DONE]

> **Source**: User prompt — "màn quiz giáo lý cơ bản rất simple, trả lời đúng/sai cũng không thông báo, không sound/giải thích như các màn quiz khác". Picked Option A (preserve exam-mode anti-cheat, only add UX feedback).

### Tasks

- BE: rename `BasicQuizResultResponse.wrongAnswers` → `reviews` with `isCorrect` flag; service emits review for ALL 10 questions (not only wrong). `BasicQuizServiceTest` updated, 11/11 pass.
- FE BasicQuiz.tsx: `soundManager.play('buttonTap')` + `haptic.select()` on option pick; `haptic.tap()` on prev/next; on submit response → `perfectScore`/`quizComplete`/`wrongAnswer` + matching haptic.
- FE: shared `ReviewList` component renders all 10 entries with check/x badge; both Pass and Fail screens show full review (Pass keeps celebration + Ranked CTA above, Fail keeps cooldown footer below).
- FE i18n: added `reviewAll`, `reviewCorrectBadge`, `reviewWrongBadge` keys (vi+en); updated `failSubtitle` copy.
- FE tests: BasicQuiz.test.tsx — added pass-screen-full-review case; updated fail-screen mock to new `reviews` shape; 7/7 pass.
- Regression: full vitest 1185 tests, 1147 pass / 38 fail (= pre-existing baseline in Ranked/RoomLobby/DailyChallenge, no new failures).

---
