import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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

  const statusBadge = (status: string) => {
    const base = 'inline-block px-2 py-0.5 rounded text-xs font-medium'
    switch (status) {
      case 'pending':     return <span className={`${base} bg-amber-500/15 text-amber-700 border border-amber-500/30`}>{t('admin.feedback.filter.pending')}</span>
      case 'in_progress': return <span className={`${base} bg-sky-500/15 text-sky-700 border border-sky-500/30`}>{t('admin.feedback.filter.inProgress')}</span>
      case 'resolved':    return <span className={`${base} bg-emerald-500/15 text-emerald-700 border border-emerald-500/30`}>{t('admin.feedback.filter.resolved')}</span>
      case 'rejected':    return <span className={`${base} bg-rose-500/15 text-rose-700 border border-rose-500/30`}>{t('admin.feedback.filter.rejected')}</span>
      default: return <span className={`${base} bg-bq-inset text-bq-ink2`}>{status}</span>
    }
  }

  const typeBadge = (type: string) => {
    const base = 'inline-block px-2 py-0.5 rounded text-xs font-medium'
    switch (type) {
      case 'report':   return <span className={`${base} bg-rose-500/15 text-rose-700`}>{t('admin.feedback.filter.report')}</span>
      case 'question': return <span className={`${base} bg-purple-500/15 text-purple-700`}>{t('admin.feedback.filter.question')}</span>
      case 'general':  return <span className={`${base} bg-sky-500/15 text-sky-700`}>{t('admin.feedback.filter.general')}</span>
      default: return <span className={`${base} bg-bq-inset text-bq-ink2`}>{type}</span>
    }
  }

  const statCards = [
    { key: 'pending',     color: 'yellow' },
    { key: 'in_progress', color: 'blue'   },
    { key: 'resolved',    color: 'emerald' },
    { key: 'rejected',    color: 'rose'   },
  ] as const

  const colorMap = {
    yellow:  'border-amber-500/40 bg-amber-500/15 text-amber-700',
    blue:    'border-sky-500/40 bg-sky-500/15 text-sky-700',
    emerald: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700',
    rose:    'border-rose-500/40 bg-rose-500/15 text-rose-700',
  }

  return (
    <>
      <div data-testid="admin-feedback-page" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-semibold text-bq-ink">{t('admin.feedback.title')}</h2>
            <p className="text-bq-ink2 text-sm mt-0.5">{t('admin.feedback.subtitle', { count: total })}</p>
          </div>
        </div>

        {/* Stats cards */}
        <div data-testid="feedback-stats-cards" className="grid grid-cols-4 gap-3">
          {statCards.map(({ key, color }) => (
            <button
              key={key}
              data-testid={`feedback-stat-${key}`}
              onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                statusFilter === key ? colorMap[color] : 'border-bq-hair bg-bq-white shadow-bq-soft hover:bg-bq-inset'
              }`}
            >
              <div className="text-2xl font-bold text-bq-ink">{stats[key] ?? 0}</div>
              <div className="text-xs text-bq-ink2 mt-0.5">{t(`admin.feedback.stats.${key}`)}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            data-testid="feedback-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-bq-white border border-bq-hair text-bq-ink text-sm focus:ring-1 focus:ring-bq-sapphire outline-none"
          >
            <option value="">{t('admin.feedback.filter.allStatus')}</option>
            <option value="pending">{t('admin.feedback.filter.pending')}</option>
            <option value="in_progress">{t('admin.feedback.filter.inProgress')}</option>
            <option value="resolved">{t('admin.feedback.filter.resolved')}</option>
            <option value="rejected">{t('admin.feedback.filter.rejected')}</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-bq-white border border-bq-hair text-bq-ink text-sm focus:ring-1 focus:ring-bq-sapphire outline-none"
          >
            <option value="">{t('admin.feedback.filter.allTypes')}</option>
            <option value="report">{t('admin.feedback.filter.report')}</option>
            <option value="question">{t('admin.feedback.filter.question')}</option>
            <option value="general">{t('admin.feedback.filter.general')}</option>
          </select>
          <button
            onClick={() => fetchData()}
            className="px-3 py-2 rounded-md bg-bq-action text-white shadow-bq-action hover:brightness-110 text-sm"
          >
            {t('admin.feedback.filter.refresh')}
          </button>
        </div>

        {/* Table */}
        <div data-testid="feedback-table" className="rounded-lg border border-bq-hair bg-bq-white shadow-bq-soft overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-bq-inset text-bq-ink2">
              <tr>
                <th className="px-3 py-2 text-left">{t('admin.feedback.columnUser')}</th>
                <th className="px-3 py-2 text-left">{t('admin.feedback.columnType')}</th>
                <th className="px-3 py-2 text-left">{t('admin.feedback.columnContent')}</th>
                <th className="px-3 py-2 text-left">{t('admin.feedback.columnQuestion')}</th>
                <th className="px-3 py-2 text-center">{t('admin.feedback.columnStatus')}</th>
                <th className="px-3 py-2 text-left">{t('admin.feedback.columnDate')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-3 py-6 text-bq-ink3 text-center">{t('admin.feedback.loading')}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-bq-ink3 text-center">{t('admin.feedback.empty')}</td></tr>
              ) : items.map(item => (
                <tr
                  data-testid="feedback-row"
                  key={item.id}
                  className="odd:bg-bq-inset/50 hover:bg-bq-inset cursor-pointer text-bq-ink"
                  onClick={() => { setSelected(item); setNote('') }}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="font-medium">{item.userName || '—'}</div>
                    <div className="text-xs text-bq-ink3">{item.userEmail || ''}</div>
                  </td>
                  <td className="px-3 py-2">{typeBadge(item.type)}</td>
                  <td className="px-3 py-2 max-w-xs">
                    <div className="truncate text-bq-ink2" title={item.content}>{item.content}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-bq-ink3 max-w-[200px]">
                    {item.question
                      ? <span title={item.question.content}>[{item.question.book}] {item.question.content?.slice(0, 45)}…</span>
                      : '—'
                    }
                  </td>
                  <td className="px-3 py-2 text-center">{statusBadge(item.status)}</td>
                  <td className="px-3 py-2 text-xs text-bq-ink3 whitespace-nowrap">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-bq-ink3">{t('admin.feedback.paginationSummary', { page: page + 1, totalPages })}</span>
          <button
            disabled={page <= 0}
            onClick={() => { const p = page - 1; setPage(p); fetchData(p) }}
            className="px-2 py-1 rounded bg-bq-inset border border-bq-hair text-bq-ink disabled:opacity-40 text-sm"
          >{t('admin.feedback.paginationPrev')}</button>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => { const p = page + 1; setPage(p); fetchData(p) }}
            className="px-2 py-1 rounded bg-bq-inset border border-bq-hair text-bq-ink disabled:opacity-40 text-sm"
          >{t('admin.feedback.paginationNext')}</button>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div data-testid="feedback-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-xl border border-bq-hair bg-bq-white p-6 shadow-bq-soft">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-display font-semibold text-bq-ink">{t('admin.feedback.detailTitle')}</div>
              <button onClick={() => setSelected(null)} className="px-2 py-1 rounded bg-bq-inset text-bq-ink hover:bg-bq-hair/40">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                {typeBadge(selected.type)}
                {statusBadge(selected.status)}
                {selected.handledBy && (
                  <span className="text-xs text-bq-ink3">{t('admin.feedback.handledBy', { name: selected.handledBy })}</span>
                )}
              </div>

              <div>
                <div className="text-xs text-bq-ink3 mb-1">{t('admin.feedback.sender')}</div>
                <div className="font-medium text-bq-ink">{selected.userName}
                  <span className="text-bq-ink3 font-normal ml-2 text-xs">({selected.userEmail})</span>
                </div>
              </div>

              {selected.question && (
                <div>
                  <div className="text-xs text-bq-ink3 mb-1">{t('admin.feedback.relatedQuestion')}</div>
                  <div className="px-3 py-2 rounded bg-bq-inset border border-bq-hair text-xs text-bq-ink2">
                    [{selected.question.book}] {selected.question.content}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs text-bq-ink3 mb-1">{t('admin.feedback.contentLabel')}</div>
                <div className="px-3 py-2 rounded bg-bq-inset border border-bq-hair whitespace-pre-wrap text-bq-ink2 max-h-40 overflow-y-auto">
                  {selected.content}
                </div>
              </div>

              <div>
                <div className="text-xs text-bq-ink3 mb-1">{t('admin.feedback.adminNoteLabel')}</div>
                <textarea
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={t('admin.feedback.adminNotePlaceholder')}
                  className="w-full px-3 py-2 rounded bg-bq-white border border-bq-hair text-bq-ink placeholder:text-bq-ink3 text-sm resize-none focus:ring-1 focus:ring-bq-sapphire outline-none"
                />
              </div>
            </div>

            <div data-testid="feedback-status-select" className="flex items-center justify-end gap-2 mt-5 flex-wrap">
              <button onClick={() => setSelected(null)} className="px-3 py-2 rounded bg-bq-inset border border-bq-hair text-bq-ink hover:bg-bq-hair/40 text-sm">
                {t('admin.feedback.closeButton')}
              </button>
              <button
                disabled={isSaving}
                onClick={() => updateStatus('in_progress')}
                className="px-3 py-2 rounded bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 text-sm"
              >
                {t('admin.feedback.moveInProgress')}
              </button>
              <button
                disabled={isSaving}
                onClick={() => updateStatus('rejected')}
                className="px-3 py-2 rounded bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50 text-sm"
              >
                {t('admin.feedback.rejectButton')}
              </button>
              <button
                data-testid="feedback-update-btn"
                disabled={isSaving}
                onClick={() => updateStatus('resolved')}
                className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 text-sm"
              >
                {t('admin.feedback.resolveButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
