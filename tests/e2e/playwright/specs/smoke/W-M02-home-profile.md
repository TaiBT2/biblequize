# W-M02 — Home & Profile (L1 Smoke)

**Routes:** `/`, `/profile`
**Spec ref:** SPEC_USER §13

---

### W-M02-L1-001 — Home page render đúng cho user đã đăng nhập

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @home @critical

**Setup**: none

**Preconditions**:
- User đã đăng nhập (tier 3, ~8,000 pts)

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="home-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/')`
- `expect(page.getByTestId('home-page')).toBeVisible()`
- `expect(page.getByTestId('game-mode-grid')).toBeVisible()`
- `expect(page.getByTestId('home-tier-badge')).toBeVisible()`
- `expect(page.getByTestId('home-greeting')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: home-tier-badge] — badge hiện tên tier (vd: "Môn Đồ")
- [NEEDS TESTID: home-greeting] — text chào "Good morning/afternoon/evening, ..."
- `game-mode-grid` đã có testid ✓

---

### W-M02-L1-002 — Game mode grid hiển thị đủ các modes

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @home

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="game-mode-grid"]')`

**Assertions**:
- `expect(page.getByTestId('game-mode-grid')).toBeVisible()`
- `expect(page.getByTestId('game-mode-practice')).toBeVisible()`
- `expect(page.getByTestId('game-mode-ranked')).toBeVisible()`
- `expect(page.getByTestId('game-mode-daily')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: game-mode-practice, game-mode-ranked, game-mode-daily, game-mode-groups, game-mode-multiplayer, game-mode-tournament] — các card trong GameModeGrid

---

### W-M02-L1-003 — Tier progress bar hiển thị trên Home

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @home @tier

**Setup**: none

**Preconditions**:
- User tier 3 (~8,000 pts)

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="home-tier-badge"]')`

**Assertions**:
- `expect(page.getByTestId('home-tier-badge')).toHaveText(/Môn Đồ/)`
- `expect(page.getByTestId('home-tier-progress-bar')).toBeVisible()`
- `expect(page.getByTestId('home-next-tier-card')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: home-tier-progress-bar] — thanh tiến trình tier
- [NEEDS TESTID: home-next-tier-card] — card "Tầng Bậc Tiếp Theo"
- Tier name phụ thuộc điểm của test3@dev.local (~8,000 pts = Môn Đồ)

---

### W-M02-L1-004 — Leaderboard section hiển thị + toggle Daily/Weekly

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @smoke @home

**Setup**: none

**Preconditions**:
- Seed data đã chạy (cần có users có points)

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="home-leaderboard"]')`
3. `page.getByTestId('leaderboard-tab-daily').click()`
4. `page.getByTestId('leaderboard-tab-weekly').click()`

**Assertions**:
- `expect(page.getByTestId('home-leaderboard')).toBeVisible()`
- `expect(page.getByTestId('leaderboard-tab-daily')).toBeVisible()`
- `expect(page.getByTestId('leaderboard-tab-weekly')).toBeVisible()`
- `expect(page.getByTestId('home-leaderboard').locator('[data-testid="leaderboard-row"]')).toHaveCount({ min: 1 })`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: home-leaderboard] — wrapper leaderboard section
- [NEEDS TESTID: leaderboard-tab-daily] — tab "Daily"
- [NEEDS TESTID: leaderboard-tab-weekly] — tab "Weekly"
- [NEEDS TESTID: leaderboard-row] — mỗi hàng trong leaderboard

---

### W-M02-L1-005 — Daily missions card hiển thị

**Priority**: P2
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @home

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="home-daily-missions"]')`

**Assertions**:
- `expect(page.getByTestId('home-daily-missions')).toBeVisible()`
- `expect(page.getByTestId('home-daily-missions').locator('[data-testid="mission-item"]')).toHaveCount(3)`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: home-daily-missions] — card Daily Missions
- [NEEDS TESTID: mission-item] — mỗi mission slot

---

### W-M02-L1-006 — Navigate từ game mode card sang đúng route

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @home

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="game-mode-practice"]')`
3. `page.getByTestId('game-mode-practice').click()`

**Assertions**:
- `expect(page).toHaveURL('/practice')`

**Cleanup**: none (navigate back để không ảnh hưởng tests khác)

---

### W-M02-L1-007 — Profile page render đúng

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @profile

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/profile')`
2. `page.waitForSelector('[data-testid="profile-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/profile')`
- `expect(page.getByTestId('profile-user-name')).toBeVisible()`
- `expect(page.getByTestId('profile-tier-badge')).toBeVisible()`
- `expect(page.getByTestId('profile-tier-progress')).toBeVisible()`
- `expect(page.getByTestId('profile-stats-points')).toBeVisible()`
- `expect(page.getByTestId('profile-stats-streak')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: profile-page] — wrapper trang Profile
- [NEEDS TESTID: profile-user-name] — h1 tên user
- [NEEDS TESTID: profile-tier-badge] — badge tier (vd: "Tầng bậc Môn Đồ")
- [NEEDS TESTID: profile-tier-progress] — section Tiến Độ Tầng Bậc
- [NEEDS TESTID: profile-stats-points] — card Total Points
- [NEEDS TESTID: profile-stats-streak] — card Best Streak

---

### W-M02-L1-008 — Profile: Achievement badges section visible

**Priority**: P2
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @profile

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/profile')`
2. `page.waitForSelector('[data-testid="profile-badges-section"]')`

**Assertions**:
- `expect(page.getByTestId('profile-badges-section')).toBeVisible()`
- `expect(page.getByTestId('profile-heatmap')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: profile-badges-section] — section Badge Collection
- [NEEDS TESTID: profile-heatmap] — 80-day learning log heatmap

---

### W-M02-L1-009 — Profile: Delete account modal mở/đóng

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: fresh login as test3@dev.local
**Tags**: @smoke @profile @write

**Setup**:
- `POST /api/admin/test/users/{userId}/full-reset` — đảm bảo user sạch

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/profile')`
2. `page.getByTestId('profile-delete-account-btn').click()`
3. `page.waitForSelector('[data-testid="delete-account-modal"]')`
4. `page.getByTestId('delete-account-cancel-btn').click()`

**Assertions**:
- `expect(page.getByTestId('delete-account-modal')).toBeVisible()` ← sau click open
- `expect(page.getByTestId('profile-delete-confirm-input')).toBeVisible()` ← input nhập cụm xác nhận
- `expect(page.getByTestId('delete-account-modal')).not.toBeVisible()` ← sau click Cancel

**Cleanup**: none (đã cancel, không delete thật)

**Notes**:
- [NEEDS TESTID: profile-delete-account-btn] — nút "Xóa tài khoản" (Danger Zone)
- [NEEDS TESTID: delete-account-modal] — modal confirmation
- [NEEDS TESTID: profile-delete-confirm-input] — input nhập cụm xác nhận
- [NEEDS TESTID: delete-account-cancel-btn] — nút Cancel trong modal

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Home page wrapper | `home-page` | Home.tsx — **đã có** ✓ |
| Tier badge trên Home | `home-tier-badge` | Home.tsx |
| Greeting text | `home-greeting` | Home.tsx |
| Tier progress bar | `home-tier-progress-bar` | Home.tsx |
| Next tier card | `home-next-tier-card` | Home.tsx |
| Practice mode card | `game-mode-practice` | GameModeGrid component |
| Ranked mode card | `game-mode-ranked` | GameModeGrid component |
| Daily mode card | `game-mode-daily` | GameModeGrid component |
| Leaderboard wrapper | `home-leaderboard` | Home.tsx |
| Leaderboard tab Daily | `leaderboard-tab-daily` | Home.tsx |
| Leaderboard tab Weekly | `leaderboard-tab-weekly` | Home.tsx |
| Leaderboard row | `leaderboard-row` | Home.tsx |
| Daily missions card | `home-daily-missions` | Home.tsx |
| Mission item | `mission-item` | Home.tsx |
| Profile page wrapper | `profile-page` | Profile.tsx |
| Profile user name | `profile-user-name` | Profile.tsx |
| Profile tier badge | `profile-tier-badge` | Profile.tsx |
| Profile tier progress | `profile-tier-progress` | Profile.tsx |
| Profile points stat | `profile-stats-points` | Profile.tsx |
| Profile streak stat | `profile-stats-streak` | Profile.tsx |
| Profile badges section | `profile-badges-section` | Profile.tsx |
| Profile heatmap | `profile-heatmap` | Profile.tsx |
| Delete account button | `profile-delete-account-btn` | Profile.tsx |
| Delete account modal | `delete-account-modal` | Profile.tsx |
| Delete confirm input | `profile-delete-confirm-input` | Profile.tsx |
| Delete cancel button | `delete-account-cancel-btn` | Profile.tsx |

---

## NOT IMPLEMENTED Summary

| Feature | Spec ref | Notes |
|---------|---------|-------|
| Edit Profile flow | §13 | Button visible nhưng route/form chưa implement |
| Share Profile | §13 | Button visible, chưa có route |
