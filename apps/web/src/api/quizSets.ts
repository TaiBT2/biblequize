import { api } from './client'

export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SOFT_DELETED'
export type QuizSetDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED'
export type RoomMode =
  | 'SPEED_RACE' | 'BATTLE_ROYALE' | 'TEAM_VS_TEAM'
  | 'SUDDEN_DEATH' | 'GROUP_LIVE_SEQUENTIAL'

export interface QuizSet {
  id: string
  groupId: string
  name: string
  questionIds: string[]
  totalQuestions: number
  createdBy: string
  createdAt: string
  updatedAt?: string
  language: string
  description?: string | null
  coverImageUrl?: string | null
  tags?: string[] | null
  coverScripture?: string | null
  authorNote?: string | null
  difficulty?: QuizSetDifficulty | null
  estimatedDurationMin?: number | null
  suggestedMode?: RoomMode | null
  playCount: number
  averageRating?: number | null
  totalRatings: number
  lastPlayedAt?: string | null
  publishStatus: PublishStatus
  publishedAt?: string | null
  archivedAt?: string | null
  folderId?: string | null
}

export interface QuizSetMastery {
  id: string | null
  quizSetId: string
  userId: string
  questionsLearned: number
  totalAttempts: number
  bestScore: number
  bestAccuracy?: number | null
  lastPracticedAt?: string | null
  completedMastery: boolean
  completedMasteryAt?: string | null
}

export interface ListQuizSetsParams {
  status?: PublishStatus
  folder?: string | null
  search?: string
  sort?: 'popular' | 'recent' | 'name' | 'rating'
  page?: number
  size?: number
}

export interface ListQuizSetsResponse {
  quizSets: QuizSet[]
  page: number
  totalElements: number
  totalPages: number
}

export async function listQuizSets(groupId: string, params?: ListQuizSetsParams): Promise<ListQuizSetsResponse> {
  const res = await api.get(`/api/groups/${groupId}/quiz-sets`, { params })
  return res.data
}

export async function getQuizSet(groupId: string, setId: string): Promise<QuizSet> {
  const res = await api.get(`/api/groups/${groupId}/quiz-sets`, { params: { search: setId } })
  // Fallback: list endpoint không có by-id getter; hiện tại không cần — list trả về full data.
  // Tìm trong page result bằng id chính xác.
  const found = (res.data.quizSets as QuizSet[]).find(qs => qs.id === setId)
  if (!found) throw new Error('Quiz set không tìm thấy')
  return found
}

export interface CreateQuizSetBody {
  name: string
  questionIds?: string[]
  description?: string
  coverImageUrl?: string
  tags?: string[]
  coverScripture?: string
  authorNote?: string
  suggestedMode?: RoomMode
  folderId?: string | null
  language?: 'VI' | 'EN'
}

export async function createQuizSet(groupId: string, body: CreateQuizSetBody): Promise<QuizSet> {
  const res = await api.post(`/api/groups/${groupId}/quiz-sets`, body)
  return res.data.quizSet
}

export async function updateQuizSet(groupId: string, setId: string, body: Partial<CreateQuizSetBody>): Promise<QuizSet> {
  const res = await api.patch(`/api/groups/${groupId}/quiz-sets/${setId}`, body)
  return res.data.quizSet
}

export async function publishQuizSet(groupId: string, setId: string): Promise<QuizSet> {
  const res = await api.patch(`/api/groups/${groupId}/quiz-sets/${setId}/publish`)
  return res.data.quizSet
}

export async function archiveQuizSet(groupId: string, setId: string): Promise<QuizSet> {
  const res = await api.patch(`/api/groups/${groupId}/quiz-sets/${setId}/archive`)
  return res.data.quizSet
}

export async function unarchiveQuizSet(groupId: string, setId: string): Promise<QuizSet> {
  const res = await api.patch(`/api/groups/${groupId}/quiz-sets/${setId}/unarchive`)
  return res.data.quizSet
}

export async function cloneQuizSet(groupId: string, setId: string): Promise<QuizSet> {
  const res = await api.post(`/api/groups/${groupId}/quiz-sets/${setId}/clone`)
  return res.data.quizSet
}

export async function deleteQuizSet(groupId: string, setId: string): Promise<QuizSet> {
  const res = await api.delete(`/api/groups/${groupId}/quiz-sets/${setId}`)
  return res.data.quizSet
}

export async function getMyMastery(groupId: string, setId: string): Promise<QuizSetMastery> {
  const res = await api.get(`/api/groups/${groupId}/quiz-sets/${setId}/my-mastery`)
  return res.data.mastery
}

export async function getMyMasteries(groupId: string): Promise<QuizSetMastery[]> {
  const res = await api.get(`/api/groups/${groupId}/my-masteries`)
  return res.data.masteries
}

export interface QuizSetFolder {
  id: string
  groupId: string
  name: string
  color?: string | null
  displayOrder: number
  createdBy: string
  createdAt: string
}

export async function listFolders(groupId: string): Promise<QuizSetFolder[]> {
  const res = await api.get(`/api/groups/${groupId}/quiz-set-folders`)
  return res.data.folders
}

export async function createFolder(groupId: string, name: string, color?: string): Promise<QuizSetFolder> {
  const res = await api.post(`/api/groups/${groupId}/quiz-set-folders`, { name, color })
  return res.data.folder
}

export async function deleteFolder(groupId: string, folderId: string): Promise<void> {
  await api.delete(`/api/groups/${groupId}/quiz-set-folders/${folderId}`)
}

export async function createLiveRoomFromQuizSet(
  groupId: string,
  body: { quizSetId: string; mode?: RoomMode; timePerQuestion?: number }
) {
  const res = await api.post(`/api/groups/${groupId}/live-rooms`, body)
  return res.data.room
}

export const MODE_LABELS: Record<RoomMode, {
  vi: string; emoji: string; min: number; even?: boolean;
  cssClass: string; tagline: string;
}> = {
  SPEED_RACE:           { vi: 'Speed Race',    emoji: '⚡',  min: 1,  cssClass: 'qs-mode-speed', tagline: 'Vui nhộn · Thi tốc độ trả lời đúng' },
  GROUP_LIVE_SEQUENTIAL:{ vi: 'Sequential',    emoji: '📚',  min: 1,  cssClass: 'qs-mode-seq',   tagline: 'Lớp học sâu · Host dẫn dắt từng câu' },
  TEAM_VS_TEAM:         { vi: 'Team vs Team',  emoji: '⚔️', min: 6, even: true, cssClass: 'qs-mode-team', tagline: 'Đối kháng · 2 đội thi với nhau' },
  BATTLE_ROYALE:        { vi: 'Battle Royale', emoji: '💀',  min: 4,  cssClass: 'qs-mode-br',    tagline: 'Kịch tính · Sai là loại' },
  SUDDEN_DEATH:         { vi: 'Sudden Death',  emoji: '🥊',  min: 10, cssClass: 'qs-mode-sd',    tagline: 'Final 1v1 · Quyết tử' },
}

export function getModeAvailability(mode: RoomMode, total: number): { available: boolean; reason?: string } {
  const cfg = MODE_LABELS[mode]
  if (total < cfg.min) return { available: false, reason: `Cần ≥${cfg.min} câu hỏi` }
  if (cfg.even && total % 2 !== 0) return { available: false, reason: `Cần số câu chẵn` }
  return { available: true }
}
