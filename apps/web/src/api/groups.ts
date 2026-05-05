import { api } from './client'

export interface CreateLiveQuizRequest {
  quizSetId: string
  timePerQuestion?: number
}

export interface CreateLiveQuizResponse {
  id: string
  roomCode: string
  roomName: string
  mode: 'GROUP_LIVE_SEQUENTIAL'
}

/**
 * Feature A — Create a live multiplayer "Chơi cùng nhau" room from a group quiz set.
 * Restricted to LEADER/MOD roles (BE returns 403 otherwise).
 */
export async function createGroupLiveQuiz(
  groupId: string,
  body: CreateLiveQuizRequest
): Promise<CreateLiveQuizResponse> {
  const res = await api.post(`/api/groups/${groupId}/live-quiz`, body)
  return res.data.room
}
