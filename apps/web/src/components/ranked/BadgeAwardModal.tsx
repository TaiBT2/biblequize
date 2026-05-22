import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import type { UnshownBadge, BadgeTier } from '../../hooks/useCoverageStatus'

interface BadgeAwardModalProps {
  isOpen: boolean
  onClose: () => void
  badge: UnshownBadge
  onShare?: () => void
}

interface TierStyle {
  icon: string
  markSize: number
  glow: string
  gradientHeading: boolean
}

const TIER_STYLE: Record<BadgeTier, TierStyle> = {
  TOAN_THU: { icon: 'auto_stories', markSize: 120, glow: 'rgba(232,168,50,0.7)', gradientHeading: true },
  TAN_TAM: { icon: 'star', markSize: 100, glow: 'rgba(232,168,50,0.5)', gradientHeading: false },
  HANH_HUONG: { icon: 'volunteer_activism', markSize: 80, glow: 'rgba(232,168,50,0.3)', gradientHeading: false },
}

/** seasonId format: season-{year}-q{1-4}. Maps quarter → liturgical season key. */
const QUARTER_SEASON: Record<string, string> = {
  '1': 'EASTER', '2': 'PENTECOST', '3': 'THANKSGIVING', '4': 'CHRISTMAS',
}

function parseSeason(seasonId: string): { key: string; year: string } {
  const m = /^season-(\d{4})-q([1-4])$/.exec(seasonId)
  if (!m) return { key: 'EASTER', year: '' }
  return { key: QUARTER_SEASON[m[2]] ?? 'EASTER', year: m[1] }
}

/**
 * End-of-season badge ceremony (§7.1.8). 3-tier visual hierarchy:
 * Toàn Thư (66/66) > Tận Tâm (51-65) > Hành Hương (21-50).
 *
 * Triggered from Ranked.tsx when coverage-status carries an unshownBadge.
 * Closing calls POST /api/me/badges/{id}/mark-shown so it does not re-trigger.
 */
export default function BadgeAwardModal({ isOpen, onClose, badge, onShare }: BadgeAwardModalProps) {
  const { t } = useTranslation()
  const style = TIER_STYLE[badge.badgeTier]
  const tierName = t(`ranked.badge_award.tier_name.${badge.badgeTier}`)
  const verse = t(`ranked.badge_award.verses.${badge.badgeTier}`)
  const { key: seasonKey, year } = parseSeason(badge.seasonId)
  const seasonName = t(`ranked.badge_award.season_name.${seasonKey}`, { year })

  const stats: { value: string; label: string }[] = [
    { value: `${badge.booksCovered}`, label: t('ranked.badge_award.stats.books') },
    { value: badge.totalQuestions.toLocaleString(), label: t('ranked.badge_award.stats.questions') },
    { value: `${badge.accuracy}%`, label: t('ranked.badge_award.stats.accuracy') },
    { value: `${badge.daysActive}`, label: t('ranked.badge_award.stats.days') },
  ]

  const headingStyle: React.CSSProperties = style.gradientHeading
    ? {
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: 'italic',
        fontSize: 26,
        background: 'linear-gradient(135deg, #f3c969, #e8a832, #d4951f)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }
    : { fontSize: 22, fontWeight: 800, color: '#e8a832' }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" ariaLabel={tierName}>
      <div style={{ textAlign: 'center' }}>
        {/* Glowing badge mark */}
        <div
          style={{
            width: style.markSize, height: style.markSize, margin: '0 auto 12px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${style.glow} 0%, rgba(232,168,50,0) 70%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: style.markSize * 0.42, color: '#e8a832',
              fontVariationSettings: "'FILL' 1",
            }}
          >
            {style.icon}
          </span>
        </div>

        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: '#e8a832',
        }}>
          {t('ranked.badge_award.heading_sm')}
        </div>

        <h2 style={{ margin: '4px 0 2px', ...headingStyle }}>{tierName}</h2>

        <div style={{ fontSize: 13, color: '#8a8da0', marginBottom: 12 }}>{seasonName}</div>

        <p style={{
          fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
          fontSize: 16, color: '#c5c8d8', lineHeight: 1.4, margin: '0 0 16px',
        }}>
          {verse}
        </p>

        {/* 4-stat grid */}
        <div style={{ display: 'flex', gap: 8 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: 10,
                background: 'rgba(232,168,50,0.08)',
                border: '1px solid rgba(232,168,50,0.15)',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: '#e8a832' }}>{s.value}</div>
              <div style={{
                fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: '#8a8da0', marginTop: 2,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #e8a832, #d4951f)',
                color: '#11131e', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              }}
            >
              {t('ranked.badge_award.share_cta')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#c5c8d8', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t('ranked.badge_award.close_cta')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
