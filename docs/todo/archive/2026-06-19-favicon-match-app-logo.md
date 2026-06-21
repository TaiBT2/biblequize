# 2026-06-19 — Favicon match in-app logo (gold-coin book, bỏ thập tự)

> **Source**: User — "favicon nhìn ko đẹp, ko đúng style app". Favicon cũ là **thập tự**
> (cross) trong ô vuông tối, không khớp logo app (vòng tròn vàng + sách mở ở header/sidebar).
> **Scope**: `apps/web/public` brand assets + 1 regen script. Cosmetic, không đụng logic.

### Tasks

- FAV-1 Thay favicon → gold-coin + open-book (đúng logo app) + regenerate cả bộ icon
  - Status: [x] DONE + deployed `ed3975da` · Verified prod: served favicon.svg = `<circle>`+`radialGradient`
    (hết path thập tự), favicon.ico = 3072B mới, build+1346 test pass.
  - Files: `public/favicon.svg` (variant A: radial gold coin + sách glyph
    của `SidebarHeader.tsx`), `scripts/gen-favicons.mjs` (sharp regen, no new dep),
    `public/{favicon-16x16,favicon-32x32,apple-touch-icon,android-chrome-192x192,android-chrome-512x512}.png`,
    `public/favicon.ico` (PNG-in-ICO 16+32), `index.html` (sửa comment "cross"→ book)
  - Design: tab icons (16/32) = đồng xu vàng trong suốt; app icons (180/192/512) = coin trên nền
    vuông tối `#11131e` (= theme_color) tránh góc trong suốt trên iOS. User chọn **A** (tròn vàng + sách).
  - **Spec impact**: [x] None (brand asset thuần) · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: regen · build pass · Tầng 3 pass (no code touched) · deploy + verify tab icon prod · commit
