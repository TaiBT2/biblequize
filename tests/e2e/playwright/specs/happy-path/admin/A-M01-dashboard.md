# A-M01 — Admin Dashboard (L2 Happy Path)

**Route:** `/admin`
**Spec ref:** SPEC_ADMIN §2
**Module priority:** Tier 3 (read-heavy dashboard)

---

## A-M01-L2-001 — Dashboard KPI cards: GET /api/admin/dashboard/kpi

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @dashboard @parallel-safe

**Actions**:
1. `GET /api/admin/dashboard/kpi`

**API Verification**:
- Response: `{ totalUsers, dau, mau, totalQuestions, totalSessions, pendingReviews, openFeedback }`
- All values ≥ 0
- `dau` (daily active users) < `mau` (monthly active users)

---

## A-M01-L2-002 — KPI values match underlying data

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @dashboard @parallel-safe

**Actions**:
1. `GET /api/admin/dashboard/kpi` → note totalUsers
2. `GET /api/admin/users` → count totalElements
3. Verify match (tolerance: recent signups in window)

---

## A-M01-L2-003 — Activity log: recent admin actions

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @dashboard @parallel-safe

**Actions**:
1. `GET /api/admin/dashboard/activity?limit=20`

**API Verification**:
- Response array với audit log entries:
  - `actorUserId, action, targetType, targetId, metadata, createdAt`
- Sorted by createdAt desc
- Length ≤ 20

---

## A-M01-L2-004 — Non-admin access → 403

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: fresh login as test3@dev.local (USER role)
**Tags**: @happy-path @admin @security @write @serial

**Actions**:
1. `GET /api/admin/dashboard/kpi` với user (không phải admin) token

**API Verification**:
- Response 403 Forbidden

---

## A-M01-L2-005 — UI: all KPI cards render với real numbers

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @dashboard @parallel-safe

**Actions**:
1. `page.goto('/admin')`

**Assertions**:
- KPI cards visible với numeric values (not "—" or "Loading")
- Activity log shows at least 1 row (if any admin activity exists)

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 6s |
| L2-003 | 4s |
| L2-004 | 4s |
| L2-005 | 5s |
| **Total** | **~23s** |

---

## Summary
- **5 cases**
- **P0**: 2 | **P1**: 3
- **Runtime**: ~23s
