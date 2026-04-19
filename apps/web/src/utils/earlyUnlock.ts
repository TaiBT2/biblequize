/**
 * Pure helpers for the "Early Ranked unlock" progress display.
 *
 * <p>Mirror of the backend policy in
 * {@code EarlyRankedUnlockPolicy.java} — thresholds MUST stay in sync
 * (≥10 total answers + ≥80% accuracy).
 *
 * @see gameModes.unlockAtWithEarlyPath in i18n JSON
 */

export const EARLY_UNLOCK_MIN_QUESTIONS = 10
export const EARLY_UNLOCK_MIN_ACCURACY_PCT = 80

/**
 * Return the minimum number of ADDITIONAL correct answers a user must
 * record — assuming they answer all additional questions correctly —
 * to satisfy the early-unlock policy.
 *
 * <h3>Derivation</h3>
 * Let {@code c} = current correct, {@code t} = current total. After
 * {@code k} more correct answers (and thus {@code k} more total
 * questions), the policy requires:
 * <pre>
 *   (c + k) / (t + k)  ≥  0.80
 *   ⇔  100(c + k)      ≥  80(t + k)
 *   ⇔  20k             ≥  80t − 100c
 *   ⇔  k               ≥  4t − 5c
 * </pre>
 * Plus the independent {@code total ≥ 10} constraint: {@code k ≥ 10 − t}.
 * Therefore:
 * <pre>
 *   k ≥ max(0, 10 − t, 4t − 5c)
 * </pre>
 *
 * @param correct current cumulative correct Practice answers (≥ 0)
 * @param total   current cumulative total Practice answers (≥ correct)
 * @returns smallest integer {@code k ≥ 0}; {@code 0} means already
 *   qualifying (if the backend hasn't flipped the flag yet it should on
 *   the next answer)
 */
export function minCorrectNeededForEarlyUnlock(correct: number, total: number): number {
  const safeCorrect = Math.max(0, Math.floor(correct))
  const safeTotal = Math.max(safeCorrect, Math.floor(total))
  const accuracyGap = 4 * safeTotal - 5 * safeCorrect       // accuracy constraint
  const totalGap = EARLY_UNLOCK_MIN_QUESTIONS - safeTotal   // sample-size constraint
  return Math.max(0, accuracyGap, totalGap)
}

/**
 * Accuracy percentage (0–100, rounded) of cumulative Practice answers.
 * Returns {@code null} when no answers recorded yet (avoid showing "0%
 * accuracy" for a brand-new user who hasn't tried).
 */
export function practiceAccuracyPct(correct: number, total: number): number | null {
  if (!Number.isFinite(total) || total <= 0) return null
  return Math.round((correct / total) * 100)
}

/**
 * Progress toward the accuracy threshold, expressed as a percentage of
 * the target (0–100). Plateaus at 100 once the user qualifies.
 *
 * <p>Visualised as a bar in the locked Ranked card. Reaches 100% when
 * the user has cleared both the sample-size and accuracy hurdles.
 */
export function earlyUnlockProgressPct(correct: number, total: number): number {
  const needed = minCorrectNeededForEarlyUnlock(correct, total)
  if (needed === 0) return 100
  // Show the user's relative progress within a 10-question window
  // (matches MIN_QUESTIONS). Never exceed 99% unless the user actually
  // qualifies, so the "100%" state is a genuine win moment.
  const totalWindow = EARLY_UNLOCK_MIN_QUESTIONS
  const pct = Math.min(99, Math.round((Math.max(0, totalWindow - needed) / totalWindow) * 100))
  return pct
}
