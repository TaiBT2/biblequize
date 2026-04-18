import React from 'react'
import { useTranslation } from 'react-i18next'

interface Activity {
  action: string
  admin: string
  timestamp?: string
  detail?: string
}

export default function ActivityLog({ activities }: { activities: Activity[] }) {
  const { t } = useTranslation()
  return (
    <div className="bg-[#1d1f29] p-6 flex-1">
      <h3 className="text-xs uppercase tracking-[0.2em] text-[#d5c4af]/50 font-bold mb-6">{t('admin.dashboard.activityLog.title')}</h3>
      {activities.length === 0 ? (
        <div className="text-center py-4">
          <span className="material-symbols-outlined text-3xl text-[#e1e1ef]/20 block mb-2">history</span>
          <p className="text-sm text-[#e1e1ef]/40">{t('admin.dashboard.activityLog.empty')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {activities.slice(0, 5).map((a, i) => (
            <div key={i} className="flex flex-col">
              <p className="text-[13px] text-[#e1e1ef]/90 leading-tight">{a.action} — <span className="font-mono text-[#e8a832]">{a.admin}</span></p>
              <span className="text-[10px] text-[#d5c4af]/40 mt-1 uppercase font-mono">{a.timestamp || ''}{a.detail ? ` — ${a.detail}` : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
