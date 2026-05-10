import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listQuizSets, type ListQuizSetsParams, type PublishStatus, type QuizSet } from '../../api/quizSets'

const STATUS_FILTERS: { key: PublishStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PUBLISHED', label: 'Đã xuất bản' },
  { key: 'DRAFT', label: 'Bản nháp' },
  { key: 'ARCHIVED', label: 'Đã lưu trữ' },
]

const SORT_OPTIONS: { key: NonNullable<ListQuizSetsParams['sort']>; label: string }[] = [
  { key: 'recent', label: 'Mới nhất' },
  { key: 'popular', label: 'Phổ biến' },
  { key: 'name', label: 'A-Z' },
  { key: 'rating', label: 'Đánh giá' },
]

export default function QuizSetList() {
  const { id: groupId } = useParams<{ id: string }>()
  const [items, setItems] = useState<QuizSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<PublishStatus | 'ALL'>('ALL')
  const [sort, setSort] = useState<ListQuizSetsParams['sort']>('recent')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!groupId) return
    setLoading(true); setError(null)
    listQuizSets(groupId, {
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      sort, search: search.trim() || undefined, size: 100,
    })
      .then(res => setItems(res.quizSets))
      .catch(err => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false))
  }, [groupId, statusFilter, sort, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: items.length }
    items.forEach(qs => { c[qs.publishStatus] = (c[qs.publishStatus] || 0) + 1 })
    return c
  }, [items])

  return (
    <div className="min-h-screen p-4 md:p-8 text-white" style={{ background: '#11131e' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to={`/groups/${groupId}`} className="text-sm text-white/60 hover:text-white">← Quay lại nhóm</Link>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-1">Bộ câu hỏi của nhóm</h1>
            <p className="text-sm text-white/50">{items.length} bộ</p>
          </div>
          <Link to={`/groups/${groupId}/quiz-sets/new`}
                className="px-4 py-2 rounded-lg font-bold text-black"
                style={{ background: '#e8a832' }}>+ Tạo mới</Link>
        </div>

        {/* Search */}
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Tìm bộ câu hỏi..."
          className="w-full px-4 py-2.5 mb-4 rounded-lg border border-white/10 bg-white/5 text-white"
        />

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_FILTERS.map(f => {
            const selected = statusFilter === f.key
            return (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-sm border ${selected ? 'border-2' : 'border-white/10'}`}
                style={selected ? { borderColor: '#e8a832', color: '#e8a832' } : undefined}
              >
                {f.label} · {counts[f.key] || 0}
              </button>
            )
          })}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-white/50">Sắp xếp:</span>
          <select value={sort} onChange={e => setSort(e.target.value as any)}
                  className="px-2 py-1 text-sm rounded border border-white/10 bg-white/5 text-white">
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>

        {error && <div className="px-4 py-3 mb-4 rounded-lg bg-red-500/20 text-red-200">{error}</div>}

        {loading ? (
          <div className="text-center py-8 text-white/50">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl p-8 text-center border border-white/10 bg-white/5">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-white/70 mb-4">{search ? 'Không tìm thấy bộ câu hỏi' : 'Chưa có bộ câu hỏi nào'}</p>
            {!search && (
              <Link to={`/groups/${groupId}/quiz-sets/new`}
                    className="inline-block px-4 py-2 rounded-lg font-bold text-black"
                    style={{ background: '#e8a832' }}>+ Tạo bộ câu hỏi đầu tiên</Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(qs => <QuizSetCard key={qs.id} groupId={groupId!} qs={qs} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function QuizSetCard({ groupId, qs }: { groupId: string; qs: QuizSet }) {
  const cover = qs.coverImageUrl?.startsWith('emoji:') ? qs.coverImageUrl.slice(6) : '📖'
  const statusBadge = {
    DRAFT: { vi: 'Nháp', color: '#94a3b8' },
    PUBLISHED: null,
    ARCHIVED: { vi: 'Lưu trữ', color: '#f59e0b' },
    SOFT_DELETED: { vi: 'Đã xóa', color: '#ef4444' },
  }[qs.publishStatus]
  return (
    <Link to={`/groups/${groupId}/quiz-sets/${qs.id}`}
          className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
      <div className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl shrink-0"
           style={{ background: 'linear-gradient(135deg, #2a2d3e, #1a1d2e)' }}>{cover}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{qs.name}</h3>
          {statusBadge && (
            <span className="px-2 py-0.5 rounded-full text-xs shrink-0"
                  style={{ background: statusBadge.color + '33', color: statusBadge.color }}>
              {statusBadge.vi}
            </span>
          )}
        </div>
        {qs.description && <p className="text-xs text-white/50 truncate">{qs.description}</p>}
        <div className="flex gap-3 text-xs text-white/40 mt-1">
          <span>{qs.totalQuestions} câu</span>
          {qs.playCount > 0 && <span>▶ {qs.playCount}</span>}
          {qs.averageRating != null && <span>⭐ {qs.averageRating}</span>}
        </div>
      </div>
    </Link>
  )
}
