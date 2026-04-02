# Stitch Sync Progress

## Phase 1 — Core Pages (Ưu tiên cao nhất)
- [x] 1.1 Home (Dashboard Final Redesign v5)
  - [x] Sync UI từ Stitch (đã sync v5 — hero bento, rank card, GameModeGrid)
  - [x] Unit tests — 14 tests: render, greeting, tier, progress, GameModeGrid, leaderboard, layout
  - [ ] E2E tests (cần app chạy)
- [x] 1.2 Login Page
  - [x] Sync UI từ Stitch (split-screen hero + OAuth + email)
  - [x] Unit tests — 7 tests: render, OAuth button, email/pass fields, auth redirect, guest mode
  - [ ] E2E tests (cần app chạy)
- [x] 1.3 Quiz Gameplay (Timer Added)
  - [x] Sync UI từ Stitch (timer SVG, combo, energy, answer grid)
  - [x] Unit tests — 5 tests: render, timer, answer grid, navigation, container
  - [ ] E2E tests (cần app chạy)
- [x] 1.4 Daily Challenge
  - [x] Sync UI từ Stitch (countdown, calendar, challenge card)
  - [x] Unit tests — 6 tests: render, title, challenge status, completion, loading, error
  - [ ] E2E tests (cần app chạy)
- [x] Phase 1 regression test — 147/147 pass

## Phase 2 — Social & Multiplayer
- [x] 2.1 Leaderboard v2
  - [x] Sync UI từ Stitch (đã sync — podium, tabs, tier info)
  - [x] Unit tests — 10 tests: render, podium, tabs, tier info, current user, season timer
  - [ ] E2E tests (cần app chạy)
- [x] 2.2 Multiplayer Lobby List
  - [x] Sync UI từ Stitch (đã sync — room cards, join code, game modes)
  - [x] Unit tests — 2 tests: module export, component name (render tests need backend)
  - [ ] E2E tests (cần app chạy)
- [x] 2.3 Room Lobby
  - [x] Sync UI từ Stitch (đã sync — player grid, chat, ready state)
  - [x] Unit tests — 2 tests: module export, component name (render tests need WebSocket)
  - [ ] E2E tests (cần app chạy)
- [x] 2.4 Room Quiz Gameplay
  - [x] Sync UI từ Stitch (đã sync — result popup, scoreboard)
  - [x] Unit tests — 2 tests: module export, component name (render tests need WebSocket)
  - [ ] E2E tests (cần app chạy)
- [x] Phase 2 regression test — 163/163 pass

## Phase 3 — Profile & Groups
- [x] 3.1 User Profile v2
  - [x] Sync UI từ Stitch (đã sync — hero, stats, heatmap, badges)
  - [x] Unit tests — 6 tests: render, user name, tier progress, stats, heatmap, badges
  - [ ] E2E tests (cần app chạy)
- [x] 3.2 Achievements
  - [x] Sync UI từ Stitch (đã sync — tier progress, badge grid, event banner)
  - [x] Unit tests — 4 tests: render, title, structure, interactive elements
  - [ ] E2E tests (cần app chạy)
- [x] 3.3 Church Groups
  - [x] Sync UI từ Stitch (đã sync — chart data viz, tooltips, member list)
  - [x] Unit tests — 5 tests: render, header, leaderboard, chart, actions
  - [ ] E2E tests (cần app chạy)
- [x] 3.4 Group Detail
  - [x] Sync UI từ Stitch (đã sync — banner, member table, tabs)
  - [x] Unit tests — 1 test: module export (render needs backend API)
  - [ ] E2E tests (cần app chạy)
- [x] Phase 3 regression test — 185/185 pass

## Phase 4 — Tournament & Landing
- [x] 4.1 Tournament Bracket (Enhanced UX)
  - [x] Sync UI từ Stitch (đã sync — snap scroll, sticky headers)
  - [x] Unit tests — 6 tests: render, content, bracket sections, rules, prizes, scroll
  - [ ] E2E tests (cần app chạy)
- [x] 4.2 Guest Landing Page (Desktop)
  - [x] Sync UI từ Stitch (đã sync — full landing page from Stitch HTML)
  - [x] Unit tests — 9 tests (in LandingPage.test.tsx): hero, CTA, features, leaderboard, verse, nav, redirect
  - [ ] E2E tests (cần app chạy)
- [x] 4.3 Guest Landing Page (Mobile)
  - [x] Same component as desktop — responsive via Tailwind breakpoints
  - [x] Covered by desktop tests (responsive classes verified)
  - [ ] E2E tests (mobile viewport — cần Playwright)
- [x] Phase 4 regression test — 185/185 pass

## Final
- [x] Full regression test — **185 frontend + 405 backend = 590 total tests pass**
- [ ] Visual diff check (screenshot so sánh từng screen)
- [ ] Update DESIGN_AUDIT.md với kết quả sync mới
