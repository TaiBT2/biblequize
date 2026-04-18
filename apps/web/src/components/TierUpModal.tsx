import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { soundManager } from '../services/soundManager'
import { haptic } from '../utils/haptics'

interface TierUpModalProps {
  tierName: string
  tierIcon: string
  tierColor: string
  xpMultiplier?: number
  energyRegen?: number
  unlockedMode?: string
  onClose: () => void
}

export default function TierUpModal({
  tierName, tierIcon, tierColor, xpMultiplier, energyRegen, unlockedMode, onClose
}: TierUpModalProps) {
  const { t } = useTranslation()

  useEffect(() => {
    soundManager.play('tierUp')
    haptic.tierUp()
  }, [])

  return (
    <div data-testid="tier-up-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center space-y-6 max-w-md mx-4">
        {/* Tier icon */}
        <div className="grade-reveal-anim">
          <span className="text-7xl block mb-2">{tierIcon}</span>
        </div>

        {/* Congratulations */}
        <div className="grade-reveal-anim" style={{ animationDelay: '0.3s' }}>
          <h1 className="text-3xl font-black text-secondary">{t('modals.tierUp.congratulations')}</h1>
          <h2 className={`text-2xl font-bold mt-2 ${tierColor}`}>
            {t('modals.tierUp.reachedTier', { tier: tierName })}
          </h2>
        </div>

        {/* New rewards */}
        <div className="space-y-2 xp-float-anim" style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}>
          {xpMultiplier && (
            <p className="text-emerald-400 font-bold">{t('modals.tierUp.xpMultiplier', { count: xpMultiplier })}</p>
          )}
          {energyRegen && (
            <p className="text-emerald-400 font-bold">{t('modals.tierUp.energyRegen', { count: energyRegen })}</p>
          )}
          {unlockedMode && (
            <p className="text-yellow-400 font-bold">{t('modals.tierUp.unlockedMode', { mode: unlockedMode })}</p>
          )}
        </div>

        {/* Continue button */}
        <button
          onClick={onClose}
          className="mt-8 px-8 py-3 gold-gradient text-on-secondary font-black rounded-xl shadow-xl active:scale-95 transition-transform"
        >
          {t('modals.tierUp.continueButton')}
        </button>
      </div>
    </div>
  )
}
