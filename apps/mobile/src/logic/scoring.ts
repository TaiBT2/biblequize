export interface ScoreInput {
  difficulty: 'easy' | 'medium' | 'hard'
  isCorrect: boolean
  elapsedMs: number
  timeLimitMs: number
  comboCount: number
  tierMultiplier: number
  isDailyFirst?: boolean
}

export function calculateScore(input: ScoreInput): number {
  if (!input.isCorrect) return 0

  const basePoints: Record<string, number> = { easy: 8, medium: 12, hard: 18 }
  const base = basePoints[input.difficulty] ?? 8

  const speedRatio = Math.max(0, (input.timeLimitMs - input.elapsedMs) / input.timeLimitMs)
  const speedBonus = Math.floor(base * 0.5 * speedRatio * speedRatio)

  let comboMultiplier = 1.0
  if (input.comboCount >= 10) comboMultiplier = 1.5
  else if (input.comboCount >= 5) comboMultiplier = 1.2

  let total = Math.floor((base + speedBonus) * comboMultiplier * input.tierMultiplier)

  if (input.isDailyFirst) {
    total = total * 2
  }

  return total
}
