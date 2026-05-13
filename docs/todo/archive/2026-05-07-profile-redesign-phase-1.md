# 2026-05-07 — Profile Redesign Phase 1 [DONE]

> **Source**: User prompt + mockup `docs/designs/MOCKUP_PROFILE_REDESIGN.html`. Phase 1 = UI-only with existing data (skip Daily Missions, Bible Journey 66 books, Activity Feed — Phase 2 needs new BE APIs).

### Tasks
- Task PRO-1: Hero compact (88px avatar + tier badge + meta + actions) + Stats strip (4 horizontal cards w/ colored icons + sub-text) — `[x]` DONE
- Task PRO-2: Tier progress card (sub-tier stars 5 dots + milestone bar 50%/90% + ETA pill + reward unlock) — `[x]` DONE
- Task PRO-3: Heatmap 53w × 7d + empty-state CTA · Badges with tabs (All/Unlocked/Locked) — `[x]` DONE
- Task PRO-4: Analytics card (strong/weak books + Practice CTA) + Prestige emblem visual + Sound/Haptics restyle + Danger zone restructure — `[x]` DONE
- Task PRO-5: i18n keys (vi+en) + regression — `[x]` DONE (Profile 10/10 pass · full FE 1155 pass / 38 fail = baseline, 0 new regressions)

### Decisions
- Phase 2 (Daily Missions, Bible Journey, Activity Feed) deferred — needs `/api/me/missions/daily`, journey aggregate, `/api/me/activity` BE endpoints.
- Sub-tier stars: derive 5 stars from progressPct of current tier (0-20%, 20-40%, …) since `tiers.ts` has no sub-level.
- Keep all `data-testid` hooks from existing Profile to preserve test coverage.

---
