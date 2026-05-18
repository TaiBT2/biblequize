export interface UserProfile {
  name: string
  email: string
  avatarUrl?: string
  totalPoints: number
  currentStreak: number
  longestStreak: number
  role: string
  createdAt?: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: string | null
}

export interface SessionHistory {
  id: string
  completedAt: string
  score: number
  totalQuestions?: number
  correctAnswers?: number
  status?: string
}

export interface BookAccuracy {
  book: string
  totalAnswered: number
  correct: number
  wrong: number
  accuracy: number
}

export interface WeaknessData {
  weakBooks: BookAccuracy[]
  strongBooks: BookAccuracy[]
  suggestedPractice: string | null
}

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4

export const FILL_STYLE = { fontVariationSettings: "'FILL' 1" }
