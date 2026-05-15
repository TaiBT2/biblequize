// MLR — Multiplayer Lobby page, redesigned per
// docs/MULTIPLAYER/MOCKUP_MULTIPLAYER_LOBBY.html.
//
// Structure: top header (kicker + live count + title + "Bộ câu hỏi") →
// hero row 3:2 (Tạo phòng card + Join code) → mode showcase (4 cards) →
// active rooms section (filter chips + 2 states). BE contract
// (/api/rooms/public + /api/rooms/join) and i18n keys unchanged.

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuth } from '../store/authStore'
import { MODE_LIST, MODE_META, type RoomModeId } from './create-room/modeMeta'
import JoinByCodeBar from './multiplayer/JoinByCodeBar'
import RoomCard from './multiplayer/RoomCard'
import EmptyState from './multiplayer/EmptyState'
import SoloArenaEntryCard from './multiplayer/SoloArenaEntryCard'
import type { PublicRoom, RoomMode, SortOption } from './multiplayer/types'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

const MODE_TAGLINE: Record<RoomModeId, { tag: string; desc: string; range: string }> = {
  SPEED_RACE:    { tag: 'Phổ biến',  desc: 'Đáp nhanh, điểm cao. Tốc độ × độ chính xác.', range: '2–10 người' },
  BATTLE_ROYALE: { tag: 'Kịch tính', desc: 'Sai 1 câu là bị loại. Người cuối cùng thắng.',  range: '3–20 người' },
  TEAM_VS_TEAM:  { tag: 'Nhóm',      desc: '2 đội đối kháng. Tổng điểm đội cao hơn thắng.', range: '4–20 người' },
  SUDDEN_DEATH:  { tag: '1v1',       desc: 'Đối đầu 1v1, sai là thua. Hàng đợi thách đấu.', range: '2–20 người' },
}

const MODE_DISPLAY_LABEL: Record<RoomModeId, string> = {
  SPEED_RACE: 'Speed Race',
  BATTLE_ROYALE: 'Battle Royale',
  TEAM_VS_TEAM: 'Team vs Team',
  SUDDEN_DEATH: 'Đấu vương',
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export default function Multiplayer() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  const [sort, setSort] = useState<SortOption>('newest')
  const [modeFilter, setModeFilter] = useState<RoomMode | 'ALL'>('ALL')
  const [codeJoinError, setCodeJoinError] = useState<string | null>(null)
  const [isCodeJoining, setIsCodeJoining] = useState(false)
  const [roomEndedBanner, setRoomEndedBanner] = useState<string | null>(null)

  // Show banner once when redirected here with a roomEndedReason in nav state.
  useEffect(() => {
    const navState = location.state as { roomEndedReason?: string } | null
    if (navState?.roomEndedReason) {
      setRoomEndedBanner(navState.roomEndedReason)
      window.history.replaceState({}, '')
      const timer = setTimeout(() => setRoomEndedBanner(null), 6000)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleJoinByCode = async (code: string) => {
    setIsCodeJoining(true)
    setCodeJoinError(null)
    try {
      const res = await api.post('/api/rooms/join', { roomCode: code })
      const room = res.data.room
      const target = room.status === 'IN_PROGRESS' ? 'quiz' : 'lobby'
      navigate(`/room/${room.id}/${target}`, { state: { room, mode: room.mode, viewerUserId: res.data.viewerUserId } })
    } catch (err: any) {
      setCodeJoinError(err?.response?.data?.message || 'Mã phòng không hợp lệ hoặc phòng đã đầy')
      setIsCodeJoining(false)
    }
  }

  useEffect(() => { if (!isAuthenticated) navigate('/login') }, [isAuthenticated, navigate])

  const { data, isLoading, isError, refetch, isFetching } = useQuery<{ success: boolean; rooms: PublicRoom[] }>({
    queryKey: ['public-rooms'],
    queryFn: () => api.get('/api/rooms/public').then(r => r.data),
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 15000,
  })

  if (!isAuthenticated) return null

  const allRooms = data?.rooms ?? []
  const filtered = modeFilter === 'ALL' ? allRooms : allRooms.filter(r => r.mode === modeFilter)
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'filling') return (b.currentPlayers / b.maxPlayers) - (a.currentPlayers / a.maxPlayers)
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  })

  const liveCount = allRooms.filter(r => r.status === 'LOBBY' || r.status === 'IN_PROGRESS').length

  return (
    <div data-testid="multiplayer-page" className="max-w-[1180px] mx-auto space-y-6">

      {roomEndedBanner && (
        <div
          data-testid="multiplayer-room-ended-banner"
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(232,168,50,0.08)', border: '1px solid rgba(232,168,50,0.25)', color: '#fbbf24' }}
        >
          <span className="material-symbols-outlined text-lg">info</span>
          <span className="text-sm font-medium">
            {t(`room.ended.${roomEndedBanner.toLowerCase()}`, t('room.ended.generic', 'Phòng đã đóng'))}
          </span>
        </div>
      )}

      {/* ── Top header ── */}
      <header className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold" style={{ color: '#e8a832' }}>
              {t('multiplayer.subtitle', 'Chế độ Đa người chơi')}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5 text-[11px] text-white/60">
              <LiveDot />
              <span><span className="font-bold text-white">{liveCount}</span> phòng đang sống</span>
            </span>
          </div>
          <h1 className="text-[28px] md:text-[34px] font-extrabold tracking-tight leading-tight text-white">
            {t('multiplayer.title', 'Phòng Chơi')}
          </h1>
          <p className="text-[13px] text-white/55 mt-1">
            {t('multiplayer.desc', 'Realtime · 4 chế độ · Mời bạn bè cùng học Kinh Thánh qua game')}
          </p>
        </div>

        <button
          onClick={() => navigate('/my-sets')}
          className="hidden md:flex items-center gap-2 px-4 h-10 rounded-lg text-[13px] font-semibold transition-colors"
          style={{ background: 'rgba(50,52,64,0.4)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}
        >
          <span className="material-symbols-outlined text-sm" style={FILL_1}>menu_book</span>
          Bộ câu hỏi
        </button>
      </header>

      {/* ── Thin "Tham gia mã" bar (above hero per canonical mockup) ── */}
      <JoinByCodeBar onJoin={handleJoinByCode} disabled={isCodeJoining} error={codeJoinError} />

      {/* ── Hero row 50/50: Tạo phòng (gold) + Solo Arena (indigo) ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(232,168,50,0.12), rgba(231,194,104,0.06))',
            border: '1px solid rgba(232,168,50,0.25)',
            boxShadow: '0 0 24px -8px rgba(232,168,50,0.3)',
          }}
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(232,168,50,0.15) 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #e8a832, #e7c268)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#11131e', fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
              </div>
              <div className="text-[10px] tracking-widest uppercase font-bold" style={{ color: '#e8a832' }}>
                Bạn sẽ là Quản trò
              </div>
            </div>
            <h2 className="text-[20px] font-extrabold mb-1.5 leading-tight text-white">Tạo phòng đa người chơi</h2>
            <p className="text-[12.5px] text-white/65 mb-4 leading-relaxed">
              Quản trò không trả lời câu hỏi — bạn dẫn dắt, theo dõi, và đảm bảo công bằng cho người chơi.
              Phù hợp cho nhóm tế bào, Bible study, thi đua bạn bè.
            </p>
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <FeatureTag icon="group" label="2–20 người" />
              <FeatureTag icon="layers" label="4 chế độ" />
              <FeatureTag icon="wifi" label="Realtime" />
            </div>
            <button
              data-testid="multiplayer-create-btn"
              onClick={() => navigate('/room/create')}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg text-[14px] font-bold transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #e8a832, #e7c268)', color: '#1a1226' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              {t('multiplayer.createRoom', 'Tạo Phòng')}
            </button>
          </div>
        </div>

        <SoloArenaEntryCard />
      </section>

      {/* ── Mode showcase ── */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="text-[18px] font-bold tracking-tight text-white">4 chế độ chơi</h3>
            <p className="text-[12px] text-white/50">Mỗi mode có luật & cách tính điểm riêng — chọn mode phù hợp khi tạo phòng</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {MODE_LIST.map(m => {
            const meta = MODE_TAGLINE[m.id]
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate(`/room/create?mode=${m.id}`)}
                className="rounded-xl p-5 text-left transition-all hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${hexToRgba(m.color, 0.10)}, ${hexToRgba(m.color, 0.02)})`,
                  border: `1px solid ${hexToRgba(m.color, 0.18)}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = hexToRgba(m.color, 0.4) }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = hexToRgba(m.color, 0.18) }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: m.color, fontVariationSettings: "'FILL' 1" }}>
                    {m.icon}
                  </span>
                  <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: m.color }}>
                    {meta.tag}
                  </span>
                </div>
                <h4 className="text-[15px] font-bold mb-1 text-white">{MODE_DISPLAY_LABEL[m.id]}</h4>
                <p className="text-[11px] text-white/55 leading-relaxed mb-3">{meta.desc}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>group</span>
                  <span>{meta.range}</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Active rooms section ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[18px] font-bold tracking-tight text-white">
              {t('multiplayer.waitingRooms', 'Phòng đang chờ')}
            </h3>
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)' }}
            >
              <LiveDot />
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Live · {liveCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title={t('multiplayer.refresh', 'Làm mới')}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <span className={`material-symbols-outlined text-white/70 ${isFetching ? 'animate-spin' : ''}`} style={{ fontSize: 14 }}>refresh</span>
            </button>
          </div>
        </div>

        {/* Filter chips: All + 4 modes + divider + sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterChip active={modeFilter === 'ALL'} onClick={() => setModeFilter('ALL')}>Tất cả</FilterChip>
          {MODE_LIST.map(m => (
            <FilterChip
              key={m.id}
              active={modeFilter === m.id}
              onClick={() => setModeFilter(m.id)}
              icon={m.icon}
              iconColor={m.color}
            >
              {MODE_DISPLAY_LABEL[m.id]}
            </FilterChip>
          ))}
          <div className="w-px h-5 bg-white/10 mx-1" />
          <FilterChip active={sort === 'newest'} onClick={() => setSort('newest')}>Mới nhất</FilterChip>
          <FilterChip active={sort === 'filling'} onClick={() => setSort('filling')}>Sắp đầy</FilterChip>
        </div>

        {/* Rooms list (loading / error / empty / populated) */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-44 rounded-xl animate-pulse" style={{ background: 'rgba(50,52,64,0.3)' }} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} retrying={isFetching} />
        ) : sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sorted.map(room => <RoomCard key={room.id} room={room} />)}
          </div>
        )}
      </section>
    </div>
  )
}

// ── Local sub-components ─────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative inline-block w-2 h-2">
      <span className="absolute inset-0 rounded-full bg-green-500" />
      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
    </span>
  )
}

function FeatureTag({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      className="px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1"
      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{icon}</span>
      {label}
    </span>
  )
}

function FilterChip({
  active, onClick, children, icon, iconColor,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  icon?: string
  iconColor?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-semibold transition-colors"
      style={{
        background: active ? 'rgba(232,168,50,0.15)' : 'transparent',
        border: `1px solid ${active ? 'rgba(232,168,50,0.4)' : 'rgba(255,255,255,0.10)'}`,
        color: active ? '#e8a832' : 'rgba(255,255,255,0.7)',
      }}
    >
      {icon && (
        <span className="material-symbols-outlined" style={{ fontSize: 12, color: iconColor }}>{icon}</span>
      )}
      {children}
    </button>
  )
}

function ErrorState({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <div
      data-testid="multiplayer-error-state"
      className="flex flex-col items-center justify-center py-20 rounded-2xl"
      style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}
    >
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: 'rgba(248,113,113,0.12)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#f87171' }}>error</span>
      </div>
      <h5 className="text-lg font-bold text-white mb-2">Không thể tải danh sách phòng</h5>
      <p className="text-sm text-white/55 text-center max-w-xs mb-6">Hệ thống đang gặp sự cố. Vui lòng thử lại.</p>
      <button
        onClick={onRetry}
        disabled={retrying}
        className="py-3 px-8 rounded-xl font-bold text-sm disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #e8a832, #e7c268)', color: '#1a1226' }}
      >
        {retrying ? 'Đang tải...' : 'Thử lại'}
      </button>
    </div>
  )
}
