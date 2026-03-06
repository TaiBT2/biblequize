import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

type Tab = 'daily' | 'weekly' | 'all-time'

// ── Icons ──────────────────────────────────────────────────────────────────
const StarIcon = ({ size = 16, color = '#FFC300' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const BookIcon = ({ size = 16, color = '#00F5D4' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color }}>
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
)

const CrownIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#FFC300' }}>
    <path d="M5 16L2 6l5 4 5-8 5 8 5-4-3 10H5z" />
  </svg>
)

const GiftIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#FFC300' }}>
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M12 11V3" /><path d="M7 3a2.5 2.5 0 0110 0" /><path d="M3 11h18" />
  </svg>
)

const SwordIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /><line x1="13" y1="19" x2="19" y2="13" /><line x1="16" y1="16" x2="20" y2="20" /><line x1="19" y1="21" x2="20" y2="20" /><line x1="15" y1="15" x2="16" y2="16" />
  </svg>
)

const FireIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF4500"><path d="M12 2c0 0-2 4-2 6s1 4 2 6 2-4 2-6-2-6-2-6zM12 22s5-3.5 5-8c0-2-1-4-2-6 0 2-2 4-2 6s1 4-1 8z" /></svg>
)
const ZapIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#00F5D4"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
)
const GemIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#00BFFF"><path d="M6 3h12l4 6-10 12L2 9z" /></svg>
)

// ── Animations ────────────────────────────────────────────────────────────
const PREMIUM_CSS = `
  @keyframes gold-float {
    0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
    50% { opacity: 0.8; }
    100% { transform: translateY(-100px) translateX(20px) scale(0.5); opacity: 0; }
  }
  @keyframes running-light {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes pulse-neon {
    0%, 100% { box-shadow: 0 0 10px rgba(0, 245, 212, 0.4), inset 0 0 5px rgba(0, 245, 212, 0.2); }
    50% { box-shadow: 0 0 25px rgba(0, 245, 212, 0.8), inset 0 0 10px rgba(0, 245, 212, 0.4); }
  }
`

// ── Number Ticker Component (Odometer) ──────────────────────────────────
const NumberTicker = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0)
  useEffect(() => {
    let start = displayValue
    const end = value
    if (start === end) return
    const duration = 1000
    const startTime = performance.now()
    const update = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const current = Math.floor(start + (end - start) * progress)
      setDisplayValue(current)
      if (progress < 1) requestAnimationFrame(update)
    }
    requestAnimationFrame(update)
  }, [value])
  return <span>{displayValue.toLocaleString()}</span>
}

// ── Medal color configs ───────────────────────────────────────────────────
const MEDAL = {
  1: {
    border: '#ffca28', // Gold
    shadow: 'rgba(255, 202, 40, 0.4)',
    bg: 'linear-gradient(180deg, #1c212c, #0d1117)',
    label: '#GOLD',
    icon: <CrownIcon size={28} />,
    statColor: '#ffca28',
    ansColor: '#00e676'
  },
  2: {
    border: '#C0C0C0', // Silver
    shadow: 'rgba(192, 192, 192, 0.4)',
    bg: 'linear-gradient(180deg, #1c212c, #0d1117)',
    label: '#SILVER',
    statColor: '#C0C0C0',
    ansColor: '#00e676'
  },
  3: {
    border: '#CD7F32', // Bronze
    shadow: 'rgba(205, 127, 50, 0.4)',
    bg: 'linear-gradient(180deg, #1c212c, #0d1117)',
    label: '#BRONZE',
    statColor: '#CD7F32',
    ansColor: '#00e676'
  },
}

// ── Helper: Avatar circle with image support and Premium frames ──────────
const Avatar = ({ name, src, size = 44, color = '#00F5D4', borderColor, frame }: { name: string; src?: string; size?: number; color?: string; borderColor?: string; frame?: 'gold' | 'neon' | 'fire' }) => {
  const frameStyle = frame === 'gold'
    ? { border: '3px solid #FFC300', boxShadow: '0 0 20px rgba(255, 195, 0, 0.6)' }
    : frame === 'neon'
      ? { border: '3px solid #00F5D4', boxShadow: '0 0 20px rgba(0, 245, 212, 0.6)' }
      : frame === 'fire'
        ? { border: '3px solid #FF4500', boxShadow: '0 0 20px rgba(255, 69, 0, 0.6)' }
        : { border: `2px solid ${borderColor || color}`, boxShadow: borderColor ? `0 0 15px ${borderColor}66` : `0 0 10px ${color}44` };

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: src ? 'black' : 'rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 900, color: borderColor || color,
      position: 'relative',
      flexShrink: 0,
      overflow: 'hidden',
      ...frameStyle
    }}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        name ? name.charAt(0).toUpperCase() : '?'
      )}
    </div>
  )
}

// ── Podium Card ───────────────────────────────────────────────────────────
const PodiumCard = ({ rank, row, isMe }: { rank: 1 | 2 | 3; row: any; isMe: boolean }) => {
  const m = MEDAL[rank]
  const isFirst = rank === 1

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      flex: 1, zIndex: isFirst ? 10 : 1,
      transform: isFirst ? 'translateY(-25px)' : 'translateY(0)',
      maxWidth: isFirst ? '220px' : '190px',
      position: 'relative'
    }}>
      {isFirst && (
        <div className="flex items-center gap-2 animate-bounce" style={{ marginBottom: 12 }}>
          <CrownIcon />
          <div title="Legendary Reward" className="text-yellow-400 drop-shadow-[0_0_8px_rgba(255,195,0,0.8)]">
            <GiftIcon size={24} />
          </div>
        </div>
      )}

      {/* Premium Shield Card (Glassmorphism & Depth) */}
      <div
        className="relative flex flex-col items-center py-8 w-full group transition-all duration-500 hover:-translate-y-2"
        style={{
          background: m.bg,
          backdropFilter: 'blur(12px)',
          borderRadius: '12px 12px 110px 110px / 12px 12px 140px 140px',
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          boxShadow: `0 20px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05), 0 0 30px ${m.shadow}`,
          overflow: 'hidden'
        }}
      >
        {/* Shine Sweep Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
          <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] group-hover:left-[100%] transition-all duration-[1.5s]" />
        </div>

        {/* Intensified Radiating Glow (Top 1) */}
        {isFirst && (
          <div className="absolute inset-0 rounded-[inherit] opacity-40 animate-pulse"
            style={{ boxShadow: `inset 0 0 50px ${m.shadow}, 0 0 40px ${m.shadow}` }} />
        )}

        <div className="mb-4 relative">
          <Avatar name={row?.name || '?'} src={row?.avatarUrl} size={isFirst ? 80 : 64} borderColor={m.border} frame={isFirst ? 'gold' : rank === 2 ? 'neon' : 'fire'} />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#0d1117] border-2 border-white/20 flex items-center justify-center font-black text-xs text-white shadow-lg">
            #{rank}
          </div>
        </div>

        <div className="text-center px-4">
          <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">{m.label}</div>
          <div className="text-lg font-black text-white truncate max-w-[140px] drop-shadow-md">{row?.name || '—'}</div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/5 shadow-inner">
            <StarIcon size={16} />
            <span className="text-xl font-bold italic" style={{ color: m.statColor }}>
              <NumberTicker value={row?.points ?? 0} />
            </span>
          </div>
          <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">
            {row?.questions ?? 0} CÂU TRẢ LỜI
          </div>
        </div>

        {isMe && (
          <div style={{
            position: 'absolute', top: '20%', right: '5%',
            background: '#00F5D4', color: '#000', fontSize: 8,
            fontWeight: 900, padding: '1px 6px', borderRadius: 4,
            boxShadow: '0 0 10px #00F5D4'
          }}>BẠN</div>
        )}
      </div>
    </div>
  )
}

// ── Gold Dust Particles ──────────────────────────────────────────────────
const GoldDust = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-yellow-400/30 blur-[1px]"
        style={{
          width: Math.random() * 4 + 1 + 'px',
          height: Math.random() * 4 + 1 + 'px',
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animation: `gold-float ${Math.random() * 5 + 3}s linear infinite`,
          animationDelay: `${Math.random() * 5}s`
        }}
      />
    ))}
  </div>
)

// ── Reusable User Rank Bar Component (Cyber Design) ────────────────────────
const UserRankBar = ({ userRank, user }: { userRank: any; user: any }) => {
  if (!userRank) return null;

  // Cleaner, symmetrical chamfered shape
  const cyberShape = 'polygon(2% 0%, 40% 0%, 42% -15%, 58% -15%, 60% 0%, 98% 0%, 100% 20%, 100% 80%, 98% 100%, 2% 100%, 0% 80%, 0% 20%)';

  return (
    <div className="w-full mb-8 relative px-4">
      <div
        className="w-full h-20 flex items-center relative group"
        style={{
          background: 'rgba(10, 15, 25, 0.9)',
          backdropFilter: 'blur(15px)',
          clipPath: cyberShape,
          overflow: 'visible'
        }}
      >
        {/* Neon Border Wrapper */}
        <div style={{
          position: 'absolute',
          inset: -1,
          background: '#00F5D4',
          clipPath: cyberShape,
          zIndex: -1,
          opacity: 0.7,
          filter: 'drop-shadow(0 0 8px rgba(0, 245, 212, 0.4))'
        }}></div>

        {/* Decorative Corner Brackets (Tech Accents) */}
        {[
          { top: 0, left: 0, borderTop: '2px solid #00F5D4', borderLeft: '2px solid #00F5D4', borderRadius: '4px 0 0 0' },
          { top: 0, right: 0, borderTop: '2px solid #00F5D4', borderRight: '2px solid #00F5D4', borderRadius: '0 4px 0 0' },
          { bottom: 0, left: 0, borderBottom: '2px solid #00F5D4', borderLeft: '2px solid #00F5D4', borderRadius: '0 0 0 4px' },
          { bottom: 0, right: 0, borderBottom: '2px solid #00F5D4', borderRight: '2px solid #00F5D4', borderRadius: '0 0 4px 0' }
        ].map((style, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            zIndex: 30,
            opacity: 0.8,
            boxShadow: '0 0 10px rgba(0, 245, 212, 0.5)',
            ...style
          }}></div>
        ))}

        {/* Inner Shape with Circuit Lines */}
        <div style={{
          position: 'absolute',
          inset: 1,
          background: 'rgba(10, 15, 25, 0.95)',
          clipPath: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          zIndex: 1
        }}>
          {/* Circuit Lines Background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            pointerEvents: 'none',
            backgroundImage: `linear-gradient(rgba(0,245,212,0.2) 1px, transparent 1px)`,
            backgroundSize: '100% 12px'
          }}></div>

          {/* Left: Rank */}
          <div className="flex items-center gap-4 z-10">
            <div className="text-5xl font-black italic tracking-tighter text-white" style={{ textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>
              #{userRank.rank}
            </div>
          </div>

          {/* Center: Avatar + Name */}
          <div className="flex items-center gap-4 z-10 translate-y-1">
            <Avatar name={user?.name || userRank.name} size={42} borderColor="#4a5568" />
            <div className="text-lg font-black text-white uppercase tracking-widest">
              {user?.name || userRank.name}
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-10 z-10">
            <div className="flex items-center gap-3 text-[#FFC300]">
              <StarIcon size={20} />
              <span className="text-2xl font-black"><NumberTicker value={userRank.points} /></span>
            </div>
            <div className="flex items-center gap-3 text-[#FFC300]">
              <div style={{
                width: 20, height: 16, background: '#FFC300',
                clipPath: 'polygon(0% 20%, 40% 20%, 50% 0%, 100% 0%, 100% 100%, 0% 100%)'
              }}></div>
              <span className="text-2xl font-black"><NumberTicker value={userRank.questions} /></span>
            </div>
          </div>
        </div>

        {/* Badge Label (Raised Center) */}
        <div style={{
          position: 'absolute',
          top: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#00F5D4',
          color: '#000',
          padding: '2px 20px',
          fontSize: '11px',
          fontWeight: 900,
          clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
          zIndex: 20,
          letterSpacing: '0.5px',
          boxShadow: '0 0 15px rgba(0, 245, 212, 0.4)'
        }}>
          VỊ TRÍ CỦA BẠN
        </div>
      </div>
    </div>
  )
}

const Leaderboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('daily')
  const [rows, setRows] = useState<Array<any>>([])
  const [date, setDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [pageSize] = useState(15)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const params: any = { page: currentPage, size: pageSize }
        if (tab === 'daily' && date) params.date = date
        const res = await api.get(`/api/leaderboard/${tab}`, { params })
        const data = Array.isArray(res.data) ? res.data : []
        setRows(data)
        setHasNextPage(data.length === pageSize)
        if (user) {
          try {
            const userRes = await api.get(`/api/leaderboard/${tab}/my-rank`, {
              params: tab === 'daily' && date ? { date } : {}
            })
            setUserRank(userRes.data)
          } catch { setUserRank(null) }
        }
      } finally { setLoading(false) }
    }
    load()
  }, [tab, date, user, currentPage])

  const TAB_LABELS: { key: Tab, label: string }[] = [
    { key: 'daily', label: 'NGÀY' },
    { key: 'weekly', label: 'TUẦN' },
    { key: 'all-time', label: 'TẤT CẢ' }
  ]
  const currentTabIndex = TAB_LABELS.findIndex(t => t.key === tab)

  const isFirstPage = currentPage === 0
  const top3 = isFirstPage ? rows.slice(0, 3) : []
  const listRows = isFirstPage ? rows.slice(3) : rows

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-10 px-4 relative overflow-x-hidden"
      style={{
        background: 'radial-gradient(circle at center, #1B2735 0%, #090A0F 100%)',
        fontFamily: "'Inter', sans-serif"
      }}>

      <style>{PREMIUM_CSS}</style>

      {/* Blurry Nebula Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header Buttons */}
      <div className="absolute top-6 left-6 flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest no-underline group z-50">
        <Link to="/" className="flex items-center gap-2 no-underline text-inherit">
          <span className="text-sm group-hover:-translate-x-1 transition-transform">←</span>
          <span>Trang chủ</span>
        </Link>
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#00F5D4] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
        </button>
        <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#00F5D4] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
        </button>
      </div>

      <div className="w-full max-w-4xl flex flex-col items-center z-10">

        {/* Title */}
        <h1 className="text-4xl font-black mb-1 text-center tracking-[0.1em]"
          style={{
            background: 'linear-gradient(to bottom, #FFE180 0%, #FFC300 50%, #FFA000 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 15px rgba(255,195,0,0.4))'
          }}>
          BẢNG XẾP HẠNG
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-14">THE GREAT CHALLENGE</p>

        {/* Segmented Control & Date Picker Row */}
        <div className="flex items-center gap-6 mb-12 z-20">
          <div className="relative p-1 bg-black/40 border border-white/10 rounded-full flex" style={{ minWidth: '300px', backdropFilter: 'blur(10px)' }}>
            <div
              className="absolute top-1 bottom-1 bg-[#00F5D4] rounded-full transition-all duration-300 ease-out shadow-[0_0_20px_#00F5D4]"
              style={{
                width: `calc(100% / 3 - 4px)`,
                left: `calc(2px + (${currentTabIndex} * (100% / 3)))`
              }}
            ></div>
            {TAB_LABELS.map((t) => (
              <button
                key={t.key}
                onClick={(e) => {
                  setTab(t.key);
                  setCurrentPage(0);
                }}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all relative z-10 no-underline border-none bg-transparent cursor-pointer"
                style={{ color: tab === t.key ? '#000' : 'rgba(255,255,255,0.4)' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-md">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Lần:</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-transparent border-none text-[#00F5D4] text-[10px] outline-none cursor-pointer font-black uppercase"
              style={{ colorScheme: 'dark' }}
              placeholder="mm/dd/yyyy"
            />
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00F5D4]"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Đang đồng bộ...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* TẦNG 1: THE PODIUM (Only on first page) */}
            {isFirstPage && rows.length > 0 && (
              <div className="w-full relative py-12 mb-20">
                <GoldDust />
                <div className="relative flex items-end justify-center gap-6 px-4 z-10">
                  {/* #2nd Place */}
                  {rows[1] ? <PodiumCard rank={2} row={rows[1]} isMe={userRank?.rank === 2} /> : <div className="flex-1"></div>}

                  {/* #1st Place */}
                  {rows[0] ? <PodiumCard rank={1} row={rows[0]} isMe={userRank?.rank === 1} /> : <div className="flex-1"></div>}

                  {/* #3rd Place */}
                  {rows[2] ? <PodiumCard rank={3} row={rows[2]} isMe={userRank?.rank === 3} /> : <div className="flex-1"></div>}
                </div>
              </div>
            )}

            {/* TẦNG 2: YOUR RANK BAR (Top) */}
            <UserRankBar userRank={userRank} user={user} />

            <div className="h-4 w-full"></div>

            {/* TẦNG 3: DETAILED LIST (Cyber Table) */}
            {listRows.length > 0 ? (
              <>
                <div className="w-full mb-6 rounded-t-[2rem] rounded-b-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 relative"
                  style={{
                    background: 'rgba(15, 20, 30, 0.85)',
                    backdropFilter: 'blur(20px)',
                  }}>
                  {/* Running Light Border */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-transparent"
                    style={{
                      borderImage: 'linear-gradient(90deg, transparent, #00F5D4, transparent) 1',
                      maskImage: 'linear-gradient(90deg, black, transparent, black)',
                      opacity: 0.3
                    }} />
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <th className="px-10 py-6 text-left text-[10px] font-black text-white/50 uppercase tracking-[0.25em]">HẠNG</th>
                        <th className="px-10 py-6 text-left text-[10px] font-black text-white/50 uppercase tracking-[0.25em]">NGƯỜI CHƠI</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-white/50 uppercase tracking-[0.25em]">ĐIỂM (⭐)</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-white/50 uppercase tracking-[0.25em]">CÂU (📁)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listRows.map((r, i) => {
                        const absoluteRank = isFirstPage ? i + 4 : (currentPage - 1) * pageSize + i + 1
                        const isMe = r.name === (user?.name || userRank?.name)

                        // Premium Data Simulation
                        const trendNum = (r.points % 5) - 2 // -2 to +2
                        const badges = [
                          r.points > 1000 && { icon: <GemIcon />, title: 'Chiến Thần' },
                          r.questions > 50 && { icon: <FireIcon />, title: 'Chăm Chỉ' },
                          r.points % 7 === 0 && { icon: <ZapIcon />, title: 'Chuỗi Thắng' }
                        ].filter(Boolean) as any[]

                        return (
                          <tr key={i}
                            className={`
                              border-t border-white/5 transition-all duration-300
                              ${isMe ? 'bg-[#00F5D4]/15 border-[#00F5D4]/40 shadow-[0_0_20px_rgba(0,245,212,0.15)] pulse-neon' : i % 2 === 0 ? 'bg-white/[0.01]' : 'hover:bg-white/[0.03]'}
                            `}
                          >
                            <td className="px-10 py-4">
                              <div className="flex items-center gap-3">
                                <span className={`text-lg font-black ${isMe ? 'text-[#00F5D4]' : 'text-white/30'}`}>#{absoluteRank}</span>
                                {trendNum !== 0 && (
                                  <div className={`flex items-center gap-0.5 text-[10px] font-bold ${trendNum > 0 ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
                                    <span>{trendNum > 0 ? '↑' : '↓'}</span>
                                    <span>{Math.abs(trendNum)}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-10 py-4">
                              <div className="flex items-center gap-5 group/name cursor-pointer" onClick={() => setSelectedPlayer(r)}>
                                <Avatar name={r.name} src={r.avatarUrl} size={36} borderColor={isMe ? '#00F5D4' : 'rgba(255,255,255,0.1)'} frame={isMe ? 'neon' : undefined} />
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-black uppercase text-sm tracking-wide ${isMe ? 'text-[#00F5D4]' : 'text-white/90'}`}>{r.name}</span>
                                    <div className="flex gap-1">
                                      {badges.map((b, idx) => (
                                        <div key={idx} title={b.title} className="opacity-80 hover:opacity-100 transition-opacity">
                                          {b.icon}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-4 text-right">
                              <div className="inline-flex flex-col items-end w-24">
                                <span className="text-xl font-black text-[#FFC300] italic"><NumberTicker value={r.points} /></span>
                                <div className="w-full h-1 bg-white/5 rounded-full mt-1 overflow-hidden relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[running-light_2s_linear_infinite]" style={{ backgroundSize: '200% 100%' }} />
                                  <div className="h-full bg-[#FFC300] relative z-10" style={{ width: `${Math.min((r.points / (rows[0]?.points || 1)) * 100, 100)}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-4 text-right">
                              <span className="text-xl font-black text-[#00F5D4] italic opacity-90"><NumberTicker value={r.questions} /></span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* TẦNG 4: YOUR RANK BAR (Bottom) */}
                <div className="mt-4">
                  <UserRankBar userRank={userRank} user={user} />
                </div>
              </>
            ) : rows.length === 0 && !loading && (
              <div className="py-20 text-center opacity-30 font-black tracking-widest uppercase text-sm">Trống</div>
            )}

            {/* Pagination Controls */}
            {rows.length > 0 && (
              <div className="flex items-center justify-center gap-4 mb-12 w-full mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="flex items-center gap-3 px-8 py-3.5 rounded-2xl border border-white/10 bg-black/40 text-[11px] font-black text-white/40 uppercase tracking-widest hover:text-[#00F5D4] hover:border-[#00F5D4]/40 hover:bg-[#00F5D4]/5 disabled:opacity-20 transition-all cursor-pointer shadow-lg"
                >
                  <span className="text-lg">←</span> Trang Trước
                </button>
                <div className="flex items-center gap-3">
                  {[...Array(3)].map((_, idx) => {
                    const pg = idx + 1;
                    const isActive = (currentPage + 1) === pg;
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx)}
                        className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all font-black text-sm cursor-pointer ${isActive
                          ? 'bg-[#00F5D4] border-[#00F5D4] text-black shadow-[0_0_25px_rgba(0,245,212,0.6)] scale-110'
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                          }`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <div className="text-white/20 px-1 font-black">...</div>
                </div>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!hasNextPage}
                  className="flex items-center gap-3 px-8 py-3.5 rounded-2xl border border-[#00F5D4]/30 bg-[#00F5D4]/10 text-[11px] font-black text-[#00F5D4] uppercase tracking-widest hover:bg-[#00F5D4]/20 hover:shadow-[0_0_20px_rgba(0,245,212,0.2)] transition-all cursor-pointer"
                >
                  Trang Sau <span className="text-lg">→</span>
                </button>
              </div>
            )}

            <div className="mb-10 text-[8px] font-black text-white/20 uppercase tracking-[0.4em] text-center w-full">
              Cập nhật lần cuối: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
          </>
        )}
      </div>

      {/* Quick Profile Pop-up */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)}>
          <div
            className="w-full max-w-sm bg-[#1A1F2C] border-2 border-[#00F5D4] rounded-3xl p-8 shadow-[0_0_50px_rgba(0,245,212,0.3)] animate-in fade-in zoom-in duration-300 relative"
            onClick={e => e.stopPropagation()}
          >
            <button className="absolute top-4 right-4 text-white/40 hover:text-white" onClick={() => setSelectedPlayer(null)}>✕</button>
            <div className="flex flex-col items-center gap-6">
              <Avatar name={selectedPlayer.name} size={84} borderColor="#00F5D4" />
              <div className="text-center">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedPlayer.name}</h3>
                <p className="text-[#00F5D4] text-[10px] font-black tracking-[0.3em] mt-1">DŨNG SĨ KINH THÁNH</p>
              </div>
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Sách giỏi nhất</div>
                  <div className="text-xs font-bold text-[#FFC300]">Sáng Thế Ký</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Tỉ lệ đúng</div>
                  <div className="text-xs font-bold text-[#00F5D4]">92%</div>
                </div>
              </div>
              <button
                className="w-full py-3 bg-[#00F5D4] text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform"
                onClick={() => alert(`Đang chuẩn bị màn thi đấu với ${selectedPlayer.name}...`)}
              >
                THÁCH ĐẤU NGAY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative Stars Overlay (CSS only) */}
      <style>{`
        .nebula-bg-extra { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .nebula-bg-extra::before {
          content: ''; position: absolute; inset: 0;
          background-image: 
            radial-gradient(1px 1px at 10% 20%, white, transparent),
            radial-gradient(1.5px 1.5px at 30% 50%, white, transparent),
            radial-gradient(1px 1px at 70% 30%, white, transparent),
            radial-gradient(2px 2px at 90% 80%, white, transparent),
            radial-gradient(1px 1px at 50% 90%, white, transparent);
          opacity: 0.1;
        }

        @keyframes shadow-pulse {
          0% { text-shadow: 0 0 5px rgba(0, 245, 212, 0); }
          50% { text-shadow: 0 0 15px rgba(0, 245, 212, 0.8); }
          100% { text-shadow: 0 0 5px rgba(0, 245, 212, 0); }
        }
        .shadow-pulse { animation: shadow-pulse 2s infinite; }

        @keyframes neon-burst {
          0% { transform: scale(0); opacity: 1; box-shadow: 0 0 0 0 rgba(0, 245, 212, 0.7); }
          100% { transform: scale(4); opacity: 0; box-shadow: 0 0 20px 10px rgba(0, 245, 212, 0); }
        }
        .neon-burst-effect {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #00F5D4;
          border-radius: 50%;
          pointer-events: none;
          animation: neon-burst 0.6s ease-out forwards;
          z-index: 0;
          transform: translate(-50%, -50%);
        }

        @keyframes radiate-gold {
          0% { box-shadow: 0 0 20px 5px rgba(255, 202, 40, 0.4); transform: scale(1); filter: brightness(1); }
          50% { box-shadow: 0 0 40px 15px rgba(255, 202, 40, 0.6); transform: scale(1.02); filter: brightness(1.3); }
          100% { box-shadow: 0 0 20px 5px rgba(255, 202, 40, 0.4); transform: scale(1); filter: brightness(1); }
        }
        .radiating-glow-gold { animation: radiate-gold 4s infinite ease-in-out; }

        @keyframes radiate-silver {
          0% { box-shadow: 0 0 15px 2px rgba(192, 192, 192, 0.3); }
          50% { box-shadow: 0 0 30px 8px rgba(192, 192, 192, 0.5); }
          100% { box-shadow: 0 0 15px 2px rgba(192, 192, 192, 0.3); }
        }
        .radiating-glow-silver { animation: radiate-silver 4s infinite ease-in-out; }

        @keyframes radiate-bronze {
          0% { box-shadow: 0 0 15px 2px rgba(205, 127, 50, 0.3); }
          50% { box-shadow: 0 0 30px 8px rgba(205, 127, 50, 0.5); }
          100% { box-shadow: 0 0 15px 2px rgba(205, 127, 50, 0.3); }
        }
        .radiating-glow-bronze { animation: radiate-bronze 4s infinite ease-in-out; }

        /* Shine Sweep Animation */
        @keyframes shine-sweep {
          0% { left: -150%; }
          100% { left: 150%; }
        }
        .shine-sweep {
          animation: shine-sweep 3s infinite ease-in-out;
          animation-delay: 1s;
        }

        /* Premium Shield Hover Effect */
        .premium-shield-hover:hover {
          transform: translateY(-8px) scale(1.03);
          filter: brightness(1.2);
          box-shadow: 0 0 50px rgba(255, 202, 40, 0.8) !important;
        }
      `}</style>
      <div className="nebula-bg-extra"></div>
    </div>
  )
}

export default Leaderboard
