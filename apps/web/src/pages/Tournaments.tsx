import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

interface Tournament {
  id: string;
  name: string;
  status: 'REGISTRATION' | 'IN_PROGRESS' | 'COMPLETED';
  currentRound: number | null;
  participantCount: number;
  maxParticipants: number;
  createdAt: string;
  startAt: string | null;
  endAt: string | null;
}

function statusBadge(status: Tournament['status']) {
  switch (status) {
    case 'REGISTRATION':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-secondary/20 text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          Đăng ký
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/20 text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Đang diễn ra
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-on-surface-variant/20 text-on-surface-variant">
          Hoàn thành
        </span>
      );
    default:
      return null;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/* ─── Skeleton ─── */

function TournamentCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-48 bg-surface-container-highest rounded-lg" />
        <div className="h-5 w-20 bg-surface-container-highest rounded-full" />
      </div>
      <div className="flex items-center gap-6 mb-4">
        <div className="h-4 w-24 bg-surface-container-highest rounded" />
        <div className="h-4 w-32 bg-surface-container-highest rounded" />
      </div>
      <div className="h-10 w-32 bg-surface-container-highest rounded-xl" />
    </div>
  );
}

/* ─── Main ─── */

const Tournaments: React.FC = () => {
  const {
    data: tournaments,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Tournament[]>({
    queryKey: ['tournaments'],
    queryFn: () => api.get('/api/tournaments').then((r) => r.data),
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <section className="mb-10">
        <span className="text-secondary font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
          Sự Kiện Đặc Biệt
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-4">
          Giải Đấu
        </h1>
        <p className="text-on-surface-variant text-lg leading-relaxed max-w-2xl">
          Tham gia cùng hàng ngàn tín hữu trong cuộc đua tri thức Kinh Thánh đỉnh cao.
        </p>
      </section>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-6" data-testid="tournaments-skeleton">
          <TournamentCardSkeleton />
          <TournamentCardSkeleton />
          <TournamentCardSkeleton />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="glass-card rounded-2xl p-10 text-center" data-testid="tournaments-error">
          <span className="material-symbols-outlined text-5xl text-error mb-4 block">error</span>
          <p className="text-on-surface font-bold text-lg mb-2">Không thể tải danh sách giải đấu</p>
          <p className="text-on-surface-variant text-sm mb-6">
            {(error as Error)?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 gold-gradient text-on-secondary rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(232,168,50,0.3)] transition-all active:scale-95"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && tournaments && tournaments.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center" data-testid="tournaments-empty">
          <span
            className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            emoji_events
          </span>
          <p className="text-on-surface font-bold text-lg mb-2">Chưa có giải đấu nào</p>
          <p className="text-on-surface-variant text-sm">
            Các giải đấu sẽ được thông báo tại đây khi có sự kiện mới.
          </p>
        </div>
      )}

      {/* Tournament List */}
      {!isLoading && !isError && tournaments && tournaments.length > 0 && (
        <div className="space-y-6" data-testid="tournaments-list">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              to={`/tournaments/${t.id}`}
              className="block glass-card rounded-2xl p-6 hover:ring-1 hover:ring-secondary/30 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-black tracking-tight text-on-surface group-hover:text-secondary transition-colors">
                  {t.name}
                </h2>
                {statusBadge(t.status)}
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-on-surface-variant">
                {/* Participants */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-secondary">groups</span>
                  <span>
                    {t.participantCount}/{t.maxParticipants} thí sinh
                  </span>
                </div>

                {/* Current round */}
                {t.currentRound != null && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-secondary">
                      format_list_numbered
                    </span>
                    <span>Vòng {t.currentRound}</span>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-secondary">
                    calendar_month
                  </span>
                  <span>
                    {formatDate(t.startAt)}
                    {t.endAt ? ` — ${formatDate(t.endAt)}` : ''}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tournaments;
