# 2026-06-18 — SEO round 2 (FAQ schema + LCP preload + alt/desc + internal link)

> **Source**: User "check tiếp phần SEO khác" → audit → chọn A+B+C
> **Scope**: `apps/web` SEO. KHÔNG đụng module khác.

### Tasks

- SR2-1 (A) FAQPage JSON-LD trên /help (14 Q&A từ faqData + i18n) → rich results
  - Status: [x] DONE · Files: `pages/Help.tsx`, `src/__tests__/...` test · Test: schema parse + @type FAQPage + mainEntity
  - Caveat: Google giới hạn FAQ rich result cho gov/health (2023) nhưng schema vẫn valid (Bing hiện, entity hiểu)
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SR2-2 (B) Bỏ LCP preload rác + Daily desc thêm dấu + hero alt keyword
  - Status: [x] DONE · Files: `index.html` (bỏ preload hero img cũ), `pages/DailyChallenge.tsx` (desc), `pages/LandingPage.tsx` (alt)
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SR2-3 (C) Internal link /help vào footer landing
  - Status: [x] DONE · Files: `pages/LandingPage.tsx` (Footer)
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

### Deploy
- Rebuild FE image (worktree sạch) + redeploy sau khi xong.
