import { useMemo } from 'react';
import Podium from './Podium';
import type { PlayerScore } from '../../pages/room/RoomOverlays';

interface Props {
  results: PlayerScore[];
  myUsername: string;
  isHost: boolean;
  totalQuestions: number;
  /** Match start timestamp in millis. Used to render "Thời gian" stat;
   *  pass null/undefined and the stat shows "—". */
  startedAtMs?: number | null;
  onReplay: () => void;
  onClose: () => void;
  onShare: () => void;
  onNewRoom: () => void;
  onHome: () => void;
}

const FILL_STYLE = { fontVariationSettings: "'FILL' 1" } as const;

function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '—';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function QuizEndScreen({
  results, myUsername, isHost, totalQuestions, startedAtMs,
  onReplay, onClose, onShare, onNewRoom, onHome,
}: Props) {
  const me = useMemo(
    () => results.find(r => r.username === myUsername),
    [results, myUsername]
  );
  const myRank = me?.finalRank ?? null;
  const totalScore = useMemo(
    () => results.reduce((sum, r) => sum + (r.score ?? 0), 0),
    [results]
  );
  const matchDuration = startedAtMs ? Date.now() - startedAtMs : null;

  return (
    <div
      data-testid="quiz-end-screen"
      className="fixed inset-0 z-50 overflow-auto"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(232,168,50,0.20) 0%, #11131e 60%)',
        fontFamily: "'Be Vietnam Pro', sans-serif",
      }}
    >
      {/* Top bar: role badge + room context + close */}
      <header
        className="flex items-center justify-between px-4 lg:px-6 h-14 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: isHost ? 'rgba(232,168,50,0.2)' : 'rgba(255,255,255,0.06)',
              color: isHost ? '#e8a832' : '#d1d5db',
            }}
          >
            {isHost ? '👑 Host view' : 'Player view'}
          </span>
          <span className="text-xs" style={{ color: '#9ca3af' }}>
            {totalQuestions ? `${totalQuestions} câu` : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={isHost ? onClose : onHome}
          aria-label="Đóng"
          className="w-9 h-9 rounded-full grid place-items-center"
          style={{
            background: 'rgba(50,52,64,0.55)',
            color: '#9ca3af',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </header>

      {/* Title */}
      <div className="text-center pt-6 pb-2" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <div
          className="text-xs font-bold uppercase mb-2"
          style={{ color: '#e8a832', letterSpacing: '0.4em' }}
        >
          {isHost ? 'Trận đấu kết thúc' : 'Cảm ơn bạn đã chơi!'}
        </div>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl" aria-hidden="true">🏆</span>
          <h1
            className="font-black text-3xl lg:text-4xl tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #e8a832 0%, #fbbf24 50%, #e7c268 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.1,
            }}
          >
            Vinh quang!
          </h1>
        </div>
      </div>

      {/* Player view: personal hero card sits between title and podium */}
      {!isHost && me && (
        <div className="px-4 lg:px-8 pt-4">
          <div
            data-testid="end-hero-card"
            className="mx-auto rounded-2xl p-5 relative overflow-hidden"
            style={{
              maxWidth: 720,
              background: 'rgba(50,52,64,0.78)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(232,168,50,0.3)',
            }}
          >
            <div className="grid grid-cols-[auto_1fr] gap-4 lg:gap-5 items-center">
              <div className="relative shrink-0">
                <div
                  className="rounded-full grid place-items-center font-bold text-white"
                  style={{
                    width: 80, height: 80,
                    background: 'linear-gradient(135deg, #4ade80 0%, #047857 100%)',
                    fontSize: 28,
                  }}
                >
                  {(myUsername?.[0] ?? '?').toUpperCase()}
                </div>
                {myRank && (
                  <div
                    className="absolute -bottom-1 -right-1 grid place-items-center font-black"
                    style={{
                      width: 36, height: 36,
                      borderRadius: '50%',
                      background: myRank === 1
                        ? 'linear-gradient(135deg, #f4c560 0%, #e8a832 100%)'
                        : myRank === 2
                        ? 'linear-gradient(135deg, #f3f4f6 0%, #9ca3af 100%)'
                        : myRank === 3
                        ? 'linear-gradient(135deg, #cd7f32 0%, #8b5a2b 100%)'
                        : 'rgba(50,52,64,0.9)',
                      color: '#11131e',
                      border: '2px solid #11131e',
                    }}
                  >
                    {myRank}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: '#9ca3af' }}
                >
                  Bạn về thứ
                </div>
                <div
                  className="font-black text-2xl lg:text-4xl text-white tracking-tight"
                  style={{ lineHeight: 1.1 }}
                >
                  {myRank ? `Hạng ${myRank}` : 'Chưa xếp hạng'}
                </div>
                <div className="text-sm" style={{ color: '#d1d5db' }}>
                  {myUsername}{me.score ? ` · ${me.score} điểm` : ''}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <Stat label="Đúng" value={`${me.correctAnswers ?? 0}/${me.totalAnswered ?? totalQuestions}`} color="#4ade80" />
                  <Stat label="Chính xác" value={`${Math.round((me.accuracy ?? 0) * 100)}%`} color="#e8a832" />
                  <Stat label="Tổng câu" value={`${totalQuestions}`} color="#d1d5db" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main grid: podium/stats + actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 px-4 lg:px-8 pt-5 pb-8">
        <div className="flex flex-col items-stretch">
          <Podium results={results} compact={!isHost} />

          {/* Match stats — 4 cells */}
          <div
            className="rounded-xl p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6"
            style={{
              background: 'rgba(50,52,64,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              animation: 'fadeIn 0.6s ease-out 0.4s backwards',
            }}
          >
            <Stat label="Câu hỏi" value={`${totalQuestions}`} color="#fff" />
            <Stat label="Thời gian" value={formatDuration(matchDuration)} color="#fff" border />
            <Stat label="Người chơi" value={`${results.length}`} color="#fff" border />
            <Stat label="Tổng điểm" value={`${totalScore}`} color="#fff" />
          </div>
        </div>

        {/* Actions panel */}
        <aside
          className="flex flex-col"
          style={{ animation: 'fadeIn 0.6s ease-out 0.3s backwards' }}
        >
          {isHost ? (
            <div
              className="rounded-2xl p-5 mb-3"
              style={{
                background: 'rgba(50,52,64,0.78)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(232,168,50,0.3)',
              }}
            >
              <div
                className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
                style={{ color: '#e8a832' }}
              >
                <span>👑</span><span>Lựa chọn của Host</span>
              </div>
              <div className="space-y-3">
                <ActionButton primary onClick={onReplay} icon="refresh" label="Chơi lại với phòng này" testId="end-host-replay" />
                <ActionButton onClick={onClose} icon="logout" label="Đóng phòng" testId="end-host-close" danger />
              </div>
            </div>
          ) : (
            <>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: '#9ca3af' }}
              >
                Tiếp theo?
              </div>
              <ActionButton primary onClick={onShare} icon="share" label="Chia sẻ kết quả" testId="end-player-share" />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <ActionButton onClick={onNewRoom} icon="swords" label="Phòng mới" testId="end-player-new-room" small />
                <ActionButton onClick={onHome} icon="home" label="Trang chủ" testId="end-player-home" small />
              </div>
              <div
                className="rounded-xl p-3 mt-4"
                style={{
                  background: 'rgba(50,52,64,0.55)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2 text-[10px] mb-1" style={{ color: '#6b7280' }}>
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: '#e8a832' }}
                  />
                  <span className="uppercase tracking-wider font-bold">Trạng thái phòng</span>
                </div>
                <p className="text-xs" style={{ color: '#d1d5db' }}>
                  Host có thể bắt đầu trận mới · bạn vẫn ở trong phòng và sẽ tự vào trận tiếp theo nếu host chọn chơi lại.
                </p>
              </div>
            </>
          )}

          {/* Quick rankings — host gets a longer list, player gets a peek */}
          <div
            className="rounded-2xl p-4 mt-3"
            style={{
              background: 'rgba(50,52,64,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              animation: 'fadeIn 0.6s ease-out 0.5s backwards',
            }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{ color: '#9ca3af' }}
            >
              Bảng xếp hạng
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results
                .slice()
                .sort((a, b) => (a.finalRank ?? 99) - (b.finalRank ?? 99))
                .map((r, i) => {
                  const isMe = r.username === myUsername;
                  const rank = r.finalRank ?? i + 1;
                  return (
                    <div
                      key={r.playerId}
                      className="flex items-center gap-2 py-1"
                      style={isMe ? {
                        background: 'rgba(232,168,50,0.08)',
                        border: '1px solid rgba(232,168,50,0.25)',
                        borderRadius: 8,
                        padding: '4px 8px',
                      } : undefined}
                    >
                      <span
                        className="font-bold text-sm w-5"
                        style={{
                          color: rank === 1 ? '#e8a832' : rank === 2 ? '#d1d5db' : rank === 3 ? '#cd7f32' : '#9ca3af',
                        }}
                      >
                        {rank}.
                      </span>
                      <span className="text-xs font-semibold text-white flex-1 truncate">
                        {r.username}{rank === 1 ? ' 👑' : ''}{isMe ? ' (bạn)' : ''}
                      </span>
                      <span
                        className="font-bold text-xs"
                        style={{ color: rank === 1 ? '#e8a832' : '#fff' }}
                      >
                        {r.score}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const Stat: React.FC<{ label: string; value: string; color?: string; border?: boolean }> = ({ label, value, color = '#fff', border }) => (
  <div className={border ? 'border-x' : ''} style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
    <div className="text-[10px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>
      {label}
    </div>
    <div className="font-bold text-base lg:text-lg mt-0.5" style={{ color }}>
      {value}
    </div>
  </div>
);

const ActionButton: React.FC<{
  primary?: boolean;
  small?: boolean;
  danger?: boolean;
  icon: string;
  label: string;
  onClick: () => void;
  testId?: string;
}> = ({ primary, small, danger, icon, label, onClick, testId }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testId}
    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl font-bold ${small ? 'py-2.5 text-xs' : 'py-3 text-sm'}`}
    style={
      primary
        ? {
            background: 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)',
            color: '#11131e',
            boxShadow: '0 6px 20px rgba(232,168,50,0.3)',
          }
        : danger
        ? {
            background: 'rgba(248,113,113,0.08)',
            color: '#f87171',
            border: '1px solid rgba(248,113,113,0.25)',
          }
        : {
            background: 'rgba(50,52,64,0.55)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.06)',
          }
    }
  >
    <span className="material-symbols-outlined text-base" style={FILL_STYLE}>{icon}</span>
    <span>{label}</span>
  </button>
);

export default QuizEndScreen;
