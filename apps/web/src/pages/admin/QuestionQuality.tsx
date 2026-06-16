import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api/client'

// Shape returned by GET /api/admin/questions/coverage. BE returns either form
// depending on grouping mode; FE normalises to array via Object.entries below.
interface BookCoverage {
  book?: string
  easy?: number
  medium?: number
  hard?: number
}
type CoverageResponse = Record<string, BookCoverage> | BookCoverage[]

export default function QuestionQuality() {
  const { t } = useTranslation()
  const [coverage, setCoverage] = useState<CoverageResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    api.get('/api/admin/questions/coverage')
      .then(res => setCoverage(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const qualityScore = 72 // TODO: compute from actual data

  return (
    <div data-testid="admin-quality-page" className="space-y-6">
      <div><h2 className="text-3xl font-extrabold font-display text-bq-ink tracking-tight">{t('admin.questionQuality.title')}</h2><p className="text-bq-ink2 text-sm mt-1">{t('admin.questionQuality.subtitle')}</p></div>

      {/* Overall Score */}
      <div className="rounded-lg border border-bq-hair bg-bq-white shadow-bq-soft p-6 text-center">
        <div data-testid="quality-overall-score" className={`text-6xl font-black mb-2 ${qualityScore >= 70 ? 'text-bq-emerald' : qualityScore >= 40 ? 'text-bq-amberd' : 'text-bq-ruby'}`}>
          {qualityScore}
        </div>
        <p className="text-bq-ink3 text-sm">{t('admin.questionQuality.overallScoreLabel')}</p>
      </div>

      {/* Coverage Map */}
      <div data-testid="quality-coverage-map" className="rounded-lg border border-bq-hair bg-bq-white shadow-bq-soft p-5">
        <h3 className="font-medium text-bq-ink mb-4">{t('admin.questionQuality.coverageTitle')}</h3>
        {isLoading ? <p className="text-bq-ink3 text-sm">{t('admin.questionQuality.loading')}</p>
         : !coverage ? <p className="text-bq-ink3 text-sm">{t('admin.questionQuality.loadError')}</p>
         : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(Array.isArray(coverage)
              ? coverage
              : Object.entries(coverage).map(([book, data]) => ({ book, ...(data as BookCoverage) }))
            ).map((item: BookCoverage, i: number) => {
              const easy = item.easy || 0
              const medium = item.medium || 0
              const hard = item.hard || 0
              const total = easy + medium + hard
              const minPool = 60 // 30+20+10
              const pct = Math.min(100, Math.round((total / minPool) * 100))
              return (
                <div key={i} data-testid="coverage-book-bar" className="flex items-center gap-3">
                  <span className="text-bq-ink3 text-xs w-28 truncate">{item.book || t('admin.questionQuality.bookFallback', { index: i + 1 })}</span>
                  <div className="flex-1 h-2 bg-bq-inset rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-bq-emerald' : pct >= 50 ? 'bg-bq-amberd' : 'bg-bq-ruby'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span data-testid="coverage-pct" className="text-bq-ink3 text-xs w-8 text-right">{total}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Problem Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-bq-ruby/20 bg-bq-ruby/10 p-4">
          <h4 className="text-bq-ruby font-bold text-sm mb-2">{t('admin.questionQuality.problemTooHardTitle')}</h4>
          <p className="text-bq-ink3 text-xs">{t('admin.questionQuality.problemNeedsApi', { endpoint: '/api/admin/question-quality/problems' })}</p>
        </div>
        <div className="rounded-lg border border-bq-amber/20 bg-bq-amber/10 p-4">
          <h4 className="text-bq-amberd font-bold text-sm mb-2">{t('admin.questionQuality.problemTooEasyTitle')}</h4>
          <p className="text-bq-ink3 text-xs">{t('admin.questionQuality.problemNeedsApi', { endpoint: '/api/admin/question-quality/problems' })}</p>
        </div>
        <div className="rounded-lg border border-bq-hair bg-bq-inset p-4">
          <h4 className="text-bq-ink2 font-bold text-sm mb-2">{t('admin.questionQuality.problemUnusedTitle')}</h4>
          <p className="text-bq-ink3 text-xs">{t('admin.questionQuality.problemNeedsApi', { endpoint: '/api/admin/question-quality/unused' })}</p>
        </div>
      </div>
    </div>
  )
}
