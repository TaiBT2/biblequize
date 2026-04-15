# APP-M09 — Achievements (L1 Smoke)

**Screens:** AchievementsScreen
**Spec ref:** Achievement badges — unlocked / locked grid
**Auth required:** Yes
**API:** `GET /api/achievements/me`

---

## APP-M09-L1-001 — AchievementsScreen render đúng với title và grid

**Priority**: P0
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @achievements @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn:
    id: "tab-achievements"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "achievements-screen"
- assertVisible: "Thành tích"
- assertVisible:
    id: "achievements-grid"
```

**Assertions**:
- AchievementsScreen visible
- Title "Thành tích" visible
- Badges grid visible

**Notes**:
- [NEEDS TESTID: tab-achievements] — Achievements tab trong tab bar (nếu có) hoặc navigate từ Profile
- [NEEDS TESTID: achievements-screen] — root ScrollView
- [NEEDS TESTID: achievements-grid] — View chứa badge grid
- Kiểm tra MainTabNavigator xem Achievements có tab riêng không

---

## APP-M09-L1-002 — Subtitle hiển thị X/Y đã mở khóa

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @achievements

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn:
    id: "tab-achievements"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "achievements-subtitle"
```

**Assertions**:
- Subtitle text visible: format "X/Y đã mở khóa" (e.g. "0/10 đã mở khóa")
- Counts phản ánh API response

**Notes**:
- [NEEDS TESTID: achievements-subtitle] — Text hiển thị "X/Y đã mở khóa"
- Text format: `{unlocked.length}/{badges.length} đã mở khóa`

---

## APP-M09-L1-003 — Badge cards visible (locked + unlocked states)

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @achievements

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn:
    id: "tab-achievements"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "achievement-badge-card"
```

**Assertions**:
- At least 1 badge card visible
- Badge card có icon, name, description
- Locked badge có 🔒 icon (opacity 0.3 trên badge icon)

**Notes**:
- [NEEDS TESTID: achievement-badge-card] — mỗi View badge trong grid
- Locked state: `badgeLocked` style + `lockText` "🔒" — text-based assert cho 🔒

---

## APP-M09-L1-004 — Empty/loading state khi API chưa trả kết quả

**Priority**: P2
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @achievements

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn:
    id: "tab-achievements"
- waitForAnimationToEnd:
    timeout: 3000
- assertVisible: "Đang tải thành tích..."
```

**Assertions**:
- Khi `badges.length === 0` → "Đang tải thành tích..." visible
- Text là static fallback trong component

**Notes**:
- "Đang tải thành tích..." là static text — text-based assert, không cần testID
- Test này pass khi API chậm hoặc trống — race condition có thể khiến test flaky
- Tag @P2 — không phải smoke critical

---

## NEEDS TESTID Summary (APP-M09)

| Element | Suggested testID | File |
|---------|-----------------|------|
| Achievements tab | `tab-achievements` | navigation/MainTabNavigator.tsx |
| Achievements screen | `achievements-screen` | screens/user/AchievementsScreen.tsx |
| Badges grid | `achievements-grid` | screens/user/AchievementsScreen.tsx |
| Subtitle (count) | `achievements-subtitle` | screens/user/AchievementsScreen.tsx |
| Badge card | `achievement-badge-card` | screens/user/AchievementsScreen.tsx |
