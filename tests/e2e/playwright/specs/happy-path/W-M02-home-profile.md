# W-M02 — Home & Profile (L2 Happy Path)

**Routes:** `/`, `/profile`
**Spec ref:** SPEC_USER §13
**Module priority:** Tier 3 (data accuracy focus, depends M01/M04/M10 verified)

---

## W-M02-L2-001 — Home hiển thị totalPoints accurate từ GET /api/me

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @home @parallel-safe

**Actions**:
1. `page.goto('/')`
2. `GET /api/me` parallel (via page.evaluate hoặc route intercept)

**API Verification**:
- `GET /api/me` → `totalPoints: N`
- UI `home-total-points` displays `N.toLocaleString()` (Vietnamese format)

---

## W-M02-L2-002 — Tier badge khớp với totalPoints → RankTier mapping

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @home @parallel-safe

**Actions**:
1. `page.goto('/')`

**API Verification**:
- `GET /api/me/tier-progress` → `tierLevel: 3, tierName: "Môn Đồ"`
- UI `home-tier-badge` displays "Môn Đồ"
- Tier icon matches (scrollable_header per TIERS const in Ranked.tsx)

---

## W-M02-L2-003 — Streak badge accurate: pre-seed streak=15 → UI hiển thị 15

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @home @write @serial

**Setup**:
- `POST /api/admin/test/users/{userId}/set-streak?days=15`

**Actions**:
1. `page.goto('/')`

**Assertions**:
- `expect(page.getByTestId('home-streak-count')).toHaveText('15')`

**API Verification**:
- `GET /api/me/streak` → `currentStreak: 15`

**Cleanup**:
- `set-streak?days=0`

---

## W-M02-L2-004 — Energy bar: pre-seed livesRemaining=75 → UI hiển thị 75/100

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @home @write @serial

**Setup**:
- `set-state`: `{ livesRemaining: 75 }`

**Actions**:
1. `page.goto('/')`

**Assertions**:
- `expect(page.getByTestId('home-energy-bar')).toContainText('75')`

**API Verification**:
- `GET /api/me/ranked-status` → `livesRemaining: 75`

**Cleanup**:
- `set-state`: `{ livesRemaining: 100 }`

---

## W-M02-L2-005 — Profile page: name, email, avatar, join date all accurate

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @profile @parallel-safe

**Actions**:
1. `page.goto('/profile')`

**Assertions** (UI):
- `expect(page.getByTestId('profile-name')).toHaveText('Test Tier 3')`
- `expect(page.getByTestId('profile-email')).toHaveText('test3@dev.local')`
- `expect(page.getByTestId('profile-avatar')).toBeVisible()`
- `expect(page.getByTestId('profile-join-date')).toBeVisible()`

---

## W-M02-L2-006 — Profile stats: total sessions, correct rate, favorite book

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @profile @parallel-safe

**Actions**:
1. `page.goto('/profile')`

**API Verification**:
- `GET /api/me/stats` (hoặc equivalent) → totalSessions, correctRate, favoriteBook
- UI displays match

**Notes**:
- Stats endpoint chưa confirm — [NEEDS CODE CHECK]

---

## W-M02-L2-007 — Weakness widget: GET /api/me/weaknesses → display 3 top weak books

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @profile @write @serial

**Setup**:
- `POST /api/admin/test/users/{userId}/mock-history?percentSeen=80&percentWrong=60` — create weakness data

**Actions**:
1. `page.goto('/profile')`

**Assertions**:
- `expect(page.getByTestId('profile-weakness-widget')).toBeVisible()`
- `expect(page.getByTestId('profile-weakness-item')).toHaveCount({ min: 1 })` (at least 1 weak book)

**API Verification**:
- `GET /api/me/weaknesses` → array with book + wrongRate sorted desc

**Cleanup**:
- `POST reset-history`

---

## W-M02-L2-008 — Bookmarks: GET /api/me/bookmarks → displayed trong profile

**Priority**: P2
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @profile @parallel-safe

**Actions**:
1. `page.goto('/profile')`
2. Navigate to bookmarks section

**API Verification**:
- `GET /api/me/bookmarks` → array (can be empty)

**Notes**:
- Bookmarks feature per SPEC — confirm endpoint exists

---

## NEEDS TESTID Summary (W-M02 L2)

| Element | Suggested testid |
|---------|-----------------|
| Total points | `home-total-points` |
| Tier badge | `home-tier-badge` |
| Streak count | `home-streak-count` |
| Energy bar | `home-energy-bar` |
| Profile name | `profile-name` |
| Profile email | `profile-email` |
| Profile avatar | `profile-avatar` |
| Profile join date | `profile-join-date` |
| Weakness widget | `profile-weakness-widget` |
| Weakness item | `profile-weakness-item` |

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 4s |
| L2-003 | 5s |
| L2-004 | 5s |
| L2-005 | 4s |
| L2-006 | 4s |
| L2-007 | 5s |
| L2-008 | 4s |
| **Total** | **~35s** |

Parallel-safe: 5 cases.

---

## Summary
- **8 cases** (within estimate)
- **P0**: 2 | **P1**: 5 | **P2**: 1
- **Runtime**: ~35s
