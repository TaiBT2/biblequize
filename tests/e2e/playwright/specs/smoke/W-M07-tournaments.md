# W-M07 — Tournaments (L1 Smoke)

**Routes:** `/tournaments`, `/tournaments/:id`, `/tournaments/:id/match/:matchId`
**Spec ref:** SPEC_USER §7

---

### W-M07-L1-001 — Tournaments list page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @tournaments @critical

**Setup**: none

**Preconditions**:
- User đã đăng nhập
- Có ít nhất 1 tournament trong DB (seed data)

**Actions**:
1. `page.goto('/tournaments')`
2. `page.waitForSelector('[data-testid="tournaments-list"]')`

**Assertions**:
- `expect(page).toHaveURL('/tournaments')`
- `expect(page.getByTestId('tournaments-list')).toBeVisible()`
- `expect(page.getByTestId('tournaments-list').locator('[data-testid="tournament-card"]')).toHaveCount({ min: 1 })`

**Cleanup**: none

**Notes**:
- `data-testid="tournaments-list"` đã có ✓ (từ code scan)
- [NEEDS TESTID: tournament-card] — mỗi tournament card

---

### W-M07-L1-002 — Loading skeleton hiển thị khi đang fetch

**Priority**: P2
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @tournaments

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/tournaments')`
2. `page.waitForSelector('[data-testid="tournaments-skeleton"]')`

**Assertions**:
- `expect(page.getByTestId('tournaments-skeleton')).toBeVisible()` ← skeleton xuất hiện trong thời gian ngắn

**Cleanup**: none

**Notes**:
- `data-testid="tournaments-skeleton"` đã có ✓
- Race condition: skeleton có thể disappear nhanh nếu response nhanh

---

### W-M07-L1-003 — Tournament card hiển thị status badge đúng

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @tournaments

**Setup**: none

**Preconditions**:
- Có tournament với status REGISTRATION

**Actions**:
1. `page.goto('/tournaments')`
2. `page.waitForSelector('[data-testid="tournaments-list"]')`

**Assertions**:
- `expect(page.getByTestId('tournament-status-badge').first()).toBeVisible()`
- `expect(page.getByTestId('tournament-card').first().getByTestId('tournament-participants-count')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: tournament-card] — mỗi card
- [NEEDS TESTID: tournament-status-badge] — badge status (REGISTRATION/IN_PROGRESS/COMPLETED)
- [NEEDS TESTID: tournament-participants-count] — số người tham gia

---

### W-M07-L1-004 — Click tournament card → navigate to detail

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @smoke @tournaments

**Setup**: none

**Preconditions**:
- Có tournament trong DB với id đã biết

**Actions**:
1. `page.goto('/tournaments')`
2. `page.waitForSelector('[data-testid="tournament-card"]')`
3. `page.getByTestId('tournament-card').first().click()`
4. `page.waitForURL(/\/tournaments\/.+/)`

**Assertions**:
- `expect(page).toHaveURL(/\/tournaments\/.+/)`
- `expect(page.getByTestId('tournament-detail-page')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: tournament-detail-page] — wrapper trang TournamentDetail

---

### W-M07-L1-005 — Tournament detail page render đúng

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @tournaments

**Setup**: none

**Preconditions**:
- Có tournament với id đã biết, status REGISTRATION hoặc IN_PROGRESS

**Actions**:
1. `page.goto('/tournaments/{knownId}')`
2. `page.waitForSelector('[data-testid="tournament-detail-page"]')`

**Assertions**:
- `expect(page.getByTestId('tournament-detail-page')).toBeVisible()`
- `expect(page.getByTestId('tournament-detail-name')).toBeVisible()`
- `expect(page.getByTestId('tournament-detail-status')).toBeVisible()`
- `expect(page.getByTestId('tournament-bracket')).toBeVisible()` ← bracket/schedule

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: tournament-detail-page] — wrapper
- [NEEDS TESTID: tournament-detail-name] — tên tournament
- [NEEDS TESTID: tournament-detail-status] — status badge
- [NEEDS TESTID: tournament-bracket] — bracket hoặc participants list

---

### W-M07-L1-006 — Empty state khi không có tournament

**Priority**: P2
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @tournaments

**Setup**:
- Cần môi trường không có tournament (hoặc mock API trả về rỗng)

**Preconditions**:
- API `/api/tournaments` trả về list rỗng

**Actions**:
1. `page.goto('/tournaments')`
2. `page.waitForSelector('[data-testid="tournaments-empty"]')`

**Assertions**:
- `expect(page.getByTestId('tournaments-empty')).toBeVisible()`

**Cleanup**: none

**Notes**:
- `data-testid="tournaments-empty"` đã có ✓

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Tournaments list ✓ | `tournaments-list` | Tournaments.tsx — **đã có** |
| Tournaments skeleton ✓ | `tournaments-skeleton` | Tournaments.tsx — **đã có** |
| Tournaments error ✓ | `tournaments-error` | Tournaments.tsx — **đã có** |
| Tournaments empty ✓ | `tournaments-empty` | Tournaments.tsx — **đã có** |
| Tournament card | `tournament-card` | Tournaments.tsx |
| Status badge | `tournament-status-badge` | Tournaments.tsx |
| Participants count | `tournament-participants-count` | Tournaments.tsx |
| Detail page | `tournament-detail-page` | TournamentDetail.tsx |
| Detail name | `tournament-detail-name` | TournamentDetail.tsx |
| Detail status | `tournament-detail-status` | TournamentDetail.tsx |
| Bracket | `tournament-bracket` | TournamentDetail.tsx |
