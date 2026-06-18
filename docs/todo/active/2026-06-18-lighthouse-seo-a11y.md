# 2026-06-18 — Lighthouse audit (SEO/a11y/perf) trên prod image

> **Source**: User "có" → đo Lighthouse thực tế trên prod container.
> **Scope**: chỉ phần SEO/a11y thuộc địa hạt; perf để process song song (bundle/font).

### Lighthouse (mobile, container prod) — Landing
Performance **93** · Accessibility **96** · Best-Practices **100** · SEO **92**

### Tasks

- LH-1 SEO: link "Start"→/practice thiếu text mô tả → đổi chữ nút (user duyệt)
  - Status: [x] DONE · Đổi `common.startNow` "Start"/"Bắt Đầu" → **"Play Now"/"Chơi Ngay"** (không nằm blocklist
    generic-text của Lighthouse) → SEO 92→100. **Gỡ luôn aria-label `ctaAria`** thêm ở vòng trước: chữ nút giờ
    đã mô tả nên aria-label thừa + gây lệch "label-in-name" (WCAG 2.5.3, accessible name không chứa visible text).
  - Files: `i18n/{vi,en}.json` (startNow + xoá ctaAria), `pages/LandingPage.tsx` (2 CTA bỏ aria-label).
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

### Báo cáo
- **A11y contrast → DONE (A11y 96→100)**: user duyệt làm đậm brand color. `bq-amber-deep` #D97F06 → **#A84A05**
  (WCAG AA >=4.5 trên mọi nền sáng paper/white/sunk; app light-theme đồng nhất nên an toàn toàn cục). Thêm
  badge top-rank leaderboard `bg-bq-amber`→`bg-bq-amberd` (white text 2.14→5.8). Lighthouse: A11y 100, SEO 100,
  color-contrast PASS. Deployed `329f60a3`. (BP 96 chỉ là artifact local khi API không reachable; prod=100.)
- **Perf (93)**: render-blocking fonts (~150ms), unused JS (~72KB), unused CSS (~28KB) — **địa hạt process
  song song** đang làm bundle/font splitting. Để họ.
- **#6 self-host ảnh**: Lighthouse KHÔNG flag (Best-Practices 100) → không gấp.
