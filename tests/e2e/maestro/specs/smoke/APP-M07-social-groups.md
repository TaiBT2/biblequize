# APP-M07 — Social / Groups (L1 Smoke)

**Screens:** GroupsListScreen → GroupJoinScreen / GroupDetailScreen
**Spec ref:** Social tab (Groups)
**Auth required:** Yes

---

## APP-M07-L1-001 — GroupsListScreen render — empty state khi chưa có nhóm

**Priority**: P0
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @groups @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth — user mobile@test.com không thuộc nhóm nào ban đầu]
- tapOn:
    id: "tab-social"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "groups-list-screen"
- assertVisible: "Nhóm của tôi"
- assertVisible: "👥"
- assertVisible: "Chưa có nhóm"
- assertVisible: "Tham gia nhóm"
```

**Assertions**:
- GroupsListScreen visible
- Title "Nhóm của tôi" visible
- Empty state: icon 👥 + text "Chưa có nhóm" + "Tham gia nhóm" button visible

**Notes**:
- [NEEDS TESTID: groups-list-screen] — root SafeScreen
- [NEEDS TESTID: tab-social] — Social / Groups tab trong bottom tab bar
- "Chưa có nhóm" và "Tham gia nhóm" là static text → text-based assert đủ
- Precondition: test user không thuộc nhóm nào (default state khi seed)

---

## APP-M07-L1-002 — "+ Tham gia" button → navigate GroupJoinScreen

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @groups

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn:
    id: "tab-social"
- waitForAnimationToEnd:
    timeout: 5000
- tapOn: "+ Tham gia"
- waitForAnimationToEnd
- assertVisible:
    id: "group-join-screen"
- assertVisible:
    id: "group-code-input"
- assertVisible:
    id: "group-join-submit-btn"
```

**Assertions**:
- Tap "+ Tham gia" button → navigate to GroupJoinScreen
- Code input visible
- Submit button visible

**Notes**:
- [NEEDS TESTID: group-join-screen] — root View GroupJoinScreen
- [NEEDS TESTID: group-code-input] — TextInput nhập group code
- [NEEDS TESTID: group-join-submit-btn] — "Tham gia" submit button

---

## APP-M07-L1-003 — Group list hiển thị khi có ít nhất 1 nhóm

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @groups

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth + seed: user đã thuộc nhóm "Test Group" via API]
- tapOn:
    id: "tab-social"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "groups-list-screen"
- assertVisible:
    id: "group-list-item"
- assertVisible: "⛪"
```

**Assertions**:
- Group card với icon ⛪ visible
- Group name visible (từ seed data)

**Notes**:
- [NEEDS TESTID: group-list-item] — Card/Pressable mỗi nhóm trong list
- [NOT IMPLEMENTED: seed test user vào group — cần `POST /api/groups/{id}/join` với admin token hoặc direct DB seed]

---

## APP-M07-L1-004 — Tap group → GroupDetailScreen

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @smoke @mobile @groups

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth + seed: user trong nhóm]
- tapOn:
    id: "tab-social"
- waitForAnimationToEnd:
    timeout: 5000
- tapOn:
    id: "group-list-item"
- waitForAnimationToEnd
- assertVisible:
    id: "group-detail-screen"
- assertVisible:
    id: "group-detail-members-list"
- assertVisible:
    id: "group-detail-leaderboard"
```

**Assertions**:
- Tap group card → navigate to GroupDetailScreen
- Members list visible
- Leaderboard visible

**Notes**:
- [NEEDS TESTID: group-detail-screen] — root GroupDetailScreen
- [NEEDS TESTID: group-detail-members-list] — members section
- [NEEDS TESTID: group-detail-leaderboard] — leaderboard section

---

## NEEDS TESTID Summary (APP-M07)

| Element | Suggested testID | File |
|---------|-----------------|------|
| Social tab | `tab-social` | navigation/MainTabNavigator.tsx |
| Groups list screen | `groups-list-screen` | screens/social/GroupsListScreen.tsx |
| Group list item | `group-list-item` | screens/social/GroupsListScreen.tsx |
| Group join screen | `group-join-screen` | screens/social/GroupJoinScreen.tsx |
| Group code input | `group-code-input` | screens/social/GroupJoinScreen.tsx |
| Join submit btn | `group-join-submit-btn` | screens/social/GroupJoinScreen.tsx |
| Group detail screen | `group-detail-screen` | screens/social/GroupDetailScreen.tsx |
| Members list | `group-detail-members-list` | screens/social/GroupDetailScreen.tsx |
| Leaderboard | `group-detail-leaderboard` | screens/social/GroupDetailScreen.tsx |

## NOT IMPLEMENTED Summary

| Feature | Notes |
|---------|-------|
| Group seed for test user | Cần API hoặc DB seed để test user trong 1 nhóm |
