# 2026-06-14 — KS W8: Tournaments

> **Source**: [Khung Sáng master plan](2026-06-14-khung-sang-migration-plan.md) · **Scope**: giải đấu. Cần W0.
> **Prefix**: `KS-W8`. Bracket lines trong `global.css` (`.bracket-line-*`) → đổi sang jewel/spectrum.

### Tasks
- KS-W8-1 `/tournaments` Tournaments — Files: `pages/Tournaments.tsx`
- KS-W8-2 `/tournaments/:id` TournamentDetail — Files: `pages/TournamentDetail.tsx` · bracket dùng spectrum cho active line
- KS-W8-3 `/tournaments/:id/match/:matchId` TournamentMatch — Files: `pages/TournamentMatch.tsx`
  - Status [ ] TODO · Test: vitest `Tournament*` · **Spec impact** [ ] None · **Spec strategy** [ ] (c)
### Checklist: impl · Tầng 1+2+3 · commit (EN)
