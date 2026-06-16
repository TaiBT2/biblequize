import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api/client'

interface UserItem {
  id: string; name: string; email: string; avatarUrl?: string; role: string
  currentStreak: number; longestStreak: number; lastPlayedAt?: string; createdAt: string
  isBanned: boolean; banReason?: string; bannedAt?: string
}

export default function UsersAdmin() {
  const { t } = useTranslation()
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
      ADMIN: 'bg-bq-amberd/10 text-bq-amberd',
      USER: 'bg-bq-sapphire/10 text-bq-sapphire',
      GROUP_LEADER: 'bg-bq-sapphire/10 text-bq-sapphire',
      CONTENT_MOD: 'bg-bq-amber/10 text-bq-amberd',
    }
    return <span className={`px-2 py-1 text-[0.65rem] font-bold rounded uppercase tracking-wider ${m[role] || 'bg-bq-inset text-bq-ink3'}`}>{role}</span>
  }

  return (
    <div data-testid="admin-users-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-extrabold text-bq-ink tracking-tight">{t('admin.users.title')}</h1>
          <p className="text-bq-ink2 text-sm">{t('admin.users.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-bq-ink3 text-sm">search</span>
          <input data-testid="admin-users-search" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers(0)}
            placeholder={t('admin.users.searchPlaceholder')} className="w-full h-10 bg-bq-white border border-bq-hair rounded px-10 text-sm text-bq-ink placeholder:text-bq-ink3 focus:ring-1 focus:ring-bq-sapphire transition-all" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(0) }}
          className="h-10 bg-bq-white border border-bq-hair rounded text-sm text-bq-ink2 px-4 focus:ring-1 focus:ring-bq-sapphire">
          <option value="">{t('admin.users.filterRoleAll')}</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
          <option value="GROUP_LEADER">Group Leader</option>
          <option value="CONTENT_MOD">Content Mod</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="h-10 bg-bq-white border border-bq-hair rounded text-sm text-bq-ink2 px-4 focus:ring-1 focus:ring-bq-sapphire">
          <option value="">{t('admin.users.filterStatusAll')}</option>
          <option value="active">{t('admin.users.statusActive')}</option>
          <option value="banned">{t('admin.users.statusBanned')}</option>
        </select>
        <button className="h-10 px-4 border border-bq-hair flex items-center gap-2 text-bq-amberd font-medium text-sm hover:bg-bq-inset transition-colors rounded">
          <span className="material-symbols-outlined text-sm">download</span>
          {t('admin.users.exportCsv')}
        </button>
      </div>

      {/* Table */}
      <div data-testid="admin-users-table" className="bg-bq-white rounded-lg overflow-hidden border border-bq-hair shadow-bq-soft">
        {isLoading ? (
          <div className="p-8 text-center text-bq-ink3">{t('admin.users.loading')}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-bq-ink3">{t('admin.users.empty')}</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-bq-inset z-10">
              <tr>
                <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-bq-ink2">{t('admin.users.columnUser')}</th>
                <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-bq-ink2">{t('admin.users.columnRole')}</th>
                <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-bq-ink2">{t('admin.users.columnStreak')}</th>
                <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-bq-ink2">{t('admin.users.columnStatus')}</th>
                <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-bq-ink2 text-right">{t('admin.users.columnLastActivity')}</th>
                <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-bq-ink2 text-right">{t('admin.users.columnActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bq-hair">
              {users.map(u => (
                <tr data-testid="admin-user-row" key={u.id} className={`hover:bg-bq-inset transition-colors cursor-pointer ${u.isBanned ? 'opacity-60' : ''}`} onClick={() => { setSelected(u); setBanReason('') }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-bq-inset flex items-center justify-center text-xs font-bold text-bq-ink border ${u.isBanned ? 'border-bq-ruby/50' : 'border-bq-hair'}`}>
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-bq-ink">{u.name}</p>
                        <p className="text-[0.7rem] text-bq-ink3 font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{roleBadge(u.role)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm font-bold text-bq-ink">{u.currentStreak}</span>
                      <span className="text-bq-ink3 text-xs">{t('admin.users.daysUnit')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.isBanned
                      ? <span className="text-bq-ruby text-xs font-bold">{t('admin.users.statusBanned')}</span>
                      : <span className="text-bq-emerald text-xs font-medium">{t('admin.users.statusActive')}</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-xs font-mono text-bq-ink3">{u.lastPlayedAt || '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-bq-inset rounded text-bq-ink2">
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
          <span className="text-xs text-bq-ink3">{t('admin.users.paginationSummary', { total, page: page + 1, totalPages })}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-3 py-1.5 bg-bq-white border border-bq-hair rounded text-sm text-bq-ink disabled:opacity-30 hover:bg-bq-inset transition-colors">{t('admin.users.paginationPrev')}</button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 bg-bq-white border border-bq-hair rounded text-sm text-bq-ink disabled:opacity-30 hover:bg-bq-inset transition-colors">{t('admin.users.paginationNext')}</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div data-testid="admin-user-detail-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-bq-white rounded-lg border border-bq-hair shadow-bq-soft max-w-lg w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            {selected.isBanned && (
              <div className="bg-bq-ruby/10 border border-bq-ruby/30 rounded p-3 text-bq-ruby text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">lock</span>
                {t('admin.users.bannedBanner', { reason: selected.banReason ?? '' })}
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-bq-amber/20 flex items-center justify-center text-lg font-bold text-bq-amberd">
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-bq-ink">{selected.name}</h3>
                <p data-testid="admin-user-detail-email" className="text-bq-ink3 text-sm font-mono">{selected.email}</p>
                <div className="flex gap-2 mt-1">{roleBadge(selected.role)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-bq-inset rounded p-3">
                <span className="text-bq-ink3 text-[10px] uppercase tracking-widest font-bold">{t('admin.users.currentStreakLabel')}</span>
                <p className="font-bold text-bq-ink font-mono mt-1">{t('admin.users.currentStreakValue', { count: selected.currentStreak })}</p>
              </div>
              <div className="bg-bq-inset rounded p-3">
                <span className="text-bq-ink3 text-[10px] uppercase tracking-widest font-bold">{t('admin.users.bestStreakLabel')}</span>
                <p className="font-bold text-bq-ink font-mono mt-1">{t('admin.users.bestStreakValue', { count: selected.longestStreak })}</p>
              </div>
            </div>

            {/* Role change */}
            <div className="flex items-center gap-3">
              <span className="text-bq-ink2 text-sm">{t('admin.users.roleLabel')}</span>
              <select value={selected.role} onChange={e => handleRoleChange(selected, e.target.value)} disabled={isSaving}
                className="bg-bq-white border border-bq-hair rounded px-3 py-1.5 text-sm text-bq-ink focus:ring-1 focus:ring-bq-sapphire">
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="GROUP_LEADER">GROUP_LEADER</option>
                <option value="CONTENT_MOD">CONTENT_MOD</option>
              </select>
            </div>

            {/* Ban/Unban */}
            {selected.isBanned ? (
              <button onClick={() => handleBan(selected, false)} disabled={isSaving}
                className="w-full py-2.5 bg-bq-emerald text-white rounded text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity">
                {t('admin.users.unbanButton')}
              </button>
            ) : (
              <div data-testid="admin-user-ban-btn" className="space-y-2">
                <textarea data-testid="admin-ban-reason-input" value={banReason} onChange={e => setBanReason(e.target.value)} placeholder={t('admin.users.banReasonPlaceholder')}
                  className="w-full bg-bq-white border border-bq-hair rounded p-3 text-sm text-bq-ink placeholder:text-bq-ink3 resize-none focus:ring-1 focus:ring-bq-sapphire" rows={2} />
                <button data-testid="admin-ban-confirm-btn" onClick={() => handleBan(selected, true)} disabled={isSaving || banReason.trim().length < 10}
                  className="w-full py-2.5 bg-bq-ruby text-white rounded text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity">
                  {t('admin.users.banButton')}
                </button>
              </div>
            )}

            <button onClick={() => setSelected(null)} className="w-full py-2 text-bq-ink2 text-sm hover:text-bq-ink transition-colors">{t('admin.users.closeButton')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
