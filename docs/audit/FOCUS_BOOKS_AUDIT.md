# Focus Books — Current State Audit

**Date:** 2026-05-22
**Auditor:** Claude Code
**Purpose:** Document current focus books in codebase for FMC ministry team review
**Scope:** Read-only, no code changes

---

## Source of truth

### Primary file
**File:** `apps/api/src/main/java/com/biblequiz/infrastructure/seed/SeasonSeeder.java`
**Line range:** 57–65 (`FOCUS_BOOKS_BY_QUARTER` constant)

Exact source:
```java
private static final List<List<String>> FOCUS_BOOKS_BY_QUARTER = List.of(
        // Q1 Phục Sinh — gospels + Acts (resurrection + birth of church)
        List.of("Matthew", "Mark", "Luke", "John", "Acts"),
        // Q2 Ngũ Tuần — Pentecost: Acts + early Pauline epistles (church spread)
        List.of("Acts", "Romans", "1 Corinthians", "Galatians", "Ephesians"),
        // Q3 Cảm Tạ — wisdom/gratitude/praise literature
        List.of("Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon"),
        // Q4 Giáng Sinh — Messianic prophecy + nativity accounts
        List.of("Isaiah", "Matthew", "Luke", "John")
);
```

Applied at `SeasonSeeder.java:97` — `FOCUS_BOOKS_BY_QUARTER.get(quarter - 1)` per season.

### Schema reference
- Table: `seasons`
- Field: `focus_books` — JSON column (`Season.java:38-40`, `@Convert(JsonListConverter)`)
- Migration: `V59__add_season_focus_books.sql:7` — `ADD COLUMN focus_books JSON NULL DEFAULT NULL`
- Format: JSON array of book name strings

### ⚠️ Provenance note
Q1 focus books có rationale từ SPEC_USER_v3.2 §7.1.3 example (gospels + Acts).
**Q2/Q3/Q4 là Claude Code estimate** (2026-05-21 Coverage sprint commit 2) — chưa FMC confirm. Đây chính là lý do audit này tồn tại.

---

## 4 Mùa current focus books

### Q1 — Mùa Phục Sinh (Easter)
**Period:** Q1 calendar (Tháng 1–3) · **Code value:** `season-{year}-q1`
**Focus books (current):** `["Matthew", "Mark", "Luke", "John", "Acts"]`
**Vietnamese names:** Ma-thi-ơ · Mác · Lu-ca · Giăng · Công Vụ
**Source:** `SeasonSeeder.java:59` · **Rationale (code comment):** "gospels + Acts (resurrection + birth of church)"
**Status:** ✅ Có cơ sở từ SPEC §7.1.3 example — FMC vẫn nên review.

### Q2 — Mùa Ngũ Tuần (Pentecost)
**Period:** Q2 calendar (Tháng 4–6) · **Code value:** `season-{year}-q2`
**Focus books (current — Claude Code estimate):** `["Acts", "Romans", "1 Corinthians", "Galatians", "Ephesians"]`
**Vietnamese names:** Công Vụ · Rô-ma · 1 Cô-rinh-tô · Ga-la-ti · Ê-phê-sô
**Source:** `SeasonSeeder.java:61` · **Rationale (code comment):** "Pentecost: Acts + early Pauline epistles (church spread)"
**Status:** ⚠️ ESTIMATE — needs FMC theological confirm.

### Q3 — Mùa Cảm Tạ (Thanksgiving)
**Period:** Q3 calendar (Tháng 7–9) · **Code value:** `season-{year}-q3`
**Focus books (current — Claude Code estimate):** `["Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon"]`
**Vietnamese names:** Thi Thiên · Châm Ngôn · Truyền Đạo · Nhã Ca
**Source:** `SeasonSeeder.java:63` · **Rationale (code comment):** "wisdom/gratitude/praise literature"
**Status:** ⚠️ ESTIMATE — needs FMC confirm. **⚠️ ALSO has a book-code mismatch — see "Cross-check" below.**

### Q4 — Mùa Giáng Sinh (Christmas)
**Period:** Q4 calendar (Tháng 10–12) · **Code value:** `season-{year}-q4`
**Focus books (current — Claude Code estimate):** `["Isaiah", "Matthew", "Luke", "John"]`
**Vietnamese names:** Ê-sai · Ma-thi-ơ · Lu-ca · Giăng
**Source:** `SeasonSeeder.java:65` · **Rationale (code comment):** "Messianic prophecy + nativity accounts"
**Status:** ⚠️ ESTIMATE — needs FMC confirm.

---

## 🔴 Cross-check: Bible book codes vs canonical `books` table

**Canonical source:** `apps/api/src/main/resources/db/migration/R__data.sql:6-71` (66 books) — mirrored in `V1__init.sql:179+`.

| Focus book (in SeasonSeeder) | `books` table name | Match? |
|---|---|---|
| Matthew | `book-040` Matthew (R__data.sql:47) | ✅ |
| Mark | `book-041` Mark (:48) | ✅ |
| Luke | `book-042` Luke (:49) | ✅ |
| John | `book-043` John (:50) | ✅ |
| Acts | `book-044` Acts (:51) | ✅ |
| Romans | `book-045` Romans (:52) | ✅ |
| 1 Corinthians | `book-046` 1 Corinthians (:53) | ✅ |
| Galatians | `book-048` Galatians (:55) | ✅ |
| Ephesians | `book-049` Ephesians (:56) | ✅ |
| Psalms | `book-019` Psalms (:24) | ✅ |
| Proverbs | `book-020` Proverbs (:25) | ✅ |
| Ecclesiastes | `book-021` Ecclesiastes (:26) | ✅ |
| Isaiah | `book-023` Isaiah (:28) | ✅ |
| **Song of Solomon** | **`book-022` "Song of Songs"** (R__data.sql:27) | ❌ **MISMATCH** |

### 🔴 Critical mismatch — "Song of Solomon" vs "Song of Songs"

A 3-way naming inconsistency exists in the codebase for the same Bible book:

| Location | Name used | file:line |
|---|---|---|
| `books` table seed | **"Song of Songs"** | `R__data.sql:27`, `V1__init.sql:200` |
| SeasonSeeder Q3 focus | **"Song of Solomon"** | `SeasonSeeder.java:63` |
| `BibleStructure.java` canonical map | **"Song of Solomon"** | `BibleStructure.java:41` |
| `BookProgressionService` order list | **"Song of Songs"** | `BookProgressionService.java:17` |
| Question seed `songofsolomon_quiz.json` | questions tagged **"Song of Solomon"** | seed file |
| Question seed `songofsolomon_quiz_en.json` | mixes **both** "Song of Solomon" AND "Song of Songs" | seed file |

**Practical impact:**
- The Vietnamese question pool (`songofsolomon_quiz.json`) tags its questions `"Song of Solomon"` → matches SeasonSeeder Q3 focus → ×1.5 bonus + coverage tick **would fire correctly for VI**.
- BUT the `books` table / Journey Map / `BookProgressionService` call it `"Song of Songs"` → cross-feature inconsistency.
- `WeeklyPairingService` builds pools from `BibleStructure.getCanonicalBooks()` ("Song of Solomon") — internally consistent with SeasonSeeder, but diverges from `books` table.
- EN question seed mixing both names is a latent data-quality bug.

**This is pre-existing tech debt, NOT introduced by the Coverage sprint** — but it directly affects Q3 focus-book correctness and should be resolved before launch (single canonical name across all 6 locations).

---

## Cross-check: LiturgicalSeasonService usage

**File:** `apps/api/src/main/java/com/biblequiz/modules/season/service/LiturgicalSeasonService.java`

- `getFocusBooks(String seasonId)` — line 50–53. Reads `Season.getFocusBooks()`, empty list if not found.
- `isInSeasonFocus(LocalDate date, String book)` — line 61–66. Resolves current season → checks `focusBooks.contains(book)`.

**Consumers:**
| Caller | file:line | Purpose |
|---|---|---|
| RankedController | `RankedController.java:493` | ×1.5 score bonus — `isInSeasonFocus(today, currentQ.getBook())` |
| WeeklyPairingService | `WeeklyPairingService.java:96` | Climax phase reservation — reads `season.getFocusBooks()` directly |
| SeasonSeeder | `SeasonSeeder.java:102` | Idempotent backfill check |

---

## Cross-check: WeeklyPairing Climax reservation

**File:** `apps/api/src/main/java/com/biblequiz/modules/coverage/service/WeeklyPairingService.java`

Per SPEC §7.3.2, Climax phase (tuần 9–11, 18 books) reserves focus books:
- Line 96: `List<String> focusBooks = season.getFocusBooks();`
- Line 100–102: invariant — `focusBooks.size()` must be ≤ 18.
- Line 111: `buildClimaxPool(focusBooks, allBooks)` — climax pool starts with focus books, then expands with same-testament neighbors by chapter-count.
- Line 136–137: climax 18 books chunked into 3 weeks of 6 (weeks 9/10/11).

→ Focus books ARE wired into Climax reservation. Concrete tuần-9/10/11 pairings are computed deterministically at app startup (not statically listed) — would need a running DB to dump exact rows.

---

## Cross-check: legacy VarietyQuizController seasonal hard-code

**File:** `apps/api/src/main/java/com/biblequiz/api/VarietyQuizController.java:185-211`

`getSeasonalContent()` endpoint has a SEPARATE hard-coded season → books mapping, NOT migrated to LiturgicalSeasonService:
- `CHRISTMAS` (Dec 1–25): `["Matthew", "Luke", "Isaiah"]` (line 205)
- `EASTER` (Mar, or Apr ≤20): `["Matthew", "Mark", "Luke", "John"]` (line 209)
- Else `NORMAL` — no event.

**⚠️ Divergence from SeasonSeeder focus books:**
- Variety CHRISTMAS `[Matthew, Luke, Isaiah]` ≠ SeasonSeeder Q4 `[Isaiah, Matthew, Luke, John]` (Variety lacks John).
- Variety EASTER `[Matthew, Mark, Luke, John]` ≠ SeasonSeeder Q1 `[Matthew, Mark, Luke, John, Acts]` (Variety lacks Acts).
- Date logic also differs (Variety uses month/day windows; Liturgical uses quarter calendar).

This is a separate legacy endpoint (Variety "seasonal content" banner) — independent of Liturgical Coverage ×1.5. FMC should be aware two season→books mappings coexist.

---

## ⚠️ Items flagged for FMC ministry review

### Q2 Mùa Ngũ Tuần — needs theological confirm
**Current (estimate):** Acts, Romans, 1 Corinthians, Galatians, Ephesians
**FMC consideration:** Mùa Ngũ Tuần kỷ niệm Đức Thánh Linh giáng lâm (Acts 2). Acts + early Pauline epistles có phản ánh đúng trọng tâm mùa không, hay tradition Tin Lành VN có narrative khác?

### Q3 Mùa Cảm Tạ — needs theological confirm + book-name fix
**Current (estimate):** Psalms, Proverbs, Ecclesiastes, Song of Solomon
**FMC consideration:** Wisdom/praise literature. Có nên include Deuteronomy (nhớ ân điển) hoặc 1 Chronicles (ca ngợi)? **Đồng thời:** "Song of Solomon" cần thống nhất tên với `books` table ("Song of Songs") — xem mục Critical mismatch.

### Q4 Mùa Giáng Sinh — needs theological confirm
**Current (estimate):** Isaiah, Matthew, Luke, John
**FMC consideration:** Nativity (Matthew 1-2, Luke 1-2, John 1) + Messianic prophecy (Isaiah). Có nên thêm Micah (Mi-chê 5:2 — tiên tri Bết-lê-hem)?

---

## Action items for Bui + FMC ministry team

1. **Review** focus books 4 mùa với đội mục vụ FMC.
2. **Confirm hoặc edit** focus books per mùa.
3. **Resolve "Song of Solomon" vs "Song of Songs"** — chọn 1 tên canonical, sửa đồng bộ ở 6 nơi (books table, SeasonSeeder, BibleStructure, BookProgressionService, 2 question seed files).
4. **Add theological rationale** comment cho mỗi mùa trong SeasonSeeder.java.
5. **Update mechanism** sau khi FMC confirm:
   - Edit `SeasonSeeder.java:57-65` `FOCUS_BOOKS_BY_QUARTER`
   - SeasonSeeder chỉ backfill khi `focus_books` rỗng (`SeasonSeeder.java:102`) → muốn ghi đè rows đã seed phải direct DB: `UPDATE seasons SET focus_books = '[...]' WHERE id LIKE 'season-%-qN'`
   - **Lưu ý:** `SeasonSeeder` có `@Profile("!prod")` → prod KHÔNG auto-seed; prod cần manual SQL.
6. **Validate post-update:** câu thuộc focus book → ×1.5 fire; Climax tuần 9-11 reserve đúng sách.

---

## Open questions for Bui

1. **Book name canonical** — chọn "Song of Solomon" hay "Song of Songs" làm tên chuẩn? (questions VI hiện tag "Song of Solomon"; books table dùng "Song of Songs".)
2. **Variety vs Liturgical** — 2 season→books mapping cùng tồn tại (VarietyQuizController.getSeasonalContent vs SeasonSeeder). Có ý định gộp/deprecate cái nào không?
3. **Q4 date range** — SeasonSeeder dùng quarter calendar (Q4 = Oct-Dec). VarietyQuizController CHRISTMAS chỉ Dec 1-25. Mùa Giáng Sinh chính thức là tháng nào?
4. **Easter floating date** — Easter là ngày di động (lunar). SeasonSeeder Q1 cố định Jan-Mar quarter. Có cần xử lý ngày Phục Sinh thật không, hay quarter-based là đủ?
