import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  archiveQuizSet, cloneQuizSet, createLiveRoomFromQuizSet, deleteQuizSet,
  getMyMastery, getQuizSet, getModeAvailability, MODE_LABELS,
  publishQuizSet, type QuizSet, type QuizSetMastery, type RoomMode, unarchiveQuizSet,
} from '../../api/quizSets'

const STATUS_LABELS: Record<string, { vi: string; color: string }> = {
  DRAFT: { vi: 'Bản nháp', color: '#94a3b8' },
  PUBLISHED: { vi: 'Đã xuất bản', color: '#4ade80' },
  ARCHIVED: { vi: 'Đã lưu trữ', color: '#f59e0b' },
  SOFT_DELETED: { vi: 'Đã xóa', color: '#ef4444' },
}

export default function QuizSetDetail() {
  const { id: groupId, setId } = useParams<{ id: string; setId: string }>()
  const navigate = useNavigate()

  const [quizSet, setQuizSet] = useState<QuizSet | null>(null)
  const [mastery, setMastery] = useState<QuizSetMastery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModePicker, setShowModePicker] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!groupId || !setId) return
    setLoading(true)
    Promise.all([getQuizSet(groupId, setId), getMyMastery(groupId, setId).catch(() => null)])
      .then(([qs, m]) => { setQuizSet(qs); setMastery(m) })
      .catch(err => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false))
  }, [groupId, setId])

  if (loading) return <div className="min-h-screen p-8 text-white" style={{ background: '#11131e' }}>Đang tải...</div>
  if (error || !quizSet) return <div className="min-h-screen p-8 text-white" style={{ background: '#11131e' }}>{error || 'Không tìm thấy'}</div>

  const cover = quizSet.coverImageUrl?.startsWith('emoji:')
    ? quizSet.coverImageUrl.slice(6)
    : '📖'
  const status = STATUS_LABELS[quizSet.publishStatus] || { vi: quizSet.publishStatus, color: '#94a3b8' }
  const masteryPct = quizSet.totalQuestions > 0 && mastery
    ? Math.round((mastery.questionsLearned / quizSet.totalQuestions) * 100)
    : 0

  const action = async (fn: () => Promise<QuizSet>, successPath?: string) => {
    setBusy(true)
    try {
      const updated = await fn()
      setQuizSet(updated)
      if (successPath) navigate(successPath)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message)
    } finally {
      setBusy(false)
    }
  }

  const startMode = async (mode: RoomMode) => {
    if (!groupId) return
    setBusy(true)
    try {
      const room = await createLiveRoomFromQuizSet(groupId, { quizSetId: quizSet.id, mode })
      navigate(`/room/${room.roomCode}`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message)
    } finally {
      setBusy(false); setShowModePicker(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 text-white" style={{ background: '#11131e' }}>
      <div className="max-w-3xl mx-auto">
        {/* Hero cover */}
        <div className="rounded-2xl p-8 mb-6 relative" style={{ background: 'linear-gradient(135deg, #2a2d3e, #1a1d2e)' }}>
          <div className="text-7xl text-center mb-4">{cover}</div>
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold"
               style={{ background: status.color + '33', color: status.color }}>
            {status.vi}
          </div>
          <div className="absolute top-4 right-4 flex gap-2 text-xs">
            {quizSet.averageRating != null && (
              <span className="px-2 py-1 rounded-full bg-black/30">⭐ {quizSet.averageRating}</span>
            )}
            <span className="px-2 py-1 rounded-full bg-black/30">▶ {quizSet.playCount}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-center">{quizSet.name}</h1>
          {quizSet.coverScripture && (
            <p className="text-center text-sm mt-2" style={{ color: '#e8a832' }}>📖 {quizSet.coverScripture}</p>
          )}
        </div>

        {/* Tags */}
        {quizSet.tags && quizSet.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {quizSet.tags.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs bg-white/10">{tag}</span>
            ))}
          </div>
        )}

        {quizSet.description && (
          <p className="text-white/80 mb-6">{quizSet.description}</p>
        )}

        {/* 4-stat grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat label="Câu hỏi" value={String(quizSet.totalQuestions)} />
          <Stat label="Độ khó" value={quizSet.difficulty || '—'} />
          <Stat label="Thời gian" value={quizSet.estimatedDurationMin ? `${quizSet.estimatedDurationMin} phút` : '—'} />
          <Stat label="Đã chơi" value={`${quizSet.playCount} lần`} />
        </div>

        {/* Mastery progress */}
        {mastery && mastery.id != null && (
          <div className="rounded-xl p-4 mb-6 border border-white/10" style={{ background: 'rgba(232, 168, 50, 0.08)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">🎯 Tiến độ học của bạn</span>
              <span className="text-sm" style={{ color: '#e8a832' }}>{masteryPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
              <div className="h-full" style={{ width: `${masteryPct}%`, background: '#e8a832' }} />
            </div>
            <div className="text-xs text-white/60">
              Đã thuộc {mastery.questionsLearned}/{quizSet.totalQuestions} câu · {mastery.totalAttempts} lần ôn
              {mastery.bestScore > 0 && ` · Best ${mastery.bestScore}`}
              {mastery.completedMastery && ' · 🏆 Đã hoàn thành'}
            </div>
          </div>
        )}

        {quizSet.authorNote && (
          <div className="rounded-xl p-4 mb-6 border border-white/10 bg-white/5">
            <div className="text-xs font-semibold mb-1 text-white/60">📝 Hướng dẫn</div>
            <div className="text-sm whitespace-pre-wrap">{quizSet.authorNote}</div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2 mb-6">
          {quizSet.publishStatus === 'PUBLISHED' && (
            <button onClick={() => setShowModePicker(true)} disabled={busy}
                    className="w-full py-3 rounded-xl font-bold text-black"
                    style={{ background: '#e8a832' }}>
              ▶ CHƠI NGAY · CHỌN MODE
            </button>
          )}
          {quizSet.publishStatus === 'DRAFT' && (
            <button onClick={() => action(() => publishQuizSet(groupId!, setId!))} disabled={busy}
                    className="w-full py-3 rounded-xl font-bold text-black"
                    style={{ background: '#e8a832' }}>
              ✅ XUẤT BẢN
            </button>
          )}
          {quizSet.publishStatus === 'ARCHIVED' && (
            <button onClick={() => action(() => unarchiveQuizSet(groupId!, setId!))} disabled={busy}
                    className="w-full py-3 rounded-xl border border-white/20">
              📦 KHÔI PHỤC
            </button>
          )}
        </div>

        {/* Owner actions */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <button onClick={() => action(() => cloneQuizSet(groupId!, setId!), `/groups/${groupId}/quiz-sets`)}
                  disabled={busy}
                  className="py-2 rounded-lg border border-white/10 bg-white/5">
            📋 Sao chép
          </button>
          {quizSet.publishStatus === 'PUBLISHED' && (
            <button onClick={() => action(() => archiveQuizSet(groupId!, setId!))} disabled={busy}
                    className="py-2 rounded-lg border border-white/10 bg-white/5">
              📦 Lưu trữ
            </button>
          )}
          <button onClick={() => {
                    if (confirm('Xóa bộ câu hỏi này? (Có thể khôi phục trong 30 ngày)'))
                      action(() => deleteQuizSet(groupId!, setId!), `/groups/${groupId}/quiz-sets`)
                  }}
                  disabled={busy}
                  className="py-2 rounded-lg border border-red-500/30 text-red-300">
            🗑 Xóa
          </button>
        </div>
      </div>

      {/* Mode picker modal */}
      {showModePicker && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70"
             onClick={() => setShowModePicker(false)}>
          <div className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl p-6 text-white"
               style={{ background: '#1a1d2e' }}
               onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Chọn cách chơi</h2>
            <div className="space-y-2">
              {(Object.keys(MODE_LABELS) as RoomMode[]).map(mode => {
                const cfg = MODE_LABELS[mode]
                const av = getModeAvailability(mode, quizSet.totalQuestions)
                const isSuggested = quizSet.suggestedMode === mode
                return (
                  <button key={mode} onClick={() => av.available && startMode(mode)}
                          disabled={!av.available || busy}
                          className={`w-full p-3 rounded-xl border text-left ${
                            av.available ? 'border-white/10 hover:bg-white/5' : 'border-white/5 opacity-50'
                          }`}
                          style={isSuggested ? { borderColor: '#e8a832' } : undefined}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{cfg.emoji} {cfg.vi}{isSuggested && ' ⭐'}</span>
                      {!av.available && <span className="text-xs text-red-300">{av.reason}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setShowModePicker(false)}
                    className="w-full mt-4 py-2 rounded-lg border border-white/10">Hủy</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3 bg-white/5 border border-white/10 text-center">
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  )
}
