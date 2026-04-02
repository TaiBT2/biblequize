import React from 'react'
import { Link } from 'react-router-dom'

interface ActionItemsProps {
  pendingFeedback?: number
  pendingReview?: number
  reportedGroups?: number
  flaggedUsers?: number
}

export default function ActionItems({ pendingFeedback = 0, pendingReview = 0, reportedGroups = 0, flaggedUsers = 0 }: ActionItemsProps) {
  const items = [
    { label: `${pendingFeedback} feedback đang mở`, color: 'bg-red-500', glow: 'rgba(239,68,68,0.4)', link: '/admin/feedback' },
    { label: `${pendingReview} câu chờ duyệt`, color: 'bg-yellow-500', glow: 'rgba(234,179,8,0.4)', link: '/admin/review-queue' },
    { label: `${reportedGroups} groups bị report`, color: 'bg-yellow-500', glow: 'rgba(234,179,8,0.4)', link: '/admin/groups' },
    { label: `${flaggedUsers} user bị flag`, color: 'bg-red-500', glow: 'rgba(239,68,68,0.4)', link: '/admin/users' },
  ].filter(item => {
    const num = parseInt(item.label)
    return num > 0
  })

  return (
    <div className="bg-[#1d1f29] p-6 flex-1">
      <h3 className="text-xs uppercase tracking-[0.2em] text-[#e8a832] font-bold mb-6">Cần xử lý</h3>
      {items.length === 0 ? (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>Không có việc cần xử lý — hệ thống hoạt động tốt!</span>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} style={{ boxShadow: `0 0 8px ${item.glow}` }} />
              <span className="text-sm text-[#e1e1ef]">{item.label}</span>
              <Link to={item.link} className="ml-auto material-symbols-outlined text-sm opacity-20 hover:opacity-100 cursor-pointer transition-opacity">arrow_forward_ios</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
