import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { TIERS } from '../../data/tiers'
import type { CosmeticResponse, UserProfile } from './types'
import { EditProfileModal } from './EditProfileModal'

// Map active cosmetic frame ID ("frame_tier3") to a hex color from the
// canonical tier palette. Returns null when the user has no frame set
// or the ID is unrecognised — caller falls back to the default
// secondary-tone border.
function activeFrameColor(activeFrame: string | null | undefined): string | null {
  if (!activeFrame) return null
  const match = activeFrame.match(/^frame_tier(\d)$/)
  if (!match) return null
  const tierId = Number(match[1])
  const tier = TIERS.find(t => t.id === tierId)
  return tier?.colorHex ?? null
}

export function HeroCompact({ profile, initial, tierEmoji, tierName, tierLevel }: {
  profile: UserProfile
  initial: string
  tierEmoji: string
  tierName: string
  tierLevel: number
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const { data: cosmetics } = useQuery<CosmeticResponse>({
    queryKey: ['profile-cosmetics'],
    queryFn: () => api.get('/api/me/cosmetics').then(r => r.data),
    staleTime: 5 * 60_000,
  })
  const frameColor = activeFrameColor(cosmetics?.activeFrame)
  return (
    <section className="relative overflow-hidden rounded-3xl border border-outline-variant/10 bg-gradient-to-br from-secondary/[0.08] to-surface-container/40 p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center gap-5">
      <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-gradient-radial from-secondary/10 to-transparent pointer-events-none" />

      <div className="relative shrink-0">
        <div
          data-testid="profile-avatar"
          data-cosmetic-frame={cosmetics?.activeFrame ?? undefined}
          className={`w-[88px] h-[88px] rounded-full overflow-hidden bg-gradient-to-br from-outline to-outline-variant flex items-center justify-center text-4xl font-extrabold text-white border-[3px] shadow-2xl ${frameColor ? '' : 'border-secondary/40'}`}
          style={frameColor ? { borderColor: frameColor, boxShadow: `0 0 18px ${frameColor}55, 0 10px 25px rgba(0,0,0,0.4)` } : undefined}
        >
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
          data-testid="profile-edit-btn"
          onClick={() => setEditing(true)}
          className="h-10 px-4 rounded-xl gold-gradient text-on-secondary text-sm font-semibold inline-flex items-center gap-1.5 hover:shadow-[0_6px_18px_rgba(232,168,50,0.3)] transition-shadow"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
          {t('profile.editProfile')}
        </button>
      </div>
      <EditProfileModal open={editing} onClose={() => setEditing(false)} profile={profile} />
    </section>
  )
}
