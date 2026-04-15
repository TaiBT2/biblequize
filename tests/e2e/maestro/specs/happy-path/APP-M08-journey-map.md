# APP-M08 — Journey Map (L2 Happy Path)

**Screens:** JourneyMapScreen
**Spec ref:** SPEC_USER §6 (mobile mirror)
**Module priority:** Tier 2 (mastery calculation)

---

## APP-M08-L2-001 — GET /api/me/journey returns 66 books with mastery

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @journey

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth, navigate to Journey]
- tapOn:
    id: "tab-journey"  # or navigate via Profile
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "journey-screen"
- assertVisible:
    id: "journey-summary-card"
```

**API Verification**:
- `GET /api/me/journey` → response có `summary`, `books[66]`
- Mobile `JourneyData` matches API shape (interface in code)

---

## APP-M08-L2-002 — Mastery formula: mock history → book mastery accurate

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @journey @write

**Setup**:
- `POST reset-history`
- `POST mock-history?percentSeen=50&percentWrong=20` — ~80% correct rate on seen

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [navigate to journey]
- assertVisible:
    id: "journey-book-card"
# Genesis (first book) should show mastery bar
- assertVisible:
    id: "journey-book-mastery-bar"
```

**API Verification**:
- `GET /api/me/journey` → Genesis `answeredCorrectly > 0`, `mastery` between 0-100
- Mobile ProgressBar width matches mastery percent

**Cleanup**:
- `POST reset-history`

---

## APP-M08-L2-003 — OT tab shows 39 books, NT tab shows 27 books

**Priority**: P1
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @journey

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn:
    id: "journey-ot-tab"
- waitForAnimationToEnd
- assertVisible:
    id: "journey-book-card"
# Scroll to verify multiple books
- scroll
- tapOn:
    id: "journey-nt-tab"
- waitForAnimationToEnd
- assertVisible:
    id: "journey-book-card"
```

---

## APP-M08-L2-004 — Tap book card → navigate to Practice với book pre-selected

**Priority**: P1
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @journey

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn:
    id: "journey-book-card"  # first visible book
- waitForAnimationToEnd
- assertVisible:
    id: "practice-select-screen"
```

**Verification**:
- PracticeSelectScreen receives `book` param via navigation
- Book pre-selected trong UI (check book selector shows book name)

---

## Summary
- **4 cases**
- **P0**: 2 | **P1**: 2
