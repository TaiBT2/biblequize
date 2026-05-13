# PROMPT: Fix Leaderboard Page — P0 + P1 Issues

> **Scope:** Fix 5 issues trên `/leaderboard` page (Bảng Xếp Hạng) — bao gồm 2 critical bugs (PII leak + test data leak) và 3 UX issues (podium logic, stats consistency, dynamic copy).
> **Effort estimate:** ~4-5 giờ tổng (5 separate commits).
> **Backend:** Spring Boot 3.3 (Java) | **Frontend:** React 18 + TypeScript + Tailwind | **DB:** MySQL + Flyway

---

## ⚠️ Verification-First Protocol

Trước khi viết code, BẮT BUỘC:

1. **Grep để confirm tên file/entity thực tế:**
   ```bash
   # Find leaderboard page
   find apps/web/src -name "Leaderboard.tsx" -o -name "Leaderboard.test.tsx"

   # Find leaderboard backend
   find apps/api/src/main/java -name "LeaderboardController.java" -o -name "LeaderboardService.java"

   # Find season seeder
   find apps/api/src/main/java -name "SeasonSeeder.java"

   # Find user DTO that returns displayName for leaderboard
   grep -rn "displayName" apps/api/src/main/java/com/biblequiz/modules/leaderboard 2>/dev/null
   grep -rn "LeaderboardEntry\|LeaderboardDto" apps/api/src/main/java 2>/dev/null
   ```

2. **Read actual code TRƯỚC khi propose fix.** Đừng assume schema, field names, hoặc component structure.

3. **Stop sau mỗi commit** để Bui review trước khi tiếp Task tiếp theo.

---

## 📋 Task Overview

| # | Task | Priority | Effort | Files (estimated) |
|---|------|----------|--------|-------------------|
| 1 | Fix user ID leak ở podium #3 (PII) | **P0** | 30m | `LeaderboardService.java`, `UserDto`/`LeaderboardEntryDto` |
| 2 | Fix Season name leaked test string | **P0** | 1h | `SeasonSeeder.java`, validation, possibly migration |
| 3 | Fix podium logic khi < 3 user có điểm > 0 | P1 | 2h | `Leaderboard.tsx` |
| 4 | Stats consistency podium vs list | P1 | 30m | `Leaderboard.tsx` |
| 5 | Dynamic sidebar copy theo tab | P1 | 15m | `Leaderboard.tsx` |

**Each task = separate commit** với message theo Conventional Commits.

---

## Task 1: Fix Display Name PII Leak (P0)

### Problem
Production screenshot: podium rank #3 hiển thị `1122158166400060568045` — đây là raw Google `sub` ID hoặc internal user ID rò rỉ ra UI. Ngoài việc xấu, đây cũng là **PII leak**.

### Root cause hypothesis
User được tạo qua Google OAuth nhưng `displayName` field rỗng/null → backend fallback về user ID làm display name.

### Steps

1. **Grep nơi displayName được populate:**
   ```bash
   # Find where displayName is set during OAuth flow
   grep -rn "displayName" apps/api/src/main/java/com/biblequiz/modules/auth 2>/dev/null
   grep -rn "setDisplayName\|displayName =" apps/api/src/main/java 2>/dev/null
   ```

2. **Find leaderboard DTO mapping:**
   ```bash
   grep -rn "LeaderboardEntry\|toLeaderboardDto" apps/api/src/main/java 2>/dev/null
   ```

3. **Implement fallback chain trong DTO mapper (backend):**
   ```java
   // Pseudo-code — adapt to actual class names
   public static String resolveDisplayName(User user) {
       if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
           return user.getDisplayName();
       }
       if (user.getEmail() != null && user.getEmail().contains("@")) {
           // Use email prefix (capitalize first letter)
           String prefix = user.getEmail().substring(0, user.getEmail().indexOf("@"));
           return capitalize(prefix);
       }
       // Last resort: anonymous ID with last 6 chars (NOT full ID)
       String idStr = String.valueOf(user.getId());
       String suffix = idStr.length() > 6 ? idStr.substring(idStr.length() - 6) : idStr;
       return "Người dùng #" + suffix;
   }
   ```

4. **Apply fallback ở chỗ build LeaderboardEntry** (NOT chỉ ở Leaderboard — cũng affect Profile, Groups members list, etc.). Ưu tiên fix tại helper method có thể reuse.

5. **Backfill existing data (optional, không bắt buộc):**
   - Có thể tạo Flyway migration update `display_name` cho users hiện tại đang có displayName null/empty/numeric. NHƯNG đây là dev DB, không cần migration nếu seeder regenerate.
   - **Quyết định:** Skip migration. Fix ở DTO layer là đủ.

6. **Tests:**
   - Unit test `LeaderboardServiceTest`: user có `displayName=null` → fallback về email prefix
   - Unit test: user có `displayName=null, email=null` → fallback về `Người dùng #xxxxxx`
   - Unit test: user có `displayName=""` (empty string) → cũng fallback (không treat empty là valid)

7. **Verify trên FE:** Không cần thay đổi FE code (FE chỉ render `entry.displayName`). Chỉ verify display sau khi backend fix.

8. **Commit:**
   ```
   fix(leaderboard): prevent raw user ID leak in displayName fallback (P0)

   - Add resolveDisplayName helper with chain: displayName → email prefix → "Người dùng #suffix"
   - Apply to leaderboard, podium, and all places returning UserDto
   - Add 3 unit tests for fallback chain
   ```

---

## Task 2: Fix Season Name Leaked Test String (P0)

### Problem
Test data string `Season E2E Test 1776471648641` đang hiển thị ở:
- Sidebar "MÙA HIỆN TẠI"
- Card description: "top 3 mỗi tier sẽ nhận badge Vinh Quang **Season E2E Test 1776471648641**"

### Root cause
`SeasonSeeder.java` đang tạo seasons với name pattern `"Season E2E Test " + System.currentTimeMillis()` — leak ra dev DB và hiển thị production-like.

### Steps

1. **View seeder:**
   ```bash
   cat apps/api/src/main/java/com/biblequiz/infrastructure/seed/SeasonSeeder.java
   ```

2. **Replace test names với canonical liturgical names** (theo memory: 4 mùa Phục Sinh / Ngũ Tuần / Cảm Tạ / Giáng Sinh):
   ```java
   // SeasonSeeder.java — replace generated names
   private static final List<String> SEASON_NAMES = List.of(
       "Mùa Phục Sinh 2026",      // T2-T4
       "Mùa Ngũ Tuần 2026",        // T5-T7
       "Mùa Cảm Tạ 2026",          // T8-T10
       "Mùa Giáng Sinh 2026"       // T11-T1
   );

   // Active season = season tương ứng với current month
   // Past season = season trước đó (đã ended)
   ```

3. **Add validation tại `SeasonService.create()`:**
   ```java
   public Season create(CreateSeasonRequest req) {
       String name = req.getName();
       if (name == null || name.isBlank()) {
           throw new ValidationException("Season name không được để trống");
       }
       if (name.length() > 50) {
           throw new ValidationException("Season name tối đa 50 ký tự");
       }
       // Block test strings in production (use Spring Profile check)
       if (isProductionProfile() && (name.toLowerCase().contains("test") || name.toLowerCase().contains("e2e"))) {
           throw new ValidationException("Season name không được chứa từ 'test' hoặc 'e2e' trong production");
       }
       // ... rest of creation logic
   }
   ```

4. **Cleanup existing dev data:**
   - Tạo Flyway migration `V28__cleanup_test_season_names.sql` (hoặc next version):
     ```sql
     -- Cleanup any seasons with test-like names from dev DB
     UPDATE season
     SET name = CASE
         WHEN MONTH(start_date) BETWEEN 2 AND 4 THEN CONCAT('Mùa Phục Sinh ', YEAR(start_date))
         WHEN MONTH(start_date) BETWEEN 5 AND 7 THEN CONCAT('Mùa Ngũ Tuần ', YEAR(start_date))
         WHEN MONTH(start_date) BETWEEN 8 AND 10 THEN CONCAT('Mùa Cảm Tạ ', YEAR(start_date))
         ELSE CONCAT('Mùa Giáng Sinh ', YEAR(start_date))
     END
     WHERE name LIKE '%Test%' OR name LIKE '%E2E%' OR name REGEXP '[0-9]{10,}';
     ```
   - **Verify:** Run `mvn flyway:info` trước để get next migration version, đừng hardcode `V28`.

5. **Update `Vinh Quang ${seasonName}` badge label format:**
   - Grep nơi badge label được render:
     ```bash
     grep -rn "Vinh Quang" apps/web/src apps/api/src/main/java 2>/dev/null
     ```
   - Đảm bảo seasonName clean ("Mùa Phục Sinh 2026") → "Vinh Quang Mùa Phục Sinh 2026" — OK
   - Hoặc rút gọn: "Vinh Quang Mùa 1 🏆" theo SPEC_USER_v3 §3.3 — cần Bui chốt format.
   - **Quyết định mặc định:** Giữ format `Vinh Quang ${seasonName}` nhưng đảm bảo seasonName không có "Test"/"E2E"/timestamp.

6. **Tests:**
   - Unit test `SeasonServiceTest`: create với name = "Test Season 123" trong production profile → throw ValidationException
   - Unit test: create với name >50 chars → throw
   - Unit test: create với valid name → succeed

7. **Commit:**
   ```
   fix(seasons): replace test season names + add production validation (P0)

   - SeasonSeeder uses canonical liturgical names (Mùa Phục Sinh/Ngũ Tuần/Cảm Tạ/Giáng Sinh)
   - SeasonService.create rejects "test"/"e2e" in production + max 50 chars
   - Migration V{N}: cleanup existing test-named seasons in dev DB
   - 3 new unit tests
   ```

---

## Task 3: Fix Podium Logic When < 3 Users Have Points > 0 (P1)

### Problem
Hiện tại: TAI THANH (338đ) #1, Test Tier 3 (200đ) #2, user #3 chỉ có **0 điểm**. Đẩy user 0-điểm lên podium làm giảm prestige.

### Decision
**Render podium dynamic theo số user có điểm > 0:**
- ≥ 3 users có điểm > 0 → render full podium 3 slots
- 2 users có điểm > 0 → render 2 slots, slot #3 hiện placeholder "🏆 Vị trí đang trống"
- 1 user có điểm > 0 → render 1 slot ở giữa, 2 slots placeholder
- 0 users → hide podium hoàn toàn, show empty state "Chưa ai có điểm tuần này — Hãy là người đầu tiên!"

### Steps

1. **View Leaderboard component:**
   ```bash
   cat apps/web/src/pages/Leaderboard.tsx | head -100
   ```

2. **Identify podium render logic** (likely có array `top3 = entries.slice(0, 3)` và map ra 3 slots).

3. **Refactor:**
   ```tsx
   // Filter only entries with score > 0
   const scoredEntries = entries.filter(e => e.score > 0);
   const podiumEntries = scoredEntries.slice(0, 3);

   // Render 3 slots, padding với placeholder nếu thiếu
   const podiumSlots = [0, 1, 2].map(i => podiumEntries[i] ?? null);

   // Render
   <div className="podium-row">
     {/* Slot 2 (left) */}
     <PodiumSlot rank={2} entry={podiumSlots[1]} />
     {/* Slot 1 (center, larger) */}
     <PodiumSlot rank={1} entry={podiumSlots[0]} />
     {/* Slot 3 (right) */}
     <PodiumSlot rank={3} entry={podiumSlots[2]} />
   </div>

   // PodiumSlot component
   function PodiumSlot({ rank, entry }: { rank: number; entry: LeaderboardEntry | null }) {
     if (!entry) {
       return (
         <div className="podium-slot-empty">
           <div className="trophy-icon">🏆</div>
           <p className="text-text-muted">Vị trí đang trống</p>
         </div>
       );
     }
     return <ActualPodiumCard rank={rank} entry={entry} />;
   }
   ```

4. **Empty state khi 0 users có điểm:**
   ```tsx
   if (scoredEntries.length === 0) {
     return (
       <div className="empty-leaderboard">
         <p className="text-2xl">🏆</p>
         <p>Chưa ai có điểm tuần này</p>
         <p>Hãy là người đầu tiên ghi điểm!</p>
         <Link to="/ranked">Bắt đầu chơi →</Link>
       </div>
     );
   }
   ```

5. **Vẫn render full list bên dưới podium** (kể cả users 0 điểm) — họ vẫn muốn thấy mình trong list.

6. **Tests** (`Leaderboard.test.tsx`):
   - Render với 3 entries có điểm > 0 → full podium 3 slots
   - Render với 2 entries có điểm > 0 → 2 slots + 1 placeholder
   - Render với 1 entry có điểm > 0 → 1 slot center + 2 placeholders
   - Render với 0 entries có điểm > 0 → empty state, no podium

7. **Commit:**
   ```
   feat(leaderboard): podium shows placeholders when <3 users scored (P1)

   - Filter podium to entries.score > 0
   - Render placeholder slots ("Vị trí đang trống") for missing positions
   - Empty state when no users scored
   - 4 new tests
   ```

---

## Task 4: Stats Consistency Podium vs List (P1)

### Problem
- Podium: `338 điểm · 52 câu` (có cả 2)
- Rank 4-5: chỉ `0 ĐIỂM` (thiếu số câu)

### Decision
**Áp dụng format podium cho cả list:** `{score} điểm · {questionsAnswered} câu`. Số câu là social proof tốt — encourage activity volume, không chỉ raw score.

### Steps

1. **Confirm field name:**
   ```bash
   grep -n "questionsAnswered\|totalQuestions" apps/web/src/pages/Leaderboard.tsx
   ```

2. **Update list row render:**
   ```tsx
   // Before: <span className="text-2xl">{entry.score} ĐIỂM</span>
   // After:
   <div className="text-right">
     <div className="text-2xl text-gold">{entry.score} <span className="text-sm">ĐIỂM</span></div>
     <div className="text-xs text-text-muted">{entry.questionsAnswered ?? 0} câu</div>
   </div>
   ```

3. **Confirm backend trả `questionsAnswered`** trong list entries (không chỉ podium):
   - Grep `LeaderboardEntryDto` xem field có sẵn không
   - Nếu chưa có → add vào DTO + service mapping

4. **Tests:**
   - Update test Leaderboard.test.tsx: assert list rows render `questionsAnswered`

5. **Commit:**
   ```
   fix(leaderboard): unify stats format between podium and list (P1)

   - List rows now show "{score} điểm · {questionsAnswered} câu" matching podium
   - Backend DTO confirmed includes questionsAnswered for all entries
   ```

---

## Task 5: Dynamic Sidebar Copy Theo Tab (P1)

### Problem
Tab đang là **HÀNG TUẦN** nhưng sidebar nói "Cập nhật theo bảng **hôm nay**" — copy không match.

### Decision
**Dynamic copy theo selected tab:**
| Tab | Copy |
|-----|------|
| HÀNG TUẦN | "Cập nhật theo bảng tuần này" |
| MÙA | "Cập nhật theo mùa hiện tại" |
| TẤT CẢ | "Xếp hạng mọi thời đại" |

### Steps

1. **Find sidebar "VỊ TRÍ CỦA BẠN" component:**
   ```bash
   grep -n "Cập nhật theo bảng" apps/web/src/pages/Leaderboard.tsx
   ```

2. **Map period → copy:**
   ```tsx
   const periodLabels: Record<LeaderboardPeriod, string> = {
     weekly: 'Cập nhật theo bảng tuần này',
     season: 'Cập nhật theo mùa hiện tại',
     all_time: 'Xếp hạng mọi thời đại',
   };

   // In sidebar
   <p className="text-xs text-text-muted">{periodLabels[selectedPeriod]}</p>
   ```

3. **i18n:** Nếu screen này đã migrate i18n (Phase 2 i18n đã DONE), thêm keys vào `vi.json` + `en.json`:
   ```json
   {
     "leaderboard": {
       "sidebar.position.weekly": "Cập nhật theo bảng tuần này",
       "sidebar.position.season": "Cập nhật theo mùa hiện tại",
       "sidebar.position.allTime": "Xếp hạng mọi thời đại"
     }
   }
   ```
   Kiểm tra existing pattern trước:
   ```bash
   grep -n "useTranslation\|t(" apps/web/src/pages/Leaderboard.tsx | head -5
   ```

4. **Tests:**
   - Switch tab → assert sidebar text changes

5. **Commit:**
   ```
   fix(leaderboard): dynamic sidebar copy matches selected period tab (P1)

   - Map weekly/season/all_time → distinct sidebar caption
   - i18n keys added to vi.json + en.json
   - Test asserts copy updates on tab switch
   ```

---

## ✅ Final Regression (sau Task 5)

```bash
# Frontend
cd apps/web
npx vitest run                    # All FE tests
npx tsc --noEmit                  # Type check

# Backend
cd ../api
./mvnw test                       # All BE tests
```

**Acceptance:**
- FE test count ≥ baseline + 4 new tests (Task 3) + updates (Task 4, 5)
- BE test count ≥ baseline + 6 new tests (Task 1: 3, Task 2: 3)
- 0 TypeScript errors
- 0 test failures (existing flaky tests OK if pre-existing)

---

## 🚫 Out of Scope (defer to next sprint)

Các issues sau KHÔNG fix trong sprint này:
- **CTA cho top user** (P2) — "Khoảng cách với #2" hint → defer
- **Podium visual hierarchy** (P2) — bigger center avatar, gold ring glow → defer
- **Patch SPEC_USER_v3 §3.1 tier names** (P2) — separate prompt
- **Backend Activity Feed API** (deferred trong Phase 1 Home warnings)

---

## 📝 Reporting Back

Sau mỗi commit, report:
- Files changed (paths + LOC delta)
- Test count delta (BE + FE)
- Any unexpected findings (e.g., schema khác giả định, existing helpers reusable)

Sau Task 5 final regression, summary block:
- Total commits: 5
- Total LOC delta
- Total test delta
- Screenshots/repro instructions cho Bui verify trên dev environment

---

*Generated by Claude conversation on 2026-05-10. Bui review trước khi handoff cho Claude Code agent.*
