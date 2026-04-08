export function shouldResetStreak(lastPlayedDate: string | null, today: string): boolean {
  if (!lastPlayedDate) return false
  const last = new Date(lastPlayedDate)
  const now = new Date(today)
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays > 1
}

export function isStreakActive(lastPlayedDate: string | null, today: string): boolean {
  if (!lastPlayedDate) return false
  const last = new Date(lastPlayedDate)
  const now = new Date(today)
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 1
}

export function canUseStreakFreeze(usedThisWeek: boolean): boolean {
  return !usedThisWeek
}
