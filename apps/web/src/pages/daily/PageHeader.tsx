import { useTranslation } from 'react-i18next'

interface PageHeaderProps {
  todayLabel: string
  seasonName?: string
}

export function PageHeader({ todayLabel, seasonName }: PageHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="mb-6">
      <h1 className="font-display text-[22px] md:text-3xl font-extrabold tracking-tight mb-2 flex items-center gap-2.5 md:gap-3 text-bq-ink">
        <span className="w-9 h-9 md:w-10 md:h-10 rounded-[10px] bg-bq-flame grid place-items-center text-[20px] md:text-[22px] text-white shadow-bq-flame shrink-0">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
        </span>
        {t('daily.heading')}
      </h1>
      <div className="flex gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-bq-white border border-bq-hair text-xs text-bq-ink2 font-semibold">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          {todayLabel}
        </span>
        {seasonName && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-bq-amber/10 border border-bq-amber/30 text-xs text-bq-amberd font-semibold">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <strong className="text-bq-amberd">{seasonName}</strong>
          </span>
        )}
      </div>
    </div>
  )
}
