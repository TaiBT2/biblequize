/**
 * Smart recommendation engine for the Home game-mode grid.
 *
 * <p>Given a snapshot of the user's state (streak, energy, daily
 * completion, time), returns the single game mode that is most worth
 * highlighting right now, along with a {@code reasonKey} that the UI
 * uses to look up an i18n message explaining <i>why</i>.
 *
 * <h3>Design</h3>
 *
 * <p>Implemented as a deterministic <b>priority cascade</b> (NOT a
 * scoring/ML model): rules are evaluated top-to-bottom; the first rule
 * whose precondition holds wins and short-circuits. Rationale:
 * <ul>
 *   <li><b>Explainable</b> — one rule = one reason, easy to show to
 *       the user and easy to debug.</li>
 *   <li><b>Testable</b> — each branch is a single test case with no
 *       ordering ambiguity.</li>
 *   <li><b>Tunable</b> — thresholds (energy 90, streak 3, midnight 6h)
 *       are plain numeric constants; tweaking needs no retraining.</li>
 * </ul>
 *
 * <h3>Priority ordering rationale (highest → lowest)</h3>
 * <ol>
 *   <li><b>Loss aversion</b> — cái gì sắp mất (streak) thì cứu trước.</li>
 *   <li><b>Onboarding</b> — user mới chưa biết làm gì.</li>
 *   <li><b>Opportunity</b> — cái gì chỉ có hôm nay (daily).</li>
 *   <li><b>Efficiency</b> — đang waste resource (energy max).</li>
 *   <li><b>Default</b> — không có gì đặc biệt, nhắc về core loop.</li>
 * </ol>
 */

export type RecommendedMode = 'practice' | 'ranked' | 'daily'

export type RecommendationReason =
  | 'streakAboutToBreak'
  | 'onboarding'
  | 'dailyAvailable'
  | 'fullEnergy'
  | 'default'

export interface Recommendation {
  /** Card id to highlight — matches {@code CARDS[i].id} in GameModeGrid. */
  mode: RecommendedMode
  /** i18n key suffix under {@code home.recommend.*} for the "why" text. */
  reasonKey: RecommendationReason
  /**
   * Interpolation values for the i18n message (e.g.
   * {@code { streak: 15, hours: 3 }}). Empty object when no values are
   * needed.
   */
  values: Record<string, number | string>
}

export interface RecommendationContext {
  /** User's cumulative XP. {@code 0} means brand-new user. */
  totalPoints: number
  /** Current daily streak count. */
  currentStreak: number
  /** Ranked energy remaining (0..energyMax). */
  energy: number
  /** Max energy capacity (usually 100). */
  energyMax: number
  /** Whether the user has finished today's Daily Challenge. */
  dailyDone: boolean
  /** Hours until server midnight resets daily state. Accepts fractions. */
  hoursToMidnight: number
  /**
   * Modes the user has unlocked (tier-gated). When a rule would
   * recommend a mode not in this set, it is skipped and the next rule
   * is evaluated. Omit to treat all modes as unlocked.
   *
   * Example: Tier-1 user passes {@code new Set(['practice', 'daily'])}
   * — Ranked recommendations will fall through.
   */
  unlockedModes?: Set<RecommendedMode>
}

// ── Tunable thresholds ──
//
// These are intentionally exported so tests can reference them and UI
// can display them in tooltips without hardcoding. Changing a number
// here re-tunes the engine without touching logic.

export const THRESHOLDS = {
  /** Below this many hours until midnight, an un-done daily is "urgent". */
  STREAK_URGENT_HOURS: 6,
  /** Below this many hours, daily becomes a regular "opportunity" (softer nudge). */
  DAILY_OPPORTUNITY_HOURS: 12,
  /** Streak length at or above which protection rule fires. */
  STREAK_PROTECT_MIN: 3,
  /** Energy at-or-above which fullEnergy rule fires (as % of max). */
  ENERGY_FULL_RATIO: 0.9,
} as const

/**
 * Compute the recommended mode. Returns {@code null} only if the context
 * is missing critical fields (caller should skip highlighting).
 */
export function getRecommendedMode(
  ctx: RecommendationContext | null | undefined,
): Recommendation | null {
  if (!ctx) return null

  // Defensive: accept partial/invalid data rather than crash.
  const totalPoints = Number.isFinite(ctx.totalPoints) ? Math.max(0, ctx.totalPoints) : 0
  const currentStreak = Number.isFinite(ctx.currentStreak) ? Math.max(0, ctx.currentStreak) : 0
  const energy = Number.isFinite(ctx.energy) ? Math.max(0, ctx.energy) : 0
  const energyMax = Number.isFinite(ctx.energyMax) && ctx.energyMax > 0 ? ctx.energyMax : 100
  const dailyDone = !!ctx.dailyDone
  const hoursToMidnight = Number.isFinite(ctx.hoursToMidnight)
    ? Math.max(0, ctx.hoursToMidnight)
    : 24

  const isUnlocked = (mode: RecommendedMode): boolean =>
    !ctx.unlockedModes || ctx.unlockedModes.has(mode)

  /** Apply unlock filter — returns recommendation only if mode is unlocked. */
  const ifUnlocked = (rec: Recommendation): Recommendation | null =>
    isUnlocked(rec.mode) ? rec : null

  // P1 — Loss aversion: streak protection.
  // User has invested ≥ STREAK_PROTECT_MIN days; daily not done; < STREAK_URGENT_HOURS
  // to midnight reset. Miss = streak resets to 0, which is psychologically costly.
  if (
    currentStreak >= THRESHOLDS.STREAK_PROTECT_MIN &&
    !dailyDone &&
    hoursToMidnight < THRESHOLDS.STREAK_URGENT_HOURS
  ) {
    const rec = ifUnlocked({
      mode: 'daily',
      reasonKey: 'streakAboutToBreak',
      values: { streak: currentStreak, hours: Math.max(1, Math.ceil(hoursToMidnight)) },
    })
    if (rec) return rec
  }

  // P2 — Onboarding: brand-new account, no XP earned yet. Practice is
  // safe (unlimited, free, explanations shown) — right tool to learn.
  if (totalPoints === 0) {
    const rec = ifUnlocked({ mode: 'practice', reasonKey: 'onboarding', values: {} })
    if (rec) return rec
  }

  // P3 — Opportunity: daily is limited-time (one per day). If still
  // undone and we're past the mid-day mark, nudge the user.
  if (!dailyDone && hoursToMidnight < THRESHOLDS.DAILY_OPPORTUNITY_HOURS) {
    const rec = ifUnlocked({
      mode: 'daily',
      reasonKey: 'dailyAvailable',
      values: { hours: Math.max(1, Math.ceil(hoursToMidnight)) },
    })
    if (rec) return rec
  }

  // P4 — Efficiency: energy at cap. Regen will waste because nothing to
  // fill up. Push the user to spend it in Ranked (the mode that
  // consumes energy).
  if (energy >= energyMax * THRESHOLDS.ENERGY_FULL_RATIO) {
    const rec = ifUnlocked({
      mode: 'ranked',
      reasonKey: 'fullEnergy',
      values: { energy, max: energyMax },
    })
    if (rec) return rec
  }

  // Default — no strong signal; nudge toward core loop. Prefer Ranked if
  // unlocked; fall back to Practice for tier-1 (Ranked-gated) users.
  if (isUnlocked('ranked')) {
    return { mode: 'ranked', reasonKey: 'default', values: {} }
  }
  return { mode: 'practice', reasonKey: 'default', values: {} }
}
