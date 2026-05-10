# PROMPT: Group Sprint 5 — Quiz Set Professional (v3 — Q-0 findings applied 2026-05-10)

> **Status v3 (2026-05-10):** Q-0 verify đã chạy → `SPRINT5_PREFLIGHT_REPORT.md`. 7 fixes apply inline vào prompt:
>
> 1. **IDs là `VARCHAR(36)` UUID v7** (NOT `BIGINT`) — V50/V51/V52 + entities + repos all `String`
> 2. **Permission**: service-level `requireLeaderOrMod(String groupId, String userId)` helper — KHÔNG `@PreAuthorize`
> 3. **Validation exception**: `com.biblequiz.infrastructure.exception.ValidationException` (KHÔNG `ValidationException`)
> 4. **Question.Difficulty** giữ nguyên `easy/medium/hard` lowercase. GroupQuizSet enum riêng UPPERCASE + MIXED, có `mapFromQuestion()` helper trong Q-5
> 5. **GroupQuizSet entity hiện tối thiểu** (5 fields, no status). V50 phải add 5 cột nền (`updated_at`, `archived_at`, `deleted_at`, `total_questions`, `language`) ngoài 16 metadata → **V50 = 21 cột mới**, `folder_id` chuyển sang V52
> 6. **Column naming**: `created_by` VARCHAR(36) (KHÔNG `created_by_user_id BIGINT`)
> 7. **Converter**: NEW `JsonStringListConverter` type-safe `AttributeConverter<List<String>, String>` — **Q-0.5 task** (KHÔNG reuse `JsonListConverter` raw)
>
> **Mockup prep**: 1 commit `git mv docs/group-page/redesign/MOCKUP_QUIZ_SET_V2_PROFESSIONAL*.html docs/mockups/` TRƯỚC Q-1.
>
> **v2 → v3 commit count**: 10 commits (9 feat + 1 docs) + Q-0 report (no commit) + Q-0.5 (NEW converter, 1 commit) + 1 mockup move = **12 git events**.

---

> **Status v2:** đã apply 9 fixes từ critique round 1: V51 add `learned_question_ids`, split Q-2 → Q-2a/Q-2b, Q-5 own workflow, cover icon-only, separate scheduler, Q-0 pre-flight verify, i18n guard, baseline-relative test counts, ordering rules.
>
> **Mục tiêu:** Nâng cấp Group Quiz Set từ "danh sách câu hỏi tĩnh" thành **first-class feature** chuyên nghiệp với rich metadata, multi-mode play (5 modes thay vì chỉ Sequential), personal mastery tracking, workflow DRAFT/PUBLISHED/ARCHIVED/SOFT_DELETED, content management (folders + search).
>
> **Reference:**
> - `MOCKUP_QUIZ_SET_V2_PROFESSIONAL.html` — mobile mockup (4 states: list/detail/create/play)
> - `MOCKUP_QUIZ_SET_V2_PROFESSIONAL_DESKTOP.html` — desktop mockup (1280×800, responsive guidance)
> - `SPEC_GROUP_v1_3.md` — current spec (sẽ bump v1.4 nếu cần Sprint 6 changes)
> - `SPEC_MULTIPLAYER.md` — 5 modes reference
>
> **Position trong roadmap:** Sprint 5 sau khi Sprint UX-polish (Group Detail) DONE. Multiplayer Sprint 4 (Host-Organizer) cũng phải DONE vì Quiz Set live rooms tự động dùng Quản trò mode.

---

## Decisions đã chốt (Bui ủy quyền 2026-05-09)

| # | Decision | Value |
|---|---|---|
| 1 | Multi-mode play | ✅ Implement — Quiz Set chơi với cả 5 modes |
| 2 | Personal Mastery | ✅ Implement — track riêng, KHÔNG break Q-A leaderboard |
| 3 | Marketplace / Discovery | ⏭️ Defer v2.5 — chưa critical mass, cần moderation |
| 4 | Workflow status | 4 statuses: DRAFT / PUBLISHED / ARCHIVED / SOFT_DELETED (skip TESTING) |
| 5 | Scheduled vs Live Room | Giữ riêng, relax constraints — refactor unified concept defer Sprint 6 |
| 6 | Content management | Folders + search/filter/sort + bulk actions + clone (Sprint 5/6) |
| 7 | **Cover image** | **Sprint 5 = ICON PICKER ONLY** (10 emoji options). Image upload defer Sprint 6 (QS-7). KHÔNG có endpoint `/api/uploads/quiz-set-cover`. |
| 8 | **Hard-delete scheduler** | **`QuizSetCleanupScheduler` riêng** (separate từ RoomCleanupScheduler) — quiz set lifecycle 30 days vs room 24h. |

---

## 🔧 Q-0 Findings applied (2026-05-10) — PROMPT v3

> Báo cáo `SPRINT5_PREFLIGHT_REPORT.md` đã verify codebase. Các giả định v2 SAI đã được fix inline:
>
> 1. **IDs là VARCHAR(36) UUID v7**, KHÔNG `BIGINT AUTO_INCREMENT` — V50/V51/V52 + entities + repos all use `String`
> 2. **Permission**: service-level `requireLeaderOrMod(groupId, userId)` helper, KHÔNG `@PreAuthorize`
> 3. **Validation exception**: `com.biblequiz.infrastructure.exception.ValidationException` (KHÔNG `ValidationException`)
> 4. **Question.Difficulty**: lowercase `easy/medium/hard` (no MIXED). GroupQuizSet dùng enum riêng UPPERCASE
> 5. **GroupQuizSet entity hiện tối thiểu** (5 fields). V50 phải add `updated_at` + `archived_at` + `deleted_at` + `total_questions` + `language` ngoài 16 fields metadata → **21 cột mới**
> 6. **Column naming**: `created_by` VARCHAR(36) (KHÔNG `created_by_user_id BIGINT`)
> 7. **Converter**: tên thật `JsonListConverter` (raw `List<?>`), KHÔNG `StringListJsonConverter`
> 8. **Mockup path**: `docs/mockups/` (cần 1 commit chuẩn bị `git mv` từ `docs/group-page/redesign/` trước Q-1)

---

## Verification Protocol (BẮT BUỘC trước mỗi task)

1. **Read trước khi sửa** — code đã shift sau Sprint UX-polish, cần verify
2. **Quote line numbers** trong commit message
3. **Tests pre-existing fail** — KHÔNG treat là blocker
4. **Q-A leaderboard rule must NOT break** — Mastery là personal stats, không vào group leaderboard
5. **Backward compat:** Existing quiz sets tự động = PUBLISHED status, NULL metadata fields acceptable
6. **i18n guard:** chạy `npm run i18n:check` (hoặc command từ Q-0 Check 8) sau mỗi FE task. Hardcoded count KHÔNG được tăng.
7. **Test count:** dùng `SPRINT5_BASELINE.txt` từ Q-0, mỗi task compare delta với baseline

---

## Commit hygiene

- **Mỗi task = 1 commit riêng.** Format: `feat(quiz-set):` hoặc `refactor(quiz-set):`
- Sau mỗi commit: STOP, chạy test, báo cáo, đợi Bui confirm
- KHÔNG chạy 10 tasks liên tiếp một lèo
- **Q-0 KHÔNG commit** — chỉ output report

---

## Constraint rules (embed cho mọi task)

### Memory rules apply
- Hardcoded hex colors (`#e8a832 / #11131e`), KHÔNG CSS variables (white-bg bug)
- Be Vietnam Pro 800/900 cho headings tiếng Việt
- SVG icons / hardcoded emojis match mockup (📖 📜 🎈 📝 ⚡ ⚔️ 💀 🥊 📚)
- i18n: Vietnamese-first, đầy đủ vi.json + en.json

### Backward compatibility
- V50 migration phải `ADD COLUMN` (additive only, không drop existing)
- Existing rows: NULL metadata fields = acceptable; `publish_status` default = `'PUBLISHED'` (legacy)
- API endpoints existing không break — extend với optional fields

---

## Task Q-0 — Pre-flight verification 🔴 (mandatory, no commit)

**Goal:** Verify codebase assumptions trước khi viết code. KHÔNG có commit cho task này, chỉ output report.

**Output:** Tạo file `SPRINT5_PREFLIGHT_REPORT.md` ở root với findings + `SPRINT5_BASELINE.txt`.

### Check 1 — `@PreAuthorize` pattern cho group permissions
```bash
grep -rn "@PreAuthorize" apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java
grep -rn "RequireGroupRole\|@CheckGroupPermission" apps/api/src/main/java/com/biblequiz/
```
Báo cáo:
- Pattern hiện dùng (annotation custom? service-level check? `hasRole('GROUP_LEADER')` literal?)
- Method signature mẫu cho LEADER-only và LEADER+MOD endpoints
- → Spec Sprint 5 SẼ FOLLOW pattern này, không introduce annotation mới

### Check 2 — `StringListJsonConverter` exists?
```bash
find apps/api/src -name "*JsonConverter*.java"
grep -rn "implements AttributeConverter" apps/api/src/main/java/com/biblequiz/shared/converter/
```
Báo cáo:
- Converter tên gì cho `List<String>` ↔ JSON?
- Nếu KHÔNG có → ghi nhận, Q-2a sẽ tạo mới
- Nếu CÓ tên khác (vd `JsonStringListConverter`, `ListJsonConverter`) → dùng tên thật

### Check 3 — `Question` entity có field `difficulty` không?
```bash
grep -A 30 "@Entity" apps/api/src/main/java/com/biblequiz/modules/question/entity/Question.java | grep -i "difficulty"
```
Báo cáo:
- Field tên gì? Type ENUM hay String?
- Values: EASY/MEDIUM/HARD? Hay khác?
- Nếu CÓ → Q-5 `computeDifficulty()` dùng được
- Nếu KHÔNG → defer auto-derive, fallback default MEDIUM

### Check 4 — `ValidationException` exists hay phải dùng class khác?
```bash
grep -rn "class ValidationException\|class ValidationException" apps/api/src/main/java/com/biblequiz/
```
Báo cáo:
- Exception class nào dùng cho validation errors trong project?
- → Spec Sprint 5 sẽ dùng class đó, không introduce mới

### Check 5 — Existing schedulers
```bash
find apps/api/src -name "*Scheduler.java" | xargs grep -l "@Scheduled"
```
Báo cáo:
- List tất cả scheduler classes hiện có
- Pattern: `@Scheduled(cron=...)` hay `fixedRate=`?
- → `QuizSetCleanupScheduler` (Sprint 5 NEW) sẽ follow pattern

### Check 6 — Test baseline counts
```bash
cd apps/api && ./mvnw test 2>&1 | grep -E "Tests run|tests passed" | tail -3
cd ../web && npm run test 2>&1 | grep -E "Tests:|passed" | tail -3
```
Báo cáo:
- BE: X tests pass, Y skipped, Z failed (pre-existing failures = baseline)
- FE: X tests pass, Y failed
- → Lưu vào `SPRINT5_BASELINE.txt`. Mỗi task sau Q-1 phải compare delta.

### Check 7 — Mockup files accessible?
```bash
test -f docs/mockups/MOCKUP_QUIZ_SET_V2_PROFESSIONAL.html && echo "MOBILE OK" || echo "MOBILE MISSING"
test -f docs/mockups/MOCKUP_QUIZ_SET_V2_PROFESSIONAL_DESKTOP.html && echo "DESKTOP OK" || echo "DESKTOP MISSING"
```
Báo cáo:
- Nếu missing → Bui copy mockups từ `/mnt/user-data/outputs/` vào `docs/mockups/` trước khi Q-6/Q-7/Q-8
- Q-6/Q-7/Q-8 BẮT BUỘC mở mockup trước khi code FE
- Verify design tokens: hex `#e8a832` (gold), `#11131e` (navy bg), Be Vietnam Pro 800/900 ✅

### Check 8 — i18n validator command exists?
```bash
cd apps/web && cat package.json | grep -E "i18n|validate"
```
Báo cáo:
- Script validator name (vd `npm run i18n:check`)
- Current hardcoded strings count (baseline)
- → Mỗi FE task chạy validator + report delta

### Check 9 — Existing `GroupQuizSet.status` enum values?
```bash
grep -A 5 "enum.*Status\|@Enumerated" apps/api/src/main/java/com/biblequiz/modules/group/entity/GroupQuizSet.java
```
Báo cáo:
- Hiện status enum là gì (ACTIVE/ARCHIVED/SOFT_DELETED?)
- → V50 migration phải drop+recreate column nếu enum value mismatch, hoặc rename status → publish_status

### Check 10 — Migration version cao nhất
```bash
ls apps/api/src/main/resources/db/migration/ | sort -V | tail -5
```
Báo cáo:
- Migration cuối cùng là V?? — Sprint 5 dùng V50/V51/V52 nếu chưa conflict
- Nếu V50 đã ship → bump lên V53/V54/V55

**Acceptance criteria:**
- File `SPRINT5_PREFLIGHT_REPORT.md` tạo xong với 10 sections trả lời
- File `SPRINT5_BASELINE.txt` lưu test counts
- Bui review report → confirm trước khi Claude Code start Q-1

**KHÔNG commit gì — chỉ là verification step.**

---

## Task Q-0.5 — `JsonStringListConverter` (NEW, type-safe) 🔴

**Goal:** Tạo type-safe converter `AttributeConverter<List<String>, String>` cho Sprint 5 entities. KHÔNG reuse `JsonListConverter` raw `List<?>` vì cần type safety cho `tags` + `learnedQuestionIds`.

**File (NEW):**
- `apps/api/src/main/java/com/biblequiz/shared/converter/JsonStringListConverter.java`

**Implementation:**
```java
package com.biblequiz.shared.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Converter
public class JsonStringListConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) return "[]";
        try {
            return MAPPER.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize List<String> to JSON", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return new ArrayList<>();
        try {
            List<String> result = MAPPER.readValue(dbData, TYPE);
            return result != null ? result : new ArrayList<>();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
```

**Tests:**
- `JsonStringListConverterTest`: roundtrip `["a","b"]`, empty list `[]`, null input → empty list, malformed JSON → empty list

**Verify:** test count >= baseline + 4

**Commit:** `feat(shared): JsonStringListConverter type-safe AttributeConverter for Sprint 5`

---

## Task Q-1 — DB migrations (3 migrations) 🔴

**Goal:** Schema foundation cho Sprint 5.

**Files:**
- `apps/api/src/main/resources/db/migration/V50__group_quiz_set_metadata.sql` (NEW)
- `apps/api/src/main/resources/db/migration/V51__group_quiz_set_mastery.sql` (NEW)
- `apps/api/src/main/resources/db/migration/V52__group_quiz_set_folder.sql` (NEW)

**Steps:**

1. **V50 — Add metadata + base lifecycle fields to group_quiz_sets** (21 cột mới — entity hiện chỉ có 5 cột nền, phải thêm cả lifecycle stamps lẫn metadata):

   ```sql
   ALTER TABLE group_quiz_sets
     -- Q-0 finding #5: 5 base columns chưa có trong entity hiện tại
     ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     ADD COLUMN archived_at TIMESTAMP NULL,
     ADD COLUMN deleted_at TIMESTAMP NULL,
     ADD COLUMN total_questions INT NOT NULL DEFAULT 0,
     ADD COLUMN language VARCHAR(2) NOT NULL DEFAULT 'VI',
     -- 16 metadata fields (Sprint 5 core)
     ADD COLUMN description VARCHAR(500) NULL,
     ADD COLUMN cover_image_url VARCHAR(500) NULL,
     ADD COLUMN tags JSON NULL,
     ADD COLUMN cover_scripture VARCHAR(100) NULL,
     ADD COLUMN author_note VARCHAR(1000) NULL,
     ADD COLUMN difficulty ENUM('EASY','MEDIUM','HARD','MIXED') NULL,
     ADD COLUMN estimated_duration_min INT NULL,
     ADD COLUMN suggested_mode VARCHAR(50) NULL,
     ADD COLUMN play_count INT NOT NULL DEFAULT 0,
     ADD COLUMN average_rating DECIMAL(3,2) NULL,
     ADD COLUMN total_ratings INT NOT NULL DEFAULT 0,
     ADD COLUMN last_played_at TIMESTAMP NULL,
     ADD COLUMN publish_status ENUM('DRAFT','PUBLISHED','ARCHIVED','SOFT_DELETED') NOT NULL DEFAULT 'PUBLISHED',
     ADD COLUMN published_at TIMESTAMP NULL;
   -- NOTE: folder_id KHÔNG ở V50 — chuyển sang V52 để tránh forward-reference vào table chưa tồn tại

   -- Backfill: existing rows = PUBLISHED với published_at = created_at (vì updated_at vừa add NULL)
   UPDATE group_quiz_sets
   SET publish_status = 'PUBLISHED',
       published_at = created_at,
       updated_at = created_at
   WHERE publish_status IS NULL OR publish_status = '';

   -- Backfill total_questions từ JSON length của question_ids hiện có
   UPDATE group_quiz_sets
   SET total_questions = JSON_LENGTH(question_ids)
   WHERE total_questions = 0;

   -- Index for filtering
   CREATE INDEX idx_quiz_set_status ON group_quiz_sets(group_id, publish_status);
   CREATE INDEX idx_quiz_set_play_count ON group_quiz_sets(play_count DESC);
   -- idx_quiz_set_folder tạo sau khi folder_id được add ở V52
   ```

2. **V51 — Mastery table (VARCHAR(36) UUID v7 — Q-0 finding #1):**
   ```sql
   CREATE TABLE group_quiz_set_mastery (
     id VARCHAR(36) PRIMARY KEY,                    -- UUID v7 (CLAUDE.md rule)
     quiz_set_id VARCHAR(36) NOT NULL,              -- FK group_quiz_sets.id
     user_id VARCHAR(36) NOT NULL,                  -- FK users.id
     learned_question_ids JSON NOT NULL,            -- track exact IDs đã học (không double-count)
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

   **Note:** MySQL JSON column KHÔNG support DEFAULT literal. `learned_question_ids JSON NOT NULL` (no default) — entity init `= new ArrayList<>()` qua `JsonStringListConverter` (tạo ở Q-0.5):
   ```java
   @Convert(converter = JsonStringListConverter.class)
   @Column(name = "learned_question_ids", columnDefinition = "json", nullable = false)
   private List<String> learnedQuestionIds = new ArrayList<>();
   ```
   ID generation: dùng pattern UUID v7 của project (verify `GroupQuizSet` `@PrePersist` trong Q-2b — likely `UUID.randomUUID().toString()` hoặc `UuidV7Generator` nếu có).

3. **V52 — Folders (VARCHAR(36) UUID + add `folder_id` to group_quiz_sets):**
   ```sql
   CREATE TABLE group_quiz_set_folder (
     id VARCHAR(36) PRIMARY KEY,                    -- UUID v7
     group_id VARCHAR(36) NOT NULL,                 -- FK church_groups.id
     name VARCHAR(50) NOT NULL,
     color VARCHAR(7) NULL,
     display_order INT NOT NULL DEFAULT 0,
     created_by VARCHAR(36) NOT NULL,               -- FK users.id (match GroupQuizSet column naming)
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT fk_folder_group FOREIGN KEY (group_id) REFERENCES church_groups(id) ON DELETE CASCADE,
     CONSTRAINT fk_folder_creator FOREIGN KEY (created_by) REFERENCES users(id),
     INDEX idx_folder_group_order (group_id, display_order)
   );

   -- folder_id chuyển từ V50 sang V52 (forward-reference safe ở đây vì table vừa create)
   ALTER TABLE group_quiz_sets
     ADD COLUMN folder_id VARCHAR(36) NULL,
     ADD CONSTRAINT fk_quiz_set_folder
       FOREIGN KEY (folder_id) REFERENCES group_quiz_set_folder(id) ON DELETE SET NULL;

   CREATE INDEX idx_quiz_set_folder ON group_quiz_sets(folder_id);
   ```

**Test:**
- Migrations run clean trên dev DB
- DB inspection: `DESCRIBE group_quiz_sets;` xác nhận **22 cột mới** (21 từ V50 + folder_id từ V52)
- Existing rows backfilled: `SELECT COUNT(*) FROM group_quiz_sets WHERE publish_status='PUBLISHED'` = total
- `SELECT total_questions, JSON_LENGTH(question_ids) FROM group_quiz_sets LIMIT 5` → match

**Commit:** `feat(quiz-set): V50/V51/V52 migrations for metadata, mastery, folders`

---

## Task Q-2a — Backend: GroupQuizSet entity expand + DTO + basic CRUD 🔴

**Goal:** Extend existing GroupQuizSet entity với 16 fields metadata. KHÔNG đụng workflow logic (đó là Q-5).

**Files (limited scope):**
- `apps/api/src/main/java/com/biblequiz/modules/group/entity/GroupQuizSet.java` (extend fields only)
- `apps/api/src/main/java/com/biblequiz/modules/group/dto/GroupQuizSetDTO.java` (extend DTO)
- `apps/api/src/main/java/com/biblequiz/modules/group/repository/GroupQuizSetRepository.java` (search/filter queries only)
- `apps/api/src/main/java/com/biblequiz/modules/group/service/GroupQuizSetService.java` (extend update method only)
- `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` (existing CRUD endpoints accept new fields)

**Steps:**

1. **Add 21 fields** vào GroupQuizSet entity (5 base lifecycle + 16 metadata — Q-0 finding #5 + #6):
   ```java
   // ─────────── Base lifecycle (V50 — chưa có trong entity hiện tại) ───────────
   @UpdateTimestamp
   @Column(name = "updated_at")
   private Instant updatedAt;

   @Column(name = "archived_at")
   private Instant archivedAt;

   @Column(name = "deleted_at")
   private Instant deletedAt;

   @Column(name = "total_questions", nullable = false)
   private Integer totalQuestions = 0;

   @Column(length = 2, nullable = false)
   private String language = "VI";

   // ─────────── Metadata fields (V50) ───────────
   @Column(length = 500)
   private String description;

   @Column(name = "cover_image_url", length = 500)
   private String coverImageUrl;

   @Convert(converter = JsonStringListConverter.class)   // Q-0.5 type-safe converter
   @Column(columnDefinition = "json")
   private List<String> tags = new ArrayList<>();

   @Column(name = "cover_scripture", length = 100)
   private String coverScripture;

   @Column(name = "author_note", length = 1000)
   private String authorNote;

   @Enumerated(EnumType.STRING)
   private Difficulty difficulty;

   @Column(name = "estimated_duration_min")
   private Integer estimatedDurationMin;

   @Column(name = "suggested_mode", length = 50)
   private String suggestedMode; // RoomMode enum value as string

   @Column(name = "play_count", nullable = false)
   private Integer playCount = 0;

   @Column(name = "average_rating", precision = 3, scale = 2)
   private BigDecimal averageRating;

   @Column(name = "total_ratings", nullable = false)
   private Integer totalRatings = 0;

   @Column(name = "last_played_at")
   private Instant lastPlayedAt;

   @Enumerated(EnumType.STRING)
   @Column(name = "publish_status", nullable = false)
   private PublishStatus publishStatus = PublishStatus.DRAFT;

   @Column(name = "published_at")
   private Instant publishedAt;

   // V52 — folder_id (after V52 migration creates the folder table)
   @Column(name = "folder_id", length = 36)
   private String folderId;

   // GroupQuizSet enum riêng — UPPERCASE + MIXED (Q-0 finding #4)
   // Question.Difficulty giữ nguyên lowercase. Map qua Q-5 mapFromQuestion() helper.
   public enum PublishStatus {
       DRAFT, PUBLISHED, ARCHIVED, SOFT_DELETED
   }

   public enum Difficulty {
       EASY, MEDIUM, HARD, MIXED
   }
   ```

2. **Converter**: dùng `JsonStringListConverter` (Q-0.5 task — type-safe `List<String>`).

3. **DTO update:** GroupQuizSetDTO thêm tất cả fields mới + `myMastery: MasteryDTO` (nullable, populated khi viewer auth).

4. **Update existing GET/POST/PATCH** endpoints để accept new fields. **KHÔNG add publish/archive/clone endpoints (Q-5 owns those).**

5. **Search/filter queries:**
   ```java
   @Query("SELECT s FROM GroupQuizSet s WHERE s.group.id = :groupId " +
          "AND s.publishStatus IN :statuses " +
          "AND (:folderId IS NULL OR s.folderId = :folderId) " +
          "AND (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')))")
   Page<GroupQuizSet> findFiltered(...);
   ```

6. **Permission:** dùng `requireLeaderOrMod(String groupId, String userId)` helper ở [ChurchGroupController.java:777](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L777) — KHÔNG `@PreAuthorize` (Q-0 finding #2). Mọi handler mới gọi helper ở dòng đầu sau khi resolve `User` từ `Principal`.

**Tests:**
- GroupQuizSetServiceTest: createWithMetadata, updateWithMetadata
- GroupQuizSetRepositoryTest: findFiltered với search + status + folder

**Verify:** test count >= `SPRINT5_BASELINE.txt` BE baseline + 4

**Commit:** `feat(quiz-set): expand entity with 16 metadata fields + filter queries`

---

## Task Q-2b — Backend: Mastery + Folder entities/repos 🔴

**Goal:** Tạo 2 entities mới + repositories. CHƯA wire vào service (Q-4 sẽ wire mastery service, Q-8 sẽ wire folder UI).

**Files (NEW only):**
- `apps/api/src/main/java/com/biblequiz/modules/group/entity/GroupQuizSetMastery.java`
- `apps/api/src/main/java/com/biblequiz/modules/group/entity/GroupQuizSetFolder.java`
- `apps/api/src/main/java/com/biblequiz/modules/group/repository/GroupQuizSetMasteryRepository.java`
- `apps/api/src/main/java/com/biblequiz/modules/group/repository/GroupQuizSetFolderRepository.java`

**Steps:**

1. **GroupQuizSetMastery entity** — IDs là `String` UUID v7 (Q-0 finding #1):
   ```java
   @Entity
   @Table(name = "group_quiz_set_mastery")
   @Data
   public class GroupQuizSetMastery {
       @Id
       @Column(length = 36)
       private String id;

       @Column(name = "quiz_set_id", length = 36, nullable = false)
       private String quizSetId;

       @Column(name = "user_id", length = 36, nullable = false)
       private String userId;

       @Convert(converter = JsonStringListConverter.class)   // Q-0.5
       @Column(name = "learned_question_ids", columnDefinition = "json", nullable = false)
       private List<String> learnedQuestionIds = new ArrayList<>();

       @Column(name = "questions_learned", nullable = false)
       private Integer questionsLearned = 0;

       @Column(name = "total_attempts", nullable = false)
       private Integer totalAttempts = 0;

       @Column(name = "best_score", nullable = false)
       private Integer bestScore = 0;

       @Column(name = "best_accuracy", precision = 5, scale = 2)
       private BigDecimal bestAccuracy;

       @Column(name = "last_practiced_at")
       private Instant lastPracticedAt;

       @Column(name = "completed_mastery", nullable = false)
       private Boolean completedMastery = false;

       @Column(name = "completed_mastery_at")
       private Instant completedMasteryAt;

       @CreationTimestamp
       @Column(name = "created_at", nullable = false)
       private Instant createdAt;

       @UpdateTimestamp
       @Column(name = "updated_at", nullable = false)
       private Instant updatedAt;

       @PrePersist
       public void prePersist() {
           if (id == null) id = UUID.randomUUID().toString();   // verify project's UuidV7 helper khi implement
       }
   }
   ```

2. **GroupQuizSetFolder entity:** standard, theo schema V52. IDs `String`, `groupId` String, `createdBy` String. `@PrePersist` set UUID giống Mastery.

3. **MasteryRepository methods:**
   ```java
   Optional<GroupQuizSetMastery> findByQuizSetIdAndUserId(String quizSetId, String userId);

   @Query("SELECT m FROM GroupQuizSetMastery m " +
          "JOIN GroupQuizSet s ON m.quizSetId = s.id " +
          "WHERE m.userId = :userId AND s.group.id = :groupId")
   List<GroupQuizSetMastery> findByUserIdAndGroupId(@Param("userId") String userId, @Param("groupId") String groupId);
   ```

4. **FolderRepository methods:**
   ```java
   List<GroupQuizSetFolder> findByGroupIdOrderByDisplayOrder(String groupId);
   ```

**Tests:**
- MasteryRepositoryTest: save + findByQuizSetIdAndUserId + verify learnedQuestionIds JSON serialize
- FolderRepositoryTest: save + findByGroupIdOrderByDisplayOrder

**Verify:** test count >= baseline + 4

**Commit:** `feat(quiz-set): mastery + folder entities and repositories`

---

## Task Q-3 — Multi-mode play support 🔴

**Goal:** Quiz Set có thể chơi với cả 5 modes (Speed Race, Battle Royale, Team vs Team, Sudden Death, Sequential).

**Files:**
- `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` (`POST /live-rooms` endpoint ~line 670-735)
- `apps/api/src/main/java/com/biblequiz/modules/group/service/ChurchGroupService.java` (createLiveRoom logic)
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java` (validation per mode)

**Steps:**

1. **Update CreateLiveRoomRequest DTO** — thêm `mode` field optional:
   ```java
   public class CreateLiveRoomRequest {
       private String quizSetId;
       private String name;
       private Integer questionCount;
       private Integer timePerQuestionSec;
       private Integer maxPlayers;
       private RoomMode mode; // NEW: Sprint 5 — defaults to quizSet.suggestedMode hoặc GROUP_LIVE_SEQUENTIAL
   }
   ```

2. **Update createLiveRoom logic:**
   ```java
   public Room createLiveRoom(String groupId, CreateLiveRoomRequest req, User leader) {
       GroupQuizSet quizSet = validateQuizSetBelongsToGroup(groupId, req.getQuizSetId());
       
       // Sprint 5: cho phép mode bất kỳ
       RoomMode mode = req.getMode();
       if (mode == null) {
           // Default: dùng quizSet.suggestedMode hoặc fallback GROUP_LIVE_SEQUENTIAL
           mode = quizSet.getSuggestedMode() != null
               ? RoomMode.valueOf(quizSet.getSuggestedMode())
               : RoomMode.GROUP_LIVE_SEQUENTIAL;
       }
       
       // Validate mode-specific constraints
       validateModeForQuizSet(mode, quizSet);
       
       Room room = new Room();
       room.setMode(mode);
       room.setQuestionSource(QuestionSource.CUSTOM);
       room.setGroupQuizSetId(quizSet.getId());
       room.setHostPlaysGame(false); // Sprint 4 default — host không chơi
       // ... existing logic
       return roomService.save(room);
   }
   
   private void validateModeForQuizSet(RoomMode mode, GroupQuizSet quizSet) {
       int totalQuestions = quizSet.getTotalQuestions();
       
       switch (mode) {
           case BATTLE_ROYALE:
               if (totalQuestions < 4) {
                   throw new ValidationException("Battle Royale cần tối thiểu 4 câu hỏi"); // import infrastructure.exception.ValidationException
               }
               break;
           case SUDDEN_DEATH:
               if (totalQuestions < 10) {
                   throw new ValidationException("Sudden Death cần tối thiểu 10 câu hỏi");
               }
               break;
           case TEAM_VS_TEAM:
               if (totalQuestions < 6 || totalQuestions % 2 != 0) {
                   throw new ValidationException("Team vs Team cần số câu chẵn ≥6");
               }
               break;
           case SPEED_RACE:
           case GROUP_LIVE_SEQUENTIAL:
               // No special constraint
               break;
       }
   }
   ```

3. **Tournament support (bonus):**
   ```
   POST /api/groups/{id}/tournaments
   Body: { quizSetId, mode, bracketSize: 4|8|16 }
   ```
   Cross-link với SPEC_MULTIPLAYER tournament structure (existing).

4. **Tests:**
   - createLiveRoom với mode=SPEED_RACE → success
   - createLiveRoom với mode=BATTLE_ROYALE + 3 câu → ValidationException
   - createLiveRoom mode=null → default to suggestedMode hoặc SEQUENTIAL
   - createLiveRoom với mode=null + suggestedMode=null → default SEQUENTIAL

**Test:**
- Backend tests pass
- Manual: tạo quiz set với suggestedMode=SPEED_RACE → tạo live room không pass mode → room created với SPEED_RACE
- Manual: tạo live room với mode=BATTLE_ROYALE từ quiz set 5 câu → success; với 3 câu → reject

**Commit:** `feat(quiz-set): support all 5 modes for live rooms (multi-mode play)`

---

## Task Q-4 — Mastery tracking service 🟠

**Goal:** Track personal mastery khi user practice solo từ Group Quiz Set. KHÔNG vào group leaderboard.

**Files:**
- `apps/api/src/main/java/com/biblequiz/modules/group/service/GroupQuizSetMasteryService.java` (NEW)
- `apps/api/src/main/java/com/biblequiz/modules/quiz/service/QuizSessionService.java` (hook khi solo practice from group set)
- `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` (mastery endpoint)

**Steps:**

1. **MasteryService:**
   ```java
   @Service
   @RequiredArgsConstructor
   public class GroupQuizSetMasteryService {
       private final GroupQuizSetMasteryRepository repository;
       private final GroupQuizSetRepository quizSetRepository;
       
       /**
        * Called sau khi user complete 1 solo practice session từ Group Quiz Set.
        * @param correctQuestionIds — IDs các câu user trả lời đúng trong session này
        */
       @Transactional
       public void recordPracticeSession(String quizSetId, String userId,
                                         Set<String> correctQuestionIds,
                                         int totalScore, double accuracy) {
           GroupQuizSetMastery mastery = repository
               .findByQuizSetIdAndUserId(quizSetId, userId)
               .orElseGet(() -> {
                   GroupQuizSetMastery m = new GroupQuizSetMastery();
                   m.setQuizSetId(quizSetId);
                   m.setUserId(userId);
                   return m;
               });
           
           // Track learned questions: union of previous + current correct
           Set<String> previouslyLearned = parseLearnedIds(mastery);
           Set<String> allLearned = new HashSet<>(previouslyLearned);
           allLearned.addAll(correctQuestionIds);
           
           mastery.setQuestionsLearned(allLearned.size());
           mastery.setTotalAttempts(mastery.getTotalAttempts() + 1);
           mastery.setLastPracticedAt(Instant.now());
           
           if (totalScore > mastery.getBestScore()) {
               mastery.setBestScore(totalScore);
               mastery.setBestAccuracy(BigDecimal.valueOf(accuracy));
           }
           
           // Check completed mastery
           GroupQuizSet quizSet = quizSetRepository.findById(quizSetId).orElseThrow();
           if (allLearned.size() >= quizSet.getTotalQuestions() && !mastery.getCompletedMastery()) {
               mastery.setCompletedMastery(true);
               mastery.setCompletedMasteryAt(Instant.now());
               // TODO: trigger achievement notification "Đã thuộc Quiz Set X"
           }
           
           repository.save(mastery);
       }
       
       public MasteryDTO getMastery(String quizSetId, String userId) {
           return repository.findByQuizSetIdAndUserId(quizSetId, userId)
               .map(this::toDTO)
               .orElse(MasteryDTO.empty(quizSetId, userId));
       }
       
       public List<MasteryDTO> getUserMasteries(String userId, String groupId) {
           return repository.findByUserIdAndGroupId(userId, groupId)
               .stream().map(this::toDTO).toList();
       }
   }
   ```

2. **Storage of learned IDs:** add `learned_question_ids` JSON column cho mastery table — track exact IDs đã học (để không double-count). Update V51 migration thêm column này.

3. **Hook into solo practice flow:** trong `QuizSessionService.completeSession`, check nếu session source là `groupQuizSetId` → call `masteryService.recordPracticeSession`. **Q-A guard:** đảm bảo KHÔNG add vào UserDailyProgress cho group leaderboard purposes.

4. **API endpoints:**
   ```
   GET /api/groups/{id}/quiz-sets/{setId}/my-mastery
   GET /api/groups/{id}/my-masteries  — list all masteries trong group này
   ```

5. **Tests:**
   - MasteryServiceTest: recordPracticeSession increments learnedQuestions correctly
   - Hết mastery khi all questions learned → completedMastery=true
   - Best score updated only khi cao hơn

**Test:**
- Backend tests pass
- Manual: solo practice quiz set 15 câu, đúng 12 câu → mastery row có questions_learned=12
- Manual: practice lần 2 đúng 15 câu (4 câu mới) → questions_learned=15, completed_mastery=true

**Commit:** `feat(quiz-set): personal mastery tracking service (no group leaderboard impact, Q-A safe)`

---

## Task Q-5 — Workflow status (4 statuses) 🟠

**Goal:** Implement DRAFT → PUBLISHED → ARCHIVED → SOFT_DELETED workflow với transitions + visibility rules.

**Files:**
- `apps/api/src/main/java/com/biblequiz/modules/group/service/GroupQuizSetService.java` (workflow methods)
- `apps/api/src/main/java/com/biblequiz/modules/group/repository/GroupQuizSetRepository.java` (visibility queries)
- `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` (workflow endpoints)

**Steps:**

1. **Workflow methods:**
   ```java
   @Transactional
   public GroupQuizSet publishQuizSet(String groupId, String setId, String userId) {
       GroupQuizSet set = findByIdAndGroup(setId, groupId);
       requireOwnerOrLeader(set, userId);
       
       if (set.getPublishStatus() != PublishStatus.DRAFT) {
           throw new ValidationException("Chỉ bộ câu hỏi nháp mới có thể xuất bản");
       }
       if (set.getTotalQuestions() < 5) {
           throw new ValidationException("Cần tối thiểu 5 câu hỏi để xuất bản");
       }
       
       set.setPublishStatus(PublishStatus.PUBLISHED);
       set.setPublishedAt(Instant.now());
       
       // Auto-derive difficulty + estimated duration
       set.setDifficulty(computeDifficulty(set));
       set.setEstimatedDurationMin(set.getTotalQuestions() * 30 / 60);
       
       return repository.save(set);
   }
   
   @Transactional
   public GroupQuizSet archiveQuizSet(String groupId, String setId, String userId) {
       GroupQuizSet set = findByIdAndGroup(setId, groupId);
       requireOwnerOrLeader(set, userId);
       
       // Block if has scheduled quiz active
       if (scheduledQuizRepository.existsByQuizSetIdAndStatus(setId, ACTIVE)) {
           throw new ValidationException("Không thể lưu trữ — có bài quiz lên lịch đang dùng bộ này");
       }
       
       set.setPublishStatus(PublishStatus.ARCHIVED);
       return repository.save(set);
   }
   
   @Transactional
   public GroupQuizSet unarchiveQuizSet(String groupId, String setId, String userId) {
       // ARCHIVED → PUBLISHED (back to active)
   }
   
   @Transactional
   public void softDeleteQuizSet(String groupId, String setId, String userId) {
       GroupQuizSet set = findByIdAndGroup(setId, groupId);
       requireOwnerOrLeader(set, userId);
       
       set.setPublishStatus(PublishStatus.SOFT_DELETED);
       set.setDeletedAt(Instant.now());
       repository.save(set);
       // Hard delete sau 30 days qua scheduler
   }
   ```

2. **Visibility queries:**
   ```java
   // Repository
   @Query("SELECT s FROM GroupQuizSet s WHERE s.group.id = :groupId " +
          "AND s.publishStatus = 'PUBLISHED' " +
          "ORDER BY s.playCount DESC, s.publishedAt DESC")
   List<GroupQuizSet> findPublishedByGroup(@Param("groupId") String groupId);

   @Query("SELECT s FROM GroupQuizSet s WHERE s.group.id = :groupId " +
          "AND s.createdBy.id = :userId " +
          "AND s.publishStatus = 'DRAFT'")
   List<GroupQuizSet> findMyDrafts(@Param("groupId") String groupId, @Param("userId") String userId);
   ```

3. **Visibility rules in GET endpoints:**
   - MEMBER: chỉ thấy PUBLISHED + ARCHIVED
   - LEADER/MOD + creator: thấy DRAFT của họ + PUBLISHED + ARCHIVED
   - SOFT_DELETED: hidden từ tất cả non-admin

4. **API endpoints (Q-5 owns these — KHÔNG có ở Q-2a/Q-2b):**
   ```
   PATCH /api/groups/{id}/quiz-sets/{setId}/publish    — DRAFT → PUBLISHED
   PATCH /api/groups/{id}/quiz-sets/{setId}/archive    — PUBLISHED → ARCHIVED
   PATCH /api/groups/{id}/quiz-sets/{setId}/unarchive  — ARCHIVED → PUBLISHED
   POST  /api/groups/{id}/quiz-sets/{setId}/clone      — duplicate as DRAFT
   DELETE /api/groups/{id}/quiz-sets/{setId}            — soft delete (override existing)
   ```

5. **Auto-derive logic (Q-0 finding #4 — Question.Difficulty lowercase, GroupQuizSet enum riêng UPPERCASE):**

   `Question.Difficulty` (lowercase: `easy/medium/hard`, no MIXED) **giữ nguyên**. GroupQuizSet `Difficulty` enum riêng (`EASY/MEDIUM/HARD/MIXED`). Helper `mapFromQuestion()` aggregate counts → derive bucket:

   ```java
   private GroupQuizSet.Difficulty computeDifficulty(GroupQuizSet set) {
       List<Question> qs = questionRepo.findAllById(set.getQuestionIds().stream().map(Object::toString).toList());
       if (qs.isEmpty()) return GroupQuizSet.Difficulty.MEDIUM;

       Map<Question.Difficulty, Long> counts = qs.stream()
           .filter(q -> q.getDifficulty() != null)
           .collect(Collectors.groupingBy(Question::getDifficulty, Collectors.counting()));
       long total = qs.size();
       long easy = counts.getOrDefault(Question.Difficulty.easy, 0L);
       long medium = counts.getOrDefault(Question.Difficulty.medium, 0L);
       long hard = counts.getOrDefault(Question.Difficulty.hard, 0L);

       if (easy * 100 / total >= 80) return GroupQuizSet.Difficulty.EASY;
       if (hard * 100 / total >= 80) return GroupQuizSet.Difficulty.HARD;
       if (medium * 100 / total >= 80) return GroupQuizSet.Difficulty.MEDIUM;
       // Multiple buckets → MIXED
       int present = (easy > 0 ? 1 : 0) + (medium > 0 ? 1 : 0) + (hard > 0 ? 1 : 0);
       return present >= 2 ? GroupQuizSet.Difficulty.MIXED : GroupQuizSet.Difficulty.MEDIUM;
   }
   ```

   - `estimatedDurationMin = Math.max(1, totalQuestions * 30 / 60)` (default avgTime=30s, min 1 phút)
   - `playCount += 1` async khi room ENDED + `last_played_at = now()`

5. **`QuizSetCleanupScheduler` (NEW class, separate từ RoomCleanup):**
   - File: `apps/api/src/main/java/com/biblequiz/modules/group/scheduler/QuizSetCleanupScheduler.java`
   - **Tách riêng** với `RoomCleanupScheduler` vì:
     - Quiz set lifecycle: 30 days SOFT_DELETED → hard delete
     - Room lifecycle: 24h ENDED → purge
     - Scope khác hoàn toàn → tránh coupling
   - Pattern: follow Q-0 Check 5 result (cron format hiện dùng trong project)
   ```java
   @Component
   @RequiredArgsConstructor
   @Slf4j
   public class QuizSetCleanupScheduler {
       private final GroupQuizSetRepository repository;
       
       @Scheduled(cron = "0 0 2 * * *") // 2am daily
       @Transactional
       public void purgeSoftDeletedQuizSets() {
           Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
           int deleted = repository.hardDeleteSoftDeletedBefore(cutoff);
           if (deleted > 0) {
               log.info("Hard-deleted {} quiz sets older than 30 days", deleted);
           }
       }
   }
   ```
   Repository method:
   ```java
   @Modifying 
   @Query("DELETE FROM GroupQuizSet s WHERE s.publishStatus = 'SOFT_DELETED' AND s.deletedAt < :cutoff")
   int hardDeleteSoftDeletedBefore(Instant cutoff);
   ```

6. **Tests:**
   - publishQuizSet DRAFT → PUBLISHED success
   - publishQuizSet với <5 câu → BadRequest
   - archiveQuizSet với scheduled quiz active → BadRequest
   - softDeleteQuizSet → status=SOFT_DELETED, hidden từ MEMBER queries

**Test:**
- Backend tests pass
- Manual: tạo DRAFT, publish → status changed; member khác không thấy DRAFT của bạn
- Manual: archive quiz set, member vẫn thấy nhưng read-only

**Commit:** `feat(quiz-set): workflow status DRAFT/PUBLISHED/ARCHIVED/SOFT_DELETED`

---

## Task Q-6 — Frontend: Create / Edit form 🟠

**Goal:** Form tạo/sửa quiz set với rich metadata. Match mockup state ③.

**Files:**
- `apps/web/src/pages/group/QuizSetCreate.tsx` (NEW hoặc rewrite existing)
- `apps/web/src/pages/group/QuizSetEdit.tsx` (NEW)
- `apps/web/src/components/group/CoverUpload.tsx` (NEW)
- `apps/web/src/components/group/TagInput.tsx` (NEW)
- `apps/web/src/components/group/ModeSuggestionPicker.tsx` (NEW)
- `apps/web/src/components/group/FolderSelector.tsx` (NEW)
- `apps/web/src/api/types.ts` (extend GroupQuizSet type)

**Steps:**

1. **Form sections** (match mockup state ③):
   - Cover upload (optional, fallback icon emoji picker)
   - Tên (required, 5-100 chars)
   - Mô tả ngắn (optional, max 500 chars)
   - Câu Kinh Thánh chính (optional, vd "Mathiơ 28")
   - Tags (max 5, autocomplete từ predefined list + free-form)
   - Suggested mode (5 options grid 2×2 + "không gợi ý")
   - Folder selector (existing folders + "Tạo mới")
   - Author note (optional, 1000 chars)
   - Câu hỏi list (link sang Question editor — existing flow)

2. **Predefined tags** (i18n):
   ```typescript
   const PREDEFINED_TAGS_VI = [
     { id: 'easter', label: '🌸 Phục Sinh', color: '#e8a832' },
     { id: 'christmas', label: '🎄 Giáng Sinh', color: '#ef4444' },
     { id: 'gospel', label: '📖 Phúc Âm', color: '#4ea8de' },
     { id: 'epistle', label: '✉️ Thư tín', color: '#a855f7' },
     { id: 'children', label: '👶 Thiếu nhi', color: '#4ade80' },
     { id: 'youth', label: '🎓 Thanh niên', color: '#06b6d4' },
     { id: 'sermon', label: '⛪ Bài giảng', color: '#a855f7' },
     { id: 'creation', label: '🌍 Sáng tạo', color: '#84cc16' },
     // ... more
   ];
   ```

3. **Cover image — Sprint 5 = ICON PICKER ONLY** (image upload defer Sprint 6 per QS-7):
   - **KHÔNG có endpoint** `/api/uploads/quiz-set-cover` trong Sprint 5
   - Component `<IconPicker>` với 10 emoji options:
   ```typescript
   const ICON_OPTIONS = ['📖', '📜', '✝️', '🕊️', '⛪', '🎈', '🌸', '🎄', '👑', '⚔️'];
   ```
   - Lưu emoji string vào `cover_image_url` field (reuse column, prefix `emoji:` để distinguish): `emoji:📖`
   - Render logic: 
     - Nếu `cover_image_url.startsWith('emoji:')` → render emoji
     - Nếu `cover_image_url` là HTTP URL → render `<img>` (chuẩn bị Sprint 6)
     - Else fallback default emoji 📖

4. **Mode picker** — 4 cards (Speed/Sequential/Team/Battle Royale), highlight selected:
   ```tsx
   <button className={`rounded-xl p-2.5 ${mode === 'GROUP_LIVE_SEQUENTIAL' ? 'border border-emerald-400/40 mode-seq' : 'glass border border-white/10'}`}>
     <span>📚</span>
     <div>
       <div>Sequential</div>
       <div className="text-xs">Lớp học sâu</div>
     </div>
   </button>
   ```

5. **Save flow:**
   - DRAFT save: save với status=DRAFT, không validate strict
   - "Xuất bản" button: validate ≥5 câu, trigger PATCH /publish
   - "Lưu nháp" button: silent save

6. **Tests:**
   - QuizSetCreate validation: tên required, max 5 tags
   - IconPicker selection (10 options, click changes value)
   - Mode picker selection
   - Form submit → API call với correct payload (cover_image_url has `emoji:` prefix)

**Test:**
- Manual full flow: tạo quiz set, fill form, lưu nháp → DB row DRAFT; thêm 5 câu → publish → PUBLISHED
- Manual: edit existing PUBLISHED quiz set → form pre-filled

**Commit:** `feat(quiz-set): create/edit form with rich metadata UI`

---

## Task Q-7 — Frontend: Detail page 🟠

**Goal:** Quiz Set detail page với hero cover, stats, mastery progress, mode picker. Match mockup state ② và ④.

**Files:**
- `apps/web/src/pages/group/QuizSetDetail.tsx` (rewrite)
- `apps/web/src/components/group/MasteryProgress.tsx` (NEW)
- `apps/web/src/components/group/ModePickerModal.tsx` (NEW)
- `apps/web/src/components/group/QuizSetStats.tsx` (NEW)
- `apps/web/src/components/group/RatingDisplay.tsx` (NEW)

**Steps:**

1. **Detail page structure** (match mockup state ②):
   - Hero cover (height 176px) với:
     - Cover image hoặc fallback gradient + emoji
     - Status badge top-left (Đã xuất bản / Bản nháp / etc.)
     - Rating + play count badges top-right
     - Title overlay bottom (font Be Vietnam Pro 800)
   - Tags row (horizontal scroll)
   - Description (markdown rendered)
   - 4-stat grid: Câu hỏi · Độ khó · Thời gian · Đã chơi
   - **Mastery progress card** (chỉ render nếu user logged in + có mastery row):
     ```
     🎯 Tiến độ học của bạn
     [progress bar 80%]
     Đã thuộc 12/15 câu (80%)
     [3 stat cells: Đã ôn, Best, Lần cuối]
     ```
   - Suggested mode hint
   - Action buttons:
     - **CHƠI NGAY · CHỌN MODE** (gold gradient) → opens ModePickerModal
     - 📚 Tự ôn solo (secondary)
     - 📅 Lên lịch (secondary, leader-only)
     - 👑 Leader actions row (Edit / Clone / Delete) — chỉ hiện cho creator/leader

2. **ModePickerModal** (match mockup state ④):
   - 3 sections:
     - 📚 Cá nhân: "Tự ôn solo" (with mastery hint)
     - 👥 Nhiều người chơi: 5 mode cards (Sequential highlighted nếu là suggested)
     - 📅 Sự kiện nhóm: "Lên lịch quiz" (chỉ leader)
   - Mỗi mode card hiển thị:
     - Icon + name
     - 1-line description
     - Disabled nếu mode không phù hợp với quiz set (ví dụ Battle Royale với 3 câu) + tooltip lý do

3. **Validation feedback:**
   ```typescript
   function getModeAvailability(mode: RoomMode, quizSet: QuizSet): { available: boolean; reason?: string } {
     switch (mode) {
       case 'BATTLE_ROYALE':
         return quizSet.totalQuestions >= 4 
           ? { available: true } 
           : { available: false, reason: 'Cần ≥4 câu hỏi' };
       case 'SUDDEN_DEATH':
         return quizSet.totalQuestions >= 10
           ? { available: true }
           : { available: false, reason: 'Cần ≥10 câu hỏi' };
       case 'TEAM_VS_TEAM':
         return (quizSet.totalQuestions >= 6 && quizSet.totalQuestions % 2 === 0)
           ? { available: true }
           : { available: false, reason: 'Cần số câu chẵn ≥6' };
       default:
         return { available: true };
     }
   }
   ```

4. **Click mode → flow:**
   - Solo: navigate `/practice/group-set/{id}` với mode (existing solo practice flow)
   - Multiplayer mode: POST `/api/groups/{id}/live-rooms` với chosen mode → navigate `/room/:roomId/lobby`
   - Schedule: navigate `/group/:id/schedule-quiz` với pre-filled quizSetId

5. **Tests:**
   - Detail page render với mock data
   - ModePickerModal disabled states correct
   - Click solo → correct navigation
   - Mastery card render only khi auth + has mastery

**Test:**
- Manual: vào detail page, thấy hero + mastery (nếu đã practice) + CHỌN MODE button
- Manual: click CHỌN MODE → modal mở với 5 multiplayer modes
- Manual: BR disabled với quiz set 3 câu, có tooltip "Cần ≥4 câu hỏi"

**Commit:** `feat(quiz-set): detail page with stats, mastery, multi-mode picker`

---

## Task Q-8 — Frontend: List page với search/filter/folders 🟡

**Goal:** Quiz Set list page chuyên nghiệp. Match mockup state ①.

**Files:**
- `apps/web/src/pages/group/QuizSetList.tsx` (rewrite)
- `apps/web/src/components/group/QuizSetCard.tsx` (NEW)
- `apps/web/src/components/group/FolderHeader.tsx` (NEW)
- `apps/web/src/components/group/SearchBar.tsx` (NEW hoặc reuse existing)
- `apps/web/src/components/group/FilterChips.tsx` (NEW)

**Steps:**

1. **List page structure** (match mockup state ①):
   - Header: group name + total count + "+" button (create new)
   - Search bar
   - Filter chips: "Tất cả · X" / "Bản nháp · X" / "Đã xuất bản · X" / "Đã lưu trữ · X"
   - Sort dropdown: "Phổ biến nhất" / "Mới nhất" / "A-Z" / "Đánh giá cao"
   - Scrollable list grouped by folder:
     - Folder header (collapsible)
     - Quiz set cards within folder
   - "Bản nháp của bạn" section (separate, only show user's drafts)

2. **QuizSetCard component** — 2 variants:
   - **Featured card** (PUBLISHED + popular): full cover image (h-20), badges overlay, large title
   - **Compact card** (default): 56×56 icon left, title + description + stats right

3. **List query** — backend support:
   ```typescript
   GET /api/groups/{id}/quiz-sets?
     status=PUBLISHED,DRAFT&
     folder=null|123&
     search=query&
     sort=popular|recent|name|rating&
     page=0&size=20
   ```

4. **Folder management:**
   - "Tạo thư mục mới" button
   - Drag-and-drop quiz set vào folder (optional Sprint 5, defer Sprint 6 nếu phức tạp)

5. **Empty states:**
   - Group chưa có quiz set: hero illustration + "Tạo bộ câu hỏi đầu tiên"
   - Search không có kết quả: "Không tìm thấy. Thử từ khóa khác?"
   - Filter "Bản nháp" rỗng: "Không có bản nháp nào"

6. **Bulk actions** (defer Sprint 6 nếu phức tạp): long-press → multi-select → archive nhiều cùng lúc.

7. **Tests:**
   - QuizSetList render với folders + items
   - Search filtering works
   - Status filter chips
   - Sort dropdown changes order

**Test:**
- Manual: 15 quiz sets trong group → render đầy đủ với folders
- Manual: search "Phục sinh" → filter results
- Manual: filter "Bản nháp" → chỉ hiện DRAFT của user

**Commit:** `feat(quiz-set): list page with search, filter, folders, status chips`

---

## Bonus task — SPEC update v1.2 → v1.3 (1 commit)

**Goal:** Update SPEC_GROUP để document Sprint 5 changes.

**Files:**
- `SPEC_GROUP_v1_2.md` → rename `SPEC_GROUP_v1_3.md` (hoặc update in-place với version note)

**Changes:**

1. **§3.3 GroupQuizSet entity** — extend table với 16 fields mới
2. **NEW §3.7 GroupQuizSetMastery entity**
3. **NEW §3.8 GroupQuizSetFolder entity**
4. **§6 Group Quiz Sets — REWRITE:**
   - 6.1 Lifecycle & Workflow (4 statuses)
   - 6.2 Multi-mode play (5 modes)
   - 6.3 Personal Mastery (Q-A safe)
   - 6.4 Content management (folders, search)
5. **§7 Live Rooms** — relax `GROUP_SEQUENTIAL` constraint, mention quizSet.suggestedMode
6. **§9 Scheduled Quizzes** — note có thể chọn mode (Sprint 5)
7. **§10.2 Score sources** — clarify Mastery KHÔNG đóng góp leaderboard
8. **§15.4 Quiz Sets API** — add 4 endpoints mới (publish, archive, unarchive, clone)
9. **§17 Known Issues** — close item về "quiz set chỉ Sequential", thêm BACKLOG về marketplace defer
10. **Changelog v1.2 → v1.3** — log tất cả thay đổi

**Commit:** `docs(spec): SPEC_GROUP v1.3 with Sprint 5 changes (Quiz Set Professional)`

---

## Final regression (sau khi 10 tasks DONE)

1. **Backend tests:** count >= `SPRINT5_BASELINE.txt` BE baseline + 35 (allow ±5 variance)
2. **Frontend tests:** count >= `SPRINT5_BASELINE.txt` FE baseline + 22 (allow ±5 variance)
3. **Pre-existing failures:** KHÔNG được tăng. Nếu task mới làm fail thêm test cũ → block commit, debug ngay.
4. **i18n hardcoded count:** không tăng so với baseline (Q-0 Check 8). Mọi string mới có cả vi.json + en.json entry.
5. **Manual smoke test:**
   - [ ] Tạo quiz set với icon picker (📖) + description + tags + suggestedMode → DRAFT
   - [ ] Add 7 câu hỏi
   - [ ] Publish → status=PUBLISHED, published_at stamped
   - [ ] Member khác login → thấy quiz set trong list (không thấy DRAFT của bạn)
   - [ ] Click detail → thấy hero cover (emoji rendered), stats, "CHƠI NGAY · CHỌN MODE" button
   - [ ] Solo practice 5 câu đúng 4 → mastery row tạo, learned_question_ids = [4 IDs], questions_learned=4
   - [ ] Practice lần 2 đúng tất cả 7 câu → questions_learned=7 (union, không double-count), completed_mastery=true
   - [ ] **Q-A check:** solo practice KHÔNG vào group leaderboard query (verify SQL: `SELECT * FROM user_daily_progress` không có row mới)
   - [ ] Click "CHỌN MODE" → 5 modes hiện trong picker modal
   - [ ] Chọn Battle Royale (quiz có ≥4 câu) → tạo room success
   - [ ] Chọn Battle Royale (quiz 3 câu) → button disabled với tooltip "Cần ≥4 câu hỏi"
   - [ ] List page: search "tuần 18" → filter results, sort by popular DESC
   - [ ] Tạo folder "Bài giảng 2026" → move quiz set vào → list group by folder
   - [ ] Archive quiz set → status=ARCHIVED, member thấy read-only, không tạo room mới được
6. **DB inspection:**
   ```sql
   SELECT publish_status, COUNT(*) FROM group_quiz_sets GROUP BY publish_status;
   SELECT COUNT(*) FROM group_quiz_set_mastery WHERE completed_mastery=true;
   SELECT cover_image_url FROM group_quiz_sets WHERE cover_image_url LIKE 'emoji:%' LIMIT 5;
   ```
7. **Update TODO.md:** Section "Group Sprint 5 [DONE]" với 10 tasks (Q-0 verify + Q-1 đến Q-8 + docs)

---

## Rules cho Claude Code

1. **Verification-first** — đọc code trước khi sửa, đặc biệt Q-0 (verify codebase assumptions)
2. **Separate commits** — 10 tasks = 9 commits + Q-0 verify report (no commit) + 1 docs commit = 10 git events total
3. **Stop sau MỖI commit** — chạy tests, báo cáo:
   - Test count delta vs `SPRINT5_BASELINE.txt`
   - i18n hardcoded delta
   - Confirm Bui trước khi sang task tiếp
4. **Q-A leaderboard rule must NOT break** — Mastery is personal stats only, KHÔNG sum vào UserDailyProgress
5. **Backward compat** — V50 ADD COLUMN only, không drop; existing rows backfill PUBLISHED
6. **Match mockup pixel-perfect** — reference `MOCKUP_QUIZ_SET_V2_PROFESSIONAL.html` (mobile) và `MOCKUP_QUIZ_SET_V2_PROFESSIONAL_DESKTOP.html` (desktop responsive)
7. **i18n complete + guard:** mọi string mới có vi.json + en.json. Sau mỗi FE task, chạy i18n validator + count delta hardcoded strings. KHÔNG tăng so với baseline.
8. **Memory rules** — hardcoded hex colors `#e8a832/#11131e`, Be Vietnam Pro 800/900, no CSS variables (white-bg bug)
9. **Sprint 4 dependency** — Quiz Set live rooms tự động dùng Quản trò mode (`hostPlaysGame=false`)
10. **Nếu Q-0 phát hiện assumption sai** (vd `Question.difficulty` không có) → STOP, báo Bui, KHÔNG tự ý implement

---

## Task ordering (mandatory — KHÔNG skip step)

```
Q-0 (verify, no commit) 
  ↓ [Bui review SPRINT5_PREFLIGHT_REPORT.md, confirm]
Q-1 (3 migrations: V50 metadata, V51 mastery+learned_ids, V52 folder) 
  ↓ commit, stop
Q-2a (entity expand 16 fields + DTO + filter queries)
  ↓ commit, stop
Q-2b (Mastery + Folder entities/repos)
  ↓ commit, stop
Q-3 (multi-mode play with mode validation)
  ↓ commit, stop
Q-4 (mastery service, Q-A safe)
  ↓ commit, stop
Q-5 (4-status workflow + clone + QuizSetCleanupScheduler)
  ↓ commit, stop
Q-6 (FE create form + IconPicker, no upload) [requires mockup open]
  ↓ commit, stop
Q-7 (FE detail page + ModePickerModal) [requires mockup open]
  ↓ commit, stop
Q-8 (FE list page + folders) [requires mockup open]
  ↓ commit, stop
docs (SPEC_GROUP v1.3 update reflect Sprint 5)
  ↓ commit, stop
```

**10 commits + Q-0 verify report.**

---

## Out of scope (Sprint 6 hoặc defer)

- Marketplace / Discovery / Cross-group share (defer v2.5)
- Public/Featured tier (defer v2.5)
- Versioning với parent reference (defer Sprint 6)
- Drag-and-drop folder management (defer Sprint 6)
- Bulk multi-select actions (defer Sprint 6)
- Import/Export JSON/CSV (defer Sprint 6)
- Unified "Group Quiz Event" concept (defer Sprint 6)
- Rating/review feedback từ players (defer Sprint 6)
- **Cover image upload to CDN** (Sprint 5 chỉ icon picker, image upload defer Sprint 6)
- Auto-derive `Difficulty` từ Question.difficulty (defer nếu Q-0 Check 3 KHÔNG có field)

---

## Effort estimate

| Phase | Tasks | Effort |
|---|---|---|
| Verify | Q-0 (no commit) | 0.5 ngày |
| Backend Foundation | Q-1 (migrations) → Q-2a (entity expand) → Q-2b (mastery+folder entities) | 2 ngày |
| Backend Features | Q-3 (multi-mode), Q-4 (mastery service), Q-5 (workflow + scheduler) | 2.5 ngày |
| Frontend | Q-6 (create form), Q-7 (detail page), Q-8 (list page) | 3 ngày |
| Docs | SPEC v1.3 update | 0.5 ngày |
| **Total** | **10 tasks (9 commits + 1 verify report)** | **~8.5 ngày** |

LOC change estimate: ~3000-3500 lines.

---

**Bắt đầu bằng Q-0 (verify, no commit). Output `SPRINT5_PREFLIGHT_REPORT.md` + `SPRINT5_BASELINE.txt`. Stop. Đợi Bui review trước khi Q-1.**

**Nếu Q-0 phát hiện vấn đề blockers (vd migration version conflict, converter missing) → STOP, báo Bui, KHÔNG tự ý workaround.**
