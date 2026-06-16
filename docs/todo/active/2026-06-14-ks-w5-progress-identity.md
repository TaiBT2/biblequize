# 2026-06-14 — KS W5: Progress & Identity

> **Source**: [Khung Sáng master plan](2026-06-14-khung-sang-migration-plan.md) · **Scope**: bảng xếp hạng + hồ sơ + thành tựu + hành trình + cosmetic. Cần W0.
> **Prefix**: `KS-W5`.

### Tasks
- KS-W5-1 `/leaderboard` Leaderboard — Files: `pages/Leaderboard.tsx` · row "me" highlight amber, top 3 huy hiệu jewel
- KS-W5-2 `/profile` Profile — Files: `pages/Profile.tsx` + `components/profile/*` (nhiều sub-component)
- KS-W5-3 `/achievements` Achievements — Files: `pages/Achievements.tsx` (known issue: `useState<any>` → typed, fix-on-touch)
- KS-W5-4 `/journey` Journey — Files: `pages/Journey.tsx`, `components/BibleJourneyCard.tsx` · vòm/đèn cho cột mốc
- KS-W5-5 `/cosmetics` Cosmetics — Files: `pages/Cosmetics.tsx`
- KS-W5-6 Shared widgets — `TierProgressBar`, `TierUpModal`, `TierPerksTeaser`, `StreakWidget`, `WeekComboWidget`, `SeasonGoalWidget`, `LeaderboardRankWidget`, `LeaderboardSeasonWidget`, `WinRateWidget`, `WeaknessWidget`, `MilestoneBanner` · XP spectrum bar dùng lại
  - Status [ ] TODO · Test: vitest page tests · **Spec impact** [ ] None [ ] SPEC_USER §tier/leaderboard/journey/cosmetic · **Spec strategy** [ ] (c)
### Checklist: impl · Tầng 1+2+3 · C1 tier names religious · commit (EN)
