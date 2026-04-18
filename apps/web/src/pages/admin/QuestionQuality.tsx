import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api/client'

export default function QuestionQuality() {
  const { t } = useTranslation()
  const [coverage, setCoverage] = useState<any>(null)
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
      <div><h2 className="text-3xl font-extrabold text-[#e1e1ef] tracking-tight">{t('admin.questionQuality.title')}</h2><p className="text-[#d5c4af] text-sm mt-1">{t('admin.questionQuality.subtitle')}</p></div>

      {/* Overall Score */}
      <div className="rounded-lg border border-[#504535]/10 bg-[#1d1f29] p-6 text-center">
        <div data-testid="quality-overall-score" className={`text-6xl font-black mb-2 ${qualityScore >= 70 ? 'text-emerald-400' : qualityScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
          {qualityScore}
        </div>
        <p className="text-[#d5c4af]/40 text-sm">{t('admin.questionQuality.overallScoreLabel')}</p>
      </div>

      {/* Coverage Map */}
      <div data-testid="quality-coverage-map" className="rounded-lg border border-[#504535]/10 bg-[#1d1f29] p-5">
        <h3 className="font-medium text-[#e1e1ef] mb-4">{t('admin.questionQuality.coverageTitle')}</h3>
        {isLoading ? <p className="text-[#d5c4af]/40 text-sm">{t('admin.questionQuality.loading')}</p>
         : !coverage ? <p className="text-[#d5c4af]/40 text-sm">{t('admin.questionQuality.loadError')}</p>
         : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(Array.isArray(coverage) ? coverage : Object.entries(coverage).map(([book, data]: any) => ({ book, ...data }))).map((item: any, i: number) => {
              const easy = item.easy || 0
              const medium = item.medium || 0
              const hard = item.hard || 0
              const total = easy + medium + hard
              const minPool = 60 // 30+20+10
              const pct = Math.min(100, Math.round((total / minPool) * 100))
              return (
                <div key={i} data-testid="coverage-book-bar" className="flex items-center gap-3">
                  <span className="text-[#d5c4af]/60 text-xs w-28 truncate">{item.book || t('admin.questionQuality.bookFallback', { index: i + 1 })}</span>
                  <div className="flex-1 h-2 bg-[#282933] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-[#e8a832]' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span data-testid="coverage-pct" className="text-[#d5c4af]/40 text-xs w-8 text-right">{total}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Problem Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <h4 className="text-red-400 font-bold text-sm mb-2">{t('admin.questionQuality.problemTooHardTitle')}</h4>
          <p className="text-[#d5c4af]/40 text-xs">{t('admin.questionQuality.problemNeedsApi', { endpoint: '/api/admin/question-quality/problems' })}</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
          <h4 className="text-[#e8a832] font-bold text-sm mb-2">{t('admin.questionQuality.problemTooEasyTitle')}</h4>
          <p className="text-[#d5c4af]/40 text-xs">{t('admin.questionQuality.problemNeedsApi', { endpoint: '/api/admin/question-quality/problems' })}</p>
        </div>
        <div className="rounded-lg border border-[#d5c4af]/20 bg-[#d5c4af]/10 p-4">
          <h4 className="text-[#d5c4af] font-bold text-sm mb-2">{t('admin.questionQuality.problemUnusedTitle')}</h4>
          <p className="text-[#d5c4af]/40 text-xs">{t('admin.questionQuality.problemNeedsApi', { endpoint: '/api/admin/question-quality/unused' })}</p>
        </div>
      </div>
    </div>
  )
}
