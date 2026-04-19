export interface Tier {
  id: number
  nameKey: string
  minPoints: number
  maxPoints: number
  icon: string
  color: string
}

export const TIERS: Tier[] = [
  { id: 1, nameKey: 'tiers.newBeliever', minPoints: 0, maxPoints: 999, icon: '🌱', color: 'gray' },
  { id: 2, nameKey: 'tiers.seeker', minPoints: 1000, maxPoints: 4999, icon: '🌿', color: 'green' },
  { id: 3, nameKey: 'tiers.disciple', minPoints: 5000, maxPoints: 14999, icon: '📜', color: 'blue' },
  { id: 4, nameKey: 'tiers.sage', minPoints: 15000, maxPoints: 39999, icon: '🪔', color: 'purple' },
  { id: 5, nameKey: 'tiers.prophet', minPoints: 40000, maxPoints: 99999, icon: '🔥', color: 'gold' },
  { id: 6, nameKey: 'tiers.apostle', minPoints: 100000, maxPoints: Infinity, icon: '👑', color: 'red' },
]

export function getTierByPoints(points: number): Tier {
  return TIERS.find(t => points >= t.minPoints && points <= t.maxPoints) ?? TIERS[0]
}

export function getNextTier(points: number): Tier | null {
  const current = getTierByPoints(points)
  return TIERS.find(t => t.id === current.id + 1) ?? null
}
