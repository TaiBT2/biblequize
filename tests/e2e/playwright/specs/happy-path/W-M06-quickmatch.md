# W-M06-QM — Đấu Nhanh (Quick Match) L2 Happy Path (mode-agnostic)

**Routes:** `/multiplayer`, `/room/:id/lobby`
**API:** `POST /api/rooms/quick-match` (`RoomController.java:132`)
**Spec ref:** SPEC_MULTIPLAYER §3 · PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT.md
**Implementation:** `apps/web/tests/e2e/happy-path/web-user/W-M06-quickmatch.spec.ts`
**Source task:** `docs/todo/active/2026-05-23-e2e-quickmatch-4modes.md` (QM-2)

Mode-specific gameplay (Speed Race scoring, Battle Royale elimination,
Team v Team aggregate, Sudden Death queue) → `W-M06-quickmatch-{mode}.md`.

---

## W-M06-QM-L2-001 — POST quick-match DATABASE returns canonical contract

**Priority:** P0 · **Auth:** tier3 · **Tags:** `@quickmatch @write`

**Actions:** `POST /api/rooms/quick-match` body
```json
{ "mode": "SPEED_RACE", "bookScope": "ALL", "questionCount": 5,
  "timePerQuestion": 30, "source": "DATABASE", "language": "vi" }
```

**Assertions:** 200, `success=true`, `quickMatch=true`, `room.quickMatch=true`, `room.hostPlaysGame=true`, `room.mode=SPEED_RACE`, `room.status=WAITING`, `viewerUserId` truthy, `remainingToday ∈ [0,2]`.

**Cleanup:** `DELETE /api/rooms/{id}`.

---

## W-M06-QM-L2-002 — UI flow modal submit → redirect lobby

**Priority:** P0 · **Auth:** tier3 · **Tags:** `@quickmatch @write`

**Actions:** Goto `/multiplayer` → click `qm-entry-cta` → wait `qm-modal` → click `qm-submit`. Capture POST response.

**Assertions:** Response 200 với `room.quickMatch=true`; URL redirect đến `/room/{id}/lobby`.

---

## W-M06-QM-L2-003 — AI source Tier <4 → AI_TIER_LOCKED (422)

**Priority:** P1 · **Auth:** tier3 · **Tags:** `@quickmatch`

**Actions:** POST quick-match với `source: "AI_GENERATED"`.

**Assertions:** 422, `error=AI_TIER_LOCKED`, `currentTier < 4`.

---

## W-M06-QM-L2-004 — AI source Tier 4+ → KHÔNG TIER_LOCKED (200 hoặc AI_GENERATION_INSUFFICIENT)

**Priority:** P1 · **Auth:** tier4 · **Tags:** `@quickmatch @write`

**Actions:** POST AI_GENERATED với chapter/verse scope.

**Assertions:** Either 200 (AI service ran) hoặc 422 với `error != "AI_TIER_LOCKED"` (test env có thể không có AI provider). Test env-tolerant.

---

## W-M06-QM-L2-005 — Daily cap: 4th call → DAILY_CAP_REACHED

**Priority:** P0 · **Auth:** tier3 · **Tags:** `@quickmatch @write @serial`

**Actions:** Loop 3 POST DATABASE (collect ids hoặc break sớm nếu đã cap). POST lần 4.

**Assertions:** Final POST → 422, `error=DAILY_CAP_REACHED`, `remaining=0`.

**Cleanup:** DELETE tất cả room ids đã tạo trong loop.

---

## W-M06-QM-L2-006 — Counter card cập nhật sau khi tạo trận

**Priority:** P2 · **Auth:** tier3 · **Tags:** `@quickmatch @write`

**Actions:** Goto `/multiplayer`, ghi nhận `data-used`. Skip nếu đã ≥3. POST 1 trận. Reload.

**Assertions:** `qm-entry-counter[data-used]` tăng đúng +1.

---

## W-M06-QM-L2-008 — Soft-host: 2 players join quick-match lobby

**Priority:** P0 · **Auth:** tier3 + tier4 · **Tags:** `@quickmatch @write @softhost`

**Actions:**
1. Player A (tier3): POST quick-match SPEED_RACE → capture `roomCode`.
2. Player B (tier4): POST `/api/rooms/join` với `roomCode`.
3. GET `/api/rooms/{id}`.

**Assertions:** Join 200. Room detail: `quickMatch=true`, `players.length=2`.

**Cleanup:** DELETE room (Player A).

---

## W-M06-QM-L2-009 — Soft-host: non-host /start bypass "chỉ chủ phòng" gate

**Priority:** P0 · **Auth:** tier3 + tier4 · **Tags:** `@quickmatch @write @softhost`

**Actions:**
1. Player A tạo QM room.
2. Player B join.
3. **Player B (non-host)** POST `/api/rooms/{id}/start` (không qua WS ready).

**Assertions:** Status ≠ 200. Message **không match** `/chỉ chủ phòng/i` (chứng tỏ soft-host bypass tại `RoomService:505` được kích hoạt) nhưng match `/sẵn sàng|chơi/i` (dừng ở ready gate hoặc player-count gate — đúng kỳ vọng vì chưa có WS ready).

**Cleanup:** DELETE room.

---

## W-M06-QM-L3-005 — "Đủ 2 người là game bắt đầu" (full WS flow)

**Priority:** P0 · **Auth:** tier3 + tier4 · **Tags:** `@quickmatch @realtime @softhost`

**Status:** `[DEFERRED — WEBSOCKET INFRASTRUCTURE]`

**Actions (planned):**
1. Player A POST quick-match.
2. Player B POST `/api/rooms/join`.
3. Player A + B connect WS `/ws`, send `/app/room/{id}/ready`.
4. Player B (non-host) POST `/api/rooms/{id}/start`.
5. Wait `QUESTION_START` WS event on both sides.

**Assertions:** Step 4 → 200; both contexts receive `QUESTION_START`; `room.status=IN_PROGRESS`.

**Implementation note:** Reuse WS helper từ `W-M06-survival-50p.spec.ts`.

---

## W-M06-QM-L2-007 — questionCount + timePerQuestion clamp out-of-range

**Priority:** P2 · **Auth:** tier3 · **Tags:** `@quickmatch @write`

**Actions:** POST với `questionCount: 999`, `timePerQuestion: 5` (vượt giới hạn 5-20 / 10-60).

**Assertions:** BE coerce về default (10 câu / 30s) per `RoomController.java:153-154`. Skip nếu cap đã hit.
