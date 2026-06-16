import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import KpiCards from './dashboard/KpiCards'
import CoverageChart from './dashboard/CoverageChart'
import QuestionQueue from './dashboard/QuestionQueue'

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/api/admin/dashboard').then(r => r.data),
    staleTime: 30_000,
  })

  const { data: coverageData } = useQuery({
    queryKey: ['admin-coverage'],
    queryFn: () => api.get('/api/admin/questions/coverage').then(r => r.data),
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-6">{[1,2,3,4].map(i => <div key={i} className="h-[100px] bg-[#1d1f29] rounded-lg" />)}</div>
        <div className="grid grid-cols-10 gap-8"><div className="col-span-6 h-[400px] bg-[#1d1f29] rounded-lg" /><div className="col-span-4 h-[300px] bg-[#1d1f29] rounded-lg" /></div>
      </div>
    )
  }

  return (
    <div data-testid="admin-dashboard-page" className="space-y-8">
      {/* Row 1: KPI Cards */}
      <div data-testid="admin-kpi-cards">
        <KpiCards data={data?.kpis ?? null} />
      </div>

      {/* Row 2: Coverage + Question queue */}
      <section className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        <div className="lg:col-span-7">
          <CoverageChart books={coverageData?.books ?? []} />
        </div>
        <div className="lg:col-span-3">
          <QuestionQueue data={data?.questionQueue ?? null} />
        </div>
      </section>
    </div>
  )
}
