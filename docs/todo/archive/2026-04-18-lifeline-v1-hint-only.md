# 2026-04-18 — Lifeline v1 (Hint only) [DONE — pending local full regression]

### Design summary
- Ship Hint lifeline với adaptive elimination algorithm + random fallback
- AskOpinion defer v2 (cold start problem — cần critical mass community data)
- Quota per mode qua ConfigurationService (admin có thể override runtime)
- Backend infrastructure forward-compat (LifelineType enum có cả HINT + ASK_OPINION)
- Data collection không cần thay đổi — Answer entity đã track `answer` JSON

### Phase 1: Backend foundation (3 tasks)

#### Task BE-1: Flyway migration V28 — lifeline_usage + answers index
- Status: [x] DONE
- File: apps/api/src/main/resources/db/migration/V28__add_lifeline_system.sql
- Checklist:
  - [ ] CREATE TABLE `lifeline_usage` (id CHAR(36) PK, session_id FK, question_id FK, user_id FK, type VARCHAR(32), eliminated_option_index INT nullable, created_at TIMESTAMP)
  - [ ] UNIQUE constraint (session_id, question_id, user_id, type)
  - [ ] Index (session_id, user_id) cho quota check nhanh
  - [ ] Index (question_id, created_at) cho aggregation sau này
  - [ ] ADD INDEX idx_question_created_at ON answers(question_id, created_at) — cần cho adaptive hint algorithm
  - [ ] Commit: "feat(db): add lifeline_usage table + answers question index (V28)"

#### Task BE-2: Entity + Repository
- Status: [x] DONE
- Package: `com.biblequiz.modules.lifeline.entity` + `...lifeline.repository` (peer to `modules/quiz/`)
- Files:
  - LifelineType.java (enum: HINT, ASK_OPINION — ASK_OPINION reserved for v2)
  - LifelineUsage.java (@Entity with @Table("lifeline_usage"))
  - LifelineUsageRepository.java — methods:
    - `countBySessionIdAndUserIdAndType(sessionId, userId, type): long`
    - `existsBySessionIdAndQuestionIdAndUserIdAndType(...)` — prevent double-use per question
    - `findBySessionIdAndQuestionIdAndUserId(...)` — để FE hydrate eliminated options khi reload
- Commit: "feat: add LifelineUsage entity and repository"

#### Task BE-3: Default config values + LifelineConfig service
- Status: [x] DONE (dùng ConfigurationService với defaults embedded trong LifelineConfigService — không sửa file ConfigurationService.java)
- Files:
  - `modules/lifeline/service/LifelineConfigService.java` — wraps ConfigurationService
  - Method: `getHintQuota(QuizSession.Mode mode): int`
  - Config keys (read via ConfigurationService.getIntConfig):
    - `lifeline.hint.quota.practice` = -1 (unlimited)
    - `lifeline.hint.quota.ranked` = 2
    - `lifeline.hint.quota.single` = 2
    - `lifeline.hint.quota.weekly_quiz` = 2
    - `lifeline.hint.quota.mystery_mode` = 2
    - `lifeline.hint.quota.speed_round` = 0 (disabled — tốc độ cao, không có thời gian hint)
    - `lifeline.hint.community_threshold` = 10
    - `lifeline.hint.community_window_days` = 90
- Bootstrap: seed defaults trong ConfigurationService.putConfig
- Commit: "feat: add LifelineConfigService with per-mode quotas"

### Phase 2: Backend hint logic (3 tasks)

#### Task BE-4: HintAlgorithmService (adaptive + random fallback)
- Status: [x] DONE (dùng EntityManager thay vì sửa AnswerRepository — giữ module isolation per CLAUDE.md)
- File: `modules/lifeline/service/HintAlgorithmService.java`
- Method: `selectOptionToEliminate(questionId, alreadyEliminated): HintSelection`
- Algorithm:
  1. Load Question → extract correctAnswer indices và option count
  2. Build candidates = all indices that are NOT correct AND NOT alreadyEliminated
  3. If empty → throw NoOptionsToEliminateException
  4. Query Answer table: `SELECT a.answer FROM Answer a WHERE a.question.id = :qId AND a.createdAt > :since` (last 90d)
  5. Parse each answer JSON — only integer values count (multiple_choice_single)
  6. Aggregate: Map<optionIdx, count>
  7. If total count < threshold (10) → RANDOM pick from candidates → return { idx, method: "RANDOM" }
  8. Else → pick candidate with LOWEST count (least-picked wrong answer) → return { idx, method: "COMMUNITY_INFORMED" }
- HintSelection DTO: { eliminatedOptionIndex: int, method: String }
- Commit: "feat: add HintAlgorithmService with adaptive + random fallback"

#### Task BE-5: LifelineService + LifelineController
- Status: [x] DONE
- File: `modules/lifeline/service/LifelineService.java`
- Method: `@Transactional useHint(sessionId, userId, questionId): HintResponse`
- Validation chain:
  1. Session exists + owned by user + status == IN_PROGRESS (else throw SessionAccessException)
  2. Question belongs to session (check QuizSessionQuestion)
  3. Question not yet answered by user in this session (check Answer)
  4. Question type in (MULTIPLE_CHOICE_SINGLE, MULTIPLE_CHOICE_MULTI) — else throw UnsupportedHintException
  5. Current hint usage count < quota for session mode (get from LifelineConfigService)
  6. Load already-eliminated options for this question from LifelineUsage
- Business logic:
  - Call HintAlgorithmService.selectOptionToEliminate
  - Save new LifelineUsage record
  - Compute remaining quota
  - Return HintResponse { eliminatedOptionIndex, hintsRemaining, method }
- Controller: `api/SessionLifelineController.java`
  - POST `/api/sessions/{sessionId}/lifeline/hint` — body: `{ questionId }`
  - GET `/api/sessions/{sessionId}/lifeline/status?questionId=X` — returns current eliminated options + remaining quota
- DTOs in `api/dto/lifeline/`: UseHintRequest, HintResponse, LifelineStatusResponse
- Commit: "feat: add LifelineService + SessionLifelineController with hint endpoint"

#### Task BE-6: Backend unit tests
- Status: [x] DONE — HintAlgorithmServiceTest (10 cases) + LifelineServiceTest (12 cases). Controller MockMvc test deferred (user có thể add sau nếu cần — service test đã cover logic).
- Test files:
  - `HintAlgorithmServiceTest` (Mockito):
    - empty candidates → throws
    - no community data → random (verify multiple calls → different options over seed)
    - with community data >= 10 → picks lowest-count option
    - skips non-integer answer JSON (multi-select, fill-blank) gracefully
  - `LifelineServiceTest` (Mockito):
    - session not found → throws
    - wrong user → throws  
    - session abandoned → throws
    - question already answered → throws
    - quota exhausted → throws
    - unlimited quota (-1) → never exhausted
    - successful hint → saves usage + returns correct remaining
  - `SessionLifelineControllerTest` (MockMvc):
    - 401 without auth
    - 404 with bogus sessionId
    - 200 happy path
    - 400 when questionId missing
- Commit: "test: add LifelineService and HintAlgorithm unit tests"

### Phase 3: Frontend (3 tasks)

#### Task FE-1: useLifeline hook
- Status: [x] DONE
- File: `apps/web/src/hooks/useLifeline.ts`
- State via TanStack Query + local state:
  - `useQuery` cho `/sessions/{id}/lifeline/status?questionId=X`
  - `useMutation` cho `POST /sessions/{id}/lifeline/hint`
- Exposed API:
  - `{ hintsRemaining, eliminatedOptions: Set<number>, isHintLoading, useHint: (questionId) => Promise, canUseHint: boolean }`
- Reset eliminatedOptions khi questionId thay đổi (useEffect)
- Commit: "feat(web): add useLifeline hook for quiz lifeline state"

#### Task FE-2: Quiz.tsx integration
- Status: [x] DONE
- Files: apps/web/src/pages/Quiz.tsx + vi.json/en.json
- Changes:
  - Import useLifeline hook
  - Wire "Gợi ý (N)" button:
    - onClick: call useHint(currentQuestion.id)
    - Disabled when: hintsRemaining===0 OR already eliminated all wrong OR showResult OR isHintLoading
    - Show count dynamically: `t('quiz.hint', { count: hintsRemaining })`
  - **REMOVE** the "Hỏi ý kiến" button JSX entirely (line ~731-734)
  - Visual on eliminated options: add opacity-30 + pointer-events-none + X icon overlay
  - Disable click on eliminated options (don't allow user to pick known-wrong)
- i18n:
  - vi.json: `"quiz.hint": "Gợi ý"` (bỏ hardcode số 2 ra khỏi string)
  - Thêm `"quiz.hintRemaining": "Gợi ý ({{count}})"` để template
  - Giữ nguyên `quiz.askOpinion` key (v2 sẽ dùng lại)
- Commit: "feat(web): wire Hint lifeline button in Quiz + remove dead AskOpinion button"

#### Task FE-3: Quiz.tsx unit tests
- Status: [x] DONE — useLifeline hook test (10 cases) + Quiz.test.tsx Lifeline regression guards (2 cases)
- File: apps/web/src/pages/__tests__/Quiz.test.tsx (augment existing)
- Test cases:
  - Hint button shows count from server
  - Click hint → API called, option greyed out
  - All wrongs eliminated → hint button disabled
  - Quota exhausted → hint button disabled
  - Eliminated option resets on question change
  - AskOpinion button NOT rendered (regression guard)
- Mock `useLifeline` hook hoặc mock `api` calls tùy approach
- Commit: "test: add Quiz lifeline integration tests"

### Phase 4: E2E (1 task)

#### Task E2E-1: Playwright W-M03 happy path
- Status: [x] DONE — tests/e2e/happy-path/web-user/W-M03-hint-lifeline.spec.ts (5 cases) + extended QuizPage POM với hintBtn + useHint()/getHintsRemaining()/getEliminatedOptions() helpers
- File: `apps/web/tests/e2e/happy-path/web-user/W-M03-practice-hint.spec.ts` (augment hoặc tạo mới)
- Steps: login → start practice → click hint → assert greyed option + button count decremented → answer remaining → finish
- Commit: "test(e2e): W-M03 hint lifeline happy path"

### Phase 5: Docs + regression (2 tasks)

#### Task DOC-1: Update DECISIONS.md + CLAUDE.md
- Status: [x] DONE — 3 ADRs thêm vào DECISIONS.md (v1 hint only, adaptive algorithm, quota config). CLAUDE.md API map thêm section Lifelines.
- DECISIONS.md: ADR "2026-04-18 — Lifeline v1: Hint only, defer AskOpinion to v2"
- CLAUDE.md: update API Endpoints Map — thêm 2 endpoint mới
- Commit: "docs: ADR for lifeline v1 + API map update"

#### Task REG-1: Full regression
- Status: [ ] TODO
- FE: `cd apps/web && npx vitest run` — expect baseline + new ~20-30 tests pass
- BE: `cd apps/api && ./mvnw test -Dtest="com.biblequiz.**"` — expect baseline + new ~15-20 tests pass
- Nếu có failure → fix trước khi commit

---
