import React from 'react'
import { useTranslation } from 'react-i18next'

interface BookCoverage {
  book: string; easy: number; medium: number; hard: number; total: number; meetsMinimum: boolean
}

export default function CoverageChart({ books }: { books: BookCoverage[] }) {
  const { t } = useTranslation()
  if (!books || books.length === 0) return <div className="text-bq-ink3 text-sm">{t('admin.dashboard.coverage.noData')}</div>

  return (
    <div className="bg-bq-white border border-bq-hair shadow-bq-soft p-8 rounded-lg">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-display font-bold tracking-tight text-bq-ink">{t('admin.dashboard.coverage.title')}</h2>
          <p className="text-xs text-bq-ink3 mt-1 uppercase tracking-widest font-medium">{t('admin.dashboard.coverage.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-bq-emerald" /><span className="text-[10px] uppercase text-bq-ink2">{t('admin.dashboard.coverage.healthy')}</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-bq-amber" /><span className="text-[10px] uppercase text-bq-ink2">{t('admin.dashboard.coverage.fair')}</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-bq-ruby" /><span className="text-[10px] uppercase text-bq-ink2">{t('admin.dashboard.coverage.critical')}</span></div>
        </div>
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {books.map(b => {
          const pct = Math.min(100, Math.round((b.total / 60) * 100))
          const color = b.meetsMinimum ? 'bg-bq-emerald' : pct >= 50 ? 'bg-bq-amber' : 'bg-bq-ruby'
          const textColor = b.meetsMinimum ? 'text-bq-emerald' : pct >= 50 ? 'text-bq-amberd' : 'text-bq-ruby'
          return (
            <div key={b.book} data-testid="coverage-book-bar" className="grid grid-cols-12 items-center gap-4 group">
              <span className="col-span-2 text-[10px] font-mono text-bq-ink2 group-hover:text-bq-amberd transition-colors uppercase truncate">{b.book}</span>
              <div className="col-span-9 h-1 bg-bq-inset overflow-hidden rounded-full">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
              <span data-testid="coverage-pct" className={`col-span-1 text-[10px] font-mono text-right ${textColor}`}>{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
