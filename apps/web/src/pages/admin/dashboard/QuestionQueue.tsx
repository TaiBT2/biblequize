import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface QueueData {
  pendingReview: number
  aiGenerated: number
  communitySubmissions: number
}

export default function QuestionQueue({ data }: { data: QueueData | null }) {
  const { t } = useTranslation()
  const items = [
    { label: t('admin.dashboard.questionQueue.pendingReview'), value: data?.pendingReview ?? 0, color: 'bg-[#e8a832]', max: 500 },
    { label: t('admin.dashboard.questionQueue.aiGenerated'), value: data?.aiGenerated ?? 0, color: 'bg-blue-500', max: 2000 },
    { label: t('admin.dashboard.questionQueue.community'), value: data?.communitySubmissions ?? 0, color: 'bg-green-500', max: 200 },
  ]

  return (
    <div className="bg-[#1d1f29] p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-[#e8a832] text-lg">queue</span>
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#d5c4af]/60 font-semibold">{t('admin.dashboard.questionQueue.title')}</h3>
      </div>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#d5c4af]/60">{item.label}</span>
              <span className="text-white font-bold">{item.value.toLocaleString()}</span>
            </div>
            <div className="h-1 bg-[#11131c] rounded-full overflow-hidden">
              <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <Link to="/admin/review-queue" className="block mt-6 w-full py-2 text-center text-xs uppercase tracking-wider font-bold text-[#d5c4af]/60 border border-[#504535]/10 rounded hover:text-[#e8a832] hover:border-[#e8a832]/30 transition-colors">
        {t('admin.dashboard.questionQueue.processNext')}
      </Link>
    </div>
  )
}
