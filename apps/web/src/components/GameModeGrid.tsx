import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

/* ── Types ── */
interface RankedStatus {
  livesRemaining: number
  dailyLives: number
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
  const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0))
  return utcMidnight.getTime() - now.getTime()
}

/* ── Card config ── */
interface CardConfig {
  id: string
  titleKey: string
  descKey: string
  icon: string
  color: string
  borderHover: string
  ctaKey: string
  ctaClass: string
  route: string
  iconFill?: boolean
  borderDefault?: string
  bgIcon?: string
}

const CARDS: CardConfig[] = [
  {
    id: 'practice',
    titleKey: 'gameModes.practice',
    descKey: 'gameModes.practiceDesc',
    icon: 'menu_book',
    color: 'text-secondary',
    borderHover: 'hover:border-secondary/30',
    ctaKey: 'common.startNow',
    ctaClass: 'bg-surface-container-highest text-secondary border border-outline-variant/20 hover:bg-secondary hover:text-on-secondary',
    route: '/practice',
  },
  {
    id: 'ranked',
    titleKey: 'gameModes.ranked',
    descKey: 'gameModes.rankedDesc',
    icon: 'bolt',
    iconFill: true,
    color: 'text-secondary',
    borderHover: 'hover:shadow-[0_0_30px_rgba(248,189,69,0.05)]',
    borderDefault: 'border-secondary/20',
    bgIcon: 'text-secondary',
    ctaKey: 'gameModes.rankedBtn',
    ctaClass: 'gold-gradient text-on-secondary shadow-lg shadow-secondary/10 active:scale-95',
    route: '/ranked',
  },
  {
    id: 'daily',
    titleKey: 'gameModes.daily',
    descKey: 'gameModes.dailyDesc',
    icon: 'calendar_today',
    color: 'text-tertiary',
    borderHover: 'hover:border-tertiary/30',
    bgIcon: 'text-tertiary',
    ctaKey: 'gameModes.dailyBtn',
    ctaClass: 'bg-tertiary/10 text-tertiary border border-tertiary/20 hover:bg-tertiary hover:text-on-tertiary',
    route: '/daily',
  },
  {
    id: 'group',
    titleKey: 'gameModes.groups',
    descKey: 'gameModes.groupsDesc',
    icon: 'church',
    color: 'text-primary',
    borderHover: 'hover:border-primary/30',
    bgIcon: 'text-primary',
    ctaKey: 'gameModes.groupsBtn',
    ctaClass: 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-on-primary',
    route: '/groups',
  },
  {
    id: 'multiplayer',
    titleKey: 'gameModes.rooms',
    descKey: 'gameModes.roomsDesc',
    icon: 'gamepad',
    color: 'text-secondary',
    borderHover: 'hover:border-secondary/30',
    ctaKey: 'gameModes.roomsBtn',
    ctaClass: 'bg-surface-container-highest text-secondary border border-outline-variant/20 hover:bg-secondary hover:text-on-secondary',
    route: '/multiplayer',
  },
  {
    id: 'tournament',
    titleKey: 'gameModes.tournament',
    descKey: 'gameModes.tournamentDesc',
    icon: 'trophy',
    color: 'text-error',
    borderHover: 'hover:border-error/30',
    bgIcon: 'text-error',
    ctaKey: 'gameModes.tournamentBtn',
    ctaClass: 'bg-error/10 text-error border border-error/20 hover:bg-error hover:text-on-error',
    route: '/tournaments',
  },
  {
    id: 'weekly',
    titleKey: 'gameModes.weekly',
    descKey: 'gameModes.weeklyDesc',
    icon: 'event',
    iconFill: true,
    color: 'text-purple-400',
    borderHover: 'hover:border-purple-400/30',
    bgIcon: 'text-purple-400',
    ctaKey: 'gameModes.weeklyBtn',
    ctaClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500 hover:text-white',
    route: '/weekly-quiz',
  },
  {
    id: 'mystery',
    titleKey: 'gameModes.mystery',
    descKey: 'gameModes.mysteryDesc',
    icon: 'casino',
    iconFill: true,
    color: 'text-pink-400',
    borderHover: 'hover:border-pink-400/30',
    bgIcon: 'text-pink-400',
    ctaKey: 'gameModes.mysteryBtn',
    ctaClass: 'bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500 hover:text-white',
    route: '/mystery-mode',
  },
  {
    id: 'speed',
    titleKey: 'gameModes.speed',
    descKey: 'gameModes.speedDesc',
    icon: 'speed',
    iconFill: true,
    color: 'text-orange-400',
    borderHover: 'hover:border-orange-400/30',
    bgIcon: 'text-orange-400',
    ctaKey: 'gameModes.speedBtn',
    ctaClass: 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500 hover:text-white',
    route: '/speed-round',
  },
]

/* ── Component ── */
export default function GameModeGrid() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Ranked state
  const [rankedStatus, setRankedStatus] = useState<RankedStatus>({ livesRemaining: 0, dailyLives: 100 })
  const [rankedLoading, setRankedLoading] = useState(true)
  const [rankedError, setRankedError] = useState(false)

  // Daily state
  const [dailyCompleted, setDailyCompleted] = useState(false)
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
        if (!cancelled) {
          setRankedStatus({
            livesRemaining: res.data?.livesRemaining ?? 0,
            dailyLives: res.data?.dailyLives ?? 100,
          })
        }
      } catch {
        if (!cancelled) setRankedError(true)
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
        if (!cancelled) setDailyCompleted(res.data?.alreadyCompleted ?? false)
      } catch { /* keep default */ }
      finally { if (!cancelled) setDailyLoading(false) }
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
          const rooms = res.data?.rooms
          setRoomCount(Array.isArray(rooms) ? rooms.length : 0)
        }
      } catch { /* keep default */ }
      finally { if (!cancelled) setRoomLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => setCountdown(msUntilMidnight()), 1_000)
    return () => clearInterval(interval)
  }, [])

  const noEnergy = rankedStatus.livesRemaining <= 0
  const energyText = rankedLoading
    ? '...'
    : rankedError
      ? '—'
      : `${rankedStatus.livesRemaining}/${rankedStatus.dailyLives}`

  /* ── Status line per card ── */
  function getStatusLine(id: string) {
    switch (id) {
      case 'practice':
        return <span className="text-[10px] font-bold text-secondary-container uppercase">{t('gameModes.practiceTag')}</span>
      case 'ranked':
        return (
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-secondary uppercase">
              ⚡ {t('gameModes.rankedEnergy', { current: rankedStatus.livesRemaining, max: rankedStatus.dailyLives })}
            </span>
            <span className="text-[8px] text-error font-medium">{t('gameModes.rankedCost')}</span>
          </div>
        )
      case 'daily':
        return (
          <span className="text-[10px] font-bold text-tertiary uppercase">
            {dailyLoading ? '...' : dailyCompleted ? `✅ ${t('gameModes.dailyCompleted')}` : t('gameModes.dailyEndsIn', { time: formatCountdown(countdown) })}
          </span>
        )
      case 'group':
        return <span className="text-[10px] font-bold text-primary-fixed-dim uppercase">{t('gameModes.groupsTag')}</span>
      case 'multiplayer':
        return (
          <span className="text-[10px] font-bold text-secondary-container uppercase">
            {roomLoading ? '...' : t('gameModes.roomsTag', { count: roomCount })}
          </span>
        )
      case 'tournament':
        return <span className="text-[10px] font-bold text-error uppercase">{t('gameModes.tournamentTag')}</span>
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {CARDS.map((card) => {
        const isDisabled = card.id === 'ranked' && noEnergy && !rankedLoading
        return (
          <div
            key={card.id}
            onClick={() => !isDisabled && navigate(card.route)}
            className={`group bg-surface-container rounded-2xl p-6 border transition-all flex flex-col justify-between h-48 relative overflow-hidden ${
              isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            } ${card.borderDefault ?? 'border-outline-variant/10'} ${card.borderHover}`}
          >
            {/* Watermark background icon */}
            <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity ${card.bgIcon ?? ''}`}>
              <span className="material-symbols-outlined text-9xl">{card.icon}</span>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`material-symbols-outlined ${card.color}`}
                  style={card.iconFill ? FILL_1 : undefined}
                >
                  {card.icon}
                </span>
                <h4 className="font-bold text-on-surface">{t(card.titleKey)}</h4>
              </div>
              <p className="text-xs text-on-surface-variant line-clamp-2">{t(card.descKey)}</p>
            </div>

            <div className="flex justify-between items-center relative z-10">
              {getStatusLine(card.id)}
              <button
                onClick={(e) => { e.stopPropagation(); if (!isDisabled) navigate(card.route) }}
                disabled={isDisabled}
                className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${card.ctaClass}`}
              >
                {card.id === 'ranked' && isDisabled ? t('gameModes.noEnergy') : t(card.ctaKey)}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
