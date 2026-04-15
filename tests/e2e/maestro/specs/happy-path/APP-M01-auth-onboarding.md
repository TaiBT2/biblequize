# APP-M01 — Auth & Onboarding (L2 Happy Path)

**Screens:** SplashScreen → Language → WelcomeSlides → TryQuiz → LoginScreen → HomeScreen
**Spec ref:** SPEC_USER §2, §14.3 (mobile)
**Module priority:** Tier 3 (L1 đã cover 5 cases, L2 focus: token flow + state persistence)

---

## APP-M01-L2-001 — Dev login → POST /api/auth/mobile/login → auth store populated

**Priority**: P0
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @auth @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- launchApp:
    clearState: true
# [full onboarding flow]
- tapOn: "[DEV] Quick Login"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "home-screen"
```

**API Verification**:
- POST `/api/auth/mobile/login` fires với `{ email: "mobile@test.com", password: "password123" }`
- Response: `{ accessToken, refreshToken, id, name, email, avatar, role }`
- Mobile Zustand `authStore.user` populated với response data
- `GET /api/me` succeeds với accessToken

---

## APP-M01-L2-002 — App relaunch after login → auto-restore session

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @auth @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth done, user on home]
- stopApp
- launchApp
- waitForAnimationToEnd:
    timeout: 5000
# Should bypass login screen
- assertVisible:
    id: "home-screen"
```

**Verification**:
- Mobile persists token via MMKV / AsyncStorage
- On relaunch, `authStore` hydrates from storage → skip login flow

**Notes**:
- Critical for mobile UX — users don't want to re-login every open
- Test fails nếu token storage broken

---

## APP-M01-L2-003 — Token refresh: expired access token → auto-refresh via refreshToken

**Priority**: P0
**Est. runtime**: ~15s
**Tags**: @happy-path @mobile @auth @critical

**Setup**:
- Login successfully
- Manually invalidate accessToken trong authStore (shell hack) OR wait until expiry

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth done, token manually expired]
- tapOn:
    id: "tab-profile"
- waitForAnimationToEnd:
    timeout: 5000
# Should refresh transparently, not redirect to login
- assertVisible:
    id: "profile-screen"
```

**API Verification**:
- Network trace: `GET /api/me` → 401 → `POST /api/auth/refresh` → 200 → retry `GET /api/me` → 200
- User stays logged in, profile loads

**Notes**:
- Mobile API client ([apps/mobile/src/api/client.ts](apps/mobile/src/api/client.ts)) handles interceptor
- Expired refresh → redirect to LoginScreen (separate case)

---

## APP-M01-L2-004 — Logout via Settings → authStore cleared → LoginScreen

**Priority**: P0
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @auth

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth done]
- tapOn:
    id: "tab-profile"
- waitForAnimationToEnd
- scrollUntilVisible:
    element:
      id: "profile-settings-btn"
    direction: DOWN
- tapOn:
    id: "profile-settings-btn"
- waitForAnimationToEnd
- scrollUntilVisible:
    element:
      id: "settings-logout-row"
    direction: DOWN
- tapOn:
    id: "settings-logout-row"
- tapOn: "Đăng xuất"  # Alert confirm
- waitForAnimationToEnd:
    timeout: 3000
- assertVisible: "[DEV] Quick Login"
```

**Verification**:
- `authStore.logout()` clears in-memory state
- Storage (MMKV) cleared of tokens
- Reload app → no auto-login

---

## APP-M01-L2-005 — Guest TryQuiz → static questions, no API call to /api/me

**Priority**: P1
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @auth @guest

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- launchApp:
    clearState: true
# [onboarding → try quiz]
- tapOn:
    id: "slide-try-quiz-btn"
- waitForAnimationToEnd
- assertVisible:
    id: "try-quiz-screen"
- assertVisible:
    id: "quiz-question-text"
```

**API Verification**:
- TryQuiz uses static questions bundled in app (no API call)
- `GET /api/me` NOT fired (guest mode)

---

## Summary
- **5 cases**
- **P0**: 4 | **P1**: 1
- Critical coverage: login, relaunch restore, token refresh, logout, guest
