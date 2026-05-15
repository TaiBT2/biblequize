// QP-6.5 — Modal popup mở khi user bấm "Đấu Nhanh" trên hero card
// (QP-6) hoặc empty state (QP-8). User chọn mode + scope + count + time
// + source rồi submit → POST /api/rooms/quick-match (QP-11) → navigate
// /room/{id}/lobby (QP-10 sẽ render indigo banner thay Quản trò).
//
// Pattern: controlled form trong overlay, Esc + click backdrop dismiss.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODE_LIST, MODE_META, type RoomModeId } from '../create-room/modeMeta'
import {
  describeQuickMatchError, triggerQuickMatch,
  type QuickMatchConfig, type QuickMatchSource,
} from '../../api/quickMatch'

const BOOK_SCOPE_OPTIONS = [
  { value: 'ALL',           label: 'Tất cả 66 sách' },
  { value: 'OLD_TESTAMENT', label: 'Cựu Ước (39)' },
  { value: 'NEW_TESTAMENT', label: 'Tân Ước (27)' },
  { value: 'GOSPELS',       label: '4 Phúc Âm' },
]
const COUNT_OPTIONS = [5, 10, 15, 20]
const TIME_OPTIONS = [15, 20, 30]
const INDIGO = '#6366f1'

interface Props {
  open: boolean
  onClose: () => void
  /** Required to gate AI source. Pass tier level from auth store. */
  userTier?: number
}

export default function QuickMatchConfigModal({ open, onClose, userTier = 1 }: Props) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<RoomModeId>('SPEED_RACE')
  const [bookScope, setBookScope] = useState('ALL')
  const [count, setCount] = useState(10)
  const [time, setTime] = useState(30)
  const [source, setSource] = useState<QuickMatchSource>('DATABASE')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const aiUnlocked = userTier >= 4

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async () => {
    setSubmitting(true); setError(null)
    try {
      const config: QuickMatchConfig = {
        mode, bookScope,
        questionCount: count,
        timePerQuestion: time,
        source: aiUnlocked ? source : 'DATABASE',
        language: 'vi',
      }
      const res = await triggerQuickMatch(config)
      navigate(`/room/${res.room.id}/lobby`)
    } catch (e) {
      setError(describeQuickMatchError(e).message)
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[520px] rounded-2xl"
        style={{
          background: 'rgba(50,52,64,0.95)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${INDIGO}40`,
          boxShadow: `0 24px 64px -16px ${INDIGO}40`,
        }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-start justify-between">
          <div>
            <div className="text-[10px] tracking-widest uppercase font-bold mb-1" style={{ color: '#a5b4fc' }}>
              Cấu hình nhanh
            </div>
            <h2 className="text-[20px] font-extrabold text-white">Đấu Nhanh</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.06]"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Mode */}
          <Section label="Chế độ">
            <div className="grid grid-cols-2 gap-2">
              {MODE_LIST.map(m => {
                const active = mode === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className="flex items-center gap-2 px-3 h-10 rounded-lg text-[12px] font-semibold transition-colors text-left"
                    style={{
                      background: active ? hexAlpha(m.color, 0.18) : 'rgba(17,19,30,0.5)',
                      border: `1px solid ${active ? m.color : 'rgba(255,255,255,0.08)'}`,
                      color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: m.color }}>{m.icon}</span>
                    {modeLabel(m.id)}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Scope */}
          <Section label="Phạm vi câu hỏi">
            <select
              value={bookScope}
              onChange={e => setBookScope(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-[13px] text-white outline-none appearance-none cursor-pointer"
              style={{
                background: 'rgba(17,19,30,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {BOOK_SCOPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Section>

          {/* Count + Time */}
          <div className="grid grid-cols-2 gap-3">
            <Section label="Số câu">
              <ChipGroup options={COUNT_OPTIONS.map(n => ({ value: n, label: String(n) }))} value={count} onChange={setCount} />
            </Section>
            <Section label="Thời gian / câu">
              <ChipGroup options={TIME_OPTIONS.map(s => ({ value: s, label: `${s}s` }))} value={time} onChange={setTime} />
            </Section>
          </div>

          {/* Source */}
          <Section label="Nguồn câu hỏi">
            <div className="grid grid-cols-2 gap-2">
              <SourceButton
                active={source === 'DATABASE'}
                onClick={() => setSource('DATABASE')}
                icon="storage"
                title="Hệ thống"
                desc="Random từ ngân hàng"
              />
              <SourceButton
                active={source === 'AI_GENERATED'}
                onClick={() => aiUnlocked && setSource('AI_GENERATED')}
                disabled={!aiUnlocked}
                icon="auto_awesome"
                title="AI sinh"
                desc={aiUnlocked ? 'One-shot, không lưu' : 'Tier 4+ mở khóa'}
              />
            </div>
          </Section>

          {error && (
            <div
              className="px-3 py-2 rounded-lg text-[12px]"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
            >
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, #818cf8 100%)` }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rocket_launch</span>
            {submitting ? 'Đang tạo phòng...' : 'Vào trận'}
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </button>
          <p className="text-[10.5px] text-center text-white/40 mt-1">
            Không tính XP · Cap 3 trận/ngày · Server tự điều phối, không cần Quản trò
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Local subs ───────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] font-bold tracking-[0.08em] uppercase text-white/55 mb-1.5">{label}</div>
      {children}
    </div>
  )
}

function ChipGroup<T extends string | number>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(17,19,30,0.55)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {options.map(o => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className="flex-1 py-1.5 rounded-md text-[12px] transition-all"
            style={{
              background: active ? `linear-gradient(135deg, ${INDIGO}, #818cf8)` : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.65)',
              fontWeight: active ? 700 : 500,
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function SourceButton({
  active, onClick, disabled, icon, title, desc,
}: {
  active: boolean; onClick: () => void; disabled?: boolean;
  icon: string; title: string; desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-start gap-2 p-3 rounded-lg text-left transition-colors disabled:cursor-not-allowed"
      style={{
        background: active ? hexAlpha(INDIGO, 0.18) : 'rgba(17,19,30,0.5)',
        border: `1px solid ${active ? INDIGO : 'rgba(255,255,255,0.08)'}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        className="material-symbols-outlined flex-shrink-0"
        style={{ fontSize: 18, color: active ? INDIGO : '#a5b4fc', fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className={`text-[12px] font-bold ${active ? 'text-white' : 'text-white/80'}`}>{title}</div>
        <div className="text-[10px] text-white/45 mt-0.5">{desc}</div>
      </div>
    </button>
  )
}

function modeLabel(id: RoomModeId): string {
  switch (id) {
    case 'SPEED_RACE':    return 'Speed Race'
    case 'BATTLE_ROYALE': return 'Battle Royale'
    case 'TEAM_VS_TEAM':  return 'Team vs Team'
    case 'SUDDEN_DEATH':  return 'Đấu vương'
  }
}

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

// Reference MODE_META to satisfy unused-import lint (we use MODE_LIST/MODE_META.icon).
void MODE_META
