import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { formatRelativeTime } from '../utils/dateFormat'

export interface PanelNotification {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  createdAt: string
}

interface NotificationPanelProps {
  isOpen: boolean
  notifications: PanelNotification[]
  unreadCount: number
  onClose: () => void
  onItemClick: (n: PanelNotification) => void
  onMarkAllRead: () => void
  /** Bell button — used to ignore its own clicks in outside-click handler. */
  anchorRef?: React.RefObject<HTMLElement | null>
}

/**
 * Type → emoji + tinted background. Map covers BE-emitted types
 * (streak_warning, tier_up, daily_reminder) plus a fallback bell
 * for unknown / future types so the UI never crashes when BE
 * adds a new type ahead of FE.
 */
const TYPE_STYLE: Record<string, { emoji: string; bg: string }> = {
  streak_warning: { emoji: '🔥', bg: 'bg-[rgba(239,107,94,0.15)]' },
  tier_up: { emoji: '🏆', bg: 'bg-[rgba(232,168,50,0.18)]' },
  daily_reminder: { emoji: '📖', bg: 'bg-[rgba(127,184,232,0.15)]' },
  group_invite: { emoji: '👥', bg: 'bg-[rgba(141,179,139,0.15)]' },
  friend_overtake: { emoji: '⚔️', bg: 'bg-[rgba(239,107,94,0.15)]' },
  tournament_start: { emoji: '🏟️', bg: 'bg-[rgba(127,184,232,0.15)]' },
}

function getStyle(type: string) {
  return TYPE_STYLE[type] ?? { emoji: '🔔', bg: 'bg-[rgba(255,255,255,0.06)]' }
}

interface GroupedNotification {
  key: string
  representative: PanelNotification
  count: number
  hasUnread: boolean
}

/**
 * Collapse consecutive identical notifications (same type + same title) into
 * one row to avoid spam — e.g. the daily challenge ping sent every day looks
 * like 7 identical rows in a week. Latest timestamp wins; row stays unread
 * if any item in the group is unread. Click bubbles up the latest item.
 */
function groupNotifications(items: PanelNotification[]): GroupedNotification[] {
  const groups = new Map<string, GroupedNotification>()
  for (const n of items) {
    const key = `${n.type}::${n.title}`
    const existing = groups.get(key)
    if (existing) {
      existing.count++
      if (!existing.hasUnread && !n.isRead) existing.hasUnread = true
      if (new Date(n.createdAt).getTime() > new Date(existing.representative.createdAt).getTime()) {
        existing.representative = n
      }
    } else {
      groups.set(key, { key, representative: n, count: 1, hasUnread: !n.isRead })
    }
  }
  return Array.from(groups.values()).sort((a, b) =>
    new Date(b.representative.createdAt).getTime() - new Date(a.representative.createdAt).getTime(),
  )
}

export default function NotificationPanel({
  isOpen,
  notifications,
  unreadCount,
  onClose,
  onItemClick,
  onMarkAllRead,
  anchorRef,
}: NotificationPanelProps) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)

  const grouped = useMemo(() => groupNotifications(notifications), [notifications])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (anchorRef?.current?.contains(target)) return
      if (panelRef.current && !panelRef.current.contains(target)) onClose()
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, anchorRef])

  if (!isOpen) return null

  const isEmpty = notifications.length === 0
  const allRead = !isEmpty && unreadCount === 0

  return (
    <div
      ref={panelRef}
      data-testid="notification-panel"
      role="dialog"
      aria-label={t('header.notifications.title') as string}
      className="fixed right-2 top-14 w-[min(24rem,calc(100vw-1rem))] max-h-[min(80vh,640px)] flex flex-col rounded-2xl border border-[rgba(232,168,50,0.18)] bg-[rgba(28,30,40,0.96)] backdrop-blur-md shadow-[0_16px_48px_rgba(0,0,0,0.5)] z-50 overflow-hidden md:absolute md:inset-auto md:left-0 md:top-full md:mt-2 md:right-auto md:w-96"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex flex-col gap-1">
          <span className="text-base font-bold text-[#e8e9ed] leading-none">
            {t('header.notifications.title')}
          </span>
          <span className="text-xs font-medium text-[#8a8d99] leading-none">
            {isEmpty
              ? ''
              : allRead
                ? t('header.notifications.allRead')
                : t('header.notifications.unreadCount', { count: unreadCount })}
          </span>
        </div>
        <button
          data-testid="notification-mark-all"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="text-[13px] font-semibold text-[#e8a832] px-2.5 py-1.5 rounded-lg hover:bg-[rgba(232,168,50,0.1)] disabled:text-[#5a5d6a] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          {t('header.notifications.readAll')}
        </button>
      </div>

      {isEmpty ? (
        <div data-testid="notification-empty" className="px-6 py-12 flex flex-col items-center text-center gap-3">
          <div className="w-[72px] h-[72px] rounded-full bg-[rgba(50,52,64,0.6)] flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-[36px] text-[#6b6e7a]">
              notifications_off
            </span>
          </div>
          <div className="text-[15px] font-semibold text-[#e8e9ed]">
            {t('header.notifications.emptyTitle')}
          </div>
          <div className="text-[13px] text-[#8a8d99] max-w-[240px] leading-[1.5]">
            {t('header.notifications.emptyDesc')}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-2">
          {grouped.map(group => {
            const n = group.representative
            const style = getStyle(n.type)
            const isRead = !group.hasUnread
            const grouped2plus = group.count > 1
            return (
              <button
                key={group.key}
                data-testid={`notification-item-${n.id}`}
                onClick={() => onItemClick(n)}
                className={`relative w-full text-left flex gap-3 px-5 py-3.5 border-b border-white/[0.04] last:border-b-0 transition-colors ${
                  isRead
                    ? 'hover:bg-white/[0.03]'
                    : 'bg-[rgba(232,168,50,0.05)] hover:bg-[rgba(232,168,50,0.08)]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[20px] ${style.bg} ${
                    isRead ? 'opacity-70' : ''
                  }`}
                >
                  {style.emoji}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className={`text-sm leading-[1.35] truncate ${
                        isRead ? 'font-medium text-[#b8bac2]' : 'font-semibold text-[#e8e9ed]'
                      }`}
                    >
                      {n.title}
                    </div>
                    {grouped2plus && (
                      <span
                        data-testid={`notification-group-badge-${n.id}`}
                        className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(232,168,50,0.18)] text-[#e8a832] leading-none"
                        title={t('header.notifications.groupCount', { count: group.count }) as string}
                      >
                        {t('header.notifications.groupCountShort', { count: group.count })}
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] text-[#b8bac2] leading-[1.4] line-clamp-2">
                    {n.body}
                  </div>
                  <div className="text-[11px] text-[#6b6e7a] font-medium mt-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    {formatRelativeTime(n.createdAt)}
                  </div>
                </div>
                {group.hasUnread && (
                  <span
                    aria-hidden
                    className="absolute top-[18px] right-4 w-2 h-2 rounded-full bg-[#e8a832] shadow-[0_0_8px_rgba(232,168,50,0.6)]"
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
