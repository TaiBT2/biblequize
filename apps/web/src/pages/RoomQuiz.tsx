import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useStomp } from '../hooks/useStomp';

type Question = { id: string; content: string; options: string[] };

type PlayerScore = {
  playerId: string; username: string; score: number;
  correctAnswers: number; totalAnswered: number; accuracy: number;
  finalRank?: number; playerStatus?: string;
};

type EliminationToast = { id: number; username: string; rank: number };

// ── Podium screen (Battle Royale / Speed Race end) ──
const PodiumScreen: React.FC<{ results: PlayerScore[]; onClose: () => void }> = ({ results, onClose }) => {
  const top3 = results.filter(r => r.finalRank && r.finalRank <= 3).sort((a, b) => (a.finalRank ?? 99) - (b.finalRank ?? 99));
  const medals = ['🥇', '🥈', '🥉'];
  const podiumHeight = ['h-32', 'h-24', 'h-20'];
  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-6">
      <div className="text-4xl font-bold neon-text mb-8 animate-bounce">🏆 KẾT QUẢ CUỐI</div>
      <div className="flex items-end gap-4 mb-10">
        {[top3[1], top3[0], top3[2]].filter(Boolean).map((p) => {
          const rank = (p?.finalRank ?? 1) - 1;
          return (
            <div key={p!.playerId} className="flex flex-col items-center">
              <div className="text-3xl mb-2">{medals[rank]}</div>
              <div className="text-white font-bold text-sm mb-2 max-w-[80px] text-center truncate">{p!.username}</div>
              <div className="text-purple-300 text-xs mb-2">{p!.score} điểm</div>
              <div className={`${podiumHeight[rank]} w-20 bg-gradient-to-t from-purple-800 to-purple-600 rounded-t-lg flex items-end justify-center pb-2`}>
                <span className="text-white font-bold text-xl">#{rank + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="w-full max-w-sm bg-black/40 rounded-xl border border-purple-500/30 p-4 mb-6">
        <div className="text-purple-200 text-sm font-semibold mb-3">Tất cả người chơi</div>
        <div className="space-y-2 max-h-40 overflow-auto">
          {results.map(r => (
            <div key={r.playerId} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">#{r.finalRank ?? '—'} {r.username}</span>
              <span className="text-white font-bold">{r.score} đ</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onClose} className="py-3 px-10 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg neon-btn transition">
        Trở về Lobby
      </button>
    </div>
  );
};

// ── Elimination screen (Battle Royale) ──
const EliminationScreen: React.FC<{ rank: number; totalPlayers: number; correctIndex: number | null; question: Question | null; onSpectate: () => void }> = ({ rank, totalPlayers, correctIndex, question, onSpectate }) => (
  <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-40 p-6">
    <div className="text-6xl mb-4 animate-bounce">💀</div>
    <h1 className="text-3xl font-bold text-red-400 mb-2">Bạn đã bị loại!</h1>
    <p className="text-gray-300 text-lg mb-1">Thứ hạng: <b className="text-white">#{rank}</b>/{totalPlayers}</p>
    {correctIndex !== null && question && (
      <p className="text-gray-400 text-sm mt-3 mb-6 text-center max-w-xs">
        Đáp án đúng: <b className="text-green-400">{String.fromCharCode(65 + correctIndex)}. {question.options[correctIndex]}</b>
      </p>
    )}
    <button onClick={onSpectate} className="py-3 px-8 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition">
      👁️ Xem tiếp (Spectator)
    </button>
  </div>
);

// ── Team score bar (Team vs Team) ──
const TeamScoreBar: React.FC<{ scoreA: number; scoreB: number; perfectA?: boolean; perfectB?: boolean }> = ({ scoreA, scoreB, perfectA, perfectB }) => {
  const total = scoreA + scoreB || 1;
  const pctA = (scoreA / total) * 100;
  return (
    <div className="bg-black/50 border border-purple-500/20 rounded-xl px-4 py-3 mb-4">
      <div className="flex items-center justify-between mb-2 text-sm font-bold">
        <span className="text-blue-400">🔵 Team A {perfectA && <span className="text-yellow-300 text-xs">✨ Perfect!</span>}</span>
        <span className="text-purple-300 text-xs">VS</span>
        <span className="text-red-400">Team B 🔴 {perfectB && <span className="text-yellow-300 text-xs">Perfect! ✨</span>}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-blue-300 font-bold text-sm w-14 text-right">{scoreA}</span>
        <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden flex">
          <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700 rounded-l-full" style={{ width: `${pctA}%` }} />
          <div className="h-full bg-gradient-to-l from-red-600 to-red-400 transition-all duration-700 rounded-r-full flex-1" />
        </div>
        <span className="text-red-300 font-bold text-sm w-14">{scoreB}</span>
      </div>
    </div>
  );
};

// ── Team win screen ──
const TeamWinScreen: React.FC<{ winner: string; scoreA: number; scoreB: number; leaderboard: PlayerScore[]; onClose: () => void }> = ({ winner, scoreA, scoreB, leaderboard, onClose }) => (
  <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-6">
    <div className="text-6xl mb-4 animate-bounce">{winner === 'TIE' ? '🤝' : '🏆'}</div>
    <h1 className="text-3xl font-bold neon-text mb-2">
      {winner === 'TIE' ? 'Hòa!' : winner === 'A' ? '🔵 Team A thắng!' : '🔴 Team B thắng!'}
    </h1>
    <div className="flex gap-8 mb-6 text-lg font-bold">
      <span className="text-blue-400">Team A: {scoreA}</span>
      <span className="text-red-400">Team B: {scoreB}</span>
    </div>
    <div className="w-full max-w-sm bg-black/40 rounded-xl border border-purple-500/30 p-4 mb-6">
      <div className="text-purple-200 text-sm font-semibold mb-3">Điểm cá nhân</div>
      <div className="space-y-2 max-h-48 overflow-auto">
        {leaderboard.map(r => (
          <div key={r.playerId} className="flex items-center justify-between text-sm">
            <span className={`text-gray-300 flex items-center gap-1`}>
              {r.username}
            </span>
            <span className="text-white font-bold">{r.score} đ</span>
          </div>
        ))}
      </div>
    </div>
    <button onClick={onClose} className="py-3 px-10 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg neon-btn transition">
      Trở về Lobby
    </button>
  </div>
);

// ── Match result overlay (Sudden Death) ──
const MatchResultOverlay: React.FC<{ winnerId: string; winnerName: string; loserId: string; loserName: string; myUserId?: string; onDismiss: () => void }> = ({ winnerName, loserName, myUserId, winnerId, onDismiss }) => {
  const iWon = myUserId === winnerId;
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40" onClick={onDismiss}>
      <div className={`text-center p-8 rounded-2xl border ${iWon ? 'border-yellow-400 bg-yellow-900/20' : 'border-red-400 bg-red-900/20'} max-w-sm mx-4`}>
        <div className="text-5xl mb-3">{iWon ? '🎉' : '💀'}</div>
        <div className={`text-xl font-bold mb-2 ${iWon ? 'text-yellow-300' : 'text-red-400'}`}>
          {iWon ? 'Bạn thắng! Giữ ghế nóng!' : 'Bạn thua! Xếp hàng chờ...'}
        </div>
        <div className="text-gray-300 text-sm">
          <span className="text-green-400 font-bold">{winnerName}</span> thắng — <span className="text-red-400">{loserName}</span> thua
        </div>
        <div className="text-gray-500 text-xs mt-2">Trận tiếp sắp bắt đầu...</div>
      </div>
    </div>
  );
};

// ── VS Arena header (Sudden Death) ──
const SdArenaHeader: React.FC<{ championName: string; championStreak: number; challengerName: string; myUsername: string; queueRemaining: number }> = ({ championName, championStreak, challengerName, myUsername: me, queueRemaining }) => (
  <div className="bg-black/50 border border-orange-500/30 rounded-xl px-4 py-3 mb-4">
    <div className="flex items-center justify-center gap-4 text-sm font-bold">
      <div className="text-center">
        <div className={`text-base ${championName === me ? 'text-yellow-300' : 'text-white'}`}>
          👑 {championName}{championName === me ? ' (bạn)' : ''}
        </div>
        {championStreak > 0 && <div className="text-orange-400 text-xs">🔥 {championStreak} thắng liên tiếp</div>}
      </div>
      <div className="text-red-400 text-xl font-black">VS</div>
      <div className="text-center">
        <div className={`text-base ${challengerName === me ? 'text-yellow-300' : 'text-white'}`}>
          ⚔️ {challengerName}{challengerName === me ? ' (bạn)' : ''}
        </div>
        <div className="text-gray-400 text-xs">Challenger</div>
      </div>
    </div>
    {queueRemaining > 0 && (
      <div className="text-center text-gray-500 text-xs mt-1">⏳ {queueRemaining} người đang chờ</div>
    )}
  </div>
);

// ────────────────────── MAIN COMPONENT ──────────────────────

const RoomQuiz: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const gameMode: string = (location.state as any)?.mode ?? 'SPEED_RACE';
  const myTeamFromState: string | null = (location.state as any)?.myTeam ?? null;

  const isBattleRoyale = gameMode === 'BATTLE_ROYALE';
  const isTeamVsTeam = gameMode === 'TEAM_VS_TEAM';
  const isSuddenDeath = gameMode === 'SUDDEN_DEATH';

  const myUsername = localStorage.getItem('userName') ?? '';

  // Core question state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(30);
  const [question, setQuestion] = useState<Question | null>(null);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Battle Royale state
  const [activeCount, setActiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isEliminated, setIsEliminated] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [showEliminationScreen, setShowEliminationScreen] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [toasts, setToasts] = useState<EliminationToast[]>([]);
  const [showPodium, setShowPodium] = useState(false);
  const [finalResults, setFinalResults] = useState<PlayerScore[]>([]);

  // Team vs Team state
  const [myTeam, setMyTeam] = useState<string | null>(myTeamFromState);
  const [teamScoreA, setTeamScoreA] = useState(0);
  const [teamScoreB, setTeamScoreB] = useState(0);
  const [perfectA, setPerfectA] = useState(false);
  const [perfectB, setPerfectB] = useState(false);
  const [teamWinner, setTeamWinner] = useState<string | null>(null);
  const [teamWinScoreA, setTeamWinScoreA] = useState(0);
  const [teamWinScoreB, setTeamWinScoreB] = useState(0);

  // Sudden Death state
  const [sdChampionName, setSdChampionName] = useState('');
  const [sdChampionId, setSdChampionId] = useState('');
  const [sdChampionStreak, setSdChampionStreak] = useState(0);
  const [sdChallengerName, setSdChallengerName] = useState('');
  const [sdChallengerId, setSdChallengerId] = useState('');
  const [sdQueueRemaining, setSdQueueRemaining] = useState(0);
  const [sdMatchResult, setSdMatchResult] = useState<{ winnerId: string; winnerName: string; loserId: string; loserName: string } | null>(null);
  const [sdSpectating, setSdSpectating] = useState(false);
  const [sdMyUserId, setSdMyUserId] = useState('');

  const questionStartedAt = useRef<number>(0);
  const toastCounter = useRef(0);

  const addToast = (username: string, rank: number) => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, username, rank }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const { connected, reconnecting, send } = useStomp({
    roomId,
    onReconnect: () => { if (roomId) send(`/app/room/${roomId}/join`, {}); },
    onMessage: (msg) => {
      switch (msg.type) {
        case 'QUESTION_START': {
          const data = msg.data as { questionIndex: number; totalQuestions: number; question: Question; timeLimit: number };
          questionStartedAt.current = Date.now();
          setQuestionIndex(data.questionIndex);
          setTotalQuestions(data.totalQuestions);
          setQuestion(data.question);
          setTimeLimit(data.timeLimit);
          setTimeLeft(data.timeLimit);
          setSelected(null);
          setCorrectIndex(null);
          setSubmitting(false);
          setPerfectA(false);
          setPerfectB(false);
          break;
        }
        case 'ROUND_END': {
          const d = msg.data as { correctIndex: number; leaderboard: PlayerScore[] };
          setCorrectIndex(d.correctIndex);
          setScores(d.leaderboard.sort((a, b) => b.score - a.score));
          break;
        }
        case 'SCORE_UPDATE': {
          setScores(prev => {
            const upd = [...prev];
            const d = msg.data as PlayerScore;
            const i = upd.findIndex(x => x.playerId === d.playerId);
            if (i >= 0) upd[i] = { ...upd[i], ...d }; else upd.push(d);
            return upd.sort((a, b) => b.score - a.score);
          });
          break;
        }
        case 'LEADERBOARD_UPDATE': {
          setScores((msg.data as PlayerScore[]).sort((a, b) => b.score - a.score));
          break;
        }

        // ── Battle Royale ──
        case 'PLAYER_ELIMINATED': {
          const d = msg.data as { userId: string; username: string; rank: number; activeRemaining: number };
          addToast(d.username, d.rank);
          setActiveCount(d.activeRemaining);
          if (d.username === myUsername) {
            setIsEliminated(true);
            setMyRank(d.rank);
            setShowEliminationScreen(true);
          }
          break;
        }
        case 'BATTLE_ROYALE_UPDATE': {
          const d = msg.data as { activeCount: number; totalCount: number };
          setActiveCount(d.activeCount);
          setTotalCount(d.totalCount);
          break;
        }

        // ── Team vs Team ──
        case 'TEAM_ASSIGNMENT': {
          const d = msg.data as { players: { userId: string; username: string; team: string }[] };
          const me = d.players.find(p => p.username === myUsername);
          if (me) setMyTeam(me.team);
          break;
        }
        case 'TEAM_SCORE_UPDATE': {
          const d = msg.data as { scoreA: number; scoreB: number };
          setTeamScoreA(d.scoreA);
          setTeamScoreB(d.scoreB);
          break;
        }
        case 'PERFECT_ROUND': {
          const d = msg.data as { teamAPerfect: boolean; teamBPerfect: boolean };
          setPerfectA(d.teamAPerfect);
          setPerfectB(d.teamBPerfect);
          break;
        }

        // ── Sudden Death ──
        case 'MATCH_START': {
          const d = msg.data as { championId: string; championName: string; championStreak: number; challengerId: string; challengerName: string; queueRemaining: number };
          setSdChampionId(d.championId);
          setSdChampionName(d.championName);
          setSdChampionStreak(d.championStreak);
          setSdChallengerId(d.challengerId);
          setSdChallengerName(d.challengerName);
          setSdQueueRemaining(d.queueRemaining);
          setSdMatchResult(null);
          // Determine if current user is spectating
          // We don't have userId easily, so use username matching
          const inMatch = d.championName === myUsername || d.challengerName === myUsername;
          setSdSpectating(!inMatch);
          break;
        }
        case 'MATCH_END': {
          const d = msg.data as { winnerId: string; winnerName: string; winnerNewStreak: number; loserId: string; loserName: string };
          setSdMatchResult({ winnerId: d.winnerId, winnerName: d.winnerName, loserId: d.loserId, loserName: d.loserName });
          // Update champion streak after win
          if (d.winnerName === sdChampionName || d.winnerName === sdChallengerName) {
            setSdChampionStreak(d.winnerNewStreak);
          }
          break;
        }

        case 'QUIZ_END': {
          const d = msg.data as any;
          if (isBattleRoyale) {
            const results = d.finalResults as PlayerScore[] | undefined;
            if (results && results.length > 0) {
              setFinalResults(results);
              setShowPodium(true);
            } else {
              navigate(`/multiplayer`, { replace: true });
            }
          } else if (isTeamVsTeam) {
            const results = Array.isArray(d.leaderboard) ? d.leaderboard : (Array.isArray(d.finalResults) ? d.finalResults : []);
            setFinalResults(results);
            setTeamWinner(d.teamWinner ?? null);
            setTeamWinScoreA(d.scoreA ?? 0);
            setTeamWinScoreB(d.scoreB ?? 0);
          } else if (isSuddenDeath) {
            const results = Array.isArray(d) ? d : (Array.isArray(d.finalResults) ? d.finalResults : []);
            setFinalResults(results);
            setShowPodium(true);
          } else {
            // Speed Race: show podium if results available
            const results = Array.isArray(d.finalResults) ? d.finalResults : (Array.isArray(d) ? d : []);
            if (results.length > 0) {
              setFinalResults(results);
              setShowPodium(true);
            } else {
              navigate(`/multiplayer`, { replace: true });
            }
          }
          break;
        }
      }
    },
  });

  useEffect(() => {
    if (!timeLeft) return;
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const inSdMatch = isSuddenDeath && (sdChampionName === myUsername || sdChallengerName === myUsername);
  const canAnswer = useMemo(
    () => connected && question && timeLeft > 0 && selected === null && !submitting
      && !isEliminated && !(isSuddenDeath && sdSpectating),
    [connected, question, timeLeft, selected, submitting, isEliminated, isSuddenDeath, sdSpectating]
  );

  const submitAnswer = (idx: number) => {
    if (!roomId || !question || !canAnswer) return;
    const reactionTimeMs = Date.now() - questionStartedAt.current;
    setSelected(idx);
    setSubmitting(true);
    send(`/app/room/${roomId}/answer`, { questionIndex, answerIndex: idx, reactionTimeMs });
    setTimeout(() => setSubmitting(false), 500);
  };

  const timerPercent = timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 0;
  const timerColor = timerPercent > 50 ? 'bg-green-500' : timerPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  const getOptionClass = (i: number) => {
    if (correctIndex !== null) {
      if (i === correctIndex) return 'border-green-400 bg-green-900/30 text-green-200';
      if (i === selected && i !== correctIndex) return 'border-red-400 bg-red-900/30 text-red-200';
      return 'border-gray-600 bg-black/20 text-gray-400 opacity-60';
    }
    if (selected === i) return 'border-yellow-400 bg-yellow-500/10 text-white';
    if ((isEliminated && !isSpectator) || (isSuddenDeath && sdSpectating))
      return 'border-gray-700 bg-black/10 text-gray-600 cursor-not-allowed';
    return 'border-purple-500/30 bg-black/30 hover:bg-black/50 text-white';
  };

  // ── Overlays ──
  if (showPodium) {
    return <PodiumScreen results={finalResults} onClose={() => navigate('/multiplayer', { replace: true })} />;
  }
  if (isTeamVsTeam && teamWinner !== null) {
    return (
      <TeamWinScreen
        winner={teamWinner}
        scoreA={teamWinScoreA}
        scoreB={teamWinScoreB}
        leaderboard={finalResults}
        onClose={() => navigate('/multiplayer', { replace: true })}
      />
    );
  }
  if (showEliminationScreen) {
    return (
      <EliminationScreen
        rank={myRank!}
        totalPlayers={totalCount}
        correctIndex={correctIndex}
        question={question}
        onSpectate={() => { setShowEliminationScreen(false); setIsSpectator(true); }}
      />
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#0E0B1A' }}>
      {/* Reconnecting banner */}
      {reconnecting && (
        <div className="fixed top-0 inset-x-0 z-50 px-4 py-2.5 bg-yellow-900/90 border-b border-yellow-500/60 text-yellow-200 text-sm text-center animate-pulse">
          ⚠️ Mất kết nối, đang kết nối lại...
        </div>
      )}
      {/* Elimination toasts (Battle Royale) */}
      {isBattleRoyale && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 space-y-2 w-72">
          {toasts.map(t => (
            <div key={t.id} className="bg-red-900/80 border border-red-500/60 text-red-200 text-sm px-4 py-2 rounded-lg shadow-lg animate-pulse text-center">
              ❌ <b>{t.username}</b> bị loại — hạng #{t.rank}
            </div>
          ))}
        </div>
      )}

      {/* Match result overlay (Sudden Death) */}
      {isSuddenDeath && sdMatchResult && (
        <MatchResultOverlay
          winnerId={sdMatchResult.winnerId}
          winnerName={sdMatchResult.winnerName}
          loserId={sdMatchResult.loserId}
          loserName={sdMatchResult.loserName}
          myUserId={sdMyUserId}
          onDismiss={() => setSdMatchResult(null)}
        />
      )}

      <div className="max-w-5xl mx-auto">
        {/* Team score bar */}
        {isTeamVsTeam && (
          <TeamScoreBar scoreA={teamScoreA} scoreB={teamScoreB} perfectA={perfectA} perfectB={perfectB} />
        )}

        {/* Sudden Death arena header */}
        {isSuddenDeath && sdChampionName && (
          <SdArenaHeader
            championName={sdChampionName}
            championStreak={sdChampionStreak}
            challengerName={sdChallengerName}
            myUsername={myUsername}
            queueRemaining={sdQueueRemaining}
          />
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Question area */}
          <div className="md:col-span-2 bg-black/40 border border-purple-500/30 rounded-xl p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-purple-200 text-sm">Câu {questionIndex + 1}/{totalQuestions || '?'}</span>
                {isBattleRoyale && activeCount > 0 && (
                  <span className="bg-red-900/60 border border-red-500/50 text-red-200 text-xs px-2.5 py-1 rounded-full font-bold">
                    👥 Còn lại: {activeCount}/{totalCount}
                  </span>
                )}
                {isSpectator && (
                  <span className="bg-gray-700/60 text-gray-300 text-xs px-2.5 py-1 rounded-full">👁️ Spectator</span>
                )}
                {isSuddenDeath && sdSpectating && (
                  <span className="bg-orange-900/40 text-orange-300 text-xs px-2.5 py-1 rounded-full">👁️ Đang xem</span>
                )}
                {isTeamVsTeam && myTeam && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${myTeam === 'A' ? 'bg-blue-900/40 text-blue-300 border border-blue-500/30' : 'bg-red-900/40 text-red-300 border border-red-500/30'}`}>
                    {myTeam === 'A' ? '🔵 Team A' : '🔴 Team B'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-purple-200 text-sm">⏱ {timeLeft}s</span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="w-full h-2 bg-gray-700 rounded-full mb-5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPercent}%` }} />
            </div>

            {/* Question */}
            <div className="text-white text-xl font-semibold mb-5 min-h-[64px]">
              {question?.content || 'Đang chờ câu hỏi...'}
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              {(question?.options ?? []).map((opt, i) => (
                <button
                  key={i}
                  disabled={!canAnswer && correctIndex === null}
                  onClick={() => submitAnswer(i)}
                  className={`p-4 rounded-lg border transition-all duration-200 text-left ${getOptionClass(i)}`}
                >
                  <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              ))}
            </div>

            {/* Feedback */}
            {selected !== null && correctIndex === null && !isSpectator && !(isSuddenDeath && sdSpectating) && (
              <div className="mt-4 text-center text-purple-300 text-sm animate-pulse">Đang chờ kết quả...</div>
            )}
            {correctIndex !== null && (
              <div className="mt-4 text-center text-sm">
                {isSpectator || (isSuddenDeath && sdSpectating) ? (
                  <span className="text-blue-400">👁️ Xem thôi — bạn đang ở chế độ spectator</span>
                ) : selected === correctIndex ? (
                  <span className="text-green-400 font-bold text-base">✅ Đúng rồi!</span>
                ) : selected !== null ? (
                  <span className="text-red-400 font-bold text-base">❌ Sai rồi!</span>
                ) : (
                  <span className="text-gray-400">⏰ Hết giờ!</span>
                )}
              </div>
            )}

            {/* Perfect round banner */}
            {isTeamVsTeam && (perfectA || perfectB) && (
              <div className={`mt-3 p-3 rounded-lg border text-center font-bold text-sm animate-pulse ${
                (perfectA && myTeam === 'A') || (perfectB && myTeam === 'B')
                  ? 'border-yellow-400/60 bg-yellow-900/20 text-yellow-300'
                  : 'border-purple-500/30 bg-purple-900/10 text-purple-300'
              }`}>
                ✨ Perfect Round! {perfectA ? '🔵 Team A' : ''}{perfectA && perfectB ? ' & ' : ''}{perfectB ? '🔴 Team B' : ''} +50 điểm!
              </div>
            )}
          </div>

          {/* Leaderboard / Side panel */}
          <div className="bg-black/40 border border-purple-500/30 rounded-xl p-4">
            <div className="text-purple-200 font-semibold mb-3 text-sm">
              {isBattleRoyale ? '⚔️ Người còn lại' :
               isTeamVsTeam ? '👥 Bảng điểm cá nhân' :
               isSuddenDeath ? '🔥 Winning Streaks' :
               '🏆 Bảng điểm'}
            </div>
            <div className="space-y-2 max-h-[55vh] overflow-auto pr-1">
              {scores.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">Chưa có điểm nào</p>
              ) : (
                scores.map((s, idx) => {
                  const isMe = s.username === myUsername;
                  const eliminated = s.playerStatus === 'ELIMINATED';
                  const teamColor = isTeamVsTeam
                    ? (scores.findIndex(x => x.playerId === s.playerId) % 2 === 0 ? 'blue' : 'red')
                    : null;
                  return (
                    <div
                      key={s.playerId}
                      className={`flex items-center justify-between p-2.5 rounded border ${
                        isMe ? 'border-yellow-400/70 bg-yellow-900/10' :
                        eliminated ? 'border-gray-700 bg-black/20 opacity-50' :
                        idx === 0 ? 'border-yellow-400/60 bg-yellow-900/10' :
                        'border-purple-500/30 bg-black/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          eliminated ? 'bg-gray-700 text-gray-400' :
                          idx === 0 ? 'bg-yellow-500/20 border border-yellow-500/60 text-yellow-300' :
                          'bg-purple-700/30 border border-purple-500/40 text-purple-300'
                        }`}>
                          {eliminated ? '💀' : isSuddenDeath ? '🔥' : idx + 1}
                        </div>
                        <div className={`text-sm font-medium truncate max-w-[75px] ${isMe ? 'text-yellow-300' : eliminated ? 'text-gray-500' : 'text-white'}`}>
                          {s.username}{isMe ? ' (bạn)' : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${eliminated ? 'text-gray-500' : 'text-white'}`}>{s.score}</div>
                        <div className="text-gray-400 text-xs">{s.correctAnswers}/{s.totalAnswered}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomQuiz;
