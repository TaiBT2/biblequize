import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'

interface Season { id: string; name: string; startDate: string; endDate: string; isActive: boolean }

export default function RankingsAdmin() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' })
  const [isSaving, setIsSaving] = useState(false)

  const fetchSeasons = async () => {
    setIsLoading(true)
    try { setSeasons(Array.isArray((await api.get('/api/admin/seasons')).data) ? (await api.get('/api/admin/seasons')).data : []) }
    catch { /* graceful */ }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchSeasons() }, [])

  const createSeason = async () => {
    if (!form.name || !form.startDate || !form.endDate) return
    setIsSaving(true)
    try { await api.post('/api/admin/seasons', form); fetchSeasons(); setShowCreate(false); setForm({ name: '', startDate: '', endDate: '' }) }
    catch { /* error */ } finally { setIsSaving(false) }
  }

  const endSeason = async (id: string) => {
    if (!confirm('Kết thúc mùa giải này?')) return
    try { await api.post(`/api/admin/seasons/${id}/end`); fetchSeasons() } catch { /* */ }
  }

  const active = seasons.find(s => s.isActive)

  return (
    <div data-testid="admin-rankings-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-[#e1e1ef]">Seasons & Rankings</h2><p className="text-[#d5c4af]/60 text-sm">{seasons.length} seasons</p></div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 gold-gradient text-[#281900] rounded-lg text-sm font-bold hover:opacity-90">+ Tạo mùa mới</button>
      </div>

      {showCreate && (
        <div data-testid="create-season-form" className="rounded-lg border border-[#504535]/20 bg-[#1d1f29] p-4 space-y-3">
          <input data-testid="create-season-name-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tên mùa giải" className="w-full bg-[#191b25] border border-[#504535]/20 rounded-lg px-4 py-2 text-sm text-[#e1e1ef]" />
          <div className="flex gap-3">
            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="flex-1 bg-[#191b25] border border-[#504535]/20 rounded-lg px-4 py-2 text-sm text-[#e1e1ef] [color-scheme:dark]" />
            <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="flex-1 bg-[#191b25] border border-[#504535]/20 rounded-lg px-4 py-2 text-sm text-[#e1e1ef] [color-scheme:dark]" />
          </div>
          <button data-testid="create-season-submit-btn" onClick={createSeason} disabled={isSaving} className="px-6 py-2 gold-gradient text-[#281900] rounded-lg text-sm font-bold disabled:opacity-50">{isSaving ? 'Đang tạo...' : 'Tạo mùa giải'}</button>
        </div>
      )}

      {active && (
        <div data-testid="active-season-banner" className="rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Đang diễn ra</span>
              <h3 className="text-xl font-bold text-[#e1e1ef] mt-1">{active.name}</h3>
              <p className="text-[#d5c4af]/60 text-sm">{active.startDate} → {active.endDate}</p>
            </div>
            <button data-testid="end-season-btn" onClick={() => endSeason(active.id)} className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 border border-red-500/20">Kết thúc sớm</button>
          </div>
        </div>
      )}

      {isLoading ? <div className="text-center text-[#d5c4af]/60 py-8">Đang tải...</div>
       : seasons.filter(s => !s.isActive).length === 0 ? <div className="text-center text-[#d5c4af]/60 py-8">Chưa có mùa giải nào</div>
       : <div data-testid="inactive-seasons-list" className="space-y-3">{seasons.filter(s => !s.isActive).map(s => (
          <div key={s.id} className="rounded-lg border border-[#504535]/20 bg-[#1d1f29] p-4 flex items-center justify-between">
            <div><h4 className="font-medium text-[#e1e1ef]">{s.name}</h4><p className="text-[#d5c4af]/60 text-xs">{s.startDate} → {s.endDate}</p></div>
            <span className="text-[#d5c4af]/30 text-xs">Đã kết thúc</span>
          </div>
        ))}</div>
      }
    </div>
  )
}
