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
}

export default function AdminLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const pageTitle = PAGE_TITLES[location.pathname] || 'Admin'

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-200 ${
      isActive
        ? 'text-[#e8a832] font-semibold bg-[#1d1f29] rounded-r-lg border-l-4 border-[#e8a832]'
        : 'text-[#d5c4af]/60 hover:text-[#e8a832] hover:bg-[#1d1f29]'
    }`

  return (
    <div className="flex min-h-screen font-['Be_Vietnam_Pro']">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-[240px] bg-[#0c0e17] flex flex-col py-6 gap-2 text-sm tracking-tight z-20">
        {/* Branding */}
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tighter text-[#e8a832] uppercase">BIBLEQUIZ</span>
            <span className="text-[10px] uppercase tracking-widest text-[#d5c4af]/50 font-bold">Admin Panel</span>
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
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-[#d5c4af]/60 hover:text-[#e8a832] transition-colors text-sm">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            {t('admin.backToApp')}
          </Link>
          <div className="flex items-center gap-3 px-3 py-3 bg-[#1d1f29] rounded-lg">
            <div className="w-9 h-9 rounded-full bg-[#e8a832]/20 flex items-center justify-center text-[#e8a832] text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</span>
              <span className="text-[10px] text-[#d5c4af]/50 uppercase">{user?.role || 'ADMIN'}</span>
            </div>
            <button onClick={() => logout()} className="ml-auto text-[#d5c4af]/60 hover:text-red-400 transition-colors">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-[240px] flex-1 flex flex-col min-h-screen bg-[#11131c]">
        {/* TopNavBar */}
        <header className="fixed top-0 right-0 h-[56px] w-[calc(100%-240px)] z-10 bg-[#1d1f29] flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold tracking-tight text-[#e1e1ef]">{pageTitle}</h1>
            <div className="flex items-center bg-[#0c0e17]/50 rounded-full px-3 py-1 ml-4 border border-[#504535]/10">
              <span className="material-symbols-outlined text-[#d5c4af] text-sm">search</span>
              <input className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs w-48 placeholder:text-[#d5c4af]/40 text-[#e1e1ef] ml-2" placeholder="Search analytics or logs..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[#d5c4af]">
              <button className="hover:text-[#e8a832] transition-colors">
                <span className="material-symbols-outlined">history</span>
              </button>
              <button className="relative hover:text-[#e8a832] transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#e8a832] rounded-full" />
              </button>
            </div>
            <Link to="/admin/questions" className="bg-[#e8a832] hover:brightness-110 transition-all text-[#281900] font-bold text-xs px-4 py-2 rounded flex items-center gap-2">
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
