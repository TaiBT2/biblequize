# APP-M02 — Home & Profile (L2 Happy Path)

**Screens:** HomeScreen, ProfileScreen
**Spec ref:** SPEC_USER §13 (mobile mirror)
**Module priority:** Tier 2 (data accuracy)

---

## APP-M02-L2-001 — Home hiển thị tier name đúng với totalPoints từ API

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @home

**Setup**:
- `POST seed-points { totalPoints: 8000 }` (test user → tier 3 Môn Đồ)

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth]
- assertVisible:
    id: "home-screen"
- assertVisible: "Môn Đồ"  # tier 3 name
- assertVisible: "8.000"  # localized XP format
```

**API Verification**:
- `GET /api/me` → `totalPoints: 8000`
- `GET /api/me/tier-progress` → `tierLevel: 3, tierName: "Môn Đồ"`

---

## APP-M02-L2-002 — Streak badge accurate: pre-seed streak=15

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @happy-path @mobile @home

**Setup**:
- `POST set-streak?days=15`

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- assertVisible:
    id: "home-streak-badge"
- assertVisible: "15"
```

**API Verification**:
- `GET /api/me/streak` → `currentStreak: 15`

---

## APP-M02-L2-003 — Tap game mode card → navigate (data flow)

**Priority**: P1
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @home

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn: "Luyện Tập"
- waitForAnimationToEnd
- assertVisible:
    id: "practice-select-screen"
- back
- assertVisible:
    id: "home-screen"
- tapOn: "Thi Đấu"
- waitForAnimationToEnd
- assertVisible:
    id: "ranked-screen"
```

**Notes**:
- Each navigation verifies router wiring for game modes grid

---

## APP-M02-L2-004 — Profile shows user name, email, avatar from auth store

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @profile

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn:
    id: "tab-profile"
- waitForAnimationToEnd
- assertVisible:
    id: "profile-screen"
- assertVisible: "mobile@test.com"  # dev login account
- assertVisible:
    id: "profile-avatar"
```

---

## APP-M02-L2-005 — Profile stats: totalPoints, streak, longest from API

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @profile

**Setup**:
- `POST set-streak?days=20` (current)

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn:
    id: "tab-profile"
- waitForAnimationToEnd
- assertVisible:
    id: "profile-stats-grid"
- assertVisible: "20"  # current streak
```

**API Verification**:
- `GET /api/me` data matches displayed values

---

## APP-M02-L2-006 — Profile tier card shows tier icon, name, progress bar

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @profile

**Setup**:
- `POST seed-points { totalPoints: 8000 }`

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn:
    id: "tab-profile"
- waitForAnimationToEnd
- assertVisible:
    id: "profile-tier-card"
- assertVisible: "Môn Đồ"
- assertVisible: "8.000 XP"
```

**API Verification**:
- `GET /api/me/tier-progress` → `tierLevel: 3, tierProgressPercent` matches UI percent

**Notes**:
- `getTierProgress` (logic/tierProgression.ts) computes tier locally from totalPoints — verify match với backend tier-progress endpoint

---

## Summary
- **6 cases**
- **P0**: 2 | **P1**: 4
