import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../api/client'
import NotificationPanel, {
  type PanelNotification,
} from '../../components/NotificationPanel'

const NOTIFICATION_ROUTES: Record<string, string> = {
  tier_up: '/ranked',
  streak_warning: '/daily',
  daily_reminder: '/daily',
  friend_overtake: '/leaderboard',
  group_invite: '/groups',
  tournament_start: '/multiplayer',
}

interface NotificationBellProps {
  /** Optional class to layout the wrapper inside the host (sidebar /
   *  mobile top bar). Defaults to a small inline-block. */
  wrapperClassName?: string
}

/**
 * Bell button + unread badge. Owns the data-fetching loop (poll
 * every 30s while authenticated) and delegates render of the
 * dropdown to {@link NotificationPanel}, which handles the
 * redesigned three-state UI (empty / all-read / mixed).
 */
export default function NotificationBell({ wrapperClassName = '' }: NotificationBellProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [notifications, setNotifications] = useState<PanelNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications?unread=true&limit=10')
      setNotifications(res.data?.notifications || [])
      setUnreadCount(res.data?.unreadCount || 0)
    } catch {
      // silently ignore; bell still renders, just without count.
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [isAuthenticated, fetchNotifications])

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all')
      fetchNotifications()
    } catch {
      // ignore
    }
  }

  const handleItemClick = async (n: PanelNotification) => {
    try {
      await api.patch(`/api/notifications/${n.id}/read`)
      fetchNotifications()
    } catch {
      // ignore
    }
    setOpen(false)
    const target = NOTIFICATION_ROUTES[n.type]
    if (target) navigate(target)
  }

  if (!isAuthenticated) return null

  return (
    <div className={`relative ${wrapperClassName}`} data-testid="notification-bell">
      <button
        ref={buttonRef}
        data-testid="notification-bell-btn"
        aria-label={t('header.notifications.title') as string}
        onClick={() => setOpen(p => !p)}
        className="relative w-10 h-10 flex items-center justify-center rounded-[10px] bg-[rgba(50,52,64,0.5)] border border-white/[0.08] text-[#e8e9ed] hover:bg-[rgba(70,72,88,0.8)] hover:border-[rgba(232,168,50,0.3)] transition-colors"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span
            data-testid="notification-bell-badge"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[5px] rounded-[9px] bg-[#ef6b5e] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#11131e] leading-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel
        isOpen={open}
        notifications={notifications}
        unreadCount={unreadCount}
        onClose={() => setOpen(false)}
        onItemClick={handleItemClick}
        onMarkAllRead={markAllAsRead}
        anchorRef={buttonRef}
      />
    </div>
  )
}
