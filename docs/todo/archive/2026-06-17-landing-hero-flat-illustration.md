# 2026-06-17 — Landing hero: thay ảnh Kinh Thánh tối bằng illustration phẳng Khung Sáng

> **Source**: User request (ảnh hero photoreal tối lệch theme sáng) · **Scope**: `apps/web` LandingPage hero, chỉ cosmetic

### Tasks

- LHI-1 Tạo component `HeroIllustration.tsx` (SVG phẳng theo design tokens Khung Sáng)
  - Status: [x] DONE · Files: `apps/web/src/components/HeroIllustration.tsx` + i18n `landing.heroImageAlt` (vi+en) · Test: render smoke trong LandingPage.test
  - Palette: paper/amber/ruby + answer colors A=coral B=sky C=gold D=sage (C5). aspect-[4/3], rounded-[2rem]
  - **Spec impact**: [x] None — chỉ đổi asset hình, không đổi behavior/business rule
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2+3 pass · `audit.sh` no NEW broken · commit

- LHI-2 Wire vào `LandingPage.tsx` hero (thay khối `<img>` Bible)
  - Status: [x] DONE · Files: `apps/web/src/pages/LandingPage.tsx` (~L99-109) · Test: LandingPage.test pass (+1 smoke: hero img alt)
  - Giữ nguyên glow wrapper + thẻ streak "15 Ngày Liên Tiếp" overlay
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 3 pass · commit
