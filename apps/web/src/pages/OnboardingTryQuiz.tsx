import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const SAMPLE_QUESTIONS_VI = [
  {
    content: 'Sách đầu tiên trong Kinh Thánh là gì?',
    answers: ['Sáng Thế Ký', 'Xuất Hành', 'Ma-thi-ơ', 'Thi Thiên'],
    correctIndex: 0,
  },
  {
    content: 'Ai đã dẫn dân Y-sơ-ra-ên ra khỏi Ai Cập?',
    answers: ['Áp-ra-ham', 'Đa-vít', 'Môi-se', 'Giô-suê'],
    correctIndex: 2,
  },
  {
    content: 'Chúa Giê-su được sinh ra ở đâu?',
    answers: ['Na-xa-rét', 'Giê-ru-sa-lem', 'Bết-lê-hem', 'Ca-bê-na-um'],
    correctIndex: 2,
  },
]

const SAMPLE_QUESTIONS_EN = [
  {
    content: 'What is the first book in the Bible?',
    answers: ['Genesis', 'Exodus', 'Matthew', 'Psalms'],
    correctIndex: 0,
  },
  {
    content: 'Who led the Israelites out of Egypt?',
    answers: ['Abraham', 'David', 'Moses', 'Joshua'],
    correctIndex: 2,
  },
  {
    content: 'Where was Jesus born?',
    answers: ['Nazareth', 'Jerusalem', 'Bethlehem', 'Capernaum'],
    correctIndex: 2,
  },
]

export default function OnboardingTryQuiz() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const questions = i18n.language === 'en' ? SAMPLE_QUESTIONS_EN : SAMPLE_QUESTIONS_VI

  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const question = questions[currentQ]

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    if (idx === question.correctIndex) setCorrect(c => c + 1)

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
    return (
      <div className="min-h-screen bg-[#11131e] flex flex-col items-center justify-center p-8 text-center">
        <span className="text-6xl mb-6">{correct === 3 ? '🎉' : correct >= 2 ? '👏' : '💪'}</span>
        <h2 className="text-2xl font-bold text-on-surface mb-2">
          {t('onboarding.tryResult', { correct, total: questions.length })}
        </h2>
        <p className="text-on-surface-variant mb-8">{t('onboarding.trySignup')}</p>
        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={() => navigate('/login')}
            className="w-full gold-gradient text-on-secondary py-3 rounded-xl font-bold"
          >
            {t('auth.loginWithGoogle')}
          </button>
          <button
            onClick={() => navigate('/')}
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
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-bold text-on-surface">{t('onboarding.tryTitle')}</h2>
        <span className="text-sm text-on-surface-variant">{currentQ + 1}/{questions.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-surface-container-high rounded-full mb-8">
        <div
          className="h-full bg-secondary rounded-full transition-all"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        <p className="text-xl font-semibold text-on-surface mb-8 text-center">{question.content}</p>

        <div className="space-y-3">
          {question.answers.map((answer, idx) => {
            let btnClass = 'bg-surface-container border-outline-variant/20 text-on-surface hover:border-secondary/40'
            if (selected !== null) {
              if (idx === question.correctIndex) {
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
                className={`w-full text-left px-5 py-4 rounded-xl border transition-all font-medium ${btnClass}`}
              >
                {answer}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
