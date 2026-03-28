import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { api } from '../api/client'
import styles from './Header.module.css'

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} ngày trước`
}

const Header: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications?unread=true&limit=10')
      setNotifications(res.data.notifications || [])
      setUnreadCount(res.data.unreadCount || 0)
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, fetchNotifications])

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all')
      fetchNotifications()
    } catch {
      // silently ignore
    }
  }

  const handleNotifClick = async (n: any) => {
    try {
      await api.patch(`/api/notifications/${n.id}/read`)
      fetchNotifications()
    } catch {
      // silently ignore
    }
    setShowNotifications(false)
    const routes: Record<string, string> = {
      tier_up: '/ranked',
      streak_warning: '/daily',
      daily_reminder: '/daily',
      friend_overtake: '/leaderboard',
      group_invite: '/groups',
      tournament_start: '/multiplayer',
    }
    const target = routes[n.type]
    if (target) navigate(target)
  }

  const navLinks = [
    { to: '/',            label: 'Trang chủ'    },
    { to: '/daily',       label: 'Hằng ngày'    },
    { to: '/practice',    label: 'Luyện tập'    },
    { to: '/ranked',      label: 'Leo Rank'     },
    { to: '/multiplayer', label: 'Multiplayer'  },
    { to: '/groups',      label: 'Nhóm'         },
    { to: '/leaderboard', label: 'Bảng xếp hạng'},
  ]

  return (
    <header className={styles.header}>
      {/* Logo */}
      <Link to="/" className={styles.logo}>
        <em className={styles.logoIcon}>✝</em>
        BibleQuiz
      </Link>

      {/* Nav links */}
      <nav className={styles.nav}>
        {navLinks.map(link => {
          const active = location.pathname === link.to
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
            >
              {link.label}
              {active && <span className={styles.navLinkUnderline} />}
            </Link>
          )
        })}
      </nav>

      {/* Notification bell */}
      {isAuthenticated && (
        <div className={styles.notificationWrap} ref={notifRef}>
          <button className={styles.notifBtn} onClick={() => setShowNotifications(p => !p)}>
            🔔
            {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>
                <span>Thông báo</span>
                {unreadCount > 0 && <button onClick={markAllAsRead}>Đọc tất cả</button>}
              </div>
              {notifications.length === 0 ? (
                <div className={styles.notifEmpty}>Không có thông báo mới</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`${styles.notifItem} ${!n.isRead ? styles.notifUnread : ''}`}
                       onClick={() => handleNotifClick(n)}>
                    <div className={styles.notifTitle}>{n.title}</div>
                    <div className={styles.notifBody}>{n.body}</div>
                    <div className={styles.notifTime}>{timeAgo(n.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* User menu */}
      {isAuthenticated ? (
        <div ref={dropdownRef} className={styles.userWrap}>
          <button
            className={styles.userBtn}
            onClick={() => setDropdownOpen(p => !p)}
          >
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <span className={styles.userName}>{user?.name}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={styles.chevron}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <Link
                to="/profile"
                className={styles.dropdownItem}
                onClick={() => setDropdownOpen(false)}
              >
                <span>👤</span> Hồ sơ
              </Link>
              <Link
                to="/achievements"
                className={styles.dropdownItem}
                onClick={() => setDropdownOpen(false)}
              >
                <span>🏆</span> Thành tích
              </Link>
              <div className={styles.dropdownDivider} />
              <button
                className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                onClick={() => { logout(); setDropdownOpen(false) }}
              >
                <span>→</span> Đăng xuất
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login" className={styles.loginBtn}>Đăng nhập</Link>
      )}
    </header>
  )
}

export default Header
