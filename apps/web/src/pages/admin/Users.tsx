import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'

interface UserItem {
  id: string; name: string; email: string; avatarUrl?: string; role: string
  currentStreak: number; longestStreak: number; lastPlayedAt?: string; createdAt: string
  isBanned: boolean; banReason?: string; bannedAt?: string
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selected, setSelected] = useState<UserItem | null>(null)
  const [banReason, setBanReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchUsers = async (p = page) => {
    setIsLoading(true)
    try {
      const params: Record<string, any> = { page: p, size: 20 }
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/api/admin/users', { params })
      setUsers(res.data.items ?? [])
      setTotal(res.data.total ?? 0)
      setTotalPages(res.data.totalPages ?? 1)
    } catch { /* graceful */ }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [page, roleFilter, statusFilter])

  const handleBan = async (user: UserItem, ban: boolean) => {
    if (ban && banReason.trim().length < 10) return
    setIsSaving(true)
    try {
      await api.patch(`/api/admin/users/${user.id}/ban`, { banned: ban, reason: ban ? banReason : undefined })
      fetchUsers()
      setSelected(null)
      setBanReason('')
    } catch { /* error */ }
    finally { setIsSaving(false) }
  }

  const handleRoleChange = async (user: UserItem, newRole: string) => {
    setIsSaving(true)
    try {
      await api.patch(`/api/admin/users/${user.id}/role`, { role: newRole })
      fetchUsers()
    } catch { /* error */ }
    finally { setIsSaving(false) }
  }

  const roleBadge = (role: string) => {
    const m: Record<string, string> = {
      ADMIN: 'bg-red-500/10 text-red-400',
      USER: 'bg-blue-500/10 text-blue-400',
      GROUP_LEADER: 'bg-[#80b6ff]/10 text-[#80b6ff]',
      CONTENT_MOD: 'bg-[#e8a832]/10 text-[#e8a832]',
    }
    return <span className={`px-2 py-1 text-[0.65rem] font-bold rounded uppercase tracking-wider ${m[role] || 'bg-white/5 text-[#d5c4af]/60'}`}>{role}</span>
  }

  return (
    <div data-testid="admin-users-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-[#e1e1ef] tracking-tight">Quản lý người dùng</h1>
          <p className="text-[#d5c4af] text-sm">Quản trị viên có thể kiểm soát quyền hạn và trạng thái của toàn bộ hệ thống.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#d5c4af]/50 text-sm">search</span>
          <input data-testid="admin-users-search" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers(0)}
            placeholder="Tìm theo tên hoặc email..." className="w-full h-10 bg-[#191b25] border-none rounded px-10 text-sm text-[#e1e1ef] placeholder:text-[#d5c4af]/40 focus:ring-1 focus:ring-[#e8a832] transition-all" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(0) }}
          className="h-10 bg-[#191b25] border-none rounded text-sm text-[#d5c4af] px-4 focus:ring-1 focus:ring-[#e8a832]">
          <option value="">Role (All)</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
          <option value="GROUP_LEADER">Group Leader</option>
          <option value="CONTENT_MOD">Content Mod</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="h-10 bg-[#191b25] border-none rounded text-sm text-[#d5c4af] px-4 focus:ring-1 focus:ring-[#e8a832]">
          <option value="">Status (All)</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
        <button className="h-10 px-4 border border-[#504535]/20 flex items-center gap-2 text-[#e8a832] font-medium text-sm hover:bg-[#32343e] transition-colors rounded">
          <span className="material-symbols-outlined text-sm">download</span>
          Xuất CSV
        </button>
      </div>

      {/* Table */}
      <div data-testid="admin-users-table" className="bg-[#1d1f29] rounded-lg overflow-hidden border border-[#504535]/10">
        {isLoading ? (
          <div className="p-8 text-center text-[#d5c4af]/40">Đang tải...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-[#d5c4af]/40">Không tìm thấy người dùng</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#282933] z-10">
              <tr>
                <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-[#d5c4af]/80">Người dùng</th>
                <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-[#d5c4af]/80">Quyền hạn</th>
                <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-[#d5c4af]/80">Streak</th>
                <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-[#d5c4af]/80">Status</th>
                <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-[#d5c4af]/80 text-right">Hoạt động cuối</th>
                <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-[#d5c4af]/80 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#504535]/5">
              {users.map(u => (
                <tr data-testid="admin-user-row" key={u.id} className={`hover:bg-[#373943] transition-colors cursor-pointer ${u.isBanned ? 'opacity-60' : ''}`} onClick={() => { setSelected(u); setBanReason('') }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold border ${u.isBanned ? 'border-red-500/50' : 'border-[#504535]/20'}`}>
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#e1e1ef]">{u.name}</p>
                        <p className="text-[0.7rem] text-[#d5c4af]/60 font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{roleBadge(u.role)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm font-bold text-[#e1e1ef]">{u.currentStreak}</span>
                      <span className="text-[#d5c4af]/40 text-xs">ngày</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.isBanned
                      ? <span className="text-red-400 text-xs font-bold">Banned</span>
                      : <span className="text-green-400 text-xs font-medium">Active</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-xs font-mono text-[#d5c4af]/60">{u.lastPlayedAt || '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-[#32343e] rounded text-[#d5c4af]">
                      <span className="material-symbols-outlined text-lg">more_horiz</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#d5c4af]/40">{total} users total — Page {page + 1}/{totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-3 py-1.5 bg-[#1d1f29] rounded text-sm text-[#e1e1ef] disabled:opacity-30 hover:bg-[#32343e] transition-colors">Prev</button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 bg-[#1d1f29] rounded text-sm text-[#e1e1ef] disabled:opacity-30 hover:bg-[#32343e] transition-colors">Next</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div data-testid="admin-user-detail-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#1d1f29] rounded-lg border border-[#504535]/20 max-w-lg w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            {selected.isBanned && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-red-400 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">lock</span>
                Tài khoản đã bị khóa — {selected.banReason}
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#e8a832]/20 flex items-center justify-center text-lg font-bold text-[#e8a832]">
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#e1e1ef]">{selected.name}</h3>
                <p data-testid="admin-user-detail-email" className="text-[#d5c4af]/60 text-sm font-mono">{selected.email}</p>
                <div className="flex gap-2 mt-1">{roleBadge(selected.role)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[#11131c] rounded p-3">
                <span className="text-[#d5c4af]/40 text-[10px] uppercase tracking-widest font-bold">Streak hiện tại</span>
                <p className="font-bold text-[#e1e1ef] font-mono mt-1">{selected.currentStreak} ngày</p>
              </div>
              <div className="bg-[#11131c] rounded p-3">
                <span className="text-[#d5c4af]/40 text-[10px] uppercase tracking-widest font-bold">Best Streak</span>
                <p className="font-bold text-[#e1e1ef] font-mono mt-1">{selected.longestStreak} ngày</p>
              </div>
            </div>

            {/* Role change */}
            <div className="flex items-center gap-3">
              <span className="text-[#d5c4af]/60 text-sm">Role:</span>
              <select value={selected.role} onChange={e => handleRoleChange(selected, e.target.value)} disabled={isSaving}
                className="bg-[#11131c] border border-[#504535]/20 rounded px-3 py-1.5 text-sm text-[#e1e1ef] focus:ring-1 focus:ring-[#e8a832]">
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="GROUP_LEADER">GROUP_LEADER</option>
                <option value="CONTENT_MOD">CONTENT_MOD</option>
              </select>
            </div>

            {/* Ban/Unban */}
            {selected.isBanned ? (
              <button onClick={() => handleBan(selected, false)} disabled={isSaving}
                className="w-full py-2.5 bg-green-600 text-white rounded text-sm font-bold disabled:opacity-50 hover:bg-green-500 transition-colors">
                Mở khóa tài khoản
              </button>
            ) : (
              <div data-testid="admin-user-ban-btn" className="space-y-2">
                <textarea data-testid="admin-ban-reason-input" value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Lý do khóa (tối thiểu 10 ký tự)..."
                  className="w-full bg-[#11131c] border border-[#504535]/20 rounded p-3 text-sm text-[#e1e1ef] placeholder:text-[#d5c4af]/30 resize-none focus:ring-1 focus:ring-[#e8a832]" rows={2} />
                <button data-testid="admin-ban-confirm-btn" onClick={() => handleBan(selected, true)} disabled={isSaving || banReason.trim().length < 10}
                  className="w-full py-2.5 bg-red-600 text-white rounded text-sm font-bold disabled:opacity-50 hover:bg-red-500 transition-colors">
                  Khóa tài khoản
                </button>
              </div>
            )}

            <button onClick={() => setSelected(null)} className="w-full py-2 text-[#d5c4af]/60 text-sm hover:text-[#e1e1ef] transition-colors">Đóng</button>
          </div>
        </div>
      )}
    </div>
  )
}
