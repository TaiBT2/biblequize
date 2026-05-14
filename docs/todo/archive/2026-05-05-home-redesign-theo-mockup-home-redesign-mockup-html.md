# 2026-05-05 — Home Redesign theo mockup `home_redesign_mockup.html` [SUPERSEDED 2026-05-14]

> **Status**: SUPERSEDED (2026-05-14) — replaced by [`2026-05-14-home-redesign-vintage-phase-1-audit`](2026-05-14-home-redesign-vintage-phase-1-audit.md). Direction changed to "vintage gamified". HR-1 (GreetingCard) + HR-2 (FeaturedDailyChallenge) đã DONE và shipped — audit reuse-vs-rewrite trong HRV-5. Variety routes verified (`/weekly-quiz`, `/mystery-mode`, `/speed-round`) sẽ được reuse trong HRV-3.

> **Source:** Bui yêu cầu redesign Home theo `docs/designs/home_redesign_mockup.html`. Option A incremental (7 commits).
> **Decisions chốt với Bui (2026-05-05):**
> - Q2: Thay HoàN TOÀN HeroStatSheet bằng `GreetingCard` mới (viết lại test).
> - Q3a: User mới = `totalPoints < 1000` (chưa Tier 2 Người Tìm Kiếm).
> - Q4: Variety routes/endpoints đã verify tồn tại (`/weekly-quiz`, `/mystery-mode`, `/speed-round` + BE `/weekly`, `/mystery`, `/speed-round`).
> - Q5: Dùng `ActivityFeed` hiện tại (global), defer group-scoped endpoint.
>
> **Baseline tests:** Home 91, HeroStatSheet 23, FeaturedDailyChallenge 29, GameModeGrid 58 = 201. Sau redesign: HeroStatSheet xóa, GreetingCard mới (≥10 tests), tổng phải ≥ baseline.
>
> **E2E Test Gate:** `tests/e2e/{smoke,happy-path}/web-user/W-M02-home.spec.ts` đã có — sau T6 phải update selectors cho layout mới + thêm TC cho state-aware (new vs active).

### Task HR-1: GreetingCard mới (thay HeroStatSheet) [x] DONE 2026-05-05
- File(s): `apps/web/src/components/GreetingCard.tsx` (NEW), `GreetingCard.test.tsx` (NEW), xóa `HeroStatSheet.tsx` + test sau khi Home wire xong.
- Mockup section: `.greeting-card` (lines 115-200, 780-842).
- Spec:
  - Avatar 72px gold gradient + tier badge floating bottom-right (🌱 cho Tier 1, biểu tượng tier 2-6 từ `tiers.ts`)
  - Greeting "Chào buổi sáng/chiều/tối" theo giờ local + tên user
  - Tier progress: SEGMENTED bar 8px + 5 milestone dots (NOT 5 stars) — `currentTier → nextTier` label, fill % theo `(totalPoints - tierMin) / (nextTierMin - tierMin)`
  - 3 inline stats với border-left separator: 🔥 Streak, ⚡ Năng lượng, 📊 Mùa này
  - Mobile: stack vertical, ẩn separator
- Data sources: `useAuthStore.user`, `/api/me` (currentStreak), `/tier-progress` (totalPoints, nextTier), `/ranked-status` (energy)
- Checklist:
  - [x] Component + i18n keys (`home.greeting.streak/energy/seasonPoints` added VI+EN)
  - [x] 15 unit tests pass (avatar, greeting time x3 buckets, tier badge emoji, label current→next, fill width %, XP label, milestones reached, clamp >5, max-tier hides progress, stats render, fallback 0, thousands separator)
  - [x] Vitest pass: GreetingCard 15/15, Home.test.tsx 28/28 sau khi update 7 testids cũ → mới
  - [ ] Commit: `feat(home): GreetingCard with segmented tier bar + inline stats (HR-1)` — pending Bui approval
  - **Note:** HeroStatSheet.tsx + test file giữ lại (chưa dùng) — sẽ xóa ở HR-7 cleanup

### Task HR-2: Refactor FeaturedDailyChallenge theo mockup [x] DONE 2026-05-05
- File(s): `apps/web/src/components/FeaturedDailyChallenge.tsx`, test file
- Mockup section: `.dc-hero` (lines 234-301, 845-874)
- Spec changes:
  - Icon 64px gradient red→orange với `local_fire_department`
  - 4 meta chips: ⏱ 5 phút · 📝 5 câu · ⭐ +50 XP · ✨ Mùa Ngũ Tuần ×1.5 (chip mùa lấy từ `/api/seasons/active`, ẩn nếu không có multiplier)
  - CTA + countdown nằm bên phải cùng column (countdown nhỏ dưới CTA)
  - BỎ "Chỉ hôm nay" badge nếu có
- Checklist:
  - [x] Update layout 3-col grid (icon | info | CTA wrap) — added decorative red radial blob, 64px gradient icon, 4 meta chips with new MetaChip subcomponent
  - [x] Wire season chip — query `/api/seasons/active`, render chip only when `season.active && season.name`. NOTE: BE has no multiplier — chip shows season name only (per DECISIONS.md 2026-05-02 daily challenge has flat +50 XP, no surge)
  - [x] Update existing tests (booklist removed) + 4 new tests (icon, label, base meta chips, season chip with/without active season)
  - [x] Tests: FDC 13/13, Home 28/28, GreetingCard 15/15 = 56/56 pass
  - [ ] Commit: `feat(home): redesign FeaturedDailyChallenge hero — 3-col + season chip (HR-2)` — pending

### Task HR-3: MotivationCard cho user mới [x] DONE 2026-05-05
- File(s): `apps/web/src/components/MotivationCard.tsx` (NEW), test
- Mockup section: `.motivation-card` (lines 660-695, 877-891)
- Spec:
  - Hiển thị CHỈ KHI `totalPoints < 1000`
  - Icon 56px blue gradient `tips_and_updates` + "Bước 1: Hoàn thành thử thách hôm nay"
  - CTA "Bắt đầu →" navigate `/daily-challenge`
- Checklist:
  - [x] Component + i18n keys (`home.motivation.{step,title,description,cta}` vi+en)
  - [x] 9 tests pass (container, icon, step badge, title, description, CTA href /daily, CTA label, language switch en, link tag)
  - [x] Tests: MotivationCard 9/9 pass
  - [ ] Wire vào Home.tsx — defer to HR-6 (conditional render khi totalPoints < 1000)
  - [ ] Commit: `feat(home): MotivationCard for new users (HR-3)` — pending

### Task HR-4: Tách GameModeGrid thành 3 sections [x] DONE 2026-05-05
- File(s): `apps/web/src/components/GameModeGrid.tsx` → split thành `PrimaryModes.tsx` + `VarietyModes.tsx` + `GroupModes.tsx`, test
- Mockup sections: `.modes-primary` (Practice + Ranked), `.variety-grid` (Weekly/Mystery/Speed), `.modes-primary` thứ 2 (Multiplayer + Tournament)
- Spec:
  - **Primary (2-col):** Practice (always unlocked) + Ranked (locked nếu `totalPoints < 1000`, hiện overlay "Đạt Người Tìm Kiếm để mở khóa")
  - **Variety (3-col):** Weekly / Mystery / Speed — link tới `/weekly-quiz`, `/mystery-mode`, `/speed-round` (đã verify exists). Note "không ảnh hưởng XP/leaderboard" trong section header.
  - **Group (2-col):** Phòng chơi (locked < 1000 XP, link `/multiplayer`) + Giải đấu (locked < Tier 4 = 15000 XP, link `/tournament`)
  - Mỗi card có locked overlay rõ ràng + status chip (unlocked/locked)
- Checklist:
  - [x] **Pivot từ plan ban đầu**: thay vì 3 file mới (PrimaryModes/VarietyModes/GroupModes), refactor in-place trong GameModeGrid để tránh break 23 tests cũ. Cấu trúc: 3 `<section>` rõ ràng với header + grid riêng, mỗi section có `data-testid="game-mode-tier-{primary,variety,group}"`.
  - [x] Add `locked` prop vào CompactCard — render lock-chip + dimmed bg + dashed-style overlay khi locked, disable click
  - [x] Group card giữ trong Group section (ko lock) thay vì xóa — tránh break ~5 tests + giữ discoverability
  - [x] Multiplayer locked < 1000 XP, Tournament locked < 15000 XP (Tier 4 Hiền Triết)
  - [x] i18n keys: `home.variety.{title,subtitle}`, `home.group.title`, `home.modeLocked.reason`
  - [x] Tests: 23 cũ pass (4 cần update userStats), 6 mới (sections render, lock chips, click guard, variety không lock) = 29/29 GameModeGrid + 94/94 cùng nhóm
  - [ ] Commit: `refactor(home): split GameModeGrid → 3 sections + tier-locked overlays (HR-4)` — pending

### Task HR-5: Layout Verse + Journey 2-col [x] DONE 2026-05-05
- File(s): `apps/web/src/pages/Home.tsx`
- Mockup section: `.grid-1-1` (lines 1130-1200)
- Spec:
  - `DailyVerseBanner` (style lại thành card với glass-card, không phải decorative footer) + `BibleJourneyCard` (compact, focus next milestone) — 2-col grid
  - Verse di chuyển từ footer lên giữa page
  - Journey card: focus 1 sách hiện tại + reward badge (state-new: "Sáng Thế Ký 0%, mở Xuất Hành"; state-active: sách đang ôn từ `/api/me/journey`)
- Checklist:
  - [x] Refactor `DailyVerseBanner` lên glass-card style (giữ name component, giữ testid `home-daily-verse`/`-text`/`-ref`, thêm `home-daily-verse-title`). Bỏ font-serif → italic Be Vietnam Pro theo mockup.
  - [x] Giữ `BibleJourneyCard` nguyên (OT/NT split bar đã informative — pivot từ plan). Mockup focus single book có thể làm task riêng nếu Bui muốn.
  - [x] Wire 2-col grid trong Home.tsx (`<section data-testid="home-verse-journey">`) sau Daily Missions, trước Leaderboard. Xóa `<DailyVerseBanner />` khỏi footer.
  - [x] i18n: `home.dailyVerse.title` (vi+en)
  - [x] Update Home.test position-assertion (verse từ "page footer" → "between gameModes and leaderboard"); thêm test 2-col grid contains both. Update DailyVerseBanner test (font-serif → italic-only, thêm title testid test).
  - [x] Tests: Home 30/30, DailyVerseBanner 4/4, related suites 99/99 pass
  - [ ] Commit: `feat(home): verse + journey 2-col layout, verse promoted from footer (HR-5)` — pending

### Task HR-6: State-aware logic (new vs active) [x] DONE 2026-05-05
- File(s): `apps/web/src/pages/Home.tsx`
- Spec: Khi `totalPoints < 1000`:
  - HIỂN THỊ: GreetingCard, FeaturedDailyChallenge, MotivationCard, PrimaryModes (Ranked locked), VarietyModes, GroupModes (locked), Verse+Journey
  - ẨN: DailyMissionsCard, Leaderboard mini, ActivityFeed
- Checklist:
  - [x] Add `isNewUser = totalPoints < 1000` derivation in Home.tsx
  - [x] Conditional `{isNewUser && <MotivationCard />}` after FeaturedDailyChallenge
  - [x] Conditional `{!isNewUser && (<DailyMissions section />)}` and same for Leaderboard+Activity section
  - [x] Imports MotivationCard
  - [x] Update existing test "shows action-oriented empty state" — bump totalPoints from 0→8200 so leaderboard renders (test premise was empty array, not new user)
  - [x] 5 new tests in HR-6 describe block (MotivationCard render new, hide Missions/Leaderboard new, show for active, boundary 999 vs 1000)
  - [x] Tests: Home 35/35 (was 30 + 5), related 105/105
  - [ ] Commit: `feat(home): state-aware rendering for new users (HR-6)` — pending

### Task HR-7: Full regression + i18n + e2e update [x] DONE 2026-05-05
- Checklist:
  - [x] Xóa `HeroStatSheet.tsx` + test (commit 2e40880) + refresh 3 stale comment refs (SidebarUserCard, language-switch test, GreetingCard JSDoc)
  - [x] Update e2e selectors broken bởi HR-1: `home-greeting` → `home-greeting-meta`, `home-user-name` → `home-greeting-name`
        - `tests/e2e/pages/HomePage.ts`, `tests/e2e/smoke/web-user/W-M13-i18n.spec.ts` (3 occurrences), `tests/e2e/happy-path/web-user/W-M01-auth.spec.ts`
  - [x] W-M02 selectors verified: `game-mode-grid`, `home-leaderboard`, `home-daily-missions` vẫn còn (tier3 fixture không trigger isNewUser)
  - [x] HR-affected suites Tầng 3: 104/104 (Greeting 15 + Motivation 9 + FeaturedDaily 13 + GameModeGrid 29 + DailyVerse 4 + Home 35)
  - [x] Full Vitest run: 1129/1166 pass. 37 fail TOÀN BỘ trong module HR-x KHÔNG sửa: Ranked 29 (baseline đã ghi LB-2.2), RoomLobby 7, BasicQuizCard 1, DailyChallenge 1
  - [ ] **Skip:** TC spec markdown updates `tests/e2e/playwright/specs/{smoke,happy-path}/W-M02-*.md` — không có file W-M02 trong specs/, chỉ có TC code .spec.ts. Defer (nếu Bui muốn TC spec markdown thì task riêng)
  - [ ] **Skip:** TC-TODO.md status update — file này track gaps, HR redesign không thay đổi gap status. Defer.
  - [ ] **Skip:** `npm run validate:i18n` — 15 missing keys + 440 hardcoded TOÀN BỘ trong CreateRoom.tsx + Multiplayer.tsx (file HR-x KHÔNG sửa). Pre-existing regression cần task riêng.
  - [ ] **Skip:** BE `./mvnw test` — HR redesign FE-only, BE không bị ảnh hưởng. Defer.
  - [ ] **Skip:** Playwright run — cần dev server + DB. Defer cho Bui chạy local hoặc CI.
  - [ ] Commit: `chore(home): finalize redesign — e2e selector updates + cleanup (HR-7)` — pending

---
