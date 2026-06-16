import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface QueueData {
  pendingReview: number
}

export default function QuestionQueue({ data }: { data: QueueData | null }) {
  const { t } = useTranslation()
  const pending = data?.pendingReview ?? 0
  const hasPending = pending > 0

  return (
    <div className="bg-[#1d1f29] rounded-xl border border-white/5 p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-[#e8a832] text-lg">inbox</span>
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#d5c4af]/60 font-semibold">{t('admin.dashboard.questionQueue.title')}</h3>
      </div>

      {/* Big pending stat */}
      <div className="flex flex-col items-center justify-center py-6">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${
          hasPending ? 'bg-[#e8a832]/15 text-[#e8a832]' : 'bg-emerald-500/10 text-emerald-400'
        }`}>
          <span className="material-symbols-outlined text-3xl">{hasPending ? 'rate_review' : 'task_alt'}</span>
        </div>
        <span className={`text-4xl font-bold font-mono leading-none ${hasPending ? 'text-white' : 'text-emerald-400'}`}>
          {pending.toLocaleString()}
        </span>
        <span className="text-[11px] uppercase tracking-[0.15em] text-[#d5c4af]/55 font-semibold mt-2">
          {t('admin.dashboard.questionQueue.pendingReview')}
        </span>
      </div>

      <Link to="/admin/review-queue"
        className={`mt-auto block w-full py-2.5 text-center text-xs uppercase tracking-wider font-bold rounded-lg transition-all ${
          hasPending
            ? 'gold-gradient text-[#281900] hover:brightness-110'
            : 'text-[#d5c4af]/60 border border-white/10 hover:text-[#e8a832] hover:border-[#e8a832]/30'
        }`}>
        {t('admin.dashboard.questionQueue.processNext')}
      </Link>
    </div>
  )
}
