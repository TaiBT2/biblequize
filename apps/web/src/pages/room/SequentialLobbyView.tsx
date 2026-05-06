import React, { useState } from 'react'

type Player = {
  id: string; userId: string; username: string; avatarUrl?: string;
  isReady: boolean; score: number;
}

type Props = {
  roomCode: string
  roomName: string
  questionCount: number
  timePerQuestion: number
  maxPlayers: number
  players: Player[]
  hostId: string
  isHost: boolean
  onStart: () => void
  onLeave: () => void
  // Connection + error state surfaced from the parent so the sequential
  // lobby can show the same reconnect banner / error fallback as the
  // standard lobby. Without these, members lose all WS feedback when the
  // socket drops or the room is closed by the host.
  connected?: boolean
  reconnecting?: boolean
  error?: string | null
}

const FILL = { fontVariationSettings: "'FILL' 1" } as const

const SequentialLobbyView: React.FC<Props> = ({
  roomCode, roomName, questionCount, timePerQuestion, maxPlayers, players,
  hostId, isHost, onStart, onLeave, connected = true, reconnecting = false, error = null,
}) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(roomCode); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }
  // Pad with empty slots to show "+ slots remaining"
  const emptySlots = Math.max(0, Math.min(maxPlayers - players.length, 8 - players.length))

  // Error state — host closed room, room expired, network failure on retry.
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0b13' }}>
        <div className="text-center space-y-4 max-w-sm">
          <span className="material-symbols-outlined text-error text-5xl">error</span>
          <p className="text-on-surface text-base">{error}</p>
          <button onClick={onLeave} className="text-secondary underline text-sm">
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-on-surface px-4 py-5 max-w-3xl mx-auto" style={{ background: '#0a0b13' }}>
      {/* Reconnecting banner — same UX as the standard lobby */}
      {reconnecting && (
        <div className="fixed top-0 left-0 right-0 z-[70] bg-error-container/90 text-on-error-container text-center py-2 text-sm font-medium">
          <span className="material-symbols-outlined text-sm align-middle mr-1">wifi_off</span>
          Đang kết nối lại...
        </div>
      )}
      {!connected && !reconnecting && (
        <div className="fixed top-0 left-0 right-0 z-[70] bg-orange-500/20 text-orange-300 text-center py-2 text-xs font-medium">
          Mất kết nối
        </div>
      )}

      {/* Page header */}
      <div className="mb-5 flex items-center gap-2.5">
        <button onClick={onLeave} className="text-on-surface/60 hover:text-on-surface" aria-label="Back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(124,58,237,0.1) 100%)', border: '1px solid rgba(167,139,250,0.3)' }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: '#a78bfa', ...FILL }}>play_circle</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] font-extrabold truncate">Phòng "{roomName}"</h2>
            <p className="text-on-surface-variant text-[12px]">Đang chờ thành viên tham gia</p>
          </div>
        </div>
      </div>

      {/* Lobby card */}
      <div className="rounded-2xl p-5 mb-4"
        style={{
          background: 'rgba(50,52,64,0.4)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(232,168,50,0.15)',
        }}
      >
        {/* Room code wrap */}
        <div className="rounded-xl px-4 py-3.5 mb-4 flex items-center justify-between"
          style={{ background: 'rgba(17,19,30,0.5)', border: '1px solid rgba(232,168,50,0.2)' }}>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[1px] text-on-surface/60 mb-0.5">Mã tham gia · Chia sẻ với anh chị em</div>
            <div className="text-[22px] font-extrabold tabular-nums" style={{ color: '#e8a832', letterSpacing: 4 }}>{roomCode}</div>
          </div>
          <button onClick={handleCopy}
            className="rounded-lg px-3 py-2 text-[11px] font-bold flex items-center gap-1.5"
            style={{ background: 'rgba(232,168,50,0.15)', color: '#e8a832', border: '1px solid rgba(232,168,50,0.3)' }}>
            <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Đã copy' : 'Sao chép'}
          </button>
        </div>

        {/* Config strip 3 cells */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: 'collections_bookmark', value: `${questionCount} câu`, label: 'Quiz Set' },
            { icon: 'timer', value: `${timePerQuestion}s`, label: 'Mỗi câu' },
            { icon: 'forum', value: 'Tuần tự', label: 'Có pause' },
          ].map((c, i) => (
            <div key={i} className="rounded-lg px-3 py-2.5 text-center"
              style={{ background: 'rgba(17,19,30,0.4)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="material-symbols-outlined text-[16px] block mb-1" style={{ color: '#a78bfa' }}>{c.icon}</span>
              <div className="text-[14px] font-extrabold">{c.value}</div>
              <div className="text-[9px] uppercase tracking-wide text-on-surface/60 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Players header */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-green-400">groups</span>
            Người tham gia
          </div>
          <span className="text-[11px] font-bold rounded-md px-2 py-0.5 bg-green-500/10 text-green-400">
            {players.length} / {maxPlayers}
          </span>
        </div>

        {/* Players grid */}
        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
          {players.map(p => {
            const isHostP = p.userId === hostId
            const ready = !isHostP && p.isReady
            return (
              <div key={p.userId} className="text-center relative">
                {isHostP && <div className="absolute -top-1.5 left-1/2 translate-x-[60%] text-[14px]">👑</div>}
                <div className={`w-12 h-12 rounded-full mx-auto mb-1.5 grid place-items-center font-extrabold text-[18px] border-2 ${
                  isHostP ? 'border-[#fbbf24]' : ready ? 'border-green-400' : 'border-white/10'
                }`}
                  style={{
                    background: isHostP
                      ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
                      : ready
                        ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                        : 'rgba(50,52,64,0.5)',
                    color: isHostP || ready ? '#11131e' : '#d1d5db',
                  }}>
                  {p.username[0]?.toUpperCase()}
                </div>
                <div className="text-[11px] font-semibold text-on-surface/85 truncate">{p.username}</div>
                <div className={`text-[9px] uppercase tracking-wider font-bold mt-0.5 ${
                  isHostP ? 'text-[#fbbf24]' : ready ? 'text-green-400' : 'text-on-surface/40'
                }`}>
                  {isHostP ? 'Trưởng' : ready ? 'Sẵn sàng' : 'Đang vào...'}
                </div>
              </div>
            )
          })}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-1.5 grid place-items-center text-white/20 text-[20px] border-2 border-dashed border-white/10">
                +
              </div>
              <div className="text-[11px] text-on-surface/40">Chờ...</div>
            </div>
          ))}
        </div>

        {/* Action row */}
        {isHost ? (
          <>
            <div className="flex gap-2.5 mb-2.5">
              <button onClick={onLeave}
                className="rounded-xl px-4 py-3.5 text-[13px] font-bold"
                style={{ background: 'rgba(50,52,64,0.6)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.08)' }}>
                Đóng phòng
              </button>
              <button onClick={onStart}
                className="flex-1 rounded-xl py-4 text-[15px] font-extrabold flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)', color: '#11131e', boxShadow: '0 6px 20px rgba(232,168,50,0.3)' }}>
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                Bắt đầu chơi
              </button>
            </div>
            <div className="text-center text-[11px] text-on-surface/60">
              <strong className="text-[#fbbf24]">Lưu ý:</strong> Khi bắt đầu, người vào sau sẽ không tham gia được
            </div>
          </>
        ) : (
          <div className="rounded-lg px-4 py-3 flex items-center justify-center gap-1.5 text-[12px]"
            style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', color: '#c4b5fd' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
            Đang chờ trưởng phòng bắt đầu...
          </div>
        )}
      </div>
    </div>
  )
}

export default SequentialLobbyView
