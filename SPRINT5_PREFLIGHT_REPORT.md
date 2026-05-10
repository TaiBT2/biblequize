# SPRINT 5 — Pre-flight Verification Report

**Date:** 2026-05-10
**Task:** Q-0 (no commit — verification only)
**Branch:** main
**Reviewer:** Bui (đợi confirm trước khi Q-1)

---

## Verdict: 🛑 **Prompt Sprint 5 cần FIX TRƯỚC khi chạy Q-1**

Critical mismatches phát hiện. Các giả định trong PROMPT_FIX_QUIZ_SET_PROFESSIONAL_SPRINT5.md cần update:

| # | Assumption sai | Reality | Impact |
|---|---|---|---|
| **A** | IDs là `BIGINT AUTO_INCREMENT` | **Tất cả IDs là `VARCHAR(36)` (UUID string)** | V50/V51/V52 + entities + repos + DTOs |
| **B** | `@PreAuthorize("hasRole('LEADER')")` | **Service-level helper `requireLeaderOrMod()`** (no Spring Security annotation trong group module) | Q-2a/Q-5 controller signatures |
| **C** | `BadRequestException` | **`ValidationException` ở `infrastructure.exception`** (RuntimeException) | Q-3/Q-5 throw signature |
| **D** | `Difficulty.EASY/MEDIUM/HARD` (UPPERCASE) | **`Difficulty.easy/medium/hard` (lowercase!)** in Question entity | Q-5 enum match |
| **E** | GroupQuizSet đã có status/archivedAt/deletedAt fields | **Entity hiện rất tối thiểu** (5 fields: id, group, createdBy, name, questionIds, createdAt). KHÔNG có status nào. | V50 phải ADD ALL status columns from scratch |
| **F** | `created_by_user_id` BIGINT | Entity dùng `@ManyToOne User createdBy` → column name `created_by` (VARCHAR(36)) | V50/V52 column naming |

---

## Check 1 — `@PreAuthorize` pattern ❌ KHÔNG có

```
grep "@PreAuthorize" ChurchGroupController.java → No matches
```

**Pattern thực tế:** Service-level helper được gọi ở đầu mỗi handler.

```java
// ChurchGroupController.java:777
private void requireLeaderOrMod(String groupId, String userId) { ... }

// Usage examples:
// Line 490, 528, 685
requireLeaderOrMod(id, user.getId());
```

**Spec Sprint 5 phải:**
- KHÔNG dùng `@PreAuthorize` annotation
- Mọi LEADER/MOD endpoint mới (publish/archive/clone/folder...) gọi `requireLeaderOrMod(groupId, user.getId())` ở đầu method
- Nếu cần "LEADER only" (vd kick) → tạo `requireLeader()` helper tương tự

---

## Check 2 — JSON List converter ✅ CÓ (tên khác)

**Tên thật:** `JsonListConverter` (KHÔNG phải `StringListJsonConverter`)
**Path:** `apps/api/src/main/java/com/biblequiz/shared/converter/JsonListConverter.java`
**Type signature:** `AttributeConverter<List<?>, String>` — **raw `List<?>` chứ không type-safe `List<String>`**

**Used trong GroupQuizSet:**
```java
@Convert(converter = JsonListConverter.class)
@Column(name = "question_ids", columnDefinition = "JSON")
private List<?> questionIds;
```

**Decision cho Sprint 5:**
- **Reuse `JsonListConverter`** cho `tags` và `learnedQuestionIds` (raw `List<?>`, cast khi cần)
- Hoặc tạo type-safe `JsonStringListConverter` nếu muốn chuẩn — nhưng tăng scope. Khuyến nghị **reuse**.

---

## Check 3 — Question.difficulty ✅ CÓ — nhưng enum LOWERCASE

**Path:** `apps/api/src/main/java/com/biblequiz/modules/quiz/entity/Question.java`

```java
public enum Difficulty {
    easy, medium, hard   // ⚠️ LOWERCASE, không có MIXED
}
```

**Spec Sprint 5 nói:** `Difficulty.EASY/MEDIUM/HARD/MIXED`

**Conflict:**
- Question dùng `easy/medium/hard` lowercase, không có MIXED
- Spec GroupQuizSet muốn `EASY/MEDIUM/HARD/MIXED` UPPERCASE

**Resolution options:**
1. **(Recommended)** GroupQuizSet `Difficulty` enum riêng = `EASY, MEDIUM, HARD, MIXED` (uppercase, có MIXED) → KHÔNG đụng Question. Auto-derive map: `easy→EASY, medium→MEDIUM, hard→HARD, mixed types→MIXED`.
2. Refactor Question.Difficulty → uppercase + add MIXED. Tăng scope, đụng nhiều code.

→ Khuyến nghị **Option 1**. Q-5 `computeDifficulty()` tổng hợp count theo Question.difficulty rồi map sang GroupQuizSet.Difficulty UPPERCASE.

---

## Check 4 — Validation exception ❌ Tên khác

**Tên thật:** `ValidationException`
**Path:** `apps/api/src/main/java/com/biblequiz/infrastructure/exception/ValidationException.java`
**Type:** `extends RuntimeException`

**Spec Sprint 5 phải:** Replace mọi `throw new BadRequestException(...)` → `throw new ValidationException(...)` trong Q-3/Q-5 code samples.

(Note: `ChurchGroupController` hiện cũng dùng `RuntimeException` trực tiếp + try/catch trả `ResponseEntity.badRequest()` — pattern không nhất quán. Sprint 5 nên dùng `ValidationException` cho cleaner handling qua `GlobalExceptionHandler`.)

---

## Check 5 — Existing schedulers ✅

**5 schedulers tìm thấy:**
- `modules/notification/service/NotificationScheduler.java`
- `modules/group/service/ScheduledQuizScheduler.java`
- `modules/quiz/service/SessionAbandonmentScheduler.java`
- `modules/room/service/RoomCleanupScheduler.java`
- `modules/room/service/RoomAbandonmentScheduler.java`

**Pattern:** `@Scheduled(cron = "...")` — confirmed standard Spring pattern.

**Decision cho Sprint 5:** `QuizSetCleanupScheduler` đặt ở `modules/group/scheduler/QuizSetCleanupScheduler.java` (note: `modules/group/service/` cũng OK, nhưng `scheduler/` subfolder rõ hơn — Q-5 prompt đang nói `scheduler/`). Verify khi tạo: `modules/group/scheduler/` có sẵn chưa? Nếu chưa → tạo subfolder mới (acceptable, không vi phạm convention vì đã có scheduler khác làm pattern tham khảo).

---

## Check 6 — Test baseline ✅

| | Count | Source |
|---|---|---|
| BE | **829** | `apps/api/.test-baseline` |
| FE | **1227** | `apps/web/.test-baseline` |

Saved → `SPRINT5_BASELINE.txt`.

**KHÔNG chạy `./mvnw test` thực tế** vì tốn thời gian; trust file `.test-baseline` được CLAUDE.md đề cập như source of truth. Mỗi task sau Q-1 sẽ chạy delta check.

---

## Check 7 — Mockup file 🟡 Cần move

**Hiện ở:** `docs/group-page/redesign/MOCKUP_QUIZ_SET_V2_PROFESSIONAL.html`
**Canonical (Bui chốt 2026-05-10):** `docs/mockups/MOCKUP_QUIZ_SET_V2_PROFESSIONAL.html`
**Status:** `docs/mockups/` directory **CHƯA tồn tại**.

**Action trước Q-1:** (1 commit chuẩn bị)
```bash
mkdir -p docs/mockups
git mv docs/group-page/redesign/MOCKUP_QUIZ_SET_V2_PROFESSIONAL.html docs/mockups/
git commit -m "chore: move quiz set mockup to docs/mockups/ for Sprint 5"
```

Update tất cả ref trong PROMPT_FIX...md từ `docs/group-page/redesign/MOCKUP...` → `docs/mockups/MOCKUP...`.

---

## Check 8 — i18n validator ✅

```
apps/web/package.json: "validate:i18n": "node scripts/validate-i18n.mjs"
```

**Run:** `cd apps/web && npm run validate:i18n`
**Baseline (per CLAUDE.md):** 648 hardcoded lines, 14 missing keys (post-V39).

**Acceptance:** mọi PR Sprint 5 không tăng count.

---

## Check 9 — `GroupQuizSet` current state 🚨 RẤT TỐI THIỂU

**Entity hiện chỉ có 5 columns (V35 + V36 + V37):**
```java
private String id;            // VARCHAR(36) UUID
private ChurchGroup group;    // FK group_id VARCHAR(36)
private User createdBy;       // FK created_by VARCHAR(36)
private String name;
private List<?> questionIds;  // JSON
private LocalDateTime createdAt;
```

**KHÔNG có:**
- ❌ `status` field nào (ACTIVE/ARCHIVED/SOFT_DELETED đều KHÔNG có)
- ❌ `archived_at`, `deleted_at` tombstones
- ❌ `total_questions`, `language` (spec §3.3 v1.2 nói có — DRIFT)
- ❌ `updated_at`

**Implication cho V50:**
- Spec v1.2 mô tả entity "đã có archived_at/deleted_at" → KHÔNG đúng. V50 phải ADD COLUMN từ ZERO cho status fields.
- V50 schema phải bao gồm cả `archived_at` + `deleted_at` + `updated_at` (không chỉ 16 metadata fields mới).
- KHÔNG có data conflict — backfill `publish_status='PUBLISHED'` trên rows hiện có là an toàn (KHÔNG có rows nào được archive trước đó).

**Updated V50 phải thêm (ngoài 16 fields prompt liệt kê):**
```sql
ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN archived_at TIMESTAMP NULL,
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN total_questions INT NOT NULL DEFAULT 0,    -- Q-2a code phải sync với question_ids size khi save
ADD COLUMN language VARCHAR(2) NOT NULL DEFAULT 'VI',
```

→ V50 thực tế = **21 cột mới** (không phải 16).

---

## Check 10 — Migration version ✅ V50 OK

**Cao nhất hiện:** **V49** (`V49__add_host_plays_game.sql`)

**Sprint 5 giữ V50/V51/V52** — KHÔNG cần auto-bump. ✅

---

## Critical fixes phải apply vào PROMPT_FIX...md TRƯỚC Q-1

### Fix #1 — V50 schema thêm 5 columns chưa có

Q-1 step 1 V50 ALTER TABLE phải prepend:
```sql
ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN archived_at TIMESTAMP NULL,
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN total_questions INT NOT NULL DEFAULT 0,
ADD COLUMN language VARCHAR(2) NOT NULL DEFAULT 'VI',
```

Backfill thêm:
```sql
UPDATE group_quiz_sets
SET total_questions = JSON_LENGTH(question_ids)
WHERE total_questions = 0;
```

### Fix #2 — V51 IDs phải là VARCHAR(36)

```sql
CREATE TABLE group_quiz_set_mastery (
  id VARCHAR(36) PRIMARY KEY,                    -- UUID v7 (CLAUDE.md rule)
  quiz_set_id VARCHAR(36) NOT NULL,              -- FK GroupQuizSet.id
  user_id VARCHAR(36) NOT NULL,                  -- FK User.id
  learned_question_ids JSON NOT NULL,
  questions_learned INT NOT NULL DEFAULT 0,
  total_attempts INT NOT NULL DEFAULT 0,
  best_score INT NOT NULL DEFAULT 0,
  best_accuracy DECIMAL(5,2) NULL,
  last_practiced_at TIMESTAMP NULL,
  completed_mastery BOOLEAN NOT NULL DEFAULT FALSE,
  completed_mastery_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_quiz_user (quiz_set_id, user_id),
  CONSTRAINT fk_mastery_quiz FOREIGN KEY (quiz_set_id) REFERENCES group_quiz_sets(id) ON DELETE CASCADE,
  CONSTRAINT fk_mastery_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_mastery_user (user_id, completed_mastery)
);
```

Note: ID generation cho UUID v7 — entity Java dùng pattern `@PrePersist` set UUID giống GroupQuizSet hiện tại. Verify cách entities khác generate (likely `UuidV7Generator` helper hoặc `UUID.randomUUID().toString()` — Q-2b sẽ check).

### Fix #3 — V52 IDs

```sql
CREATE TABLE group_quiz_set_folder (
  id VARCHAR(36) PRIMARY KEY,
  group_id VARCHAR(36) NOT NULL,                 -- FK ChurchGroup.id
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_by VARCHAR(36) NOT NULL,               -- FK User.id (column name match GroupQuizSet pattern)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_folder_group FOREIGN KEY (group_id) REFERENCES church_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_folder_creator FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_folder_group_order (group_id, display_order)
);

ALTER TABLE group_quiz_sets
ADD COLUMN folder_id VARCHAR(36) NULL,           -- override Fix #1: thay BIGINT bằng VARCHAR(36)
ADD CONSTRAINT fk_quiz_set_folder
FOREIGN KEY (folder_id) REFERENCES group_quiz_set_folder(id) ON DELETE SET NULL;
```

(Note: Fix #1 V50 phải bỏ `ADD COLUMN folder_id BIGINT NULL` — chuyển sang V52 với VARCHAR(36).)

### Fix #4 — Q-2a/Q-5 controller pattern

KHÔNG dùng `@PreAuthorize` cho tất cả endpoints mới. Pattern:

```java
@PatchMapping("/{id}/quiz-sets/{setId}/publish")
@Transactional
public ResponseEntity<?> publishQuizSet(@PathVariable("id") String groupId,
                                         @PathVariable("setId") String setId,
                                         Principal principal) {
    try {
        User user = getUser(principal);
        requireLeaderOrMod(groupId, user.getId());
        GroupQuizSet updated = quizSetService.publishQuizSet(groupId, setId, user.getId());
        return ResponseEntity.ok(Map.of("success", true, "quizSet", toDTO(updated)));
    } catch (ValidationException e) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
    } catch (IllegalArgumentException e) {
        return ResponseEntity.status(403).body(Map.of("success", false, "message", e.getMessage()));
    }
}
```

### Fix #5 — Difficulty enum strategy

Q-2a `GroupQuizSet.Difficulty` enum riêng:
```java
public enum Difficulty { EASY, MEDIUM, HARD, MIXED }
```

Q-5 `computeDifficulty()` map từ Question.difficulty (lowercase) sang GroupQuizSet.Difficulty (uppercase):
```java
private Difficulty computeDifficulty(GroupQuizSet set) {
    List<Question> qs = questionRepo.findAllById(set.getQuestionIds());
    Map<Question.Difficulty, Long> counts = qs.stream()
        .collect(Collectors.groupingBy(Question::getDifficulty, Collectors.counting()));
    long total = qs.size();
    if (counts.getOrDefault(Question.Difficulty.easy, 0L) * 100 / total >= 80) return Difficulty.EASY;
    if (counts.getOrDefault(Question.Difficulty.hard, 0L) * 100 / total >= 80) return Difficulty.HARD;
    if (counts.size() >= 2) return Difficulty.MIXED;
    return Difficulty.MEDIUM;
}
```

### Fix #6 — Replace `BadRequestException` với `ValidationException`

Find/replace toàn prompt: `BadRequestException` → `ValidationException` + import `com.biblequiz.infrastructure.exception.ValidationException`.

### Fix #7 — Mastery Java entity (sau khi V51 fix IDs)

`GroupQuizSetMastery` Java fields:
```java
@Id
@Column(length = 36)
private String id;

@Column(name = "quiz_set_id", length = 36, nullable = false)
private String quizSetId;

@Column(name = "user_id", length = 36, nullable = false)
private String userId;

@Convert(converter = JsonListConverter.class)
@Column(name = "learned_question_ids", columnDefinition = "JSON")
private List<?> learnedQuestionIds = new ArrayList<>();
// ... rest as before but Long → String for IDs
```

---

## Recommended next steps

1. **Bui review report này** + decide:
   - (a) Apply 7 Fixes vào PROMPT_FIX...md trước Q-1, hoặc
   - (b) Inline trong Q-1 commit message + adjust trên-the-fly

2. **Trước Q-1:** chạy 1 commit chuẩn bị move mockup:
   ```bash
   mkdir docs/mockups
   git mv docs/group-page/redesign/MOCKUP_QUIZ_SET_V2_PROFESSIONAL.html docs/mockups/
   git commit -m "chore: move quiz set mockup to docs/mockups/ for Sprint 5"
   ```

3. **Q-1 chạy được** sau khi 7 Fixes apply.

4. **Q-0 KHÔNG commit** code change. Chỉ output report + baseline files (đã tạo).

---

## Files generated by Q-0 (no commit)

- `SPRINT5_PREFLIGHT_REPORT.md` (this file)
- `SPRINT5_BASELINE.txt`

Bui đọc xong → reply "OK Q-1" hoặc "Apply fixes vào prompt trước".
