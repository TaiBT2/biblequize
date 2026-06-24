import { useMemo } from 'react';
import type { PlayerScore } from '../../pages/room/RoomOverlays';

interface Props {
  results: PlayerScore[];
  /** Compact variant for player view (smaller avatars), matching Podium. */
  compact?: boolean;
}

// Distinct avatar gradients keyed by playerId so the two finalists never look
// like the same person (the podium tinted by slot index, which didn't help).
const AVATAR_PALETTE = [
  'linear-gradient(135deg,#34d399 0%,#059669 100%)', // emerald
  'linear-gradient(135deg,#38bdf8 0%,#0369a1 100%)', // sky
  'linear-gradient(135deg,#a78bfa 0%,#6d28d9 100%)', // violet
  'linear-gradient(135deg,#fb7185 0%,#be123c 100%)', // rose
  'linear-gradient(135deg,#fbbf24 0%,#d97706 100%)', // amber
  'linear-gradient(135deg,#2dd4bf 0%,#0f766e 100%)', // teal
];
const colorFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
};

/**
 * RES — duel layout for the end screen when only 1–2 players finished. The
 * 3-step Podium looks lopsided + empty with two people (the bronze slot is
 * blank and #1 drifts off-centre), so ≤2 players get a symmetric winner-vs-
 * runner-up card with a "Hoà điểm" badge when their scores tie.
 */
export function HeadToHead({ results, compact = false }: Props) {
  const ranked = useMemo(
    () => results.slice().sort((a, b) =>
      (a.finalRank ?? 99) !== (b.finalRank ?? 99)
        ? (a.finalRank ?? 99) - (b.finalRank ?? 99)
        : (b.score ?? 0) - (a.score ?? 0)),
    [results],
  );
  const winner = ranked[0];
  const runnerUp = ranked[1];
  const tie = !!runnerUp && winner?.score === runnerUp.score;

  if (!winner) return null;

  const avatar = compact ? 84 : 112;

  const Card = ({ p, place }: { p: PlayerScore; place: 1 | 2 }) => {
    const isWinner = place === 1;
    const ring = isWinner ? '#e8a832' : '#9ca3af';
    return (
      <div
        className="flex-1 flex flex-col items-center podium-rise relative"
        style={{ maxWidth: 240, animationDelay: isWinner ? '0s' : '0.15s' }}
        data-testid={`h2h-card-${place}`}
      >
        <div className="relative" style={{ width: avatar, height: avatar, marginBottom: 10 }}>
          {isWinner && (
            <div
              aria-hidden="true"
              className={compact ? 'text-2xl' : 'text-4xl'}
              style={{
                position: 'absolute', left: '50%', bottom: 'calc(100% + 2px)',
                transform: 'translateX(-50%)', pointerEvents: 'none', lineHeight: 1,
                filter: 'drop-shadow(0 4px 12px rgba(232,168,50,0.55))',
              }}
            >
              👑
            </div>
          )}
          <div
            className={`grid place-items-center font-black ${isWinner ? 'pulse-glow' : ''}`}
            style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: colorFor(p.playerId), color: '#fff',
              fontSize: compact ? 30 : 42, border: `3px solid ${ring}`,
              boxShadow: isWinner ? '0 0 44px rgba(232,168,50,0.35)' : 'none',
            }}
          >
            {(p.username?.[0] ?? '?').toUpperCase()}
          </div>
        </div>
        <div className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-white truncate w-full text-center`}>
          {p.username}
        </div>
        <div
          className={`${compact ? 'text-base' : 'text-2xl'} font-black`}
          style={{ color: ring }}
        >
          {p.score} điểm
        </div>
        <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
          ✓ {p.correctAnswers}/{p.totalAnswered} đúng
        </div>
        <div
          className="mt-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
          style={{
            background: isWinner ? 'rgba(232,168,50,0.16)' : 'rgba(156,163,175,0.14)',
            color: ring, border: `1px solid ${isWinner ? 'rgba(232,168,50,0.4)' : 'rgba(156,163,175,0.35)'}`,
          }}
        >
          {isWinner ? '🏆 Vô địch' : 'Á quân'}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center" data-testid="head-to-head" style={{ paddingTop: compact ? 24 : 40 }}>
      {tie && (
        <div
          data-testid="h2h-tie-badge"
          className="mb-4 px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
          style={{
            background: 'rgba(232,168,50,0.14)', color: '#e8a832',
            border: '1px solid rgba(232,168,50,0.35)',
          }}
        >
          <span aria-hidden="true">⚖️</span>
          Hoà điểm · xếp theo số câu đúng &amp; tốc độ
        </div>
      )}
      <div className="flex items-start justify-center gap-3 lg:gap-6 w-full">
        <Card p={winner} place={1} />
        {runnerUp && (
          <>
            <div
              className="self-center font-black select-none"
              style={{ color: '#6b7280', fontSize: compact ? 18 : 26, paddingTop: compact ? 28 : 40 }}
              aria-hidden="true"
            >
              VS
            </div>
            <Card p={runnerUp} place={2} />
          </>
        )}
      </div>
    </div>
  );
}

export default HeadToHead;
