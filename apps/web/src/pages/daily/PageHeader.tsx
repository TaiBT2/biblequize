import { useTranslation } from 'react-i18next'

interface PageHeaderProps {
  todayLabel: string
  countdown: string
  seasonName?: string
}

export function PageHeader({ todayLabel, countdown, seasonName }: PageHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-start justify-between gap-5 flex-wrap mb-6">
      <div className="flex-1 min-w-[280px]">
        <h2 className="text-[22px] md:text-3xl font-extrabold tracking-tight mb-2 flex items-center gap-2.5 md:gap-3 whitespace-nowrap">
          <span className="w-9 h-9 md:w-10 md:h-10 rounded-[10px] bg-gradient-to-br from-[#ef4444] to-[#f97316] grid place-items-center text-[20px] md:text-[22px] text-white shadow-[0_4px_16px_rgba(239,68,68,0.3)] shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          </span>
          {t('daily.title')}
        </h2>
        <div className="flex gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-[rgba(50,52,64,0.5)] border border-white/5 text-xs text-on-surface-variant font-semibold">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            {todayLabel}
          </span>
          {seasonName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-gradient-to-br from-[rgba(239,68,68,0.15)] to-[rgba(249,115,22,0.1)] border border-[rgba(239,68,68,0.3)] text-xs text-[#f87171] font-semibold">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <strong className="text-[#fca5a5]">{seasonName}</strong>
            </span>
          )}
        </div>
      </div>
      <div
        data-testid="daily-countdown"
        className="bg-[rgba(50,52,64,0.4)] backdrop-blur-md border border-[rgba(232,168,50,0.25)] rounded-2xl px-[18px] py-3 text-center shadow-[0_4px_20px_rgba(232,168,50,0.08)]"
      >
        <div className="text-[10px] text-on-surface-variant uppercase tracking-[1.2px] font-bold">
          {t('daily.refreshIn')}
        </div>
        <div className="text-[22px] font-extrabold text-secondary tabular-nums tracking-[1px] mt-0.5">
          {countdown}
        </div>
        <div className="text-[10px] text-on-surface-variant/60 mt-0.5">{t('daily.utcResetHint')}</div>
      </div>
    </div>
  )
}
