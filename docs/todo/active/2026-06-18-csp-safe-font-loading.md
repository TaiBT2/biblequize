# 2026-06-18 — CSP-safe font loading (bỏ inline onload, gỡ phụ thuộc unsafe-inline)

> **Source**: User báo Lighthouse/preview → smoke test phát hiện 4 lỗi CSP chặn `onload="this.media='all'"` ở index.html (font non-blocking swap). Prod nginx hiện nới `script-src 'unsafe-inline'` nên prod không vỡ, nhưng đó là điểm yếu bảo mật + preview lệch prod.
> **Scope**: `apps/web` only (index.html + public/ + vite.config preview CSP). KHÔNG đụng prod nginx (infra — đề xuất riêng cho user duyệt).

### Tasks

- CSP-1 Thay 4 inline `onload="this.media='all'"` bằng external script self-hosted
  - Status: [x] DONE — browser smoke dưới preview CSP nghiêm: **4 lỗi CSP → 0**; cả 4 font flip `media="all"`, applied=true, body dùng "Be Vietnam Pro". Files: `apps/web/index.html`, `apps/web/public/load-fonts.js` (new) · Test: build + browser smoke dưới preview CSP nghiêm (`script-src 'self'`) → 0 lỗi CSP; font vẫn swap (non-blocking giữ nguyên)
  - Cơ chế: mỗi font `<link>` mang `media="print" data-font-swap`; external `/load-fonts.js` (defer, hợp `script-src 'self'`) flip `media='all'` khi stylesheet parsed. `<noscript>` fallback giữ nguyên.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

- CSP-2 Gỡ `'unsafe-inline'` khỏi `script-src` trong preview CSP (vite.config) — giờ không còn inline script
  - Status: [x] DONE — preview CSP vốn đã `script-src 'self'` (không có unsafe-inline); chỉ thêm comment giải thích vì sao giờ an toàn. Files: `apps/web/vite.config.ts` (preview headers) · Test: browser smoke 0 lỗi CSP. Giữ `style-src 'unsafe-inline'` (React inline style props còn dùng).
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

### Out of scope (đề xuất — cần user duyệt vì đụng infra prod)
- Gỡ `'unsafe-inline'` khỏi `script-src` trong **prod** `infra/docker/nginx.conf:41` (1 dòng) — sau CSP-1 thì prod cũng không cần nó nữa → siết XSS protection. Đụng infra → hỏi trước.
