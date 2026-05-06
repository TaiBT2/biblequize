import { api } from './client'

export type ScheduledQuizStatus = 'ACTIVE' | 'ENDED' | 'CANCELLED'

export interface ScheduledQuizSummary {
  id: string
  groupId: string
  quizSetId: string
  name: string
  description?: string
  deadline: string
  status: ScheduledQuizStatus
  maxAttempts: number
  isLeaderboardPublic: boolean
  sendNotifications: boolean
  questionCount: number
  winnerUserId?: string
  winnerScore?: number
  createdBy: string
  createdAt: string
  endedAt?: string
}

export interface ScheduledQuizDetail extends ScheduledQuizSummary {
  myStatus: {
    attemptsUsed: number
    attemptsRemaining: number
    bestScore: number | null
    bestCorrectCount: number | null
    bestTimeSeconds: number | null
  }
}

export interface CreateScheduledQuizRequest {
  quizSetId: string
  name?: string
  description?: string
  deadline: string // ISO local date-time
  maxAttempts?: number
  isLeaderboardPublic?: boolean
  sendNotifications?: boolean
}

export interface AttemptQuestion {
  id: string
  content: string
  options: string[]
  type: string
  book?: string
  chapter?: number
  explanation?: string
}

export interface StartAttemptResponse {
  quizId: string
  attemptNumber: number
  questions: AttemptQuestion[]
}

export interface SubmitAttemptRequest {
  answers: Array<{ questionId: string; answerIndex: number }>
  timeSeconds: number
}

export interface SubmitAttemptResponse {
  attemptNumber: number
  score: number
  correctCount: number
  totalQuestions: number
  timeSeconds: number
}

export interface LeaderboardRow {
  rank: number
  userId: string
  name: string
  avatarUrl?: string
  score: number
  correctCount: number
  totalQuestions: number
  timeSeconds: number
  attemptsUsed: number
  isMe: boolean
}

const base = (groupId: string) => `/api/groups/${groupId}/scheduled-quizzes`

export async function listScheduledQuizzes(
  groupId: string,
  status?: ScheduledQuizStatus
): Promise<ScheduledQuizSummary[]> {
  const res = await api.get(base(groupId), { params: status ? { status } : {} })
  return res.data.scheduledQuizzes
}

export async function getScheduledQuizDetail(
  groupId: string,
  quizId: string
): Promise<ScheduledQuizDetail> {
  const res = await api.get(`${base(groupId)}/${quizId}`)
  return res.data.scheduledQuiz
}

export async function createScheduledQuiz(
  groupId: string,
  body: CreateScheduledQuizRequest
): Promise<ScheduledQuizSummary> {
  const res = await api.post(base(groupId), body)
  return res.data.scheduledQuiz
}

export async function startScheduledQuizAttempt(
  groupId: string,
  quizId: string
): Promise<StartAttemptResponse> {
  const res = await api.post(`${base(groupId)}/${quizId}/start`)
  return res.data.attempt
}

export async function submitScheduledQuizAttempt(
  groupId: string,
  quizId: string,
  body: SubmitAttemptRequest
): Promise<SubmitAttemptResponse> {
  const res = await api.post(`${base(groupId)}/${quizId}/submit`, body)
  return res.data.result
}

export async function getScheduledQuizLeaderboard(
  groupId: string,
  quizId: string
): Promise<LeaderboardRow[]> {
  const res = await api.get(`${base(groupId)}/${quizId}/leaderboard`)
  return res.data.leaderboard
}
