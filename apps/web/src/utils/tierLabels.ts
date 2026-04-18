import type { TFunction } from 'i18next'

const TIER_KEY_BY_LEVEL: Record<number, string> = {
  0: 'newBeliever',
  1: 'seeker',
  2: 'disciple',
  3: 'sage',
  4: 'prophet',
  5: 'apostle',
}

export function getTierLabel(tierLevel: number, t: TFunction): string | null {
  const key = TIER_KEY_BY_LEVEL[tierLevel]
  return key ? t(`tiers.${key}`) : null
}

const NEXT_TIER_KEY_BY_LEVEL: Record<number, string> = {
  1: 'seeker',
  2: 'disciple',
  3: 'sage',
  4: 'prophet',
  5: 'apostle',
}

export function getNextTierLabel(tierLevel: number, t: TFunction): string | null {
  const key = NEXT_TIER_KEY_BY_LEVEL[tierLevel]
  return key ? t(`tiers.${key}`) : null
}
