# A-M07 — Feedback & Moderation (L2 Happy Path)

**Route:** `/admin/feedback`
**Spec ref:** SPEC_ADMIN §8
**Module priority:** Tier 2 (content ops)

---

## A-M07-L2-001 — List feedback → returns array với filters

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @feedback @parallel-safe

**Actions**:
1. `GET /api/admin/feedback?status=PENDING&page=0&size=20`

**API Verification**:
- Paginated
- Each item: `id, userId, userName, type (BUG|SUGGESTION|OTHER), subject, body, status, createdAt`
- All items have `status === "PENDING"`

---

## A-M07-L2-002 — Filter by type BUG → only bugs

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @feedback @parallel-safe

**Actions**:
1. `GET /api/admin/feedback?type=BUG`

**API Verification**:
- All items `type === "BUG"`

---

## A-M07-L2-003 — Update status PENDING → IN_PROGRESS

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @feedback @write @serial

**Setup**:
- Create feedback via user endpoint hoặc seed

**Actions**:
1. `PATCH /api/admin/feedback/{id}` với body `{ "status": "IN_PROGRESS" }`

**API Verification**:
- Response 200
- `GET /api/admin/feedback/{id}` → `status: "IN_PROGRESS"`

---

## A-M07-L2-004 — Update status → RESOLVED với response

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @feedback @write @serial

**Actions**:
1. `PATCH /api/admin/feedback/{id}` với body:
   ```json
   { "status": "RESOLVED", "response": "Đã fix trong version 2.6" }
   ```

**API Verification**:
- `status: "RESOLVED"`, `response` persisted, `resolvedAt` set

---

## A-M07-L2-005 — Stats: counts by status + type

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @feedback @parallel-safe

**Actions**:
1. `GET /api/admin/feedback/stats`

**API Verification**:
- Response: `{ pending, inProgress, resolved, byType: { BUG, SUGGESTION, OTHER } }`

---

## A-M07-L2-006 — Soft delete feedback → removed from default list

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @feedback @write @serial

**Setup**:
- Create feedback

**Actions**:
1. `DELETE /api/admin/feedback/{id}`

**API Verification**:
- Response 200/204
- Feedback no longer visible in default list (default filter hides deleted)

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 4s |
| L2-003 | 6s |
| L2-004 | 6s |
| L2-005 | 4s |
| L2-006 | 5s |
| **Total** | **~29s** |

---

## Summary
- **6 cases**
- **P0**: 2 | **P1**: 4
- **Runtime**: ~29s
