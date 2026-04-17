import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setQuizLanguage, type QuizLanguage } from '../utils/quizLanguage'
import { useOnboardingStore } from '../store/onboardingStore'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

export default function Onboarding() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { setHasSeenOnboarding, setLanguage } = useOnboardingStore()
  const [step, setStep] = useState(0) // 0=language, 1-3=slides

  const selectLanguage = (lang: QuizLanguage) => {
    setLanguage(lang)
    setQuizLanguage(lang)
    i18n.changeLanguage(lang)
    setStep(1)
  }

  const finish = () => {
    setHasSeenOnboarding(true)
    navigate('/onboarding/try')
  }

  const skip = () => {
    setHasSeenOnboarding(true)
    navigate('/login')
  }

  const nextSlide = () => {
    if (step < 3) setStep(step + 1)
    else finish()
  }

  /* ── Screen 1: Language Selection ── */
  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#11131e] flex flex-col">
        {/* Nav */}
        <nav className="flex justify-between items-center w-full px-8 py-4">
          <span className="text-xl font-bold text-[#f8bd45] uppercase tracking-[0.05em]">BibleQuiz</span>
          <div className="flex items-center gap-4">
            <button onClick={skip} className="text-[#e1e1f1] opacity-70 hover:text-[#f8bd45] transition-colors text-sm">Skip</button>
            <button onClick={() => navigate('/login')} className="gold-gradient text-on-secondary px-6 py-2 rounded-xl text-sm font-bold">Login</button>
          </div>
        </nav>

        {/* Main */}
        <main className="flex-grow flex items-center justify-center w-full px-4" style={{ background: 'radial-gradient(circle at center, rgba(248,189,69,0.08) 0%, rgba(17,19,30,1) 70%)' }}>
          <div className="max-w-[600px] w-full text-center space-y-12 py-12">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight" style={{ background: 'linear-gradient(to right, #f8bd45, #e7c268)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Chào mừng / Welcome
              </h1>
              <p className="text-on-surface-variant text-lg tracking-wide opacity-80">
                Choose your language to begin / Chọn ngôn ngữ để bắt đầu
              </p>
            </div>

            {/* Language cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                data-testid="onboarding-lang-vi"
                onClick={() => selectLanguage('vi')}
                className="glass-card p-10 rounded-xl group cursor-pointer border border-outline-variant/15 hover:border-secondary/50 transition-all duration-500 flex flex-col items-center space-y-6"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-2xl group-hover:scale-110 transition-transform duration-500 ring-2 ring-secondary/20">
                  <img alt="Flag of Vietnam" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDihXdQrvykTTGHwD-v83EmOX7ysb4sPtX03DQ0GEmYXstxBuN1PEvvQmshz36350XSESu4pN4GoHz8wwx4dHdaCs75JLnRauirsUXGlPyGCvvXV06Q4DNfwEFEf4y6qwBzKBV92HK0r-OLee6Gz0ouKdFRCMhKuUhvlKH6xQ8Fx9WHNmd_VbsRwiXJP38Co8QxRLguFU2gX29lFzh9Pc0_-zdKBTecRG6bludlvacDG7qlGsEHR3mm2Mv8pAj7judp4MpjC4N7n3c" />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-on-surface">Tiếng Việt</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-secondary/70 font-semibold">Vietnamese</p>
                </div>
                <div className="w-8 h-8 rounded-full border border-secondary/30 flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                  <span className="material-symbols-outlined text-sm" style={FILL_1}>chevron_right</span>
                </div>
              </button>

              <button
                onClick={() => selectLanguage('en')}
                className="glass-card p-10 rounded-xl group cursor-pointer border border-outline-variant/15 hover:border-secondary/50 transition-all duration-500 flex flex-col items-center space-y-6"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-2xl group-hover:scale-110 transition-transform duration-500 ring-2 ring-secondary/20">
                  <img alt="Flag of United Kingdom" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnGePCC9CJ6oD6XsSzm6QF7xjgnKJuwpJrN221Iz0Mwz7toi1A43JH85t06e9IzLaAUMsCoFCBs4eo9oG09SZ_dP7J3UzDlaRNx-qx6wMhA74juEvu05ZQWYgznz7T8OFIVoL_J2Yaqvuv5RbsetZWaJVLhg1JA1HpOUHiy-9TJreRxZN7TgTU5SGs0ic3YSYK04oCKkZYv572b1BYG11hd0WrMdXAOP0rz_blWLzL7w5v9Q3BUH7uRWd2S-lHcyB4LgF2j8zNI20" />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-on-surface">English</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-secondary/70 font-semibold">Tiếng Anh</p>
                </div>
                <div className="w-8 h-8 rounded-full border border-secondary/30 flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                  <span className="material-symbols-outlined text-sm" style={FILL_1}>chevron_right</span>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="pt-8 opacity-40 flex items-center justify-center gap-4">
              <div className="h-[1px] w-12 bg-outline-variant" />
              <span className="material-symbols-outlined text-secondary" style={FILL_1}>auto_stories</span>
              <div className="h-[1px] w-12 bg-outline-variant" />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-[#11131e] border-t border-[#46464d]/15 py-8 w-full flex flex-col md:flex-row justify-between items-center px-12 text-sm tracking-wide">
          <div className="text-[#f8bd45]/60 mb-4 md:mb-0">© 2024 BibleQuiz. The Sacred Path.</div>
          <div className="flex gap-8">
            <a href="/privacy" className="text-[#e1e1f1]/60 hover:text-[#f8bd45] underline decoration-[#f8bd45]/30 transition-all duration-300">Privacy Policy</a>
            <a href="/terms" className="text-[#e1e1f1]/60 hover:text-[#f8bd45] underline decoration-[#f8bd45]/30 transition-all duration-300">Terms of Service</a>
            <a href="#" className="text-[#e1e1f1]/60 hover:text-[#f8bd45] underline decoration-[#f8bd45]/30 transition-all duration-300">Help Center</a>
          </div>
        </footer>
      </div>
    )
  }

  /* ── Screens 2-4: Welcome Slides ── */
  return (
    <div className="min-h-screen bg-[#11131e] flex flex-col">
      {/* Nav */}
      <nav className="flex justify-between items-center w-full px-8 py-4 fixed top-0 z-50 bg-[#11131e]">
        <span className="text-xl font-bold text-[#f8bd45] uppercase tracking-[0.05em]">BibleQuiz</span>
        <div className="flex items-center gap-4">
          <button onClick={skip} className="text-[#e1e1f1] opacity-70 hover:text-[#f8bd45] transition-colors text-sm">Skip</button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center pt-16 px-6 md:px-12">
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-12 min-h-[700px] items-center">
          {/* Left: Visual */}
          <SlideVisual step={step} />

          {/* Right: Content */}
          <div className="flex flex-col space-y-10 md:pl-8">
            {/* Step indicator */}
            <div className="flex flex-col space-y-2">
              <span className="text-secondary font-bold tracking-[0.2em] text-sm uppercase">Step Indicator</span>
              <span className="text-on-surface-variant font-medium text-lg tracking-widest">
                {String(step).padStart(2, '0')} / 03
              </span>
            </div>

            {/* Text */}
            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl font-bold text-on-surface leading-[1.1] tracking-tight">
                {step === 1 && <>{t('onboarding.slide1Title').replace('BibleQuiz', '')}<span className="text-secondary">BibleQuiz</span></>}
                {step === 2 && t('onboarding.slide2Title')}
                {step === 3 && (
                  <>Hành trình <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-tertiary">66 sách</span></>
                )}
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
                {step === 1 && t('onboarding.slide1Desc')}
                {step === 2 && t('onboarding.slide2Desc')}
                {step === 3 && t('onboarding.slide3Desc')}
              </p>
            </div>

            {/* Dots */}
            <div className="flex items-center space-x-3">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-10 gold-gradient' : 'w-2 bg-surface-container-highest'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                data-testid={step === 3 ? 'onboarding-start-btn' : 'onboarding-next-btn'}
                onClick={step === 3 ? finish : nextSlide}
                className="gold-gradient text-on-secondary px-10 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-lg active:scale-95"
              >
                {step === 3 ? t('onboarding.start') : t('common.next')}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              {step === 3 && (
                <button
                  onClick={skip}
                  className="px-8 py-4 rounded-xl font-bold text-on-surface-variant hover:text-secondary transition-colors border border-outline-variant/15"
                >
                  {t('onboarding.skip')}
                </button>
              )}
            </div>

            {/* Feature grid (slide 2 only) */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-4 mt-8 opacity-60">
                {['Multiplayer', 'Ranked', 'Groups', 'Tournament'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary">check_circle</span>
                    <span className="text-xs uppercase tracking-widest text-on-surface-variant">{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Scripture quote (slide 3 only) */}
            {step === 3 && (
              <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-lg border-l-4 border-secondary mt-4">
                <span className="material-symbols-outlined text-secondary opacity-50">format_quote</span>
                <div>
                  <p className="text-sm italic text-on-surface-variant">
                    "Lời Chúa là ngọn đèn cho chân tôi, ánh sáng cho đường lối tôi."
                  </p>
                  <span className="block mt-1 font-semibold not-italic text-secondary text-sm">— Thi Thiên 119:105</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#11131e] border-t border-[#46464d]/15 flex justify-between items-center px-12 py-8 w-full">
        <span className="text-[#f8bd45] font-semibold text-sm">© 2024 BibleQuiz. The Sacred Path.</span>
        <div className="flex gap-8">
          <a href="/privacy" className="text-[#e1e1f1]/60 text-sm hover:text-[#f8bd45] transition-colors">Privacy</a>
          <a href="/terms" className="text-[#e1e1f1]/60 text-sm hover:text-[#f8bd45] transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  )
}

/* ── Slide Visuals ── */
function SlideVisual({ step }: { step: number }) {
  const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

  if (step === 1) {
    // Spark of Light — large flare icon with glow
    return (
      <div className="relative flex items-center justify-center group h-full">
        <div className="absolute inset-0 bg-secondary/5 rounded-full blur-[120px] scale-75" />
        <div className="absolute inset-0 glass-panel rounded-full opacity-20 border border-outline-variant/10" />
        <div className="relative z-10 flex items-center justify-center">
          <div className="absolute w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
          <span className="material-symbols-outlined text-secondary drop-shadow-[0_0_30px_rgba(248,189,69,0.5)]" style={{ ...FILL_1, fontSize: '180px' }}>flare</span>
          <span className="material-symbols-outlined absolute top-0 -right-8 text-4xl text-tertiary opacity-80" style={FILL_1}>star</span>
          <span className="material-symbols-outlined absolute bottom-12 -left-4 text-3xl text-secondary opacity-60" style={FILL_1}>auto_awesome</span>
        </div>
      </div>
    )
  }

  if (step === 2) {
    // Together in Faith — avatar grid with animated circles
    return (
      <div className="h-full flex flex-col justify-center items-center relative group">
        <div className="absolute inset-0 rounded-full blur-[100px] opacity-30" style={{ boxShadow: '0 0 60px -15px rgba(192,196,232,0.15)' }} />
        <div className="relative w-full aspect-square max-w-[500px] flex items-center justify-center">
          <div className="absolute w-full h-full border border-outline-variant/10 rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute w-3/4 h-3/4 border border-outline-variant/10 rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
          {/* Avatar grid */}
          <div className="grid grid-cols-2 gap-8 relative z-10">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`p-6 bg-surface-container-high/40 backdrop-blur-xl rounded-full border border-secondary/10 ${i % 2 === 0 ? 'mt-12' : '-mt-12'}`} style={{ boxShadow: '0 0 40px -10px rgba(248,189,69,0.2)' }}>
                <div className="w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-secondary/60" style={FILL_1}>
                    {['person', 'group', 'church', 'diversity_3'][i]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Online badge */}
        <div className="absolute bottom-10 right-10 bg-surface-variant/60 backdrop-blur-md px-4 py-2 rounded-xl border border-outline-variant/15 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={FILL_1}>group</span>
          <span className="text-sm font-medium tracking-wide text-on-surface-variant">4 Players Online</span>
        </div>
      </div>
    )
  }

  // step === 3: Journey trail
  const BOOK_ICONS = ['menu_book', 'auto_stories', 'history_edu', 'verified', 'import_contacts', 'star', 'book_2', 'bookmark', 'local_library', 'school', 'menu_book', 'auto_stories']
  return (
    <div className="relative bg-surface-container flex items-center justify-center overflow-hidden rounded-2xl" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)' }}>
      {/* Winding path SVG */}
      <svg className="absolute inset-0 opacity-10 w-full h-full" viewBox="0 0 400 1000" fill="none">
        <path d="M200,0 Q350,150 200,300 T200,600 T200,900" stroke="#f8bd45" strokeDasharray="10 10" strokeWidth="2" />
      </svg>

      <div className="relative w-full max-w-2xl px-12 py-24 grid grid-cols-4 sm:grid-cols-6 gap-6 justify-items-center">
        {BOOK_ICONS.map((icon, i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-xl flex items-center justify-center border transition-all ${
              i < 2
                ? 'bg-secondary/20 border-secondary gold-glow'
                : i < 5
                  ? 'bg-surface-container-high border-secondary/10 gold-glow opacity-80'
                  : 'bg-surface-container-high border-outline-variant/10 opacity-30'
            }`}
          >
            <span className="material-symbols-outlined text-secondary" style={FILL_1}>{icon}</span>
          </div>
        ))}

        {/* Journey progress card */}
        <div className="col-span-4 sm:col-span-6 bg-surface-variant/40 backdrop-blur-md p-6 rounded-xl border border-outline-variant/15 mt-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <span className="material-symbols-outlined text-secondary" style={FILL_1}>map</span>
            </div>
            <div>
              <p className="text-on-surface font-semibold">Tiến trình hiện tại</p>
              <p className="text-xs text-on-surface-variant">Sáng Thế Ký • 12/50 Chương</p>
            </div>
          </div>
          <div className="w-full h-2 bg-primary-container rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-secondary to-tertiary w-1/4 rounded-full" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 opacity-10 blur-2xl rounded-full bg-secondary" />
    </div>
  )
}
