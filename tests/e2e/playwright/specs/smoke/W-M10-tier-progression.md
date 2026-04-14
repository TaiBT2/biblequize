# W-M10 — Tier Progression (L1 Smoke)

**Routes:** `/` (tier display), `/profile` (tier progress), `/cosmetics`
**Spec ref:** SPEC_USER §3

---

### W-M10-L1-001 — Tier badge hiển thị đúng trên Home (Tier 1)

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier1
**Tags**: @smoke @tier

**Setup**: none

**Preconditions**:
- User test1@dev.local (Tier 1 — Tân Tín Hữu, 0 pts)

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="home-tier-badge"]')`

**Assertions**:
- `expect(page.getByTestId('home-tier-badge')).toHaveText(/Tân Tín Hữu/)`
- `expect(page.getByTestId('home-next-tier-card')).toBeVisible()` ← có "Tầng Bậc Tiếp Theo"
- `expect(page.getByTestId('home-tier-progress-bar')).toBeVisible()`

**Cleanup**: none

---

### W-M10-L1-002 — Tier badge hiển thị đúng trên Home (Tier 6 — max tier)

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier6
**Tags**: @smoke @tier

**Setup**: none

**Preconditions**:
- User test6@dev.local (Tier 6 — Sứ Đồ, ~110,000 pts)

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="home-tier-badge"]')`

**Assertions**:
- `expect(page.getByTestId('home-tier-badge')).toHaveText(/Sứ Đồ/)`
- `expect(page.getByTestId('home-max-tier-msg')).toBeVisible()` ← "Bạn đã chinh phục tất cả"
- `expect(page.getByTestId('home-next-tier-card')).not.toBeVisible()` ← không có "Tầng Tiếp Theo"

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: home-max-tier-msg] — text "Bạn đã chinh phục tất cả" (chỉ Tier 6)

---

### W-M10-L1-003 — TierProgressBar (5 sao) hiển thị trên Home

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @tier

**Setup**: none

**Preconditions**:
- User tier 3 (Môn Đồ, 8,000 pts)

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="tier-progress-stars"]')`

**Assertions**:
- `expect(page.getByTestId('tier-progress-stars')).toBeVisible()`
- `expect(page.getByTestId('tier-star-count')).toHaveText(/\d\/5/)` ← vd "2/5"
- `expect(page.getByTestId('tier-progress-stars').locator('[data-testid="tier-star"]')).toHaveCount(5)`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: tier-progress-stars] — wrapper TierProgressBar component
- [NEEDS TESTID: tier-star-count] — text "{starIndex+1}/5"
- [NEEDS TESTID: tier-star] — mỗi ngôi sao (5 cái)
- TierProgressBar trả về null cho Tier 6 → không test Tier 6 ở case này

---

### W-M10-L1-004 — Tier progress section trên Profile page

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier4
**Tags**: @smoke @tier @profile

**Setup**: none

**Preconditions**:
- User tier 4 (Hiền Triết, 20,000 pts)

**Actions**:
1. `page.goto('/profile')`
2. `page.waitForSelector('[data-testid="profile-tier-progress"]')`

**Assertions**:
- `expect(page.getByTestId('profile-tier-progress')).toBeVisible()`
- `expect(page.getByTestId('profile-tier-current-name')).toHaveText(/Hiền Triết/)`
- `expect(page.getByTestId('profile-tier-next-name')).toHaveText(/Tiên Tri/)`
- `expect(page.getByTestId('profile-tier-exp')).toHaveText(/20[,.]?000.*40[,.]?000/)` ← "20,000 / 40,000 EXP"

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: profile-tier-current-name] — tên tier hiện tại
- [NEEDS TESTID: profile-tier-next-name] — tên tier tiếp theo
- [NEEDS TESTID: profile-tier-exp] — "X / Y EXP" display

---

### W-M10-L1-005 — Cosmetics page render đúng

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @tier @cosmetics

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/cosmetics')`
2. `page.waitForSelector('[data-testid="cosmetics-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/cosmetics')`
- `expect(page.getByTestId('cosmetics-frames-section')).toBeVisible()`
- `expect(page.getByTestId('cosmetics-themes-section')).toBeVisible()`
- `expect(page.getByTestId('cosmetics-frames-section').locator('[data-testid="cosmetics-frame-item"]')).toHaveCount(6)` ← 6 frames (1 per tier)

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: cosmetics-page] — wrapper trang Cosmetics
- [NEEDS TESTID: cosmetics-frames-section] — section "Khung Avatar"
- [NEEDS TESTID: cosmetics-themes-section] — section "Giao diện Quiz"
- [NEEDS TESTID: cosmetics-frame-item] — mỗi frame card

---

### W-M10-L1-006 — Cosmetics: frame của tier cao hơn bị locked

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier1
**Tags**: @smoke @tier @cosmetics

**Setup**: none

**Preconditions**:
- User Tier 1 (chỉ unlock frame tier 1)

**Actions**:
1. `page.goto('/cosmetics')`
2. `page.waitForSelector('[data-testid="cosmetics-frame-item"]')`

**Assertions**:
- `expect(page.getByTestId('cosmetics-frame-item').nth(0)).not.toHaveAttribute('disabled')` ← frame tier 1 unlocked
- `expect(page.getByTestId('cosmetics-frame-item').nth(1)).toHaveAttribute('disabled')` ← frame tier 2 locked
- `expect(page.getByTestId('cosmetics-frame-item').nth(1).getByTestId('cosmetics-lock-icon')).toBeVisible()`
- `expect(page.getByTestId('cosmetics-frame-item').nth(1)).toContainText('Đạt T2 để mở')`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: cosmetics-lock-icon] — icon lock trên frame bị locked
- Frame item thứ 0 = tier 1, thứ 1 = tier 2, ...

---

### W-M10-L1-007 — Cosmetics: chọn frame đã unlock → PATCH API được gọi

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @smoke @tier @cosmetics

**Setup**: none

**Preconditions**:
- User Tier 3, có unlock frame tier 1, 2, 3

**Actions**:
1. `page.goto('/cosmetics')`
2. `page.waitForSelector('[data-testid="cosmetics-frame-item"]')`
3. `page.getByTestId('cosmetics-frame-item').nth(0).click()` ← chọn frame tier 1

**Assertions**:
- `expect(page.getByTestId('cosmetics-frame-item').nth(0)).toContainText('✓ Đang dùng')` ← active state

**Cleanup**: none

**Notes**:
- Gọi `PATCH /api/me/cosmetics` với `{ activeFrame: "frame_tier1" }`

---

### W-M10-L1-008 — Prestige section hiển thị trên Profile (Tier 6)

**Priority**: P2
**Est. runtime**: ~3s
**Auth**: storageState=tier6
**Tags**: @smoke @tier @profile

**Setup**: none

**Preconditions**:
- User Tier 6 (Sứ Đồ)

**Actions**:
1. `page.goto('/profile')`
2. `page.waitForSelector('[data-testid="profile-prestige-section"]')`

**Assertions**:
- `expect(page.getByTestId('profile-prestige-section')).toBeVisible()`
- `expect(page.getByTestId('profile-days-at-tier6')).toBeVisible()` ← "{daysAtTier6}/30"

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: profile-prestige-section] — section Prestige
- [NEEDS TESTID: profile-days-at-tier6] — progress "{N}/30 ngày"
- Section này chỉ visible cho Tier 6 users

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Home max tier msg | `home-max-tier-msg` | Home.tsx |
| TierProgressBar wrapper | `tier-progress-stars` | TierProgressBar.tsx |
| Star count "{N}/5" | `tier-star-count` | TierProgressBar.tsx |
| Individual star | `tier-star` | TierProgressBar.tsx |
| Profile tier current name | `profile-tier-current-name` | Profile.tsx |
| Profile tier next name | `profile-tier-next-name` | Profile.tsx |
| Profile tier EXP | `profile-tier-exp` | Profile.tsx |
| Cosmetics page | `cosmetics-page` | Cosmetics.tsx |
| Frames section | `cosmetics-frames-section` | Cosmetics.tsx |
| Themes section | `cosmetics-themes-section` | Cosmetics.tsx |
| Frame item | `cosmetics-frame-item` | Cosmetics.tsx |
| Lock icon | `cosmetics-lock-icon` | Cosmetics.tsx |
| Prestige section | `profile-prestige-section` | Profile.tsx |
| Days at Tier 6 | `profile-days-at-tier6` | Profile.tsx |

---

## NOT IMPLEMENTED Summary

| Feature | Spec ref | Notes |
|---------|---------|-------|
| TierUpModal E2E trigger | §3 | Modal trigger xảy ra sau quiz khi đủ điểm — cần viết L2 Happy Path test, không phải smoke |
| Sub-tier stars animation | §3 | Animation không test được qua E2E smoke |
