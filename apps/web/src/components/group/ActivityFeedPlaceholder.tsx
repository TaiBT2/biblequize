import { useTranslation } from 'react-i18next';

export default function ActivityFeedPlaceholder() {
  const { t } = useTranslation();
  return (
    <div
      data-testid="group-activity-feed-placeholder"
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
  );
}
