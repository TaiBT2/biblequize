import { useEffect, useState } from 'react'

function computeRemaining(): string {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setHours(24, 0, 0, 0)
  const diff = tomorrow.getTime() - now.getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/**
 * setInterval-based countdown text "HH:MM:SS" tới local midnight.
 * Shared bởi FeaturedDailyCard + DailyCompletedStrip.
 */
export function useCountdownToMidnight(): string {
  const [text, setText] = useState(computeRemaining)

  useEffect(() => {
    const id = setInterval(() => setText(computeRemaining()), 1000)
    return () => clearInterval(id)
  }, [])

  return text
}
