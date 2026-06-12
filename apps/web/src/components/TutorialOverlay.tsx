import { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOnboardingStore } from '../store/onboardingStore'

/** Each tip highlights a real Home element (by data-testid) and anchors the
 *  tooltip to it. Falls back to a centered tooltip when the target isn't on
 *  screen (e.g. unit tests, or a layout where the card is absent). */
const TIPS = [
  { targetTestId: 'featured-daily-card', messageKey: 'onboarding.tutorialDaily' },
  { targetTestId: 'ranked-standard-card', messageKey: 'onboarding.tutorialStreak' },
  { targetTestId: 'compact-card-practice', messageKey: 'onboarding.tutorialModes' },
]

interface Rect { top: number; left: number; width: number; height: number }

export default function TutorialOverlay() {
  const { t } = useTranslation()
  const { hasDoneTutorial, setHasDoneTutorial } = useOnboardingStore()
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  const done = hasDoneTutorial || step >= TIPS.length
  const tip = done ? null : TIPS[step]

  // Resolve + measure the current step's target. scrollIntoView so the
  // highlighted card is actually visible before we anchor to it.
  useLayoutEffect(() => {
    if (!tip) return
    let raf = 0
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-testid="${tip.targetTestId}"]`)
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      // jsdom / detached layout reports 0×0 — treat as "no anchor".
      setRect(r.width > 0 && r.height > 0
        ? { top: r.top, left: r.left, width: r.width, height: r.height }
        : null)
    }
    const el = document.querySelector<HTMLElement>(`[data-testid="${tip.targetTestId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Let the smooth scroll settle, then measure (and again on resize/scroll).
    raf = window.requestAnimationFrame(() => window.setTimeout(measure, 320))
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step, tip])

  if (!tip) return null

  const advance = () => {
    if (step >= TIPS.length - 1) setHasDoneTutorial(true)
    else { setStep(step + 1); setRect(null) }
  }

  // Anchor the tooltip below the target, flipping above when it would run off
  // the bottom of the viewport.
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const placeBelow = rect ? rect.top + rect.height + 180 < vh : true
  const tooltipStyle: React.CSSProperties | undefined = rect
    ? placeBelow
      ? { position: 'fixed', top: rect.top + rect.height + 12, left: '50%', transform: 'translateX(-50%)' }
      : { position: 'fixed', top: Math.max(12, rect.top - 12), left: '50%', transform: 'translate(-50%, -100%)' }
    : undefined

  return (
    <div className="fixed inset-0 z-[60]" onClick={advance}>
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Spotlight ring around the highlighted card */}
      {rect && (
        <div
          aria-hidden="true"
          className="fixed rounded-2xl pointer-events-none transition-all duration-200"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5), 0 0 0 2px #e8a832, 0 0 24px rgba(232,168,50,0.45)',
          }}
        />
      )}

      {/* Tooltip — anchored to the target, or centered as a fallback */}
      <div
        data-testid="tutorial-tooltip"
        className={rect ? 'max-w-sm w-[min(22rem,90vw)] px-4' : 'absolute bottom-32 left-1/2 -translate-x-1/2 max-w-sm w-full px-4'}
        style={tooltipStyle}
      >
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
