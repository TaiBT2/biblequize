# Duplicate Question Detection — 3 Layer Validation

> Khi add câu hỏi mới (manual, import, AI) → check trùng trước khi save.
> Paste vào Claude Code.

---

```
Thêm hệ thống detect câu hỏi trùng lặp cho BibleQuiz.
3 đường vào DB đều cần validate: Admin tạo thủ công, Import CSV/JSON, AI generate.

TRƯỚC KHI CODE: đọc code hiện tại. Chia tasks vào TODO.md.

## Bước 0: Đọc code hiện tại

```bash
# Question entity
cat apps/api/src/main/java/com/biblequiz/modules/quiz/entity/Question.java

# Question repository
cat apps/api/src/main/java/com/biblequiz/modules/quiz/repository/QuestionRepository.java

# Admin question controller (manual create)
find apps/api/src -name "*Admin*Question*Controller*" -o -name "*QuestionAdmin*" | xargs cat 2>/dev/null

# Import service
find apps/api/src -name "*Import*" | xargs cat 2>/dev/null

# AI generate service
find apps/api/src -name "*AI*" -o -name "*Ai*" -o -name "*Generate*" | xargs cat 2>/dev/null | head -100

# Check có unique constraint trên DB chưa
grep -rn "unique\|UNIQUE\|UniqueConstraint" apps/api/src/main/java/com/biblequiz/modules/quiz/entity/Question.java

# Check existing duplicate detection
grep -rn "duplicate\|exists\|existsBy\|similar\|trùng" apps/api/src/ --include="*.java" | head -20
```

In tất cả kết quả trước khi code.

---

## Task 1: Duplicate Detection Service — 3 Layers

```java
// DuplicateDetectionService.java
package com.biblequiz.modules.quiz.service;

import lombok.*;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DuplicateDetectionService {

    private final QuestionRepository questionRepository;

    /**
     * Check câu hỏi mới có trùng không.
     * 3 layers: Exact Match → Same Verse+Answer → Fuzzy Similarity.
     * 
     * @return DuplicateCheckResult với status + câu trùng (nếu có)
     */
    public DuplicateCheckResult checkDuplicate(DuplicateCheckRequest request) {
        List<DuplicateMatch> matches = new ArrayList<>();

        // Layer 1: Exact match (content giống hệt sau normalize)
        String normalized = normalizeText(request.getContent());
        Optional<Question> exactMatch = questionRepository
            .findByNormalizedContentAndLanguage(normalized, request.getLanguage());
        
        if (exactMatch.isPresent()) {
            return DuplicateCheckResult.builder()
                .status(DuplicateStatus.EXACT_MATCH)
                .blocked(true)  // Block — không cho tạo
                .message("Câu hỏi này đã tồn tại trong hệ thống")
                .matches(List.of(DuplicateMatch.fromQuestion(exactMatch.get(), 100.0)))
                .build();
        }

        // Layer 2: Same book + chapter + verse + correct answer
        if (request.getBook() != null && request.getCorrectAnswer() != null) {
            List<Question> sameVerseAnswer = questionRepository
                .findByBookAndChapterAndVerseAndCorrectAnswerIgnoreCaseAndLanguage(
                    request.getBook(),
                    request.getChapter(),
                    request.getVerse(),
                    request.getCorrectAnswer().trim(),
                    request.getLanguage()
                );
            
            if (!sameVerseAnswer.isEmpty()) {
                matches.addAll(sameVerseAnswer.stream()
                    .map(q -> DuplicateMatch.fromQuestion(q, 90.0))
                    .toList());
                
                return DuplicateCheckResult.builder()
                    .status(DuplicateStatus.SAME_VERSE_ANSWER)
                    .blocked(false)  // Warning — cho tạo nhưng cảnh báo
                    .message("Đã có câu hỏi cùng verse và đáp án. Có thể trùng ý.")
                    .matches(matches)
                    .build();
            }
        }

        // Layer 3: Fuzzy similarity với câu cùng book + chapter
        if (request.getBook() != null) {
            List<Question> sameChapter = questionRepository
                .findByBookAndChapterAndLanguageAndIsActiveTrue(
                    request.getBook(),
                    request.getChapter(),
                    request.getLanguage()
                );
            
            for (Question existing : sameChapter) {
                double similarity = calculateSimilarity(
                    normalized, 
                    normalizeText(existing.getContent())
                );
                
                if (similarity >= 0.75) {
                    matches.add(DuplicateMatch.fromQuestion(existing, similarity * 100));
                }
            }
            
            if (!matches.isEmpty()) {
                matches.sort(Comparator.comparingDouble(DuplicateMatch::getSimilarityPercent).reversed());
                
                return DuplicateCheckResult.builder()
                    .status(DuplicateStatus.SIMILAR_CONTENT)
                    .blocked(false)  // Warning — cho tạo nhưng cảnh báo
                    .message("Tìm thấy " + matches.size() + " câu hỏi tương tự")
                    .matches(matches)
                    .build();
            }
        }

        // Không trùng
        return DuplicateCheckResult.builder()
            .status(DuplicateStatus.NO_MATCH)
            .blocked(false)
            .message(null)
            .matches(List.of())
            .build();
    }

    /**
     * Batch check — cho Import (check nhiều câu 1 lần)
     */
    public List<DuplicateCheckResult> checkBatch(List<DuplicateCheckRequest> requests) {
        return requests.stream()
            .map(this::checkDuplicate)
            .toList();
    }

    /**
     * Normalize text trước khi so sánh.
     * Lowercase, remove dấu câu, normalize whitespace.
     */
    public String normalizeText(String text) {
        if (text == null) return "";
        return text.trim()
            .toLowerCase()
            .replaceAll("[?!.,;:\"'()\\[\\]{}]", "")  // Remove punctuation
            .replaceAll("\\s+", " ")                     // Multi space → single
            .replaceAll("đức chúa trời", "duc chua troi") // Normalize Vietnamese
            .replaceAll("chúa giê-su", "chua giesu")
            .replaceAll("chúa jêsus", "chua giesu");
    }

    /**
     * Jaccard Similarity — so sánh tập hợp từ.
     * 0.0 = hoàn toàn khác, 1.0 = giống hệt.
     * Threshold: >= 0.75 = có thể trùng.
     */
    public double calculateSimilarity(String a, String b) {
        if (a == null || b == null || a.isEmpty() || b.isEmpty()) return 0.0;

        Set<String> wordsA = new HashSet<>(Arrays.asList(a.split("\\s+")));
        Set<String> wordsB = new HashSet<>(Arrays.asList(b.split("\\s+")));

        // Intersection
        Set<String> intersection = new HashSet<>(wordsA);
        intersection.retainAll(wordsB);

        // Union
        Set<String> union = new HashSet<>(wordsA);
        union.addAll(wordsB);

        if (union.isEmpty()) return 0.0;
        return (double) intersection.size() / union.size();
    }
}

// === DTOs ===

@Data
@Builder
public class DuplicateCheckRequest {
    private String content;         // Nội dung câu hỏi
    private String correctAnswer;   // Đáp án đúng
    private String book;            // Sách (Genesis, Exodus...)
    private Integer chapter;        // Chương
    private Integer verse;          // Câu (verse)
    private String language;        // vi / en
}

@Data
@Builder
public class DuplicateCheckResult {
    private DuplicateStatus status;
    private boolean blocked;        // true = không cho tạo, false = warning
    private String message;
    private List<DuplicateMatch> matches;  // Câu trùng/tương tự
}

@Data
@Builder
public class DuplicateMatch {
    private Long questionId;
    private String content;
    private String correctAnswer;
    private String book;
    private Integer chapter;
    private Integer verse;
    private double similarityPercent;  // 0-100%
    
    public static DuplicateMatch fromQuestion(Question q, double similarity) {
        return DuplicateMatch.builder()
            .questionId(q.getId())
            .content(q.getContent())
            .correctAnswer(q.getCorrectAnswer())
            .book(q.getBook())
            .chapter(q.getChapter())
            .verse(q.getVerse())
            .similarityPercent(Math.round(similarity * 10) / 10.0)
            .build();
    }
}

public enum DuplicateStatus {
    NO_MATCH,           // Không trùng → tạo thoải mái
    EXACT_MATCH,        // Trùng hệt → block
    SAME_VERSE_ANSWER,  // Cùng verse + đáp án → warning
    SIMILAR_CONTENT     // Nội dung tương tự → warning
}
```

Commit: "feat: 3-layer duplicate question detection service"

---

## Task 2: Repository — Thêm query methods

```java
// QuestionRepository.java — thêm methods

// Layer 1: Exact match (cần thêm column normalized_content hoặc query normalize)
@Query("SELECT q FROM Question q WHERE LOWER(REPLACE(REPLACE(q.content, '?', ''), '.', '')) = :normalized AND q.language = :language AND q.isActive = true")
Optional<Question> findByNormalizedContentAndLanguage(
    @Param("normalized") String normalizedContent,
    @Param("language") String language
);

// Layer 2: Same verse + answer
List<Question> findByBookAndChapterAndVerseAndCorrectAnswerIgnoreCaseAndLanguage(
    String book, Integer chapter, Integer verse, String correctAnswer, String language
);

// Layer 3: Same book + chapter (để fuzzy compare)
List<Question> findByBookAndChapterAndLanguageAndIsActiveTrue(
    String book, Integer chapter, String language
);
```

Nếu performance chậm (nhiều câu cùng chapter) → thêm index:

```sql
-- V{next}__add_question_search_indexes.sql
CREATE INDEX idx_question_book_chapter_lang ON question(book, chapter, language);
CREATE INDEX idx_question_book_verse_answer ON question(book, chapter, verse, language);
```

Commit: "feat: repository methods for duplicate detection queries"

---

## Task 3: Integrate — Admin Manual Create

```java
// AdminQuestionController.java — cập nhật POST endpoint

@PostMapping("/api/admin/questions")
public ResponseEntity<?> createQuestion(@Valid @RequestBody CreateQuestionRequest request) {

    // Check duplicate TRƯỚC khi save
    DuplicateCheckResult result = duplicateDetectionService.checkDuplicate(
        DuplicateCheckRequest.builder()
            .content(request.getContent())
            .correctAnswer(request.getCorrectAnswer())
            .book(request.getBook())
            .chapter(request.getChapter())
            .verse(request.getVerse())
            .language(request.getLanguage())
            .build()
    );

    if (result.isBlocked()) {
        // Exact match → block
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of(
                "error", "DUPLICATE",
                "message", result.getMessage(),
                "existingQuestion", result.getMatches().get(0)
            ));
    }

    if (!result.getMatches().isEmpty()) {
        // Similar found → trả warning + cho phép force create
        if (!Boolean.TRUE.equals(request.getForceCreate())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of(
                    "error", "POSSIBLE_DUPLICATE",
                    "message", result.getMessage(),
                    "similarQuestions", result.getMatches(),
                    "hint", "Gửi lại với forceCreate=true nếu muốn tạo"
                ));
        }
        // forceCreate=true → tiếp tục tạo
    }

    // Không trùng hoặc force create → save
    Question question = questionService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(question);
}
```

```java
// CreateQuestionRequest.java — thêm field
@Data
public class CreateQuestionRequest {
    // ... existing fields ...
    private Boolean forceCreate;  // true = tạo dù có warning similar
}
```

Commit: "feat: duplicate check on admin manual question create"

---

## Task 4: Integrate — Import CSV/JSON

```java
// QuestionImportService.java — cập nhật import flow

public ImportResult importQuestions(List<QuestionImportDto> questions, ImportOptions options) {
    
    ImportResult result = new ImportResult();
    List<QuestionImportDto> toSave = new ArrayList<>();
    
    for (int i = 0; i < questions.size(); i++) {
        QuestionImportDto dto = questions.get(i);
        
        DuplicateCheckResult dupCheck = duplicateDetectionService.checkDuplicate(
            DuplicateCheckRequest.builder()
                .content(dto.getContent())
                .correctAnswer(dto.getCorrectAnswer())
                .book(dto.getBook())
                .chapter(dto.getChapter())
                .verse(dto.getVerse())
                .language(dto.getLanguage())
                .build()
        );
        
        switch (dupCheck.getStatus()) {
            case EXACT_MATCH:
                result.addSkipped(i, dto.getContent(), "Exact duplicate", dupCheck.getMatches());
                break;
                
            case SAME_VERSE_ANSWER:
            case SIMILAR_CONTENT:
                if (options.isSkipDuplicates()) {
                    result.addSkipped(i, dto.getContent(), dupCheck.getMessage(), dupCheck.getMatches());
                } else {
                    result.addWarning(i, dto.getContent(), dupCheck.getMessage(), dupCheck.getMatches());
                    toSave.add(dto);  // Warning nhưng vẫn import (trừ khi skipDuplicates=true)
                }
                break;
                
            case NO_MATCH:
                toSave.add(dto);
                result.addNew(i);
                break;
        }
        
        // Check trùng TRONG BATCH (không chỉ vs DB)
        for (int j = 0; j < i; j++) {
            double sim = duplicateDetectionService.calculateSimilarity(
                duplicateDetectionService.normalizeText(dto.getContent()),
                duplicateDetectionService.normalizeText(questions.get(j).getContent())
            );
            if (sim >= 0.9) {
                result.addWarning(i, dto.getContent(), 
                    "Trùng với câu " + (j + 1) + " trong file (similarity " + Math.round(sim * 100) + "%)", 
                    List.of());
            }
        }
    }
    
    // Dry run → chỉ trả report, không save
    if (options.isDryRun()) {
        result.setDryRun(true);
        return result;
    }
    
    // Save
    int saved = 0;
    for (QuestionImportDto dto : toSave) {
        questionService.createFromImport(dto);
        saved++;
    }
    result.setSavedCount(saved);
    
    return result;
}
```

### Import Result response:

```json
{
  "dryRun": false,
  "totalInFile": 100,
  "savedCount": 85,
  "skippedCount": 10,
  "warningCount": 5,
  "details": {
    "new": [
      { "row": 1, "content": "Ai tạo nên trời đất?" }
    ],
    "skipped": [
      { "row": 15, "content": "Đức Chúa Trời tạo nên gì?", "reason": "Exact duplicate",
        "existingQuestion": { "id": 42, "content": "Đức Chúa Trời tạo nên gì?" } }
    ],
    "warnings": [
      { "row": 23, "content": "Ai dựng nên trời và đất?", "reason": "Similar (85%)",
        "similarQuestions": [{ "id": 42, "content": "Ai tạo nên trời đất?", "similarity": 85.0 }] }
    ]
  }
}
```

Commit: "feat: duplicate check on question import with dry-run report"

---

## Task 5: Integrate — AI Generate

```java
// AIQuestionService.java — check trước khi save draft

public List<AIGeneratedQuestion> generateQuestions(AIGenerateRequest request) {
    // AI generates 20 câu
    List<AIGeneratedQuestion> drafts = aiClient.generate(request);
    
    // Check duplicate cho TỪNG draft
    for (AIGeneratedQuestion draft : drafts) {
        DuplicateCheckResult dupCheck = duplicateDetectionService.checkDuplicate(
            DuplicateCheckRequest.builder()
                .content(draft.getContent())
                .correctAnswer(draft.getCorrectAnswer())
                .book(request.getBook())
                .chapter(draft.getChapter())
                .verse(draft.getVerse())
                .language(request.getLanguage())
                .build()
        );
        
        draft.setDuplicateStatus(dupCheck.getStatus());
        draft.setDuplicateMessage(dupCheck.getMessage());
        draft.setSimilarQuestions(dupCheck.getMatches());
        
        // Auto-reject exact matches
        if (dupCheck.getStatus() == DuplicateStatus.EXACT_MATCH) {
            draft.setAutoRejected(true);
            draft.setRejectionReason("Câu hỏi trùng hệt với câu #" + dupCheck.getMatches().get(0).getQuestionId());
        }
    }
    
    // Check trùng GIỮA các drafts
    for (int i = 0; i < drafts.size(); i++) {
        for (int j = i + 1; j < drafts.size(); j++) {
            double sim = duplicateDetectionService.calculateSimilarity(
                duplicateDetectionService.normalizeText(drafts.get(i).getContent()),
                duplicateDetectionService.normalizeText(drafts.get(j).getContent())
            );
            if (sim >= 0.8) {
                drafts.get(j).setDuplicateStatus(DuplicateStatus.SIMILAR_CONTENT);
                drafts.get(j).setDuplicateMessage("Tương tự câu " + (i + 1) + " trong batch (" + Math.round(sim * 100) + "%)");
            }
        }
    }
    
    // Filter out auto-rejected
    long autoRejected = drafts.stream().filter(AIGeneratedQuestion::isAutoRejected).count();
    
    return drafts; // Admin review tất cả, thấy status duplicate
}
```

Admin review UI hiện:

```
Draft #1: "Ai tạo nên trời đất?"
  ❌ AUTO-REJECTED — Trùng hệt câu #42

Draft #2: "Ai viết sách Sáng Thế Ký?"  
  ✅ Không trùng

Draft #3: "Đấng nào dựng nên muôn vật?"
  ⚠️ Tương tự 85% với câu #42: "Ai tạo nên trời đất?"
  [Xem câu tương tự] [Approve anyway] [Reject]
```

Commit: "feat: duplicate check on AI generated questions"

---

## Task 6: Frontend — Admin UI

### Manual Create form:

```typescript
// Khi submit → nếu POSSIBLE_DUPLICATE → hiện modal

{duplicateWarning && (
  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
    <h3 className="text-yellow-400 font-semibold">⚠️ Có thể trùng</h3>
    <p className="text-sm mt-1">{duplicateWarning.message}</p>
    
    {/* Hiện câu tương tự */}
    <div className="mt-3 space-y-2">
      {duplicateWarning.similarQuestions.map(q => (
        <div key={q.questionId} className="bg-white/5 rounded p-3">
          <p className="text-sm">{q.content}</p>
          <p className="text-xs text-muted">
            Đáp án: {q.correctAnswer} • {q.book} {q.chapter}:{q.verse}
            • Similarity: {q.similarityPercent}%
          </p>
        </div>
      ))}
    </div>
    
    <div className="flex gap-3 mt-4">
      <button onClick={cancelCreate} className="btn-outline">Hủy</button>
      <button onClick={forceCreate} className="btn-warning">Vẫn tạo</button>
    </div>
  </div>
)}
```

### Import — Dry-run report:

```typescript
// Step 1: Upload file → dry-run
// Step 2: Hiện report
{importReport && (
  <div>
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="bg-green-500/10 p-3 rounded text-center">
        <span className="text-2xl text-green-400">{report.savedCount}</span>
        <p className="text-xs">Câu mới</p>
      </div>
      <div className="bg-yellow-500/10 p-3 rounded text-center">
        <span className="text-2xl text-yellow-400">{report.warningCount}</span>
        <p className="text-xs">Có thể trùng</p>
      </div>
      <div className="bg-red-500/10 p-3 rounded text-center">
        <span className="text-2xl text-red-400">{report.skippedCount}</span>
        <p className="text-xs">Bỏ qua (trùng hệt)</p>
      </div>
    </div>
    
    {/* Danh sách warnings */}
    {report.warnings.map(w => (
      <div className="border-l-2 border-yellow-500 pl-3 mb-2">
        <p className="text-sm">Row {w.row}: "{w.content}"</p>
        <p className="text-xs text-yellow-400">{w.reason}</p>
      </div>
    ))}
    
    {/* Confirm import */}
    <button onClick={confirmImport}>
      Import {report.savedCount + report.warningCount} câu
    </button>
  </div>
)}
```

Commit: "feat: admin UI — duplicate warnings for create + import + AI review"

---

## Task 7: API Endpoint — Check trước khi tạo

```java
// Endpoint riêng để check duplicate (FE gọi real-time khi admin đang nhập)
@PostMapping("/api/admin/questions/check-duplicate")
public ResponseEntity<DuplicateCheckResult> checkDuplicate(
    @RequestBody DuplicateCheckRequest request) {
    return ResponseEntity.ok(duplicateDetectionService.checkDuplicate(request));
}
```

Frontend có thể gọi debounced khi admin đang nhập nội dung câu hỏi → hiện warning real-time trước khi submit.

```typescript
// Debounce check khi admin đang gõ
const debouncedCheck = useDebouncedCallback(async (content: string) => {
  if (content.length < 10) return  // Chờ gõ đủ dài
  
  const result = await api.post('/admin/questions/check-duplicate', {
    content,
    book: selectedBook,
    chapter: selectedChapter,
    correctAnswer: correctAnswer,
    language: selectedLanguage,
  })
  
  if (result.data.status !== 'NO_MATCH') {
    setDuplicateWarning(result.data)
  } else {
    setDuplicateWarning(null)
  }
}, 500)

// Trong form
<textarea 
  value={content}
  onChange={(e) => {
    setContent(e.target.value)
    debouncedCheck(e.target.value)
  }}
/>

{duplicateWarning && (
  <p className="text-yellow-400 text-sm mt-1">
    ⚠️ {duplicateWarning.message}
  </p>
)}
```

Commit: "feat: real-time duplicate check API + debounced frontend"

---

## Task 8: Tests

```java
// === Layer 1: Exact Match ===

@Test
void exactMatch_blocksCreation() {
    // DB có: "Ai tạo nên trời đất?"
    var result = service.checkDuplicate(request("Ai tạo nên trời đất?"));
    assertThat(result.getStatus()).isEqualTo(DuplicateStatus.EXACT_MATCH);
    assertThat(result.isBlocked()).isTrue();
}

@Test
void exactMatch_caseInsensitive() {
    // DB có: "Ai tạo nên trời đất?"
    var result = service.checkDuplicate(request("ai tạo nên trời đất?"));
    assertThat(result.getStatus()).isEqualTo(DuplicateStatus.EXACT_MATCH);
}

@Test
void exactMatch_ignoresPunctuation() {
    // DB có: "Ai tạo nên trời đất?"
    var result = service.checkDuplicate(request("Ai tạo nên trời đất"));
    assertThat(result.getStatus()).isEqualTo(DuplicateStatus.EXACT_MATCH);
}

@Test
void exactMatch_ignoresExtraSpaces() {
    // DB có: "Ai tạo nên trời đất?"
    var result = service.checkDuplicate(request("Ai  tạo  nên  trời  đất?"));
    assertThat(result.getStatus()).isEqualTo(DuplicateStatus.EXACT_MATCH);
}

// === Layer 2: Same Verse + Answer ===

@Test
void sameVerseAnswer_warnsButNotBlocked() {
    // DB có: book=Genesis, chapter=1, verse=1, answer="Đức Chúa Trời"
    var req = requestWithVerse("Đấng nào tạo nên muôn vật?", "Genesis", 1, 1, "Đức Chúa Trời");
    var result = service.checkDuplicate(req);
    assertThat(result.getStatus()).isEqualTo(DuplicateStatus.SAME_VERSE_ANSWER);
    assertThat(result.isBlocked()).isFalse(); // Warning, not block
}

@Test
void differentVerseSameAnswer_noMatch() {
    // Same answer but different verse → not duplicate
    var req = requestWithVerse("Câu khác", "Genesis", 2, 1, "Đức Chúa Trời");
    var result = service.checkDuplicate(req);
    assertThat(result.getStatus()).isEqualTo(DuplicateStatus.NO_MATCH);
}

// === Layer 3: Fuzzy Similarity ===

@Test
void similarContent_above75Percent_warns() {
    // DB có: "Ai tạo nên trời đất?"
    // New: "Ai đã tạo nên trời và đất?" → similarity ~80%
    var result = service.checkDuplicate(request("Ai đã tạo nên trời và đất?"));
    assertThat(result.getStatus()).isEqualTo(DuplicateStatus.SIMILAR_CONTENT);
    assertThat(result.getMatches()).isNotEmpty();
}

@Test
void differentContent_below75Percent_noMatch() {
    // DB có: "Ai tạo nên trời đất?"
    // New: "Sách nào dài nhất trong Kinh Thánh?" → similarity <50%
    var result = service.checkDuplicate(request("Sách nào dài nhất trong Kinh Thánh?"));
    assertThat(result.getStatus()).isEqualTo(DuplicateStatus.NO_MATCH);
}

// === Similarity Algorithm ===

@Test
void similarity_identicalText_returns1() {
    assertThat(service.calculateSimilarity("hello world", "hello world")).isEqualTo(1.0);
}

@Test
void similarity_completelyDifferent_returns0() {
    assertThat(service.calculateSimilarity("abc def", "xyz uvw")).isEqualTo(0.0);
}

@Test
void similarity_partialOverlap() {
    double sim = service.calculateSimilarity("ai tạo nên trời đất", "ai đã tạo nên trời và đất");
    assertThat(sim).isBetween(0.6, 0.9);
}

// === Integration: Import ===

@Test
void import_exactDuplicate_autoSkipped() {
    var result = importService.importQuestions(
        List.of(existingQuestionDto), 
        ImportOptions.builder().dryRun(true).build()
    );
    assertThat(result.getSkippedCount()).isEqualTo(1);
}

@Test
void import_similarQuestion_warning() {
    var result = importService.importQuestions(
        List.of(similarQuestionDto),
        ImportOptions.builder().dryRun(true).build()
    );
    assertThat(result.getWarningCount()).isEqualTo(1);
}

@Test
void import_duplicateWithinBatch_warning() {
    // 2 câu giống nhau trong cùng file
    var result = importService.importQuestions(
        List.of(questionDto, almostSameQuestionDto),
        ImportOptions.builder().dryRun(true).build()
    );
    assertThat(result.getWarningCount()).isGreaterThanOrEqualTo(1);
}

// === Integration: AI Generate ===

@Test
void aiGenerate_exactDuplicate_autoRejected() {
    // AI tạo câu trùng hệt DB → auto reject
    var drafts = aiService.generateQuestions(request);
    var rejected = drafts.stream().filter(AIGeneratedQuestion::isAutoRejected).toList();
    assertThat(rejected).isNotEmpty();
}

@Test
void aiGenerate_similarWithinBatch_flagged() {
    // AI tạo 2 câu giống nhau → flag câu sau
}

// === API Endpoint ===

@Test
void checkDuplicateEndpoint_returnsResult() {
    mockMvc.perform(post("/api/admin/questions/check-duplicate")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").exists());
}

@Test
void createQuestion_exactDuplicate_returns409() {
    mockMvc.perform(post("/api/admin/questions")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(existingQuestion)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error").value("DUPLICATE"));
}

@Test
void createQuestion_forceCreate_bypasesWarning() {
    var req = similarQuestion;
    req.setForceCreate(true);
    mockMvc.perform(post("/api/admin/questions")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isCreated());
}
```

Commit: "test: 3-layer duplicate detection — all flows"

---

## Tóm tắt 3 Layers:

| Layer | Check gì | Kết quả | UX |
|-------|---------|---------|-----|
| 1. Exact Match | Content giống hệt (sau normalize) | ❌ BLOCK | "Câu này đã tồn tại" |
| 2. Same Verse+Answer | Cùng book+chapter+verse+correctAnswer | ⚠️ WARNING | "Đã có câu cùng verse. Vẫn tạo?" |
| 3. Fuzzy Similarity | Jaccard similarity >= 75% | ⚠️ WARNING | "Tương tự 82% với câu X. Vẫn tạo?" |

Áp dụng cho:
- ✅ Admin manual create (real-time check khi gõ + block/warning on submit)
- ✅ Import CSV/JSON (dry-run report trước khi import)
- ✅ AI generate (auto-reject exact + flag similar cho admin review)

Thứ tự: Task 1 (service) → Task 2 (repository) → Task 3 (manual) → Task 4 (import) → Task 5 (AI) → Task 6 (frontend) → Task 7 (real-time API) → Task 8 (tests)
Total effort: 2-3 ngày.
```
