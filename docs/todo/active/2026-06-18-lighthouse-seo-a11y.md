# 2026-06-18 — Lighthouse audit (SEO/a11y/perf) trên prod image

> **Source**: User "có" → đo Lighthouse thực tế trên prod container.
> **Scope**: chỉ phần SEO/a11y thuộc địa hạt; perf để process song song (bundle/font).

### Lighthouse (mobile, container prod) — Landing
Performance **93** · Accessibility **96** · Best-Practices **100** · SEO **92**

### Tasks

- LH-1 SEO: link "Start"→/practice thiếu text mô tả → thêm `aria-label` (key `landing.ctaAria`)
  - Status: [x] DONE (a11y win) — nhưng SEO vẫn 92: Lighthouse link-text chấm theo **visible text**,
    "Start" nằm blocklist generic-text. aria-label thêm rồi (accessible name cho screen reader/crawler) nhưng
    để SEO 92→100 phải đổi **chữ hiển thị** nút (vd "Start"→"Chơi ngay") = quyết định product/copy → defer hỏi user.
  - Files: `i18n/{vi,en}.json` (key ctaAria), `pages/LandingPage.tsx` (2 CTA). Deployed `84a433ed`.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

### Báo cáo — KHÔNG tự sửa (cần quyết định / địa hạt khác)
- **A11y contrast (96)**: token thương hiệu `bq-amberd` (#d97f06) trên nền sáng = contrast **2.87 < 4.5**
  (logo, pill, highlight h1...). Đổi = sửa **brand color design-token**, blast radius lớn → CẦN user duyệt.
- **Perf (93)**: render-blocking fonts (~150ms), unused JS (~72KB), unused CSS (~28KB) — **địa hạt process
  song song** đang làm bundle/font splitting. Để họ.
- **#6 self-host ảnh**: Lighthouse KHÔNG flag (Best-Practices 100) → không gấp.
