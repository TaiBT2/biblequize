import React from 'react'

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
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card 1: Users */}
      <div className="bg-[#1d1f29] rounded-lg h-[100px] flex flex-col justify-center px-6 border-l-2 border-[#e8a832] shadow-sm">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#d5c4af]/60 font-semibold">Người dùng</span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-white font-mono leading-tight">{kpiValue(data?.totalUsers)}</span>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-green-400 font-medium leading-none">Active: {kpiValue(data?.activeUsers)}</span>
            <span className="text-[10px] text-[#d5c4af]/50 mt-1">+{kpiValue(data?.newUsersThisWeek)} tuần này</span>
          </div>
        </div>
      </div>

      {/* Card 2: Sessions */}
      <div className="bg-[#1d1f29] rounded-lg h-[100px] flex flex-col justify-center px-6 border-l-2 border-[#504535]/20">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#d5c4af]/60 font-semibold">Sessions hôm nay</span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-white font-mono">{kpiValue(data?.activeSessions)}</span>
        </div>
      </div>

      {/* Card 3: Questions */}
      <div className="bg-[#1d1f29] rounded-lg h-[100px] flex flex-col justify-center px-6 border-l-2 border-[#504535]/20">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#d5c4af]/60 font-semibold">Câu hỏi</span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-white font-mono">{kpiValue(data?.totalQuestions)} <span className="text-xs font-normal opacity-40 ml-1">active</span></span>
          {(data?.pendingReview ?? 0) > 0 && (
            <span className="px-2 py-0.5 bg-[#e8a832]/10 text-[#e8a832] text-[9px] uppercase tracking-wider font-bold rounded-sm border border-[#e8a832]/20">{data?.pendingReview} Pending</span>
          )}
        </div>
      </div>

      {/* Card 4: AI Quota */}
      <div className="bg-[#1d1f29] rounded-lg h-[100px] flex flex-col justify-center px-6 border-l-2 border-[#504535]/20">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#d5c4af]/60 font-semibold">AI hôm nay</span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-white font-mono">{kpiValue(data?.aiQuotaUsed)}/{kpiValue(data?.aiQuotaLimit, 200)}</span>
        </div>
      </div>
    </section>
  )
}
