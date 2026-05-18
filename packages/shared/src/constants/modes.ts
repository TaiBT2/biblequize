/**
 * Canonical C2 game mode keys (CLAUDE.md §Canonical constraints).
 *
 * VN display labels (locked 2026-05-09 per DECISIONS.md):
 *   PRACTICE → "Luyện Tập"
 *   RANKED → "Đấu Hạng"  (KHÔNG "Leo Rank", KHÔNG "Thi Đấu Xếp Hạng")
 *
 * Display labels resolved via i18n key `home.<key>` hoặc `modes.<key>`.
 */
export const GAME_MODE_KEYS = [
  'PRACTICE',
  'RANKED',
  'DAILY',
  'MYSTERY',
  'SPEED',
  'MULTIPLAYER',
] as const

export type GameModeKey = (typeof GAME_MODE_KEYS)[number]

/**
 * Canonical VN labels for the 2 core single-player modes.
 * Other modes (DAILY/MYSTERY/SPEED/MULTIPLAYER) have varying labels per surface — use i18n directly.
 */
export const CORE_MODE_LABELS_VI = {
  PRACTICE: 'Luyện Tập',
  RANKED: 'Đấu Hạng',
} as const
