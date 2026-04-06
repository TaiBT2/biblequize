import { useState } from 'react'
import { getQuizLanguage, setQuizLanguage, type QuizLanguage } from '../utils/quizLanguage'

interface Props {
  onChange?: (lang: QuizLanguage) => void
  className?: string
}

export default function QuizLanguageSelect({ onChange, className = '' }: Props) {
  const [lang, setLang] = useState<QuizLanguage>(getQuizLanguage)

  const handleChange = (newLang: QuizLanguage) => {
    setLang(newLang)
    setQuizLanguage(newLang)
    onChange?.(newLang)
  }

  return (
    <div className={`flex gap-1 rounded-xl bg-surface-container p-1 ${className}`}>
      <button
        type="button"
        onClick={() => handleChange('vi')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          lang === 'vi' ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => handleChange('en')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          lang === 'en' ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        EN
      </button>
    </div>
  )
}
