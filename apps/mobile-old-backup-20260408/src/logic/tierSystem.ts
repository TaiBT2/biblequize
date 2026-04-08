/**
 * Tier system logic — re-exports from data/tiers with additional helpers.
 */

export { TIERS, getTierByPoints, getTierName, getNextTier } from '../data/tiers'
export type { Tier } from '../data/tiers'

/**
 * Calculate progress percentage to next tier (0..1).
 */
export function calculateTierProgress(points: number): number {
  const { getTierByPoints, getNextTier } = require('../data/tiers')
  const current = getTierByPoints(points)
  const next = getNextTier(points)
  if (!next) return 1 // Max tier
  const range = next.minPoints - current.minPoints
  if (range <= 0) return 1
  return Math.min(1, (points - current.minPoints) / range)
}

/**
 * Calculate points needed to reach next tier.
 */
export function pointsToNextTier(points: number): number {
  const { getNextTier } = require('../data/tiers')
  const next = getNextTier(points)
  if (!next) return 0 // Already max tier
  return Math.max(0, next.minPoints - points)
}
