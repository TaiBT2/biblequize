# W-M09 — Church Groups (L1 Smoke)

**Routes:** `/groups`, `/groups/:id`, `/groups/:id/analytics`
**Spec ref:** SPEC_USER §9

---

### W-M09-L1-001 — No-group state hiển thị khi user chưa có group

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=tier1
**Tags**: @smoke @groups @critical

**Setup**:
- Đảm bảo test1@dev.local không thuộc group nào (localStorage 'biblequiz_my_groups' rỗng hoặc group không tồn tại)

**Preconditions**:
- User đã đăng nhập, không có group nào

**Actions**:
1. `page.goto('/groups')`
2. `page.waitForSelector('[data-testid="no-group"]')`

**Assertions**:
- `expect(page).toHaveURL('/groups')`
- `expect(page.getByTestId('no-group')).toBeVisible()`
- `expect(page.getByTestId('groups-create-btn')).toBeVisible()`
- `expect(page.getByTestId('groups-join-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- `data-testid="no-group"` đã có ✓
- [NEEDS TESTID: groups-create-btn] — nút "Tạo Nhóm"
- [NEEDS TESTID: groups-join-btn] — nút "Tham Gia Nhóm"

---

### W-M09-L1-002 — Create group form mở và submit

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test1@dev.local
**Tags**: @smoke @groups @write

**Setup**: none

**Preconditions**:
- User chưa có group (no-group state)

**Actions**:
1. `page.goto('/groups')`
2. `page.waitForSelector('[data-testid="groups-create-btn"]')`
3. `page.getByTestId('groups-create-btn').click()`
4. `page.waitForSelector('[data-testid="groups-create-form"]')`
5. `page.getByTestId('groups-create-name-input').fill('Test Group E2E')`
6. `page.getByTestId('groups-create-submit-btn').click()`
7. `page.waitForSelector('[data-testid="group-overview"]')`

**Assertions**:
- `expect(page.getByTestId('group-overview')).toBeVisible()`

**Cleanup**:
- Delete group via admin: `DELETE /api/admin/groups/{groupId}` hoặc `POST /api/groups/{groupId}/leave`

**Notes**:
- [NEEDS TESTID: groups-create-form] — form tạo nhóm
- [NEEDS TESTID: groups-create-name-input] — input tên nhóm
- [NEEDS TESTID: groups-create-submit-btn] — nút submit tạo nhóm
- [NEEDS TESTID: group-overview] — view sau khi join/create group thành công

---

### W-M09-L1-003 — Group overview hiển thị leaderboard

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @groups

**Setup**:
- Cần test3@dev.local thuộc 1 group (seed data hoặc setup trước)

**Preconditions**:
- User đã thuộc 1 group, group có ít nhất 2 members

**Actions**:
1. `page.goto('/groups')`
2. `page.waitForSelector('[data-testid="group-leaderboard"]')`

**Assertions**:
- `expect(page.getByTestId('group-overview')).toBeVisible()`
- `expect(page.getByTestId('group-leaderboard')).toBeVisible()`
- `expect(page.getByTestId('group-leaderboard').locator('[data-testid="group-leaderboard-row"]')).toHaveCount({ min: 1 })`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: group-leaderboard] — leaderboard section trong group
- [NEEDS TESTID: group-leaderboard-row] — mỗi hàng thành viên
- [NOT IMPLEMENTED: seed data chưa include group membership cho test users]

---

### W-M09-L1-004 — Group Detail page render

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @groups

**Setup**:
- Cần group ID đã biết với test3@dev.local là member

**Preconditions**:
- User là member của group với {groupId}

**Actions**:
1. `page.goto('/groups/{groupId}')`
2. `page.waitForSelector('[data-testid="group-detail-page"]')`

**Assertions**:
- `expect(page).toHaveURL(/\/groups\/.+/)`
- `expect(page.getByTestId('group-detail-page')).toBeVisible()`
- `expect(page.getByTestId('group-detail-name')).toBeVisible()`
- `expect(page.getByTestId('group-detail-members')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: group-detail-page] — wrapper GroupDetail page
- [NEEDS TESTID: group-detail-name] — tên nhóm
- [NEEDS TESTID: group-detail-members] — danh sách hoặc count thành viên

---

### W-M09-L1-005 — Loading skeleton + error state

**Priority**: P2
**Est. runtime**: ~3s
**Auth**: storageState=tier1
**Tags**: @smoke @groups

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/groups')`
2. `page.waitForSelector('[data-testid="groups-skeleton"]')`

**Assertions**:
- `expect(page.getByTestId('groups-skeleton')).toBeVisible()` ← skeleton trong lúc loading

**Cleanup**: none

**Notes**:
- `data-testid="groups-skeleton"` đã có ✓
- `data-testid="group-error"` đã có ✓

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| No-group wrapper ✓ | `no-group` | Groups.tsx — **đã có** |
| Groups skeleton ✓ | `groups-skeleton` | Groups.tsx — **đã có** |
| Group error ✓ | `group-error` | Groups.tsx — **đã có** |
| Create button | `groups-create-btn` | Groups.tsx |
| Join button | `groups-join-btn` | Groups.tsx |
| Create form | `groups-create-form` | Groups.tsx |
| Name input | `groups-create-name-input` | Groups.tsx |
| Create submit | `groups-create-submit-btn` | Groups.tsx |
| Group overview | `group-overview` | Groups.tsx |
| Group leaderboard | `group-leaderboard` | Groups.tsx |
| Leaderboard row | `group-leaderboard-row` | Groups.tsx |
| Detail page | `group-detail-page` | GroupDetail.tsx |
| Detail name | `group-detail-name` | GroupDetail.tsx |
| Detail members | `group-detail-members` | GroupDetail.tsx |

---

## NOT IMPLEMENTED Summary

| Feature | Notes |
|---------|-------|
| Group membership seed data | test3@dev.local chưa được seed vào group — cần thêm seeder hoặc test helper |
