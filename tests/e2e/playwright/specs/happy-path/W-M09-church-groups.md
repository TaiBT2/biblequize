# W-M09 — Church Groups (L2 Happy Path)

**Routes:** `/groups`, `/groups/:id`, `/groups/:id/analytics`
**Spec ref:** SPEC_USER §9.1
**Module priority:** Tier 2 (social feature — create, join, leaderboard, announcements)

---

## API Overview

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/groups` | POST | Create group |
| `/api/groups/{id}` | GET | Group detail |
| `/api/groups/{id}` | PATCH | Update group (owner only) |
| `/api/groups/{id}` | DELETE | Delete group (owner only) |
| `/api/groups/join` | POST | Join via code |
| `/api/groups/{id}/leave` | DELETE | Leave group |
| `/api/groups/{id}/leaderboard` | GET | Members ranked by XP |
| `/api/groups/{id}/analytics` | GET | Activity analytics |
| `/api/groups/{id}/members/{userId}` | DELETE | Kick member (owner) |
| `/api/groups/{id}/announcements` | GET/POST | Group announcements |
| `/api/groups/{id}/quiz-sets` | GET/POST | Custom quiz sets |

---

## W-M09-L2-001 — Create group → POST /api/groups returns group + join code

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @groups @critical @write @serial

**Setup**:
- `POST /api/admin/test/users/{userId}/leave-all-groups` HOẶC delete existing groups của user
- **[POTENTIAL NOT IMPLEMENTED]**: endpoint leave-all-groups

**Actions**:
1. `POST /api/groups` với body:
   ```json
   {
     "name": "Test Group E2E",
     "description": "Testing group creation",
     "language": "vi"
   }
   ```

**API Verification**:
- Response 200 (or 201) với:
  - `id` (UUID v7)
  - `name`, `description`
  - `joinCode` matches regex `[A-Z0-9]{6}`
  - `ownerId` = test3 userId
  - `memberCount: 1`
- `GET /api/groups/{id}` → same data
- User appears trong `members` array

**Cleanup**:
- `DELETE /api/groups/{id}`

**Notes**:
- UUID v7 format required per backend conventions

---

## W-M09-L2-002 — UI flow: /groups → no-group state → create form → redirect to detail

**Priority**: P0
**Est. runtime**: ~8s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @groups @write @serial

**Setup**:
- User không thuộc group nào

**Actions**:
1. `page.goto('/groups')`
2. `page.waitForSelector('[data-testid="no-group"]')`
3. `page.getByRole('button', { name: /Tạo nhóm|Create group/ }).click()`
4. `page.getByTestId('group-name-input').fill('E2E Test Group')`
5. `page.getByTestId('group-description-input').fill('Test description')`
6. `page.getByTestId('group-create-submit').click()`
7. `page.waitForURL(/\/groups\/[a-z0-9-]+/)`

**Assertions** (UI):
- `expect(page).toHaveURL(/\/groups\/[a-z0-9-]+/)`
- `expect(page.getByTestId('group-name-heading')).toHaveText('E2E Test Group')`
- `expect(page.getByTestId('group-join-code')).toContainText(/[A-Z0-9]{6}/)`
- `expect(page.getByTestId('group-member-count')).toContainText('1')`

**API Verification**:
- POST `/api/groups` fired với form data
- Navigation to newly created group detail

**Cleanup**:
- `DELETE /api/groups/{id}`

**Notes**:
- [NEEDS TESTID: group-name-input, group-description-input, group-create-submit, group-name-heading, group-join-code, group-member-count]

---

## W-M09-L2-003 — Join group via code: POST /api/groups/join → member added

**Priority**: P0
**Est. runtime**: ~8s
**Auth**: fresh login as test4@dev.local (join test3's group)
**Tags**: @happy-path @groups @write @serial

**Setup**:
- test3 tạo group (via API), lấy joinCode
- Login test4

**Actions**:
1. `POST /api/groups/join` với body `{ "joinCode": "<test3_groupCode>" }`

**API Verification**:
- Response 200 với group info
- `GET /api/groups/{id}` → `memberCount: 2`
- test4 xuất hiện trong `members` array

**Cleanup**:
- `DELETE /api/groups/{id}/leave` cho test4
- `DELETE /api/groups/{id}` cho test3

---

## W-M09-L2-004 — Join with invalid code → 404

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @groups @write @serial

**Actions**:
1. `POST /api/groups/join` với body `{ "joinCode": "ZZZZZZ" }`

**API Verification**:
- Response 404 với error message

---

## W-M09-L2-005 — Join group already in → 409 Conflict

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @groups @write @serial

**Setup**:
- test3 tạo group A

**Actions**:
1. `POST /api/groups/join` với joinCode của group A (test3 đã là member)

**API Verification**:
- Response 409 Conflict hoặc idempotent (confirm behavior)

**Cleanup**:
- DELETE group A

---

## W-M09-L2-006 — Update group (PATCH) by owner → success

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @groups @write @serial

**Setup**:
- test3 tạo group

**Actions**:
1. `PATCH /api/groups/{id}` với body:
   ```json
   { "name": "Updated Name", "description": "Updated desc" }
   ```

**API Verification**:
- Response 200
- `GET /api/groups/{id}` → updated fields

**Cleanup**:
- DELETE group

---

## W-M09-L2-007 — Update group by non-owner → 403

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: fresh login as test4@dev.local
**Tags**: @happy-path @groups @security @write @serial

**Setup**:
- test3 tạo group
- test4 join group

**Actions**:
1. test4 `PATCH /api/groups/{id}` với body `{ "name": "Hacked" }`

**API Verification**:
- Response 403 Forbidden
- `GET /api/groups/{id}` → name unchanged

---

## W-M09-L2-008 — Leaderboard: GET /api/groups/{id}/leaderboard returns members ranked by XP

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @groups @write @serial

**Setup**:
- test3 create group
- test1, test2, test3 join (3 members with different totalPoints: 0, 1500, 8000)

**Actions**:
1. `GET /api/groups/{id}/leaderboard`

**API Verification**:
- Response array sorted by `totalPoints` desc:
  - test3 (~8000) rank 1
  - test2 (~1500) rank 2
  - test1 (0) rank 3
- Each entry có `userId, name, totalPoints, rank`

**Cleanup**:
- DELETE group

---

## W-M09-L2-009 — Kick member: owner kicks test4 → 404 on re-fetch

**Priority**: P1
**Est. runtime**: ~7s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @groups @write @serial

**Setup**:
- test3 tạo group, test4 join

**Actions**:
1. test3 `DELETE /api/groups/{id}/members/{test4UserId}`

**API Verification**:
- Response 200
- `GET /api/groups/{id}` → memberCount 1, test4 not in members
- test4 reload `/groups` → no longer sees group

**Cleanup**:
- DELETE group

---

## W-M09-L2-010 — Create announcement: POST /api/groups/{id}/announcements

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @groups @write @serial

**Setup**:
- test3 tạo group

**Actions**:
1. `POST /api/groups/{id}/announcements` với body:
   ```json
   { "title": "Welcome", "content": "Group rules..." }
   ```

**API Verification**:
- Response 200 với announcement ID
- `GET /api/groups/{id}/announcements` → array length ≥ 1

**Cleanup**:
- DELETE group

---

## W-M09-L2-011 — Leave group: DELETE /api/groups/{id}/leave → memberCount decreases

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: fresh login as test4@dev.local
**Tags**: @happy-path @groups @write @serial

**Setup**:
- test3 tạo group
- test4 join

**Actions**:
1. test4 `DELETE /api/groups/{id}/leave`

**API Verification**:
- Response 200
- `GET /api/groups/{id}` → memberCount 1
- test4 không còn trong members array

**Cleanup**:
- test3 DELETE group

---

## W-M09-L2-012 — Delete group by owner → group removed, members notified (optional)

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @groups @write @serial

**Setup**:
- test3 tạo group với test4 joined

**Actions**:
1. test3 `DELETE /api/groups/{id}`

**API Verification**:
- Response 200 (or 204)
- `GET /api/groups/{id}` → 404 Not Found
- test4 reload `/groups` → group no longer visible

---

## NEEDS TESTID Summary (W-M09 L2)

| Element | Suggested testid | File |
|---------|-----------------|------|
| Group name input | `group-name-input` | pages/Groups.tsx |
| Group description input | `group-description-input` | pages/Groups.tsx |
| Create submit | `group-create-submit` | pages/Groups.tsx |
| Group name heading | `group-name-heading` | pages/GroupDetail.tsx |
| Join code display | `group-join-code` | pages/GroupDetail.tsx |
| Member count | `group-member-count` | pages/GroupDetail.tsx |
| Leaderboard table | `group-leaderboard` | pages/GroupDetail.tsx |
| Leaderboard row | `group-leaderboard-row` | pages/GroupDetail.tsx |
| Announcement list | `group-announcements-list` | pages/GroupDetail.tsx |
| Announcement create btn | `group-announcement-create-btn` | pages/GroupDetail.tsx |
| Kick member btn | `group-kick-member-btn` | pages/GroupDetail.tsx |
| Leave group btn | `group-leave-btn` | pages/GroupDetail.tsx |
| Delete group btn | `group-delete-btn` | pages/GroupDetail.tsx |

---

## NOT IMPLEMENTED / BLOCKERS

| # | Issue | Impact |
|---|-------|--------|
| 1 | `leave-all-groups` test helper endpoint | L2-001 setup convenience — workaround: DELETE manually |

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 5s |
| L2-002 | 8s |
| L2-003 | 8s |
| L2-004 | 3s |
| L2-005 | 5s |
| L2-006 | 5s |
| L2-007 | 6s |
| L2-008 | 6s |
| L2-009 | 7s |
| L2-010 | 5s |
| L2-011 | 6s |
| L2-012 | 5s |
| **Total** | **~69s (~1.2 min)** |

All @serial (write heavy).

---

## Summary

- **12 cases** total (within 10 estimate)
- **P0**: 4 | **P1**: 8
- **NEEDS TESTID**: 13 elements
- **Runtime**: ~1.2 min serial
