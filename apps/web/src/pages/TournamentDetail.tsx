import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  status: 'LOBBY' | 'IN_PROGRESS' | 'COMPLETED';
  currentRound: number;
  totalRounds: number;
  rounds: Record<string, Match[]>;
  participants?: { userId: string; userName: string }[];
  creatorId?: string;
}

/* ── Local storage for saving tournaments ── */
const STORAGE_KEY = 'biblequiz_my_tournaments';

function saveTournamentLocally(id: string, name: string) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!list.find((t: any) => t.id === id)) {
      list.unshift({ id, name });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  } catch { /* ignore */ }
}

/* ── Helpers ── */
function getRoundLabel(round: number, totalRounds: number, t: (key: string, opts?: any) => string): string {
  if (round === totalRounds) return t('tournaments.final');
  if (round === totalRounds - 1) return t('tournaments.semiFinal');
  if (round === totalRounds - 2) return t('tournaments.quarterFinal');
  return t('tournaments.round', { number: round });
}

function HeartIcons({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`material-symbols-outlined text-xs ${i < count ? 'text-secondary' : 'text-on-surface-variant/20'}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          favorite
        </span>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config: Record<string, { icon: string; label: string; cls: string }> = {
    LOBBY: { icon: 'lock_open', label: t('tournaments.statusLobby'), cls: 'bg-primary-container text-primary' },
    IN_PROGRESS: { icon: 'swords', label: t('tournaments.statusInProgress'), cls: 'bg-secondary-container/40 text-secondary' },
    COMPLETED: { icon: 'check_circle', label: t('tournaments.statusCompleted'), cls: 'bg-surface-container-high text-tertiary' },
  };
  const c = config[status] || config.LOBBY;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${c.cls}`}>
      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
      {c.label}
    </span>
  );
}

/* ── BracketView Component ── */
const BracketView: React.FC<{
  rounds: Record<string, Match[]>;
  totalRounds: number;
  currentRound: number;
  status: string;
  onMatchClick: (match: Match) => void;
}> = ({ rounds, totalRounds, currentRound, status, onMatchClick }) => {
  const { t } = useTranslation();
  const roundNumbers = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div className="relative overflow-x-auto pb-8">
      {/* Mobile swipe hint */}
      <div className="mb-4 flex items-center gap-2 text-on-surface-variant md:hidden">
        <span className="material-symbols-outlined text-sm animate-pulse">swipe_left</span>
        <span className="text-xs font-bold uppercase tracking-wider italic">{t('tournaments.swipeHint')}</span>
      </div>

      <div className="inline-flex gap-16 min-w-max p-4 pt-0">
        {roundNumbers.map((roundNum, roundIdx) => {
          const matches = rounds[String(roundNum)] || [];
          const isFinal = roundNum === totalRounds;

          return (
            <React.Fragment key={roundNum}>
              <div className="flex flex-col justify-around gap-12 w-60 snap-start">
                {/* Round header */}
                <div className="sticky top-0 z-10 py-3">
                  <h3 className={`text-center font-bold uppercase tracking-widest text-xs ${
                    isFinal ? 'text-secondary tracking-[0.3em] text-sm' : 'text-on-surface-variant'
                  }`}>
                    {getRoundLabel(roundNum, totalRounds, t)}
                  </h3>
                </div>

                {matches.map((match) => {
                  const p1 = match.participants[0];
                  const p2 = match.participants[1];
                  const isActive = match.status === 'IN_PROGRESS';
                  const isCompleted = match.status === 'COMPLETED';

                  if (isFinal) {
                    /* Final match — special card */
                    return (
                      <div key={match.matchId} className="relative group cursor-pointer" onClick={() => onMatchClick(match)}>
                        <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-tertiary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
                        <div className={`relative glass-card rounded-2xl p-6 border ${
                          isActive ? 'border-secondary/60 ring-2 ring-secondary/30' :
                          isCompleted ? 'border-tertiary/40' : 'border-outline-variant/20'
                        } text-center`}>
                          {isActive && (
                            <div className="absolute top-3 right-3">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
                              </span>
                            </div>
                          )}
                          <span className="material-symbols-outlined text-4xl text-secondary mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>
                            workspace_premium
                          </span>
                          {/* Player 1 */}
                          <div className={`p-3 rounded-xl mb-3 ${
                            p1 && isCompleted && p1.isWinner ? 'bg-secondary/10 border border-secondary/30' :
                            p1 && isCompleted && !p1.isWinner ? 'opacity-40' :
                            'bg-surface-container border border-outline-variant/10'
                          }`}>
                            {p1 ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary font-bold text-sm">
                                    {p1.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-sm">{p1.userName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <HeartIcons count={p1.lives} />
                                  {p1.score > 0 && <span className="text-xs font-bold text-secondary">{p1.score}</span>}
                                </div>
                              </div>
                            ) : (
                              <span className="italic text-on-surface-variant text-sm">TBD</span>
                            )}
                          </div>
                          <div className="text-secondary font-black text-xl my-1">VS</div>
                          {/* Player 2 */}
                          <div className={`p-3 rounded-xl ${
                            p2 && isCompleted && p2.isWinner ? 'bg-secondary/10 border border-secondary/30' :
                            p2 && isCompleted && !p2.isWinner ? 'opacity-40' :
                            'bg-surface-container border border-outline-variant/10'
                          }`}>
                            {p2 ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary font-bold text-sm">
                                    {p2.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-sm">{p2.userName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <HeartIcons count={p2.lives} />
                                  {p2.score > 0 && <span className="text-xs font-bold text-secondary">{p2.score}</span>}
                                </div>
                              </div>
                            ) : (
                              <span className="italic text-on-surface-variant text-sm">TBD</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  /* Regular match card */
                  return (
                    <div key={match.matchId} className="relative">
                      <div
                        className={`glass-card rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                          isActive
                            ? 'border-l-4 border-secondary ring-2 ring-secondary/30 shadow-[0_0_15px_rgba(232,168,50,0.15)]'
                            : isCompleted
                              ? 'border-l-4 border-outline-variant/30'
                              : 'border-l-4 border-outline-variant/10'
                        }`}
                        onClick={() => onMatchClick(match)}
                      >
                        {isActive && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                            </span>
                            <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">{t('tournaments.inProgress')}</span>
                          </div>
                        )}
                        {/* Player 1 */}
                        <div className={`flex justify-between items-center mb-2.5 ${
                          p1 && isCompleted && !p1.isWinner ? 'opacity-40 line-through' : ''
                        }`}>
                          <div className="flex items-center gap-2">
                            {p1 ? (
                              <>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                  p1.isWinner && isCompleted ? 'bg-secondary/20 text-secondary' : 'bg-surface-container-high text-on-surface-variant'
                                }`}>
                                  {p1.userName.charAt(0).toUpperCase()}
                                </div>
                                <span className={`text-sm ${p1.isWinner && isCompleted ? 'font-bold text-secondary' : ''}`}>
                                  {p1.userName}
                                </span>
                              </>
                            ) : match.isBye ? (
                              <span className="text-sm italic text-on-surface-variant/50">BYE</span>
                            ) : (
                              <span className="text-sm italic text-on-surface-variant/30">TBD</span>
                            )}
                          </div>
                          {p1 && (
                            <div className="flex items-center gap-1.5">
                              <HeartIcons count={p1.lives} />
                              {p1.score > 0 && <span className="text-[10px] font-bold text-on-surface-variant">{p1.score}</span>}
                            </div>
                          )}
                        </div>
                        {/* Player 2 */}
                        <div className={`flex justify-between items-center ${
                          p2 && isCompleted && !p2.isWinner ? 'opacity-40 line-through' : ''
                        }`}>
                          <div className="flex items-center gap-2">
                            {p2 ? (
                              <>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                  p2.isWinner && isCompleted ? 'bg-secondary/20 text-secondary' : 'bg-surface-container-high text-on-surface-variant'
                                }`}>
                                  {p2.userName.charAt(0).toUpperCase()}
                                </div>
                                <span className={`text-sm ${p2.isWinner && isCompleted ? 'font-bold text-secondary' : ''}`}>
                                  {p2.userName}
                                </span>
                              </>
                            ) : match.isBye ? (
                              <span className="text-sm italic text-on-surface-variant/50">BYE</span>
                            ) : (
                              <span className="text-sm italic text-on-surface-variant/30">TBD</span>
                            )}
                          </div>
                          {p2 && (
                            <div className="flex items-center gap-1.5">
                              <HeartIcons count={p2.lives} />
                              {p2.score > 0 && <span className="text-[10px] font-bold text-on-surface-variant">{p2.score}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Connector line */}
                      {roundIdx < roundNumbers.length - 1 && (
                        <div className="absolute -right-8 top-1/2 w-8 bracket-line-h" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Vertical connectors between rounds */}
              {roundIdx < roundNumbers.length - 1 && matches.length > 1 && (
                <div className="flex flex-col justify-around">
                  {Array.from({ length: Math.ceil(matches.length / 2) }).map((_, i) => (
                    <div key={i} className="flex flex-col">
                      <div className="h-16 flex items-end">
                        <div className="h-full w-8 border-t-2 border-r-2 border-outline-variant/20 rounded-tr-xl" />
                      </div>
                      <div className="h-16 flex items-start">
                        <div className="h-full w-8 border-b-2 border-r-2 border-outline-variant/20 rounded-br-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* ── Main Component ── */
const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Action states
  const [joinLoading, setJoinLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchBracket = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/api/tournaments/${id}/bracket`);
      setBracket(res.data);
      setError('');
      // Save to local list
      if (res.data.name) {
        saveTournamentLocally(id, res.data.name);
      }
    } catch (err: any) {
      // Only set error on first load
      if (!bracket) {
        setError(err.response?.data?.message || err.response?.data?.error || t('tournaments.errorLoadData'));
      }
    } finally {
      setLoading(false);
    }
  }, [id, bracket, t]);

  // Initial fetch
  useEffect(() => {
    fetchBracket();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 5s when IN_PROGRESS
  useEffect(() => {
    if (!bracket || bracket.status !== 'IN_PROGRESS') return;
    const interval = setInterval(() => {
      fetchBracket();
    }, 5000);
    return () => clearInterval(interval);
  }, [bracket?.status, fetchBracket]);

  const handleJoin = async () => {
    if (!id) return;
    setJoinLoading(true);
    setActionMsg(null);
    try {
      await api.post(`/api/tournaments/${id}/join`);
      setActionMsg({ text: t('tournaments.joinedSuccess'), type: 'success' });
      await fetchBracket();
    } catch (err: any) {
      setActionMsg({
        text: err.response?.data?.message || err.response?.data?.error || t('tournaments.cannotJoin'),
        type: 'error',
      });
    } finally {
      setJoinLoading(false);
    }
  };

  const handleStart = async () => {
    if (!id) return;
    setStartLoading(true);
    setActionMsg(null);
    try {
      await api.post(`/api/tournaments/${id}/start`);
      setActionMsg({ text: t('tournaments.tournamentStarted'), type: 'success' });
      await fetchBracket();
    } catch (err: any) {
      setActionMsg({
        text: err.response?.data?.message || err.response?.data?.error || t('tournaments.cannotStart'),
        type: 'error',
      });
    } finally {
      setStartLoading(false);
    }
  };

  const handleMatchClick = (match: Match) => {
    if (!id) return;
    navigate(`/tournaments/${id}/match/${match.matchId}`);
  };

  // Find champion
  const getChampion = (): string | null => {
    if (!bracket || bracket.status !== 'COMPLETED') return null;
    const finalRound = bracket.rounds[String(bracket.totalRounds)];
    if (!finalRound || finalRound.length === 0) return null;
    const finalMatch = finalRound[0];
    if (finalMatch.status !== 'COMPLETED') return null;
    const winner = finalMatch.participants.find(p => p.isWinner);
    return winner?.userName || null;
  };

  // Check if current user is creator
  const isCreator = bracket?.creatorId && user?.email ? true : false; // simplified; backend enforces

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-3 border-outline-variant/20 border-t-secondary rounded-full animate-spin" />
        <span className="text-on-surface-variant text-sm">{t('tournaments.loadingTournament')}</span>
      </div>
    );
  }

  /* ── Error state ── */
  if (error && !bracket) {
    return (
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <button
          onClick={() => navigate('/tournaments')}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-secondary transition-colors text-sm mb-8"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          {t('nav.tournaments')}
        </button>
        <div className="glass-card rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-error/60 mb-4 block">error</span>
          <p className="text-error text-sm mb-6">{error}</p>
          <button
            className="px-6 py-2.5 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary font-bold text-sm hover:bg-secondary/20 transition-colors"
            onClick={() => { setLoading(true); setError(''); fetchBracket(); }}
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!bracket) return null;

  const champion = getChampion();
  const participantCount = bracket.participants?.length ||
    new Set(
      Object.values(bracket.rounds)
        .flat()
        .flatMap(m => m.participants.map(p => p.userId))
        .filter(Boolean)
    ).size;

  return (
    <div className="max-w-[1200px] mx-auto px-6" data-testid="tournament-detail-page">
      {/* Back nav */}
      <button
        onClick={() => navigate('/tournaments')}
        className="flex items-center gap-1.5 text-on-surface-variant hover:text-secondary transition-colors text-sm mb-8"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        {t('nav.tournaments')}
      </button>

      {/* ── Tournament Header ── */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-secondary font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
              Tournament
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-on-surface tracking-tighter mb-4">
              {bracket.name}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={bracket.status} />
              {bracket.status !== 'LOBBY' && (
                <span className="text-on-surface-variant text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">bar_chart</span>
                  {t('tournaments.roundOf', { current: bracket.currentRound, total: bracket.totalRounds })}
                </span>
              )}
            </div>
          </div>

          {/* Stats card */}
          <div className="glass-card p-5 rounded-xl flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{participantCount}</div>
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('tournaments.participants')}</div>
            </div>
            <div className="w-px h-10 bg-outline-variant/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{bracket.totalRounds}</div>
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('tournaments.rounds')}</div>
            </div>
            <div className="w-px h-10 bg-outline-variant/20" />
            <div className="text-center">
              <span className="material-symbols-outlined text-2xl text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_tree
              </span>
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">Bracket</div>
            </div>
          </div>
        </div>

        {/* Tournament ID */}
        <p className="text-on-surface-variant/40 text-xs mt-3 font-mono">ID: {bracket.tournamentId}</p>
      </section>

      {/* ── Info Cards ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {/* Format */}
        <div className="glass-card rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-secondary">account_tree</span>
          </div>
          <div className="font-bold text-on-surface mb-1">{t('tournaments.format')}</div>
          <p className="text-sm text-on-surface-variant">{t('tournaments.formatDesc', { rounds: bracket.totalRounds })}</p>
        </div>
        {/* Rules */}
        <div className="glass-card rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-secondary">gavel</span>
          </div>
          <div className="font-bold text-on-surface mb-1">{t('tournaments.rules')}</div>
          <p className="text-sm text-on-surface-variant">{t('tournaments.rulesDesc')}</p>
        </div>
        {/* Participants */}
        <div className="glass-card rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          </div>
          <div className="font-bold text-on-surface mb-1">{t('tournaments.players')}</div>
          <p className="text-sm text-on-surface-variant">{t('tournaments.playersRegistered', { count: participantCount })}</p>
        </div>
      </section>

      {/* ── Lobby Actions ── */}
      {bracket.status === 'LOBBY' && (
        <section className="mb-10">
          <div className="glass-card rounded-2xl p-8 text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-secondary mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>
              how_to_reg
            </span>
            <h2 className="text-xl font-bold text-on-surface mb-2">{t('tournaments.lobbyOpen')}</h2>
            <p className="text-on-surface-variant text-sm mb-6">{t('tournaments.lobbyDesc')}</p>

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                className="px-8 py-3 rounded-xl gold-gradient text-on-secondary font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(232,168,50,0.25)] hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={handleJoin}
                disabled={joinLoading}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">swords</span>
                  {joinLoading ? t('tournaments.registering') : t('tournaments.register')}
                </span>
              </button>
              <button
                className="px-8 py-3 rounded-xl bg-surface-container-high border border-outline-variant/20 text-on-surface font-bold text-sm uppercase tracking-wider hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleStart}
                disabled={startLoading}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  {startLoading ? t('tournaments.starting') : t('tournaments.startTournament')}
                </span>
              </button>
            </div>

            {actionMsg && (
              <p className={`mt-4 text-sm font-bold ${actionMsg.type === 'success' ? 'text-tertiary' : 'text-error'}`}>
                {actionMsg.text}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Action message (non-lobby) ── */}
      {bracket.status !== 'LOBBY' && actionMsg && (
        <div className={`mb-6 text-center text-sm font-bold ${actionMsg.type === 'success' ? 'text-tertiary' : 'text-error'}`}>
          {actionMsg.text}
        </div>
      )}

      {/* ── Champion Banner ── */}
      {champion && (
        <section className="mb-10">
          <div className="relative group max-w-md mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-tertiary rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
            <div className="relative glass-card rounded-2xl p-8 text-center border border-secondary/30">
              <span
                className="material-symbols-outlined text-5xl text-secondary mb-2 block"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-1">{t('tournaments.champion')}</p>
              <p className="text-2xl font-black text-secondary">{champion}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Participants List (Lobby) ── */}
      {bracket.status === 'LOBBY' && bracket.participants && bracket.participants.length > 0 && (
        <section className="mb-10" data-testid="tournament-participants">
          <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">group</span>
            {t('tournaments.participantsJoined')}
            <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
              {bracket.participants.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {bracket.participants.map((p) => (
              <div key={p.userId} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border border-outline-variant/10">
                <div className="w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center text-secondary font-bold text-sm flex-shrink-0">
                  {p.userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-on-surface truncate">{p.userName}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Bracket ── */}
      {(bracket.status === 'IN_PROGRESS' || bracket.status === 'COMPLETED') && (
        <section className="mb-10" data-testid="tournament-bracket">
          <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">account_tree</span>
            Bracket
          </h2>
          <div className="glass-card rounded-2xl p-4 border border-outline-variant/10">
            <BracketView
              rounds={bracket.rounds}
              totalRounds={bracket.totalRounds}
              currentRound={bracket.currentRound}
              status={bracket.status}
              onMatchClick={handleMatchClick}
            />
          </div>
        </section>
      )}
    </div>
  );
};

export default TournamentDetail;
