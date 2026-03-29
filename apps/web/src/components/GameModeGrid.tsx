import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

/* ── Types ── */
interface RankedStatus {
  energy: number
  maxEnergy: number
}

interface DailyStatus {
  alreadyCompleted: boolean
}

/* ── Helpers ── */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function msUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - now.getTime()
}

/* ── Component ── */
export default function GameModeGrid() {
  const navigate = useNavigate()

  // Ranked state
  const [rankedStatus, setRankedStatus] = useState<RankedStatus>({ energy: 80, maxEnergy: 100 })
  const [rankedLoading, setRankedLoading] = useState(true)

  // Daily state
  const [dailyStatus, setDailyStatus] = useState<DailyStatus>({ alreadyCompleted: false })
  const [dailyLoading, setDailyLoading] = useState(true)
  const [countdown, setCountdown] = useState(msUntilMidnight())

  // Multiplayer state
  const [roomCount, setRoomCount] = useState(0)
  const [roomLoading, setRoomLoading] = useState(true)

  // Fetch ranked status
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/api/me/ranked-status')
        if (!cancelled) setRankedStatus(res.data)
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setRankedLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Fetch daily challenge status
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/api/daily-challenge')
        if (!cancelled) setDailyStatus(res.data)
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setDailyLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Fetch multiplayer rooms
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/api/rooms/public')
        if (!cancelled) {
          const count = Array.isArray(res.data) ? res.data.length : (res.data?.count ?? 0)
          setRoomCount(count)
        }
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setRoomLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(msUntilMidnight())
    }, 1_000)
    return () => clearInterval(interval)
  }, [])

  const energyPct = rankedStatus.maxEnergy > 0
    ? Math.round((rankedStatus.energy / rankedStatus.maxEnergy) * 100)
    : 0
  const noEnergy = rankedStatus.energy <= 0

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* ── Practice Card ── */}
      <div
        onClick={() => navigate('/practice')}
        className="bg-surface-container min-h-[220px] rounded-3xl p-6 flex flex-col border border-white/5 hover:border-[#4a9eff]/30 transition-all hover:-translate-y-1 group cursor-pointer"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#4a9eff]/10 flex items-center justify-center text-[#4a9eff]">
            <span className="material-symbols-outlined text-3xl">menu_book</span>
          </div>
          <span className="px-3 py-1 bg-[#4a9eff]/10 text-[#4a9eff] text-[10px] font-bold uppercase tracking-wider rounded-full">
            Không giới hạn
          </span>
        </div>
        <h4 className="text-xl font-bold text-on-surface mb-2">Luyện Tập</h4>
        <p className="text-sm text-on-surface-variant mb-auto">
          Luyện tập tự do, không áp lực. Hoàn hảo để củng cố kiến thức mỗi ngày.
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/practice') }}
          className="w-full py-2.5 rounded-xl border border-[#4a9eff]/30 text-[#4a9eff] font-bold hover:bg-[#4a9eff] hover:text-white transition-all"
        >
          Bắt Đầu
        </button>
      </div>

      {/* ── Ranked Card (FEATURED) ── */}
      <div
        onClick={() => !noEnergy && navigate('/ranked')}
        className={`bg-surface-container-high min-h-[220px] rounded-3xl p-6 flex flex-col border-2 border-secondary/20 shadow-2xl shadow-secondary/5 hover:-translate-y-2 transition-all group relative overflow-hidden ${noEnergy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {/* Featured badge */}
        <div className="absolute top-0 right-0 p-4">
          <span className="px-3 py-1 bg-secondary text-on-secondary text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]" style={FILL_1}>local_fire_department</span>
            {noEnergy ? 'Hết năng lượng' : 'Phổ biến nhất'}
          </span>
        </div>

        <div className="flex items-start mb-6">
          <div className="w-14 h-14 rounded-2xl gold-gradient-bg flex items-center justify-center text-on-secondary shadow-lg shadow-secondary/20">
            <span className="material-symbols-outlined text-3xl" style={FILL_1}>workspace_premium</span>
          </div>
        </div>

        <h4 className="text-2xl font-black text-on-surface mb-2">Xếp Hạng</h4>
        <p className="text-sm text-on-surface-variant mb-4">
          Thi đấu, leo hạng, cạnh tranh với các tín đồ khác trên toàn thế giới.
        </p>

        {/* Energy bar */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <span>Năng lượng</span>
            <span className="text-secondary">
              {rankedLoading ? '...' : `${rankedStatus.energy}/${rankedStatus.maxEnergy}`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-primary-container rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full transition-all duration-500"
              style={{ width: `${energyPct}%` }}
            />
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); if (!noEnergy) navigate('/ranked') }}
          disabled={noEnergy}
          className="w-full py-3 rounded-xl gold-gradient-bg text-on-secondary font-black tracking-tight shadow-lg shadow-secondary/10 group-hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {noEnergy ? 'Hết Năng Lượng' : 'Vào Thi Đấu'}
        </button>
      </div>

      {/* ── Daily Challenge Card ── */}
      <div
        onClick={() => navigate('/daily')}
        className="bg-surface-container min-h-[220px] rounded-3xl p-6 flex flex-col border border-white/5 hover:border-[#ff8c42]/30 transition-all hover:-translate-y-1 group relative cursor-pointer"
      >
        <div className="flex justify-between items-start mb-6">
          <div className={`w-12 h-12 rounded-2xl bg-[#ff8c42]/10 flex items-center justify-center text-[#ff8c42] ${!dailyStatus.alreadyCompleted ? 'animate-pulse' : ''}`}>
            <span className="material-symbols-outlined text-3xl">calendar_today</span>
          </div>
          <span className="px-3 py-1 bg-[#ff8c42]/10 text-[#ff8c42] text-[10px] font-bold uppercase tracking-wider rounded-full">
            {dailyLoading ? '...' : `Làm mới sau ${formatCountdown(countdown)}`}
          </span>
        </div>

        <h4 className="text-xl font-bold text-on-surface mb-2">Thử Thách Ngày</h4>
        <p className="text-sm text-on-surface-variant mb-2">
          5 câu mỗi ngày cho mọi người. Tích lũy chuỗi ngày dài nhất.
        </p>

        {/* Completion status */}
        {!dailyLoading && (
          <div className={`flex items-center gap-2 mb-auto text-xs font-bold ${dailyStatus.alreadyCompleted ? 'text-green-400' : 'text-error'}`}>
            <span className="material-symbols-outlined text-sm">
              {dailyStatus.alreadyCompleted ? 'check_circle' : 'error_outline'}
            </span>
            {dailyStatus.alreadyCompleted ? 'Hôm nay: Đã hoàn thành' : 'Hôm nay: Chưa hoàn thành'}
          </div>
        )}
        {dailyLoading && <div className="mb-auto" />}

        <button
          onClick={(e) => { e.stopPropagation(); navigate('/daily') }}
          className="w-full mt-4 py-2.5 rounded-xl border border-[#ff8c42]/30 text-[#ff8c42] font-bold hover:bg-[#ff8c42] hover:text-white transition-all"
        >
          Thử Thách Ngay
        </button>
      </div>

      {/* ── Multiplayer Card ── */}
      <div
        onClick={() => navigate('/multiplayer')}
        className="bg-surface-container min-h-[220px] rounded-3xl p-6 flex flex-col border border-white/5 hover:border-[#9b59b6]/30 transition-all hover:-translate-y-1 group cursor-pointer"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#9b59b6]/10 flex items-center justify-center text-[#9b59b6]">
            <span className="material-symbols-outlined text-3xl">groups</span>
          </div>
          <span className="px-3 py-1 bg-[#9b59b6]/10 text-[#9b59b6] text-[10px] font-bold uppercase tracking-wider rounded-full">
            {roomLoading ? '...' : `${roomCount} phòng đang mở`}
          </span>
        </div>
        <h4 className="text-xl font-bold text-on-surface mb-2">Nhiều Người</h4>
        <p className="text-sm text-on-surface-variant mb-auto">
          Tạo phòng, mời bạn bè cùng chơi hoặc tham gia phòng ngẫu nhiên.
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/multiplayer') }}
          className="w-full py-2.5 rounded-xl border border-[#9b59b6]/30 text-[#9b59b6] font-bold hover:bg-[#9b59b6] hover:text-white transition-all"
        >
          Vào Phòng
        </button>
      </div>
    </div>
  )
}
