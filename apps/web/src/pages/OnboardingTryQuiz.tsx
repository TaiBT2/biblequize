import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useOnboardingStore } from '../store/onboardingStore'
import { api } from '../api/client'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

interface SampleQuestion {
  id: string
  content: string
  options: string[]
  correctAnswer: number[]
  book: string
}

const FALLBACK_VI: SampleQuestion[] = [
  { id: 'f1', content: 'Sách đầu tiên trong Kinh Thánh là gì?', options: ['Sáng Thế Ký', 'Xuất Hành', 'Ma-thi-ơ', 'Thi Thiên'], correctAnswer: [0], book: 'Genesis' },
  { id: 'f2', content: 'Ai đã dẫn dân Y-sơ-ra-ên ra khỏi Ai Cập?', options: ['Áp-ra-ham', 'Đa-vít', 'Môi-se', 'Giô-suê'], correctAnswer: [2], book: 'Exodus' },
  { id: 'f3', content: 'Chúa Giê-su được sinh ra ở đâu?', options: ['Na-xa-rét', 'Giê-ru-sa-lem', 'Bết-lê-hem', 'Ca-bê-na-um'], correctAnswer: [2], book: 'Matthew' },
]
const FALLBACK_EN: SampleQuestion[] = [
  { id: 'f1', content: 'What is the first book in the Bible?', options: ['Genesis', 'Exodus', 'Matthew', 'Psalms'], correctAnswer: [0], book: 'Genesis' },
  { id: 'f2', content: 'Who led the Israelites out of Egypt?', options: ['Abraham', 'David', 'Moses', 'Joshua'], correctAnswer: [2], book: 'Exodus' },
  { id: 'f3', content: 'Where was Jesus born?', options: ['Nazareth', 'Jerusalem', 'Bethlehem', 'Capernaum'], correctAnswer: [2], book: 'Matthew' },
]

export default function OnboardingTryQuiz() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { setHasSeenOnboarding } = useOnboardingStore()

  const [questions, setQuestions] = useState<SampleQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [startTime] = useState(Date.now())
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    const lang = i18n.language === 'en' ? 'en' : 'vi'
    api.get(`/api/public/sample-questions?language=${lang}&count=3`)
      .then(res => setQuestions(res.data?.length >= 3 ? res.data : (lang === 'en' ? FALLBACK_EN : FALLBACK_VI)))
      .catch(() => setQuestions(lang === 'en' ? FALLBACK_EN : FALLBACK_VI))
      .finally(() => setLoading(false))
  }, [i18n.language])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#11131e] flex items-center justify-center">
        <div className="animate-pulse text-on-surface-variant">{t('common.loading')}</div>
      </div>
    )
  }

  const question = questions[currentQ]
  const totalTime = Math.round((Date.now() - startTime) / 1000)

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    if (question.correctAnswer.includes(idx)) setCorrect(c => c + 1)
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1)
        setSelected(null)
      } else {
        setShowResult(true)
      }
    }, 800)
  }

  const goRegister = () => { setHasSeenOnboarding(true); navigate('/login') }
  const goSkip = () => { setHasSeenOnboarding(true); navigate('/') }

  /* ── Screen 6: Result ── */
  if (showResult) {
    const total = questions.length
    const wrong = total - correct
    const getMessage = () => {
      if (correct === total) return 'Hoàn hảo! Bạn rất am hiểu Kinh Thánh!'
      if (correct >= 2) return 'Tốt lắm! Bạn có tiềm năng học Kinh Thánh!'
      if (correct === 1) return 'Khởi đầu tốt! Hãy luyện tập thêm!'
      return 'Đừng nản lòng! Mọi hành trình đều bắt đầu từ bước đầu tiên.'
    }

    return (
      <div className="min-h-screen bg-[#11131e] flex flex-col">
        {/* Nav */}
        <nav className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-50 bg-[#11131e]">
          <span className="text-xl font-bold text-[#f8bd45] uppercase tracking-[0.05em]">BibleQuiz</span>
          <div className="hidden md:flex gap-8">
            {['Trang chủ', 'Thử thách', 'Cộng đồng'].map(l => (
              <span key={l} className="text-[#e1e1f1] opacity-70 text-sm">{l}</span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={goSkip} className="text-[#e1e1f1] opacity-70 hover:text-[#f8bd45] transition-colors text-sm">Skip</button>
          </div>
        </nav>

        {/* Main */}
        <main className="flex-grow flex items-center justify-center px-6 py-12 md:px-12">
          <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Score */}
            <div className="flex flex-col items-center md:items-start space-y-8">
              <div className="relative">
                <div className="absolute inset-0 gold-gradient blur-3xl opacity-10 rounded-full" />
                <div className="relative">
                  <p className="text-[120px] md:text-[160px] font-extrabold leading-none tracking-tighter" style={{ background: 'linear-gradient(135deg, #f8bd45, #e7c268)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {correct}/{total}
                  </p>
                  <div className="h-1.5 w-32 gold-gradient rounded-full mt-2" />
                </div>
              </div>

              <div className="space-y-4 text-center md:text-left">
                <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight leading-tight">{getMessage()}</h2>
                <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
                  Đăng ký để lưu lại kết quả và bắt đầu hành trình học Kinh Thánh.
                </p>
              </div>

              {/* Community avatars */}
              <div className="pt-8 flex flex-col items-center md:items-start gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-[#11131e] bg-surface-container-highest flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary/60 text-lg" style={FILL_1}>person</span>
                    </div>
                  ))}
                  <div className="inline-block h-10 w-10 rounded-full ring-2 ring-[#11131e] bg-surface-container-highest flex items-center justify-center">
                    <span className="text-xs font-bold text-secondary">+2k</span>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant">
                  Tham gia cùng <span className="text-secondary font-semibold">2,405</span> người khác hôm nay
                </p>
              </div>
            </div>

            {/* Right: Stats + CTA card */}
            <div className="relative">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-secondary opacity-5 rounded-full blur-3xl" />
              <div className="relative bg-surface-container/60 backdrop-blur-xl border border-outline-variant/15 p-8 md:p-12 rounded-[2rem] flex flex-col space-y-10" style={{ boxShadow: '0 0 40px -10px rgba(248,189,69,0.2)' }}>
                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-surface-container-high p-5 rounded-2xl flex flex-col items-center space-y-2">
                    <span className="material-symbols-outlined text-secondary" style={FILL_1}>check_circle</span>
                    <span className="text-2xl font-bold text-on-surface">Đúng {correct}</span>
                  </div>
                  <div className="bg-surface-container-high p-5 rounded-2xl flex flex-col items-center space-y-2">
                    <span className="material-symbols-outlined text-error">cancel</span>
                    <span className="text-2xl font-bold text-on-surface">Sai {wrong}</span>
                  </div>
                  <div className="bg-surface-container-high p-5 rounded-2xl flex flex-col items-center space-y-2">
                    <span className="material-symbols-outlined text-primary">timer</span>
                    <span className="text-2xl font-bold text-on-surface">{totalTime}s</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-xl font-bold text-on-surface">Lưu lại tiến trình của bạn</p>
                    <p className="text-on-surface-variant text-sm mt-1">Đăng ký để nhận lộ trình học tập cá nhân hóa miễn phí.</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={goRegister}
                      className="gold-gradient text-on-secondary font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95"
                    >
                      {t('auth.loginWithGoogle')}
                    </button>
                    <button
                      onClick={goSkip}
                      className="text-on-surface-variant font-medium py-3 px-8 rounded-xl border border-outline-variant/20 hover:bg-surface-variant/30 transition-colors"
                    >
                      {t('onboarding.tryLater')}
                    </button>
                  </div>
                </div>

                {/* Trust badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant/50 uppercase tracking-widest font-bold">
                  <span className="material-symbols-outlined text-[14px]">verified_user</span>
                  Bảo mật và an toàn 100%
                </div>
              </div>
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

  /* ── Screen 5: Try Quiz ── */
  const pctComplete = Math.round(((currentQ + 1) / questions.length) * 100)
  const LETTERS = ['A', 'B', 'C', 'D']

  return (
    <div className="min-h-screen bg-[#11131e] flex flex-col">
      {/* Nav */}
      <nav className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-50 bg-[#11131e]">
        <span className="text-xl font-bold text-[#f8bd45] uppercase tracking-[0.05em]">BibleQuiz</span>
        <div className="hidden md:flex items-center gap-8">
          {['Home', 'Quiz', 'Leaderboard'].map(l => (
            <span key={l} className="text-[#e1e1f1] opacity-70 text-sm">{l}</span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={goSkip} className="text-[#e1e1f1] opacity-70 hover:text-[#f8bd45] transition-colors text-sm">Skip</button>
          <button onClick={goRegister} className="gold-gradient text-on-secondary px-6 py-2 rounded-xl text-sm font-bold">Login</button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[720px] space-y-12">
          {/* Header + Progress */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-secondary font-bold text-sm tracking-[0.05em] uppercase block mb-1">Thử thách hôm nay</span>
                <h2 className="text-3xl font-bold tracking-tight text-on-surface">Câu {currentQ + 1} / {questions.length}</h2>
              </div>
              <span className="text-on-surface-variant text-sm font-medium">{pctComplete}% Hoàn thành</span>
            </div>
            <div className="h-3 w-full bg-primary-container rounded-full overflow-hidden">
              <div className="h-full gold-gradient rounded-full relative transition-all duration-500" style={{ width: `${pctComplete}%` }}>
                <div className="absolute inset-0 bg-secondary opacity-20 blur-sm" />
              </div>
            </div>
          </div>

          {/* Question card */}
          <div className="glass-card rounded-xl p-10 md:p-16 border border-outline-variant/15 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6 text-secondary/80">
                <span className="material-symbols-outlined">menu_book</span>
                <span className="text-xs font-bold tracking-widest uppercase">{question.book || 'Kinh Thánh'}</span>
              </div>
              <p className="text-2xl md:text-3xl font-semibold leading-snug text-on-surface">{question.content}</p>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-24 bg-secondary" />
          </div>

          {/* Answer options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              let cls = 'bg-surface-container-high border-outline-variant/10 hover:bg-surface-variant'
              if (selected !== null) {
                if (question.correctAnswer.includes(idx)) {
                  cls = 'bg-green-500/20 border-green-500/50'
                } else if (idx === selected) {
                  cls = 'bg-error/20 border-error/50'
                }
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={selected !== null}
                  className={`group flex items-center gap-4 p-5 rounded-xl border transition-all duration-300 text-left active:scale-95 ${cls}`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-colors ${
                    selected === null
                      ? 'bg-surface-container-highest text-secondary group-hover:bg-secondary group-hover:text-on-secondary'
                      : question.correctAnswer.includes(idx)
                        ? 'bg-green-500/30 text-green-400'
                        : idx === selected
                          ? 'bg-error/30 text-error'
                          : 'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {LETTERS[idx]}
                  </div>
                  <span className="text-lg font-medium text-on-surface">{opt}</span>
                </button>
              )
            })}
          </div>

          {/* Hints */}
          <div className="flex justify-center items-center gap-6 pt-4">
            <span className="flex items-center gap-2 text-on-surface-variant text-sm font-medium">
              <span className="material-symbols-outlined text-[20px]">lightbulb</span>
              Gợi ý (50/50)
            </span>
            <div className="h-4 w-[1px] bg-outline-variant/30" />
            <span className="flex items-center gap-2 text-on-surface-variant text-sm font-medium">
              <span className="material-symbols-outlined text-[20px]">report</span>
              Báo lỗi câu hỏi
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#11131e] border-t border-[#46464d]/15 py-8 flex justify-between items-center px-12 w-full mt-auto">
        <span className="text-[#f8bd45] font-semibold text-sm">© 2024 BibleQuiz</span>
        <div className="flex gap-8">
          <a href="/privacy" className="text-[#e1e1f1]/60 text-sm hover:text-[#f8bd45] transition-colors">Privacy</a>
          <a href="/terms" className="text-[#e1e1f1]/60 text-sm hover:text-[#f8bd45] transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  )
}
