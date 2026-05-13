# 2026-04-19 — Game Mode Tier Layout + Stronger Highlight [DONE]

### Task H-1: 3-tier size hierarchy + distinct highlight
- Status: [x] DONE
- File(s): apps/web/src/components/GameModeGrid.tsx
- Changes:
  - Add `tier: 'primary' | 'secondary' | 'discovery'` vào CARDS config (type + 9 cards tag)
  - Split grid → 3 sections với testid `game-mode-tier-{tier}`:
    - Primary (Practice + Ranked): grid-cols-2, h-60, icon-4xl, title-xl, description line-clamp-3
    - Secondary (Daily/Groups/Rooms/Tournament): grid-cols-4 on lg, h-44
    - Discovery (Weekly/Mystery/Speed): grid-cols-3, h-40
  - Stronger highlight:
    - `bg-secondary/[0.04]` (light gold tint)
    - `border-secondary` (full gold, was /80)
    - `shadow-[0_0_32px_rgba(232,168,50,0.35)]` (stronger glow, was 24px/0.25)
    - `ring-2 ring-secondary/30` (was ring-1 /40)
    - Badge: `animate-pulse` + bigger padding + bigger text
  - Add `data-tier` attribute cho testing / future styling
- Commit: "style(web): tier-based game-mode grid + distinct recommendation highlight"
