export type RoomMode =
  | 'SPEED_RACE'
  | 'BATTLE_ROYALE'
  | 'TEAM_VS_TEAM'
  | 'SUDDEN_DEATH'
  | 'GROUP_LIVE_SEQUENTIAL'

export const isSequentialMode = (mode?: string | null): boolean =>
  mode === 'GROUP_LIVE_SEQUENTIAL'

// WebSocket message types for Group Live Sequential (Feature A)
export interface SequentialProgressData {
  answered: number
  total: number
}

export interface QuestionRevealedData {
  correctIndex: number
  explanation?: string
  answers: PerPlayerAnswer[]
  leaderboard: unknown
}

export interface PerPlayerAnswer {
  userId: string
  username: string
  answerIndex: number | null
  isCorrect: boolean
}

// WS event type strings (mirror backend WebSocketMessage.MessageTypes)
export const WS_SEQUENTIAL_PROGRESS = 'SEQUENTIAL_PROGRESS'
export const WS_QUESTION_REVEALED = 'QUESTION_REVEALED'
export const WS_NEXT_QUESTION = 'NEXT_QUESTION'
