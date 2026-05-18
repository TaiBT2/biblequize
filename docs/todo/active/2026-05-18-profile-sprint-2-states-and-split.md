# 2026-05-18 — Profile Sprint 2: skeleton states + split monolith

> **Source**: Profile audit 2026-05-18 — P1 #6/#7 (silent disappear on load/error) + P3 #14 (990 LOC vi phạm 300 LOC rule).
> **Scope**: `apps/web/src/pages/Profile.tsx` + new `apps/web/src/components/profile/*`.

### Tasks

- PRO-S2-1 AnalyticsCard + PrestigeSection skeleton loading states (P1 #6 #7)
  - AnalyticsCard: dùng `isLoading` từ useQuery → render `SkeletonBlock h-56`. Empty data + error → graceful hide (return null) như cũ.
  - PrestigeSection: thêm `isLoading` + `isError` từ useQuery destructure → skeleton loading, hide on error/empty.
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Profile.tsx`
  - Test: ✅ Tầng 3 1167/125 = clean state (0 regression). Profile 10/10 pass.
  - Commit: `fix: Profile widgets show skeleton on load (AnalyticsCard + PrestigeSection) [no-spec-impact]`

- PRO-S2-2 Split Profile.tsx 990 LOC → `components/profile/*` (P3 #14)
  - Tách 9 sub-components ra file riêng: Hero, Stats, TierProgress, Heatmap, Badges, Analytics, Prestige, SoundHaptics, DeleteAccount
  - `Profile.tsx` còn ~150 LOC (page-level data fetching + layout)
  - Mỗi component < 300 LOC theo CLAUDE.md rule
  - Pure mechanical refactor — không đổi behavior
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Profile.tsx` (990 → 158 LOC) + new `apps/web/src/components/profile/` (11 files, all < 140 LOC each)
  - Test: ✅ Tầng 3 1167/125 = clean state (0 regression). Profile 10/10 pass. tsc clean.
  - Commit: `refactor: split Profile.tsx into components/profile/* [no-spec-impact]`

### Common

- **Spec impact**: [x] None
- **Spec strategy**: [x] (c) [no-spec-impact]
- **Order**: Task 1 (states) commit trước, Task 2 (split) commit sau — split lùa cả new states code vào file mới
