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

  // V2.6 New States
  const [userRank, setUserRank] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [nextRankGap, setNextRankGap] = useState<number | null>(null)


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
      fetchMyRank()
    }
  }, [isInitialized])

  // V2.6 Countdown Logic
  useEffect(() => {
    if (!rankedStatus?.resetAt) return

    const timer = setInterval(() => {
      const resetTime = new Date(rankedStatus.resetAt).getTime()
      const now = new Date().getTime()
      const diff = resetTime - now

      if (diff <= 0) {
        setTimeLeft('Đã đến giờ reset!')
        clearInterval(timer)
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${h.toString().padStart(2, '0')}h : ${m.toString().padStart(2, '0')}m : ${s.toString().padStart(2, '0')}s`)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [rankedStatus?.resetAt])

  const fetchMyRank = async () => {
    if (!user) return
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await api.get('/api/leaderboard/daily/my-rank', { params: { date: today } })
      setUserRank(res.data)

      // Fetch rank context (who is above)
      const topRes = await api.get('/api/leaderboard/daily', { params: { date: today, size: 50 } })
      const leaders = Array.isArray(topRes.data) ? topRes.data : []
      const myIndex = leaders.findIndex((r: any) => r.name === user.name)
      if (myIndex > 0) {
        setNextRankGap(leaders[myIndex - 1].points - (res.data?.points || 0))
      }
    } catch (err) {
      console.log('Rank info not available')
    }
  }

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
    <div className="h-screen w-screen overflow-hidden nebula-bg flex flex-col items-center justify-between py-10 relative">
      {/* Enhanced Nebula & Stars are handled in global.css */}

      {/* Header Section */}
      <div className="text-center z-10 w-full px-4 mb-2">
        <h1 className="text-6xl font-black mb-3 tracking-tighter text-glow"
          style={{
            background: 'linear-gradient(to bottom, #00F5D4, #00D2FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(0, 245, 212, 0.5)'
          }}>
          CHẾ ĐỘ XẾP HẠNG
        </h1>
        <div className="flex items-center justify-center gap-6 text-[11px] font-black uppercase tracking-[0.3em] text-white/50">
          <span>500 CÂU / NGÀY</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/30"></span>
          <span>{rankedStatus.dailyLives} MẠNG ❤️</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/30"></span>
          <span style={{ color: 'var(--cyber-gold)' }}>THỬ THÁCH LEO HẠNG</span>
        </div>
      </div>

      {/* Main Interactive Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/8] z-10">
        <div className="absolute inset-0 mockup-dark-card rounded-[3rem] border-white/5 shadow-2xl overflow-hidden">
          {/* Decorative Scrolls Pattern */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/ancient-pavilion.png')` }}></div>

          <div className="h-full w-full flex flex-col justify-center px-16 relative">
            {/* Top Row: Stats & Rank Circle */}
            <div className="flex items-center justify-between mb-12">
              {/* Left Stat Card */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-3xl border border-white/5 bg-black/20 hover:border-cyan-500/20 transition-all group">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-red-500 text-3xl group-hover:scale-110 transition-transform">❤️</span>
                  <span className="text-5xl font-black text-white">{rankedStatus.livesRemaining} <span className="text-sm text-white/20">/ {rankedStatus.dailyLives}</span></span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Mạng còn lại</span>
              </div>

              {/* Center Area: Intensive Rank Ring */}
              <div className="flex-[1.8] flex flex-col items-center justify-center relative translate-y-[-10px]">
                <div className="rank-circle scale-110">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">BẠN ĐANG ĐỨNG THỨ</span>
                  <span className="text-6xl font-black text-white tracking-tighter">#{userRank?.rank || '--'}</span>
                </div>
                <div className="mt-8 px-6 py-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 shadow-[0_0_20px_rgba(255,195,0,0.1)]">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#FFC300]">MỤC TIÊU: VƯỢT QUA NGƯỜI XẾP TRÊN!</span>
                </div>
              </div>

              {/* Right Stat Card */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-3xl border border-white/5 bg-black/20 hover:border-yellow-500/20 transition-all group">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-yellow-400 text-3xl group-hover:rotate-12 transition-transform">⭐</span>
                  <span className="text-5xl font-black text-white">{safePointsToday}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Điểm hôm nay</span>
              </div>
            </div>

            {/* Middle Row: Progress Bar */}
            <div className="w-full px-20">
              <div className="relative h-1.5 w-full bg-white/5 rounded-full mb-12 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_#00F5D4] rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                {[0, 100, 250, 500].map(m => (
                  <div key={m} className={`roadmap-checkpoint ${rankedStatus.questionsCounted >= m ? 'active' : ''}`} style={{ left: `${(m / 500) * 100}%` }}>
                    {m === 0 && <span className="absolute -top-7 left-0 text-[10px] font-black text-white/20 whitespace-nowrap tracking-wider">{rankedStatus.questionsCounted} / 500 Câu</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Row: The Roadmap (V2.10 SVGs) */}
            <div className="flex items-center justify-between px-24">
              <div className="flex flex-col items-center gap-4 group">
                <div className="transition-all duration-500 group-hover:scale-110">
                  <svg width="70" height="85" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 20px rgba(0, 245, 212, 0.4))' }}>
                    <path d="M20 10C20 4.47715 24.4772 0 30 0H90C95.5228 0 100 4.47715 100 10V110C100 115.523 95.5228 120 90 120H30C24.4772 120 20 115.523 20 110V10Z" fill="#13161C" stroke="#00F5D4" strokeWidth="2" />
                    <path d="M20 20H10C4.47715 20 0 24.4772 0 30V110C0 115.523 4.47715 120 10 120H20V20Z" fill="#0B0E14" stroke="#00F5D4" strokeWidth="2" />
                    <path d="M50 30V70M30 50H70" stroke="#00F5D4" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-black text-white tracking-tight leading-none">{rankedStatus.currentBook}</h4>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#00F5D4] mt-2 opacity-50">{rankedStatus.currentBook} (Hiện tại)</p>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center px-12">
                <svg width="100" height="30" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
                  <path d="M5 12H90M90 12L80 5M90 12L80 19" stroke="#00F5D4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 10px #00F5D4)' }} />
                </svg>
              </div>

              <div className="flex flex-col items-center gap-4 group">
                <div className="transition-all duration-500 group-hover:scale-110">
                  <svg width="70" height="85" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 195, 0, 0.4))' }}>
                    <path d="M20 10C20 4.47715 24.4772 0 30 0H90C95.5228 0 100 4.47715 100 10V110C100 115.523 95.5228 120 90 120H30C24.4772 120 20 115.523 20 110V10Z" fill="#13161C" stroke="#FFC300" strokeWidth="2" />
                    <path d="M20 20H10C4.47715 20 0 24.4772 0 30V110C0 115.523 4.47715 120 10 120H20V20Z" fill="#0B0E14" stroke="#FFC300" strokeWidth="2" />
                    <path d="M50 30V70M30 50H70" stroke="#FFC300" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-black text-[#FFC300] tracking-tight leading-none">{rankedStatus.nextBook || 'COMING'}</h4>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#FFC300] mt-2 opacity-50">{rankedStatus.nextBook ? rankedStatus.nextBook + ' (TIẾP THEO)' : 'ĐÍCH ĐẾN MỚI'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Decorative Blobs for Depth */}
        <div className="absolute -left-20 top-1/4 w-64 h-64 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute -right-20 bottom-1/4 w-64 h-64 bg-pink-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      </div>

      {/* Action Section: The Hero Button Area */}
      <div className="w-full flex flex-col items-center z-20">
        {canPlay ? (
          <button
            onClick={startRankedQuiz}
            className="btn-hero-mint animate-pulse hover:animate-none"
          >
            BẮT ĐẦU XẾP HẠNG
          </button>
        ) : (
          <div className="px-12 py-5 rounded-2xl mockup-dark-card border-white/5 text-white/20 font-black uppercase tracking-[0.3em] backdrop-blur-3xl">
            Giới hạn hôm nay đã hết
          </div>
        )}

        <div className="mt-8 flex items-center gap-3 text-white/30 font-mono">
          <span className="text-[10px] font-black uppercase tracking-widest">Reset Hàng Ngày:</span>
          <span className="text-lg font-bold text-white tracking-widest">{timeLeft || '23 : 59 : 59'}</span>
        </div>

        {/* Minimal Footer Nav */}
        <div className="mt-12 flex items-center gap-10">
          <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-[#00F5D4] transition-colors flex items-center gap-2">
            <span className="text-lg">←</span> Quay lại trang chủ
          </Link>
          <div className="flex gap-4">
            <Link to="/leaderboard" className="px-6 py-2 rounded-xl border border-white/5 bg-white/5 text-[#00F5D4] text-[10px] font-black uppercase tracking-widest hover:bg-[#00F5D4] hover:text-[#0B0E14] transition-all">Bảng xếp hạng</Link>
            <button onClick={fetchStatus} className="px-6 py-2 rounded-xl border border-white/5 bg-white/5 text-[#FFC300] text-[10px] font-black uppercase tracking-widest hover:bg-[#FFC300] hover:text-[#0B0E14] transition-all">Refresh</button>
          </div>
        </div>
      </div>

      {/* Decorative Starscape Corner */}
      <div className="absolute bottom-6 right-8 text-white/20 pointer-events-none select-none opacity-30">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 0L24 16L40 20L24 24L20 40L16 24L0 20L16 16L20 0Z" fill="white" />
        </svg>
      </div>
    </div>
  )
}
