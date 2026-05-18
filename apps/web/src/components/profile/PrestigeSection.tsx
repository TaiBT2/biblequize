import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { SkeletonBlock } from './SkeletonBlock'

export function PrestigeSection() {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useQuery<{
    canPrestige: boolean; prestigeLevel: number; daysAtTier6: number
    daysRequired: number; nextPrestigeName: string | null
  }>({
    queryKey: ['prestige-status'],
    queryFn: () => api.get('/api/me/prestige-status').then(r => r.data),
    staleTime: 60_000,
  })

  if (isLoading) return <SkeletonBlock className="h-32" />
  if (isError || !data) return null
  const { prestigeLevel, daysAtTier6, daysRequired, canPrestige, nextPrestigeName } = data
  const progress = Math.min(100, (daysAtTier6 / daysRequired) * 100)

  return (
    <section data-testid="profile-prestige-section" className="rounded-2xl p-5 md:p-6 bg-gradient-to-br from-secondary/[0.08] to-purple-500/[0.05] border border-secondary/20 flex flex-col sm:flex-row items-start sm:items-center gap-5">
      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/15 to-purple-500/10 border border-secondary/30 flex items-center justify-center shrink-0">
        <span className="text-[32px]">👑</span>
        {!canPrestige && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-secondary/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">lock</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-[15px] font-bold text-on-surface inline-flex items-center gap-2">
          {t('profile.prestigeTitle')}
          {prestigeLevel > 0 && <span className="text-sm text-secondary font-bold">P{prestigeLevel}</span>}
        </h2>
        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
          {t('profile.prestigeFullDescription')}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-bold">P{prestigeLevel}</span>
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-secondary to-purple-400" style={{ width: `${progress}%` }} />
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-on-surface-variant text-[10px] font-bold">P{prestigeLevel + 1}</span>
        </div>
        <p className="text-[11px] text-on-surface-variant mt-2">
          <span data-testid="profile-days-at-tier6" className="font-bold text-on-surface">{daysAtTier6}</span>/{daysRequired} {t('profile.prestigeDaysLabel').toLowerCase()}
        </p>
        {canPrestige && nextPrestigeName && (
          <Link to="/cosmetics" className="inline-flex mt-3 px-3 py-1.5 rounded-lg gold-gradient text-on-secondary text-xs font-bold">
            {t('profile.prestigeEligibleTitle')}
          </Link>
        )}
      </div>
    </section>
  )
}
