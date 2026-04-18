# #4 Weekly Events + Mystery Mode + Speed Round — Variety & Surprise

> Mỗi ngày/tuần có gì đó mới → không bao giờ nhàm chán.
> Paste vào Claude Code.

---

```
Thêm 3 tính năng tạo variety cho BibleQuiz:
1. Weekly Themed Quiz — chủ đề thay đổi mỗi tuần
2. Mystery Mode — random hoàn toàn, không biết trước sách/difficulty  
3. Speed Round — 10 câu × 10 giây, xuất hiện 1 lần/ngày

TRƯỚC KHI CODE: đọc code quiz hiện tại. Chia tasks vào TODO.md.

---

## Feature A: Weekly Themed Quiz

### Task 1: Backend — Weekly Theme system

```java
// WeeklyThemeService.java

@Service
public class WeeklyThemeService {

    // Danh sách themes xoay vòng
    private static final List<WeeklyTheme> THEMES = List.of(
        new WeeklyTheme("miracles", "Các phép lạ", "Miracles of the Bible",
            List.of("healing", "miracle", "sign", "wonder"),
            List.of("Exodus", "1 Kings", "2 Kings", "Matthew", "Mark", "Luke", "John", "Acts")),
            
        new WeeklyTheme("kings", "Các vị vua", "Kings & Rulers",
            List.of("king", "reign", "throne", "kingdom"),
            List.of("1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles")),
            
        new WeeklyTheme("prophecy", "Lời tiên tri", "Prophecy & Fulfillment",
            List.of("prophecy", "prophet", "foretold"),
            List.of("Isaiah", "Jeremiah", "Ezekiel", "Daniel", "Matthew", "Revelation")),
            
        new WeeklyTheme("creation", "Sáng tạo & Thiên nhiên", "Creation & Nature",
            List.of("creation", "earth", "heaven", "sea", "animal"),
            List.of("Genesis", "Job", "Psalms", "Proverbs")),
            
        new WeeklyTheme("women", "Phụ nữ trong Kinh Thánh", "Women of the Bible",
            List.of("woman", "mother", "wife", "daughter"),
            List.of("Genesis", "Exodus", "Ruth", "Esther", "Luke", "Acts")),
            
        new WeeklyTheme("parables", "Các ẩn dụ", "Parables of Jesus",
            List.of("parable", "story", "told them"),
            List.of("Matthew", "Mark", "Luke")),
            
        new WeeklyTheme("prayers", "Cầu nguyện", "Prayers in the Bible",
            List.of("prayer", "pray", "cried out"),
            List.of("Genesis", "Psalms", "Daniel", "Matthew", "Acts")),
            
        new WeeklyTheme("journeys", "Các cuộc hành trình", "Journeys & Travels",
            List.of("journey", "travel", "went", "wilderness"),
            List.of("Genesis", "Exodus", "Numbers", "Acts")),
            
        new WeeklyTheme("love", "Tình yêu thương", "Love & Compassion",
            List.of("love", "compassion", "mercy", "grace"),
            List.of("Ruth", "Song of Solomon", "John", "1 Corinthians", "1 John")),
            
        new WeeklyTheme("courage", "Can đảm", "Courage & Faith",
            List.of("courage", "brave", "fear not", "faith"),
            List.of("Joshua", "Judges", "1 Samuel", "Daniel", "Hebrews"))
    );

    /**
     * Lấy theme tuần hiện tại (xoay vòng theo week number)
     */
    public WeeklyTheme getCurrentTheme() {
        int weekOfYear = LocalDate.now().get(WeekFields.ISO.weekOfYear());
        return THEMES.get(weekOfYear % THEMES.size());
    }

    /**
     * Lấy câu hỏi theo theme tuần
     */
    public List<Question> getWeeklyQuestions(Long userId, int count, String language) {
        WeeklyTheme theme = getCurrentTheme();
        
        // Lấy câu từ các sách liên quan theme
        List<Question> questions = questionRepository
            .findByBookInAndLanguageAndIsActiveTrue(theme.getBooks(), language);
        
        // Filter thêm bằng keywords nếu có tag system
        // Shuffle + smart select (ưu tiên chưa gặp)
        return smartQuestionSelector.selectFromPool(userId, questions, count);
    }
}

// API
@GetMapping("/api/quiz/weekly")
public WeeklyQuizResponse getWeeklyQuiz(Authentication auth,
    @RequestParam(defaultValue = "vi") String language) {
    WeeklyTheme theme = weeklyThemeService.getCurrentTheme();
    List<Question> questions = weeklyThemeService.getWeeklyQuestions(getUserId(auth), 10, language);
    
    return WeeklyQuizResponse.builder()
        .theme(theme)
        .questions(questions)
        .expiresAt(getEndOfWeek())
        .build();
}
```

### Task 2: Frontend — Weekly Quiz card trên Home

```
Home page thêm card:
┌──────────────────────────────────────┐
│  🎯 Chủ đề tuần này                  │
│                                      │
│  "Các phép lạ trong Kinh Thánh"      │
│  10 câu hỏi • Còn 3 ngày            │
│                                      │
│  [Chơi ngay →]                       │
│                                      │
│  🏆 Top 3: An (95%) • Bình (90%)    │
└──────────────────────────────────────┘
```

Weekly quiz có leaderboard riêng (ai điểm cao nhất trong tuần).
Badge: hoàn thành weekly quiz 4 tuần liên tiếp → "Người theo đuổi" badge.

Commit: "feat: weekly themed quiz"

---

## Feature B: Mystery Mode

### Task 3: Backend — Mystery mode

```java
// MysteryModeService.java

@Service
public class MysteryModeService {

    /**
     * Mystery Mode: user KHÔNG biết trước:
     * - Sách nào
     * - Difficulty nào  
     * - Chủ đề gì
     * 
     * Random hoàn toàn từ TẤT CẢ sách + TẤT CẢ difficulty.
     * Excitement: không chuẩn bị được → adrenaline.
     */
    public MysteryQuiz createMysteryQuiz(Long userId, String language) {
        // Random 10 câu từ bất kỳ sách, bất kỳ difficulty
        List<Question> questions = smartQuestionSelector.selectQuestions(
            userId, 10,
            QuestionFilter.builder()
                .language(language)
                .book(null)        // ANY book
                .difficulty(null)  // ANY difficulty
                .build()
        );
        
        // Bonus XP cho mystery mode (vì không chuẩn bị được)
        double xpBonus = 1.5; // 50% bonus XP
        
        return MysteryQuiz.builder()
            .questions(questions)
            .xpMultiplier(xpBonus)
            .timerSeconds(25) // Cố định 25s
            .build();
    }
}

// API
@PostMapping("/api/quiz/mystery")
public MysteryQuiz startMysteryQuiz(Authentication auth,
    @RequestParam(defaultValue = "vi") String language) {
    return mysteryModeService.createMysteryQuiz(getUserId(auth), language);
}
```

### Task 4: Frontend — Mystery Mode UI

```
Entry point: Home page hoặc Practice page

┌──────────────────────────────────────┐
│  🎲 Mystery Mode                     │
│                                      │
│  "Bạn không biết gì về quiz sắp tới" │
│  Sách: ???                           │
│  Độ khó: ???                         │
│  Bonus: 1.5x XP                     │
│                                      │
│  [Tôi đủ can đảm! →]                │
└──────────────────────────────────────┘
```

Trong quiz:
- KHÔNG hiện tên sách cho đến khi trả lời
- Sau mỗi câu: "📖 Câu này từ sách: Sáng Thế Ký" (reveal)
- Cuối quiz: thống kê bao nhiêu sách đã gặp

```typescript
// Sau mỗi answer → reveal book name
{answerRevealed && (
  <div className="book-reveal animate-fadeIn">
    📖 {getBookName(currentQuestion.book, language)}
  </div>
)}
```

Commit: "feat: mystery mode — random everything + 1.5x XP"

---

## Feature C: Speed Round

### Task 5: Backend — Speed Round

```java
// SpeedRoundService.java

@Service
public class SpeedRoundService {

    /**
     * Speed Round: 10 câu × 10 giây.
     * Xuất hiện 1 lần/ngày (like Daily Challenge nhưng khác format).
     * Chỉ câu DỄ (vì timer rất ngắn).
     * Double XP reward.
     */
    public SpeedRound getSpeedRound(Long userId, String language) {
        // Check đã chơi hôm nay chưa
        boolean playedToday = speedRoundRepository
            .existsByUserIdAndPlayedAtAfter(userId, LocalDate.now().atStartOfDay());
        
        if (playedToday) {
            // Trả countdown tới ngày mai
            return SpeedRound.builder()
                .available(false)
                .nextAvailableAt(LocalDate.now().plusDays(1).atStartOfDay())
                .build();
        }
        
        // 10 câu DỄ (vì chỉ 10s/câu)
        List<Question> questions = smartQuestionSelector.selectQuestions(
            userId, 10,
            QuestionFilter.builder()
                .language(language)
                .difficulty("EASY")
                .build()
        );
        
        return SpeedRound.builder()
            .available(true)
            .questions(questions)
            .timerSeconds(10)
            .xpMultiplier(2.0) // Double XP
            .build();
    }
}

// API
@GetMapping("/api/quiz/speed-round")
public SpeedRound getSpeedRound(Authentication auth,
    @RequestParam(defaultValue = "vi") String language) {
    return speedRoundService.getSpeedRound(getUserId(auth), language);
}
```

### Task 6: Frontend — Speed Round UI

```
Home page — khi available:
┌──────────────────────────────────────┐
│  ⚡ Speed Round — Hôm nay!           │
│                                      │
│  10 câu × 10 giây                   │
│  2x XP!                             │
│  Còn 18:30:00                        │
│                                      │
│  [Chơi ngay! ⚡]                     │
└──────────────────────────────────────┘

Khi đã chơi:
┌──────────────────────────────────────┐
│  ⚡ Speed Round — ✅ Hoàn thành!     │
│  9/10 đúng • 180 XP                │
│  Trở lại sau: 05:30:00              │
└──────────────────────────────────────┘
```

Quiz UI cho Speed Round:
- Timer đỏ, chạy nhanh (10s)
- Screen flash mỗi giây cuối
- Sound: rapid ticks
- Mỗi câu đúng: flash xanh nhanh + score pop
- Sai hoặc hết giờ: auto next (không hiện explanation — quá nhanh)
- Cuối: hiện tổng thời gian + bonus XP

Commit: "feat: speed round — 10 câu × 10 giây × 2x XP"

---

## Task 7: Random Daily Bonus

```java
// DailyBonusService.java

/**
 * 1/7 ngày random → user nhận bonus.
 * Không biết trước ngày nào → surprise.
 */
public DailyBonus checkDailyBonus(Long userId) {
    // Deterministic random per user per day
    long seed = userId * 1000 + LocalDate.now().toEpochDay();
    Random random = new Random(seed);
    
    boolean isLucky = random.nextInt(7) == 0; // ~14% chance
    
    if (!isLucky) return DailyBonus.none();
    
    // Random bonus type
    BonusType type = BonusType.values()[random.nextInt(BonusType.values().length)];
    
    return switch (type) {
        case DOUBLE_XP -> DailyBonus.of("2x XP hôm nay!", "double_xp", 2.0);
        case EXTRA_ENERGY -> DailyBonus.of("Thêm 50 energy!", "extra_energy", 50);
        case FREE_FREEZE -> DailyBonus.of("Streak Freeze miễn phí!", "free_freeze", 1);
        case BONUS_STREAK -> DailyBonus.of("Streak +1 ngày!", "bonus_streak", 1);
    };
}
```

Frontend — khi mở app:
```
┌──────────────────────────────────────┐
│                                      │
│  🎁 Quà tặng hôm nay!               │
│                                      │
│  ⭐ 2x XP cho tất cả quiz!          │
│                                      │
│  [Tuyệt vời! →]                     │
│                                      │
└──────────────────────────────────────┘
```

Commit: "feat: random daily bonus (1/7 chance)"

---

## Task 8: Seasonal Content

```java
// SeasonalContentService.java

public String getCurrentSeason() {
    int month = LocalDate.now().getMonthValue();
    int day = LocalDate.now().getDayOfMonth();
    
    // Mùa lễ Cơ Đốc
    if (month == 12 && day >= 1 && day <= 25) return "CHRISTMAS";
    if (month == 3 || month == 4) return "EASTER";  // Simplified
    if (month == 5 && day <= 15) return "MOTHERS_DAY";
    return "NORMAL";
}

public SeasonalQuiz getSeasonalQuiz(String season, Long userId, String language) {
    return switch (season) {
        case "CHRISTMAS" -> SeasonalQuiz.builder()
            .title("Mùa Giáng Sinh")
            .description("Câu hỏi về sự giáng sinh của Chúa Giê-su")
            .books(List.of("Matthew", "Luke", "Isaiah"))
            .xpMultiplier(1.5)
            .build();
        case "EASTER" -> SeasonalQuiz.builder()
            .title("Mùa Phục Sinh")
            .description("Câu hỏi về sự phục sinh")
            .books(List.of("Matthew", "Mark", "Luke", "John"))
            .xpMultiplier(1.5)
            .build();
        default -> null; // Không có seasonal quiz
    };
}
```

Commit: "feat: seasonal content (Christmas, Easter)"

---

## Task 9: Tests

```java
@Test
void weeklyTheme_changesEveryWeek() {
    // Week 1 theme ≠ Week 2 theme
}

@Test
void weeklyTheme_cyclesThrough10Themes() {
    // After 10 weeks → back to theme 1
}

@Test
void mysteryMode_selectsFromAllBooks() {
    var quiz = mysteryService.createMysteryQuiz(userId, "vi");
    var books = quiz.getQuestions().stream().map(Question::getBook).distinct().toList();
    assertThat(books.size()).isGreaterThan(1); // Multiple books
}

@Test
void mysteryMode_gives1_5xXP() {
    var quiz = mysteryService.createMysteryQuiz(userId, "vi");
    assertThat(quiz.getXpMultiplier()).isEqualTo(1.5);
}

@Test
void speedRound_oncePerDay() {
    var round1 = speedRoundService.getSpeedRound(userId, "vi");
    assertThat(round1.isAvailable()).isTrue();
    // Record played
    var round2 = speedRoundService.getSpeedRound(userId, "vi");
    assertThat(round2.isAvailable()).isFalse();
}

@Test
void speedRound_only10Seconds() {
    var round = speedRoundService.getSpeedRound(userId, "vi");
    assertThat(round.getTimerSeconds()).isEqualTo(10);
}

@Test
void speedRound_onlyEasyQuestions() {
    var round = speedRoundService.getSpeedRound(userId, "vi");
    assertThat(round.getQuestions()).allMatch(q -> q.getDifficulty().equals("EASY"));
}

@Test
void dailyBonus_deterministicPerUserPerDay() {
    var bonus1 = dailyBonusService.checkDailyBonus(userId);
    var bonus2 = dailyBonusService.checkDailyBonus(userId);
    // Same user, same day → same result
    assertThat(bonus1).isEqualTo(bonus2);
}
```

Commit: "test: weekly + mystery + speed round + daily bonus"

---

## Thứ tự:
1. Feature A: Weekly themed quiz (Tasks 1-2)
2. Feature B: Mystery mode (Tasks 3-4)
3. Feature C: Speed round (Tasks 5-6)
4. Random daily bonus (Task 7)
5. Seasonal content (Task 8)
6. Tests (Task 9)

Total effort: 2-3 ngày. Impact: ⭐⭐⭐⭐
```
