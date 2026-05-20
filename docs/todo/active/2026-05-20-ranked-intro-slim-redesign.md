# 2026-05-20 — Ranked intro screen slim + redesign (RANK-INTRO-1..4)

> **Source**: User mockup 2026-05-20 — screenshot màn `/ranked` chỉ giữ lại: Header + TierProgress + Energy (full-width, single bar) + 3-stat row (Streak / Câu hôm nay / Điểm hôm nay compact) + Season (2 stat cells, no trend) + CTA "Vào trận đấu". User answers via clarifying questions: book pill bỏ luôn (chỉ CTA), RecentMatches remove khỏi page nhưng giữ component file, visual sát screenshot nhưng dùng design tokens hiện có.
> **Scope**: `apps/web/src/pages/Ranked.tsx` + 4 component files trong `apps/web/src/components/ranked/`.

## Sections matrix

| Section | Hiện tại | Sau redesign |
|---|---|---|
| RankedHeader | ✅ giữ | ✅ giữ (đã match) |
| TierProgressCard | ✅ giữ | ✅ giữ (đã match) |
| EnergyCard | 5-segment bar + explainer text + streak ghép cùng grid | Single full-width bar, inline "✓ Đủ chơi -20 câu" pill, bỏ explainer, full width |
| RankedStreakCard | Trong grid 1.5fr/1fr với Energy | Vào 3-stat row, compact icon+number+label |
| DailyStatsCards | 2-col (questions + points), có progress bar + sub-hint | Vào 3-stat row, compact icon+number+label, drop progress bar/sub-hint |
| SeasonCard | 3 cột (rank/points/trend) chia divider | 2 stat sub-cards (rank + points), bottom row: "còn N điểm đến mục tiêu" + "Bảng xếp hạng →" |
| CurrentBookCard | ✅ render | ❌ remove khỏi Ranked.tsx (giữ file) |
| RecentMatchesSection | ✅ render | ❌ remove khỏi Ranked.tsx (giữ file) |
| RankedActionFooter | ✅ giữ CTA + reset countdown | ✅ giữ (verify match) |

### Tasks

- RANK-INTRO-1 Slim Ranked.tsx structure
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Ranked.tsx`
  - Remove imports + JSX render của `CurrentBookCard` + `RecentMatchesSection`. Đổi layout: Energy full-width (không grid với Streak), Streak vào row 3 cột với DailyStats.
  - Test: Ranked.test.tsx — verify tests cho removed sections pre-existing failures (đã thấy 56 fail trong Tầng 3 earlier).
  - **Spec impact**: [x] None (UI declutter, không đổi mode rules)
  - **Spec strategy**: [x] (c) [no-spec-impact]

- RANK-INTRO-2 EnergyCard: single bar + inline status pill + bỏ explainer
  - Status: [x] DONE
  - Files: `apps/web/src/components/ranked/EnergyCard.tsx`
  - Đổi 5-segment thành single horizontal progress bar (giữ urgency color band). Move `questionsLeft` text thành green pill có ✓ icon, đặt cạnh "/{max}". Remove bottom `energyExplainer`.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

- RANK-INTRO-3 Compact 3-stat row (Streak / Questions / Points)
  - Status: [x] DONE
  - Files: `apps/web/src/components/ranked/RankedStreakCard.tsx` + `DailyStatsCards.tsx`
  - Đồng bộ visual: icon top-left, big number center, small uppercase label bottom. Drop progress bar / sub-hint trong DailyStatsCards. Grid 3-col mobile + desktop.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

- RANK-INTRO-4 SeasonCard: 2 stat cells + drop trend column
  - Status: [x] DONE

### Verification

- `tsc --noEmit` không có error mới ở Ranked.tsx / 4 components đã sửa.
- Quiz.test.tsx 18/18 pass.
- Full web vitest: 1250 pass / 60 fail. Baseline 1212 → +38 (passing). Pre-redesign branch state đã có 56 fail trong Ranked.test.tsx (R2/R3/R4/R5/A4 series outdated tests cho design cũ). Delta thực sau redesign: +4 fail (`displays current book Ma-thi-ơ` do CurrentBookCard removed intentional; energy-bar selector dùng `.gold-gradient` class cũ; …). Ranked.test.tsx cần catch-up rewrite cho design mới — defer.

### Out of scope (defer)

- Ranked.test.tsx catch-up — re-write test cases cho new design (single energy bar, compact 3-stat row, 2-cell SeasonCard, removed CurrentBookCard). Tách task riêng vì ~33 tests cần update. Tracking: BL nếu cần spec, hoặc task file mới sau khi UX redesign settle.
  - Files: `apps/web/src/components/ranked/SeasonCard.tsx`
  - Remove trend column (R10 placeholder). Restyle rank + points thành 2 sub-cards (rounded box, separate background) thay vì divider columns. Bottom row: keep `pointsToChamp` text left + `seasonViewLeaderboard` link right.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
