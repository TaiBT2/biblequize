import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

export default function WeeklyQuiz() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [starting, setStarting] = useState(false)

  const { data: theme, isLoading } = useQuery({
    queryKey: ['weekly-theme'],
    queryFn: () => api.get('/api/quiz/weekly/theme').then(r => r.data),
  })

  const startQuiz = async () => {
    setStarting(true)
    try {
      const res = await api.get('/api/quiz/weekly')
      const { questions } = res.data
      if (questions?.length > 0) {
        navigate('/quiz', {
          state: {
            questions,
            mode: 'weekly_quiz',
            showExplanation: true,
          },
        })
      }
    } catch {
      setStarting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-purple-400" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
        </div>
        <h1 className="text-3xl font-black text-on-surface">{t('gameModes.weekly')}</h1>
        <p className="text-on-surface-variant text-sm">Mỗi tuần một chủ đề mới</p>
      </div>

      {/* Theme card */}
      {theme && (
        <div className="bg-surface-container rounded-2xl p-8 border border-purple-500/20 text-center space-y-4">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Chủ đề tuần này</p>
          <h2 className="text-2xl font-black text-on-surface">{theme.themeName}</h2>
          <p className="text-sm text-on-surface-variant">{theme.themeNameEn}</p>

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {theme.books?.slice(0, 5).map((book: string) => (
              <span key={book} className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full font-medium">
                {book}
              </span>
            ))}
            {theme.books?.length > 5 && (
              <span className="text-xs text-on-surface-variant">+{theme.books.length - 5}</span>
            )}
          </div>

          <div className="flex justify-center gap-6 pt-4 text-sm text-on-surface-variant">
            <span>10 câu hỏi</span>
            <span>•</span>
            <span>Còn {theme.daysLeft} ngày</span>
          </div>

          <button
            onClick={startQuiz}
            disabled={starting}
            className="mt-4 px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white font-black rounded-xl transition-colors disabled:opacity-50"
          >
            {starting ? '...' : t('gameModes.weeklyBtn')}
          </button>
        </div>
      )}
    </div>
  )
}
