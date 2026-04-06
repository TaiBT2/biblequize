# TODO — Tier Experience Progression

## Phase 1: Smart Question Selection [DONE]

### Task 1: Database — user_question_history table + entity + repository
- Status: [x] DONE
- File(s): 
  - db/migration/V{next}__add_user_question_history.sql
  - modules/quiz/entity/UserQuestionHistory.java
  - modules/quiz/repository/UserQuestionHistoryRepository.java
- Checklist:
  - [ ] Check next migration version number
  - [ ] Create migration SQL (user_question_history table)
  - [ ] Create JPA Entity (UUID id, user, question, timesSeen, timesCorrect, timesWrong, lastSeenAt, nextReviewAt)
  - [ ] Create Repository with custom queries (findQuestionIdsByUserId, findNeedReviewQuestionIds, countSeenByBook)
  - [ ] Commit: "feat: user_question_history table + entity + repository"

### Task 2: Record history sau mỗi answer
- Status: [x] DONE
- File(s): modules/quiz/service/SessionService.java
- Checklist:
  - [ ] Add recordAnswer() method to update UserQuestionHistory
  - [ ] Hook into submitAnswer() flow — KHÔNG thay đổi scoring logic
  - [ ] Handle upsert (first answer vs repeat)
  - [ ] SRS nextReviewAt calculation
  - [ ] Commit: "feat: record question history after each answer"

### Task 3: SmartQuestionSelector service
- Status: [x] DONE
- File(s): modules/quiz/service/SmartQuestionSelector.java
- Checklist:
  - [ ] 4 pools: neverSeen, needReview, seenLongAgo, seenRecently
  - [ ] Ratio: 60% new, 20% review, 15% old, 5% fallback
  - [ ] QuestionFilter (book, difficulty, language)
  - [ ] Commit: "feat: smart question selection service"

### Task 4: Integrate — thay thế random query
- Status: [x] DONE
- File(s): modules/quiz/service/SessionService.java, modules/quiz/service/QuestionService.java
- Checklist:
  - [ ] Practice mode → dùng SmartQuestionSelector
  - [ ] Ranked mode → dùng SmartQuestionSelector
  - [ ] Daily Challenge → giữ random (cùng câu cho tất cả users)
  - [ ] Multiplayer → giữ random (cùng câu cho cả room)
  - [ ] Commit: "feat: integrate smart selection for practice + ranked"

### Task 5: API — question coverage stats
- Status: [x] DONE
- File(s): api/UserController.java (hoặc MeController), modules/quiz/service/QuestionCoverageService.java
- Checklist:
  - [ ] GET /api/me/question-coverage endpoint
  - [ ] Response: totalQuestions, seenQuestions, coveragePercent, byBook[], needReview, mastered
  - [ ] Commit: "feat: question coverage stats per user"

### Task 6: Tests
- Status: [x] DONE (12 tests pass)
- File(s): SmartQuestionSelectorTest.java, UserQuestionHistoryTest.java
- Checklist:
  - [ ] selectQuestions_prioritizesUnseenQuestions
  - [ ] selectQuestions_includesReviewQuestions
  - [ ] selectQuestions_fallbackToSeenWhenNoNewQuestions
  - [ ] recordAnswer_createsHistoryOnFirstAnswer
  - [ ] recordAnswer_incrementsOnRepeatAnswer
  - [ ] recordAnswer_setsNextReviewSooner_whenWrong
  - [ ] recordAnswer_setsNextReviewLater_whenCorrect
  - [ ] dailyChallenge_doesNotUseSmartSelection
  - [ ] questionCoverage_calculatesCorrectly
  - [ ] Commit: "test: smart question selection + history recording"

---

## Phase 2: Difficulty Scaling theo Tier [TODO]
## Phase 3: Tier Rewards — XP Multiplier + Energy [TODO]
## Phase 4: Unlock Game Modes theo Tier [TODO]
