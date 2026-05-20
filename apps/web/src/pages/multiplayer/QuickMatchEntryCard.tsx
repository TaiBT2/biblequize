// QP-6 — Hero RIGHT card (indigo) — Đấu Nhanh entry point.
// Renamed via `git mv SoloArenaEntryCard.tsx` to preserve history per
// PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT.md. Click → opens
// QuickMatchConfigModal (QP-6.5). Daily quota indicator wired to
// /api/me/multiplayer-stats response (QP-4 quickMatchRemainingToday).

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import QuickMatchConfigModal from './QuickMatchConfigModal'

const QM = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryLighter: '#a5b4fc',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
  tintBg: 'rgba(99,102,241,0.12)',
  tintBgSoft: 'rgba(99,102,241,0.04)',
  tintBorder: 'rgba(99,102,241,0.25)',
}

interface Props {
  /** Current user tier — used to gate AI source in the config modal. */
  userTier?: number
}

interface MultiplayerStats { quickMatchRemainingToday?: number }

export default function QuickMatchEntryCard({ userTier = 1 }: Props) {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const { data } = useQuery<MultiplayerStats>({
    queryKey: ['multiplayer-stats', 'weekly'],
    queryFn: () => api.get('/api/me/multiplayer-stats', { params: { period: 'weekly' } }).then(r => r.data),
    staleTime: 30_000,
    retry: 1,
  })
  const remaining = data?.quickMatchRemainingToday ?? 3
  const used = Math.max(0, 3 - remaining)
  const exhausted = remaining <= 0

  return (
    <>
      <div
        className="rounded-2xl p-6 relative overflow-hidden transition-transform"
        style={{
          background: `linear-gradient(135deg, ${QM.tintBg} 0%, ${QM.tintBgSoft} 100%)`,
          border: `1px solid ${QM.tintBorder}`,
          boxShadow: `0 0 24px -8px ${QM.tintBorder}`,
        }}
      >
        <div
          className="absolute -right-12 -top-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
        />

        {/* MỚI badge with shimmer */}
        <div
          className="absolute top-5 right-5 flex items-center gap-1 px-2 py-1 rounded-md"
          style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}
        >
          <span
            className="material-symbols-outlined animate-pulse"
            style={{ fontSize: 12, color: QM.primaryLight, fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: QM.primaryLighter }}>
            {t('multiplayer.quickMatch.badgeNew')}
          </span>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: QM.gradient }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff', fontVariationSettings: "'FILL' 1" }}>
                rocket_launch
              </span>
            </div>
            <div className="text-[10px] tracking-widest uppercase font-bold" style={{ color: QM.primaryLighter }}>
              {t('multiplayer.quickMatch.kicker')}
            </div>
          </div>

          <h2 className="text-[20px] font-extrabold mb-1.5 leading-tight text-white">{t('multiplayer.quickMatch.title')}</h2>
          <p className="text-[12.5px] text-white/65 mb-4 leading-relaxed">
            {t('multiplayer.quickMatch.desc1')}{' '}
            <span dangerouslySetInnerHTML={{ __html: t('multiplayer.quickMatch.desc2') }} />
          </p>

          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <Tag icon="tune" label={t('multiplayer.quickMatch.tagBookScope')} />
            <Tag icon="group" label={t('multiplayer.quickMatch.tagPlayers')} />
            <Tag icon="casino" label={t('multiplayer.quickMatch.tagSource')} />
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={exhausted}
            className="w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: QM.gradient }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rocket_launch</span>
            {exhausted ? t('multiplayer.quickMatch.ctaExhausted') : t('multiplayer.quickMatch.cta')}
            {!exhausted && (
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            )}
          </button>

          <div className="flex items-center justify-between mt-2.5 text-[10px]">
            <span className="text-white/40" dangerouslySetInnerHTML={{
              __html: t('multiplayer.quickMatch.today', { used }),
            }} />
            <span className="text-white/40">{t('multiplayer.quickMatch.noXp')}</span>
          </div>
        </div>
      </div>

      <QuickMatchConfigModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userTier={userTier}
      />
    </>
  )
}

function Tag({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      className="px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1"
      style={{
        background: 'rgba(99,102,241,0.1)',
        border: '1px solid rgba(99,102,241,0.2)',
        color: '#a5b4fc',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{icon}</span>
      {label}
    </span>
  )
}
