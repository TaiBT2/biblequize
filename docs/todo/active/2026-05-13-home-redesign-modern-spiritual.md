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
  - Status: `[ ]` TODO · Files: `apps/web/src/components/HomeBanner.tsx` (hoặc inline trong Home.tsx) + test · Test: Vitest 4 tests
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1 pass · commit `feat: HR-2 banner sport-app typography` · STOP

- HR-3 FeaturedDailyCard component (State A hero — daily chưa làm)
  - Status: `[ ]` TODO · Files: `apps/web/src/components/FeaturedDailyCard.tsx` + test · Test: Vitest 5 tests
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: impl · countdown logic · pulsing dot · Tầng 1 pass · commit `feat: HR-3 FeaturedDailyCard component` · STOP

- HR-4 HeroRankedCard component (State B hero — daily đã làm, Ranked promoted)
  - Status: `[ ]` TODO · Files: `apps/web/src/components/HeroRankedCard.tsx` + test · Test: Vitest 5 tests
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: impl · gold gradient bg · default labels override-able · Tầng 1 pass · commit `feat: HR-4 HeroRankedCard component` · STOP

- HR-5 RankedStandardCard component (State A standard — daily chưa làm, Ranked không promoted)
  - Status: `[ ]` TODO · Files: `apps/web/src/components/RankedStandardCard.tsx` + test · Test: Vitest 4 tests
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: impl · gold tint (không full gradient) · Tầng 1 pass · commit `feat: HR-5 RankedStandardCard component` · STOP

- HR-6 SectionHeader + DailyCompletedStrip (sage tint)
  - Status: `[ ]` TODO · Files: `apps/web/src/components/SectionHeader.tsx`, `apps/web/src/components/DailyCompletedStrip.tsx` + tests · Test: Vitest 6 tests
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: impl · gold accent bar · sage green tint · Tầng 1 pass · commit `feat: HR-6 SectionHeader + DailyCompletedStrip` · STOP

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
