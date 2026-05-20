import type { TFunction } from 'i18next'

// BE stores season name as "Mùa <Liturgical> <Year>" (per SeasonSeeder, C3 lock).
// 4 fixed liturgical prefixes are mapped to i18n keys so non-VN locales render
// "Pentecost Season 2026" instead of leaking VN data through. Year (or any
// trailing fragment) is preserved verbatim. Unknown prefixes fall through
// unchanged — defensive default that keeps the original BE string visible.
const SEASON_PREFIX_KEYS: Record<string, string> = {
  'Mùa Phục Sinh':  'leaderboard.sidebar.seasonNames.phucSinh',
  'Mùa Ngũ Tuần':   'leaderboard.sidebar.seasonNames.nguTuan',
  'Mùa Cảm Tạ':     'leaderboard.sidebar.seasonNames.camTa',
  'Mùa Giáng Sinh': 'leaderboard.sidebar.seasonNames.giangSinh',
}

export function localizeSeasonName(name: string | undefined | null, t: TFunction): string | undefined {
  if (!name) return name ?? undefined
  for (const [prefix, key] of Object.entries(SEASON_PREFIX_KEYS)) {
    if (name.startsWith(prefix)) {
      return `${t(key)}${name.slice(prefix.length)}`
    }
  }
  return name
}
