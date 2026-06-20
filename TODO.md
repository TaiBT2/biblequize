# TODO

> Task tracker. Active TODOs ở dưới. DONE/SUPERSEDED đã chuyển sang [`docs/todo/archive/`](docs/todo/archive/).
> Format mỗi task file theo template CLAUDE.md §Quy trình quản lý Task.

## Active (96)

| Date | Title | Status | Detail |
|---|---|---|---|
| 2026-06-20 | Hành Trình Nhóm (Group Journey) — group differentiator (BL-25, GJ-1..8; design locked) | TODO | [detail](docs/todo/active/2026-06-20-group-journey.md) |
| 2026-06-20 | Multiplayer result screen optimize (freeze duration + blur perf + dedup sort + split <300 LOC) (MRO-1..4) | TODO | [detail](docs/todo/active/2026-06-20-multiplayer-result-screen-optimize.md) |
| 2026-06-20 | Quick Match: cho chọn max players (chips 10/20/50/100, bỏ hardcode 10) (QMP-1..2) | DONE | [detail](docs/todo/active/2026-06-20-quickmatch-max-players-selector.md) |
| 2026-06-20 | Fix avatar lỗi ở Lobby multiplayer (preset/URL hỏng hiện alt text) (LAV-1) | DONE | [detail](docs/todo/active/2026-06-20-fix-lobby-avatar-broken-img.md) |
| 2026-06-20 | Multiplayer: đa dạng chọn sách (nhóm chủ đề + 66 sách riêng lẻ; fix OT/NT/Gospels no-op) (MBV-1..4) | DONE | [detail](docs/todo/active/2026-06-20-multiplayer-book-scope-variety.md) |
| 2026-06-20 | Group announcement → notify members (BL-24, Q-K increment; GAN-1..3) | TODO | [detail](docs/todo/active/2026-06-20-group-announcement-notifications.md) |
| 2026-06-20 | AI Generator: option "Tất cả sách" (toàn Kinh Thánh theo chủ đề) + disable Chương/Câu (ABO-1..2) | DONE | [detail](docs/todo/active/2026-06-20-ai-generator-all-books-option.md) |
| 2026-06-20 | Mobile foundation polish (cross-cutting: safe-area var + touch-feedback + dvh + keyboard; gap sau MRF/TBL) (MFP-1..6) | DONE | [archive](docs/todo/archive/2026-06-20-mobile-foundation-polish.md) |
| 2026-06-19 | Favicon match in-app logo (gold-coin + sách, bỏ thập tự) + regenerate icon set (FAV-1) | TODO | [detail](docs/todo/active/2026-06-19-favicon-match-app-logo.md) |
| 2026-06-19 | Wire online presence (OnlineService) — biết user đang online: nối dây Redis presence chưa được gọi + quyết định show/né con số (ONL-1..4) | TODO | [detail](docs/todo/active/2026-06-19-wire-online-presence.md) |
| 2026-06-19 | Guest practice play (no-session local mode) — fix `POST /api/sessions` 401 cho khách, chơi client-side qua `/api/questions` (GP-1) | TODO | [detail](docs/todo/active/2026-06-19-guest-practice-no-session.md) |
| 2026-06-18 | Leaderboard deep-dive fixes: rank tie-break + dedup + around-me + privacy + low-data "né con số" + dẹp mùa thi đua (LBF-1..13; LBF-3 ZSET defer) | DONE (12/13, LBF-3 defer) | [detail](docs/todo/active/2026-06-18-leaderboard-deep-fixes.md) |
| 2026-06-18 | SEO pillar page /cau-do-kinh-thanh (content VN ngách Tin Lành + FAQPage + prerender + sitemap) (PIL-1..2) | DONE | [detail](docs/todo/active/2026-06-18-pillar-page-cau-do-kinh-thanh.md) |
| 2026-06-18 | Homepage `/` cho khách thấy LandingPage giàu chữ (thay Onboarding rỗng) + prerender / (HLG-1..2) | DONE | [detail](docs/todo/active/2026-06-18-homepage-landing-for-guests.md) |
| 2026-06-18 | Lighthouse prod (BP100/SEO 92→100 sau đổi CTA "Play Now"/A11y 96/Perf 93): CTA text + báo cáo contrast/perf (LH-1) | DONE | [detail](docs/todo/active/2026-06-18-lighthouse-seo-a11y.md) |
| 2026-06-18 | Public leaderboard endpoint + guest UX: /api/public/leaderboard + Leaderboard guest-aware + Landing scroll-to/real data (LBG-1..4) | DONE | [detail](docs/todo/active/2026-06-18-public-leaderboard-endpoint-guest.md) |
| 2026-06-18 | Guest-aware AppLayout chrome: route public (leaderboard…) khách thấy nav login giả → nút Đăng nhập + ẩn nav cần auth (GAC-1..2) | DONE | [detail](docs/todo/active/2026-06-18-guest-aware-applayout-chrome.md) |
| 2026-06-18 | SEO round 2: FAQPage schema /help + bỏ LCP preload rác + alt/desc + footer link (SR2-1..3) | DONE | [detail](docs/todo/active/2026-06-18-seo-round2-faq-lcp-links.md) |
| 2026-06-18 | h1 SEO keywords: Landing exact-match "trắc nghiệm Kinh Thánh" + Daily thêm h1 (HSE-1..2) | DONE | [detail](docs/todo/active/2026-06-18-h1-seo-keywords.md) |
| 2026-06-17 | Mobile app (Capacitor wrap web) — chỉ trang User (MOB-0..5; code DONE, AAB built, emulator smoke OK; store/iOS owner-gated) | IN PROGRESS | [detail](docs/todo/active/2026-06-17-mobile-capacitor.md) |
| 2026-06-17 | Group Collective Growth "Cùng nhau thuộc Lời" — differentiator (BL-23, CG-1..8) | DONE | [archive](docs/todo/archive/2026-06-17-group-collective-growth.md) |
| 2026-06-18 | i18n locale-dedup: chỉ load ngôn ngữ active (vi-user bỏ ~35kB gz en chunk) (ILD-1) | DONE | [detail](docs/todo/active/2026-06-18-i18n-locale-dedup.md) |
| 2026-06-18 | CSP-safe font loading (bỏ inline onload → external /load-fonts.js; gỡ phụ thuộc unsafe-inline) (CSP-1..2) | DONE | [detail](docs/todo/active/2026-06-18-csp-safe-font-loading.md) |
| 2026-06-18 | Bundle vendor + locale chunk splitting (entry 651kB → 125kB) (BVC-1) | DONE | [detail](docs/todo/active/2026-06-18-bundle-vendor-chunk-splitting.md) |
| 2026-06-17 | Route-level code splitting (lazy-load pages) giảm LCP/FCP — bundle 1.55MB → per-route chunks (RCS-1..2) | DONE | [detail](docs/todo/active/2026-06-17-route-code-splitting.md) |
| 2026-06-17 | SEO audit fixes forbible.org (og-image vỡ, locale `el`→`en`, sitemap/robots, PageMeta, JSON-LD) (SEO-1..7) | DONE | [detail](docs/todo/active/2026-06-17-seo-audit-fixes.md) |
| 2026-06-18 | SEO prerender public routes (puppeteer build-time, /landing+/privacy+/terms+/help+/daily) (PRE-1..5) | DONE | [detail](docs/todo/active/2026-06-17-seo-prerender-public-routes.md) |
| 2026-06-17 | Fix avatar không đồng bộ sau khi sửa hồ sơ (header/sidebar) (ASE-1..2) | DONE | [detail](docs/todo/active/2026-06-17-avatar-sync-after-edit.md) |
| 2026-06-17 | Ranked selector follow-ups: meta-query merge + dependency inversion (RSO-1..2) | DONE | [archive](docs/todo/archive/2026-06-17-ranked-selector-followups.md) |
| 2026-06-17 | Ranked selector: gộp history load + bỏ N+1 query (RSH-1..2) | DONE | [archive](docs/todo/archive/2026-06-17-ranked-selector-history-query-optimization.md) |
| 2026-06-17 | AI distractor-quality parity cho user paths (quiz set + personal bank) (AEU-1..5) | DONE | [archive](docs/todo/archive/2026-06-17-ai-quality-parity-user-paths.md) |
| 2026-06-17 | Practice book-select: fix tên sách "chìm" (SearchableSelect → Khung Sáng) + no-book lỗi tường minh (PBS-1..2) | TODO | [detail](docs/todo/active/2026-06-17-practice-book-select-fixes.md) |
| 2026-06-17 | Landing hero: thay ảnh Kinh Thánh tối bằng illustration phẳng Khung Sáng (LHI-1..2) | DONE | [archive](docs/todo/archive/2026-06-17-landing-hero-flat-illustration.md) |
| 2026-06-17 | checkAuth: chỉ logout khi refresh 401, không logout khi /api/me lỗi (CKR-1) | DONE | [detail](docs/todo/active/2026-06-17-checkauth-resilient-to-me-failure.md) |
| 2026-06-16 | Fix session-expiry infinite request loop (login chết do rate-limit 429) (SEL-1) | DONE | [detail](docs/todo/active/2026-06-16-fix-session-expiry-infinite-loop.md) |
| 2026-06-16 | Daily Challenge scoring rework (0/20/40/60/100/150, bỏ flat +50) (DCS-1..5) | TODO | [detail](docs/todo/active/2026-06-16-daily-challenge-scoring-rework.md) |
| 2026-06-17 | Questions: DB UNIQUE content_hash chống trùng + dedup 287 cặp legacy (UCH-1..2) | TODO | [detail](docs/todo/active/2026-06-17-questions-unique-content-hash-dedup.md) |
| 2026-06-16 | Seed distractor rewrite → Haladyna/NBME (VN, pilot Genesis) (SDR-1..3) | TODO | [detail](docs/todo/active/2026-06-16-seed-distractor-rewrite-haladyna.md) |
| 2026-06-16 | AI Generator: enforce error_type cho distractor (AEQ-1..4) | TODO | [detail](docs/todo/active/2026-06-16-ai-generator-error-type-enforcement.md) |
| 2026-06-16 | AI Generator: CSS polish đồng bộ admin pattern (AIG-1..5) | TODO | [detail](docs/todo/active/2026-06-16-ai-generator-css-polish.md) |
| 2026-06-12 | Optimize trang chủ (Home): empty-state + hero + bỏ trùng lặp + mật độ (HO-1..7) | TODO | [detail](docs/todo/active/2026-06-12-home-optimize.md) |
| 2026-06-11 | Redesign 2 màn Quản trò: in-game host (TV presentation) + wrap-up (QTR-1..5) | DONE | [detail](docs/todo/active/2026-06-11-quan-tro-host-screens-redesign.md) |
| 2026-06-11 | MP refactor BE: RoomModeStrategy + RoomAnswerProcessor (RMS-1..10, no behavior change) | DONE | [detail](docs/todo/active/2026-06-11-mp-refactor-be-mode-strategy.md) |
| 2026-06-11 | MP refactor FE: typed STOMP events + useRoomChannel + RoomQuiz split (FMR-1..8) | DONE | [detail](docs/todo/active/2026-06-11-mp-refactor-fe-roomquiz-split.md) |
| 2026-05-23 | Ranked: regression tests for RKP-1 + RKP-2 bug fixes (replay match + Hibernate-proxy 500) | DONE | [archive](docs/todo/archive/2026-05-23-ranked-regression-tests-rkp1-rkp2.md) |
| 2026-05-23 | Ranked: deterministic scoring tests + anti-cheat (6 tiers × combo × speed × server-recompute) | DONE | [archive](docs/todo/archive/2026-05-23-ranked-scoring-deterministic-anti-cheat.md) |
| 2026-05-23 | Liturgical Coverage: pool-exhaustion fallback chain + season transition + ×1.5 bonus tests | DONE | [archive](docs/todo/archive/2026-05-23-liturgical-coverage-fallback-tests.md) |
| 2026-05-23 | SmartQuestionSelector: tier-distribution + spaced-repetition statistical tests | DONE | [archive](docs/todo/archive/2026-05-23-smart-question-selector-distribution-tests.md) |
| 2026-05-23 | MP audit P0: Lifecycle R1-R5 + Reconnect + Kick + Host transfer (10 case + WS helper) | TODO | [detail](docs/todo/active/2026-05-23-mp-test-lifecycle-reconnect-kick.md) |
| 2026-05-23 | MP audit P0+P1: Mode-edge (BR amnesty / SD queue / TVT switch) + Quản trò Sprint 4 + Chat (8 task) | TODO | [detail](docs/todo/active/2026-05-23-mp-test-mode-edge-quan-tro-chat.md) |
| 2026-05-23 | MP audit P1+P2: Contracts + Scale 100p + Maestro mobile + Admin + WS reconnect (14 task) | TODO | [detail](docs/todo/active/2026-05-23-mp-test-contracts-scale-obs.md) |
| 2026-05-23 | Clean up stale FE + BE tests (69 FE + ~37 BE pre-existing failures from past redesigns) | DONE | [archive](docs/todo/archive/2026-05-23-clean-stale-tests.md) |
| 2026-05-23 | Leaderboard "Hàng Tuần" logic fixes (0-pt filter + cache TTL + ICT + calendar week) | DONE | [archive](docs/todo/archive/2026-05-23-leaderboard-weekly-fix.md) |
| 2026-05-22 | Ranked play fixes (replay same-questions + select 500 + e2e W-M04 sync) | TODO | [detail](docs/todo/active/2026-05-22-ranked-play-fixes.md) |
| 2026-05-22 | Liturgical Coverage follow-ups (verify, QA, rollout, FMC review, cleanup) | TODO | [detail](docs/todo/active/2026-05-22-liturgical-coverage-followups.md) |
| 2026-05-21 | Liturgical Coverage System sprint (P5, 10 commits — replace currentBook with §7 3-layer architecture) | TODO | [detail](docs/todo/active/2026-05-21-liturgical-coverage-sprint.md) |
| 2026-05-20 | Multiplayer page i18n (Phòng Chơi + sidebar widget) | TODO | [detail](docs/todo/active/2026-05-20-multiplayer-page-i18n.md) |
| 2026-05-20 | Home: hide FeaturedDailyCard when MotivationCard shows (dedupe new-user CTA) | TODO | [detail](docs/todo/active/2026-05-20-home-hide-daily-card-when-motivation-shows.md) |
| 2026-05-20 | Group Detail mobile redesign (compact header + 3-dot menu + drop Phân tích) | TODO | [detail](docs/todo/active/2026-05-20-group-detail-mobile-redesign.md) |
| 2026-05-20 | Quiz Set Editor i18n (group + personal shared, 8 files) | TODO | [detail](docs/todo/active/2026-05-20-quizset-editor-i18n.md) |
| 2026-05-20 | Ranked result screen redesign (3 state A/B/C + review modal) | DONE | [detail](docs/todo/active/2026-05-20-ranked-result-screen-redesign.md) |
| 2026-05-20 | Ranked spec catch-up: tier-difficulty + UserQuestionHistory write (BL-20, BL-21) | DONE | [detail](docs/todo/active/2026-05-20-ranked-spec-catchup-difficulty-history.md) |
| 2026-05-20 | Ranked DESKTOP redesign v2 (mockup_ranked_desktop_v2.html, 5 sub-tasks) | DONE | [detail](docs/todo/active/2026-05-20-ranked-desktop-redesign-v2.md) |
| 2026-05-20 | Fix score ≠ XP leaderboard mismatch (Rank + Daily) | DONE | [detail](docs/todo/active/2026-05-20-fix-scoring-xp-mismatch.md) |
| 2026-05-20 | Ranked timer: 90s/câu flat (SPEC §3.2 update) | DONE | [detail](docs/todo/active/2026-05-20-ranked-timer-90s.md) |
| 2026-05-20 | Ranked intro screen slim + redesign (4 sub-tasks) | DONE | [detail](docs/todo/active/2026-05-20-ranked-intro-slim-redesign.md) |
| 2026-05-20 | Fix Quiz (rank) explanation auto-shows + pill covers answer D | DONE | [detail](docs/todo/active/2026-05-20-fix-quiz-explanation-hidden-by-default.md) |
| 2026-05-19 | Daily Challenge: Dedupe & Slim Redesign (DC-1..6) | DONE | [detail](docs/todo/active/2026-05-19-daily-challenge-dedupe-slim.md) |
| 2026-05-19 | HomeBanner: revert desktop 3-col, mobile-only full-width progress | DONE | [detail](docs/todo/active/2026-05-19-home-banner-revert-desktop-keep-mobile-fullwidth.md) |
| 2026-05-19 | HomeBanner unified stack layout (mobile parity) | SUPERSEDED | [detail](docs/todo/active/2026-05-19-home-banner-unified-stack-layout.md) |
| 2026-05-19 | HomeBanner mobile restructure: show greet+name, full-width progress | DONE | [detail](docs/todo/active/2026-05-19-home-banner-mobile-restructure.md) |
| 2026-05-19 | Home mobile: variety + group grids 1-col → 2-col | DONE | [detail](docs/todo/active/2026-05-19-home-mobile-cards-2col.md) |
| 2026-05-19 | HomeBanner: "Mùa này" → "Đấu Hạng" + 🏆 icon | DONE | [detail](docs/todo/active/2026-05-19-home-banner-season-stat-clarity.md) |
| 2026-05-19 | HomeBanner mobile: ẩn greeting + name | DONE | [detail](docs/todo/active/2026-05-19-home-banner-mobile-hide-greeting-name.md) |
| 2026-05-19 | Quiz Results: hiển thị tổng điểm trong hero block | DONE | [detail](docs/todo/active/2026-05-19-quiz-results-show-score.md) |
| 2026-05-19 | Rebrand production domain → `forbible.org` | TODO | [detail](docs/todo/active/2026-05-19-rebrand-prod-domain-to-forbible-org.md) |
| 2026-05-18 | Avatar preset rework: people + Bible characters | TODO | [detail](docs/todo/active/2026-05-18-avatar-preset-bible-characters.md) |
| 2026-05-18 | Profile Edit modal redesign (Sacred Modernist + avatar preset) | DONE | [detail](docs/todo/active/2026-05-18-profile-edit-modal-redesign-sacred-modernist.md) |
| 2026-05-18 | Fix Daily Missions "Trả lời đúng 3 câu" + "combo 3" không tick | DONE | [detail](docs/todo/active/2026-05-18-fix-daily-missions-tracking.md) |
| 2026-05-18 | Fix Daily Challenge button "Vào chơi" còn hiện sau khi đã hoàn thành | TODO | [detail](docs/todo/active/2026-05-18-fix-daily-challenge-stale-cta.md) |
| 2026-05-18 | Profile Sprint 1 quick wins (dead buttons + UX polish) | DONE | [detail](docs/todo/active/2026-05-18-profile-sprint-1-quick-wins.md) |
| 2026-05-18 | Profile Sprint 2: skeleton states + split monolith | DONE | [detail](docs/todo/active/2026-05-18-profile-sprint-2-states-and-split.md) |
| 2026-05-18 | Profile Sprint 3: SPEC §21.1 catch-up (Journey + Cosmetic frame) | DONE | [detail](docs/todo/active/2026-05-18-profile-sprint-3-spec-features.md) |
| 2026-05-18 | Profile Sprint 4: Edit Profile modal (wire dead button) | TODO | [detail](docs/todo/active/2026-05-18-profile-sprint-4-edit-modal.md) |
| 2026-05-18 | Fix Daily Challenge question card clipped on mobile | DONE | [detail](docs/todo/active/2026-05-18-fix-daily-challenge-question-clipped-mobile.md) |
| 2026-05-18 | Fix MobileTopBar broken avatar alt-text overflow | DONE | [detail](docs/todo/active/2026-05-18-fix-mobile-topbar-broken-avatar-alt-overflow.md) |
| 2026-05-13 | Home Redesign Modern Spiritual | DONE | [detail](docs/todo/active/2026-05-13-home-redesign-modern-spiritual.md) |
| 2026-05-13 | Disable test data seed on prod + harden guard | TODO | [detail](docs/todo/active/2026-05-13-disable-seed-on-prod-and-harden-guard.md) |
| 2026-05-13 | Code Quality Audit follow-up (BE + FE Web) | PARTIALLY DONE | [detail](docs/todo/active/2026-05-13-code-quality-audit-follow-up-be-fe-web.md) |
| 2026-05-10 | Quiz Set card: thêm action buttons (Chơi cùng nhau / Đặt lịch) | TODO | [detail](docs/todo/active/2026-05-10-quiz-set-card-them-action-buttons-choi-cung-nhau-dat-lich.md) |
| 2026-05-06 | Practice screen redesign + new settings | IN PROGRESS | [detail](docs/todo/active/2026-05-06-practice-screen-redesign-new-settings.md) |
| 2026-05-05 | Quiz Mobile Redesign theo `quiz_mobile_redesign_mockup.html` | IN PROGRESS | [detail](docs/todo/active/2026-05-05-quiz-mobile-redesign-theo-quiz-mobile-redesign-mockup-html.md) |
| 2026-05-05 | Home Redesign theo mockup `home_redesign_mockup.html` | IN PROGRESS | [detail](docs/todo/active/2026-05-05-home-redesign-theo-mockup-home-redesign-mockup-html.md) |
| 2026-05-05 | Group Page redesign: Feature A "Chơi cùng nhau" + Feature B "Đặt lịch chơi" | TODO | [detail](docs/todo/active/2026-05-05-group-page-redesign-feature-a-choi-cung-nhau-feature-b-dat-lich-choi.md) |
| 2026-05-01 | Quiz Screen Redesign — Sprint 1 (P0 critical) | TODO | [detail](docs/todo/active/2026-05-01-quiz-screen-redesign-sprint-1-p0-critical.md) |
| 2026-04-30 | Ranked Page Redesign (Sacred Modernist v2) | IN PROGRESS | [detail](docs/todo/active/2026-04-30-ranked-page-redesign-sacred-modernist-v2.md) |
| 2026-04-29 | Bible Basics Catechism Quiz | IN PROGRESS | [detail](docs/todo/active/2026-04-29-bible-basics-catechism-quiz.md) |
| 2026-04-27 | V3 Tier B/C Quality Expansion: 14 books | IN PROGRESS | [detail](docs/todo/active/2026-04-27-v3-tier-b-c-quality-expansion-14-books.md) |
| 2026-04-19 | Global audience migration: SQL → JSON + i18n prep | PARTIALLY DONE | [detail](docs/todo/active/2026-04-19-global-audience-migration-sql-json-i18n-prep.md) |

## Archive (75)

> 75 task DONE/SUPERSEDED đã chuyển sang [`docs/todo/archive/`](docs/todo/archive/) — duyệt folder theo ngày để tra cứu.

<details>
<summary>Xem inline list (tuỳ chọn)</summary>

- 2026-05-18..20 — **Mobile RN app rewrite (S0–S6 + ranked/daily/quiz fixes, 19 file)** · SUPERSEDED 2026-06-17 — `apps/mobile` đã gỡ để viết lại bản mới · [folder](docs/todo/archive/)

- 2026-06-16 — Quét i18n admin: dịch chuỗi VI còn English + tên sách coverage (AIS-1..2) · DONE · [detail](docs/todo/archive/2026-06-16-admin-i18n-sweep.md)
- 2026-06-16 — Sửa câu hỏi: chuyển PAGE + AI đề xuất đáp án (QPG-1..4) · DONE · [detail](docs/todo/archive/2026-06-16-question-edit-page-ai-suggest.md)
- 2026-06-16 — Edit câu hỏi: dùng chung modal cho Questions + Review Queue (QED-1..2) · DONE · [detail](docs/todo/archive/2026-06-16-edit-in-review-queue.md)
- 2026-06-16 — Sửa câu hỏi: wrap đáp án + nút đánh giá chất lượng tức thời (QEV-1..2; QEV-3 AI defer) · DONE · [detail](docs/todo/archive/2026-06-16-question-edit-quality-tools.md)
- 2026-06-16 — Admin panel: cắt về core (ẩn Tier C, dashboard số liệu thật, review 1-approval, ban REST, xoá trang placeholder) (ADM-1..5) · DONE · [detail](docs/todo/archive/2026-06-16-admin-panel-trim-to-core.md)
- 2026-05-23 — E2E tests cho Đấu Nhanh Quick Match (4 modes, smoke+happy-path+per-mode L2; L3 realtime deferred) · DONE · [detail](docs/todo/archive/2026-05-23-e2e-quickmatch-4modes.md)

- 2026-05-22 — Daily Challenge: wire "Hạng toàn cầu" + bỏ "Trong nhóm" (HeroCard) · DONE · [detail](docs/todo/archive/2026-05-22-daily-challenge-wire-global-group-rank.md)
- 2026-05-19 — Fix Daily Challenge AnswerButton flashes 'wrong' state khi trả lời đúng · DONE · [detail](docs/todo/archive/2026-05-19-fix-daily-answer-button-flash-wrong.md)
- 2026-05-19 — Fix Daily Challenge feedback flashes "Sai rồi!" trước khi hiện đúng · DONE · [detail](docs/todo/archive/2026-05-19-fix-daily-answer-feedback-flash-wrong.md)
- 2026-05-19 — Daily Challenge explanation panel — click outside to close · DONE · [detail](docs/todo/archive/2026-05-19-daily-explanation-click-outside-to-close.md)
- 2026-05-19 — Fix Daily Challenge explanation panel auto-shows + covers answer options · DONE · [detail](docs/todo/archive/2026-05-19-fix-daily-challenge-explanation-hidden-by-default.md)
- 2026-05-18 — Fix FeaturedDailyCard CTA + label wrap xấu ở 360px · DONE · [detail](docs/todo/archive/2026-05-18-fix-featured-daily-card-mobile-button-wrap.md)
- 2026-05-18 — Fix seed VN: thay từ "text" tiếng Anh sang "Kinh Thánh"/"đoạn" · DONE · [detail](docs/todo/archive/2026-05-18-fix-seed-vn-text-wording.md)
- 2026-05-15 — Multiplayer Quick Match (Đấu Nhanh) pivot · DONE · [detail](docs/todo/archive/2026-05-15-multiplayer-quickmatch-pivot.md)
- 2026-05-15 — Multiplayer Lobby patch theo canonical prompt · DONE · [detail](docs/todo/archive/2026-05-15-multiplayer-lobby-patch-canonical.md)
- 2026-05-15 — Multiplayer Lobby redesign (MOCKUP_MULTIPLAYER_LOBBY.html) · DONE · [detail](docs/todo/archive/2026-05-15-multiplayer-lobby-redesign.md)
- 2026-05-15 — Create Room redesign (create_room_redesign.html) · DONE · [detail](docs/todo/archive/2026-05-15-create-room-redesign.md)
- 2026-05-15 — Personal Quiz Set AI (Phase 2) · DONE · [detail](docs/todo/archive/2026-05-15-personal-quiz-set-ai-phase-2.md)
- 2026-05-14 — Personal Quiz Set parity with Group (Phase 1 MVP) · DONE · [detail](docs/todo/archive/2026-05-14-personal-quiz-set-parity-phase-1.md)
- 2026-05-14 — Season overlap: defensive read + admin write guard · DONE · [detail](docs/todo/archive/2026-05-14-season-overlap-defensive-read-write-guard.md)

- 2026-05-10 — Group Detail redesign · DONE · [detail](docs/todo/archive/2026-05-10-group-detail-redesign.md)
- 2026-05-10 — Fix: Quản trò mất isHost sau WS ROOM_STATE event · DONE · [detail](docs/todo/archive/2026-05-10-fix-quan-tro-mat-ishost-sau-ws-room-state-event.md)
- 2026-05-09 — Multiplayer Sprint 4: Host-Organizer separation · DONE · [detail](docs/todo/archive/2026-05-09-multiplayer-sprint-4-host-organizer-separation.md)
- 2026-05-07 — Profile Redesign Phase 1 · DONE · [detail](docs/todo/archive/2026-05-07-profile-redesign-phase-1.md)
- 2026-05-07 — Multiplayer page mobile redesign · DONE · [detail](docs/todo/archive/2026-05-07-multiplayer-page-mobile-redesign.md)
- 2026-05-07 — Multiplayer Lobby Redesign · DONE · [detail](docs/todo/archive/2026-05-07-multiplayer-lobby-redesign.md)
- 2026-05-07 — BasicQuiz UX parity (sound + haptic + full review) · DONE · [detail](docs/todo/archive/2026-05-07-basicquiz-ux-parity-sound-haptic-full-review.md)
- 2026-05-06 — v1 implementation gaps (per SPEC v1.1 §15.2) · DONE · [detail](docs/todo/archive/2026-05-06-v1-implementation-gaps-per-spec-v1-1-15-2.md)
- 2026-05-06 — Spec v1.1 alignment · DONE · [detail](docs/todo/archive/2026-05-06-spec-v1-1-alignment.md)
- 2026-05-06 — Spec compliance follow-ups (sau review SPEC_GROUP_v1) · SUPERSEDED · [detail](docs/todo/archive/2026-05-06-spec-compliance-follow-ups-sau-review-spec-group-v1.md)
- 2026-05-06 — Group → Live Room flow audit fixes · DONE · [detail](docs/todo/archive/2026-05-06-group-live-room-flow-audit-fixes.md)
- 2026-05-05 — Daily Challenge Redesign theo `daily_challenge_mockup.html` · DONE · [detail](docs/todo/archive/2026-05-05-daily-challenge-redesign-theo-daily-challenge-mockup-html.md)
- 2026-05-02 — Variety Modes Leaderboard Fix (Option A) · DONE · [detail](docs/todo/archive/2026-05-02-variety-modes-leaderboard-fix-option-a.md)
- 2026-05-01 — Leaderboard LB-2 Sprint: 3 tabs + 4 liturgical seasons · DONE · [detail](docs/todo/archive/2026-05-01-leaderboard-lb-2-sprint-3-tabs-4-liturgical-seasons.md)
- 2026-05-01 — Leaderboard Redesign Sprint 1 (P0 + P1 mockup) · DONE · [detail](docs/todo/archive/2026-05-01-leaderboard-redesign-sprint-1-p0-p1-mockup.md)
- 2026-05-01 — Home Redesign Sacred Modernist v2 (H1-H8) · DONE · [detail](docs/todo/archive/2026-05-01-home-redesign-sacred-modernist-v2-h1-h8.md)
- 2026-05-01 — Pre-launch Critical Fixes (B1 + B2 + V1) · DONE · [detail](docs/todo/archive/2026-05-01-pre-launch-critical-fixes-b1-b2-v1.md)
- 2026-04-30 — Color Audit (read-only) · DONE · [detail](docs/todo/archive/2026-04-30-color-audit-read-only.md)
- 2026-04-27 — V2 Go-Live Tier A leftover: 5 core books to target · DONE · [detail](docs/todo/archive/2026-04-27-v2-go-live-tier-a-leftover-5-core-books-to-target.md)
- 2026-04-26 — V2 Go-Live Phase 2: Easy/Medium expansion (5 sách core) · DONE · [detail](docs/todo/archive/2026-04-26-v2-go-live-phase-2-easy-medium-expansion-5-sach-core.md)
- 2026-04-26 — V2 Go-Live: Hard-only priority (5 sách core) · DONE · [detail](docs/todo/archive/2026-04-26-v2-go-live-hard-only-priority-5-sach-core.md)
- 2026-04-25 — Seed questions P1 Tier 1 (4 sách missing còn lại) · DONE · [detail](docs/todo/archive/2026-04-25-seed-questions-p1-tier-1-4-sach-missing-con-lai.md)
- 2026-04-25 — Room chat over STOMP/WebSocket · DONE · [detail](docs/todo/archive/2026-04-25-room-chat-over-stomp-websocket.md)
- 2026-04-20 — Daily Challenge as secondary XP path (+50 XP) · DONE · [detail](docs/todo/archive/2026-04-20-daily-challenge-as-secondary-xp-path-50-xp.md)
- 2026-04-19 — Dual-path progress indicator on locked Ranked card · DONE · [detail](docs/todo/archive/2026-04-19-dual-path-progress-indicator-on-locked-ranked-card.md)
- 2026-04-19 — Early Ranked unlock (80% accuracy Practice path) · DONE · [detail](docs/todo/archive/2026-04-19-early-ranked-unlock-80-accuracy-practice-path.md)
- 2026-04-19 — FAQ / Help page · DONE · [detail](docs/todo/archive/2026-04-19-faq-help-page.md)
- 2026-04-19 — Actionable locked card UX · DONE · [detail](docs/todo/archive/2026-04-19-actionable-locked-card-ux.md)
- 2026-04-19 — Remove duplicate top-nav + sidebar-nav · DONE · [detail](docs/todo/archive/2026-04-19-remove-duplicate-top-nav-sidebar-nav.md)
- 2026-04-19 — JSON Question Seeder (production source of truth) · DONE · [detail](docs/todo/archive/2026-04-19-json-question-seeder-production-source-of-truth.md)
- 2026-04-19 — Consolidate tiers data single source of truth · DONE · [detail](docs/todo/archive/2026-04-19-consolidate-tiers-data-single-source-of-truth.md)
- 2026-04-19 — Cleanup half-migration tier naming (keep OLD) · DONE · [detail](docs/todo/archive/2026-04-19-cleanup-half-migration-tier-naming-keep-old.md)
- 2026-04-19 — Fix i18n interpolation bug in Activity Feed · DONE · [detail](docs/todo/archive/2026-04-19-fix-i18n-interpolation-bug-in-activity-feed.md)
- 2026-04-19 — Fix Leaderboard duplicate "Bạn" row · DONE · [detail](docs/todo/archive/2026-04-19-fix-leaderboard-duplicate-ban-row.md)
- 2026-04-19 — UX Fix: Tier Gating + Overload + Text Mismatch · DONE · [detail](docs/todo/archive/2026-04-19-ux-fix-tier-gating-overload-text-mismatch.md)
- 2026-04-19 — Game Mode Tier Layout + Stronger Highlight · DONE · [detail](docs/todo/archive/2026-04-19-game-mode-tier-layout-stronger-highlight.md)
- 2026-04-19 — Game Mode Recommendation (smart highlight) · DONE · [detail](docs/todo/archive/2026-04-19-game-mode-recommendation-smart-highlight.md)
- 2026-04-19 — Practice XP persistence bug fix · DONE · [detail](docs/todo/archive/2026-04-19-practice-xp-persistence-bug-fix.md)
- 2026-04-18 — Lifeline v1 (Hint only) · DONE · [detail](docs/todo/archive/2026-04-18-lifeline-v1-hint-only.md)
- 2026-04-18 — Move Pages into AppLayout · DONE · [detail](docs/todo/archive/2026-04-18-move-pages-into-applayout.md)
- 2026-04-18 — Multiplayer Width Fix · DONE · [detail](docs/todo/archive/2026-04-18-multiplayer-width-fix.md)

</details>
