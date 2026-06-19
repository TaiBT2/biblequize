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
  // Endpoint renamed per SPEC_GROUP v1.1 §13.5 (was /live-quiz).
  const res = await api.post(`/api/groups/${groupId}/live-rooms`, body)
  return res.data.room
}

/** BL-23 — per-set slice of the collective-growth metric. */
export interface CollectiveGrowthSet {
  quizSetId: string
  name: string
  totalQuestions: number
  participants: number
  completions: number
  avgMasteryPct: number
}

/** BL-23 — "Cùng nhau thuộc Lời" aggregate (anti-leaderboard, Q-A SAFE). */
export interface CollectiveGrowth {
  totalLearned: number
  contributors: number
  masteryCompletions: number
  memberCount: number
  milestoneFloor: number
  nextMilestone: number
  milestonePct: number
  perSet: CollectiveGrowthSet[]
}

/**
 * BL-23 — group "Cùng nhau thuộc Lời" collective-growth metric. Member-visible
 * aggregate of group quiz-set mastery; BE returns 400 for non-members.
 */
export async function getCollectiveGrowth(groupId: string): Promise<CollectiveGrowth> {
  const res = await api.get(`/api/groups/${groupId}/collective-growth`)
  return res.data.growth
}
