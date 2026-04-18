# #3 Giải thích câu sai + Verse Reference — Learning Tool

> Sai → hiện verse Kinh Thánh + giải thích ngắn → user HỌC được, không chỉ chơi.
> Paste vào Claude Code.

---

```
Khi user trả lời sai → hiện giải thích + verse reference ngay.
Biến quiz từ "game" thành "learning tool".

TRƯỚC KHI CODE: đọc Question entity, Quiz.tsx, Review.tsx. Chia tasks vào TODO.md.

## Bước 0: Đọc code

```bash
# Question entity — check có field explanation, verse chưa
cat apps/api/src/main/java/com/biblequiz/modules/quiz/entity/Question.java
grep -n "explanation\|verse\|reference\|scripture" apps/api/src/main/java/com/biblequiz/modules/quiz/entity/Question.java

# Review page hiện tại
find apps/web/src -name "Review*" | xargs cat
```

---

## Task 1: Database — Thêm explanation + verse fields

Nếu Question entity CHƯA CÓ:

```sql
-- V{next}__add_question_explanation.sql
ALTER TABLE question ADD COLUMN explanation TEXT;
ALTER TABLE question ADD COLUMN scripture_ref VARCHAR(100);
-- scripture_ref format: "Sáng Thế Ký 1:1" hoặc "Genesis 1:1"
-- explanation: 1-3 câu giải thích tại sao đáp án đúng
```

```java
// Question.java entity — thêm fields
@Column(name = "explanation", columnDefinition = "TEXT")
private String explanation;  // "Câu đầu tiên của Kinh Thánh khẳng định Đức Chúa Trời là Đấng Tạo Hóa..."

@Column(name = "scripture_ref", length = 100)
private String scriptureRef;  // "Sáng Thế Ký 1:1"
```

Commit: "feat: add explanation + scriptureRef to Question entity"

---

## Task 2: AI auto-generate explanations cho câu hỏi existing

Câu hỏi hiện tại chưa có explanation → dùng AI generate:

```java
// AdminAIService.java — thêm method generate explanations

@PostMapping("/api/admin/ai/generate-explanations")
public ResponseEntity<?> generateExplanations(
    @RequestParam(defaultValue = "50") int batchSize) {
    
    // Lấy câu hỏi chưa có explanation
    List<Question> noExplanation = questionRepository
        .findByExplanationIsNullAndIsActiveTrue(PageRequest.of(0, batchSize));
    
    for (Question q : noExplanation) {
        String prompt = """
            Câu hỏi: %s
            Đáp án đúng: %s
            Sách: %s
            
            Viết 1-2 câu giải thích NGẮN GỌN tại sao đáp án đúng.
            Trích dẫn verse Kinh Thánh liên quan.
            Format: {"explanation": "...", "scriptureRef": "Sách Chapter:Verse"}
            """.formatted(q.getContent(), q.getCorrectAnswer(), q.getBook());
        
        // Call AI API (Gemini/Claude)
        // Parse response → set explanation + scriptureRef
        // Save
    }
    
    return ResponseEntity.ok(Map.of("processed", noExplanation.size()));
}
```

Import format cũng cần support explanation:
```json
{
  "content": "Ai tạo nên trời đất?",
  "correctAnswer": "Đức Chúa Trời",
  "explanation": "Câu đầu tiên của Kinh Thánh khẳng định Đức Chúa Trời là Đấng sáng tạo muôn vật.",
  "scriptureRef": "Sáng Thế Ký 1:1"
}
```

Commit: "feat: AI generate explanations for existing questions"

---

## Task 3: Frontend — Hiện explanation khi sai

### Trong Quiz gameplay (sau mỗi câu sai):

```
Trả lời sai → 0.8s hiện đáp án đúng → slide down explanation panel:

┌──────────────────────────────────────┐
│  ❌ Sai — Đáp án đúng: Đức Chúa Trời │
│                                      │
│  📖 Sáng Thế Ký 1:1                  │
│  "Ban đầu Đức Chúa Trời dựng nên    │
│   trời đất."                         │
│                                      │
│  💡 Câu đầu tiên của Kinh Thánh      │
│     khẳng định Đức Chúa Trời là      │
│     Đấng sáng tạo muôn vật.          │
│                                      │
│  [🔖 Đánh dấu ôn lại]  [Tiếp tục →] │
└──────────────────────────────────────┘
```

Hiện 3-4 giây hoặc cho đến khi user tap "Tiếp tục".
Câu đúng → KHÔNG hiện explanation (giữ nhịp nhanh).

```typescript
// Quiz.tsx — sau khi answer sai
{answerState === 'wrong' && currentQuestion.explanation && (
  <div className="explanation-panel animate-slideUp">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-red-400 font-semibold">
        Đáp án đúng: {currentQuestion.correctAnswer}
      </span>
    </div>
    
    {currentQuestion.scriptureRef && (
      <p className="text-gold text-sm mb-1">
        📖 {currentQuestion.scriptureRef}
      </p>
    )}
    
    <p className="text-white/70 text-sm">
      💡 {currentQuestion.explanation}
    </p>
    
    <div className="flex gap-3 mt-3">
      <button onClick={bookmarkQuestion} className="text-sm text-gold">
        🔖 Đánh dấu ôn lại
      </button>
      <button onClick={nextQuestion} className="text-sm text-white">
        Tiếp tục →
      </button>
    </div>
  </div>
)}
```

### Trong Review page (sau quiz):

```
Review page — mỗi câu hiện explanation:

┌──────────────────────────────────────┐
│  Câu 3/10  ❌                        │
│  "Ai viết sách Sáng Thế Ký?"        │
│                                      │
│  Bạn chọn: Đa-vít                   │
│  ✅ Đúng: Môi-se                     │
│                                      │
│  📖 Phục Truyền 31:9                 │
│  💡 Theo truyền thống, Môi-se được   │
│     cho là tác giả của Ngũ Thư       │
│     (5 sách đầu Kinh Thánh).        │
│                                      │
│  🔖 Đánh dấu ôn lại                 │
└──────────────────────────────────────┘
```

Commit: "feat: show explanation on wrong answer in quiz + review"

---

## Task 4: Weakness Tracking — "Bạn yếu sách nào"

```java
// GET /api/me/weaknesses
@GetMapping("/me/weaknesses")
public WeaknessReport getWeaknesses(Authentication auth) {
    Long userId = getUserId(auth);
    
    // Tính accuracy per book
    List<BookAccuracy> bookAccuracies = historyRepository
        .getAccuracyByBook(userId);
    
    // Sort by accuracy ascending → sách yếu nhất trước
    bookAccuracies.sort(Comparator.comparingDouble(BookAccuracy::getAccuracy));
    
    // Top 3 weak books
    List<BookAccuracy> weakBooks = bookAccuracies.stream()
        .filter(b -> b.getTotalAnswered() >= 5)  // Ít nhất 5 câu mới tính
        .limit(3)
        .toList();
    
    // Top 3 strong books
    List<BookAccuracy> strongBooks = bookAccuracies.stream()
        .filter(b -> b.getTotalAnswered() >= 5)
        .sorted(Comparator.comparingDouble(BookAccuracy::getAccuracy).reversed())
        .limit(3)
        .toList();
    
    return WeaknessReport.builder()
        .weakBooks(weakBooks)     // "Bạn cần ôn thêm: Rô-ma (40%), Lê-vi Ký (45%)"
        .strongBooks(strongBooks) // "Sách mạnh nhất: Giăng (95%), Sáng Thế Ký (88%)"
        .suggestedPractice(weakBooks.isEmpty() ? null : weakBooks.get(0).getBook())
        .build();
}
```

Frontend — hiện trên Home hoặc Profile:

```
┌──────────────────────────────────────┐
│  📊 Phân tích của bạn                │
│                                      │
│  💪 Mạnh nhất:                       │
│     Giăng (95%) • Sáng Thế Ký (88%) │
│                                      │
│  📖 Cần ôn thêm:                     │
│     Rô-ma (40%) • Lê-vi Ký (45%)    │
│                                      │
│  [Ôn Rô-ma ngay →]                  │
└──────────────────────────────────────┘
```

Commit: "feat: weakness tracking + suggested practice"

---

## Task 5: Tests

```java
@Test
void questionWithExplanation_returnedInQuizResponse() {
    // Verify API trả explanation + scriptureRef
}

@Test
void questionWithoutExplanation_noError() {
    // Câu chưa có explanation → trả null, không crash
}

@Test
void weaknessReport_sortsWeakestFirst() {
    // Book accuracy 40%, 60%, 90% → weak = 40% first
}

@Test
void weaknessReport_ignoresBooksWithFewAnswers() {
    // Book chỉ có 2 câu answered → không tính (min 5)
}

@Test
void bookmarkQuestion_savesToReviewList() {
    // User bookmark câu sai → lưu vào review list
}
```

Commit: "test: explanations + weakness tracking"

---

## Thứ tự: Task 1 (DB) → Task 2 (AI generate) → Task 3 (Frontend) → Task 4 (Weakness) → Task 5 (Tests)
Total effort: 2-3 ngày. Impact: ⭐⭐⭐⭐
```
