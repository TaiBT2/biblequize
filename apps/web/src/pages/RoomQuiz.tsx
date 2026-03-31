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

const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];
const FILL_STYLE = { fontVariationSettings: "'FILL' 1" } as const;

// ── Podium screen (Battle Royale / Speed Race end) ──
const PodiumScreen: React.FC<{ results: PlayerScore[]; onClose: () => void }> = ({ results, onClose }) => {
  const top3 = results.filter(r => r.finalRank && r.finalRank <= 3).sort((a, b) => (a.finalRank ?? 99) - (b.finalRank ?? 99));
  const podiumColors = [
    'from-secondary to-tertiary',   // 1st - gold
    'from-primary/60 to-primary/30', // 2nd - silver/lavender
    'from-[#cd7f32]/60 to-[#cd7f32]/30', // 3rd - bronze
  ];
  const podiumHeights = ['h-36', 'h-28', 'h-22'];
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-6 overflow-auto">
      {/* Background glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-secondary/8 blur-[150px] rounded-full" />
      </div>

      <div className="flex items-center gap-3 mb-10">
        <span className="material-symbols-outlined text-secondary text-4xl" style={FILL_STYLE}>trophy</span>
        <h1 className="font-headline text-3xl md:text-4xl font-black tracking-tighter text-on-surface">
          KET QUA CUOI
        </h1>
      </div>

      {/* Podium */}
      <div className="flex items-end gap-4 mb-10">
        {podiumOrder.map((p) => {
          const rank = (p!.finalRank ?? 1) - 1;
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
          );
        })}
      </div>

      {/* All players list */}
      <div className="w-full max-w-sm bg-surface-container rounded-2xl border border-outline-variant/10 p-5 mb-8">
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-4">Tat ca nguoi choi</div>
        <div className="space-y-2 max-h-44 overflow-auto">
          {results.map((r, idx) => (
            <div key={r.playerId} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/5">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  idx === 0 ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-surface-container-highest text-on-surface-variant'
                }`}>{r.finalRank ?? idx + 1}</span>
                <span className="text-on-surface text-sm font-medium">{r.username}</span>
              </div>
              <span className="text-on-surface font-bold text-sm">{r.score}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onClose}
        className="gold-gradient text-on-secondary font-black py-3.5 px-10 rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-secondary/20 active:scale-95 transition-all hover:brightness-110"
      >
        Ve Phong Cho
      </button>
    </div>
  );
};

// ── Elimination screen (Battle Royale) ──
const EliminationScreen: React.FC<{
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
    <button
      onClick={onSpectate}
      className="flex items-center gap-2 py-3 px-8 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-2xl transition-colors border border-outline-variant/10"
    >
      <span className="material-symbols-outlined text-lg">visibility</span>
      Xem tiep (Spectator)
    </button>
  </div>
);

// ── Team score bar (Team vs Team) ──
const TeamScoreBar: React.FC<{ scoreA: number; scoreB: number; perfectA?: boolean; perfectB?: boolean }> = ({ scoreA, scoreB, perfectA, perfectB }) => {
  const total = scoreA + scoreB || 1;
  const pctA = (scoreA / total) * 100;
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
  );
};

// ── Team win screen ──
const TeamWinScreen: React.FC<{
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
      <span className="text-[#4a9eff] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-[#4a9eff]" /> {scoreA}
      </span>
      <span className="text-error flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-error" /> {scoreB}
      </span>
    </div>
    <div className="w-full max-w-sm bg-surface-container rounded-2xl border border-outline-variant/10 p-5 mb-8">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-4">Diem ca nhan</div>
      <div className="space-y-2 max-h-48 overflow-auto">
        {leaderboard.map((r, idx) => (
          <div key={r.playerId} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/5">
            <span className="text-on-surface text-sm font-medium">{r.username}</span>
            <span className="text-on-surface font-bold text-sm">{r.score}</span>
          </div>
        ))}
      </div>
    </div>
    <button
      onClick={onClose}
      className="gold-gradient text-on-secondary font-black py-3.5 px-10 rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-secondary/20 active:scale-95 transition-all hover:brightness-110"
    >
      Ve Phong Cho
    </button>
  </div>
);

// ── Match result overlay (Sudden Death) ──
const MatchResultOverlay: React.FC<{
  winnerId: string; winnerName: string; loserId: string; loserName: string; myUserId?: string; onDismiss: () => void;
}> = ({ winnerName, loserName, myUserId, winnerId, onDismiss }) => {
  const iWon = myUserId === winnerId;
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-40" onClick={onDismiss}>
      <div className={`text-center p-8 rounded-3xl border-2 max-w-sm mx-4 ${
        iWon ? 'border-secondary bg-secondary/5 gold-glow' : 'border-error bg-error/5'
      }`}>
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
          iWon ? 'bg-secondary/10' : 'bg-error/10'
        }">
          <span className={`material-symbols-outlined text-4xl ${iWon ? 'text-secondary' : 'text-error'}`} style={FILL_STYLE}>
            {iWon ? 'celebration' : 'skull'}
          </span>
        </div>
        <div className={`text-xl font-black mb-2 tracking-tight ${iWon ? 'text-secondary' : 'text-error'}`}>
          {iWon ? 'Ban thang! Giu ghe nong!' : 'Ban thua! Xep hang cho...'}
        </div>
        <div className="text-on-surface-variant text-sm">
          <span className="text-green-400 font-bold">{winnerName}</span> thang —{' '}
          <span className="text-error font-bold">{loserName}</span> thua
        </div>
        <div className="text-on-surface-variant/50 text-xs mt-3">Tran tiep sap bat dau...</div>
      </div>
    </div>
  );
};

// ── VS Arena header (Sudden Death) ──
const SdArenaHeader: React.FC<{
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
);

// ── Scoreboard overlay after each round ──
const RoundScoreboard: React.FC<{ scores: PlayerScore[]; myUsername: string }> = ({ scores, myUsername }) => {
  if (scores.length === 0) return null;
  return (
    <div className="mt-5 bg-surface-container rounded-2xl border border-outline-variant/10 p-4 animate-in fade-in">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-3 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm text-secondary">leaderboard</span>
        Ket qua vong nay
      </div>
      <div className="flex flex-wrap gap-2">
        {scores.slice(0, 8).map((s, idx) => {
          const isMe = s.username === myUsername;
          return (
            <div
              key={s.playerId}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${
                isMe ? 'border-secondary/30 bg-secondary/5' :
                idx === 0 ? 'border-secondary/20 bg-surface-container-low' :
                'border-outline-variant/5 bg-surface-container-low'
              }`}
            >
              <span className={`font-black text-xs ${idx === 0 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                #{idx + 1}
              </span>
              <span className={`font-medium truncate max-w-[70px] ${isMe ? 'text-secondary' : 'text-on-surface'}`}>
                {s.username}
              </span>
              <span className="text-on-surface font-bold">{s.score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
          const inMatch = d.championName === myUsername || d.challengerName === myUsername;
          setSdSpectating(!inMatch);
          break;
        }
        case 'MATCH_END': {
          const d = msg.data as { winnerId: string; winnerName: string; winnerNewStreak: number; loserId: string; loserName: string };
          setSdMatchResult({ winnerId: d.winnerId, winnerName: d.winnerName, loserId: d.loserId, loserName: d.loserName });
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

  const getOptionClasses = (i: number) => {
    let btn = 'group relative flex items-center p-5 md:p-6 rounded-2xl transition-all duration-300 text-left active:scale-[0.98] border-2';
    let letter = 'w-11 h-11 flex items-center justify-center rounded-xl font-black text-lg transition-colors flex-shrink-0';
    let text = 'ml-4 font-bold text-base md:text-lg leading-relaxed';

    if (correctIndex !== null) {
      if (i === correctIndex) {
        btn += ' bg-green-500/10 border-green-500';
        letter += ' bg-green-500 text-on-secondary shadow-lg';
        text += ' text-green-400';
      } else if (i === selected && i !== correctIndex) {
        btn += ' bg-error/10 border-error';
        letter += ' bg-error text-on-secondary shadow-lg';
        text += ' text-error';
      } else {
        btn += ' bg-surface-container border-transparent opacity-50';
        letter += ' bg-surface-container-highest text-on-surface-variant';
        text += ' text-on-surface-variant';
      }
    } else if (selected === i) {
      btn += ' bg-secondary/10 border-secondary gold-glow';
      letter += ' bg-secondary text-on-secondary shadow-lg';
      text += ' text-secondary';
    } else if ((isEliminated && !isSpectator) || (isSuddenDeath && sdSpectating)) {
      btn += ' bg-surface-container border-transparent cursor-not-allowed opacity-60';
      letter += ' bg-surface-container-highest text-on-surface-variant';
      text += ' text-on-surface-variant';
    } else {
      btn += ' bg-surface-container hover:bg-surface-container-high border-transparent hover:border-outline-variant/20';
      letter += ' bg-surface-container-highest text-secondary group-hover:bg-secondary group-hover:text-on-secondary';
      text += ' text-on-surface';
    }

    return { btn, letter, text };
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
    <div className="min-h-screen bg-surface font-body text-on-surface overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#9b59b6]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/5 blur-[120px] rounded-full" />
      </div>

      {/* Reconnecting banner */}
      {reconnecting && (
        <div className="fixed top-0 inset-x-0 z-50 px-4 py-2.5 bg-secondary-container/90 border-b border-secondary/30 text-on-surface text-sm text-center animate-pulse flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-secondary text-sm animate-spin">sync</span>
          Mat ket noi, dang ket noi lai...
        </div>
      )}

      {/* Elimination toasts (Battle Royale) */}
      {isBattleRoyale && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 space-y-2 w-72">
          {toasts.map(t => (
            <div key={t.id} className="glass-card border border-error/20 text-error text-sm px-4 py-2.5 rounded-xl shadow-lg animate-pulse text-center flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm" style={FILL_STYLE}>person_remove</span>
              <b>{t.username}</b> bi loai — hang #{t.rank}
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

      {/* ═══════════ HEADER BAR ═══════════ */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-low/90 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-6 h-14">
          {/* Left: Room info */}
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]' : 'bg-error shadow-[0_0_6px_rgba(255,180,171,0.4)]'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9b59b6]">
                {gameMode.replace(/_/g, ' ')}
              </span>
              <span className="font-headline font-bold text-sm tracking-tight text-on-surface">
                Phong #{roomId?.slice(-4)}
              </span>
            </div>
          </div>

          {/* Center: Round counter + mini scores */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/10">
              <span className="material-symbols-outlined text-secondary text-sm" style={FILL_STYLE}>quiz</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
                Cau {questionIndex + 1}/{totalQuestions || '?'}
              </span>
            </div>

            {/* Mini player scores */}
            <div className="flex items-center gap-1">
              {scores.slice(0, 4).map((s, idx) => (
                <div
                  key={s.playerId}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                    s.username === myUsername
                      ? 'border-secondary/30 bg-secondary/10 text-secondary'
                      : idx === 0
                      ? 'border-secondary/20 bg-surface-container text-on-surface'
                      : 'border-outline-variant/5 bg-surface-container text-on-surface-variant'
                  }`}
                  title={s.username}
                >
                  {s.username.slice(0, 3)}: {s.score}
                </div>
              ))}
              {scores.length > 4 && (
                <span className="text-on-surface-variant text-[10px] font-bold ml-1">+{scores.length - 4}</span>
              )}
            </div>
          </div>

          {/* Right: Timer + status badges */}
          <div className="flex items-center gap-3">
            {isBattleRoyale && activeCount > 0 && (
              <div className="flex items-center gap-1.5 bg-error/10 px-2.5 py-1 rounded-full border border-error/20">
                <span className="material-symbols-outlined text-error text-sm" style={FILL_STYLE}>group</span>
                <span className="text-error text-[10px] font-black">{activeCount}/{totalCount}</span>
              </div>
            )}
            {isSpectator && (
              <div className="flex items-center gap-1 bg-surface-container-high px-2.5 py-1 rounded-full border border-outline-variant/10">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">visibility</span>
                <span className="text-on-surface-variant text-[10px] font-bold">Spectator</span>
              </div>
            )}
            {isSuddenDeath && sdSpectating && (
              <div className="flex items-center gap-1 bg-[#ff8c42]/10 px-2.5 py-1 rounded-full border border-[#ff8c42]/20">
                <span className="material-symbols-outlined text-[#ff8c42] text-sm">visibility</span>
                <span className="text-[#ff8c42] text-[10px] font-bold">Dang xem</span>
              </div>
            )}
            {isTeamVsTeam && myTeam && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                myTeam === 'A'
                  ? 'bg-[#4a9eff]/10 border-[#4a9eff]/20'
                  : 'bg-error/10 border-error/20'
              }`}>
                <span className={`w-2 h-2 rounded-full ${myTeam === 'A' ? 'bg-[#4a9eff]' : 'bg-error'}`} />
                <span className={`text-[10px] font-black ${myTeam === 'A' ? 'text-[#4a9eff]' : 'text-error'}`}>
                  Team {myTeam}
                </span>
              </div>
            )}

            {/* Timer circle */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="timer-svg w-full h-full" viewBox="0 0 36 36">
                <circle
                  className="stroke-surface-container-highest"
                  cx="18" cy="18" r="15"
                  fill="none" strokeWidth="2.5"
                />
                <circle
                  className={`timer-arc ${timeLeft <= 5 ? 'stroke-error' : 'stroke-secondary'}`}
                  cx="18" cy="18" r="15"
                  fill="none" strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="94.25"
                  strokeDashoffset={94.25 - (timerPercent / 100) * 94.25}
                />
              </svg>
              <span className={`absolute font-headline font-black text-sm ${timeLeft <= 5 ? 'text-error animate-pulse' : 'text-secondary'}`}>
                {timeLeft}
              </span>
            </div>
          </div>
        </div>

        {/* Timer progress bar (mobile) */}
        <div className="h-1 bg-surface-container-highest md:hidden">
          <div
            className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-error' : 'bg-gradient-to-r from-secondary to-tertiary'}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
      </header>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main className="relative min-h-screen pt-20 pb-8 px-4 md:px-6 max-w-6xl mx-auto">
        {/* Mode-specific headers */}
        {isTeamVsTeam && (
          <TeamScoreBar scoreA={teamScoreA} scoreB={teamScoreB} perfectA={perfectA} perfectB={perfectB} />
        )}
        {isSuddenDeath && sdChampionName && (
          <SdArenaHeader
            championName={sdChampionName}
            championStreak={sdChampionStreak}
            challengerName={sdChallengerName}
            myUsername={myUsername}
            queueRemaining={sdQueueRemaining}
          />
        )}

        <div className="grid lg:grid-cols-[1fr_280px] gap-5">
          {/* ── Question + Answers area ── */}
          <div className="space-y-6">
            {/* Mobile round counter */}
            <div className="flex items-center justify-between md:hidden">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm" style={FILL_STYLE}>quiz</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
                  Cau {questionIndex + 1}/{totalQuestions || '?'}
                </span>
              </div>
              {scores.length > 0 && (
                <div className="text-[10px] font-bold text-on-surface-variant">
                  {scores.find(s => s.username === myUsername)?.score ?? 0} diem
                </div>
              )}
            </div>

            {/* Question Card */}
            <div className="relative w-full flex flex-col items-center justify-center text-center p-8 md:p-10 bg-surface-container-low rounded-[2rem] border border-outline-variant/10 shadow-2xl overflow-hidden min-h-[140px]">
              {/* Gold left accent bar */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-24 bg-secondary rounded-r-full" />

              <h2 className="font-headline text-xl md:text-3xl font-extrabold tracking-tight leading-snug max-w-3xl text-on-surface">
                {question?.content || 'Dang cho cau hoi...'}
              </h2>
            </div>

            {/* Answer Grid — 2x2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(question?.options ?? []).map((opt, i) => {
                const cls = getOptionClasses(i);
                return (
                  <button
                    key={i}
                    disabled={!canAnswer && correctIndex === null}
                    onClick={() => submitAnswer(i)}
                    className={cls.btn}
                  >
                    <div className={cls.letter}>{ANSWER_LETTERS[i]}</div>
                    <span className={cls.text}>{opt}</span>
                    {correctIndex !== null && i === correctIndex && (
                      <div className="absolute right-5 top-1/2 -translate-y-1/2">
                        <span className="material-symbols-outlined text-green-400 text-2xl" style={FILL_STYLE}>check_circle</span>
                      </div>
                    )}
                    {correctIndex !== null && i === selected && i !== correctIndex && (
                      <div className="absolute right-5 top-1/2 -translate-y-1/2">
                        <span className="material-symbols-outlined text-error text-2xl" style={FILL_STYLE}>cancel</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {selected !== null && correctIndex === null && !isSpectator && !(isSuddenDeath && sdSpectating) && (
              <div className="text-center text-on-surface-variant text-sm animate-pulse flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm animate-spin">hourglass_empty</span>
                Dang cho ket qua...
              </div>
            )}
            {/* Result Popup Overlay (Stitch design) */}
            {correctIndex !== null && !isSpectator && !(isSuddenDeath && sdSpectating) && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-surface-container-lowest/80 backdrop-blur-md">
                <div className="w-full max-w-md bg-surface-container-high rounded-2xl overflow-hidden shadow-2xl border border-secondary/20" style={{ boxShadow: '0 0 20px rgba(248, 189, 69, 0.15)' }}>
                  {/* Header */}
                  <div className={`p-6 text-center ${
                    selected === correctIndex
                      ? 'bg-gradient-to-r from-secondary to-tertiary'
                      : selected !== null
                        ? 'bg-gradient-to-r from-error to-error/80'
                        : 'bg-surface-container-highest'
                  }`}>
                    <span className="material-symbols-outlined text-5xl mb-2" style={{
                      ...FILL_STYLE,
                      color: selected === correctIndex ? '#412d00' : selected !== null ? '#690005' : '#c7c5ce'
                    }}>
                      {selected === correctIndex ? 'workspace_premium' : selected !== null ? 'cancel' : 'timer_off'}
                    </span>
                    <h4 className={`text-2xl font-bold ${
                      selected === correctIndex ? 'text-on-secondary' : selected !== null ? 'text-on-error' : 'text-on-surface-variant'
                    }`}>
                      {selected === correctIndex ? 'CHÍNH XÁC!' : selected !== null ? 'SAI RỒI!' : 'HẾT GIỜ!'}
                    </h4>
                    <p className={`font-medium ${
                      selected === correctIndex ? 'text-on-secondary/80' : 'text-on-surface-variant'
                    }`}>
                      {selected === correctIndex ? '+50 Điểm Thưởng' : `Đáp án: ${question ? String.fromCharCode(65 + correctIndex) + '. ' + question.options[correctIndex] : ''}`}
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Explanation */}
                    {question?.explanation && (
                      <div className="p-4 bg-surface-container rounded-lg border-l-4 border-secondary">
                        <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Kiến thức bổ sung</p>
                        <p className="text-sm text-on-surface italic">{question.explanation}</p>
                      </div>
                    )}
                    {/* Rank */}
                    {scores.length > 0 && (
                      <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-on-secondary">
                            <span className="material-symbols-outlined">trending_up</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">Thứ hạng</p>
                            <p className="text-xs text-on-surface-variant">Vị trí hiện tại</p>
                          </div>
                        </div>
                        <span className="text-2xl font-black text-secondary">
                          #{(scores.findIndex(s => s.username === myUsername) + 1) || '—'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Spectator feedback */}
            {correctIndex !== null && (isSpectator || (isSuddenDeath && sdSpectating)) && (
              <div className="text-center text-sm">
                <span className="text-[#4a9eff] flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Xem thôi — bạn đang ở chế độ spectator
                </span>
              </div>
            )}

            {/* Perfect round banner */}
            {isTeamVsTeam && (perfectA || perfectB) && (
              <div className={`p-4 rounded-2xl border text-center font-bold text-sm animate-pulse ${
                (perfectA && myTeam === 'A') || (perfectB && myTeam === 'B')
                  ? 'border-secondary/30 bg-secondary/5 text-secondary'
                  : 'border-[#9b59b6]/30 bg-[#9b59b6]/5 text-[#9b59b6]'
              }`}>
                <span className="material-symbols-outlined text-sm mr-1" style={FILL_STYLE}>stars</span>
                Perfect Round! {perfectA ? 'Team A' : ''}{perfectA && perfectB ? ' & ' : ''}{perfectB ? 'Team B' : ''} +50 diem!
              </div>
            )}

            {/* Scoreboard overlay after round */}
            {correctIndex !== null && (
              <RoundScoreboard scores={scores} myUsername={myUsername} />
            )}
          </div>

          {/* ── Leaderboard / Side Panel ── */}
          <div className="bg-surface-container rounded-2xl border border-outline-variant/10 p-4 self-start lg:sticky lg:top-20">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#9b59b6] text-sm" style={FILL_STYLE}>
                {isBattleRoyale ? 'swords' :
                 isTeamVsTeam ? 'groups' :
                 isSuddenDeath ? 'local_fire_department' :
                 'leaderboard'}
              </span>
              {isBattleRoyale ? 'Nguoi con lai' :
               isTeamVsTeam ? 'Bang diem ca nhan' :
               isSuddenDeath ? 'Winning Streaks' :
               'Bang diem'}
            </div>
            <div className="space-y-1.5 max-h-[55vh] overflow-auto pr-1">
              {scores.length === 0 ? (
                <p className="text-on-surface-variant/50 text-xs text-center py-6">Chua co diem nao</p>
              ) : (
                scores.map((s, idx) => {
                  const isMe = s.username === myUsername;
                  const eliminated = s.playerStatus === 'ELIMINATED';
                  return (
                    <div
                      key={s.playerId}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                        isMe ? 'border-secondary/30 bg-secondary/5' :
                        eliminated ? 'border-transparent bg-surface-container-low opacity-40' :
                        idx === 0 ? 'border-secondary/15 bg-surface-container-low' :
                        'border-outline-variant/5 bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                          eliminated ? 'bg-surface-container-highest text-on-surface-variant' :
                          idx === 0 ? 'bg-secondary/15 text-secondary border border-secondary/20' :
                          'bg-surface-container-highest text-on-surface-variant'
                        }`}>
                          {eliminated ? (
                            <span className="material-symbols-outlined text-xs" style={FILL_STYLE}>skull</span>
                          ) : isSuddenDeath ? (
                            <span className="material-symbols-outlined text-xs text-[#ff8c42]" style={FILL_STYLE}>local_fire_department</span>
                          ) : idx + 1}
                        </div>
                        <div className={`text-sm font-medium truncate max-w-[80px] ${
                          isMe ? 'text-secondary' : eliminated ? 'text-on-surface-variant' : 'text-on-surface'
                        }`}>
                          {s.username}{isMe ? ' (ban)' : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-black ${eliminated ? 'text-on-surface-variant' : 'text-on-surface'}`}>{s.score}</div>
                        <div className="text-on-surface-variant/50 text-[10px] font-bold">{s.correctAnswers}/{s.totalAnswered}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoomQuiz;
