# W-M08 — Bible Journey Map (L2 Happy Path)

**Routes:** `/journey`
**Spec ref:** SPEC_USER §6
**Module priority:** Tier 3 (mastery calculation per book)

---

## API Overview

- `GET /api/me/journey` — returns summary + per-book mastery
- Mastery formula: based on `UserQuestionHistory` correct/total per book

---

## W-M08-L2-001 — GET /api/me/journey returns summary + books array

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @journey @parallel-safe

**Actions**:
1. `GET /api/me/journey`

**API Verification**:
- Response:
  - `summary: { totalBooks, completedBooks, overallMastery }`
  - `books: [{ bookCode, bookName, testament, totalQuestions, answeredCorrectly, mastery, unlocked }]`
- `books` length = 66 (66 books of Bible)
- Books categorized OT/NT (39 OT + 27 NT)

---

## W-M08-L2-002 — Mastery formula verification: pre-seed question history → mastery accurate

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @journey @write @serial

**Setup**:
- `POST reset-history`
- `POST mock-history?book=Genesis&percentSeen=50&percentWrong=20`
  - Creates history: 50% questions seen, 20% wrong → 80% correct rate for seen questions

**Actions**:
1. `GET /api/me/journey`

**API Verification**:
- Find Genesis trong `books[]`
- `answeredCorrectly` matches mock expectations
- `mastery` = formula (confirm formula from JourneyService code)

**Cleanup**:
- `POST reset-history`

**Notes**:
- Mastery formula: check `JourneyService.calculateMastery` — likely `correctCount / totalQuestionsInBook * 100` or similar
- [NEEDS CODE READ]: exact mastery formula

---

## W-M08-L2-003 — Book unlock progression: tier 1 user → only first N books unlocked

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier1
**Tags**: @happy-path @journey @parallel-safe

**Actions**:
1. `GET /api/me/journey`

**API Verification**:
- Filter `books.filter(b => b.unlocked)` → limited count (tier-dependent)
- Remaining books `unlocked: false`

**Notes**:
- [NEEDS CODE READ]: unlock rule based on tier? Or totalPoints threshold per book?

---

## W-M08-L2-004 — Tier 6 user → all 66 books unlocked

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier6
**Tags**: @happy-path @journey @parallel-safe

**Actions**:
1. `GET /api/me/journey`

**API Verification**:
- All 66 books `unlocked: true`
- Overall mastery accurately computed

---

## W-M08-L2-005 — Journey UI: OT/NT tabs + book cards rendered

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @journey @parallel-safe

**Actions**:
1. `page.goto('/journey')`

**Assertions** (UI):
- `expect(page.getByTestId('journey-page')).toBeVisible()`
- `expect(page.getByTestId('journey-summary-card')).toBeVisible()`
- Switch to OT tab → 39 books visible
- Switch to NT tab → 27 books visible

---

## W-M08-L2-006 — Click book card → navigate to Practice với book filter pre-selected

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @journey @parallel-safe

**Actions**:
1. `page.goto('/journey')`
2. Click Genesis book card

**Assertions**:
- URL redirects to `/practice?book=Genesis`
- Practice page shows Genesis pre-selected trong book selector

---

## NEEDS TESTID Summary (W-M08 L2)

| Element | Suggested testid |
|---------|-----------------|
| Journey page | `journey-page` |
| Summary card | `journey-summary-card` |
| OT tab | `journey-ot-tab` |
| NT tab | `journey-nt-tab` |
| Book card | `journey-book-card-{bookCode}` |

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 6s |
| L2-003 | 5s |
| L2-004 | 4s |
| L2-005 | 5s |
| L2-006 | 5s |
| **Total** | **~29s** |

---

## Summary
- **6 cases** (matches estimate)
- **P0**: 2 | **P1**: 4
- **Runtime**: ~29s
