import { useEffect, useState } from 'react'

// Lightweight online status without NetInfo dependency
// Uses fetch to a known endpoint to detect connectivity
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    let mounted = true

    const check = async () => {
      try {
        const controller = new AbortController()
        setTimeout(() => controller.abort(), 5000)
        await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          signal: controller.signal,
        })
        if (mounted) setIsOnline(true)
      } catch {
        if (mounted) setIsOnline(false)
      }
    }

    check()
    const interval = setInterval(check, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { isOnline }
}
