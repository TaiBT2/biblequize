import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

type RoomDetails = {
  id: string;
  roomCode: string;
  roomName: string;
  status: string;
  mode: string;
  questionCount: number;
  timePerQuestion: number;
  startedAt?: string | null;
  endedAt?: string | null;
  hostName: string;
  currentPlayers: number;
  maxPlayers: number;
};

type LeaderboardEntry = {
  playerId: string;
  username: string;
  avatarUrl?: string;
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  accuracy: number;
  finalRank?: number;
  playerStatus?: string;
};

const FILL_STYLE = { fontVariationSettings: "'FILL' 1" } as const;

/**
 * Per-match analytics view for the host (and any curious player). Powered
 * by the existing GET /api/rooms/{id} + /api/rooms/{id}/leaderboard
 * endpoints — no per-question breakdown yet (the BE doesn't expose
 * room_rounds + room_answers as a public read; tracked for a follow-up).
 */
export default function RoomAnalytics() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    (async () => {
      try {
        const [roomRes, lbRes] = await Promise.all([
          api.get(`/api/rooms/${roomId}`),
          api.get(`/api/rooms/${roomId}/leaderboard`),
        ]);
        if (cancelled) return;
        setRoom(roomRes.data?.room ?? null);
        const lb = (lbRes.data?.leaderboard ?? []) as LeaderboardEntry[];
        setBoard(lb.slice().sort((a, b) =>
          (a.finalRank ?? 99) - (b.finalRank ?? 99) || b.score - a.score
        ));
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.message ?? 'Không tải được phân tích');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roomId]);

  const stats = useMemo(() => {
    if (board.length === 0) return null;
    const totalScore = board.reduce((s, p) => s + (p.score ?? 0), 0);
    const totalCorrect = board.reduce((s, p) => s + (p.correctAnswers ?? 0), 0);
    const totalAnswered = board.reduce((s, p) => s + (p.totalAnswered ?? 0), 0);
    const avgAccuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;
    const winnerScore = board[0]?.score ?? 0;
    return { totalScore, totalCorrect, totalAnswered, avgAccuracy, winnerScore };
  }, [board]);

  const matchDuration = useMemo(() => {
    if (!room?.startedAt) return null;
    const start = new Date(room.startedAt).getTime();
    const end = room.endedAt ? new Date(room.endedAt).getTime() : Date.now();
    return Math.max(0, end - start);
  }, [room]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-on-surface-variant">
        Đang tải phân tích...
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">
        <span className="material-symbols-outlined text-4xl" style={{ color: '#f87171', ...FILL_STYLE }}>error</span>
        <p className="text-on-surface text-center">{error ?? 'Không tìm thấy phòng'}</p>
        <button
          onClick={() => navigate('/multiplayer')}
          className="px-4 py-2 rounded-lg text-sm font-bold"
          style={{ background: '#e8a832', color: '#11131e' }}
        >
          Về danh sách phòng
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="room-analytics-page"
      className="min-h-screen px-4 lg:px-8 py-6"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(232,168,50,0.10) 0%, #0a0b13 60%)',
        fontFamily: "'Be Vietnam Pro', sans-serif",
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-6 max-w-5xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(`/room/${roomId}/quiz`)}
          className="text-sm font-semibold inline-flex items-center gap-1.5"
          style={{ color: '#9ca3af' }}
          data-testid="analytics-back-btn"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay lại kết quả
        </button>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(232,168,50,0.2)', color: '#e8a832' }}
          >
            📊 Phân tích chi tiết
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto space-y-5">
        {/* Title */}
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.3em] mb-1" style={{ color: '#9ca3af' }}>
            {room.mode.replace(/_/g, ' ')} · {room.roomCode}
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {room.roomName || 'Phân tích trận đấu'}
          </h1>
          {room.hostName && (
            <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
              Chủ phòng: <span className="text-on-surface font-semibold">{room.hostName}</span>
            </p>
          )}
        </div>

        {/* Match summary card */}
        <section
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(50,52,64,0.78)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-0">
            <SummaryCell label="Câu hỏi" value={`${room.questionCount}`} />
            <SummaryCell label="Thời gian" value={formatDuration(matchDuration)} divider />
            <SummaryCell label="Người chơi" value={`${board.length}`} divider />
            <SummaryCell label="Tổng điểm" value={`${stats?.totalScore ?? 0}`} divider />
            <SummaryCell
              label="Độ chính xác trung bình"
              value={stats ? `${Math.round(stats.avgAccuracy * 100)}%` : '—'}
              divider
            />
          </div>
        </section>

        {/* Per-player breakdown */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(50,52,64,0.55)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#e8a832' }}>
              Chi tiết người chơi
            </h2>
          </div>
          {board.length === 0 ? (
            <p className="px-5 py-6 text-sm text-center" style={{ color: '#9ca3af' }}>
              Phòng chưa có dữ liệu kết quả.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                  <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <Th>Hạng</Th>
                    <Th>Người chơi</Th>
                    <Th align="right">Điểm</Th>
                    <Th align="right">Đúng</Th>
                    <Th align="right">Trả lời</Th>
                    <Th align="right">Chính xác</Th>
                    <Th>Trạng thái</Th>
                  </tr>
                </thead>
                <tbody>
                  {board.map((p, i) => {
                    const rank = p.finalRank ?? i + 1;
                    const accPct = p.totalAnswered > 0 ? Math.round((p.accuracy ?? p.correctAnswers / p.totalAnswered) * 100) : 0;
                    return (
                      <tr
                        key={p.playerId}
                        className="border-b"
                        style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                      >
                        <Td>
                          <span
                            className="font-bold"
                            style={{
                              color: rank === 1 ? '#e8a832' : rank === 2 ? '#d1d5db' : rank === 3 ? '#cd7f32' : '#9ca3af',
                            }}
                          >
                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                          </span>
                        </Td>
                        <Td>
                          <span className="font-semibold text-white">{p.username}</span>
                          {rank === 1 && <span className="ml-1">👑</span>}
                        </Td>
                        <Td align="right">
                          <span className="font-bold" style={{ color: rank === 1 ? '#e8a832' : '#fff' }}>
                            {p.score}
                          </span>
                        </Td>
                        <Td align="right" className="tabular-nums" style={{ color: '#4ade80' }}>
                          {p.correctAnswers}
                        </Td>
                        <Td align="right" className="tabular-nums" style={{ color: '#9ca3af' }}>
                          {p.totalAnswered}/{room.questionCount}
                        </Td>
                        <Td align="right" className="tabular-nums" style={{ color: accPct >= 70 ? '#4ade80' : accPct >= 40 ? '#e8a832' : '#f87171' }}>
                          {accPct}%
                        </Td>
                        <Td>
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{
                              background: p.playerStatus === 'ELIMINATED' ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.15)',
                              color: p.playerStatus === 'ELIMINATED' ? '#f87171' : '#4ade80',
                            }}
                          >
                            {p.playerStatus === 'ELIMINATED' ? 'Bị loại' : 'Hoàn thành'}
                          </span>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Note about per-question detail (BE not yet exposing it) */}
        <section
          className="rounded-xl p-4"
          style={{
            background: 'rgba(74,158,255,0.06)',
            border: '1px solid rgba(74,158,255,0.2)',
          }}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined" style={{ color: '#60a5fa' }}>info</span>
            <p className="text-sm" style={{ color: '#d1d5db' }}>
              Chi tiết từng câu hỏi (đáp án đúng, ai chọn gì, thời gian phản xạ trung bình)
              sẽ được mở khóa khi backend hỗ trợ tổng hợp <code>room_rounds</code>. Hiện tại đang theo dõi
              cho sprint sau.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '—';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

const SummaryCell: React.FC<{ label: string; value: string; divider?: boolean }> = ({ label, value, divider }) => (
  <div
    className={`text-center px-3 ${divider ? 'lg:border-l' : ''}`}
    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
  >
    <div className="text-[10px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>{label}</div>
    <div className="font-bold text-white text-base lg:text-lg mt-0.5">{value}</div>
  </div>
);

const Th: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({ children, align = 'left' }) => (
  <th className={`px-4 py-3 font-semibold text-${align}`}>{children}</th>
);

const Td: React.FC<{
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, align = 'left', className, style }) => (
  <td className={`px-4 py-3 text-${align} ${className ?? ''}`} style={style}>{children}</td>
);
