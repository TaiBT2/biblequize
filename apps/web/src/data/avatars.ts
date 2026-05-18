// Preset avatar library — 12 emoji-based options stored as `preset:<id>` in
// User.avatarUrl. Emoji is rendered inline; no external asset request.
// Background hex follows Sacred Modernist palette (gold + ivory + sage).

export interface AvatarPreset {
  id: string
  emoji: string
  bg: string // background hex (no alpha) — keeps preset visually distinct from initial fallback
  labelKey: string // i18n key for accessible label
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'cross',    emoji: '✝️',  bg: '#3a2a1a', labelKey: 'profile.avatarPresets.cross' },
  { id: 'dove',     emoji: '🕊️', bg: '#1e2a3a', labelKey: 'profile.avatarPresets.dove' },
  { id: 'bible',    emoji: '📖',  bg: '#2a1f12', labelKey: 'profile.avatarPresets.bible' },
  { id: 'scroll',   emoji: '📜',  bg: '#2a2316', labelKey: 'profile.avatarPresets.scroll' },
  { id: 'church',   emoji: '⛪',  bg: '#1f2533', labelKey: 'profile.avatarPresets.church' },
  { id: 'sparkles', emoji: '✨',  bg: '#2d2410', labelKey: 'profile.avatarPresets.sparkles' },
  { id: 'olive',    emoji: '🌿',  bg: '#1c2a1c', labelKey: 'profile.avatarPresets.olive' },
  { id: 'star',     emoji: '🌟',  bg: '#2a2410', labelKey: 'profile.avatarPresets.star' },
  { id: 'pray',     emoji: '🛐',  bg: '#26203a', labelKey: 'profile.avatarPresets.pray' },
  { id: 'crown',    emoji: '👑',  bg: '#2f240a', labelKey: 'profile.avatarPresets.crown' },
  { id: 'lion',     emoji: '🦁',  bg: '#33260f', labelKey: 'profile.avatarPresets.lion' },
  { id: 'fish',     emoji: '🐟',  bg: '#172733', labelKey: 'profile.avatarPresets.fish' },
]

const PRESET_BY_ID = new Map(AVATAR_PRESETS.map(p => [p.id, p]))

export function getPreset(id: string): AvatarPreset | undefined {
  return PRESET_BY_ID.get(id)
}

export const PRESET_PREFIX = 'preset:'

export function isPresetValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PRESET_PREFIX)
}

export function parsePresetId(value: string | null | undefined): string | null {
  if (!isPresetValue(value)) return null
  return (value as string).slice(PRESET_PREFIX.length)
}

export function toPresetValue(id: string): string {
  return `${PRESET_PREFIX}${id}`
}
