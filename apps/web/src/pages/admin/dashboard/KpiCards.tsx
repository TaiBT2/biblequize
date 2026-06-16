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

function n(val: number | undefined | null, fallback = 0): string {
  return (val ?? fallback).toLocaleString()
}

export default function KpiCards({ data }: { data: KpiData | null }) {
  const { t } = useTranslation()
  const aiUsed = data?.aiQuotaUsed ?? 0
  const aiLimit = data?.aiQuotaLimit ?? 200
  const aiPct = aiLimit > 0 ? Math.min(100, Math.round((aiUsed / aiLimit) * 100)) : 0
  const pending = data?.pendingReview ?? 0

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Users — primary card with gold accent */}
      <div data-testid="kpi-total-users"
        className="relative bg-[#1d1f29] rounded-xl border border-[#e8a832]/25 p-5 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#e8a832] to-[#e7c268]" />
        <div className="flex items-center justify-between mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#e8a832]/15 text-[#e8a832] flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">group</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            {t('admin.dashboard.kpi.newThisWeek', { count: n(data?.newUsersThisWeek) })}
          </span>
        </div>
        <div className="text-3xl font-bold text-white font-mono leading-none">{n(data?.totalUsers)}</div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] uppercase tracking-[0.15em] text-[#d5c4af]/55 font-semibold">{t('admin.dashboard.kpi.users')}</span>
          <span className="text-[10px] text-emerald-400 font-medium">{t('admin.dashboard.kpi.active', { count: n(data?.activeUsers) })}</span>
        </div>
      </div>

      {/* Sessions */}
      <div className="relative bg-[#1d1f29] rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors">
        <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-xl">bolt</span>
        </div>
        <div className="text-3xl font-bold text-white font-mono leading-none">{n(data?.activeSessions)}</div>
        <span className="block text-[11px] uppercase tracking-[0.15em] text-[#d5c4af]/55 font-semibold mt-2">{t('admin.dashboard.kpi.sessionsToday')}</span>
      </div>

      {/* Questions */}
      <div data-testid="kpi-total-questions" className="relative bg-[#1d1f29] rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">quiz</span>
          </div>
          <span data-testid="kpi-pending-review"
            className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded border ${
              pending > 0 ? 'bg-[#e8a832]/10 text-[#e8a832] border-[#e8a832]/25' : 'bg-white/5 text-[#d5c4af]/40 border-white/5'
            }`}>{t('admin.dashboard.kpi.pendingChip', { count: pending })}</span>
        </div>
        <div className="text-3xl font-bold text-white font-mono leading-none">{n(data?.totalQuestions)}</div>
        <span className="block text-[11px] uppercase tracking-[0.15em] text-[#d5c4af]/55 font-semibold mt-2">
          {t('admin.dashboard.kpi.questions')} <span className="lowercase tracking-normal opacity-50">· {t('admin.dashboard.kpi.activeSuffix')}</span>
        </span>
      </div>

      {/* AI quota — with usage bar */}
      <div className="relative bg-[#1d1f29] rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-xl">auto_awesome</span>
        </div>
        <div className="text-3xl font-bold text-white font-mono leading-none">{n(aiUsed)}<span className="text-base text-[#d5c4af]/40">/{n(aiLimit)}</span></div>
        <span className="block text-[11px] uppercase tracking-[0.15em] text-[#d5c4af]/55 font-semibold mt-2 mb-2">{t('admin.dashboard.kpi.aiToday')}</span>
        <div className="h-1 bg-[#11131c] rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500/70 rounded-full" style={{ width: `${aiPct}%` }} />
        </div>
      </div>
    </section>
  )
}
