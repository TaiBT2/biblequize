import React, { useEffect, useMemo, useState } from 'react'

type Question = {
  id: string
  book?: string
  chapter?: number
  verseStart?: number
  verseEnd?: number
  difficulty?: string
  type?: string
  content: string
  language?: string
}

export default function QuestionsAdmin() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [book, setBook] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [limit, setLimit] = useState(50)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})
  const [sortKey, setSortKey] = useState<'book' | 'difficulty' | 'type' | 'chapter'>('book')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [isSaving, setIsSaving] = useState(false)
  const [editing, setEditing] = useState<Partial<Question> & { id?: string } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importDryResult, setImportDryResult] = useState<any>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [importLoading, setImportLoading] = useState(false)

  const runImport = async (dryRun: boolean) => {
    if (!importFile) return
    setImportLoading(true)
    try {
      const { api } = await import('../../api/client')
      const form = new FormData()
      form.append('file', importFile)
      const res = await api.post(`/api/admin/questions/import?dryRun=${dryRun}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (dryRun) {
        setImportDryResult(res.data)
      } else {
        setImportResult(res.data)
        await refresh()
      }
    } catch (e: any) {
      alert('Import lỗi: ' + (e?.response?.data?.error || e?.message || 'Unknown error'))
    } finally {
      setImportLoading(false)
    }
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportDryResult(null)
    setImportResult(null)
  }

  const refresh = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { api } = await import('../../api/client')
      const res = await api.get(`/api/questions${params ? `?${params}` : ''}`)
      setQuestions(res.data as Question[])
    } catch (e: any) {
      setError(e?.message || 'Lỗi tải dữ liệu')
    } finally {
      setIsLoading(false)
    }
  }

  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (book) p.set('book', book)
    if (difficulty) p.set('difficulty', difficulty)
    p.set('limit', String(limit))
    return p.toString()
  }, [book, difficulty, limit])

  useEffect(() => { refresh() }, [params])

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase()
    let list = questions
    if (kw) list = list.filter(q => (q.content || '').toLowerCase().includes(kw))
    const dir = sortDir === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      const av = (a[sortKey] as any) ?? ''
      const bv = (b[sortKey] as any) ?? ''
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }, [questions, search, sortKey, sortDir])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  const toggleAll = (checked: boolean) => {
    const pageIds: Record<string, boolean> = {}
    paged.forEach(q => (pageIds[q.id] = checked))
    setSelectedIds(prev => ({ ...prev, ...pageIds }))
  }

  const allChecked = paged.length > 0 && paged.every(q => selectedIds[q.id])
  const anyChecked = paged.some(q => selectedIds[q.id])

  const difficultyBadge = (d?: string) => {
    const base = 'inline-block min-w-[64px] px-2 py-1 rounded text-center text-xs font-medium'
    if (d === 'easy') return <span className={`${base} bg-emerald-600/20 text-emerald-300 border border-emerald-500/30`}>Easy</span>
    if (d === 'medium') return <span className={`${base} bg-amber-600/20 text-amber-300 border border-amber-500/30`}>Medium</span>
    if (d === 'hard') return <span className={`${base} bg-rose-600/20 text-rose-300 border border-rose-500/30`}>Hard</span>
    return <span className={`${base} bg-white/10 text-white/70 border border-white/10`}>—</span>
  }

  const SortHeader: React.FC<{ label: string; keyName: typeof sortKey }> = ({ label, keyName }) => (
    <button
      type="button"
      onClick={() => {
        if (sortKey === keyName) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
        else { setSortKey(keyName); setSortDir('asc') }
      }}
      className="flex items-center gap-1"
    >
      <span>{label}</span>
      {sortKey === keyName && (
        <span className="text-white/60">{sortDir === 'asc' ? '▲' : '▼'}</span>
      )}
    </button>
  )

  return (
    <>
    <div className="space-y-4">
      <div className="flex items-end gap-3 justify-between flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold">Questions</h2>
          <p className="text-white/70">Danh sách câu hỏi</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-64">
            <label className="block text-xs text-white/60 mb-1">Search</label>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Tìm theo nội dung" className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/10" />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Book</label>
            <input value={book} onChange={e => setBook(e.target.value)} placeholder="vd: Genesis" className="px-3 py-2 rounded-md bg-white/10 border border-white/10" />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="px-3 py-2 rounded-md bg-white/10 border border-white/10">
              <option value="">All</option>
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Limit</label>
            <input type="number" min={1} max={200} value={limit} onChange={e => setLimit(Number(e.target.value))} className="w-24 px-3 py-2 rounded-md bg-white/10 border border-white/10" />
          </div>
          <button type="button" onClick={() => setQuestions(q => [...q])} className="h-9 px-3 rounded-md bg-blue-600 hover:bg-blue-500">Refresh</button>
          <button type="button" onClick={() => setEditing({})} className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500">Create</button>
          <button type="button" onClick={() => { setImportOpen(true); setImportDryResult(null); setImportResult(null) }} className="h-9 px-3 rounded-md bg-white/10 border border-white/10 hover:bg-white/20">Import</button>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-3 py-2 w-10"><input type="checkbox" checked={allChecked} onChange={e => toggleAll(e.target.checked)} /></th>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left"><SortHeader label="Book" keyName="book" /></th>
                <th className="px-3 py-2 text-left"><SortHeader label="Ref" keyName="chapter" /></th>
                <th className="px-3 py-2 text-center"><SortHeader label="Difficulty" keyName="difficulty" /></th>
                <th className="px-3 py-2 text-center"><SortHeader label="Type" keyName="type" /></th>
                <th className="px-3 py-2 text-left">Content</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-3 py-4" colSpan={8}>Đang tải…</td></tr>
              ) : error ? (
                <tr><td className="px-3 py-4 text-red-400" colSpan={8}>{error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-3 py-4 text-white/60" colSpan={8}>Không có dữ liệu</td></tr>
              ) : (
                paged.map(q => (
                  <tr key={q.id} className="odd:bg-white/[0.03]">
                    <td className="px-3 py-2 align-top text-center">
                      <input type="checkbox" checked={!!selectedIds[q.id]} onChange={e => setSelectedIds(prev => ({ ...prev, [q.id]: e.target.checked }))} />
                    </td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">{q.id}</td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">{q.book || '-'}</td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">{q.chapter ? `${q.chapter}:${q.verseStart ?? ''}${q.verseEnd ? '-' + q.verseEnd : ''}` : '-'}</td>
                    <td className="px-3 py-2 align-top text-center">{difficultyBadge(q.difficulty)}</td>
                    <td className="px-3 py-2 align-top text-center"><span className="inline-block px-2 py-1 rounded text-xs bg-white/10 border border-white/10 min-w-[72px]">{q.type || '-'}</span></td>
                    <td className="px-3 py-2 align-top max-w-[520px]">
                      <div title={q.content} className="overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{q.content}</div>
                    </td>
                    <td className="px-3 py-2 align-top text-center whitespace-nowrap">
                      <button className="mx-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20" title="Edit" onClick={() => setEditing(q)}>✏️</button>
                      <button className="mx-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20" title="Duplicate" onClick={async () => {
                        try {
                          setIsSaving(true)
                          const { api } = await import('../../api/client')
                          const body = { ...q, id: undefined }
                          await api.post('/api/admin/questions', body)
                          await refresh()
                        } finally { setIsSaving(false) }
                      }}>📄</button>
                      <button className="mx-1 px-2 py-1 rounded bg-rose-600/20 text-rose-200 hover:bg-rose-600/30" title="Delete" onClick={async () => {
                        if (!confirm('Xóa câu hỏi này?')) return
                        const { api } = await import('../../api/client')
                        await api.delete(`/api/admin/questions/${q.id}`)
                        await refresh()
                      }}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3">
        <div className="flex items-center gap-2">
          {anyChecked && (
            <button className="px-3 py-2 rounded-md bg-rose-600/80 hover:bg-rose-600" onClick={async () => {
              const ids = Object.keys(selectedIds).filter(id => selectedIds[id])
              if (ids.length === 0) return
              if (!confirm(`Xóa ${ids.length} câu hỏi đã chọn?`)) return
              const { api } = await import('../../api/client')
              await api.delete('/api/admin/questions', { data: { ids } })
              setSelectedIds({})
              await refresh()
            }}>Xóa mục đã chọn</button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">Trang {currentPage}/{totalPages}</span>
          <button disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded bg-white/10 disabled:opacity-40">Trước</button>
          <button disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 rounded bg-white/10 disabled:opacity-40">Sau</button>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className="ml-2 px-2 py-1 rounded bg-white/10">
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
    {/* Edit Modal */}
    {editing ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#111018] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">{editing!.id ? 'Sửa câu hỏi' : 'Tạo câu hỏi'}</div>
            <button onClick={() => setEditing(null)} className="px-2 py-1 rounded bg-white/10">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">Book</label>
              <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={editing!.book || ''} onChange={e => setEditing(prev => ({ ...prev!, book: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Chapter</label>
              <input type="number" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={editing!.chapter ?? ''} onChange={e => setEditing(prev => ({ ...prev!, chapter: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Verse Start</label>
              <input type="number" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={editing!.verseStart ?? ''} onChange={e => setEditing(prev => ({ ...prev!, verseStart: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Verse End</label>
              <input type="number" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={editing!.verseEnd ?? ''} onChange={e => setEditing(prev => ({ ...prev!, verseEnd: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Difficulty</label>
              <select className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={editing!.difficulty || ''} onChange={e => setEditing(prev => ({ ...prev!, difficulty: e.target.value || undefined }))}>
                <option value="">—</option>
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Type</label>
              <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={editing!.type || ''} onChange={e => setEditing(prev => ({ ...prev!, type: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-white/60 mb-1">Content</label>
              <textarea rows={5} className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={editing!.content || ''} onChange={e => setEditing(prev => ({ ...prev!, content: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={() => setEditing(null)} className="px-3 py-2 rounded bg-white/10">Hủy</button>
            <button disabled={isSaving} onClick={async () => {
              try {
                setIsSaving(true)
                const { api } = await import('../../api/client')
                const body = { ...editing! }
                if (editing!.id) await api.put(`/api/admin/questions/${editing!.id}`, body)
                else await api.post('/api/admin/questions', body)
                setEditing(null)
                await refresh()
              } finally { setIsSaving(false) }
            }} className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50">Lưu</button>
          </div>
        </div>
      </div>
    ) : null}

    {/* Import Modal */}
    {importOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#111018] p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold">Import Questions</div>
            <button onClick={closeImport} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">✕</button>
          </div>

          {!importResult ? (
            <>
              <p className="text-sm text-white/60 mb-4">
                Hỗ trợ định dạng <strong>.csv</strong> và <strong>.json</strong>.<br />
                CSV header: <code className="text-xs bg-white/10 px-1 rounded">book, chapter, type, text, optionA, optionB, optionC, optionD, correctAnswer, difficulty, explanation</code>
              </p>

              <div className="mb-4">
                <label className="block text-xs text-white/60 mb-1">Chọn file</label>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={e => { setImportFile(e.target.files?.[0] ?? null); setImportDryResult(null) }}
                  className="text-sm text-white/80 file:mr-3 file:px-3 file:py-1.5 file:rounded file:bg-white/10 file:border-0 file:text-sm file:text-white/80 file:cursor-pointer"
                />
              </div>

              {importDryResult && (
                <div className="mb-4 p-3 rounded-lg border border-white/10 bg-white/5 text-sm space-y-2">
                  <div className="font-medium text-white/80">Kết quả Dry-run:</div>
                  <div className="flex gap-4">
                    <span className="text-emerald-400">✓ Sẽ import: <strong>{importDryResult.willImport}</strong></span>
                    {importDryResult.errors?.length > 0 && (
                      <span className="text-rose-400">✗ Lỗi: <strong>{importDryResult.errors.length}</strong></span>
                    )}
                  </div>
                  {importDryResult.errors?.length > 0 && (
                    <div className="mt-2 max-h-28 overflow-y-auto space-y-1">
                      {importDryResult.errors.map((e: any, i: number) => (
                        <div key={i} className="text-xs text-rose-300">
                          {e.line ? `Dòng ${e.line}` : e.index ? `#${e.index}` : ''}: {e.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-2">
                <button onClick={closeImport} className="px-3 py-2 rounded bg-white/10 text-sm">Hủy</button>
                <button
                  disabled={!importFile || importLoading}
                  onClick={() => runImport(true)}
                  className="px-3 py-2 rounded bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  {importLoading ? 'Đang xử lý...' : 'Dry-run Preview'}
                </button>
                {importDryResult && (importDryResult.willImport ?? 0) > 0 && (
                  <button
                    disabled={importLoading}
                    onClick={() => runImport(false)}
                    className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-medium"
                  >
                    {importLoading ? 'Đang import...' : `Import ${importDryResult.willImport} câu hỏi`}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-lg font-semibold text-emerald-400 mb-1">Import thành công!</div>
              <div className="text-sm text-white/70">
                Đã thêm <strong>{importResult.imported}</strong> câu hỏi vào database.
                {importResult.errors?.length > 0 && (
                  <span className="text-rose-300 ml-2">{importResult.errors.length} dòng bị lỗi.</span>
                )}
              </div>
              <button onClick={closeImport} className="mt-4 px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-sm">Đóng</button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  )
}


