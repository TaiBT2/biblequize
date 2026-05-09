import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useStomp } from '../../hooks/useStomp';
import { api } from '../../api/client';

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

type Question = { id: string; content: string; options: string[]; correctAnswer?: number };
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

  const { connected, reconnecting } = useStomp({
    roomId,
    onMessage: (msg) => {
      switch (msg.type) {
        case 'QUESTION_START': {
          const d = msg.data as {
            questionIndex: number; totalQuestions: number;
            timeLimit: number; question: Question;
          };
          setQuestionIndex(d.questionIndex);
          setTotalQuestions(d.totalQuestions);
          setTimeLimit(d.timeLimit);
          setTimeLeft(d.timeLimit);
          setQuestion(d.question);
          setCorrectIndex(typeof d.question?.correctAnswer === 'number' ? d.question.correctAnswer : null);
          setLiveAnswers({}); // reset for new round
          break;
        }
        case 'ANSWER_SUBMITTED': {
          const d = msg.data as {
            playerId: string; username: string;
            isCorrect: boolean; reactionTimeMs?: number;
          };
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
          const d = msg.data as { playerId: string; username?: string; newScore: number };
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
          const d = msg.data as FinalRanking[] | { finalResults?: FinalRanking[]; leaderboard?: FinalRanking[] } | undefined;
          let rows: FinalRanking[] = [];
          if (Array.isArray(d)) rows = d;
          else if (Array.isArray(d?.finalResults)) rows = d!.finalResults!;
          else if (Array.isArray(d?.leaderboard)) rows = d!.leaderboard!;
          rows = [...rows].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
          setFinalRanks(rows);
          break;
        }
      }
    },
  });

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

  // ── Sprint 4 (S4-10): Quan Tro wrap-up screen ──
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
        <header className="px-4 pt-4 flex items-center justify-between">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(232,168,50,0.2)', color: '#e8a832' }}
          >
            👑 Quản trò
          </span>
          <button
            onClick={() => navigate('/multiplayer', { replace: true })}
            className="w-8 h-8 rounded-full grid place-items-center text-gray-400"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            aria-label="Đóng"
          >
            ✕
          </button>
        </header>

        <div className="text-center pt-6 pb-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: '#e8a832' }}>
            Trận đấu kết thúc
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🎉</span>
            <h1
              className="font-black text-3xl tracking-tight"
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

        {winner && (
          <div className="px-5 mb-4">
            <div
              className="rounded-2xl p-3 flex items-center gap-3"
              style={{
                background: 'rgba(50,52,64,0.78)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(232,168,50,0.3)',
              }}
              data-testid="end-host-winner"
            >
              <div className="text-2xl">👑</div>
              <div
                className="w-10 h-10 rounded-full grid place-items-center font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}
              >
                {winner.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#9ca3af' }}>
                  Người chiến thắng
                </div>
                <div className="font-bold text-lg truncate">{winner.username}</div>
                <div className="text-xs font-bold" style={{ color: '#e8a832' }}>
                  {winner.score ?? 0} điểm
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-5 mb-4">
          <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: '#9ca3af' }}>
            📊 Thống kê trận đấu
          </div>
          <div className="grid grid-cols-2 gap-2" data-testid="end-host-stats">
            <StatCard label="Tổng câu hỏi" value={`${matchStats.totalQuestions || finalRanks[0]?.totalAnswered || 0}`} />
            <StatCard label="Thời lượng" value={matchStats.duration} />
            <StatCard label="Người chơi" value={`${matchStats.players}`} />
            <StatCard label="Tỷ lệ đúng TB" value={`${matchStats.avgAccuracy}%`} accent="#34d399" />
          </div>
        </div>

        <div className="px-5 mb-4">
          <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: '#9ca3af' }}>
            🏆 Xếp hạng cuối cùng
          </div>
          <ul className="space-y-1.5" data-testid="end-host-rankings">
            {finalRanks.map((r, i) => (
              <li
                key={r.playerId ?? `r${i}`}
                className="rounded-lg p-2 flex items-center gap-2"
                style={{
                  background: 'rgba(50,52,64,0.55)',
                  border: i === 0 ? '1px solid rgba(232,168,50,0.3)' : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span
                  className="text-[10px] font-bold w-3"
                  style={{ color: i === 0 ? '#e8a832' : i === 1 ? '#d1d5db' : i === 2 ? '#cd7f32' : '#9ca3af' }}
                >
                  {i + 1}
                </span>
                <div
                  className="w-6 h-6 rounded-full grid place-items-center text-[10px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}
                >
                  {r.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="flex-1 text-xs font-semibold truncate">{r.username}</span>
                {typeof r.correctAnswers === 'number' && typeof r.totalAnswered === 'number' && r.totalAnswered > 0 && (
                  <span className="text-[10px]" style={{ color: '#34d399' }}>
                    {r.correctAnswers}/{r.totalAnswered} đúng
                  </span>
                )}
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: i === 0 ? '#e8a832' : '#fff' }}
                >
                  {r.score ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4">
          <button
            data-testid="end-host-replay"
            onClick={handleReplayWithSameGroup}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)',
              color: '#11131e',
            }}
          >
            🔄 <span>Tổ chức trận mới với cùng nhóm</span>
          </button>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              data-testid="end-host-analytics"
              onClick={() => navigate(`/room/${roomId}/analytics`)}
              className="py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              📊 Phân tích
            </button>
            <button
              data-testid="end-host-close"
              onClick={() => navigate('/multiplayer', { replace: true })}
              className="py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              🚪 Đóng
            </button>
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

      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(232,168,50,0.2)', color: '#e8a832' }}
          >
            👑 Quản trò
          </span>
          <span className="text-sm font-bold" data-testid="host-question-counter">
            Câu {questionIndex + (question ? 1 : 0)} / {totalQuestions || '?'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-base font-bold" style={{ color: '#e8a832', fontVariantNumeric: 'tabular-nums' }}>
            {timeLeft}s
          </div>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? '#34d399' : '#ef4444' }} />
        </div>
      </header>

      {/* Question display */}
      <section className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {question ? (
          <>
            <h2 className="text-base font-bold leading-snug mb-3 text-white">{question.content}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {question.options.map((opt, i) => {
                const isCorrect = correctIndex === i;
                return (
                  <div
                    key={i}
                    data-testid={`host-option-${i}`}
                    className="rounded-lg p-2.5 flex items-center gap-2 border"
                    style={{
                      background: isCorrect ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)',
                      borderColor: isCorrect ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.06)',
                      opacity: isCorrect ? 1 : 0.55,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded grid place-items-center text-xs font-bold"
                      style={{
                        background: isCorrect ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'rgba(255,255,255,0.08)',
                        color: isCorrect ? '#11131e' : '#9ca3af',
                      }}
                    >
                      {['A','B','C','D'][i] ?? '?'}
                    </div>
                    <span className="text-xs flex-1">{opt}</span>
                    {isCorrect && (
                      <span className="text-[10px] font-bold" style={{ color: '#4ade80' }}>✓ ĐÁP ÁN</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center text-sm text-gray-400 py-6">Đang chờ câu hỏi đầu tiên…</div>
        )}
      </section>

      {/* Live answer status */}
      <section className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#9ca3af' }}>
            Tình trạng trả lời
          </span>
          <span className="text-[10px] font-bold" style={{ color: '#4ade80' }}>
            {answeredCount} / {playerCount} đã trả lời
          </span>
        </div>
        {liveAnswerList.length === 0 ? (
          <div className="text-xs text-gray-500 italic">Chưa có ai trả lời</div>
        ) : (
          <ul className="space-y-1.5" data-testid="host-live-answers">
            {liveAnswerList.map(a => (
              <li key={a.userId} className="flex items-center gap-2 text-xs">
                <div
                  className="w-6 h-6 rounded-full grid place-items-center text-[10px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}
                >
                  {a.username[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="flex-1">{a.username}</span>
                {a.status === 'correct' && (
                  <span className="text-[10px] font-bold" style={{ color: '#4ade80' }}>
                    ✓ ĐÚNG{a.reactionTimeMs ? ` · ${(a.reactionTimeMs/1000).toFixed(1)}s` : ''}
                  </span>
                )}
                {a.status === 'wrong' && (
                  <span className="text-[10px] font-bold" style={{ color: '#f87171' }}>
                    ✗ SAI{a.reactionTimeMs ? ` · ${(a.reactionTimeMs/1000).toFixed(1)}s` : ''}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Live scoreboard */}
      <section className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: '#9ca3af' }}>
          🏆 Bảng xếp hạng tạm thời
        </div>
        {scores.length === 0 ? (
          <div className="text-xs text-gray-500 italic">Chưa có điểm</div>
        ) : (
          <ul className="space-y-1" data-testid="host-scoreboard">
            {scores.slice(0, 8).map((s, i) => (
              <li key={s.userId} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-[10px] font-bold" style={{ color: i === 0 ? '#e8a832' : '#9ca3af' }}>
                  {i + 1}
                </span>
                <span className="flex-1">{s.username}</span>
                <span className="font-bold" style={{ color: i === 0 ? '#e8a832' : '#fff', fontVariantNumeric: 'tabular-nums' }}>
                  {s.score}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Controls bar */}
      <section className="fixed bottom-0 left-0 right-0 p-3 border-t"
               style={{ background: '#11131e', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#e8a832' }}>
            🎛️ Điều khiển trận đấu
          </span>
          {actionError && (
            <span className="text-[10px]" style={{ color: '#f87171' }}>· {actionError}</span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            data-testid="host-control-pause"
            onClick={handlePauseToggle}
            className="py-2 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
          >
            <span className="text-sm">{isPaused ? '▶️' : '⏸️'}</span>
            <span>{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
          </button>
          <button
            data-testid="host-control-skip"
            onClick={handleSkip}
            className="py-2 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
          >
            <span className="text-sm">⏭️</span>
            <span>Bỏ câu</span>
          </button>
          <button
            data-testid="host-control-broadcast"
            onClick={() => setShowBroadcast(true)}
            className="py-2 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
          >
            <span className="text-sm">💬</span>
            <span>Nhắn</span>
          </button>
          <button
            data-testid="host-control-end"
            onClick={() => setShowEndConfirm(true)}
            className="py-2 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-semibold"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            <span className="text-sm">🛑</span>
            <span>Kết thúc</span>
          </button>
        </div>
      </section>

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
            <div className="text-sm text-gray-400">Bấm tiếp tục khi sẵn sàng</div>
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

      {/* Spacer so the fixed control bar doesn't cover content */}
      <div style={{ height: 110 }} />

      {/* Surface hostName from nav state in a footer chip — gives the host
          a quick identity reminder when juggling tabs. */}
      {navState.hostName && (
        <div className="hidden md:block fixed bottom-24 right-4 text-[10px]" style={{ color: '#6b7280' }}>
          Quản trò: {navState.hostName}
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; accent?: string }> = ({ label, value, accent }) => (
  <div
    className="rounded-xl p-2.5"
    style={{ background: 'rgba(50,52,64,0.55)', border: '1px solid rgba(255,255,255,0.04)' }}
  >
    <div className="text-[10px] uppercase" style={{ color: '#9ca3af' }}>{label}</div>
    <div className="font-bold text-base" style={{ color: accent ?? '#fff' }}>{value}</div>
  </div>
);

export default RoomQuizHost;
