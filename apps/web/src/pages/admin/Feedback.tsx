import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'

type FeedbackItem = {
  id: string
  type: string
  status: string
  content: string
  createdAt: string
  updatedAt: string
  userId?: string
  userName?: string
  userEmail?: string
  question?: { id: string; content: string; book: string }
  handledBy?: string
}

type Stats = Record<string, number>

export default function FeedbackAdmin() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [stats, setStats] = useState<Stats>({})
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selected, setSelected] = useState<FeedbackItem | null>(null)
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = async (p = page) => {
    setIsLoading(true)
    try {
      const params: Record<string, any> = { page: p, size: 20 }
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.type = typeFilter
      const res = await api.get('/api/admin/feedback', { params })
      setItems(res.data.items ?? [])
      setTotal(res.data.total ?? 0)
      setTotalPages(res.data.totalPages ?? 1)
      setStats(res.data.stats ?? {})
    } catch (e) {
      console.error('Failed to load feedback', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setPage(0)
    fetchData(0)
  }, [statusFilter, typeFilter])

  const updateStatus = async (status: string) => {
    if (!selected) return
    setIsSaving(true)
    try {
      const body: Record<string, string> = { status }
      if (note.trim()) body.note = note.trim()
      const res = await api.patch(`/api/admin/feedback/${selected.id}`, body)
      setSelected(res.data)
      setNote('')
      await fetchData()
    } finally {
      setIsSaving(false)
    }
  }

  const statusBadge = (s: string) => {
    const base = 'inline-block px-2 py-0.5 rounded text-xs font-medium'
    switch (s) {
      case 'pending':     return <span className={`${base} bg-yellow-500/20 text-yellow-300 border border-yellow-500/30`}>Pending</span>
      case 'in_progress': return <span className={`${base} bg-blue-500/20 text-blue-300 border border-blue-500/30`}>In Progress</span>
      case 'resolved':    return <span className={`${base} bg-emerald-500/20 text-emerald-300 border border-emerald-500/30`}>Resolved</span>
      case 'rejected':    return <span className={`${base} bg-rose-500/20 text-rose-300 border border-rose-500/30`}>Rejected</span>
      default: return <span className={`${base} bg-white/10 text-[#d5c4af]/60`}>{s}</span>
    }
  }

  const typeBadge = (t: string) => {
    const base = 'inline-block px-2 py-0.5 rounded text-xs font-medium'
    switch (t) {
      case 'report':   return <span className={`${base} bg-rose-500/20 text-rose-300`}>Report</span>
      case 'question': return <span className={`${base} bg-purple-500/20 text-purple-300`}>Question</span>
      case 'general':  return <span className={`${base} bg-sky-500/20 text-sky-300`}>General</span>
      default: return <span className={`${base} bg-white/10 text-[#d5c4af]/60`}>{t}</span>
    }
  }

  const statCards = [
    { key: 'pending',     label: 'Chờ xử lý',     color: 'yellow' },
    { key: 'in_progress', label: 'Đang xử lý',     color: 'blue'   },
    { key: 'resolved',    label: 'Đã giải quyết',  color: 'emerald' },
    { key: 'rejected',    label: 'Từ chối',         color: 'rose'   },
  ] as const

  const colorMap = {
    yellow:  'border-yellow-500/40 bg-yellow-500/15 text-yellow-200',
    blue:    'border-blue-500/40 bg-blue-500/15 text-blue-200',
    emerald: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
    rose:    'border-rose-500/40 bg-rose-500/15 text-rose-200',
  }

  return (
    <>
      <div data-testid="admin-feedback-page" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Feedback</h2>
            <p className="text-[#d5c4af]/60 text-sm mt-0.5">{total} phản hồi từ người dùng</p>
          </div>
        </div>

        {/* Stats cards */}
        <div data-testid="feedback-stats-cards" className="grid grid-cols-4 gap-3">
          {statCards.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                statusFilter === key ? colorMap[color] : 'border-[#d5c4af]/10 bg-[#1d1f29] hover:bg-white/10'
              }`}
            >
              <div className="text-2xl font-bold">{stats[key] ?? 0}</div>
              <div className="text-xs text-[#d5c4af]/60 mt-0.5">{label}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            data-testid="feedback-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-white/10 border border-[#d5c4af]/10 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-white/10 border border-[#d5c4af]/10 text-sm"
          >
            <option value="">All Types</option>
            <option value="report">Report</option>
            <option value="question">Question</option>
            <option value="general">General</option>
          </select>
          <button
            onClick={() => fetchData()}
            className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Table */}
        <div data-testid="feedback-table" className="rounded-lg border border-[#d5c4af]/10 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-[#1d1f29] text-[#d5c4af]/70">
              <tr>
                <th className="px-3 py-2 text-left">Người dùng</th>
                <th className="px-3 py-2 text-left">Loại</th>
                <th className="px-3 py-2 text-left">Nội dung</th>
                <th className="px-3 py-2 text-left">Câu hỏi</th>
                <th className="px-3 py-2 text-center">Trạng thái</th>
                <th className="px-3 py-2 text-left">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-3 py-6 text-white/50 text-center">Đang tải...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-white/50 text-center">Không có phản hồi nào</td></tr>
              ) : items.map(item => (
                <tr
                  key={item.id}
                  className="odd:bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer"
                  onClick={() => { setSelected(item); setNote('') }}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="font-medium">{item.userName || '—'}</div>
                    <div className="text-xs text-[#d5c4af]/40">{item.userEmail || ''}</div>
                  </td>
                  <td className="px-3 py-2">{typeBadge(item.type)}</td>
                  <td className="px-3 py-2 max-w-xs">
                    <div className="truncate text-white/80" title={item.content}>{item.content}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-white/50 max-w-[200px]">
                    {item.question
                      ? <span title={item.question.content}>[{item.question.book}] {item.question.content?.slice(0, 45)}…</span>
                      : '—'
                    }
                  </td>
                  <td className="px-3 py-2 text-center">{statusBadge(item.status)}</td>
                  <td className="px-3 py-2 text-xs text-white/50 whitespace-nowrap">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-white/50">Trang {page + 1} / {totalPages}</span>
          <button
            disabled={page <= 0}
            onClick={() => { const p = page - 1; setPage(p); fetchData(p) }}
            className="px-2 py-1 rounded bg-white/10 disabled:opacity-40 text-sm"
          >Trước</button>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => { const p = page + 1; setPage(p); fetchData(p) }}
            className="px-2 py-1 rounded bg-white/10 disabled:opacity-40 text-sm"
          >Sau</button>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-xl rounded-xl border border-[#d5c4af]/10 bg-[#111018] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">Chi tiết Feedback</div>
              <button onClick={() => setSelected(null)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                {typeBadge(selected.type)}
                {statusBadge(selected.status)}
                {selected.handledBy && (
                  <span className="text-xs text-[#d5c4af]/40">Handled by: {selected.handledBy}</span>
                )}
              </div>

              <div>
                <div className="text-xs text-[#d5c4af]/40 mb-1">Người gửi</div>
                <div className="font-medium">{selected.userName}
                  <span className="text-white/50 font-normal ml-2 text-xs">({selected.userEmail})</span>
                </div>
              </div>

              {selected.question && (
                <div>
                  <div className="text-xs text-[#d5c4af]/40 mb-1">Câu hỏi liên quan</div>
                  <div className="px-3 py-2 rounded bg-[#1d1f29] border border-[#d5c4af]/10 text-xs text-white/80">
                    [{selected.question.book}] {selected.question.content}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs text-[#d5c4af]/40 mb-1">Nội dung</div>
                <div className="px-3 py-2 rounded bg-[#1d1f29] border border-[#d5c4af]/10 whitespace-pre-wrap text-white/80 max-h-40 overflow-y-auto">
                  {selected.content}
                </div>
              </div>

              <div>
                <div className="text-xs text-[#d5c4af]/40 mb-1">Admin Note (tùy chọn)</div>
                <textarea
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ghi chú xử lý..."
                  className="w-full px-3 py-2 rounded bg-white/10 border border-[#d5c4af]/10 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 flex-wrap">
              <button onClick={() => setSelected(null)} className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-sm">
                Đóng
              </button>
              <button
                disabled={isSaving}
                onClick={() => updateStatus('in_progress')}
                className="px-3 py-2 rounded bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                → In Progress
              </button>
              <button
                disabled={isSaving}
                onClick={() => updateStatus('rejected')}
                className="px-3 py-2 rounded bg-rose-600/80 hover:bg-rose-600 disabled:opacity-50 text-sm"
              >
                Từ chối
              </button>
              <button
                disabled={isSaving}
                onClick={() => updateStatus('resolved')}
                className="px-3 py-2 rounded bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 text-sm"
              >
                ✓ Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
