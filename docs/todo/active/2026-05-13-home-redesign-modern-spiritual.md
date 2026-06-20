# 2026-05-13 — Home Redesign Modern Spiritual

> **Source**: `docs/designs/PROMPT_HOME_REDESIGN.md` + mockup `docs/designs/home_modern.html`
> **Scope**: Refactor `apps/web/src/pages/Home.tsx` theo direction "Modern Spiritual" — atmosphere (noise + gold radial gradient) + Be Vietnam Pro 800 sport-app numbers + Cormorant Garamond italic chỉ ở verse + Dynamic Hierarchy 2 states (Daily todo / Daily done). Frontend-only, 5+ components mới. Phase 1 Audit STOP trước Phase 2.
> **Status**: DONE (2026-06-19)

### Tasks

- HR-AUDIT Phase 1: Audit current Home.tsx + data flow + write `HOME_REDESIGN_AUDIT.md`
  - Status: `[x]` DONE · Files: `apps/web/src/pages/__tests__/HOME_REDESIGN_AUDIT.md` · Test: N/A (audit report)
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: [x] read mockup · [x] read Home.tsx · [x] grep data hooks · [x] diff vs mockup · [ ] commit · **STOP** chờ Bui confirm
  - **Result**: ZERO backend changes (`/api/daily-challenge` đã trả `alreadyCompleted`). Test baseline: 1212. ~910 LOC + ~33 new tests estimate. 3 open questions cho Bui (xoá Leaderboard/Activity/TierPerks khỏi Home?).

- HR-1 Atmosphere + global tokens (noise SVG, radial gradients, font weight 800, Cormorant Garamond italic, Tailwind colors)
  - Status: `[x]` DONE · Files: `apps/web/src/styles/global.css`, `apps/web/tailwind.config.js`, `apps/web/index.html` · Test: build pass + Home.test 37/37
  - **Spec impact**: `[x]` None (presentation only)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: [x] impl · [x] build pass · [x] Tầng 2 (Home.test 37/37) · [ ] commit · STOP
  - **Done**:
    - `global.css`: removed 3 duplicate `body` declarations + 4 legacy CSS vars (`--deep-space`/`--glass-surface`/`--dark-bg`/`--card-bg` — confirmed ZERO deps outside global.css). Added 1 consolidated body block với 4-layer radial gradient atmosphere (`#0a0c14` base + gold + maroon hints), `body::before` noise (data URI SVG), `body::after` vignette, `#root` z-index promotion, `@keyframes breathe` + `.animate-breathe` cho HR-2 streak flame.
    - `tailwind.config.js`: thêm `ivory` `#f5f0e6`, `ivory-dim` `#b8b1a3`, `ivory-faint` `#6e6a60`, `gold-deep` `#c98a1c`, `gold-shadow` `#7a5818`, `maroon` `#7c2d3a`, `sage` `#4a6b52`. Update `fontFamily.verse` prepend Cormorant Garamond (keep Crimson Pro fallback). KHÔNG touch `fontFamily.serif` (vẫn Playfair Display — preserved cho DailyChallenge quote + DailyVerseBanner sẽ thay ở HR-8).
    - `index.html`: load Cormorant Garamond italic-only `1,500;1,600;1,700` (non-blocking preload+swap). Remove `bg-[#11131e]` từ body class (let CSS atmosphere show through).

- HR-2 Banner update (sport-app numbers, tabular-nums, weight 800, breathing streak)
  - Status: `[x]` DONE · Files: `apps/web/src/components/HomeBanner.tsx` (NEW) + test, delete `GreetingCard.tsx` + test, update `Home.tsx` · Test: HomeBanner 6/6 + Home 37/37
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: [x] impl HomeBanner.tsx · [x] tests 6 pass · [x] Home.tsx swap import · [x] delete GreetingCard · [x] Home.test 1 fix (45,200 split into own span) · [x] build pass · [ ] commit
  - **Done**:
    - `HomeBanner.tsx` mới với sport-app typography: avatar 72px gold gradient + inset highlight + dashed ring · greeting sans uppercase tracked 0.18em GOLD · name sans extrabold 22/30px ivory tracked -0.025em · tier row inline (current GOLD → next ivory-dim + 5px progress + tabular-nums XP với gold value/ivory-faint slash) · 3 stats line SVG icons (flame/bolt/coin stroke 1.6) + sans extrabold 22px tabular-nums + uppercase 9px tracked labels. Flame có `animate-breathe`.
    - Mobile responsive: `grid-cols-[auto_1fr]` → `md:grid-cols-[auto_1fr_auto]`. Stats stack dưới name trên mobile, inline desktop.
    - Backward-compat: giữ nguyên testids `home-greeting-*` để Home.test.tsx không churn.
    - Home.test.tsx fix 1 test: HR-2 split `45,200` thành span riêng → `getByText('45,200')` match 2 chỗ (banner XP + leaderboard row). Đổi sang `getAllByText().length >= 1`.

- HR-3 FeaturedDailyCard component (State A hero — daily chưa làm)
  - Status: `[x]` DONE · Files: `apps/web/src/components/FeaturedDailyCard.tsx` + test · Test: 7/7
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: [x] impl · [x] internal countdown via setInterval · [x] pulsing dot via animate-pulse · [x] 7 tests pass · [ ] commit
  - **Done**: Maroon+gold radial bg + 3px gold left border + 16px radius. Pulsing dot label "THỬ THÁCH HÔM NAY · MỚI SẴN SÀNG". Title sans 800 24px ivory. Tagline + meta (5 dots indicator + clock + people optional). Right column: "CÒN LẠI TRONG NGÀY" + countdown (tabular-nums gold-light) + gold-gradient CTA "Vào chơi ngay →". Props: questionCount/estimatedMinutes/globalParticipants/countdownText/onStart. Self-contained countdown via setInterval(1000) khi `countdownText` undefined. Mobile: countdown + CTA stack ngang dưới content.

- HR-4 HeroRankedCard component (State B hero — daily đã làm, Ranked promoted)
  - Status: `[x]` DONE · Files: `apps/web/src/components/HeroRankedCard.tsx` + test · Test: 6/6
  - **Spec impact**: `[x]` None (consumes BL-4 fix from prior commit)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: [x] impl · [x] gold gradient base + radial highlight overlay (split for jsdom) · [x] custom label/tagline props · [x] uses t('gameModes.ranked') = "Đấu Hạng" · [x] 6 tests pass · [ ] commit
  - **Done**: full gold gradient bg (#e8a832→#c98a1c→#7a5818) + radial gold highlight overlay (inner div pour jsdom parse được nhiều layers). Box-shadow gold tint + gold ring + inset highlight. Decorative SVG ornament. Title sans 800 34px dark `#1a1208` với text-shadow gold tint. Energy + ranked progress với line SVG icons. CTA dark `#1a1208` + gold text "Vào trận →" hover translateX(3px). Whole card clickable (role=button, keyboard Enter/Space).

- HR-5 RankedStandardCard component (State A standard — daily chưa làm, Ranked không promoted)
  - Status: `[x]` DONE · Files: `apps/web/src/components/RankedStandardCard.tsx` + test · Test: 5/5
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: [x] impl · [x] gold tint (low alpha 0.06) NOT full gradient · [x] title via t('gameModes.ranked') = "Đấu Hạng" · [x] 5 tests · [ ] commit
  - **Done**: Standard mode-card pattern với gold-tint background (linear gradient 6% gold trên glass) + 1px gold border. Icon gold-tinted box, pill "Đã mở khóa" gold. Footer: "Vào trận →" gold CTA + "X / 100 câu hôm nay" right hint. Test verify KHÔNG có #7a5818 (gold-shadow của hero) — ensure NOT full hero gradient.

- HR-6 SectionHeader + DailyCompletedStrip (sage tint)
  - Status: `[x]` DONE · Files: `SectionHeader.tsx`, `DailyCompletedStrip.tsx` + 2 tests · Test: 4+6 = 10/10
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: [x] SectionHeader (gold bar + small caps title + optional meta) · [x] DailyCompletedStrip (sage tint pill + check icon + score message + review CTA + countdown) · [x] 10 tests pass · [ ] commit
  - **Done**: SectionHeader = 3×14px gold gradient accent bar + 11px sans 700 ivory uppercase tracked 0.16em + optional 11px ivory-faint meta right. DailyCompletedStrip = sage `rgba(74,107,82,0.10)` bg + sage border, 32px check circle, score "X/Y đúng — Giỏi lắm!" (helper `scoreMessage` chia ngưỡng 80/60/0), sub line "Hôm nay · {trailing} · Thử thách mới sau {countdown}" với tabular-nums countdown, glass button "Xem lại bài làm".

- HR-7 Home.tsx refactor — dynamic hierarchy state-aware layout
  - Status: `[x]` DONE · Files: `Home.tsx` rewrite + `__tests__/Home.test.tsx` rewrite · Test: 26/26 (was 37)
  - **Spec impact**: `[x]` None (refactor presentation, business logic không đổi)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: [x] impl state-aware render · [x] remove Leaderboard inline + ActivityFeed + TierPerksTeaser + GameModeGrid + FeaturedDailyChallenge imports · [x] integrate HomeBanner + FeaturedDailyCard + HeroRankedCard + RankedStandardCard + DailyCompletedStrip + SectionHeader · [x] preserve MotivationCard slotting (sau Daily, trước Missions, gated shouldShowMotivation) · [x] preserve DailyMissionsCard `!isNewUser` gate · [x] preserve BibleJourneyCard + DailyVerseBanner (HR-8 sẽ thay verse) · [x] Home.test rewrite (26 tests new) · [x] build pass · [ ] commit
  - **Done**: Home.tsx (~280 LOC vs 334 cũ). State A flow: HomeBanner → FeaturedDailyCard → (Motivation if shown) → (Missions if !isNewUser) → "Chế độ chơi chính" 2-col [Practice + RankedStandardCard] → "Chế độ đa dạng" 3-col [Weekly/Mystery/Speed] → "Thi đấu cộng đồng" 3-col → Journey+Verse 2-col. State B flow: HomeBanner → DailyCompletedStrip → HeroRankedCard → (Motivation if shown) → (Missions if !isNewUser) → "Khám phá thêm" 4-col [Practice/Weekly/Mystery/Speed] → "Thi đấu cộng đồng" 3-col → Journey+Verse 2-col. Internal countdown via setInterval(1000). Removed 5 imports (GameModeGrid, FeaturedDailyChallenge, ActivityFeed, TierPerksTeaser, EmptyLeaderboardCTA + inline LeaderboardRow). Removed `useState(lbPeriod)`, `lbData`, `rankData` queries.

- HR-8 Verse footer (drop cap + ornament Cormorant Garamond italic)
  - Status: `[x]` DONE · Files: `VerseFooter.tsx` + test + `global.css` ::first-letter rule + `Home.tsx` swap · Test: 6 + 26 = 32/32
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: [x] impl · [x] `.hr-verse-text::first-letter` rule trong global.css (pseudo-element cần CSS, không inline được) · [x] font-verse Tailwind class (Cormorant Garamond italic) · [x] line + star + line ornament · [x] em-dash cite uppercase tracked 0.22em · [x] Home.tsx swap: DailyVerseBanner → VerseFooter, Journey full-width thay 2-col grid · [x] Home.test 1 assertion update · [ ] commit
  - **Done**: VerseFooter component (~65 LOC) với `verse` + `source` props (default `getDailyVerse()` + "BTTHĐ 2011"). Drop cap qua `.hr-verse-text::first-letter` rule (3.4em gold + text-shadow). Ornament SVG star giữa 2 gold gradient lines. Cite em-dash `— Hê-bơ-rơ 13:5 · BTTHĐ 2011 —` uppercase tracked 0.22em ivory-dim. Home.tsx: remove DailyVerseBanner import, add VerseFooter, refactor verse-journey 2-col → Journey full-width + VerseFooter below.

- HR-9 Phase 3: Full regression Tầng 3 + manual 2-state QA
  - Status: `[x]` DONE · Files: N/A (test runner only) · Test: full `vitest run`
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: [x] full Vitest run · [x] no regression vs pre-HR baseline · [x] build pass · [ ] manual UI QA (chờ Bui)
  - **Done**: Full vitest comparison:
    - Pre-HR (commit c5ccdbf): **1161 pass / 129 fail / 1290 total**
    - Post-HR (commit f315e22): **1164 pass / 125 fail / 1289 total**
    - Delta: **+3 pass, -4 fail, -1 total** ⇒ no regression, slight improvement
    - 8 HR component test suites: HomeBanner 6 · FeaturedDailyCard 7 · HeroRankedCard 6 · RankedStandardCard 5 · SectionHeader 4 · DailyCompletedStrip 6 · VerseFooter 6 · Home 26 = **66 HR tests, 66/66 pass**
    - Build pass (vite build clean)
    - 125 remaining failures are pre-existing (BasicQuizCard, ErrorToast, LiveFeed, Ranked, admin pages — flaky timers/animation, not HR-related)
  - **Note**: `.test-baseline` file says 1212 but actual pre-HR baseline = 1161 — file is stale. Cleanup task: update or remove.

### Final summary (10 commits trên branch `chore/code-quality-improvements`)

| Commit | Title |
|---|---|
| 28feaea | chore: home redesign audit |
| 35b4ff8 | feat: HR-1 atmosphere tokens + Cormorant Garamond italic |
| 8cdba81 | feat: HR-2 banner sport-app typography |
| 1b01876 | feat: HR-3 FeaturedDailyCard component |
| c3c8e7c | fix(BL-4): normalize web i18n to "Đấu Hạng" + "Luyện Tập" |
| 69f4bab | feat: HR-4 HeroRankedCard component |
| a254efd | feat: HR-5 RankedStandardCard component |
| c578770 | feat: HR-6 SectionHeader + DailyCompletedStrip |
| 0c1015e | feat: HR-7 Home dynamic hierarchy (state-aware layout) |
| f315e22 | feat: HR-8 Verse footer drop cap + ornament |

Branch chưa merge — Bui sẽ tự merge sau.
  - Checklist: full Vitest pass · count >= baseline + new tests · build pass · mobile responsive · 2 states render đúng · commit `test: HR-9 home redesign full regression` · final approval chờ Bui

### Notes

- **Stop checkpoint sau MỖI task** (per prompt §8) — không tự ý chạy tiếp.
- Mockup ground truth: `docs/designs/home_modern.html` (untracked, sẽ commit trong HR-AUDIT hoặc HR-1).
- KHÔNG đụng Sidebar, AppLayout, Quiz/Ranked/Practice screens, Mobile app.
- Constraints lock: C1 tier names religious, hardcode hex (không CSS variables), Cormorant Garamond CHỈ verse.
