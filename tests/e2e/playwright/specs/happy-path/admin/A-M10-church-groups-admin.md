# A-M10 — Church Groups Admin (L2 Happy Path)

**Route:** `/admin/groups`
**Spec ref:** SPEC_ADMIN §11
**Module priority:** Tier 2 (content ops)

---

## A-M10-L2-001 — List all groups → paginated with member counts

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @groups @parallel-safe

**Actions**:
1. `GET /api/admin/groups?page=0&size=20`

**API Verification**:
- Each group: `id, name, ownerName, memberCount, isLocked, createdAt`

---

## A-M10-L2-002 — Filter locked groups → only locked visible

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @groups @parallel-safe

**Actions**:
1. `GET /api/admin/groups?locked=true`

**API Verification**:
- All items `isLocked: true`

---

## A-M10-L2-003 — Lock group with reason → isLocked=true

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @groups @write @serial

**Setup**:
- Use existing group (test3 owns) hoặc ephemeral

**Actions**:
1. `PATCH /api/admin/groups/{id}/lock` với body:
   ```json
   { "locked": true, "reason": "Vi phạm nội quy cộng đồng" }
   ```

**API Verification**:
- Response 200
- `GET /api/admin/groups/{id}` → `isLocked: true`, `lockReason: "Vi phạm..."`, `lockedAt` set
- Member user thử join/interact → blocked with lock message

**Cleanup**:
- PATCH locked=false

---

## A-M10-L2-004 — Lock with reason < 10 chars → 400

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @groups @write @serial

**Actions**:
1. PATCH với `{ "locked": true, "reason": "Bad" }`

**API Verification**:
- Response 400 — reason validation

---

## A-M10-L2-005 — Unlock group → isLocked=false, reason cleared

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @groups @write @serial

**Setup**:
- Locked group

**Actions**:
1. PATCH với `{ "locked": false }`

**API Verification**:
- `isLocked: false`, `lockReason: null`, `lockedAt: null`

---

## A-M10-L2-006 — Admin delete group → removed permanently

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @groups @write @serial

**Setup**:
- Ephemeral group created via test3

**Actions**:
1. `DELETE /api/admin/groups/{id}`

**API Verification**:
- Response 200/204
- `GET /api/admin/groups/{id}` → 404
- Members no longer see the group trong their list

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 4s |
| L2-003 | 6s |
| L2-004 | 3s |
| L2-005 | 5s |
| L2-006 | 6s |
| **Total** | **~28s** |

---

## Summary
- **6 cases**
- **P0**: 2 | **P1**: 4
- **Runtime**: ~28s
