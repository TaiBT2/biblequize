import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const TIPS = [
  { targetId: 'game-mode-daily', messageKey: 'onboarding.tutorialDaily' },
  { targetId: 'game-mode-ranked', messageKey: 'onboarding.tutorialStreak' },
  { targetId: 'game-mode-practice', messageKey: 'onboarding.tutorialModes' },
]

export default function TutorialOverlay() {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem('hasDoneTutorial')
    if (!done) setVisible(true)
  }, [])

  if (!visible || step >= TIPS.length) return null

  const tip = TIPS[step]

  const advance = () => {
    if (step >= TIPS.length - 1) {
      localStorage.setItem('hasDoneTutorial', 'true')
      setVisible(false)
    } else {
      setStep(step + 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[60]" onClick={advance}>
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Tooltip */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 max-w-sm w-full px-4">
        <div className="glass-card p-4 text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-on-surface font-medium mb-3">{t(tip.messageKey)}</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant">{step + 1}/{TIPS.length}</span>
            <button
              onClick={advance}
              className="gold-gradient text-on-secondary px-4 py-1.5 rounded-lg text-sm font-bold"
            >
              {t('onboarding.tutorialGotIt')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
