import { getPreset, isPresetValue, parsePresetId, type AvatarPreset } from '../data/avatars'

// `resolveAvatar` is the single source of truth for "what should I render?"
// across Profile, Leaderboard, and any future avatar surface. It collapses
// the three legal sources of an avatar into a discriminated union so the
// caller can render without branching on string shapes.
//
//   1. img      — an actual HTTP(S) URL (OAuth picture or legacy custom URL)
//   2. preset   — `preset:<id>` referring to AVATAR_PRESETS (emoji-based)
//   3. initial  — fallback to first letter of the display name (Cormorant
//                 italic gold on the render side)
export type ResolvedAvatar =
  | { kind: 'img'; src: string }
  | { kind: 'preset'; preset: AvatarPreset }
  | { kind: 'initial'; initial: string }

const GOOGLE_PREFIXES = [
  'https://lh3.googleusercontent.com/',
  'https://lh4.googleusercontent.com/',
  'https://lh5.googleusercontent.com/',
  'https://lh6.googleusercontent.com/',
]

const FACEBOOK_HOST_RE = /^https?:\/\/[^/]*fbcdn\.net\//

export function isGoogleAvatarUrl(value: string | null | undefined): boolean {
  if (!value) return false
  return GOOGLE_PREFIXES.some(p => value.startsWith(p))
}

export function isOAuthAvatarUrl(value: string | null | undefined): boolean {
  if (!value) return false
  return isGoogleAvatarUrl(value) || FACEBOOK_HOST_RE.test(value)
}

function firstInitial(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  if (trimmed.length === 0) return '?'
  // Iterate as code points so surrogate-pair names (emoji-only) still render.
  const first = Array.from(trimmed)[0]
  return first ? first.toUpperCase() : '?'
}

export function resolveAvatar(
  avatarUrl: string | null | undefined,
  name: string | null | undefined,
): ResolvedAvatar {
  if (isPresetValue(avatarUrl)) {
    const id = parsePresetId(avatarUrl)
    const preset = id ? getPreset(id) : undefined
    if (preset) return { kind: 'preset', preset }
    // Unknown preset id — fall through to initial rather than render broken.
  }
  if (avatarUrl && /^https?:\/\//i.test(avatarUrl)) {
    return { kind: 'img', src: avatarUrl }
  }
  return { kind: 'initial', initial: firstInitial(name) }
}
