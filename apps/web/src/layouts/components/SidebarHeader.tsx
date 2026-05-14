import { Link } from 'react-router-dom'
import NotificationBell from './NotificationBell'

/**
 * Top of the desktop sidebar — gold "Bible|Quiz" wordmark per
 * home_modern.html `.logo-wrap` (gold circular book glyph + sans 800
 * "Bible" ivory + "Quiz" gold). NotificationBell on the right.
 */
export default function SidebarHeader() {
  return (
    <div
      data-testid="sidebar-header"
      className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10"
    >
      <Link
        to="/"
        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        aria-label="BibleQuiz home"
      >
        <span
          aria-hidden
          className="grid place-items-center w-7 h-7 rounded-full shrink-0"
          style={{
            background: 'linear-gradient(135deg, #e8a832, #c98a1c)',
            boxShadow: '0 0 16px rgba(232,168,50,0.35)',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1a1208"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M4 4v16c0-1.1.9-2 2-2h14V2H6c-1.1 0-2 .9-2 2z" />
            <path d="M9 8h6M9 12h4" />
          </svg>
        </span>
        <span className="text-[19px] font-extrabold text-ivory tracking-[-0.02em] leading-none">
          Bible<span className="text-secondary">Quiz</span>
        </span>
      </Link>
      <NotificationBell />
    </div>
  )
}
