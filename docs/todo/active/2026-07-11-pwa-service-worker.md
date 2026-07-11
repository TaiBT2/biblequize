# 2026-07-11 — PWA đầy đủ: thêm Service Worker (vite-plugin-pwa)

> **Source**: User — muốn web thành PWA "cài được" (gõ domain → cài app trên điện thoại, banner "Cài ứng dụng" trên Android/Chrome). Hiện đã có manifest nhưng thiếu service worker. · **Scope**: `apps/web` build config only. KHÔNG đụng module khác. Guard bản Capacitor (native) khỏi SW.

### Quyết định thiết kế
- Dùng `vite-plugin-pwa` (dep MỚI, user đã duyệt qua AskUserQuestion).
- Bật plugin **chỉ khi `mode !== 'capacitor'`** → bản native không có SW (tránh cache stale trong webview).
- `injectRegister: 'script-defer'` → external `/registerSW.js` (hợp CSP `script-src 'self'`, không sửa `main.tsx`).
- `manifest: false` → giữ `public/manifest.json` hiện có + link index.html (không sinh trùng).
- `devOptions.enabled: false` → dev không chạy SW.
- workbox: precache build assets + `navigateFallback: /index.html` (SPA) + denylist `/api`.

### Tasks
- PWA-1 Thêm dep vite-plugin-pwa + cấu hình VitePWA trong vite.config.ts
  - Status: [x] DONE · Files: `apps/web/package.json`, `apps/web/pnpm-lock.yaml`, `apps/web/vite.config.ts` · Test: `build:prod` sinh `dist/sw.js`+`registerSW.js`+workbox (precache 90); `build:capacitor` KHÔNG sinh SW ✅; Tầng 3 1408/1408 pass
  - **Spec impact**: [x] SPEC_ROADMAP §2.7 (Offline full PWA: install shell shipped, data-layer offline vẫn defer)
  - **Spec strategy**: [x] (a) update inline SPEC_ROADMAP §2.7
  - Checklist: [x] impl · [x] build sinh sw.js · [x] Tầng 3 pass · [x] preview verify · [ ] commit
- PWA-2 Verify end-to-end: production build + preview, kiểm SW + manifest install criteria
  - Status: [x] DONE · Verify: `vite preview` (CSP `script-src 'self'` mirror prod) → `/registerSW.js` 200 text/javascript, `/sw.js` 200 text/javascript, `/manifest.json` 200 application/json, index.html chèn `<script src="/registerSW.js" defer>` external (CSP-safe). registerSW.js = `navigator.serviceWorker.register('/sw.js', {scope:'/'})`.
