import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStomp } from '../hooks/useStomp';
import { useError } from '../contexts/ErrorContext';
import { api } from '../api/client';
import { soundManager } from '../services/soundManager';
import { haptic } from '../utils/haptics';
import ExplanationPanel from '../components/multiplayer/ExplanationPanel';
import ComboBanner from '../components/multiplayer/ComboBanner';
import QuizEndScreen from '../components/multiplayer/QuizEndScreen';
import RevealStatsCard from '../components/multiplayer/RevealStatsCard';
import ReactionBar from '../components/ReactionBar';
import LiveFeed from '../components/LiveFeed';
import { AnswerButton, type AnswerState } from '../components/quiz/AnswerButton';
import {
  EliminationScreen, TeamScoreBar, TeamWinScreen,
  MatchResultOverlay, SdArenaHeader, RoundScoreboard,
  type PlayerScore,
} from './room/RoomOverlays';
import SequentialFinalView from './room/SequentialFinalView';

type Question = { id: string; content: string; options: string[]; explanation?: string };

type EliminationToast = { id: number; username: string; rank: number };

interface RoomQuizLocationState {
  mode?: string;
  myTeam?: string;
  isHost?: boolean;
  hostId?: string;
  fromGroupId?: string;
}

interface PerPlayerAnswer {
  userId: string;
  username: string;
  answerIndex: number | null;
  isCorrect: boolean;
}

const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];
const FILL_STYLE = { fontVariationSettings: "'FILL' 1" } as const;

// ────────────────────── MAIN COMPONENT ──────────────────────

const RoomQuiz: React.FC = () => {
  const { t } = useTranslation();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as RoomQuizLocationState | null;
  const gameMode: string = state?.mode ?? 'SPEED_RACE';
  const myTeamFromState: string | null = state?.myTeam ?? null;

  const isBattleRoyale = gameMode === 'BATTLE_ROYALE';
  const isTeamVsTeam = gameMode === 'TEAM_VS_TEAM';
  const isSuddenDeath = gameMode === 'SUDDEN_DEATH';
  const isSequential = gameMode === 'GROUP_LIVE_SEQUENTIAL';
  const isHost: boolean = state?.isHost ?? false;

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

  // Group Live Sequential state (Feature A)
  const [seqAnswered, setSeqAnswered] = useState(0);
  const [seqTotal, setSeqTotal] = useState(0);
  const [revealedData, setRevealedData] = useState<{ correctIndex: number; explanation?: string; answers: PerPlayerAnswer[] } | null>(null);

  // Social fun state
  const [reactions, setReactions] = useState<Array<{ senderId: string; senderName: string; reaction: string }>>([]);
  const [latestAnswer, setLatestAnswer] = useState<{ playerId: string; username: string; isCorrect: boolean; reactionTimeMs: number } | null>(null);
  const myUserId = localStorage.getItem('userId') ?? '';

  // Sprint 2 S2-7: streak detection. consecutiveCorrect resets to 0 on
  // any wrong answer; we surface a banner at 5 and 10 with the matching
  // multiplier (FE-only — server scoring stays authoritative for points).
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [comboBanner, setComboBanner] = useState<{ count: number; multiplier: number } | null>(null);

  // Sprint 2 Q3 — reveal-stats card. Captures the player's reaction
  // time when they submit, then on ROUND_END computes the score delta
  // and rank shift to populate the 4-cell card.
  const [revealStats, setRevealStats] = useState<{
    reactionMs: number; pointsEarned: number; newRank: number; rankDelta: number;
  } | null>(null);
  const lastSubmitMs = useRef<number | null>(null);
  const prevScoreRef = useRef<number>(0);
  const prevRankRef = useRef<number | null>(null);

  // Sprint 2 Q1 — persistent live-feed sidebar. Each entry is one row
  // rendered in the RIGHT column; we keep the last 30 events so the
  // history scrolls without unbounded growth.
  type FeedEntry = {
    id: number;
    kind: 'answer' | 'round_end';
    text: string;
    tone: 'ok' | 'fail' | 'neutral';
  };
  const [feedHistory, setFeedHistory] = useState<FeedEntry[]>([]);
  const feedIdRef = useRef(0);
  const appendFeed = (kind: FeedEntry['kind'], text: string, tone: FeedEntry['tone']) => {
    feedIdRef.current += 1;
    setFeedHistory(prev => [
      ...prev.slice(-29),
      { id: feedIdRef.current, kind, text, tone },
    ]);
  };

  // C3: which usernames have submitted their answer for the current round.
  // Drives the mobile chip strip's ✓ vs pulse indicator and the bottom
  // waiting overlay. Cleared on QUESTION_START.
  const [roundAnswered, setRoundAnswered] = useState<Set<string>>(new Set());

  // Sprint 2 S2-11: end-screen sound. Fire once on showPodium=true. We
  // can't drive this from inside PodiumScreen because that component is
  // shared with multiple modes and wouldn't know `myUsername`.
  const endSoundFiredRef = useRef(false);
  // Sprint 2 S2-11: capture match start (first QUESTION_START with
  // questionIndex===0) so the end screen can show "Thời gian" stat.
  const matchStartedAtRef = useRef<number | null>(null);

  const questionStartedAt = useRef<number>(0);
  const toastCounter = useRef(0);
  const { showError } = useError();

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
          const data = msg.data as { questionIndex: number; totalQuestions: number; question: Question; timeLimit: number; startedAtMs?: number };
          // Sprint 2 S2-5: anchor the timer to the server's broadcast moment.
          // Falls back to local clock if BE didn't include startedAtMs (older
          // server / dev fixture).
          questionStartedAt.current = data.startedAtMs ?? Date.now();
          if (data.questionIndex === 0 && matchStartedAtRef.current === null) {
            matchStartedAtRef.current = questionStartedAt.current;
          }
          setQuestionIndex(data.questionIndex);
          setTotalQuestions(data.totalQuestions);
          setQuestion(data.question);
          setTimeLimit(data.timeLimit);
          const elapsedSec = (Date.now() - questionStartedAt.current) / 1000;
          setTimeLeft(Math.max(0, data.timeLimit - elapsedSec));
          setSelected(null);
          setCorrectIndex(null);
          setSubmitting(false);
          setPerfectA(false);
          setPerfectB(false);
          // Q3: reset reveal stats for the new question.
          setRevealStats(null);
          lastSubmitMs.current = null;
          // C3: reset answered tracker for the new round.
          setRoundAnswered(new Set());
          // Sequential reset
          setRevealedData(null);
          setSeqAnswered(0);
          break;
        }
        // ── Group Live Sequential (Feature A) ──
        case 'SEQUENTIAL_PROGRESS': {
          const d = msg.data as { answered: number; total: number };
          setSeqAnswered(d.answered);
          setSeqTotal(d.total);
          break;
        }
        case 'QUESTION_REVEALED': {
          const d = msg.data as {
            correctIndex: number;
            explanation?: string;
            answers: PerPlayerAnswer[];
            leaderboard: PlayerScore[];
          };
          setRevealedData({ correctIndex: d.correctIndex, explanation: d.explanation, answers: d.answers });
          setCorrectIndex(d.correctIndex);
          if (Array.isArray(d.leaderboard)) {
            setScores(d.leaderboard.sort((a, b) => b.score - a.score));
          }
          break;
        }
        case 'ROUND_END': {
          const d = msg.data as { correctIndex: number; leaderboard: PlayerScore[] };
          setCorrectIndex(d.correctIndex);
          const sortedNew = d.leaderboard.slice().sort((a, b) => b.score - a.score);
          setScores(sortedNew);
          // Q1: feed marker so the sidebar shows "Câu 5 kết thúc · đáp án C"
          const letter = String.fromCharCode(65 + d.correctIndex);
          appendFeed('round_end', `Câu ${questionIndex + 1} kết thúc · đáp án ${letter}`, 'neutral');
          // Q3: reveal-stats card (only when the player submitted).
          if (lastSubmitMs.current !== null) {
            const myNew = sortedNew.find(s => s.username === myUsername);
            const newRank = myNew ? sortedNew.findIndex(s => s.username === myUsername) + 1 : 0;
            const newScore = myNew?.score ?? prevScoreRef.current;
            const pointsEarned = Math.max(0, newScore - prevScoreRef.current);
            const rankDelta = prevRankRef.current ? prevRankRef.current - newRank : 0;
            setRevealStats({
              reactionMs: lastSubmitMs.current,
              pointsEarned,
              newRank,
              rankDelta,
            });
          }
          // Sprint 2 S2-6: reveal feedback. Compare against the player's
          // submitted answer (selected) to play the right sound + haptic.
          // We deliberately key off `selected` rather than backend
          // per-player data since the lightweight ROUND_END payload
          // doesn't carry it for Speed Race.
          if (selected !== null) {
            const wasCorrect = selected === d.correctIndex;
            soundManager.play(wasCorrect ? 'correctAnswer' : 'wrongAnswer');
            wasCorrect ? haptic.correct() : haptic.wrong();
            // Sprint 2 S2-7: streak detection. Bumps fire the combo
            // banner at 5 and 10 with their respective multipliers.
            // Order: compute next then act so the banner sees the
            // post-increment count.
            if (wasCorrect) {
              setConsecutiveCorrect(prev => {
                const next = prev + 1;
                if (next === 5) {
                  setComboBanner({ count: 5, multiplier: 1.2 });
                  soundManager.play('combo5');
                  haptic.combo();
                } else if (next === 10) {
                  setComboBanner({ count: 10, multiplier: 1.5 });
                  soundManager.play('combo10');
                  haptic.combo();
                }
                return next;
              });
            } else {
              setConsecutiveCorrect(0);
            }
          }
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

        // ── Social Fun ──
        case 'REACTION': {
          const d = msg.data as { senderId: string; senderName: string; reaction: string };
          setReactions(prev => [...prev, d]);
          break;
        }
        case 'ANSWER_SUBMITTED': {
          const d = msg.data as { playerId: string; username: string; isCorrect: boolean; reactionTimeMs: number };
          setLatestAnswer(d);
          // C3: mark this player as having answered this round.
          setRoundAnswered(prev => {
            const next = new Set(prev);
            next.add(d.username);
            return next;
          });
          // Q1: persistent feed history for the new RIGHT column
          const t = (d.reactionTimeMs / 1000).toFixed(1);
          appendFeed(
            'answer',
            d.isCorrect
              ? `${d.username} trả lời đúng (${t}s)`
              : `${d.username} trả lời sai 😅`,
            d.isCorrect ? 'ok' : 'fail'
          );
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
        case 'ROOM_ENDED': {
          // SPEC §5.4.0 R5 — backend recovered a stuck game or otherwise
          // ended the room out from under us. Bail to /multiplayer with the
          // reason so it can be toasted there.
          const d = msg.data as { reason?: string } | undefined;
          navigate('/multiplayer', { replace: true, state: { roomEndedReason: d?.reason ?? 'GENERIC' } });
          break;
        }
        case 'HOST_CHANGED': {
          // SPEC §5.4.0 R4 — host promoted mid-game. We don't store
          // host details locally on this page; just log so dev tools can
          // verify the broadcast made it.
          break;
        }
      }
    },
  });

  // Sprint 2 S2-5: server-anchored countdown. Recompute remaining from
  // questionStartedAt every tick instead of decrementing locally — drift,
  // tab-throttled timers, and late-join all stay in sync.
  useEffect(() => {
    if (!timeLimit) return;
    if (timeLeft <= 0) return;
    const tick = () => {
      const elapsedSec = (Date.now() - questionStartedAt.current) / 1000;
      const remaining = Math.max(0, timeLimit - elapsedSec);
      setTimeLeft(remaining);
    };
    const t = setInterval(tick, 250); // 4Hz: smooth seconds digit + low cost
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLimit, questionIndex]);

  // Sprint 2 S2-11: end-of-match sound — victory if I won, complete
  // otherwise. Once-only; the ref guards against re-fires from
  // showPodium toggling.
  useEffect(() => {
    if (!showPodium || endSoundFiredRef.current) return;
    endSoundFiredRef.current = true;
    const me = finalResults.find(r => r.username === myUsername);
    const won = !!me && me.finalRank === 1;
    soundManager.play(won ? 'victory' : 'quizComplete');
  }, [showPodium, finalResults, myUsername]);

  // Sprint 2 S2-5: per-second beep in the last 5 seconds, sharper at ≤3.
  // Tracks the last whole-second-played so a 4Hz tick doesn't spam.
  const lastTickSecond = useRef<number>(-1);
  useEffect(() => {
    const sec = Math.ceil(timeLeft);
    if (sec === lastTickSecond.current) return;
    lastTickSecond.current = sec;
    if (sec > 0 && sec <= 5 && selected === null) {
      soundManager.play(sec <= 3 ? 'timerWarning' : 'timerTick');
    }
  }, [timeLeft, selected]);

  // Mount-time rehydrate. Two cases:
  //   1) Room is IN_PROGRESS — pull the cached current question so the
  //      view doesn't sit on "Đang chờ câu hỏi..." until the next
  //      QUESTION_START broadcast.
  //   2) Room is ENDED — pull the leaderboard and seed showPodium so a
  //      reload on the end screen still shows results (without this the
  //      user falls back to "Đang chờ câu hỏi..." waiting on a QUIZ_END
  //      that already fired before mount).
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    (async () => {
      try {
        const roomRes = await api.get(`/api/rooms/${roomId}`);
        if (cancelled) return;
        const status = roomRes.data?.room?.status;
        if (status === 'ENDED') {
          const lbRes = await api.get(`/api/rooms/${roomId}/leaderboard`);
          if (cancelled) return;
          const board = lbRes.data?.leaderboard as PlayerScore[] | undefined;
          if (Array.isArray(board) && board.length > 0) {
            const sorted = board.slice().sort((a, b) =>
              (a.finalRank ?? 99) - (b.finalRank ?? 99) || b.score - a.score
            );
            setFinalResults(sorted);
            setScores(sorted);
            setTotalQuestions(roomRes.data.room.questionCount ?? totalQuestions);
            setShowPodium(true);
          }
          return; // no point hitting current-question for an ENDED room
        }
      } catch { /* fall through to current-question fetch */ }

      try {
        const res = await api.get(`/api/rooms/${roomId}/current-question`);
        if (cancelled || res.status !== 200 || !res.data?.question) return;
        const data = res.data.question as { questionIndex: number; totalQuestions: number; question: Question; timeLimit: number; startedAtMs?: number };
        // Sprint 2 S2-5: prefer the cached server timestamp so the
        // remaining-seconds figure reflects how much of this question is
        // actually left, not a fresh full window.
        questionStartedAt.current = data.startedAtMs ?? Date.now();
        setQuestionIndex(data.questionIndex);
        setTotalQuestions(data.totalQuestions);
        setQuestion(data.question);
        setTimeLimit(data.timeLimit);
        const elapsedSec = (Date.now() - questionStartedAt.current) / 1000;
        setTimeLeft(Math.max(0, data.timeLimit - elapsedSec));
      } catch { /* 204/error: keep waiting for QUESTION_START */ }
    })();
    return () => { cancelled = true; };
  }, [roomId]);

  const inSdMatch = isSuddenDeath && (sdChampionName === myUsername || sdChallengerName === myUsername);
  const canAnswer = useMemo(
    () => connected && question && timeLeft > 0 && selected === null && !submitting
      && !isEliminated && !(isSuddenDeath && sdSpectating) && !revealedData,
    [connected, question, timeLeft, selected, submitting, isEliminated, isSuddenDeath, sdSpectating, revealedData]
  );

  const handleAdvance = () => {
    if (!roomId || !isHost || !isSequential) return;
    const ok = send(`/app/room/${roomId}/advance`, {});
    if (!ok) showError(t('room.quiz.networkUnstable', 'Mất kết nối, đang kết nối lại — thử lại sau giây lát'), 'warning');
  };

  const submitAnswer = (idx: number) => {
    if (!roomId || !question || !canAnswer) return;
    const reactionTimeMs = Date.now() - questionStartedAt.current;
    lastSubmitMs.current = reactionTimeMs;
    // Snapshot pre-round score + rank so ROUND_END can compute deltas.
    const sortedNow = [...scores].sort((a, b) => b.score - a.score);
    const myEntry = sortedNow.find(s => s.username === myUsername);
    prevScoreRef.current = myEntry?.score ?? 0;
    prevRankRef.current = myEntry ? sortedNow.findIndex(s => s.username === myUsername) + 1 : null;
    setSelected(idx);
    setSubmitting(true);
    // C3: mark myself as answered locally — server's broadcast back to me
    // would re-set this but we can't rely on the round-trip.
    setRoundAnswered(prev => {
      const next = new Set(prev);
      next.add(myUsername);
      return next;
    });
    const ok = send(`/app/room/${roomId}/answer`, { questionIndex, answerIndex: idx, reactionTimeMs });
    if (!ok) {
      // WS disconnected — revert optimistic state so user can retry once
      // reconnect succeeds (otherwise selected !== null blocks resubmit).
      setSelected(null);
      setSubmitting(false);
      showError(t('room.quiz.networkUnstable', 'Mất kết nối, đang kết nối lại — chọn lại đáp án sau giây lát'), 'warning');
      return;
    }
    setTimeout(() => setSubmitting(false), 500);
  };

  const timerPercent = timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 0;

  // Map RoomQuiz state → AnswerButton state (per-position color via component).
  // Preserves the prior visual semantics (correct=green, wrong=red, selected
  // pre-reveal, faded for cannot-interact) but adds the 4-position colour
  // mapping (Coral/Sky/Gold/Sage) shared with single-player Quiz.
  const buildAnswerState = (i: number): AnswerState => {
    if (correctIndex !== null) {
      if (i === correctIndex) return 'correct';
      if (i === selected) return 'wrong';
      return 'disabled';
    }
    if (selected === i) return 'selected';
    if ((isEliminated && !isSpectator) || (isSuddenDeath && sdSpectating)) return 'disabled';
    return 'default';
  };

  // ── Overlays ──
  if (showPodium) {
    const exitTo = state?.fromGroupId ? `/groups/${state.fromGroupId}` : '/multiplayer';
    if (isSequential) {
      return (
        <SequentialFinalView
          roomName={`Quiz ${roomId?.slice(-4) ?? ''}`}
          results={finalResults}
          myUsername={myUsername}
          isHost={isHost}
          totalQuestions={totalQuestions}
          onClose={() => navigate(exitTo, { replace: true })}
          onCreateNew={() => navigate(exitTo, { replace: true })}
        />
      );
    }
    return (
      <QuizEndScreen
        results={finalResults}
        myUsername={myUsername}
        isHost={isHost}
        totalQuestions={totalQuestions}
        startedAtMs={matchStartedAtRef.current}
        onReplay={() => navigate(exitTo, { replace: true })}
        onClose={() => navigate(exitTo, { replace: true })}
        onShare={() => navigate(exitTo, { replace: true })}
        onNewRoom={() => navigate('/room/create', { replace: true })}
        onHome={() => navigate('/', { replace: true })}
        onAnalytics={() => navigate(`/room/${roomId}/analytics`)}
      />
    );
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

      {/* Social Fun: Live Feed + Reactions */}
      <LiveFeed incoming={latestAnswer} myId={myUserId} />
      <ReactionBar
        onSend={(emoji) => send(`/app/room/${roomId}/reaction`, { reaction: emoji })}
        incoming={reactions.length > 0 ? reactions : null}
      />

      {/* C3: Mobile waiting overlay — fixed-bottom card when the player
          has submitted but the round hasn't resolved yet. Lists who's
          still choosing. Hidden on lg+ (desktop has the live-feed
          sidebar). */}
      {!isSequential && selected !== null && correctIndex === null && scores.length > 1 && (() => {
        const pending = scores
          .filter(s => s.username !== myUsername && !roundAnswered.has(s.username))
          .slice(0, 5);
        if (pending.length === 0) return null;
        return (
          <div
            data-testid="quiz-mobile-waiting"
            className="lg:hidden fixed left-0 right-0 bottom-0 px-4 pb-4 z-40"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{
                background: 'rgba(50,52,64,0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 -8px 30px rgba(0,0,0,0.4)',
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex-shrink-0"
                style={{
                  border: '2px solid #e8a832',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.9s linear infinite',
                }}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  Đang chờ {pending.length} người nữa...
                </div>
                <div className="text-xs truncate" style={{ color: '#9ca3af' }}>
                  {pending.map(p => p.username).join(', ')} đang chọn
                </div>
              </div>
              <div className="flex items-center flex-shrink-0">
                {pending.map((p, i) => (
                  <div
                    key={p.playerId}
                    className="grid place-items-center rounded-full text-[10px] font-bold flex-shrink-0"
                    style={{
                      width: 24, height: 24,
                      marginLeft: i === 0 ? 0 : -4,
                      background: i % 2 === 0
                        ? 'linear-gradient(135deg, #4ade80 0%, #047857 100%)'
                        : 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
                      color: '#fff',
                      border: '2px solid #11131e',
                      zIndex: pending.length - i,
                    }}
                  >
                    {(p.username?.[0] ?? '?').toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reconnecting banner */}
      {reconnecting && (
        <div className="fixed top-0 inset-x-0 z-50 px-4 py-2.5 bg-secondary-container/90 border-b border-secondary/30 text-on-surface text-sm text-center animate-pulse flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-secondary text-sm animate-spin">sync</span>
          {t('room.reconnecting')}
        </div>
      )}

      {/* Sprint 2 S2-7: combo streak banner */}
      {comboBanner && (
        <ComboBanner
          count={comboBanner.count}
          multiplier={comboBanner.multiplier}
          onDismiss={() => setComboBanner(null)}
        />
      )}

      {/* Elimination toasts (Battle Royale) */}
      {isBattleRoyale && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 space-y-2 w-72">
          {toasts.map(toast => (
            <div key={toast.id} className="glass-card border border-error/20 text-error text-sm px-4 py-2.5 rounded-xl shadow-lg animate-pulse text-center flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm" style={FILL_STYLE}>person_remove</span>
              <b>{toast.username}</b> {t('room.quiz.eliminatedSuffix', { rank: toast.rank })}
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

      {/* ═══════════ HEADER BAR (Q2: mockup state ③/④) ═══════════ */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-low/90 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          {/* Left: mode chip + "Câu N/M" + progress bar */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]' : 'bg-error shadow-[0_0_6px_rgba(255,180,171,0.4)]'}`} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.1em] flex-shrink-0"
              style={{ color: '#9b59b6' }}
            >
              {gameMode.replace(/_/g, ' ')}
            </span>
            <div className="hidden sm:block h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-sm font-bold text-on-surface flex-shrink-0">
              {t('room.quiz.questionProgress', { current: questionIndex + 1, total: totalQuestions || '?' })}
            </span>
            {totalQuestions > 0 && (
              <div
                className="hidden sm:block w-32 lg:w-48 h-1.5 rounded-full overflow-hidden flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                aria-label="Tiến độ câu hỏi"
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
                    background: 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Right: status pill (after reveal) + per-mode badges + timer ring */}
          <div className="flex items-center gap-3">
            {/* Reveal pill — green ✓ ĐÚNG! / red ✗ SAI */}
            {correctIndex !== null && selected !== null && (
              <div
                data-testid="quiz-reveal-pill"
                className="px-3 lg:px-4 py-1.5 rounded-full font-extrabold text-white text-xs lg:text-sm"
                style={{
                  background: selected === correctIndex
                    ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                    : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  boxShadow: selected === correctIndex
                    ? '0 0 24px rgba(74,222,128,0.4)'
                    : '0 0 24px rgba(239,68,68,0.4)',
                }}
              >
                {selected === correctIndex ? '✓ ĐÚNG!' : '✗ SAI'}
              </div>
            )}

            {isBattleRoyale && activeCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-error/10 px-2.5 py-1 rounded-full border border-error/20">
                <span className="material-symbols-outlined text-error text-sm" style={FILL_STYLE}>group</span>
                <span className="text-error text-[10px] font-black">{activeCount}/{totalCount}</span>
              </div>
            )}
            {isSpectator && (
              <div className="hidden sm:flex items-center gap-1 bg-surface-container-high px-2.5 py-1 rounded-full border border-outline-variant/10">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">visibility</span>
                <span className="text-on-surface-variant text-[10px] font-bold">{t('room.quiz.spectator')}</span>
              </div>
            )}
            {isSuddenDeath && sdSpectating && (
              <div className="hidden sm:flex items-center gap-1 bg-[#ff8c42]/10 px-2.5 py-1 rounded-full border border-[#ff8c42]/20">
                <span className="material-symbols-outlined text-[#ff8c42] text-sm">visibility</span>
                <span className="text-[#ff8c42] text-[10px] font-bold">{t('room.quiz.sdSpectating')}</span>
              </div>
            )}
            {isTeamVsTeam && myTeam && (
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
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

            {/* Timer ring — bigger to match mockup w-12 h-12 */}
            <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
              <svg className="timer-svg w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24" cy="24" r="20"
                  fill="none" strokeWidth="4"
                  stroke="rgba(255,255,255,0.08)"
                />
                <circle
                  cx="24" cy="24" r="20"
                  fill="none" strokeWidth="4"
                  strokeLinecap="round"
                  stroke={timeLeft <= 5 ? '#ef4444' : '#e8a832'}
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (timerPercent / 100) * 125.6}
                  style={{ transition: 'stroke-dashoffset 250ms linear' }}
                />
              </svg>
              <span
                className={`absolute font-bold text-base ${timeLeft <= 5 ? 'animate-pulse' : ''}`}
                style={{ color: timeLeft <= 5 ? '#ef4444' : '#fff' }}
              >
                {Math.ceil(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Timer progress bar (mobile only) */}
        <div className="h-1 bg-surface-container-highest md:hidden">
          <div
            className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-error' : 'bg-gradient-to-r from-secondary to-tertiary'}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
      </header>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      {/* Q1: 3-col gameplay layout per MOCKUP_DESKTOP_MULTIPLAYER state ③/④:
           LEFT 280px scoreboard · CENTER 1fr question+stats · RIGHT 320px live feed.
           Drops max-w-6xl so all three columns can fit on lg+ viewports;
           mobile (< lg) collapses to a single column with the side panels
           hidden (player list still rendered above question via mode bars). */}
      <main className="relative min-h-screen pt-20 pb-8 px-4 lg:px-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-5">
          {/* ── LEFT: Scoreboard (lg only — same content as the trailing
                mobile block; on lg+ it's a sticky sidebar) ── */}
          <aside
            className="hidden lg:block self-start lg:sticky lg:top-20 bg-surface-container rounded-2xl border border-outline-variant/10 p-4"
            data-testid="quiz-scoreboard-left"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#9b59b6] text-sm" style={FILL_STYLE}>
                {isBattleRoyale ? 'swords' :
                 isTeamVsTeam ? 'groups' :
                 isSuddenDeath ? 'local_fire_department' :
                 'leaderboard'}
              </span>
              {isBattleRoyale ? t('room.quiz.leaderboardBattleRoyale') :
               isTeamVsTeam ? t('room.quiz.leaderboardTeam') :
               isSuddenDeath ? t('room.quiz.leaderboardSuddenDeath') :
               t('room.quiz.leaderboardDefault')}
            </div>
            <div className="space-y-1.5 max-h-[60vh] overflow-auto pr-1">
              {scores.length === 0 ? (
                <p className="text-on-surface-variant/50 text-xs text-center py-6">{t('room.quiz.noScoresYet')}</p>
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
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
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
                        <div className={`text-sm font-medium truncate ${
                          isMe ? 'text-secondary' : eliminated ? 'text-on-surface-variant' : 'text-on-surface'
                        }`}>
                          {s.username}{isMe ? t('room.quiz.youSuffix') : ''}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-sm font-black ${eliminated ? 'text-on-surface-variant' : 'text-on-surface'}`}>{s.score}</div>
                        <div className="text-on-surface-variant/50 text-[10px] font-bold">{s.correctAnswers}/{s.totalAnswered}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── Question + Answers area ── */}
          <div className="space-y-6">
            {/* C3: Mobile-only scoreboard chip strip — horizontal scroll
                bar of player score pills with ✓ (answered) or pulse
                (still choosing) indicator. Hidden on lg+ where the
                LEFT scoreboard sidebar covers the same info. */}
            {!isSequential && scores.length > 0 && (
              <div className="lg:hidden -mx-4 px-4 pb-1 overflow-x-auto" data-testid="quiz-mobile-chip-strip">
                <div className="flex items-center gap-2 w-max">
                  {scores.map((s, idx) => {
                    const isMe = s.username === myUsername;
                    const answered = roundAnswered.has(s.username);
                    const initial = (s.username?.[0] ?? '?').toUpperCase();
                    return (
                      <div
                        key={s.playerId}
                        className="rounded-full px-2.5 py-1.5 flex items-center gap-1.5 flex-shrink-0"
                        style={{
                          background: 'rgba(50,52,64,0.55)',
                          backdropFilter: 'blur(12px)',
                          border: isMe ? '1.5px solid rgba(232,168,50,0.5)' : '1px solid rgba(255,255,255,0.06)',
                          opacity: !answered && !isMe ? 0.7 : 1,
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold"
                          style={{
                            background: isMe
                              ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
                              : idx === 0
                              ? 'linear-gradient(135deg, #4ade80 0%, #047857 100%)'
                              : 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
                            color: isMe ? '#11131e' : '#fff',
                          }}
                        >
                          {initial}
                        </div>
                        <span className="text-xs font-semibold text-white tabular-nums">{s.score}</span>
                        {answered ? (
                          <span className="text-[10px]" style={{ color: '#4ade80' }}>✓</span>
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ background: '#fbbf24' }}
                            aria-label="Đang chọn"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sequential mode top-bar (mockup feature_A tab 2) */}
            {isSequential ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-[1px]" style={{ color: '#a78bfa' }}>
                      CÂU {questionIndex + 1} / {totalQuestions || '?'}
                    </div>
                    <div className="text-[12px] text-on-surface/85 font-semibold mt-0.5">
                      {scores.length > 0
                        ? `${scores.length}/${scores.length} đang chơi`
                        : t('room.quiz.waitingQuestion')}
                    </div>
                  </div>
                  <div className="relative w-[38px] h-[38px] flex-shrink-0">
                    <svg viewBox="0 0 38 38" className="w-full h-full -rotate-90">
                      <circle cx="19" cy="19" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                      <circle cx="19" cy="19" r="16" fill="none" stroke="#e8a832" strokeWidth="4" strokeLinecap="round"
                        strokeDasharray="113" strokeDashoffset={113 * (1 - timerPercent / 100)} />
                    </svg>
                    <div className="absolute inset-0 grid place-items-center text-[12px] font-extrabold tabular-nums" style={{ color: '#e8a832' }}>
                      {timeLeft}
                    </div>
                  </div>
                </div>
                {/* Purple progress bar */}
                <div className="h-1 rounded-full overflow-hidden mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${totalQuestions > 0 ? ((questionIndex + 1) / totalQuestions) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #a78bfa 0%, #c084fc 100%)',
                  }} />
                </div>
                {/* Question box centered (mockup style) */}
                <div className="rounded-xl px-4 py-5 mb-4 text-center"
                  style={{ background: 'rgba(17,19,30,0.5)', border: '1px solid rgba(232,168,50,0.1)' }}>
                  <div className="text-[16px] md:text-[18px] font-semibold leading-snug">
                    {question?.content || t('room.quiz.waitingQuestion')}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Mobile round counter (non-sequential modes) */}
                <div className="flex items-center justify-between md:hidden">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-sm" style={FILL_STYLE}>quiz</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
                      {t('room.quiz.questionProgress', { current: questionIndex + 1, total: totalQuestions || '?' })}
                    </span>
                  </div>
                  {scores.length > 0 && (
                    <div className="text-[10px] font-bold text-on-surface-variant">
                      {t('room.quiz.points', { count: scores.find(s => s.username === myUsername)?.score ?? 0 })}
                    </div>
                  )}
                </div>

                {/* Question Card (Stitch design — non-sequential modes) */}
                <div className="relative w-full flex flex-col items-center justify-center text-center p-8 md:p-10 bg-surface-container-low rounded-[2rem] border border-outline-variant/10 shadow-2xl overflow-hidden min-h-[140px]">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-24 bg-secondary rounded-r-full" />
                  <h2 className="font-headline text-xl md:text-3xl font-extrabold tracking-tight leading-snug max-w-3xl text-on-surface">
                    {question?.content || t('room.quiz.waitingQuestion')}
                  </h2>
                </div>
              </>
            )}

            {/* Answer Grid — 2x2. AnswerButton handles per-position colour
                (A=Coral, B=Sky, C=Gold, D=Sage) + state visuals + icons. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(question?.options ?? []).map((opt, i) => (
                <AnswerButton
                  key={i}
                  index={i as 0 | 1 | 2 | 3}
                  letter={ANSWER_LETTERS[i] as 'A' | 'B' | 'C' | 'D'}
                  text={opt}
                  state={buildAnswerState(i)}
                  onClick={() => submitAnswer(i)}
                  testId={`room-quiz-answer-${i}`}
                />
              ))}
            </div>

            {/* Feedback */}
            {selected !== null && correctIndex === null && !isSpectator && !(isSuddenDeath && sdSpectating) && !isSequential && (
              <div className="text-center text-on-surface-variant text-sm animate-pulse flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm animate-spin">hourglass_empty</span>
                {t('room.quiz.waitingResult')}
              </div>
            )}

            {/* Q3: reveal stats card — shown after the round resolves
                if the player submitted (no card for skipped rounds or
                spectators). Sequential mode has its own reveal flow,
                so we suppress there. */}
            {revealStats && correctIndex !== null && !isSequential && (
              <RevealStatsCard
                reactionMs={revealStats.reactionMs}
                pointsEarned={revealStats.pointsEarned}
                newRank={revealStats.newRank}
                rankDelta={revealStats.rankDelta}
                timeLimitSec={timeLimit}
              />
            )}

            {/* Sprint 2 S2-6: explanation panel after a wrong answer. Only
                renders when (a) the round is revealed (correctIndex set),
                (b) the player picked an answer different from the correct
                one, and (c) the question carries an explanation. The panel
                doesn't gate the next question — server timing does. */}
            {correctIndex !== null && selected !== null && selected !== correctIndex
              && question?.explanation && question?.id && !isSequential && (
              <ExplanationPanel
                questionId={question.id}
                explanation={question.explanation}
                onContinue={() => { /* next QUESTION_START will replace */ }}
              />
            )}

            {/* ─── Sequential Mode: Waiting Strip (after submit, before reveal) ─── */}
            {isSequential && selected !== null && !revealedData && (
              <div
                data-testid="sequential-waiting-strip"
                className="rounded-xl px-4 py-3.5 flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.1) 0%, rgba(50,52,64,0.4) 60%)',
                  border: '1px solid rgba(167,139,250,0.25)',
                }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}
                >
                  <span className="material-symbols-outlined text-[18px] animate-pulse" style={{ color: '#a78bfa' }}>
                    hourglass_empty
                  </span>
                </div>
                <div className="flex-1 text-on-surface text-[12px] font-medium leading-snug">
                  <strong style={{ color: '#c4b5fd' }}>
                    {t('room.quiz.sequentialWaiting', { remaining: Math.max(0, seqTotal - seqAnswered) })}
                  </strong>
                  {' '}{t('room.quiz.sequentialWaitingDesc')}
                  <div className="flex gap-1 mt-1.5">
                    {Array.from({ length: seqTotal }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: i < seqAnswered
                            ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                            : 'rgba(167,139,250,0.3)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Sequential Mode: Reveal Panel + Leader Advance ─── */}
            {isSequential && revealedData && (
              <div
                data-testid="sequential-reveal-panel"
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: 'rgba(50,52,64,0.6)',
                  border: '1px solid rgba(232,168,50,0.25)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-secondary" style={FILL_STYLE}>
                    check_circle
                  </span>
                  <span className="text-on-surface font-bold text-[14px]">
                    {t('room.quiz.sequentialAnswerIs', { letter: ANSWER_LETTERS[revealedData.correctIndex] })}
                  </span>
                </div>
                {revealedData.explanation && (
                  <p className="text-on-surface-variant text-[12px] leading-relaxed">
                    {revealedData.explanation}
                  </p>
                )}
                {/* Per-player answers */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5">
                  {revealedData.answers.map(a => (
                    <div
                      key={a.userId}
                      className={`px-2 py-1.5 rounded-md text-[11px] flex items-center justify-between gap-1 ${
                        a.isCorrect
                          ? 'bg-green-500/10 border border-green-500/20'
                          : a.answerIndex === null
                            ? 'bg-white/5 border border-white/10'
                            : 'bg-error/10 border border-error/20'
                      }`}
                    >
                      <span className="truncate text-on-surface/90 font-medium">{a.username}</span>
                      <span className={`flex-shrink-0 font-bold ${a.isCorrect ? 'text-green-400' : a.answerIndex === null ? 'text-on-surface/40' : 'text-error'}`}>
                        {a.answerIndex === null ? '—' : ANSWER_LETTERS[a.answerIndex]}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Leader advance button or member waiting hint.
                    The reveal panel only renders after BE has decided the round
                    is over (all-answered OR question timeout), so the host can
                    always advance from here — no need to gate on seqAnswered. */}
                <div className="pt-2 border-t border-white/5">
                  {isHost ? (
                    <button
                      data-testid="sequential-advance-btn"
                      onClick={handleAdvance}
                      className="w-full py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110"
                      style={{
                        background: 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)',
                        color: '#11131e',
                        boxShadow: '0 6px 20px rgba(232,168,50,0.3)',
                      }}
                    >
                      {t('room.quiz.sequentialAdvance')}
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  ) : (
                    <div className="text-center text-on-surface-variant text-[12px] py-2 flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[14px] animate-pulse">hourglass_empty</span>
                      {t('room.quiz.sequentialWaitingForLeader')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Result Popup Overlay (Stitch design) — non-sequential modes only */}
            {!isSequential && correctIndex !== null && !isSpectator && !(isSuddenDeath && sdSpectating) && (
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
                      {selected === correctIndex
                        ? t('room.quiz.correctFeedback')
                        : selected !== null
                          ? t('room.quiz.wrongFeedback')
                          : t('room.quiz.timeoutFeedback')}
                    </h4>
                    <p className={`font-medium ${
                      selected === correctIndex ? 'text-on-secondary/80' : 'text-on-surface-variant'
                    }`}>
                      {selected === correctIndex
                        ? t('room.quiz.bonusPoints')
                        : t('room.quiz.correctAnswerLine', {
                            letter: String.fromCharCode(65 + correctIndex),
                            text: question?.options[correctIndex] ?? ''
                          })}
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Explanation */}
                    {question?.explanation && (
                      <div className="p-4 bg-surface-container rounded-lg border-l-4 border-secondary">
                        <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">{t('room.quiz.explanationLabel')}</p>
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
                            <p className="text-sm font-bold text-on-surface">{t('room.quiz.rankLabel')}</p>
                            <p className="text-xs text-on-surface-variant">{t('room.quiz.rankSubtitle')}</p>
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
                  {t('room.quiz.spectatorNote')}
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

          {/* ── RIGHT (lg+): Live feed sidebar matching mockup state ③/④ ── */}
          <aside
            className="hidden lg:flex flex-col self-start lg:sticky lg:top-20 bg-surface-container rounded-2xl border border-outline-variant/10 overflow-hidden"
            data-testid="quiz-live-feed"
            style={{ maxHeight: 'calc(100vh - 6rem)' }}
          >
            <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center gap-2">
              <span className="text-sm" aria-hidden="true">📢</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Live feed
              </span>
            </div>
            <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto">
              {feedHistory.length === 0 ? (
                <p className="text-on-surface-variant/50 text-xs italic text-center py-4">
                  Đang chờ hoạt động đầu tiên...
                </p>
              ) : (
                feedHistory.map(e => (
                  <div
                    key={e.id}
                    className="text-xs"
                    style={{
                      color:
                        e.tone === 'ok' ? 'rgba(74,222,128,0.85)' :
                        e.tone === 'fail' ? 'rgba(248,113,113,0.85)' :
                        'rgba(156,163,175,0.7)',
                      fontStyle: e.kind === 'round_end' ? 'italic' : 'normal',
                    }}
                  >
                    {e.text}
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* ── Leaderboard / Side Panel (mobile only — desktop uses LEFT) ── */}
          <div className="lg:hidden bg-surface-container rounded-2xl border border-outline-variant/10 p-4 self-start">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#9b59b6] text-sm" style={FILL_STYLE}>
                {isBattleRoyale ? 'swords' :
                 isTeamVsTeam ? 'groups' :
                 isSuddenDeath ? 'local_fire_department' :
                 'leaderboard'}
              </span>
              {isBattleRoyale ? t('room.quiz.leaderboardBattleRoyale') :
               isTeamVsTeam ? t('room.quiz.leaderboardTeam') :
               isSuddenDeath ? t('room.quiz.leaderboardSuddenDeath') :
               t('room.quiz.leaderboardDefault')}
            </div>
            <div className="space-y-1.5 max-h-[55vh] overflow-auto pr-1">
              {scores.length === 0 ? (
                <p className="text-on-surface-variant/50 text-xs text-center py-6">{t('room.quiz.noScoresYet')}</p>
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
                          {s.username}{isMe ? t('room.quiz.youSuffix') : ''}
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
