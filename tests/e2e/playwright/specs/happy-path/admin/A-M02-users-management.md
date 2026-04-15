# A-M02 — Users Management (L2 Happy Path)

**Route:** `/admin/users`
**Spec ref:** SPEC_ADMIN §3
**Module priority:** Tier 1 (ban/role operations)

---

## API Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/users` | Paginated list with search/filter |
| GET | `/api/admin/users/{id}` | User detail |
| PATCH | `/api/admin/users/{id}/role` | Change role USER↔ADMIN |
| PATCH | `/api/admin/users/{id}/ban` | Ban/unban with reason |

---

## A-M02-L2-001 — List users paginated → returns with totalElements

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @users @parallel-safe

**Actions**:
1. `GET /api/admin/users?page=0&size=20`

**API Verification**:
- Response paginated với `content[]`, `totalElements`, `totalPages`
- Each user: `id, email, name, role, status, totalPoints, currentTier, lastPlayedAt`

---

## A-M02-L2-002 — Search by email → returns matching user

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @users @parallel-safe

**Actions**:
1. `GET /api/admin/users?search=test3@dev.local`

**API Verification**:
- `content[0].email === "test3@dev.local"`
- `totalElements >= 1`

---

## A-M02-L2-003 — Get user detail → returns full profile

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @users @parallel-safe

**Actions**:
1. `GET /api/admin/users/{test3UserId}`

**API Verification**:
- Full user object including stats, streak, bookmarks count, etc.

---

## A-M02-L2-004 — Change role USER → ADMIN → PATCH persists

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @users @write @serial

**Setup**:
- Use ephemeral user (created via seed API) để tránh affect test accounts

**Actions**:
1. `PATCH /api/admin/users/{ephemeralUserId}/role` với body `{ "role": "ADMIN" }`

**API Verification**:
- Response 200
- `GET /api/admin/users/{id}` → `role: "ADMIN"`

**Cleanup**:
- PATCH role back to "USER" (or delete ephemeral user)

---

## A-M02-L2-005 — Change role to invalid value → 400

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @users @write @serial

**Actions**:
1. `PATCH /api/admin/users/{id}/role` với body `{ "role": "SUPERUSER" }` (invalid)

**API Verification**:
- Response 400

---

## A-M02-L2-006 — Ban user with reason → status=BANNED

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @users @write @serial

**Setup**:
- Ephemeral user

**Actions**:
1. `PATCH /api/admin/users/{id}/ban` với body:
   ```json
   { "banned": true, "reason": "Vi phạm điều khoản cộng đồng nhiều lần" }
   ```

**API Verification**:
- Response 200
- `GET /api/admin/users/{id}` → `status: "BANNED"`, `banReason: "Vi phạm..."`, `bannedAt` set
- Banned user subsequent login → 403 hoặc error message

**Cleanup**:
- PATCH ban=false

---

## A-M02-L2-007 — Ban với reason < 10 chars → 400 (validation)

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @users @write @serial

**Actions**:
1. `PATCH /ban` với body `{ "banned": true, "reason": "Bad" }` (3 chars)

**API Verification**:
- Response 400 — reason min 10 chars

---

## A-M02-L2-008 — Unban user → status=ACTIVE

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @users @write @serial

**Setup**:
- User đang bị ban

**Actions**:
1. `PATCH /api/admin/users/{id}/ban` với body `{ "banned": false }`

**API Verification**:
- Response 200
- `status: "ACTIVE"`, `bannedAt: null`, `banReason: null`

---

## NEEDS TESTID Summary (A-M02 L2)

| Element | Suggested testid |
|---------|-----------------|
| Users table | `admin-users-table` |
| Search input | `admin-users-search-input` |
| Role filter | `admin-users-role-filter` |
| Status filter | `admin-users-status-filter` |
| Detail modal | `admin-user-detail-modal` |
| Role change dropdown | `admin-user-role-select` |
| Ban button | `admin-user-ban-btn` |
| Ban reason input | `admin-user-ban-reason-input` |
| Ban confirm btn | `admin-user-ban-confirm-btn` |

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 4s |
| L2-003 | 4s |
| L2-004 | 6s |
| L2-005 | 3s |
| L2-006 | 6s |
| L2-007 | 3s |
| L2-008 | 6s |
| **Total** | **~36s** |

---

## Summary
- **8 cases**
- **P0**: 3 | **P1**: 5
- **Runtime**: ~36s
