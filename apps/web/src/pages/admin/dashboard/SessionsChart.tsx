import React from 'react'
import { useTranslation } from 'react-i18next'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function SessionsChart({ totalSessions }: { totalSessions?: number }) {
  const { t } = useTranslation()
  return (
    <div className="bg-bq-white border border-bq-hair shadow-bq-soft rounded-lg p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-lg font-display font-bold text-bq-ink">{t('admin.dashboard.sessionsChart.title')}</h3>
          <p className="text-[10px] uppercase tracking-widest text-bq-ink3 mt-1">{t('admin.dashboard.sessionsChart.subtitle')}</p>
        </div>
        <span className="text-2xl font-black text-bq-amberd font-mono">{totalSessions?.toLocaleString() ?? '—'} <span className="text-[10px] font-normal uppercase tracking-widest text-bq-ink3">{t('admin.dashboard.sessionsChart.totalSuffix')}</span></span>
      </div>
      <div className="relative h-48 w-full flex items-end justify-between px-2 pt-4">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="goldGradient" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#D97F06" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M 0 80 Q 15 70 25 75 T 40 40 T 60 55 T 80 20 T 100 30" fill="none" stroke="#D97F06" strokeWidth="2" />
          <path d="M 0 80 Q 15 70 25 75 T 40 40 T 60 55 T 80 20 T 100 30 V 100 H 0 Z" fill="url(#goldGradient)" fillOpacity="0.1" />
        </svg>
        <div className="absolute inset-0 border-b border-bq-hair border-dashed h-1/2" />
        <div className="w-full flex justify-between relative z-10">
          {DAYS.map((day, i) => (
            <div key={day} className="relative flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full bg-bq-amberd border-2 border-bq-white ${i === 0 ? 'shadow-[0_0_8px_#D97F06]' : ''}`} />
              <span className="text-[10px] mt-2 font-mono text-bq-ink3 uppercase tracking-tighter">{day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
