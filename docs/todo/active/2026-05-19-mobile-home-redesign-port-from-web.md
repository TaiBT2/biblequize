# 2026-05-19 — Mobile HomeScreen redesign — port từ web Modern Spiritual

> **Source**: User feedback 2026-05-19 — screenshot mobile Home cũ không match web responsive mobile design. Trade-off của S0 strategy (UI 2 codebase) đã expected, giờ pay debt.
> **Scope**: Port 8 components từ web Home.tsx (~280 LOC refactor) sang mobile RN. Implement 2-state machine (daily completed yes/no). **Defer**: 3 modals (Comeback/DailyBonus/Tutorial), VerseFooter custom font (Cormorant Garamond complex RN font load), MotivationCard (onboarding-only), BibleJourneyCard inline (link tới existing JourneyMapScreen thay).

> **Recon (2026-05-19)**: web Home.tsx 375 LOC, 2 states based on `/api/daily-challenge` alreadyCompleted boolean. 7 API endpoints: /api/me, /api/me/tier-progress, /api/daily-challenge, /api/daily-challenge/result, /api/me/ranked-status, /api/me/daily-missions, /api/me/journey. State A: FeaturedDailyCard + RankedStandardCard. State B: DailyCompletedStrip + HeroRankedCard.

### Tasks

- **HOME-1 HomeBanner component**
  - New `apps/mobile/src/components/home/HomeBanner.tsx`
  - Avatar (gold border 64px) + greeting "Chào, {name}!" + tier name + progress bar
  - Stats row: 🔥 streak · ⚡ energy · 🏆 season points
  - Replace inline topBar + tierCard trong HomeScreen
  - Status: [ ] TODO
  - Files: `apps/mobile/src/components/home/HomeBanner.tsx` (new)
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **HOME-2 FeaturedDailyCard + DailyCompletedStrip**
  - New `FeaturedDailyCard.tsx` (State A): maroon+gold hero card với "THỬ THÁCH HÔM NAY" label + countdown timer + "Vào chơi ngay →" gold CTA
  - New `DailyCompletedStrip.tsx` (State B): sage pill với ✓ + "X/Y đúng" + countdown next daily + "Xem lại" button
  - Self-managed setInterval(1000) cho countdown (UTC midnight)
  - Status: [ ] TODO
  - Files: `apps/mobile/src/components/home/FeaturedDailyCard.tsx`, `DailyCompletedStrip.tsx` (new)
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **HOME-3 HeroRankedCard + RankedStandardCard**
  - New `HeroRankedCard.tsx` (State B): full gold gradient hero với "Đấu Hạng" title + energy bar + progress + dark CTA "Vào trận →"
  - New `RankedStandardCard.tsx` (State A): compact card với energy + ranked daily-cap (X/Y) + "Vào Đấu Hạng" CTA
  - Status: [ ] TODO
  - Files: `apps/mobile/src/components/home/{HeroRankedCard,RankedStandardCard}.tsx` (new)
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **HOME-4 CompactCard reusable + SectionHeader + mode grids**
  - New `CompactCard.tsx`: reusable game mode card với icon + title + subtitle + lock state (chip + dimmed) + matchmaking hint
  - New `SectionHeader.tsx`: gold accent bar + title + optional meta right
  - Wire 3 grids trong HomeScreen:
    - "Chế độ chơi chính" 2-col (Practice + Ranked card từ HOME-3)
    - "Chế độ đa dạng" 2-col mobile (Weekly/Mystery/Speed)
    - "Thi đấu cộng đồng" 2-col mobile (Groups/Multiplayer/Tournament tier-locked)
  - Status: [ ] TODO
  - Files: `apps/mobile/src/components/home/{CompactCard,SectionHeader}.tsx` (new)
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **HOME-5 DailyMissionsCard 3 rows**
  - New `DailyMissionsCard.tsx`: fetch `/api/me/daily-missions`, render 3 mission rows với progress circle (filled=completed) + description + inline progress bar (X/Y)
  - Status: [ ] TODO
  - Files: `apps/mobile/src/components/home/DailyMissionsCard.tsx` (new)
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **HOME-6 HomeScreen rewrite — state machine A/B + integrate all**
  - Rewrite `HomeScreen.tsx`: query /api/daily-challenge + /api/me/ranked-status + /api/me/tier-progress
  - State A render: HomeBanner → FeaturedDailyCard → DailyMissionsCard → Primary grid (Practice + RankedStandardCard) → Variety grid → Community grid
  - State B render: HomeBanner → DailyCompletedStrip → HeroRankedCard → DailyMissionsCard → Explore 2-col grid → Community grid
  - Drop old layout (top bar + tier card + 6-card grid + leaderboard preview) — leaderboard preview moved tới Leaderboard tab (already separate)
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/main/HomeScreen.tsx` (rewrite)
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **HOME-7 Regression + commit + close task**
  - mobile jest ≥ 33, mobile tsc clean
  - Manual QA reminder: cần test trên Expo Go device thật để verify State A/B switch
  - Update task file status DONE, archive khi user confirm
  - Status: [ ] TODO

### Common

- **Spec impact**: None. Mirror web Modern Spiritual design language (web spec is canonical, mobile catching up).
- **Spec strategy**: (c) `[no-spec-impact]`.
- **Sensitive files**: KHÔNG đụng. HomeScreen.tsx là một screen (không trong sensitive list mobile).
- **Out of scope**:
  - ComebackModal, DailyBonusModal, TutorialOverlay — modal flows, defer hoặc port riêng nếu cần
  - VerseFooter Cormorant Garamond — RN font async load complex, defer
  - MotivationCard onboarding gate — conditional cho new users, defer
  - BibleJourneyCard inline — link tới existing JourneyMapScreen thay vì re-render
  - Custom fonts (Be Vietnam Pro weights) — dùng system font weights hiện tại
  - Modern Spiritual atmosphere effects (noise SVG, gold radial gradient) — pure visual polish, defer S7 nếu cần

### Verification

- Sau HOME-7: mobile Home match web Modern Spiritual layout (State A/B switching, hero cards, mode grids responsive).
- Match BL-4 i18n ("Đấu Hạng" thay "Thi Đấu") qua titleKey pattern (HOME-1 commit trước).
- Master roadmap không update — đây là sprint patch ngoài S0-S7 sequence.
