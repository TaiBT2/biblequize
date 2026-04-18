import React from 'react'
import { useTranslation } from 'react-i18next'

interface KpiData {
  totalUsers: number
  totalQuestions: number
  pendingReview: number
  activeSessions?: number
  activeUsers?: number
  newUsersThisWeek?: number
  aiQuotaUsed?: number
  aiQuotaLimit?: number
}

function kpiValue(val: number | undefined | null, fallback = 0): string {
  return (val ?? fallback).toLocaleString()
}

export default function KpiCards({ data }: { data: KpiData | null }) {
  const { t } = useTranslation()
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card 1: Users */}
      <div data-testid="kpi-total-users" className="bg-[#1d1f29] rounded-lg h-[100px] flex flex-col justify-center px-6 border-l-2 border-[#e8a832] shadow-sm">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#d5c4af]/60 font-semibold">{t('admin.dashboard.kpi.users')}</span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-white font-mono leading-tight">{kpiValue(data?.totalUsers)}</span>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-green-400 font-medium leading-none">{t('admin.dashboard.kpi.active', { count: kpiValue(data?.activeUsers) })}</span>
            <span className="text-[10px] text-[#d5c4af]/50 mt-1">{t('admin.dashboard.kpi.newThisWeek', { count: kpiValue(data?.newUsersThisWeek) })}</span>
          </div>
        </div>
      </div>

      {/* Card 2: Sessions */}
      <div className="bg-[#1d1f29] rounded-lg h-[100px] flex flex-col justify-center px-6 border-l-2 border-[#504535]/20">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#d5c4af]/60 font-semibold">{t('admin.dashboard.kpi.sessionsToday')}</span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-white font-mono">{kpiValue(data?.activeSessions)}</span>
        </div>
      </div>

      {/* Card 3: Questions */}
      <div data-testid="kpi-total-questions" className="bg-[#1d1f29] rounded-lg h-[100px] flex flex-col justify-center px-6 border-l-2 border-[#504535]/20">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#d5c4af]/60 font-semibold">{t('admin.dashboard.kpi.questions')}</span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-white font-mono">{kpiValue(data?.totalQuestions)} <span className="text-xs font-normal opacity-40 ml-1">{t('admin.dashboard.kpi.activeSuffix')}</span></span>
          <span data-testid="kpi-pending-review" className={`px-2 py-0.5 bg-[#e8a832]/10 text-[#e8a832] text-[9px] uppercase tracking-wider font-bold rounded-sm border border-[#e8a832]/20 ${(data?.pendingReview ?? 0) > 0 ? '' : 'opacity-40'}`}>{t('admin.dashboard.kpi.pendingChip', { count: data?.pendingReview ?? 0 })}</span>
        </div>
      </div>

      {/* Card 4: AI Quota */}
      <div className="bg-[#1d1f29] rounded-lg h-[100px] flex flex-col justify-center px-6 border-l-2 border-[#504535]/20">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#d5c4af]/60 font-semibold">{t('admin.dashboard.kpi.aiToday')}</span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-white font-mono">{kpiValue(data?.aiQuotaUsed)}/{kpiValue(data?.aiQuotaLimit, 200)}</span>
        </div>
      </div>
    </section>
  )
}
