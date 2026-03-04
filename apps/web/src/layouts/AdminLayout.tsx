import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-blue-700 hover:text-white'}`

  return (
    <div className="min-h-screen bg-[#0f0e17] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0f0e17]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-semibold tracking-wide">BibleQuiz · Admin</div>
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/admin/users" className={navLinkClass}>Users</NavLink>
            <NavLink to="/admin/questions" className={navLinkClass}>Questions</NavLink>
            <NavLink to="/admin/rankings" className={navLinkClass}>Rankings</NavLink>
            <NavLink to="/admin/events" className={navLinkClass}>Events</NavLink>
            <NavLink to="/admin/ai-generator" className={navLinkClass}>AI Generator</NavLink>
            <Link to="/" className="ml-2 px-3 py-2 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white">Home</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <aside className="md:col-span-3 lg:col-span-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-sm uppercase tracking-wider text-white/60 mb-2">Navigation</div>
            <div className="flex md:flex-col gap-2">
              <NavLink to="/admin/users" className={navLinkClass}>Users</NavLink>
              <NavLink to="/admin/questions" className={navLinkClass}>Questions</NavLink>
              <NavLink to="/admin/rankings" className={navLinkClass}>Rankings</NavLink>
              <NavLink to="/admin/events" className={navLinkClass}>Events</NavLink>
              <NavLink to="/admin/ai-generator" className={navLinkClass}>AI Generator</NavLink>
            </div>
          </div>
        </aside>

        <main className="md:col-span-9 lg:col-span-10">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}


