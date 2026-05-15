// MLR — Friendly empty state per mockup: gold sparkles icon, encouraging
// copy, and 4 quick-create buttons (one per mode).

import { useNavigate } from 'react-router-dom'
import { MODE_LIST } from '../create-room/modeMeta'

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

const QUICK_LABEL: Record<string, string> = {
  SPEED_RACE: 'Speed Race',
  BATTLE_ROYALE: 'Battle Royale',
  TEAM_VS_TEAM: 'Team vs Team',
  SUDDEN_DEATH: 'Đấu vương',
}

export default function EmptyState() {
  const navigate = useNavigate()
  return (
    <div
      className="rounded-2xl p-10"
      style={{
        background: 'rgba(50,52,64,0.4)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="text-center max-w-md mx-auto">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
          style={{
            background: 'linear-gradient(135deg, rgba(232,168,50,0.12), rgba(231,194,104,0.04))',
            border: '1px solid rgba(232,168,50,0.2)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#e8a832', fontVariationSettings: "'FILL' 1" }}>
            auto_awesome
          </span>
        </div>

        <h4 className="text-[18px] font-bold mb-2 text-white">
          Chưa có phòng nào đang chờ
        </h4>
        <p className="text-[13px] text-white/55 leading-relaxed mb-6">
          Bạn là người tiên phong! Tạo phòng đầu tiên và mời bạn bè — chỉ mất 30 giây để bắt đầu trận đấu.
        </p>

        <div className="text-[10px] tracking-widest uppercase text-white/40 font-bold mb-3">
          Tạo nhanh theo chế độ
        </div>
        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto mb-6">
          {MODE_LIST.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => navigate(`/room/create?mode=${m.id}`)}
              className="flex items-center justify-center gap-2 px-3 h-10 rounded-lg text-[12px] font-semibold transition-colors"
              style={{
                background: hexToRgba(m.color, 0.08),
                border: `1px solid ${hexToRgba(m.color, 0.25)}`,
                color: '#fff',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = hexToRgba(m.color, 0.5) }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = hexToRgba(m.color, 0.25) }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: m.color, fontVariationSettings: "'FILL' 1" }}>
                {m.icon}
              </span>
              {QUICK_LABEL[m.id] ?? m.id}
            </button>
          ))}
        </div>

        {/* Solo Arena soft-link removed in QP-7 — concept pivoted to
            Quick Match (Đấu Nhanh). QP-8 will replace this entire empty
            state with the 2-CTA layout per mockup v3. */}
      </div>
    </div>
  )
}
