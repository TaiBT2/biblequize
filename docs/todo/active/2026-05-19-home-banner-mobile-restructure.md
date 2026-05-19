# 2026-05-19 — HomeBanner mobile restructure (revert hide + full-width progress)

> **Source**: User mockup feedback — show greeting+name again, keep stats, progress bar full-width ở bottom.
> **Scope**: `apps/web/src/components/HomeBanner.tsx`. Mobile only; desktop giữ inline.

## Changes vs current

1. **Revert** `hidden md:block` trên `home-greeting-meta` + `home-greeting-name` (đảo task HomeBanner-mobile-hide-greeting-name 2026-05-19)
2. Progress bar mobile: full-width (drop `max-w-[240px]` ở < sm)
3. XP text mobile: right-aligned + ngang hàng với progress bar (flex row containing both)
4. Stats row: giữ nguyên (user chọn không đụng)

### Tasks

- HBM-1 Bỏ `hidden md:block` trên greeting + name
  - Status: [x] DONE
  - Files: `apps/web/src/components/HomeBanner.tsx`

- HBM-2 Wrap progress bar + XP text trong inner flex (mobile: row, desktop: contents)
  - Status: [x] DONE
  - Files: `apps/web/src/components/HomeBanner.tsx`
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

## Checklist

- [x] HBM-1 + HBM-2 impl
- [x] HomeBanner + Home tests: 32/32 pass
- [x] Tầng 3 full regression: 1254 pass (baseline 1212), 56 pre-existing fail unrelated
- [ ] Commit `fix(home-banner): mobile restructure — show greet+name, full-width progress [no-spec-impact]`
