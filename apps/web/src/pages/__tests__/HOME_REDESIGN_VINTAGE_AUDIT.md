# Home Redesign (Vintage Gamified) — Phase 1 Audit Report

> **Date**: 2026-05-14 · **Branch**: `feat/home-redesign-vintage` · **Task**: [`docs/todo/active/2026-05-14-home-redesign-vintage-phase-1-audit.md`](../../../../docs/todo/active/2026-05-14-home-redesign-vintage-phase-1-audit.md)
> **Source design**: [`docs/designs/biblequiz/`](../../../../docs/designs/biblequiz/) (Home.html + styles.css + 2 screenshots)
> **Direction**: "Illuminated manuscript meets mobile-game chunkiness" — supersedes 2026-05-13 Modern Spiritual + 2026-05-05 home_redesign_mockup.
> **TL;DR**: Vintage redesign = **pure restyling exercise**. Zero backend changes. All infrastructure (data hooks, components, BE endpoints, Journey 66-book, mode pages) đã shipped. Phase 2 sẽ là sequence ~7–9 commit `style:` / `feat:` mỗi commit < 100 LOC restyle 1 component theo vintage palette + chunky button + Yeseva One.

---

## HRV-1 Typography audit

| Font | Current state (main) | Vintage design wants | Action |
|---|---|---|---|
| Be Vietnam Pro 400–900 | ✅ loaded ([apps/web/index.html:53-55](../../index.html#L53-L55)) — `font-sans` default | ✅ same — UI body font | Keep |
| Material Symbols Outlined | ✅ loaded ([apps/web/index.html:57-59](../../index.html#L57-L59)) | N/A — vintage dùng inline SVG | Keep (other features) |
| Cormorant Garamond italic | ✅ loaded ([apps/web/index.html:62-64](../../index.html#L62-L64)) — `font-verse` cho verse + drop cap | ❌ vintage muốn **Yeseva One** cho display + serif | **Decision needed**: swap sang Yeseva One, hoặc keep Cormorant + thêm Yeseva One. Đề xuất: **swap** — Yeseva One match aesthetic "illuminated manuscript" hơn (chunky display serif vs italic body serif). |
| **Yeseva One** (display serif) | ❌ NOT loaded | ✅ headings, big numbers, h1 "cuộc hành trình" | **ADD** — Google Fonts free, 1 weight (400). Estimate: +1 KB CSS, 1 woff2 (~14 KB). |
| **JetBrains Mono** (numeric) | ❌ NOT loaded — current `mono` = Orbitron | ✅ XP/timer/HUD numeric pills | **ADD** — Google Fonts free, weight 500. Estimate: +1 KB CSS, 1 woff2 (~30 KB). **⚠ REGRESSION RISK**: grep `font-mono` Tailwind utility class shows ~15+ usages in admin dashboard (`KpiCards`, `SessionsChart`, `UserRegChart`, `CoverageChart`, `ActivityLog`, `Users`, `EarlyUnlockMetrics`, `TestPanel`) + `GroupCodeModal` + `InviteShareModal` + `AIQuestionGenerator`. **DO NOT swap `mono: Orbitron` directly**. Plan: add new key `fontFamily.numeric: JetBrains Mono` (Tailwind `font-numeric` utility). Keep `mono: Orbitron` untouched. |

**Remediation cost (HRV-1)**: 1 commit thêm 2 font links vào `index.html` + update `tailwind.config.js`: ADD new key `fontFamily.display: ['"Yeseva One"', 'Playfair Display', 'serif']` + ADD new key `fontFamily.numeric: ['"JetBrains Mono"', 'ui-monospace', 'monospace']`. **KHÔNG touch `fontFamily.mono` / `fontFamily.serif` / `fontFamily.verse`** để tránh regression admin dashboard + verse footer. ~20 LOC. Per CLAUDE.md `docs/dev/dependencies.md`: Google Fonts không phải npm dep nên không cần hỏi — chỉ là `<link>` tag.

---

## HRV-2 Token audit

### Current tokens shipped (main, [tailwind.config.js:10-94](../../tailwind.config.js#L10-L94))

```
Atmosphere (HR-1):  ivory #f5f0e6 / ivory-dim / ivory-faint / gold-deep #c98a1c / gold-shadow #7a5818
Hero Đấu Hạng V2:   gold-bright #f4d178 / gold-cream #fff5dc / maroon #7c2d3a / sage #4a6b52
Sacred Modernist:   background #11131e / surface.container family / primary #c0c4e8 / secondary #e8a832 / tertiary #e7c268
Answer (C5 lock):   a #E8826A coral / b #6AB8E8 sky / c #E8C76A gold / d #7AB87A sage
Legacy:             neon.green/pink/orange/blue
```

### Vintage design tokens ([docs/designs/biblequiz/styles.css:6-45](../../../../docs/designs/biblequiz/styles.css#L6-L45))

```
Background:  bg-deep #0E0A12 / bg-wash #15101B / bg-card #1B1424 / bg-elev #241A2E / bg-inset #110C18
Line:        line #2E2238 / line-soft #221A2C
Gold:        gold-bright #FFD56B / gold #E8B547 / gold-deep #A87A1F / gold-glow rgba
Ruby:        ruby #C73E3E / ruby-deep #8E2727 / ruby-glow rgba
Emerald:     emerald #4FA876 / emerald-deep #2F6E4D
Plum:        plum #8C5BB5 / plum-deep #5B3681
Ink:         ink #EDE4D3 / ink-soft #C8BDA9 / ink-muted #897C6A / ink-faint #4F4658
Shadows:     chunky 6px-0-0 deep + 16px glow / chunky-red / chunky-soft
```

### Mapping (vintage → current)

| Vintage token | Hex | Current closest | Verdict |
|---|---|---|---|
| `bg-deep` | `#0E0A12` | `background #11131e` | **Different hue** — current = dark navy, vintage = deep purple-black. **Replace** background hex. |
| `bg-card` | `#1B1424` | `surface.container.low #191b26` | Close but different hue (purple vs navy). **Replace**. |
| `gold-bright` | `#FFD56B` | `gold-bright #f4d178` | Very close. **Keep current**, tweak +6 lightness if needed. |
| `gold` | `#E8B547` | `tertiary #e7c268` (warm) or `secondary #e8a832` | `secondary #e8a832` rất gần. **Reuse `secondary`**. |
| `gold-deep` | `#A87A1F` | `gold-deep #c98a1c` | Vintage darker. **Tweak current `gold-deep` → `#A87A1F`** hoặc add new token `gold-deeper`. |
| `ruby` | `#C73E3E` | `maroon #7c2d3a` (darker) / `answer.a #E8826A` (coral) | **NEW token needed** — `ruby` is brighter than maroon. Add `ruby #C73E3E` + `ruby-deep #8E2727`. |
| `emerald` | `#4FA876` | `sage #4a6b52` (darker, less saturated) / `answer.d #7AB87A` (closest) | `answer.d #7AB87A` gần — nhưng C5 lock answer-colors cho quiz screen, không nên dùng làm UI accent. **Add new** `emerald #4FA876` + `emerald-deep`. |
| `plum` | `#8C5BB5` | none | **ADD NEW** — `plum #8C5BB5` + `plum-deep #5B3681`. |
| `ink` | `#EDE4D3` | `ivory #f5f0e6` | Close (cream vs warm-ivory). **Reuse `ivory`**. |
| `ink-soft` | `#C8BDA9` | `ivory-dim #b8b1a3` | Close. **Reuse `ivory-dim`**. |
| `ink-muted` | `#897C6A` | none | **Add new** hoặc tweak `ivory-faint #6e6a60` → `#897C6A`. |
| `line` | `#2E2238` | `outline.variant #46464d` | Different hue. **Add new `line`** or extend `surface.container.highest`. |
| Chunky shadow | `0 6px 0 0` | none | **NEW pattern** — needs Tailwind plugin or arbitrary value `shadow-[0_6px_0_0_var(--ruby-deep)]`. |

**Verdict (HRV-2)**: Vintage palette is **deeper purple + brighter accent + adds plum/emerald** vs current navy + Sacred Modernist. ~6 token additions cần thiết (ruby, ruby-deep, emerald, emerald-deep, plum, plum-deep, line), 2 token replacements (`background`, `bg-card` equivalent), 4 token reuses (ivory family, gold-bright, secondary as gold). Chunky shadow = Tailwind arbitrary class pattern.

**3 options (user decision Phase 2)**:
- **(A) Keep-as-base**: Giữ tokens HR-1 + Hero Đấu Hạng V2 (đã shipped 2 sprint), only ADD vintage-specific tokens (ruby/emerald/plum/line). Risk: 2 palette coexist, design system bloat.
- **(B) Replace**: Remove HR-1 atmosphere tokens (ivory family, maroon, sage HR-1 versions, Cormorant Garamond) + introduce vintage palette fresh. Risk: Banner/DailyCard/HeroRanked đã shipped 2 sprint phải restyle lại — ~6 component restyle.
- **(C) Hybrid**: Reuse `ivory` (→ vintage `ink`), `gold-bright`/`gold-deep` (→ vintage gold family), ADD `ruby`/`emerald`/`plum`/`line` + replace `background #11131e → #0E0A12`. Bỏ Cormorant Garamond nếu Yeseva One thay thế hoàn toàn. **Recommended** — minimum churn, vintage character preserved.

---

## HRV-3 Modes audit

Tất cả 4 mode trong vintage "Khám phá thêm" + 3 mode trong "Cộng đồng" **đã shipped**:

| Vintage card | Current route | Page file | themeHex | Status |
|---|---|---|---|---|
| Luyện tập | `/practice` | [Practice.tsx](../Practice.tsx) | `#6AB8E8` | ✅ Shipped |
| Chủ đề tuần | `/weekly-quiz` | [WeeklyQuiz.tsx](../WeeklyQuiz.tsx) | `#a855f7` | ✅ Shipped |
| Mystery | `/mystery-mode` | [MysteryMode.tsx](../MysteryMode.tsx) | `#d4537e` | ✅ Shipped |
| Tốc độ | `/speed-round` | [SpeedRound.tsx](../SpeedRound.tsx) | `#ff8c42` | ✅ Shipped |
| Nhóm Hội Thánh | `/groups` | (Groups page) | `#4a9eff` | ✅ Shipped |
| Phòng chơi | `/multiplayer` | (Multiplayer) | `#9b59b6` | ✅ Shipped |
| Giải đấu (Sage gate) | `/tournaments` | (Tournament) | `#ff6b6b` | ✅ Shipped — locked < 15K pts ([Home.tsx:132-133](../Home.tsx#L132-L133)) |

**Existing config in [Home.tsx:68-135](../Home.tsx#L68-L135)** đã định nghĩa `PRACTICE_CARD`, `VARIETY_CARDS[]`, `GROUP_CARDS[]` với `ModeConfig` interface (id, icon, themeHex, titleKey, subtitleKey, route, lockedUntilPoints, lockedUnlockTierKey). i18n keys đã tồn tại trong `home.compactSubtitles.*` + `gameModes.*`.

**Vintage tournament gate**: design viết "đạt **Sage** để mở khóa". Current code: `lockedUnlockTierKey: 'tiers.sage'` + `lockedUntilPoints: 15_000`. Per C1 lock 6-tier VN — `tiers.sage` map sang **Hiền Triết** (`apps/web/src/utils/tierAvatar.ts` cần verify mapping). Cần audit `i18n/vi.json tiers.sage` để confirm hiển thị "Hiền Triết" (không phải "Sage").

**Verdict (HRV-3)**: Zero backend / route changes. Phase 2 chỉ restyle `CompactCard` + thêm vintage variants (chunky shadow, gold/ruby/emerald/plum `ico-box` color). themeHex array đã có — vintage có thể map themeHex → vintage palette.

---

## HRV-4 Journey 66-book audit

### BE infrastructure (✅ shipped)

| File | Purpose |
|---|---|
| [UserBookProgress.java](../../../../apps/api/src/main/java/com/biblequiz/modules/quiz/entity/UserBookProgress.java) | Entity tracking per-user per-book progress |
| [UserBookProgressRepository.java](../../../../apps/api/src/main/java/com/biblequiz/modules/quiz/repository/UserBookProgressRepository.java) | JPA repo |
| [BookProgressionService.java](../../../../apps/api/src/main/java/com/biblequiz/modules/quiz/service/BookProgressionService.java) | Book unlock / progression logic |
| [BookMasteryService.java](../../../../apps/api/src/main/java/com/biblequiz/modules/quiz/service/BookMasteryService.java) | Mastery scoring (80% threshold mở khóa book kế) |

### FE infrastructure (✅ shipped)

| File | Purpose |
|---|---|
| [Journey.tsx](../Journey.tsx) | Dedicated journey page |
| [BibleJourneyCard.tsx](../../components/BibleJourneyCard.tsx) | Card used inside [Home.tsx:368](../Home.tsx#L368) |
| [BookCompletionModal.tsx](../../components/BookCompletionModal.tsx) | 80% completion celebration |

**Vintage design wants**: Horizontal-scroll path SVG với stations (current/locked/done). Current `BibleJourneyCard` shape **chưa audit chi tiết** — Phase 2 HRV-7 sẽ deep-dive: card có expose props cho variant horizontal-scroll không? Hay phải fork thành `BibleJourneyVintagePath`?

**Verdict (HRV-4)**: BE + data hooks 100% reuse. Component shape audit **deferred to Phase 2 first commit** — không block Phase 1 sign-off.

---

## HRV-5 Current Home.tsx audit

### Data hooks (TanStack Query keys — [Home.tsx:153-201](../Home.tsx#L153-L201))

| Query key | Endpoint | Returns | Reuse? |
|---|---|---|---|
| `['me']` | `/api/me` | totalPoints, currentStreak | ✅ feed Banner |
| `['me-tier-progress']` | `/api/me/tier-progress` | totalPoints (canonical) | ✅ feed XP bar 6-tier |
| `['daily-challenge', lang]` | `/api/daily-challenge?language=` | alreadyCompleted, totalQuestions | ✅ feed Daily CTA |
| `['daily-challenge-result']` | `/api/daily-challenge/result` | correctCount, totalQuestions | ✅ feed completed strip |
| `['ranked-status']` | `/api/me/ranked-status` | livesRemaining, dailyLives, questionsCounted, cap | ✅ feed Đấu Hạng CTA |
| `['daily-missions']` | `/api/me/daily-missions` | missions[] | ✅ feed mission scroll |

**Zero new endpoints needed cho vintage redesign.** Tất cả data đã exposed.

### Components đã shipped (15 imports trong [Home.tsx:6-19](../Home.tsx#L6-L19))

| Component | Vintage section | Restyle scope |
|---|---|---|
| `HomeBanner` (HR-2) | Sidebar foot + HUD pills + Hero greeting + XP track | **Heavy restyle** — split logical: sidebar moves out, HUD stat-pills + hero stay. Banner đang là 1 component — cần audit có thể tách hay không. |
| `FeaturedDailyCard` (HR-3) | Daily CTA (gold chunky) | **Medium restyle** — progress arc 0/5 + chunky-btn gold |
| `DailyCompletedStrip` | State B fallback | **Light restyle** — keep existing pattern |
| `HeroRankedCard` (V2 radial glow) | Ranked CTA (ruby chunky + swords) | **Medium restyle** — palette swap navy/maroon → ruby + chunky shadow + swords SVG + "Đấu Hạng" label C2 |
| `RankedStandardCard` | State A 2-col ranked | **Light restyle** |
| `DailyMissionsCard` | Mission scroll (vintage paper) | **Heavy restyle** — `repeating-linear-gradient` scroll lines pattern |
| `BibleJourneyCard` | Hành trình 66 horizontal path | **Heavy restyle** (or new variant) — pulse-glow current station, locked seal, SVG path |
| `CompactCard` | Mode/Group cards 4-col | **Medium restyle** — vintage palette + chunky-soft shadow + `ico-box` gradient |
| `SectionHeader` | Section labels "Khám phá thêm" | **Light restyle** — Yeseva One label + uppercase tag |
| `VerseFooter` (HR-8) | Verse footer | **Light restyle** — swap Cormorant → Yeseva One italic + drop cap |
| `MotivationCard` | New user nudge | **Light restyle** |
| `ComebackModal`, `DailyBonusModal`, `TutorialOverlay` | Modals (not visible) | **Defer** — modal restyling Phase 3 nếu cần |

### Sidebar (CURRENTLY MISSING from Home.tsx — sidebar lives in `AppLayout.tsx`)

Vintage design có dedicated sidebar 260px sticky với brand + 4 nav + user pill. Current app dùng `AppLayout.tsx` để wrap (sensitive file — Tầng 3 mandatory). **Vintage sidebar = AppLayout responsibility, KHÔNG phải Home.tsx**. Phase 2 cần task riêng cho `AppLayout` sidebar restyle (or out-of-scope).

### LOC concern

`Home.tsx` đang 375 LOC, vượt 300 limit của CLAUDE.md. Phase 2 nên opportunistically extract `PRACTICE_CARD`/`VARIETY_CARDS`/`GROUP_CARDS` configs ra file riêng (`src/config/homeModeCards.ts`) — giảm Home.tsx về ~280 LOC. **Optional, recommend nhưng không block Phase 2.**

---

## HRV-6 Spec strategy + Phase 2 recommendation

### Spec impact assessment

| Constraint / Spec | Status |
|---|---|
| **C1** (6-tier VN) | Vintage design có 5 markers EN — user đã chốt swap sang 6-tier VN ([task line 50](../../../../docs/todo/active/2026-05-14-home-redesign-vintage-phase-1-audit.md#L50)). Phase 2 sẽ enforce. Strategy: **(c) [no-spec-impact]** vì spec đã canonical, code catch up. |
| **C2** (Đấu Hạng lock) | Vintage design có "Xếp hạng / Đấu trường / Vào trận" — user chốt swap sang "Đấu Hạng". Strategy: **(c) [no-spec-impact]** — code catch up. |
| **C4** (BTTHĐ 2011) | Vintage verse cite đã match. No-op. |
| **C5** (Answer colors) | Out-of-scope (Home không có quiz answer UI). |
| SPEC_USER §Home | Layout đổi đáng kể (HUD pills + 66-book horizontal path + chunky button). **Worth a BL-N entry** để track ra mắt vintage direction + Stitch reference design. Strategy: **(b) BL-N** mới — `BL-N: Home page vintage gamified redesign — docs/designs/biblequiz/ as source of truth`. |

### Phase 2 task breakdown recommendation

Sequence ~9 sub-task, mỗi commit < 100 LOC, theo dependency order:

1. **HRV-7** Font + token foundation (Option C hybrid): add Yeseva One + JetBrains Mono links to `index.html`, add ruby/emerald/plum/line tokens + chunky shadow utilities to `tailwind.config.js`, update `fontFamily.serif` (new: Yeseva One), replace `mono: Orbitron → JetBrains Mono` if Orbitron usage zero (grep first). ~40 LOC. **Sensitive file gate**: `index.html` borderline — Tầng 3 mandatory anyway because tokens drive ~6 components. Strategy: **(c) [no-spec-impact]**.

2. **HRV-8** `SectionHeader` + `VerseFooter` restyle (đơn giản, ít LOC): Yeseva One labels + drop cap swap. ~50 LOC + tests. Strategy: **(c)**.

3. **HRV-9** `CompactCard` vintage variant: chunky-soft shadow + ico-box gradient + corner badge. ~80 LOC. **Visual regression test** với snapshot. Strategy: **(c)**.

4. **HRV-10** `HomeBanner` restyle (HUD pills extract + hero greeting + XP track 6-tier VN): heaviest task. ~100 LOC — có thể split thêm nếu vượt. Strategy: **(c)** + enforce C1.

5. **HRV-11** `FeaturedDailyCard` + `DailyCompletedStrip` chunky gold restyle. ~70 LOC. Strategy: **(c)**.

6. **HRV-12** `HeroRankedCard` + `RankedStandardCard` ruby chunky + "Đấu Hạng" label + swords SVG. ~80 LOC. Strategy: **(c)** + enforce C2.

7. **HRV-13** `DailyMissionsCard` scroll-paper restyle (repeating-linear-gradient lines + checkbox box vintage). ~60 LOC. Strategy: **(c)**.

8. **HRV-14** `BibleJourneyCard` horizontal scroll path (decision: restyle existing OR fork new variant `BibleJourneyVintagePath`). ~80-100 LOC. Strategy: **(c)** if visual-only, **(a)** if UX flow change.

9. **HRV-15** Final integration + i18n sweep + visual regression: tests update, i18n key add (e.g. `home.vintage.hud.streak`), Tầng 3 full. Add BL-N entry to BACKLOG. Strategy: **(b)** BL-N created here.

**Total estimate**: ~600–700 LOC across 9 commits + ~30 new tests.

### Sensitive-file gates

Phase 2 sẽ touch:
- `apps/web/index.html` (HRV-7) — borderline sensitive (font loading). Tầng 3 mandatory.
- `apps/web/tailwind.config.js` (HRV-7) — config, không sensitive nhưng affect all pages → Tầng 3 mandatory.
- `apps/web/src/styles/global.css` (HRV-7 nếu cần) — **sensitive** ([CLAUDE.md sensitive-files](../../../../CLAUDE.md)). Tầng 3 mandatory.

### Outstanding decisions (user → STOP gate)

Trước khi Phase 2 bắt đầu, user cần quyết:

1. **Token strategy (HRV-2 Option A/B/C)** — đề xuất **(C) Hybrid**.
2. **Cormorant Garamond fate** — keep cho verse, hay replace bằng Yeseva One italic? Đề xuất **replace** (Yeseva One có italic variant, giảm 1 font load).
3. ~~`mono: Orbitron` swap~~ — **RESOLVED in audit**: KHÔNG swap. Add separate `fontFamily.numeric: JetBrains Mono` key cho vintage Home, keep `mono: Orbitron` untouched (admin dashboard + modals dùng heavily).
4. **`BibleJourneyCard` strategy (HRV-14)** — restyle existing vs fork new variant. Cần audit card props trước, defer quyết.
5. **Sidebar restyle scope** — `AppLayout.tsx` (sensitive) có nằm trong Home redesign hay tách task riêng?

### Phase 1 STOP gate

Phase 1 audit complete. **Không code thêm gì** cho tới khi user duyệt audit này. Branch `feat/home-redesign-vintage` sẽ chỉ chứa:
- This audit report (NEW file)
- Task tracker file (NEW: `docs/todo/active/2026-05-14-home-redesign-vintage-phase-1-audit.md`)
- TODO.md index update
- 2 superseded task files moved to `docs/todo/archive/`

Sẵn sàng commit khi user duyệt.
