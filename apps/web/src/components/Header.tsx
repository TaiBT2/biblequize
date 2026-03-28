import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styles from './Header.module.css'

const Header: React.FC = () => {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { to: '/',            label: 'Trang chủ'    },
    { to: '/practice',    label: 'Luyện tập'    },
    { to: '/ranked',      label: 'Leo Rank'     },
    { to: '/multiplayer', label: 'Multiplayer'  },
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
