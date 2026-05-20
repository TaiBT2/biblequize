// QP-9 — Distinct card variant for Đấu Nhanh rooms in the active room
// grid. Indigo accent, "Đấu Nhanh" pill badge, "Phòng #{roomCode}" title,
// kicker shows actual mode + scope (config is creator-chosen per pivot,
// not Speed-Race-only). Source indicator: cpu for DATABASE, auto_awesome
// for AI_GENERATED (room.questionSource = 'AI_GENERATED' from QP-2).

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import AvatarStack from './AvatarStack'
import { formatBookScope, type PublicRoom } from './types'
import { MODE_META, type RoomModeId } from '../create-room/modeMeta'

const INDIGO = '#6366f1'
const INDIGO_LIGHT = '#a5b4fc'
const INDIGO_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'

function modeShortLabel(id: string): string {
  switch (id) {
    case 'SPEED_RACE':    return 'Speed Race'
    case 'BATTLE_ROYALE': return 'Battle Royale'
    case 'TEAM_VS_TEAM':  return 'Team vs Team'
    case 'SUDDEN_DEATH':  return 'Đấu vương'
    default:              return id
  }
}

export default function QuickMatchRoomCard({ room }: { room: PublicRoom }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const mode = MODE_META[room.mode as RoomModeId] ?? MODE_META.SPEED_RACE
  const isFull = room.currentPlayers >= room.maxPlayers
  const isAi = (room.bookScope === '' && false) || /AI/i.test((room as { questionSource?: string }).questionSource ?? '')

  const handleJoin = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (joining || isFull) return
    setJoining(true); setJoinError(null)
    try {
      const res = await api.post('/api/rooms/join', { roomCode: room.roomCode })
      const joined = res.data.room
      const target = joined.status === 'IN_PROGRESS' ? 'quiz' : 'lobby'
      navigate(`/room/${joined.id}/${target}`, { state: { room: joined, mode: joined.mode, viewerUserId: res.data.viewerUserId } })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setJoinError(msg || t('multiplayer.joinError'))
      setJoining(false)
    }
  }

  return (
    <article
      data-testid="room-card"
      className="rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(50,52,64,0.4) 100%)`,
        border: `1px solid ${isFull ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.25)'}`,
        cursor: isFull ? 'default' : 'pointer',
      }}
      onClick={() => { if (!isFull) handleJoin() }}
    >
      {/* "Đấu Nhanh" pill (top-right) */}
      <div
        className="absolute top-3 right-3 px-2 py-0.5 rounded-md"
        style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}
      >
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: INDIGO_LIGHT }}>
          {t('multiplayer.filterQuickMatch')}
        </span>
      </div>

      {/* Top row: indigo icon + mode kicker + room code */}
      <div className="flex items-start gap-2 pr-16">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: INDIGO }}>rocket_launch</span>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: INDIGO_LIGHT }}>
            {t('multiplayer.quickMatch.noHost', { mode: modeShortLabel(room.mode) })}
          </div>
          <div className="text-sm font-bold text-white truncate">{t('multiplayer.quickMatch.roomCode', { code: room.roomCode })}</div>
        </div>
      </div>

      {/* Source + scope line */}
      <div className="flex items-center gap-2 text-[11px] text-white/55">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14, color: INDIGO_LIGHT, fontVariationSettings: isAi ? "'FILL' 1" : undefined }}
        >
          {isAi ? 'auto_awesome' : 'memory'}
        </span>
        <span>{isAi ? t('multiplayer.quickMatch.aiSource') : t('multiplayer.quickMatch.serverSource')}</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>{formatBookScope(t, room.bookScope)}</span>
      </div>

      {/* Avatar stack + meta */}
      <div className="flex items-center justify-between gap-2">
        <AvatarStack initials={room.playerInitials ?? []} current={room.currentPlayers} max={room.maxPlayers} />
        <div className="text-[10px] text-white/40 text-right flex-shrink-0">
          {t('multiplayer.quickMatch.questionsMeta', { count: room.questionCount ?? 10, time: room.timePerQuestion ?? 30 })}
        </div>
      </div>

      {joinError && (
        <div className="text-[11px] px-2 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
          ⚠ {joinError}
        </div>
      )}

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleJoin() }}
        disabled={joining || isFull}
        className="w-full h-9 rounded-lg text-white text-[12px] font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: isFull ? 'rgba(255,255,255,0.06)' : INDIGO_GRADIENT, color: isFull ? 'rgba(255,255,255,0.4)' : '#fff' }}
      >
        {joining ? t('multiplayer.quickMatch.ctaJoining') : isFull ? t('multiplayer.quickMatch.ctaFull') : t('multiplayer.quickMatch.ctaEnterNow')}
      </button>

      {/* Reference imports to keep the variable usage explicit. */}
      <span className="hidden">{mode.id}</span>
    </article>
  )
}
