# APP-M10 — Settings (L1 Smoke)

**Screens:** SettingsScreen
**Spec ref:** Settings (Cài đặt) — sound, haptics, language, logout, delete account
**Auth required:** Yes

---

## APP-M10-L1-001 — SettingsScreen render đúng với tất cả sections

**Priority**: P0
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @settings @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn:
    id: "tab-profile"
- waitForAnimationToEnd
- tapOn:
    id: "profile-settings-btn"
- waitForAnimationToEnd
- assertVisible:
    id: "settings-screen"
- assertVisible: "Cài đặt"
- assertVisible: "Âm thanh & Rung"
- assertVisible: "Âm thanh"
- assertVisible: "Rung phản hồi"
- assertVisible: "Ngôn ngữ"
- assertVisible: "🇻🇳 Tiếng Việt"
- assertVisible: "🇬🇧 English"
```

**Assertions**:
- SettingsScreen visible
- Title "Cài đặt" visible
- "Âm thanh & Rung" section visible với cả 2 toggles
- "Ngôn ngữ" section visible với 2 language buttons

**Notes**:
- [NEEDS TESTID: settings-screen] — root ScrollView
- [NEEDS TESTID: profile-settings-btn] — nút navigate tới Settings từ ProfileScreen (hoặc SettingsScreen có tab riêng)
- "🇻🇳 Tiếng Việt" và "🇬🇧 English" là static text → text-based assert
- Kiểm tra navigation path: Settings có thể navigate từ Profile tab hoặc trực tiếp

---

## APP-M10-L1-002 — Sound toggle: bật/tắt

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @settings

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth + settings screen open]
- assertVisible:
    id: "settings-sound-switch"
- tapOn:
    id: "settings-sound-switch"
- waitForAnimationToEnd
- assertVisible:
    id: "settings-sound-switch"
```

**Assertions**:
- Sound Switch visible và tappable
- Tap toggles value (soundEnabled state flips)
- Switch component re-renders với new value

**Notes**:
- [NEEDS TESTID: settings-sound-switch] — Switch component cho "Âm thanh"
- Maestro `tapOn` Switch → toggles it; không cần assert actual value (visual only)

---

## APP-M10-L1-003 — Language switch: chọn English → UI text thay đổi

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @smoke @mobile @settings @i18n

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth + settings screen open, default language = vi]
- tapOn: "🇬🇧 English"
- waitForAnimationToEnd
- assertVisible: "Settings"
```

**Assertions**:
- Tap "🇬🇧 English" → `setPreferredLanguage('en')` → i18n language changes
- Title changes from "Cài đặt" → "Settings"

**Notes**:
- i18n via react-i18next — language switch triggers re-render
- "Settings" là English translation của section title
- Teardown: tap "🇻🇳 Tiếng Việt" để reset về VI

---

## APP-M10-L1-004 — Logout → confirmation dialog → về LoginScreen

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @smoke @mobile @settings @auth

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth + settings screen open]
- scrollUntilVisible:
    element:
      id: "settings-logout-row"
    direction: DOWN
- tapOn:
    id: "settings-logout-row"
- waitForAnimationToEnd
- assertVisible: "Đăng xuất"
- assertVisible: "Bạn có chắc muốn đăng xuất?"
- tapOn: "Đăng xuất"
- waitForAnimationToEnd:
    timeout: 3000
- assertVisible: "BibleQuiz"
- assertVisible: "[DEV] Quick Login"
```

**Assertions**:
- Tap logout row → Alert.alert dialog visible với "Đăng xuất" title
- "Bạn có chắc muốn đăng xuất?" message visible
- Tap "Đăng xuất" → logout() clears auth → navigate to LoginScreen
- LoginScreen: "BibleQuiz" title + "[DEV] Quick Login" button visible

**Notes**:
- [NEEDS TESTID: settings-logout-row] — Pressable row "Đăng xuất" trong settings
- Alert.alert buttons ("Huỷ", "Đăng xuất") — text-based tap đủ
- Maestro supports asserting native Alert dialogs via text matching

---

## APP-M10-L1-005 — Haptics toggle: bật/tắt

**Priority**: P2
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @settings

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth + settings screen open]
- assertVisible:
    id: "settings-haptics-switch"
- tapOn:
    id: "settings-haptics-switch"
- waitForAnimationToEnd
- assertVisible:
    id: "settings-haptics-switch"
```

**Assertions**:
- Haptics Switch visible và tappable

**Notes**:
- [NEEDS TESTID: settings-haptics-switch] — Switch component cho "Rung phản hồi"

---

## NEEDS TESTID Summary (APP-M10)

| Element | Suggested testID | File |
|---------|-----------------|------|
| Settings screen | `settings-screen` | screens/user/SettingsScreen.tsx |
| Settings navigate btn | `profile-settings-btn` | screens/user/ProfileScreen.tsx |
| Sound switch | `settings-sound-switch` | screens/user/SettingsScreen.tsx |
| Haptics switch | `settings-haptics-switch` | screens/user/SettingsScreen.tsx |
| Logout row | `settings-logout-row` | screens/user/SettingsScreen.tsx |
