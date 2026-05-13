# 2026-04-19 — Consolidate tiers data single source of truth [DONE]

### Task CT-1: Expand Tier interface + move getTierInfo to data/tiers.ts
- Status: [x] DONE
- File: apps/web/src/data/tiers.ts
- Interface giờ có: id, nameKey, minPoints, maxPoints, iconMaterial, iconEmoji, colorHex, colorTailwind
- Helpers: getTierByPoints, getNextTier, getTierInfo (moved from Home.tsx, với safe point coercion)
- Commit: "refactor(web): expand Tier interface + move getTierInfo into data/tiers.ts"

### Task CT-2: Remove inline TIERS + local getTierInfo from Home.tsx
- Status: [x] DONE
- Import TIERS/getTierInfo từ data/tiers
- JSX: `.icon` → `.iconMaterial`, `.color` → `.colorTailwind`
- `userTierLevel` compute bằng `tier.current.id` (giản hóa)
- Commit: "refactor(web): Home.tsx uses consolidated tier data"

### Task CT-3: Remove inline TIERS + local getCurrentTier from Ranked.tsx
- Status: [x] DONE
- Import getTierByPoints từ data/tiers
- JSX: `currentTier.icon` → `.iconMaterial`, `.color` → `.colorHex` (inline style dùng hex)
- Commit: "refactor(web): Ranked.tsx uses consolidated tier data"

### Task CT-4: Add comprehensive tests
- Status: [x] DONE
- File mới: apps/web/src/data/__tests__/tiers.test.ts
- Cases: ~25 (shape validation, monotonic minPoints, maxPoints boundary, OLD key guard, tier-by-points exhaustive, next-tier, tierInfo progressPct/pointsToNext, defensive NaN/Infinity/negative)
- Commit: "test: comprehensive tests for consolidated tier helpers"
