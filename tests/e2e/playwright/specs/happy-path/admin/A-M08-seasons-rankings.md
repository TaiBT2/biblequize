# A-M08 — Seasons & Rankings (L2 Happy Path)

**Route:** `/admin/rankings`
**Spec ref:** SPEC_ADMIN §9
**Module priority:** Tier 1 (rankings archival)

---

## API Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/seasons` | List all seasons (active + archived) |
| POST | `/api/admin/seasons` | Create new season |
| POST | `/api/admin/seasons/{id}/end` | End active season → archive |
| GET | `/api/admin/seasons/{id}/rankings` | Season final rankings |

---

## A-M08-L2-001 — List seasons → returns active + archived

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @seasons @parallel-safe

**Actions**:
1. `GET /api/admin/seasons`

**API Verification**:
- Response array với each season: `id, name, startDate, endDate, status, participantCount`
- At most 1 active season (others archived)

---

## A-M08-L2-002 — Create new season → status=ACTIVE

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @seasons @write @serial

**Setup**:
- Nếu đã có active season, cần end it trước

**Actions**:
1. `POST /api/admin/seasons` với body:
   ```json
   {
     "name": "Season Test E2E",
     "startDate": "2026-05-01",
     "endDate": "2026-05-31"
   }
   ```

**API Verification**:
- Response 200 với `id`, `status: "ACTIVE"`
- `GET /api/admin/seasons` → new season visible

**Cleanup**:
- End + delete test season

---

## A-M08-L2-003 — Create when already has active season → 409 Conflict

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @seasons @write @serial

**Setup**:
- Ensure 1 active season exists

**Actions**:
1. `POST /api/admin/seasons` với another season config

**API Verification**:
- Response 409 — only 1 active season allowed

---

## A-M08-L2-004 — End active season → status=ARCHIVED, rankings snapshotted

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @seasons @write @serial

**Setup**:
- Create test season với participants (or use current active)

**Actions**:
1. `POST /api/admin/seasons/{id}/end`

**API Verification**:
- Response 200
- `GET /api/admin/seasons/{id}` → `status: "ARCHIVED"`, `endedAt` set
- `GET /api/admin/seasons/{id}/rankings` → snapshot of final rankings

---

## A-M08-L2-005 — Get archived season rankings → top users with points

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @seasons @parallel-safe

**Preconditions**:
- At least 1 archived season với participants

**Actions**:
1. `GET /api/admin/seasons/{archivedId}/rankings?limit=10`

**API Verification**:
- Response array sorted by `points` desc
- Each entry: `rank, userId, userName, points`
- Length ≤ 10

---

## A-M08-L2-006 — End non-existent season → 404

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @seasons @write @serial

**Actions**:
1. `POST /api/admin/seasons/non-existent/end`

**API Verification**:
- Response 404

---

## A-M08-L2-007 — Create season với endDate < startDate → 400

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @seasons @write @serial

**Actions**:
1. POST với `startDate: "2026-06-01", endDate: "2026-05-01"`

**API Verification**:
- Response 400 — date validation

---

## A-M08-L2-008 — UI flow: end active season → archive banner hiển thị

**Priority**: P1
**Est. runtime**: ~10s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @seasons @write @serial

**Actions**:
1. `page.goto('/admin/rankings')`
2. Click "Kết thúc mùa" → confirm modal → confirm
3. Verify active season banner → archived list

**Assertions**:
- Active season banner disappears or shows "No active season"
- Archived list gains 1 entry

---

## NEEDS TESTID Summary (A-M08 L2)

| Element | Suggested testid |
|---------|-----------------|
| Active season banner | `admin-season-active-banner` |
| Create season form | `admin-season-create-form` |
| Season name input | `admin-season-name-input` |
| Start date input | `admin-season-start-input` |
| End date input | `admin-season-end-input` |
| Create submit btn | `admin-season-create-btn` |
| End season btn | `admin-season-end-btn` |
| Archived list | `admin-seasons-archived-list` |

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 5s |
| L2-003 | 5s |
| L2-004 | 6s |
| L2-005 | 4s |
| L2-006 | 3s |
| L2-007 | 3s |
| L2-008 | 10s |
| **Total** | **~40s** |

---

## Summary
- **8 cases**
- **P0**: 3 | **P1**: 5
- **Runtime**: ~40s
