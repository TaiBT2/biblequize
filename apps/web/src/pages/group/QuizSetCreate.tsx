import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createQuizSet, type RoomMode, MODE_LABELS } from '../../api/quizSets'

const ICON_OPTIONS = ['📖', '📜', '✝️', '🕊️', '⛪', '🎈', '🌸', '🎄', '👑', '⚔️']
const PREDEFINED_TAGS = [
  '🌸 Phục Sinh', '🎄 Giáng Sinh', '📖 Phúc Âm', '✉️ Thư tín',
  '👶 Thiếu nhi', '🎓 Thanh niên', '⛪ Bài giảng', '🌍 Sáng tạo',
]

export default function QuizSetCreate() {
  const { id: groupId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverIcon, setCoverIcon] = useState(ICON_OPTIONS[0])
  const [tags, setTags] = useState<string[]>([])
  const [coverScripture, setCoverScripture] = useState('')
  const [authorNote, setAuthorNote] = useState('')
  const [suggestedMode, setSuggestedMode] = useState<RoomMode | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTag = (tag: string) => {
    setTags(prev => {
      if (prev.includes(tag)) return prev.filter(t => t !== tag)
      if (prev.length >= 5) return prev
      return [...prev, tag]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupId) return
    if (name.trim().length < 5) {
      setError('Tên cần ít nhất 5 ký tự')
      return
    }
    setSubmitting(true); setError(null)
    try {
      const created = await createQuizSet(groupId, {
        name: name.trim(),
        description: description.trim() || undefined,
        coverImageUrl: `emoji:${coverIcon}`,
        tags,
        coverScripture: coverScripture.trim() || undefined,
        authorNote: authorNote.trim() || undefined,
        suggestedMode: suggestedMode || undefined,
      })
      navigate(`/groups/${groupId}/quiz-sets/${created.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Lỗi tạo bộ câu hỏi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#11131e', color: 'white' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-6">Tạo bộ câu hỏi mới</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <label className="block text-sm font-semibold mb-2">Biểu tượng bìa</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setCoverIcon(icon)}
                  className={`w-12 h-12 text-2xl rounded-lg border ${
                    coverIcon === icon ? 'border-2' : 'border-white/10'
                  }`}
                  style={{ borderColor: coverIcon === icon ? '#e8a832' : undefined }}
                >{icon}</button>
              ))}
            </div>
          </section>

          <section>
            <label className="block text-sm font-semibold mb-2">Tên bộ câu hỏi <span className="text-red-400">*</span></label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              maxLength={100} required
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white"
              placeholder="VD: Tin Lành Mathiơ chương 28"
            />
            <p className="text-xs text-white/50 mt-1">{name.length}/100</p>
          </section>

          <section>
            <label className="block text-sm font-semibold mb-2">Mô tả ngắn</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              maxLength={500} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white"
              placeholder="Vài dòng giới thiệu nội dung bộ câu hỏi"
            />
          </section>

          <section>
            <label className="block text-sm font-semibold mb-2">Câu Kinh Thánh chính</label>
            <input
              type="text" value={coverScripture} onChange={e => setCoverScripture(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white"
              placeholder="VD: Mathiơ 28:18-20"
            />
          </section>

          <section>
            <label className="block text-sm font-semibold mb-2">Thẻ chủ đề (tối đa 5)</label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map(tag => {
                const selected = tags.includes(tag)
                return (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      selected ? 'border-2' : 'border-white/10'
                    }`}
                    style={selected ? { borderColor: '#e8a832', color: '#e8a832' } : undefined}
                  >{tag}</button>
                )
              })}
            </div>
            <p className="text-xs text-white/50 mt-1">{tags.length}/5</p>
          </section>

          <section>
            <label className="block text-sm font-semibold mb-2">Mode gợi ý khi chơi</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setSuggestedMode('')}
                className={`p-3 rounded-lg border text-left ${
                  suggestedMode === '' ? 'border-2' : 'border-white/10'
                }`}
                style={suggestedMode === '' ? { borderColor: '#e8a832' } : undefined}
              >
                <div className="text-sm font-semibold">— Không gợi ý —</div>
                <div className="text-xs text-white/50">Người tổ chức tự chọn</div>
              </button>
              {(Object.keys(MODE_LABELS) as RoomMode[]).map(mode => {
                const cfg = MODE_LABELS[mode]
                const selected = suggestedMode === mode
                return (
                  <button key={mode} type="button" onClick={() => setSuggestedMode(mode)}
                    className={`p-3 rounded-lg border text-left ${
                      selected ? 'border-2' : 'border-white/10'
                    }`}
                    style={selected ? { borderColor: '#e8a832' } : undefined}
                  >
                    <div className="text-sm font-semibold">{cfg.emoji} {cfg.vi}</div>
                    <div className="text-xs text-white/50">≥{cfg.min} câu{cfg.even ? ', chẵn' : ''}</div>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <label className="block text-sm font-semibold mb-2">Hướng dẫn cho người chơi</label>
            <textarea
              value={authorNote} onChange={e => setAuthorNote(e.target.value)}
              maxLength={1000} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white"
              placeholder="VD: Bộ này dành cho thành viên đã hoàn thành tuần 1"
            />
          </section>

          {error && <div className="px-4 py-3 rounded-lg bg-red-500/20 text-red-200">{error}</div>}

          <div className="flex gap-3">
            <button
              type="button" onClick={() => navigate(`/groups/${groupId}`)}
              className="px-4 py-2.5 rounded-lg border border-white/10"
            >Hủy</button>
            <button
              type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-black disabled:opacity-50"
              style={{ background: '#e8a832' }}
            >{submitting ? 'Đang lưu...' : 'Lưu nháp'}</button>
          </div>

          <p className="text-xs text-white/50 text-center">
            Sau khi lưu nháp, thêm tối thiểu 5 câu hỏi rồi xuất bản để các thành viên chơi.
          </p>
        </form>
      </div>
    </div>
  )
}
