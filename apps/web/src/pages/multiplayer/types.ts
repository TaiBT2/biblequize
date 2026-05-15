// MLR — Shared types for the Multiplayer Lobby page + sub-components.

export type RoomMode = 'SPEED_RACE' | 'BATTLE_ROYALE' | 'TEAM_VS_TEAM' | 'SUDDEN_DEATH'
export type RoomStatus = 'LOBBY' | 'IN_PROGRESS' | 'ENDED' | 'CANCELLED'
export type RoomDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED'
export type SortOption = 'newest' | 'filling' | 'difficulty'

export interface PublicRoom {
  id: string
  roomCode: string
  roomName: string
  mode: RoomMode
  status: RoomStatus
  isPublic: boolean
  currentPlayers: number
  maxPlayers: number
  questionCount: number
  timePerQuestion: number
  difficulty: RoomDifficulty
  bookScope: string
  hostName: string
  createdAt: string
  playerInitials: string[]
  /** Backend-computed: true if THIS viewer can click join/continue. */
  joinable?: boolean
}

export const DIFFICULTY_CONFIG: Record<RoomDifficulty, { label: string; color: string; bg: string }> = {
  EASY:   { label: 'Dễ',   color: '#97C459', bg: 'rgba(99,153,34,0.15)' },
  MEDIUM: { label: 'TB',   color: '#ff8c42', bg: 'rgba(255,140,66,0.15)' },
  HARD:   { label: 'Khó',  color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
  MIXED:  { label: 'Tổng hợp', color: '#e8a832', bg: 'rgba(232,168,50,0.15)' },
}

export function formatBookScope(bookScope: string): string {
  const map: Record<string, string> = {
    ALL: 'Tất cả 66 sách',
    OLD_TESTAMENT: 'Cựu Ước (39 sách)',
    NEW_TESTAMENT: 'Tân Ước (27 sách)',
    GOSPELS: '4 Phúc Âm',
    EPISTLES: '21 Thư Tín',
  }
  return map[bookScope?.toUpperCase()] ?? bookScope ?? 'Kinh Thánh'
}

export function formatRelativeTime(createdAt: string): string {
  if (!createdAt) return 'Vừa tạo'
  const ts = new Date(createdAt).getTime()
  if (!Number.isFinite(ts)) return 'Vừa tạo'
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'Vừa tạo'
  if (mins < 60) return `${mins} phút trước`
  return `${Math.floor(mins / 60)} giờ trước`
}
