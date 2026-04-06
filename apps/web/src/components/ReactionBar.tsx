import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

const REACTIONS = ['👏', '😂', '😱', '🔥', '💪', '🙏']

interface FloatingReaction {
  id: number
  reaction: string
  senderName: string
  x: number
}

interface ReactionBarProps {
  onSend: (reaction: string) => void
  incoming: Array<{ senderId: string; senderName: string; reaction: string }> | null
}

export default function ReactionBar({ onSend, incoming }: ReactionBarProps) {
  const [floating, setFloating] = useState<FloatingReaction[]>([])
  const [cooldown, setCooldown] = useState(false)

  const handleSend = useCallback((emoji: string) => {
    if (cooldown) return
    onSend(emoji)
    setCooldown(true)
    setTimeout(() => setCooldown(false), 1500)
  }, [onSend, cooldown])

  // Show floating reaction when incoming
  useEffect(() => {
    if (!incoming) return
    const latest = incoming[incoming.length - 1]
    if (!latest) return

    const id = Date.now() + Math.random()
    const x = 20 + Math.random() * 60 // Random x position 20-80%
    setFloating(prev => [...prev.slice(-5), { id, ...latest, x }])

    const timer = setTimeout(() => {
      setFloating(prev => prev.filter(f => f.id !== id))
    }, 2000)
    return () => clearTimeout(timer)
  }, [incoming])

  return (
    <>
      {/* Floating reactions */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {floating.map(f => (
          <div
            key={f.id}
            className="absolute animate-floatUp"
            style={{ left: `${f.x}%`, bottom: '20%' }}
          >
            <span className="text-4xl">{f.reaction}</span>
            <span className="block text-[10px] text-white/50 text-center">{f.senderName}</span>
          </div>
        ))}
      </div>

      {/* Reaction bar */}
      <div className="flex gap-2 justify-center py-2">
        {REACTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => handleSend(emoji)}
            disabled={cooldown}
            className={`text-2xl hover:scale-125 transition-transform active:scale-90
              ${cooldown ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  )
}
