// MLR — Shared types for the Multiplayer Lobby page + sub-components.

import type { TFunction } from 'i18next'

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
  /** QP-9: TRUE = Đấu Nhanh room (no Quản trò, indigo card variant). */
  quickMatch?: boolean
}

export const DIFFICULTY_CONFIG: Record<RoomDifficulty, { labelKey: string; color: string; bg: string }> = {
  EASY:   { labelKey: 'multiplayer.difficulty.easy',   color: '#97C459', bg: 'rgba(99,153,34,0.15)' },
  MEDIUM: { labelKey: 'multiplayer.difficulty.medium', color: '#ff8c42', bg: 'rgba(255,140,66,0.15)' },
  HARD:   { labelKey: 'multiplayer.difficulty.hard',   color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
  MIXED:  { labelKey: 'multiplayer.difficulty.mixed',  color: '#e8a832', bg: 'rgba(232,168,50,0.15)' },
}

const BOOK_SCOPE_KEYS: Record<string, string> = {
  ALL: 'multiplayer.book.all',
  OLD_TESTAMENT: 'multiplayer.book.oldTestament',
  NEW_TESTAMENT: 'multiplayer.book.newTestament',
  GOSPELS: 'multiplayer.book.gospels',
  EPISTLES: 'multiplayer.book.epistles',
}

export function formatBookScope(t: TFunction, bookScope: string): string {
  const key = BOOK_SCOPE_KEYS[bookScope?.toUpperCase()]
  if (key) return t(key)
  return bookScope || t('multiplayer.book.fallback')
}

export function formatRelativeTime(t: TFunction, createdAt: string): string {
  if (!createdAt) return t('multiplayer.time.justCreated')
  const ts = new Date(createdAt).getTime()
  if (!Number.isFinite(ts)) return t('multiplayer.time.justCreated')
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return t('multiplayer.time.justCreated')
  if (mins < 60) return t('multiplayer.time.minutesAgo', { count: mins })
  return t('multiplayer.time.hoursAgo', { count: Math.floor(mins / 60) })
}
