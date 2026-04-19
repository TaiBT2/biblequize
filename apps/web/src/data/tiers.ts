/**
 * Single source of truth for the 6-tier user progression system.
 *
 * <p>Previously the same data was copy-pasted inline in
 * {@code pages/Home.tsx} and {@code pages/Ranked.tsx} with slightly
 * different shapes (emoji vs material icon, Tailwind vs hex color).
 * Consolidated here on 2026-04-19 so changing a threshold or color
 * only requires editing one file.
 *
 * <h3>Field conventions</h3>
 * <ul>
 *   <li>{@link #nameKey} — always {@code 'tiers.<key>'}; mapped to
 *       display name via i18n. Keys align with the OLD religious
 *       naming per DECISIONS.md 2026-04-19.</li>
 *   <li>{@link #iconMaterial} — name for {@code <span className="material-symbols-outlined">}.
 *       Primary UI (Home, Ranked, Profile).</li>
 *   <li>{@link #iconEmoji} — emoji fallback for notifications, chat
 *       activity feed, share cards.</li>
 *   <li>{@link #colorHex} — canonical color. Use for inline
 *       {@code style={{ color: tier.colorHex }}}, SVGs, charts.</li>
 *   <li>{@link #colorTailwind} — pre-baked Tailwind class (may be
 *       {@code text-secondary} / {@code text-[#xxx]}) to avoid
 *       re-picking classes per page.</li>
 * </ul>
 */
export interface Tier {
  id: number
  nameKey: string
  minPoints: number
  maxPoints: number
  iconMaterial: string
  iconEmoji: string
  colorHex: string
  colorTailwind: string
}

export const TIERS: Tier[] = [
  {
    id: 1,
    nameKey: 'tiers.newBeliever',
    minPoints: 0,
    maxPoints: 999,
    iconMaterial: 'spa',
    iconEmoji: '🌱',
    colorHex: '#919098',
    colorTailwind: 'text-outline',
  },
  {
    id: 2,
    nameKey: 'tiers.seeker',
    minPoints: 1_000,
    maxPoints: 4_999,
    iconMaterial: 'eco',
    iconEmoji: '🌿',
    colorHex: '#4ade80',
    colorTailwind: 'text-green-400',
  },
  {
    id: 3,
    nameKey: 'tiers.disciple',
    minPoints: 5_000,
    maxPoints: 14_999,
    iconMaterial: 'scrollable_header',
    iconEmoji: '📜',
    colorHex: '#4a9eff',
    colorTailwind: 'text-[#4a9eff]',
  },
  {
    id: 4,
    nameKey: 'tiers.sage',
    minPoints: 15_000,
    maxPoints: 39_999,
    iconMaterial: 'lightbulb',
    iconEmoji: '🪔',
    colorHex: '#9b59b6',
    colorTailwind: 'text-[#9b59b6]',
  },
  {
    id: 5,
    nameKey: 'tiers.prophet',
    minPoints: 40_000,
    maxPoints: 99_999,
    iconMaterial: 'local_fire_department',
    iconEmoji: '🔥',
    colorHex: '#f8bd45',
    colorTailwind: 'text-secondary',
  },
  {
    id: 6,
    nameKey: 'tiers.apostle',
    minPoints: 100_000,
    maxPoints: Infinity,
    iconMaterial: 'workspace_premium',
    iconEmoji: '👑',
    colorHex: '#ff6b6b',
    colorTailwind: 'text-[#ff6b6b]',
  },
]

export function getTierByPoints(points: number): Tier {
  return TIERS.find(t => points >= t.minPoints && points <= t.maxPoints) ?? TIERS[0]
}

export function getNextTier(points: number): Tier | null {
  const current = getTierByPoints(points)
  return TIERS.find(t => t.id === current.id + 1) ?? null
}

export interface TierInfo {
  current: Tier
  next: Tier | null
  /** Percentage 0-100 (rounded) of progress toward {@code next}. 100 when at max tier. */
  progressPct: number
  /** Points still needed to reach {@code next.minPoints}. 0 when at max tier. */
  pointsToNext: number
}

/**
 * Compute the user's current tier plus progress to the next one.
 * Returns {@code progressPct = 100} and {@code pointsToNext = 0} when
 * the user is already at the max tier.
 */
export function getTierInfo(points: number): TierInfo {
  const safePoints = Number.isFinite(points) ? Math.max(0, points) : 0
  const current = getTierByPoints(safePoints)
  const next = getNextTier(safePoints)
  const progressPct = next
    ? Math.min(100, Math.round(((safePoints - current.minPoints) / (next.minPoints - current.minPoints)) * 100))
    : 100
  const pointsToNext = next ? Math.max(0, next.minPoints - safePoints) : 0
  return { current, next, progressPct, pointsToNext }
}
