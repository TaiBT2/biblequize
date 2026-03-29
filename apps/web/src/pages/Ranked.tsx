import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../store/authStore'
import { useRankedDataSync } from '../hooks/useRankedDataSync'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

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

// Tier definitions
const TIERS = [
  { name: 'Sắt', icon: 'shield', color: '#919098', minPoints: 0 },
  { name: 'Đồng', icon: 'shield', color: '#cd7f32', minPoints: 500 },
  { name: 'Bạc', icon: 'shield', color: '#c0c0c0', minPoints: 1500 },
  { name: 'Vàng', icon: 'military_tech', color: '#e8a832', minPoints: 3000 },
  { name: 'Kim Cương', icon: 'diamond', color: '#b9f2ff', minPoints: 6000 },
]

function getCurrentTier(points: number) {
  let tier = TIERS[0]
  for (const t of TIERS) {
    if (points >= t.minPoints) tier = t
  }
  return tier
}

function getNextTier(points: number) {
  for (const t of TIERS) {
    if (points < t.minPoints) return t
  }
  return null
}

export default function Ranked() {
  const [rankedStatus, setRankedStatus] = useState<RankedStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isInitialized } = useRankedDataSync()

  const [userRank, setUserRank] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [nextRankGap, setNextRankGap] = useState<number | null>(null)

  const fetchStatus = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/api/me/ranked-status')
      const data = res.data

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
    if (isInitialized) {
      fetchStatus()
      fetchMyRank()
    }
  }, [isInitialized])

  // Countdown logic
  useEffect(() => {
    if (!rankedStatus?.resetAt) return

    const timer = setInterval(() => {
      const resetTime = new Date(rankedStatus.resetAt).getTime()
      const now = new Date().getTime()
      const diff = resetTime - now

      if (diff <= 0) {
        setTimeLeft('00:00')
        clearInterval(timer)
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
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
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized) {
        fetchStatus()
      }
    }

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

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('rankedStatusUpdate', handleRankedStatusUpdate as EventListener)
    }
  }, [isInitialized])

  const startRankedQuiz = async () => {
    try {
      const res = await api.post('/api/ranked/sessions')
      const sessionId = res.data.sessionId

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
        if (questions.length < 10) {
          const params: any = { limit: 10 - questions.length, excludeIds: Array.from(exclude) }
          if (rankedStatus?.currentBook) params.book = rankedStatus.currentBook
          if (rankedStatus?.currentDifficulty && rankedStatus.currentDifficulty !== 'all') params.difficulty = rankedStatus.currentDifficulty
          addUnique((await api.get('/api/questions', { params })).data ?? [])
        }
        if (questions.length < 10 && rankedStatus?.currentBook) {
          const params: any = { limit: 10 - questions.length, book: rankedStatus.currentBook, excludeIds: Array.from(exclude) }
          addUnique((await api.get('/api/questions', { params })).data ?? [])
        }
        if (questions.length < 10) {
          const params: any = { limit: 10 - questions.length, excludeIds: Array.from(exclude) }
          addUnique((await api.get('/api/questions', { params })).data ?? [])
        }
      } catch (e) {
        console.error('Failed to fetch ranked questions', e)
      }

      navigate('/quiz', { state: { sessionId, mode: 'ranked', questions, showExplanation: false, isRanked: true } })
    } catch (e) {
      console.error('Failed to start ranked session', e)
      alert('Khong the bat dau xep hang, vui long thu lai')
    }
  }

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-secondary/30 border-t-secondary animate-spin mx-auto mb-6" />
          <p className="text-on-surface-variant text-sm font-medium">
            {!isInitialized ? 'Dang dong bo du lieu...' : 'Dang tai...'}
          </p>
        </div>
      </div>
    )
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (!rankedStatus) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="bg-surface-container p-10 rounded-2xl text-center max-w-md">
          <span className="material-symbols-outlined text-error text-5xl mb-4 block">error</span>
          <p className="text-on-surface font-bold text-lg mb-2">Khong the tai trang thai xep hang</p>
          <p className="text-on-surface-variant text-sm mb-6">Vui long thu lai sau.</p>
          <button onClick={fetchStatus} className="gold-gradient text-on-secondary font-black px-8 py-3 rounded-xl text-sm uppercase tracking-widest">
            Thu lai
          </button>
        </div>
      </div>
    )
  }

  // ── Derived Values ─────────────────────────────────────────────────────────
  const energy = Number(rankedStatus.livesRemaining) * 20 // each life = 20 energy
  const maxEnergy = Number(rankedStatus.dailyLives) * 20
  const energyPercent = maxEnergy > 0 ? (energy / maxEnergy) * 100 : 0
  const canPlay = Number(rankedStatus.livesRemaining) > 0 && Number(rankedStatus.questionsCounted) < Number(rankedStatus.cap)
  const safePointsToday = Number(rankedStatus.pointsToday ?? 0)
  const gamesPlayedToday = Math.floor(Number(rankedStatus.questionsCounted) / 10) // approximate
  const maxGamesToday = 5
  const currentTier = getCurrentTier(userRank?.points || safePointsToday)
  const nextTier = getNextTier(userRank?.points || safePointsToday)
  const pointsForNextTier = nextTier ? nextTier.minPoints - (userRank?.points || safePointsToday) : 0

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight mb-2">Xep Hang</h1>
          <p className="text-on-surface-variant text-sm">Thi dau de leo hang va nhan phan thuong mua giai.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-surface-container border border-outline-variant/20">
          <span
            className="material-symbols-outlined text-2xl"
            style={{ ...FILL_1, color: currentTier.color }}
          >
            {currentTier.icon}
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant">Hang hien tai</p>
            <p className="font-black text-on-surface" style={{ color: currentTier.color }}>
              Hang {currentTier.name} {currentTier.name === 'Vang' ? 'III' : ''}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. Energy Section ─────────────────────────────────────────────── */}
      <section className="bg-surface-container rounded-2xl p-8 border border-outline-variant/10">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-secondary text-3xl" style={FILL_1}>bolt</span>
          <h2 className="text-xl font-black text-on-surface tracking-tight">Nang Luong</h2>
        </div>

        {/* Energy bar */}
        <div className="relative h-5 w-full bg-surface-container-lowest rounded-full overflow-hidden mb-4">
          <div
            className="absolute inset-y-0 left-0 gold-gradient rounded-full transition-all duration-700 ease-out"
            style={{ width: `${energyPercent}%` }}
          />
          {/* Glow effect on the bar tip */}
          {energyPercent > 0 && (
            <div
              className="absolute inset-y-0 w-8 rounded-full"
              style={{
                left: `calc(${energyPercent}% - 16px)`,
                background: 'radial-gradient(circle, rgba(232,168,50,0.6) 0%, transparent 70%)',
              }}
            />
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-on-surface font-bold text-lg">
            {energy} / {maxEnergy}{' '}
            <span className="text-on-surface-variant font-medium text-sm">Nang luong</span>
          </p>
          <div className="flex items-center gap-2 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-base">schedule</span>
            <span>Phuc hoi sau: <span className="font-bold text-on-surface">{timeLeft || '--:--:--'}</span></span>
          </div>
        </div>

        <p className="text-on-surface-variant text-xs mt-3">
          Moi tran dau xep hang tieu ton 20 nang luong. Nang luong se duoc phuc hoi moi ngay.
        </p>
      </section>

      {/* ── 3. Today's Progress ───────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low p-7 rounded-2xl flex items-center justify-between border-l-8 border-secondary">
          <div>
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-2">Tran hom nay</p>
            <h3 className="text-3xl font-black text-on-surface">
              {gamesPlayedToday} <span className="text-base font-medium text-on-surface-variant">/ {maxGamesToday}</span>
            </h3>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-3xl" style={FILL_1}>sports_esports</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-7 rounded-2xl flex items-center justify-between border-l-8 border-secondary/50">
          <div>
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-2">Diem hom nay</p>
            <h3 className="text-3xl font-black text-secondary">{safePointsToday}</h3>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-3xl" style={FILL_1}>star</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-7 rounded-2xl flex items-center justify-between border-l-8 border-secondary/20">
          <div>
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-2">Ti le thang</p>
            <h3 className="text-3xl font-black text-on-surface">
              {rankedStatus.questionsCounted > 0
                ? `${Math.round((safePointsToday / (rankedStatus.questionsCounted * 10)) * 100)}%`
                : '--'}
            </h3>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl" style={FILL_1}>trending_up</span>
          </div>
        </div>
      </section>

      {/* ── 4. Current Season ─────────────────────────────────────────────── */}
      <section className="bg-surface-container rounded-2xl p-8 border border-outline-variant/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary text-3xl" style={FILL_1}>emoji_events</span>
            <div>
              <h2 className="text-xl font-black text-on-surface tracking-tight">Mua Giai Hien Tai</h2>
              <p className="text-on-surface-variant text-xs">Ket thuc sau: {timeLeft || '--:--:--'}</p>
            </div>
          </div>
          <button
            onClick={() => { fetchStatus(); fetchMyRank(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface-variant text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Lam moi
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current rank */}
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-3">Vi tri xep hang</p>
            <p className="text-5xl font-black text-secondary mb-1">#{userRank?.rank || '--'}</p>
            {nextRankGap != null && nextRankGap > 0 && (
              <p className="text-on-surface-variant text-xs">Can {nextRankGap} diem de vuot nguoi tren</p>
            )}
          </div>

          {/* Points needed for next tier */}
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-3">Hang tiep theo</p>
            {nextTier ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-2xl" style={{ ...FILL_1, color: nextTier.color }}>{nextTier.icon}</span>
                  <p className="text-2xl font-black" style={{ color: nextTier.color }}>Hang {nextTier.name}</p>
                </div>
                <p className="text-on-surface-variant text-xs">Con {pointsForNextTier} diem</p>
              </>
            ) : (
              <p className="text-2xl font-black text-tertiary">Hang cao nhat!</p>
            )}
          </div>

          {/* Book progress */}
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-3">Sach hien tai</p>
            <p className="text-2xl font-black text-on-surface mb-1">{rankedStatus.currentBook}</p>
            <p className="text-on-surface-variant text-xs">
              {rankedStatus.nextBook ? `Tiep theo: ${rankedStatus.nextBook}` : 'Dang tien ve dich'}
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. Quick Start Button ─────────────────────────────────────────── */}
      <section className="flex justify-center">
        {canPlay ? (
          <button
            onClick={startRankedQuiz}
            className="gold-gradient gold-glow text-on-secondary font-black text-lg px-16 py-5 rounded-2xl uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 shadow-xl shadow-secondary/20"
          >
            <span className="material-symbols-outlined text-2xl" style={FILL_1}>swords</span>
            Bat Dau Thi Dau
          </button>
        ) : (
          <div className="bg-surface-container-high text-on-surface-variant font-black text-lg px-16 py-5 rounded-2xl uppercase tracking-widest flex items-center gap-4 opacity-60 cursor-not-allowed">
            <span className="material-symbols-outlined text-2xl">block</span>
            Het Nang Luong — Cho phuc hoi
          </div>
        )}
      </section>

      {/* ── 6. Personal Stats ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-black text-on-surface tracking-tight mb-5">Thong Ke Ca Nhan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-low rounded-2xl p-6 text-center">
            <span className="material-symbols-outlined text-secondary text-4xl mb-3 block" style={FILL_1}>quiz</span>
            <p className="text-3xl font-black text-on-surface mb-1">{rankedStatus.questionsCounted}</p>
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em]">Tong cau da tra loi</p>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-6 text-center">
            <span className="material-symbols-outlined text-tertiary text-4xl mb-3 block" style={FILL_1}>local_fire_department</span>
            <p className="text-3xl font-black text-on-surface mb-1">
              {rankedStatus.correctAnswersInCurrentBook ?? 0}
            </p>
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em]">Chuoi tra loi dung</p>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-6 text-center">
            <span className="material-symbols-outlined text-primary text-4xl mb-3 block" style={FILL_1}>workspace_premium</span>
            <p className="text-3xl font-black mb-1" style={{ color: currentTier.color }}>
              Hang {currentTier.name}
            </p>
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em]">Hang cao nhat dat duoc</p>
          </div>
        </div>
      </section>
    </div>
  )
}
