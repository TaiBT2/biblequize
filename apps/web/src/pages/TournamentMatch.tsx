import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { api } from '../api/client';

/* ── Types ── */
interface Participant {
  userId: string;
  userName: string;
  lives: number;
  score: number;
  isWinner: boolean;
}

interface Match {
  matchId: string;
  roundNumber: number;
  matchIndex: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  winnerId: string | null;
  isBye: boolean;
  participants: Participant[];
}

interface BracketData {
  tournamentId: string;
  name: string;
  status: string;
  totalRounds: number;
  rounds: Record<string, Match[]>;
}

/* ── Helpers ── */
function getRoundLabel(round: number, totalRounds: number): string {
  if (round === totalRounds) return 'Chung ket';
  if (round === totalRounds - 1) return 'Ban ket';
  if (round === totalRounds - 2) return 'Tu ket';
  return `Vong ${round}`;
}

function HeartIcons({ count, max = 3, size = 'md' }: { count: number; max?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-base' : 'text-xs';
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`material-symbols-outlined ${sizeClass} ${i < count ? 'text-secondary' : 'text-on-surface-variant/20'}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {i < count ? 'favorite' : 'heart_broken'}
        </span>
      ))}
    </div>
  );
}

/* ── Confetti gold particles ── */
function GoldConfetti() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 2 + Math.random() * 3;
        const size = 4 + Math.random() * 8;
        const rotation = Math.random() * 360;
        return (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${left}%`,
              top: '-5%',
              width: size,
              height: size * 0.6,
              background: `linear-gradient(${rotation}deg, #e8a832, #e7c268, #f8bd45)`,
              animation: `confettiFall ${duration}s ${delay}s ease-in infinite`,
              opacity: 0.8,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.9; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ── Component ── */
const TournamentMatch: React.FC = () => {
  const { id, matchId } = useParams<{ id: string; matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match, setMatch] = useState<Match | null>(null);
  const [tournamentName, setTournamentName] = useState('');
  const [totalRounds, setTotalRounds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [forfeitLoading, setForfeitLoading] = useState(false);
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);

  const fetchMatch = useCallback(async () => {
    if (!id || !matchId) return;
    try {
      const res = await api.get(`/api/tournaments/${id}/bracket`);
      const data: BracketData = res.data;
      setTournamentName(data.name);
      setTotalRounds(data.totalRounds);

      // Find the specific match
      let found: Match | null = null;
      for (const roundMatches of Object.values(data.rounds)) {
        for (const m of roundMatches) {
          if (m.matchId === matchId) {
            found = m;
            break;
          }
        }
        if (found) break;
      }

      if (found) {
        setMatch(found);
        // Show winner overlay when match just completed
        if (found.status === 'COMPLETED' && !showWinnerOverlay) {
          setShowWinnerOverlay(true);
        }
        setError('');
      } else {
        setError('Khong tim thay tran dau');
      }
    } catch (err: any) {
      if (!match) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Khong the tai du lieu');
      }
    } finally {
      setLoading(false);
    }
  }, [id, matchId, match, showWinnerOverlay]);

  // Initial fetch
  useEffect(() => {
    fetchMatch();
  }, [id, matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 5s when IN_PROGRESS
  useEffect(() => {
    if (!match || match.status !== 'IN_PROGRESS') return;
    const interval = setInterval(fetchMatch, 5000);
    return () => clearInterval(interval);
  }, [match?.status, fetchMatch]);

  const handleForfeit = async () => {
    if (!id || !matchId) return;
    setForfeitLoading(true);
    try {
      await api.post(`/api/tournaments/${id}/matches/${matchId}/forfeit`);
      await fetchMatch();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Khong the bo cuoc');
    } finally {
      setForfeitLoading(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-3 border-outline-variant/20 border-t-secondary rounded-full animate-spin" />
        <span className="text-on-surface-variant text-sm">Dang tai tran dau...</span>
      </div>
    );
  }

  /* ── Error ── */
  if (error && !match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-12 text-center max-w-md w-full">
          <button
            onClick={() => navigate(`/tournaments/${id}`)}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-secondary transition-colors text-sm mb-8 mx-auto"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Quay ve bracket
          </button>
          <span className="material-symbols-outlined text-5xl text-error/60 mb-4 block">error</span>
          <p className="text-error text-sm mb-6">{error}</p>
          <button
            className="px-6 py-2.5 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary font-bold text-sm hover:bg-secondary/20 transition-colors"
            onClick={() => { setLoading(true); setError(''); fetchMatch(); }}
          >
            Thu lai
          </button>
        </div>
      </div>
    );
  }

  if (!match) return null;

  const p1 = match.participants[0] || null;
  const p2 = match.participants[1] || null;
  const winner = match.participants.find(p => p.isWinner);
  const roundLabel = totalRounds > 0
    ? getRoundLabel(match.roundNumber, totalRounds)
    : `Vong ${match.roundNumber}`;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Match Header ── */}
      <header className="relative z-10 pt-6 pb-4 px-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(`/tournaments/${id}`)}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-secondary transition-colors text-sm mb-6"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Quay ve bracket
          </button>

          <div className="text-center">
            {tournamentName && (
              <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px] mb-2 block">
                {tournamentName}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight mb-3">
              {roundLabel} &mdash; Tran {match.matchIndex + 1}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              match.status === 'PENDING' ? 'bg-surface-container-high text-on-surface-variant' :
              match.status === 'IN_PROGRESS' ? 'bg-secondary-container/40 text-secondary' :
              'bg-surface-container-high text-tertiary'
            }`}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                {match.status === 'PENDING' ? 'schedule' : match.status === 'IN_PROGRESS' ? 'swords' : 'check_circle'}
              </span>
              {match.status === 'PENDING' && 'Chua bat dau'}
              {match.status === 'IN_PROGRESS' && 'Dang dien ra'}
              {match.status === 'COMPLETED' && 'Hoan thanh'}
            </span>
          </div>
        </div>
      </header>

      {/* ── BYE match ── */}
      {match.isBye && (
        <div className="relative z-10 max-w-lg mx-auto px-6 mt-12">
          <div className="glass-card rounded-2xl p-10 text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-secondary mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield
            </span>
            <p className="text-on-surface font-bold text-lg mb-2">Tran BYE</p>
            <p className="text-on-surface-variant text-sm mb-4">Nguoi choi tu dong di tiep vong sau</p>
            {p1 && (
              <div className="inline-flex items-center gap-3 bg-secondary/10 rounded-full px-5 py-2 border border-secondary/20">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
                <span className="font-bold text-secondary">{p1.userName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PENDING match ── */}
      {!match.isBye && match.status === 'PENDING' && (
        <div className="relative z-10 max-w-lg mx-auto px-6 mt-12">
          <div className="glass-card rounded-2xl p-10 text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4 block">hourglass_empty</span>
            <p className="text-on-surface font-bold text-lg mb-2">Tran dau chua bat dau</p>
            {p1 && p2 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center text-secondary font-bold text-xl mx-auto mb-2">
                    {p1.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-on-surface">{p1.userName}</span>
                </div>
                <span className="text-on-surface-variant/40 font-black text-xl">VS</span>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center text-secondary font-bold text-xl mx-auto mb-2">
                    {p2.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-on-surface">{p2.userName}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── IN_PROGRESS or COMPLETED — Score Display ── */}
      {!match.isBye && (match.status === 'IN_PROGRESS' || match.status === 'COMPLETED') && (
        <div className="relative z-10 max-w-3xl mx-auto px-6 mt-8">
          {/* Live indicator */}
          {match.status === 'IN_PROGRESS' && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
              </span>
              <span className="text-secondary text-xs font-bold uppercase tracking-widest">LIVE</span>
            </div>
          )}

          {/* Player cards — VS layout */}
          <div className="flex items-stretch gap-4 md:gap-6">
            {/* Player 1 */}
            {p1 && (
              <div className={`flex-1 glass-card rounded-2xl p-6 md:p-8 text-center border transition-all duration-300 ${
                match.status === 'COMPLETED' && p1.isWinner
                  ? 'border-secondary/40 shadow-[0_0_30px_rgba(232,168,50,0.15)]'
                  : match.status === 'COMPLETED' && !p1.isWinner
                    ? 'border-outline-variant/10 opacity-50'
                    : 'border-outline-variant/10'
              }`}>
                {/* Winner crown */}
                {match.status === 'COMPLETED' && p1.isWinner && (
                  <span className="material-symbols-outlined text-3xl text-secondary mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>
                    workspace_premium
                  </span>
                )}
                {/* Avatar */}
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl font-black mx-auto mb-3 ${
                  match.status === 'COMPLETED' && p1.isWinner
                    ? 'bg-secondary/20 text-secondary border-2 border-secondary/40'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {p1.userName.charAt(0).toUpperCase()}
                </div>
                <p className={`font-bold text-base md:text-lg mb-3 ${
                  match.status === 'COMPLETED' && p1.isWinner ? 'text-secondary' : 'text-on-surface'
                }`}>
                  {p1.userName}
                </p>
                {/* HP Hearts */}
                <div className="flex justify-center mb-4">
                  <HeartIcons count={p1.lives} size="lg" />
                </div>
                {/* Score */}
                <div className="bg-surface-container rounded-xl py-3 px-4">
                  <p className="text-3xl md:text-4xl font-black text-secondary">{p1.score}</p>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Diem</p>
                </div>
                {match.status === 'COMPLETED' && p1.isWinner && (
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-secondary/15 rounded-full px-4 py-1.5 border border-secondary/20">
                    <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                    <span className="text-xs font-bold text-secondary">Chien thang</span>
                  </div>
                )}
              </div>
            )}

            {/* VS divider */}
            <div className="flex flex-col items-center justify-center flex-shrink-0">
              <div className="w-px h-8 bg-outline-variant/20" />
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/20">
                <span className="material-symbols-outlined text-secondary text-xl">swords</span>
              </div>
              <div className="w-px h-8 bg-outline-variant/20" />
            </div>

            {/* Player 2 */}
            {p2 && (
              <div className={`flex-1 glass-card rounded-2xl p-6 md:p-8 text-center border transition-all duration-300 ${
                match.status === 'COMPLETED' && p2.isWinner
                  ? 'border-secondary/40 shadow-[0_0_30px_rgba(232,168,50,0.15)]'
                  : match.status === 'COMPLETED' && !p2.isWinner
                    ? 'border-outline-variant/10 opacity-50'
                    : 'border-outline-variant/10'
              }`}>
                {match.status === 'COMPLETED' && p2.isWinner && (
                  <span className="material-symbols-outlined text-3xl text-secondary mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>
                    workspace_premium
                  </span>
                )}
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl font-black mx-auto mb-3 ${
                  match.status === 'COMPLETED' && p2.isWinner
                    ? 'bg-secondary/20 text-secondary border-2 border-secondary/40'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {p2.userName.charAt(0).toUpperCase()}
                </div>
                <p className={`font-bold text-base md:text-lg mb-3 ${
                  match.status === 'COMPLETED' && p2.isWinner ? 'text-secondary' : 'text-on-surface'
                }`}>
                  {p2.userName}
                </p>
                <div className="flex justify-center mb-4">
                  <HeartIcons count={p2.lives} size="lg" />
                </div>
                <div className="bg-surface-container rounded-xl py-3 px-4">
                  <p className="text-3xl md:text-4xl font-black text-secondary">{p2.score}</p>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Diem</p>
                </div>
                {match.status === 'COMPLETED' && p2.isWinner && (
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-secondary/15 rounded-full px-4 py-1.5 border border-secondary/20">
                    <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                    <span className="text-xs font-bold text-secondary">Chien thang</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Forfeit button for in-progress matches */}
          {match.status === 'IN_PROGRESS' && (
            <div className="text-center mt-8">
              <button
                className="px-6 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error font-bold text-sm hover:bg-error/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleForfeit}
                disabled={forfeitLoading}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">flag</span>
                  {forfeitLoading ? 'Dang xu ly...' : 'Bo cuoc'}
                </span>
              </button>
            </div>
          )}

          {/* Back to bracket button for completed matches (non-overlay) */}
          {match.status === 'COMPLETED' && !showWinnerOverlay && (
            <div className="text-center mt-8">
              <button
                className="px-8 py-3 rounded-xl gold-gradient text-on-secondary font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(232,168,50,0.25)] hover:scale-105 transition-transform"
                onClick={() => navigate(`/tournaments/${id}`)}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Quay ve bracket
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Winner Overlay ── */}
      {showWinnerOverlay && match.status === 'COMPLETED' && winner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          onClick={() => setShowWinnerOverlay(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />

          {/* Gold confetti */}
          <GoldConfetti />

          {/* Content */}
          <div className="relative z-10 text-center px-6 max-w-md">
            {/* Glow */}
            <div className="absolute -inset-20 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative">
              <span
                className="material-symbols-outlined text-7xl text-secondary mb-4 block"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>

              <div className="w-24 h-24 rounded-full bg-secondary/20 border-2 border-secondary/50 flex items-center justify-center text-4xl font-black text-secondary mx-auto mb-4 shadow-[0_0_40px_rgba(232,168,50,0.3)]">
                {winner.userName.charAt(0).toUpperCase()}
              </div>

              <p className="text-3xl md:text-4xl font-black text-secondary mb-2">
                {winner.userName}
              </p>
              <p className="text-on-surface-variant text-lg mb-8">da chien thang tran dau!</p>

              <button
                className="px-10 py-4 rounded-xl gold-gradient text-on-secondary font-bold text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(232,168,50,0.35)] hover:scale-105 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/tournaments/${id}`);
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  Tiep Tuc
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentMatch;
