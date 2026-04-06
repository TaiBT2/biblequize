/**
 * Energy system logic — pure functions for ranked mode energy management.
 */

const DEFAULT_MAX_ENERGY = 100
const ENERGY_COST_PER_WRONG = 5

/**
 * Calculate remaining energy after a wrong answer.
 */
export function deductEnergy(currentEnergy: number, wrongAnswers: number = 1): number {
  return Math.max(0, currentEnergy - wrongAnswers * ENERGY_COST_PER_WRONG)
}

/**
 * Check if player has enough energy to play.
 */
export function hasEnergy(energy: number): boolean {
  return energy > 0
}

/**
 * Calculate energy percentage for progress bar display.
 */
export function energyPercentage(energy: number, maxEnergy: number = DEFAULT_MAX_ENERGY): number {
  if (maxEnergy <= 0) return 0
  return Math.min(1, Math.max(0, energy / maxEnergy))
}

/**
 * Format energy display text.
 */
export function formatEnergy(energy: number, maxEnergy: number = DEFAULT_MAX_ENERGY): string {
  return `${energy} / ${maxEnergy}`
}
