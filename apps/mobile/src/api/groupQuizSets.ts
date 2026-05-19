import { apiClient } from './client'
import type { QuizSet, PublishStatus } from './personalQuizSets'

export interface GroupQuizSet extends QuizSet {
  creatorId?: string
  creatorName?: string
  playCount?: number
  avgRating?: number
}

export interface ListGroupQuizSetsParams {
  groupId: string
  status?: PublishStatus | 'ALL'
  page?: number
  pageSize?: number
}

/**
 * GET /api/groups/{groupId}/quiz-sets — paginated list của group quiz sets.
 * BE filter status (PUBLISHED|DRAFT|ARCHIVED|ALL); paginated với page + pageSize.
 *
 * MEMBER role chỉ thấy PUBLISHED + ARCHIVED; LEADER/MOD thấy all incl. DRAFT.
 */
export async function listGroupQuizSets(params: ListGroupQuizSetsParams): Promise<GroupQuizSet[]> {
  const { groupId, status = 'PUBLISHED', page = 0, pageSize = 50 } = params
  const query = new URLSearchParams()
  if (status !== 'ALL') query.set('status', status)
  query.set('page', String(page))
  query.set('pageSize', String(pageSize))
  const res = await apiClient.get(`/api/groups/${groupId}/quiz-sets?${query.toString()}`)
  return res.data.quizSets ?? res.data.items ?? res.data ?? []
}
