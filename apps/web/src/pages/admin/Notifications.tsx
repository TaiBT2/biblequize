import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api/client'

export default function NotificationsAdmin() {
  const { t } = useTranslation()
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const fetchHistory = async () => {
    setIsLoading(true)
    try { const res = await api.get('/api/notifications?limit=20'); setHistory(Array.isArray(res.data) ? res.data : []) }
    catch { /* */ } finally { setIsLoading(false) }
  }

  useEffect(() => { fetchHistory() }, [])

  const sendBroadcast = async () => {
    if (!title.trim() || !content.trim()) return
    setIsSending(true)
    try {
      // Note: broadcast endpoint needs to be created in backend
      // For now, using placeholder
      await new Promise(r => setTimeout(r, 500))
      setSent(true)
      setTitle('')
      setContent('')
      setTimeout(() => setSent(false), 3000)
    } catch { /* */ } finally { setIsSending(false) }
  }

  return (
    <div data-testid="admin-notifications-page" className="space-y-6">
      <div><h2 className="text-3xl font-extrabold text-[#e1e1ef] tracking-tight">{t('admin.notifications.title')}</h2><p className="text-[#d5c4af] text-sm mt-1">{t('admin.notifications.subtitle')}</p></div>

      {/* Compose */}
      <div data-testid="notifications-broadcast-form" className="rounded-lg border border-[#504535]/10 bg-[#1d1f29] p-5 space-y-3">
        <h3 className="font-medium text-[#e1e1ef]">{t('admin.notifications.composeTitle')}</h3>
        <input data-testid="notifications-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('admin.notifications.titlePlaceholder')}
          className="w-full bg-[#191b25] border-none rounded-lg px-4 py-2 text-sm text-[#e1e1ef] focus:ring-1 focus:ring-[#e8a832] outline-none" />
        <textarea data-testid="notifications-content-input" value={content} onChange={e => setContent(e.target.value)} placeholder={t('admin.notifications.contentPlaceholder')} rows={3}
          className="w-full bg-[#191b25] border-none rounded-lg p-3 text-sm text-[#e1e1ef] resize-none focus:ring-1 focus:ring-[#e8a832] outline-none" />
        <div className="flex items-center justify-between">
          <span className="text-[#d5c4af]/40 text-xs">{t('admin.notifications.audienceHint')}</span>
          <button data-testid="notifications-send-btn" onClick={sendBroadcast} disabled={isSending || !title.trim() || !content.trim()}
            className="px-6 py-2 bg-[#e8a832] text-[#281900] rounded-lg text-sm font-bold hover:brightness-110 disabled:opacity-50">
            {isSending ? t('admin.notifications.sending') : t('admin.notifications.sendButton')}
          </button>
        </div>
        {sent && <div data-testid="notifications-success-toast" className="text-emerald-400 text-sm font-medium">{t('admin.notifications.sentConfirm')}</div>}
      </div>

      {/* Automated notifications */}
      <div className="rounded-lg border border-[#504535]/10 bg-[#1d1f29] p-5">
        <h3 className="font-medium text-[#e1e1ef] mb-3">{t('admin.notifications.automatedTitle')}</h3>
        <div className="space-y-2">
          {[
            { nameKey: 'streakBreakName', scheduleKey: 'streakBreakSchedule', enabled: true },
            { nameKey: 'dailyChallengeName', scheduleKey: 'dailyChallengeSchedule', enabled: true },
            { nameKey: 'weeklySummaryName', scheduleKey: 'weeklySummarySchedule', enabled: false },
            { nameKey: 'welcomeName', scheduleKey: 'welcomeSchedule', enabled: true },
            { nameKey: 'tierUpName', scheduleKey: 'tierUpSchedule', enabled: true },
          ].map(n => (
            <div key={n.nameKey} className="flex items-center justify-between p-3 rounded-lg bg-[#1d1f29]">
              <div>
                <p className="text-sm font-medium text-[#d5c4af]">{t(`admin.notifications.automated.${n.nameKey}`)}</p>
                <p className="text-[#d5c4af]/40 text-xs">{t(`admin.notifications.automated.${n.scheduleKey}`)}</p>
              </div>
              <div className={`w-10 h-5 rounded-full ${n.enabled ? 'bg-emerald-500' : 'bg-white/20'} relative`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${n.enabled ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div data-testid="notifications-history" className="rounded-lg border border-[#504535]/10 bg-[#1d1f29] p-5">
        <h3 className="font-medium text-[#e1e1ef] mb-3">{t('admin.notifications.historyTitle')}</h3>
        {isLoading ? <p className="text-[#d5c4af]/40 text-sm">{t('admin.notifications.loading')}</p>
         : history.length === 0 ? <p className="text-[#d5c4af]/40 text-sm">{t('admin.notifications.empty')}</p>
         : <div className="space-y-2">{history.slice(0, 10).map((n: any, i: number) => (
            <div key={i} className="p-3 rounded-lg bg-[#1d1f29] flex items-center justify-between">
              <div><p className="text-sm text-[#d5c4af]">{n.title || n.content?.slice(0, 50)}</p><p className="text-[#d5c4af]/40 text-xs">{n.createdAt}</p></div>
              <span className={`text-xs ${n.isRead ? 'text-[#d5c4af]/30' : 'text-[#e8a832]'}`}>{n.isRead ? t('admin.notifications.readLabel') : t('admin.notifications.unreadLabel')}</span>
            </div>
          ))}</div>
        }
      </div>
    </div>
  )
}
