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
  { id: 'disciple',  emoji: '🧔',     bg: '#2a1f12', labelKey: 'profile.avatarPresets.disciple' },
  { id: 'king',      emoji: '🤴',     bg: '#2f240a', labelKey: 'profile.avatarPresets.king' },
  { id: 'queen',     emoji: '👸',     bg: '#2a1a2a', labelKey: 'profile.avatarPresets.queen' },
  { id: 'prophet',   emoji: '🧙',     bg: '#1c1c2a', labelKey: 'profile.avatarPresets.prophet' },
  { id: 'elder',     emoji: '👴',     bg: '#2a2316', labelKey: 'profile.avatarPresets.elder' },
  { id: 'matriarch', emoji: '👵',     bg: '#2a1f1a', labelKey: 'profile.avatarPresets.matriarch' },
  { id: 'angel',     emoji: '👼',     bg: '#1e2a3a', labelKey: 'profile.avatarPresets.angel' },
  { id: 'scholar',   emoji: '🧑‍🎓', bg: '#1a2a26', labelKey: 'profile.avatarPresets.scholar' },
  { id: 'teacher',   emoji: '🧑‍🏫', bg: '#2a2410', labelKey: 'profile.avatarPresets.teacher' },
  { id: 'sower',     emoji: '🧑‍🌾', bg: '#1c2a1c', labelKey: 'profile.avatarPresets.sower' },
  { id: 'judge',     emoji: '🧑‍⚖️', bg: '#26203a', labelKey: 'profile.avatarPresets.judge' },
  { id: 'saint',     emoji: '🙏',     bg: '#2a1a14', labelKey: 'profile.avatarPresets.saint' },
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
