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
          navigate('/multiplayer', { replace: true });
          break;
        case 'QUIZ_END':
          // TODO S4-10: render QuizEndHost. For Sprint 4 v1 just route
          // back to the multiplayer landing page.
          navigate('/multiplayer', { replace: true });
          break;
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

  const liveAnswerList = useMemo(
    () => Object.values(liveAnswers).sort((a, b) => a.username.localeCompare(b.username)),
    [liveAnswers]
  );
  const answeredCount = liveAnswerList.length;
  // playerCount derived from scoreboard (best signal we have here without
  // a separate roomDetails fetch). Falls back to answered count.
  const playerCount = Math.max(scores.length, answeredCount);

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

export default RoomQuizHost;
