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

interface Stats {
  pendingForMe: number; totalPending: number; active: number; rejected: number
  myActionsToday: number; approvalsRequired: number
}

const DIFF_LABEL: Record<string, string> = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' }
const DIFF_COLOR: Record<string, string> = {
  easy: 'bg-emerald-500/10 text-emerald-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  hard: 'bg-red-500/10 text-red-400',
}

interface HistoryItem {
  id: string; questionId: string; action: 'APPROVE' | 'REJECT'
  comment: string; createdAt: string; questionContent?: string; questionBook?: string
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
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [pendingRes, statsRes, historyRes] = await Promise.all([
        api.get('/api/admin/review/pending?size=50'),
        api.get('/api/admin/review/stats'),
        api.get('/api/admin/review/my-history?size=20'),
      ])
      setItems(pendingRes.data.questions ?? [])
      setStats(statsRes.data)
      setHistory(historyRes.data.content ?? [])
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
        <h2 className="text-2xl font-black text-[#e1e1ef]">
          Hàng Chờ Duyệt
        </h2>
        <p className="text-[#d5c4af]/60 text-sm mt-0.5">Câu hỏi AI tạo ra cần {stats?.approvalsRequired ?? 2} admin duyệt mới trở thành chính thức</p>
      </div>

      {/* Personalized Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1d1f29] rounded-lg p-4 border bg-yellow-500/10 border-yellow-500/20">
            <div className="text-3xl font-black text-yellow-400">{stats.pendingForMe}</div>
            <div className="text-xs text-yellow-400/80 font-bold uppercase tracking-wider mt-1">Cần bạn duyệt</div>
          </div>
          <div className="bg-[#1d1f29] rounded-lg p-4 border bg-blue-500/10 border-blue-500/20">
            <div className="text-3xl font-black text-blue-400">{stats.totalPending}</div>
            <div className="text-xs text-blue-400/80 font-bold uppercase tracking-wider mt-1">Tổng đang chờ</div>
            {stats.totalPending > stats.pendingForMe && (
              <div className="text-xs text-blue-400/50 mt-1">{stats.totalPending - stats.pendingForMe} câu bạn đã xử lý</div>
            )}
          </div>
          <div className="bg-[#1d1f29] rounded-lg p-4 border bg-emerald-500/10 border-emerald-500/20">
            <div className="text-3xl font-black text-emerald-400">{stats.myActionsToday}</div>
            <div className="text-xs text-emerald-400/80 font-bold uppercase tracking-wider mt-1">Bạn đã duyệt hôm nay</div>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="bg-[#1d1f29] rounded-lg border border-[#504535]/10 p-12 text-center text-[#d5c4af]/60">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-2xl p-12 text-center">
          <span className="text-6xl mb-4 block">🎉</span>
          <h3 className="text-2xl font-bold text-[#e1e1ef] mb-2">Tuyệt vời! Bạn đã duyệt hết queue</h3>
          <p className="text-[#d5c4af]/60">Không còn câu nào cần bạn xem xét. Nghỉ ngơi một chút nhé!</p>
          <p className="text-[#d5c4af]/40 text-sm mt-4">Câu hỏi mới sẽ tự động xuất hiện khi có.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(q => (
            <div key={q.id} className="bg-[#1d1f29] rounded-lg p-5 border border-[#504535]/20">
              {/* Header row */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[q.difficulty] ?? 'bg-white/5'}`}>
                  {DIFF_LABEL[q.difficulty] ?? q.difficulty}
                </span>
                <span className="text-xs text-[#d5c4af]/60 font-medium">
                  {q.book} {q.chapter}:{q.verseStart}–{q.verseEnd}
                </span>
                {/* Approval progress */}
                <span className="ml-auto flex items-center gap-1.5">
                  {Array.from({ length: q.approvalsRequired }).map((_, i) => (
                    <span key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      i < q.approvalsCount
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#504535]/30 text-[#d5c4af]/50'
                    }`}>✓</span>
                  ))}
                  <span className="text-xs text-[#d5c4af]/60 font-medium ml-1">
                    {q.approvalsCount}/{q.approvalsRequired} duyệt
                  </span>
                </span>
              </div>

              {/* Question content */}
              <p className="font-bold text-[#e8a832] mb-3 leading-snug">{q.content}</p>

              {/* Options */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {q.options.map((opt, i) => (
                  <div key={i} className={`text-sm px-3 py-1.5 rounded-lg ${
                    (q.correctAnswer ?? []).includes(i)
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold'
                      : 'bg-white/5 text-[#d5c4af]'
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
                <p className="text-xs text-[#d5c4af] italic bg-white/5 px-3 py-2 rounded-lg mb-3">{q.explanation}</p>
              )}

              {/* Reviewer badges */}
              {q.reviews.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {q.reviews.map((r, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      r.action === 'APPROVE'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
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
                    className="w-full bg-[#191b25] border-none rounded text-sm text-[#e1e1ef] p-3 focus:ring-1 focus:ring-[#e8a832] resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => reject(q.id)} disabled={actioningId === q.id}
                      className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 disabled:opacity-50">
                      Xác nhận từ chối
                    </button>
                    <button onClick={() => { setRejectingId(null); setRejectComment('') }}
                      className="px-4 py-1.5 bg-[#32343e] text-[#d5c4af] text-xs font-bold rounded-lg">
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
                    className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                    ✗ Từ chối
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* My Review History */}
      <div className="mt-12">
        <button onClick={() => setShowHistory(!showHistory)} className="text-lg font-semibold text-[#e1e1ef] flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-secondary">history</span>
          Lịch sử duyệt của tôi
          <span className="text-xs text-[#d5c4af]/50 ml-2">({history.length})</span>
        </button>
        {showHistory && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-[#d5c4af]/40 text-center py-8">Bạn chưa duyệt câu hỏi nào.</p>
            ) : history.map(item => (
              <div key={item.id} className="bg-[#1d1f29] rounded-lg p-4 flex items-center justify-between border border-[#504535]/10">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e1e1ef]/80 truncate">{item.questionContent ?? item.questionId}</p>
                  <p className="text-xs text-[#d5c4af]/50 mt-1">{item.questionBook} · {new Date(item.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ml-3 ${
                  item.action === 'APPROVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {item.action === 'APPROVE' ? '✓ Đã duyệt' : '✗ Đã từ chối'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
