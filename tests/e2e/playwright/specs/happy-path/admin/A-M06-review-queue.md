# A-M06 — Review Queue (L2 Happy Path)

**Route:** `/admin/review-queue`
**Spec ref:** SPEC_ADMIN §7
**Module priority:** Tier 1 (quality gatekeeping)

---

## API Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/review-queue/pending` | Paginated pending questions |
| POST | `/api/admin/review-queue/{questionId}/approve` | Approve + activate |
| POST | `/api/admin/review-queue/{questionId}/reject` | Reject with comment |
| GET | `/api/admin/review-queue/stats` | Counts by status |
| GET | `/api/admin/review-queue/my-history` | Reviewer's history |

---

## A-M06-L2-001 — GET /pending returns questions với reviewStatus=PENDING

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @review @parallel-safe

**Actions**:
1. `GET /api/admin/review-queue/pending?page=0&size=20`

**API Verification**:
- Paginated response
- All items `reviewStatus === "PENDING"`
- Fields: `id, content, book, difficulty, createdBy, createdAt, aiGenerated`

---

## A-M06-L2-002 — Approve question → isActive=true, reviewStatus=APPROVED

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @review @write @serial

**Setup**:
- Create test question với `reviewStatus: "PENDING"` (POST /admin/questions default)

**Actions**:
1. `POST /api/admin/review-queue/{questionId}/approve` với body `{ "comment": "OK" }`

**API Verification**:
- Response 200
- `GET /api/admin/questions/{id}`:
  - `reviewStatus: "APPROVED"`
  - `isActive: true`
  - `reviewedBy` = admin userId
  - `reviewedAt` ~ now
- Question xuất hiện trong user-facing `/api/questions` pool

**Cleanup**:
- DELETE question

---

## A-M06-L2-003 — Reject question → isActive=false, reviewStatus=REJECTED với comment

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @review @write @serial

**Setup**:
- Create test question

**Actions**:
1. `POST /api/admin/review-queue/{questionId}/reject` với body:
   ```json
   { "comment": "Sai scripture reference, cần fix" }
   ```

**API Verification**:
- Response 200
- `GET /api/admin/questions/{id}`:
  - `reviewStatus: "REJECTED"`
  - `isActive: false`
  - `reviewComment: "Sai scripture reference..."`
  - `reviewedBy`, `reviewedAt` set

**Cleanup**:
- Hard delete via DELETE

---

## A-M06-L2-004 — Reject without comment → 400 (comment required)

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @review @write @serial

**Setup**:
- Create test question

**Actions**:
1. `POST /reject` với empty body `{}`

**API Verification**:
- Response 400 — comment required for reject

**Cleanup**:
- DELETE question

---

## A-M06-L2-005 — Stats endpoint: returns counts per status

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @review @parallel-safe

**Actions**:
1. `GET /api/admin/review-queue/stats`

**API Verification**:
- Response: `{ pending: N, approved: M, rejected: K, totalReviewed: M+K }`
- Counts ≥ 0

---

## A-M06-L2-006 — My history: reviewer sees only own reviews

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @review @parallel-safe

**Actions**:
1. `GET /api/admin/review-queue/my-history`

**API Verification**:
- Response array
- All entries `reviewedBy === current admin userId`

---

## A-M06-L2-007 — Approve sau đó question appears trong pool user

**Priority**: P1
**Est. runtime**: ~8s
**Auth**: admin + regular user
**Tags**: @happy-path @admin @review @write @serial

**Setup**:
- Admin creates question → PENDING

**Actions**:
1. Admin approves
2. Login user test3
3. `GET /api/questions?book=Genesis` (public)

**API Verification**:
- New approved question xuất hiện trong user query (isActive=true)

**Cleanup**:
- Admin DELETE question

---

## A-M06-L2-008 — UI review flow: open queue → approve → count decreases

**Priority**: P0
**Est. runtime**: ~15s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @review @write @serial

**Setup**:
- Create 3 pending questions

**Actions**:
1. `page.goto('/admin/review-queue')`
2. `page.getByTestId('review-queue-pending-count')` → note count N
3. Click approve on first item
4. Verify count becomes N-1

**Assertions** (UI):
- Pending count decrements after each approval
- Row removes from list

**API Verification**:
- Each approve fires POST correctly

**Cleanup**:
- DELETE remaining test questions

---

## NEEDS TESTID Summary (A-M06 L2)

| Element | Suggested testid |
|---------|-----------------|
| Review queue table | `review-queue-table` |
| Pending count | `review-queue-pending-count` |
| Row approve btn | `review-queue-approve-btn` |
| Row reject btn | `review-queue-reject-btn` |
| Reject comment modal | `review-queue-reject-modal` |
| Reject comment input | `review-queue-reject-comment-input` |
| Reject confirm btn | `review-queue-reject-confirm-btn` |

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 6s |
| L2-003 | 6s |
| L2-004 | 4s |
| L2-005 | 4s |
| L2-006 | 5s |
| L2-007 | 8s |
| L2-008 | 15s |
| **Total** | **~52s** |

---

## Summary
- **8 cases**
- **P0**: 4 | **P1**: 4
- **Runtime**: ~52s
