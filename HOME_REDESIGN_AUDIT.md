# Home Redesign Audit — 2026-05-13

> **Source prompt**: [PROMPT_HOME_REDESIGN.md](../../../../../docs/designs/PROMPT_HOME_REDESIGN.md)
> **Mockup ground truth**: [home_modern.html](../../../../../docs/designs/home_modern.html) (1791 lines, untracked — sẽ commit cùng HR-AUDIT)
> **Test baseline** (apps/web): **1212 tests**
> **Branch**: `chore/code-quality-improvements`

---

## 1. Current Home.tsx Structure

File: [apps/web/src/pages/Home.tsx](../Home.tsx) (334 lines).

| Section | Lines | Component / Notes |
|---|---|---|
| Skeleton loader | 23-40 | inline `HomeSkeleton` (4-block grid) |
| Modals | 134-136 | ComebackModal, DailyBonusModal, TutorialOverlay |
| Banner / hero | 139 | `<GreetingCard />` — avatar + 3 stats + segmented tier bar |
| Daily Challenge hero | 141 | `<FeaturedDailyChallenge />` — 3-col grid (icon | info | CTA), red→orange theme, has internal completed state |
| Onboarding nudge | 143-146 | `<MotivationCard />` — conditional `shouldShowMotivation` (new user + no engagement) |
| Game modes | 148-157 | `<GameModeGrid />` — 3 sub-sections (Primary/Variety/Group), 7 mode cards total |
| Daily Missions | 159-164 | `<DailyMissionsCard />` — gated `!isNewUser` |
| Verse + Journey | 166-173 | 2-col grid: `<DailyVerseBanner />` + `<BibleJourneyCard />` |
| Tier perks teaser | 175-176 | `<TierPerksTeaser />` |
| Leaderboard + Activity | 178-256 | inline 2-col grid; gated `!isNewUser`; daily/weekly tabs + sticky my-rank row |

---

## 2. Data Fetching

Tất cả queries trong [Home.tsx:50-93](../Home.tsx#L50-L93):

| Query key | Endpoint | Cache | Notes |
|---|---|---|---|
| `['me']` | `GET /api/me` | 5min | user profile, `currentStreak`, `totalPoints` |
| `['daily-challenge', dcLang]` | `GET /api/daily-challenge?language=X` | 60s | **returns `alreadyCompleted: boolean`** ✅ |
| `['daily-missions']` | `GET /api/me/daily-missions` | 30s | `{ missions: [{ completed }] }` |
| `['me-tier-progress']` | `GET /api/me/tier-progress` | 60s | `totalPoints`, `starIndex`, etc. |
| `['home-leaderboard', lbPeriod]` | `GET /api/leaderboard/{daily\|weekly}?size=5` | 30s | array of `{ userId, name, points }` |
| `['home-my-rank', lbPeriod]` | `GET /api/leaderboard/{period}/my-rank` | 30s | `{ rank, points }` |

GreetingCard ([GreetingCard.tsx:37-53](../../components/GreetingCard.tsx#L37-L53)) thêm:
- `['tier-progress']` (different key — duplicate cache!)
- `['ranked-status']` → `GET /api/me/ranked-status` returns `{ energy, seasonPoints, currentBook }` ✅ — đây là source của **Năng lượng** + **Mùa này** stats

FeaturedDailyChallenge ([FeaturedDailyChallenge.tsx:82-99](../../components/FeaturedDailyChallenge.tsx#L82-L99)) thêm:
- `['daily-challenge', lang]` (cache shared với Home)
- `['daily-challenge-result']` → `GET /api/daily-challenge/result` — `correctCount`, `totalQuestions`, `xpEarned`
- `['season-active']` → `GET /api/seasons/active`

GameModeGrid thêm 4 hints queries (rooms count, weekly theme, my-group, upcoming tournaments).

---

## 3. Daily Completed Flag

✅ **EXISTS — ZERO backend changes**.

[Home.tsx:59-63](../Home.tsx#L59-L63) đã query `dcData.alreadyCompleted: boolean` từ `GET /api/daily-challenge?language=X`. [FeaturedDailyChallenge.tsx:155](../../components/FeaturedDailyChallenge.tsx#L155) đã consume `completed = data.alreadyCompleted`.

→ HR-7 chỉ cần dùng cùng query key `['daily-challenge', dcLang]` và lift `dailyDone` lên Home root.

---

## 4. Components Inventory

| Component | Action | Reason |
|---|---|---|
| `GreetingCard` | **MODIFY → split into HomeBanner** (HR-2) | Mockup banner = avatar + greet + name + tier-arrow-next + progress bar + 3 stats trong 1 row. Current GreetingCard có structure tương tự nhưng typography là Sans 700 (cần 800), không tabular-nums, no breathing-flame animation, dùng emoji icons (🔥⚡📊) thay vì line SVG. Replace component để clean break — KHÔNG modify in-place (GreetingCard giữ trong codebase phòng rollback). |
| `FeaturedDailyChallenge` | **REPLACE → FeaturedDailyCard** (HR-3) | Mockup direction khác hoàn toàn: 2-col (left content / right CTA stack), pulsing dot label, dots-as-question-count, maroon+gold radial bg, no completed state (completed state handled by new `DailyCompletedStrip`). |
| `MotivationCard` | **KEEP as-is** | Onboarding nudge, hiển thị chỉ cho new user totalPoints<1000 và zero engagement. Logic không đổi. Vị trí trong layout cần đặt lại theo state. |
| `GameModeGrid` | **SPLIT/REPLACE** (HR-5 + HR-7) | Hiện wrap 3 section nội bộ. Mockup yêu cầu state-aware: State A = 2-col (Practice + Ranked-standard) + 3-col Variety + 3-col Group; State B = 4-col flat "Khám phá thêm" + 3-col Group. Plan: HR-7 sẽ inline render từ Home.tsx, dùng existing `FeaturedCard`/`CompactCard` primitives, **tạo mới `RankedStandardCard`** (HR-5). KHÔNG modify GameModeGrid hiện tại — sẽ là dead code sau HR-7, nhưng giữ để rollback an toàn (cleanup task riêng sau approval). |
| `DailyMissionsCard` | **KEEP** | Component đã có, render đúng mockup `.missions` section pattern. |
| `DailyVerseBanner` | **REPLACE → VerseFooter** (HR-8) | Current = banner card với background tile. Mockup = footer drop-cap + ornament em-dash divider. Verse data hook `getDailyVerse()` reuse. |
| `BibleJourneyCard` | **KEEP** | Mockup `.journey` section structure match (title + books-row horizontal scroll). Có thể cần minor visual tune trong HR-7 nhưng KHÔNG rewrite. |
| `TierPerksTeaser` | **REMOVE from layout** | Mockup không có teaser này. Component vẫn còn trong codebase (có thể vẫn dùng ở Profile), chỉ là không render trên Home. |
| `ActivityFeed` | **REMOVE from layout** | Mockup không có activity feed trong main col. Empty-state pioneer card hiện tại không match direction "1 hero/state". Lùi xuống dùng ở chỗ khác hoặc xoá sau. |
| Leaderboard inline + `EmptyLeaderboardCTA` + `LeaderboardRow` | **REMOVE from layout** | Mockup không có inline leaderboard trên Home (sidebar có icon Xếp Hạng riêng). Toàn bộ block 178-256 sẽ bỏ khỏi Home; navigation qua `/leaderboard` route. |
| `ComebackModal`, `DailyBonusModal`, `TutorialOverlay` | **KEEP** | Overlay components, không chiếm space, giữ nguyên. |
| `SectionHeader` (NEW) | **CREATE** (HR-6) | Small caps + gold accent bar, dùng cho 3-4 sections. |
| `DailyCompletedStrip` (NEW) | **CREATE** (HR-6) | Sage tint pill, replaces FeaturedDailyChallenge completed state. |
| `HeroRankedCard` (NEW) | **CREATE** (HR-4) | Full gold gradient hero, only rendered trong State B. |
| `RankedStandardCard` (NEW) | **CREATE** (HR-5) | Gold-tinted standard mode card, only rendered trong State A. |
| `FeaturedDailyCard` (NEW) | **CREATE** (HR-3) | Maroon+gold daily hero, only rendered trong State A. |
| `VerseFooter` (NEW) | **CREATE** (HR-8) | Drop cap Cormorant Garamond italic. |
| `HomeBanner` (NEW) | **CREATE** (HR-2) | Sport-app typography banner. |

### ⚠️ Quyết định cần Bui confirm

1. **Leaderboard inline + ActivityFeed + TierPerksTeaser bị bỏ khỏi Home** — thay đổi behavior user-facing. Mockup chỉ có Banner + Daily + Missions + Modes + Journey + Verse. Nếu Bui muốn giữ Leaderboard inline thì cần extend mockup hoặc đặt nó sau Journey.
2. **GameModeGrid cleanup task** — sau HR-7, GameModeGrid + FeaturedCard/CompactCard/RankedFeaturedCard có còn cần không? Hay xoá luôn? Đề xuất: giữ FeaturedCard/CompactCard primitives (reuse trong HR-7), xoá GameModeGrid wrapper sau approval.
3. **GreetingCard cleanup** — sau HR-2 HomeBanner, GreetingCard không dùng nữa. Đề xuất xoá file cùng commit HR-2 hoặc task cleanup riêng sau Phase 3.

---

## 5. CSS Approach

- **Current**: Tailwind utility classes + một số inline `style={{ background: '...' }}` cho dynamic hex. global.css ([apps/web/src/styles/global.css](../../styles/global.css), 2925 lines) chứa keyframes + scrollbar overrides + `@tailwind` directives + LEGACY CSS variables (`--deep-space`, `--glass-surface`, ...).
- **Body declared 3 lần** ở global.css:48, :292, :304 — last one wins, dùng `var(--deep-space)`. HR-1 phải override toàn bộ body background với hardcoded gradients + hardcoded hex (per memory rule).
- **Mockup** dùng plain CSS hardcoded hex. Plan: convert sang Tailwind utility class + bonus hardcoded `style={{}}` cho gradients phức tạp (atmosphere). Mockup-specific class names (`.daily-featured`, `.hero-ranked`, ...) → thay bằng inline Tailwind hoặc CSS modules per component.
- **Tailwind config** ([tailwind.config.js](../../../tailwind.config.js)): đã có `secondary: '#e8a832'` (gold), `tertiary: '#e7c268'` (gold-light), font `sans: Be Vietnam Pro`. THIẾU: `ivory`, `gold-deep`, `gold-shadow`, `maroon`, `sage`, `serif: Cormorant Garamond`. HR-1 thêm vào.
- **Fonts** ([index.html:53-55](../../../../index.html#L53-L55)): Be Vietnam Pro weights 400-900 đã load ✅. Cormorant Garamond CHƯA load — HR-1 thêm `<link>` với chỉ italic weights `1,500;1,600;1,700` (Cormorant chỉ dùng cho verse text + drop cap, không cần upright).

---

## 6. Existing Test File

[apps/web/src/pages/__tests__/Home.test.tsx](Home.test.tsx) — **30 tests** (575 lines).

| describe | tests |
|---|---|
| Rendering | 3 (renders without crashing, skeleton during loading, max-w-7xl container) |
| Greeting & Tier | 7 (testids: home-greeting-meta, home-greeting-name, home-greeting-progress-fill, home-greeting-milestone-0, home-greeting-tier-label, home-greeting-max-tier) |
| GameModeGrid | 1 (renders mocked stub) |
| Leaderboard | 9 (Bảng Xếp Hạng, tabs, entries, current user row, sticky my-rank, empty CTA, period switch refetch, opacity fetching) |
| Activity Feed | 2 (Hoạt động title, empty-state pioneer) |
| Daily Verse | 3 (verse banner exists, position after game-modes before leaderboard, 2-col grid with journey) |
| Error handling | 2 |
| HR-6 state-aware | 9 (MotivationCard, hide Missions/Leaderboard for new user, boundary 999/1000, hide on engagement) |

**Impact HR-7**: Phải update **~12 tests** (Greeting section testids change, Leaderboard tests xoá khỏi Home tests vì component remove, Daily Verse position assertions update vì verse → footer, Activity Feed tests xoá).

**Impact HR-2 + HR-3 + HR-4 + HR-5 + HR-6 + HR-8**: Mỗi task thêm 4-6 tests cho component mới. Tổng new tests ≈ **30**.

Net change: 30 (existing) − 12 (deleted) + 5 (updated, count same) + 30 (new in component test files) ≈ **+18 tests** ⇒ baseline 1212 → ~1230.

---

## 7. Mockup vs Current Diff

| Element | Mockup | Current Home.tsx | Action |
|---|---|---|---|
| Banner avatar | 72px gold gradient + inset highlight, font 28px 800 | 52/72px gold gradient ổn, font 20/28 600/extrabold — gần đúng | HR-2 minor: pump weight 800, add inset highlight box-shadow |
| Banner greeting | `Chào buổi sáng` SANS uppercase tracked 0.18em GOLD | Đã sans uppercase tracked 0.8px BUT MUTED variant | HR-2: color = gold (`text-secondary`) thay vì on-surface-variant |
| Banner name | `TAI THANH` sans 800 30px tracked -0.025em ivory | Sans extrabold 20/22px (smaller) | HR-2: bump size 30px desktop, ivory color (`text-ivory` new) |
| Banner tier row | inline: Tân Tín Hữu → Người Tìm Kiếm + progress + 191/1,000 XP, gold + grey | flex column on mobile, row on desktop — gần đúng | HR-2: tabular-nums on XP num, color split (gold for value, ivory-dim for slash + "XP") |
| Banner progress bar | 5px height, gold gradient stops 50%, glow shadow, terminal dot | 8px height, similar gradient, no terminal dot | HR-2: height 5px, add `::after` terminal dot |
| Banner stats | 3 cells flex with divider, line SVG icons (flame/bolt/coin), tabular-nums 22px 800 | 3-col mobile / flex desktop, EMOJI icons (🔥⚡📊), 15/18 extrabold | HR-2: emoji → line SVG, weight 800 22px, tabular-nums, breathing-flame animation |
| Streak icon animation | `@keyframes breathe` 2.6s scale 1→1.12 + glow | None | HR-2: add `animate-breathe` (define keyframe in HR-1) |
| Daily Featured (state A) | NEW direction: maroon+gold radial bg, gold left border 3px, pulsing dot label, 5-dots count, countdown 20:35:43 right, "Vào chơi ngay" gold gradient CTA | Has FeaturedDailyChallenge with red→orange theme, 3-col icon\|info\|CTA, dots NOT present | HR-3: tạo `FeaturedDailyCard` mới, render replace |
| Daily Strip (state B) | NEW: sage tint pill `3/5 đúng — Giỏi lắm!` + sub + "Xem lại bài làm" btn | FeaturedDailyChallenge completed state full card (different shape) | HR-6: tạo `DailyCompletedStrip` |
| Hero Ranked (state B promoted) | NEW: full gold gradient card 34px sans 800 title, dark `#1a1208` CTA with gold text | Rendered as `RankedFeaturedCard` inside GameModeGrid (compact card) | HR-4: tạo `HeroRankedCard` |
| Ranked-standard (state A) | NEW: gold-tinted standard card, NOT full gradient | RankedFeaturedCard variant, no `ranked-standard` style | HR-5: tạo `RankedStandardCard` |
| Section header | `:before` 3px×14px gold gradient bar + sans 11px 700 ivory uppercase tracked 0.16em + optional meta right | Game mode section uses `text-[13px] font-medium` with icon emoji | HR-6: tạo `SectionHeader` |
| Daily Missions | Existing pattern match — gold medallion + bar + xp right | DailyMissionsCard exists | KEEP |
| Mode cards (variety/group) | mode-card glass + colored icon backgrounds | CompactCard reuse OK | HR-7: reuse, no rewrite |
| Journey 66 books | Title + meta `0 / 66 sách · Đang ở Sáng Thế Ký` + books-row horizontal scroll | BibleJourneyCard exists, similar pattern | KEEP, possibly minor tune in HR-7 |
| Verse | Footer drop cap Cormorant Garamond italic + em-dash cite + ornament SVG | DailyVerseBanner shows verse in a banner card | HR-8: tạo `VerseFooter` replace |
| Atmosphere (noise + radial gradient + vignette) | body background + ::before + ::after | None | HR-1 |

---

## 8. Backend Changes Required

✅ **NONE**. `alreadyCompleted` đã có trong `/api/daily-challenge` response.

`ranked-status` endpoint cũng đã trả `energy` + `seasonPoints` cần thiết cho banner stats (`/api/me/ranked-status` per GreetingCard).

---

## 9. Estimated Task Breakdown (already in `docs/todo/active/2026-05-13-home-redesign-modern-spiritual.md`)

| Code | Title | LOC est | Tests | Risk |
|---|---|---|---|---|
| HR-AUDIT | Audit (this report) | 0 | 0 | none |
| HR-1 | Atmosphere + tokens | ~70 (global.css + tailwind + index.html) | 0 (visual) | low |
| HR-2 | Banner sport-app typography | ~180 + 4 tests | 4 | medium (font size jump may affect mobile) |
| HR-3 | FeaturedDailyCard | ~180 + 5 tests | 5 | low (new component, isolated) |
| HR-4 | HeroRankedCard | ~150 + 5 tests | 5 | low |
| HR-5 | RankedStandardCard | ~100 + 4 tests | 4 | low |
| HR-6 | SectionHeader + DailyCompletedStrip | ~150 + 6 tests | 6 | low |
| HR-7 | Home.tsx refactor | ~200 (Home.tsx ~30% rewrite) + Home.test.tsx update + 5 new state tests | 5 (net) | **high** — touches `apps/web/src/pages/Home.tsx` (Tầng 3 sensitive); leaderboard/activity/tier-perks removal needs Bui confirm |
| HR-8 | VerseFooter | ~80 + 4 tests | 4 | low |
| HR-9 | Full regression | 0 | 0 | gate |

**Total estimate**: ~910 LOC code + ~33 new tests + Home.test update.

---

## 10. Constraints Re-confirm

- ✅ C1 Tier names religious (`tiers.ts` đã đúng) — banner sẽ dùng `t(tier.current.nameKey)`
- ✅ C2 "Luyện Tập" + "Đấu Hạng" — mockup dùng "Luyện tập" + "Thi đấu Ranked" (sans space). Verify với i18n keys `gameModes.practice` + `gameModes.ranked` (sẽ verify trong HR-7).
- ✅ Hardcode hex, NO CSS variables (memory rule)
- ✅ Cormorant Garamond CHỈ ở `.verse-text` + `::first-letter`
- ✅ Frontend-only, no BE changes
- ⚠️ Sidebar / AppLayout / Quiz / Ranked / Practice / Mobile — KHÔNG đụng

---

## 11. Bui decisions (2026-05-13)

1. ✅ **Xoá hết Leaderboard inline + ActivityFeed + TierPerksTeaser khỏi Home.** Pure next-best-action direction (Duolingo/Spotify pattern). Navigation Xếp Hạng qua sidebar route `/leaderboard`. ⇒ HR-7 sẽ xoá blocks 178-256 + imports liên quan.
2. ✅ **Xoá GreetingCard cùng commit HR-2.** File `apps/web/src/components/GreetingCard.tsx` + test file xoá theo. Rollback bằng `git revert HR-2` nếu cần.
3. ✅ **Giữ GameModeGrid dead code, cleanup task riêng sau Phase 3.** HR-7 inline render với primitives FeaturedCard/CompactCard/RankedFeaturedCard, GameModeGrid wrapper không import nữa nhưng GIỮ file.
4. **i18n key "gameModes.ranked"** mockup dùng "Thi đấu Ranked" — verify trong HR-7 trước khi render.

### Impact lên task list

- HR-7 LOC tăng ~50 (thêm imports cleanup, xoá inline blocks)
- HR-2 thêm ~20 LOC negative (xoá GreetingCard.tsx + GreetingCard.test.tsx)
- Test diff: ~12 tests xoá (Leaderboard 9 + ActivityFeed 2 + Daily Verse position 1) + ~5 tests update (Greeting → Banner testids). New net = baseline 1212 − 12 + 30 new ≈ **1230**.

---

*Audit by Claude · Bui review checkpoint trước HR-1.*
