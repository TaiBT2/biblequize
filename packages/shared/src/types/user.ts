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
