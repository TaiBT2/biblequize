import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { api } from '../api/client';
import styles from './TournamentMatch.module.css';

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
  if (round === totalRounds) return 'Chung kết';
  if (round === totalRounds - 1) return 'Bán kết';
  if (round === totalRounds - 2) return 'Tứ kết';
  return `Vòng ${round}`;
}

function renderLivesLarge(lives: number, maxLives: number = 3): React.ReactNode {
  const hearts: React.ReactNode[] = [];
  for (let i = 0; i < maxLives; i++) {
    if (i < lives) {
      hearts.push(<span key={i}>❤️</span>);
    } else {
      hearts.push(<span key={i} className={styles.lostLife}>💀</span>);
    }
  }
  return hearts;
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
        setError('Không tìm thấy trận đấu');
      }
    } catch (err: any) {
      if (!match) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Không thể tải dữ liệu');
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
      alert(err.response?.data?.message || err.response?.data?.error || 'Không thể bỏ cuộc');
    } finally {
      setForfeitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Đang tải trận đấu...</span>
        </div>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <button onClick={() => navigate(`/tournaments/${id}`)} className={styles.backBtn}>
              ← Quay về bracket
            </button>
          </div>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryBtn} onClick={() => { setLoading(true); setError(''); fetchMatch(); }}>
              Thử lại
            </button>
          </div>
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
    : `Vòng ${match.roundNumber}`;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <button onClick={() => navigate(`/tournaments/${id}`)} className={styles.backBtn}>
            ← Quay về bracket
          </button>
          <h1 className={styles.matchTitle}>
            ⚔️ {roundLabel} — Trận {match.matchIndex + 1}
          </h1>
          {tournamentName && (
            <p className={styles.matchMeta}>{tournamentName}</p>
          )}
          <span
            className={[
              styles.statusBadge,
              match.status === 'PENDING' ? styles.statusPending : '',
              match.status === 'IN_PROGRESS' ? styles.statusInProgress : '',
              match.status === 'COMPLETED' ? styles.statusCompleted : '',
            ].filter(Boolean).join(' ')}
          >
            {match.status === 'PENDING' && '⏳ Chưa bắt đầu'}
            {match.status === 'IN_PROGRESS' && '⚔️ Đang diễn ra'}
            {match.status === 'COMPLETED' && '✅ Hoàn thành'}
          </span>
        </div>

        {/* BYE match */}
        {match.isBye && (
          <div className={styles.byeMessage}>
            <span className={styles.byeIcon}>🛡️</span>
            <p className={styles.byeText}>Trận BYE — Người chơi tự động đi tiếp</p>
            {p1 && <p className={styles.byeWinner}>👑 {p1.userName}</p>}
          </div>
        )}

        {/* PENDING match */}
        {!match.isBye && match.status === 'PENDING' && (
          <div className={styles.pendingMessage}>
            <span className={styles.pendingIcon}>⏳</span>
            <p className={styles.pendingText}>Trận đấu chưa bắt đầu</p>
            {p1 && p2 && (
              <p className={styles.pendingText} style={{ marginTop: 8 }}>
                {p1.userName} vs {p2.userName}
              </p>
            )}
          </div>
        )}

        {/* IN_PROGRESS or COMPLETED — show player panels */}
        {!match.isBye && (match.status === 'IN_PROGRESS' || match.status === 'COMPLETED') && (
          <>
            <div className={styles.playersPanel}>
              {/* Player 1 */}
              {p1 && (
                <div
                  className={[
                    styles.playerCard,
                    match.status === 'COMPLETED' && p1.isWinner ? styles.playerCardWinner : '',
                    match.status === 'COMPLETED' && !p1.isWinner ? styles.playerCardLoser : '',
                  ].filter(Boolean).join(' ')}
                >
                  <div className={styles.playerAvatar}>
                    {p1.userName.charAt(0).toUpperCase()}
                  </div>
                  <p className={styles.playerName}>{p1.userName}</p>
                  <div className={styles.livesDisplay}>
                    {renderLivesLarge(p1.lives)}
                  </div>
                  <p className={styles.score}>{p1.score}</p>
                  <p className={styles.scoreLabel}>Điểm</p>
                  {match.status === 'COMPLETED' && p1.isWinner && (
                    <span className={styles.winnerBadge}>👑 Chiến thắng</span>
                  )}
                </div>
              )}

              {/* VS */}
              <div className={styles.vsText}>VS</div>

              {/* Player 2 */}
              {p2 && (
                <div
                  className={[
                    styles.playerCard,
                    match.status === 'COMPLETED' && p2.isWinner ? styles.playerCardWinner : '',
                    match.status === 'COMPLETED' && !p2.isWinner ? styles.playerCardLoser : '',
                  ].filter(Boolean).join(' ')}
                >
                  <div className={styles.playerAvatar}>
                    {p2.userName.charAt(0).toUpperCase()}
                  </div>
                  <p className={styles.playerName}>{p2.userName}</p>
                  <div className={styles.livesDisplay}>
                    {renderLivesLarge(p2.lives)}
                  </div>
                  <p className={styles.score}>{p2.score}</p>
                  <p className={styles.scoreLabel}>Điểm</p>
                  {match.status === 'COMPLETED' && p2.isWinner && (
                    <span className={styles.winnerBadge}>👑 Chiến thắng</span>
                  )}
                </div>
              )}
            </div>

            {/* Forfeit button for in-progress matches */}
            {match.status === 'IN_PROGRESS' && (
              <div className={styles.forfeitSection}>
                <button
                  className={styles.forfeitBtn}
                  onClick={handleForfeit}
                  disabled={forfeitLoading}
                >
                  {forfeitLoading ? 'Đang xử lý...' : '🏳️ Bỏ cuộc'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Winner Overlay */}
      {showWinnerOverlay && match.status === 'COMPLETED' && winner && (
        <div className={styles.winnerOverlay} onClick={() => setShowWinnerOverlay(false)}>
          <span className={styles.winnerIcon}>🏆</span>
          <p className={styles.winnerText}>{winner.userName}</p>
          <p className={styles.winnerSubtext}>đã chiến thắng trận đấu!</p>
          <button
            className={styles.backToBracketBtn}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tournaments/${id}`);
            }}
          >
            Quay về bracket
          </button>
        </div>
      )}
    </div>
  );
};

export default TournamentMatch;
