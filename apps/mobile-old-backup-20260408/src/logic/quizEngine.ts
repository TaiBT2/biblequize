/**
 * Quiz scoring & combo logic — pure functions, no React dependency.
 */

const BASE_SCORES: Record<string, number> = {
  easy: 10, medium: 20, hard: 30,
  EASY: 10, MEDIUM: 20, HARD: 30,
}

const DIFF_MULTIPLIERS: Record<string, number> = {
  easy: 1, medium: 1.2, hard: 1.5,
  EASY: 1, MEDIUM: 1.2, HARD: 1.5,
}

/**
 * Calculate score for a single question based on difficulty and remaining time.
 */
export function calculateScore(difficulty: string, timeLeft: number): number {
  if (timeLeft < 0) return 0
  const base = BASE_SCORES[difficulty] ?? 10
  const mult = DIFF_MULTIPLIERS[difficulty] ?? 1
  const timeBonus = Math.floor(timeLeft / 2)
  const perfectBonus = timeLeft >= 25 ? 5 : 0
  return Math.floor((base + timeBonus + perfectBonus) * mult)
}

/**
 * Get combo multiplier based on current streak.
 */
export function getComboMultiplier(streak: number): number {
  if (streak >= 10) return 2.0
  if (streak >= 5) return 1.5
  if (streak >= 3) return 1.25
  return 1.0
}

/**
 * Check if a selected answer is correct.
 */
export function isAnswerCorrect(
  selectedIndex: number,
  correctAnswers: number[]
): boolean {
  return correctAnswers.includes(selectedIndex)
}

/**
 * Calculate final quiz grade based on correct answers and total questions.
 */
export function calculateGrade(
  correctCount: number,
  totalQuestions: number
): { percentage: number; grade: string } {
  if (totalQuestions === 0) return { percentage: 0, grade: 'F' }
  const percentage = Math.round((correctCount / totalQuestions) * 100)

  let grade: string
  if (percentage >= 90) grade = 'A'
  else if (percentage >= 80) grade = 'B'
  else if (percentage >= 70) grade = 'C'
  else if (percentage >= 60) grade = 'D'
  else grade = 'F'

  return { percentage, grade }
}

/**
 * Determine if quiz should end early (e.g., lives depleted).
 */
export function shouldEndQuiz(lives: number): boolean {
  return lives <= 0
}
