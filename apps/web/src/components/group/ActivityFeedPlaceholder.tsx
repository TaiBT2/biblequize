import { useTranslation } from 'react-i18next';

// GD-FIX-6 — even though the feed itself is deferred to BL-17 (Sprint 6),
// the filter chip row is rendered now (active "Tất cả" + 3 disabled
// chips for Quiz / Live / Tin) so member viewers preview the future IA.
const FILTERS: Array<{ key: 'all' | 'quiz' | 'live' | 'news'; icon: string }> = [
  { key: 'all', icon: '' },
  { key: 'quiz', icon: '📚' },
  { key: 'live', icon: '🎮' },
  { key: 'news', icon: '📢' },
];

export default function ActivityFeedPlaceholder() {
  const { t } = useTranslation();
  return (
    <div data-testid="group-activity-feed-placeholder">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-[11px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <span>📜</span>
          <span>{t('groups.activity.feedTitle')}</span>
        </h2>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => {
            const active = f.key === 'all';
            return (
              <button
                key={f.key}
                disabled={!active}
                aria-disabled={!active || undefined}
                title={active ? undefined : t('groups.activity.filterDisabled')}
                data-testid={`activity-filter-${f.key}`}
                className={`text-[10px] px-2 py-1 rounded-full font-semibold border transition-colors ${
                  active
                    ? 'bg-[rgba(232,168,50,0.15)] text-secondary border-[rgba(232,168,50,0.4)]'
                    : 'bg-[rgba(50,52,64,0.3)] text-on-surface/55 border-white/10 opacity-60 cursor-not-allowed'
                }`}
              >
                {f.icon ? <span className="mr-1">{f.icon}</span> : null}
                {t(`groups.activity.filter.${f.key}`)}
              </button>
            );
          })}
        </div>
      </div>
      <div
        className="bg-[rgba(50,52,64,0.3)] rounded-2xl p-8 text-center border border-dashed border-white/10"
      >
        <div className="text-5xl mb-3 opacity-40">📜</div>
        <h3 className="text-on-surface font-bold mb-1 text-sm">
          {t('groups.activity.placeholder.title')}
        </h3>
        <p className="text-[12px] text-on-surface/55 max-w-md mx-auto">
          {t('groups.activity.placeholder.desc')}
        </p>
        <div className="mt-3 text-[10px] text-on-surface/40 uppercase tracking-wider">
          {t('groups.activity.placeholder.sprint')}
        </div>
      </div>
    </div>
  );
}
