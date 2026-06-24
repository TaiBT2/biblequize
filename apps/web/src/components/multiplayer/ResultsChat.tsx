import { useEffect, useRef, useState } from 'react'
import { ChatDrawer } from './RoomChat'
import { useRoomChatStore, selectRoomMessages } from '../../store/roomChatStore'

/**
 * MPC-4 — chat affordance on the end-game results screen. Reuses the lobby's
 * ChatDrawer + the shared roomChatStore, so the conversation from the lobby is
 * replayed here and players can keep discussing after the match. Sending is
 * delegated to the parent (RoomQuiz owns the live STOMP `send`).
 */
export default function ResultsChat({
  roomId,
  onSend,
}: {
  roomId: string
  onSend: (text: string) => void
}) {
  const messages = useRoomChatStore(selectRoomMessages(roomId))
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [unread, setUnread] = useState(0)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const seenRef = useRef(messages.length)

  // Unread badge: count new messages since the drawer was last open.
  useEffect(() => {
    if (open) {
      seenRef.current = messages.length
      setUnread(0)
    } else if (messages.length > seenRef.current) {
      setUnread(messages.length - seenRef.current)
    }
  }, [messages.length, open])

  // Keep the latest message in view while the drawer is open.
  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, open])

  const handleSend = (text: string) => {
    if (!text.trim()) return
    onSend(text.trim())
    setInput('')
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở trò chuyện"
          data-testid="results-chat-fab"
          className="fixed right-4 lg:right-6 bottom-20 lg:bottom-24 w-12 h-12 grid place-items-center rounded-full z-40 bg-bq-white border border-bq-amber/30 text-bq-amberd shadow-bq-soft"
        >
          <span className="material-symbols-outlined">chat_bubble</span>
          {unread > 0 && (
            <span
              className="absolute -top-1 -right-1 px-1.5 rounded-full text-[9px] font-extrabold text-white"
              style={{ background: 'var(--bq-ruby)', minWidth: 16, textAlign: 'center' }}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}
      {open && (
        <ChatDrawer
          messages={messages}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          onClose={() => setOpen(false)}
          chatEndRef={chatEndRef}
        />
      )}
    </>
  )
}
