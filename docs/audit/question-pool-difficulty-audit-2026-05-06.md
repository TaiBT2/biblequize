# Question Pool & Difficulty Distribution Audit Report

**Date:** 2026-05-06
**Scope:** Audit-only (no code changes). Answers Q1 (pool size), Q2 (timer logic), Q3 (tier difficulty distribution) against SPEC §3.2.1 and §7.1.

---

## Q1: Pool Size

**Total active: 6,702 questions** (3,351 VN + 3,351 EN — perfect 50/50)

By difficulty (global):
- Easy: 2,392 (35.7%)
- Medium: 2,866 (42.8%)
- Hard: 1,444 (21.5%)

Top books: Psalms (362), Matthew (324), John (320), Luke (318), Genesis/Exodus (302 each). All 66 Protestant books covered.

### Per-book breakdown (Top 15)

| Book | Total | Easy | Medium | Hard |
|------|-------|------|--------|------|
| Psalms | 362 | 118 | 156 | 88 |
| Matthew | 324 | 96 | 146 | 82 |
| John | 320 | 96 | 142 | 82 |
| Luke | 318 | 96 | 144 | 78 |
| Exodus | 302 | 90 | 138 | 74 |
| Genesis | 302 | 96 | 128 | 78 |
| Romans | 262 | 80 | 118 | 64 |
| Acts | 260 | 78 | 116 | 66 |
| Mark | 242 | 74 | 108 | 60 |
| Revelation | 200 | 60 | 90 | 50 |
| Isaiah | 198 | 60 | 88 | 50 |
| 1 Corinthians | 162 | 50 | 72 | 40 |
| Hebrews | 160 | 48 | 72 | 40 |
| Proverbs | 160 | 48 | 72 | 40 |
| Numbers | 150 | 70 | 50 | 30 |

### Sustainability (100 Q/day × 30 days = 3,000/month)

| Tier | Easy need/have | Medium need/have | Hard need/have | Status |
|------|---|---|---|---|
| 1 | 2,100 / 2,392 | 750 / 2,866 | 150 / 1,444 | ✅ |
| 2 | 1,650 / 2,392 | 1,050 / 2,866 | 300 / 1,444 | ✅ |
| 3 | 1,050 / 2,392 | 1,350 / 2,866 | 600 / 1,444 | ✅ |
| 4 | 600 / 2,392 | 1,500 / 2,866 | 900 / 1,444 | ✅ |
| 5 | 300 / 2,392 | 1,200 / 2,866 | **1,500 / 1,444** | ⚠️ deficit 56 |
| 6 | 150 / 2,392 | 1,050 / 2,866 | **1,800 / 1,444** | 🔴 deficit 356 |

**Tier 6 hard pool exhausts ~day 24 of a 30-day window at 100 Q/day.**

---

## Q2: Timer Logic — Tier-Based, Matches SPEC Exactly

**Source of truth:** `apps/api/src/main/java/com/biblequiz/modules/ranked/service/TierDifficultyConfig.java:12-22`

```java
case 1 -> new DifficultyDistribution(70, 25, 5, 30);
case 2 -> new DifficultyDistribution(55, 35, 10, 28);
case 3 -> new DifficultyDistribution(35, 45, 20, 25);
case 4 -> new DifficultyDistribution(20, 50, 30, 23);
case 5 -> new DifficultyDistribution(10, 40, 50, 20);
case 6 -> new DifficultyDistribution(5, 35, 60, 18);
```

Wired in `SmartQuestionSelector.getTimerSeconds()` (line 81-84) → consumed by `SessionService.java:137-140`:

```java
int timerSec = useSmartSelection
        ? smartQuestionSelector.getTimerSeconds(owner.getId())
        : 30;
// useSmartSelection = (mode == practice || mode == ranked)
```

| Mode | Timer | SPEC match |
|---|---|---|
| Ranked | Tier-based 18-30s | ✅ exact |
| Practice | Tier-based 18-30s | ✅ exact |
| Daily Challenge | Hardcoded (5 fixed Qs) | N/A |
| Mystery | Hardcoded 25s | N/A |
| Speed Round | Hardcoded 10s | N/A |
| Weekly Themed | FE default 30s | N/A |
| Multiplayer/Group | Creator-set (FE no bounds) | N/A |

FE fallback `Quiz.tsx:81`:

```javascript
const DEFAULT_TIMER = 30
const timerLimit = settings?.timePerQuestion ?? DEFAULT_TIMER
```

---

## Q3: Difficulty Distribution — Matches SPEC §3.2.1 Exactly

Distribution applied in `SmartQuestionSelector.selectQuestions()` (lines 36-76):

```java
int tierLevel = userTierService.getTierLevel(userId);
DifficultyDistribution dist = tierDifficultyConfig.getDistribution(tierLevel);
int easyCount = (int) Math.round(count * dist.easyPercent() / 100.0);
int mediumCount = (int) Math.round(count * dist.mediumPercent() / 100.0);
int hardCount = count - easyCount - mediumCount;
// then selectWithSmartHistory() per difficulty bucket
```

Smart Selection (SPEC §7.1) within each difficulty bucket: NEW 60% → REVIEW 20% → OLD 15% → RECENT fallback (lines 90-154).

### SPEC vs Code per tier — all match ✅

| Tier | SPEC Easy% | Code Easy% | SPEC Medium% | Code Medium% | SPEC Hard% | Code Hard% | SPEC Timer | Code Timer |
|------|-----------|------------|--------------|--------------|------------|------------|------------|------------|
| 1 | 70% | 70% | 25% | 25% | 5% | 5% | 30s | 30s |
| 2 | 55% | 55% | 35% | 35% | 10% | 10% | 28s | 28s |
| 3 | 35% | 35% | 45% | 45% | 20% | 20% | 25s | 25s |
| 4 | 20% | 20% | 50% | 50% | 30% | 30% | 23s | 23s |
| 5 | 10% | 10% | 40% | 40% | 50% | 50% | 20s | 20s |
| 6 | 5% | 5% | 35% | 35% | 60% | 60% | 18s | 18s |

### Per-mode behavior

| Mode | Tier-aware distribution | Smart history |
|---|---|---|
| Ranked | ✅ | ✅ |
| Practice | ✅ | ✅ |
| Daily Challenge | ❌ (5 fixed Qs) | ❌ |
| Mystery | ❌ | ✅ |
| Speed Round | ❌ (100% Easy hardcoded) | ✅ |
| Weekly Themed | ❌ (theme-driven) | ✅ |
| Multiplayer/Group Live | ❌ (random, creator config) | ❌ |
| Group Scheduled | ❌ (Quiz Set, creator config) | ❌ |

### Edge case: pool exhaust fallback

`SmartQuestionSelector` lines 59-72: if per-difficulty pool can't fill, **falls back to "any difficulty"** to reach `count`. This silently degrades tier-specific guarantees when Hard pool runs dry — relevant for Tier 5/6.

---

## Recommendations

### P0 — Hard pool shortage (Tier 5 & 6)

Code is SPEC-compliant; **content is the gap**. Options:
- **Author 400-500 new Hard questions** (preserves SPEC, best for fairness at top tiers)
- **Amend SPEC** to lower Tier 6 Hard % from 60 → ~50% (matches current pool)
- **Accept fallback** (current behavior — masks shortage but violates per-tier guarantee for top tiers)

### P1 — Multiplayer timer has no FE bounds

`CreateRoom.tsx` lets creator set arbitrary `timePerQuestion`. Add clamp to [10s, 30s].

### P2 — Variety mode timers are hardcoded

Mystery (25s), Speed Round (10s), Weekly (FE default 30s) don't track tier progression. Document as intentional variety variants or introduce `varietyTimerConfig`.

---

## Data points for schema decision

- Schema A (current SPEC) sustainable through **Tier 4** at 100 Q/day; needs +400 Hard for Tier 6
- Global pool skew (35.7 / 42.8 / 21.5) closest to **Tier 3 distribution** (35 / 45 / 20) — natural "center of mass"
- VN/EN parity is perfect — language is not a bottleneck
- No code drift detected; **all findings are content-volume issues**, not architectural
- Smart Selection (NEW/REVIEW/OLD/RECENT) operating per SPEC §7.1

---

## Files audited

- `apps/api/src/main/java/com/biblequiz/modules/ranked/service/TierDifficultyConfig.java`
- `apps/api/src/main/java/com/biblequiz/modules/quiz/service/SmartQuestionSelector.java`
- `apps/api/src/main/java/com/biblequiz/modules/quiz/service/SessionService.java`
- `apps/api/src/main/resources/seed/questions/` (134 JSON files, 6,702 questions)
- `apps/web/src/pages/Quiz.tsx`

---

## Conclusion

BibleQuize's difficulty distribution and timer logic **fully comply with SPEC §3.2.1 and §7.1**. Tier-based distribution is correctly implemented; Smart Selection pools function as designed. **The only actionable finding is the Hard question shortage at Tier 5 & 6**, requiring either schema amendment or content authoring. Not code drift — content investment gap relative to spec ambition for high-tier players.
