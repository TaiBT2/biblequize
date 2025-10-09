import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import BookProgress from '../components/BookProgress'
import { useAuth } from '../contexts/AuthContext'
import { useRankedDataSync } from '../hooks/useRankedDataSync'

interface RankedStatus {
  date: string
  livesRemaining: number
  questionsCounted: number
  pointsToday: number
  cap: number
  dailyLives: number
  currentBook: string
  currentBookIndex: number
  isPostCycle: boolean
  currentDifficulty: string
  nextBook?: string
  resetAt: string
  bookProgress?: {
    currentIndex: number
    totalBooks: number
    currentBook: string
    nextBook: string
    isCompleted: boolean
    progressPercentage: number
  }
  questionsInCurrentBook?: number
  correctAnswersInCurrentBook?: number
  askedQuestionIdsToday?: string[]
  askedQuestionCountToday?: number
}

export default function Ranked() {
  const [rankedStatus, setRankedStatus] = useState<RankedStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isQuizStarted, setIsQuizStarted] = useState(false)
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { isInitialized } = useRankedDataSync()


  const fetchStatus = async () => {
    setIsLoading(true)
    try {
      // First, try to get data from localStorage (most recent)
      const today = new Date().toISOString().slice(0, 10)
      const localStorageSnapshot = JSON.parse(localStorage.getItem('rankedSnapshot') || '{}')
      const localStorageProgress = JSON.parse(localStorage.getItem('rankedProgress') || '{}')
      
      console.log('=== RANKED STATUS DEBUG ===')
      console.log('localStorage snapshot:', localStorageSnapshot)
      console.log('localStorage progress:', localStorageProgress)
      
      // Always fetch from server first to get the most up-to-date data
      console.log('Fetching fresh data from server API...')
      const res = await api.get('/api/me/ranked-status')
      console.log('Raw server response:', res.data)
      console.log('questionsCounted from server:', res.data?.questionsCounted)
      console.log('pointsToday from server:', res.data?.pointsToday)
      
      let merged: any = res.data
      
      // If server data is not available, try localStorage as fallback
      if (!merged || !merged.date) {
        console.log('Server data not available, trying localStorage fallback...')
        if (localStorageSnapshot.date === today && 
            (localStorageSnapshot.questionsCounted > 0 || localStorageSnapshot.pointsToday > 0)) {
          console.log('Using localStorage data as fallback')
          merged = {
            date: today,
            livesRemaining: localStorageSnapshot.livesRemaining || 30,
            questionsCounted: localStorageSnapshot.questionsCounted || 0,
            pointsToday: localStorageSnapshot.pointsToday || 0,
            cap: localStorageProgress.cap || 500,
            dailyLives: localStorageProgress.dailyLives || 30,
            currentBook: 'Genesis',
            currentBookIndex: 0,
            isPostCycle: false,
            currentDifficulty: 'all'
          }
        }
      }
      
      // Ensure merged is not null
      if (!merged) {
        merged = {
          date: today,
          livesRemaining: 30,
          questionsCounted: 0,
          pointsToday: 0,
          cap: 500,
          dailyLives: 30,
          currentBook: 'Genesis',
          currentBookIndex: 0,
          isPostCycle: false,
          currentDifficulty: 'all'
        }
      }
      
      // Clear localStorage askedQuestionIds if it's a new day
      const lastAskedDate = localStorage.getItem('lastAskedDate')
      if (lastAskedDate !== today) {
        localStorage.removeItem('askedQuestionIds')
        localStorage.setItem('lastAskedDate', today)
      }
      
      // Always restore server data to localStorage to ensure consistency
      if (merged && merged.date === today) {
        try {
          // Restore rankedSnapshot from server data
          const serverSnapshot = {
            date: today,
            livesRemaining: merged.livesRemaining || 30,
            questionsCounted: merged.questionsCounted || 0,
            pointsToday: merged.pointsToday || 0
          }
          localStorage.setItem('rankedSnapshot', JSON.stringify(serverSnapshot))
          
          // Restore rankedProgress from server data
          const serverProgress = {
            date: today,
            livesRemaining: merged.livesRemaining || 30,
            questionsCounted: merged.questionsCounted || 0,
            pointsToday: merged.pointsToday || 0,
            cap: merged.cap || 500,
            dailyLives: merged.dailyLives || 30
          }
          localStorage.setItem('rankedProgress', JSON.stringify(serverProgress))
          
          // Restore askedQuestionIds from server data
          if (merged.askedQuestionIdsToday && Array.isArray(merged.askedQuestionIdsToday)) {
            localStorage.setItem('askedQuestionIds', JSON.stringify(merged.askedQuestionIdsToday))
          }
          
          console.log('Restored server data to localStorage:', serverSnapshot)
        } catch (e) {
          console.warn('Failed to restore server data to localStorage:', e)
        }
      }
      
      console.log('Final merged data:', {
        livesRemaining: merged.livesRemaining,
        questionsCounted: merged.questionsCounted,
        pointsToday: merged.pointsToday
      })
      setRankedStatus(merged)
    } catch (e) {
      console.error('Failed to load ranked status', e)
      setRankedStatus(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Wait for data sync to complete before initial load
    if (isInitialized) {
      fetchStatus()
    }
  }, [isInitialized])

  useEffect(() => {
    // Auto-refresh only when page becomes visible (user comes back from quiz)
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized) {
        fetchStatus()
      }
    }
    
    // Listen for custom events (real-time updates from quiz)
    const handleRankedStatusUpdate = (e: CustomEvent) => {
      try {
        const updatedStatus = e.detail
        setRankedStatus(prev => ({
          ...prev,
          ...updatedStatus
        }))
      } catch (err) {
        console.warn('Failed to parse ranked status from custom event:', err)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('rankedStatusUpdate', handleRankedStatusUpdate as EventListener)
    
    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('rankedStatusUpdate', handleRankedStatusUpdate as EventListener)
    }
  }, [isInitialized])

  const startRankedQuiz = async () => {
    try {
      const res = await api.post('/api/ranked/sessions')
      const sessionId = res.data.sessionId
      // Fetch ranked questions (always 10, avoid repeats using excludeIds and fallback)
      let questions: any[] = []
      try {
        // Combine server-side askedQuestionIdsToday with local askedQuestionIds
        const serverAskedIds = Array.isArray(rankedStatus?.askedQuestionIdsToday) ? rankedStatus!.askedQuestionIdsToday! : []
        const localAskedIds = JSON.parse(localStorage.getItem('askedQuestionIds') || '[]')
        const allAskedIds = [...new Set([...serverAskedIds, ...localAskedIds])]
        const exclude = new Set<string>(allAskedIds)
        
        console.log('=== QUESTION EXCLUSION DEBUG ===')
        console.log('Server asked IDs:', serverAskedIds.length, serverAskedIds)
        console.log('Local asked IDs:', localAskedIds.length, localAskedIds)
        console.log('Combined exclude set:', allAskedIds.length, allAskedIds)
        // Helper to add unique questions and update exclude set
        const addUnique = (items: any[]) => {
          for (const q of items || []) {
            if (!q || !q.id) continue
            if (exclude.has(q.id)) continue
            if (questions.find(x => x.id === q.id)) continue
            questions.push(q)
            exclude.add(q.id)
            console.log(`Added question ${q.id} to quiz. Total: ${questions.length}`)
            if (questions.length >= 10) break
          }
        }
        // First attempt: currentBook + difficulty (if not 'all')
        if (questions.length < 10) {
          const remaining1 = 10 - questions.length
          const params1: any = { limit: remaining1, excludeIds: Array.from(exclude) }
          if (rankedStatus?.currentBook) params1.book = rankedStatus.currentBook
          if (rankedStatus?.currentDifficulty && rankedStatus.currentDifficulty !== 'all') params1.difficulty = rankedStatus.currentDifficulty
          const r1 = await api.get('/api/questions', { params: params1 })
          addUnique(r1.data || [])
        }
        // Second attempt: relax difficulty (book only)
        if (questions.length < 10 && rankedStatus?.currentBook) {
          const remaining2 = 10 - questions.length
          const params2: any = { limit: remaining2, book: rankedStatus.currentBook, excludeIds: Array.from(exclude) }
          const r2 = await api.get('/api/questions', { params: params2 })
          addUnique(r2.data || [])
        }
        // Final fallback: global pool
        if (questions.length < 10) {
          const remaining3 = 10 - questions.length
          const params3: any = { limit: remaining3, excludeIds: Array.from(exclude) }
          const r3 = await api.get('/api/questions', { params: params3 })
          addUnique(r3.data || [])
        }
      } catch (e) {
        console.error('Failed to fetch ranked questions', e)
      }
      setIsQuizStarted(true)
      navigate('/quiz', { state: { sessionId, mode: 'ranked', questions, showExplanation: false, isRanked: true } })
    } catch (e) {
      console.error('Failed to start ranked session', e)
      alert('Không thể bắt đầu xếp hạng, vui lòng thử lại')
    }
  }

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen neon-bg flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 left-20 text-5xl neon-orange opacity-20 animate-pulse">🏆</div>
        <div className="absolute bottom-20 right-20 text-5xl neon-pink opacity-20 animate-pulse">⚡</div>
        
        <div className="text-center">
          <div className="neon-card p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
            <p className="neon-text text-white">
              {!isInitialized ? 'Đang đồng bộ dữ liệu...' : 'Đang tải...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!rankedStatus) {
    return (
      <div className="min-h-screen neon-bg flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 left-20 text-5xl neon-red opacity-20 animate-pulse">❌</div>
        <div className="absolute bottom-20 right-20 text-5xl neon-blue opacity-20 animate-pulse">🔄</div>
        
        <div className="text-center">
          <div className="neon-card p-8">
            <p className="neon-text text-white mb-6">Không thể tải trạng thái xếp hạng</p>
            <Link 
              to="/" 
              className="neon-btn neon-btn-blue px-6 py-2"
            >
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const canPlay = Number(rankedStatus.livesRemaining) > 0 && Number(rankedStatus.questionsCounted) < Number(rankedStatus.cap)
  const progressPercentage = (Number(rankedStatus.questionsCounted) / Number(rankedStatus.cap)) * 100
  const safePointsToday = Number(rankedStatus.pointsToday ?? 0)
  
  console.log('Ranked Status Debug:', {
    livesRemaining: rankedStatus.livesRemaining,
    questionsCounted: rankedStatus.questionsCounted,
    pointsToday: rankedStatus.pointsToday,
    cap: rankedStatus.cap,
    canPlay: canPlay
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0E0B1A' }}>

      {/* Main Content */}
      <div className="flex items-center justify-center relative overflow-hidden py-8" style={{ zIndex: 1 }}>
      {/* Background Elements */}
        <div className="absolute top-10 left-10 text-4xl opacity-20 animate-pulse" style={{ color: '#FF8C42' }}>🏆</div>
        <div className="absolute top-20 right-20 text-4xl opacity-20 animate-pulse" style={{ color: '#FF6B9D' }}>⚡</div>
        <div className="absolute bottom-20 left-20 text-3xl opacity-15 animate-pulse" style={{ color: '#00FF88' }}>📈</div>
        <div className="absolute bottom-10 right-10 text-3xl opacity-15 animate-pulse" style={{ color: '#00FFFF' }}>🎯</div>
      
        <div className="max-w-6xl w-full mx-auto px-4 relative" style={{ zIndex: 2 }}>
        {/* Header */}
        <div className="text-center mb-12">
          <div className="p-8 rounded-2xl mb-8"
               style={{
                 background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
                 border: '2px solid #FF8C42',
                 boxShadow: '0 0 30px rgba(255, 140, 66, 0.3), inset 0 0 30px rgba(255, 140, 66, 0.1)',
                 backdropFilter: 'blur(10px)'
               }}>
            <h1 className="text-6xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #00FFFF 0%, #9333EA 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(0, 255, 255, 0.5)'
                }}>
              CHẾ ĐỘ XẾP HẠNG
            </h1>
            <p className="text-xl text-white opacity-90 mb-2">Leo hạng với 500 câu/ngày, {rankedStatus.dailyLives} mạng</p>
            <p className="text-lg text-yellow-300 font-semibold">Chứng tỏ sự am hiểu của bạn và chinh phục bảng vàng!</p>
          </div>
        </div>

        {/* Rewards Section - Premium Vitrine */}

        {/* Unified Daily Dashboard */}
        <div className="p-8 mb-8 rounded-2xl" style={{
          background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
          border: '2px solid #00FFFF',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: '#00FFFF', textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
            Thử Thách Xếp Hạng Hằng Ngày
          </h3>
          {/* Compact Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="neon-card p-4 text-center flex flex-col items-center justify-center">
              <div className="text-sm text-white/70 mb-1">Mạng còn lại</div>
              <div className="text-4xl font-black" style={{ color: '#FF6B9D' }}>{rankedStatus.livesRemaining}<span className="text-sm text-white/50"> / {rankedStatus.dailyLives}</span></div>
            </div>
            <div className="neon-card p-4 text-center flex flex-col items-center justify-center">
              <div className="text-sm text-white/70 mb-1">Câu đã tính</div>
              <div className="text-3xl font-black" style={{ color: '#00FFFF' }}>{rankedStatus.questionsCounted}<span className="text-sm text-white/50"> / {rankedStatus.cap}</span></div>
            </div>
            <div className="neon-card p-4 text-center flex flex-col items-center justify-center">
              <div className="text-sm text-white/70 mb-1">Điểm hôm nay</div>
              <div className="text-4xl font-black" style={{ color: '#FF8C42' }}>{safePointsToday}</div>
            </div>
            <div className="neon-card p-4 text-center flex flex-col items-center justify-center">
              <div className="text-sm text-white/70 mb-1">Sách hiện tại</div>
              <div className="text-xl font-black" style={{ color: '#00FF88' }}>{rankedStatus.currentBook}</div>
            </div>
          </div>

          {/* Daily Progress Bar */}
          <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden mb-8 relative">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-green-400 rounded-full transition-all duration-1000 relative" style={{ width: `${progressPercentage}%`, boxShadow: '0 0 15px rgba(0, 255, 255, 0.6)' }}>
              <div className="absolute right-0 top-0 w-2 h-full bg-white opacity-80 rounded-r-full"></div>
              <div className="absolute right-0 top-0 w-1 h-full bg-white opacity-100 rounded-r-full"></div>
              {/* Head glow dot */}
              <div className="absolute -right-1 -top-1 w-4 h-4 rounded-full" style={{ background: 'radial-gradient(circle, #ffffff 0%, #a5f3fc 40%, rgba(0,0,0,0) 70%)' }}></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
            {progressPercentage === 0 && (
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: 'radial-gradient(circle, #a5f3fc 0%, rgba(0,255,255,0.6) 60%, rgba(0,0,0,0) 70%)', boxShadow: '0 0 10px rgba(0,255,255,0.6)' }}></div>
            )}
          </div>
          <div className="flex justify-between text-white mb-8">
            <span className="font-bold" style={{ color: '#00FFFF' }}>{rankedStatus.questionsCounted} / {rankedStatus.cap} câu</span>
            <span className="font-bold" style={{ color: '#FF6B9D' }}>{Math.round(progressPercentage)}%</span>
          </div>

          {/* Sub-metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
            <div className="neon-card p-3 text-center">
              <div className="text-white/70">Sách hiện tại</div>
              <div className="font-semibold" style={{ color: '#00FF88' }}>{rankedStatus.currentBook}{rankedStatus.nextBook ? ` → ${rankedStatus.nextBook}` : ''}</div>
            </div>
            <div className="neon-card p-3 text-center">
              <div className="text-white/70">Tiến độ Kinh Thánh</div>
              <div className="font-semibold" style={{ color: '#00FFFF' }}>{Math.round(rankedStatus.bookProgress?.progressPercentage || 0)}%</div>
            </div>
            <div className="neon-card p-3 text-center">
              <div className="text-white/70">Tỉ lệ đúng hôm nay</div>
              <div className="font-semibold" style={{ color: '#FFD700' }}>{rankedStatus.questionsInCurrentBook && rankedStatus.questionsInCurrentBook > 0 ? Math.round(((rankedStatus.correctAnswersInCurrentBook || 0) / rankedStatus.questionsInCurrentBook) * 100) : 0}%</div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {!canPlay && (
          <div className="p-6 mb-8 rounded-2xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
                 border: '2px solid #FF8C42',
                 boxShadow: '0 0 30px rgba(255, 140, 66, 0.3), inset 0 0 30px rgba(255, 140, 66, 0.1)',
                 backdropFilter: 'blur(10px)'
               }}>
            <div className="flex items-start">
              <svg className="w-6 h-6 mt-1 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FF8C42' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-bold mb-2" style={{ color: '#FF8C42' }}>Không thể chơi xếp hạng</h4>
                <p className="text-white opacity-80">
                  {rankedStatus.livesRemaining === 0 
                    ? 'Bạn đã hết mạng. Hãy chờ reset ngày mai hoặc chơi luyện tập.'
                    : 'Bạn đã đạt giới hạn 500 câu/ngày. Hãy chờ reset ngày mai.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {rankedStatus.isPostCycle && (
          <div className="p-6 mb-8 rounded-2xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
                 border: '2px solid #FF6B9D',
                 boxShadow: '0 0 30px rgba(255, 107, 157, 0.3), inset 0 0 30px rgba(255, 107, 157, 0.1)',
                 backdropFilter: 'blur(10px)'
               }}>
            <div className="flex items-start">
              <svg className="w-6 h-6 mt-1 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FF6B9D' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h4 className="font-bold mb-2" style={{ color: '#FF6B9D' }}>Hậu chu kỳ</h4>
                <p className="text-white opacity-80">
                  Bạn đã hoàn thành tất cả sách! Bây giờ sẽ nhận câu hỏi khó từ bất kỳ sách nào.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center space-y-6">
          {canPlay ? (
            <button
              onClick={startRankedQuiz}
              className="px-16 py-6 text-2xl font-black rounded-2xl transition-all duration-300 hover:scale-110 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #00FFFF 0%, #22c55e 100%)',
                color: '#0E0B1A',
                boxShadow: '0 8px 30px rgba(0, 255, 255, 0.6)',
                border: '2px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
              <div className="relative flex items-center justify-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Bắt Đầu Xếp Hạng</span>
              </div>
            </button>
          ) : (
            <div className="flex justify-center gap-6">
              <button
                disabled
                className="px-12 py-4 text-xl font-bold rounded-xl opacity-50 cursor-not-allowed"
                style={{ border: '2px solid #00FFFF', color: '#00FFFF', background: 'transparent' }}
              >
                Không thể chơi xếp hạng
              </button>
              <Link
                to="/practice"
                className="px-12 py-4 text-xl font-bold rounded-xl transition-all duration-300 hover:scale-105"
                style={{ border: '2px solid #22c55e', color: '#22c55e', background: 'transparent' }}
              >
                Chuyển sang Luyện Tập
              </Link>
            </div>
          )}

          <div className="p-4 rounded-2xl" style={{
            background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
            border: '2px solid #00FFFF', boxShadow: '0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)', backdropFilter: 'blur(10px)'
          }}>
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#00FFFF' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white opacity-80">
                Reset hàng ngày lúc: <span className="font-bold" style={{ color: '#00FFFF' }}>{new Date(rankedStatus.resetAt).toLocaleTimeString('vi-VN')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center mt-8 space-y-4">
          {/* Primary Action */}
          <div>
          <Link 
            to="/" 
              className="inline-flex items-center px-8 py-3 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #00FF88 0%, #00FFFF 100%)',
                color: '#0E0B1A',
                boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4)'
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại trang chủ
          </Link>
          </div>
          
          {/* Secondary Actions */}
          <div className="flex justify-center gap-4">
          <Link 
            to="/leaderboard" 
              className="inline-flex items-center px-6 py-2 font-bold rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: 'transparent',
                color: '#00FFFF',
                border: '2px solid #00FFFF',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Bảng Xếp Hạng
          </Link>
          <button
            onClick={() => {
              setIsLoading(true)
              fetchStatus()
            }}
              className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: 'transparent',
                color: '#FF8C42',
                border: '2px solid #FF8C42',
                boxShadow: '0 0 15px rgba(255, 140, 66, 0.3)'
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
          </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-50"></div>
        <div className="absolute top-1/3 right-0 w-px h-32 bg-gradient-to-b from-transparent via-pink-400 to-transparent opacity-50"></div>
        <div className="absolute bottom-1/4 left-0 w-px h-24 bg-gradient-to-b from-transparent via-green-400 to-transparent opacity-50"></div>
        </div>
      </div>
    </div>
  )
}