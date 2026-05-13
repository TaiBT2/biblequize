# 2026-04-19 — FAQ / Help page [DONE]

### Task HELP-1: FAQ page với 13 topics
- Status: [x] DONE
- Files mới:
  - `data/faqData.ts` — 13 items × 5 categories (gettingStarted, tiers, modes, gameplay, account)
  - `pages/Help.tsx` — accordion + category pills + deep link support
  - `pages/__tests__/Help.test.tsx` — 9 test cases (render, accordion, filter, deep link, content completeness)
- Files sửa:
  - `main.tsx` — thêm route `/help` vào AppLayout block
  - `layouts/AppLayout.tsx` — thêm "Trợ giúp" link vào user menu dropdown
  - `components/GameModeGrid.tsx` — thêm "Tìm hiểu thêm →" button trong locked card → navigate `/help#howUnlockRanked`
  - `__tests__/routing-layout.test.tsx` — add `/help` vào INSIDE_APP_LAYOUT
  - `i18n/vi.json` + `en.json`: `help.*` namespace (categories + 13 Q&A), `nav.help`, `gameModes.learnMore`
- Features:
  - Accordion: chỉ 1 Q&A mở tại 1 thời điểm
  - Category filter: 5 pills + "All" button
  - Deep link: `/help#<itemId>` tự expand + smooth scroll
  - Footer: mailto contact link
- Commit: "feat(web): add /help FAQ page with 13 topics + deep-link from locked cards"
