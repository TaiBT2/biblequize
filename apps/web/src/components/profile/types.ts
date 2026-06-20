export interface UserProfile {
  name: string
  email: string
  avatarUrl?: string
  totalPoints: number
  currentStreak: number
  longestStreak: number
  role: string
  createdAt?: string
  /** LBF-5: false = opted out of the public leaderboard. */
  leaderboardVisible?: boolean
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

export type BookStatus = 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED'

export interface BookProgress {
  book: string
  bookVi: string
  orderIndex: number
  testament: 'OLD' | 'NEW'
  totalQuestions: number
  masteredQuestions: number
  masteryPercent: number
  status: BookStatus
}

export interface JourneySummary {
  total: number
  completed: number
  inProgress: number
  locked: number
  overallMastery: number
  oldTestamentCompleted: number
  newTestamentCompleted: number
  currentBook: string | null
}

export interface JourneyResponse {
  summary: JourneySummary
  books: BookProgress[]
}

export interface CosmeticItem {
  id: string
  name: string
  tier: number
  unlocked: boolean
  active: boolean
}

export interface CosmeticResponse {
  activeFrame: string | null
  activeTheme: string | null
  frames: CosmeticItem[]
  themes: CosmeticItem[]
}
