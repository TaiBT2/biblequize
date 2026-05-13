import type { EditorQuestion } from '../../../api/quizSets'
import { COLOR, DIFFICULTY_COLORS } from './styles'
import { isQuestionValid, validateQuestion } from './validation'

interface Props {
  questions: EditorQuestion[]
  activeId: string | null
  onActivate: (id: string) => void
  onAIGenerate: () => void
  onAddManual: () => void
  aiBusy?: boolean
  addBusy?: boolean
}

function difficultyKey(d: string | null | undefined): keyof typeof DIFFICULTY_COLORS {
  const v = (d || 'medium').toLowerCase()
  return (v === 'easy' || v === 'hard') ? v : 'medium'
}

export default function QuestionSidebar({
  questions, activeId, onActivate, onAIGenerate, onAddManual, aiBusy, addBusy,
}: Props) {
  const counts = { easy: 0, medium: 0, hard: 0 }
  for (const q of questions) {
    const k = difficultyKey(q.difficulty)
    counts[k]++
  }

  return (
    <div style={{
      background: 'rgba(50,52,64,0.15)',
      borderRight: `1px solid ${COLOR.borderXSubtle}`,
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: COLOR.textMuted, letterSpacing: 0.6 }}>CÂU HỎI</span>
        <span style={{ fontSize: 11, color: COLOR.textDisabled }}>{questions.length} câu</span>
      </div>

      {/* Distribution bar */}
      <div style={{
        display: 'flex', gap: 4, padding: 2, background: COLOR.inputBg,
        borderRadius: 6, fontSize: 10, marginBottom: 12,
      }}>
        {(['easy', 'medium', 'hard'] as const).map(d => {
          const col = DIFFICULTY_COLORS[d]
          const label = d === 'easy' ? 'dễ' : d === 'medium' ? 'TB' : 'khó'
          return (
            <div key={d} style={{
              flex: 1, textAlign: 'center', padding: 4,
              background: col.chip, color: col.accent,
              borderRadius: 4, fontWeight: 500,
            }}>{counts[d]} {label}</div>
          )
        })}
      </div>

      {/* Scrollable question list */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14,
        overflowY: 'auto', flex: 1, minHeight: 0,
      }}>
        {questions.length === 0 && (
          <div style={{
            padding: '24px 12px', textAlign: 'center', color: COLOR.textDisabled,
            fontSize: 12, fontStyle: 'italic',
          }}>
            Chưa có câu hỏi. Dùng AI hoặc thêm thủ công.
          </div>
        )}
        {questions.map((q, idx) => {
          const dk = difficultyKey(q.difficulty)
          const col = DIFFICULTY_COLORS[dk]
          const isActive = q.id === activeId
          const issues = validateQuestion(q)
          const valid = issues.length === 0
          const isAI = (q.source || '').startsWith('ai')

          return (
            <div
              key={q.id}
              onClick={() => onActivate(q.id)}
              style={{
                background: isActive ? COLOR.goldBg : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? COLOR.goldBorder : COLOR.borderXSubtle}`,
                borderLeft: `3px solid ${valid ? col.border : COLOR.danger}`,
                borderRadius: 6,
                padding: '9px 11px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: isActive ? COLOR.gold : COLOR.textDisabled, fontWeight: 500 }}>#{idx + 1}</span>
                <span className="material-symbols-outlined"
                   style={{ fontSize: 13, color: valid ? COLOR.success : COLOR.warning }} aria-hidden>{valid ? 'check_circle' : 'warning'}</span>
                <span className="material-symbols-outlined"
                   style={{ fontSize: 11, color: COLOR.textDisabled }} aria-hidden>{isAI ? 'auto_awesome' : 'edit'}</span>
                {isActive && (
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: COLOR.gold, fontWeight: 500, letterSpacing: 0.5 }}>
                    ĐANG SỬA
                  </span>
                )}
                {!isActive && !valid && (
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: COLOR.warning, fontWeight: 500, letterSpacing: 0.5 }}>
                    THIẾU
                  </span>
                )}
              </div>
              <div style={{
                fontSize: 12, color: isActive ? COLOR.textPrimary : COLOR.textSecondary,
                lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {q.content || <em style={{ color: COLOR.textDisabled }}>câu hỏi trống</em>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div style={{ borderTop: `1px solid ${COLOR.borderXSubtle}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={onAIGenerate} disabled={aiBusy} style={{
          background: COLOR.goldBgStrong, color: COLOR.gold,
          border: `1px solid ${COLOR.goldBorder}`,
          padding: '9px 11px', borderRadius: 7, fontSize: 12, fontWeight: 500,
          cursor: aiBusy ? 'wait' : 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          opacity: aiBusy ? 0.6 : 1,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden>auto_awesome</span>
          {aiBusy ? 'Đang tạo...' : 'AI tạo nháp'}
        </button>
        <button onClick={onAddManual} disabled={addBusy} style={{
          background: 'rgba(255,255,255,0.04)', color: COLOR.textSecondary,
          border: `1px solid ${COLOR.borderSubtle}`,
          padding: '9px 11px', borderRadius: 7, fontSize: 12,
          cursor: addBusy ? 'wait' : 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          opacity: addBusy ? 0.6 : 1,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden>add</span>
          Thêm thủ công
        </button>
      </div>
    </div>
  )
}
