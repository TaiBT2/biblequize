import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setQuizLanguage, type QuizLanguage } from '../utils/quizLanguage'

const SLIDES = [
  { icon: '✝️', titleKey: 'onboarding.slide1Title', descKey: 'onboarding.slide1Desc', color: '#e8a832' },
  { icon: '⚔️', titleKey: 'onboarding.slide2Title', descKey: 'onboarding.slide2Desc', color: '#3b82f6' },
  { icon: '🗺️', titleKey: 'onboarding.slide3Title', descKey: 'onboarding.slide3Desc', color: '#22c55e' },
]

export default function Onboarding() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'language' | 'slides'>('language')
  const [currentSlide, setCurrentSlide] = useState(0)

  const selectLanguage = (lang: QuizLanguage) => {
    setQuizLanguage(lang)
    i18n.changeLanguage(lang)
    setStep('slides')
  }

  const finish = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    navigate('/onboarding/try')
  }

  const skip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    navigate('/login')
  }

  if (step === 'language') {
    return (
      <div className="min-h-screen bg-[#11131e] flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold text-on-surface mb-2">Choose your language</h1>
        <p className="text-on-surface-variant mb-8">{t('onboarding.chooseLanguage')}</p>
        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={() => selectLanguage('vi')}
            className="w-full flex items-center gap-3 px-6 py-4 rounded-xl bg-surface-container border border-outline-variant/20 hover:border-secondary/40 transition-colors"
          >
            <span className="text-2xl">🇻🇳</span>
            <span className="text-on-surface font-semibold">Tiếng Việt</span>
          </button>
          <button
            onClick={() => selectLanguage('en')}
            className="w-full flex items-center gap-3 px-6 py-4 rounded-xl bg-surface-container border border-outline-variant/20 hover:border-secondary/40 transition-colors"
          >
            <span className="text-2xl">🇬🇧</span>
            <span className="text-on-surface font-semibold">English</span>
          </button>
        </div>
      </div>
    )
  }

  const slide = SLIDES[currentSlide]
  const isLast = currentSlide === SLIDES.length - 1

  return (
    <div className="min-h-screen bg-[#11131e] flex flex-col items-center justify-between p-8">
      {/* Skip button */}
      <div className="w-full flex justify-end">
        <button onClick={skip} className="text-sm text-on-surface-variant hover:text-secondary transition-colors">
          {t('onboarding.skip')}
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md">
        <span className="text-7xl mb-8" style={{ filter: `drop-shadow(0 0 30px ${slide.color}40)` }}>
          {slide.icon}
        </span>
        <h2 className="text-2xl font-bold text-on-surface mb-3">{t(slide.titleKey)}</h2>
        <p className="text-on-surface-variant text-lg">{t(slide.descKey)}</p>
      </div>

      {/* Dots + navigation */}
      <div className="w-full max-w-md space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === currentSlide ? 'w-8 bg-secondary' : 'w-2 bg-on-surface-variant/30'
              }`}
            />
          ))}
        </div>

        {/* Button */}
        {isLast ? (
          <button
            onClick={finish}
            className="w-full gold-gradient text-on-secondary py-3 rounded-xl font-bold text-lg"
          >
            {t('onboarding.start')}
          </button>
        ) : (
          <button
            onClick={() => setCurrentSlide(currentSlide + 1)}
            className="w-full bg-surface-container-high text-on-surface py-3 rounded-xl font-semibold border border-outline-variant/20 hover:border-secondary/30 transition-colors"
          >
            {t('common.next')}
          </button>
        )}
      </div>
    </div>
  )
}
