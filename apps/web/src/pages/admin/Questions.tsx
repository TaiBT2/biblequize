import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { Question } from './questionTypes'

// ── Types ─────────────────────────────────────────────────────────────────────
// Question + shared editor types/helpers now live in ./questionTypes (QED-1).

interface ApiPage { questions: Question[]; total: number; page: number; size: number; totalPages: number }

// Import & duplicate-check API shapes (POST /api/admin/questions/import?dryRun=… and 409 POSSIBLE_DUPLICATE).
interface ImportError {
  line?: number
  index?: number
  error: string
}
interface ImportDryResult {
  willImport: number
  errors?: ImportError[]
}
interface ImportResult {
  imported: number
  errors?: ImportError[]
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_LABEL_KEYS: Record<string, string> = {
  multiple_choice_single: 'admin.questions.filter.mcSingle',
  multiple_choice_multi:  'admin.questions.filter.mcMulti',
  true_false:             'admin.questions.filter.trueFalse',
  fill_in_blank:          'admin.questions.filter.fillBlank',
}

function typeLabel(type: string | undefined, t: TFunction): string {
  if (!type) return '—'
  const key = TYPE_LABEL_KEYS[type]
  return key ? (t(key) as string) : type
}

const DIFF_COLOR: Record<string, string> = {
  easy:   'bg-emerald-600/20 text-emerald-300 border-emerald-500/30',
  medium: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
  hard:   'bg-rose-600/20 text-rose-300 border-rose-500/30',
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:   'bg-emerald-600/20 text-emerald-300 border-emerald-500/30',
  PENDING:  'bg-yellow-600/20 text-yellow-300 border-yellow-500/30',
  REJECTED: 'bg-red-600/20 text-red-300 border-red-500/30',
}

// ── Badges ────────────────────────────────────────────────────────────────────

const Badge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${color}`}>{label}</span>
)

// ── Main Component ─────────────────────────────────────────────────────────────

export default function QuestionsAdmin() {
  const { t } = useTranslation()
  // ── list state
  const [data, setData]         = useState<ApiPage | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [page, setPage]         = useState(0)
  const [pageSize, setPageSize] = useState(25)

  // ── filter state
  const [search,       setSearch]       = useState('')
  const [book,         setBook]         = useState('')
  const [difficulty,   setDifficulty]   = useState('')
  const [qType,        setQType]        = useState('')
  const [reviewStatus, setReviewStatus] = useState('')
  const [category,     setCategory]     = useState('')

  // ── selection
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})

  const navigate = useNavigate()

  // ── import modal
  const [importOpen,      setImportOpen]      = useState(false)
  const [importFile,      setImportFile]      = useState<File | null>(null)
  const [importDryResult, setImportDryResult] = useState<ImportDryResult | null>(null)
  const [importResult,    setImportResult]    = useState<ImportResult | null>(null)
  const [importLoading,   setImportLoading]   = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchParams = useMemo(() => {
    const p = new URLSearchParams()
    p.set('page', String(page))
    p.set('size', String(pageSize))
    if (book)         p.set('book', book)
    if (difficulty)   p.set('difficulty', difficulty)
    if (qType)        p.set('type', qType)
    if (reviewStatus) p.set('reviewStatus', reviewStatus)
    if (category)     p.set('category', category)
    if (search.trim()) p.set('search', search.trim())
    return p.toString()
  }, [page, pageSize, book, difficulty, qType, reviewStatus, category, search])

  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get<ApiPage>(`/api/admin/questions?${fetchParams}`)
      setData(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? t('admin.questions.error.loading'))
    } finally {
      setLoading(false)
    }
  }, [fetchParams])

  useEffect(() => { refresh() }, [refresh])

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0) }, [search, book, difficulty, qType, reviewStatus, category, pageSize])

  // ── Selection ──────────────────────────────────────────────────────────────

  const questions = data?.questions ?? []
  const allChecked = questions.length > 0 && questions.every(q => selectedIds[q.id])
  const anyChecked = questions.some(q => selectedIds[q.id])
  const toggleAll  = (v: boolean) => {
    const m: Record<string, boolean> = {}
    questions.forEach(q => (m[q.id] = v))
    setSelectedIds(prev => ({ ...prev, ...m }))
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const openCreate = () => navigate('/admin/questions/new')
  const openEdit   = (q: Question) => navigate(`/admin/questions/${q.id}/edit`, { state: { question: q } })

  const duplicate = async (q: Question) => {
    try {
      const { id: _id, createdAt: _c, ...body } = q as any
      await api.post('/api/admin/questions', body)
      await refresh()
    } catch {}
  }

  const deleteOne = async (id: string) => {
    if (!confirm(t('admin.questions.confirm.deleteOne'))) return
    await api.delete(`/api/admin/questions/${id}`)
    await refresh()
  }

  const bulkDelete = async () => {
    const ids = Object.keys(selectedIds).filter(id => selectedIds[id])
    if (!ids.length) return
    if (!confirm(t('admin.questions.confirm.deleteBulk', { count: ids.length }))) return
    await api.delete('/api/admin/questions', { data: { ids } })
    setSelectedIds({})
    await refresh()
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  const runImport = async (dryRun: boolean) => {
    if (!importFile) return
    setImportLoading(true)
    try {
      const form = new FormData()
      form.append('file', importFile)
      const res = await api.post(`/api/admin/questions/import?dryRun=${dryRun}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (dryRun) setImportDryResult(res.data)
      else { setImportResult(res.data); await refresh() }
    } catch (e: any) {
      alert(t('admin.questions.error.importAlert', { message: e?.response?.data?.error || e?.message || 'Unknown error' }))
    } finally { setImportLoading(false) }
  }

  const closeImport = () => { setImportOpen(false); setImportFile(null); setImportDryResult(null); setImportResult(null) }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
    <div data-testid="admin-questions-page" className="space-y-4">


      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-[#e1e1ef] tracking-tight">{t('admin.questions.title')}</h1>
          <p className="text-white/60 text-sm">
            {data ? t('admin.questions.countSuffix', { count: (data.total ?? 0).toLocaleString() }) : t('admin.questions.loading')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span data-testid="admin-questions-add-btn" className="inline-flex">
            <button data-testid="admin-questions-create-btn" onClick={openCreate}
              className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm font-medium">
              {t('admin.questions.createButton')}
            </button>
          </span>
          <button onClick={() => { setImportOpen(true); setImportDryResult(null); setImportResult(null) }}
            className="h-9 px-4 rounded-md bg-white/10 border border-white/10 hover:bg-white/20 text-sm">
            {t('admin.questions.importButton')}
          </button>
          <button onClick={refresh}
            className="h-9 px-3 rounded-md bg-white/10 border border-white/10 hover:bg-white/20 text-sm">
            ↻
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs text-white/50 mb-1">{t('admin.questions.filter.contentLabel')}</label>
          <input data-testid="admin-questions-search-input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('admin.questions.filter.contentPlaceholder')}
            className="h-9 px-3 rounded-md bg-white/10 border border-white/10 text-sm w-52" />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">{t('admin.questions.filter.bookLabel')}</label>
          <input data-testid="admin-questions-book-filter" value={book} onChange={e => setBook(e.target.value)} placeholder={t('admin.questions.filter.bookPlaceholder')}
            className="h-9 px-3 rounded-md bg-white/10 border border-white/10 text-sm w-32" />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">{t('admin.questions.filter.difficultyLabel')}</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
            className="h-9 px-3 rounded-md bg-white/10 border border-white/10 text-sm">
            <option value="">{t('admin.questions.filter.difficultyAll')}</option>
            <option value="easy">{t('admin.questions.filter.easy')}</option>
            <option value="medium">{t('admin.questions.filter.medium')}</option>
            <option value="hard">{t('admin.questions.filter.hard')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">{t('admin.questions.filter.typeLabel')}</label>
          <select value={qType} onChange={e => setQType(e.target.value)}
            className="h-9 px-3 rounded-md bg-white/10 border border-white/10 text-sm">
            <option value="">{t('admin.questions.filter.typeAll')}</option>
            <option value="multiple_choice_single">{t('admin.questions.filter.mcSingle')}</option>
            <option value="multiple_choice_multi">{t('admin.questions.filter.mcMulti')}</option>
            <option value="true_false">{t('admin.questions.filter.trueFalse')}</option>
            <option value="fill_in_blank">{t('admin.questions.filter.fillBlank')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">{t('admin.questions.filter.statusLabel')}</label>
          <select value={reviewStatus} onChange={e => setReviewStatus(e.target.value)}
            className="h-9 px-3 rounded-md bg-white/10 border border-white/10 text-sm">
            <option value="">{t('admin.questions.filter.statusAll')}</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">{t('admin.questions.filter.categoryLabel')}</label>
          <select
            data-testid="admin-questions-category-filter"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="h-9 px-3 rounded-md bg-white/10 border border-white/10 text-sm"
          >
            <option value="">{t('admin.questions.filter.categoryAll')}</option>
            <option value="bible_basics">{t('admin.questions.filter.categoryBibleBasics')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">{t('admin.questions.filter.pageSizeLabel')}</label>
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
            className="h-9 px-3 rounded-md bg-white/10 border border-white/10 text-sm">
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div data-testid="admin-questions-table" className="rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-white/60">
              <tr>
                <th className="px-3 py-2 w-10">
                  <input type="checkbox" checked={allChecked} onChange={e => toggleAll(e.target.checked)} />
                </th>
                <th className="px-3 py-2 text-left whitespace-nowrap">{t('admin.questions.column.book')}</th>
                <th className="px-3 py-2 text-center whitespace-nowrap">{t('admin.questions.column.type')}</th>
                <th className="px-3 py-2 text-center whitespace-nowrap">{t('admin.questions.column.difficulty')}</th>
                <th className="px-3 py-2 text-center whitespace-nowrap">{t('admin.questions.column.status')}</th>
                <th className="px-3 py-2 text-left">{t('admin.questions.column.content')}</th>
                <th className="px-3 py-2 text-center whitespace-nowrap">{t('admin.questions.column.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-white/40">{t('admin.questions.loading')}</td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="px-4 py-4 text-rose-400">{error}</td></tr>
              ) : questions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-white/40">{t('admin.questions.empty')}</td></tr>
              ) : questions.map(q => (
                <tr data-testid="admin-question-row" key={q.id} className="odd:bg-white/[0.03] hover:bg-white/[0.06]">
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox"
                      checked={!!selectedIds[q.id]}
                      onChange={e => setSelectedIds(p => ({ ...p, [q.id]: e.target.checked }))} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="font-medium">{q.book || '—'}</div>
                    {q.chapter && (
                      <div className="text-xs text-white/50">
                        {q.chapter}:{q.verseStart ?? '?'}{q.verseEnd && q.verseEnd !== q.verseStart ? `–${q.verseEnd}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge label={typeLabel(q.type, t)} color="bg-white/10 text-white/70 border-white/10" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {q.difficulty
                      ? <Badge label={q.difficulty} color={DIFF_COLOR[q.difficulty]} />
                      : <span className="text-white/30">—</span>}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {q.reviewStatus
                      ? <Badge label={q.reviewStatus} color={STATUS_COLOR[q.reviewStatus]} />
                      : <span className="text-white/30">—</span>}
                  </td>
                  <td className="px-3 py-2 max-w-[480px]">
                    {q.category === 'bible_basics' && (
                      <div className="mb-1">
                        <span
                          data-testid="admin-question-bible-basics-badge"
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-amber-600/20 text-amber-300 border-amber-500/30"
                        >
                          {t('admin.questions.filter.categoryBibleBasics')}
                        </span>
                      </div>
                    )}
                    <div className="line-clamp-2 text-white/80">{q.content}</div>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {q.options.map((opt, i) => (
                          <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${(q.correctAnswer ?? []).includes(i) ? 'bg-emerald-600/30 text-emerald-300' : 'bg-white/5 text-white/40'}`}>
                            {String.fromCharCode(65 + i)}. {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <button data-testid="admin-question-edit-btn" onClick={() => openEdit(q)}
                      className="mx-0.5 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs" title={t('admin.questions.row.editTitle')}>✏️</button>
                    <button onClick={() => duplicate(q)}
                      className="mx-0.5 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs" title={t('admin.questions.row.duplicateTitle')}>📄</button>
                    <button data-testid="admin-question-delete-btn" onClick={() => deleteOne(q.id)}
                      className="mx-0.5 px-2 py-1 rounded bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 text-xs" title={t('admin.questions.row.deleteTitle')}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination & Bulk Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {anyChecked && (
            <button onClick={bulkDelete}
              className="px-3 py-2 rounded-md bg-rose-600/80 hover:bg-rose-600 text-sm">
              {t('admin.questions.bulkDelete', { count: Object.values(selectedIds).filter(Boolean).length })}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/50">
            {data ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, data.total)} / ${data.total}` : ''}
          </span>
          <button disabled={page <= 0} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30">{t('admin.questions.paginationPrev')}</button>
          <span className="text-white/60">
            {t('admin.questions.paginationPage', { current: (data?.page ?? 0) + 1, total: data?.totalPages ?? 1 })}
          </span>
          <button disabled={!data || page >= data.totalPages - 1} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30">{t('admin.questions.paginationNext')}</button>
        </div>
      </div>
    </div>

    {/* Edit/Create now happens on a dedicated page (/admin/questions/:id/edit · /new). */}

    {/* ── Import Modal ─────────────────────────────────────────────────────── */}
    {importOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#111018] p-6 shadow-2xl mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('admin.questions.import.title')}</h3>
            <button onClick={closeImport} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">✕</button>
          </div>

          {!importResult ? (
            <>
              <p className="text-sm text-white/60 mb-4" dangerouslySetInnerHTML={{ __html: t('admin.questions.import.formatsLine') + '<br />' + t('admin.questions.import.csvHeaderPrefix') + ' <code class="text-xs bg-white/10 px-1 rounded">book, chapter, type, text, optionA–D, correctAnswer, difficulty, explanation</code>' }} />
              <div className="mb-4">
                <label className="block text-xs text-white/60 mb-1">{t('admin.questions.import.chooseFile')}</label>
                <input type="file" accept=".csv,.json"
                  onChange={e => { setImportFile(e.target.files?.[0] ?? null); setImportDryResult(null) }}
                  className="text-sm text-white/80 file:mr-3 file:px-3 file:py-1.5 file:rounded file:bg-white/10 file:border-0 file:text-sm file:text-white/80 file:cursor-pointer" />
              </div>

              {importDryResult && (
                <div className="mb-4 p-3 rounded-lg border border-white/10 bg-white/5 text-sm space-y-2">
                  <div className="font-medium text-white/80">{t('admin.questions.import.dryRunTitle')}</div>
                  <div className="flex gap-4">
                    <span className="text-emerald-400">{t('admin.questions.import.willImport')} <strong>{importDryResult.willImport}</strong></span>
                    {importDryResult.errors && importDryResult.errors.length > 0 && (
                      <span className="text-rose-400">{t('admin.questions.import.errorCount')} <strong>{importDryResult.errors.length}</strong></span>
                    )}
                  </div>
                  {importDryResult.errors && importDryResult.errors.length > 0 && (
                    <div className="mt-2 max-h-28 overflow-y-auto space-y-1">
                      {importDryResult.errors.map((e, i) => (
                        <div key={i} className="text-xs text-rose-300">
                          {e.line ? t('admin.questions.import.linePrefix', { line: e.line }) : e.index ? t('admin.questions.import.indexPrefix', { index: e.index }) : ''}: {e.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button onClick={closeImport} className="px-3 py-2 rounded bg-white/10 text-sm">{t('admin.questions.import.cancelButton')}</button>
                <button disabled={!importFile || importLoading} onClick={() => runImport(true)}
                  className="px-3 py-2 rounded bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-sm">
                  {importLoading ? t('admin.questions.import.processing') : t('admin.questions.import.dryRunButton')}
                </button>
                {importDryResult && (importDryResult.willImport ?? 0) > 0 && (
                  <button disabled={importLoading} onClick={() => runImport(false)}
                    className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-medium">
                    {importLoading ? t('admin.questions.import.importing') : t('admin.questions.import.importCount', { count: importDryResult.willImport })}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-lg font-semibold text-emerald-400 mb-1">{t('admin.questions.import.successTitle')}</div>
              <div className="text-sm text-white/70">
                <span dangerouslySetInnerHTML={{ __html: t('admin.questions.import.addedCount', { count: importResult.imported }) }} />
                {importResult.errors && importResult.errors.length > 0 && (
                  <span className="text-rose-300 ml-2">{t('admin.questions.import.errorsCount', { count: importResult.errors.length })}</span>
                )}
              </div>
              <button onClick={closeImport} className="mt-4 px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-sm">{t('admin.questions.import.closeButton')}</button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  )
}
