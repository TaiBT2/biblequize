import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createQuizSet, listFolders, createFolder,
  MODE_LABELS, type QuizSetFolder, type RoomMode,
} from '../../api/quizSets'

const ICON_OPTIONS = ['📖', '📜', '✝️', '🕊️', '⛪', '🎈', '🌸', '🎄', '👑', '⚔️']
const PREDEFINED_TAGS: { label: string; chipCls: string }[] = [
  { label: '🌸 Phục Sinh',  chipCls: 'bg-[#e8a832]/15 text-[#e8a832]' },
  { label: '🎄 Giáng Sinh', chipCls: 'bg-red-500/15 text-red-300' },
  { label: '📖 Phúc Âm',    chipCls: 'bg-sky-500/15 text-sky-400' },
  { label: '✉️ Thư tín',    chipCls: 'bg-purple-500/15 text-purple-400' },
  { label: '👶 Thiếu nhi',  chipCls: 'bg-emerald-500/15 text-emerald-400' },
  { label: '🎓 Thanh niên', chipCls: 'bg-cyan-500/15 text-cyan-400' },
  { label: '⛪ Bài giảng',  chipCls: 'bg-purple-500/15 text-purple-400' },
  { label: '🌍 Sáng tạo',   chipCls: 'bg-lime-500/15 text-lime-400' },
]

export default function QuizSetCreate() {
  const { id: groupId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [coverIcon, setCoverIcon] = useState(ICON_OPTIONS[0])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverScripture, setCoverScripture] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [suggestedMode, setSuggestedMode] = useState<RoomMode | ''>('')
  const [authorNote, setAuthorNote] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<QuizSetFolder[]>([])

  useEffect(() => {
    if (!groupId) return
    listFolders(groupId).then(setFolders).catch(() => {})
  }, [groupId])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const toggleTag = (tag: string) => {
    setTags(prev => {
      if (prev.includes(tag)) return prev.filter(t => t !== tag)
      if (prev.length >= 5) return prev
      return [...prev, tag]
    })
  }

  const tagChipClass = (tag: string) =>
    PREDEFINED_TAGS.find(t => t.label === tag)?.chipCls ?? 'bg-white/10 text-white'

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
        folderId: folderId,
      })
      navigate(`/groups/${groupId}/quiz-sets/${created.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Lỗi tạo bộ câu hỏi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="qs-bg min-h-screen">
      <form onSubmit={handleSubmit} className="max-w-md mx-auto pb-10">
        {/* Sticky header */}
        <div
          className="px-5 py-3 flex items-center justify-between sticky top-0 backdrop-blur z-10 border-b border-white/5"
          style={{ background: 'rgba(17,19,30,0.95)' }}
        >
          <button type="button" onClick={() => navigate(`/groups/${groupId}/quiz-sets`)} className="text-gray-400 text-sm">
            Hủy
          </button>
          <div className="text-sm font-bold text-white qs-font-vn-display">Tạo bộ câu hỏi</div>
          <button
            type="submit"
            disabled={submitting || name.trim().length < 5}
            className="text-[#e8a832] text-sm font-bold disabled:opacity-50"
          >{submitting ? 'Đang lưu...' : 'Lưu'}</button>
        </div>

        {/* Cover */}
        <Section label="Ảnh bìa">
          <button
            type="button"
            onClick={() => setShowIconPicker(v => !v)}
            className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 text-gray-500 hover:border-[#e8a832]/30 hover:text-[#e8a832]"
          >
            <div className="text-4xl">{coverIcon}</div>
            <div className="text-xs">{showIconPicker ? 'Đang chọn icon...' : 'Bấm để đổi icon'}</div>
            <div className="text-[10px] text-gray-600">Sprint 5: chỉ icon, upload ảnh defer Sprint 6</div>
          </button>
          {showIconPicker && (
            <div className="mt-2 grid grid-cols-5 gap-2">
              {ICON_OPTIONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => { setCoverIcon(icon); setShowIconPicker(false) }}
                  className={`aspect-square rounded-lg text-2xl flex items-center justify-center ${
                    coverIcon === icon ? 'qs-gold-grad' : 'qs-glass'
                  }`}
                >{icon}</button>
              ))}
            </div>
          )}
        </Section>

        {/* Name */}
        <Section label="Tên bộ câu hỏi" required hint={`${name.length}/100 ký tự`}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            required
            className="w-full qs-glass rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
            placeholder="VD: Bài giảng tuần 18 — Phục Sinh"
          />
        </Section>

        {/* Description */}
        <Section label="Mô tả ngắn" hint={`${description.length}/500 ký tự`}>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full qs-glass rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none resize-none"
            placeholder="Mô tả bộ câu hỏi này về điều gì..."
          />
        </Section>

        {/* Scripture */}
        <Section label="Câu Kinh Thánh chính">
          <div className="qs-glass rounded-xl px-3 py-2.5 flex items-center gap-2">
            <span>📍</span>
            <input
              type="text"
              value={coverScripture}
              onChange={e => setCoverScripture(e.target.value)}
              maxLength={100}
              className="bg-transparent outline-none text-sm text-white placeholder-gray-500 flex-1"
              placeholder="VD: Mathiơ 28"
            />
          </div>
        </Section>

        {/* Tags */}
        <Section label={`Thẻ chủ đề (tối đa 5) · ${tags.length}/5`}>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span key={tag} className={`px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 ${tagChipClass(tag)}`}>
                {tag}
                <button type="button" onClick={() => toggleTag(tag)} className="opacity-70 hover:opacity-100">×</button>
              </span>
            ))}
            {PREDEFINED_TAGS
              .filter(t => !tags.includes(t.label))
              .map(t => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => toggleTag(t.label)}
                  disabled={tags.length >= 5}
                  className="px-2 py-1 rounded-full qs-glass text-gray-400 text-[10px] font-semibold border border-dashed border-white/20 disabled:opacity-30"
                >+ {t.label}</button>
              ))
            }
          </div>
        </Section>

        {/* Suggested mode */}
        <Section label="Chế độ chơi đề xuất">
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(MODE_LABELS) as RoomMode[]).map(mode => {
              const cfg = MODE_LABELS[mode]
              const selected = suggestedMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSuggestedMode(selected ? '' : mode)}
                  className={`rounded-xl p-2.5 flex items-center gap-2 ${
                    selected ? `border-2 border-emerald-400/40 ${cfg.cssClass}` : 'qs-glass border border-white/10'
                  }`}
                >
                  <span className="text-base">{cfg.emoji}</span>
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-white">{cfg.vi}</div>
                    <div className={`text-[9px] ${selected ? 'text-emerald-400' : 'text-gray-500'}`}>{cfg.tagline.split(' · ')[0]}</div>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="text-[10px] text-gray-500 mt-2">Người chơi vẫn có thể chọn mode khác khi tạo phòng</div>
        </Section>

        {/* Folder */}
        <Section label="Thư mục">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setFolderId(null)}
              className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-sm ${
                folderId === null ? 'qs-glass border border-[#e8a832]/40 text-[#e8a832]' : 'qs-glass text-gray-300'
              }`}
            >
              <span>📂 Không phân loại</span>
              {folderId === null && <span className="text-[10px]">✓</span>}
            </button>
            {folders.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFolderId(f.id)}
                className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-sm ${
                  folderId === f.id ? 'qs-glass border border-[#e8a832]/40 text-[#e8a832]' : 'qs-glass text-gray-300'
                }`}
              >
                <span>📁 {f.name}</span>
                {folderId === f.id && <span className="text-[10px]">✓</span>}
              </button>
            ))}
            <button
              type="button"
              onClick={async () => {
                const newName = window.prompt('Tên thư mục mới?')
                if (!newName?.trim() || !groupId) return
                try {
                  const created = await createFolder(groupId, newName.trim())
                  setFolders(prev => [...prev, created])
                  setFolderId(created.id)
                } catch (err: any) { setError(err?.response?.data?.message || err.message) }
              }}
              className="w-full px-3 py-2 rounded-xl qs-glass border border-dashed border-white/20 text-xs text-gray-400 hover:text-[#e8a832] hover:border-[#e8a832]/40"
            >+ Tạo thư mục mới</button>
          </div>
        </Section>

        {/* Author note */}
        <Section label={<>Ghi chú cho người chơi <span className="text-gray-600">(tùy chọn)</span></>}>
          <textarea
            value={authorNote}
            onChange={e => setAuthorNote(e.target.value)}
            maxLength={1000}
            rows={2}
            className="w-full qs-glass rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none resize-none"
            placeholder="VD: Đọc trước Mathiơ 28 sẽ giúp tham gia hiệu quả hơn..."
          />
        </Section>

        {/* Footer info */}
        <div className="px-4 pt-4 pb-6">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Câu hỏi (0/50)</div>
          <div className="rounded-xl p-3 qs-glass border border-[#e8a832]/20 text-center">
            <div className="text-[10px] text-gray-300">
              Sau khi lưu bản nháp, bạn có thể thêm câu hỏi và xuất bản (cần ≥5 câu).
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 mb-4 px-3 py-2.5 rounded-xl bg-red-500/15 text-red-200 text-xs">{error}</div>
        )}
      </form>
    </div>
  )
}

function Section({ label, required, hint, children }: {
  label: React.ReactNode; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="px-4 pt-4">
      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <div className="text-[10px] text-gray-500 mt-1">{hint}</div>}
    </div>
  )
}
