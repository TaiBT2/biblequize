export interface TierInfo {
  level: number
  name: string
  icon: string
  minPoints: number
  maxPoints: number
  color: string
}

export const TIERS: TierInfo[] = [
  { level: 1, name: 'Tân Tín Hữu', icon: '🌱', minPoints: 0, maxPoints: 999, color: '#9ca3af' },
  { level: 2, name: 'Người Tìm Kiếm', icon: '🌿', minPoints: 1000, maxPoints: 4999, color: '#60a5fa' },
  { level: 3, name: 'Môn Đồ', icon: '📜', minPoints: 5000, maxPoints: 14999, color: '#3b82f6' },
  { level: 4, name: 'Hiền Triết', icon: '🪔', minPoints: 15000, maxPoints: 39999, color: '#a855f7' },
  { level: 5, name: 'Tiên Tri', icon: '🔥', minPoints: 40000, maxPoints: 99999, color: '#eab308' },
  { level: 6, name: 'Sứ Đồ', icon: '👑', minPoints: 100000, maxPoints: Infinity, color: '#ef4444' },
]

export function getTierByPoints(points: number): TierInfo {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) return TIERS[i]
  }
  return TIERS[0]
}

export function getTierProgress(points: number): { current: TierInfo; next: TierInfo | null; percent: number; pointsToNext: number } {
  const current = getTierByPoints(points)
  const nextIdx = TIERS.findIndex(t => t.level === current.level + 1)
  const next = nextIdx >= 0 ? TIERS[nextIdx] : null

  if (!next) return { current, next: null, percent: 100, pointsToNext: 0 }

  const range = next.minPoints - current.minPoints
  const progress = points - current.minPoints
  const percent = Math.min(100, Math.round((progress / range) * 100))

  return { current, next, percent, pointsToNext: next.minPoints - points }
}

// Star info per tier (5 stars each)
const STAR_XP = [0, 200, 800, 2000, 5000, 12000, 0]

export function getStarInfo(totalPoints: number) {
  const tier = getTierByPoints(totalPoints)
  const xpPerStar = STAR_XP[tier.level]
  if (xpPerStar <= 0 || tier.level >= 6) return { starIndex: 0, progress: 100 }

  const pointsInTier = totalPoints - tier.minPoints
  const starIndex = Math.min(4, Math.floor(pointsInTier / xpPerStar))
  const starStart = starIndex * xpPerStar
  const starEnd = (starIndex + 1) * xpPerStar
  const progress = Math.min(100, Math.round(((pointsInTier - starStart) / (starEnd - starStart)) * 100))

  return { starIndex, progress }
}
