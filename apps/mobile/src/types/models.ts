export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: string
  totalPoints?: number
  currentStreak?: number
  longestStreak?: number
  prestigeLevel?: number
}

export interface Question {
  id: string
  book: string
  chapter: number
  verseStart?: number
  verseEnd?: number
  difficulty: 'easy' | 'medium' | 'hard'
  type: string
  content: string
  options: string[]
  correctAnswer: number[]
  explanation?: string
}

export interface QuizSession {
  sessionId: string
  questions: Question[]
  mode: string
}

export interface LeaderboardEntry {
  userId: string
  name: string
  avatarUrl?: string
  points: number
  rank: number
}

export interface Group {
  id: string
  name: string
  code: string
  memberCount: number
  description?: string
  avatarUrl?: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
}

export interface DailyMission {
  slot: number
  type: string
  description: string
  progress: number
  target: number
  completed: boolean
}
