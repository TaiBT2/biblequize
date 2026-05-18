import { useTranslation } from 'react-i18next'
import type { UserProfile } from './types'

export function HeroCompact({ profile, initial, tierEmoji, tierName, tierLevel }: {
  profile: UserProfile
  initial: string
  tierEmoji: string
  tierName: string
  tierLevel: number
}) {
  const { t } = useTranslation()
  return (
    <section className="relative overflow-hidden rounded-3xl border border-outline-variant/10 bg-gradient-to-br from-secondary/[0.08] to-surface-container/40 p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center gap-5">
      <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-gradient-radial from-secondary/10 to-transparent pointer-events-none" />

      <div className="relative shrink-0">
        <div data-testid="profile-avatar" className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gradient-to-br from-outline to-outline-variant flex items-center justify-center text-4xl font-extrabold text-white border-[3px] border-secondary/40 shadow-2xl">
          {profile.avatarUrl ? (
            <img alt="User avatar" className="w-full h-full object-cover" src={profile.avatarUrl} />
          ) : initial}
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-base border-[3px] border-background">
          {tierEmoji}
        </div>
      </div>

      <div className="flex-1 min-w-0 relative">
        <h2 data-testid="profile-name" className="text-2xl md:text-[26px] font-extrabold text-on-surface tracking-tight truncate">
          {profile.name}
        </h2>
        <span data-testid="profile-tier-badge" className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-xs font-semibold text-secondary">
          <span>{tierEmoji}</span> {tierName} · {t('profile.tierLevelLabel', { n: tierLevel })}
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs text-on-surface-variant">
          <span data-testid="profile-email" className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">mail</span>
            {profile.email}
          </span>
          {profile.createdAt && (
            <span data-testid="profile-join-date" className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {t('profile.joinedOn')} {new Date(profile.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 relative shrink-0">
        <button
          aria-label={t('profile.share')}
          onClick={async () => {
            const url = window.location.href
            const text = t('profile.shareText', { name: profile.name, tier: tierName })
            if (typeof navigator !== 'undefined' && navigator.share) {
              try { await navigator.share({ title: t('profile.shareTitle'), text, url }); return } catch { /* user cancelled */ }
            }
            try { await navigator.clipboard.writeText(url) } catch { /* no-op */ }
          }}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-on-surface hover:bg-white/10 transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
        </button>
        <button
          disabled
          aria-disabled="true"
          title={t('profile.editProfileComingSoon')}
          className="h-10 px-4 rounded-xl gold-gradient text-on-secondary text-sm font-semibold inline-flex items-center gap-1.5 opacity-50 cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
          {t('profile.editProfile')}
        </button>
      </div>
    </section>
  )
}
