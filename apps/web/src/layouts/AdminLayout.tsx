import React from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'

const NAV_ITEMS = [
  { path: '/admin', end: true, icon: 'dashboard', label: 'Dashboard' },
  { path: '/admin/users', icon: 'group', label: 'Users' },
  { path: '/admin/questions', icon: 'quiz', label: 'Questions' },
  { path: '/admin/ai-generator', icon: 'psychology', label: 'AI Generator' },
  { path: '/admin/review-queue', icon: 'queue', label: 'Review Queue' },
  { path: '/admin/feedback', icon: 'chat_bubble', label: 'Feedback' },
  { path: '/admin/rankings', icon: 'leaderboard', label: 'Seasons & Rankings' },
  { path: '/admin/events', icon: 'event', label: 'Events & Tournaments' },
  { path: '/admin/groups', icon: 'groups_2', label: 'Groups' },
  { path: '/admin/notifications', icon: 'notifications', label: 'Notifications' },
  { path: '/admin/config', icon: 'settings', label: 'Configuration' },
  { path: '/admin/export', icon: 'download', label: 'Export Center' },
  { path: '/admin/question-quality', icon: 'verified', label: 'Question Quality' },
  { path: '/admin/metrics/early-unlock', icon: 'lock_open', label: 'Early Unlock' },
]

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/questions': 'Questions',
  '/admin/ai-generator': 'AI Generator',
  '/admin/review-queue': 'Review Queue',
  '/admin/feedback': 'Feedback',
  '/admin/rankings': 'Seasons & Rankings',
  '/admin/events': 'Events & Tournaments',
  '/admin/groups': 'Groups',
  '/admin/notifications': 'Notifications',
  '/admin/config': 'Configuration',
  '/admin/export': 'Export Center',
  '/admin/question-quality': 'Question Quality',
  '/admin/metrics/early-unlock': 'Early Unlock Metrics',
}

export default function AdminLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const pageTitle = PAGE_TITLES[location.pathname] || 'Admin'

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-200 ${
      isActive
        ? 'text-bq-amberd font-semibold bg-bq-inset rounded-r-lg border-l-4 border-bq-amber'
        : 'text-bq-ink2 hover:text-bq-ink hover:bg-bq-inset'
    }`

  return (
    <div className="flex min-h-screen font-['Be_Vietnam_Pro']">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-[240px] bg-bq-paper border-r border-bq-hair flex flex-col py-6 gap-2 text-sm tracking-tight z-20">
        {/* Branding */}
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tighter text-bq-ink uppercase">BIBLE<span className="text-bq-amberd">QUIZ</span></span>
            <span className="text-[10px] uppercase tracking-widest text-bq-ink3 font-bold">Admin Panel</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end} className={navLinkClass}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="mt-auto px-4 space-y-4 pt-4">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-bq-ink2 hover:text-bq-ink transition-colors text-sm">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            {t('admin.backToApp')}
          </Link>
          <div className="flex items-center gap-3 px-3 py-3 bg-bq-inset rounded-lg">
            <div className="w-9 h-9 rounded-full bg-bq-amber/20 flex items-center justify-center text-bq-amberd text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-bq-ink truncate">{user?.name || 'Admin'}</span>
              <span className="text-[10px] text-bq-ink3 uppercase">{user?.role || 'ADMIN'}</span>
            </div>
            <button onClick={() => logout()} className="ml-auto text-bq-ink2 hover:text-bq-ruby transition-colors">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-[240px] flex-1 flex flex-col min-h-screen bg-bq-paper">
        {/* TopNavBar */}
        <header className="fixed top-0 right-0 h-[56px] w-[calc(100%-240px)] z-10 bg-bq-white border-b border-bq-hair flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-lg font-bold tracking-tight text-bq-ink">{pageTitle}</h1>
            <div className="flex items-center bg-bq-inset rounded-full px-3 py-1 ml-4 border border-bq-hair">
              <span className="material-symbols-outlined text-bq-ink3 text-sm">search</span>
              <input className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs w-48 placeholder:text-bq-ink3 text-bq-ink ml-2" placeholder="Search analytics or logs..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-bq-ink2">
              <button className="hover:text-bq-amberd transition-colors">
                <span className="material-symbols-outlined">history</span>
              </button>
              <button className="relative hover:text-bq-amberd transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-bq-amber rounded-full" />
              </button>
            </div>
            <Link to="/admin/questions" className="bg-bq-action shadow-bq-action hover:brightness-105 transition-all text-white font-bold text-xs px-4 py-2 rounded flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span>
              New Quiz
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="mt-[56px] p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
