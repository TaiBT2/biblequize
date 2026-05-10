import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  listQuizSets, listFolders, createFolder, deleteFolder,
  type ListQuizSetsParams, type PublishStatus, type QuizSet, type QuizSetFolder,
} from '../../api/quizSets'

const STATUS_FILTERS: { key: PublishStatus | 'ALL'; tKey: string }[] = [
  { key: 'ALL',       tKey: 'quizSet.list.filterAll' },
  { key: 'DRAFT',     tKey: 'quizSet.list.filterDraft' },
  { key: 'PUBLISHED', tKey: 'quizSet.list.filterPublished' },
  { key: 'ARCHIVED',  tKey: 'quizSet.list.filterArchived' },
]

const SORT_OPTIONS: { key: NonNullable<ListQuizSetsParams['sort']>; tKey: string }[] = [
  { key: 'popular', tKey: 'quizSet.list.sortPopular' },
  { key: 'recent',  tKey: 'quizSet.list.sortRecent' },
  { key: 'name',    tKey: 'quizSet.list.sortName' },
  { key: 'rating',  tKey: 'quizSet.list.sortRating' },
]

const DIFFICULTY_LABEL: Record<string, { vi: string; cssClass: string; emoji: string }> = {
  EASY:   { vi: 'Dễ',         cssClass: 'qs-difficulty-easy',   emoji: '🟢' },
  MEDIUM: { vi: 'Trung bình', cssClass: 'qs-difficulty-medium', emoji: '⚡' },
  HARD:   { vi: 'Khó',        cssClass: 'qs-difficulty-hard',   emoji: '🔥' },
  MIXED:  { vi: 'Tổng hợp',   cssClass: 'qs-difficulty-mixed',  emoji: '🎲' },
}

export default function QuizSetList() {
  const { t } = useTranslation()
  const { id: groupId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [items, setItems] = useState<QuizSet[]>([])
  const [folders, setFolders] = useState<QuizSetFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<PublishStatus | 'ALL'>('ALL')
  const [sort, setSort] = useState<ListQuizSetsParams['sort']>('popular')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!groupId) return
    setLoading(true); setError(null)
    Promise.all([
      listQuizSets(groupId, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        sort, search: search.trim() || undefined, size: 100,
      }),
      listFolders(groupId).catch(() => []),
    ])
      .then(([qsRes, folderList]) => { setItems(qsRes.quizSets); setFolders(folderList) })
      .catch(err => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false))
  }, [groupId, statusFilter, sort, search])

  const refreshFolders = () => groupId && listFolders(groupId).then(setFolders).catch(() => {})

  const handleCreateFolder = async () => {
    const name = window.prompt(t('quizSet.list.createFolderPrompt'))
    if (!name || !name.trim() || !groupId) return
    try {
      await createFolder(groupId, name.trim())
      refreshFolders()
    } catch (err: any) { setError(err?.response?.data?.message || err.message) }
  }

  const handleDeleteFolder = async (folder: QuizSetFolder) => {
    if (!confirm(t('quizSet.list.deleteFolderConfirm', { name: folder.name }))) return
    if (!groupId) return
    try {
      await deleteFolder(groupId, folder.id)
      refreshFolders()
    } catch (err: any) { setError(err?.response?.data?.message || err.message) }
  }

  const toggle = (key: string) => setCollapsed(c => ({ ...c, [key]: !c[key] }))

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: items.length }
    items.forEach(qs => { c[qs.publishStatus] = (c[qs.publishStatus] || 0) + 1 })
    return c
  }, [items])

  const drafts = useMemo(() => items.filter(qs => qs.publishStatus === 'DRAFT'), [items])
  const nonDrafts = useMemo(() => items.filter(qs => qs.publishStatus !== 'DRAFT'), [items])

  const grouped = useMemo(() => {
    const byFolder = new Map<string, QuizSet[]>()
    const uncategorized: QuizSet[] = []
    nonDrafts.forEach(qs => {
      if (qs.folderId) {
        const arr = byFolder.get(qs.folderId) || []
        arr.push(qs)
        byFolder.set(qs.folderId, arr)
      } else {
        uncategorized.push(qs)
      }
    })
    return { byFolder, uncategorized }
  }, [nonDrafts])

  return (
    <div className="qs-bg min-h-screen">
      <div className="max-w-md mx-auto pb-10">
        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(`/groups/${groupId}`)}
            className="w-9 h-9 rounded-full qs-glass flex items-center justify-center text-gray-400"
            aria-label={t('quizSet.list.back')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <div className="text-xs text-gray-400">{t('quizSet.list.title')}</div>
            <div className="text-sm font-bold text-white qs-font-vn-display">{t('quizSet.list.totalCount', { count: items.length })}</div>
          </div>
          <Link
            to={`/groups/${groupId}/quiz-sets/new`}
            className="w-9 h-9 rounded-full qs-gold-grad flex items-center justify-center text-[#11131e] font-bold"
            aria-label={t('quizSet.list.createNew')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>

        {/* Search + filters */}
        <div className="px-5 mb-3">
          <div className="qs-glass rounded-xl px-3 py-2.5 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-gray-400">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm text-white placeholder-gray-500 flex-1"
              placeholder={t('quizSet.list.search')}
            />
          </div>

          <div className="flex gap-1.5 mt-2 overflow-x-auto qs-scroll-thin pb-1">
            {STATUS_FILTERS.map(f => {
              const selected = statusFilter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-semibold ${
                    selected
                      ? 'bg-[#e8a832]/15 text-[#e8a832] border border-[#e8a832]/30'
                      : 'qs-glass text-gray-300'
                  }`}
                >
                  {t(f.tKey)} · {counts[f.key] || 0}
                </button>
              )
            })}
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] text-gray-500">{t('quizSet.list.sortLabel')}</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              className="text-[10px] text-[#e8a832] font-semibold bg-transparent outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.key} value={o.key} className="bg-[#11131e] text-white">{t(o.tKey)}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mx-5 mb-3 px-4 py-3 rounded-lg bg-red-500/20 text-red-200 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="px-5 py-8 text-center text-gray-500">{t('quizSet.list.loading')}</div>
        ) : items.length === 0 ? (
          <EmptyState groupId={groupId!} hasSearch={search.length > 0} />
        ) : (
          <div className="px-5">
            {/* Folders với quiz sets bên trong */}
            {folders.map(folder => {
              const folderItems = grouped.byFolder.get(folder.id) || []
              if (folderItems.length === 0) return (
                <FolderHeader
                  key={folder.id} folder={folder} count={0}
                  collapsed={collapsed[folder.id]} onToggle={() => toggle(folder.id)}
                  onDelete={() => handleDeleteFolder(folder)}
                />
              )
              return (
                <div key={folder.id} className="mb-3">
                  <FolderHeader
                    folder={folder} count={folderItems.length}
                    collapsed={collapsed[folder.id]} onToggle={() => toggle(folder.id)}
                    onDelete={() => handleDeleteFolder(folder)}
                  />
                  {!collapsed[folder.id] && folderItems.map((qs, idx) => (
                    <QuizSetCard key={qs.id} groupId={groupId!} qs={qs} featured={idx === 0} />
                  ))}
                </div>
              )
            })}

            {/* Uncategorized */}
            {grouped.uncategorized.length > 0 && (
              <div className="mb-3">
                {folders.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-300">{t('quizSet.list.uncategorized')}</span>
                    <span className="text-[10px] text-gray-500">{t('quizSet.list.folderItemCount', { count: grouped.uncategorized.length })}</span>
                  </div>
                )}
                {grouped.uncategorized.map((qs, idx) => (
                  <QuizSetCard key={qs.id} groupId={groupId!} qs={qs} featured={idx === 0 && folders.length === 0} />
                ))}
              </div>
            )}

            {/* Drafts section */}
            {drafts.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-400">{t('quizSet.list.draftsHeader')}</span>
                </div>
                {drafts.map(qs => <DraftCard key={qs.id} groupId={groupId!} qs={qs} />)}
              </div>
            )}

            {/* Create folder CTA (only LEADER/MOD; BE enforces, FE just always shows) */}
            <button
              onClick={handleCreateFolder}
              className="w-full mt-3 py-2 rounded-xl qs-glass border border-dashed border-white/20 text-xs text-gray-400 hover:text-[#e8a832] hover:border-[#e8a832]/40"
            >{t('quizSet.list.createFolder')}</button>
          </div>
        )}
      </div>
    </div>
  )
}

function FolderHeader({
  folder, count, collapsed, onToggle, onDelete,
}: {
  folder: QuizSetFolder; count: number;
  collapsed?: boolean; onToggle: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <button onClick={onToggle} className="flex items-center gap-2 text-xs font-semibold text-gray-300">
        <span>📁</span>
        <span style={folder.color ? { color: folder.color } : undefined}>{folder.name}</span>
        <span className="text-[10px] text-gray-500">{count} bộ</span>
      </button>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onDelete}
          className="text-[10px] text-gray-500 hover:text-red-400 px-1.5 py-0.5"
          title="Xóa thư mục"
        >×</button>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
          className={`text-gray-500 transition-transform ${collapsed ? 'rotate-180' : ''}`}
        ><path d="M7 14l5-5 5 5z" /></svg>
      </div>
    </div>
  )
}

function coverEmoji(qs: QuizSet): string {
  return qs.coverImageUrl?.startsWith('emoji:') ? qs.coverImageUrl.slice(6) : '📖'
}

function statusBadge(status: PublishStatus) {
  switch (status) {
    case 'PUBLISHED': return { vi: '✓ Đã xuất bản', cls: 'qs-badge-published' }
    case 'DRAFT':     return { vi: 'Nháp',          cls: 'qs-badge-draft' }
    case 'ARCHIVED':  return { vi: 'Lưu trữ',       cls: 'qs-badge-archived' }
    case 'SOFT_DELETED': return { vi: 'Đã xóa',     cls: 'qs-badge-deleted' }
  }
}

function QuizSetCard({ groupId, qs, featured }: { groupId: string; qs: QuizSet; featured: boolean }) {
  const cover = coverEmoji(qs)
  const badge = statusBadge(qs.publishStatus)
  const diff = qs.difficulty ? DIFFICULTY_LABEL[qs.difficulty] : null

  if (featured) {
    return (
      <Link
        to={`/groups/${groupId}/quiz-sets/${qs.id}`}
        className="block rounded-xl mb-2 overflow-hidden qs-glass-strong border border-[#e8a832]/30 qs-fade-in"
      >
        <div className="h-20 relative qs-cover-fallback">
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-40">{cover}</div>
          <div className="absolute top-2 left-2">
            <span className={`qs-badge-status ${badge.cls}`}>{badge.vi}</span>
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            {qs.averageRating != null && (
              <span className="px-1.5 py-0.5 rounded bg-[#e8a832]/30 text-[#e8a832] text-[9px] font-bold">⭐ {Number(qs.averageRating).toFixed(1)}</span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-black/40 text-white text-[9px] font-bold backdrop-blur">▶ {qs.playCount}x</span>
          </div>
        </div>
        <div className="p-3">
          <h3 className="qs-font-vn-display font-bold text-white text-sm leading-tight mb-1">{qs.name}</h3>
          {qs.coverScripture && (
            <div className="text-[10px] text-gray-400 mb-2 line-clamp-1">📍 {qs.coverScripture}{qs.description ? ` · "${qs.description.slice(0, 40)}"` : ''}</div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-gray-500">{qs.totalQuestions} câu</span>
            {diff && (
              <>
                <span className="text-[10px] text-gray-600">·</span>
                <span className={`text-[10px] font-semibold ${diff.cssClass}`}>{diff.emoji} {diff.vi}</span>
              </>
            )}
            {qs.estimatedDurationMin != null && (
              <>
                <span className="text-[10px] text-gray-600">·</span>
                <span className="text-[10px] text-gray-500">~{qs.estimatedDurationMin} phút</span>
              </>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/groups/${groupId}/quiz-sets/${qs.id}`}
      className="block rounded-xl mb-2 qs-glass overflow-hidden qs-fade-in"
    >
      <div className="flex p-3 gap-3">
        <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0 qs-cover-fallback">{cover}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="qs-font-vn-display font-bold text-white text-xs leading-tight truncate">{qs.name}</h3>
            {qs.publishStatus !== 'PUBLISHED' && (
              <span className={`qs-badge-status ${badge.cls} shrink-0 ml-1`}>{badge.vi}</span>
            )}
            {qs.publishStatus === 'PUBLISHED' && (
              <span className="qs-badge-status qs-badge-published shrink-0 ml-1">Pub</span>
            )}
          </div>
          {qs.coverScripture && (
            <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">📍 {qs.coverScripture}</div>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[10px] text-gray-500">{qs.totalQuestions} câu</span>
            {diff && (
              <>
                <span className="text-[10px] text-gray-600">·</span>
                <span className={`text-[10px] font-semibold ${diff.cssClass}`}>{diff.vi}</span>
              </>
            )}
            {qs.playCount > 0 && (
              <>
                <span className="text-[10px] text-gray-600">·</span>
                <span className="text-[10px] text-[#e8a832] font-bold">▶ {qs.playCount}x</span>
              </>
            )}
            {qs.averageRating != null && (
              <span className="text-[10px] text-[#e8a832] ml-auto">⭐ {Number(qs.averageRating).toFixed(1)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function DraftCard({ groupId, qs }: { groupId: string; qs: QuizSet }) {
  const pct = Math.min(100, Math.round((qs.totalQuestions / 15) * 100))
  return (
    <Link
      to={`/groups/${groupId}/quiz-sets/${qs.id}`}
      className="block rounded-xl mb-2 overflow-hidden border border-gray-500/20"
      style={{ background: 'rgba(50, 52, 64, 0.3)' }}
    >
      <div className="flex p-3 gap-3">
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0"
          style={{ background: 'rgba(156, 163, 175, 0.15)' }}
        >📝</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="qs-font-vn-display font-bold text-gray-300 text-xs leading-tight truncate">{qs.name}</h3>
            <span className="qs-badge-status qs-badge-draft shrink-0 ml-1">Nháp</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {qs.totalQuestions > 0 ? `Mới có ${qs.totalQuestions} câu` : 'Chưa có câu hỏi'} · Sửa cuối: {qs.updatedAt ? formatRelative(qs.updatedAt) : '—'}
          </div>
          <div className="mt-1.5">
            <div className="qs-progress-bar h-1">
              <div className="qs-progress-fill qs-progress-fill-gold h-1" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[10px] text-gray-500 mt-1">{pct}% hoàn thành</div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ groupId, hasSearch }: { groupId: string; hasSearch: boolean }) {
  return (
    <div className="mx-5 rounded-xl p-8 text-center qs-glass">
      <div className="text-5xl mb-3">📚</div>
      <p className="text-gray-300 mb-4 text-sm">
        {hasSearch ? 'Không tìm thấy bộ câu hỏi nào.' : 'Chưa có bộ câu hỏi nào.'}
      </p>
      {!hasSearch && (
        <Link
          to={`/groups/${groupId}/quiz-sets/new`}
          className="inline-block px-4 py-2 rounded-lg qs-gold-grad text-[#11131e] font-bold text-sm"
        >+ Tạo bộ câu hỏi đầu tiên</Link>
      )}
    </div>
  )
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 60) return `${min} phút trước`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} giờ trước`
  const day = Math.floor(hr / 24)
  if (day === 1) return 'hôm qua'
  if (day < 7) return `${day} ngày trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}
