import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FILL_STYLE, type Achievement } from './types'
import { SkeletonBlock } from './SkeletonBlock'

type BadgeTab = 'all' | 'unlocked' | 'locked'

export function BadgeCollection({ achievements, loading }: { achievements: Achievement[]; loading: boolean }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<BadgeTab>('all')

  const unlockedCount = achievements.filter(a => a.unlockedAt).length
  const lockedCount = achievements.length - unlockedCount

  const filtered = useMemo(() => {
    if (tab === 'unlocked') return achievements.filter(a => a.unlockedAt)
    if (tab === 'locked') return achievements.filter(a => !a.unlockedAt)
    return achievements
  }, [achievements, tab])

  return (
    <section data-testid="profile-badges-section" className="bg-bq-white border border-bq-hair shadow-bq-soft rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-sm font-bold uppercase tracking-wider text-bq-ink inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-bq-amberd">workspace_premium</span>
          {t('profile.badgeCollection')}
        </h2>
        <Link to="/achievements" className="text-xs font-semibold text-bq-amberd hover:underline">
          {t('profile.badgeViewAll', { n: achievements.length })} →
        </Link>
      </div>

      <div className="flex gap-1.5 mb-4">
        {([
          { id: 'all' as const, label: t('profile.badgeTabAll'), count: achievements.length },
          { id: 'unlocked' as const, label: t('profile.badgeTabUnlocked'), count: unlockedCount },
          { id: 'locked' as const, label: t('profile.badgeTabLocked'), count: lockedCount },
        ]).map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? 'px-3.5 py-1.5 rounded-full bg-bq-amber/15 border border-bq-amber/30 text-xs font-semibold text-bq-amberd'
                : 'px-3.5 py-1.5 rounded-full bg-bq-inset border border-bq-hair text-xs font-semibold text-bq-ink2 hover:text-bq-ink'
            }
          >
            {item.label} <span className="opacity-70 ml-0.5">{item.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <SkeletonBlock key={i} className="h-32" />)}
        </div>
      ) : achievements.length === 0 ? (
        <p className="text-bq-ink2 text-center py-8">{t('profile.noBadges')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {filtered.map(a => <BadgeTile key={a.id} achievement={a} />)}
        </div>
      )}
    </section>
  )
}

function BadgeTile({ achievement }: { achievement: Achievement }) {
  const unlocked = !!achievement.unlockedAt
  return (
    <div
      className={
        unlocked
          ? 'relative aspect-square rounded-2xl p-3 flex flex-col items-center justify-center text-center bg-gradient-to-b from-bq-amber/10 to-bq-amber/[0.02] border border-bq-amber/25 hover:-translate-y-0.5 transition-transform'
          : 'relative aspect-square rounded-2xl p-3 flex flex-col items-center justify-center text-center bg-bq-inset border border-bq-hair'
      }
    >
      {!unlocked && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-bq-ink/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[10px] text-bq-ink3">lock</span>
        </div>
      )}
      <div
        className={
          unlocked
            ? 'w-11 h-11 rounded-full mb-2 flex items-center justify-center bg-bq-amber/20 text-bq-amberd'
            : 'w-11 h-11 rounded-full mb-2 flex items-center justify-center bg-bq-inset text-bq-ink3'
        }
      >
        <span className="material-symbols-outlined text-2xl" style={unlocked ? FILL_STYLE : undefined}>
          {achievement.icon || 'emoji_events'}
        </span>
      </div>
      <p className={`text-[11px] font-bold ${unlocked ? 'text-bq-ink' : 'text-bq-ink3'}`}>{achievement.name}</p>
      <p className="text-[9px] text-bq-ink2 mt-0.5 leading-tight line-clamp-2">{achievement.description}</p>
    </div>
  )
}
