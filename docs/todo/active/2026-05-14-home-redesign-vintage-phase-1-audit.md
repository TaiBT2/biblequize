# 2026-05-14 — Home Redesign (Vintage Gamified) — Phase 1 Audit

> **Source**: User prompt 2026-05-14 + design files `docs/designs/biblequiz/` (Home.html + styles.css + 2 screenshots)
> **Scope**: Read-only audit để gate Phase 2 (UI rebuild). Direction "vintage gamified" — illuminated manuscript meets mobile-game chunkiness. Supersedes `2026-05-13-home-redesign-modern-spiritual` + `2026-05-05-home-redesign-theo-mockup-home-redesign-mockup-html` (per user decision 2026-05-14).
> **Status**: PHASE 1 DONE (audit) — PHASE 2 IN PROGRESS (HRV-7 DONE, restyle commits ahead).

### Phase 2 progress

- **HRV-18** SectionHeader spacing + tag slot wiring — `[x]` DONE 2026-05-14
  - Files: `apps/web/src/pages/Home.tsx` (2 LOC: `meta={subtitle}` → `tag={subtitle}` cho variety + explore — subtitle now renders as gold em-dashed flavor "— {subtitle} —" in middle slot instead of right-meta grey text). `apps/web/src/components/SectionHeader.tsx` (1 LOC: margin `mt-10 mb-4` → `mt-12 md:mt-14 mb-4 md:mb-5` for vintage 56px breathing room).
  - Visual outcome: each major section ("Chế độ đa dạng", "Khám phá thêm") now has the gold em-dashed flavor tag matching vintage Home.html `.section-h .tag` pattern. Increased top margin gives the page more vintage breathing-room rhythm.
  - Test: SectionHeader 7/7 + Home 26/26 pass — testid contracts preserved.
  - Strategy: `(c) [no-spec-impact]` — visual polish.

- **HRV-17** Poetic hero greeting + rank chip pill + tagline — `[x]` DONE 2026-05-14
  - Files: `apps/web/src/components/HomeBanner.tsx` (+45 LOC: eyebrow now has gold accent dash, h1 multi-line "{name},\n<accent>cuộc hành trình</accent> chờ con.", new rank-chip pill with pulsing gold dot showing current → next tier, tagline "Hôm nay là ngày tốt để mở Kinh Thánh."). `apps/web/src/i18n/{vi,en}.json` (+8 keys: `home.hero.{greetingAccent,greetingSuffix,tagline}` vi+en). `apps/web/src/components/__tests__/HomeBanner.test.tsx` (+30 LOC: add i18n mock + 4 new tests for poetic content + rank chip + max-tier gate + tagline).
  - Matches vintage Home.html hero spec (h1 `clamp(40px,6vw,72px)` Yeseva One + accent span + rank-chip pill `dot + label` + sub-line tagline). Avatar preserved (our app has avatar in banner, vintage moves it to sidebar — we keep ours for the personal touch).
  - Max-tier gracefully hides rank chip (no `tier.next` to display) while keeping poetic h1 + tagline + 👑 max-tier message.
  - Test: HomeBanner 9/9 (was 5, +4 for HRV-17 poetic/chip/tagline assertions) + HomeHud 5/5 + Home 26/26 = 40/40 pass after adding i18n mock to HomeBanner.test.
  - Strategy: `(c) [no-spec-impact]`.

- **HRV-16** HUD stat-pill extraction (deferred from BL-19) — `[x]` DONE 2026-05-14
  - Files: NEW `apps/web/src/components/HomeHud.tsx` (~85 LOC), NEW `apps/web/src/components/__tests__/HomeHud.test.tsx` (~85 LOC, 5 tests), EDIT `HomeBanner.tsx` (remove stats grid column + Stat helper, ~-65 LOC), EDIT `HomeBanner.test.tsx` (remove 4 stat tests moved to HomeHud), EDIT `Home.tsx` (+2 LOC: import + render HomeHud above HomeBanner).
  - Vintage Home.html structure now matched: HUD row (3 chunky stat pills + page title "Trang chủ" upper-tracked) sits above Hero (avatar + greeting + name + 6-tier XP rail). Cleaner separation of concerns. HomeHud shares TanStack Query keys (`['me']`, `['ranked-status']`) with HomeBanner — single fetch, cached.
  - Testid contract preserved: `home-greeting-stat-{streak,energy,season}` testids still resolvable. Home.test.tsx unaffected (queries by testid, not by parent).
  - Test: HomeHud 5/5 + HomeBanner 5/5 (was 8, -3 moved) + Home 26/26 pass = 36/36.
  - Strategy: `(c) [no-spec-impact]` — visual structure only.

- **HRV-15** Final integration + BL-19 BACKLOG entry — `[x]` DONE 2026-05-14
  - Files: `docs/spec/BACKLOG.md` (add BL-19 Home vintage redesign tracking entry — links audit + supersede context + 3 outstanding deferred items), task file marked Phase 2 IMPLEMENTATION COMPLETE.
  - Final Tier-3: vitest 1297 total (was 1292 pre-Phase 2), **1172 pass (was 1167) — Phase 2 added 5 NEW tests all passing, 0 new failures introduced**. Pre-existing 125 failures unchanged (ErrorContext/ErrorToast/BasicQuizCard/SdArenaHeader baseline drift, not caused by HRV-7..HRV-14).
  - Spec audit: 67 broken refs / 325 orphans / 212 undocumented — all pre-existing (Phase 2 introduces zero new spec references in source files; only audit report MD + task MD reference local paths).
  - i18n: 8 new keys added (home.modeCorner × 4 in vi + en); pre-existing 1014/16 hardcoded count unchanged (Phase 2 touched components reused existing t() calls or carried over pre-existing hardcoded VN strings — flagged for separate cleanup sprint per BL-19 outstanding).
  - Strategy: `(b) BL-19 NEW BACKLOG entry`. Spec impact: SPEC_USER §Home (visual redesign documented inline via BACKLOG link).

- **HRV-14** BibleJourneyCard vintage palette + state-differentiated chips — `[x]` DONE 2026-05-14
  - Files: `apps/web/src/components/BibleJourneyCard.tsx` (~30 LOC). Decision: **restyle in place** (no fork to BibleJourneyVintagePath). Existing horizontal-scroll chip layout matches vintage "stations" concept enough; full SVG curving-path background + 72px seal disks deferred (would be ~120 LOC fork — defer to future Phase if user requests).
  - Card root: `bg-bg-deep` + `border-line` + `shadow-chunky-soft` (vintage `.journey`). Gold radial glow moved bottom-left (matches vintage `radial-gradient(ellipse 600px 200px at 20% 100%)`). Title h3 → `font-display` 20→24px. Meta count → `font-numeric` (JetBrains Mono) with `gold-bright` for total.
  - Chip palette by state: `current` = gold-bright radial + 1.5px gold border + glow (more dramatic than V2); `done` = emerald-tinted bg + emerald border (was identical to default); `locked` = darker bg + line border + opacity-50. Hover lift on non-locked chips. `opacity-45 → opacity-50` (minor adjustment).
  - Test: BibleJourneyCard 30/30 + Home 26/26 pass after updating 1 test assertion `opacity-45 → opacity-50`.
  - Strategy: `(c) [no-spec-impact]`.

- **HRV-13** DailyMissionsCard vintage scroll-paper — `[x]` DONE 2026-05-14
  - Files: `apps/web/src/components/DailyMissionsCard.tsx` (~40 LOC). Replaces flat surface bg with vintage ruled-paper: `repeating-linear-gradient(180deg, transparent 0 36px, line-soft 36px 37px)` over `linear-gradient(180deg, #1b1424, #241a2e)`. Adds top + bottom dashed decoration spans (`repeating-linear-gradient` horizontal). Header restyled SectionHeader-pattern: Yeseva One title + gold em-dash subtitle "— Daily Quests —" + right meta count (JetBrains Mono). Mission checkbox: 5x5 → 6x6, rounded-md (vintage seal square), thicker border-2, completed state filled gold-bright + dark icon.
  - Test: DailyMissionsCard 5/5 + Home 26/26 pass — testids stable.
  - Strategy: `(c) [no-spec-impact]`.

- **HRV-12** HeroRankedCard + RankedStandardCard ruby chunky + C2 lock fix — `[x]` DONE 2026-05-14
  - **C2 enforcement**: `home.heroRanked.label` vi.json "Tiếp theo · **Bước vào đấu trường**" → "Tiếp theo · **Đấu Hạng**". en.json "Up next · Enter the arena" → "Up next · Đấu Hạng (Ranked)". Title h2 already used `t('gameModes.ranked')` = "Đấu Hạng" ✓.
  - HeroRankedCard.tsx: card root = `bg-bg-deep` + `border-line` + `shadow-chunky-soft` (replaces V2 glass `rgba(50,52,64,0.5)`). Radial glow ruby `rgba(199,62,62,0.30)` (replaces V2 gold). Title h2 → `font-display` 30→44px (replaces sans extrabold). CTA → `shadow-chunky-ruby` + ruby gradient `#e55757→#c73e3e` + uppercase tracked + active push-down.
  - RankedStandardCard.tsx: card root vintage `bg-bg-deep` + `border-line` + `shadow-chunky-soft` (replaces gold border + glass blur). Subtle ruby radial top-right. Title → `font-display` 22px.
  - HeroRankedCard.test: rewrite V2 glass+gold assertion → vintage class assertions + ruby radial. RankedStandardCard.test: rewrite gold-tint assertion → vintage chunky-soft + ruby radial assertion. 11/11 + 5/5 ranked tests pass after update.
  - Test: HeroRankedCard 6/6 + RankedStandardCard 5/5 + Home 26/26 pass.
  - Strategy: `(c) [no-spec-impact]` (visual + i18n string value change — keys preserved, no shape change).

- **HRV-11** FeaturedDailyCard chunky gold + DailyCompletedStrip emerald palette — `[x]` DONE 2026-05-14
  - Files: `apps/web/src/components/FeaturedDailyCard.tsx` (~6 LOC: bg-deep + line border + chunky-soft shadow + vintage gold-bright radial; h2 → font-display 22/28px; CTA → chunky-gold shadow + uppercase tracked + relabel "Bắt đầu hôm nay" matching vintage Home.html; press-down on active:translate-y-1). `apps/web/src/components/DailyCompletedStrip.tsx` (~3 LOC: border emerald-deep/40 + chunky-soft shadow + emerald-tinted gradient bg). DailyCompletedStrip stays minimal — strip layout already close to vintage feel.
  - Test: FeaturedDailyCard 7/7 + DailyCompletedStrip 6/6 + Home 26/26 pass.
  - Strategy: `(c) [no-spec-impact]`.

- **HRV-10** HomeBanner vintage palette + 6-tier milestone rail — `[x]` DONE 2026-05-14
  - Files: `apps/web/src/components/HomeBanner.tsx` (~12 LOC: bg-deep + line border + chunky-soft shadow + gold radial glow stronger; name → font-display 26/40px; milestone dots 5 → 6; stat numbers → font-numeric JetBrains Mono), `apps/web/src/components/__tests__/HomeBanner.test.tsx` (update name assertion font-display + tracking-[-0.02em]; add 6-milestone test + font-numeric test, baseline 6 → 8).
  - Scope intentionally minimal — palette + typography + dot count. HUD stat-pill EXTRACTION (separate from Hero greeting per vintage Home.html) is deferred to HRV-15 final integration if needed; current structure keeps all 3 stats inside HomeBanner, preserving testid contracts.
  - Test: HomeBanner 8/8 + Home 26/26 pass.
  - Strategy: `(c) [no-spec-impact]` — visual only.

- **HRV-9** CompactCard vintage variant + Home wire-up — `[x]` DONE 2026-05-14
  - Files: `apps/web/src/components/CompactCard.tsx` (extend with `variant` + `cornerBadge` props, +90 LOC vintage render branch), `apps/web/src/pages/Home.tsx` (add `cornerBadgeKey` to ModeConfig + pass `variant="vintage"` + cornerBadge i18n key per card, +12 LOC), `apps/web/src/i18n/{vi,en}.json` (+8 keys: `home.modeCorner.{practice,weekly,mystery,speed}`).
  - Vintage variant: solid `bg-[#1b1424]` + border `line-soft` + `shadow-chunky-soft` (Duolingo 4px hard offset) + hover lift + active push-down. Solid `themeHex` ico-box 48px with `inset 0 -3px 0 0 rgba(0,0,0,0.22)` for 3D feel. Yeseva One title 18→20px. Optional corner badge (top-right uppercase JetBrains Mono tracked). Lock chip + reason override into ruby palette.
  - Modern variant preserved as-is for `GameModeGrid` (used in Groups page) — backward-compat verified.
  - Test: Home 26/26 + SectionHeader 7/7 + VerseFooter 6/6 + GameModeGrid 29/29 pass · i18n validate: 1014 hardcoded / 16 missing keys are pre-existing project drift in Group/Multiplayer/RoomQuiz (not files touched).
  - Strategy: `(c) [no-spec-impact]`.

- **HRV-8** SectionHeader + VerseFooter drop cap restyle (Yeseva One) — `[x]` DONE 2026-05-14
  - Files: `apps/web/src/components/SectionHeader.tsx` (rewrite, ~40 LOC), `apps/web/src/components/__tests__/SectionHeader.test.tsx` (4→7 tests), `apps/web/src/styles/global.css` (drop cap rule swap, ~5 LOC). VerseFooter.tsx unchanged — body verse keeps Cormorant Garamond italic (Yeseva One has no italic variant, synthesized italic looks bad for flowing text); only drop cap swaps to Yeseva One regular (illuminated-manuscript heavy initial).
  - SectionHeader: Yeseva One 22→28px responsive title, optional `tag` prop (gold em-dash flavor "— Quest Map —"), optional `meta` right slot (existing). API backward-compat — old call sites still render (just bigger title without uppercase tracked styling).
  - Test: vitest SectionHeader 7/7 + VerseFooter 6/6 + Home 26/26 pass · global.css sensitive file edited but rule scoped to `.hr-verse-text::first-letter` (only used by VerseFooter).
  - Strategy: `(c) [no-spec-impact]`.

- **HRV-7** Font + token foundation (Option C Hybrid) — `[x]` DONE 2026-05-14
  - Files: `apps/web/index.html` (+10 LOC), `apps/web/tailwind.config.js` (+29 LOC)
  - Added: Yeseva One + JetBrains Mono font links (preload+swap pattern). `fontFamily.display` (Yeseva One stack) + `fontFamily.numeric` (JetBrains Mono stack) — KEEP existing `mono`/`serif`/`verse` untouched (regression-safe for admin dashboard + verse footer). 9 vintage colors: `bg-deep`/`bg-wash`/`ruby`/`ruby-deep`/`emerald`/`emerald-deep`/`plum`/`plum-deep`/`line`/`line-soft`. 3 boxShadow utilities: `chunky-gold`/`chunky-ruby`/`chunky-soft`.
  - Test: build pass ✓ · type-check baseline (no NEW errors) · vitest Home + VerseFooter + DailyVerseBanner 36/36 · full suite 1167 pass / 125 pre-existing failures (verified by stash-test on ErrorContext+ErrorToast: 16 fail without HRV-7 → not caused by tokens).
  - Strategy: `(c) [no-spec-impact]` — additive only.

### Tasks

- HRV-1 Typography audit — Yeseva One + JetBrains Mono availability
  - Status: `[x]` DONE · Files: `apps/web/index.html`, `apps/web/tailwind.config.js`, `apps/web/src/styles/global.css`, `docs/dev/design-system.md` · Test: N/A (audit report only)
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Investigation: grep cho `Yeseva` / `JetBrains` trong font load pipeline; check current font stack (Be Vietnam Pro? Cormorant Garamond đã load chưa từ HR sprint); xác định cần add deps Google Fonts hay không
  - Output: ghi vào audit report HRV-6 — status `[present|missing]` + remediation cost

- HRV-2 Token audit — vintage palette vs current shipped tokens
  - Status: `[x]` DONE · Files: `apps/web/tailwind.config.js`, `apps/web/src/styles/global.css` · Test: N/A
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Investigation: design tokens vintage = `--gold-bright #FFD56B` / `--ruby #C73E3E` / `--ruby-glow` / `--plum #8C5BB5` / `--emerald #4FA876` / chunky shadow `0 6px 0 0 <deep>`. Current shipped (HR-1) = `ivory` / `gold-deep` / `maroon` / `sage` / Cormorant Garamond. Map mỗi vintage token ↔ shipped (rename / new / overlap). Quyết keep-or-revert là **user decision sau audit**.
  - Output: bảng mapping vintage-token ↔ current-token + 3 options (keep-as-base / extend / revert)

- HRV-3 Modes audit — "Luyện tập / Chủ đề tuần / Mystery / Tốc độ" status
  - Status: `[x]` DONE · Files: `docs/spec/SPEC_USER_v3.1.md` §game modes, `apps/web/src/pages/`, BE Controller cho weekly/mystery/speed-round · Test: N/A
  - **Spec impact**: `[x]` None (audit) — Phase 2 sẽ quyết spec impact theo từng mode
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Investigation: grep route `/weekly-quiz` `/mystery-mode` `/speed-round` (file 2026-05-05 đã reference các route này); confirm với BE Controller; mode nào shipped (link to existing page) vs mode nào coming-soon (disabled card)
  - Output: bảng mode × {shipped, route, endpoint, gate (level/tier required)}

- HRV-4 Journey 66-book BE endpoint audit
  - Status: `[x]` DONE · Files: `apps/api/src/main/java/com/biblequiz/**/journey*`, `apps/api/src/main/java/com/biblequiz/**/book*` (Controller, Service, DTO) · Test: N/A
  - **Spec impact**: `[ ]` None hoặc `[ ]` SPEC_USER §Journey (xác định trong audit)
  - **Spec strategy**: `[ ]` (a)/(b)/(c) (quyết sau audit)
  - Investigation: grep `Journey` / `BookProgress` / `66 books` trong BE; endpoint trả book progress array? state mapping (current/locked/done)? FE đã có hook chưa? Nếu chưa có BE → ghi BL-N candidate cho Phase 2.
  - Output: endpoint contract (nếu có) hoặc BL-N entry candidate

- HRV-5 Current Home.tsx audit — data sources + reusable components
  - Status: `[x]` DONE · Files: `apps/web/src/pages/Home.tsx` (375 LOC), `apps/web/src/components/Home*.tsx`, `apps/web/src/components/Greeting*.tsx`, `apps/web/src/components/FeaturedDaily*.tsx` · Test: N/A
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Investigation: TanStack Query keys nào đang dùng (`/api/me`, `/tier-progress`, `/ranked-status`, `/daily-challenge`, etc.); list components reusable (HomeBanner, FeaturedDailyCard đã ship từ HR sprint — có dùng được không?); 375 LOC vượt 300 limit → cần split plan
  - Output: bảng query-key × hook × component + reuse-vs-rewrite recommendation

- HRV-6 Consolidated audit report + spec strategy recommendation cho Phase 2
  - Status: `[x]` DONE · Files: `apps/web/src/pages/__tests__/HOME_REDESIGN_VINTAGE_AUDIT.md` (NEW) · Test: N/A
  - **Spec impact**: `[ ]` None hoặc `[ ]` SPEC_USER §Home (xác định trong audit)
  - **Spec strategy**: `[ ]` (a)/(b)/(c) (quyết sau audit)
  - Investigation: tổng hợp HRV-1..HRV-5; recommend Phase 2 sub-task breakdown (mỗi task < 100 LOC, 1 commit/task); recommend keep-or-revert tokens HR-1; recommend i18n keys mới cần thêm; identify constraint conflicts đã chốt (C1 6-tier, C2 Đấu Hạng)
  - Output: 1 markdown report ≤ 200 lines + STOP gate chờ Bui duyệt trước Phase 2

### Constraint locks đã chốt (user decision 2026-05-14)

- **C1**: XP marks + rank chip dùng **VN 6-tier** (Tân Tín Hữu / Người Tìm Kiếm / Môn Đồ / Hiền Triết / Tiên Tri / Sứ Đồ). KHÔNG English tier names.
- **C2**: Ranked CTA dùng "**Đấu Hạng**" (title + button + label). KHÔNG "Xếp hạng" / "Đấu trường" / "Vào trận".
- **C4**: Verse cite "BTTHĐ 2011" — design đã match ✓.

### Rules

- Phase 1 = **read-only audit**, KHÔNG sửa code production.
- Phase 1 chỉ commit 1 file mới (`HOME_REDESIGN_VINTAGE_AUDIT.md`) + cập nhật task file này.
- **STOP gate** sau HRV-6 — chờ user duyệt audit report mới sang Phase 2.
- Branch: `feat/home-redesign-vintage`.
