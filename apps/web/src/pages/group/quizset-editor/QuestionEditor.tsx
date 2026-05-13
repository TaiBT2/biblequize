import { useEffect, useMemo, useState } from 'react'
import type { EditorQuestion } from '../../../api/quizSets'
import { ANSWER_OPTION_COLORS, COLOR, DARK_INPUT_STYLE, DARK_TEXTAREA_STYLE, DIFFICULTY_COLORS } from './styles'
import { validateQuestion } from './validation'

type Difficulty = 'easy' | 'medium' | 'hard'

interface Props {
  index: number
  question: EditorQuestion
  onChange: (patch: Partial<EditorQuestion>) => void
  onDelete: () => void
  onAIRewrite: () => void
  onDuplicate?: () => void
  rewriting?: boolean
}

function scriptureRefString(q: EditorQuestion): string {
  if (!q.book) return ''
  const ch = q.chapter ?? ''
  const vs = q.verseStart
  const ve = q.verseEnd
  if (vs && ve && ve !== vs) return `${q.book} ${ch}:${vs}-${ve}`
  if (vs) return `${q.book} ${ch}:${vs}`
  return `${q.book} ${ch}`
}

const SCRIPTURE_RE = /^[A-Za-zÀ-ỹĐđ0-9\s]+\s\d+(:\d+(-\d+)?)?$/

export default function QuestionEditor({
  index, question, onChange, onDelete, onAIRewrite, onDuplicate, rewriting,
}: Props) {
  const issues = useMemo(() => validateQuestion(question), [question])
  const issueByKind = new Map(issues.map(i => [i.kind === 'option_empty' ? `option_empty_${i.index}` : i.kind, i] as const))

  // Scripture ref edited as one freeform string but stored as book + chapter + verseStart + verseEnd
  const [scriptureInput, setScriptureInput] = useState(scriptureRefString(question))
  useEffect(() => { setScriptureInput(scriptureRefString(question)) }, [question.id])

  const dk: Difficulty = (['easy', 'medium', 'hard'] as const).includes(question.difficulty as any)
    ? question.difficulty as Difficulty : 'medium'
  const correctIndex = question.correctAnswer?.[0] ?? -1

  const onScriptureBlur = () => {
    const txt = scriptureInput.trim()
    // Parse "Book 1:2-3" / "Book 1:2" / "Book 1"
    const m = txt.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/)
    if (!m) return // invalid, leave UI to show warning
    const [, book, ch, vs, ve] = m
    onChange({
      book: book.trim(),
      chapter: Number(ch),
      verseStart: vs ? Number(vs) : null,
      verseEnd: ve ? Number(ve) : (vs ? Number(vs) : null),
    })
  }

  const scriptureValid = SCRIPTURE_RE.test(scriptureInput.trim()) || scriptureInput.trim() === ''

  const setOption = (i: number, val: string) => {
    const opts = [...(question.options || ['', '', '', ''])]
    while (opts.length < 4) opts.push('')
    opts[i] = val
    onChange({ options: opts })
  }

  return (
    <div style={{ padding: '20px 24px', background: COLOR.bgSection, overflowY: 'auto' }}>

      {/* Header: number + difficulty + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: COLOR.textDisabled }}>Câu</span>
        <span style={{ fontSize: 18, fontWeight: 500, color: COLOR.textPrimary }}>#{index + 1}</span>

        <div style={{ display: 'flex', gap: 4, padding: 2, background: COLOR.inputBg, borderRadius: 6 }}>
          {(['easy', 'medium', 'hard'] as const).map(d => {
            const active = dk === d
            const col = DIFFICULTY_COLORS[d]
            const label = d === 'easy' ? 'Dễ' : d === 'medium' ? 'TB' : 'Khó'
            return (
              <button
                key={d}
                onClick={() => onChange({ difficulty: d })}
                style={{
                  background: active ? `rgba(${d === 'easy' ? '74,222,128' : d === 'medium' ? '251,191,36' : '239,68,68'},0.2)` : 'transparent',
                  color: active ? col.accent : COLOR.textMuted,
                  border: 'none', padding: '4px 12px', borderRadius: 4,
                  fontSize: 11, fontWeight: active ? 500 : 400, cursor: 'pointer',
                }}
              >{label}</button>
            )
          })}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={onAIRewrite} disabled={rewriting} style={{
            background: COLOR.goldBg, color: COLOR.gold,
            border: `1px solid rgba(232,168,50,0.22)`,
            padding: '5px 10px', borderRadius: 6, fontSize: 11,
            cursor: rewriting ? 'wait' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            opacity: rewriting ? 0.6 : 1,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden>refresh</span>
            {rewriting ? 'Đang viết lại...' : 'AI viết lại'}
          </button>
          {onDuplicate && (
            <button onClick={onDuplicate} title="Sao chép câu" style={{
              background: 'transparent', color: COLOR.textDisabled,
              border: `1px solid ${COLOR.borderSubtle}`,
              padding: '5px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden>content_copy</span>
            </button>
          )}
          <button onClick={onDelete} title="Xoá câu" style={{
            background: 'transparent', color: COLOR.danger,
            border: `1px solid rgba(239,68,68,0.25)`,
            padding: '5px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden>delete</span>
          </button>
        </div>
      </div>

      {/* Question textarea */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: COLOR.textMuted, letterSpacing: 0.6, marginBottom: 6 }}>
          CÂU HỎI <span style={{ color: COLOR.danger }}>*</span>
        </label>
        <textarea
          rows={2}
          value={question.content || ''}
          onChange={e => {
            onChange({ content: e.target.value })
            e.target.style.height = 'auto'
            e.target.style.height = Math.max(e.target.scrollHeight, 60) + 'px'
          }}
          ref={el => {
            if (el) { el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight, 60) + 'px' }
          }}
          placeholder="Nhập nội dung câu hỏi..."
          style={{
            ...DARK_TEXTAREA_STYLE,
            borderColor: issueByKind.has('short_content') ? COLOR.warning : COLOR.goldFocus,
            padding: '11px 13px',
            fontSize: 14,
            wordBreak: 'break-word',
          }}
        />
        {issueByKind.has('short_content') && (
          <div style={{ fontSize: 10, color: COLOR.warning, marginTop: 4 }}>Cần ≥10 ký tự</div>
        )}
      </div>

      {/* Options A/B/C/D */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: COLOR.textMuted, letterSpacing: 0.6, marginBottom: 8 }}>
          ĐÁP ÁN <span style={{ color: COLOR.textDisabled, fontWeight: 400, letterSpacing: 0 }}>· Bấm vào tròn để chọn đáp án đúng</span>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {ANSWER_OPTION_COLORS.map((meta, i) => {
            const isCorrect = correctIndex === i
            const empty = issueByKind.has(`option_empty_${i}`)
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                background: isCorrect ? 'rgba(74,222,128,0.06)' : COLOR.inputBg,
                border: `1px solid ${isCorrect ? 'rgba(74,222,128,0.30)' : empty ? COLOR.warning : COLOR.borderXSubtle}`,
                borderRadius: 8, padding: '9px 12px',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 500, flexShrink: 0,
                }}>{meta.letter}</div>
                <button
                  type="button"
                  onClick={() => onChange({ correctAnswer: [i] })}
                  title={isCorrect ? 'Đáp án đúng' : 'Chọn làm đáp án đúng'}
                  style={{
                    width: 16, height: 16,
                    background: isCorrect ? COLOR.success : 'transparent',
                    border: isCorrect ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}
                >
                  {isCorrect && <span className="material-symbols-outlined" style={{ fontSize: 10, color: COLOR.bgDeep }} aria-hidden>check</span>}
                </button>
                <textarea
                  rows={1}
                  value={question.options?.[i] ?? ''}
                  onChange={e => {
                    setOption(i, e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  ref={el => {
                    if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
                  }}
                  placeholder={`Đáp án ${meta.letter}...`}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    color: isCorrect ? COLOR.textPrimary : COLOR.textSecondary,
                    fontSize: 13, fontFamily: 'inherit', padding: '4px 0',
                    fontWeight: isCorrect ? 500 : 400, outline: 'none', minWidth: 0,
                    resize: 'none', lineHeight: 1.5, overflow: 'hidden',
                    wordBreak: 'break-word',
                  }}
                />
              </div>
            )
          })}
        </div>
        {issueByKind.has('no_correct') && (
          <div style={{ fontSize: 10, color: COLOR.warning, marginTop: 6 }}>Chọn 1 đáp án đúng bằng cách bấm vào tròn</div>
        )}
      </div>

      {/* Bottom: Explanation + Scripture (2-column grid, stacks on mobile) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 12 }} className="qse-grid">
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: COLOR.textMuted, letterSpacing: 0.6, marginBottom: 6 }}>
            GIẢI THÍCH <span style={{ color: COLOR.danger }}>*</span>
          </label>
          <textarea
            rows={3}
            value={question.explanation || ''}
            onChange={e => {
              onChange({ explanation: e.target.value })
              e.target.style.height = 'auto'
              e.target.style.height = Math.max(e.target.scrollHeight, 80) + 'px'
            }}
            ref={el => {
              if (el) { el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight, 80) + 'px' }
            }}
            placeholder="Tại sao đáp án này đúng..."
            style={{
              ...DARK_TEXTAREA_STYLE,
              borderColor: issueByKind.has('short_explanation') ? COLOR.warning : COLOR.borderSubtle,
              padding: '10px 12px',
              fontSize: 12,
              wordBreak: 'break-word',
            }}
          />
          {issueByKind.has('short_explanation') && (
            <div style={{ fontSize: 10, color: COLOR.warning, marginTop: 4 }}>
              {(question.explanation || '').trim().length}/20 ký tự tối thiểu
            </div>
          )}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: COLOR.textMuted, letterSpacing: 0.6, marginBottom: 6 }}>
            CÂU KINH THÁNH <span style={{ color: COLOR.danger }}>*</span>
          </label>
          <input
            type="text"
            value={scriptureInput}
            onChange={e => setScriptureInput(e.target.value)}
            onBlur={onScriptureBlur}
            placeholder="Sáng Thế Ký 2:7"
            style={{
              ...DARK_INPUT_STYLE,
              borderColor: scriptureValid ? COLOR.goldFocus : COLOR.danger,
              color: COLOR.gold,
              fontFamily: 'monospace',
              padding: '10px 12px',
              fontSize: 13,
            }}
          />
          {!scriptureValid && (
            <div style={{ fontSize: 10, color: COLOR.danger, marginTop: 4 }}>
              Định dạng: Sáng Thế Ký 2:7 hoặc Sáng Thế Ký 2:7-9
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .qse-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
