import { useEffect, useState } from 'react'
import { api, aiApi } from '../../api/client'

// Hardcoded hex per mockup `create_quizset_modal_with_difficulty_mix.html`
// (memory rule: no CSS variables in dialog files to avoid white-bg bug).
const HEX = {
  bg: '#11131e',
  surface: '#1a1d2e',
  border: 'rgba(255,255,255,0.08)',
  borderSubtle: 'rgba(255,255,255,0.06)',
  text: '#ffffff',
  muted: '#9ca3af',
  dim: '#6b7280',
  gold: '#e8a832',
  goldNavy: '#1a1226',
  green: '#4ade80',
  yellow: '#fbbf24',
  red: '#ef4444',
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

interface AiDraft {
  content: string
  options: string[]
  correctAnswer: number[]
  explanation?: string
  difficulty: string
  book?: string
  chapter?: number
  verseStart?: number
  verseEnd?: number
}

interface ManualQ {
  content: string
  options: string[]
  correctAnswer: number
  difficulty: Difficulty
}

interface Props {
  open: boolean
  groupId: string
  onClose: () => void
  onSaved: () => void
}

export default function CreateQuizSetModal({ open, groupId, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<'ai' | 'manual'>('ai')
  const [name, setName] = useState('')
  const [book, setBook] = useState('Sáng Thế Ký')
  const [chapterFrom, setChapterFrom] = useState(1)
  const [chapterTo, setChapterTo] = useState(3)
  const [verseFrom, setVerseFrom] = useState<number | ''>('')
  const [verseTo, setVerseTo] = useState<number | ''>('')
  const [topic, setTopic] = useState('')
  const [mix, setMix] = useState({ easy: 2, medium: 2, hard: 1 })
  const [drafts, setDrafts] = useState<AiDraft[]>([])
  const [manualList, setManualList] = useState<ManualQ[]>([])
  const [manualContent, setManualContent] = useState('')
  const [manualOptions, setManualOptions] = useState(['', '', '', ''])
  const [manualCorrect, setManualCorrect] = useState(0)
  const [manualDiff, setManualDiff] = useState<Difficulty>('MEDIUM')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [quota, setQuota] = useState<{ used: number; limit: number; remaining: number } | null>(null)

  const totalMix = mix.easy + mix.medium + mix.hard

  useEffect(() => {
    if (!open) return
    // Reset on open.
    setTab('ai'); setName(''); setError('')
    setDrafts([]); setManualList([])
    setManualContent(''); setManualOptions(['', '', '', '']); setManualCorrect(0); setManualDiff('MEDIUM')
    setMix({ easy: 2, medium: 2, hard: 1 })
    setVerseFrom(''); setVerseTo('')
    // Probe quota (silent if endpoint unreachable).
    api.get(`/api/groups/${groupId}/ai-quota`)
      .then(res => res.data?.success && setQuota({
        used: res.data.used, limit: res.data.limit, remaining: res.data.remaining,
      }))
      .catch(() => setQuota(null))
  }, [open, groupId])

  if (!open) return null

  const setMixSafe = (level: keyof typeof mix, value: number) => {
    setMix(m => ({ ...m, [level]: Math.max(0, Math.min(15, value)) }))
  }

  const presetEven = () => setMix({ easy: 2, medium: 2, hard: 2 })
  const preset402020 = () => setMix({ easy: 4, medium: 4, hard: 2 })

  async function handleGenerate() {
    if (!book.trim()) { setError('Vui lòng nhập sách Kinh Thánh'); return }
    if (totalMix === 0) { setError('Tổng số câu phải > 0'); return }
    setGenerating(true); setError('')
    try {
      const buckets: { difficulty: Difficulty; count: number }[] = []
      if (mix.easy > 0)   buckets.push({ difficulty: 'EASY',   count: mix.easy })
      if (mix.medium > 0) buckets.push({ difficulty: 'MEDIUM', count: mix.medium })
      if (mix.hard > 0)   buckets.push({ difficulty: 'HARD',   count: mix.hard })

      const payloadBase = {
        book: book.trim(),
        chapter: chapterFrom,
        chapterEnd: chapterTo,
        verseStart: verseFrom === '' ? 1 : verseFrom,
        verseEnd: verseTo === '' ? 200 : verseTo,
        topic: topic.trim() || undefined,
        language: 'vi',
      }

      const responses = await Promise.all(buckets.map(b =>
        aiApi.post(`/api/groups/${groupId}/ai-generate`, { ...payloadBase, count: b.count, difficulty: b.difficulty })
      ))

      const all: AiDraft[] = []
      responses.forEach((r, i) => {
        const qs = r.data?.questions ?? []
        qs.forEach((q: any) => all.push({
          content: q.content,
          options: q.options ?? [],
          correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer ?? 0],
          explanation: q.explanation,
          difficulty: buckets[i].difficulty,
          book: q.book ?? book,
          chapter: q.chapter,
          verseStart: q.verseStart,
          verseEnd: q.verseEnd,
        }))
      })
      setDrafts(all)

      // Refresh quota after a successful generation.
      api.get(`/api/groups/${groupId}/ai-quota`)
        .then(res => res.data?.success && setQuota({
          used: res.data.used, limit: res.data.limit, remaining: res.data.remaining,
        }))
        .catch(() => {})
    } catch (err: any) {
      const data = err?.response?.data
      if (data?.error === 'QUOTA_EXCEEDED') {
        setError(`${data.message} (${data.used}/${data.limit})`)
        setQuota({ used: data.used, limit: data.limit, remaining: data.remaining })
      } else {
        setError(data?.message || 'Không thể tạo câu hỏi với AI')
      }
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) { setError('Vui lòng nhập tên bộ câu hỏi'); return }
    const questions = tab === 'ai' ? drafts : manualList
    if (questions.length === 0) { setError('Chưa có câu hỏi nào'); return }
    setSaving(true); setError('')
    try {
      await api.post(`/api/groups/${groupId}/quiz-sets/custom`, { name: name.trim(), questions })
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleManualAdd = () => {
    if (!manualContent.trim() || manualOptions.filter(o => o.trim()).length < 2) return
    setManualList(prev => [...prev, {
      content: manualContent.trim(),
      options: manualOptions.map(o => o.trim()),
      correctAnswer: manualCorrect,
      difficulty: manualDiff,
    }])
    setManualContent(''); setManualOptions(['', '', '', '']); setManualCorrect(0)
  }

  // Stacked-bar widths (percent). Avoid divide-by-zero.
  const pct = (n: number) => totalMix === 0 ? 0 : (n / totalMix) * 100
  const mixSummary = `${mix.easy} dễ + ${mix.medium} TB + ${mix.hard} khó`

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(10, 12, 20, 0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, fontFamily: 'inherit',
      }}
      data-testid="create-quizset-modal"
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 580,
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          background: HEX.bg,
          border: `1px solid ${HEX.border}`,
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          color: HEX.text,
        }}
      >
        {/* HEADER */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: HEX.gold }}>menu_book</span>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Tạo bộ câu hỏi mới</div>
          </div>
          {quota && (
            <div
              data-testid="ai-quota-badge"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(232,168,50,0.10)',
                border: '1px solid rgba(232,168,50,0.22)',
                padding: '4px 9px', borderRadius: 999,
                fontSize: 11, color: HEX.gold,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>auto_awesome</span>
              <span>Hôm nay: {quota.used}/{quota.limit}</span>
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Đóng"
            style={{ background: 'transparent', border: 'none', color: HEX.dim, cursor: 'pointer', padding: 4 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div style={{ padding: '16px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flexShrink: 0 }}>
          {(['ai', 'manual'] as const).map(t => {
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                data-testid={`tab-${t}`}
                style={{
                  background: active ? HEX.gold : 'rgba(255,255,255,0.04)',
                  color: active ? HEX.goldNavy : HEX.muted,
                  border: active ? 'none' : `1px solid ${HEX.borderSubtle}`,
                  padding: '11px 14px', borderRadius: 10,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  {t === 'ai' ? 'auto_awesome' : 'edit'}
                </span>
                {t === 'ai' ? 'AI tạo' : 'Tự soạn'}
              </button>
            )
          })}
        </div>

        {/* SCROLLABLE BODY */}
        <div style={{ padding: '20px 24px 0', overflowY: 'auto', flex: 1 }}>
          <FieldLabel>TÊN BỘ CÂU HỎI <span style={{ color: HEX.red }}>*</span></FieldLabel>
          <TextInput
            value={name}
            onChange={setName}
            placeholder="VD: Bài học Chúa Nhật · Ân điển của Đức Chúa Trời"
            testId="qs-name"
            autoFocus
          />

          {tab === 'ai' && (
            <>
              <div style={{ height: 14 }} />
              <FieldLabel>SÁCH KINH THÁNH</FieldLabel>
              <TextInput
                value={book}
                onChange={setBook}
                placeholder="VD: Sáng Thế Ký"
                testId="qs-book"
                accent
              />

              {/* PHẠM VI card */}
              <div style={{
                marginTop: 14,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${HEX.borderSubtle}`,
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color: HEX.muted }}>bookmark</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: HEX.muted, letterSpacing: 0.6 }}>PHẠM VI</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <RangePair label="Chương">
                    <NumberCell value={chapterFrom} onChange={v => {
                      const n = v === '' ? 1 : v
                      setChapterFrom(n); if (chapterTo < n) setChapterTo(n)
                    }} min={1} max={150} testId="ch-from" />
                    <span style={{ color: HEX.dim, fontSize: 11 }}>đến</span>
                    <NumberCell value={chapterTo} onChange={v => {
                      const n = v === '' ? chapterFrom : v
                      setChapterTo(Math.max(chapterFrom, n))
                    }} min={1} max={150} testId="ch-to" />
                  </RangePair>
                  <RangePair label="Câu" optional>
                    <NumberCell value={verseFrom} onChange={v => setVerseFrom(v)} placeholder="1" min={1} max={300} testId="vs-from" />
                    <span style={{ color: HEX.dim, fontSize: 11 }}>đến</span>
                    <NumberCell value={verseTo} onChange={v => setVerseTo(v)} placeholder="31" min={1} max={300} testId="vs-to" />
                  </RangePair>
                </div>
              </div>

              {/* CHỦ ĐỀ */}
              <div style={{ height: 18 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: HEX.muted, letterSpacing: 0.6 }}>CHỦ ĐỀ BÀI HỌC</span>
                <span style={{ fontSize: 11, color: HEX.dim }}>Không bắt buộc</span>
              </div>
              <textarea
                rows={2}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="VD: Sự sáng tạo, sự sa ngã, lời hứa cứu chuộc..."
                data-testid="qs-topic"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: HEX.surface, border: `1px solid ${HEX.border}`,
                  color: HEX.text, padding: '11px 13px', borderRadius: 8,
                  fontSize: 13, fontFamily: 'inherit', resize: 'none',
                }}
              />

              {/* PHÂN BỔ ĐỘ KHÓ card */}
              <div style={{
                marginTop: 18,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${HEX.borderSubtle}`,
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: HEX.muted }}>bar_chart</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: HEX.muted, letterSpacing: 0.6 }}>PHÂN BỔ ĐỘ KHÓ</span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    <span style={{ color: HEX.dim }}>Tổng:</span>
                    <span style={{ fontWeight: 500, color: HEX.gold, fontSize: 14 }} data-testid="mix-total">{totalMix}</span>
                    <span style={{ color: HEX.dim }}>câu</span>
                  </div>
                </div>

                <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 14, background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ width: `${pct(mix.easy)}%`,   background: HEX.green }} />
                  <div style={{ width: `${pct(mix.medium)}%`, background: HEX.yellow }} />
                  <div style={{ width: `${pct(mix.hard)}%`,   background: HEX.red }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <Stepper label="DỄ" color={HEX.green} value={mix.easy} onChange={v => setMixSafe('easy', v)} testId="mix-easy" />
                  <Stepper label="TB" color={HEX.yellow} value={mix.medium} onChange={v => setMixSafe('medium', v)} testId="mix-medium" />
                  <Stepper label="KHÓ" color={HEX.red} value={mix.hard} onChange={v => setMixSafe('hard', v)} testId="mix-hard" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 11, color: HEX.dim }}>Gợi ý:</span>
                  <ChipButton onClick={presetEven} testId="preset-even">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>balance</span>
                    Đều nhau
                  </ChipButton>
                  <ChipButton onClick={preset402020} accent testId="preset-40-40-20">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>pie_chart</span>
                    Đề xuất 40/40/20
                  </ChipButton>
                </div>
              </div>

              {/* DRAFT LIST */}
              {drafts.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: HEX.muted, letterSpacing: 0.6 }}>
                      NHÁP · {drafts.length} CÂU
                    </span>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      style={{ background: 'transparent', border: 'none', color: HEX.gold, fontSize: 11, cursor: 'pointer', opacity: generating ? 0.5 : 1 }}
                    >Tạo lại</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                    {drafts.map((d, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(50,52,64,0.6)',
                        border: `1px solid ${HEX.borderSubtle}`,
                        borderRadius: 10, padding: 10,
                      }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: HEX.gold, flexShrink: 0 }}>Q{idx + 1}</span>
                          <span style={{ fontSize: 11, color: HEX.text, flex: 1, lineHeight: 1.4 }}>{d.content}</span>
                          <button
                            onClick={() => setDrafts(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: 'transparent', border: 'none', color: HEX.dim, cursor: 'pointer', padding: 0 }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                          {d.options.map((opt, oi) => {
                            const isCorrect = d.correctAnswer.includes(oi)
                            return (
                              <div key={oi} style={{
                                fontSize: 10,
                                padding: '4px 6px',
                                borderRadius: 4,
                                background: isCorrect ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isCorrect ? 'rgba(74,222,128,0.4)' : HEX.borderSubtle}`,
                                color: isCorrect ? HEX.green : HEX.muted,
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                {isCorrect && <span className="material-symbols-outlined" style={{ fontSize: 11 }}>check</span>}
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt}</span>
                              </div>
                            )
                          })}
                        </div>
                        {d.explanation && (
                          <div style={{
                            marginTop: 6, paddingTop: 6,
                            borderTop: `1px solid ${HEX.borderSubtle}`,
                            display: 'flex', gap: 6, alignItems: 'flex-start',
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 12, color: HEX.gold, flexShrink: 0, marginTop: 1 }}>lightbulb</span>
                            <span style={{ fontSize: 10, color: HEX.muted, lineHeight: 1.45, fontStyle: 'italic' }}>{d.explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'manual' && (
            <>
              <div style={{
                marginTop: 14,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${HEX.borderSubtle}`,
                borderRadius: 10, padding: 14,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <FieldLabel>NỘI DUNG CÂU HỎI</FieldLabel>
                <textarea
                  rows={3}
                  value={manualContent}
                  onChange={e => setManualContent(e.target.value)}
                  placeholder="Nhập câu hỏi..."
                  data-testid="manual-content"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: HEX.surface, border: `1px solid ${HEX.border}`,
                    color: HEX.text, padding: '10px 12px', borderRadius: 8,
                    fontSize: 12, fontFamily: 'inherit', resize: 'none',
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {manualOptions.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => setManualCorrect(i)}
                        data-testid={`manual-correct-${i}`}
                        style={{
                          width: 18, height: 18, flexShrink: 0, borderRadius: '50%',
                          background: manualCorrect === i ? '#4a9c22' : 'transparent',
                          border: manualCorrect === i ? '1px solid #4a9c22' : '1px solid rgba(255,255,255,0.25)',
                          color: '#fff', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                        }}
                      >{manualCorrect === i ? '✓' : ''}</button>
                      <input
                        value={opt}
                        onChange={e => { const u = [...manualOptions]; u[i] = e.target.value; setManualOptions(u) }}
                        placeholder={`Đáp án ${i + 1}`}
                        style={{
                          flex: 1, background: HEX.surface, border: `1px solid ${HEX.border}`,
                          color: HEX.text, padding: '6px 8px', borderRadius: 6,
                          fontSize: 11, fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['EASY', 'MEDIUM', 'HARD'] as const).map(d => {
                      const active = manualDiff === d
                      const c = d === 'EASY' ? HEX.green : d === 'MEDIUM' ? HEX.yellow : HEX.red
                      return (
                        <button
                          key={d}
                          onClick={() => setManualDiff(d)}
                          style={{
                            padding: '4px 10px', borderRadius: 999, fontSize: 10,
                            background: active ? `${c}26` : 'transparent',
                            color: active ? c : HEX.dim,
                            border: `1px solid ${active ? `${c}66` : HEX.borderSubtle}`,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >{d === 'EASY' ? 'Dễ' : d === 'MEDIUM' ? 'TB' : 'Khó'}</button>
                      )
                    })}
                  </div>
                  <button
                    onClick={handleManualAdd}
                    disabled={!manualContent.trim() || manualOptions.filter(o => o.trim()).length < 2}
                    data-testid="manual-add"
                    style={{
                      background: 'rgba(232,168,50,0.15)', color: HEX.gold,
                      border: '1px solid rgba(232,168,50,0.4)',
                      padding: '6px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                      opacity: (!manualContent.trim() || manualOptions.filter(o => o.trim()).length < 2) ? 0.4 : 1,
                      fontFamily: 'inherit',
                    }}
                  >+ Thêm câu</button>
                </div>
              </div>

              {manualList.length > 0 && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                  {manualList.map((q, i) => (
                    <div key={i} style={{
                      background: 'rgba(50,52,64,0.5)',
                      border: `1px solid ${HEX.borderSubtle}`,
                      borderRadius: 10, padding: 10,
                      display: 'flex', gap: 8, alignItems: 'flex-start',
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: HEX.gold }}>Q{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: HEX.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.content}</div>
                        <div style={{ fontSize: 9, color: HEX.dim, marginTop: 2 }}>
                          {q.options.filter(Boolean).length} đáp án · {q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'HARD' ? 'Khó' : 'TB'}
                        </div>
                      </div>
                      <button
                        onClick={() => setManualList(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: 'transparent', border: 'none', color: HEX.dim, cursor: 'pointer', padding: 0 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{ height: 16 }} />
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '16px 24px 20px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(255,255,255,0.015)',
          flexShrink: 0,
        }}>
          {error && (
            <div data-testid="qs-error" style={{ marginBottom: 10, color: HEX.red, fontSize: 12, textAlign: 'center' }}>
              {error}
            </div>
          )}

          {tab === 'ai' && drafts.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating || !book.trim() || totalMix === 0}
              data-testid="btn-generate"
              style={{
                width: '100%', background: HEX.gold, color: HEX.goldNavy, border: 'none',
                padding: '13px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: (generating || !book.trim() || totalMix === 0) ? 'not-allowed' : 'pointer',
                opacity: (generating || !book.trim() || totalMix === 0) ? 0.6 : 1,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {generating ? 'hourglass_top' : 'auto_awesome'}
              </span>
              {generating
                ? 'Đang tạo nháp...'
                : <>Tạo {totalMix} câu hỏi với AI <span style={{ opacity: 0.7, fontWeight: 400, marginLeft: 4 }}>· {mixSummary}</span></>}
            </button>
          )}

          {(tab === 'manual' || drafts.length > 0) && (
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || (tab === 'ai' ? drafts.length : manualList.length) === 0}
              data-testid="btn-save"
              style={{
                width: '100%', background: HEX.gold, color: HEX.goldNavy, border: 'none',
                padding: '13px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: 'pointer',
                opacity: (saving || !name.trim() || (tab === 'ai' ? drafts.length : manualList.length) === 0) ? 0.5 : 1,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
              {saving ? 'Đang lưu...' : `Lưu bộ ${tab === 'ai' ? drafts.length : manualList.length} câu`}
            </button>
          )}

          {tab === 'ai' && drafts.length === 0 && !generating && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, fontSize: 11, color: HEX.dim }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>
              <span>AI tạo nháp ~20-30s · Bạn xem lại + chỉnh sửa trước khi lưu</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: HEX.muted, letterSpacing: 0.6, marginBottom: 6 }}>
      {children}
    </label>
  )
}

function TextInput({
  value, onChange, placeholder, testId, accent, autoFocus,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; testId?: string; accent?: boolean; autoFocus?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid={testId}
      autoFocus={autoFocus}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: HEX.surface,
        border: `1px solid ${accent ? 'rgba(232,168,50,0.3)' : HEX.border}`,
        color: HEX.text, padding: '11px 13px', borderRadius: 8,
        fontSize: 13, fontFamily: 'inherit',
      }}
    />
  )
}

function RangePair({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#d1d5db' }}>{label}</span>
        {optional && <span style={{ fontSize: 11, color: HEX.dim }}>tuỳ chọn</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 6, alignItems: 'center' }}>
        {children}
      </div>
    </div>
  )
}

function NumberCell({
  value, onChange, min, max, placeholder, testId,
}: {
  value: number | ''; onChange: (v: number | '') => void;
  min?: number; max?: number; placeholder?: string; testId?: string;
}) {
  return (
    <input
      type="number"
      value={value === '' ? '' : value}
      placeholder={placeholder}
      min={min}
      max={max}
      onChange={e => {
        const raw = e.target.value
        if (raw === '') onChange('')
        else onChange(Number(raw))
      }}
      data-testid={testId}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: HEX.surface, border: `1px solid ${HEX.border}`,
        color: HEX.text, padding: 9, borderRadius: 7,
        fontSize: 13, textAlign: 'center', fontFamily: 'inherit',
      }}
    />
  )
}

function Stepper({
  label, color, value, onChange, testId,
}: {
  label: string; color: string; value: number; onChange: (v: number) => void; testId: string
}) {
  return (
    <div style={{
      background: `${color}10`, // ~6% alpha
      border: `1px solid ${color}33`,
      borderRadius: 8, padding: '10px 8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center', marginBottom: 8 }}>
        <span style={{ display: 'inline-block', width: 7, height: 7, background: color, borderRadius: '50%' }} />
        <span style={{ fontSize: 11, fontWeight: 500, color, letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 24px', gap: 4, alignItems: 'center' }}>
        <button
          onClick={() => onChange(value - 1)}
          data-testid={`${testId}-dec`}
          style={{
            background: 'rgba(255,255,255,0.06)', color: '#d1d5db', border: 'none',
            width: 24, height: 24, borderRadius: 5, cursor: 'pointer', fontSize: 14, lineHeight: 1,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
          }}
        >−</button>
        <div data-testid={`${testId}-value`} style={{ fontSize: 18, fontWeight: 500, color: HEX.text, textAlign: 'center' }}>{value}</div>
        <button
          onClick={() => onChange(value + 1)}
          data-testid={`${testId}-inc`}
          style={{
            background: `${color}26`, color, border: 'none',
            width: 24, height: 24, borderRadius: 5, cursor: 'pointer', fontSize: 14, lineHeight: 1,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
          }}
        >+</button>
      </div>
    </div>
  )
}

function ChipButton({
  onClick, accent, testId, children,
}: {
  onClick: () => void; accent?: boolean; testId?: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      style={{
        background: accent ? 'rgba(232,168,50,0.10)' : 'rgba(255,255,255,0.04)',
        color: accent ? HEX.gold : '#d1d5db',
        border: `1px solid ${accent ? 'rgba(232,168,50,0.22)' : HEX.border}`,
        padding: '4px 10px', borderRadius: 999, fontSize: 11, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
      }}
    >{children}</button>
  )
}
