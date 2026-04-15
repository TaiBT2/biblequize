# APP-M10 — Settings (L2 Happy Path)

**Screens:** SettingsScreen
**Spec ref:** Settings (sound, haptics, language, logout, delete account)

---

## APP-M10-L2-001 — Sound toggle: tap → settingsStore.soundEnabled flips → persists

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @settings

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [navigate to Settings]
- tapOn:
    id: "settings-sound-switch"
- waitForAnimationToEnd
- stopApp
- launchApp
# [navigate back to Settings]
- tapOn:
    id: "tab-profile"
- tapOn:
    id: "profile-settings-btn"
# Sound toggle should still reflect flipped state
- assertVisible:
    id: "settings-sound-switch"
```

**Verification**:
- `useSettingsStore.soundEnabled` persisted via Zustand middleware (MMKV)
- Relaunch preserves value

---

## APP-M10-L2-002 — Haptics toggle: same persistence pattern

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @settings

**Maestro YAML**: Similar structure to L2-001

---

## APP-M10-L2-003 — Language switch: VI → EN → i18n updates everywhere

**Priority**: P0
**Est. runtime**: ~15s
**Tags**: @happy-path @mobile @settings @i18n

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [Settings screen]
- tapOn: "🇬🇧 English"
- waitForAnimationToEnd
- assertVisible: "Settings"  # English translation of "Cài đặt"
# Navigate to home
- tapOn:
    id: "tab-home"
- waitForAnimationToEnd
- assertVisible: "Practice"  # English "Luyện Tập"
```

**Verification**:
- react-i18next language changed globally
- `useOnboardingStore.preferredLanguage` = 'en'
- MMKV persist for relaunch

**Cleanup**:
- Switch back to VI

---

## APP-M10-L2-004 — Logout from Settings → confirmation dialog → clear auth → LoginScreen

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @settings @auth

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- scrollUntilVisible:
    element:
      id: "settings-logout-row"
    direction: DOWN
- tapOn:
    id: "settings-logout-row"
- assertVisible: "Đăng xuất"
- assertVisible: "Bạn có chắc muốn đăng xuất?"
- tapOn: "Đăng xuất"  # confirm destructive action
- waitForAnimationToEnd:
    timeout: 3000
- assertVisible: "[DEV] Quick Login"
```

**Verification**:
- `authStore.logout()` clears user + tokens
- Storage cleared
- App navigates to AuthNavigator root (LoginScreen)

---

## APP-M10-L2-005 — Delete account → confirmation → DELETE /api/me → logged out

**Priority**: P1
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @settings @write

**Setup**:
- Ephemeral test user (destructive action, cannot reuse test accounts)

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- scrollUntilVisible:
    element:
      text: "Xoá tài khoản"
    direction: DOWN
- tapOn: "Xoá tài khoản"
- assertVisible: "Xác nhận"  # Alert
- tapOn: "Xoá"  # destructive confirm
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible: "[DEV] Quick Login"
```

**API Verification**:
- `DELETE /api/me` or `/api/auth/delete-account` fired
- User row soft-deleted or hard-deleted from DB
- Auth cleared

**Notes**:
- [CRITICAL SETUP]: MUST use ephemeral user or this deletes reusable test account
- [NEEDS CODE CHECK]: confirm delete endpoint path from [apps/mobile/src/screens/user/SettingsScreen.tsx](apps/mobile/src/screens/user/SettingsScreen.tsx)

---

## Summary
- **5 cases**
- **P0**: 3 | **P1**: 2
- Delete account test requires ephemeral user (destructive)
