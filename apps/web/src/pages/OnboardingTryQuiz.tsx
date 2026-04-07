import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useOnboardingStore } from '../store/onboardingStore'
import { api } from '../api/client'

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
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    const lang = i18n.language === 'en' ? 'en' : 'vi'
    api.get(`/api/public/sample-questions?language=${lang}&count=3`)
      .then(res => {
        if (res.data && res.data.length >= 3) {
          setQuestions(res.data)
        } else {
          setQuestions(lang === 'en' ? FALLBACK_EN : FALLBACK_VI)
        }
      })
      .catch(() => {
        setQuestions(lang === 'en' ? FALLBACK_EN : FALLBACK_VI)
      })
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

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    const isCorrect = question.correctAnswer.includes(idx)
    if (isCorrect) setCorrect(c => c + 1)

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1)
        setSelected(null)
      } else {
        setShowResult(true)
      }
    }, 800)
  }

  if (showResult) {
    const total = questions.length
    const getMessage = () => {
      if (correct === total) return t('onboarding.resultPerfect', { defaultValue: 'Perfect! You know your Bible well!' })
      if (correct >= 2) return t('onboarding.resultGood', { defaultValue: 'Great job! You have potential!' })
      if (correct === 1) return t('onboarding.resultOk', { defaultValue: 'Good start! Keep practicing!' })
      return t('onboarding.resultKeepGoing', { defaultValue: "Don't give up! Every journey starts with a first step." })
    }

    return (
      <div className="min-h-screen bg-[#11131e] flex flex-col items-center justify-center p-8 text-center">
        <span className="text-7xl mb-6">{correct === total ? '🎉' : correct >= 2 ? '⭐' : '📖'}</span>

        <h2 className="text-4xl font-black text-on-surface mb-2">
          {correct}/{total}
        </h2>
        <p className="text-on-surface-variant text-lg mb-8 max-w-sm">{getMessage()}</p>

        {/* Stats */}
        <div className="glass-card p-5 w-full max-w-xs mb-8 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-green-400 font-medium">✓ {t('onboarding.correct', { defaultValue: 'Correct' })}</span>
            <span className="text-on-surface font-bold">{correct}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-error font-medium">✗ {t('onboarding.wrong', { defaultValue: 'Wrong' })}</span>
            <span className="text-on-surface font-bold">{total - correct}</span>
          </div>
        </div>

        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={() => { setHasSeenOnboarding(true); navigate('/login') }}
            className="w-full gold-gradient text-on-secondary py-4 rounded-xl font-bold text-base active:scale-[0.98] transition-transform"
          >
            {t('auth.loginWithGoogle')}
          </button>
          <button
            onClick={() => { setHasSeenOnboarding(true); navigate('/') }}
            className="w-full text-on-surface-variant text-sm hover:text-secondary transition-colors py-2"
          >
            {t('onboarding.tryLater')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#11131e] flex flex-col p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-on-surface">{t('onboarding.tryTitle')}</h2>
        <span className="text-sm text-on-surface-variant font-medium">{currentQ + 1}/{questions.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-surface-container-high rounded-full mb-10">
        <div
          className="h-full bg-secondary rounded-full transition-all duration-300"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        <p className="text-xl font-semibold text-on-surface mb-10 text-center leading-relaxed">{question.content}</p>

        <div className="space-y-3">
          {question.options.map((answer, idx) => {
            let btnClass = 'bg-surface-container border-outline-variant/20 text-on-surface hover:border-secondary/40'
            if (selected !== null) {
              if (question.correctAnswer.includes(idx)) {
                btnClass = 'bg-green-500/20 border-green-500/50 text-green-400'
              } else if (idx === selected) {
                btnClass = 'bg-error/20 border-error/50 text-error'
              }
            }
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={selected !== null}
                className={`w-full text-left px-5 py-4 rounded-xl border transition-all font-medium active:scale-[0.98] ${btnClass}`}
              >
                <span className="text-on-surface-variant/50 mr-3 font-bold">{String.fromCharCode(65 + idx)}.</span>
                {answer}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer hint */}
      <p className="text-center text-xs text-on-surface-variant/40 mt-8">
        {t('onboarding.tryDesc')}
      </p>
    </div>
  )
}
