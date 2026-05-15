// CRR-1 — Mode metadata for the redesigned Create Room page.
// Mirrors the colour palette from docs/MULTIPLAYER/create_room_redesign.html
// (slightly lighter than the legacy CreateRoom palette so the preview badges
// + mode-card tints read clearly against the dark surface).

export type RoomModeId = 'SPEED_RACE' | 'BATTLE_ROYALE' | 'TEAM_VS_TEAM' | 'SUDDEN_DEATH'

export interface ModeMeta {
  id: RoomModeId
  /** Material Symbols icon name. */
  icon: string
  /** i18n key for the mode display label (e.g. "Đua tốc độ"). */
  labelKey: string
  /** i18n key for the per-mode description shown under the mode grid. */
  descKey: string
  /** Hex accent used for mode-card border + active glow + description left-bar. */
  color: string
  /** Preview-badge palette (matches `.badge-*` rules in the mockup). */
  badge: { bg: string; fg: string; border: string }
}

// Palette canonical per PROMPT_MULTIPLAYER_LOBBY_REDESIGN.md §0.1 — hardcoded
// hex values (NEVER CSS variables, mockup rendering bug). Sudden Death =
// amber #fbbf24, NOT streak orange #fb923c.
export const MODE_META: Record<RoomModeId, ModeMeta> = {
  SPEED_RACE: {
    id: 'SPEED_RACE',
    icon: 'bolt',
    labelKey: 'room.modes.speed_race',
    descKey: 'createRoom.modeDesc.speed_race',
    color: '#38bdf8',
    badge: { bg: 'rgba(56,189,248,0.15)',  fg: '#7dd3fc', border: 'rgba(56,189,248,0.35)' },
  },
  BATTLE_ROYALE: {
    id: 'BATTLE_ROYALE',
    icon: 'swords',
    labelKey: 'room.modes.battle_royale',
    descKey: 'createRoom.modeDesc.battle_royale',
    color: '#ef4444',
    badge: { bg: 'rgba(239,68,68,0.15)',   fg: '#fca5a5', border: 'rgba(239,68,68,0.35)' },
  },
  TEAM_VS_TEAM: {
    id: 'TEAM_VS_TEAM',
    icon: 'groups',
    labelKey: 'room.modes.team_vs_team',
    descKey: 'createRoom.modeDesc.team_vs_team',
    color: '#a855f7',
    badge: { bg: 'rgba(168,85,247,0.15)',  fg: '#d8b4fe', border: 'rgba(168,85,247,0.35)' },
  },
  SUDDEN_DEATH: {
    id: 'SUDDEN_DEATH',
    icon: 'target',
    labelKey: 'room.modes.sudden_death',
    descKey: 'createRoom.modeDesc.sudden_death',
    color: '#fbbf24',
    badge: { bg: 'rgba(251,191,36,0.15)',  fg: '#fcd34d', border: 'rgba(251,191,36,0.35)' },
  },
}

export const MODE_LIST: ModeMeta[] = [
  MODE_META.SPEED_RACE,
  MODE_META.BATTLE_ROYALE,
  MODE_META.TEAM_VS_TEAM,
  MODE_META.SUDDEN_DEATH,
]

/** Default per-mode cadence + cap (SPEC §5.4). Kept in-sync with the BE
 *  expectations — values match the old MODE_DEFAULTS in CreateRoom.tsx. */
export const MODE_DEFAULTS: Record<RoomModeId, { questionCount: number; timePerQuestion: number; maxPlayers: number }> = {
  SPEED_RACE:    { questionCount: 15, timePerQuestion: 30, maxPlayers: 4 },
  BATTLE_ROYALE: { questionCount: 20, timePerQuestion: 20, maxPlayers: 8 },
  TEAM_VS_TEAM:  { questionCount: 15, timePerQuestion: 30, maxPlayers: 8 },
  SUDDEN_DEATH:  { questionCount: 20, timePerQuestion: 15, maxPlayers: 8 },
}
