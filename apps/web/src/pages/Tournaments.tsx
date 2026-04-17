import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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

  function statusBadge(status: Tournament['status']) {
    switch (status) {
      case 'REGISTRATION':
        return (
          <span data-testid="tournament-status-badge" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-secondary/20 text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            {t('tournaments.statusRegistration')}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span data-testid="tournament-status-badge" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/20 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {t('tournaments.statusInProgress')}
          </span>
        );
      case 'COMPLETED':
        return (
          <span data-testid="tournament-status-badge" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-on-surface-variant/20 text-on-surface-variant">
            {t('tournaments.statusCompleted')}
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto" data-testid="tournaments-page">
      {/* Header */}
      <section className="mb-10">
        <span className="text-secondary font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
          {t('tournaments.specialEvent')}
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-4">
          {t('tournaments.title')}
        </h1>
        <p className="text-on-surface-variant text-lg leading-relaxed max-w-2xl">
          {t('tournaments.description')}
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
          <p className="text-on-surface font-bold text-lg mb-2">{t('tournaments.errorLoadList')}</p>
          <p className="text-on-surface-variant text-sm mb-6">
            {(error as Error)?.message || t('tournaments.errorGeneric')}
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 gold-gradient text-on-secondary rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(232,168,50,0.3)] transition-all active:scale-95"
          >
            {t('common.retry')}
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
          <p className="text-on-surface font-bold text-lg mb-2">{t('tournaments.noTournaments')}</p>
          <p className="text-on-surface-variant text-sm">
            {t('tournaments.noTournamentsDesc')}
          </p>
        </div>
      )}

      {/* Tournament List */}
      {!isLoading && !isError && tournaments && tournaments.length > 0 && (
        <div className="space-y-6" data-testid="tournaments-list">
          {tournaments.map((tItem) => (
            <Link
              key={tItem.id}
              to={`/tournaments/${tItem.id}`}
              data-testid="tournament-card"
              className="block glass-card rounded-2xl p-6 hover:ring-1 hover:ring-secondary/30 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-black tracking-tight text-on-surface group-hover:text-secondary transition-colors">
                  {tItem.name}
                </h2>
                {statusBadge(tItem.status)}
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-on-surface-variant">
                {/* Participants */}
                <div className="flex items-center gap-2" data-testid="tournament-participants-count">
                  <span className="material-symbols-outlined text-base text-secondary">groups</span>
                  <span>
                    {tItem.participantCount}/{tItem.maxParticipants} {t('tournaments.participants')}
                  </span>
                </div>

                {/* Current round */}
                {tItem.currentRound != null && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-secondary">
                      format_list_numbered
                    </span>
                    <span>{t('tournaments.round', { number: tItem.currentRound })}</span>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-secondary">
                    calendar_month
                  </span>
                  <span>
                    {formatDate(tItem.startAt)}
                    {tItem.endAt ? ` — ${formatDate(tItem.endAt)}` : ''}
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
