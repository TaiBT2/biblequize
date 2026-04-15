# APP-M08 — Journey Map (L1 Smoke)

**Screens:** JourneyMapScreen
**Spec ref:** Bible Journey Map — mastery by book
**Auth required:** Yes
**API:** `GET /api/me/journey`

---

## APP-M08-L1-001 — JourneyMapScreen render đúng với summary card

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @smoke @mobile @journey @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn:
    id: "tab-journey"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "journey-screen"
- assertVisible:
    id: "journey-summary-card"
- assertVisible:
    id: "journey-ot-tab"
- assertVisible:
    id: "journey-nt-tab"
```

**Assertions**:
- JourneyMapScreen visible
- Summary card visible (totalBooks, completedBooks, overallMastery)
- OT / NT tab buttons visible

**Notes**:
- [NEEDS TESTID: tab-journey] — Journey tab trong bottom tab bar (nếu có) hoặc navigate từ Home
- [NEEDS TESTID: journey-screen] — root SafeScreen
- [NEEDS TESTID: journey-summary-card] — Card hiển thị summary stats
- [NEEDS TESTID: journey-ot-tab] — "Old Testament" / "Cựu Ước" tab button
- [NEEDS TESTID: journey-nt-tab] — "New Testament" / "Tân Ước" tab button
- Journey có thể không có tab riêng trong bottom bar — navigate từ Home hoặc Profile. Kiểm tra MainTabNavigator

---

## APP-M08-L1-002 — OT/NT tab switch hiển thị books đúng testament

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @smoke @mobile @journey

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth + journey screen open]
- assertVisible:
    id: "journey-ot-tab"
- tapOn:
    id: "journey-ot-tab"
- waitForAnimationToEnd
- assertVisible:
    id: "journey-book-card"
- tapOn:
    id: "journey-nt-tab"
- waitForAnimationToEnd
- assertVisible:
    id: "journey-book-card"
```

**Assertions**:
- Tap OT tab → book cards visible (Cựu Ước)
- Tap NT tab → book cards visible (Tân Ước)

**Notes**:
- [NEEDS TESTID: journey-book-card] — mỗi book card trong danh sách

---

## APP-M08-L1-003 — Book card hiển thị mastery percentage

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @smoke @mobile @journey

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth + journey screen on OT tab]
- assertVisible:
    id: "journey-book-card"
- assertVisible:
    id: "journey-book-mastery-bar"
```

**Assertions**:
- Book card visible với progress bar (mastery %)
- At least 1 book card visible

**Notes**:
- [NEEDS TESTID: journey-book-mastery-bar] — ProgressBar component trong mỗi book card

---

## APP-M08-L1-004 — Tap book card → navigate to PracticeSelect với book filter

**Priority**: P1
**Est. runtime**: ~12s
**Tags**: @smoke @mobile @journey @navigation

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth + journey screen]
- tapOn:
    id: "journey-book-card"
- waitForAnimationToEnd
- assertVisible:
    id: "practice-select-screen"
```

**Assertions**:
- Tap any book card → navigate to PracticeSelectScreen (với book filter pre-selected)
- PracticeSelectScreen visible

**Notes**:
- Navigation: `navigation.navigate('PracticeSelect', { book: bookCode })`
- PracticeSelect pre-selects book filter — confirm implementation

---

## NEEDS TESTID Summary (APP-M08)

| Element | Suggested testID | File |
|---------|-----------------|------|
| Journey tab | `tab-journey` | navigation/MainTabNavigator.tsx |
| Journey screen | `journey-screen` | screens/progress/JourneyMapScreen.tsx |
| Summary card | `journey-summary-card` | screens/progress/JourneyMapScreen.tsx |
| OT tab | `journey-ot-tab` | screens/progress/JourneyMapScreen.tsx |
| NT tab | `journey-nt-tab` | screens/progress/JourneyMapScreen.tsx |
| Book card | `journey-book-card` | screens/progress/JourneyMapScreen.tsx |
| Book mastery bar | `journey-book-mastery-bar` | screens/progress/JourneyMapScreen.tsx |
