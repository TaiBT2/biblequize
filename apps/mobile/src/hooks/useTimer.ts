import { useState, useEffect, useCallback, useRef } from 'react'

interface UseTimerOptions {
  totalTime: number
  autoStart?: boolean
  onTimeout?: () => void
}

interface UseTimerReturn {
  timeLeft: number
  isRunning: boolean
  start: () => void
  pause: () => void
  reset: () => void
}

export function useTimer({
  totalTime,
  autoStart = false,
  onTimeout,
}: UseTimerOptions): UseTimerReturn {
  const [timeLeft, setTimeLeft] = useState(totalTime)
  const [isRunning, setIsRunning] = useState(autoStart)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return

    const timer = setTimeout(() => {
      setTimeLeft((t) => {
        const next = t - 1
        if (next <= 0) {
          setIsRunning(false)
          onTimeoutRef.current?.()
        }
        return Math.max(0, next)
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [isRunning, timeLeft])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => {
    setTimeLeft(totalTime)
    setIsRunning(false)
  }, [totalTime])

  return { timeLeft, isRunning, start, pause, reset }
}
