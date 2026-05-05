import React from 'react'

export type FinalPlayer = {
  playerId: string
  username: string
  score: number
  correctAnswers?: number
  totalAnswered?: number
  averageReactionTime?: number
}

type Props = {
  roomName: string
  results: FinalPlayer[]
  myUsername: string
  isHost: boolean
  totalQuestions: number
  totalSeconds?: number
  onShare?: () => void
  onCreateNew?: () => void
  onClose: () => void
}

const fmtAvg = (ms?: number): string => {
  if (!ms || ms <= 0) return '—'
  const seconds = ms / 1000
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const fmtElapsed = (s?: number): string => {
  if (!s) return ''
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m} phút ${sec} giây`
}

const SequentialFinalView: React.FC<Props> = ({
  roomName, results, myUsername, isHost, totalQuestions, totalSeconds, onShare, onCreateNew, onClose,
}) => {
  const sorted = [...results].sort((a, b) => b.score - a.score)
  const top3 = sorted.slice(0, 3)

  return (
    <div className="min-h-screen text-on-surface px-4 py-6 max-w-3xl mx-auto" style={{ background: '#0a0b13' }} data-testid="sequential-final">
      {/* Final banner */}
      <div className="rounded-2xl p-5 text-center mb-4"
        style={{ background: 'linear-gradient(135deg, rgba(232,168,50,0.15) 0%, rgba(50,52,64,0.4) 60%)', border: '1px solid rgba(232,168,50,0.3)' }}>
        <div className="text-[48px] mb-2" style={{ filter: 'drop-shadow(0 4px 12px rgba(251,191,36,0.4))' }}>🎉</div>
        <h3 className="text-xl font-extrabold mb-1">Hoàn thành!</h3>
        <p className="text-on-surface/60 text-[12px]">
          "{roomName}" · {totalQuestions} câu · {sorted.length} người chơi{totalSeconds ? ` · ${fmtElapsed(totalSeconds)}` : ''}
        </p>
      </div>

      {/* Podium 3-col grid (1fr 1.2fr 1fr) — second/first/third order per mockup */}
      {top3.length > 0 && (
        <div className="grid gap-2 items-end mb-4" style={{ gridTemplateColumns: '1fr 1.2fr 1fr' }}>
          {[top3[1], top3[0], top3[2]].map((p, idx) => {
            if (!p) return <div key={idx} />
            const place = idx === 0 ? 'second' : idx === 1 ? 'first' : 'third'
            const medal = place === 'first' ? '🥇' : place === 'second' ? '🥈' : '🥉'
            const borderColor = place === 'first' ? 'rgba(251,191,36,0.4)'
              : place === 'second' ? 'rgba(209,213,219,0.25)' : 'rgba(217,119,6,0.3)'
            const avatarBg = place === 'first' ? 'linear-gradient(135deg, #fbbf24, #d97706)'
              : place === 'second' ? 'linear-gradient(135deg, #93c5fd, #3b82f6)' : 'linear-gradient(135deg, #f472b6, #ec4899)'
            const avatarColor = place === 'third' ? '#fff' : '#11131e'
            const avatarSize = place === 'first' ? 48 : 40
            return (
              <div key={p.playerId} className="rounded-xl text-center relative px-2 py-3.5"
                style={{ background: 'rgba(50,52,64,0.4)', border: `1.5px solid ${borderColor}`, paddingTop: place === 'first' ? 22 : 14 }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[22px]">{medal}</div>
                <div className="rounded-full mx-auto mb-1.5 grid place-items-center font-extrabold border-2"
                  style={{
                    width: avatarSize, height: avatarSize,
                    fontSize: place === 'first' ? 18 : 14,
                    background: avatarBg, color: avatarColor,
                    borderColor: place === 'first' ? '#fbbf24' : place === 'second' ? '#93c5fd' : '#f472b6',
                  }}>
                  {p.username[0]?.toUpperCase()}
                </div>
                <div className="text-[11px] font-bold truncate mb-1">{p.username}</div>
                <div className="font-extrabold tabular-nums" style={{ color: '#e8a832', fontSize: place === 'first' ? 16 : 14 }}>
                  {p.score}
                </div>
                <div className="text-[9px] text-on-surface/60 mt-0.5">
                  {p.correctAnswers ?? 0}/{totalQuestions}{p.averageReactionTime ? ` · ${fmtAvg(p.averageReactionTime)} TB` : ''}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full leaderboard list */}
      <div className="rounded-xl p-1.5 mb-4" style={{ background: 'rgba(50,52,64,0.3)' }}>
        {sorted.map((p, idx) => {
          const isMe = p.username === myUsername
          return (
            <div key={p.playerId}
              className={`grid gap-2.5 items-center px-2.5 py-2.5 rounded-lg ${isMe ? 'border' : ''}`}
              style={{
                gridTemplateColumns: '28px 32px 1fr auto',
                background: isMe ? 'rgba(232,168,50,0.1)' : 'transparent',
                borderColor: isMe ? 'rgba(232,168,50,0.25)' : 'transparent',
              }}>
              <span className={`text-center text-[12px] font-extrabold ${isMe ? 'text-[#fbbf24]' : 'text-on-surface/40'}`}>
                {idx + 1}
              </span>
              <div className="w-8 h-8 rounded-full grid place-items-center text-[12px] font-bold"
                style={{
                  background: isMe ? 'linear-gradient(135deg, #e8a832, #d97706)'
                    : idx === 0 ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                    : 'linear-gradient(135deg, #6b7280, #4b5563)',
                  color: isMe || idx === 0 ? '#11131e' : '#f3f4f6',
                }}>
                {p.username[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold truncate flex items-center gap-1.5">
                  {p.username}
                  {isMe && <span className="text-[8px] font-extrabold rounded px-1.5 py-0.5" style={{ background: 'rgba(232,168,50,0.2)', color: '#fbbf24' }}>BẠN</span>}
                </div>
                <div className="text-[10px] text-on-surface/60 mt-0.5">
                  {p.correctAnswers ?? 0}/{totalQuestions} đúng{p.averageReactionTime ? ` · ${fmtAvg(p.averageReactionTime)} trung bình` : ''}
                </div>
              </div>
              <div className="text-[13px] font-extrabold tabular-nums" style={{ color: '#e8a832' }}>{p.score}</div>
            </div>
          )
        })}
      </div>

      {/* Action row */}
      <div className="flex gap-2.5">
        <button onClick={onShare ?? onClose}
          className="rounded-xl px-4 py-3.5 text-[13px] font-bold flex items-center gap-1.5"
          style={{ background: 'rgba(50,52,64,0.6)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="material-symbols-outlined text-[16px]">share</span>
          Chia sẻ kết quả
        </button>
        {isHost ? (
          <button onClick={onCreateNew ?? onClose}
            className="flex-1 rounded-xl py-3.5 text-[14px] font-extrabold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)', color: '#11131e', boxShadow: '0 6px 20px rgba(232,168,50,0.3)' }}>
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Tạo phòng mới
          </button>
        ) : (
          <button onClick={onClose}
            className="flex-1 rounded-xl py-3.5 text-[14px] font-extrabold"
            style={{ background: 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)', color: '#11131e' }}>
            Quay về nhóm
          </button>
        )}
      </div>
    </div>
  )
}

export default SequentialFinalView
