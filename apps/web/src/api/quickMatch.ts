// QP-11 — Frontend helpers for the Đấu Nhanh (Quick Match) flow.
// Wraps POST /api/rooms/quick-match with typed config + canonical error
// codes from QP-2. Error toaster expects a `(msg: string, severity?:
// 'info'|'warning'|'error') => void` callback so the caller can use any
// notification system (toast lib, ErrorContext, alert, etc.).

import { api } from './client'

export type QuickMatchMode = 'SPEED_RACE' | 'BATTLE_ROYALE' | 'TEAM_VS_TEAM' | 'SUDDEN_DEATH'
export type QuickMatchSource = 'DATABASE' | 'AI_GENERATED'

export interface QuickMatchConfig {
  mode: QuickMatchMode
  bookScope: string         // 'ALL' | 'OLD_TESTAMENT' | 'NEW_TESTAMENT' | 'GOSPELS' | book name
  questionCount: number     // 5–20
  timePerQuestion: number   // 10–60
  maxPlayers?: number       // 2–100 (default 10); host cap for the lobby
  source: QuickMatchSource
  // AI source optional scope fields — only used when source = AI_GENERATED
  chapterFrom?: number
  chapterTo?: number
  verseFrom?: number
  verseTo?: number
  language?: 'vi' | 'en'
}

export interface QuickMatchResponse {
  success: true
  room: { id: string; roomCode: string; mode: string; quickMatch: boolean; [k: string]: unknown }
  viewerUserId: string
  quickMatch: true
  remainingToday: number
}

export interface QuickMatchError {
  success: false
  error: 'DAILY_CAP_REACHED' | 'AI_TIER_LOCKED' | 'AI_GENERATION_INSUFFICIENT' | 'ALREADY_IN_ANOTHER_ROOM' | string
  message: string
  remaining?: number
  currentTier?: number
}

export async function triggerQuickMatch(config: QuickMatchConfig): Promise<QuickMatchResponse> {
  const res = await api.post('/api/rooms/quick-match', config)
  return res.data as QuickMatchResponse
}

/** Maps known quick-match error codes to friendly Vietnamese messages.
 *  Returns the message string; caller surfaces via toast / inline error. */
export function describeQuickMatchError(error: unknown): { code: string; message: string } {
  const data = (error as { response?: { data?: QuickMatchError } })?.response?.data
  const code = data?.error ?? 'UNKNOWN'
  switch (code) {
    case 'DAILY_CAP_REACHED':
      return { code, message: data?.message ?? 'Đã hết lượt Đấu Nhanh hôm nay. Thử lại sau 0h UTC.' }
    case 'AI_TIER_LOCKED':
      return { code, message: data?.message ?? 'Mở khóa AI sinh câu hỏi từ Tier 4 (Hiền Triết).' }
    case 'AI_GENERATION_INSUFFICIENT':
      return { code, message: data?.message ?? 'AI chưa sinh đủ câu hỏi. Vui lòng thử lại hoặc dùng nguồn Hệ thống.' }
    case 'ALREADY_IN_ANOTHER_ROOM':
      return { code, message: 'Bạn đang trong phòng khác. Hãy rời phòng cũ trước.' }
    default:
      return { code, message: data?.message ?? 'Không thể vào trận. Vui lòng thử lại.' }
  }
}
