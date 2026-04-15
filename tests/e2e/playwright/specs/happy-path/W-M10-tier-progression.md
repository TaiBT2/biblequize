# W-M10 — Tier Progression (L2 Happy Path)

**Routes:** `/` (tier display), `/profile`, `/cosmetics`
**Spec ref:** SPEC_USER §3
**Module priority:** Tier 1 #3 (retention mechanic — sub-tier stars, milestone burst, comeback, cosmetics, prestige)

---

## ⚠️ CRITICAL: totalPoints là DERIVED field

Từ `UserTierService.getTotalPoints()`:
```java
public int getTotalPoints(String userId) {
    List<UserDailyProgress> progress = dailyProgressRepository.findByUserIdOrderByDateDesc(userId);
    return progress.stream()
            .mapToInt(udp -> udp.getPointsCounted() != null ? udp.getPointsCounted() : 0)
            .sum();
}
```

**totalPoints** = SUM of `UserDailyProgress.pointsCounted` across all dates.
**KHÔNG có column `User.totalPoints`** — không set direct được.

---

## ⚠️ BLOCKER: Cần endpoint để pre-seed totalPoints

`AdminTestController.SetStateRequest` hiện có fields:
- `livesRemaining`, `questionsCounted`, `daysAtTier6`, `lastPlayedAt`, `xpSurgeHoursFromNow`

**KHÔNG có `pointsCounted`** — không pre-seed được user ở ngưỡng tier-up / star-up.

**Đề xuất**: Thêm field `pointsCountedToday` hoặc tạo endpoint mới:
```java
POST /api/admin/test/users/{userId}/seed-points
Body: { "totalPoints": 4999 }

Behavior: DELETE all existing UserDailyProgress for user,
          INSERT 1 row with date=today, pointsCounted=4999.
```

**Tạm thời**: Tests phụ thuộc tier bump được đánh dấu `[BLOCKED: needs pointsCounted seed]`

---

## Star XP Table (từ TierProgressService)

```
Tier 1: 200 XP/star  → stars at 200, 400, 600, 800 (tier max 1000)
Tier 2: 800 XP/star  → stars at 1800, 2600, 3400, 4200 (tier max 5000)
Tier 3: 2000 XP/star → stars at 7000, 9000, 11000, 13000 (tier max 15000)
Tier 4: 5000 XP/star → stars at 20000, 25000, 30000, 35000 (tier max 40000)
Tier 5: 12000 XP/star → stars at 52000, 64000, 76000, 88000 (tier max 100000)
Tier 6: NO STARS
```

Star bonus: **+30 XP per star crossed**.
Milestone bonuses: "50" và "90" percentage crossings (trigger animation, no XP).

---

## W-M10-L2-001 — GET /api/me/tier-progress returns correct starInfo for tier 3 user

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=tier3 (test3@dev.local)
**Tags**: @happy-path @tier @critical @parallel-safe

**Preconditions**:
- Test user3 với totalPoints ≈ 8000 (tier 3 — Môn Đồ)

**Actions**:
1. `GET /api/me/tier-progress` direct API call

**API Verification**:
- Response body:
  ```json
  {
    "tierLevel": 3,
    "tierName": "Môn Đồ",
    "totalPoints": 8000,
    "nextTierPoints": 15000,
    "tierProgressPercent": 30.0,  // (8000-5000)/10000 * 100
    "starIndex": 1,                // (8000-5000)/2000 = 1
    "starXp": 7000,                // tierStart + 1*2000
    "nextStarXp": 9000,            // tierStart + 2*2000
    "starProgressPercent": 50.0,   // (8000-7000)/(9000-7000) * 100
    "milestone": null,
    "surgeActive": false
  }
  ```

**Notes**:
- Assumptions về totalPoints = 8000 — verify actual test3 value, tolerance ±100
- Pure read-only, parallel-safe

---

## W-M10-L2-002 — Star boundary crossed → StarEvent with +30 bonus XP

**Priority**: P0
**Est. runtime**: ~8s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @tier @stars @write @serial

**Setup**:
- **[BLOCKED]**: Pre-seed user3 với totalPoints = 6999 (sát ngưỡng star 1 của tier 3 tại 7000)
- Cần endpoint seed-points

**Actions**:
1. Trigger ranked answer correct → earn ≥ 1 XP → totalPoints ≥ 7000
2. Observe star event

**API Verification**:
- `GET /api/me/tier-progress` AFTER:
  - `starIndex: 1` (was 0)
  - `starXp: 7000`, `nextStarXp: 9000`
- Server fires StarEvent via `TierProgressService.checkStarBoundary(6999, 7001)`:
  - `newStarIndex = 1`, `bonusXp = 30`
- Total delta XP = `answer earned` + `30 star bonus`

**Notes**:
- [BLOCKED: needs pointsCounted seed endpoint]
- Star bonus 30 XP — confirmed from TierProgressService.checkStarBoundary line 119

---

## W-M10-L2-003 — Milestone 50% crossing → milestone="50" trong response

**Priority**: P1
**Est. runtime**: ~8s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @tier @milestone @write @serial

**Setup**:
- **[BLOCKED]**: Pre-seed totalPoints = 9999 (just below 50% của tier 3 range: 5000 + 10000*0.5 = 10000)

**Actions**:
1. Earn 1 XP → cross 10000
2. Call `TierProgressService.checkMilestone(9999, 10001)` returns "50"

**API Verification**:
- `GET /api/me/tier-progress` → `milestone: "50"` (set by caller in `awardPoints` flow)
- Nếu milestone trigger qua WebSocket hoặc eager endpoint, verify broadcast/notification

**Notes**:
- [BLOCKED: needs pointsCounted seed]
- Milestone "50" và "90" trigger animation client-side — L2 verify server-side field chính xác

---

## W-M10-L2-004 — Milestone 90% crossing → milestone="90"

**Priority**: P1
**Est. runtime**: ~8s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @tier @milestone @write @serial

**Setup**:
- **[BLOCKED]**: Pre-seed totalPoints = 13999 (just below 90% của tier 3: 5000 + 10000*0.9 = 14000)

**Actions**:
1. Earn 1 XP → cross 14000

**API Verification**:
- `GET /api/me/tier-progress` → `milestone: "90"`

**Notes**:
- [BLOCKED]
- Test boundary: oldPercent=89.99, newPercent=90.01

---

## W-M10-L2-005 — Tier bump: cross tier threshold → new tierLevel + starIndex reset to 0

**Priority**: P0
**Est. runtime**: ~8s
**Auth**: fresh login as test2@dev.local
**Tags**: @happy-path @tier @tier-bump @write @serial

**Setup**:
- **[BLOCKED]**: Pre-seed totalPoints = 4999 (just below tier 3 threshold 5000)

**Actions**:
1. Earn 1 XP → cross 5000 → tier 2 → tier 3

**API Verification**:
- `GET /api/me/tier-progress`:
  - `tierLevel: 3` (was 2)
  - `tierName: "Môn Đồ"`
  - `starIndex: 0` (reset cho tier mới)
  - `starXp: 5000` (tier 3 start)
  - `nextStarXp: 7000` (tier 3 first star)
- `checkStarBoundary` returns StarEvent(0, 30) vì `oldTier != newTier` → oldStarIndex = -1 → newStarIndex 0 > -1 → event fired

**Notes**:
- [BLOCKED]
- Cross-tier event là quan trọng: UI triggers tier-up animation/modal
- `User.lastPlayedAt` phải update để prevent comeback trigger

---

## W-M10-L2-006 — XP surge active → surgeActive=true, surgeMultiplier=1.5

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @tier @xp-surge @write @serial

**Setup**:
- `POST /api/admin/test/users/{userId}/set-state` với `{ xpSurgeHoursFromNow: 2 }` — active 2 giờ

**Actions**:
1. `GET /api/me/tier-progress`

**API Verification**:
- Response:
  - `surgeActive: true`
  - `surgeUntil: "<ISO datetime ~2 hours from now>"`
  - `surgeMultiplier: 1.5`
- Next ranked answer earn → earned = `base × tierMult × 1.5` (surge applied)
- Verify deep equality của surgeUntil (tolerance ±5 min cho clock drift)

**Cleanup**:
- `set-state` với `{ xpSurgeHoursFromNow: 0 }` — clear surge

**Notes**:
- AdminTestController đã support `xpSurgeHoursFromNow` field — confirmed OK
- Test both: set surge + verify multiplier applied trong ScoringService.calculateWithTier()

---

## W-M10-L2-007 — XP surge expired → surgeActive=false, multiplier=1.0

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @tier @xp-surge @write @serial

**Setup**:
- `set-state` với `{ xpSurgeHoursFromNow: 0 }` — clear any surge

**Actions**:
1. `GET /api/me/tier-progress`

**API Verification**:
- `surgeActive: false`, `surgeUntil: null`, `surgeMultiplier: 1.0`

---

## W-M10-L2-008 — Tier 6 user: no stars, starIndex always 0

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier6 (test6@dev.local)
**Tags**: @happy-path @tier @parallel-safe

**Preconditions**:
- test6 ở tier 6 (~110000 pts)

**Actions**:
1. `GET /api/me/tier-progress`

**API Verification**:
- `tierLevel: 6`, `tierName: "Sứ Đồ"`
- `starIndex: 0`, `starXp === nextStarXp` (tier 6 không có stars per `TierProgressService` logic line 65-68)
- `starProgressPercent: 100.0`
- `nextTierPoints === tierStart` (không có next tier)

**Notes**:
- Read-only, parallel-safe
- Tier 6 edge case: `STAR_XP[6] = 0`, logic skip sang else branch

---

## W-M10-L2-009 — Daily missions: GET /api/me/daily-missions returns today's missions

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @tier @missions @parallel-safe

**Preconditions**:
- User có daily missions seeded cho hôm nay

**Actions**:
1. `GET /api/me/daily-missions`

**API Verification**:
- Response có array missions, mỗi mission có:
  - `missionType` (string, e.g. "ANSWER_5_CORRECT")
  - `progress` (int)
  - `target` (int)
  - `completed` (bool)
  - `bonusClaimed` (bool)
  - `bonusXp` (int)
- Length = 3 missions/day per spec

**Notes**:
- Parallel-safe nếu không modify state
- Missions reset mỗi 00:00 UTC — test chạy ngay sau reset có thể gặp fresh state

---

## W-M10-L2-010 — Daily mission progress update: pre-seed mission → complete → verify

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @tier @missions @write @serial

**Setup**:
- `POST /api/admin/test/users/{userId}/set-mission-state` với:
  ```json
  {
    "missions": [
      { "missionType": "ANSWER_5_CORRECT", "progress": 4, "completed": false }
    ]
  }
  ```

**Actions**:
1. Trigger 1 correct answer (practice hoặc ranked)

**API Verification**:
- `GET /api/me/daily-missions` → mission "ANSWER_5_CORRECT": `progress: 5, completed: true`
- Nếu có bonus XP grant logic → `totalPoints` tăng thêm `bonusXp` sau khi complete

**Cleanup**:
- `set-mission-state` reset

**Notes**:
- AdminTestController đã có `set-mission-state` endpoint — works
- Verify mission progress increment is atomic (thread-safe)

---

## W-M10-L2-011 — Mission bonus claim → +X XP granted

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @tier @missions @write @serial

**Setup**:
- `set-mission-state`: mission `{ completed: true, bonusClaimed: false, bonusXp: 50 }`

**Actions**:
1. `POST /api/me/daily-missions/{missionId}/claim-bonus` (hoặc equivalent endpoint)

**API Verification**:
- Response: `{ claimed: true, bonusXp: 50 }`
- `GET /api/me/daily-missions` → mission `bonusClaimed: true`
- `GET /api/me/tier-progress` → `totalPoints` tăng thêm 50

**Notes**:
- [POTENTIAL NOT IMPLEMENTED]: confirm claim-bonus endpoint exists
- Nếu bonus tự động apply khi complete → không cần separate claim

---

## W-M10-L2-012 — Comeback status: daysSinceLastPlay ≥ 3 → rewardTier visible

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @tier @comeback @write @serial

**Setup**:
- `set-state` với `{ lastPlayedAt: "<3 days ago>" }` (e.g., `2026-04-12`)

**Actions**:
1. `GET /api/me/comeback-status`

**API Verification**:
- Response:
  - `daysSinceLastPlay: 3`
  - `rewardTier: <small/medium/large>` (depends on ComebackService logic)
  - `claimed: false`
  - `reward: { ... }` (reward config)

**Cleanup**:
- `set-state` reset lastPlayedAt về hôm nay

**Notes**:
- `lastPlayedAt` field đã có trong SetStateRequest (as LocalDate) — works
- [NEEDS CODE READ]: ComebackService.getStatus logic để biết exact rewardTier thresholds

---

## W-M10-L2-013 — Comeback claim: POST /api/me/comeback-claim → reward granted

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @tier @comeback @write @serial

**Setup**:
- `set-state`: `{ lastPlayedAt: "<5 days ago>" }`
- Confirm `GET /api/me/comeback-status` returns `claimed: false`

**Actions**:
1. `POST /api/me/comeback-claim`

**API Verification**:
- Response success với reward details
- `GET /api/me/comeback-status` → `claimed: true`
- `GET /api/me` → `livesRemaining` tăng hoặc XP tăng (depends on reward type)
- Second claim attempt → 409 Conflict or idempotent

**Cleanup**:
- `set-state` reset

---

## W-M10-L2-014 — Cosmetics list: GET /api/me/cosmetics

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @tier @cosmetics @parallel-safe

**Actions**:
1. `GET /api/me/cosmetics`

**API Verification**:
- Response có array cosmetics với:
  - `id`, `type` (badge/frame/theme), `name`, `unlocked` (bool), `active` (bool)
- Unlocked cosmetics dựa trên totalPoints thresholds

---

## W-M10-L2-015 — Cosmetic equip: PATCH /api/me/cosmetics → active changed

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @tier @cosmetics @write @serial

**Setup**:
- User có ít nhất 2 cosmetics unlocked

**Actions**:
1. `PATCH /api/me/cosmetics` với body `{ type: "badge", cosmeticId: "<id>" }`

**API Verification**:
- Response success
- `GET /api/me/cosmetics` → cosmeticId được mark `active: true`, cosmetic cũ cùng type → `active: false`

**Cleanup**:
- PATCH lại về cosmetic ban đầu

---

## W-M10-L2-016 — Prestige status: tier 6 + daysAtTier6 >= 30 → canPrestige=true

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: fresh login as test6@dev.local
**Tags**: @happy-path @tier @prestige @write @serial

**Setup**:
- `set-state`: `{ daysAtTier6: 30 }`

**Actions**:
1. `GET /api/me/prestige-status`

**API Verification**:
- Response:
  - `canPrestige: true`
  - `prestigeLevel: 0` (current)
  - `daysAtTier6: 30`
  - `daysRequired: 30`
  - `nextPrestigeName: "Vinh Quang Tái Sinh"`

**Cleanup**:
- `set-state` reset daysAtTier6=0

**Notes**:
- PrestigeService: DAYS_REQUIRED = 30, MAX_PRESTIGE = 3
- test6 user phải ở tier 6 — confirm preconditions

---

## W-M10-L2-017 — Prestige execute: POST /api/me/prestige → level++, progress reset

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: fresh login as test6@dev.local
**Tags**: @happy-path @tier @prestige @write @serial

**Setup**:
- `set-state`: `{ daysAtTier6: 30 }`
- Confirm canPrestige=true

**Actions**:
1. `POST /api/me/prestige`

**API Verification**:
- Response: `{ success: true, newPrestigeLevel: 1, badge: "prestige_1" }`
- `GET /api/me/prestige-status`:
  - `prestigeLevel: 1`
  - `daysAtTier6: 0` (reset)
- `GET /api/me/tier-progress`:
  - totalPoints reset to tier 6 start (hoặc keep tùy spec)
  - Depends on PrestigeService.executePrestige implementation

**Cleanup**:
- **[WARNING]**: Prestige mutation khó reset — cần global teardown hoặc dedicated test user test6-prestige@dev.local
- Hoặc: use ephemeral user qua seed API cho test này

**Notes**:
- [BLOCKER CONSIDERATION]: Prestige test modify user state sâu — nên isolate hoàn toàn bằng ephemeral user
- Đọc `PrestigeService.executePrestige` để biết exact reset behavior

---

## NEEDS TESTID Summary (W-M10 L2)

| Element | Suggested testid | File |
|---------|-----------------|------|
| Tier badge | `home-tier-badge` | pages/Home.tsx |
| Star progress | `home-tier-stars` | pages/Home.tsx |
| XP surge indicator | `home-xp-surge-badge` | pages/Home.tsx |
| Milestone banner | `tier-milestone-banner` | components/MilestoneBanner.tsx |
| Tier up modal | `tier-up-modal` | components/TierUpModal.tsx |
| Star popup | `star-popup` | components/StarPopup.tsx |
| Cosmetics page | `cosmetics-page` | pages/Cosmetics.tsx |
| Cosmetic item | `cosmetic-item-{id}` | pages/Cosmetics.tsx |
| Cosmetic equip btn | `cosmetic-equip-btn` | pages/Cosmetics.tsx |
| Comeback modal | `comeback-modal` | components/ComebackModal.tsx |
| Daily missions widget | `daily-missions-widget` | pages/Home.tsx |
| Prestige button | `prestige-btn` | pages/Profile.tsx |

---

## NOT IMPLEMENTED / BLOCKERS

| # | Blocker | Impact | Suggested fix |
|---|---------|--------|---------------|
| 1 | **`pointsCounted` seed endpoint** | L2-002, L2-003, L2-004, L2-005 BLOCKED | Thêm `POST /api/admin/test/users/{id}/seed-points { totalPoints }` endpoint. Implementation: DELETE `UserDailyProgress` of user, INSERT 1 row today với `pointsCounted=N` |
| 2 | Mission claim-bonus endpoint confirm | L2-011 partial | Verify `/api/me/daily-missions/{id}/claim-bonus` exists hoặc tự auto-claim |
| 3 | Prestige isolation | L2-017 | Dùng ephemeral `test6-prestige@dev.local` user hoặc reset qua seed teardown |
| 4 | ComebackService reward thresholds | L2-012 | Read code để biết exact rewardTier logic |

---

## Open Questions

1. **Star bonus XP timing**: +30 star bonus được add vào totalPoints ngay lập tức (cộng dồn vào UserDailyProgress.pointsCounted) hay lưu tách biệt?
2. **Milestone field persistence**: `milestone` field trong `/tier-progress` response — có lưu DB hay computed mỗi call? (ảnh hưởng: test L2-003/004 cần trigger ngay hay cached)
3. **Tier bump notification**: Có audit log hoặc notification event khi tier-up không? (L2 có thể verify qua log)
4. **XP surge stacking**: Surge có stack với star bonus, combo, daily first không? (ảnh hưởng formula L2-006)
5. **Cosmetics unlock trigger**: Automatic khi totalPoints crosses threshold, hay cần gọi `GET /cosmetics` để lazy-compute?

---

## Runtime Estimate

| Case | Runtime | Blocked? |
|------|---------|----------|
| L2-001 | 4s | |
| L2-002 | 8s | 🚫 |
| L2-003 | 8s | 🚫 |
| L2-004 | 8s | 🚫 |
| L2-005 | 8s | 🚫 |
| L2-006 | 5s | |
| L2-007 | 5s | |
| L2-008 | 4s | |
| L2-009 | 4s | |
| L2-010 | 6s | |
| L2-011 | 5s | ? |
| L2-012 | 5s | |
| L2-013 | 5s | |
| L2-014 | 4s | |
| L2-015 | 5s | |
| L2-016 | 4s | |
| L2-017 | 6s | |
| **Total** | **~94s (~1.6 min)** | 4 blocked, 12 runnable |

Parallel-safe: 3 cases (L2-001, L2-008, L2-009, L2-014 — all GET). Remaining serial.

---

## Summary

- **17 cases** total (exceeds 14-16 estimate, due to cosmetics + prestige coverage)
- **P0**: 5 | **P1**: 11 | **P2**: 0
- **BLOCKED**: 4 cases phụ thuộc `seed-points` endpoint (L2-002, L2-003, L2-004, L2-005)
- **NEEDS TESTID**: 12 elements
- **NOT IMPLEMENTED**: 1 critical blocker (pointsCounted seed), 3 minor
- **Runtime**: ~1.6 min serial (trong đó 4 cases blocked)
