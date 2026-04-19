import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * Celebration modal shown the FIRST TIME a user crosses the Early Ranked
 * unlock threshold (Practice ≥80% over 10+ answers). Fires exactly once
 * per unlock event — the parent owns the {@code shouldCelebrate} flag
 * (see {@link ../hooks/useEarlyUnlockCelebration} for the dedupe logic).
 *
 * <p>Interaction:
 * <ul>
 *   <li>Primary CTA → navigates to /ranked and dismisses</li>
 *   <li>Secondary CTA → stays on page, dismisses</li>
 *   <li>Backdrop click → dismisses (same as secondary)</li>
 * </ul>
 *
 * <p>Visual language matches {@code ComebackModal} — surface-container
 * card, 🏆 hero, gold-gradient primary button.
 */
export interface EarlyRankedUnlockModalProps {
  /** Whether to render the modal. Parent owns this state. */
  open: boolean
  /** Practice accuracy % at moment of unlock (for stats blurb). Optional. */
  accuracyPct?: number
  /** Called when user closes the modal (any action). */
  onDismiss: () => void
}

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

export default function EarlyRankedUnlockModal({
  open,
  accuracyPct,
  onDismiss,
}: EarlyRankedUnlockModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!open) return null

  const handlePlayRanked = () => {
    onDismiss()
    navigate('/ranked')
  }

  return (
    <div
      data-testid="early-unlock-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="bg-surface-container rounded-2xl p-8 max-w-md w-full mx-4 border border-secondary/30 shadow-2xl text-center space-y-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy */}
        <div className="relative z-10 flex justify-center">
          <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center shadow-[0_0_32px_rgba(232,168,50,0.5)]">
            <span className="material-symbols-outlined text-5xl text-on-secondary" style={FILL_1}>
              emoji_events
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h2 data-testid="early-unlock-title" className="text-2xl font-black text-on-surface mb-2">
            {t('modals.earlyUnlock.title')}
          </h2>
          <p className="text-base font-bold text-secondary mb-3">
            {t('modals.earlyUnlock.subtitle')}
          </p>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {accuracyPct != null
              ? t('modals.earlyUnlock.descriptionWithPct', { pct: accuracyPct })
              : t('modals.earlyUnlock.description')}
          </p>
        </div>

        {/* Achievement highlight */}
        <div className="relative z-10 bg-secondary/10 border border-secondary/20 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-secondary text-sm" style={FILL_1}>military_tech</span>
            <p className="text-xs font-black text-secondary uppercase tracking-widest">
              {t('modals.earlyUnlock.badgeLabel')}
            </p>
          </div>
          <p className="text-[11px] text-on-surface-variant font-medium">
            {t('modals.earlyUnlock.badgeHint')}
          </p>
        </div>

        {/* Actions */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3">
          <button
            data-testid="early-unlock-continue-btn"
            onClick={onDismiss}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-on-surface-variant bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-colors"
          >
            {t('modals.earlyUnlock.continuePracticeBtn')}
          </button>
          <button
            data-testid="early-unlock-play-btn"
            onClick={handlePlayRanked}
            className="flex-1 px-4 py-2.5 text-sm font-black text-on-secondary gold-gradient rounded-xl hover:opacity-90 transition-opacity"
          >
            {t('modals.earlyUnlock.playRankedBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
