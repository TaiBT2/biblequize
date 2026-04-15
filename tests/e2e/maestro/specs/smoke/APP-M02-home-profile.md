# APP-M02 — Home & Profile (L1 Smoke)

**Screens:** HomeScreen, ProfileScreen
**Spec ref:** Main tab 1 (Home) + tab 4 (Profile)
**Auth required:** Yes — use DEV Quick Login pattern (see APP-M01-L1-005 for full flow)

---

## Shared Setup Flow (reuse across tests in this module)

```yaml
# Inline at top of each test that needs auth
- launchApp:
    clearState: true
- waitForAnimationToEnd:
    timeout: 4000
- tapOn: "Tiếng Việt"
- tapOn:
    id: "language-continue-btn"
- tapOn:
    id: "slide-get-started-btn"
- tapOn: "[DEV] Quick Login"
- waitForAnimationToEnd:
    timeout: 5000
```

---

## APP-M02-L1-001 — HomeScreen render đúng với các game mode cards

**Priority**: P0
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @home @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- assertVisible:
    id: "home-screen"
- assertVisible: "BibleQuiz"
- assertVisible:
    id: "home-streak-badge"
- assertVisible:
    id: "home-tier-card"
- assertVisible:
    id: "home-game-modes-grid"
- assertVisible: "Luyện Tập"
- assertVisible: "Thi Đấu"
- assertVisible: "Thử Thách Ngày"
```

**Assertions**:
- HomeScreen wrapper visible
- Brand text "BibleQuiz" visible
- Streak badge visible (có số streak hoặc 0)
- Tier card visible (icon + tier name + progress bar)
- Game modes grid visible với ít nhất "Luyện Tập", "Thi Đấu", "Thử Thách Ngày"

**Notes**:
- [NEEDS TESTID: home-screen] — root ScrollView của HomeScreen
- [NEEDS TESTID: home-streak-badge] — View chứa icon 🔥 + streak count
- [NEEDS TESTID: home-tier-card] — Card component chứa tier info
- [NEEDS TESTID: home-game-modes-grid] — View chứa tất cả game mode cards

---

## APP-M02-L1-002 — Tap game mode card → navigate đúng screen

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @home @navigation

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- assertVisible:
    id: "home-screen"
- tapOn: "Luyện Tập"
- waitForAnimationToEnd
- assertVisible: "Chọn cấu hình quiz của bạn"
- tapOn:
    id: "back-btn"
- waitForAnimationToEnd
- assertVisible:
    id: "home-screen"
```

**Assertions**:
- Tap "Luyện Tập" → PracticeSelectScreen → "Chọn cấu hình quiz của bạn" visible
- Back navigation → trở về HomeScreen

**Notes**:
- [NEEDS TESTID: back-btn] — nút Back trong header (hoặc Android system back)
- "Chọn cấu hình quiz của bạn" là static subtitle text trong PracticeSelectScreen

---

## APP-M02-L1-003 — Navigate sang ProfileScreen qua tab bar

**Priority**: P0
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @profile @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- assertVisible:
    id: "home-screen"
- tapOn:
    id: "tab-profile"
- waitForAnimationToEnd
- assertVisible:
    id: "profile-screen"
- assertVisible:
    id: "profile-avatar"
- assertVisible:
    id: "profile-tier-card"
- assertVisible:
    id: "profile-stats-grid"
```

**Assertions**:
- Tap Profile tab → ProfileScreen visible
- Avatar component visible
- Tier card visible (icon + name + XP + progress bar)
- Stats grid visible (Tổng điểm, Chuỗi ngày, Kỷ lục)

**Notes**:
- [NEEDS TESTID: tab-profile] — Profile tab button trong bottom tab bar
- [NEEDS TESTID: profile-screen] — root ScrollView của ProfileScreen
- [NEEDS TESTID: profile-avatar] — Avatar component
- [NEEDS TESTID: profile-tier-card] — Card component chứa tier info
- [NEEDS TESTID: profile-stats-grid] — View chứa stat boxes

---

## APP-M02-L1-004 — ProfileScreen hiển thị user name và email

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @profile

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn:
    id: "tab-profile"
- waitForAnimationToEnd
- assertVisible:
    id: "profile-user-name"
- assertVisible:
    id: "profile-user-email"
```

**Assertions**:
- User name text visible (từ auth store)
- User email text visible

**Notes**:
- [NEEDS TESTID: profile-user-name] — Text component hiển thị user.name
- [NEEDS TESTID: profile-user-email] — Text component hiển thị user.email
- Test account: `mobile@test.com` → email text phải visible

---

## NEEDS TESTID Summary (APP-M02)

| Element | Suggested testID | File |
|---------|-----------------|------|
| Home screen root | `home-screen` | screens/main/HomeScreen.tsx |
| Streak badge | `home-streak-badge` | screens/main/HomeScreen.tsx |
| Tier card | `home-tier-card` | screens/main/HomeScreen.tsx |
| Game modes grid | `home-game-modes-grid` | screens/main/HomeScreen.tsx |
| Profile tab | `tab-profile` | navigation/MainTabNavigator.tsx |
| Profile screen | `profile-screen` | screens/user/ProfileScreen.tsx |
| Avatar | `profile-avatar` | screens/user/ProfileScreen.tsx |
| Profile tier card | `profile-tier-card` | screens/user/ProfileScreen.tsx |
| Stats grid | `profile-stats-grid` | screens/user/ProfileScreen.tsx |
| User name | `profile-user-name` | screens/user/ProfileScreen.tsx |
| User email | `profile-user-email` | screens/user/ProfileScreen.tsx |
| Back button | `back-btn` | navigation/RootNavigator.tsx (header) |
