import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface ActionItemsProps {
  pendingFeedback?: number
  pendingReview?: number
  reportedGroups?: number
  flaggedUsers?: number
}

export default function ActionItems({ pendingFeedback = 0, pendingReview = 0, reportedGroups = 0, flaggedUsers = 0 }: ActionItemsProps) {
  const { t } = useTranslation()
  const items = [
    { count: pendingFeedback, label: t('admin.dashboard.actionItems.pendingFeedback', { count: pendingFeedback }), color: 'bg-bq-ruby', glow: 'rgba(224,53,75,0.4)', link: '/admin/feedback' },
    { count: pendingReview, label: t('admin.dashboard.actionItems.pendingReview', { count: pendingReview }), color: 'bg-bq-amber', glow: 'rgba(245,158,11,0.4)', link: '/admin/review-queue' },
    { count: reportedGroups, label: t('admin.dashboard.actionItems.reportedGroups', { count: reportedGroups }), color: 'bg-bq-amber', glow: 'rgba(245,158,11,0.4)', link: '/admin/groups' },
    { count: flaggedUsers, label: t('admin.dashboard.actionItems.flaggedUsers', { count: flaggedUsers }), color: 'bg-bq-ruby', glow: 'rgba(224,53,75,0.4)', link: '/admin/users' },
  ].filter(item => item.count > 0)

  return (
    <div className="bg-bq-white border border-bq-hair shadow-bq-soft rounded-lg p-6 flex-1">
      <h3 className="text-xs uppercase tracking-[0.2em] text-bq-amberd font-bold mb-6">{t('admin.dashboard.actionItems.sectionTitle')}</h3>
      {items.length === 0 ? (
        <div className="flex items-center gap-2 text-bq-emerald text-sm">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>{t('admin.dashboard.actionItems.noneMessage')}</span>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} style={{ boxShadow: `0 0 8px ${item.glow}` }} />
              <span className="text-sm text-bq-ink2">{item.label}</span>
              <Link to={item.link} className="ml-auto material-symbols-outlined text-sm text-bq-ink3 opacity-60 hover:opacity-100 cursor-pointer transition-opacity">arrow_forward_ios</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
