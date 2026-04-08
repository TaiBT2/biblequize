export interface Tier {
  id: number
  name: string
  minPoints: number
  maxPoints: number
  icon: string
  color: string
}

export const TIERS: Tier[] = [
  { id: 1, name: 'Tân Tín Hữu', minPoints: 0, maxPoints: 999, icon: '🌱', color: 'gray' },
  { id: 2, name: 'Người Tìm Kiếm', minPoints: 1000, maxPoints: 4999, icon: '🌿', color: 'green' },
  { id: 3, name: 'Môn Đồ', minPoints: 5000, maxPoints: 14999, icon: '📜', color: 'blue' },
  { id: 4, name: 'Hiền Triết', minPoints: 15000, maxPoints: 39999, icon: '🪔', color: 'purple' },
  { id: 5, name: 'Tiên Tri', minPoints: 40000, maxPoints: 99999, icon: '🔥', color: 'gold' },
  { id: 6, name: 'Sứ Đồ', minPoints: 100000, maxPoints: Infinity, icon: '👑', color: 'red' },
]

export function getTierByPoints(points: number): Tier {
  return TIERS.find(t => points >= t.minPoints && points <= t.maxPoints) ?? TIERS[0]
}

export function getTierName(points: number): string {
  return getTierByPoints(points).name
}

export function getNextTier(points: number): Tier | null {
  const current = getTierByPoints(points)
  return TIERS.find(t => t.id === current.id + 1) ?? null
}
