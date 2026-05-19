# 2026-05-19 — HomeBanner: revert desktop 3-col, mobile-only full-width progress

> **Source**: User feedback — "bạn css làm hỏng bản web rồi" sau khi unified stack ở [`unified-stack-layout`].
> **Scope**: `apps/web/src/components/HomeBanner.tsx`. Fix regression desktop, giữ mobile.

## Problem

Commit `9096e3c` (unified stack) phá desktop:
- Desktop trước: `[Avatar | Info+inline-progress | Stats]` 1 row compact
- Desktop sau (unified): `[Avatar+Info] / [progress full-width] / [Stats centered]` 3 row tall + stats nổi giữa

## Approach

Restore grid 3-col cho desktop + thêm mobile-only progress row `col-span-2` (escape avatar column để full card width).

Tránh duplicate testID conflict trong JSDOM: desktop variant giữ testIDs (`home-greeting-progress-bar` + `-fill` + `-pct` + `-milestone-N`); mobile variant copy markup không có testIDs (chỉ visual). Trong JSDOM tests, không có CSS responsive → cả 2 đều render trong DOM, nhưng `getByTestId` chỉ match desktop variant → tests pass. Trên browser, `hidden md:contents` / `col-span-2 md:hidden` control visibility đúng.

### Tasks

- HBR-1 Restore root grid 3-col + tier row flex
  - Status: [x] DONE

- HBR-2 Wrap desktop inline progress trong `hidden md:contents` (display:contents flatten cho flex parent)
  - Status: [x] DONE

- HBR-3 Add mobile-only progress row `col-span-2 md:hidden` (no testIDs)
  - Status: [x] DONE
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

## Checklist

- [x] HBR-1/2/3 impl
- [x] HomeBanner + Home tests: 32/32 pass
- [x] Tầng 3 full regression: 1254 pass (baseline 1212)
- [ ] Commit `fix(home-banner): restore desktop 3-col, mobile-only full-width progress [no-spec-impact]`
