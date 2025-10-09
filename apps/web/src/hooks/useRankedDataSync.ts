import { useEffect, useState } from 'react'
import { api } from '../api/client'

interface RankedData {
  date: string
  livesRemaining: number
  questionsCounted: number
  pointsToday: number
  askedQuestionIdsToday?: string[]
}

export const useRankedDataSync = () => {
  const [isInitialized, setIsInitialized] = useState(false)

  const restoreFromServer = async (): Promise<RankedData | null> => {
    try {
      const res = await api.get('/api/me/ranked-status')
      const serverData = res.data
      
      if (serverData && serverData.date) {
        const today = new Date().toISOString().slice(0, 10)
        
        // Only restore if it's today's data
        if (serverData.date === today) {
          const rankedData: RankedData = {
            date: today,
            livesRemaining: serverData.livesRemaining || 30,
            questionsCounted: serverData.questionsCounted || 0,
            pointsToday: serverData.pointsToday || 0,
            askedQuestionIdsToday: serverData.askedQuestionIdsToday || []
          }
          
          // Restore to localStorage
          localStorage.setItem('rankedSnapshot', JSON.stringify(rankedData))
          
          // Also restore rankedProgress for consistency
          const rankedProgress = {
            date: today,
            livesRemaining: serverData.livesRemaining || 30,
            questionsCounted: serverData.questionsCounted || 0,
            pointsToday: serverData.pointsToday || 0,
            cap: serverData.cap || 500,
            dailyLives: serverData.dailyLives || 30,
          }
          localStorage.setItem('rankedProgress', JSON.stringify(rankedProgress))
          
          if (rankedData.askedQuestionIdsToday && rankedData.askedQuestionIdsToday.length > 0) {
            localStorage.setItem('askedQuestionIds', JSON.stringify(rankedData.askedQuestionIdsToday))
          }
          
          console.log('Restored ranked data from server:', rankedData)
          return rankedData
        }
      }
    } catch (error) {
      console.error('Failed to restore ranked data from server:', error)
    }
    
    return null
  }
  
  // Enhanced restore with fallback to session data
  const restoreWithFallback = async (): Promise<RankedData | null> => {
    // First try to restore from server
    const serverData = await restoreFromServer()
    if (serverData) {
      return serverData
    }
    
    // If server restore fails, try to restore from any remaining session data
    try {
      const today = new Date().toISOString().slice(0, 10)
      
      // Check if there's any session data in memory that we can recover
      const sessionData = localStorage.getItem('sessionBackup')
      if (sessionData) {
        const parsed = JSON.parse(sessionData)
        if (parsed.date === today) {
          console.log('Restoring from session backup:', parsed)
          localStorage.setItem('rankedSnapshot', JSON.stringify(parsed))
          localStorage.setItem('rankedProgress', JSON.stringify(parsed))
          return parsed
        }
      }
    } catch (error) {
      console.warn('Failed to restore from session backup:', error)
    }
    
    return null
  }

  const checkAndRestore = async () => {
    const today = new Date().toISOString().slice(0, 10)
    
    // Check if we have today's data in localStorage
    const rankedSnapshot = localStorage.getItem('rankedSnapshot')
    const rankedProgress = localStorage.getItem('rankedProgress')
    const lastAskedDate = localStorage.getItem('lastAskedDate')
    
    console.log('=== checkAndRestore DEBUG ===')
    console.log('rankedSnapshot:', rankedSnapshot)
    console.log('rankedProgress:', rankedProgress)
    console.log('lastAskedDate:', lastAskedDate)
    console.log('today:', today)
    
    // If no data or different day, try to restore from server
    if (!rankedSnapshot || !rankedProgress || lastAskedDate !== today) {
      console.log('No localStorage data found or different day, attempting to restore from server...')
      const restored = await restoreWithFallback()
      
      if (restored) {
        console.log('Successfully restored data from server or backup')
        // Set lastAskedDate to today
        localStorage.setItem('lastAskedDate', today)
      } else {
        console.log('Failed to restore from server, setting defaults for new day')
        // Set defaults for new day
        const defaultData = {
          date: today,
          livesRemaining: 30,
          questionsCounted: 0,
          pointsToday: 0,
          cap: 500,
          dailyLives: 30,
        }
        localStorage.setItem('rankedSnapshot', JSON.stringify(defaultData))
        localStorage.setItem('rankedProgress', JSON.stringify(defaultData))
        localStorage.setItem('lastAskedDate', today)
      }
    } else {
      // Check if localStorage data is valid (has progress)
      try {
        const snapshotData = JSON.parse(rankedSnapshot)
        console.log('localStorage snapshot data:', snapshotData)
        
        if (snapshotData.questionsCounted === 0 && snapshotData.pointsToday === 0) {
          console.log('localStorage has no progress, attempting to restore from server...')
          const restored = await restoreWithFallback()
          if (restored) {
            console.log('Successfully restored progress from server or backup')
            localStorage.setItem('lastAskedDate', today)
          }
        } else {
          console.log('localStorage has valid progress, using it')
        }
      } catch (error) {
        console.warn('Failed to parse localStorage data:', error)
        // If parsing fails, try to restore from server
        console.log('localStorage data corrupted, attempting to restore from server...')
        const restored = await restoreWithFallback()
        if (restored) {
          console.log('Successfully restored data from server or backup after corruption')
          localStorage.setItem('lastAskedDate', today)
        }
      }
    }
    
    setIsInitialized(true)
  }

  useEffect(() => {
    checkAndRestore()
    
    // Listen for localStorage clear events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === null) {
        // localStorage was cleared
        console.log('localStorage was cleared, restoring data...')
        checkAndRestore()
      }
    }
    
    // Listen for custom clear event
    const handleClearEvent = () => {
      console.log('Custom clear event detected, restoring data...')
      checkAndRestore()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('localStorageCleared', handleClearEvent)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorageCleared', handleClearEvent)
    }
  }, [])

  // Periodic sync to prevent data loss
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const rankedSnapshot = localStorage.getItem('rankedSnapshot')
        
        if (rankedSnapshot) {
          const data = JSON.parse(rankedSnapshot)
          if (data.date === today && (data.questionsCounted > 0 || data.pointsToday > 0)) {
            // Sync current progress to server
            await api.post('/api/ranked/sync-progress', {
              livesRemaining: data.livesRemaining,
              questionsCounted: data.questionsCounted,
              pointsToday: data.pointsToday,
              currentBook: data.currentBook || 'Genesis',
              currentBookIndex: data.currentBookIndex || 0,
              isPostCycle: data.isPostCycle || false,
              currentDifficulty: data.currentDifficulty || 'all'
            })
            console.log('Periodic sync completed')
          }
        }
      } catch (error) {
        console.warn('Periodic sync failed:', error)
      }
    }, 30000) // Sync every 30 seconds
    
    return () => clearInterval(syncInterval)
  }, [])

  return {
    isInitialized,
    restoreFromServer,
    restoreWithFallback
  }
}
