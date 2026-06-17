# 2026-06-17 — SEO audit fixes (forbible.org)

> **Source**: User "www.forbible.org thiếu SEO check giúp tôi" → audit → "làm hết đi"
> **Scope**: `apps/web` SEO infra only. KHÔNG đụng module khác. Backend untouched.

Audit kết luận: hạ tầng SEO đã có (meta/OG/Twitter/JSON-LD/sitemap/robots/PageMeta) nhưng có
lỗi đang hỏng production + thiếu sót. Sửa hết phần low-risk, no-new-dep.

### Tasks

- SEO-1 Render `og-image.png` (1200×630) từ `og-image.svg` — social preview đang vỡ ảnh
  - Status: [x] DONE · Files: `scripts/generate-favicons.mjs`, `public/og-image.png` (new), `src/__tests__/seo-assets.test.ts` (new) · Test: assert PNG signature + 1200×630
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · vitest pass ≥ baseline · commit

- SEO-2 Fix locale sai `el`(Hy Lạp)→`en` trong index.html + bỏ hreflang URL `/el` không tồn tại
  - Status: [x] DONE · Files: `index.html`, `src/__tests__/seo-meta.test.ts` (new) · Test: no 'el'/'el_GR'/'/el', inLanguage=[vi,en]
  - **Spec impact**: [x] None (C4 = 50/50 VN/EN, không có Greek)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · vitest pass · commit

- SEO-3 sitemap.xml + robots.txt cleanup (bỏ /landing trùng canonical, thêm lastmod + public pages, bỏ Allow /share/ ảo)
  - Status: [x] DONE · Files: `public/sitemap.xml`, `public/robots.txt`, `seo-meta.test.ts` · Test: sitemap valid + robots/sitemap nhất quán
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · vitest pass · commit

- SEO-4 PageMeta.tsx: thêm og:url, og:type, twitter:card/title/description/image
  - Status: [x] DONE · Files: `src/components/PageMeta.tsx`, `src/components/__tests__/PageMeta.test.tsx` (new) · Test: render emits đủ tags
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · vitest pass · commit

- SEO-5 `<html lang>` đồng bộ động theo i18n (vi↔en) cho SEO/a11y
  - Status: [x] DONE · Files: `src/i18n/index.ts`, `src/i18n/__tests__/html-lang-sync.test.ts` (new) · Test: changeLanguage → documentElement.lang
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · vitest pass · commit

- SEO-6 manifest.json completeness (id, scope, lang, categories, orientation; maskable deferred — logo thiếu safe-zone)
  - Status: [x] DONE · Files: `public/manifest.json`, `seo-meta.test.ts` · Test: required PWA fields present
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · vitest pass · commit

- SEO-7 JSON-LD: thêm WebSite + Organization graph (rich result) vào index.html
  - Status: [ ] TODO · Files: `index.html`, `seo-meta.test.ts` · Test: tất cả ld+json parse được + có WebSite/Organization/SoftwareApplication
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · vitest pass · commit

### Out of scope (cần quyết định của user — KHÔNG tự làm)
- **#3 Prerender/SSR cho route public** — cần **dependency mới** (`vite-plugin-prerender`/`react-snap`).
  CLAUDE.md cấm tự thêm dep. Đây là hạng mục tác động SEO lớn nhất nhưng phải hỏi trước.
- **#8 nginx 301 www→apex + ép HTTPS** — đụng infra prod (`deploy/biblequiz.nginx.conf`),
  chưa rõ tầng TLS terminate ở đâu → rủi ro break prod. Cần xác nhận trước khi sửa.
