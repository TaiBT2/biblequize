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

export const MODE_META: Record<RoomModeId, ModeMeta> = {
  SPEED_RACE: {
    id: 'SPEED_RACE',
    icon: 'bolt',
    labelKey: 'room.modes.speed_race',
    descKey: 'createRoom.modeDesc.speed_race',
    color: '#60a5fa',
    badge: { bg: 'rgba(96,165,250,0.15)',  fg: '#93c5fd', border: 'rgba(96,165,250,0.35)' },
  },
  BATTLE_ROYALE: {
    id: 'BATTLE_ROYALE',
    icon: 'favorite',
    labelKey: 'room.modes.battle_royale',
    descKey: 'createRoom.modeDesc.battle_royale',
    color: '#f87171',
    badge: { bg: 'rgba(248,113,113,0.15)', fg: '#fca5a5', border: 'rgba(248,113,113,0.35)' },
  },
  TEAM_VS_TEAM: {
    id: 'TEAM_VS_TEAM',
    icon: 'groups',
    labelKey: 'room.modes.team_vs_team',
    descKey: 'createRoom.modeDesc.team_vs_team',
    color: '#4ade80',
    badge: { bg: 'rgba(74,222,128,0.15)',  fg: '#86efac', border: 'rgba(74,222,128,0.35)' },
  },
  SUDDEN_DEATH: {
    id: 'SUDDEN_DEATH',
    icon: 'workspace_premium',
    labelKey: 'room.modes.sudden_death',
    descKey: 'createRoom.modeDesc.sudden_death',
    color: '#c084fc',
    badge: { bg: 'rgba(192,132,252,0.15)', fg: '#d8b4fe', border: 'rgba(192,132,252,0.35)' },
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
