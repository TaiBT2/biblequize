import { useState } from 'react'
import { COLOR, DIFFICULTY_COLORS } from './styles'

interface Props {
  open: boolean
  scopeLabel: string
  scope: { book: string; chapterFrom: number; chapterTo: number }
  remaining: number
  limit: number
  topic?: string
  onClose: () => void
  onGenerate: (req: { countEasy: number; countMedium: number; countHard: number; topic?: string }) => Promise<void>
  busy?: boolean
  error?: string | null
}

export default function AIGeneratePanel({
  open, scopeLabel, remaining, limit, topic: defaultTopic, onClose, onGenerate, busy, error,
}: Props) {
  const [easy, setEasy] = useState(2)
  const [medium, setMedium] = useState(2)
  const [hard, setHard] = useState(1)
  const [topic, setTopic] = useState(defaultTopic || '')

  const total = easy + medium + hard
  const overQuota = total > remaining
  const tooLarge = total > 15
  const disabled = total <= 0 || overQuota || tooLarge || busy

  if (!open) return null

  const Stepper = ({
    value, setValue, label, color,
  }: { value: number; setValue: (n: number) => void; label: string; color: typeof DIFFICULTY_COLORS.easy }) => (
    <div style={{
      flex: 1, background: color.bg, border: `1px solid ${color.border}`,
      borderRadius: 10, padding: '12px 14px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: color.accent, fontWeight: 500, letterSpacing: 0.6, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <button onClick={() => setValue(Math.max(0, value - 1))} style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(255,255,255,0.04)', color: COLOR.textSecondary,
          border: `1px solid ${COLOR.borderSubtle}`, cursor: 'pointer', fontSize: 14,
        }}>−</button>
        <span style={{ fontSize: 22, fontWeight: 600, color: color.accent, minWidth: 28, display: 'inline-block' }}>{value}</span>
        <button onClick={() => setValue(Math.min(15, value + 1))} style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(255,255,255,0.04)', color: COLOR.textSecondary,
          border: `1px solid ${COLOR.borderSubtle}`, cursor: 'pointer', fontSize: 14,
        }}>+</button>
      </div>
    </div>
  )

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: COLOR.bgPanel, border: `1px solid ${COLOR.borderSubtle}`,
        borderRadius: 12, maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${COLOR.borderXSubtle}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="ti ti-sparkles" style={{ fontSize: 20, color: COLOR.gold }} aria-hidden />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: COLOR.textPrimary }}>AI tạo nháp câu hỏi</div>
            <div style={{ fontSize: 11, color: COLOR.textMuted, marginTop: 2 }}>Phạm vi: {scopeLabel}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: COLOR.textMuted,
            cursor: 'pointer', padding: 4, display: 'inline-flex',
          }}>
            <i className="ti ti-x" style={{ fontSize: 18 }} aria-hidden />
          </button>
        </div>

        <div style={{ padding: '18px 22px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12, fontSize: 12, color: COLOR.textMuted,
          }}>
            <span>Tổng: <strong style={{ color: COLOR.textPrimary }}>{total}</strong> câu</span>
            <span style={{ color: overQuota ? COLOR.danger : COLOR.textDisabled }}>
              Còn lại trong ngày: {remaining}/{limit}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <Stepper value={easy} setValue={setEasy} label="DỄ" color={DIFFICULTY_COLORS.easy} />
            <Stepper value={medium} setValue={setMedium} label="TRUNG BÌNH" color={DIFFICULTY_COLORS.medium} />
            <Stepper value={hard} setValue={setHard} label="KHÓ" color={DIFFICULTY_COLORS.hard} />
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <button onClick={() => { setEasy(2); setMedium(2); setHard(2) }} style={chipBtn()}>
              Đều nhau (2/2/2)
            </button>
            <button onClick={() => { setEasy(4); setMedium(4); setHard(2) }} style={chipBtn()}>
              40/40/20 (4/4/2)
            </button>
            <button onClick={() => { setEasy(0); setMedium(0); setHard(0) }} style={chipBtn()}>
              Xoá
            </button>
          </div>

          <label style={{ display: 'block', fontSize: 11, color: COLOR.textMuted, marginBottom: 6, letterSpacing: 0.6, fontWeight: 500 }}>
            CHỦ ĐỀ (tùy chọn)
          </label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="VD: Sự sáng tạo, tình yêu của Đức Chúa Trời..."
            style={{
              width: '100%', background: COLOR.inputBg, border: `1px solid ${COLOR.borderSubtle}`,
              color: COLOR.textPrimary, padding: '9px 12px', borderRadius: 7,
              fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14,
              outline: 'none',
            }}
          />

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.10)', border: `1px solid rgba(239,68,68,0.30)`,
              color: COLOR.danger, padding: '8px 12px', borderRadius: 7,
              fontSize: 12, marginBottom: 12,
            }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 14, marginRight: 6, verticalAlign: -2 }} aria-hidden />
              {error}
            </div>
          )}

          {busy && (
            <div style={{
              background: COLOR.goldBg, border: `1px solid rgba(232,168,50,0.22)`,
              color: COLOR.gold, padding: '10px 12px', borderRadius: 7,
              fontSize: 12, marginBottom: 12, textAlign: 'center',
            }}>
              <i className="ti ti-loader-2" style={{ fontSize: 14, marginRight: 6, verticalAlign: -2, animation: 'spin 1s linear infinite', display: 'inline-block' }} aria-hidden />
              Đang tạo {total} câu... ~20-30 giây
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          <button
            onClick={() => onGenerate({ countEasy: easy, countMedium: medium, countHard: hard, topic: topic.trim() || undefined })}
            disabled={disabled}
            style={{
              width: '100%',
              background: disabled ? 'rgba(232,168,50,0.30)' : COLOR.gold,
              color: '#1a1226', border: 'none', padding: '12px 18px',
              borderRadius: 8, fontSize: 14, fontWeight: 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <i className="ti ti-sparkles" style={{ fontSize: 16 }} aria-hidden />
            {tooLarge ? 'Tối đa 15 câu/lần' : overQuota ? 'Vượt quota AI hôm nay' : `Tạo ${total} câu · ${easy} dễ + ${medium} TB + ${hard} khó`}
          </button>
        </div>
      </div>
    </div>
  )
}

function chipBtn(): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.04)', color: COLOR.textSecondary,
    border: `1px solid ${COLOR.borderSubtle}`, padding: '5px 11px',
    borderRadius: 999, fontSize: 11, cursor: 'pointer',
  }
}
