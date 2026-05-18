import type { Question } from './question'

export interface QuizSession {
  sessionId: string
  questions: Question[]
  mode: string
}
