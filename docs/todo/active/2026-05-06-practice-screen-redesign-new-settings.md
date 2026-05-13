# 2026-05-06 — Practice screen redesign + new settings [IN PROGRESS]

> **Source**: User prompt + mockup `docs/practice/biblequiz_practice_redesign_desktop_v2.html`. User confirmed all clarifying answers (slider 5–120s, BE-validate min/max chapter/verse, mockup-only features cùng PR).

### Tasks

#### Task PR-1: BE chapter/verse range filter [x] DONE (1927621)
- Files: `QuestionRepository.java` (new query), `QuestionService.getRandomQuestions` (overload), `QuestionController.getQuestions` (new params), `QuestionServiceTest`
- Scope: ~80 LOC + tests
- Commit: `feat(api): add chapter/verse range filter to /api/questions`

#### Task PR-2: BE BibleStructure metadata + validation + endpoint [x] DONE (bdac766)
- Files: new `infrastructure/bible/BibleStructure.java` (mirror `bibleData.ts` BIBLE_VERSES for 66 books), new `GET /api/books/{name}/structure` in `BookController`, validation in `CreateSessionRequest` / `SessionService`
- Scope: ~120 LOC + tests
- Commit: `feat(api): bible book structure endpoint + chapter/verse validation`

#### Task PR-3: BE extend session create with chapter/verse range [x] DONE (9d38392)
- Files: `CreateSessionRequest` (4 new fields), `SessionService.createSession` (pass through to QuestionService), `SessionControllerTest`
- Scope: ~40 LOC + tests
- Commit: `feat(api): chapter/verse range in practice session config`

#### Task PR-4/5/6/7 (combined): FE redesign + time slider + chapter/verse + Quiz timer [x] DONE (02762c2)
- Combined into one commit because all four touch Practice.tsx (or Quiz.tsx for the trivial init-state fix) tightly. Practice.tsx rewritten compact, time slider 5–120s, 4 chapter/verse inputs with bibleData clamping + rangeError memo, Quiz.tsx initial timeLeft uses timerLimit.
- 12 new i18n keys (vi + en).
- Practice.test +5 (15/15 pass), Quiz.test 16/16 still green.

#### Task PR-8: Mockup-only features (real recent sessions + real wrong-question count + retry) [x] DONE (967a50c)
- 3 new BE endpoints; FE replaces MOCK_SESSIONS + fixes broken retry-last call.
- **Skipped from mockup**: Smart Selection toggle (per user decision — drop)

#### Task PR-9: E2E Test Gate + full regression [x] DONE
- Added 3 happy-path E2E TCs (W-M03-L2-016/017/018) for time slider, chapter/verse clamping, retry-wrong banner. PracticePage POM extended with new locators + helpers.
- TC-TODO.md + INDEX.md updated (W-M03 happy-path now 16/16, +3).
- BE: QuestionControllerTest signatures updated for new 9-arg overload — 8/8 pass. Pre-existing failures in SecurityTest, LifelineServiceTest, QuestionReviewControllerTest are NOT caused by this work (Spring context / unused-stub / pre-existing API drift) — see commit message for details.
- FE: Practice.test 17/17 + Quiz.test 16/16. 38 unrelated pre-existing failures in Ranked/RoomLobby/DailyChallenge unaffected.
- Playwright e2e was NOT executed because dev server + DB are not running in this session — TCs are written and ready; run `npm run test:e2e` after starting the stack.

### Decisions
- Chapter/verse validation: cả FE (block submit) + BE (return 400) — defense in depth.
- `BibleStructure` Java mirrors `bibleData.ts` cùng data — accept duplication vì tránh DB query mỗi request validate.
- Mockup "Làm lại câu sai" badge: cần BE endpoint mới `GET /api/sessions/practice/wrong-questions/count` để lấy count + `POST /api/sessions/practice/retry-wrong` để tạo session mới.
- Smart Selection: **dropped per user** — không implement.

---
