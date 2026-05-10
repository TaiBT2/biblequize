import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
  const { t } = useTranslation()
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

  const toggleTag = (tag: string) => {
    setTags(prev => {
      if (prev.includes(tag)) return prev.filter(t => t !== tag)
      if (prev.length >= 5) return prev
      return [...prev, tag]
    })
  }

  const tagChipClass = (tag: string) =>
    PREDEFINED_TAGS.find(t => t.label === tag)?.chipCls ?? 'bg-white/10 text-white'

  const submit = async (publishImmediately: boolean) => {
    if (!groupId) return
    if (name.trim().length < 5) {
      setError(t('quizSet.create.nameMinLength'))
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
      navigate(`/groups/${groupId}/quiz-sets/${created.id}${publishImmediately ? '?publish=1' : ''}`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || t('quizSet.create.errorCreate'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit(false)
  }

  return (
    <div className="qs-bg-deep min-h-screen flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* Header — sticky */}
        <div
          className="px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between sticky top-0 backdrop-blur z-10 border-b border-white/5"
          style={{ background: 'rgba(14, 16, 25, 0.95)' }}
        >
          <div className="lg:flex lg:items-center lg:gap-4 min-w-0">
            <button type="button" onClick={() => navigate(`/groups/${groupId}/quiz-sets`)} className="hidden lg:block text-gray-400 text-sm hover:text-white">
              ← {t('quizSet.create.cancel')}
            </button>
            <div className="hidden lg:block">
              <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                <Link to={`/groups/${groupId}/quiz-sets`} className="hover:text-white">Bộ câu hỏi</Link>
                {' / '}<span className="text-[#e8a832]">{t('quizSet.create.title')}</span>
              </div>
              <h1 className="text-lg lg:text-xl font-extrabold text-white mt-0.5 qs-font-vn-display truncate max-w-md">
                {name.trim() || t('quizSet.create.title')}
              </h1>
            </div>
            {/* Mobile compact header */}
            <button type="button" onClick={() => navigate(`/groups/${groupId}/quiz-sets`)} className="lg:hidden text-gray-400 text-sm">
              {t('quizSet.create.cancel')}
            </button>
            <div className="lg:hidden text-sm font-bold text-white qs-font-vn-display">{t('quizSet.create.title')}</div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || name.trim().length < 5}
              className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg qs-glass-subtle border border-white/10 text-gray-300 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="hidden lg:inline">💾</span><span>{submitting ? t('quizSet.create.saving') : t('quizSet.create.save')}</span>
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={submitting || name.trim().length < 5}
              className="hidden lg:flex px-4 py-2 rounded-lg qs-gold-grad text-[#11131e] text-xs font-extrabold items-center gap-1.5 disabled:opacity-50"
            >
              <span>📢</span><span>XUẤT BẢN</span>
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto qs-scroll-thin">
          <div className="lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-6">
            <div className="lg:grid lg:grid-cols-3 lg:gap-6">

              {/* LEFT: 2 columns on desktop, full on mobile */}
              <div className="lg:col-span-2 space-y-3 lg:space-y-5">
                {/* DESKTOP: Cover + name combined card */}
                <div className="hidden lg:block qs-glass rounded-2xl p-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Biểu tượng</label>
                      <div
                        className="aspect-square rounded-xl flex items-center justify-center text-6xl border-2 border-dashed border-white/10 hover:border-[#e8a832]/30 cursor-pointer transition-all qs-cover-easter"
                      >
                        {coverIcon}
                      </div>
                      <div className="text-[10px] text-gray-500 text-center mt-1.5">Click để đổi · 10 lựa chọn</div>
                      <div className="grid grid-cols-5 gap-1 mt-2">
                        {ICON_OPTIONS.map(icon => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setCoverIcon(icon)}
                            className={`aspect-square rounded text-base flex items-center justify-center ${
                              coverIcon === icon
                                ? 'bg-[#e8a832]/15 border border-[#e8a832]/30'
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >{icon}</button>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2 space-y-3">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">{t('quizSet.create.labelName')} <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          maxLength={100}
                          required
                          className="w-full qs-glass-subtle rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none border border-white/10 focus:border-[#e8a832]/50"
                          placeholder={t('quizSet.create.namePlaceholder')}
                        />
                        <div className="text-[10px] text-gray-500 mt-1">{t('quizSet.create.charCount', { current: name.length, max: 100 })}</div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">{t('quizSet.create.labelScripture')}</label>
                        <div className="qs-glass-subtle rounded-lg px-3 py-2.5 flex items-center gap-2 border border-white/10">
                          <span>📍</span>
                          <input
                            type="text"
                            value={coverScripture}
                            onChange={e => setCoverScripture(e.target.value)}
                            maxLength={100}
                            className="bg-transparent outline-none text-sm text-white placeholder-gray-500 flex-1"
                            placeholder={t('quizSet.create.scripturePlaceholder')}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">{t('quizSet.create.labelDescription')}</label>
                        <textarea
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          maxLength={500}
                          rows={3}
                          className="w-full qs-glass-subtle rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none border border-white/10 focus:border-[#e8a832]/50 resize-none"
                          placeholder={t('quizSet.create.descriptionPlaceholder')}
                        />
                        <div className="text-[10px] text-gray-500 mt-1">{t('quizSet.create.charCount', { current: description.length, max: 500 })}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MOBILE: stacked sections */}
                <div className="lg:hidden">
                  <Section label={t('quizSet.create.labelCover')}>
                    <div className="grid grid-cols-5 gap-2">
                      {ICON_OPTIONS.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setCoverIcon(icon)}
                          className={`aspect-square rounded-lg text-2xl flex items-center justify-center ${
                            coverIcon === icon ? 'qs-gold-grad' : 'qs-glass'
                          }`}
                        >{icon}</button>
                      ))}
                    </div>
                  </Section>

                  <Section label={t('quizSet.create.labelName')} required hint={t('quizSet.create.charCount', { current: name.length, max: 100 })}>
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)} maxLength={100} required
                      className="w-full qs-glass rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
                      placeholder={t('quizSet.create.namePlaceholder')}
                    />
                  </Section>

                  <Section label={t('quizSet.create.labelDescription')} hint={t('quizSet.create.charCount', { current: description.length, max: 500 })}>
                    <textarea
                      value={description} onChange={e => setDescription(e.target.value)} maxLength={500} rows={3}
                      className="w-full qs-glass rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none resize-none"
                      placeholder={t('quizSet.create.descriptionPlaceholder')}
                    />
                  </Section>

                  <Section label={t('quizSet.create.labelScripture')}>
                    <div className="qs-glass rounded-xl px-3 py-2.5 flex items-center gap-2">
                      <span>📍</span>
                      <input
                        type="text" value={coverScripture} onChange={e => setCoverScripture(e.target.value)} maxLength={100}
                        className="bg-transparent outline-none text-sm text-white placeholder-gray-500 flex-1"
                        placeholder={t('quizSet.create.scripturePlaceholder')}
                      />
                    </div>
                  </Section>
                </div>

                {/* Tags — same UX both viewports, slightly different styling */}
                <div className="px-4 lg:px-0 pt-4 lg:pt-0">
                  <div className="lg:qs-glass lg:rounded-2xl lg:p-5">
                    <label className="text-xs lg:text-sm font-semibold text-white block mb-2 lg:mb-3">
                      {t('quizSet.create.labelTags', { count: tags.length })}
                    </label>
                    <div className="flex flex-wrap gap-1.5 lg:gap-2 mb-2 lg:mb-3">
                      {tags.map(tag => (
                        <span key={tag} className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-full text-[10px] lg:text-xs font-semibold flex items-center gap-1 lg:gap-2 ${tagChipClass(tag)}`}>
                          {tag}
                          <button type="button" onClick={() => toggleTag(tag)} className="opacity-70 hover:opacity-100">×</button>
                        </span>
                      ))}
                      {PREDEFINED_TAGS
                        .filter(t => !tags.includes(t.label))
                        .map(t => (
                          <button
                            key={t.label} type="button"
                            onClick={() => toggleTag(t.label)} disabled={tags.length >= 5}
                            className="px-2 lg:px-3 py-1 lg:py-1.5 rounded-full qs-glass-subtle text-gray-400 text-[10px] lg:text-xs font-semibold border border-dashed border-white/20 hover:border-[#e8a832]/30 hover:text-[#e8a832] disabled:opacity-30"
                          >+ {t.label}</button>
                        ))
                      }
                    </div>
                    <div className="hidden lg:block text-[10px] text-gray-500">Gợi ý: 🌸 Phục Sinh · 🎄 Giáng Sinh · 👶 Thiếu nhi · 🎓 Thanh niên · 🌍 Sáng tạo · ✉️ Thư tín</div>
                  </div>
                </div>

                {/* Mode picker */}
                <div className="px-4 lg:px-0">
                  <div className="lg:qs-glass lg:rounded-2xl lg:p-5">
                    <label className="text-xs lg:text-sm font-semibold text-white block mb-1">{t('quizSet.create.labelMode')}</label>
                    <div className="text-[10px] text-gray-500 mb-2 lg:mb-3 hidden lg:block">{t('quizSet.create.modeHint')}</div>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-1.5 lg:gap-2">
                      {(Object.keys(MODE_LABELS) as RoomMode[]).map(mode => {
                        const cfg = MODE_LABELS[mode]
                        const selected = suggestedMode === mode
                        return (
                          <button
                            key={mode} type="button"
                            onClick={() => setSuggestedMode(selected ? '' : mode)}
                            className={`qs-mode-card rounded-xl p-2.5 lg:p-3 text-left ${
                              selected
                                ? `border-2 border-emerald-400/40 ${cfg.cssClass}`
                                : 'qs-glass-subtle border border-white/10'
                            }`}
                          >
                            <div className="text-base lg:text-2xl mb-0 lg:mb-1">{cfg.emoji}</div>
                            <div className="text-[10px] lg:text-xs font-bold text-white">{cfg.vi}</div>
                            <div className={`text-[9px] lg:text-[10px] ${selected ? 'text-emerald-400' : 'text-gray-500'}`}>{cfg.tagline.split(' · ')[0]}</div>
                          </button>
                        )
                      })}
                    </div>
                    <div className="lg:hidden text-[10px] text-gray-500 mt-2">{t('quizSet.create.modeHint')}</div>
                  </div>
                </div>

                {/* Author note */}
                <div className="px-4 lg:px-0">
                  <div className="lg:qs-glass lg:rounded-2xl lg:p-5">
                    <label className="text-xs lg:text-sm font-semibold text-white block mb-2">
                      {t('quizSet.create.labelAuthorNote')} <span className="text-gray-500 text-[10px] lg:text-xs font-normal">{t('quizSet.create.labelOptional')}</span>
                    </label>
                    <textarea
                      value={authorNote} onChange={e => setAuthorNote(e.target.value)} maxLength={1000} rows={3}
                      className="w-full qs-glass-subtle lg:qs-glass-subtle rounded-lg lg:rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none border border-white/10 focus:border-[#e8a832]/50 resize-none"
                      placeholder={t('quizSet.create.authorNotePlaceholder')}
                    />
                    <div className="hidden lg:block text-[10px] text-gray-500 mt-1.5">Hiển thị trên detail page và lobby room. Markdown hỗ trợ.</div>
                  </div>
                </div>

                {/* Questions placeholder */}
                <div className="px-4 lg:px-0 pb-4 lg:pb-0">
                  <div className="lg:qs-glass lg:rounded-2xl lg:p-5">
                    <div className="flex items-center justify-between mb-2 lg:mb-3">
                      <label className="text-xs lg:text-sm font-semibold text-white">
                        {t('quizSet.create.questionsCount')}
                      </label>
                      <div className="text-[10px] text-red-400 font-semibold">⚠️ Cần ≥5 câu để xuất bản</div>
                    </div>
                    <div className="hidden lg:grid grid-cols-3 gap-2 mb-3">
                      <button type="button" disabled className="py-3 rounded-xl qs-glass-subtle border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1.5 opacity-60">
                        <span>📚</span><span>Từ ngân hàng</span>
                      </button>
                      <button type="button" disabled className="py-3 rounded-xl qs-glass-subtle border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1.5 opacity-60">
                        <span>🤖</span><span>AI generate</span>
                      </button>
                      <button type="button" disabled className="py-3 rounded-xl qs-glass-subtle border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1.5 opacity-60">
                        <span>📋</span><span>Clone từ set khác</span>
                      </button>
                    </div>
                    <button type="button" disabled className="w-full py-2.5 lg:py-3 rounded-xl border-2 border-dashed border-[#e8a832]/30 bg-[#e8a832]/5 text-[#e8a832] font-bold text-xs lg:text-sm flex items-center justify-center gap-2 opacity-60">
                      <span className="text-base leading-none">+</span><span>THÊM CÂU HỎI (Sau khi lưu)</span>
                    </button>
                    <div className="text-[10px] text-gray-500 mt-2 text-center">{t('quizSet.create.footerNote')}</div>
                  </div>
                </div>
              </div>

              {/* RIGHT 1-col: metadata sidebar (desktop only) */}
              <div className="hidden lg:block space-y-5">
                {/* Status */}
                <div className="qs-glass rounded-2xl p-5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Trạng thái</label>
                  <div className="qs-badge-status qs-badge-draft">Bản nháp</div>
                  <div className="text-[10px] text-gray-500 mt-2 leading-relaxed">Sau khi đủ 5 câu hỏi, bạn có thể xuất bản để các thành viên thấy được.</div>
                </div>

                {/* Folder */}
                <div className="qs-glass rounded-2xl p-5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">{t('quizSet.create.labelFolder')}</label>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setFolderId(null)}
                      className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-sm border ${
                        folderId === null ? 'border-[#e8a832]/40 text-[#e8a832] qs-glass-subtle' : 'border-white/10 text-gray-300 qs-glass-subtle'
                      }`}
                    >
                      <span>{t('quizSet.create.folderUncategorized')}</span>
                      {folderId === null && <span className="text-[10px]">✓</span>}
                    </button>
                    {folders.map(f => (
                      <button
                        key={f.id} type="button"
                        onClick={() => setFolderId(f.id)}
                        className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-sm border ${
                          folderId === f.id ? 'border-[#e8a832]/40 text-[#e8a832] qs-glass-subtle' : 'border-white/10 text-gray-300 qs-glass-subtle'
                        }`}
                      >
                        <span>📁 {f.name}</span>
                        {folderId === f.id && <span className="text-[10px]">✓</span>}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={async () => {
                        const newName = window.prompt(t('quizSet.create.folderPrompt'))
                        if (!newName?.trim() || !groupId) return
                        try {
                          const created = await createFolder(groupId, newName.trim())
                          setFolders(prev => [...prev, created])
                          setFolderId(created.id)
                        } catch (err: any) { setError(err?.response?.data?.message || err.message) }
                      }}
                      className="w-full px-3 py-2 rounded-lg qs-glass-subtle border border-dashed border-white/20 text-xs text-gray-400 hover:text-[#e8a832] hover:border-[#e8a832]/40"
                    >{t('quizSet.create.createFolder')}</button>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-2">Tổ chức quiz sets thành nhóm</div>
                </div>

                {/* Auto-derived metadata */}
                <div className="qs-glass-subtle rounded-2xl p-5 border border-white/5">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span>🤖</span><span>Tự động tính</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Độ khó</span>
                      <span className="text-gray-500 italic">Cần ≥5 câu</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Thời gian ước tính</span>
                      <span className="text-gray-500 italic">~0 phút</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Ngôn ngữ</span>
                      <span className="text-white font-semibold">🇻🇳 Tiếng Việt</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-3 pt-3 border-t border-white/5 leading-relaxed">
                    Các giá trị này tự động tính sau khi bạn thêm câu hỏi. Có thể override khi xuất bản.
                  </div>
                </div>

                {/* Help */}
                <div className="rounded-2xl p-4 border border-[#e8a832]/20" style={{ background: 'rgba(232, 168, 50, 0.04)' }}>
                  <div className="text-[10px] font-bold text-[#e8a832] uppercase tracking-wider mb-2">💡 Mẹo</div>
                  <ul className="text-xs text-gray-300 space-y-1.5 leading-relaxed list-disc list-inside marker:text-[#e8a832]/60">
                    <li>Đặt tên rõ ràng: "Bài giảng tuần X" thay vì "Quiz mới"</li>
                    <li>Dùng tag để group dễ tìm sau này</li>
                    <li>Mode đề xuất giúp người chơi biết cách chơi best</li>
                    <li>Có thể clone bộ này sau để tạo bộ tương tự</li>
                  </ul>
                </div>
              </div>

              {/* MOBILE: folder selector inline */}
              <div className="lg:hidden">
                <Section label={t('quizSet.create.labelFolder')}>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setFolderId(null)}
                      className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-sm ${
                        folderId === null ? 'qs-glass border border-[#e8a832]/40 text-[#e8a832]' : 'qs-glass text-gray-300'
                      }`}
                    >
                      <span>{t('quizSet.create.folderUncategorized')}</span>
                      {folderId === null && <span className="text-[10px]">✓</span>}
                    </button>
                    {folders.map(f => (
                      <button
                        key={f.id} type="button"
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
                        const newName = window.prompt(t('quizSet.create.folderPrompt'))
                        if (!newName?.trim() || !groupId) return
                        try {
                          const created = await createFolder(groupId, newName.trim())
                          setFolders(prev => [...prev, created])
                          setFolderId(created.id)
                        } catch (err: any) { setError(err?.response?.data?.message || err.message) }
                      }}
                      className="w-full px-3 py-2 rounded-xl qs-glass border border-dashed border-white/20 text-xs text-gray-400 hover:text-[#e8a832] hover:border-[#e8a832]/40"
                    >{t('quizSet.create.createFolder')}</button>
                  </div>
                </Section>
              </div>
            </div>

            {error && (
              <div className="mx-4 lg:mx-0 mt-3 lg:mt-5 px-3 py-2.5 rounded-xl bg-red-500/15 text-red-200 text-xs">{error}</div>
            )}
          </div>
        </div>
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
