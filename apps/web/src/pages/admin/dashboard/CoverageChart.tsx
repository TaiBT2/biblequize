import React from 'react'
import { useTranslation } from 'react-i18next'

interface BookCoverage {
  book: string; easy: number; medium: number; hard: number; total: number; meetsMinimum: boolean
}

export default function CoverageChart({ books }: { books: BookCoverage[] }) {
  const { t } = useTranslation()
  if (!books || books.length === 0) return <div className="text-[#d5c4af]/40 text-sm">{t('admin.dashboard.coverage.noData')}</div>

  return (
    <div className="bg-[#1d1f29] p-8 rounded-lg">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{t('admin.dashboard.coverage.title')}</h2>
          <p className="text-xs text-[#d5c4af]/50 mt-1 uppercase tracking-widest font-medium">{t('admin.dashboard.coverage.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] uppercase text-[#d5c4af]">{t('admin.dashboard.coverage.healthy')}</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-[10px] uppercase text-[#d5c4af]">{t('admin.dashboard.coverage.fair')}</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] uppercase text-[#d5c4af]">{t('admin.dashboard.coverage.critical')}</span></div>
        </div>
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {books.map(b => {
          const pct = Math.min(100, Math.round((b.total / 60) * 100))
          const color = b.meetsMinimum ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
          const textColor = b.meetsMinimum ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'
          return (
            <div key={b.book} data-testid="coverage-book-bar" className="grid grid-cols-12 items-center gap-4 group">
              <span className="col-span-2 text-[10px] font-mono text-[#d5c4af] group-hover:text-[#e8a832] transition-colors uppercase truncate">{b.book}</span>
              <div className="col-span-9 h-1 bg-[#11131c] overflow-hidden rounded-full">
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
