import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchCurrentQuestion, useRoomChannel } from '../../hooks/useRoomChannel';
import { api } from '../../api/client';
import { PodiumBlock } from './RoomOverlays';
import type { QuestionStartData, RoomEvent, RoomQuestion } from '../../types/room';

/**
 * Sprint 4 (S4-8) — Quản trò spectator + 4 controls.
 *
 * Lives at /room/:roomId/host. Mounted only when the lobby decides the
 * viewer is a Quản trò (host && !room.hostPlaysGame). Players continue
 * to land on the existing /room/:roomId/quiz page.
 *
 * Why a separate page instead of a flag inside RoomQuiz: the host UI
 * differs in non-trivial ways (correct-answer revealed real-time, no
 * answer buttons, live-answer status grid, control bar), and dragging
 * those branches into the 1400-line player page would make both
 * harder to read and test. Sharing happens at the WS event-handling
 * layer only.
 */

type Question = RoomQuestion;
type AnswerStatus = 'pending' | 'correct' | 'wrong';
type LiveAnswer = {
  userId: string;
  username: string;
  status: AnswerStatus;
  reactionTimeMs?: number;
};
type ScoreRow = { userId: string; username: string; score: number };

interface NavState {
  hostId?: string;
  hostName?: string;
  mode?: string;
  fromGroupId?: string;
}

interface FinalRanking {
  playerId?: string;
  username?: string;
  score?: number;
  correctAnswers?: number;
  totalAnswered?: number;
}

// QTR-1 — C5 answer palette (A=Coral, B=Sky, C=Gold, D=Sage). Literal class
// strings per position because Tailwind JIT cannot expand template strings;
// mirrors components/quiz/AnswerButton.tsx COLORS (host tiles are read-only,
// so only the default tile + letter variants are needed here).
const HOST_OPTION_STYLES = [
  { tile: 'border-answer-a/30 bg-answer-a/10', letter: 'bg-answer-a/20 text-answer-a' },
  { tile: 'border-answer-b/30 bg-answer-b/10', letter: 'bg-answer-b/20 text-answer-b' },
  { tile: 'border-answer-c/30 bg-answer-c/10', letter: 'bg-answer-c/20 text-answer-c' },
  { tile: 'border-answer-d/30 bg-answer-d/10', letter: 'bg-answer-d/20 text-answer-d' },
] as const;

// Rank accent colors for top-3 rows (gold / silver / bronze) — same values
// already used across the room end screens.
const RANK_ACCENTS = ['#e8a832', '#d1d5db', '#cd7f32'] as const;

const RoomQuizHost: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state ?? {}) as NavState;

  const [question, setQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(30);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);

  const [liveAnswers, setLiveAnswers] = useState<Record<string, LiveAnswer>>({});
  const [scores, setScores] = useState<ScoreRow[]>([]);

  const [isPaused, setIsPaused] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [skippedToast, setSkippedToast] = useState(false);
  const [finalRanks, setFinalRanks] = useState<FinalRanking[] | null>(null);
  const [matchStartedAt] = useState(() => Date.now());

  // FMR-5: shared typed event union/dispatcher (RoomEvent) — same contract
  // as the player view, no more ad-hoc per-page payload casts.
  const handleRoomEvent = (msg: RoomEvent) => {
    switch (msg.type) {
      case 'QUESTION_START': {
        const d = msg.data;
        setQuestionIndex(d.questionIndex);
        setTotalQuestions(d.totalQuestions);
        setTimeLimit(d.timeLimit);
        setTimeLeft(d.timeLimit);
        setQuestion(d.question);
        // Anti-spoiler 2026-05-23: BE đã bỏ correctAnswer khỏi QUESTION_START
        // payload (Quản trò subscribe cùng /topic/room/{id} sẽ thấy đáp án
        // trước player). Reveal chỉ sau ROUND_END / QUESTION_REVEALED.
        setCorrectIndex(null);
        setLiveAnswers({}); // reset for new round
        break;
      }
      case 'ROUND_END': {
        const d = msg.data;
        if (typeof d.correctIndex === 'number') setCorrectIndex(d.correctIndex);
        break;
      }
      case 'QUESTION_REVEALED': {
        // GROUP_LIVE_SEQUENTIAL reveal — same correctIndex field.
        const d = msg.data;
        if (typeof d.correctIndex === 'number') setCorrectIndex(d.correctIndex);
        break;
      }
      case 'ANSWER_SUBMITTED': {
        const d = msg.data;
        setLiveAnswers(prev => ({
          ...prev,
          [d.playerId]: {
            userId: d.playerId,
            username: d.username,
            status: d.isCorrect ? 'correct' : 'wrong',
            reactionTimeMs: d.reactionTimeMs,
          },
        }));
        break;
      }
      case 'SCORE_UPDATE': {
        const d = msg.data;
        setScores(prev => {
          const idx = prev.findIndex(s => s.userId === d.playerId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], score: d.newScore };
            return next.sort((a, b) => b.score - a.score);
          }
          return [...prev, { userId: d.playerId, username: d.username ?? '', score: d.newScore }]
            .sort((a, b) => b.score - a.score);
        });
        break;
      }
      case 'GAME_PAUSED':
        setIsPaused(true);
        break;
      case 'GAME_RESUMED':
        setIsPaused(false);
        break;
      case 'QUESTION_SKIPPED':
        setSkippedToast(true);
        setTimeout(() => setSkippedToast(false), 2500);
        break;
      case 'ROOM_ENDED':
        // End-early or stuck-game cleanup — show wrap-up if we have ranks
        // so far, otherwise bounce back to /multiplayer.
        if (finalRanks == null) {
          navigate('/multiplayer', { replace: true });
        }
        break;
      case 'QUIZ_END': {
        const d = msg.data;
        let rows: FinalRanking[] = [];
        if (Array.isArray(d)) rows = d;
        else if (Array.isArray(d?.finalResults)) rows = d!.finalResults!;
        else if (Array.isArray(d?.leaderboard)) rows = d!.leaderboard!;
        rows = [...rows].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        setFinalRanks(rows);
        break;
      }
    }
  };

  // Apply a REST current-question payload over the live state (reconnect
  // path) — same reset semantics as a QUESTION_START broadcast, with the
  // countdown adjusted for how much of the window already elapsed.
  const applyRehydratedQuestion = (data: QuestionStartData) => {
    setQuestion(data.question);
    setQuestionIndex(data.questionIndex);
    setTotalQuestions(data.totalQuestions);
    setTimeLimit(data.timeLimit);
    const elapsedSec = data.startedAtMs ? (Date.now() - data.startedAtMs) / 1000 : 0;
    setTimeLeft(Math.max(0, data.timeLimit - elapsedSec));
    setCorrectIndex(null);
    setLiveAnswers({});
  };

  const { connected, reconnecting } = useRoomChannel(roomId, {
    onEvent: handleRoomEvent,
    // F-web-4 fix (FMR-2): after a WS gap, re-pull the in-flight question.
    // Only overwrite when the round actually moved on — same-question
    // reconnects keep the live answer grid intact.
    onRehydrateQuestion: (data) => {
      if (data.question.id !== question?.id) applyRehydratedQuestion(data);
    },
  });

  // Rehydrate first question via REST when navigating từ lobby → host view.
  // Race: BE fires QUESTION_START đúng lúc host page chưa subscribe xong → host
  // miss câu đầu (player view có cùng pattern ở RoomQuiz.tsx mount effect). Bug
  // user report 2026-05-23 ("chỉ có câu đầu ko hiện"). Fallback REST endpoint
  // trả 200 nếu mid-question, 204 nếu giữa rounds — silent ignore lỗi.
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    (async () => {
      const data = await fetchCurrentQuestion(roomId);
      if (cancelled || !data) return;
      // Only seed if state still empty — STOMP event arrived first wins.
      setQuestion(prev => prev ?? data.question);
      setQuestionIndex(prev => (prev > 0 ? prev : data.questionIndex));
      setTotalQuestions(prev => prev || data.totalQuestions);
      setTimeLimit(prev => prev || data.timeLimit);
      const elapsedSec = data.startedAtMs ? (Date.now() - data.startedAtMs) / 1000 : 0;
      setTimeLeft(prev => prev || Math.max(0, data.timeLimit - elapsedSec));
    })();
    return () => { cancelled = true; };
  }, [roomId]);

  // Local timer
  useEffect(() => {
    if (timeLeft <= 0 || isPaused) return;
    const t = setTimeout(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, isPaused]);

  const callHost = async (path: string, body?: object) => {
    setActionError(null);
    try {
      await api.post(`/api/rooms/${roomId}/host/${path}`, body ?? {});
    } catch (e) {
      const msg = (e as { userMessage?: string; message?: string })?.userMessage
        || (e as Error)?.message || 'Lỗi điều khiển';
      setActionError(msg);
    }
  };

  const handlePauseToggle = () => isPaused ? callHost('resume') : callHost('pause');
  const handleSkip = () => callHost('skip-question');
  const handleSendBroadcast = () => {
    const msg = broadcastMsg.trim();
    if (!msg) return;
    callHost('broadcast', { message: msg });
    setBroadcastMsg('');
    setShowBroadcast(false);
  };
  const handleEndEarly = () => {
    setShowEndConfirm(false);
    callHost('end-early');
  };

  const handleReplayWithSameGroup = () => {
    // Sprint 4: pre-fill CreateRoom with mode + invite list. CreateRoom can
    // ignore unknown nav-state fields safely.
    navigate('/multiplayer/create', {
      state: {
        prefill: {
          mode: navState.mode ?? 'SPEED_RACE',
          invitePlayerIds: (finalRanks ?? []).map(r => r.playerId).filter(Boolean) as string[],
        },
      },
    });
  };

  const matchStats = useMemo(() => {
    const ranks = finalRanks ?? [];
    const totalCorrect = ranks.reduce((s, r) => s + (r.correctAnswers ?? 0), 0);
    const totalAnswered = ranks.reduce((s, r) => s + (r.totalAnswered ?? 0), 0);
    const avgAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const durationS = Math.max(1, Math.round((Date.now() - matchStartedAt) / 1000));
    const m = Math.floor(durationS / 60);
    const s = durationS % 60;
    return {
      duration: `${m}m ${s}s`,
      avgAccuracy,
      players: ranks.length,
      totalQuestions,
    };
  }, [finalRanks, matchStartedAt, totalQuestions]);

  const liveAnswerList = useMemo(
    () => Object.values(liveAnswers).sort((a, b) => a.username.localeCompare(b.username)),
    [liveAnswers]
  );
  const answeredCount = liveAnswerList.length;
  // playerCount derived from scoreboard (best signal we have here without
  // a separate roomDetails fetch). Falls back to answered count.
  const playerCount = Math.max(scores.length, answeredCount);

  // QTR-5 — TV presentation: timer urgency derived per render (pure math,
  // no extra state). Gold while >50% of the window remains, orange ≤50%,
  // red ≤20%. #d97706 / #ef4444 already part of this screen's palette.
  const timerRatio = timeLimit > 0 ? Math.max(0, Math.min(1, timeLeft / timeLimit)) : 0;
  const timerColor = timerRatio <= 0.2 ? '#ef4444' : timerRatio <= 0.5 ? '#d97706' : '#e8a832';

  // ── Sprint 4 (S4-10): Quan Tro wrap-up screen — QTR-2 visual redesign:
  // centered max-w-3xl column, winner hero with gold accent + glow, 4 stat
  // tiles in one row, medal-accented ranking rows with correct-ratio bars. ──
  if (finalRanks) {
    const winner = finalRanks[0];
    return (
      <div
        data-testid="quiz-end-host-page"
        className="min-h-screen text-white relative"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(232,168,50,0.18) 0%, #11131e 60%)',
          fontFamily: "'Be Vietnam Pro', sans-serif",
        }}
      >
        <div className="mx-auto w-full max-w-3xl px-4 lg:px-6 pb-10">
          <header className="pt-4 flex items-center">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(232,168,50,0.2)', color: '#e8a832' }}
            >
              👑 Quản trò
            </span>
          </header>

          {/* Celebration header */}
          <div className="text-center pt-8 pb-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.4em] mb-2" style={{ color: '#e8a832' }}>
              Trận đấu kết thúc
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl" aria-hidden="true">🎉</span>
              <h1
                className="font-black text-3xl lg:text-4xl tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #f4c560 0%, #e8a832 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Cảm ơn Quản trò!
              </h1>
            </div>
          </div>

          {/* QTR-6: podium = the celebration moment on the cast/TV screen
              (replaces the old winner hero card, which duplicated rank #1) */}
          {winner && (
            <div className="mb-8" data-testid="end-host-winner">
              <PodiumBlock results={finalRanks} />
            </div>
          )}

          {/* Stat tiles — one row on ≥sm, 2×2 on mobile */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: '#9ca3af' }}>
              📊 Thống kê trận đấu
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="end-host-stats">
              <StatCard label="Tổng câu hỏi" value={`${matchStats.totalQuestions || finalRanks[0]?.totalAnswered || 0}`} icon="quiz" />
              <StatCard label="Thời lượng" value={matchStats.duration} icon="timer" />
              <StatCard label="Người chơi" value={`${matchStats.players}`} icon="group" />
              <StatCard label="Tỷ lệ đúng TB" value={`${matchStats.avgAccuracy}%`} accent="#34d399" icon="check_circle" />
            </div>
          </div>

          {/* Final rankings — medal accents top 3 + correct-ratio mini bar */}
          <div className="mb-8">
            <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: '#9ca3af' }}>
              🏆 Xếp hạng cuối cùng
            </div>
            <ul className="space-y-2" data-testid="end-host-rankings">
              {finalRanks.map((r, i) => {
                const accent = RANK_ACCENTS[i];
                const ratio =
                  typeof r.correctAnswers === 'number' && typeof r.totalAnswered === 'number' && r.totalAnswered > 0
                    ? r.correctAnswers / r.totalAnswered
                    : null;
                return (
                  <li
                    key={r.playerId ?? `r${i}`}
                    className="glass-card rounded-xl px-3 py-2.5 flex items-center gap-3"
                    style={{
                      border: accent ? `1px solid ${accent}4D` : '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-full grid place-items-center text-xs font-black flex-shrink-0"
                      style={
                        accent
                          ? { background: `${accent}33`, color: accent }
                          : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }
                      }
                    >
                      {i + 1}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}
                    >
                      {r.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate text-on-surface">{r.username}</div>
                      {ratio !== null && (
                        <div className="flex items-center gap-2 mt-1" data-testid={`host-rank-ratio-${i}`}>
                          <div className="h-1 flex-1 max-w-[120px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.round(ratio * 100)}%`, background: '#34d399' }}
                            />
                          </div>
                          <span className="text-[10px] whitespace-nowrap" style={{ color: '#34d399' }}>
                            {r.correctAnswers}/{r.totalAnswered} đúng
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      className="text-base font-black tabular-nums flex-shrink-0"
                      style={{ color: accent ?? '#fff' }}
                    >
                      {r.score ?? 0}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Actions — primary gold CTA + ghost secondary row */}
          <div>
            <button
              data-testid="end-host-replay"
              onClick={handleReplayWithSameGroup}
              className="gold-gradient w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ color: '#11131e' }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">replay</span>
              <span>Tổ chức trận mới với cùng nhóm</span>
            </button>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                data-testid="end-host-analytics"
                onClick={() => navigate(`/room/${roomId}/analytics`)}
                className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">monitoring</span>
                Phân tích
              </button>
              <button
                data-testid="end-host-close"
                onClick={() => navigate('/multiplayer', { replace: true })}
                className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">logout</span>
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="room-quiz-host-page"
      className="min-h-screen text-white"
      style={{ background: '#11131e', fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {reconnecting && (
        <div className="fixed top-0 left-0 right-0 z-[70] text-center py-2 text-sm font-medium"
             style={{ background: 'rgba(239,68,68,0.9)' }}>
          Đang kết nối lại…
        </div>
      )}
      {!connected && !reconnecting && (
        <div className="fixed top-0 left-0 right-0 z-[60] text-center py-1 text-xs"
             style={{ background: 'rgba(0,0,0,0.5)', color: '#9ca3af' }}>
          Đang chờ kết nối…
        </div>
      )}

      {/* QTR-5 — TV presentation layout: compact header strip + dramatic
          timer, oversized question/answers (read-from-the-couch scale),
          sticky sidebar ticker. Mobile stays single column with the full
          sticky bottom control bar. */}
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-6 pt-4 lg:pt-6 pb-28 lg:pb-24">
        {/* Header strip — badge · Câu X/N · host name | big urgency timer */}
        <header className="flex items-center justify-between gap-3 mb-2 lg:mb-3" data-testid="host-header">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0">
            <span
              className="px-2 py-0.5 lg:px-2.5 lg:py-1 rounded text-[10px] lg:text-xs font-bold uppercase tracking-wider flex-shrink-0"
              style={{ background: 'rgba(232,168,50,0.2)', color: '#e8a832' }}
            >
              👑 Quản trò
            </span>
            <span className="text-sm lg:text-lg font-bold text-on-surface-variant flex-shrink-0" data-testid="host-question-counter">
              Câu {questionIndex + (question ? 1 : 0)} / {totalQuestions || '?'}
            </span>
            {navState.hostName && (
              <span className="hidden sm:block text-xs lg:text-sm truncate" style={{ color: '#6b7280' }}>
                · Quản trò: {navState.hostName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0" data-testid="host-timer">
            <span className="material-symbols-outlined text-2xl lg:text-3xl" style={{ color: timerColor }} aria-hidden="true">timer</span>
            <span
              className="font-black text-3xl lg:text-4xl xl:text-5xl tabular-nums transition-colors duration-500"
              style={{ color: timerColor }}
            >
              {timeLeft}s
            </span>
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: connected ? '#34d399' : '#ef4444' }}
              aria-hidden="true"
            />
          </div>
        </header>
        {/* Countdown bar — thick, gold → orange → red as time runs out */}
        <div className="h-2 rounded-full overflow-hidden mb-4 lg:mb-6" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear${timerRatio > 0.5 ? ' gold-gradient' : ''}`}
            style={{
              width: `${timerRatio * 100}%`,
              background: timerRatio > 0.5 ? undefined : timerColor,
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-4 lg:gap-6 items-start">

          {/* ── Main column ── */}
          <main className="min-w-0 space-y-4">
            {/* Question card */}
            <section className="glass-card rounded-2xl p-4 lg:p-8" data-testid="host-question-card">
              {question ? (
                <>
                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold leading-snug lg:leading-snug mb-6 lg:mb-8 text-on-surface">
                    {question.content}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    {question.options.map((opt, i) => {
                      const isCorrect = correctIndex === i;
                      const revealed = correctIndex !== null;
                      const c = HOST_OPTION_STYLES[i] ?? HOST_OPTION_STYLES[0];
                      return (
                        <div
                          key={i}
                          data-testid={`host-option-${i}`}
                          className={
                            isCorrect
                              ? 'answer-correct-anim relative flex items-center gap-4 rounded-2xl border-2 px-4 py-5 lg:px-5 lg:py-6 min-h-[72px] scale-[1.02] transition-transform duration-300'
                              : `relative flex items-center gap-4 rounded-2xl border-2 px-4 py-5 lg:px-5 lg:py-6 min-h-[72px] transition-all duration-200 ${c.tile}${revealed ? ' opacity-20' : ''}`
                          }
                          style={
                            isCorrect
                              ? {
                                  background: 'rgba(74,222,128,0.18)',
                                  borderColor: '#4ade80',
                                  boxShadow: '0 0 40px rgba(74,222,128,0.45)',
                                }
                              : undefined
                          }
                        >
                          <div
                            className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl grid place-items-center text-xl lg:text-2xl font-bold flex-shrink-0 ${
                              isCorrect ? 'answer-letter-green-grad text-white shadow-lg' : c.letter
                            }`}
                          >
                            {['A','B','C','D'][i] ?? '?'}
                          </div>
                          <span
                            className={`flex-1 text-xl lg:text-2xl leading-snug ${
                              isCorrect ? 'text-white font-semibold' : 'text-on-surface font-medium'
                            }`}
                          >
                            {opt}
                          </span>
                          {isCorrect && (
                            <span className="text-xs lg:text-sm font-bold whitespace-nowrap flex-shrink-0" style={{ color: '#4ade80' }}>
                              ✓ ĐÁP ÁN
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center text-sm text-gray-400 py-10">Đang chờ câu hỏi đầu tiên…</div>
              )}
            </section>

            {/* Controls — QTR-5: the host screen is cast to a TV, so on lg+
                the 4 admin buttons collapse into a discreet floating pill
                bottom-right, dimmed (opacity-40) until the host hovers or
                tabs into it. Mobile keeps the full sticky bottom bar (host
                drives from a phone). */}
            <section
              data-testid="host-controls-bar"
              className={`fixed bottom-0 inset-x-0 p-3 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:p-0 lg:transition-opacity lg:duration-300 ${
                isPaused
                  ? 'z-[60] lg:opacity-100'
                  : 'z-40 lg:opacity-40 lg:hover:opacity-100 lg:focus-within:opacity-100'
              }`}
            >
              <div
                className="glass-panel relative mx-auto max-w-xl rounded-2xl px-3 py-2.5 border lg:mx-0 lg:max-w-none lg:rounded-full lg:px-2 lg:py-1.5"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                {actionError && (
                  <div
                    className="text-[10px] mb-1.5 text-center lg:absolute lg:bottom-full lg:right-0 lg:mb-2 lg:whitespace-nowrap lg:px-3 lg:py-1.5 lg:rounded-lg lg:glass-panel"
                    style={{ color: '#f87171' }}
                  >
                    {actionError}
                  </div>
                )}
                <div className="flex items-stretch justify-center gap-2 lg:gap-1.5">
                  <button
                    data-testid="host-control-pause"
                    onClick={handlePauseToggle}
                    className="flex-1 lg:flex-none px-2 lg:px-3.5 py-2 lg:py-1.5 rounded-xl lg:rounded-full flex items-center justify-center gap-1.5 text-xs lg:text-[11px] font-semibold transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      {isPaused ? 'play_arrow' : 'pause'}
                    </span>
                    <span>{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
                  </button>
                  <button
                    data-testid="host-control-skip"
                    onClick={handleSkip}
                    className="flex-1 lg:flex-none px-2 lg:px-3.5 py-2 lg:py-1.5 rounded-xl lg:rounded-full flex items-center justify-center gap-1.5 text-xs lg:text-[11px] font-semibold transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">skip_next</span>
                    <span>Bỏ câu</span>
                  </button>
                  <button
                    data-testid="host-control-broadcast"
                    onClick={() => setShowBroadcast(true)}
                    className="flex-1 lg:flex-none px-2 lg:px-3.5 py-2 lg:py-1.5 rounded-xl lg:rounded-full flex items-center justify-center gap-1.5 text-xs lg:text-[11px] font-semibold transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
                    <span>Nhắn</span>
                  </button>
                  <button
                    data-testid="host-control-end"
                    onClick={() => setShowEndConfirm(true)}
                    className="flex-1 lg:flex-none px-2 lg:px-3.5 py-2 lg:py-1.5 rounded-xl lg:rounded-full flex items-center justify-center gap-1.5 text-xs lg:text-[11px] font-semibold transition-colors"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">stop_circle</span>
                    <span>Kết thúc</span>
                  </button>
                </div>
              </div>
            </section>
          </main>

          {/* ── Sidebar (sticky on desktop) ── */}
          <aside className="space-y-4 lg:sticky lg:top-6" data-testid="host-sidebar">
            {/* Live answer ticker — QTR-5: TV-readable n/m counter + chips
                that pop in as ANSWER_SUBMITTED events land. (Per-option
                counts stay impossible — payload carries no option index.) */}
            <section className="glass-card rounded-2xl p-4 lg:p-5">
              <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#9ca3af' }}>
                Tình trạng trả lời
              </span>
              <div className="flex items-baseline gap-2 mt-1 mb-3">
                <span className="font-black text-3xl lg:text-4xl tabular-nums" style={{ color: '#e8a832' }}>
                  {answeredCount}
                </span>
                <span className="font-bold text-lg tabular-nums text-on-surface-variant">/ {playerCount}</span>
                <span className="text-xs font-semibold" style={{ color: '#9ca3af' }}>đã trả lời</span>
              </div>
              {liveAnswerList.length === 0 ? (
                <div className="text-xs text-gray-500 italic">Chưa có ai trả lời</div>
              ) : (
                <ul className="space-y-2" data-testid="host-live-answers">
                  {liveAnswerList.map(a => (
                    <li
                      key={a.userId}
                      className="host-chip-pop flex items-center gap-2.5 text-sm rounded-xl px-2.5 py-2"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}
                      >
                        {a.username[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="flex-1 truncate font-medium text-on-surface">{a.username}</span>
                      {a.status === 'correct' && (
                        <span className="text-xs font-bold whitespace-nowrap" style={{ color: '#4ade80' }}>
                          ✓ ĐÚNG{a.reactionTimeMs ? ` · ${(a.reactionTimeMs/1000).toFixed(1)}s` : ''}
                        </span>
                      )}
                      {a.status === 'wrong' && (
                        <span className="text-xs font-bold whitespace-nowrap" style={{ color: '#f87171' }}>
                          ✗ SAI{a.reactionTimeMs ? ` · ${(a.reactionTimeMs/1000).toFixed(1)}s` : ''}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Live scoreboard — top 5 with rank accents */}
            <section className="glass-card rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: '#9ca3af' }}>
                🏆 Bảng xếp hạng tạm thời
              </div>
              {scores.length === 0 ? (
                <div className="text-xs text-gray-500 italic">Chưa có điểm</div>
              ) : (
                <ul className="space-y-1.5" data-testid="host-scoreboard">
                  {scores.slice(0, 5).map((s, i) => {
                    const accent = RANK_ACCENTS[i];
                    return (
                      <li
                        key={s.userId}
                        className="flex items-center gap-2 text-xs rounded-lg px-2 py-1.5"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: accent ? `1px solid ${accent}33` : '1px solid transparent',
                        }}
                      >
                        <span
                          className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-black flex-shrink-0"
                          style={
                            accent
                              ? { background: `${accent}33`, color: accent }
                              : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }
                          }
                        >
                          {i + 1}
                        </span>
                        <span className="flex-1 truncate text-on-surface">{s.username}</span>
                        <span className="font-bold tabular-nums" style={{ color: accent ?? '#fff' }}>
                          {s.score}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>

      {/* Pause overlay */}
      {isPaused && (
        <div
          data-testid="host-pause-overlay"
          className="fixed inset-0 z-50 grid place-items-center backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div className="text-center">
            <div className="text-5xl mb-3">⏸️</div>
            <div className="font-bold text-2xl mb-1">Trận đấu đã tạm dừng</div>
            <div className="text-sm text-gray-400 mb-6">Bấm tiếp tục khi sẵn sàng</div>
            <button
              data-testid="host-pause-resume"
              onClick={handlePauseToggle}
              className="gold-gradient inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-lg"
              style={{ color: '#11131e' }}
            >
              <span className="material-symbols-outlined">play_arrow</span>
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {/* Skip toast */}
      {skippedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg text-sm"
             style={{ background: 'rgba(232,168,50,0.95)', color: '#11131e' }}>
          ⏭️ Đã bỏ câu này
        </div>
      )}

      {/* Broadcast modal */}
      {showBroadcast && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-xl p-4" style={{ background: '#1d1f2a' }}>
            <div className="font-bold mb-2">💬 Nhắn cả phòng</div>
            <textarea
              data-testid="host-broadcast-input"
              maxLength={200}
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Tin nhắn hiện 5 giây cho tất cả người chơi…"
              className="w-full rounded-lg p-2 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 80 }}
            />
            <div className="text-right text-[10px] text-gray-500 mb-3">{broadcastMsg.length} / 200</div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowBroadcast(false); setBroadcastMsg(''); }}
                className="px-3 py-1.5 rounded text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}
              >
                Hủy
              </button>
              <button
                data-testid="host-broadcast-send"
                onClick={handleSendBroadcast}
                disabled={broadcastMsg.trim().length === 0}
                className="px-3 py-1.5 rounded text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #e8a832, #d97706)', color: '#11131e' }}
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End-early confirm */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-xl p-4" style={{ background: '#1d1f2a' }}>
            <div className="font-bold mb-2">🛑 Kết thúc trận đấu sớm?</div>
            <div className="text-sm text-gray-400 mb-4">
              Tất cả người chơi sẽ thấy bảng xếp hạng cuối cùng dựa trên điểm số hiện tại.
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-3 py-1.5 rounded text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}
              >
                Hủy
              </button>
              <button
                data-testid="host-end-confirm"
                onClick={handleEndEarly}
                className="px-3 py-1.5 rounded text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff' }}
              >
                Kết thúc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* hostName now lives in the header strip (QTR-5) — the old fixed
          bottom-right footer chip would collide with the floating controls. */}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; accent?: string; icon?: string }> = ({ label, value, accent, icon }) => (
  <div
    className="glass-card rounded-xl p-3"
    style={{ border: '1px solid rgba(255,255,255,0.04)' }}
  >
    {icon && (
      <span
        className="material-symbols-outlined text-[18px] mb-1 block"
        style={{ color: accent ?? '#e8a832' }}
        aria-hidden="true"
      >
        {icon}
      </span>
    )}
    <div className="font-black text-lg lg:text-xl tabular-nums" style={{ color: accent ?? '#fff' }}>{value}</div>
    <div className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: '#9ca3af' }}>{label}</div>
  </div>
);

export default RoomQuizHost;
