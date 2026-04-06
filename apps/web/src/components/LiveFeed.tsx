import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface FeedEvent {
  id: number
  playerId: string
  playerName: string
  isCorrect: boolean
  reactionTimeMs: number
}

interface LiveFeedProps {
  incoming: { playerId: string; username: string; isCorrect: boolean; reactionTimeMs: number } | null
  myId: string
}

const CORRECT_KEYS = [
  'liveFeed.correct1',
  'liveFeed.correct2',
  'liveFeed.correct3',
  'liveFeed.correct4',
]

const WRONG_KEYS = [
  'liveFeed.wrong1',
  'liveFeed.wrong2',
  'liveFeed.wrong3',
]

export default function LiveFeed({ incoming, myId }: LiveFeedProps) {
  const { t } = useTranslation()
  const [events, setEvents] = useState<FeedEvent[]>([])

  useEffect(() => {
    if (!incoming || incoming.playerId === myId) return

    const id = Date.now() + Math.random()
    const event: FeedEvent = {
      id,
      playerId: incoming.playerId,
      playerName: incoming.username,
      isCorrect: incoming.isCorrect,
      reactionTimeMs: incoming.reactionTimeMs,
    }

    setEvents(prev => [...prev.slice(-2), event])

    const timer = setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== id))
    }, 3000)
    return () => clearTimeout(timer)
  }, [incoming, myId])

  if (events.length === 0) return null

  return (
    <div className="absolute top-20 right-4 space-y-1 z-40 pointer-events-none">
      {events.map(e => {
        const time = (e.reactionTimeMs / 1000).toFixed(1)
        const keys = e.isCorrect ? CORRECT_KEYS : WRONG_KEYS
        const key = keys[Math.floor(Math.random() * keys.length)]
        const msg = t(key, { name: e.playerName, time })

        return (
          <div
            key={e.id}
            className={`text-xs px-3 py-1.5 rounded-full animate-slideInRight backdrop-blur-sm
              ${e.isCorrect
                ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                : 'bg-red-500/20 text-red-400 border border-red-500/20'
              }`}
          >
            {msg}
          </div>
        )
      })}
    </div>
  )
}
