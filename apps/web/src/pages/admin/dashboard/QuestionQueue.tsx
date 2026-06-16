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
    { label: t('admin.dashboard.questionQueue.pendingReview'), value: data?.pendingReview ?? 0, color: 'bg-bq-amberd', max: 500 },
    { label: t('admin.dashboard.questionQueue.aiGenerated'), value: data?.aiGenerated ?? 0, color: 'bg-bq-sapphire', max: 2000 },
    { label: t('admin.dashboard.questionQueue.community'), value: data?.communitySubmissions ?? 0, color: 'bg-bq-emerald', max: 200 },
  ]

  return (
    <div className="bg-bq-white border border-bq-hair shadow-bq-soft p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-bq-amberd text-lg">queue</span>
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-bq-ink3 font-semibold">{t('admin.dashboard.questionQueue.title')}</h3>
      </div>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-bq-ink2">{item.label}</span>
              <span className="text-bq-ink font-bold">{item.value.toLocaleString()}</span>
            </div>
            <div className="h-1 bg-bq-inset rounded-full overflow-hidden">
              <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <Link to="/admin/review-queue" className="block mt-6 w-full py-2 text-center text-xs uppercase tracking-wider font-bold text-bq-ink2 border border-bq-hair rounded hover:text-bq-amberd hover:border-bq-amberd/30 transition-colors">
        {t('admin.dashboard.questionQueue.processNext')}
      </Link>
    </div>
  )
}
