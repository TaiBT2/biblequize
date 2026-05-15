# PROMPT_MULTIPLAYER_LOBBY_REDESIGN

> **Audience:** Claude Code (autonomous coding agent)
> **Target:** Redesign `/multiplayer` (Phòng Chơi) lobby page
> **Mockup reference:** `docs/MULTIPLAYER/MOCKUP_MULTIPLAYER_LOBBY.html` (Bui approved 2026-05-15)
> **Sprint slot:** UX-polish (chạy trước Sprint 5)
> **Tổng effort dự kiến:** ~2.5 ngày · ~1,200 LOC
> **Spec touch:** SPEC_MULTIPLAYER §7.1 (inline update) + SPEC_USER_v3.1 §27.2 (add 1 endpoint)

---

## 🛑 RULES — READ FIRST

1. **VERIFICATION-FIRST mandatory.** Trước MỌI implementation task, grep/read actual source. Cite `file:line` trong commit message. Nếu Claude Code đoán entity/component/field name → **STOP**, grep lại. Memory đã ghi nhận lịch sử prompt sai tên (`SessionAnswer` vs `Answer`, `GoldButton` không tồn tại, etc.) — không lặp lại.

2. **STOP-CHECKPOINT per task.** Sau MỖI task commit, dừng lại. In ra: `✅ ML-X done. Commit: <hash>. Files changed: <N>. Tests: <pass/total>. Đợi confirmation từ Bui trước khi tiếp tục ML-X+1.`

3. **One commit per task.** Mỗi ML-X = 1 commit riêng, rollback-safe. KHÔNG gộp commits.

4. **Spec update declared per task.** Mỗi task ghi rõ 1 trong 3 strategies: `inline-spec-update` / `new-backlog-entry-BL-X` / `no-spec-impact`.

5. **Pre-existing BE test failures KHÔNG phải regression.** `QuestionReviewControllerTest` + others là baseline broken. Không treat như new failures.

6. **CSS variables BREAK mockup rendering** — luôn hardcode hex values. Memory đã lock.

7. **Material Symbols Outlined production**, NOT Lucide. Mockup dùng Lucide chỉ cho visual reference. Mapping table ở §0.5 dưới.

8. **Be Vietnam Pro dominant.** Cormorant Garamond italic CHỈ dùng cho verse footer/sacred moment — không dùng cho UI elements ở trang này.

---

## 0.1 Canonical Constraints (LOCKED — không đổi không hỏi)

### Mode palette (CRITICAL — Sudden Death đổi color)
| Mode | Color | Hex | Tint background |
|---|---|---|---|
| Speed Race | Sky | `#38bdf8` | `rgba(56,189,248,0.10)` |
| Battle Royale | Red | `#ef4444` | `rgba(239,68,68,0.10)` |
| Team vs Team | Purple | `#a855f7` | `rgba(168,85,247,0.10)` |
| **Sudden Death** | **Amber `#fbbf24`** | `rgba(251,191,36,0.10)` | ⚠️ **KHÔNG dùng `#fb923c`** (đó là streak orange canonical) |

### Solo Arena entry point
| Element | Value |
|---|---|
| Color accent | Indigo `#6366f1` (gradient `#6366f1` → `#818cf8`) |
| Tint background | `rgba(99,102,241,0.12)` |
| Role | **ENTRY POINT only** trên lobby — click → navigate `/solo-arena` |
| KHÔNG là mode 5 trong CreateRoom flow. KHÔNG đụng Quản trò pattern. |

### Brand colors (giữ nguyên canonical)
- Background: `#11131e`
- Gold primary: `#e8a832`
- Gold gradient: `linear-gradient(135deg, #e8a832 0%, #e7c268 100%)`
- Glass card: `rgba(50,52,64,0.4)` + `backdrop-filter: blur(12px)` + `border: 1px solid rgba(255,255,255,0.06)`
- Streak orange (RESERVED — không dùng cho mode badges): `#fb923c`

### 4 modes canonical (page header text)
SPEC_MULTIPLAYER §3 có 5 modes nhưng `GROUP_LIVE_SEQUENTIAL` chỉ tạo từ Group context. Trang `/multiplayer` chỉ show 4: `SPEED_RACE`, `BATTLE_ROYALE`, `TEAM_VS_TEAM`, `SUDDEN_DEATH`. Tagline page: **"4 chế độ"** đúng — giữ.

### Naming
- "Quản trò" — Vietnamese term locked cho host khi `hostPlaysGame=false` (SPEC §2.5)
- "Solo Arena" — EN name OK cho entry point (English-friendly cho gaming feel, đối lập "Phòng Chơi" community feel)

---

## 0.2 Out of scope (đã decided, KHÔNG implement)

| Feature | Lý do defer | Tracker |
|---|---|---|
| "Tìm trận nhanh" button (Quick Match) | Cộng đồng chưa đủ size cho matchmaking. Hide v1. | `BL-MP-QM` (tạo trong ML-0.5) |
| Live activity ticker | Defer cùng Activity Feed Sprint 6. Mock data risk perception. | Sprint 6 |
| Solo Arena page actual implementation | Cần separate spec + prompt. Lobby chỉ build ENTRY POINT card + `/solo-arena` placeholder route. | `BL-MP-SOLO` (tạo trong ML-0.5) |
| Group Live Sequential trong public lobby | Chỉ available qua Group context (SPEC §3.5). | Không cần action — đã canonical |

---

## 0.3 Architecture decisions

### BE-minimal strategy
1 new endpoint duy nhất: `GET /api/users/me/multiplayer-stats?period=weekly`. Tất cả phần còn lại là FE-only.

### File structure target
```
apps/web/src/pages/Multiplayer.tsx          ← refactor major
apps/web/src/components/multiplayer/        ← new folder
  ├── JoinByCodeBar.tsx                     ← thin bar
  ├── CreateRoomHeroCard.tsx                ← gold Quản trò card
  ├── SoloArenaEntryCard.tsx                ← indigo entry card
  ├── ModeShowcaseGrid.tsx                  ← 4 mode cards
  ├── RoomsSection.tsx                      ← filter + list/empty
  ├── RoomCard.tsx                          ← individual room (mode-aware)
  ├── EmptyRoomsState.tsx                   ← empty with quick-create + solo soft-link
  └── WeeklyMultiplayerStatsWidget.tsx      ← sidebar widget
apps/web/src/pages/SoloArenaPlaceholder.tsx ← /solo-arena route (Coming Soon)
apps/api/src/main/java/com/biblequiz/modules/user/
  └── controller/UserController.java        ← add 1 endpoint
  └── service/MultiplayerStatsService.java  ← NEW (or inline in UserService)
```

### Routing
- `/multiplayer` — existing, refactor
- `/solo-arena` — NEW placeholder route (Coming Soon page) — to be replaced later

### Icon mapping (Lucide mockup → Material Symbols production)

| Mockup (Lucide) | Production (Material Symbols Outlined) | Usage |
|---|---|---|
| `crown` | `workspace_premium` | Quản trò badge |
| `swords` | `swords` | Battle Royale + page nav icon |
| `zap` | `bolt` | Speed Race |
| `users-round` | `groups` | Team vs Team |
| `crosshair` | `target` | Sudden Death (NEW — replaces flame to avoid streak color suggestion) |
| `user` | `person` | Solo Arena |
| `users` | `group` | player count |
| `key-round` | `key` | Tham gia mã |
| `sparkles` | `auto_awesome` | NEW badge + empty state |
| `dices` | `casino` | Random source |
| `play` | `play_arrow` | Solo CTA |
| `plus` | `add` | Tạo Phòng CTA |
| `library` | `menu_book` | Bộ câu hỏi |
| `refresh-cw` | `refresh` | Refresh rooms |
| `search` | `search` | Search rooms |
| `arrow-right` | `arrow_forward` | Inline arrows |
| `clock` | `schedule` | Season countdown |
| `wifi` | `wifi` | Realtime tag |
| `layers` | `layers` | "4 chế độ" tag |
| `home` / `bar-chart-3` / `bell` / `book-open` | `home` / `bar_chart` / `notifications` / `menu_book` | Sidebar (giữ nguyên existing nav) |

---

## 0.4 Tasks overview (10 tasks)

| ID | Task | LOC | Spec strategy | Dependencies |
|---|---|---|---|---|
| ML-AUDIT | Audit + grep current Multiplayer.tsx + cite findings | 0 | no-spec-impact | — |
| ML-0.5 | Create BACKLOG entries BL-MP-QM, BL-MP-SOLO | ~20 | inline (BACKLOG.md) | — |
| ML-1 | BE: `/api/users/me/multiplayer-stats` endpoint | ~150 | inline (SPEC_USER §27.2) | — |
| ML-2 | FE: mode color tokens + Material Symbols mapping check | ~50 | no-spec-impact | ML-AUDIT |
| ML-3 | FE: refactor header with live stats pill | ~80 | no-spec-impact | ML-AUDIT, ML-2 |
| ML-4 | FE: `JoinByCodeBar.tsx` (thin bar) | ~120 | no-spec-impact | ML-2 |
| ML-5 | FE: `CreateRoomHeroCard.tsx` + `SoloArenaEntryCard.tsx` | ~280 | inline (SPEC_MULTIPLAYER §7.1) | ML-2 |
| ML-6 | FE: `ModeShowcaseGrid.tsx` (4 cards) | ~150 | no-spec-impact | ML-2 |
| ML-7 | FE: `RoomsSection.tsx` + `RoomCard.tsx` + `EmptyRoomsState.tsx` | ~350 | inline (SPEC_MULTIPLAYER §7.1) | ML-2, ML-6 |
| ML-8 | FE: `WeeklyMultiplayerStatsWidget.tsx` sidebar | ~120 | inline (SPEC_USER §27.2) | ML-1 |
| ML-9 | FE: `/solo-arena` placeholder route | ~80 | no-spec-impact | — |
| ML-REGRESSION | Full test suite + Playwright smoke | 0 | no-spec-impact | All above |

---

# ML-AUDIT — Verify current state before touching anything

**Goal:** Establish baseline. Confirm canonical names, file paths, current behavior.

**No implementation. No commit unless audit report file created.**

### Tasks
1. Read `apps/web/src/pages/Multiplayer.tsx` end-to-end. Note:
   - Current component structure
   - Which hooks/queries it uses
   - Current modes shown (verify == 4 not 5)
   - Current filter chip semantics (memory says "Mới/Sắp đầy/Khó" — confirm)
   - Current empty state implementation
2. Grep `useStomp` usage in this page (per memory, `useWebSocket` deleted in MP-7).
3. Grep current API calls — list every endpoint Multiplayer.tsx hits.
4. Read `apps/web/src/api/rooms.ts` (or equivalent) — list current room-related API functions.
5. Read `apps/api/src/main/java/com/biblequiz/modules/room/controller/RoomController.java` — verify `GET /api/rooms/public` response shape (`PublicRoomDTO` fields).
6. Read `apps/api/src/main/java/com/biblequiz/modules/user/controller/UserController.java` — find current `GET /api/users/me` location to know where to add new stats endpoint.
7. Check Material Symbols loading: grep `material-symbols-outlined` in `apps/web/index.html` to confirm font loaded.
8. Check if any mode-specific color tokens already exist in `apps/web/src/theme/` or `tailwind.config.ts`. If yes → list current values to compare with canonical palette.
9. Check route registration in `main.tsx` / `App.tsx` — note `/multiplayer` exists, `/solo-arena` should NOT exist yet.
10. Read mockup file: `docs/MULTIPLAYER/MOCKUP_MULTIPLAYER_LOBBY.html` (copy from `/mnt/user-data/outputs/MOCKUP_MULTIPLAYER_LOBBY.html` if not there yet). Open in browser, click toggle, verify both states.

### Deliverable

Create `docs/MULTIPLAYER/MULTIPLAYER_LOBBY_REDESIGN_AUDIT.md`:

```markdown
# Multiplayer Lobby Redesign — Audit Findings

## Current state (verified <date>)
- Multiplayer.tsx: <file:line> count
- Current components used: <list>
- Current modes rendered: <list> (should be 4)
- Current filter chips: <list>
- Current API calls: <list>
- Current room card structure: <summary>
- Empty state: <description>
- Material Symbols loaded: <yes/no, where>
- Existing mode color tokens: <list or "none">

## Endpoint shapes verified
- `GET /api/rooms/public` → PublicRoomDTO { ... }
- `POST /api/rooms/join` → ...

## File paths confirmed
- apps/web/src/pages/Multiplayer.tsx
- apps/web/src/components/multiplayer/ → <exists? if not, create>
- apps/api/src/main/java/com/biblequiz/modules/user/controller/UserController.java

## Risks identified
- <any divergence from this prompt's assumptions>

## Ready to proceed? <yes/no>
```

### Stop-checkpoint
Sau audit, print summary và **đợi Bui đọc audit file** trước khi tiếp tục. Nếu phát hiện divergence với prompt → flag rõ, recommend adjustment.

### Commit
```
docs(multiplayer): audit findings for lobby redesign

- Confirmed 4 modes (SPEED_RACE/BATTLE_ROYALE/TEAM_VS_TEAM/SUDDEN_DEATH)
- Confirmed current Multiplayer.tsx structure
- Identified <N> file paths for redesign

Spec strategy: no-spec-impact (audit only)
```

---

# ML-0.5 — Create BACKLOG entries

**Goal:** Track deferred features so they don't get lost.

### Tasks

Edit `BACKLOG.md` (or `docs/BACKLOG.md` — verify location). Add:

```markdown
## BL-MP-QM — Quick Match endpoint

**Status:** Deferred (post-launch)
**Effort:** ~1 day BE + 0.5 day FE
**Trigger:** Implement when DAU > 200 (community size justifies matchmaking)
**Scope:**
- `POST /api/rooms/quick-match` — find best public LOBBY room with slot, or create with user's last preferences
- FE button "Tìm trận nhanh" on Multiplayer hero
**Why deferred:** Current FMC Đà Nẵng community size means quick-match would 80% fall through to CreateRoom anyway. Wait for traffic.

## BL-MP-SOLO — Solo Arena full implementation

**Status:** Scoped, separate prompt needed
**Effort:** ~5–7 days (BE + FE)
**Trigger:** After Sprint 5 (Quiz Set Pro) ships, OR if Phòng Chơi empty-state retention data justifies prioritizing
**Scope:**
- New page `/solo-arena` (replaces placeholder from ML-9)
- BE: `SoloArenaSessionService` (fork ~70% from `RankedSessionService`)
- Question source: RANDOM_DB | AI_GENERATED toggle (tier-locked AI per Bui's recommendation Tier 4+)
- Daily cap 3 sessions (recommended), reset UTC 0h
- No XP, no leaderboard (variety-style)
- Anti-spoiler: lazy server-side selection, per-session seed, no pool preview API
**Pending decisions (need Bui confirm before prompt):**
- Tier-lock for AI source: Tier 4+? Or open all tiers with reduced quota per user?
- Daily cap: 3 sessions/day fixed? Or scale with tier?
- Page name: "Solo Arena" (EN, current) vs "Đấu Trường Solo" (VI) vs "Thử Thách Solo"?
```

### Stop-checkpoint
Print `✅ ML-0.5 done. BACKLOG entries added.` and wait.

### Commit
```
docs(backlog): add BL-MP-QM and BL-MP-SOLO entries

- Quick Match deferred until DAU > 200
- Solo Arena scoped, separate prompt pending

Spec strategy: inline (BACKLOG.md)
```

---

# ML-1 — Backend: `/api/users/me/multiplayer-stats` endpoint

**Goal:** Aggregate weekly multiplayer stats for sidebar widget (replaces meaningless "Vị trí #1").

### Audit step (verification-first)
1. Read `RoomPlayer` entity — confirm `finalRank`, `score`, `room` (with `endedAt`) fields exist.
2. Read `RoomRepository` — find existing queries to model new one after.
3. Read `UserController.java` to find proper location for new endpoint method.
4. Grep "weekly" in existing code — find consistent week-boundary logic (Monday 00:00 UTC? Sunday? — match existing leaderboard period logic).
5. Check `Achievement` entity for MVP achievement category (mentioned SPEC_USER §20.1 "Multiplayer · MVP × N").

### Implementation

**New service** `MultiplayerStatsService.java`:

```java
@Service
public class MultiplayerStatsService {

    private final RoomPlayerRepository roomPlayerRepository;
    private final UserAchievementRepository userAchievementRepository;

    public WeeklyMultiplayerStatsDTO getWeeklyStats(String userId) {
        Instant weekStart = computeWeekStartUTC(); // Monday 00:00 UTC — match existing leaderboard
        Instant now = Instant.now();

        // Query 1: matches in period (room ENDED && room.endedAt > weekStart)
        List<RoomPlayer> weekMatches = roomPlayerRepository
            .findByUserIdAndRoomEndedAtBetween(userId, weekStart, now);

        long totalMatches = weekMatches.size();
        long wins = weekMatches.stream()
            .filter(rp -> rp.getFinalRank() != null && rp.getFinalRank() == 1)
            .count();

        double winRate = totalMatches == 0 ? 0.0 : (double) wins / totalMatches;

        // Query 2: MVP achievements earned this week
        long mvpCount = userAchievementRepository
            .countByUserIdAndAchievementCategoryAndUnlockedAtAfter(
                userId, "MULTIPLAYER_MVP", weekStart);

        return new WeeklyMultiplayerStatsDTO(
            "weekly",
            weekStart,
            wins,
            totalMatches,
            winRate,
            mvpCount
        );
    }

    private Instant computeWeekStartUTC() {
        // VERIFY this matches existing leaderboard week-start logic — grep first
        return Instant.now()
            .atZone(ZoneOffset.UTC)
            .with(DayOfWeek.MONDAY)
            .toLocalDate()
            .atStartOfDay(ZoneOffset.UTC)
            .toInstant();
    }
}
```

**DTO** `WeeklyMultiplayerStatsDTO`:

```java
public record WeeklyMultiplayerStatsDTO(
    String period,
    Instant periodStart,
    long wins,
    long totalMatches,
    double winRate,
    long mvpCount
) {}
```

**Repository methods** to add (verify-first signatures with existing queries):
- `RoomPlayerRepository.findByUserIdAndRoomEndedAtBetween(...)` — use `@Query` with JPQL join on Room
- `UserAchievementRepository.countByUserIdAndAchievementCategoryAndUnlockedAtAfter(...)`

**Controller endpoint** in `UserController.java`:

```java
@GetMapping("/me/multiplayer-stats")
public ResponseEntity<WeeklyMultiplayerStatsDTO> getMyMultiplayerStats(
    @RequestParam(defaultValue = "weekly") String period,
    @AuthenticationPrincipal CustomUserDetails user
) {
    if (!"weekly".equals(period)) {
        throw new BusinessLogicException(
            "INVALID_PERIOD",
            "Currently only 'weekly' period supported"
        );
    }
    return ResponseEntity.ok(
        multiplayerStatsService.getWeeklyStats(user.getId())
    );
}
```

### Tests

`MultiplayerStatsServiceTest.java` — minimum 4 tests:
1. `getWeeklyStats_zeroMatches_returnsZeroes` — user with no matches this week
2. `getWeeklyStats_mixedResults_correctWinRate` — 12 wins / 18 matches = 0.667
3. `getWeeklyStats_onlyCountsCurrentWeek` — matches from last week NOT counted
4. `getWeeklyStats_mvpCount_correctlyJoinsAchievements` — MVP achievements aggregated

### Checklist
- [ ] Verify `RoomPlayer` fields with grep
- [ ] Service + DTO + repository methods created
- [ ] Controller endpoint added
- [ ] Week-start logic matches existing leaderboard convention
- [ ] 4 unit tests pass
- [ ] Full BE test suite pass (pre-existing failures excluded — see Rules §5)
- [ ] Postman/curl smoke: `GET /api/users/me/multiplayer-stats?period=weekly` returns valid JSON for authenticated user

### Spec update — inline

In `SPEC_USER_v3.1.md` §27.2 (User & Profile endpoints), add:

```markdown
| GET | `/api/users/me/multiplayer-stats?period=weekly` | Weekly multiplayer aggregated stats: wins, totalMatches, winRate, mvpCount. Used by Phòng Chơi sidebar widget. |
```

### Commit
```
feat(user): GET /api/users/me/multiplayer-stats weekly endpoint

- New MultiplayerStatsService aggregates weekly wins, winRate, MVP count
- Week boundary = Monday 00:00 UTC (matches leaderboard convention)
- 4 unit tests, all green
- Spec: SPEC_USER_v3.1 §27.2 updated inline

Spec strategy: inline-spec-update
```

### Stop-checkpoint
Print `✅ ML-1 done. BE endpoint ready.` and wait.

---

# ML-2 — Mode color tokens + Material Symbols verify

**Goal:** Centralize mode color values, ensure Material Symbols available.

### Audit step
1. Check `apps/web/src/theme/colors.ts` (or `tailwind.config.ts`) — see how existing colors are defined.
2. Verify `index.html` has Material Symbols Outlined font loaded with proper weight/fill axes.

### Implementation

Create `apps/web/src/theme/modeColors.ts`:

```typescript
/**
 * Mode color palette — canonical per PROMPT_MULTIPLAYER_LOBBY_REDESIGN.md §0.1
 * IMPORTANT: hardcoded hex values, NEVER CSS variables (mockup rendering bug).
 * Sudden Death = amber #fbbf24 (NOT streak orange #fb923c).
 */
export const MODE_COLORS = {
  SPEED_RACE: {
    primary: '#38bdf8',
    tintBg: 'rgba(56,189,248,0.10)',
    tintBorder: 'rgba(56,189,248,0.18)',
    hoverBorder: 'rgba(56,189,248,0.4)',
    label: 'Speed Race',
    icon: 'bolt',
    badge: 'Phổ biến',
    playerRange: '2–10 người',
    description: 'Đáp nhanh, điểm cao. Tốc độ × độ chính xác.',
  },
  BATTLE_ROYALE: {
    primary: '#ef4444',
    tintBg: 'rgba(239,68,68,0.10)',
    tintBorder: 'rgba(239,68,68,0.18)',
    hoverBorder: 'rgba(239,68,68,0.4)',
    label: 'Battle Royale',
    icon: 'swords',
    badge: 'Kịch tính',
    playerRange: '3–20 người',
    description: 'Sai 1 câu là bị loại. Người cuối cùng thắng.',
  },
  TEAM_VS_TEAM: {
    primary: '#a855f7',
    tintBg: 'rgba(168,85,247,0.10)',
    tintBorder: 'rgba(168,85,247,0.18)',
    hoverBorder: 'rgba(168,85,247,0.4)',
    label: 'Team vs Team',
    icon: 'groups',
    badge: 'Nhóm',
    playerRange: '4–20 người',
    description: '2 đội đối kháng. Tổng điểm đội cao hơn thắng.',
  },
  SUDDEN_DEATH: {
    primary: '#fbbf24',  // AMBER — not streak orange #fb923c
    tintBg: 'rgba(251,191,36,0.10)',
    tintBorder: 'rgba(251,191,36,0.18)',
    hoverBorder: 'rgba(251,191,36,0.4)',
    label: 'Sudden Death',
    icon: 'target',
    badge: '1v1',
    playerRange: '2–20 người',
    description: 'Đối đầu 1v1, sai là thua. Hàng đợi thách đấu.',
  },
} as const;

export type RoomMode = keyof typeof MODE_COLORS;

export const SOLO_ARENA_COLORS = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryLighter: '#a5b4fc',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
  tintBg: 'rgba(99,102,241,0.12)',
  tintBgSoft: 'rgba(99,102,241,0.04)',
  tintBorder: 'rgba(99,102,241,0.25)',
} as const;
```

### Material Symbols verify
If `index.html` does NOT have Material Symbols Outlined loaded, add (per existing pattern):

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block" media="print" onload="this.media='all'">
```

Verify existing icon usage pattern in codebase (grep `material-symbols-outlined` to find example component) and follow it exactly.

### Checklist
- [ ] `modeColors.ts` created with all 4 modes + Solo Arena
- [ ] Material Symbols Outlined verified loaded
- [ ] Sample test: render any mode icon (e.g. `<span class="material-symbols-outlined">bolt</span>`) renders correctly
- [ ] No CSS variables introduced — all hex values hardcoded

### Commit
```
feat(theme): add mode color tokens for multiplayer redesign

- modeColors.ts with 4 modes + Solo Arena tokens
- Sudden Death amber #fbbf24 (NOT streak orange #fb923c) — see prompt §0.1
- Material Symbols Outlined verified loaded

Spec strategy: no-spec-impact (design tokens only)
```

### Stop-checkpoint
Print `✅ ML-2 done.` and wait.

---

# ML-3 — Refactor page header with live stats pill

**Goal:** Replace plain "Phòng Chơi" header with branded header + live counts.

### Implementation
In `Multiplayer.tsx`, replace existing header section:

```tsx
<header className="flex items-start justify-between gap-6 mb-5">
  <div>
    <div className="flex items-center gap-2 mb-1">
      <div className="text-[11px] tracking-[0.2em] uppercase text-[#e8a832] font-bold">
        Chế độ Đa người chơi
      </div>
      <span className="w-1 h-1 rounded-full bg-white/30" />
      <div className="flex items-center gap-1.5 text-[11px] text-white/60">
        <LiveDot />
        <span>
          <span className="font-bold text-white">{onlineCount}</span> đang chơi · {' '}
          <span className="font-bold text-white">{publicRoomsCount}</span> phòng đang mở
        </span>
      </div>
    </div>
    <h1 className="text-[34px] font-extrabold tracking-tight leading-tight">
      Phòng Chơi
    </h1>
    <p className="text-[13px] text-white/55 mt-1">
      Realtime · 4 chế độ · Mời bạn bè cùng học Kinh Thánh qua game
    </p>
  </div>

  <div className="flex items-center gap-2 shrink-0 pt-3">
    <Link
      to="/my-sets"
      className="flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgba(50,52,64,0.4)] border border-white/[0.06] text-[13px] font-semibold hover:bg-white/[0.06]"
    >
      <span className="material-symbols-outlined text-base">menu_book</span>
      Bộ câu hỏi
    </Link>
  </div>
</header>
```

`LiveDot` is a small reusable component with the pulse animation from mockup CSS.

### Live stats data source
- `onlineCount`: from existing `WebSocketPresenceService` if exposed, OR derive from `publicRoomsCount * averagePlayersPerRoom`, OR placeholder `0` for v1 (verify-first)
- `publicRoomsCount`: from existing query — count of public LOBBY rooms

**Decision:** If no realtime presence count exists yet → render only `publicRoomsCount` and OMIT `onlineCount` for v1. Don't fake numbers. Add `BL-MP-PRESENCE` BACKLOG entry if needed.

### Checklist
- [ ] Header renders correctly (use React DevTools)
- [ ] Live stats pill shows real data (or gracefully omits if unavailable)
- [ ] Material Symbols icon for `menu_book` renders
- [ ] Mobile responsive (sm: header stacks vertically — test at 640px)

### Commit
```
feat(multiplayer): branded header with live stats pill

- "CHẾ ĐỘ ĐA NGƯỜI CHƠI" uppercase gold tagline
- Live dot + counts: X online · Y rooms open
- "Bộ câu hỏi" button moved to header right (was hero before)

Spec strategy: no-spec-impact
```

### Stop-checkpoint

---

# ML-4 — `JoinByCodeBar.tsx` (thin code input bar)

**Goal:** Move "Tham gia phòng" from big 2/5 card → thin 56px bar above hero.

### Implementation

Create `apps/web/src/components/multiplayer/JoinByCodeBar.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoomByCode } from '@/api/rooms'; // verify import path

export function JoinByCodeBar() {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const code = digits.join('');
  const isComplete = code.length === 6;

  function handleChange(i: number, value: string) {
    const sanitized = value.toUpperCase().slice(-1).replace(/[^A-Z0-9]/g, '');
    const next = [...digits];
    next[i] = sanitized;
    setDigits(next);
    if (sanitized && i < 5) inputRefs.current[i + 1]?.focus();
    setError(null);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  async function handleSubmit() {
    if (!isComplete || submitting) return;
    setSubmitting(true);
    try {
      const result = await joinRoomByCode(code);
      navigate(`/room/${result.room.id}/lobby`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Mã không hợp lệ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-5 rounded-xl border border-[rgba(232,168,50,0.15)] bg-[rgba(232,168,50,0.03)] px-4 py-3 flex items-center gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[rgba(232,168,50,0.12)] flex items-center justify-center">
          <span className="material-symbols-outlined text-sm text-[#e8a832]">key</span>
        </div>
        <div>
          <div className="text-[12px] font-bold leading-tight">Có mã từ bạn bè?</div>
          <div className="text-[10px] text-white/45 leading-tight">
            {error ?? 'Nhập 6 chữ số / chữ cái'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            maxLength={1}
            className="w-9 h-9 bg-[rgba(17,19,30,0.6)] border border-white/[0.08] rounded-lg text-center text-base font-semibold text-white focus:outline-none focus:border-[#e8a832] transition-colors"
            aria-label={`Mã ký tự ${i + 1}`}
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isComplete || submitting}
        className={`ml-auto h-9 px-4 rounded-lg text-[12px] font-semibold transition ${
          isComplete && !submitting
            ? 'bg-gradient-to-br from-[#e8a832] to-[#e7c268] text-[#11131e] hover:opacity-90'
            : 'bg-white/[0.06] border border-white/10 text-white/50 cursor-not-allowed'
        }`}
      >
        {submitting ? 'Đang vào...' : 'Vào phòng →'}
      </button>
    </div>
  );
}
```

### Checklist
- [ ] Component renders inline above hero row
- [ ] 6 inputs auto-focus next on type
- [ ] Backspace moves to previous if empty
- [ ] Submit triggers existing `POST /api/rooms/join` flow
- [ ] Error states display inline (instead of below the bar, to keep height fixed)
- [ ] Disabled state when code incomplete
- [ ] Existing `JoinRoom.tsx` page either deprecated or kept as fallback — confirm with audit findings

### Spec impact
None. SPEC_MULTIPLAYER §7.3 mentions `JoinRoom.tsx` page — if we keep that page, no change. If we deprecate, update spec note.

### Commit
```
feat(multiplayer): thin JoinByCodeBar component

- Replaces 2/5 column join card with 56px-tall inline bar
- 6 separate code inputs with auto-focus + backspace
- Gold-tinted background subtle, doesn't dominate hero

Spec strategy: no-spec-impact
```

### Stop-checkpoint

---

# ML-5 — Hero row: `CreateRoomHeroCard` + `SoloArenaEntryCard`

**Goal:** Replace 60/40 hero with clean 50/50 — gold Create card + indigo Solo Arena card.

### Implementation — CreateRoomHeroCard.tsx

```tsx
import { useNavigate } from 'react-router-dom';

export function CreateRoomHeroCard() {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl p-6 relative overflow-hidden border border-[rgba(232,168,50,0.25)]"
         style={{
           background: 'linear-gradient(135deg, rgba(232,168,50,0.12) 0%, rgba(231,194,104,0.06) 100%)',
           boxShadow: '0 0 24px -8px rgba(232,168,50,0.3)',
         }}>
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(232,168,50,0.15) 0%, transparent 70%)' }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #e8a832 0%, #e7c268 100%)' }}>
            <span className="material-symbols-outlined text-[#11131e]" style={{ fontWeight: 700 }}>
              workspace_premium
            </span>
          </div>
          <div className="text-[10px] tracking-widest uppercase font-bold text-[#e8a832]">
            Bạn sẽ là Quản trò
          </div>
        </div>

        <h2 className="text-[20px] font-extrabold mb-1.5 leading-tight">
          Tạo phòng đa người chơi
        </h2>
        <p className="text-[12.5px] text-white/65 mb-4 leading-relaxed">
          Quản trò không trả lời câu hỏi — bạn dẫn dắt, theo dõi, và đảm bảo công bằng cho người chơi.
          Phù hợp cho nhóm tế bào, Bible study, thi đua bạn bè.
        </p>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <FeatureTag icon="group" label="2–20 người" />
          <FeatureTag icon="layers" label="4 chế độ" />
          <FeatureTag icon="wifi" label="Realtime" />
        </div>

        <button
          onClick={() => navigate('/multiplayer/create')}
          className="flex items-center gap-2 h-11 px-5 rounded-lg font-bold text-[14px] hover:opacity-90 transition text-[#11131e]"
          style={{ background: 'linear-gradient(135deg, #e8a832 0%, #e7c268 100%)' }}
        >
          <span className="material-symbols-outlined" style={{ fontWeight: 700, fontSize: 18 }}>add</span>
          Tạo Phòng
        </button>
      </div>
    </div>
  );
}

function FeatureTag({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="px-2 py-1 rounded-md bg-white/[0.05] text-[10px] font-semibold text-white/60 flex items-center gap-1">
      <span className="material-symbols-outlined text-xs">{icon}</span>
      {label}
    </span>
  );
}
```

**Verify:** route `/multiplayer/create` exists — grep first. If existing route is different (e.g. `/create-room`), use that.

### Implementation — SoloArenaEntryCard.tsx

```tsx
import { useNavigate } from 'react-router-dom';
import { SOLO_ARENA_COLORS } from '@/theme/modeColors';

export function SoloArenaEntryCard() {
  const navigate = useNavigate();
  const c = SOLO_ARENA_COLORS;

  return (
    <div
      onClick={() => navigate('/solo-arena')}
      className="rounded-2xl p-6 relative overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5 border"
      style={{
        background: `linear-gradient(135deg, ${c.tintBg} 0%, ${c.tintBgSoft} 100%)`,
        borderColor: c.tintBorder,
        boxShadow: `0 0 24px -8px ${c.tintBorder}`,
      }}
    >
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full"
        style={{ background: `radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)` }}
      />

      {/* NEW badge with shimmer */}
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
              person
            </span>
          </div>
          <div className="text-[10px] tracking-widest uppercase font-bold" style={{ color: c.primaryLighter }}>
            1 người chơi
          </div>
        </div>

        <h2 className="text-[20px] font-extrabold mb-1.5 leading-tight">Solo Arena</h2>
        <p className="text-[12.5px] text-white/65 mb-4 leading-relaxed">
          Đấu trí 1 mình với câu hỏi ngẫu nhiên.
          Câu hỏi <strong className="text-white">chỉ xuất hiện</strong> khi bạn bấm bắt đầu — không thể xem trước.
        </p>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <SourceTag icon="casino" label="Hệ thống random" />
          <SourceTag icon="auto_awesome" label="AI sinh" />
        </div>

        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-2 h-11 px-5 rounded-lg font-bold text-[14px] text-white hover:opacity-90 transition"
            style={{ background: c.gradient }}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 18 }}>
              play_arrow
            </span>
            Bắt đầu Solo
          </button>
          <span className="text-[10px] text-white/35 text-right leading-tight">
            Không vào<br />leaderboard
          </span>
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

### Use in Multiplayer.tsx

```tsx
<section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
  <CreateRoomHeroCard />
  <SoloArenaEntryCard />
</section>
```

### Checklist
- [ ] Both cards render side-by-side on desktop
- [ ] Stack vertically on mobile (md breakpoint)
- [ ] Gold card "Tạo Phòng" navigates to existing create-room route (verify path with audit)
- [ ] Indigo card "Bắt đầu Solo" + entire card click navigates to `/solo-arena`
- [ ] NEW badge shimmer animation works
- [ ] All hex values hardcoded (no Tailwind arbitrary CSS vars)

### Spec update — inline

In `SPEC_MULTIPLAYER.md` §7.1 (Multiplayer page), update:

```markdown
### 7.1 Multiplayer (`pages/Multiplayer.tsx`) — redesigned 2026-05-XX

Landing page chế độ multiplayer. Layout v2:

1. **Header** — branded uppercase tagline + live stats pill (online count + rooms open)
2. **JoinByCodeBar** — thin gold-tinted bar 56px, 6-digit input + "Vào phòng" button
3. **Hero row 50/50:**
   - `CreateRoomHeroCard` (gold) — "Bạn sẽ là Quản trò" + Tạo Phòng CTA
   - `SoloArenaEntryCard` (indigo) — entry point to `/solo-arena` page (Solo Arena spec separate)
4. **ModeShowcaseGrid** — 4 mode cards (Speed Race / Battle Royale / Team vs Team / Sudden Death). NOTE: GROUP_LIVE_SEQUENTIAL excluded — chỉ tạo từ Group context (§3.5).
5. **RoomsSection** — filter chips by mode + sort + empty state with quick-create per mode + Solo Arena soft-link
```

### Commit
```
feat(multiplayer): hero row redesign — Quản trò + Solo Arena cards

- CreateRoomHeroCard (gold, 1/2 width) — clear Quản trò positioning
- SoloArenaEntryCard (indigo, 1/2 width, NEW) — entry to /solo-arena
- Replaces previous 2/5 join card (moved to JoinByCodeBar in ML-4)
- Spec: SPEC_MULTIPLAYER §7.1 updated inline

Spec strategy: inline-spec-update
```

### Stop-checkpoint

---

# ML-6 — `ModeShowcaseGrid.tsx` (4 mode cards)

### Implementation

Create `apps/web/src/components/multiplayer/ModeShowcaseGrid.tsx`:

```tsx
import { MODE_COLORS, RoomMode } from '@/theme/modeColors';

const MODE_ORDER: RoomMode[] = ['SPEED_RACE', 'BATTLE_ROYALE', 'TEAM_VS_TEAM', 'SUDDEN_DEATH'];

export function ModeShowcaseGrid() {
  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="text-[18px] font-bold tracking-tight">4 chế độ chơi</h3>
          <p className="text-[12px] text-white/50">
            Mỗi mode có luật & cách tính điểm riêng — chọn mode phù hợp khi tạo phòng
          </p>
        </div>
        <a href="/multiplayer/rules" className="text-[12px] text-[#e8a832] font-semibold hover:underline">
          Xem chi tiết luật chơi →
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MODE_ORDER.map((mode) => (
          <ModeCard key={mode} mode={mode} />
        ))}
      </div>
    </section>
  );
}

function ModeCard({ mode }: { mode: RoomMode }) {
  const c = MODE_COLORS[mode];
  return (
    <button
      className="rounded-xl p-5 border text-left transition-all hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, ${c.tintBg} 0%, ${c.tintBg.replace('0.10', '0.02')} 100%)`,
        borderColor: c.tintBorder,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = c.hoverBorder)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = c.tintBorder)}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="material-symbols-outlined text-3xl" style={{ color: c.primary }}>
          {c.icon}
        </span>
        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: c.primary }}>
          {c.badge}
        </span>
      </div>
      <h4 className="text-[15px] font-bold mb-1">{c.label}</h4>
      <p className="text-[11px] text-white/55 leading-relaxed mb-3">{c.description}</p>
      <div className="flex items-center gap-1.5 text-[10px] text-white/40">
        <span className="material-symbols-outlined text-xs">group</span>
        <span>{c.playerRange}</span>
      </div>
    </button>
  );
}
```

Optional behavior: click mode card → navigate `/multiplayer/create?mode=<MODE>` to pre-fill mode in CreateRoom form. Verify pre-fill mechanism exists in CreateRoom.tsx (SPEC §7.2 mentions `location.state.prefill`).

### Checklist
- [ ] 4 cards render with canonical colors (Sudden Death = `#fbbf24`, NOT `#fb923c`)
- [ ] Material Symbols icons render correctly per mapping
- [ ] Hover state changes border color smoothly
- [ ] Mobile: 2 columns at sm, 4 at md+
- [ ] Click navigates to create-room with mode pre-fill (or just `/multiplayer/create` if pre-fill not implementable in scope)

### Commit
```
feat(multiplayer): 4-card mode showcase grid

- Renders SPEED_RACE / BATTLE_ROYALE / TEAM_VS_TEAM / SUDDEN_DEATH
- Click → CreateRoom with mode pre-fill (if supported, else default route)
- Sudden Death amber #fbbf24 (canonical, not streak orange)

Spec strategy: no-spec-impact
```

### Stop-checkpoint

---

# ML-7 — `RoomsSection` + `RoomCard` + `EmptyRoomsState`

**Goal:** Replace current rooms list with mode-aware cards + improved filter chips + actionable empty state.

### Audit step
1. Read current `getPublicRooms()` API call — confirm response shape includes `mode`, `roomCode`, `hostName`, `currentPlayers`, `maxPlayers`, `questionCount`, `timePerQuestion`, `difficulty`, `groupId/groupName`, etc.
2. Check if `joinable` field exists per SPEC §8 — affects button state.

### Implementation — RoomsSection.tsx

```tsx
import { useState } from 'react';
import { usePublicRooms } from '@/queries/rooms'; // verify hook name
import { RoomMode, MODE_COLORS } from '@/theme/modeColors';
import { RoomCard } from './RoomCard';
import { EmptyRoomsState } from './EmptyRoomsState';

type Filter = 'ALL' | RoomMode;
type Sort = 'NEWEST' | 'FILLING_UP';

export function RoomsSection() {
  const { data: rooms = [], isLoading, refetch } = usePublicRooms();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [sort, setSort] = useState<Sort>('NEWEST');

  const filtered = filter === 'ALL' ? rooms : rooms.filter(r => r.mode === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'NEWEST') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // FILLING_UP: highest fill ratio first
    return (b.currentPlayers / b.maxPlayers) - (a.currentPlayers / a.maxPlayers);
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-[18px] font-bold tracking-tight">Phòng đang chờ</h3>
          <LiveBadge count={rooms.length} />
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon="refresh" onClick={() => refetch()} />
          <IconButton icon="search" onClick={() => {/* TODO search */}} />
        </div>
      </div>

      <FilterChips filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} />

      {sorted.length === 0 ? (
        <EmptyRoomsState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sorted.map(room => <RoomCard key={room.id} room={room} />)}
        </div>
      )}
    </section>
  );
}
```

### Implementation — RoomCard.tsx

Per-mode variant. Verify with mockup. Sudden Death uses amber avatars, Team vs Team shows split A/B mini-display, etc.

```tsx
import { MODE_COLORS } from '@/theme/modeColors';
import { joinRoomById } from '@/api/rooms';
import { useNavigate } from 'react-router-dom';

export function RoomCard({ room }: { room: PublicRoomDTO }) {
  const c = MODE_COLORS[room.mode];
  const navigate = useNavigate();
  const fillRatio = room.currentPlayers / room.maxPlayers;
  const isNearlyFull = fillRatio >= 0.8;

  return (
    <div className="rounded-xl p-5 transition-all hover:-translate-y-0.5"
         style={{
           background: 'rgba(50,52,64,0.4)',
           backdropFilter: 'blur(12px)',
           border: '1px solid rgba(255,255,255,0.06)',
         }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center border"
               style={{ background: c.tintBg, borderColor: c.tintBorder }}>
            <span className="material-symbols-outlined" style={{ color: c.primary, fontSize: 18 }}>
              {c.icon}
            </span>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: c.primary }}>
              {c.label}
            </div>
            <div className="text-[14px] font-bold leading-tight">{room.roomName}</div>
          </div>
        </div>
        <StatusBadge isNearlyFull={isNearlyFull} />
      </div>

      <div className="flex items-center gap-2 mb-3 text-[11px] text-white/55">
        <span className="material-symbols-outlined text-xs text-[#e8a832]">workspace_premium</span>
        <span>{room.hostName} {!room.hostPlaysGame && '(Quản trò)'}</span>
        {room.groupName && (
          <>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="material-symbols-outlined text-xs">groups</span>
            <span className="text-[#a855f7]">{room.groupName}</span>
          </>
        )}
      </div>

      {/* Mode-aware body */}
      {room.mode === 'TEAM_VS_TEAM' ? (
        <TeamSplit room={room} />
      ) : (
        <PlayerAvatarsRow room={room} />
      )}

      <button
        onClick={async () => {
          const result = await joinRoomById(room.id);
          navigate(`/room/${room.id}/lobby`);
        }}
        disabled={!room.joinable}
        className="w-full h-9 rounded-lg font-bold text-[12px] text-[#11131e] hover:opacity-90 transition"
        style={{ background: 'linear-gradient(135deg, #e8a832 0%, #e7c268 100%)' }}
      >
        {ctaTextForMode(room.mode)} →
      </button>
    </div>
  );
}

function ctaTextForMode(mode: RoomMode): string {
  switch (mode) {
    case 'TEAM_VS_TEAM': return 'Chọn đội';
    case 'SUDDEN_DEATH': return 'Vào hàng đợi';
    default: return 'Tham gia';
  }
}
```

### Implementation — EmptyRoomsState.tsx

```tsx
import { useNavigate } from 'react-router-dom';
import { MODE_COLORS, RoomMode } from '@/theme/modeColors';

const MODES_FOR_QUICK_CREATE: RoomMode[] = ['SPEED_RACE', 'BATTLE_ROYALE', 'TEAM_VS_TEAM', 'SUDDEN_DEATH'];

export function EmptyRoomsState() {
  const navigate = useNavigate();

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

        <h4 className="text-[18px] font-bold mb-2">Hãy là phòng đầu tiên hôm nay!</h4>
        <p className="text-[13px] text-white/55 leading-relaxed mb-6">
          Chưa có phòng đang chờ. Tạo một phòng và mời bạn bè — chỉ mất 30 giây để bắt đầu trận đấu.
        </p>

        <div className="text-[10px] tracking-widest uppercase text-white/40 font-bold mb-3">
          Tạo nhanh theo chế độ
        </div>
        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto mb-6">
          {MODES_FOR_QUICK_CREATE.map(mode => {
            const c = MODE_COLORS[mode];
            return (
              <button
                key={mode}
                onClick={() => navigate(`/multiplayer/create?mode=${mode}`)}
                className="flex items-center gap-2 px-3 h-10 rounded-lg border text-[12px] font-semibold transition-colors"
                style={{ background: c.tintBg, borderColor: c.tintBorder, color: 'white' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = c.hoverBorder)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = c.tintBorder)}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: c.primary }}>
                  {c.icon}
                </span>
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Solo Arena soft-link */}
        <div className="pt-5 border-t border-white/[0.06]">
          <div className="text-[11px] text-white/45 mb-2">Không có ai online?</div>
          <button
            onClick={() => navigate('/solo-arena')}
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#a5b4fc] hover:text-[#818cf8]"
          >
            <span className="material-symbols-outlined text-sm">person</span>
            Thử Solo Arena — chơi 1 mình
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Checklist
- [ ] Filter chips: All + 4 mode chips + Newest/Filling Up
- [ ] Active chip uses gold accent
- [ ] RoomCard renders mode-aware (Sudden Death = amber avatars, Team = split A/B)
- [ ] Group rooms show "FMC Đà Nẵng" or similar group name in purple
- [ ] Empty state has 4 mode quick-create + Solo soft-link
- [ ] Loading state (skeleton) handled — verify existing pattern in codebase
- [ ] Mobile: rooms grid stacks to single column

### Commit
```
feat(multiplayer): RoomsSection + mode-aware RoomCard + EmptyRoomsState

- Filter chips by mode (Speed/BR/Team/SD) replacing vague "Mới/Sắp đầy/Khó"
- Mode-aware card variants: Team split A/B, SD queue label
- Empty state: 4 quick-create + Solo Arena soft-link
- Spec: SPEC_MULTIPLAYER §7.1 detail filled in

Spec strategy: inline-spec-update
```

### Stop-checkpoint

---

# ML-8 — `WeeklyMultiplayerStatsWidget.tsx` sidebar widget

**Goal:** Replace meaningless "Vị trí #1" with multiplayer-context stats from ML-1 endpoint.

### Implementation

```tsx
import { useQuery } from '@tanstack/react-query';
import { fetchWeeklyMultiplayerStats } from '@/api/users';

export function WeeklyMultiplayerStatsWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['multiplayer-stats', 'weekly'],
    queryFn: () => fetchWeeklyMultiplayerStats('weekly'),
    staleTime: 60_000, // 1 min
  });

  if (isError) return null; // gracefully hide if BE not ready
  if (isLoading) return <WidgetSkeleton />;

  const winRatePct = Math.round((data?.winRate ?? 0) * 100);

  return (
    <div className="mx-3 mt-6 p-4 rounded-xl"
         style={{
           background: 'rgba(50,52,64,0.4)',
           backdropFilter: 'blur(12px)',
           border: '1px solid rgba(255,255,255,0.06)',
         }}>
      <div className="text-[10px] tracking-widest uppercase text-[#38bdf8] font-bold mb-2">
        Tuần này
      </div>
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-[26px] font-extrabold leading-none">{data?.wins ?? 0}</div>
        <div className="text-[10px] text-white/50">trận thắng</div>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between text-white/70">
          <span>Tỷ lệ thắng</span>
          <span className="font-bold text-white">{winRatePct}%</span>
        </div>
        <div className="flex justify-between text-white/70">
          <span>MVP</span>
          <span className="font-bold text-[#e8a832]">×{data?.mvpCount ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
```

### Insertion point
In sidebar component (find via grep — likely `AppLayout.tsx` or `Sidebar.tsx`), add WeeklyMultiplayerStatsWidget **only when current route is `/multiplayer`** (don't show on every page).

Strategy:
```tsx
const location = useLocation();
const isMultiplayerRoute = location.pathname.startsWith('/multiplayer');

{isMultiplayerRoute && <WeeklyMultiplayerStatsWidget />}
```

This is conditional rendering — no breaking change for other pages.

### Checklist
- [ ] Widget renders on `/multiplayer` only
- [ ] Loading skeleton shows briefly
- [ ] Error state: widget hidden gracefully (no scary error)
- [ ] Values match BE endpoint response
- [ ] Layout matches mockup (#38bdf8 sky accent for "Tuần này" label)

### Commit
```
feat(multiplayer): sidebar Tuần này stats widget

- Replaces generic "Vị trí #1" with multiplayer-context stats
- Shows weekly wins, win rate, MVP count
- Conditional render on /multiplayer route only
- Wired to GET /api/users/me/multiplayer-stats (ML-1)

Spec strategy: inline-spec-update (SPEC_USER §27.2)
```

### Stop-checkpoint

---

# ML-9 — `/solo-arena` placeholder route

**Goal:** Solo Arena entry card needs a valid navigation target. Build a Coming Soon page.

### Implementation

Create `apps/web/src/pages/SoloArenaPlaceholder.tsx`:

```tsx
import { useNavigate } from 'react-router-dom';

export function SoloArenaPlaceholder() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: '#11131e' }}>
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
             style={{
               background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
             }}>
          <span className="material-symbols-outlined text-white text-4xl">person</span>
        </div>

        <div className="text-[11px] tracking-[0.2em] uppercase text-[#a5b4fc] font-bold mb-2">
          Sắp ra mắt
        </div>
        <h1 className="text-[32px] font-extrabold mb-3 text-white">Solo Arena</h1>
        <p className="text-[14px] text-white/65 mb-6 leading-relaxed">
          Chế độ chơi 1 mình với câu hỏi ngẫu nhiên từ hệ thống hoặc AI sinh.
          Đang được xây dựng — sẽ ra mắt trong sprint tới.
        </p>

        <button
          onClick={() => navigate('/multiplayer')}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-lg font-bold text-[14px] text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay về Phòng Chơi
        </button>
      </div>
    </div>
  );
}
```

### Route registration
In `main.tsx` (or wherever routes are defined), add:

```tsx
<Route path="/solo-arena" element={<SoloArenaPlaceholder />} />
```

### Checklist
- [ ] Route accessible at `/solo-arena`
- [ ] Page renders Coming Soon message
- [ ] Back button navigates to `/multiplayer`
- [ ] Page uses Sacred Modernist + indigo accent (consistent with Solo Arena card)
- [ ] No console errors

### Commit
```
feat(routing): /solo-arena placeholder route (Coming Soon)

- Lobby Solo Arena card and empty-state soft-link now have valid target
- Full Solo Arena implementation tracked in BL-MP-SOLO

Spec strategy: no-spec-impact
```

### Stop-checkpoint

---

# ML-REGRESSION — Full test suite + E2E smoke

**Goal:** Ensure no regression in existing flows.

### Tasks
1. Backend tests: `mvn test` — note pre-existing failures (Rules §5), confirm no NEW failures.
2. Frontend unit tests: `npm run test` — full suite must pass.
3. TypeScript: `tsc --noEmit` — 0 errors.
4. Build: `npm run build` — 0 errors.
5. Playwright smoke (4-tier per memory):
   - Tier 1: Vitest unit pass
   - Tier 2: pages/ tests pass
   - Tier 3: full FE tests pass
   - Tier 4: Playwright smoke — run multiplayer module tests
6. Manual smoke on `/multiplayer`:
   - Empty state renders correctly with Solo soft-link
   - Populated state shows mode-aware cards
   - Filter chips work
   - JoinByCodeBar accepts 6-char input + submits
   - Solo Arena card navigates to `/solo-arena` placeholder
   - Tạo Phòng navigates to CreateRoom
   - Sidebar shows Weekly stats widget
   - Mobile responsive (test at 375px, 768px, 1280px)

### Checklist
- [ ] No new BE test failures vs baseline
- [ ] All FE tests green
- [ ] TypeScript clean
- [ ] Build clean
- [ ] Playwright multiplayer module smoke pass
- [ ] Manual smoke checklist pass
- [ ] No console errors/warnings on `/multiplayer`

### Commit
```
test(multiplayer): regression suite passes for lobby redesign

- BE: <X>/<Y> pass (no new failures vs baseline)
- FE: <X>/<X> pass
- TypeScript clean, build clean
- Playwright multiplayer smoke green
- Manual smoke checklist verified

Spec strategy: no-spec-impact
```

---

## Final summary expected from Claude Code

After ML-REGRESSION, print a summary:

```
✅ MULTIPLAYER LOBBY REDESIGN COMPLETE

Commits: <N> commits, all green
LOC: ~<X> lines added, ~<Y> lines deleted
Files changed: <list>

Spec updates:
- SPEC_MULTIPLAYER.md §7.1 — Multiplayer page architecture v2 (ML-5, ML-7)
- SPEC_USER_v3.1.md §27.2 — added multiplayer-stats endpoint (ML-1)
- BACKLOG.md — added BL-MP-QM, BL-MP-SOLO (ML-0.5)

Open items requiring Bui input:
- Solo Arena scope decisions (XP impact, AI tier-lock, daily cap, page name)
- Decide when to schedule BL-MP-SOLO sprint
- Decide when to schedule BL-MP-QM (post-launch)

Mockup parity check:
- [✓] Thin code bar
- [✓] Hero 50/50 (Quản trò + Solo Arena)
- [✓] 4 mode cards with canonical colors (SD = amber)
- [✓] Empty state with quick-create + Solo soft-link
- [✓] Sidebar Weekly widget
- [✓] /solo-arena placeholder
- [✓] No Quick Match button
- [✓] No activity ticker
```

---

## Appendix A — If Claude Code finds a divergence

If audit (ML-AUDIT) finds something that contradicts this prompt:

1. **DO NOT proceed silently.** STOP.
2. Print: `⚠️ Divergence found: <description>`
3. Suggest options:
   - Option A: adjust prompt assumption, proceed with new info
   - Option B: rollback prompt scope to match codebase
   - Option C: defer task until clarification
4. Wait for Bui input before next task.

Example: if audit finds current Multiplayer.tsx has a feature this prompt didn't account for (e.g., existing peer-challenge widget), don't delete it — flag it.

---

## Appendix B — Commit message convention

All commits in this prompt MUST end with one of:
- `Spec strategy: inline-spec-update` (spec file modified in same commit)
- `Spec strategy: new-backlog-entry-BL-<X>` (BACKLOG.md updated)
- `Spec strategy: no-spec-impact` (refactor/UI tweak only)

Memory locked this convention. Auditor scripts may grep for it.

---

**END OF PROMPT**
