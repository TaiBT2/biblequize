# 2026-05-19 — HomeBanner unified stack layout (mobile parity)

> **Source**: User feedback — "tham khảo ở mobile ấy thanh bar kéo dài, kích thước text bên bản mobile cân đối hơn"
> **Scope**: `apps/web/src/components/HomeBanner.tsx`. Áp dụng cả mobile + desktop (unified).

## Changes

Trước: 3-col grid `[Avatar | Info+progress-inline | Stats]` (sm+) / 2-col stack (mobile).
Sau: 3-row stack `[Avatar+Info] / [Progress full-width] / [Stats]` cho mọi breakpoint. Mobile match RN screenshot, desktop nhất quán.

### Tasks

- HBU-1 Restructure root từ grid 3-col → flex flex-col 3 rows
  - Status: [x] DONE

- HBU-2 Progress bar drop `max-w-[240px]`, full flex-1 across card width
  - Status: [x] DONE

- HBU-3 Name `text-[22px]` → `text-[24px]` mobile, Stat number `text-[18px]` → `text-[22px]` mobile (balance)
  - Status: [x] DONE
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

## Checklist

- [x] HBU-1/2/3 impl
- [x] HomeBanner + Home tests: 32/32 pass
- [x] Tầng 3 full regression: 1254 pass (baseline 1212), 56 pre-existing fail unrelated
- [ ] Commit `fix(home-banner): unified stack layout — full-width progress, balanced text [no-spec-impact]`
