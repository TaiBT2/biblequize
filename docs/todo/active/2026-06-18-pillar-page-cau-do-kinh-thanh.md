# 2026-06-18 — Pillar page /cau-do-kinh-thanh (SEO content ngách Tin Lành)

> **Source**: User chọn #2 — tạo trang nội dung SEO giàu chữ cho ngách Tin Lành VN.
> **Scope**: `apps/web` thêm 1 content page + route + prerender + sitemap + internal link.

Chiến lược: trang **tiếng Việt** (nhắm keyword VN "câu đố Kinh Thánh", "trắc nghiệm Kinh Thánh"),
nội dung thật ~700-900 từ (KHÔNG thin/nhồi keyword), framing Tin Lành (66 sách Protestant, BTTHĐ 2011).
Prerender để crawler thấy nội dung tĩnh VN. lang="vi" cho trang này.

### Tasks

- PIL-1 Tạo `src/pages/CauDoKinhThanh.tsx` — content VN + PageMeta + FAQPage schema + CTA + internal links
  - Status: [x] DONE · Files: `src/pages/CauDoKinhThanh.tsx` (new)
  - Sections: trắc nghiệm KT là gì · cách chơi · câu hỏi mẫu · lợi ích tín hữu/nhóm · dành cho Tin Lành VN · FAQ
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- PIL-2 Route `/cau-do-kinh-thanh` (lazy) + prerender + sitemap + internal link footer
  - Status: [x] DONE · Files: `src/main.tsx`, `scripts/prerender.mjs`, `public/sitemap.xml`, `pages/LandingPage.tsx` (footer link)
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

### Note
- Content page hardcode VN (như Privacy/Terms = accepted i18n debt). lang="vi" set per-page.
- Câu hỏi mẫu lấy thật (BTT 1926 public domain, không lộ đáp án sai).
- Deploy lại FE image (worktree sạch).
