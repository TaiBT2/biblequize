import { create } from 'zustand'

/**
 * MPC-1 — shared multiplayer chat history, keyed by roomId.
 *
 * Room chat lives in RoomLobby local state, which unmounts on Lobby → Quiz →
 * Results navigation (chat would be lost). This module-level store survives
 * those unmounts so the end-game results screen can show the SAME conversation
 * that happened in the lobby. Ephemeral (in-memory only, no persist) — mirrors
 * the backend's ephemeral STOMP chat; a full page reload starts fresh.
 */

export type RoomChatMessage = {
  sender: string
  text: string
  isHost?: boolean
  isSystem?: boolean
  time?: string
}

/** Keep history bounded so a long-lived tab can't grow without limit. */
const MAX_MESSAGES = 200

/** Stable empty array so selectors don't churn referential identity. */
const EMPTY: RoomChatMessage[] = []

interface RoomChatState {
  messagesByRoom: Record<string, RoomChatMessage[]>
  appendMessage: (roomId: string, msg: RoomChatMessage) => void
  resetRoom: (roomId: string) => void
}

export const useRoomChatStore = create<RoomChatState>((set) => ({
  messagesByRoom: {},
  appendMessage: (roomId, msg) =>
    set((state) => {
      if (!roomId) return state
      const prev = state.messagesByRoom[roomId] ?? EMPTY
      const next = [...prev, msg].slice(-MAX_MESSAGES)
      return { messagesByRoom: { ...state.messagesByRoom, [roomId]: next } }
    }),
  resetRoom: (roomId) =>
    set((state) => {
      if (!state.messagesByRoom[roomId]) return state
      const rest = { ...state.messagesByRoom }
      delete rest[roomId]
      return { messagesByRoom: rest }
    }),
}))

/** Selector: messages for one room (stable empty fallback). */
export const selectRoomMessages =
  (roomId?: string | null) =>
  (state: RoomChatState): RoomChatMessage[] =>
    roomId ? state.messagesByRoom[roomId] ?? EMPTY : EMPTY
