import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setQuizLanguage, type QuizLanguage } from '../utils/quizLanguage'
import { useOnboardingStore } from '../store/onboardingStore'

const SLIDES = [
  { icon: '✝️', titleKey: 'onboarding.slide1Title', descKey: 'onboarding.slide1Desc', color: '#e8a832' },
  { icon: '⚔️', titleKey: 'onboarding.slide2Title', descKey: 'onboarding.slide2Desc', color: '#3b82f6' },
  { icon: '🗺️', titleKey: 'onboarding.slide3Title', descKey: 'onboarding.slide3Desc', color: '#22c55e' },
]

export default function Onboarding() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { setHasSeenOnboarding, setLanguage } = useOnboardingStore()
  const [step, setStep] = useState<'language' | 'slides'>('language')
  const [currentSlide, setCurrentSlide] = useState(0)

  const selectLanguage = (lang: QuizLanguage) => {
    setLanguage(lang)
    setQuizLanguage(lang)
    i18n.changeLanguage(lang)
    setStep('slides')
  }

  const finish = () => {
    setHasSeenOnboarding(true)
    navigate('/onboarding/try')
  }

  const skip = () => {
    setHasSeenOnboarding(true)
    navigate('/login')
  }

  if (step === 'language') {
    return (
      <div className="min-h-screen bg-[#11131e] flex flex-col items-center justify-center p-8">
        {/* Logo */}
        <h1 className="text-3xl font-black text-secondary tracking-tighter mb-16 font-headline">BibleQuiz</h1>

        <p className="text-lg text-on-surface/60 mb-1">Choose your language</p>
        <p className="text-lg text-on-surface/60 mb-10">{t('onboarding.chooseLanguage')}</p>

        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={() => selectLanguage('vi')}
            className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl bg-on-surface/5 border border-on-surface/10 hover:border-secondary/40 hover:bg-secondary/10 transition-all"
          >
            <span className="text-3xl">🇻🇳</span>
            <span className="text-on-surface font-semibold text-lg">Tiếng Việt</span>
          </button>
          <button
            onClick={() => selectLanguage('en')}
            className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl bg-on-surface/5 border border-on-surface/10 hover:border-secondary/40 hover:bg-secondary/10 transition-all"
          >
            <span className="text-3xl">🇬🇧</span>
            <span className="text-on-surface font-semibold text-lg">English</span>
          </button>
        </div>

        <p className="text-sm text-on-surface/40 mt-10 text-center">
          {t('onboarding.changeLanguageLater', { defaultValue: 'You can change this later in settings' })}
        </p>
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
        <div className="relative mb-12">
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-15"
            style={{ backgroundColor: slide.color }}
          />
          <span className="text-8xl relative z-10 block">{slide.icon}</span>
        </div>
        <h2 className="text-3xl font-bold text-on-surface mb-4 font-headline">{t(slide.titleKey)}</h2>
        <p className="text-on-surface-variant text-lg leading-relaxed">{t(slide.descKey)}</p>
      </div>

      {/* Dots + navigation */}
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-8 bg-secondary' : 'w-2 bg-on-surface-variant/30'
              }`}
            />
          ))}
        </div>

        {isLast ? (
          <button
            onClick={finish}
            className="w-full gold-gradient text-on-secondary py-4 rounded-xl font-bold text-lg active:scale-[0.98] transition-transform"
          >
            {t('onboarding.start')}
          </button>
        ) : (
          <button
            onClick={() => setCurrentSlide(currentSlide + 1)}
            className="w-full bg-surface-container-high text-on-surface py-4 rounded-xl font-semibold border border-outline-variant/20 hover:border-secondary/30 transition-colors active:scale-[0.98]"
          >
            {t('common.next')}
          </button>
        )}
      </div>
    </div>
  )
}
