import React from 'react'
import { useTranslation } from 'react-i18next'

const BAR_HEIGHTS = [30, 45, 25, 60, 55, 70, 85, 40, 50, 65, 75, 100, 60, 45, 30]

export default function UserRegChart({ totalNewUsers }: { totalNewUsers?: number }) {
  const { t } = useTranslation()
  return (
    <div className="bg-[#1d1f29] p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-lg font-bold text-white">{t('admin.dashboard.userRegChart.title')}</h3>
          <p className="text-[10px] uppercase tracking-widest text-[#d5c4af]/50 mt-1">{t('admin.dashboard.userRegChart.subtitle')}</p>
        </div>
        <span className="text-2xl font-black text-[#80b6ff] font-mono">+{totalNewUsers?.toLocaleString() ?? '—'} <span className="text-[10px] font-normal opacity-50 uppercase tracking-widest text-white">{t('admin.dashboard.userRegChart.usersSuffix')}</span></span>
      </div>
      <div className="h-48 flex items-end justify-between gap-1">
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className={`flex-1 transition-all cursor-pointer ${
              h === 100 ? 'bg-[#80b6ff] hover:opacity-80' : 'bg-[#80b6ff]/20 hover:bg-[#80b6ff]/40'
            }`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <span className="text-[9px] font-mono text-[#d5c4af]/30 uppercase">{t('admin.dashboard.userRegChart.axisStart')}</span>
        <span className="text-[9px] font-mono text-[#d5c4af]/30 uppercase">{t('admin.dashboard.userRegChart.axisEnd')}</span>
      </div>
    </div>
  )
}
