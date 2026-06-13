# 2026-06-14 — KS W0: Foundation (Design System "Khung Sáng")

> **Source**: [Khung Sáng master plan](2026-06-14-khung-sang-migration-plan.md) · **Scope**: tầng dùng chung (tokens, shell, UI primitives) — đòn bẩy đổi toàn app. Làm TRƯỚC mọi wave page.
> **Prefix**: `KS-W0`. ⚠️ Chạm file nhạy cảm (`AppLayout`, `global.css`, `main.tsx`) → Tầng 3 ngay, PR nhỏ.

### Tasks
- KS-W0-1 Tokens + fonts (= HGR-1)
  - Status: [x] DONE (build ✓; vitest blocked by FTH) · Files: `src/styles/tokens.css` (mới), `tailwind.config.js`, `index.html`, `main.tsx`
  - Copy `biblequiz-tokens.css`→`tokens.css` (+ class `.bq-arch-card`/`.bq-arch-well`), import sau `global.css` ở `main.tsx`; merge `theme.extend` (`bq.*` colors CSS-var, `font-display`=Bricolage, `font-literata`=Literata [KHÔNG đè `font-verse` Cormorant], `fontSize` hero/verse/eyebrow, `bq-*` shadows, `bg-bq-*`, anim `flick`/`shimmer`, `rounded-bq`, `ease-bq`); nạp Bricolage Grotesque + Literata non-blocking.
  - Verify: `npm run build` ✓ (10.0s, tailwind compile sạch). `type-check` chỉ còn lỗi pre-existing (`import.meta.env`, `@types/react` bigint) — thuộc FTH, không do W0-1.
  - **Spec impact**: [x] None (additive) · **Spec strategy**: [x] (c) `[no-spec-impact]`
- KS-W0-2 AppLayout shell → Khung Sáng
  - Status: [ ] TODO · Files: `layouts/AppLayout.tsx` + sidebar/header/bottom-nav con · Test: Tầng 3 + `__tests__/routing-layout.test.tsx`
  - Nền `bq-paper` + `.bq-lightwell` (godray+grain), nav active `bq-ink`, jewel chips, logo mark phổ. **Quyết định**: giữ sidebar hay TopNav mockup → ghi `DECISIONS.md`.
  - **Spec impact**: [ ] None · **Spec strategy**: [ ] (c) (visual, no behavior) — verify nav/route không đổi
- KS-W0-3 AdminLayout shell → Khung Sáng (light touch)
  - Status: [ ] TODO · Files: `layouts/AdminLayout.tsx` · Test: admin page tests
  - **Spec strategy**: [ ] (c)
- KS-W0-4 UI primitives
  - Status: [ ] TODO · Files: `components/ui/{Button,Card,Input,Modal,SearchableSelect}.tsx` · Test: vitest liên quan
  - Button: variant primary=`bq-action`, jewel outline; Card: `bq-white`+hairline+bóng `bq-soft`; Input/Modal/Select theo paper/ink. Giữ props/API.
  - **Spec strategy**: [ ] (c)
- KS-W0-5 Shared atoms
  - Status: [ ] TODO · Files: `Skeleton`, `EmptyState`, `ErrorToast`, `ErrorBoundary`, `OfflineBanner`, `SectionHeader`, `global.css` (scrollbar/utilities) · Test: vitest
  - **Spec strategy**: [ ] (c)

### Checklist mỗi task: impl · Tầng 1+2+3 pass · verify ≥3 page khác không vỡ · `audit.sh` no NEW broken · commit (EN)
