# PROMPT: Implement Scoring History Feature

> **Mục đích:** User xem lịch sử cộng XP để verify scoring đúng.
> **UI surface:**
> - **Section "Lịch Sử XP"** trong Profile page (compact, 5 entries gần nhất, đặt giữa "Phân Tích Chi Tiết" và "Prestige")
> - **Full page riêng** `/profile/xp-history` với pagination đầy đủ (truy cập qua link "Xem tất cả →" trong section)
> **Approach:** Hybrid (Option A++) per `AUDIT_SCORING_HISTORY.md`.
> **Reference mockup:** `MOCKUP_XP_HISTORY.html` — 4 states (active desktop / mobile / empty / partial)
> **Stop after each commit để Bui confirm trước khi tiếp tục.**
> **Verification-first:** grep/read actual code trước khi sửa, không assume từ spec hay audit.

---

## Architecture decisions (LOCKED — do not re-debate)

1. **Bảng mới `xp_event`** (append-only) — KHÔNG đụng `answers` schema.
2. **Per-session aggregate** — 1 row xp_event = 1 phiên Ranked complete (hoặc 1 Daily completion, hoặc 1 Star bonus). Per-question detail accessible qua existing `/sessions/{id}/review` (extend trong commit riêng).
3. **3 LIVE sources:**
   - `RANKED_SESSION` — insert khi quiz_session status chuyển COMPLETED
   - `DAILY_COMPLETION` — insert khi user complete Daily Challenge (≥4/5 correct, +50 XP)
   - `STAR_BONUS` — insert khi `TierProgressService.checkStarBoundary` trả về `StarEvent` (+30 XP/star). **PHẢI wire luôn** vì FE đã có star popup mà điểm chưa cộng → dishonest UX hiện tại.
4. **Buffer breakdown trong `quiz_sessions`** — thêm JSON column `xp_breakdown` để accumulate từng answer trong session, finalize khi session complete.
5. **Ship from now on** — KHÔNG backfill historical data. FE banner: "Lịch sử XP bắt đầu từ ngày tính năng kích hoạt."
6. **Multiplayer/Tournament/Variety modes**: KHÔNG track (intentional, không phải bug). FE note rõ.
7. **Star bonus +30 XP**: PHẢI thực sự cộng vào `UserDailyProgress.points_counted` (hiện tại chỉ trả `StarEvent` rỗng — wire trong cùng commit với insert xp_event).

---

## Verification trước khi bắt đầu (REQUIRED)

Đọc và confirm các file sau khớp với audit findings:

```bash
# 1. RankedController scoring path
grep -n "calculate\|points_counted\|setPointsCounted" apps/api/src/main/java/com/biblequiz/api/RankedController.java | head -30

# 2. ScoringService output structure
grep -n "ScoreResult\|calculate\|basePoints\|speedBonus" apps/api/src/main/java/com/biblequiz/modules/scoring/service/ScoringService.java

# 3. DailyChallengeService +50 site
grep -n "50\|points_counted\|setPointsCounted" apps/api/src/main/java/com/biblequiz/modules/daily/service/DailyChallengeService.java

# 4. TierProgressService star event
grep -n "StarEvent\|checkStarBoundary" apps/api/src/main/java/com/biblequiz/modules/ranked/service/TierProgressService.java

# 5. UserDailyProgress entity
cat apps/api/src/main/java/com/biblequiz/modules/ranked/entity/UserDailyProgress.java

# 6. QuizSession entity (sẽ thêm xp_breakdown column)
grep -n "@Column\|status\|mode" apps/api/src/main/java/com/biblequiz/modules/quiz/entity/QuizSession.java

# 7. Latest Flyway version
ls apps/api/src/main/resources/db/migration/ | sort -V | tail -5

# 8. Existing user history endpoint
grep -n "@GetMapping\|history" apps/api/src/main/java/com/biblequiz/api/UserController.java | head -10

# 9. FE Profile page tabs structure
grep -n "tab\|Tab" apps/web/src/pages/Profile.tsx | head -20
```

Nếu file:line khớp audit → proceed. Nếu không khớp → **STOP, document discrepancy, hỏi Bui** trước khi sửa.

---

## Commit 1 — Migration `V47__create_xp_event.sql` + add xp_breakdown to quiz_sessions

**File:** `apps/api/src/main/resources/db/migration/V47__create_xp_event.sql`

```sql
-- xp_event: append-only ledger for user XP credits (ship-from-now-on, no backfill)
-- 3 sources: RANKED_SESSION, DAILY_COMPLETION, STAR_BONUS

CREATE TABLE xp_event (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  source ENUM('RANKED_SESSION','DAILY_COMPLETION','STAR_BONUS') NOT NULL,
  
  session_id BIGINT NULL,
  
  -- Aggregate breakdown (NULL/0 cho non-session sources như STAR_BONUS)
  base_total INT NOT NULL DEFAULT 0,
  speed_bonus_total INT NOT NULL DEFAULT 0,
  combo_bonus_total INT NOT NULL DEFAULT 0,
  combo_max_reached INT NOT NULL DEFAULT 0,
  tier_multiplier_pct INT NOT NULL DEFAULT 100,
  surge_active BOOLEAN NOT NULL DEFAULT FALSE,
  daily_first_bonus INT NOT NULL DEFAULT 0,
  
  total_earned INT NOT NULL,
  
  metadata JSON NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_xp_event_user_created (user_id, created_at DESC),
  INDEX idx_xp_event_source (source),
  INDEX idx_xp_event_session (session_id),
  
  CONSTRAINT fk_xp_event_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_xp_event_session FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE SET NULL
);

-- Buffer column trên quiz_sessions để accumulate breakdown trong session lifecycle
-- Khi session chuyển COMPLETED → finalize → insert xp_event → có thể clear/giữ field này
ALTER TABLE quiz_sessions
  ADD COLUMN xp_breakdown JSON NULL COMMENT 'Running breakdown aggregate during Ranked session';
```

**Verify migration applies clean:**
```bash
cd apps/api && ./mvnw flyway:info
./mvnw flyway:migrate
./mvnw flyway:info  # confirm V47 applied
```

**Commit:** `feat: V47 create xp_event ledger + xp_breakdown buffer on quiz_sessions`

**STOP — confirm Bui trước khi tiếp tục.**

---

## Commit 2 — XpEvent entity + repository + service skeleton

**Files mới:**
- `apps/api/src/main/java/com/biblequiz/modules/scoring/entity/XpEvent.java`
- `apps/api/src/main/java/com/biblequiz/modules/scoring/entity/XpEventSource.java` (enum)
- `apps/api/src/main/java/com/biblequiz/modules/scoring/repository/XpEventRepository.java`
- `apps/api/src/main/java/com/biblequiz/modules/scoring/service/XpEventService.java`

**XpEvent entity:**
- Map đầy đủ columns từ V47
- `metadata` field dùng `@Type(JsonType.class)` (đã có dependency `hibernate-types-60` chưa? grep `pom.xml`. Nếu chưa, dùng `@Convert(converter = JsonAttributeConverter.class)` pattern đã có trong project)
- Lazy-loaded relationships tránh N+1

**XpEventRepository:**
```java
public interface XpEventRepository extends JpaRepository<XpEvent, Long> {
    
    @Query("""
        SELECT e FROM XpEvent e
        LEFT JOIN FETCH e.session s
        WHERE e.userId = :userId
          AND (:cursor IS NULL OR e.createdAt < :cursor)
        ORDER BY e.createdAt DESC
    """)
    List<XpEvent> findRecentByUser(
        @Param("userId") Long userId,
        @Param("cursor") LocalDateTime cursor,
        Pageable pageable
    );
    
    long countByUserId(Long userId);
    
    @Query("SELECT MIN(e.createdAt) FROM XpEvent e WHERE e.userId = :userId")
    Optional<LocalDateTime> findFirstEventDate(@Param("userId") Long userId);
}
```

**XpEventService:**
```java
@Service
@Transactional
public class XpEventService {
    
    /**
     * Record a Ranked session XP credit.
     * Called from RankedController khi session finalize (status → COMPLETED).
     */
    public XpEvent recordRankedSession(Long userId, QuizSession session, RankedBreakdown breakdown);
    
    /**
     * Record Daily Challenge completion (+50 XP).
     */
    public XpEvent recordDailyCompletion(Long userId, Long sessionId, int correctCount, int totalCount);
    
    /**
     * Record Star Boundary bonus (+30 XP).
     * Caller phải đảm bảo cũng cộng 30 vào UserDailyProgress.points_counted trong cùng @Transactional.
     */
    public XpEvent recordStarBonus(Long userId, int starIndex, String tierName);
    
    /**
     * Pagination cho FE list view.
     * Cursor = createdAt của event cuối page trước.
     */
    public XpHistoryPage getHistory(Long userId, LocalDateTime cursor, int limit);
}
```

**`RankedBreakdown` record (DTO trong scoring module):**
```java
public record RankedBreakdown(
    int baseTotal,
    int speedBonusTotal,
    int comboBonusTotal,
    int comboMaxReached,
    int tierMultiplierPct,
    boolean surgeActive,
    int dailyFirstBonus,
    int totalEarned,
    int correctCount,
    int totalQuestions
) {}
```

**Tests:**
- `XpEventServiceTest.java` — 6 tests:
  1. `recordRankedSession_createsEventWithBreakdown`
  2. `recordDailyCompletion_storesMetadata`
  3. `recordStarBonus_noSessionId`
  4. `getHistory_paginatesByCreatedAt`
  5. `getHistory_emptyForNewUser`
  6. `getHistory_returnsLatestFirst`

**Commit:** `feat: XpEvent entity + service skeleton (no call sites yet)`

**STOP — confirm Bui.**

---

## Commit 3 — Wire RANKED_SESSION (buffer + finalize)

**Files sửa:**
- `apps/api/src/main/java/com/biblequiz/modules/quiz/entity/QuizSession.java` — thêm `xp_breakdown` JSON field + getter/setter
- `apps/api/src/main/java/com/biblequiz/api/RankedController.java` — modify answer endpoint để buffer breakdown + finalize endpoint để insert event
- `apps/api/src/main/java/com/biblequiz/modules/scoring/service/ScoringService.java` — đảm bảo `ScoreResult` expose đầy đủ breakdown (verify hiện đã có)

**Logic:**

Trong RankedController answer endpoint (verify line 251-256, 302):

```java
// SAU khi compute ScoreResult và cộng UDP:
ScoreResult result = scoringService.calculate(...);
udpService.addPoints(userId, result.totalEarned());

// THÊM: accumulate vào quiz_session.xp_breakdown
quizSession.appendXpBreakdown(result);  // helper method updates JSON in-place
quizSessionRepository.save(quizSession);
```

`QuizSession.appendXpBreakdown(ScoreResult result)`:
- Parse `xp_breakdown` JSON (nếu null → init default)
- `baseTotal += result.basePoints`
- `speedBonusTotal += result.speedBonus`
- `comboBonusTotal += result.comboBonus` (= speedBonus × (multiplier - 1) if combo active)
- `comboMaxReached = max(comboMaxReached, result.comboCount)`
- `tierMultiplierPct = result.tierMultiplierPct` (last applied, không cumulative)
- `surgeActive = surgeActive || result.surgeActive`
- `dailyFirstBonus += result.dailyFirstBonus` (chỉ cộng 1 lần per ngày, ScoringService đã handle)
- Serialize lại

Trong session finalize path (tìm `markCompleted()` hoặc tương tự — grep `status\s*=\s*.*COMPLETED`):

```java
// Khi quiz_session chuyển COMPLETED:
RankedBreakdown breakdown = quizSession.toRankedBreakdown();
xpEventService.recordRankedSession(userId, quizSession, breakdown);
```

**Quan trọng:**
- Chỉ insert xp_event nếu `mode = RANKED` — Practice/Variety không insert.
- Idempotent: nếu user gọi finalize 2 lần → không tạo 2 events. Check `xpEventRepository.existsBySessionId(sessionId)` trước insert.
- `ScoringService.ScoreResult` có thể chưa expose đầy đủ breakdown — verify và extend nếu cần.

**Tests:**
- `RankedControllerTest.java` — thêm 4 tests:
  1. `answerCorrect_appendsBreakdownToSession`
  2. `sessionComplete_createsXpEventWithAggregate`
  3. `sessionComplete_skipsIfNotRankedMode`
  4. `sessionComplete_idempotent_noDoubleInsert`

**Commit:** `feat: wire RANKED_SESSION xp_event on session finalize`

**STOP — confirm Bui.**

---

## Commit 4 — Wire DAILY_COMPLETION

**File sửa:** `apps/api/src/main/java/com/biblequiz/modules/daily/service/DailyChallengeService.java` (line ~279, +50 XP site)

**Logic:**
```java
// Existing code: cộng +50 vào UDP
udpService.addPoints(userId, 50);

// THÊM: insert xp_event
xpEventService.recordDailyCompletion(
    userId,
    session.getId(),
    correctCount,
    totalCount  // 5
);
```

**Idempotent guard:** Daily completion đã có check chỉ 1 lần/ngày — verify hiện tại đã safe. Nếu user replay → không double insert.

**Metadata JSON:**
```json
{
  "challengeDate": "2026-05-08",
  "correctCount": 4,
  "totalCount": 5
}
```

**Tests:**
- `DailyChallengeServiceTest.java` — thêm 3 tests:
  1. `complete_pass4of5_recordsXpEventWith50`
  2. `complete_fail3of5_doesNotRecordEvent` (vì current logic không +50 nếu < 4 correct — verify)
  3. `complete_alreadyCompleted_doesNotDoubleInsert`

**Commit:** `feat: wire DAILY_COMPLETION xp_event`

**STOP — confirm Bui.**

---

## Commit 5 — Wire STAR_BONUS + actually credit UDP

**File sửa:** `apps/api/src/main/java/com/biblequiz/modules/ranked/service/TierProgressService.java` (line ~119, `checkStarBoundary` returns `StarEvent`)

**Vấn đề hiện tại (audit findings):** `StarEvent(idx, 30)` được trả về cho FE để show popup, nhưng KHÔNG có code nào cộng 30 vào UDP. Wire luôn.

**Logic:**
```java
public Optional<StarEvent> checkStarBoundary(Long userId, int oldPoints, int newPoints) {
    // existing logic detect star boundary cross
    if (crossedStar) {
        int starIdx = ...;
        int bonus = 30;
        
        // THÊM: actually credit UDP
        udpService.addPoints(userId, bonus);
        
        // THÊM: record xp_event
        xpEventService.recordStarBonus(userId, starIdx, currentTierName);
        
        return Optional.of(new StarEvent(starIdx, bonus));
    }
    return Optional.empty();
}
```

**Cẩn thận:** 
- `checkStarBoundary` được gọi từ RankedController sau mỗi answer. Phải gọi SAU `udpService.addPoints(answerXp)` để compute đúng `newPoints`.
- Khi star bonus cộng thêm 30 vào UDP → có thể crossing star kế tiếp (rare nhưng có thể). KHÔNG cascade — chỉ check 1 lần per answer.
- Verify hiện tại có call `checkStarBoundary` chưa, hay chỉ FE compute. Nếu FE compute → BE cần thêm hook mới.

**Metadata JSON:**
```json
{
  "starIndex": 3,
  "tierName": "Môn Đồ",
  "totalPointsAfter": 7530
}
```

**Tests:**
- `TierProgressServiceTest.java` — thêm 3 tests:
  1. `checkStarBoundary_crossed_recordsEventAnd CreditsUDP`
  2. `checkStarBoundary_notCrossed_noEvent`
  3. `checkStarBoundary_idempotent_noDoubleCredit` (gọi 2 lần với same oldPoints/newPoints)

**Commit:** `feat: wire STAR_BONUS xp_event + actually credit +30 UDP`

**STOP — confirm Bui.**

---

## Commit 6 — API endpoint `GET /api/me/xp-history`

**File mới:** `apps/api/src/main/java/com/biblequiz/api/XpHistoryController.java`

**Files DTO mới:**
- `apps/api/src/main/java/com/biblequiz/api/dto/XpHistoryItemDto.java`
- `apps/api/src/main/java/com/biblequiz/api/dto/XpHistoryPageDto.java`

**Endpoint:**
```
GET /api/me/xp-history?cursor={ISO_datetime}&limit={1-50, default 20}
→ {
    items: [XpHistoryItemDto],
    nextCursor: "2026-05-08T14:23:45Z" | null,
    totalCount: 142,
    firstEventDate: "2026-05-01T08:00:00Z" | null  // for "Lịch sử bắt đầu từ..." banner
  }
```

**XpHistoryItemDto:**
```typescript
{
  id: number,
  source: "RANKED_SESSION" | "DAILY_COMPLETION" | "STAR_BONUS",
  totalEarned: number,
  createdAt: string,  // ISO
  
  // Source-specific (null nếu không applicable)
  sessionId?: number,
  sessionMode?: "RANKED" | "DAILY",
  sessionBook?: string,  // tên sách (đã localized, dùng BookNameMapper nếu cần)
  sessionLanguage?: "vi" | "en",
  
  breakdown: {
    baseTotal: number,
    speedBonusTotal: number,
    comboBonusTotal: number,
    comboMaxReached: number,
    tierMultiplierPct: number,  // 100 = 1.0x, 200 = 2.0x
    surgeActive: boolean,
    dailyFirstBonus: number
  } | null,  // null cho STAR_BONUS, DAILY_COMPLETION (chỉ +50 flat)
  
  metadata: {
    // RANKED_SESSION: { correctCount, totalQuestions, accuracy }
    // DAILY_COMPLETION: { challengeDate, correctCount, totalCount }
    // STAR_BONUS: { starIndex, tierName, totalPointsAfter }
  }
}
```

**Auth:** `@AuthenticationPrincipal` extract userId. KHÔNG accept userId từ query (privacy).

**Tests:**
- `XpHistoryControllerTest.java` — 5 tests:
  1. `getHistory_emptyForNewUser_returns200WithEmptyList`
  2. `getHistory_paginatesCorrectly`
  3. `getHistory_includesAllThreeSourceTypes`
  4. `getHistory_unauthenticated_returns401`
  5. `getHistory_userCannotAccessOtherUser` (no userId param to test)

**Commit:** `feat: GET /api/me/xp-history endpoint`

**STOP — confirm Bui.**

---

## Commit 7 — Extend `/sessions/{id}/review` với per-answer points

**File sửa:** `apps/api/src/main/java/com/biblequiz/api/SessionController.java` (line ~174-177)

**Vấn đề:** Endpoint hiện tại trả answers nhưng không có `pointsEarned` per answer. User drill-down từ XP history tab muốn xem câu nào được bao nhiêu điểm.

**Logic:**
- Existing endpoint trả `Answer[]` — verify field `score_earned` đã có (audit confirms `answers.score_earned INT`).
- Extend response DTO: `AnswerReviewDto` thêm `pointsEarned: number` field.
- FE `Review.tsx` extend để hiển thị points per question.

**Tests:**
- Extend `SessionControllerTest` — 1 test mới: `getReview_includesPointsEarnedPerAnswer`

**Commit:** `feat: extend session review with per-answer points`

**STOP — confirm Bui.**

---

## Commit 8 — FE: Section "Lịch Sử XP" trong Profile (compact, 5 entries)

> **Reference mockup:** `MOCKUP_XP_HISTORY.html` State 1 (Desktop) + State 2 (Mobile) + State 3 (Empty) + State 4 (Edge case).

**Files mới:**
- `apps/web/src/api/xpHistory.ts` (API client — dùng cho cả section và full page)
- `apps/web/src/types/xpHistory.ts` (TS types — shared)
- `apps/web/src/components/xpHistory/XpHistoryItem.tsx` (shared component — render 1 entry, dùng ở section + full page)
- `apps/web/src/components/xpHistory/XpHistorySection.tsx` (compact section cho Profile, max 5 entries)
- `apps/web/src/components/xpHistory/XpEmptyState.tsx` (empty state — shared)

**Files sửa:**
- `apps/web/src/pages/Profile.tsx` — insert `<XpHistorySection />` giữa existing weakness analysis section và Prestige section
- `apps/web/src/i18n/vi.json` + `en.json` — thêm strings (xem block bên dưới)
- `apps/web/src/App.tsx` (hoặc routes file) — chuẩn bị placeholder cho route /profile/xp-history (Commit 9 sẽ implement)

**API client:**
```typescript
// apps/web/src/api/xpHistory.ts
export async function getXpHistory(opts: {
  cursor?: string;
  limit?: number;  // default 20, section dùng 5
}): Promise<XpHistoryPage> {
  const params = new URLSearchParams();
  if (opts.cursor) params.set('cursor', opts.cursor);
  params.set('limit', String(opts.limit ?? 20));
  return api.get(`/api/me/xp-history?${params}`);
}
```

**TS types:**
```typescript
// apps/web/src/types/xpHistory.ts
export type XpEventSource = 'RANKED_SESSION' | 'DAILY_COMPLETION' | 'STAR_BONUS';

export interface XpEventBreakdown {
  baseTotal: number;
  speedBonusTotal: number;
  comboBonusTotal: number;
  comboMaxReached: number;
  tierMultiplierPct: number;  // 100 = 1.0x, 200 = 2.0x — show ALWAYS (motivation)
  surgeActive: boolean;
  dailyFirstBonus: number;
}

export interface XpHistoryItem {
  id: number;
  source: XpEventSource;
  totalEarned: number;
  createdAt: string;
  sessionId?: number | null;
  sessionMode?: 'RANKED' | 'DAILY' | null;
  sessionBook?: string | null;
  sessionLanguage?: 'vi' | 'en' | null;
  breakdown?: XpEventBreakdown | null;  // null cho STAR_BONUS, DAILY_COMPLETION
  metadata?: Record<string, any>;
}

export interface XpHistoryPage {
  items: XpHistoryItem[];
  nextCursor: string | null;
  totalCount: number;
  firstEventDate: string | null;  // ISO date hoặc null nếu user chưa có event
}
```

**`XpHistoryItem.tsx` (shared component):**

Render entry card theo mockup spec:
- Source icon (gold/purple/blue tùy source) — left
- Title + meta — middle
- XP amount (green #4ade80) + chevron — right
- Click → expand breakdown (chỉ RANKED_SESSION; STAR/DAILY không có chevron)

**Breakdown expanded view (CHỈ cho RANKED_SESSION):**

Hiển thị ALL rows, kể cả khi multiplier ×1.0:
- Điểm cơ bản: `baseTotal`
- Bonus tốc độ: `+speedBonusTotal` (xanh)
- Bonus combo (max ×{combo}): `+comboBonusTotal` (xanh) — chỉ render nếu `comboBonusTotal > 0`
- Hệ số Tier ({tier name}): `×{tierMultiplierPct/100}` (purple) — **LUÔN show, kể cả ×1.0** vì motivation
- Câu đầu ngày (×2): `+dailyFirstBonus` (xanh) — chỉ render nếu `dailyFirstBonus > 0`
- Tăng tốc XP (×1.5): badge ⚡ — chỉ render nếu `surgeActive = true`
- Tổng cộng: `totalEarned` (gold gradient text)
- "Xem chi tiết từng câu →" link → navigate `/review/{sessionId}`

**`XpHistorySection.tsx` (Profile inline):**

```tsx
export function XpHistorySection() {
  const { data, isLoading } = useQuery({
    queryKey: ['xp-history', 'section', 5],
    queryFn: () => getXpHistory({ limit: 5 }),
    staleTime: 60_000,
  });
  
  if (isLoading) return <SectionSkeleton />;
  
  const isEmpty = !data || data.items.length === 0;
  
  return (
    <section className="section-card">
      <SectionHeader 
        icon="history" 
        title={t('xpHistory.title')}  // "LỊCH SỬ XP"
        rightAction={!isEmpty && {
          label: t('xpHistory.viewAll'),  // "Xem tất cả →"
          to: '/profile/xp-history'
        }}
      />
      
      {isEmpty ? (
        <XpEmptyState />
      ) : (
        <>
          {data.firstEventDate && <StartDateBanner date={data.firstEventDate} />}
          <ScopeNote />
          {data.items.map(item => (
            <XpHistoryItem key={item.id} item={item} />
          ))}
        </>
      )}
    </section>
  );
}
```

**Profile.tsx integration:**
- Tìm section "Phân Tích Chi Tiết" (weakness analysis component)
- Insert `<XpHistorySection />` ngay SAU nó
- Insert TRƯỚC Prestige section
- KHÔNG đổi cấu trúc Profile khác

**Sacred Modernist tokens (HARDCODED hex — memory rule):**
- Background section: `rgba(50, 52, 64, 0.4)` + backdrop-blur 12px
- Border section: `1px solid rgba(255, 255, 255, 0.06)`
- Border radius: `20px` desktop, `16px` mobile
- Source icon RANKED: gold gradient `linear-gradient(135deg, rgba(232,168,50,0.2), rgba(251,191,36,0.15))` + border `rgba(232,168,50,0.3)`
- Source icon STAR: purple `rgba(167,139,250,...)`
- Source icon DAILY: blue `rgba(96,165,250,...)`
- XP amount color: `#4ade80` (green)
- Total gradient text: `linear-gradient(135deg, #e8a832 0%, #fbbf24 100%)`

**i18n strings (vi.json):**
```json
"xpHistory": {
  "title": "Lịch sử XP",
  "viewAll": "Xem tất cả →",
  "bannerStart": "Lịch sử XP bắt đầu từ {{date}}",
  "scopeNote": "Chỉ <strong>Xếp hạng</strong>, <strong>Thử thách hàng ngày</strong>, và phần thưởng <strong>lên Star</strong> được ghi nhận. Multiplayer, Tournament, và các chế độ vui (Mystery / Speed Round) không cộng XP.",
  "scopeNoteShort": "Chỉ Xếp hạng, Thử thách hàng ngày, và lên Star được ghi nhận.",
  "sourceRanked": "Phiên Xếp hạng",
  "sourceRankedWithBook": "Phiên Xếp hạng — {{book}}",
  "sourceDaily": "Thử thách hàng ngày",
  "sourceStar": "Lên Star {{index}} — {{tierName}}",
  "metaCorrectAccuracy": "{{correct}}/{{total}} đúng · {{accuracy}}%",
  "breakdown": {
    "base": "Điểm cơ bản",
    "speed": "Bonus tốc độ",
    "combo": "Bonus combo (max ×{{multiplier}} ở câu thứ {{atQuestion}})",
    "comboShort": "Combo (×{{multiplier}})",
    "tier": "Hệ số Tier ({{tierName}})",
    "tierShort": "Tier",
    "surge": "Tăng tốc XP (×1.5)",
    "dailyFirst": "Câu đầu ngày (×2)",
    "dailyFirstShort": "Câu đầu ngày",
    "total": "Tổng cộng",
    "totalShort": "Tổng"
  },
  "viewQuestionDetail": "Xem chi tiết từng câu",
  "loadMore": "Tải thêm ({{count}} mục)",
  "loadError": "Không tải được lịch sử",
  "retry": "Thử lại",
  "empty": {
    "title": "Chưa có lịch sử XP",
    "description": "Bắt đầu chơi <strong>Xếp hạng</strong> hoặc <strong>Thử thách hàng ngày</strong> để xem cách điểm được tính và cộng vào tổng XP của bạn.",
    "ctaRanked": "Bắt đầu Xếp hạng",
    "ctaDaily": "Thử thách hôm nay"
  },
  "partialNote": "Bạn có thể nhận thêm XP bằng cách chơi <strong>Xếp hạng</strong>."
}
```

(en.json: tương tự với English translations.)

**Tests (Vitest):**
- `XpHistorySection.test.tsx` — 6 tests:
  1. `rendersFiveEntriesMaxFromAPI`
  2. `showsViewAllLinkWhenHasEntries`
  3. `hidesViewAllLinkInEmptyState`
  4. `rendersStartDateBannerWhenFirstEventDateExists`
  5. `rendersEmptyStateWhenNoEntries`
  6. `showsLoadingSkeletonInitially`
- `XpHistoryItem.test.tsx` — 8 tests:
  1. `rendersRankedSessionWithExpandableChevron`
  2. `rendersStarBonusWithoutChevron`
  3. `rendersDailyCompletionWithoutChevron`
  4. `expandsBreakdownOnClick`
  5. `showsTierMultiplierRowEvenWhen1x` ← **Bui locked: motivation**
  6. `hidesComboRowWhenZero`
  7. `hidesDailyFirstRowWhenZero`
  8. `linkToReviewWithSessionId` (chỉ RANKED có sessionId)

**Commit:** `feat(fe): XpHistorySection in Profile with shared XpHistoryItem component`

**STOP — confirm Bui.**

---

## Commit 9 — FE: Full page `/profile/xp-history` với pagination

**Files mới:**
- `apps/web/src/pages/XpHistoryPage.tsx`

**Files sửa:**
- `apps/web/src/App.tsx` (routes) — add route `/profile/xp-history` → `<XpHistoryPage />` (auth-required)

**Page structure:**

```
┌─────────────────────────────────────────────────────┐
│ ← Quay lại Hồ sơ                                    │  ← Back link
│                                                      │
│ 📜 LỊCH SỬ XP                                       │  ← Page header
│ Tổng 142 mục được ghi nhận                          │  ← totalCount
│                                                      │
│ ─────────────────────────────────────               │
│                                                      │
│ [Start date banner — gold]                          │
│ [Scope note — blue]                                 │
│                                                      │
│ [Entry 1 — XpHistoryItem reused]                    │
│ [Entry 2]                                           │
│ ...                                                  │
│ [Entry 20]                                          │
│                                                      │
│ [Tải thêm (122 mục) ▼]                              │  ← Load more button
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Implementation:**
```tsx
export function XpHistoryPage() {
  const { t } = useTranslation();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['xp-history', 'page'],
    queryFn: ({ pageParam }) => getXpHistory({ cursor: pageParam, limit: 20 }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });
  
  const allItems = data?.pages.flatMap(p => p.items) ?? [];
  const firstPage = data?.pages[0];
  
  if (isLoading) return <PageSkeleton />;
  if (isError) return <PageError onRetry={() => refetch()} />;
  
  return (
    <AppLayout>
      <PageMeta title={t('xpHistory.title')} />
      
      <div className="page-container">
        <BackLink to="/profile">{t('common.backToProfile')}</BackLink>
        
        <PageHeader
          icon="history"
          title={t('xpHistory.title')}
          subtitle={t('xpHistory.totalRecorded', { count: firstPage?.totalCount ?? 0 })}
        />
        
        {firstPage?.firstEventDate && <StartDateBanner date={firstPage.firstEventDate} />}
        <ScopeNote />
        
        {allItems.length === 0 ? (
          <XpEmptyState />
        ) : (
          <div className="xp-list">
            {allItems.map(item => (
              <XpHistoryItem key={item.id} item={item} />
            ))}
            
            {hasNextPage && (
              <LoadMoreButton
                onClick={() => fetchNextPage()}
                loading={isFetchingNextPage}
                remaining={(firstPage?.totalCount ?? 0) - allItems.length}
              />
            )}
            
            {!hasNextPage && allItems.length > 5 && (
              <div className="end-marker">{t('xpHistory.endOfHistory')}</div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
```

**Layout decisions:**
- Wrap trong `AppLayout` (sidebar + top nav giữ nguyên — match existing pages pattern)
- Content max-width: 800px (focused reading, không cần full 952px như Profile dashboard)
- Mobile: full width
- Back link hiển thị "← Quay lại Hồ sơ" (text + chevron icon)
- KHÔNG show "Xem tất cả →" link (đã ở full page rồi)

**Pagination:**
- Initial load: 20 items
- Load more: +20 mỗi click
- Use `useInfiniteQuery` từ TanStack Query
- KHÔNG infinite scroll auto — explicit "Tải thêm" button (better UX, user control)

**SEO:**
- `<PageMeta title="Lịch sử XP" />` — không index (private route, auth-required)
- robots: noindex (đã handled bởi RequireAuth wrapper)

**i18n strings bổ sung (vi.json):**
```json
"xpHistory": {
  ...existing...
  "totalRecorded": "Tổng {{count}} mục được ghi nhận",
  "endOfHistory": "Đây là mục đầu tiên trong lịch sử XP của bạn",
  "pageError": "Không tải được trang. Thử lại?"
},
"common": {
  "backToProfile": "Quay lại Hồ sơ"
}
```

**Tests (Vitest):**
- `XpHistoryPage.test.tsx` — 7 tests:
  1. `rendersBackLinkToProfile`
  2. `rendersTotalCountInSubtitle`
  3. `rendersFirstPageOnLoad`
  4. `loadsNextPageOnButtonClick`
  5. `hidesLoadMoreWhenNoNextCursor`
  6. `showsEmptyStateForNewUser`
  7. `showsErrorStateAndRetryButton`

**Playwright E2E (basic):**
- `apps/web/tests/xp-history-page.spec.ts`:
  ```
  - Login → navigate /profile → click "Xem tất cả →"
  - Verify URL = /profile/xp-history
  - Verify back link visible
  - Verify page title "Lịch sử XP"
  - Click back → verify back to /profile
  ```

**Commit:** `feat(fe): full page /profile/xp-history with pagination`

**STOP — confirm Bui.**

---

## Commit 10 — FE: Extend Review page với per-answer points

**File sửa:** `apps/web/src/pages/Review.tsx`

**Logic:**
- Mỗi answer card hiện tại show: question, correct answer, user answer, explanation
- THÊM: badge điểm "+12 XP" (gold #e8a832) ở góc phải mỗi câu correct, hoặc "0 XP" (muted #6b7280) cho câu sai/timeout
- Tooltip on hover (desktop): breakdown nếu có (base + speed + combo). Mobile: tap badge → expand inline.

**Drill-down từ XP history:** Khi user click "Xem chi tiết từng câu" từ XpHistoryItem (RANKED) → navigate `/review/:sessionId` → user thấy điểm per câu rõ ràng.

**Visual:**
```
┌──────────────────────────────────────────────────┐
│ Câu 1 / 10                              ✅ +14 XP │
│ Đức Chúa Trời tạo dựng vũ trụ trong bao nhiêu ngày? │
│                                                   │
│ ✓ A) Bảy ngày        (đáp án đúng + bạn chọn)    │
│   B) Sáu ngày                                     │
│   C) Tám ngày                                     │
│                                                   │
│ 💡 Giải thích: ...                                │
│ 📖 Sáng Thế Ký 1:1                                │
└──────────────────────────────────────────────────┘
```

**Tests:**
- `Review.test.tsx` — thêm 3 tests:
  1. `displaysPointsEarnedPerAnswer`
  2. `displaysZeroPointsForWrongAnswer`
  3. `pointsBadgeShowsGoldForCorrectMutedForWrong`

**Commit:** `feat(fe): show per-answer points in Review page`

**STOP — confirm Bui.**

---

## Commit 11 — Full regression + Playwright E2E

**Tests:**
1. **BE:** `cd apps/api && ./mvnw test`
   - Baseline trước feature: ghi lại số test pass (audit memo: BE có pre-existing failures, không treat là blocker)
   - Sau feature: số test phải tăng ≥ 23 (6 + 4 + 3 + 3 + 5 + 1 + 1 = 23 mới)
   - Pre-existing failures KHÔNG được tăng

2. **FE:** `cd apps/web && npx vitest run`
   - Baseline: ~387 tests
   - Sau feature: ≥ 411 tests (6 + 8 + 7 + 3 = 24 mới)

3. **Playwright E2E:** Tạo `apps/web/tests/scoring-history.spec.ts`
   ```
   Test 1: User completes Ranked → checks XP history → sees event with breakdown
   - Login as test user (Tier 2, có energy)
   - Complete 5-question Ranked session (mock or real)
   - Navigate Profile → scroll to "Lịch Sử XP" section
   - Verify: 1 event card visible (latest)
   - Click expand → verify breakdown visible
   - Click "Xem chi tiết từng câu" → lands on /review/:id
   - Verify: per-answer points visible (badge "+X XP" trên mỗi answer card)
   
   Test 2: Pagination flow
   - Seed user với >20 events (test fixture)
   - Navigate /profile → click "Xem tất cả →"
   - Verify URL = /profile/xp-history
   - Verify 20 entries shown
   - Click "Tải thêm" → verify +20 more entries
   - Click back link → verify back to /profile
   
   Test 3: Empty state
   - Login as fresh user (no events)
   - Navigate /profile
   - Verify section shows empty state (no entries, 2 CTAs visible)
   - Click "Bắt đầu Xếp hạng" → lands on /ranked
   ```

4. **Manual verification (Bui chạy):**
   - [ ] Login user mới → Profile → section "Lịch Sử XP" empty state đúng
   - [ ] Chơi 1 phiên Ranked → reload Profile → 1 entry mới ở section
   - [ ] Click expand → breakdown khớp QuizResults vừa nhìn thấy
   - [ ] Click "Xem tất cả →" → mở `/profile/xp-history` đúng
   - [ ] Hoàn thành Daily Challenge → 1 entry +50 mới
   - [ ] Lên Star (cố ý điểm gần boundary, dùng test panel set tier nếu cần) → 1 entry +30 + UDP thực sự +30 (verify trước-sau diff)
   - [ ] Chơi Practice → KHÔNG có entry mới (verify intentional)
   - [ ] Chơi Multiplayer → KHÔNG có entry mới (verify intentional)
   - [ ] Pagination: seed >20 events → "Tải thêm" works
   - [ ] Tier multiplier ×1.0 vẫn show row (Tier 1 user)
   - [ ] Click "Xem chi tiết từng câu" → Review page show per-answer points

**Commit:** `test: scoring history E2E + regression baseline`

---

## Acceptance criteria

- [ ] V47 migration applies clean trên dev DB
- [ ] BE tests: ≥ 23 tests mới, all pass
- [ ] FE tests: ≥ 24 tests mới (6 section + 8 item + 7 page + 3 review), all pass
- [ ] Playwright E2E: 3 tests pass (ranked flow, pagination flow, empty state)
- [ ] Manual verification 11/11 checks pass
- [ ] FE i18n: vi + en đầy đủ, KHÔNG có hardcoded Vietnamese strings
- [ ] Sacred Modernist design tokens: hardcoded hex, KHÔNG CSS variables (memory rule)
- [ ] Tier multiplier ×1.0 row vẫn hiển thị (Bui locked: motivation)
- [ ] Star bonus: thực sự cộng UDP (verify trước-sau diff = +30)
- [ ] Idempotent: gọi finalize/complete 2 lần KHÔNG tạo duplicate xp_event
- [ ] Privacy: user A không xem được history user B (test thử)
- [ ] Section trong Profile show max 5 entries gần nhất + link "Xem tất cả →"
- [ ] Full page `/profile/xp-history` pagination (20/page) + back link

---

## Out of scope (TUYỆT ĐỐI KHÔNG làm trong feature này)

1. **Wire dead code XP sources khác** — Comeback ×2, Streak bonus, Daily Mission bonus, Surge multiplier (Milestone Burst). Tách ticket riêng.
2. **Backfill historical events** — KHÔNG tạo xp_event cho data cũ. Ship from now on.
3. **Multiplayer/Tournament tracking** — confirmed intentional không cộng user XP.
4. **Variety modes (Mystery/Speed/Weekly)** — confirmed không-XP.
5. **Admin view** — admin xem xp_event của user khác. Tách ticket sau khi cần audit fraud.
6. **Export CSV** — user export lịch sử ra file. Defer v3.
7. **Per-question xp_event rows** — chọn per-session aggregate. KHÔNG insert per-answer.
8. **Modify `answers` table** — TUYỆT ĐỐI không thêm breakdown columns vào `answers`.
9. **Profile tab navigation rework** — KHÔNG thêm tabs cho Profile. Section approach (giữa "Phân Tích Chi Tiết" và "Prestige") là final.

---

## Rollback plan

Nếu sau ship feature có bug critical:

1. **FE-only rollback (section):** Comment out `<XpHistorySection />` trong Profile.tsx + remove route `/profile/xp-history` → deploy. Backend vẫn write events (data preserved).
2. **BE rollback từng source:** Comment out call site (RankedController/DailyChallengeService/TierProgressService) → events ngừng tạo. Existing data giữ nguyên.
3. **Full rollback:** Revert commits theo thứ tự ngược (11 → 1). Giữ lại V47 migration (DROP TABLE manual nếu cần) — Flyway không tự rollback.

---

## Risks identified (audit) + mitigations

1. **Backfill question** → Ship from now on + banner. **Mitigation accepted by Bui.**
2. **Performance scale** → Index `(user_id, created_at)` handles 500k rows/day cho 10k user. Monitor query time `EXPLAIN`. Partition theo tháng nếu > 100M rows (defer).
3. **Dead code drift** → Khi wire Star/Surge/Mission sau, dev có thể quên gọi `xpEventService.record()`. **Mitigation:** code review checklist + integration test theo source.
4. **Multiplayer expectation gap** → User có thể ngạc nhiên Multiplayer thắng không có trong lịch sử. **Mitigation:** Note rõ trong UI scope (cả section + full page đều có scope note).
5. **Star bonus crossing chain** → Cộng 30 có thể trigger star kế. **Mitigation:** chỉ check 1 lần per answer (no cascade).
6. **Section vs full page consistency** → Bug có thể chỉ xảy ra 1 surface. **Mitigation:** shared `XpHistoryItem` component đảm bảo render giống nhau.

---

## Update TODO.md sau khi hoàn thành

Thêm section đầu TODO.md:

```markdown
## Scoring History Feature [DONE]

> Implemented Hybrid (Option A++) per AUDIT_SCORING_HISTORY.md.
> 3 LIVE sources: RANKED_SESSION, DAILY_COMPLETION, STAR_BONUS.
> UI: Section trong Profile (5 entries) + full page /profile/xp-history (pagination).
> Side fix: Star bonus (+30 XP) now actually credited to UDP (was dead code before).

- [x] V47 migration: xp_event table + xp_breakdown buffer on quiz_sessions
- [x] XpEvent entity + repository + XpEventService
- [x] Wire RANKED_SESSION (buffer + finalize on session COMPLETED)
- [x] Wire DAILY_COMPLETION (+50 with metadata)
- [x] Wire STAR_BONUS + actual UDP credit (+30 fix)
- [x] GET /api/me/xp-history endpoint with pagination
- [x] Extend /sessions/{id}/review with per-answer pointsEarned
- [x] FE shared XpHistoryItem component + XpHistorySection in Profile
- [x] FE full page /profile/xp-history with infinite query
- [x] FE Review page per-answer points badge
- [x] E2E + regression (3 Playwright tests + 24 FE + 23 BE tests)

Future tickets unblocked:
- [ ] Wire other dead code XP sources (Streak/Comeback/Mission/Surge) — tách ticket
- [ ] Decide: Multiplayer/Tournament cộng XP? (currently confirmed intentional KHÔNG)
- [ ] Backfill historical XP events from UserDailyProgress (low priority)
- [ ] Admin view xp_event for fraud audit (defer)
- [ ] Export CSV của lịch sử XP (defer v3)
```

---

## Workflow recap

1. **Verification** — đọc 9 grep commands ở section đầu, confirm khớp audit
2. **Commit 1** (V47 migration) → STOP → Bui confirm
3. **Commit 2** (XpEvent entity + service) → STOP → Bui confirm
4. **Commit 3** (Wire RANKED_SESSION) → STOP → Bui confirm
5. **Commit 4** (Wire DAILY_COMPLETION) → STOP → Bui confirm
6. **Commit 5** (Wire STAR_BONUS + UDP credit fix) → STOP → Bui confirm
7. **Commit 6** (GET /api/me/xp-history) → STOP → Bui confirm
8. **Commit 7** (Extend /sessions/{id}/review) → STOP → Bui confirm
9. **Commit 8** (FE XpHistorySection + shared component) → STOP → Bui confirm
10. **Commit 9** (FE full page /profile/xp-history) → STOP → Bui confirm
11. **Commit 10** (FE Review per-answer points) → STOP → Bui confirm
12. **Commit 11** (Full regression + E2E) → final review → done

**Total: 11 commits, ~17.5h estimate** (Commit 9 mới thêm ~1h).

**Bui giữ quyền pivot:** nếu thấy commit nào findings không khớp expectation → STOP, document, hỏi lại trước khi proceed.

**Reference files:**
- `MOCKUP_XP_HISTORY.html` — visual reference 4 states
- `AUDIT_SCORING_HISTORY.md` — code path analysis
- This file — implementation spec
