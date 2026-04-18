import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api/client'

interface Group { id: string; name: string; code: string; memberCount: number; maxMembers: number; isPublic: boolean; isLocked: boolean; lockReason?: string; leaderName?: string; createdAt: string }

export default function GroupsAdmin() {
  const { t } = useTranslation()
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selected, setSelected] = useState<Group | null>(null)
  const [lockReason, setLockReason] = useState('')

  const fetchGroups = async () => {
    setIsLoading(true)
    try { const res = await api.get('/api/admin/groups'); setGroups(Array.isArray(res.data) ? res.data : []) }
    catch { /* */ } finally { setIsLoading(false) }
  }

  useEffect(() => { fetchGroups() }, [])

  const lockGroup = async (id: string) => {
    if (lockReason.trim().length < 10) return
    try { await api.patch(`/api/admin/groups/${id}/lock`, { reason: lockReason }); fetchGroups(); setSelected(null); setLockReason('') } catch { /* */ }
  }

  const unlockGroup = async (id: string) => {
    try { await api.patch(`/api/admin/groups/${id}/unlock`); fetchGroups(); setSelected(null) } catch { /* */ }
  }

  const deleteGroup = async (id: string) => {
    if (!confirm(t('admin.groups.deleteConfirm'))) return
    try { await api.delete(`/api/admin/groups/${id}`); fetchGroups(); setSelected(null) } catch { /* */ }
  }

  return (
    <div data-testid="admin-groups-page" className="space-y-6">
      <div><h1 className="text-3xl font-extrabold text-[#e1e1ef] tracking-tight">{t('admin.groups.title')}</h1><p className="text-[#d5c4af]/60 text-sm">{t('admin.groups.subtitle', { count: groups.length })}</p></div>

      {isLoading ? <div className="text-center text-[#d5c4af]/60 py-8">{t('admin.groups.loading')}</div>
       : groups.length === 0 ? <div className="text-center text-[#d5c4af]/60 py-8">{t('admin.groups.empty')}</div>
       : <div data-testid="admin-groups-list" className="space-y-3">{groups.map(g => (
          <div data-testid="admin-group-row" key={g.id} className={`rounded-lg border bg-[#1d1f29] p-4 flex items-center justify-between ${g.isLocked ? 'border-red-500/30 bg-red-500/5' : 'border-[#504535]/20'}`}>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-[#e1e1ef]">{g.name}</h4>
                {g.isLocked && <span data-testid="group-lock-badge" className="text-red-400 text-xs font-bold">{t('admin.groups.lockedBadge')}</span>}
                {g.isPublic && <span className="text-blue-400 text-xs">{t('admin.groups.publicBadge')}</span>}
              </div>
              <p className="text-[#d5c4af]/60 text-xs">{t('admin.groups.rowSummary', { code: g.code, members: g.memberCount, max: g.maxMembers, leader: g.leaderName || '—' })}</p>
              {g.isLocked && g.lockReason && <p className="text-red-400/60 text-xs mt-1">{t('admin.groups.lockReasonLabel', { reason: g.lockReason })}</p>}
            </div>
            <button onClick={() => { setSelected(g); setLockReason('') }} className="text-[#e8a832] text-xs hover:underline">{t('admin.groups.detailsButton')}</button>
          </div>
        ))}</div>
      }

      {selected && (
        <div data-testid="admin-group-detail-modal" className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#1d1f29] rounded-2xl border border-[#504535]/20 max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#e1e1ef]">{selected.name}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[#1d1f29] rounded-lg p-3"><span className="text-[#d5c4af]/60 text-xs">{t('admin.groups.membersLabel')}</span><p className="font-bold text-[#e1e1ef]">{selected.memberCount}/{selected.maxMembers}</p></div>
              <div className="bg-[#1d1f29] rounded-lg p-3"><span className="text-[#d5c4af]/60 text-xs">{t('admin.groups.codeLabel')}</span><p className="font-bold text-[#e1e1ef]">{selected.code}</p></div>
            </div>

            {selected.isLocked ? (
              <div className="space-y-2">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{t('admin.groups.lockedBanner', { reason: selected.lockReason ?? '' })}</div>
                <button onClick={() => unlockGroup(selected.id)} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium">{t('admin.groups.unlockButton')}</button>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea data-testid="group-lock-reason-input" value={lockReason} onChange={e => setLockReason(e.target.value)} placeholder={t('admin.groups.lockReasonPlaceholder')} className="w-full bg-[#191b25] border border-[#504535]/20 rounded-lg p-3 text-sm text-[#e1e1ef] resize-none" rows={2} />
                <button data-testid="group-lock-confirm-btn" onClick={() => lockGroup(selected.id)} disabled={lockReason.trim().length < 10} className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{t('admin.groups.lockButton')}</button>
              </div>
            )}

            <button data-testid="group-delete-btn" onClick={() => deleteGroup(selected.id)} className="w-full py-2 bg-[#1d1f29] text-red-400 rounded-lg text-sm border border-red-500/20">{t('admin.groups.deleteButton')}</button>
            <button onClick={() => setSelected(null)} className="w-full py-2 bg-[#1d1f29] text-[#d5c4af]/60 rounded-lg text-sm">{t('admin.groups.closeButton')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
