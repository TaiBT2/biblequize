# W-M07 — Tournaments (L2 Happy Path)

**Routes:** `/tournaments`, `/tournaments/:id`, `/tournaments/:id/match/:matchId`
**Spec ref:** SPEC_USER §5.5
**Module priority:** Tier 3 (lobby only — gameplay deferred to Phase 5 WebSocket)

---

## Scope Note

Per Phase 4 scope: **gameplay 1v1 matches deferred** (WebSocket phase). L2 tests cover:
- List + filter
- Detail page
- Registration flow (if implemented)
- Bracket display (read-only)

---

## W-M07-L2-001 — Tournament list: GET /api/tournaments → array with status badges

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @tournaments @parallel-safe

**Actions**:
1. `GET /api/tournaments`

**API Verification**:
- Response array với fields:
  - `id, name, startTime, endTime, status ("UPCOMING"|"IN_PROGRESS"|"COMPLETED"), bracketSize, participantCount`

---

## W-M07-L2-002 — Filter by status "UPCOMING" → only upcoming visible

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @tournaments @parallel-safe

**Actions**:
1. `page.goto('/tournaments')`
2. Click filter "Sắp diễn ra"

**Assertions**:
- Each visible tournament row → status = UPCOMING

**API Verification**:
- `GET /api/tournaments?status=UPCOMING`

---

## W-M07-L2-003 — Detail page: /tournaments/:id → bracket, participants, rules

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @tournaments @parallel-safe

**Preconditions**:
- Có ít nhất 1 tournament IN_PROGRESS

**Actions**:
1. `page.goto('/tournaments/{id}')`

**Assertions** (UI):
- `expect(page.getByTestId('tournament-bracket')).toBeVisible()`
- `expect(page.getByTestId('tournament-participants')).toBeVisible()`
- `expect(page.getByTestId('tournament-rules')).toBeVisible()`

---

## W-M07-L2-004 — Register for tournament: POST /api/tournaments/{id}/register

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @tournaments @write @serial

**Setup**:
- Create upcoming tournament via seed (if no available) hoặc skip nếu không có test tournament

**Actions**:
1. `POST /api/tournaments/{id}/register`

**API Verification**:
- Response 200 with registration info
- `GET /api/tournaments/{id}/participants` → contains test3 userId

**Cleanup**:
- `DELETE /api/tournaments/{id}/register` (unregister)

**Notes**:
- [NEEDS CODE CHECK]: confirm register endpoint exists

---

## W-M07-L2-005 — Bracket advancement: completed match → winner advances round

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @tournaments @parallel-safe

**Preconditions**:
- Tournament IN_PROGRESS với ít nhất 1 completed match

**Actions**:
1. `GET /api/tournaments/{id}/bracket`

**API Verification**:
- Response có bracket tree với rounds
- Completed match có `winnerId` set
- Winner visible ở next round slot

**Notes**:
- Read-only test, bracket computed server-side

---

## W-M07-L2-006 — Match detail: /tournaments/:id/match/:matchId → participants + score

**Priority**: P2
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @tournaments @parallel-safe

**Actions**:
1. `page.goto('/tournaments/{id}/match/{matchId}')`

**Assertions** (UI):
- Match participants, score, status visible

**Notes**:
- [DEFERRED - WEBSOCKET]: Live match gameplay

---

## NEEDS TESTID Summary (W-M07 L2)

| Element | Suggested testid |
|---------|-----------------|
| Tournament bracket | `tournament-bracket` |
| Participants list | `tournament-participants` |
| Rules section | `tournament-rules` |
| Register button | `tournament-register-btn` |
| Status filter | `tournament-status-filter` |

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 5s |
| L2-003 | 5s |
| L2-004 | 6s |
| L2-005 | 5s |
| L2-006 | 5s |
| **Total** | **~30s** |

---

## Summary
- **6 cases** (matches estimate)
- **P0**: 2 | **P1**: 3 | **P2**: 1
- **Runtime**: ~30s
- **DEFERRED**: Live match gameplay → Phase 5 WebSocket
