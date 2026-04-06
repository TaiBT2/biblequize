// Consolidated TypeScript types for BibleQuiz Mobile
// Adapted from web app scattered type definitions

// === Auth ===
export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role?: 'USER' | 'ADMIN'
  totalPoints?: number
  currentStreak?: number
  longestStreak?: number
  livesRemaining?: number
  dailyLives?: number
  createdAt?: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken?: string
  name: string
  email: string
  avatar?: string
  role?: string
}

// === Quiz ===
export interface Question {
  id: string
  questionText: string
  options: string[]
  correctAnswer: number[]
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  bookName: string
  chapter: number
  verse: string
  explanation?: string
  questionType: 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTI' | 'TRUE_FALSE' | 'FILL_IN_BLANK'
}

export interface QuizSession {
  id: string
  userId: string
  mode: 'PRACTICE' | 'RANKED' | 'DAILY' | 'MULTIPLAYER'
  totalQuestions: number
  correctAnswers: number
  score: number
  startedAt: string
  completedAt?: string
}

export interface AnswerResult {
  correct: boolean
  correctAnswer: number[]
  explanation?: string
  pointsEarned: number
  streakCount?: number
}

// === Ranked ===
export interface RankedStatus {
  questionsToday: number
  questionsLimit: number
  pointsToday: number
  livesRemaining: number
  dailyLives: number
  currentBook: string
  currentBookIndex: number
}

// === Leaderboard ===
export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  avatarUrl?: string
  score: number
  tier?: string
}

// === Room (Multiplayer) ===
export interface Room {
  id: string
  code: string
  hostId: string
  hostName: string
  gameMode: 'SPEED_RACE' | 'BATTLE_ROYALE' | 'TEAM_VS_TEAM' | 'SUDDEN_DEATH'
  status: 'LOBBY' | 'IN_PROGRESS' | 'COMPLETED'
  maxPlayers: number
  currentPlayers: number
  isPublic: boolean
  difficulty?: string
  bookFilter?: string
  createdAt: string
}

export interface RoomPlayer {
  userId: string
  name: string
  avatarUrl?: string
  isReady: boolean
  isHost: boolean
  team?: 'A' | 'B'
  score?: number
  isEliminated?: boolean
}

// === WebSocket Messages ===
export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: string
}

// === Church Group ===
export interface ChurchGroup {
  id: string
  name: string
  code: string
  description?: string
  leaderId: string
  memberCount: number
  createdAt: string
}

// === Tournament ===
export interface Tournament {
  id: string
  name: string
  status: 'LOBBY' | 'IN_PROGRESS' | 'COMPLETED'
  maxParticipants: number
  currentParticipants: number
  startTime?: string
  createdAt: string
}

// === Achievement ===
export interface Achievement {
  id: string
  type: string
  name: string
  description: string
  earnedAt?: string
  progress?: number
  target?: number
}

// === Season ===
export interface Season {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

// === API Response wrapper ===
export interface ApiError {
  code: string
  message: string
  requestId: string
  details?: Record<string, string>
}
