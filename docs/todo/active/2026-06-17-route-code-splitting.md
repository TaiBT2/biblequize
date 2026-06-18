# 2026-06-17 — Route-level code splitting (lazy-load pages) để giảm LCP/FCP

> **Source**: User report — Lighthouse Performance 55 (FCP 5.0s, LCP 11.1s). Build dist cho thấy `index-*.js` = **1.55 MB** vì toàn bộ ~70 page được `import` tĩnh trong `main.tsx`.
> **Scope**: FE web only — `apps/web/src/main.tsx` + 2 layout (Suspense quanh `<Outlet/>`) + 1 fallback component. KHÔNG đụng business logic / BE / spec behavior.

### Tasks

- RCS-1 Lazy-load route components trong `main.tsx` + top-level `<Suspense>`
  - Status: [x] DONE — entry chunk 1.55 MB → 478 kB (gzip 161 kB); pages tách per-route (Quiz 77kB, GroupDetail 71kB, RoomQuiz 61kB…). Files: `apps/web/src/main.tsx`, `apps/web/src/components/PageLoader.tsx` · Test: `npm run type-check` + `vitest run` (routing-layout.test.tsx phải pass) + `npm run build` (kiểm tra số chunk tăng, entry chunk giảm)
  - Giữ EAGER: `AppLayout`, `Home`, `LandingPage`, `Onboarding`, guards (`RequireAuth`/`RequireAdmin`) — đây là critical/first-paint path. LAZY phần còn lại (admin, gameplay, groups, tournaments, rooms, misc).
  - **Spec impact**: [x] None — pure perf refactor, không đổi behavior/route map
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2+3 pass · `audit.sh` no NEW broken · commit

- RCS-2 Suspense quanh `<Outlet/>` trong `AppLayout` + `AdminLayout` (giữ chrome khi tải chunk)
  - Status: [x] DONE — full suite 1310 pass (≥ baseline 1277), audit exit 0. Files: `apps/web/src/layouts/AppLayout.tsx`, `apps/web/src/layouts/AdminLayout.tsx` · Test: vitest run (AppLayout/AdminLayout tests) — file nhạy cảm → Tầng 3
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 3 pass (AppLayout nhạy cảm) · commit

### Out of scope (defer)
- Bỏ preload hero-image thừa trên route dashboard (`index.html:52`) — task riêng SEO/perf.
- Font subset / giảm số họ font.
