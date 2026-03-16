import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../../api/client'

interface ReviewItem {
  id: string
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  difficulty: 'easy' | 'medium' | 'hard'
  type: string
  content: string
  options: string[]
  correctAnswer: number[]
  explanation: string
  approvalsCount: number
  approvalsRequired: number
  createdAt: string
  reviews: { adminEmail: string; action: 'APPROVE' | 'REJECT'; comment: string; createdAt: string }[]
}

interface Stats { pending: number; active: number; rejected: number; approvalsRequired: number }

const DIFF_LABEL: Record<string, string> = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' }
const DIFF_COLOR: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

export default function ReviewQueue() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [pendingRes, statsRes] = await Promise.all([
        api.get('/api/admin/review/pending?size=50'),
        api.get('/api/admin/review/stats'),
      ])
      setItems(pendingRes.data.questions ?? [])
      setStats(statsRes.data)
    } catch {
      showToast('Không thể tải dữ liệu', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const approve = async (id: string) => {
    setActioningId(id)
    try {
      const res = await api.post(`/api/admin/review/${id}/approve`)
      const { approvalsCount, approvalsRequired, activated } = res.data
      if (activated) {
        showToast('✅ Câu hỏi đã được kích hoạt (đủ 2 lượt duyệt)!')
        setItems(prev => prev.filter(q => q.id !== id))
      } else {
        showToast(`👍 Đã duyệt (${approvalsCount}/${approvalsRequired}) — cần thêm ${approvalsRequired - approvalsCount} admin nữa`)
        setItems(prev => prev.map(q => q.id === id ? { ...q, approvalsCount } : q))
      }
      fetchData()
    } catch (e: any) {
      showToast(e.response?.data?.error ?? 'Lỗi khi duyệt', 'error')
    } finally {
      setActioningId(null)
    }
  }

  const reject = async (id: string) => {
    setActioningId(id)
    try {
      await api.post(`/api/admin/review/${id}/reject`, { comment: rejectComment })
      showToast('🗑️ Đã từ chối câu hỏi')
      setItems(prev => prev.filter(q => q.id !== id))
      setRejectingId(null)
      setRejectComment('')
      fetchData()
    } catch (e: any) {
      showToast(e.response?.data?.error ?? 'Lỗi khi từ chối', 'error')
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-bold ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black parchment-headline" style={{ color: '#f5f0e0' }}>
          Hàng Chờ Duyệt
        </h2>
        <p className="text-[#8b949e] text-sm mt-0.5">Câu hỏi AI tạo ra cần {stats?.approvalsRequired ?? 2} admin duyệt mới trở thành chính thức</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Chờ duyệt', value: stats.pending, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { label: 'Đã kích hoạt', value: stats.active, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Đã từ chối', value: stats.rejected, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          ].map(s => (
            <div key={s.label} className={`page-card p-4 border ${s.bg}`}>
              <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[#8b949e] font-bold uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="page-card p-12 text-center text-[#8b949e]">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="page-card p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-[#8b949e] font-bold">Không có câu hỏi nào đang chờ duyệt</div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(q => (
            <div key={q.id} className="page-card p-5 border-2 border-yellow-300/30">
              {/* Header row */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[q.difficulty] ?? 'bg-gray-100'}`}>
                  {DIFF_LABEL[q.difficulty] ?? q.difficulty}
                </span>
                <span className="text-xs text-[#9a8a7a] font-medium">
                  {q.book} {q.chapter}:{q.verseStart}–{q.verseEnd}
                </span>
                {/* Approval progress */}
                <span className="ml-auto flex items-center gap-1.5">
                  {Array.from({ length: q.approvalsRequired }).map((_, i) => (
                    <span key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      i < q.approvalsCount
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#e8e0d8] text-[#b0a090]'
                    }`}>✓</span>
                  ))}
                  <span className="text-xs text-[#9a8a7a] font-medium ml-1">
                    {q.approvalsCount}/{q.approvalsRequired} duyệt
                  </span>
                </span>
              </div>

              {/* Question content */}
              <p className="font-bold text-[#4a3f35] mb-3 leading-snug">{q.content}</p>

              {/* Options */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {q.options.map((opt, i) => (
                  <div key={i} className={`text-sm px-3 py-1.5 rounded-lg ${
                    (q.correctAnswer ?? []).includes(i)
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold'
                      : 'bg-[#f5f0e8] text-[#7a6a5a]'
                  }`}>
                    <span className="font-black mr-1">{String.fromCharCode(65 + i)}.</span> {opt}
                  </div>
                ))}
              </div>

              {/* Explanation toggle */}
              <button onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                className="text-xs text-[#4bbf9f] font-bold mb-3">
                {expandedId === q.id ? '▾ Ẩn giải thích' : '▸ Xem giải thích'}
              </button>
              {expandedId === q.id && q.explanation && (
                <p className="text-xs text-[#7a6a5a] italic bg-[#faf8f5] px-3 py-2 rounded-lg mb-3">{q.explanation}</p>
              )}

              {/* Reviewer badges */}
              {q.reviews.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {q.reviews.map((r, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      r.action === 'APPROVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {r.action === 'APPROVE' ? '✓' : '✗'} {r.adminEmail}
                    </span>
                  ))}
                </div>
              )}

              {/* Reject comment input */}
              {rejectingId === q.id && (
                <div className="mb-3">
                  <textarea
                    rows={2}
                    value={rejectComment}
                    onChange={e => setRejectComment(e.target.value)}
                    placeholder="Lý do từ chối (tuỳ chọn)..."
                    className="form-input text-sm resize-none w-full mb-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => reject(q.id)} disabled={actioningId === q.id}
                      className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 disabled:opacity-50">
                      Xác nhận từ chối
                    </button>
                    <button onClick={() => { setRejectingId(null); setRejectComment('') }}
                      className="px-4 py-1.5 bg-[#eeeae0] text-[#7a6a5a] text-xs font-bold rounded-lg">
                      Huỷ
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {rejectingId !== q.id && (
                <div className="flex gap-2">
                  <button onClick={() => approve(q.id)} disabled={actioningId === q.id}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                    {actioningId === q.id ? '...' : '✓ Duyệt'}
                  </button>
                  <button onClick={() => setRejectingId(q.id)} disabled={actioningId === q.id}
                    className="px-5 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                    ✗ Từ chối
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
