# APP-M09 — Achievements (L2 Happy Path)

**Screens:** AchievementsScreen
**Spec ref:** Achievement badges
**API:** `GET /api/achievements/me`

---

## APP-M09-L2-001 — GET /api/achievements/me → unlocked + locked badges

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @achievements

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn:
    id: "tab-achievements"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "achievements-screen"
- assertVisible:
    id: "achievement-badge-card"
```

**API Verification**:
- `GET /api/achievements/me` → array với `{ id, name, description, icon, unlockedAt? }`
- Mobile separates unlocked (has unlockedAt) vs locked (no unlockedAt)
- Displayed count X/Y matches `unlocked.length / badges.length`

---

## APP-M09-L2-002 — Subtitle count accurate: X/Y từ data

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @happy-path @mobile @achievements

**Setup**:
- User có ít nhất 1 achievement unlocked

**Maestro YAML**:
```yaml
- assertVisible:
    id: "achievements-subtitle"
```

**Verification**:
- Count format "X/Y đã mở khóa" matches API response counts

---

## APP-M09-L2-003 — Locked badges hiển thị 🔒 và grayscale

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @happy-path @mobile @achievements

**Maestro YAML**:
```yaml
- assertVisible:
    id: "achievement-badge-card"
- assertVisible: "🔒"
```

**Notes**:
- Locked style: `opacity 0.3` on icon + "🔒" text
- Maestro không verify opacity — chỉ assert 🔒 text presence

---

## APP-M09-L2-004 — Unlock progression: pre-seed completed missions/streaks → new badge visible

**Priority**: P1
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @achievements @write

**Setup**:
- `POST set-streak?days=30` (trigger "30-day streak" badge)
- Force achievement re-check via achievement service endpoint

**Maestro YAML**:
```yaml
- tapOn:
    id: "tab-achievements"
- waitForAnimationToEnd
# Verify specific badge now unlocked (check via API)
```

**API Verification**:
- `GET /api/achievements/me` → streak badge `unlockedAt !== null`
- Subtitle count increments

**Notes**:
- Achievement unlock logic check phụ thuộc AchievementService trigger points — may need explicit re-check endpoint
- [POTENTIAL NOT IMPLEMENTED]: no endpoint to force-recalc achievements

---

## Summary
- **4 cases**
- **P0**: 1 | **P1**: 3
