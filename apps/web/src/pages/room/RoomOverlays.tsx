import React, { useEffect } from 'react'

const FILL_STYLE = { fontVariationSettings: "'FILL' 1" } as const

export type PlayerScore = {
  playerId: string; username: string; score: number;
  correctAnswers: number; totalAnswered: number; accuracy: number;
  finalRank?: number; playerStatus?: string;
}

type Question = { id: string; content: string; options: string[] }

// ── Podium screen (Battle Royale / Speed Race end) ──
export const PodiumScreen: React.FC<{ results: PlayerScore[]; onClose: () => void }> = ({ results, onClose }) => {
  const top3 = results.filter(r => r.finalRank && r.finalRank <= 3).sort((a, b) => (a.finalRank ?? 99) - (b.finalRank ?? 99))
  const podiumColors = ['from-secondary to-tertiary', 'from-primary/60 to-primary/30', 'from-[#cd7f32]/60 to-[#cd7f32]/30']
  const podiumHeights = ['h-36', 'h-28', 'h-22']
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-6 overflow-auto">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-secondary/8 blur-[150px] rounded-full" />
      </div>
      <div className="flex items-center gap-3 mb-10">
        <span className="material-symbols-outlined text-secondary text-4xl" style={FILL_STYLE}>trophy</span>
        <h1 className="font-headline text-3xl md:text-4xl font-black tracking-tighter text-on-surface">KET QUA CUOI</h1>
      </div>
      <div className="flex items-end gap-4 mb-10">
        {podiumOrder.map((p) => {
          const rank = (p!.finalRank ?? 1) - 1
          return (
            <div key={p!.playerId} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-surface-container-high border-2 border-secondary/30 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-secondary" style={FILL_STYLE}>
                  {rank === 0 ? 'military_tech' : rank === 1 ? 'workspace_premium' : 'stars'}
                </span>
              </div>
              <div className="text-on-surface font-bold text-sm mb-1 max-w-[90px] text-center truncate">{p!.username}</div>
              <div className="text-secondary text-xs font-bold mb-2">{p!.score} diem</div>
              <div className={`${podiumHeights[rank]} w-24 bg-gradient-to-t ${podiumColors[rank]} rounded-t-2xl flex items-end justify-center pb-3 border border-white/5`}>
                <span className="text-on-surface font-black text-2xl">#{rank + 1}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="w-full max-w-sm bg-surface-container rounded-2xl border border-outline-variant/10 p-5 mb-8">
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-4">Tat ca nguoi choi</div>
        <div className="space-y-2 max-h-44 overflow-auto">
          {results.map((r, idx) => (
            <div key={r.playerId} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/5">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-surface-container-highest text-on-surface-variant'}`}>{r.finalRank ?? idx + 1}</span>
                <span className="text-on-surface text-sm font-medium">{r.username}</span>
              </div>
              <span className="text-on-surface font-bold text-sm">{r.score}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onClose} className="gold-gradient text-on-secondary font-black py-3.5 px-10 rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-secondary/20 active:scale-95 transition-all hover:brightness-110">
        Ve Phong Cho
      </button>
    </div>
  )
}

// ── Elimination screen (Battle Royale) ──
export const EliminationScreen: React.FC<{
  rank: number; totalPlayers: number; correctIndex: number | null; question: Question | null; onSpectate: () => void;
}> = ({ rank, totalPlayers, correctIndex, question, onSpectate }) => (
  <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-40 p-6">
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[50%] h-[50%] bg-error/5 blur-[120px] rounded-full" />
    </div>
    <div className="w-20 h-20 rounded-full bg-error/10 border-2 border-error/30 flex items-center justify-center mb-6">
      <span className="material-symbols-outlined text-error text-4xl" style={FILL_STYLE}>skull</span>
    </div>
    <h1 className="font-headline text-3xl font-black tracking-tighter text-error mb-2">Ban da bi loai!</h1>
    <p className="text-on-surface-variant text-lg mb-1">
      Thu hang: <b className="text-on-surface font-black">#{rank}</b>/{totalPlayers}
    </p>
    {correctIndex !== null && question && (
      <div className="mt-4 mb-8 bg-surface-container rounded-2xl border border-outline-variant/10 px-5 py-4 max-w-xs text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant block mb-2">Dap an dung</span>
        <span className="text-green-400 font-bold text-sm">
          {String.fromCharCode(65 + correctIndex)}. {question.options[correctIndex]}
        </span>
      </div>
    )}
    <button onClick={onSpectate} className="flex items-center gap-2 py-3 px-8 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-2xl transition-colors border border-outline-variant/10">
      <span className="material-symbols-outlined text-lg">visibility</span>
      Xem tiep (Spectator)
    </button>
  </div>
)

// ── Team score bar (Team vs Team) ──
export const TeamScoreBar: React.FC<{ scoreA: number; scoreB: number; perfectA?: boolean; perfectB?: boolean }> = ({ scoreA, scoreB, perfectA, perfectB }) => {
  const total = scoreA + scoreB || 1
  const pctA = (scoreA / total) * 100
  return (
    <div className="glass-card rounded-2xl px-5 py-4 mb-4 border border-outline-variant/10">
      <div className="flex items-center justify-between mb-2.5 text-sm font-bold">
        <span className="text-[#4a9eff] flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#4a9eff]" /> Team A
          {perfectA && <span className="text-secondary text-[10px] uppercase tracking-wider font-black ml-1">Perfect!</span>}
        </span>
        <span className="text-on-surface-variant text-xs font-black uppercase tracking-widest">VS</span>
        <span className="text-error flex items-center gap-1.5">
          {perfectB && <span className="text-secondary text-[10px] uppercase tracking-wider font-black mr-1">Perfect!</span>}
          Team B <span className="w-3 h-3 rounded-full bg-error" />
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[#4a9eff] font-black text-sm w-12 text-right">{scoreA}</span>
        <div className="flex-1 h-3 bg-surface-container-highest rounded-full overflow-hidden flex">
          <div className="h-full bg-gradient-to-r from-[#4a9eff] to-[#4a9eff]/60 transition-all duration-700 rounded-l-full" style={{ width: `${pctA}%` }} />
          <div className="h-full bg-gradient-to-l from-error to-error/60 transition-all duration-700 rounded-r-full flex-1" />
        </div>
        <span className="text-error font-black text-sm w-12">{scoreB}</span>
      </div>
    </div>
  )
}

// ── Team win screen ──
export const TeamWinScreen: React.FC<{
  winner: string; scoreA: number; scoreB: number; leaderboard: PlayerScore[]; onClose: () => void;
}> = ({ winner, scoreA, scoreB, leaderboard, onClose }) => (
  <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-6 overflow-auto">
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-secondary/8 blur-[150px] rounded-full" />
    </div>
    <div className="w-20 h-20 rounded-full bg-secondary/10 border-2 border-secondary/30 flex items-center justify-center mb-6">
      <span className="material-symbols-outlined text-secondary text-4xl" style={FILL_STYLE}>
        {winner === 'TIE' ? 'handshake' : 'trophy'}
      </span>
    </div>
    <h1 className="font-headline text-3xl font-black tracking-tighter text-on-surface mb-2">
      {winner === 'TIE' ? 'Hoa!' : winner === 'A' ? 'Team A thang!' : 'Team B thang!'}
    </h1>
    <div className="flex gap-8 mb-8 text-lg font-bold">
      <span className="text-[#4a9eff] flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#4a9eff]" /> {scoreA}</span>
      <span className="text-error flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-error" /> {scoreB}</span>
    </div>
    <div className="w-full max-w-sm bg-surface-container rounded-2xl border border-outline-variant/10 p-5 mb-8">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-4">Diem ca nhan</div>
      <div className="space-y-2 max-h-48 overflow-auto">
        {leaderboard.map((r) => (
          <div key={r.playerId} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/5">
            <span className="text-on-surface text-sm font-medium">{r.username}</span>
            <span className="text-on-surface font-bold text-sm">{r.score}</span>
          </div>
        ))}
      </div>
    </div>
    <button onClick={onClose} className="gold-gradient text-on-secondary font-black py-3.5 px-10 rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-secondary/20 active:scale-95 transition-all hover:brightness-110">
      Ve Phong Cho
    </button>
  </div>
)

// ── Match result overlay (Sudden Death) ──
export const MatchResultOverlay: React.FC<{
  winnerId: string; winnerName: string; loserId: string; loserName: string; myUserId?: string; onDismiss: () => void;
}> = ({ winnerName, loserName, myUserId, winnerId, onDismiss }) => {
  const iWon = myUserId === winnerId
  useEffect(() => { const t = setTimeout(onDismiss, 3000); return () => clearTimeout(t) }, [])
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-40" onClick={onDismiss}>
      <div className={`text-center p-8 rounded-3xl border-2 max-w-sm mx-4 ${iWon ? 'border-secondary bg-secondary/5 gold-glow' : 'border-error bg-error/5'}`}>
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${iWon ? 'bg-secondary/10' : 'bg-error/10'}`}>
          <span className={`material-symbols-outlined text-4xl ${iWon ? 'text-secondary' : 'text-error'}`} style={FILL_STYLE}>
            {iWon ? 'celebration' : 'skull'}
          </span>
        </div>
        <div className={`text-xl font-black mb-2 tracking-tight ${iWon ? 'text-secondary' : 'text-error'}`}>
          {iWon ? 'Ban thang! Giu ghe nong!' : 'Ban thua! Xep hang cho...'}
        </div>
        <div className="text-on-surface-variant text-sm">
          <span className="text-green-400 font-bold">{winnerName}</span> thang — <span className="text-error font-bold">{loserName}</span> thua
        </div>
        <div className="text-on-surface-variant/50 text-xs mt-3">Tran tiep sap bat dau...</div>
      </div>
    </div>
  )
}

// ── VS Arena header (Sudden Death) ──
export const SdArenaHeader: React.FC<{
  championName: string; championStreak: number; challengerName: string; myUsername: string; queueRemaining: number;
}> = ({ championName, championStreak, challengerName, myUsername: me, queueRemaining }) => (
  <div className="glass-card rounded-2xl px-5 py-4 mb-4 border border-outline-variant/10">
    <div className="flex items-center justify-center gap-6 text-sm font-bold">
      <div className="text-center">
        <div className={`text-base font-black ${championName === me ? 'text-secondary' : 'text-on-surface'}`}>
          {championName}{championName === me ? ' (ban)' : ''}
        </div>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="material-symbols-outlined text-secondary text-sm" style={FILL_STYLE}>military_tech</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Champion</span>
        </div>
        {championStreak > 0 && (
          <div className="text-[#ff8c42] text-xs font-bold mt-0.5 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm" style={FILL_STYLE}>local_fire_department</span>
            {championStreak} streak
          </div>
        )}
      </div>
      <div className="flex flex-col items-center">
        <span className="text-error font-black text-xl tracking-tighter">VS</span>
      </div>
      <div className="text-center">
        <div className={`text-base font-black ${challengerName === me ? 'text-secondary' : 'text-on-surface'}`}>
          {challengerName}{challengerName === me ? ' (ban)' : ''}
        </div>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[#9b59b6] text-sm" style={FILL_STYLE}>swords</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9b59b6]">Challenger</span>
        </div>
      </div>
    </div>
    {queueRemaining > 0 && (
      <div className="text-center text-on-surface-variant/50 text-xs mt-2 flex items-center justify-center gap-1">
        <span className="material-symbols-outlined text-sm">schedule</span>
        {queueRemaining} nguoi dang cho
      </div>
    )}
  </div>
)

// ── Scoreboard overlay after each round ──
export const RoundScoreboard: React.FC<{ scores: PlayerScore[]; myUsername: string }> = ({ scores, myUsername }) => {
  if (scores.length === 0) return null
  return (
    <div className="mt-5 bg-surface-container rounded-2xl border border-outline-variant/10 p-4 animate-in fade-in">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-3 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm text-secondary">leaderboard</span>
        Ket qua vong nay
      </div>
      <div className="flex flex-wrap gap-2">
        {scores.slice(0, 8).map((s, idx) => {
          const isMe = s.username === myUsername
          return (
            <div key={s.playerId}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${isMe ? 'border-secondary/30 bg-secondary/5' : idx === 0 ? 'border-secondary/20 bg-surface-container-low' : 'border-outline-variant/5 bg-surface-container-low'}`}>
              <span className={`font-black text-xs ${idx === 0 ? 'text-secondary' : 'text-on-surface-variant'}`}>#{idx + 1}</span>
              <span className={`font-medium truncate max-w-[70px] ${isMe ? 'text-secondary' : 'text-on-surface'}`}>{s.username}</span>
              <span className="text-on-surface font-bold">{s.score}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
