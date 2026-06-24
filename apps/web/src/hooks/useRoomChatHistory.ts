import { useEffect } from 'react'
import { api } from '../api/client'
import { useRoomChatStore, type RoomChatMessage } from '../store/roomChatStore'

/**
 * MPC-7 — hydrate the shared chat store from the server's Redis history on
 * mount, so a page reload (or late join) on the lobby / results screen recovers
 * the conversation instead of starting empty. Best-effort: a failed fetch just
 * leaves whatever live messages have already arrived.
 */
const fmtTime = (ts?: number): string | undefined =>
  typeof ts === 'number'
    ? new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : undefined

export function useRoomChatHistory(roomId?: string | null, hostName?: string | null) {
  const setMessages = useRoomChatStore(s => s.setMessages)
  useEffect(() => {
    if (!roomId) return
    let cancelled = false
    api.get(`/api/rooms/${roomId}/chat`)
      .then(res => {
        if (cancelled) return
        const raw = res.data?.messages
        if (!Array.isArray(raw)) return
        const msgs: RoomChatMessage[] = raw.map((m: Record<string, unknown>) => ({
          sender: String(m.sender ?? ''),
          text: String(m.text ?? ''),
          isSystem: m.isSystem === true,
          isHost: hostName != null && m.sender === hostName,
          time: fmtTime(typeof m.ts === 'number' ? m.ts : undefined),
        }))
        setMessages(roomId, msgs)
      })
      .catch(() => { /* chat history is non-critical */ })
    return () => { cancelled = true }
  }, [roomId, hostName, setMessages])
}
