import { useEffect, useState } from 'react'
import { api } from '../api/client'

export const useRankedDataSync = () => {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10)

        // Clear stale asked question IDs from a previous day
        const lastAskedDate = localStorage.getItem('lastAskedDate')
        if (lastAskedDate !== today) {
          localStorage.removeItem('askedQuestionIds')
          localStorage.setItem('lastAskedDate', today)
        }

        // Sync today's asked question IDs from server to localStorage
        const res = await api.get('/api/me/ranked-status')
        const serverData = res.data
        if (serverData?.askedQuestionIdsToday?.length > 0) {
          localStorage.setItem('askedQuestionIds', JSON.stringify(serverData.askedQuestionIdsToday))
        }
      } catch (error) {
        console.warn('Failed to initialize ranked data:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    init()
  }, [])

  return { isInitialized }
}
