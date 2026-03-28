import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import BookProgress from '../components/BookProgress'
import { useAuth } from '../contexts/AuthContext'
import { useRankedDataSync } from '../hooks/useRankedDataSync'
import styles from './Ranked.module.css'

// ── Icons (Consistent with Leaderboard) ────────────────────────────────────
const BookIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 10C20 4.47715 24.4772 0 30 0H90C95.5228 0 100 4.47715 100 10V110C100 115.523 95.5228 120 90 120H30C24.4772 120 20 115.523 20 110V10Z" fill="#13161C" stroke={color} strokeWidth="2" />
    <path d="M20 20H10C4.47715 20 0 24.4772 0 30V110C0 115.523 4.47715 120 10 120H20V20Z" fill="#0B0E14" stroke={color} strokeWidth="2" />
    <path d="M50 30V70M30 50H70" stroke={color} strokeWidth="4" strokeLinecap="round" />
  </svg>
)

const StarIcon = ({ size = 16, color = '#FFC300' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const TrophyIcon = ({ size = 16, color = '#00F5D4' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color }}>
    <path d="M8 21H16M12 21V13M17 4H7L6 9C6 11.21 8.69 13 12 13C15.31 13 18 11.21 18 9L17 4Z" /><path d="M7 4L4 5M17 4L20 5" />
  </svg>
)

const HouseIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color }}>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const RefreshIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color }}>
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

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
      const res = await api.get('/api/me/ranked-status')
      const data = res.data

      // Sync today's asked question IDs to localStorage for use during quiz session
      if (data?.askedQuestionIdsToday?.length > 0) {
        const today = new Date().toISOString().slice(0, 10)
        localStorage.setItem('askedQuestionIds', JSON.stringify(data.askedQuestionIdsToday))
        localStorage.setItem('lastAskedDate', today)
      }

      setRankedStatus(data ?? null)
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

      // Build exclude set: server asked IDs (authoritative) + localStorage (in-session cache)
      const serverAskedIds: string[] = rankedStatus?.askedQuestionIdsToday ?? []
      const localAskedIds: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('askedQuestionIds') || '[]') } catch { return [] }
      })()
      const exclude = new Set<string>([...serverAskedIds, ...localAskedIds])

      const addUnique = (items: any[]) => {
        for (const q of items ?? []) {
          if (!q?.id || exclude.has(q.id) || questions.find((x: any) => x.id === q.id)) continue
          questions.push(q)
          exclude.add(q.id)
          if (questions.length >= 10) break
        }
      }

      let questions: any[] = []
      try {
        // First attempt: currentBook + difficulty
        if (questions.length < 10) {
          const params: any = { limit: 10 - questions.length, excludeIds: Array.from(exclude) }
          if (rankedStatus?.currentBook) params.book = rankedStatus.currentBook
          if (rankedStatus?.currentDifficulty && rankedStatus.currentDifficulty !== 'all') params.difficulty = rankedStatus.currentDifficulty
          addUnique((await api.get('/api/questions', { params })).data ?? [])
        }
        // Second attempt: book only (relax difficulty)
        if (questions.length < 10 && rankedStatus?.currentBook) {
          const params: any = { limit: 10 - questions.length, book: rankedStatus.currentBook, excludeIds: Array.from(exclude) }
          addUnique((await api.get('/api/questions', { params })).data ?? [])
        }
        // Final fallback: global pool
        if (questions.length < 10) {
          const params: any = { limit: 10 - questions.length, excludeIds: Array.from(exclude) }
          addUnique((await api.get('/api/questions', { params })).data ?? [])
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
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="page-card p-8 text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4 ${styles.loadingSpinner}`}></div>
          <p className={styles.loadingText}>
            {!isInitialized ? 'Đang đồng bộ dữ liệu...' : 'Đang tải...'}
          </p>
        </div>
      </div>
    )
  }

  if (!rankedStatus) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="page-card p-8 text-center">
          <p className={styles.errorText}>Không thể tải trạng thái xếp hạng</p>
          <Link to="/" className="btn-primary">Về Trang Chủ</Link>
        </div>
      </div>
    )
  }

  const canPlay = Number(rankedStatus.livesRemaining) > 0 && Number(rankedStatus.questionsCounted) < Number(rankedStatus.cap)
  const progressPercentage = (Number(rankedStatus.questionsCounted) / Number(rankedStatus.cap)) * 100
  const safePointsToday = Number(rankedStatus.pointsToday ?? 0)

  return (
    <div className="h-screen w-screen overflow-hidden nebula-bg flex flex-col items-center justify-between py-10 relative">
      {/* Enhanced Nebula & Stars are handled in global.css */}

      {/* Header Section */}
      <div className="text-center z-10 w-full px-4 mb-2">
        <h1 className={`text-6xl font-black mb-3 tracking-tighter text-glow ${styles.heroTitle}`}>
          CHẾ ĐỘ XẾP HẠNG
        </h1>
        <div className="flex items-center justify-center gap-6 text-[11px] font-black uppercase tracking-[0.3em] text-white/80">
          <span>500 CÂU / NGÀY</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/40"></span>
          <span>{rankedStatus.dailyLives} MẠNG ❤️</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/40"></span>
          <span className="text-yellow-400">THỬ THÁCH LEO HẠNG</span>
        </div>
      </div>

      {/* Main Interactive Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/8] z-10 transition-all duration-700"
        style={{ filter: canPlay ? 'none' : 'grayscale(1) opacity(0.6)' }}>
        <div className="absolute inset-0 mockup-dark-card rounded-[3rem] border-white/5 shadow-2 shadow-2xl overflow-hidden">
          {/* Decorative Scrolls Pattern */}
          <div className={`absolute inset-0 opacity-[0.04] pointer-events-none ${styles.scrollPattern}`}></div>

          <div className="h-full w-full flex flex-col justify-center px-16 relative">
            {/* Top Row: Stats & Rank Circle */}
            <div className="flex items-center justify-between mb-12">
              {/* Left Stat Card */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-3xl border border-white/5 bg-black/20 hover:border-cyan-500/20 transition-all group">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-red-500 text-3xl group-hover:scale-110 transition-transform">❤️</span>
                  <span className="text-5xl font-black text-white">{rankedStatus.livesRemaining} <span className="text-sm text-white/20">/ {rankedStatus.dailyLives}</span></span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Mạng còn lại</span>
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
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Điểm hôm nay</span>
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
                  <svg width="70" height="85" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.currentBookIcon}>
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
                  <path d="M5 12H90M90 12L80 5M90 12L80 19" stroke="#00F5D4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={styles.arrowFilter} />
                </svg>
              </div>

              <div className="flex flex-col items-center gap-4 group">
                <div className="transition-all duration-500 group-hover:scale-110">
                  <svg width="70" height="85" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.nextBookIcon}>
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
      <div className="w-full flex flex-col items-center z-20 gap-4">
        {canPlay ? (
          <button
            onClick={startRankedQuiz}
            className="btn-hero-mint animate-pulse hover:animate-none"
          >
            <BookIcon size={22} color="#0B0E14" />
            <span>BẮT ĐẦU XẾP HẠNG</span>
          </button>
        ) : (
          <div className="px-14 py-5 rounded-2xl bg-white/5 border border-white/15 text-white/50 font-black uppercase tracking-[0.4em] backdrop-blur-3xl shadow-inner text-center">
            GIỚI HẠN HÔM NAY ĐÃ HẾT
          </div>
        )}

        {/* Reset Timer: Large bordered pill */}
        <div className={`flex items-center justify-center gap-3 px-10 py-3 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm ${styles.resetTimer}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 shrink-0">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-[11px] font-black uppercase tracking-widest text-white/40">Reset Hàng Ngày:</span>
          <span className={`text-[15px] font-black tracking-widest ${styles.resetCountdown}`}>{timeLeft || '23h : 59m : 59s'}</span>
        </div>

        {/* Footer Nav */}
        <div className="flex flex-col items-center gap-3 mt-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-7 py-2.5 rounded-xl border border-white/10 bg-black/20 text-white/50 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:border-white/30 transition-all"
          >
            <HouseIcon size={14} />
            Quay lại trang chủ
          </Link>
          <div className="flex gap-4">
            <Link
              to="/leaderboard"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${styles.leaderboardLink}`}
            >
              <TrophyIcon size={14} />
              Bảng xếp hạng
            </Link>
            <button
              onClick={fetchStatus}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${styles.refreshButton}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
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
