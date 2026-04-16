import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

type FilterType = 'all' | 'wrong' | 'correct'

export default function Review() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const { t } = useTranslation()
  const stats = location.state?.stats

  const [filter, setFilter] = useState<FilterType>('all')
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [retrying, setRetrying] = useState(false)

  const questions = stats?.questions ?? []
  const userAnswers = stats?.userAnswers ?? []
  const totalCorrect = stats?.correctAnswers ?? 0
  const totalQuestions = stats?.totalQuestions ?? questions.length
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const totalTimeSec = Math.floor((stats?.totalTime ?? 0) / 1000)
  const totalMin = Math.floor(totalTimeSec / 60)
  const totalSec = totalTimeSec % 60

  const questionsWithStatus = useMemo(() =>
    questions.map((q: any, idx: number) => ({
      ...q,
      index: idx,
      userAnswer: userAnswers[idx],
      isCorrect: userAnswers[idx] !== null && userAnswers[idx] === q.correctAnswer?.[0],
    })),
    [questions, userAnswers]
  )

  const filtered = useMemo(() => {
    if (filter === 'wrong') return questionsWithStatus.filter((q: any) => !q.isCorrect)
    if (filter === 'correct') return questionsWithStatus.filter((q: any) => q.isCorrect)
    return questionsWithStatus
  }, [questionsWithStatus, filter])

  const wrongCount = questionsWithStatus.filter((q: any) => !q.isCorrect).length
  const correctCount = questionsWithStatus.filter((q: any) => q.isCorrect).length

  const toggleBookmark = async (questionId: string) => {
    const next = new Set(bookmarks)
    if (next.has(questionId)) {
      next.delete(questionId)
      try { await api.delete(`/api/me/bookmarks/${questionId}`) } catch { /* ignore */ }
    } else {
      next.add(questionId)
      try { await api.post('/api/me/bookmarks', { questionId }) } catch { /* ignore */ }
    }
    setBookmarks(next)
  }

  const handleRetry = async () => {
    if (!stats?.sessionId) return
    setRetrying(true)
    try {
      const res = await api.post(`/api/sessions/${stats.sessionId}/retry`)
      navigate('/quiz', { state: { sessionId: res.data.sessionId, mode: 'practice' } })
    } catch {
      setRetrying(false)
    }
  }

  // ── Empty state ──
  if (!stats || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#11131e] flex items-center justify-center p-4">
        <div className="glass-card p-8 rounded-2xl text-center max-w-md border border-outline-variant/10">
          <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-4 block">quiz</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">{t('review.noData')}</h2>
          <p className="text-on-surface-variant text-sm mb-6">{t('review.completeFirst')}</p>
          <button onClick={() => navigate('/practice')} className="gold-gradient text-on-secondary font-bold px-6 py-3 rounded-xl">
            {t('review.backToPractice')}
          </button>
        </div>
      </div>
    )
  }

  const diffBadge = (d: string) => {
    const map: Record<string, string> = {
      easy: 'bg-green-500/10 text-green-400 border-green-500/20',
      medium: 'bg-secondary/10 text-secondary border-secondary/20',
      hard: 'bg-error/10 text-error border-error/20',
    }
    const label: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${map[d] ?? ''}`}>{label[d] ?? d}</span>
  }

  return (
    <div data-testid="review-page" className="min-h-screen bg-[#11131e] flex">
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/10">
          <div className="flex items-center justify-between px-6 h-16 md:h-20">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-variant transition-colors">
                <span className="material-symbols-outlined text-on-surface">arrow_back</span>
              </button>
              <div>
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-on-surface">{t('review.title')}</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span data-testid="review-total-correct" className="text-xs font-bold text-secondary uppercase tracking-wider">{totalCorrect}/{totalQuestions} {t('review.correctLabel')} ({accuracy}%)</span>
                  <span className="text-[10px] text-on-surface-variant/40">•</span>
                  <span className="text-xs text-on-surface-variant/70 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {totalMin}m {totalSec.toString().padStart(2, '0')}s
                  </span>
                </div>
              </div>
            </div>
            {wrongCount > 0 && (
              <button data-testid="review-retry-btn" onClick={handleRetry} disabled={retrying}
                className="gold-gradient px-4 py-2 md:px-6 rounded-xl text-on-secondary font-bold text-sm flex items-center gap-2 shadow-lg shadow-secondary/10 active:scale-95 transition-transform disabled:opacity-50">
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span className="hidden sm:inline">{t('review.retryWrong')}</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="px-6 flex gap-8 border-t border-outline-variant/5">
            {([
              ['all', t('review.all', { count: totalQuestions })] as [FilterType, string],
              ['wrong', t('review.wrong', { count: wrongCount })] as [FilterType, string],
              ['correct', t('review.correct', { count: correctCount })] as [FilterType, string],
            ]).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`py-4 text-sm font-bold transition-colors ${filter === key ? 'text-on-surface border-b-2 border-secondary' : 'text-on-surface-variant/50 hover:text-on-surface'}`}>
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* Question Cards */}
        <div className="p-6 space-y-6 max-w-4xl mx-auto w-full pb-32">
          {filtered.map((q: any) => {
            const correctIdx = q.correctAnswer?.[0]
            return (
              <article data-testid="review-question-item" key={q.id} className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/10 shadow-xl">
                <div className="p-5 md:p-7 space-y-6">
                  {/* Question header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-on-surface-variant/40">{t('review.questionNumber', { number: String(q.index + 1).padStart(2, '0') })}</span>
                      {diffBadge(q.difficulty)}
                      <span className="text-xs font-medium text-secondary/80 bg-secondary/5 px-2 py-0.5 rounded-lg">
                        {q.book} {q.chapter ? `${t('review.chapter', { chapter: q.chapter })}` : ''}
                      </span>
                    </div>
                    <button onClick={() => toggleBookmark(q.id)} className={`transition-colors ${bookmarks.has(q.id) ? 'text-secondary' : 'text-on-surface-variant/20 hover:text-secondary'}`}>
                      <span className="material-symbols-outlined" style={bookmarks.has(q.id) ? FILL_1 : undefined}>star</span>
                    </button>
                  </div>

                  {/* Question text */}
                  <h3 className="text-lg md:text-xl font-medium leading-relaxed text-on-surface">{q.content}</h3>

                  {/* Answer options */}
                  <div className="space-y-3">
                    {q.options?.map((opt: string, i: number) => {
                      const isUserAnswer = i === q.userAnswer
                      const isCorrectAnswer = i === correctIdx
                      let borderClass = 'bg-surface-variant/30 text-on-surface-variant/60'
                      let icon = 'radio_button_unchecked'
                      let iconColor = 'opacity-30'
                      let badge = null

                      if (isCorrectAnswer && isUserAnswer) {
                        borderClass = 'bg-surface-container-high border-l-4 border-green-500'
                        icon = 'check_circle'
                        iconColor = 'text-green-500'
                        badge = <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest px-2 py-1 bg-green-500/10 rounded">{t('review.yourAnswer')}</span>
                      } else if (isUserAnswer && !q.isCorrect) {
                        borderClass = 'bg-surface-container-high border-l-4 border-error'
                        icon = 'cancel'
                        iconColor = 'text-error'
                        badge = <span className="text-[10px] font-bold text-error uppercase tracking-widest px-2 py-1 bg-error/10 rounded">{t('review.yourAnswer')}</span>
                      } else if (isCorrectAnswer) {
                        borderClass = 'bg-surface-container-high border-l-4 border-green-500'
                        icon = 'check_circle'
                        iconColor = 'text-green-500'
                        badge = <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest px-2 py-1 bg-green-500/10 rounded">{t('review.correctAnswer')}</span>
                      }

                      return (
                        <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${borderClass}`}>
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-sm ${iconColor}`}>{icon}</span>
                            <span className={isCorrectAnswer || isUserAnswer ? 'text-on-surface font-medium' : ''}>{opt}</span>
                          </div>
                          {badge}
                        </div>
                      )
                    })}
                  </div>

                  {/* Explanation + Scripture Reference */}
                  {(q.explanation || q.verseStart) && (
                    <div className="mt-4 p-5 bg-surface-container-low rounded-xl border border-outline-variant/5 space-y-3">
                      {/* Scripture reference */}
                      {q.verseStart && (
                        <div className="flex items-center gap-2 text-secondary font-medium text-sm">
                          <span className="material-symbols-outlined text-base">menu_book</span>
                          <span>
                            {q.book} {q.chapter}:{q.verseStart}
                            {q.verseEnd && q.verseEnd !== q.verseStart ? `–${q.verseEnd}` : ''}
                          </span>
                        </div>
                      )}

                      {/* Explanation text */}
                      {q.explanation && (
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-secondary/60 text-base mt-0.5">lightbulb</span>
                          <p className="text-on-surface-variant leading-relaxed text-sm">{q.explanation}</p>
                        </div>
                      )}

                      {q.contextNote && (
                        <div className="flex items-center gap-2 pt-1 text-xs text-on-surface-variant/50 italic">
                          <span className="material-symbols-outlined text-sm">map</span>
                          {q.contextNote}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            )
          })}

          {filtered.length === 0 && (
            <p className="text-center text-on-surface-variant py-16">{t('review.noQuestionsInFilter')}</p>
          )}
        </div>
      </main>
    </div>
  )
}
