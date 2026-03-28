import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { api } from '../api/client';
import styles from './TournamentDetail.module.css';

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
function getRoundLabel(round: number, totalRounds: number): string {
  if (round === totalRounds) return 'Chung kết';
  if (round === totalRounds - 1) return 'Bán kết';
  if (round === totalRounds - 2) return 'Tứ kết';
  return `Vòng ${round}`;
}

function renderLives(lives: number, maxLives: number = 3): React.ReactNode {
  const hearts: React.ReactNode[] = [];
  for (let i = 0; i < maxLives; i++) {
    if (i < lives) {
      hearts.push(<span key={i}>❤️</span>);
    } else {
      hearts.push(<span key={i} style={{ opacity: 0.2 }}>❤️</span>);
    }
  }
  return <span className={styles.lives}>{hearts}</span>;
}

/* ── BracketView Component ── */
const BracketView: React.FC<{
  rounds: Record<string, Match[]>;
  totalRounds: number;
  currentRound: number;
  status: string;
  onMatchClick: (match: Match) => void;
}> = ({ rounds, totalRounds, currentRound, status, onMatchClick }) => {
  const roundNumbers = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div className={styles.bracketContainer}>
      {roundNumbers.map((roundNum, roundIdx) => {
        const matches = rounds[String(roundNum)] || [];
        return (
          <React.Fragment key={roundNum}>
            <div className={styles.round}>
              <div className={styles.roundTitle}>
                {getRoundLabel(roundNum, totalRounds)}
              </div>
              {matches.map((match) => {
                const p1 = match.participants[0];
                const p2 = match.participants[1];
                const isActive = match.status === 'IN_PROGRESS';
                const isCompleted = match.status === 'COMPLETED';

                return (
                  <div
                    key={match.matchId}
                    className={styles.matchWrapper}
                  >
                    <div
                      className={styles.match}
                      onClick={() => onMatchClick(match)}
                    >
                      {/* Player 1 (top) */}
                      <div
                        className={[
                          styles.matchPlayer,
                          styles.matchPlayerTop,
                          match.isBye && !p1 ? styles.matchBye : '',
                          p1 && isCompleted && p1.isWinner ? styles.matchWinner : '',
                          p1 && isCompleted && !p1.isWinner ? styles.matchLoser : '',
                          isActive ? styles.matchActive : '',
                          !p1 && !match.isBye ? styles.matchEmpty : '',
                        ].filter(Boolean).join(' ')}
                      >
                        {p1 ? (
                          <>
                            <span className={styles.playerName}>{p1.userName}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {renderLives(p1.lives)}
                              {p1.score > 0 && <span className={styles.score}>{p1.score}</span>}
                            </span>
                          </>
                        ) : match.isBye ? (
                          <span>BYE</span>
                        ) : (
                          <span>TBD</span>
                        )}
                      </div>
                      {/* Player 2 (bottom) */}
                      <div
                        className={[
                          styles.matchPlayer,
                          styles.matchPlayerBottom,
                          match.isBye && !p2 ? styles.matchBye : '',
                          p2 && isCompleted && p2.isWinner ? styles.matchWinner : '',
                          p2 && isCompleted && !p2.isWinner ? styles.matchLoser : '',
                          isActive ? styles.matchActive : '',
                          !p2 && !match.isBye ? styles.matchEmpty : '',
                        ].filter(Boolean).join(' ')}
                      >
                        {p2 ? (
                          <>
                            <span className={styles.playerName}>{p2.userName}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {renderLives(p2.lives)}
                              {p2.score > 0 && <span className={styles.score}>{p2.score}</span>}
                            </span>
                          </>
                        ) : match.isBye ? (
                          <span>BYE</span>
                        ) : (
                          <span>TBD</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Connector lines between rounds */}
            {roundIdx < roundNumbers.length - 1 && matches.length > 0 && (
              <div className={styles.connector} style={{ alignSelf: 'stretch' }}>
                <svg
                  width="100%"
                  height="100%"
                  style={{ position: 'absolute', inset: 0 }}
                  preserveAspectRatio="none"
                >
                  {/* We use CSS-based connectors via the bracket layout instead */}
                </svg>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ── Main Component ── */
const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

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
        setError(err.response?.data?.message || err.response?.data?.error || 'Không thể tải dữ liệu tournament');
      }
    } finally {
      setLoading(false);
    }
  }, [id, bracket]);

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
      setActionMsg({ text: 'Đã tham gia thành công!', type: 'success' });
      await fetchBracket();
    } catch (err: any) {
      setActionMsg({
        text: err.response?.data?.message || err.response?.data?.error || 'Không thể tham gia',
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
      setActionMsg({ text: 'Tournament đã bắt đầu!', type: 'success' });
      await fetchBracket();
    } catch (err: any) {
      setActionMsg({
        text: err.response?.data?.message || err.response?.data?.error || 'Không thể bắt đầu',
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

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Đang tải tournament...</span>
        </div>
      </div>
    );
  }

  if (error && !bracket) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <button onClick={() => navigate('/tournaments')} className={styles.backBtn}>
              ← Tournaments
            </button>
          </div>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryBtn} onClick={() => { setLoading(true); setError(''); fetchBracket(); }}>
              Thử lại
            </button>
          </div>
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
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <button onClick={() => navigate('/tournaments')} className={styles.backBtn}>
            ← Tournaments
          </button>
          <h1 className={styles.tournamentName}>🏆 {bracket.name}</h1>
          <div className={styles.metaRow}>
            <span
              className={[
                styles.statusBadge,
                bracket.status === 'LOBBY' ? styles.statusLobby : '',
                bracket.status === 'IN_PROGRESS' ? styles.statusInProgress : '',
                bracket.status === 'COMPLETED' ? styles.statusCompleted : '',
              ].filter(Boolean).join(' ')}
            >
              {bracket.status === 'LOBBY' && '🔓 Phòng chờ'}
              {bracket.status === 'IN_PROGRESS' && '⚔️ Đang diễn ra'}
              {bracket.status === 'COMPLETED' && '✅ Hoàn thành'}
            </span>
            <span className={styles.metaText}>
              👥 {participantCount} người chơi
            </span>
            {bracket.status !== 'LOBBY' && (
              <span className={styles.metaText}>
                📊 Vòng {bracket.currentRound}/{bracket.totalRounds}
              </span>
            )}
          </div>
          <p className={styles.tournamentId}>ID: {bracket.tournamentId}</p>

          {/* Lobby Actions */}
          {bracket.status === 'LOBBY' && (
            <div className={styles.lobbyActions}>
              <button
                className={styles.joinBtn}
                onClick={handleJoin}
                disabled={joinLoading}
              >
                {joinLoading ? 'Đang tham gia...' : '⚔️ Tham gia'}
              </button>
              <button
                className={styles.startBtn}
                onClick={handleStart}
                disabled={startLoading}
              >
                {startLoading ? 'Đang bắt đầu...' : '🚀 Bắt đầu'}
              </button>
            </div>
          )}

          {actionMsg && (
            <p className={`${styles.actionMsg} ${actionMsg.type === 'success' ? styles.actionSuccess : styles.actionError}`}>
              {actionMsg.text}
            </p>
          )}
        </div>

        {/* Participants list in lobby */}
        {bracket.status === 'LOBBY' && bracket.participants && bracket.participants.length > 0 && (
          <div className={styles.participantsList}>
            <p className={styles.participantsTitle}>Người chơi đã tham gia</p>
            {bracket.participants.map((p) => (
              <div key={p.userId} className={styles.participantRow}>
                <div className={styles.participantAvatar}>
                  {p.userName.charAt(0).toUpperCase()}
                </div>
                <span className={styles.participantName}>{p.userName}</span>
              </div>
            ))}
          </div>
        )}

        {/* Champion Banner */}
        {champion && (
          <div className={styles.championBanner}>
            <span className={styles.championIcon}>👑</span>
            <p className={styles.championLabel}>Nhà vô địch</p>
            <p className={styles.championName}>{champion}</p>
          </div>
        )}

        {/* Bracket */}
        {(bracket.status === 'IN_PROGRESS' || bracket.status === 'COMPLETED') && (
          <div className={styles.bracketSection}>
            <h2 className={styles.bracketSectionTitle}>📊 Bracket</h2>
            <BracketView
              rounds={bracket.rounds}
              totalRounds={bracket.totalRounds}
              currentRound={bracket.currentRound}
              status={bracket.status}
              onMatchClick={handleMatchClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetail;
