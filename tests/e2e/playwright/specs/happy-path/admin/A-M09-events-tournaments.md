# A-M09 — Events & Tournaments (L2 Happy Path)

**Route:** `/admin/events`
**Spec ref:** SPEC_ADMIN §10
**Module priority:** Tier 3 (read-mostly, create NOT IMPL)

---

## A-M09-L2-001 — List tournaments → returns with status badges

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @events @parallel-safe

**Actions**:
1. `GET /api/tournaments` (read-only public endpoint reused)

**API Verification**:
- Response array: `id, name, status (UPCOMING|IN_PROGRESS|COMPLETED), startTime, endTime, bracketSize, participantCount`

---

## A-M09-L2-002 — Filter by status UPCOMING → only upcoming

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @events @parallel-safe

**Actions**:
1. `GET /api/tournaments?status=UPCOMING`

**API Verification**:
- All items `status === "UPCOMING"`
- Sorted by `startTime` asc

---

## A-M09-L2-003 — Get tournament detail → bracket structure + participants

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @events @parallel-safe

**Preconditions**:
- At least 1 tournament IN_PROGRESS seeded

**Actions**:
1. `GET /api/tournaments/{id}`

**API Verification**:
- Response có `bracket` (nested rounds), `participants[]`, `rules`
- Each match: `matchId, round, player1, player2, winner?, score?`

---

## A-M09-L2-004 — Create tournament → NOT IMPLEMENTED → 404 or 501

**Priority**: P2
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @events @parallel-safe

**Actions**:
1. `POST /api/admin/tournaments` với creation body

**API Verification**:
- [NOT IMPLEMENTED]: endpoint không tồn tại hoặc return 404/501
- Expected behavior: admin hiện chỉ read-only mode trên tournaments

**Notes**:
- Create tournament UI đã documented NOT IMPL trong Phase 2 L1
- L2 confirm backend tương đồng

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 4s |
| L2-003 | 5s |
| L2-004 | 3s |
| **Total** | **~16s** |

---

## Summary
- **4 cases** (read-mostly — create NOT IMPL)
- **P0**: 1 | **P1**: 2 | **P2**: 1
- **Runtime**: ~16s
