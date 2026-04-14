# Template — Test Case Spec

> Copy section dưới đây cho mỗi test case. Xóa comments `← ...` trước khi dùng.

---

## Template chuẩn

```markdown
### {ID} — {Tên ngắn gọn mô tả mục tiêu test}

**Priority**: P0 | P1 | P2       ← P0=release blocker, P1=critical, P2=should fix
**Est. runtime**: ~Xs
**Auth**: [xem options bên dưới]
**Tags**: @smoke @... 

**Setup**:
- [API calls cần chạy trước test, ví dụ: set-tier, refill-energy]
- [Hoặc: "Không cần — dùng global seed data"]

**Preconditions**:
- [Trạng thái app khi test bắt đầu: URL, localStorage, user state]

**Actions**:
1. `page.goto('/...')`
2. `page.getByTestId('...').fill('...')`
3. `page.getByTestId('...').click()`
4. `page.waitForURL('/...')`
...

**Assertions**:
- `expect(page).toHaveURL('/...')`
- `expect(page.getByTestId('...')).toBeVisible()`
- `expect(page.getByTestId('...')).toHaveText('...')`
- `expect(page.getByRole('button', { name: '...' })).toBeEnabled()`

**Cleanup**: none | [API call để reset state]

**Notes**:
- [NEEDS TESTID: suggested-id] — mô tả element nào cần testid
- [NOT IMPLEMENTED] — feature chưa có trong code
- [Ghi chú kỹ thuật khác]
```

---

## Auth options

```
Auth: no auth (guest)                      ← không login
Auth: storageState=tier1                   ← dùng fixture, read-only test
Auth: storageState=tier3                   ← dùng fixture, read-only test
Auth: storageState=admin                   ← admin fixture, read-only
Auth: fresh login as test3@dev.local       ← login trong setup, write test
Auth: fresh login as admin@biblequiz.test  ← admin login trong setup
```

---

## Ví dụ 1 — Read-only test (dùng storageState)

```markdown
### W-M02-L1-001 — Trang Home hiển thị đúng thông tin user

**Priority**: P1
**Est. runtime**: ~2s
**Auth**: storageState=tier3
**Tags**: @smoke @home

**Setup**:
- Không cần — dùng global seed data + storageState fixture

**Preconditions**:
- User đã đăng nhập (tier 3, ~8000 pts)
- App ở route `/`

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="home-page"]')`

**Assertions**:
- `expect(page.getByTestId('home-page')).toBeVisible()`
- `expect(page.getByTestId('home-tier-badge')).toHaveText('Ngọn Đèn')`
- `expect(page.getByTestId('home-energy-bar')).toBeVisible()`
- `expect(page.getByTestId('home-streak-count')).toBeVisible()`
- `expect(page.getByTestId('game-mode-grid')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: home-tier-badge] — tier badge hiện không có testid
- [NEEDS TESTID: home-energy-bar] — energy bar không có testid
- [NEEDS TESTID: home-streak-count] — streak count không có testid
```

---

## Ví dụ 2 — Write test (fresh login + cleanup)

```markdown
### W-M09-L1-003 — Tạo group mới thành công

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as mucsu.minh@biblequiz.test
**Tags**: @smoke @groups @write

**Setup**:
- `POST /api/admin/test/users/{userId}/full-reset` — đảm bảo user không có group cũ

**Preconditions**:
- User đã đăng nhập
- User chưa có group nào

**Actions**:
1. `page.goto('/groups')`
2. `page.getByTestId('no-group').waitFor()`
3. `page.getByRole('button', { name: 'Tạo nhóm' }).click()`
4. `page.getByTestId('group-name-input').fill('Nhóm Test Automation')`
5. `page.getByTestId('group-create-submit').click()`
6. `page.waitForURL(/\/groups\/[a-z0-9-]+/)`

**Assertions**:
- `expect(page).toHaveURL(/\/groups\/[a-z0-9-]+/)`
- `expect(page.getByTestId('group-name-heading')).toHaveText('Nhóm Test Automation')`
- `expect(page.getByTestId('group-join-code')).toHaveText(/[A-Z0-9]{6}/)`
- `expect(page.getByTestId('group-member-count')).toHaveText('1 thành viên')`

**Cleanup**:
- `DELETE /api/groups/{groupId}` — xóa group vừa tạo

**Notes**:
- [NEEDS TESTID: group-name-input, group-create-submit, group-name-heading, group-join-code, group-member-count]
```

---

## Ví dụ 3 — Admin test

```markdown
### A-M03-L1-001 — Trang Questions admin hiển thị danh sách câu hỏi

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin

**Setup**:
- Không cần — dùng global seed data (đã có questions từ TestDataSeeder)

**Preconditions**:
- Admin đã đăng nhập
- Có ít nhất 1 question active trong DB

**Actions**:
1. `page.goto('/admin/questions')`
2. `page.waitForSelector('[data-testid="admin-questions-table"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/questions')`
- `expect(page.getByTestId('admin-questions-table')).toBeVisible()`
- `expect(page.getByTestId('admin-questions-table').locator('tr')).toHaveCount({ min: 2 })` ← header + ≥1 row
- `expect(page.getByTestId('admin-questions-create-btn')).toBeEnabled()`
- `expect(page.getByTestId('admin-questions-search-input')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-questions-table, admin-questions-create-btn, admin-questions-search-input]
```

---

## Tổng hợp cuối file (bắt buộc)

Mỗi spec file kết thúc bằng 2 sections:

```markdown
---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Nút submit form login | `login-submit-btn` | Login.tsx |
| Email input | `login-email-input` | Login.tsx |
| ... | ... | ... |

---

## NOT IMPLEMENTED Summary

| Feature | Spec ref | Notes |
|---------|---------|-------|
| Google OAuth login | §14.3 | useGoogleAuth hook exists, needs Expo redirect URI |
| ... | ... | ... |
```
