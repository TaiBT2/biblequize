# #2 Bible Journey Map — Hành trình 66 sách Kinh Thánh

> Tạo mục tiêu dài hạn: chinh phục từng sách, thấy tiến trình visual.
> Paste vào Claude Code.

---

```
Thêm "Bible Journey Map" — hệ thống hành trình qua 66 sách Kinh Thánh.
User hoàn thành từng sách → mở khóa sách tiếp → thấy progress trên map.

TRƯỚC KHI CODE: đọc code hiện tại. Chia tasks vào TODO.md.

## Bước 0: Đọc code

```bash
# Xem câu hỏi có field book không
grep -n "book\|Book" apps/api/src/main/java/com/biblequiz/modules/quiz/entity/Question.java

# Xem có tracking per book chưa
grep -rn "book.*progress\|book.*complete\|book.*mastery" apps/api/src/ --include="*.java" | head -10

# Xem user_question_history (từ Phase 1 Tier Progression)
grep -rn "UserQuestionHistory" apps/api/src/ --include="*.java" | head -10
```

---

## Task 1: Backend — Book Mastery Tracking

```java
// BookMasteryService.java

@Service
@RequiredArgsConstructor
public class BookMasteryService {

    private final QuestionRepository questionRepository;
    private final UserQuestionHistoryRepository historyRepository;

    // Danh sách 66 sách theo thứ tự Kinh Thánh
    public static final List<String> BIBLE_BOOKS = List.of(
        // Cựu Ước (39 sách)
        "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
        "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
        "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
        "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
        "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
        "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
        "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
        "Zephaniah", "Haggai", "Zechariah", "Malachi",
        // Tân Ước (27 sách)
        "Matthew", "Mark", "Luke", "John", "Acts",
        "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
        "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy",
        "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
        "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
        "Jude", "Revelation"
    );

    /**
     * Mastery per book cho 1 user.
     * Mastery = % câu đã trả lời ĐÚNG (ít nhất 1 lần) / tổng câu sách đó.
     * Hoàn thành sách = mastery >= 80%.
     */
    public List<BookProgress> getJourneyProgress(Long userId, String language) {
        List<BookProgress> progress = new ArrayList<>();

        for (int i = 0; i < BIBLE_BOOKS.size(); i++) {
            String book = BIBLE_BOOKS.get(i);

            // Tổng câu hỏi sách này
            long totalQuestions = questionRepository.countByBookAndLanguage(book, language);

            // Câu đã trả lời đúng ít nhất 1 lần
            long masteredQuestions = historyRepository
                .countByUserIdAndBookAndTimesCorrectGreaterThan(userId, book, 0);

            // Mastery %
            double mastery = totalQuestions > 0 
                ? (double) masteredQuestions / totalQuestions * 100 
                : 0;

            // Status
            BookStatus status;
            if (mastery >= 80) {
                status = BookStatus.COMPLETED;
            } else if (mastery > 0 || i == 0 || isUnlocked(progress, i)) {
                status = BookStatus.IN_PROGRESS;
            } else {
                status = BookStatus.LOCKED;
            }

            progress.add(BookProgress.builder()
                .book(book)
                .order(i + 1)
                .testament(i < 39 ? "OLD" : "NEW")
                .totalQuestions((int) totalQuestions)
                .masteredQuestions((int) masteredQuestions)
                .masteryPercent(Math.round(mastery * 10) / 10.0)
                .status(status)
                .build());
        }

        return progress;
    }

    // Sách mở khóa nếu sách trước đã complete (hoặc cùng testament)
    // Flexible: user có thể chơi bất kỳ sách nào đã unlock
    private boolean isUnlocked(List<BookProgress> progress, int index) {
        if (index == 0) return true;
        // Mở khóa nếu sách trước hoàn thành HOẶC user đã bắt đầu chơi sách này
        return progress.get(index - 1).getStatus() == BookStatus.COMPLETED;
    }

    /**
     * Tổng quan journey
     */
    public JourneySummary getJourneySummary(Long userId, String language) {
        List<BookProgress> progress = getJourneyProgress(userId, language);
        
        long completed = progress.stream().filter(b -> b.getStatus() == BookStatus.COMPLETED).count();
        long inProgress = progress.stream().filter(b -> b.getStatus() == BookStatus.IN_PROGRESS).count();
        double overallMastery = progress.stream().mapToDouble(BookProgress::getMasteryPercent).average().orElse(0);

        return JourneySummary.builder()
            .totalBooks(66)
            .completedBooks((int) completed)
            .inProgressBooks((int) inProgress)
            .lockedBooks(66 - (int) completed - (int) inProgress)
            .overallMasteryPercent(Math.round(overallMastery * 10) / 10.0)
            .oldTestamentCompleted((int) progress.stream()
                .filter(b -> b.getTestament().equals("OLD") && b.getStatus() == BookStatus.COMPLETED).count())
            .newTestamentCompleted((int) progress.stream()
                .filter(b -> b.getTestament().equals("NEW") && b.getStatus() == BookStatus.COMPLETED).count())
            .currentBook(progress.stream()
                .filter(b -> b.getStatus() == BookStatus.IN_PROGRESS)
                .findFirst().map(BookProgress::getBook).orElse(null))
            .build();
    }
}

enum BookStatus {
    COMPLETED,   // ✅ >= 80% mastery
    IN_PROGRESS, // 📖 đang chơi (>0% hoặc unlocked)
    LOCKED       // 🔒 chưa mở
}
```

### API Endpoint:

```java
// GET /api/me/journey
@GetMapping("/me/journey")
public JourneyResponse getJourney(Authentication auth, 
                                   @RequestParam(defaultValue = "vi") String language) {
    Long userId = getUserId(auth);
    return JourneyResponse.builder()
        .summary(bookMasteryService.getJourneySummary(userId, language))
        .books(bookMasteryService.getJourneyProgress(userId, language))
        .build();
}
```

Commit: "feat: Bible Journey Map — book mastery tracking API"

---

## Task 2: Frontend — Journey Map Screen

Tạo screen mới: JourneyScreen (hoặc BibleMapScreen)

```
Visual layout — scrollable map:

┌──────────────────────────────────────┐
│  🗺️ Hành trình Kinh Thánh           │
│  Đã chinh phục: 8/66 sách (12%)     │
│  ████░░░░░░░░░░░░░░░░░░░░░ 12%      │
│                                      │
│  ── CỰU ƯỚC ──                      │
│                                      │
│  ✅ Sáng Thế Ký     85% ██████████░  │
│  ✅ Xuất Hành        82% █████████░  │
│  📖 Lê-vi Ký        45% █████░░░░░  │ ← đang chơi
│  🔒 Dân Số Ký       --  ░░░░░░░░░░  │
│  🔒 Phục Truyền     --  ░░░░░░░░░░  │
│  ...                                 │
│                                      │
│  ── TÂN ƯỚC ──                      │
│                                      │
│  🔒 Ma-thi-ơ        --  ░░░░░░░░░░  │
│  ...                                 │
└──────────────────────────────────────┘
```

Mỗi sách là 1 card:
- ✅ Completed: gold border, checkmark, mastery %
- 📖 In Progress: normal card, progress bar, mastery %
- 🔒 Locked: dimmed card, lock icon, "Hoàn thành [sách trước] để mở"

Click vào sách → chuyển sang Practice mode với book đã chọn.

### Journey Map trên Home page:

```
Home page thêm section "Hành trình" (compact):
┌──────────────────────────────────────┐
│  🗺️ Hành trình: 8/66 sách           │
│  Đang ở: Lê-vi Ký (45%)             │
│  [Tiếp tục chinh phục →]            │
└──────────────────────────────────────┘
```

Commit: "feat: Journey Map screen + Home widget"

---

## Task 3: Book Completion Celebration

Khi user đạt 80% mastery 1 sách → celebration:

```
┌──────────────────────────────────────┐
│                                      │
│        📖 Chinh phục!                │
│                                      │
│    ✅ Sáng Thế Ký                    │
│    Mastery: 85%                      │
│                                      │
│    🔓 Mở khóa: Xuất Hành!           │
│                                      │
│    [Chia sẻ] [Tiếp tục hành trình]  │
│                                      │
└──────────────────────────────────────┘
```

Sound: bookComplete sound + confetti
Badge: "Người chinh phục [Book Name]"
Share card: "Tôi đã chinh phục Sáng Thế Ký trên BibleQuiz!"

Commit: "feat: book completion celebration + unlock next book"

---

## Task 4: Milestones

```
Milestone badges cho journey:
- 📖 "Khởi Hành" — hoàn thành sách đầu tiên
- 📚 "Ngũ Thư" — hoàn thành 5 sách Môi-se (Genesis-Deuteronomy)
- ⚔️ "Chinh Phục" — hoàn thành 10 sách
- 🏛️ "Cựu Ước" — hoàn thành 39 sách Cựu Ước
- ✝️ "Phúc Âm" — hoàn thành 4 sách Phúc Âm (Matthew-John)
- 📮 "Thư Tín" — hoàn thành 21 thư tín (Romans-Jude)
- 🌟 "Tân Ước" — hoàn thành 27 sách Tân Ước
- 👑 "Toàn Thư" — hoàn thành TẤT CẢ 66 sách (ultimate achievement)
```

Commit: "feat: journey milestone badges"

---

## Task 5: Tests

```java
@Test
void firstBookAlwaysUnlocked() {
    var progress = service.getJourneyProgress(newUserId, "vi");
    assertThat(progress.get(0).getStatus()).isNotEqualTo(BookStatus.LOCKED);
}

@Test
void bookCompletedAt80PercentMastery() {
    // User đúng 60/75 câu Genesis = 80%
    var progress = service.getJourneyProgress(userId, "vi");
    var genesis = progress.get(0);
    assertThat(genesis.getStatus()).isEqualTo(BookStatus.COMPLETED);
}

@Test
void nextBookUnlockedAfterPreviousCompleted() {
    // Genesis completed → Exodus unlocked
    var progress = service.getJourneyProgress(userId, "vi");
    assertThat(progress.get(1).getStatus()).isNotEqualTo(BookStatus.LOCKED);
}

@Test
void lockedBookStaysLocked() {
    // Genesis not completed → Exodus locked
    var progress = service.getJourneyProgress(newUserId, "vi");
    assertThat(progress.get(1).getStatus()).isEqualTo(BookStatus.LOCKED);
}

@Test
void journeySummaryCountsCorrectly() {
    var summary = service.getJourneySummary(userId, "vi");
    assertThat(summary.getTotalBooks()).isEqualTo(66);
    assertThat(summary.getCompletedBooks() + summary.getInProgressBooks() + summary.getLockedBooks()).isEqualTo(66);
}
```

Commit: "test: journey map + book mastery"

---

## Thứ tự: Task 1 (backend) → Task 2 (frontend) → Task 3 (celebration) → Task 4 (milestones) → Task 5 (tests)
Total effort: 3-5 ngày. Impact: ⭐⭐⭐⭐⭐
```
