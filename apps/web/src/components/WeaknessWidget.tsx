import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

interface BookAccuracy {
  book: string
  totalAnswered: number
  correct: number
  wrong: number
  accuracy: number
}

interface WeaknessData {
  weakBooks: BookAccuracy[]
  strongBooks: BookAccuracy[]
  suggestedPractice: string | null
}

export default function WeaknessWidget() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery<WeaknessData>({
    queryKey: ['weaknesses'],
    queryFn: () => api.get('/api/me/weaknesses').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  if (isLoading || !data) return null
  if (data.weakBooks.length === 0 && data.strongBooks.length === 0) return null

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
          analytics
        </span>
        <h2 className="text-lg font-black text-on-surface">{t('components.weakness.title')}</h2>
      </div>

      <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10 space-y-5">
        {/* Strong books */}
        {data.strongBooks.length > 0 && (
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-400">trending_up</span>
              {t('components.weakness.strongLabel')}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.strongBooks.map(b => (
                <div key={b.book} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                  <span className="text-xs font-bold text-emerald-400">{b.book}</span>
                  <span className="text-[10px] font-black text-emerald-300">{b.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weak books */}
        {data.weakBooks.length > 0 && (
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-secondary">menu_book</span>
              {t('components.weakness.weakLabel')}
            </p>
            <div className="space-y-2">
              {data.weakBooks.map(b => (
                <div key={b.book} data-testid="profile-weakness-item" className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface">{b.book}</span>
                    <span className="text-[10px] text-on-surface-variant">
                      {t('components.weakness.correctFraction', { correct: b.correct, total: b.totalAnswered })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${b.accuracy >= 60 ? 'bg-secondary' : 'bg-error'}`}
                        style={{ width: `${b.accuracy}%` }}
                      />
                    </div>
                    <span className={`text-xs font-black ${b.accuracy >= 60 ? 'text-secondary' : 'text-error'}`}>
                      {b.accuracy}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested practice */}
        {data.suggestedPractice && (
          <button
            onClick={() => navigate('/practice', { state: { book: data.suggestedPractice } })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary text-sm font-bold hover:bg-secondary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">play_circle</span>
            {t('components.weakness.practiceCta', { book: data.suggestedPractice })}
          </button>
        )}
      </div>
    </section>
  )
}
