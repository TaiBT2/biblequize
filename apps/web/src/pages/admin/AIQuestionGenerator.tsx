import React, { useState, useEffect } from 'react'
import { api, aiApi } from '../../api/client'
import { getChapterCount, getVerseCount } from '../../data/bibleData'

type Difficulty = 'easy' | 'medium' | 'hard'
type QuestionType = 'multiple_choice_single' | 'multiple_choice_multi' | 'true_false' | 'fill_in_blank'

const VALID_TYPES: QuestionType[] = ['multiple_choice_single', 'multiple_choice_multi', 'true_false', 'fill_in_blank']
const normalizeType = (t: string): QuestionType =>
  VALID_TYPES.includes(t as QuestionType) ? (t as QuestionType) : 'multiple_choice_single'

type DraftStatus = 'pending' | 'approved' | 'rejected'

interface DraftQuestion {
  id: string
  status: DraftStatus
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  difficulty: Difficulty
  type: QuestionType
  language: string
  content: string
  options: string[]
  correctAnswer: number | number[]
  explanation: string
  tags: string[]
  source: string
  approvedId?: string
  saveError?: string
  generatedBy?: string
}

const BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles',
  'Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes',
  'Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel',
  'Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk',
  'Zephaniah','Haggai','Zechariah','Malachi',
  'Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians',
  'Galatians','Ephesians','Philippians','Colossians','1 Thessalonians',
  '2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews',
  'James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation',
]

const DEFAULT_PROMPT =
`Tạo {count} câu hỏi trắc nghiệm ({type}) về đoạn Kinh Thánh sau:
Sách: {book}, Chương {chapter}, Câu {verseStart}-{verseEnd}
Nội dung: {scriptureText}
Độ khó: {difficulty} | Ngôn ngữ: {language}

Yêu cầu:
- Mỗi câu có 4 lựa chọn (A–D), chỉ 1 đáp án đúng
- Có giải thích chi tiết dựa trên Kinh Thánh
- Đúng với nội dung Kinh Thánh, không thêm thần học bên ngoài`

const CLAUDE_MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', note: 'Nhanh · Rẻ' },
  { id: 'claude-sonnet-4-5-20250929', label: 'Sonnet 4.5', note: 'Cân bằng' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', note: 'Mới nhất' },
  { id: 'claude-opus-4-5-20251101', label: 'Opus 4.5', note: 'Chất lượng cao' },
]

const DRAFTS_STORAGE_KEY = 'ai_question_drafts'

function loadDraftsFromStorage(): DraftQuestion[] {
  try {
    const raw = sessionStorage.getItem(DRAFTS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveDraftsToStorage(drafts: DraftQuestion[]) {
  try {
    sessionStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
  } catch {
    // sessionStorage full — ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AIQuestionGenerator() {
  // Form
  const [book, setBook]               = useState('')
  const [chapter, setChapter]         = useState(1)
  const [chapterEnd, setChapterEnd]   = useState(1)
  const [verseStart, setVerseStart]   = useState(1)
  const [verseEnd, setVerseEnd]       = useState(1)
  const [scriptureText, setText]      = useState('')
  const [difficulty, setDifficulty]   = useState<Difficulty>('easy')
  const [qType, setQType]             = useState<QuestionType>('multiple_choice_single')
  const [language, setLanguage]       = useState('vi')
  const [count, setCount]             = useState(3)
  const [provider, setProvider]       = useState<'gemini' | 'claude'>('gemini')
  const [claudeModels, setClaudeModels] = useState<string[]>(['auto'])
  const [claudeAutoMode, setClaudeAutoMode] = useState(true)
  const [prompt, setPrompt]           = useState(DEFAULT_PROMPT)
  const [showPrompt, setShowPrompt]   = useState(false)

  // AI info
  const [aiInfo, setAiInfo] = useState<{
    providers: {
      gemini: { configured: boolean; model: string }
      claude: { configured: boolean; model: string }
    }
  } | null>(null)
  useEffect(() => {
    api.get('/api/admin/ai/info').then(r => setAiInfo(r.data)).catch(() => {})
  }, [])

  // State
  const [isGenerating, setIsGenerating]   = useState(false)
  const [isSavingAll, setIsSavingAll]     = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [drafts, setDrafts]               = useState<DraftQuestion[]>(loadDraftsFromStorage)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [editData, setEditData]           = useState<Partial<DraftQuestion>>({})
  const [savingId, setSavingId]           = useState<string | null>(null)

  // Persist drafts to sessionStorage whenever they change
  useEffect(() => {
    saveDraftsToStorage(drafts)
  }, [drafts])

  const totalChapters = book ? getChapterCount(book) : 0
  const maxVerseStart = book && chapter    ? getVerseCount(book, chapter)    : 30
  const maxVerseEnd   = book && chapterEnd ? getVerseCount(book, chapterEnd) : 30
  const isRange       = chapterEnd > chapter

  const onBookChange = (b: string) => {
    setBook(b); setChapter(1); setChapterEnd(1); setVerseStart(1); setVerseEnd(1)
  }
  const onChapterChange = (c: number) => {
    setChapter(c)
    if (chapterEnd < c) setChapterEnd(c)
    setVerseStart(1)
    setVerseEnd(getVerseCount(book, c))
  }
  const onChapterEndChange = (c: number) => {
    setChapterEnd(c)
    setVerseEnd(getVerseCount(book, c))
  }

  const scriptureRef = isRange
    ? `${book} ${chapter}-${chapterEnd}`
    : `${book} ${chapter}:${verseStart}-${verseEnd}`

  // Only send custom prompt when the user has actually edited it
  const customPromptToSend = prompt !== DEFAULT_PROMPT ? prompt
    .replace('{count}', String(count))
    .replace('{type}', qType)
    .replace('{book}', book)
    .replace('{chapter}', String(chapter))
    .replace('{verseStart}', String(verseStart))
    .replace('{verseEnd}', String(verseEnd))
    .replace('{scriptureText}', scriptureText || '(không có)')
    .replace('{difficulty}', difficulty)
    .replace('{language}', language)
    : undefined

  const handleGenerate = async () => {
    if (!book) { setError('Vui lòng chọn sách trước khi tạo câu hỏi'); return }
    if (!chapter) { setError('Vui lòng chọn chương'); return }
    setError(null)
    setIsGenerating(true)
    try {
      const res = await aiApi.post('/api/admin/ai/generate', {
        scripture: {
          book,
          chapter,
          chapterEnd: isRange ? chapterEnd : undefined,
          verseStart: isRange ? 1 : verseStart,
          verseEnd:   isRange ? maxVerseEnd : verseEnd,
          text: scriptureText || undefined,
        },
        prompt: customPromptToSend,
        difficulty,
        type: qType,
        language,
        count,
        provider,
        claudeModels: provider === 'claude' ? (claudeAutoMode ? ['auto'] : claudeModels) : undefined,
      })
      const raw: any[] = res.data.questions ?? []
      const newDrafts: DraftQuestion[] = raw.map((q, i) => ({
        id:            `draft-${Date.now()}-${i}`,
        status:        'pending',
        book,
        chapter,
        verseStart,
        verseEnd,
        difficulty:    (q.difficulty ?? difficulty) as Difficulty,
        type:          normalizeType(q.type ?? qType),
        language:      q.language ?? language,
        content:       q.content ?? q.question ?? '',
        options:       Array.isArray(q.options) ? q.options : [],
        correctAnswer: Array.isArray(q.correctAnswer)
          ? q.correctAnswer
          : typeof q.correctAnswer === 'number'
            ? q.correctAnswer
            : Array.isArray(q.options) ? q.options.indexOf(q.answer) : 0,
        explanation:   q.explanation ?? '',
        tags:          Array.isArray(q.tags) ? q.tags : [],
        source:        q.source ?? 'Kinh Thánh',
        generatedBy:   q._generatedBy,
      }))
      setDrafts(prev => [...newDrafts, ...prev])
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Lỗi kết nối server')
    } finally {
      setIsGenerating(false)
    }
  }

  const startEdit = (d: DraftQuestion) => { setEditingId(d.id); setEditData({ ...d }) }
  const cancelEdit = () => { setEditingId(null); setEditData({}) }

  const saveEdit = () => {
    setDrafts(prev => prev.map(d => d.id === editingId ? { ...d, ...editData } as DraftQuestion : d))
    cancelEdit()
  }

  const buildSavePayload = (d: DraftQuestion) => {
    const correctAnswerList = Array.isArray(d.correctAnswer)
      ? d.correctAnswer
      : [d.correctAnswer as number]
    return {
      book: d.book, chapter: d.chapter,
      verseStart: d.verseStart, verseEnd: d.verseEnd,
      difficulty: d.difficulty, type: normalizeType(d.type), language: d.language,
      content: d.content, options: d.options ?? [],
      correctAnswer: correctAnswerList,
      explanation: d.explanation,
      tags: JSON.stringify(Array.isArray(d.tags) ? d.tags : (d.tags ? [d.tags] : [])),
      source: d.source,
      isActive: true,
    }
  }

  const approveDraft = async (draft: DraftQuestion) => {
    const d = editingId === draft.id ? { ...draft, ...editData } as DraftQuestion : draft
    setSavingId(d.id)
    // Clear any previous save error on this draft
    setDrafts(prev => prev.map(x => x.id === d.id ? { ...x, saveError: undefined } : x))
    try {
      const res = await api.post('/api/admin/questions?pending=true', buildSavePayload(d))
      setDrafts(prev => prev.map(x => x.id === d.id
        ? { ...x, ...d, status: 'approved', approvedId: res.data?.id, saveError: undefined } : x))
      if (editingId === d.id) cancelEdit()
    } catch (e: any) {
      const msg = e.response?.data?.message ?? 'Lỗi khi lưu câu hỏi'
      setDrafts(prev => prev.map(x => x.id === d.id ? { ...x, saveError: msg } : x))
    } finally {
      setSavingId(null)
    }
  }

  const saveAllPending = async () => {
    const pending = drafts.filter(d => d.status === 'pending')
    if (pending.length === 0) return
    setIsSavingAll(true)
    for (const draft of pending) {
      setSavingId(draft.id)
      setDrafts(prev => prev.map(x => x.id === draft.id ? { ...x, saveError: undefined } : x))
      try {
        const res = await api.post('/api/admin/questions?pending=true', buildSavePayload(draft))
        setDrafts(prev => prev.map(x => x.id === draft.id
          ? { ...x, status: 'approved', approvedId: res.data?.id, saveError: undefined } : x))
      } catch (e: any) {
        const msg = e.response?.data?.message ?? 'Lỗi khi lưu câu hỏi'
        setDrafts(prev => prev.map(x => x.id === draft.id ? { ...x, saveError: msg } : x))
      }
    }
    setSavingId(null)
    setIsSavingAll(false)
  }

  const rejectDraft  = (id: string) => setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected' } : d))
  const restoreDraft = (id: string) => setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'pending'  } : d))
  const removeDraft  = (id: string) => setDrafts(prev => prev.filter(d => d.id !== id))

  const pendingCount  = drafts.filter(d => d.status === 'pending').length
  const approvedCount = drafts.filter(d => d.status === 'approved').length

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black parchment-headline" style={{ color: '#f5f0e0' }}>
            AI Question Generator
          </h2>
          <p className="text-[#8b949e] text-sm mt-0.5 flex items-center gap-2">
            Tạo câu hỏi Kinh Thánh tự động và duyệt trước khi lưu
            {aiInfo && (['gemini', 'claude'] as const).map(p => {
              const info = aiInfo.providers[p]
              return (
                <span key={p} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                  info.configured
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border-red-500/30'
                }`}>
                  {info.configured ? '✓' : '✗'} {p === 'gemini' ? 'Gemini' : 'Claude'} {info.configured ? info.model : 'chưa cấu hình'}
                </span>
              )
            })}
          </p>
        </div>
        {drafts.length > 0 && (
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/30">
              {pendingCount} chờ duyệt
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              {approvedCount} đã lưu
            </span>
            {pendingCount > 1 && (
              <button
                onClick={saveAllPending}
                disabled={isSavingAll}
                className="px-3 py-1 rounded-full bg-[#4bbf9f]/20 text-[#4bbf9f] font-bold border border-[#4bbf9f]/30 hover:bg-[#4bbf9f]/30 transition-colors disabled:opacity-50">
                {isSavingAll ? 'Đang lưu...' : `Lưu tất cả (${pendingCount})`}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        {/* ══════════════════ FORM PANEL ══════════════════ */}
        <div className="page-card p-6 space-y-5">

          {/* Scripture ref */}
          <div>
            <h3 className="text-sm font-black text-[#4a3f35] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="text-base">📖</span> Tham chiếu Kinh Thánh
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">Sách</label>
                <select value={book} onChange={e => onBookChange(e.target.value)} className="form-select">
                  <option value="">-- Chọn sách --</option>
                  <optgroup label="Cựu Ước">
                    {BOOKS.slice(0, 39).map(b => <option key={b} value={b}>{b}</option>)}
                  </optgroup>
                  <optgroup label="Tân Ước">
                    {BOOKS.slice(39).map(b => <option key={b} value={b}>{b}</option>)}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">
                  Chương {totalChapters > 0 && <span className="text-[#b0a090] normal-case font-normal">({totalChapters} chương)</span>}
                </label>
                <div className="flex items-center gap-1.5">
                  <select value={chapter} onChange={e => onChapterChange(Number(e.target.value))}
                    disabled={!book} className="form-select flex-1">
                    {Array.from({length: totalChapters}, (_, i) => i + 1).map(c =>
                      <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="text-[#7a6a5a] text-xs font-bold">đến</span>
                  <select value={chapterEnd} onChange={e => onChapterEndChange(Number(e.target.value))}
                    disabled={!book} className="form-select flex-1">
                    {Array.from({length: totalChapters}, (_, i) => i + 1)
                      .filter(c => c >= chapter)
                      .map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {!isRange && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">
                  Câu bắt đầu <span className="text-[#b0a090] normal-case font-normal">(/ {maxVerseStart})</span>
                </label>
                <select value={verseStart} onChange={e => { const v = Number(e.target.value); setVerseStart(v); if (verseEnd < v) setVerseEnd(v) }}
                  disabled={!book} className="form-select">
                  {Array.from({length: maxVerseStart}, (_, i) => i + 1).map(v =>
                    <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">
                  Câu kết thúc <span className="text-[#b0a090] normal-case font-normal">(/ {maxVerseEnd})</span>
                </label>
                <select value={verseEnd} onChange={e => setVerseEnd(Number(e.target.value))}
                  disabled={!book} className="form-select">
                  {Array.from({length: maxVerseEnd}, (_, i) => i + 1)
                    .filter(v => v >= verseStart)
                    .map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            )}
            <div>
              <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">
                Nội dung đoạn <span className="text-[#b0a090] normal-case font-normal">(tuỳ chọn — giúp AI chính xác hơn)</span>
              </label>
              <textarea rows={3} value={scriptureText} onChange={e => setText(e.target.value)}
                placeholder="Dán nội dung đoạn Kinh Thánh vào đây..."
                className="form-input resize-none text-sm" />
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#d6cfc4]" />
            <span className="text-xs text-[#b0a090] font-bold tracking-wider">CÀI ĐẶT</span>
            <div className="flex-1 h-px bg-[#d6cfc4]" />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">Độ khó</label>
            <div className="segmented-control">
              {(['easy','medium','hard'] as Difficulty[]).map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`segmented-control-item flex-1 cursor-pointer${difficulty === d ? ' active' : ''}`}>
                  {d === 'easy' ? 'Dễ' : d === 'medium' ? 'Trung bình' : 'Khó'}
                </button>
              ))}
            </div>
          </div>

          {/* Type + Language */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">Loại câu hỏi</label>
              <select value={qType} onChange={e => setQType(e.target.value as QuestionType)} className="form-select text-sm">
                <option value="multiple_choice_single">Trắc nghiệm (1 đáp án)</option>
                <option value="multiple_choice_multi">Trắc nghiệm (nhiều đáp án)</option>
                <option value="true_false">Đúng / Sai</option>
                <option value="fill_in_blank">Điền khuyết</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">Ngôn ngữ</label>
              <div className="segmented-control">
                {['vi','en'].map(l => (
                  <button key={l} onClick={() => setLanguage(l)}
                    className={`segmented-control-item flex-1 cursor-pointer${language === l ? ' active' : ''}`}>
                    {l === 'vi' ? '🇻🇳 Việt' : '🇺🇸 EN'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Count slider */}
          <div>
            <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-2">
              Số câu: <span className="text-[#4bbf9f] font-black text-sm">{count}</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#b0a090]">1</span>
              <input type="range" min={1} max={10} value={count} onChange={e => setCount(Number(e.target.value))}
                className="flex-1 accent-[#4bbf9f] cursor-pointer" />
              <span className="text-xs text-[#b0a090]">10</span>
            </div>
          </div>

          {/* Provider selector */}
          <div>
            <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">AI Provider</label>
            <div className="segmented-control">
              {(['gemini', 'claude'] as const).map(p => {
                const info = aiInfo?.providers[p]
                const configured = info?.configured ?? false
                return (
                  <button key={p} onClick={() => setProvider(p)}
                    className={`segmented-control-item flex-1 cursor-pointer${provider === p ? ' active' : ''}${!configured ? ' opacity-50' : ''}`}>
                    {p === 'gemini' ? '✦ Gemini' : '◆ Claude'}
                    {!configured && <span className="ml-1 text-[10px]">⚠</span>}
                  </button>
                )
              })}
            </div>
            {aiInfo && !aiInfo.providers[provider].configured && (
              <p className="text-xs text-yellow-600 mt-1.5">
                {provider === 'claude' ? 'Thêm ANTHROPIC_API_KEY vào application.yml' : 'Thêm GEMINI_API_KEY vào application.yml'}
              </p>
            )}
          </div>

          {/* Claude model selector */}
          {provider === 'claude' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#7a6a5a] uppercase tracking-wider">Claude Models</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={claudeAutoMode} onChange={e => setClaudeAutoMode(e.target.checked)}
                    className="accent-violet-500 w-3.5 h-3.5" />
                  <span className="text-xs font-bold text-violet-600">Auto theo độ khó</span>
                </label>
              </div>

              {claudeAutoMode ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Dễ', model: 'Haiku 4.5', note: 'Nhanh · Rẻ' },
                    { label: 'Trung bình', model: 'Sonnet 4.5', note: 'Cân bằng' },
                    { label: 'Khó', model: 'Sonnet 4.6', note: 'Mới nhất' },
                  ].map(item => (
                    <div key={item.label} className={`px-2.5 py-2 rounded-lg border text-center transition-all ${
                      difficulty === (item.label === 'Dễ' ? 'easy' : item.label === 'Trung bình' ? 'medium' : 'hard')
                        ? 'bg-violet-50 border-violet-300'
                        : 'bg-[#faf8f5] border-[#d6cfc4] opacity-50'
                    }`}>
                      <div className="text-[10px] font-bold text-[#7a6a5a]">{item.label}</div>
                      <div className="text-xs font-black text-violet-700">{item.model}</div>
                      <div className="text-[9px] text-[#b0a090]">{item.note}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {CLAUDE_MODELS.map(m => {
                      const checked = claudeModels.includes(m.id)
                      return (
                        <label key={m.id} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                          checked
                            ? 'bg-violet-50 border-violet-300 text-[#4a3f35]'
                            : 'bg-[#faf8f5] border-[#d6cfc4] text-[#9a8a7a] hover:border-[#b0a090]'
                        }`}>
                          <input type="checkbox" checked={checked} onChange={e => {
                            if (e.target.checked) {
                              setClaudeModels(prev => [...prev.filter(id => id !== 'auto'), m.id])
                            } else {
                              const next = claudeModels.filter(id => id !== m.id)
                              setClaudeModels(next.length === 0 ? [m.id] : next)
                            }
                          }} className="accent-violet-500 w-3.5 h-3.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{m.label}</div>
                            <div className="text-[10px] text-[#b0a090]">{m.note}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                  {claudeModels.filter(id => id !== 'auto').length > 1 && (
                    <p className="text-xs text-violet-600 mt-1.5 font-medium">
                      ✦ {claudeModels.length} models × {count} câu = tối đa {claudeModels.length * count} câu
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Prompt toggle */}
          <div>
            <button onClick={() => setShowPrompt(p => !p)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#4bbf9f] hover:text-[#3dac8e] transition-colors">
              <svg className={`w-3.5 h-3.5 transition-transform ${showPrompt ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
              {showPrompt ? 'Ẩn prompt' : 'Tuỳ chỉnh prompt AI'}
            </button>
            {showPrompt && (
              <div className="mt-2 space-y-1.5">
                <p className="text-xs text-[#9a8a7a]">
                  Prompt này sẽ được gửi kèm như ghi chú bổ sung. Backend luôn tự tạo prompt chuẩn.
                </p>
                <textarea rows={7} value={prompt} onChange={e => setPrompt(e.target.value)}
                  className="form-input resize-none text-xs font-mono leading-relaxed" />
                <button onClick={() => setPrompt(DEFAULT_PROMPT)}
                  className="text-xs text-[#a09080] hover:text-[#4a3f35] transition-colors">
                  ↩ Khôi phục mặc định
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 text-sm font-semibold leading-snug">{error}</p>
            </div>
          )}

          {/* Generate button */}
          <button onClick={handleGenerate}
            disabled={isGenerating}
            className="practice-start-btn w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {isGenerating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang tạo câu hỏi...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Tạo {count} câu hỏi
              </>
            )}
          </button>
        </div>

        {/* ══════════════════ DRAFTS PANEL ══════════════════ */}
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="page-card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#eeeae0] flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-[#c8bfb0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-[#9a8a7a] font-bold text-base">Chưa có câu hỏi nào</p>
              <p className="text-[#b0a090] text-sm mt-1 max-w-xs">
                Chọn sách, nhập chương và nhấn "Tạo câu hỏi" để bắt đầu
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#8b949e] uppercase tracking-widest">
                  Drafts ({drafts.length})
                </span>
                <button onClick={() => setDrafts([])}
                  className="text-xs text-[#8b949e] hover:text-red-400 transition-colors font-medium">
                  Xoá tất cả
                </button>
              </div>

              {drafts.map(draft => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  isEditing={editingId === draft.id}
                  isSaving={savingId === draft.id}
                  editData={editData}
                  onEdit={() => startEdit(draft)}
                  onChange={(field, val) => setEditData(p => ({ ...p, [field]: val }))}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onApprove={() => approveDraft(draft)}
                  onReject={() => rejectDraft(draft.id)}
                  onRestore={() => restoreDraft(draft.id)}
                  onRemove={() => removeDraft(draft.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Draft Card ──────────────────────────────────────────────────────────────

interface DraftCardProps {
  draft: DraftQuestion
  isEditing: boolean
  isSaving: boolean
  editData: Partial<DraftQuestion>
  onEdit: () => void
  onChange: (field: string, val: any) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onApprove: () => void
  onReject: () => void
  onRestore: () => void
  onRemove: () => void
}

function DraftCard({ draft, isEditing, isSaving, editData, onEdit, onChange, onSaveEdit, onCancelEdit, onApprove, onReject, onRestore, onRemove }: DraftCardProps) {
  const cur = isEditing ? { ...draft, ...editData } as DraftQuestion : draft
  const opts = Array.isArray(cur.options) ? cur.options : []
  const OPT_LABELS = ['A','B','C','D','E']

  const isCorrect = (i: number) =>
    Array.isArray(cur.correctAnswer) ? cur.correctAnswer.includes(i) : cur.correctAnswer === i

  const DIFF_STYLE: Record<string, string> = {
    easy:   'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    hard:   'bg-red-100 text-red-700',
  }
  const DIFF_LABEL: Record<string, string> = { easy:'Dễ', medium:'TB', hard:'Khó' }
  const STATUS_STYLE: Record<DraftStatus, string> = {
    pending:  'bg-yellow-100 text-yellow-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-gray-100 text-gray-500',
  }
  const STATUS_LABEL: Record<DraftStatus, string> = {
    pending:  'Chờ duyệt',
    approved: '✓ Đã lưu',
    rejected:  'Từ chối',
  }

  return (
    <div className={`page-card p-5 border-2 transition-all duration-200 ${
      draft.status === 'approved' ? 'border-emerald-300 opacity-80' :
      draft.status === 'rejected' ? 'border-transparent opacity-50' :
      isEditing ? 'border-[#4bbf9f] shadow-lg' : 'border-transparent hover:border-[#d6cfc4]'
    }`}>

      {/* Header row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[draft.status]}`}>
          {STATUS_LABEL[draft.status]}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFF_STYLE[cur.difficulty] || 'bg-gray-100 text-gray-600'}`}>
          {DIFF_LABEL[cur.difficulty] || cur.difficulty}
        </span>
        <span className="text-xs text-[#9a8a7a] font-medium">
          {cur.book} {cur.chapter}
          {(cur.verseStart || cur.verseEnd) ? `:${cur.verseStart || '?'}–${cur.verseEnd || '?'}` : ''}
        </span>
        {draft.generatedBy && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-600 border border-violet-200">
            {CLAUDE_MODELS.find(m => m.id === draft.generatedBy)?.label ?? draft.generatedBy}
          </span>
        )}
        {draft.status !== 'approved' && (
          <button onClick={onRemove} className="ml-auto text-[#c8bfb0] hover:text-red-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── View mode ── */}
      {!isEditing && (
        <div className="space-y-3">
          <p className="text-[#4a3f35] font-semibold text-sm leading-snug">{cur.content}</p>
          {opts.length > 0 && (
            <div className="space-y-1.5">
              {opts.map((opt, i) => (
                <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm border ${
                  isCorrect(i)
                    ? 'bg-[#f0fbf7] border-[#4bbf9f] text-[#2e7a65] font-semibold'
                    : 'bg-[#faf9f5] border-[#e8e3d8] text-[#5a5048]'
                }`}>
                  <span className={`w-5 h-5 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 ${
                    isCorrect(i) ? 'bg-[#4bbf9f] text-white' : 'bg-[#d6cfc4] text-[#7a6a5a]'
                  }`}>{OPT_LABELS[i]}</span>
                  <span className="flex-1">{opt}</span>
                  {isCorrect(i) && (
                    <svg className="w-4 h-4 text-[#4bbf9f] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
          {cur.explanation && (
            <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">💡 Giải thích: </span>{cur.explanation}
            </div>
          )}
        </div>
      )}

      {/* ── Edit mode ── */}
      {isEditing && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">Câu hỏi</label>
            <textarea rows={2} value={cur.content}
              onChange={e => onChange('content', e.target.value)}
              className="form-input resize-none text-sm" />
          </div>

          {opts.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">
                Lựa chọn <span className="text-[#4bbf9f] font-normal normal-case">(nhấn ✓ để chọn đáp án đúng)</span>
              </label>
              {opts.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 ${
                    isCorrect(i) ? 'bg-[#4bbf9f] text-white' : 'bg-[#eeeae0] text-[#7a6a5a]'
                  }`}>{OPT_LABELS[i]}</span>
                  <input type="text" value={opt}
                    onChange={e => {
                      const n = [...opts]; n[i] = e.target.value
                      onChange('options', n)
                    }}
                    className="form-input text-sm py-2 flex-1" />
                  <button onClick={() => onChange('correctAnswer', i)}
                    className={`w-8 h-8 rounded-lg text-sm font-black transition-all flex-shrink-0 ${
                      isCorrect(i) ? 'bg-[#4bbf9f] text-white' : 'bg-[#eeeae0] text-[#9a8a7a] hover:bg-[#d6cfc4]'
                    }`}>✓</button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">Giải thích</label>
            <textarea rows={2} value={cur.explanation || ''}
              onChange={e => onChange('explanation', e.target.value)}
              className="form-input resize-none text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">Độ khó</label>
              <select value={cur.difficulty}
                onChange={e => onChange('difficulty', e.target.value)}
                className="form-select text-sm py-2">
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#7a6a5a] uppercase tracking-wider mb-1.5">Tags</label>
              <input type="text" value={(cur.tags || []).join(', ')}
                onChange={e => onChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="tag1, tag2"
                className="form-input text-sm py-2" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onSaveEdit}
              className="flex-1 bg-[#4a3f35] text-[#f5f0e4] text-sm font-bold py-2.5 rounded-xl hover:bg-[#3a3028] transition-colors">
              Lưu chỉnh sửa
            </button>
            <button onClick={onCancelEdit}
              className="px-5 text-sm font-bold text-[#7a6a5a] bg-[#eeeae0] py-2.5 rounded-xl hover:bg-[#d6cfc4] transition-colors">
              Huỷ
            </button>
          </div>
        </div>
      )}

      {/* ── Per-card save error ── */}
      {draft.saveError && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
          <svg className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-red-600 text-xs font-semibold leading-snug">{draft.saveError}</p>
        </div>
      )}

      {/* ── Actions ── */}
      {draft.status === 'pending' && !isEditing && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-[#eeeae0]">
          <button onClick={onApprove} disabled={isSaving}
            className="flex-1 bg-[#4bbf9f] text-white text-sm font-bold py-2.5 rounded-xl hover:bg-[#3dac8e] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
            {isSaving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {isSaving ? 'Đang lưu...' : 'Lưu câu hỏi'}
          </button>
          <button onClick={onEdit}
            className="px-4 text-sm font-bold text-[#5a5048] bg-[#f0ece4] py-2.5 rounded-xl hover:bg-[#e8e3d8] transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Sửa
          </button>
          <button onClick={onReject}
            className="w-10 flex items-center justify-center text-[#9a8a7a] bg-[#f0ece4] rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Từ chối">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {draft.status === 'rejected' && (
        <div className="mt-3 pt-3 border-t border-[#e8e3d8]">
          <button onClick={onRestore}
            className="text-xs text-[#9a8a7a] hover:text-[#4bbf9f] transition-colors font-semibold">
            ↩ Khôi phục
          </button>
        </div>
      )}

      {draft.status === 'approved' && (
        <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Đã lưu vào cơ sở dữ liệu
          {draft.approvedId && <span className="text-emerald-400 font-normal ml-1">#{draft.approvedId.slice(0,8)}</span>}
        </div>
      )}
    </div>
  )
}
