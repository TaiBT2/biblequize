# 2026-05-13 — Home Redesign Modern Spiritual

> **Source**: `docs/designs/PROMPT_HOME_REDESIGN.md` + mockup `docs/designs/home_modern.html`
> **Scope**: Refactor `apps/web/src/pages/Home.tsx` theo direction "Modern Spiritual" — atmosphere (noise + gold radial gradient) + Be Vietnam Pro 800 sport-app numbers + Cormorant Garamond italic chỉ ở verse + Dynamic Hierarchy 2 states (Daily todo / Daily done). Frontend-only, 5+ components mới. Phase 1 Audit STOP trước Phase 2.
> **Status**: IN PROGRESS

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
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/Home.tsx` + `__tests__/Home.test.tsx` · Test: Vitest update + 5 new tests
  - **Spec impact**: `[x]` None (refactor presentation, business logic không đổi)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: impl · state-aware render · Tầng 2 (Home tests) pass · manual UI 2 states · commit `feat: HR-7 Home dynamic hierarchy (state-aware layout)` · STOP

- HR-8 Verse footer (drop cap + ornament Cormorant Garamond italic)
  - Status: `[ ]` TODO · Files: `apps/web/src/components/VerseFooter.tsx` + test · Test: Vitest 4 tests
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: impl · `::first-letter` drop cap gold · em-dash cite · Tầng 1 pass · commit `feat: HR-8 Verse footer drop cap + ornament` · STOP

- HR-9 Phase 3: Full regression Tầng 3 + manual 2-state QA
  - Status: `[ ]` TODO · Files: N/A (test runner) · Test: full `vitest run` + manual UI
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: full Vitest pass · count >= baseline + new tests · build pass · mobile responsive · 2 states render đúng · commit `test: HR-9 home redesign full regression` · final approval chờ Bui

### Notes

- **Stop checkpoint sau MỖI task** (per prompt §8) — không tự ý chạy tiếp.
- Mockup ground truth: `docs/designs/home_modern.html` (untracked, sẽ commit trong HR-AUDIT hoặc HR-1).
- KHÔNG đụng Sidebar, AppLayout, Quiz/Ranked/Practice screens, Mobile app.
- Constraints lock: C1 tier names religious, hardcode hex (không CSS variables), Cormorant Garamond CHỈ verse.
