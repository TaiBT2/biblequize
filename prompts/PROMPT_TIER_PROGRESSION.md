# Tier Experience Progression — BibleQuiz

> Tier cao = trải nghiệm khác biệt.
> Paste từng phase vào Claude Code.

---

## Phase 1: Smart Question Selection — Không lặp câu cũ (P0)

```
Hiện tại câu hỏi random → user gặp lại câu đã trả lời đúng → nhàm chán.
Cần: hệ thống chọn câu hỏi thông minh dựa trên lịch sử user.

TRƯỚC KHI CODE: đọc code hiện tại + chia tasks vào TODO.md.

### Bước 0: Đọc code hiện tại

```bash
# Cách lấy câu hỏi hiện tại
find apps/api/src -name "QuestionRepository.java" | xargs cat
find apps/api/src -name "QuestionService.java" -o -name "QuizService.java" | xargs cat
find apps/api/src -name "QuizSessionService.java" | xargs cat

# Entity câu hỏi
cat apps/api/src/main/java/com/biblequiz/modules/quiz/entity/Question.java

# Entity session / answer history
find apps/api/src -name "QuizSession.java" -o -name "SessionAnswer.java" -o -name "UserAnswer.java" | xargs cat

# Check có bảng lưu lịch sử answer chưa
grep -rn "answer_history\|user_answer\|session_answer\|question_history" apps/api/src/main/resources/db/migration/*.sql | head -10
```

In tất cả kết quả trước khi code.

---

### Task 1: Database — Bảng lịch sử câu hỏi per user

Kiểm tra đã có bảng lưu "user X đã gặp question Y, đúng/sai, lúc nào" chưa.

Nếu CHƯA CÓ → tạo migration:

```sql
-- V{next}__add_user_question_history.sql

CREATE TABLE user_question_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    times_seen INT NOT NULL DEFAULT 1,
    times_correct INT NOT NULL DEFAULT 0,
    times_wrong INT NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_correct_at TIMESTAMP NULL,
    last_wrong_at TIMESTAMP NULL,
    next_review_at TIMESTAMP NULL,       -- cho SRS sau này
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_uqh_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_uqh_question FOREIGN KEY (question_id) REFERENCES question(id),
    CONSTRAINT uk_user_question UNIQUE (user_id, question_id),
    
    INDEX idx_uqh_user_last_seen (user_id, last_seen_at),
    INDEX idx_uqh_user_next_review (user_id, next_review_at)
);
```

Nếu ĐÃ CÓ bảng tương tự (vd session_answer lưu từng answer) → có thể query từ đó thay vì tạo bảng mới. Đánh giá approach nào tốt hơn.

Entity:

```java
@Entity
@Table(name = "user_question_history",
       uniqueConstraints = @UniqueConstraint(columns = {"user_id", "question_id"}))
public class UserQuestionHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
    
    private int timesSeen = 1;
    private int timesCorrect = 0;
    private int timesWrong = 0;
    private LocalDateTime lastSeenAt;
    private LocalDateTime lastCorrectAt;
    private LocalDateTime lastWrongAt;
    private LocalDateTime nextReviewAt;
}
```

Repository:

```java
public interface UserQuestionHistoryRepository extends JpaRepository<UserQuestionHistory, Long> {
    
    Optional<UserQuestionHistory> findByUserIdAndQuestionId(Long userId, Long questionId);
    
    // Câu đã gặp
    List<Long> findQuestionIdsByUserId(Long userId);
    
    // Câu đã sai, cần ôn
    @Query("SELECT h.question.id FROM UserQuestionHistory h WHERE h.user.id = :userId AND h.timesWrong > h.timesCorrect AND h.lastSeenAt < :before")
    List<Long> findNeedReviewQuestionIds(@Param("userId") Long userId, @Param("before") LocalDateTime before);
    
    // Đếm câu đã gặp per book
    @Query("SELECT q.book, COUNT(h) FROM UserQuestionHistory h JOIN h.question q WHERE h.user.id = :userId GROUP BY q.book")
    List<Object[]> countSeenByBook(@Param("userId") Long userId);
}
```

Commit: "feat: user_question_history table + entity + repository"

---

### Task 2: Cập nhật history sau mỗi answer

Sau khi user trả lời 1 câu → update history:

```java
// QuizSessionService.java hoặc AnswerService.java — thêm vào flow xử lý answer

public void recordAnswer(Long userId, Long questionId, boolean isCorrect) {
    UserQuestionHistory history = historyRepository
        .findByUserIdAndQuestionId(userId, questionId)
        .orElseGet(() -> {
            UserQuestionHistory h = new UserQuestionHistory();
            h.setUser(userRepository.getReferenceById(userId));
            h.setQuestion(questionRepository.getReferenceById(questionId));
            h.setTimesSeen(0);
            h.setTimesCorrect(0);
            h.setTimesWrong(0);
            return h;
        });
    
    history.setTimesSeen(history.getTimesSeen() + 1);
    history.setLastSeenAt(LocalDateTime.now());
    
    if (isCorrect) {
        history.setTimesCorrect(history.getTimesCorrect() + 1);
        history.setLastCorrectAt(LocalDateTime.now());
        // SRS: đúng → ôn lại sau lâu hơn
        history.setNextReviewAt(LocalDateTime.now().plusDays(
            Math.min(30, history.getTimesCorrect() * 3)  // 3, 6, 9, 12... max 30 ngày
        ));
    } else {
        history.setTimesWrong(history.getTimesWrong() + 1);
        history.setLastWrongAt(LocalDateTime.now());
        // SRS: sai → ôn lại sớm
        history.setNextReviewAt(LocalDateTime.now().plusDays(1));
    }
    
    historyRepository.save(history);
}
```

Tìm chỗ hiện tại xử lý answer → thêm gọi recordAnswer().
KHÔNG thay đổi logic scoring hiện tại, CHỈ thêm recording.

Commit: "feat: record question history after each answer"

---

### Task 3: Smart Question Selection Service

```java
@Service
@RequiredArgsConstructor
public class SmartQuestionSelector {

    private final QuestionRepository questionRepository;
    private final UserQuestionHistoryRepository historyRepository;

    /**
     * Chọn câu hỏi thông minh cho user.
     * 
     * Ưu tiên:
     * 1. Câu CHƯA BAO GIỜ gặp (highest priority)
     * 2. Câu đã gặp + trả lời SAI + đã quá hạn ôn (SRS review)
     * 3. Câu đã gặp + trả lời ĐÚNG nhưng lâu rồi (>30 ngày)
     * 4. Câu đã gặp + trả lời ĐÚNG gần đây (lowest priority — last resort)
     *
     * @param userId User cần chọn câu hỏi
     * @param count Số câu cần
     * @param filters Book, difficulty, language filters
     * @return Danh sách câu hỏi đã chọn, trộn đều các pool
     */
    public List<Question> selectQuestions(Long userId, int count, QuestionFilter filters) {
        
        // Lấy danh sách question IDs đã gặp
        Set<Long> seenIds = new HashSet<>(
            historyRepository.findQuestionIdsByUserId(userId)
        );
        
        // Lấy câu cần ôn (SRS — sai nhiều, quá hạn review)
        Set<Long> reviewIds = new HashSet<>(
            historyRepository.findNeedReviewQuestionIds(userId, LocalDateTime.now())
        );
        
        // Lấy tất cả câu hỏi matching filters
        List<Question> allQuestions = questionRepository.findByFilters(
            filters.getBook(), 
            filters.getDifficulty(), 
            filters.getLanguage()
        );
        
        // Phân pool
        List<Question> neverSeen = new ArrayList<>();  // Pool 1: chưa gặp
        List<Question> needReview = new ArrayList<>();  // Pool 2: cần ôn
        List<Question> seenLongAgo = new ArrayList<>(); // Pool 3: gặp lâu rồi
        List<Question> seenRecently = new ArrayList<>(); // Pool 4: gặp gần đây
        
        for (Question q : allQuestions) {
            if (!seenIds.contains(q.getId())) {
                neverSeen.add(q);
            } else if (reviewIds.contains(q.getId())) {
                needReview.add(q);
            } else {
                // Check last seen
                historyRepository.findByUserIdAndQuestionId(userId, q.getId())
                    .ifPresent(h -> {
                        if (h.getLastSeenAt().isBefore(LocalDateTime.now().minusDays(30))) {
                            seenLongAgo.add(q);
                        } else {
                            seenRecently.add(q);
                        }
                    });
            }
        }
        
        // Shuffle mỗi pool
        Collections.shuffle(neverSeen);
        Collections.shuffle(needReview);
        Collections.shuffle(seenLongAgo);
        Collections.shuffle(seenRecently);
        
        // Phân bổ theo tỷ lệ
        List<Question> selected = new ArrayList<>();
        
        // Ưu tiên 1: 60% câu mới
        int newCount = Math.min((int)(count * 0.6), neverSeen.size());
        selected.addAll(neverSeen.subList(0, newCount));
        
        // Ưu tiên 2: 20% câu cần ôn (SRS)
        int reviewCount = Math.min((int)(count * 0.2), needReview.size());
        selected.addAll(needReview.subList(0, reviewCount));
        
        // Ưu tiên 3: 15% câu gặp lâu rồi
        int oldCount = Math.min((int)(count * 0.15), seenLongAgo.size());
        selected.addAll(seenLongAgo.subList(0, oldCount));
        
        // Còn thiếu → lấy từ pool có sẵn
        int remaining = count - selected.size();
        if (remaining > 0) {
            // Ưu tiên: câu mới → review → cũ → gần đây
            List<Question> fallback = new ArrayList<>();
            fallback.addAll(neverSeen.subList(newCount, neverSeen.size()));
            fallback.addAll(needReview.subList(reviewCount, needReview.size()));
            fallback.addAll(seenLongAgo.subList(oldCount, seenLongAgo.size()));
            fallback.addAll(seenRecently);
            
            selected.addAll(fallback.subList(0, Math.min(remaining, fallback.size())));
        }
        
        // Shuffle final list
        Collections.shuffle(selected);
        
        return selected;
    }
}
```

### Task 4: Integrate — thay thế random query hiện tại

Tìm TẤT CẢ chỗ lấy câu hỏi random → thay bằng SmartQuestionSelector:

```bash
# Tìm chỗ lấy random questions
grep -rn "random\|Random\|shuffle\|ORDER BY RAND\|findRandom" apps/api/src/ --include="*.java" | grep -i question
```

Thay thế:

```java
// TRƯỚC:
List<Question> questions = questionRepository.findRandomByBookAndDifficulty(book, difficulty, count);

// SAU:
QuestionFilter filter = new QuestionFilter(book, difficulty, language);
List<Question> questions = smartQuestionSelector.selectQuestions(userId, count, filter);
```

Apply cho TẤT CẢ modes:
- Practice mode
- Ranked mode
- Daily Challenge (cẩn thận: daily cần giống nhau cho tất cả users cùng language → KHÔNG dùng smart selection cho daily, giữ random)
- Multiplayer room (tất cả players cùng room phải cùng câu → chọn theo room creator hoặc random)

```
Smart selection áp dụng cho:
  ✅ Practice — per user
  ✅ Ranked — per user
  ❌ Daily Challenge — cùng câu cho tất cả (giữ nguyên random)
  ❌ Multiplayer — cùng câu cho cả room (giữ nguyên random)
```

Commit: "feat: smart question selection — prioritize unseen + review questions"

---

### Task 5: API — Thống kê coverage per user

```java
// Endpoint mới: user xem đã cover bao nhiêu % câu hỏi
GET /api/me/question-coverage

Response:
{
  "totalQuestions": 4000,
  "seenQuestions": 1250,
  "coveragePercent": 31.25,
  "byBook": [
    { "book": "Genesis", "total": 75, "seen": 45, "percent": 60.0 },
    { "book": "Exodus", "total": 75, "seen": 20, "percent": 26.7 },
    // ...
  ],
  "needReview": 35,  // câu cần ôn lại
  "masteredQuestions": 800  // đúng 3+ lần, không cần ôn
}
```

Hiện trên Profile page: "Đã khám phá 31% Kinh Thánh" + progress bar per book.
Motivation: user muốn đạt 100% coverage → chơi tiếp.

Commit: "feat: question coverage stats per user"

---

### Task 6: Tests

```java
// SmartQuestionSelectorTest.java

@Test
void selectQuestions_prioritizesUnseenQuestions() {
    // User đã gặp 10 câu, DB có 100 câu
    // Select 10 → phải ưu tiên 90 câu chưa gặp
    List<Question> selected = selector.selectQuestions(userId, 10, filter);
    // Verify: không có câu nào trong 10 câu đã gặp gần đây
}

@Test
void selectQuestions_includesReviewQuestions() {
    // User sai 5 câu, quá hạn review
    // Select 10 → phải có ít nhất 1-2 câu review
    List<Question> selected = selector.selectQuestions(userId, 10, filter);
    // Verify: có câu từ review pool
}

@Test
void selectQuestions_fallbackToSeenWhenNoNewQuestions() {
    // User đã gặp TẤT CẢ câu (pool mới = 0)
    // Select 10 → lấy từ pool cũ, ưu tiên lâu nhất
    List<Question> selected = selector.selectQuestions(userId, 10, filter);
    assertThat(selected).hasSize(10);
}

@Test
void selectQuestions_neverReturnsLessThanRequested_ifPoolSufficient() {
    // DB có 100 câu, select 10 → phải trả đúng 10
    List<Question> selected = selector.selectQuestions(userId, 10, filter);
    assertThat(selected).hasSize(10);
}

@Test
void selectQuestions_returnsAvailable_ifPoolInsufficient() {
    // DB chỉ có 5 câu matching filter, select 10 → trả 5
    List<Question> selected = selector.selectQuestions(userId, 10, filter);
    assertThat(selected).hasSize(5);
}

@Test
void recordAnswer_createsHistoryOnFirstAnswer() {
    service.recordAnswer(userId, questionId, true);
    var history = historyRepo.findByUserIdAndQuestionId(userId, questionId);
    assertThat(history).isPresent();
    assertThat(history.get().getTimesSeen()).isEqualTo(1);
    assertThat(history.get().getTimesCorrect()).isEqualTo(1);
}

@Test
void recordAnswer_incrementsOnRepeatAnswer() {
    service.recordAnswer(userId, questionId, true);
    service.recordAnswer(userId, questionId, false);
    var history = historyRepo.findByUserIdAndQuestionId(userId, questionId);
    assertThat(history.get().getTimesSeen()).isEqualTo(2);
    assertThat(history.get().getTimesCorrect()).isEqualTo(1);
    assertThat(history.get().getTimesWrong()).isEqualTo(1);
}

@Test
void recordAnswer_setsNextReviewSooner_whenWrong() {
    service.recordAnswer(userId, questionId, false);
    var history = historyRepo.findByUserIdAndQuestionId(userId, questionId);
    // Sai → review sau 1 ngày
    assertThat(history.get().getNextReviewAt())
        .isBefore(LocalDateTime.now().plusDays(2));
}

@Test
void recordAnswer_setsNextReviewLater_whenCorrect() {
    service.recordAnswer(userId, questionId, true);
    var history = historyRepo.findByUserIdAndQuestionId(userId, questionId);
    // Đúng lần 1 → review sau 3 ngày
    assertThat(history.get().getNextReviewAt())
        .isAfter(LocalDateTime.now().plusDays(2));
}

@Test
void dailyChallenge_doesNotUseSmartSelection() {
    // Daily phải random, giống nhau cho tất cả users
    // Verify daily KHÔNG gọi SmartQuestionSelector
}

@Test
void questionCoverage_calculatesCorrectly() {
    // User gặp 30/75 câu Genesis
    var coverage = service.getQuestionCoverage(userId);
    var genesis = coverage.getByBook().stream()
        .filter(b -> b.getBook().equals("Genesis")).findFirst().get();
    assertThat(genesis.getPercent()).isEqualTo(40.0);
}
```

Commit: "test: smart question selection + history recording"
```

---

## Phase 2: Difficulty Scaling theo Tier (P1)

```
Tier cao → câu khó hơn, timer ngắn hơn.

### Bước 0: Đọc code hiện tại

```bash
# Xem difficulty hiện tại xử lý thế nào
grep -rn "difficulty\|EASY\|MEDIUM\|HARD" apps/api/src/ --include="*.java" | head -20

# Xem timer config
grep -rn "timer\|timeLimit\|TIME_PER\|seconds" apps/api/src/ --include="*.java" | head -20

# Xem tier/rank config
find apps/api/src -name "*Tier*" -o -name "*Rank*" -o -name "*Level*" | xargs cat 2>/dev/null
```

---

### Task 1: Tier-based difficulty config

```java
// TierDifficultyConfig.java
@Component
public class TierDifficultyConfig {

    /**
     * Phân bổ difficulty theo tier.
     * Tier cao → nhiều câu khó hơn, timer ngắn hơn.
     */
    public DifficultyDistribution getDistribution(int tierLevel) {
        return switch (tierLevel) {
            case 1 -> new DifficultyDistribution(70, 25, 5, 30);   // 70% easy, 25% med, 5% hard, 30s
            case 2 -> new DifficultyDistribution(55, 35, 10, 28);
            case 3 -> new DifficultyDistribution(35, 45, 20, 25);
            case 4 -> new DifficultyDistribution(20, 50, 30, 23);
            case 5 -> new DifficultyDistribution(10, 40, 50, 20);
            case 6 -> new DifficultyDistribution(5, 35, 60, 18);
            default -> new DifficultyDistribution(50, 35, 15, 30);
        };
    }
    
    public record DifficultyDistribution(
        int easyPercent,      // % câu dễ
        int mediumPercent,    // % câu trung bình
        int hardPercent,      // % câu khó
        int timerSeconds      // giây per câu
    ) {}
}
```

### Task 2: Apply vào SmartQuestionSelector

```java
// Cập nhật SmartQuestionSelector.selectQuestions()

public List<Question> selectQuestions(Long userId, int count, QuestionFilter filters) {
    // Lấy tier hiện tại của user
    User user = userRepository.findById(userId).orElseThrow();
    int tierLevel = user.getTierLevel();  // 1-6
    
    DifficultyDistribution dist = tierDifficultyConfig.getDistribution(tierLevel);
    
    // Chia count theo difficulty ratio
    int easyCount = (int) Math.round(count * dist.easyPercent() / 100.0);
    int mediumCount = (int) Math.round(count * dist.mediumPercent() / 100.0);
    int hardCount = count - easyCount - mediumCount;
    
    // Select per difficulty (mỗi difficulty dùng smart selection riêng)
    List<Question> questions = new ArrayList<>();
    questions.addAll(selectByDifficulty(userId, easyCount, "EASY", filters));
    questions.addAll(selectByDifficulty(userId, mediumCount, "MEDIUM", filters));
    questions.addAll(selectByDifficulty(userId, hardCount, "HARD", filters));
    
    // Shuffle final mix
    Collections.shuffle(questions);
    return questions;
}
```

### Task 3: Timer theo tier

```java
// Khi tạo quiz session → set timer based on tier
public QuizSession createSession(Long userId, CreateSessionRequest request) {
    User user = userRepository.findById(userId).orElseThrow();
    DifficultyDistribution dist = tierDifficultyConfig.getDistribution(user.getTierLevel());
    
    QuizSession session = new QuizSession();
    session.setTimerSeconds(dist.timerSeconds());  // Tier 1: 30s, Tier 6: 18s
    // ...
}
```

Frontend hiện timer từ session response (không hardcode 30s).

### Task 4: Tests

```java
@Test
void tier1_gets70PercentEasyQuestions() {
    DifficultyDistribution dist = config.getDistribution(1);
    assertThat(dist.easyPercent()).isEqualTo(70);
    assertThat(dist.timerSeconds()).isEqualTo(30);
}

@Test
void tier6_gets60PercentHardQuestions() {
    DifficultyDistribution dist = config.getDistribution(6);
    assertThat(dist.hardPercent()).isEqualTo(60);
    assertThat(dist.timerSeconds()).isEqualTo(18);
}

@Test
void selectQuestions_respectsDifficultyDistributionForTier() {
    // User tier 3: 35% easy, 45% medium, 20% hard
    // Select 10 → ~3-4 easy, ~4-5 medium, ~2 hard
    List<Question> selected = selector.selectQuestions(tier3UserId, 10, filter);
    long hardCount = selected.stream().filter(q -> q.getDifficulty().equals("HARD")).count();
    assertThat(hardCount).isBetween(1L, 3L);  // ~20% of 10
}

@Test
void timer_shorterForHigherTier() {
    QuizSession session1 = service.createSession(tier1UserId, request);
    QuizSession session6 = service.createSession(tier6UserId, request);
    assertThat(session6.getTimerSeconds()).isLessThan(session1.getTimerSeconds());
}
```

Commit: "feat: difficulty distribution + timer scaling by tier"
```

---

## Phase 3: Tier Rewards — XP Multiplier + Energy (P2)

```
Tier cao → XP nhiều hơn, energy regen nhanh hơn, streak freeze nhiều hơn.

### Task 1: Tier rewards config

```java
// TierRewardsConfig.java
@Component
public class TierRewardsConfig {

    public TierRewards getRewards(int tierLevel) {
        return switch (tierLevel) {
            case 1 -> new TierRewards(1.0, 20, 1);   // 1.0x XP, 20 energy/hr, 1 freeze/week
            case 2 -> new TierRewards(1.1, 22, 1);
            case 3 -> new TierRewards(1.2, 25, 2);
            case 4 -> new TierRewards(1.3, 28, 2);
            case 5 -> new TierRewards(1.5, 30, 3);
            case 6 -> new TierRewards(2.0, 35, 3);
            default -> new TierRewards(1.0, 20, 1);
        };
    }
    
    public record TierRewards(
        double xpMultiplier,
        int energyRegenPerHour,
        int streakFreezesPerWeek
    ) {}
}
```

### Task 2: Apply XP multiplier

Tìm chỗ tính XP hiện tại → nhân với multiplier:

```bash
grep -rn "xp\|XP\|experience\|points.*add\|addPoints\|calculateScore" apps/api/src/ --include="*.java" | head -20
```

```java
// TRƯỚC:
int xpGained = calculateBaseXP(session);

// SAU:
TierRewards rewards = tierRewardsConfig.getRewards(user.getTierLevel());
int xpGained = (int) Math.round(calculateBaseXP(session) * rewards.xpMultiplier());
```

### Task 3: Apply energy regen

Tìm chỗ tính energy regen:

```bash
grep -rn "energy\|regen\|Energy" apps/api/src/ --include="*.java" | head -20
```

```java
// TRƯỚC:
int energyRegen = 20;  // hardcoded

// SAU:
TierRewards rewards = tierRewardsConfig.getRewards(user.getTierLevel());
int energyRegen = rewards.energyRegenPerHour();
```

### Task 4: Apply streak freeze limit

```bash
grep -rn "freeze\|Freeze\|FREEZE" apps/api/src/ --include="*.java" | head -20
```

```java
// TRƯỚC:
int maxFreezes = 1;  // hardcoded

// SAU:
TierRewards rewards = tierRewardsConfig.getRewards(user.getTierLevel());
int maxFreezes = rewards.streakFreezesPerWeek();
```

### Task 5: Frontend — hiện rewards info

```typescript
// Profile page hoặc Tier info modal
// Hiện: "Tier Ngọn Lửa: 1.3x XP • 28 energy/giờ • 2 freeze/tuần"

// Khi tier up → show rewards mới:
// "🎉 Lên Tier Ngọn Lửa!"
// "Mới: 1.3x XP (trước 1.2x)"
// "Mới: 28 energy/giờ (trước 25)"
// "Mới: 2 streak freeze/tuần"
```

### Task 6: Tests

```java
@Test
void tier1_xpMultiplier_is1x() {
    assertThat(config.getRewards(1).xpMultiplier()).isEqualTo(1.0);
}

@Test
void tier6_xpMultiplier_is2x() {
    assertThat(config.getRewards(6).xpMultiplier()).isEqualTo(2.0);
}

@Test
void xpGained_multipliedByTier() {
    // Base XP = 100, tier 5 = 1.5x → 150 XP
    int xp = service.calculateXP(session, tier5User);
    assertThat(xp).isEqualTo(150);
}

@Test
void energyRegen_increasesWithTier() {
    assertThat(config.getRewards(1).energyRegenPerHour()).isEqualTo(20);
    assertThat(config.getRewards(6).energyRegenPerHour()).isEqualTo(35);
}

@Test
void streakFreezes_increasesWithTier() {
    assertThat(config.getRewards(1).streakFreezesPerWeek()).isEqualTo(1);
    assertThat(config.getRewards(5).streakFreezesPerWeek()).isEqualTo(3);
}
```

Commit: "feat: XP multiplier + energy regen + streak freeze by tier"
```

---

## Phase 4: Unlock Game Modes theo Tier (P3)

```
Tier thấp chỉ có Practice + Daily. Tier cao mở thêm modes.

### Task 1: Game mode unlock config

```java
// GameModeUnlockConfig.java
@Component
public class GameModeUnlockConfig {
    
    public Map<String, Integer> getUnlockRequirements() {
        return Map.of(
            "PRACTICE", 1,        // Tier 1: mở sẵn
            "DAILY", 1,           // Tier 1: mở sẵn
            "RANKED", 2,          // Tier 2: Ánh Bình Minh
            "SPEED_RACE", 2,      // Tier 2
            "BATTLE_ROYALE", 3,   // Tier 3: Ngọn Đèn
            "TEAM_VS_TEAM", 4,    // Tier 4: Ngọn Lửa
            "SUDDEN_DEATH", 5,    // Tier 5: Ngôi Sao
            "TOURNAMENT", 4       // Tier 4: Ngọn Lửa
        );
    }
    
    public boolean isUnlocked(String gameMode, int tierLevel) {
        Integer required = getUnlockRequirements().get(gameMode);
        return required != null && tierLevel >= required;
    }
    
    public List<GameModeInfo> getModesForTier(int tierLevel) {
        return getUnlockRequirements().entrySet().stream()
            .map(e -> new GameModeInfo(
                e.getKey(), 
                e.getValue(), 
                tierLevel >= e.getValue()
            ))
            .toList();
    }
}
```

### Task 2: Backend — check unlock trước khi tạo session

```java
// Khi user tạo Ranked session:
if (!gameModeUnlockConfig.isUnlocked("RANKED", user.getTierLevel())) {
    throw new GameModeLockedExcepton("Đạt Ánh Bình Minh để mở khóa Xếp Hạng");
}

// Khi user tạo room Battle Royale:
if (!gameModeUnlockConfig.isUnlocked("BATTLE_ROYALE", user.getTierLevel())) {
    throw new GameModeLockedExcepton("Đạt Ngọn Đèn để mở khóa Battle Royale");
}
```

### Task 3: API — trả unlock status

```java
// GET /api/me/game-modes
@GetMapping("/me/game-modes")
public List<GameModeInfo> getGameModes(Authentication auth) {
    User user = getUser(auth);
    return gameModeUnlockConfig.getModesForTier(user.getTierLevel());
}

// Response:
[
  { "mode": "PRACTICE", "requiredTier": 1, "unlocked": true },
  { "mode": "RANKED", "requiredTier": 2, "unlocked": true },
  { "mode": "BATTLE_ROYALE", "requiredTier": 3, "unlocked": false, "unlockMessage": "Đạt Ngọn Đèn để mở khóa" },
  // ...
]
```

### Task 4: Frontend — locked modes UI

```typescript
// Home page game mode cards
{modes.map(mode => (
  <TouchableOpacity 
    key={mode.mode}
    disabled={!mode.unlocked}
    style={[styles.modeCard, !mode.unlocked && styles.locked]}
    onPress={() => navigate(mode.mode)}
  >
    <Text>{mode.name}</Text>
    {!mode.unlocked && (
      <View style={styles.lockOverlay}>
        <Icon name="lock" />
        <Text>{mode.unlockMessage}</Text>
      </View>
    )}
  </TouchableOpacity>
))}
```

Locked card: dimmed + lock icon + "Đạt [tier name] để mở khóa"
→ User thấy modes đang chờ → motivation lên tier.

### Task 5: Tests

```java
@Test
void tier1_onlyPracticeAndDailyUnlocked() {
    var modes = config.getModesForTier(1);
    var unlocked = modes.stream().filter(GameModeInfo::unlocked).toList();
    assertThat(unlocked).extracting("mode").containsExactlyInAnyOrder("PRACTICE", "DAILY");
}

@Test
void tier3_battleRoyaleUnlocked() {
    assertThat(config.isUnlocked("BATTLE_ROYALE", 3)).isTrue();
    assertThat(config.isUnlocked("BATTLE_ROYALE", 2)).isFalse();
}

@Test
void tier6_allModesUnlocked() {
    var modes = config.getModesForTier(6);
    assertThat(modes).allMatch(GameModeInfo::unlocked);
}

@Test
void createRankedSession_blockedForTier1() {
    assertThrows(GameModeLockedException.class, () -> {
        service.createSession(tier1UserId, rankedRequest);
    });
}
```

Commit: "feat: game mode unlock by tier"
```

---

## Thứ tự thực hiện tổng:

| Phase | Feature | Effort | Impact |
|-------|---------|--------|--------|
| 1 | Smart question selection (không lặp câu cũ) | 2-3 ngày | ⭐⭐⭐⭐⭐ |
| 2 | Difficulty + timer scaling theo tier | 1-2 ngày | ⭐⭐⭐⭐ |
| 3 | XP multiplier + energy + freeze theo tier | 1 ngày | ⭐⭐⭐ |
| 4 | Unlock game modes theo tier | 1-2 ngày | ⭐⭐⭐⭐ |
| **Tổng** | | **5-8 ngày** | |

Mỗi phase độc lập — deploy riêng được. Phase 1 quan trọng nhất, làm trước.
Mỗi phase có tests đầy đủ. Regression sau tất cả.
