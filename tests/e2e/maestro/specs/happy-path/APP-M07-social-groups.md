# APP-M07 — Social / Groups (L2 Happy Path)

**Screens:** GroupsListScreen → GroupJoinScreen / GroupCreateScreen / GroupDetailScreen
**Spec ref:** SPEC_USER §9.1 (mobile mirror)
**Module priority:** Tier 2 (social feature)

---

## APP-M07-L2-001 — Create group via UI → POST /api/groups → navigate to detail

**Priority**: P0
**Est. runtime**: ~15s
**Tags**: @happy-path @mobile @groups @write

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth, user has no groups]
- tapOn:
    id: "tab-social"
- waitForAnimationToEnd
- tapOn: "+ Tham gia"  # or "+ Tạo" depending on UI
- waitForAnimationToEnd
- tapOn:
    id: "group-name-input"
- inputText: "E2E Test Group"
- tapOn:
    id: "group-create-submit-btn"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "group-detail-screen"
- assertVisible:
    id: "group-join-code"  # 6-char code visible
```

**API Verification**:
- POST `/api/groups` fired với `{ name: "E2E Test Group" }`
- Response 200, joinCode matches `[A-Z0-9]{6}`

**Cleanup**:
- `DELETE /api/groups/{id}` via shell

---

## APP-M07-L2-002 — Join group via code → member added

**Priority**: P0
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @groups @write

**Setup**:
- Seed group với joinCode "TEST01" qua API

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn:
    id: "tab-social"
- waitForAnimationToEnd
- tapOn:
    id: "group-join-btn"
- waitForAnimationToEnd
- tapOn:
    id: "group-code-input"
- inputText: "TEST01"
- tapOn:
    id: "group-join-submit-btn"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "group-detail-screen"
```

**API Verification**:
- POST `/api/groups/join` → 200
- `GET /api/groups/{id}` → memberCount 2

**Cleanup**:
- Leave group + delete

---

## APP-M07-L2-003 — Join invalid code → error message

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @happy-path @mobile @groups

**Maestro YAML**:
```yaml
- tapOn:
    id: "group-code-input"
- inputText: "ZZZZZZ"
- tapOn:
    id: "group-join-submit-btn"
- waitForAnimationToEnd
- assertVisible: "không tìm thấy"  # or error toast
```

**API Verification**:
- POST `/join` → 404

---

## APP-M07-L2-004 — Group detail shows leaderboard with members sorted by XP

**Priority**: P1
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @groups

**Setup**:
- Group với 3 members (test1=0 pts, test2=1500, test3=8000)

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth as test3 + navigate to group detail]
- assertVisible:
    id: "group-detail-leaderboard"
- assertVisible: "Test Tier 3"  # expected rank 1
```

**API Verification**:
- `GET /api/groups/{id}/leaderboard` → sorted desc
- Mobile list matches API order

---

## APP-M07-L2-005 — Leave group → memberCount decreases

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @groups @write

**Setup**:
- User is member of test group (2+ members)

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [in group detail]
- scrollUntilVisible:
    element:
      id: "group-leave-btn"
    direction: DOWN
- tapOn:
    id: "group-leave-btn"
- assertVisible: "Xác nhận"  # Alert
- tapOn: "Rời nhóm"
- waitForAnimationToEnd
- assertVisible:
    id: "groups-list-screen"
```

**API Verification**:
- DELETE `/api/groups/{id}/leave` → 200
- `GET /api/groups/{id}` → memberCount -1
- User không còn trong group list

---

## APP-M07-L2-006 — Group list shows ⛪ icon + member count per row

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @happy-path @mobile @groups

**Setup**:
- User joined 2 groups

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn:
    id: "tab-social"
- waitForAnimationToEnd
- assertVisible:
    id: "group-list-item"
- assertVisible: "thành viên"
```

**API Verification**:
- `GET /api/groups/my` → length=2

---

## NEEDS TESTID Summary (APP-M07 L2)

| Element | Suggested testID |
|---------|-----------------|
| Social tab | `tab-social` |
| Groups list screen | `groups-list-screen` |
| Group list item | `group-list-item` |
| Group join btn | `group-join-btn` |
| Group code input | `group-code-input` |
| Group join submit | `group-join-submit-btn` |
| Group name input | `group-name-input` |
| Group create submit | `group-create-submit-btn` |
| Group detail screen | `group-detail-screen` |
| Group join code | `group-join-code` |
| Group detail leaderboard | `group-detail-leaderboard` |
| Group leave btn | `group-leave-btn` |

---

## Summary
- **6 cases**
- **P0**: 2 | **P1**: 4
