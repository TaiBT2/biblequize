import React from 'react'
import { useTranslation } from 'react-i18next'
import { TIERS } from '../../data/tiers'

export function TierProgressCard({ currentTier, nextTier, tierProgress, currentStreak }: {
  currentTier: typeof TIERS[number]
  nextTier: typeof TIERS[number] | null
  tierProgress: {
    currentTierName: string
    nextTierName: string
    currentExp: number
    nextTierExp: number
    progressPercent: number
    expRemaining: number
  }
  currentStreak: number
}) {
  const { t } = useTranslation()
  const starsFilled = Math.min(5, Math.floor(tierProgress.progressPercent / 20))
  const stars = [0, 1, 2, 3, 4].map(i => {
    if (i < starsFilled) return 'filled'
    if (i === starsFilled && tierProgress.progressPercent < 100) return 'current'
    return 'empty'
  })

  // ETA: rough heuristic — assume avg 50 EXP/day at current streak (no real data)
  const etaDays = nextTier && currentStreak > 0
    ? Math.ceil(tierProgress.expRemaining / Math.max(40, currentStreak * 20))
    : null

  return (
    <section data-testid="profile-tier-progress" className="bg-surface-container/60 backdrop-blur-sm border border-outline-variant/10 rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-outline to-outline-variant flex items-center justify-center text-[22px] border border-white/10 shrink-0">
            {currentTier.iconEmoji}
          </div>
          <div className="min-w-0">
            <p data-testid="profile-tier-current-name" className="text-base font-bold text-on-surface truncate">
              {t(currentTier.nameKey)}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {t('profile.tierCurrentSub', { n: currentTier.id })}
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-2xl text-white/20 hidden sm:block">arrow_forward</span>
        <div className="flex items-center gap-3 shrink-0">
          {nextTier ? (
            <>
              <div className="text-right">
                <p data-testid="profile-tier-next-name" className="text-[13px] font-semibold text-secondary">
                  {t(nextTier.nameKey)}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {t('profile.tierNextSub', { n: nextTier.id, exp: tierProgress.expRemaining.toLocaleString() })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-dashed border-secondary/40 flex items-center justify-center text-[22px] opacity-70">
                {nextTier.iconEmoji}
              </div>
            </>
          ) : (
            <span className="text-xs font-bold text-secondary uppercase">{t('profile.tierMaxLabel')}</span>
          )}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
          {t('profile.subStarsLabel', { n: starsFilled })}
        </p>
        <div className="flex items-center justify-between px-1">
          {stars.map((state, i) => (
            <div
              key={i}
              className={
                state === 'filled'
                  ? 'w-6 h-6 rounded-full gold-gradient text-on-secondary flex items-center justify-center text-[13px] shadow-[0_0_10px_rgba(232,168,50,0.4)]'
                  : state === 'current'
                  ? 'w-6 h-6 rounded-full bg-secondary/15 border border-secondary text-secondary flex items-center justify-center text-[13px] animate-pulse'
                  : 'w-6 h-6 rounded-full bg-white/5 border border-white/10 text-white/20 flex items-center justify-center text-[13px]'
              }
            >
              ★
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-5 mb-7">
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full gold-gradient rounded-full shadow-[0_0_10px_rgba(232,168,50,0.5)] relative"
            style={{ width: `${tierProgress.progressPercent}%` }}
          >
            {tierProgress.progressPercent > 0 && tierProgress.progressPercent < 100 && (
              <div className="absolute -right-0.5 -top-0.5 w-3.5 h-3.5 rounded-full bg-secondary border-2 border-background shadow-[0_0_12px_rgba(232,168,50,0.8)]" />
            )}
          </div>
        </div>
        {[50, 90].map(p => (
          <React.Fragment key={p}>
            <div className="absolute -top-0.5 w-0.5 h-3.5 bg-white/20 rounded" style={{ left: `${p}%` }} />
            <div
              className="absolute top-4 text-[9px] font-semibold uppercase tracking-wider text-white/40 -translate-x-1/2"
              style={{ left: `${p}%` }}
            >
              {p}%
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-3">
          <div data-testid="profile-tier-exp" className="text-xs text-on-surface-variant">
            <span className="text-lg font-extrabold text-secondary tracking-tight align-baseline">
              {`${tierProgress.currentExp.toLocaleString()} / ${tierProgress.nextTierExp.toLocaleString()}`}
            </span>
            <span className="ml-1">EXP</span>
          </div>
          {nextTier && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {etaDays != null ? t('profile.tierEta', { days: etaDays }) : t('profile.tierEtaUnknown')}
            </div>
          )}
        </div>
        {nextTier && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-xs font-semibold text-secondary self-start sm:self-auto">
            <span className="material-symbols-outlined text-[16px]">lock_open</span>
            {t('profile.tierUnlockNext')}: {t(nextTier.nameKey)}
          </div>
        )}
      </div>
    </section>
  )
}
