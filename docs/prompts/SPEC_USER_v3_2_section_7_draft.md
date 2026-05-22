# SPEC_USER §7 — Question Selection System (draft for v3.2)

> **Status:** DRAFT 2026-05-21 — replaces current §7 "Smart Question Selection" in SPEC_USER_v3.1.md
> **Replaces:** §7 entirety (4-pool priority becomes §7.4 nested). §6 Bible Journey Map LOCKED status removed (see §7.10 cross-ref).
> **Scope:** Canonical truth for **post-P5** Ranked question selection. Practice / Daily Challenge / Multiplayer / Variety modes covered in §7.6 apply matrix.

---

## 7. Question Selection System

### 7.0 Overview — 3-layer architecture

Selection cho mỗi câu hỏi Ranked đi qua **3 lớp độc lập**:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Liturgical Coverage  (§7.1)                        │
│ → Quyết định POOL SÁCH (week's book list)                   │
│ → "Tuần này user đang ở phase nào, sách gì còn chưa cover?" │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Tier Difficulty Distribution  (§7.2)               │
│ → Quyết định TỶ LỆ ĐỘ KHÓ (Easy/Medium/Hard % theo tier)   │
│ → "User Tier 4 → 20% Easy / 50% Medium / 30% Hard"          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Smart History Pools  (§7.4)                        │
│ → Quyết định CÂU CỤ THỂ (chưa thấy / SRS / lâu chưa thấy)   │
│ → "Chọn 60% Pool 1 + 20% Pool 2 + ..."                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  Final: N câu hỏi
```

Apply chỉ cho **Ranked**. Practice = user pick book + difficulty (Layer 1 bypassed). Daily/Multiplayer/Variety = không Layer 2-3 (xem §7.6).

---

### 7.1 Liturgical Coverage System (NEW — primary mechanic)

#### 7.1.1 Mục đích

Đảm bảo user **chơi qua tất cả 66 sách Kinh Thánh** trong mỗi mùa liturgical (90 ngày). Thay thế cơ chế `currentBook` sequential Genesis → Revelation (deprecated, xem §7.10).

#### 7.1.2 Season structure

Mỗi mùa = **13 tuần × 7 ngày = 91 ngày** (xấp xỉ 90 thực tế, allow tolerance).

| Phase | Tuần | Số sách | Mục tiêu |
|---|---|---|---|
| **Foundation** | 1–4 | 24 sách (6/tuần × 4 tuần) | Khởi đầu, sách lớn + nhỏ pair đều |
| **Acceleration** | 5–8 | 24 sách (6/tuần × 4 tuần) | Đào sâu, kết hợp Cựu Ước + Tân Ước |
| **Climax** | 9–11 | 18 sách (6/tuần × 3 tuần) | Focus books của mùa (×1.5 bonus fire mạnh nhất) |
| **Mastery Week** | 12–13 | 0 sách mới | Catchup + Toàn Thư badge ceremony |

Tổng: 24 + 24 + 18 = **66 sách** cover trong tuần 1–11. Tuần 12–13 dành cho catch-up.

#### 7.1.3 Weekly pairing — 6 sách/tuần

Mỗi tuần có **6 sách** được system auto-pair theo thuật toán (§7.3) với constraints:

- Phải có ≥ 1 sách "lớn" (pool ≥ 100 câu) để Tier 6 đủ pool Hard
- Pair Cựu Ước + Tân Ước (theo phase) cho đa dạng
- Trong **Climax phase**, focus books của mùa hiện tại (per §5.6) được reserve

**Ví dụ Mùa Phục Sinh (focus: Matthew, Mark, Luke, John, Acts):**

| Tuần | Phase | Sách | Note |
|---|---|---|---|
| 1 | Foundation | Genesis (50ch) + Áp-đia + 2 Peter + Jude + 2 John + 3 John | Khởi đầu, anchor Genesis |
| 2 | Foundation | Exodus (40ch) + Phi-lê-môn + Mi-chê + Habacúc + Sô-phô-ni + A-ghê | Anchor Exodus |
| ... | ... | ... | ... |
| 9 | Climax | **Matthew** + Hosea + Amos + Joel + Na-hum + Ma-la-chi | Focus + minor prophets |
| 10 | Climax | **Mark** + **Luke** + Lamentations + Ecclesiastes + Song + Ruth | Double focus + Wisdom |
| 11 | Climax | **John** + **Acts** + Daniel + Esther + Ezra + Nehemiah | Focus + Historical |
| 12–13 | Mastery | (no new books) | User catchup sách miss |

→ Concrete pairings cho 4 mùa pre-computed seed-time, lưu DB (xem §7.7).

#### 7.1.4 Coverage tracking per user

Mỗi user có 1 `UserSeasonCoverage` record per (user, season):

```
{
  userId, seasonId,
  currentWeek: 1..13,
  weeksCompleted: [1, 2, 3, ...],          // Tuần đã hoàn thành
  bookCoverage: {                           // Per-book counter
    "Genesis": 12,        // ≥ 4 → covered ✅
    "Áp-đia": 2,          // < 4 → in progress 🌱
    "Habacúc": 0,         // 0 → not started ⚪
    ...
  },
  startedAt, lastActivityAt
}
```

**Coverage threshold per sách:** ≥ **4 câu/sách** chơi trong mùa (KHÔNG yêu cầu đúng, chỉ cần answered).

**Tuần hoàn thành** = tất cả 6 sách của tuần đó đều `bookCoverage ≥ 4`.

#### 7.1.5 Week progression — unlock next week early

**Mặc định:** 1 tuần active tại thời điểm, theo lịch calendar của mùa.

**Unlock early:** Khi user hoàn thành tuần hiện tại (6/6 sách ≥ 4 câu):
- Tuần kế tiếp **unlock ngay lập tức** (không đợi qua đêm)
- User có thể chọn tiếp tục với pool của tuần kế hoặc nghỉ
- UI modal: "🎉 Hoàn thành tuần 3! Bạn có muốn bắt đầu tuần 4 ngay?"

**Giới hạn:** Tối đa **1 tuần ahead** so với lịch calendar. Không cho user rush 5 tuần liên tiếp trong 1 ngày (giữ pacing).

```
Calendar: Tuần 5 đang active (per date)
User completed: 1, 2, 3, 4, 5
User can play: tuần 6 (1 ahead) ✓
User CANNOT play: tuần 7 (2 ahead) ✗ — phải đợi tuần 6 calendar
```

#### 7.1.6 Forgiveness mechanic — skip days

Nếu user **skip nhiều ngày**, tuần đã pass **không bị compound debt**:

```
Tuần 1 (calendar tuần 1-7): user chơi 0 câu → tuần 1 = MISSED, coverage stays 0
Tuần 2 (calendar tuần 8-14): bắt đầu fresh → user chơi tuần 2 bình thường
```

Tuần 1 không quay lại "ám" tuần 2. Goal mùa (66/66) quan trọng hơn goal tuần.

**Cuối mùa:** Sách miss trong tuần 1-11 sẽ tự động được pool vào tuần 12-13 (Mastery Week) — xem §7.1.7.

#### 7.1.7 Mastery Week (tuần 12-13) — catchup phase

Tuần 12-13 không có sách mới. Pool sách = **toàn bộ sách chưa cover của user**.

```
Logic tuần 12-13:
  uncoveredBooks = [b for b in allBooks if user.bookCoverage[b] < 4]
  
  if len(uncoveredBooks) == 0:
    # User đã full coverage → BONUS MODE
    # Pool = toàn bộ 66 sách, smart history active
    badge "Toàn Thư - [Mùa]" awarded (nếu chưa có)
    
  else:
    # Catchup mode
    # Pool = uncoveredBooks
    # Display: "Còn [N] sách chưa cover trong mùa này"
    # Aggressive UI nudges: highlight các sách miss
```

#### 7.1.8 End-of-season badges

Khi mùa kết thúc, award badge dựa trên `bookCoverage` total:

| Tổng sách cover (≥ 4 câu) | Badge | Tên VN |
|---|---|---|
| 66/66 | 👑 Toàn Thư | "Toàn Thư - Mùa [Phục Sinh]" |
| 51-65 | 🌟 Tận Tâm | "Người Tận Tâm - Mùa [X]" |
| 21-50 | 🙏 Hành Hương | "Người Hành Hương - Mùa [X]" |
| 1-20 | (no badge) | — |

Badges accumulate across seasons (collectible). Display trong Profile → Achievements.

#### 7.1.9 Season transition

Khi 1 mùa kết thúc + mùa mới bắt đầu:

1. Award end-of-season badge dựa trên coverage cuối
2. **Reset `UserSeasonCoverage`** cho mùa mới — `bookCoverage = {}`, `currentWeek = 1`, `weeksCompleted = []`
3. User bắt đầu fresh từ tuần 1 mùa mới
4. UI banner "🎊 Bắt đầu Mùa [Ngũ Tuần] 2026!" với 7-day welcome

**Edge case:** User đang chơi giữa session khi mùa transition (00:00 UTC boundary):
- Cho phép finish session hiện tại với pool tuần cuối mùa cũ
- Session next → reset, áp pool tuần 1 mùa mới

---

### 7.2 Tier Difficulty Distribution

> **Source canonical:** `TierDifficultyConfig.java:13-22` (giữ nguyên, không thay đổi).

| Tier | Easy% | Medium% | Hard% | Timer (s) |
|---|---|---|---|---|
| 1 (Tân Tín Hữu) | 70 | 25 | 5 | 30 |
| 2 (Người Tìm Kiếm) | 55 | 35 | 10 | 28 |
| 3 (Môn Đồ) | 35 | 45 | 20 | 25 |
| 4 (Hiền Triết) | 20 | 50 | 30 | 23 |
| 5 (Tiên Tri) | 10 | 40 | 50 | 20 |
| 6 (Sứ Đồ) | 5 | 35 | 60 | 18 |

Áp dụng **TRONG pool sách của tuần** (Layer 1 đã filter sách trước):

```
Pool tuần 5 = [Numbers, Joel, Na-hum, Ma-la-chi, Esther, Lamentations]
Tier 6 user mở Ranked, count = 10:
  → 5% Easy (0-1 câu) — trong Numbers/Esther/etc.
  → 35% Medium (3-4 câu) — trong Numbers/Esther/etc.
  → 60% Hard (5-6 câu) — trong Numbers/Esther/etc.
```

**Tier-aware coverage:** User Tier 1 và Tier 6 cùng "cover" cùng 6 sách, nhưng độ khó câu khác hoàn toàn. Cùng narrative, khác depth.

---

### 7.3 Weekly Pairing Algorithm (auto-compute)

#### 7.3.1 Mục đích

Tự động compute 13 weekly groups × 4 mùa = **52 pairings** mà không cần manual curate. Match Bui's decision Q5 (auto compute + season focus boost).

#### 7.3.2 Algorithm v1 — pseudocode

```python
def compute_pairings_for_season(season: Season) -> List[WeeklyPairing]:
    """
    Returns 13 weekly pairings for 1 season.
    Deterministic: same input → same output.
    """
    all_books = get_66_books_with_metadata()  
    # Each book: { name, testament: OT|NT, chapter_count, total_questions }
    
    focus_books = season.focus_books  # 3-5 books (e.g., Matt/Mark/Luke/John/Acts)
    
    # Step 1: Reserve Climax phase (tuần 9-11) for focus books
    climax_books = list(focus_books)  # Start with focus
    if len(climax_books) < 18:
        # Expand with semantic neighbors (Pauline, Wisdom, Major Prophets)
        climax_books += expand_with_neighbors(focus_books, target=18)
    climax_books = climax_books[:18]
    
    climax_weeks = chunk(climax_books, weeks=3, books_per_week=6)
    
    # Step 2: Remaining books for tuần 1-8
    remaining = [b for b in all_books if b not in climax_books]  # 48 books
    
    # Sort by pool size desc
    remaining.sort(key=lambda b: b.total_questions, reverse=True)
    
    large_books = remaining[:8]   # Top 8 by pool size (anchors)
    small_books = remaining[8:]   # Remaining 40 (satellites)
    
    # Step 3: Distribute - 1 large + 5 small per week
    weeks_1_8 = []
    for i in range(8):
        week = [large_books[i]]
        week.extend(small_books[i*5:(i+1)*5])
        weeks_1_8.append(week)
    
    # Step 4: Order weeks by phase + testament balance
    # Phase 1 (Foundation, tuần 1-4): more OT anchors
    # Phase 2 (Acceleration, tuần 5-8): mix
    weeks_1_8 = balance_testament_per_phase(weeks_1_8)
    
    # Step 5: Final assembly
    pairings = []
    for week_num in range(1, 12):  # 1-11
        if week_num <= 8:
            books = weeks_1_8[week_num - 1]
            phase = 'FOUNDATION' if week_num <= 4 else 'ACCELERATION'
        else:
            books = climax_weeks[week_num - 9]
            phase = 'CLIMAX'
        
        pairings.append(WeeklyPairing(
            season_id=season.id,
            week_number=week_num,
            phase=phase,
            book_codes=[b.name for b in books]
        ))
    
    # Tuần 12-13: Mastery Week (no books — dynamic per user)
    for week_num in [12, 13]:
        pairings.append(WeeklyPairing(
            season_id=season.id,
            week_number=week_num,
            phase='MASTERY',
            book_codes=[]  # Empty — runtime computed per user
        ))
    
    return pairings
```

#### 7.3.3 Caching strategy

Pairings deterministic → compute 1 lần, cache vĩnh viễn.

- **App startup:** Check `weekly_pairings` table, nếu empty → compute cho 4 mùa, insert
- **Admin update season focus:** Recompute affected season's pairings, INSERT ON CONFLICT
- **Runtime:** Read from `weekly_pairings` table (cache trong Redis 1h TTL)

#### 7.3.4 Override capability (admin)

Admin có thể override auto pairing nếu muốn manual curate:

```
PATCH /api/admin/seasons/{id}/pairings
Body: {
  week: 5,
  book_codes: ["Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "Psalms"]
}
```

Override persisted, không bị overwrite bởi re-compute.

---

### 7.4 Smart History Pools (within selected pool)

> **Source canonical:** `SmartQuestionSelector.java:90-154` (giữ nguyên logic, scope thay đổi).

Sau khi Layer 1 chọn pool sách (6 sách tuần) và Layer 2 chọn ratio difficulty, Layer 3 chọn câu cụ thể:

| Pool | % default | Mô tả |
|---|---|---|
| 1 | 60% | Câu CHƯA gặp |
| 2 | 20% | Câu đã sai + quá hạn ôn (SRS) |
| 3 | 15% | Câu đã đúng nhưng > 30 ngày |
| 4 | fallback | Câu đã đúng gần đây |

**Spaced Repetition (unchanged):**

```
Đúng → next_review_at = now + (3, 6, 9, ...) ngày, max 30
Sai  → next_review_at = now + 1 ngày
```

**Scope thay đổi:** Pool 1/2/3/4 query trong `book IN (weekBooks)` thay vì `book = currentBook`.

---

### 7.5 Tier-aware Pool Composition Example

End-to-end ví dụ cho user Tier 4, tuần 3 Mùa Phục Sinh:

```
Layer 1 (Coverage):
  Tuần 3, Foundation phase
  Books: [Leviticus, Joel, Na-hum, Ma-la-chi, Hosea, Amos]
  User progress: Leviticus 12/4 ✅, Joel 3 🌱, Na-hum 0 ⚪, ...
  Active pool = [Joel, Na-hum, Ma-la-chi, Hosea, Amos]  (Leviticus đã ≥ 4)
  
Layer 2 (Tier Distribution):
  Tier 4 → 20% Easy / 50% Medium / 30% Hard
  Limit = 10 câu
  → 2 Easy + 5 Medium + 3 Hard
  
Layer 3 (Smart History):
  Within [Joel, Na-hum, Ma-la-chi, Hosea, Amos]:
    - Easy bucket: 2 câu (1 Pool 1 + 1 Pool 2)
    - Medium bucket: 5 câu (3 Pool 1 + 1 Pool 2 + 1 Pool 3)
    - Hard bucket: 3 câu (2 Pool 1 + 1 Pool 2)
  
Final: 10 câu mixed, shuffled
```

User trả lời 10 câu → bookCoverage tăng → có thể tick thêm 1-2 sách → potentially complete tuần.

---

### 7.6 Apply matrix

| Mode | Layer 1 Coverage | Layer 2 Tier | Layer 3 Smart |
|---|---|---|---|
| **Ranked** | ✅ Primary | ✅ | ✅ |
| Practice | ❌ User pick book | ⚠️ Optional | ✅ |
| Daily Challenge | ❌ Deterministic seed | ❌ Random fair | ❌ |
| Multiplayer (room) | ❌ Cùng câu cho cả room | ❌ | ❌ |
| Mystery Mode | ❌ Random across books | ✅ | ✅ |
| Speed Round | ❌ Easy only | ❌ | ✅ |
| Weekly Themed | ❌ Pre-defined theme | ❌ | ✅ |

Coverage System **ONLY applies to Ranked**. Không leak vào mode khác.

---

### 7.7 Schema additions

#### 7.7.1 New entity: `WeeklyPairing`

```sql
CREATE TABLE weekly_pairings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    season_id BIGINT NOT NULL,
    week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 13),
    phase ENUM('FOUNDATION', 'ACCELERATION', 'CLIMAX', 'MASTERY') NOT NULL,
    book_codes JSON NOT NULL,         -- Array of book name strings
    is_admin_override BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_season_week (season_id, week_number),
    INDEX idx_season (season_id),
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
);
```

Pre-seed: 4 mùa × 13 tuần = **52 rows**.

#### 7.7.2 New entity: `UserSeasonCoverage`

```sql
CREATE TABLE user_season_coverage (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    season_id BIGINT NOT NULL,
    
    current_week INT NOT NULL DEFAULT 1 CHECK (current_week BETWEEN 1 AND 13),
    weeks_completed JSON DEFAULT ('[]'),       -- e.g., [1, 2, 3]
    book_coverage JSON DEFAULT ('{}'),          -- e.g., {"Genesis": 12, "Exodus": 5}
    
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,                -- Set when 66/66 cover
    
    UNIQUE KEY uk_user_season (user_id, season_id),
    INDEX idx_user (user_id),
    INDEX idx_season (season_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
);
```

#### 7.7.3 Deprecated columns in `users` / `user_daily_progress`

Drop sau migration:

```sql
ALTER TABLE users
  DROP COLUMN current_book,
  DROP COLUMN current_book_index,
  DROP COLUMN is_post_cycle;

ALTER TABLE user_daily_progress
  DROP COLUMN current_book,
  DROP COLUMN current_book_index,
  DROP COLUMN is_post_cycle,
  DROP COLUMN current_difficulty;  -- Còn dùng cho legacy mobile, xem §7.9
```

> **⚠️ Migration risk:** drop column irreversible. Implement với feature flag (xem §7.9).

#### 7.7.4 Modify `QuestionFilter` signature

Java DTO change:

```java
// OLD
public class QuestionFilter {
    private String book;        // single book
    private String difficulty;
    private String language;
}

// NEW
public class QuestionFilter {
    private List<String> books;     // 1+ books (Coverage tuần)
    private String difficulty;
    private String language;
}
```

Repository query change:

```java
// OLD
@Query("SELECT q FROM Question q WHERE q.book = :book ...")

// NEW
@Query("SELECT q FROM Question q WHERE q.book IN :books ...")
```

#### 7.7.5 Performance: DTO projection (Phase A quick-win)

> **Source:** Discussion 2026-05-21 dựa trên audit performance.

Selector load LIGHTWEIGHT metadata thay vì full entity:

```java
public record QuestionMeta(
    String id,
    String book,
    String difficulty
) {}

// Repository
@Query("SELECT new com.biblequiz.dto.QuestionMeta(q.id, q.book, q.difficulty) " +
       "FROM Question q WHERE q.language = :lang AND q.book IN :books AND q.status = 'ACTIVE'")
List<QuestionMeta> findMetaByLanguageAndBooks(String lang, List<String> books);
```

Sau khi smart selector pick N IDs → batch fetch full:

```java
// After ID selection
List<String> selectedIds = ...; // N IDs
List<Question> fullQuestions = questionRepository.findAllById(selectedIds);  // 1 batch query
```

→ Memory ↓ ~40x (250KB metadata vs 10MB full entity).

#### 7.7.6 DB index

```sql
CREATE INDEX idx_questions_filter
  ON questions(language, book, difficulty, status)
  WHERE status = 'ACTIVE';
```

---

### 7.8 API Endpoints

#### 7.8.1 GET /api/me/coverage-status (NEW)

Trả về toàn bộ trạng thái coverage cho user hiện tại.

**Request:** authenticated

**Response:**
```json
{
  "season": {
    "id": 1,
    "code": "EASTER",
    "nameVi": "Mùa Phục Sinh",
    "nameEn": "Easter Season",
    "startDate": "2026-02-01",
    "endDate": "2026-04-30",
    "daysRemaining": 47
  },
  "currentWeek": {
    "weekNumber": 3,
    "phase": "FOUNDATION",
    "books": [
      { "code": "Leviticus", "nameVi": "Lê-vi-ký", "covered": true, "answeredCount": 12 },
      { "code": "Joel", "nameVi": "Giô-ên", "covered": false, "answeredCount": 3 },
      { "code": "Nahum", "nameVi": "Na-hum", "covered": false, "answeredCount": 0 },
      { "code": "Malachi", "nameVi": "Ma-la-chi", "covered": false, "answeredCount": 0 },
      { "code": "Hosea", "nameVi": "Hô-sê-a", "covered": false, "answeredCount": 0 },
      { "code": "Amos", "nameVi": "A-mốt", "covered": false, "answeredCount": 0 }
    ],
    "completed": false,           // 6/6 books covered?
    "canUnlockNext": false        // Can advance to week 4?
  },
  "seasonProgress": {
    "totalCovered": 13,           // out of 66
    "weeksCompleted": [1, 2],
    "currentBadgePreview": "Người Hành Hương"  // What user would get if season ended now
  }
}
```

#### 7.8.2 POST /api/ranked/questions/select (MODIFIED)

**Request body CHANGED:**

```json
{
  "limit": 10,
  "language": "vi",
  "difficulty": null,
  "excludeIds": []
  // NO MORE `book` field — BE knows from coverage state
}
```

**Response:** Unchanged structure (`{ questions: [...] }`).

**Internal flow:**
1. Resolve user → tier
2. Resolve current season + week from `UserSeasonCoverage`
3. Get week's book pool from `WeeklyPairing`
4. Filter to non-covered books (or all if mastery week)
5. Apply Layer 2 + 3
6. Return N câu

#### 7.8.3 POST /api/ranked/coverage/unlock-next-week (NEW)

User trigger unlock tuần kế tiếp khi đã complete tuần hiện tại.

**Request:** authenticated, no body
**Response:**
```json
{
  "success": true,
  "newWeek": 4,
  "newBooks": [...]
}
```

**Error cases:**
- 400 `WEEK_NOT_COMPLETED` — chưa hoàn thành tuần hiện tại
- 400 `ALREADY_AHEAD_LIMIT` — đã ở 1 tuần ahead, không thể unlock thêm
- 404 `NO_NEXT_WEEK` — đang ở tuần 13 (Mastery Week, cuối mùa)

#### 7.8.4 Modified endpoints

| Endpoint | Change |
|---|---|
| `GET /api/me/ranked-status` | Drop `currentBook`, `currentBookIndex`, `isPostCycle`. Add `coverageStatus` (subset of 7.8.1 response) |
| `POST /api/ranked/sessions/{id}/answer` | Update `UserSeasonCoverage.bookCoverage[book]++` instead of `UserDailyProgress.currentBook` advance |

---

### 7.9 Migration strategy

#### 7.9.1 Phase 0: Feature flag

Add `feature_flags.liturgical_coverage_enabled` (boolean, default `false`).

```java
@Service
public class FeatureFlagService {
    public boolean isLiturgicalCoverageEnabled(String userId) {
        // Phase 1: All users false (default)
        // Phase 2: Internal admin true (testing)
        // Phase 3: 10% rollout
        // Phase 4: 100%
        // Phase 5: Remove flag
    }
}
```

#### 7.9.2 Phase 1: Backward compat (1-2 weeks)

- Both code paths coexist
- Feature flag OFF: old `currentBook` logic
- Feature flag ON: new Coverage logic
- Mobile chưa migrate → vẫn dùng old path
- Web pilot: 10% users opt-in via Settings → "Try new Ranked"

#### 7.9.3 Phase 2: Internal data migration

```sql
-- Initialize UserSeasonCoverage for all existing users
INSERT INTO user_season_coverage (user_id, season_id, current_week, book_coverage)
SELECT 
    u.id,
    (SELECT id FROM seasons WHERE is_active = TRUE LIMIT 1),
    1,
    '{}'
FROM users u;
```

**Decision:** Reset everyone's coverage = 0/66 for current season (per Bui decision 2026-05-21).

#### 7.9.4 Phase 3: Mobile migration

- Mobile RankedScreen migrate sang `/api/ranked/questions/select` (P0-A from audit)
- Mobile UI hiện coverage card
- Mobile fully on new system

#### 7.9.5 Phase 4: Drop deprecated columns

After 30 days stable:

```sql
ALTER TABLE users DROP COLUMN current_book, ...;
ALTER TABLE user_daily_progress DROP COLUMN current_book, ...;
```

Remove `BookProgressionService.java` (50/60% gate) + dual-gate code in `RankedController:572-585`.

#### 7.9.6 Phase 5: Remove feature flag

After 60 days stable post-migration. Code path becomes default.

---

### 7.10 Cross-references — affected sections

#### 7.10.1 §6 Bible Journey Map — LOCKED removed

**Old §6.2:**
```
Status:
  COMPLETED   : mastery ≥ 80%
  IN_PROGRESS : mastery > 0% hoặc unlocked
  LOCKED      : sách trước chưa COMPLETED  ← REMOVE
```

**New §6.2:**
```
Status:
  COMPLETED   : mastery ≥ 80%
  IN_PROGRESS : mastery > 0%
  NOT_STARTED : mastery = 0
```

`LOCKED` status hoàn toàn gỡ bỏ. User có thể click sách bất kỳ → Practice mode pre-filtered.

#### 7.10.2 §3.6 Early Ranked Unlock — unchanged

Tier 1 user qua Basic Quiz hoặc Early Unlock → vào Ranked → tự động create `UserSeasonCoverage` cho mùa hiện tại.

#### 7.10.3 §5.6 Liturgical Seasons — ×1.5 score wire

Combined với BL-5 (Pentecost + Thanksgiving) + ×1.5 score wire vào `ScoringService`:

```java
// ScoringService.calculateWithTier(...)
boolean isInSeasonBook = liturgicalSeasonService
    .getCurrentSeason(LocalDate.now())
    .getFocusBooks()
    .contains(question.getBook());

if (isInSeasonBook) {
    multiplier *= 1.5;
}
```

Score animation FE: "×1.5 Mùa Phục Sinh!" khi đúng câu thuộc focus book.

---

### 7.11 Edge cases

#### 7.11.1 User chưa có UserSeasonCoverage record

Khi user lần đầu vào Ranked sau khi feature ship:
- Lazy create record với `currentWeek = 1`, `bookCoverage = {}`
- Show onboarding modal "Hành trình mùa Phục Sinh - 66 sách Kinh Thánh trong 13 tuần"

#### 7.11.2 Season transition mid-session

User đang chơi câu hỏi khi 00:00 UTC ngày 1 tháng kế (mùa transition):
- Finish session hiện tại với pool tuần cuối mùa cũ
- Update `UserSeasonCoverage` cho mùa cũ
- Create new `UserSeasonCoverage` cho mùa mới
- Next session → áp pool tuần 1 mùa mới

#### 7.11.3 User unlock tuần kế nhưng chưa play

User complete tuần 3 → unlock tuần 4 → đóng app → 3 ngày sau quay lại:
- `currentWeek` đã = 4 (persisted)
- Calendar đã advance → tuần 4 vẫn match calendar → continue normal

#### 7.11.4 Pool exhaustion within week

Week pool = 6 sách, mỗi sách trung bình 100 câu → ~600 câu/tuần. User Tier 6 cày 100 câu/ngày × 7 = 700 câu/tuần > pool size.

**Behavior:**
1. Pool exhausted with `book IN (weekBooks)` + difficulty + same-day exclusion
2. Fallback 1: Drop same-day exclusion (allow repeat within day)
3. Fallback 2: Drop difficulty filter (mix tier distribution)
4. Fallback 3: Auto-unlock next week early (if not at 1-ahead limit)
5. Fallback 4: Cross-season pool (current + previous season books)

#### 7.11.5 Admin disable season mid-mùa

Admin set `season.is_active = false` cho mùa hiện tại:
- All users' `UserSeasonCoverage` for that season → frozen
- New Ranked sessions blocked với message "Mùa hiện tại đang được bảo trì"
- Resume khi admin re-enable

---

### 7.12 Performance considerations

#### 7.12.1 Caching layers (post-Phase A)

| Cache | Layer | TTL | Invalidation |
|---|---|---|---|
| `WeeklyPairing` | Redis | 1h | Admin override pairing |
| `Season` config | Redis | 24h | Admin update season |
| `UserSeasonCoverage` | Redis hash per user | 5m | Per-answer update |
| `QuestionMeta` per (lang, books, diff) | Redis | 1h | Admin question CRUD event |
| Full Question entity (by ID) | Caffeine (in-process) | 30m | Question update event |

Phase A (Commit 1 of sprint) ships DTO projection + DB index. Phase B (Redis cache) ships sau P5 stable.

#### 7.12.2 Query patterns

**Per Ranked session start (10 câu):**
- 1 query `UserSeasonCoverage` (Redis hit)
- 1 query `WeeklyPairing` (Redis hit)
- 3 queries metadata (Easy + Medium + Hard) — `WHERE book IN (...) AND difficulty = ?`
- 1 query `UserQuestionHistory` (per-user, smart history)
- 1 batch query full Question by IDs (after smart selection)

→ Tổng ~6 DB queries, hầu hết cache hit. Cải thiện so với current 3-4 full-pool fetches.

---

### 7.13 Implementation sequence (10 commits)

Tham chiếu Sprint P5 sequence (chốt 2026-05-21):

1. **PERF — DTO projection + DB index + heap config** (Phase A)
2. **LiturgicalSeasonService + 4 mùa (BL-5)**
3. **WeeklyPairingService + WeeklyPairing entity + auto compute**
4. **LiturgicalCoverageService + UserSeasonCoverage entity**
5. **SmartQuestionSelector refactor (book → List<book>)**
6. **RankedController integration + drop currentBook**
7. **×1.5 mùa wire vào ScoringService**
8. **FE Ranked.tsx redesign + coverage UI**
9. **FE Journey Map update (gỡ LOCKED)**
10. **Migration data existing users + feature flag rollout**

Total effort: ~12 ngày. Detailed PROMPT files per commit follow this SPEC.

---

### 7.14 Open questions for v3.2 finalization

Trước khi merge vào SPEC_USER_v3.2.md:

1. **i18n keys cho 4 phases** — `phase.foundation`, `phase.acceleration`, `phase.climax`, `phase.mastery` — tên VN final?
   - Tôi đề xuất: "Nền Tảng", "Tăng Tốc", "Đỉnh Cao", "Hoàn Thiện"
2. **Badge tier thresholds** — confirm 1-20 / 21-50 / 51-65 / 66 boundaries hợp lý?
3. **Tuần 12-13 (Mastery Week) duration** — 13 hay 14 ngày (= mùa 91 hoặc 92 ngày)?
4. **Admin curation UI** — cần build admin page để override pairing? Hoặc CLI-only cho v1?

---

> **End of SPEC §7 draft.**
> Next steps: HTML mockup → PROMPT files per commit → Claude Code handoff.
