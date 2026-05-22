# PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT

> **Audience:** Claude Code (autonomous coding agent)
> **Type:** PIVOT prompt — modifies output of `PROMPT_MULTIPLAYER_LOBBY_REDESIGN.md` (already executed)
> **Mockup reference:** `docs/MULTIPLAYER/MOCKUP_MULTIPLAYER_LOBBY_v3.html` (Bui approved 2026-05-15)
> **Sprint slot:** Continue UX-polish, before Sprint 5
> **Effort dự kiến:** ~3 ngày · ~1,500 LOC (BE-heavy vì add Quick Match real implementation)
> **Spec touch:** SPEC_MULTIPLAYER §3 (add mode variant), §8 (add 1 endpoint), §7.1 (update lobby)

---

## ⚠ Outdated — see 2026-05-23 update

**Update 2026-05-23**: §0.1 dưới nói "Mode: SPEED_RACE only". Code đã
ship đầy đủ **4 modes** (SPEED_RACE / BATTLE_ROYALE / TEAM_VS_TEAM /
SUDDEN_DEATH) qua `MODE_LIST` trong `QuickMatchConfigModal.tsx:115`.
Canonical hiện tại: `SPEC_MULTIPLAYER.md §8` (POST `/api/rooms/quick-match`
row đã document đầy đủ 4 modes). Pivot doc này giữ làm history reference,
KHÔNG canonical cho behavior hiện hành.

## 🛑 CRITICAL — Đây là PIVOT, không phải full redesign

Prompt trước (`PROMPT_MULTIPLAYER_LOBBY_REDESIGN.md`) đã chạy xong và shipped. Code hiện tại đã có:
- ✅ ML-1: `GET /api/users/me/multiplayer-stats` endpoint
- ✅ ML-2: `modeColors.ts` design tokens (SD amber `#fbbf24`)
- ✅ ML-3: Header với live stats pill
- ✅ ML-4: `JoinByCodeBar.tsx` thin bar
- ✅ ML-5: `CreateRoomHeroCard.tsx` (gold) + **`SoloArenaEntryCard.tsx`** (indigo)
- ✅ ML-6: `ModeShowcaseGrid.tsx` 4 cards
- ✅ ML-7: `RoomsSection` + `RoomCard` + `EmptyRoomsState` (có Solo soft-link)
- ✅ ML-8: `WeeklyMultiplayerStatsWidget.tsx`
- ✅ ML-9: `/solo-arena` placeholder route + `SoloArenaPlaceholder.tsx`
- ✅ BL-MP-SOLO, BL-MP-QM in BACKLOG

**Concept change từ Bui:** "Solo" ban đầu được Claude hiểu sai = "chơi 1 mình". Intent thực = **"chơi multiplayer nhưng không cần Quản trò, server tự điều phối"**. Đây là **Quick Match** pattern, không phải single-player.

**Hệ quả:** Solo Arena entry card + placeholder page cần PIVOT → **"Đấu Nhanh" (Quick Match)**:
- Vẫn là multiplayer (2-10 người)
- Server tự điều phối (no Quản trò role)
- Câu hỏi random từ DB pool hoặc AI sinh
- Mode: Speed Race only (đơn giản hóa)
- Anti-spoiler vẫn áp dụng (câu sinh lazy server-side)
- Tier 4+ unlock AI source
- Daily cap 3 trận/ngày

---

## 0.1 Decisions LOCKED

| Quyết định | Value |
|---|---|
| Naming VI | **"Đấu Nhanh"** |
| Naming code | `quickMatch` (camelCase field), `QUICK_MATCH` (constant nếu cần) |
| Flow vào game | **Soft-host pattern**: server tạo Room với `hostPlaysGame=true`, `quickMatch=true`. Người vào đầu = host nominal nhưng **không có quản trò controls** (no pause/skip/broadcast/end-early). Host PLAYS như player. Bất kỳ player nào (kể cả không phải host) có thể bấm Start khi đủ 2 người ready. |
| Mode | **Speed Race only** (`SPEED_RACE`) — đơn giản, Kahoot-like, phổ biến |
| Player range | **2–10** (match Speed Race default) |
| Question source | `DATABASE` random (default) hoặc `AI_GENERATED` (Tier 4+) |
| Anti-spoiler | Lazy server-side selection — câu hỏi KHÔNG tồn tại trong client trước `QUESTION_START` event |
| AI tier-lock | Tier 4+ (Hiền Triết) |
| Daily cap | 3 trận/ngày/user, reset 0h UTC, Redis-backed counter |
| XP / Leaderboard | KHÔNG — variety-style fun only |
| Color accent | Indigo `#6366f1` (reuse từ Solo Arena, giữ token) |

### Lock terminology consistency
- "Đấu Nhanh" = UI Vietnamese
- "Quick Match" = English UI fallback
- `quickMatch` = code field name (boolean trên Room)
- `QUICK_MATCH` = constant nếu cần enum value
- **KHÔNG dùng "Solo"** ở bất kỳ user-facing copy nào (memory had "Solo Arena" — that's deprecated)

### Indigo color tokens (already exist in modeColors.ts)
Reuse `SOLO_ARENA_COLORS` const but **rename** to `QUICK_MATCH_COLORS`:

```typescript
export const QUICK_MATCH_COLORS = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryLighter: '#a5b4fc',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
  tintBg: 'rgba(99,102,241,0.12)',
  tintBgSoft: 'rgba(99,102,241,0.04)',
  tintBorder: 'rgba(99,102,241,0.25)',
} as const;
```

---

## 0.2 Out of scope (KHÔNG implement trong sprint này)

| Feature | Lý do |
|---|---|
| TV Host Mode | Defer v1.5 (memory locked) |
| AI question batching for quality control | Use existing AI gen pipeline, accept artifacts (separate prompt cleanup BL-AI) |
| User-customizable difficulty/count for Đấu Nhanh | v1 fixed defaults; settings via sidebar gear button → BACKLOG `BL-MP-QM-CUSTOM` |
| Matchmaking with ELO/skill | Simple "find any open Đấu Nhanh room with slot" — no skill matching |

---

## 0.3 Tasks overview (12 tasks)

| ID | Task | Type | LOC |
|---|---|---|---|
| QP-AUDIT | Verify state of code post-LOBBY-REDESIGN | Audit | 0 |
| QP-0.5 | Update BACKLOG (close BL-MP-SOLO, replace with BL-MP-QM scope) | Docs | ~30 |
| QP-1 | BE: Migration V?? — `Room.quick_match` BOOLEAN flag | BE | ~30 |
| QP-2 | BE: `POST /api/rooms/quick-match` endpoint (find or create) | BE | ~250 |
| QP-3 | BE: Quick match question source service (random pool + AI gate) | BE | ~180 |
| QP-4 | BE: Daily cap counter (Redis) + middleware | BE | ~150 |
| QP-5 | BE: Quick match room start logic (any player can Start, no Quản trò controls) | BE | ~100 |
| QP-6 | FE: Rename `SoloArenaEntryCard.tsx` → `QuickMatchEntryCard.tsx` + new copy | FE | ~150 |
| QP-7 | FE: DELETE `SoloArenaPlaceholder.tsx` + `/solo-arena` route | FE | ~30 |
| QP-8 | FE: Update `EmptyRoomsState.tsx` (remove Solo soft-link, add Đấu Nhanh primary CTA) | FE | ~80 |
| QP-9 | FE: `QuickMatchRoomCard.tsx` variant + integrate into RoomsSection (with filter chip) | FE | ~180 |
| QP-10 | FE: RoomLobby quick-match variant (no Quản trò banner, soft-host hint) | FE | ~120 |
| QP-11 | FE: Quick match trigger flow (button → endpoint → navigate) | FE | ~100 |
| QP-REGRESSION | Full test suite + Playwright smoke | Test | 0 |

---

# QP-AUDIT — Verify post-LOBBY-REDESIGN state

**Goal:** Confirm previous prompt's deliverables are present before pivoting.

### Tasks
1. Verify `apps/web/src/components/multiplayer/SoloArenaEntryCard.tsx` exists.
2. Verify `apps/web/src/pages/SoloArenaPlaceholder.tsx` exists.
3. Verify route `/solo-arena` registered in router.
4. Verify `EmptyRoomsState.tsx` has Solo soft-link.
5. Verify `modeColors.ts` has `SOLO_ARENA_COLORS` const.
6. Verify BACKLOG has `BL-MP-SOLO` and `BL-MP-QM` entries.
7. Verify `GET /api/users/me/multiplayer-stats` endpoint works (curl/Postman).
8. Read mockup: `docs/MULTIPLAYER/MOCKUP_MULTIPLAYER_LOBBY_v3.html` (copy from `/mnt/user-data/outputs/` if not in repo). Open browser, toggle states, verify both empty and populated.
9. **Critical:** Check current `Room` entity — confirm `Room.java` location, fields, existing flags (`hostPlaysGame`, etc.). Note next migration version number (likely V50 or higher per memory). Verify exact path with grep.
10. Read `RoomController.java` to identify current endpoints structure for adding new quick-match endpoint.
11. Verify Redis is wired in BE — grep `RedisTemplate` to find existing usage pattern (will reuse for daily cap counter).
12. Check existing AI question generation service — grep `DeepSeek` / `AIQuestionService` to confirm reusable interface.

### Deliverable
Create `docs/MULTIPLAYER/QUICKMATCH_PIVOT_AUDIT.md`:

```markdown
# QuickMatch Pivot — Audit Findings

## Previous prompt deliverables verified
- [✓/✗] SoloArenaEntryCard.tsx at <path>
- [✓/✗] SoloArenaPlaceholder.tsx at <path>
- [✓/✗] /solo-arena route in <file:line>
- [✓/✗] EmptyRoomsState soft-link present at <file:line>
- [✓/✗] modeColors.ts SOLO_ARENA_COLORS at <file:line>
- [✓/✗] BACKLOG BL-MP-SOLO at <file:line>
- [✓/✗] BACKLOG BL-MP-QM at <file:line>
- [✓/✗] /api/users/me/multiplayer-stats endpoint works

## Codebase confirmations
- Next Flyway migration version: V<N>
- Room.java path: <full path>
- Existing Room fields: <list including hostPlaysGame, mode, etc.>
- RedisTemplate usage pattern: <file:line example>
- AI gen service interface: <classname + method signature>

## Ready to proceed? <yes/no>
```

### Stop-checkpoint
Print summary, wait for Bui to read audit. If anything missing from previous prompt → flag, do NOT proceed.

### Commit
```
docs(multiplayer): pivot audit findings for QuickMatch implementation

Spec strategy: no-spec-impact (audit only)
```

---

# QP-0.5 — Update BACKLOG entries

### Tasks
Edit `BACKLOG.md`:

1. **Close `BL-MP-SOLO`** with status note:
```markdown
## BL-MP-SOLO — Solo Arena (CLOSED 2026-05-15)

**Status:** ❌ CANCELLED — concept pivoted to BL-MP-QM (Quick Match)
**Reason:** "Solo" was misinterpreted as single-player. Intent was multiplayer-without-host (Quick Match pattern). See `PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT.md`.
**Replacement:** Implementation now in active sprint as QP-1 → QP-11 (Đấu Nhanh feature).
```

2. **Promote `BL-MP-QM` to active scope** with updated detail:
```markdown
## BL-MP-QM — Quick Match (Đấu Nhanh) — ACTIVE SPRINT

**Status:** 🚧 IN PROGRESS (sprint UX-polish-pivot)
**Effort:** ~3 days
**Scope (locked 2026-05-15):**

### BE
- Migration V<N>: `Room.quick_match BOOLEAN NOT NULL DEFAULT FALSE`
- `POST /api/rooms/quick-match` → find existing OR create new Đấu Nhanh room
- `QuickMatchQuestionSourceService` — random from DB pool or AI gen (Tier 4+)
- `DailyQuickMatchCounter` — Redis SETEX with 24h TTL, key `quickmatch:daily:{userId}:{yyyymmdd}`, INCR on session start
- Quick match room rules:
  - `mode = SPEED_RACE` (only)
  - `hostPlaysGame = true` (host plays like everyone)
  - `quickMatch = true` flag
  - `maxPlayers = 10`
  - `questionCount = 10`
  - `timePerQuestion = 30`
  - `difficulty = MIXED`
  - `isPublic = true`
- Quản trò controls DISABLED for quick-match rooms (pause/skip/broadcast/end-early endpoints return 403 with `QUICK_MATCH_NO_HOST_CONTROLS`)
- Any player can call `POST /api/rooms/{id}/start` when ≥2 players ready (not just host)

### FE
- Rename SoloArenaEntryCard → QuickMatchEntryCard
- Delete SoloArenaPlaceholder + /solo-arena route
- QuickMatchRoomCard component (distinct from regular RoomCard)
- Filter chip "Đấu Nhanh" in RoomsSection
- RoomLobby variant: no Quản trò banner, hint "Không có Quản trò — bất kỳ ai có thể bấm Bắt đầu khi đủ 2 người"
- Daily quota indicator (subtle text below CTA)

### Out of v1
- User-customizable settings (defer BL-MP-QM-CUSTOM)
- Sidebar gear button for AI source toggle (defer)
```

3. **Add new BACKLOG entry `BL-MP-QM-CUSTOM`** for v2 enhancements:
```markdown
## BL-MP-QM-CUSTOM — Quick Match customization (v2)

**Status:** Deferred
**Effort:** ~1 day FE + 0.5 day BE
**Scope:**
- Settings modal/gear button on QuickMatchEntryCard
- Persistent user preference: AI source on/off (if Tier 4+)
- Persistent user preference: question count (5/10/15/20)
- Sticky in user profile, not query param
**Trigger:** After v1 ships and user feedback indicates demand
```

### Commit
```
docs(backlog): close BL-MP-SOLO, promote BL-MP-QM to active scope

- Solo Arena concept cancelled (misinterpretation)
- Quick Match (Đấu Nhanh) scope locked in active sprint
- New BL-MP-QM-CUSTOM for v2 user settings

Spec strategy: inline (BACKLOG.md)
```

### Stop-checkpoint

---

# QP-1 — BE: Migration `Room.quick_match` flag

### Audit step
Find current latest migration in `apps/api/src/main/resources/db/migration/` — note next version number (likely V50, V51, V52 per Sprint 5 memory).

### Implementation
Create `V<N>__add_room_quick_match_flag.sql`:

```sql
-- Quick Match (Đấu Nhanh) support
-- Reference: PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT.md QP-1

ALTER TABLE rooms
ADD COLUMN quick_match BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_rooms_quick_match_status
  ON rooms (quick_match, status, current_players)
  WHERE quick_match = TRUE AND status = 'LOBBY';
-- Partial index for fast "find open Đấu Nhanh room" queries.
-- If MySQL doesn't support partial index, remove WHERE clause.
```

Update `Room.java` entity:

```java
@Column(name = "quick_match", nullable = false)
private boolean quickMatch = false;

public boolean isQuickMatch() { return quickMatch; }
public void setQuickMatch(boolean quickMatch) { this.quickMatch = quickMatch; }
```

### Checklist
- [ ] Migration file created with correct version
- [ ] Entity field added with getter/setter
- [ ] `mvn flyway:migrate` runs clean
- [ ] Verify column exists in DB: `DESCRIBE rooms;`
- [ ] No regression in existing RoomServiceTest

### Spec update — inline
SPEC_MULTIPLAYER §2.1 — add row to Room field table:

```markdown
| `quickMatch` | `boolean` | `false` | TRUE = Đấu Nhanh room (server auto-coordinated, no Quản trò controls, mode forced SPEED_RACE). FALSE = traditional Quản trò room. |
```

### Commit
```
feat(room): add quick_match flag to Room entity

- Migration V<N> adds quick_match BOOLEAN column with index
- Room entity field + accessors
- Spec: SPEC_MULTIPLAYER §2.1 updated

Spec strategy: inline-spec-update
```

### Stop-checkpoint

---

# QP-2 — BE: `POST /api/rooms/quick-match` endpoint

### Audit step
Read `RoomController.java` and `RoomService.java` to understand existing room creation pattern. Note the `createRoom()` method signature.

### Implementation

**Controller method** in `RoomController.java`:

```java
@PostMapping("/quick-match")
public ResponseEntity<RoomJoinResponse> quickMatch(
    @RequestBody(required = false) QuickMatchRequest request,
    @AuthenticationPrincipal CustomUserDetails user
) {
    // 1. Check daily cap (QP-4 — DailyQuickMatchCounter)
    if (dailyQuickMatchCounter.hasReachedCap(user.getId())) {
        throw new BusinessLogicException(
            "DAILY_CAP_REACHED",
            "Đã hết lượt Đấu Nhanh hôm nay. Quay lại sau."
        );
    }

    // 2. Check AI tier-lock if AI source requested
    boolean useAi = request != null && request.useAi();
    if (useAi && user.getTier() < 4) {
        throw new BusinessLogicException(
            "AI_TIER_LOCKED",
            "Mở khóa AI sinh câu hỏi từ Tier 4 (Hiền Triết)"
        );
    }

    // 3. Find OR create
    Room room = roomService.findOrCreateQuickMatchRoom(user.getId(), useAi);

    // 4. Increment daily counter (only when new room created OR successful join)
    dailyQuickMatchCounter.increment(user.getId());

    // 5. Return response
    return ResponseEntity.ok(new RoomJoinResponse(
        true,
        roomMapper.toRoomDetailsDTO(room),
        user.getId(),
        room.isQuickMatch() // tells FE which lobby variant to render
    ));
}
```

**Request DTO:**
```java
public record QuickMatchRequest(boolean useAi) {}
```

**Service logic** in `RoomService.java`:

```java
public Room findOrCreateQuickMatchRoom(String userId, boolean useAi) {
    // Anti-cheat: check if user already in another room
    assertNotInAnotherRoom(userId);

    // Try find open quick-match room
    QuestionSource sourceFilter = useAi ? QuestionSource.AI_GENERATED : QuestionSource.DATABASE;
    Optional<Room> existing = roomRepository.findOpenQuickMatchRoom(sourceFilter);
    if (existing.isPresent()) {
        Room room = existing.get();
        addPlayerToRoom(room, userId, /*ready=*/false);
        return room;
    }

    // Create new quick-match room with locked config
    Room room = new Room();
    room.setId(UUID.randomUUID().toString());
    room.setRoomCode(generateRoomCode());
    room.setHostId(userId);
    room.setMode(RoomMode.SPEED_RACE);
    room.setMaxPlayers(10);
    room.setQuestionCount(10);
    room.setTimePerQuestion(30);
    room.setDifficulty(Difficulty.MIXED);
    room.setBookScope("ALL");
    room.setQuestionSource(sourceFilter);
    room.setIsPublic(true);
    room.setHostPlaysGame(true);  // host plays, not Quản trò
    room.setQuickMatch(true);     // KEY flag
    room.setStatus(RoomStatus.LOBBY);
    room.setCreatedAt(Instant.now());

    Room saved = roomRepository.save(room);
    addPlayerToRoom(saved, userId, /*ready=*/false);

    // Broadcast new public room
    publicRoomsBroadcaster.broadcastNewRoom(saved);

    return saved;
}
```

**Repository query** in `RoomRepository.java`:

```java
@Query("""
    SELECT r FROM Room r
    WHERE r.quickMatch = true
      AND r.status = 'LOBBY'
      AND r.questionSource = :source
      AND r.currentPlayers < r.maxPlayers
    ORDER BY r.currentPlayers DESC, r.createdAt ASC
""")
Optional<Room> findOpenQuickMatchRoom(@Param("source") QuestionSource source);
```

Notes:
- Sort by `currentPlayers DESC` — prefer rooms already filling up (avoids spreading users thin across many empty rooms)
- Then by `createdAt ASC` — break ties with older rooms first

### Tests

`QuickMatchServiceTest.java`:
1. `quickMatch_emptyState_createsNewRoom` — no existing → create
2. `quickMatch_existingRoomWithSlot_joinsExisting` — find existing → join
3. `quickMatch_userAlreadyInAnotherRoom_throws` — anti-cheat
4. `quickMatch_dailyCapReached_throws` — verify cap enforcement
5. `quickMatch_aiSourceTierLocked_throws` — Tier 3 user with `useAi=true`
6. `quickMatch_aiSourceTier4Plus_succeeds` — Tier 4 user with `useAi=true`
7. `quickMatch_createdRoomHasCorrectConfig` — verify all preset values
8. `quickMatch_filterBySource_correct` — DB request doesn't join AI room, vice versa

### Spec update — inline
SPEC_MULTIPLAYER §8 — add row:

```markdown
| POST | `/api/rooms/quick-match` | Bearer | Body: `{ useAi?: boolean }`. Find existing Đấu Nhanh room with matching source OR create new one. Daily cap 3/user/day. AI source requires Tier 4+. Returns `RoomJoinResponse`. Errors: 422 `DAILY_CAP_REACHED`, 422 `AI_TIER_LOCKED`, 422 `ALREADY_IN_ANOTHER_ROOM`. |
```

SPEC_MULTIPLAYER §3 — add new sub-section §3.6:

```markdown
### 3.6 Quick Match (`quickMatch=true` flag) — Đấu Nhanh

**Mục đích:** Multiplayer pattern không cần Quản trò. Server tự điều phối, người chơi vào là chơi.

**Distinction vs traditional rooms:**
- `Room.quickMatch=true` + `Room.hostPlaysGame=true` (host plays)
- Mode FIXED `SPEED_RACE` only
- Config FIXED: 10 câu, 30s/câu, MIXED difficulty, max 10 người
- Quản trò controls (pause/skip/broadcast/end-early) → 403 `QUICK_MATCH_NO_HOST_CONTROLS`
- Start permission: ANY player when ≥2 players ready (not just host)

**Daily cap:** 3 trận/user/day, Redis-backed (`DailyQuickMatchCounter`).
**AI source:** Tier 4+ only (Hiền Triết).
**Anti-spoiler:** Standard lazy server-side question selection (same as other modes).
**XP/Leaderboard:** ❌ None — variety-style fun only.
```

### Commit
```
feat(room): POST /api/rooms/quick-match endpoint

- Find existing Đấu Nhanh room or create with preset config
- Source filter (DATABASE vs AI_GENERATED)
- Daily cap enforcement via DailyQuickMatchCounter
- AI tier-lock enforcement (Tier 4+)
- 8 unit tests passing
- Spec: SPEC_MULTIPLAYER §3.6 + §8 updated

Spec strategy: inline-spec-update
```

### Stop-checkpoint

---

# QP-3 — BE: Quick match question source service

### Audit step
Grep existing `QuestionSelector` / `RandomQuestionService` — find current pattern for fetching random questions. Also grep `DeepSeek` / `AIQuestionGenerator` for AI gen interface.

### Implementation

`QuickMatchQuestionSourceService.java`:

```java
@Service
public class QuickMatchQuestionSourceService {

    private final QuestionRepository questionRepository;
    private final AIQuestionGenerator aiGenerator;  // verify actual class name
    private final Random random = new SecureRandom();

    /**
     * Provide N questions for a quick-match session.
     * - DATABASE: random from active pool, mixed difficulty proportions
     * - AI_GENERATED: synchronously call DeepSeek for N questions
     *
     * Anti-spoiler: this method is called ONLY at QUESTION_START moment, never before.
     * Result must NOT be cached anywhere client-visible.
     */
    public List<Question> selectQuestions(QuestionSource source, int count) {
        return switch (source) {
            case DATABASE -> selectFromDatabase(count);
            case AI_GENERATED -> generateWithAi(count);
            default -> throw new IllegalArgumentException(
                "Unsupported source for quick-match: " + source
            );
        };
    }

    private List<Question> selectFromDatabase(int count) {
        // Mixed difficulty: 30% easy, 50% medium, 20% hard (matches Daily Challenge pattern)
        int easyCount = Math.round(count * 0.3f);
        int hardCount = Math.round(count * 0.2f);
        int mediumCount = count - easyCount - hardCount;

        List<Question> bag = new ArrayList<>();
        bag.addAll(questionRepository.findRandomActiveByDifficulty(Difficulty.EASY, easyCount));
        bag.addAll(questionRepository.findRandomActiveByDifficulty(Difficulty.MEDIUM, mediumCount));
        bag.addAll(questionRepository.findRandomActiveByDifficulty(Difficulty.HARD, hardCount));

        Collections.shuffle(bag, random);
        return bag;
    }

    private List<Question> generateWithAi(int count) {
        // Reuse existing DeepSeek pipeline — verify with grep
        AIGenerationRequest request = AIGenerationRequest.builder()
            .countEasy(3)
            .countMedium(5)
            .countHard(2)
            .scope("all")
            .language("vi")
            .build();

        List<Question> generated = aiGenerator.generate(request);
        if (generated.size() < count) {
            throw new BusinessLogicException(
                "AI_GENERATION_FAILED",
                "Không sinh đủ câu hỏi. Vui lòng thử lại với nguồn Hệ thống."
            );
        }
        Collections.shuffle(generated, random);
        return generated.stream().limit(count).toList();
    }
}
```

**Wire into RoomQuizService:** When a quick-match room starts (`runQuiz`), use `QuickMatchQuestionSourceService.selectQuestions(room.getQuestionSource(), room.getQuestionCount())` to populate `RoomRound` entities BEFORE first `QUESTION_START` emit.

**Existing flow:** Normal rooms use `QuestionSelector` (or whatever name) — quick-match must NOT change that, only adds branch when `room.isQuickMatch()`.

### Tests
- `selectFromDatabase_mixedDifficulty_correctProportions`
- `selectFromDatabase_emptyPool_throws` (edge case for tiny DB)
- `generateWithAi_partialFailure_throws` — mock AI returning <count questions
- `generateWithAi_success_shufflesResult`

### Anti-spoiler verification
**Critical:** verify there's NO endpoint that returns the question list of a quick-match room BEFORE `QUESTION_START` event. Specifically:
- `GET /api/rooms/{id}` — should NOT include questions array (verify current behavior — likely already doesn't)
- `GET /api/rooms/{id}/current-question` — should return 204 until first `QUESTION_START` (verify current behavior)

If audit reveals leak → flag as bug, fix in same commit.

### Commit
```
feat(room): QuickMatchQuestionSourceService for DB and AI sources

- DATABASE source: 30/50/20 difficulty mix, random selection
- AI_GENERATED source: reuse DeepSeek pipeline via AIQuestionGenerator
- Anti-spoiler verified — no pre-game question leak endpoint
- 4 unit tests passing

Spec strategy: no-spec-impact (internal service)
```

### Stop-checkpoint

---

# QP-4 — BE: Daily cap counter (Redis)

### Implementation

`DailyQuickMatchCounter.java`:

```java
@Component
public class DailyQuickMatchCounter {

    private static final int DAILY_CAP = 3;
    private static final String KEY_PREFIX = "quickmatch:daily:";

    private final RedisTemplate<String, String> redis;

    public boolean hasReachedCap(String userId) {
        String key = todayKey(userId);
        String value = redis.opsForValue().get(key);
        int count = value == null ? 0 : Integer.parseInt(value);
        return count >= DAILY_CAP;
    }

    public void increment(String userId) {
        String key = todayKey(userId);
        Long newCount = redis.opsForValue().increment(key);
        if (newCount != null && newCount == 1L) {
            // first increment of the day — set TTL to end-of-UTC-day
            Duration ttl = Duration.between(
                Instant.now(),
                Instant.now().atZone(ZoneOffset.UTC).toLocalDate()
                    .plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()
            );
            redis.expire(key, ttl);
        }
    }

    public int getRemainingToday(String userId) {
        String value = redis.opsForValue().get(todayKey(userId));
        int used = value == null ? 0 : Integer.parseInt(value);
        return Math.max(0, DAILY_CAP - used);
    }

    private String todayKey(String userId) {
        String yyyymmdd = LocalDate.now(ZoneOffset.UTC).format(DateTimeFormatter.BASIC_ISO_DATE);
        return KEY_PREFIX + userId + ":" + yyyymmdd;
    }
}
```

**Expose remaining count to FE** via `GET /api/users/me/multiplayer-stats` response:
- Add field `quickMatchRemainingToday: int` to `WeeklyMultiplayerStatsDTO` (or extract into separate `MultiplayerStatsDTO`)
- Reuse existing endpoint — no new endpoint needed

### Tests
- `hasReachedCap_zeroUsage_false`
- `hasReachedCap_atCap_true`
- `increment_setsTTL_firstTime`
- `increment_doesNotResetTTL_secondTime` — important: second INCR should NOT re-set TTL
- `getRemainingToday_decreasesPerUsage`

### Spec update — inline
SPEC_USER_v3.1 §27.2 update:

```markdown
| GET | `/api/users/me/multiplayer-stats` | Weekly stats + quick-match daily remaining. Response: `{ period, periodStart, wins, totalMatches, winRate, mvpCount, quickMatchRemainingToday }`. |
```

### Commit
```
feat(quickmatch): Redis-backed daily cap counter (3/day/user)

- DailyQuickMatchCounter with INCR + TTL-to-EOD pattern
- Expose remaining count via existing /multiplayer-stats endpoint
- 5 unit tests passing
- Spec: SPEC_USER §27.2 response shape updated

Spec strategy: inline-spec-update
```

### Stop-checkpoint

---

# QP-5 — BE: Quick match start logic + Quản trò controls disabled

### Implementation

Modify `RoomService.startRoom()`:

```java
public void startRoom(String roomId, String userId) {
    Room room = getRoomOrThrow(roomId);
    assertRoomInLobby(room);
    assertEnoughPlayers(room);

    // Quick-match: ANY player can start (not just host)
    if (room.isQuickMatch()) {
        assertUserInRoom(room, userId);
        // ✅ Allow start
    } else {
        // Traditional: only host can start
        assertUserIsHost(room, userId);
    }

    // ... rest unchanged: flip status, emit ROOM_STARTING, schedule runQuiz
}
```

Modify Quản trò control endpoints to reject quick-match:

```java
// In RoomController.java host endpoints (/host/pause, /host/skip-question, etc.)
private void assertNotQuickMatch(Room room) {
    if (room.isQuickMatch()) {
        throw new BusinessLogicException(
            "QUICK_MATCH_NO_HOST_CONTROLS",
            "Quản trò không khả dụng trong phòng Đấu Nhanh"
        );
    }
}

@PostMapping("/{id}/host/pause")
public ResponseEntity<Void> pauseGame(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails user) {
    Room room = roomService.getRoomOrThrow(id);
    assertNotQuickMatch(room);  // NEW guard
    assertUserIsHost(room, user.getId());
    roomService.pauseGame(id);
    return ResponseEntity.ok().build();
}
// Apply to all 5 host endpoints: pause, resume, skip, broadcast, end-early
```

### Tests
- `startRoom_quickMatch_anyPlayerCanStart`
- `startRoom_quickMatch_notInRoom_throws`
- `startRoom_traditional_nonHost_throws` (existing behavior preserved)
- `pauseGame_quickMatch_throws403WithCorrectErrorCode`
- All 5 host endpoints rejecting quick-match — parameterized test

### Spec update — inline
SPEC_MULTIPLAYER §2.5 update existing host section, add subsection §2.5.X:

```markdown
#### Quick Match host semantics (Đấu Nhanh)

When `Room.quickMatch=true`:
- `Room.hostPlaysGame=true` is enforced (host plays).
- `hostId` exists for record-keeping but conveys NO special privilege beyond being a regular player.
- Start permission: ANY player can call `POST /api/rooms/{id}/start` when min 2 players ready.
- Quản trò control endpoints (pause/resume/skip/broadcast/end-early) reject with HTTP 422 `QUICK_MATCH_NO_HOST_CONTROLS`.
- HOST_CHANGED event still fires if host disconnects (per R4) — promote any ACTIVE player. New "host" gains no privileges either.
```

### Commit
```
feat(room): quick-match start permission + disable Quản trò controls

- Any player can start quick-match rooms (when ≥2 ready)
- 5 host control endpoints reject quick-match with QUICK_MATCH_NO_HOST_CONTROLS
- Tests cover both quick-match and traditional rules
- Spec: SPEC_MULTIPLAYER §2.5 quick-match semantics added

Spec strategy: inline-spec-update
```

### Stop-checkpoint

---

# QP-6 — FE: Rename SoloArenaEntryCard → QuickMatchEntryCard + new copy

### Tasks

1. **Rename file** `SoloArenaEntryCard.tsx` → `QuickMatchEntryCard.tsx`
2. **Update component name + exports**
3. **Update copy to "Đấu Nhanh"** content per mockup v3:

```tsx
import { useNavigate } from 'react-router-dom';
import { QUICK_MATCH_COLORS } from '@/theme/modeColors';
import { triggerQuickMatch } from '@/api/rooms';
import { useMultiplayerStats } from '@/queries/users';

export function QuickMatchEntryCard() {
  const navigate = useNavigate();
  const { data: stats } = useMultiplayerStats();
  const remaining = stats?.quickMatchRemainingToday ?? 0;
  const c = QUICK_MATCH_COLORS;

  async function handleClick() {
    try {
      const result = await triggerQuickMatch({ useAi: false });
      navigate(`/room/${result.room.id}/lobby`);
    } catch (e: any) {
      // surface errors: DAILY_CAP_REACHED, AI_TIER_LOCKED, ALREADY_IN_ANOTHER_ROOM
      handleError(e);
    }
  }

  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5 border"
      style={{
        background: `linear-gradient(135deg, ${c.tintBg} 0%, ${c.tintBgSoft} 100%)`,
        borderColor: c.tintBorder,
        boxShadow: `0 0 24px -8px ${c.tintBorder}`,
      }}
    >
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
      />

      <div className="absolute top-5 right-5 flex items-center gap-1 px-2 py-1 rounded-md"
           style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}>
        <span className="material-symbols-outlined text-xs animate-pulse" style={{ color: c.primaryLight }}>
          auto_awesome
        </span>
        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: c.primaryLighter }}>
          Mới
        </span>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
               style={{ background: c.gradient }}>
            <span className="material-symbols-outlined text-white" style={{ fontWeight: 700 }}>
              rocket_launch
            </span>
          </div>
          <div className="text-[10px] tracking-widest uppercase font-bold" style={{ color: c.primaryLighter }}>
            Vào ngay · Không cần host
          </div>
        </div>

        <h2 className="text-[20px] font-extrabold mb-1.5 leading-tight">Đấu Nhanh</h2>
        <p className="text-[12.5px] text-white/65 mb-4 leading-relaxed">
          Server tự điều phối — bạn vào là chơi. Không phải đợi Quản trò, không phải rủ bạn bè.
          Đủ <strong className="text-white">2 người</strong> là game bắt đầu.
        </p>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <SourceTag icon="bolt" label="Speed Race" />
          <SourceTag icon="group" label="2–10 người" />
          <SourceTag icon="casino" label="Random" />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClick}
            disabled={remaining === 0}
            className="flex-1 flex items-center justify-center gap-2 h-11 px-5 rounded-lg font-bold text-[14px] text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: c.gradient }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bolt</span>
            Đấu Nhanh
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
          {/* Settings gear — opens future BL-MP-QM-CUSTOM modal, v1 just visual placeholder */}
          <button
            className="h-11 px-3 rounded-lg bg-white/[0.04] border border-white/10 text-white/40 cursor-not-allowed"
            title="Tùy chỉnh nguồn câu hỏi & cấu hình (sắp ra mắt)"
            disabled
          >
            <span className="material-symbols-outlined text-sm">tune</span>
          </button>
        </div>

        <div className="flex items-center justify-between mt-2.5 text-[10px]">
          <span className="text-white/40">
            Hôm nay: <span className="text-white/60 font-semibold">{3 - remaining}/3</span> trận Đấu Nhanh
          </span>
          <span className="text-white/40">Không tính XP</span>
        </div>
      </div>
    </div>
  );
}

function SourceTag({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            color: '#a5b4fc',
          }}>
      <span className="material-symbols-outlined text-xs">{icon}</span>
      {label}
    </span>
  );
}
```

4. **Rename token const** `SOLO_ARENA_COLORS` → `QUICK_MATCH_COLORS` in `modeColors.ts`. Update all imports.

5. **Update import in Multiplayer.tsx**:
```tsx
// OLD: import { SoloArenaEntryCard } from '@/components/multiplayer/SoloArenaEntryCard';
// NEW: import { QuickMatchEntryCard } from '@/components/multiplayer/QuickMatchEntryCard';
```

### Checklist
- [ ] File renamed (use `git mv` to preserve history)
- [ ] Component name updated
- [ ] All imports updated (grep + replace)
- [ ] Token const renamed across codebase
- [ ] Mockup parity check: NEW badge, rocket icon, copy "Đấu Nhanh", quota indicator
- [ ] Click triggers `POST /api/rooms/quick-match`, navigates to RoomLobby
- [ ] Disabled state when `remaining === 0`
- [ ] Error toasts for DAILY_CAP / TIER_LOCKED / ALREADY_IN_ROOM
- [ ] TS clean, build clean

### Commit
```
refactor(multiplayer): SoloArenaEntryCard → QuickMatchEntryCard

- File rename via git mv (preserves history)
- Copy updated: "Đấu Nhanh" + rocket icon + Speed Race tags
- Click triggers POST /api/rooms/quick-match flow
- Daily quota indicator wired to /multiplayer-stats response

Spec strategy: no-spec-impact (FE refactor only)
```

### Stop-checkpoint

---

# QP-7 — FE: DELETE SoloArenaPlaceholder + route

### Tasks
1. Delete `apps/web/src/pages/SoloArenaPlaceholder.tsx`
2. Remove `/solo-arena` route from router config
3. Grep `solo-arena` and `SoloArena` across codebase — ensure NO references remain (except in audit doc and CLOSED BACKLOG entries which document the pivot history)
4. If any file still imports SoloArenaPlaceholder → fix import or remove dead reference

### Checklist
- [ ] File deleted
- [ ] Route removed
- [ ] `grep -r "solo-arena\|SoloArena" apps/web/src` returns ZERO matches in active source code (only allowed in audit docs / closed backlog entries)
- [ ] Build clean, no broken imports

### Commit
```
chore(routing): remove /solo-arena placeholder route

- SoloArenaPlaceholder.tsx deleted
- Route entry removed
- Concept replaced by Quick Match (BL-MP-QM, see QP-* tasks)

Spec strategy: no-spec-impact
```

### Stop-checkpoint

---

# QP-8 — FE: Update EmptyRoomsState

### Tasks
Per mockup v3, simplify empty state with 2 primary actions instead of mode grid + Solo soft-link:

```tsx
import { useNavigate } from 'react-router-dom';
import { triggerQuickMatch } from '@/api/rooms';
import { QUICK_MATCH_COLORS } from '@/theme/modeColors';

export function EmptyRoomsState() {
  const navigate = useNavigate();
  const c = QUICK_MATCH_COLORS;

  async function handleQuickMatch() {
    try {
      const result = await triggerQuickMatch({ useAi: false });
      navigate(`/room/${result.room.id}/lobby`);
    } catch (e) {
      // handle errors per QP-6 pattern
    }
  }

  return (
    <div className="rounded-2xl p-10 text-center"
         style={{
           background: 'rgba(50,52,64,0.4)',
           backdropFilter: 'blur(12px)',
           border: '1px solid rgba(255,255,255,0.06)',
         }}>
      <div className="max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
             style={{
               background: 'linear-gradient(135deg, rgba(232,168,50,0.12) 0%, rgba(231,194,104,0.06) 100%)',
               border: '1px solid rgba(232,168,50,0.2)',
             }}>
          <span className="material-symbols-outlined text-3xl text-[#e8a832]">auto_awesome</span>
        </div>

        <h4 className="text-[18px] font-bold mb-2">Chưa có phòng nào đang chờ</h4>
        <p className="text-[13px] text-white/55 leading-relaxed mb-6">
          Hai lựa chọn để bắt đầu chơi ngay:
        </p>

        <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
          <button
            onClick={handleQuickMatch}
            className="flex items-center gap-2 px-4 h-11 rounded-lg text-white text-[13px] font-bold hover:opacity-90 transition"
            style={{ background: c.gradient }}
          >
            <span className="material-symbols-outlined text-base">rocket_launch</span>
            Đấu Nhanh — server ghép trận tự động
            <span className="material-symbols-outlined text-sm ml-auto">arrow_forward</span>
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <div className="text-[10px] tracking-widest uppercase text-white/30 font-bold">hoặc</div>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <button
            onClick={() => navigate('/multiplayer/create')}
            className="flex items-center gap-2 px-4 h-11 rounded-lg border text-[#e8a832] text-[13px] font-bold transition"
            style={{
              borderColor: 'rgba(232,168,50,0.3)',
              background: 'linear-gradient(135deg, rgba(232,168,50,0.06) 0%, rgba(231,194,104,0.02) 100%)',
            }}
          >
            <span className="material-symbols-outlined text-base">workspace_premium</span>
            Tạo phòng Quản trò (tùy chỉnh)
            <span className="material-symbols-outlined text-sm ml-auto">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Removed from previous version
- 4-button mode grid (Speed/BR/Team/SD quick-create) — too many CTAs, dilutes focus. Mode selection happens in CreateRoom anyway.
- Solo soft-link section.

### Checklist
- [ ] Empty state shows 2 primary CTAs only
- [ ] Đấu Nhanh button triggers quick-match flow
- [ ] Tạo phòng Quản trò navigates to existing CreateRoom route
- [ ] Visual matches mockup v3 (gold sparkle icon, indigo primary + gold secondary)
- [ ] No leftover Solo Arena references

### Commit
```
refactor(multiplayer): EmptyRoomsState — Đấu Nhanh primary, host secondary

- Simplified from 4-mode-grid + Solo soft-link → 2 clear CTAs
- Primary: Đấu Nhanh (indigo)
- Secondary: Tạo phòng Quản trò (gold border outline)

Spec strategy: no-spec-impact
```

### Stop-checkpoint

---

# QP-9 — FE: QuickMatchRoomCard + RoomsSection integration

### Implementation

`QuickMatchRoomCard.tsx`:

```tsx
import { QUICK_MATCH_COLORS } from '@/theme/modeColors';
import { joinRoomById } from '@/api/rooms';
import { useNavigate } from 'react-router-dom';

interface Props { room: PublicRoomDTO; }

export function QuickMatchRoomCard({ room }: Props) {
  const navigate = useNavigate();
  const c = QUICK_MATCH_COLORS;
  const sourceIcon = room.questionSource === 'AI_GENERATED' ? 'auto_awesome' : 'cpu';
  const sourceLabel = room.questionSource === 'AI_GENERATED' ? 'AI gen câu hỏi' : 'Server điều phối';

  async function handleJoin() {
    await joinRoomById(room.id);
    navigate(`/room/${room.id}/lobby`);
  }

  return (
    <div className="rounded-xl p-5 transition-transform hover:-translate-y-0.5 cursor-pointer relative overflow-hidden"
         style={{
           background: `linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(50,52,64,0.4) 100%)`,
           border: `1px solid ${c.tintBorder}`,
         }}>
      {/* Top-right "ĐẤU NHANH" badge */}
      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md"
           style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}>
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.primaryLighter }}>
          Đấu Nhanh
        </span>
      </div>

      <div className="flex items-start gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
             style={{ background: c.tintBg, border: `1px solid ${c.tintBorder}` }}>
          <span className="material-symbols-outlined" style={{ color: c.primary, fontSize: 18 }}>rocket_launch</span>
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: c.primary }}>
            Speed Race · Không host
          </div>
          <div className="text-[14px] font-bold leading-tight">Phòng #{room.roomCode}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 text-[11px] text-white/55">
        <span className="material-symbols-outlined text-xs" style={{ color: c.primaryLighter }}>
          {sourceIcon}
        </span>
        <span>{sourceLabel} · đang chờ đủ 2 người</span>
      </div>

      <PlayerAvatarsRow room={room} />

      <button
        onClick={handleJoin}
        className="w-full h-9 rounded-lg text-white font-bold text-[12px] hover:opacity-90 transition"
        style={{ background: c.gradient }}
      >
        Vào ngay →
      </button>
    </div>
  );
}
```

**Update `RoomsSection.tsx`** to branch card rendering:

```tsx
{sorted.map(room =>
  room.quickMatch
    ? <QuickMatchRoomCard key={room.id} room={room} />
    : <RoomCard key={room.id} room={room} />
)}
```

**Update `PublicRoomDTO`** to include `quickMatch` field (BE may already include it after QP-1 entity update — verify).

**Update filter chips** — add "Đấu Nhanh" chip first, with indigo accent (chip-quickmatch class):

```tsx
<FilterChip value="QUICK_MATCH" variant="quickmatch" icon="rocket_launch">
  Đấu Nhanh
</FilterChip>
// ... rest of mode chips
```

Filter logic in `RoomsSection`:
```tsx
const filtered = (() => {
  if (filter === 'ALL') return rooms;
  if (filter === 'QUICK_MATCH') return rooms.filter(r => r.quickMatch);
  return rooms.filter(r => !r.quickMatch && r.mode === filter);
})();
```

### Checklist
- [ ] QuickMatchRoomCard renders distinct from RoomCard (indigo accent, "Đấu Nhanh" badge, "#{roomCode}" instead of room name)
- [ ] RoomsSection branches correctly
- [ ] Filter chip "Đấu Nhanh" added first in chip row
- [ ] Filter logic correctly separates quick-match from mode-based filters
- [ ] AI source rooms show different icon (auto_awesome) vs DB source (cpu)
- [ ] PublicRoomDTO includes `quickMatch` boolean field

### Commit
```
feat(multiplayer): QuickMatchRoomCard variant + filter chip

- Distinct visual: indigo accent, "Đấu Nhanh" badge, room code title
- AI source rooms show auto_awesome icon
- New filter chip "Đấu Nhanh" first in chip row
- Filter logic separates quick-match from mode filters

Spec strategy: no-spec-impact
```

### Stop-checkpoint

---

# QP-10 — FE: RoomLobby quick-match variant

### Audit step
Read current `RoomLobby.tsx` — understand current host banner, ready toggle, start button logic.

### Implementation

In `RoomLobby.tsx`, add conditional rendering based on `room.quickMatch`:

```tsx
{room.quickMatch ? (
  <div className="rounded-xl p-4 mb-4 border" style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
        <span className="material-symbols-outlined text-white">rocket_launch</span>
      </div>
      <div>
        <div className="text-[13px] font-bold mb-0.5">Phòng Đấu Nhanh</div>
        <div className="text-[11px] text-white/60">
          Không có Quản trò — bất kỳ ai có thể bấm <strong>Bắt đầu</strong> khi đủ 2 người ready.
          Game tự điều phối, không có pause/skip.
        </div>
      </div>
    </div>
  </div>
) : (
  // Existing Quản trò banner (gold crown) — unchanged
  <QuảnTròBanner room={room} />
)}
```

**Start button logic update:** in quick-match rooms, show Start button to ALL players (not just host) when `readyCount >= 2`:

```tsx
const canStart = room.quickMatch
  ? readyCount >= 2 && currentUserReady
  : isHost && readyCount >= 2; // existing logic

{canStart && (
  <button onClick={handleStart}>Bắt đầu trận</button>
)}
```

**Hide Quản trò-only controls** in quick-match rooms:
- No "Kick player" button (or available to host only — verify spec preference)
- No host control panel (pause/skip/broadcast/end-early)

### Checklist
- [ ] Quick-match rooms show indigo info banner instead of Quản trò gold banner
- [ ] Start button visible to all players in quick-match rooms when 2+ ready
- [ ] Quản trò controls hidden in quick-match rooms
- [ ] Existing traditional room behavior unchanged
- [ ] Visual parity with mockup intent

### Spec update — inline
SPEC_MULTIPLAYER §7.4 — add variant table row:

```markdown
| Quick Match (Đấu Nhanh) | `room.quickMatch === true` | Indigo info banner "Không có Quản trò". Ready toggle for all. Start button visible to ALL when ≥2 ready. No host control panel. No kick button (or host-only — TBD). |
```

### Commit
```
feat(room): RoomLobby quick-match variant

- Indigo info banner replaces Quản trò gold banner when quickMatch=true
- Start button accessible to all players (not just host) at 2+ ready
- Quản trò controls hidden in quick-match rooms
- Spec: SPEC_MULTIPLAYER §7.4 variant table updated

Spec strategy: inline-spec-update
```

### Stop-checkpoint

---

# QP-11 — FE: Quick match API integration helper

### Implementation

Add to `apps/web/src/api/rooms.ts`:

```typescript
export interface QuickMatchRequest {
  useAi?: boolean;
}

export interface RoomJoinResponse {
  success: boolean;
  room: RoomDetailsDTO;
  viewerUserId: string;
  quickMatch?: boolean;  // hint for navigation logic if needed
}

export async function triggerQuickMatch(request: QuickMatchRequest = {}): Promise<RoomJoinResponse> {
  const { data } = await apiClient.post<RoomJoinResponse>('/api/rooms/quick-match', request);
  return data;
}
```

Add error handling helper:

```typescript
export function handleQuickMatchError(error: unknown, toast: ToastFn) {
  const code = (error as any)?.response?.data?.error;
  const message = (error as any)?.response?.data?.message;

  switch (code) {
    case 'DAILY_CAP_REACHED':
      toast.warning(message || 'Đã hết lượt Đấu Nhanh hôm nay');
      break;
    case 'AI_TIER_LOCKED':
      toast.info(message || 'Mở khóa AI từ Tier 4 (Hiền Triết)');
      break;
    case 'ALREADY_IN_ANOTHER_ROOM':
      toast.error('Bạn đang trong phòng khác. Hãy rời phòng cũ trước.');
      break;
    default:
      toast.error(message || 'Không thể vào trận. Vui lòng thử lại.');
  }
}
```

Wire into `QuickMatchEntryCard.tsx` and `EmptyRoomsState.tsx` button handlers.

### Add multiplayer-stats type
Update `MultiplayerStatsDTO` TS type to include `quickMatchRemainingToday`:

```typescript
export interface MultiplayerStatsDTO {
  period: string;
  periodStart: string;
  wins: number;
  totalMatches: number;
  winRate: number;
  mvpCount: number;
  quickMatchRemainingToday: number;  // NEW
}
```

### Checklist
- [ ] `triggerQuickMatch` helper works against BE endpoint
- [ ] Error helper handles all 3 known error codes
- [ ] Type update propagates through `useMultiplayerStats` hook
- [ ] Toasts display in Vietnamese, friendly tone
- [ ] No console errors when calling endpoint

### Commit
```
feat(api): triggerQuickMatch helper + error handling

- Wires FE to POST /api/rooms/quick-match endpoint
- Handles DAILY_CAP_REACHED, AI_TIER_LOCKED, ALREADY_IN_ANOTHER_ROOM
- MultiplayerStatsDTO extended with quickMatchRemainingToday

Spec strategy: no-spec-impact (FE API helper)
```

### Stop-checkpoint

---

# QP-REGRESSION — Full test suite + Playwright smoke

### Tasks
Same protocol as previous prompt regression:
1. BE: `mvn test` — no new failures vs baseline
2. FE: `npm run test` — all green
3. TS: `tsc --noEmit` clean
4. Build: `npm run build` clean
5. Playwright multiplayer module: must include NEW test cases:
   - `W-M05-QM-001`: Click Đấu Nhanh → creates room → lobby → ready → start → game runs
   - `W-M05-QM-002`: Daily cap enforced after 3 sessions
   - `W-M05-QM-003`: AI tier-lock 403 for Tier 3 user
   - `W-M05-QM-004`: Quản trò controls return 422 on quick-match room
   - `W-M05-QM-005`: Any player (not just host) can start quick-match when 2+ ready
6. Manual smoke checklist:
   - [ ] Lobby hero shows Đấu Nhanh card (not Solo)
   - [ ] No `/solo-arena` route accessible
   - [ ] Empty state has 2 CTAs (Đấu Nhanh + Tạo phòng Quản trò)
   - [ ] Click Đấu Nhanh → enters lobby with indigo banner
   - [ ] Daily quota indicator decrements on successful match
   - [ ] Cap reached state: button disabled, friendly tooltip
   - [ ] Tier 3 account: AI not exposed yet (v1 — no UI for AI source, only DB)
   - [ ] Mobile: all redesigned components stack properly

### Commit
```
test(quickmatch): full regression suite

- BE: <X>/<Y> pass (baseline failures preserved)
- FE: all green
- Playwright: W-M05-QM-001..005 new tests passing
- Manual smoke complete

Spec strategy: no-spec-impact
```

---

## Final summary expected from Claude Code

```
✅ QUICK MATCH (ĐẤU NHANH) PIVOT COMPLETE

Commits: <N> commits
LOC: ~<X> added, ~<Y> removed (Solo Arena cleanup)
Files renamed: 1 (SoloArenaEntryCard → QuickMatchEntryCard)
Files deleted: 1 (SoloArenaPlaceholder)
Routes removed: 1 (/solo-arena)

BE changes:
- Migration V<N>: Room.quick_match flag
- New endpoint: POST /api/rooms/quick-match
- New service: QuickMatchQuestionSourceService
- New service: DailyQuickMatchCounter (Redis)
- Modified: startRoom() permission logic
- Modified: 5 host control endpoints reject quick-match

FE changes:
- QuickMatchEntryCard replaces SoloArenaEntryCard (renamed via git mv)
- EmptyRoomsState simplified to 2 CTAs
- QuickMatchRoomCard new variant
- RoomLobby variant with indigo banner

Spec updates:
- SPEC_MULTIPLAYER §2.1 — Room.quickMatch field
- SPEC_MULTIPLAYER §2.5 — Quick match host semantics
- SPEC_MULTIPLAYER §3.6 — Đấu Nhanh mode added
- SPEC_MULTIPLAYER §7.1 — Lobby v3 layout
- SPEC_MULTIPLAYER §7.4 — Quick-match lobby variant
- SPEC_MULTIPLAYER §8 — POST /quick-match endpoint
- SPEC_USER §27.2 — multiplayer-stats response shape
- BACKLOG: BL-MP-SOLO closed, BL-MP-QM completed, BL-MP-QM-CUSTOM added

Test results:
- BE: <X>/<Y> (no new failures)
- FE: <X>/<X>
- Playwright: 5 new W-M05-QM tests green

Open items for Bui:
- Decide tier requirement for AI source UI exposure (v1 hides AI completely, even for Tier 4+ users — needs separate FE work in QP-CUSTOM)
- Schedule BL-MP-QM-CUSTOM (user settings for source/count)
```

---

## Appendix — If divergence found

Same protocol as previous prompt: STOP, flag, wait for Bui input. Pay special attention to:
- AI question generator service interface — if `AIQuestionGenerator` doesn't exist with expected method, flag before QP-3
- Redis wiring — if `RedisTemplate<String,String>` not bean-injectable in expected location, flag before QP-4
- Question source enum — verify `AI_GENERATED` value exists in `QuestionSource` enum

---

**END OF PIVOT PROMPT**
