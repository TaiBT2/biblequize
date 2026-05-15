// MPP-3 — Indigo hero card RIGHT (1/2 width) per canonical prompt §0.1.
// Entry point only — navigates to /solo-arena placeholder (MPP-4). Full
// Solo Arena implementation tracked as BL-MP-SOLO.

import { useNavigate } from 'react-router-dom'

const SOLO = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryLighter: '#a5b4fc',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
  tintBg: 'rgba(99,102,241,0.12)',
  tintBgSoft: 'rgba(99,102,241,0.04)',
  tintBorder: 'rgba(99,102,241,0.25)',
}

export default function SoloArenaEntryCard() {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate('/solo-arena')}
      className="rounded-2xl p-6 relative overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, ${SOLO.tintBg} 0%, ${SOLO.tintBgSoft} 100%)`,
        border: `1px solid ${SOLO.tintBorder}`,
        boxShadow: `0 0 24px -8px ${SOLO.tintBorder}`,
      }}
    >
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
      />

      {/* NEW badge with shimmer */}
      <div
        className="absolute top-5 right-5 flex items-center gap-1 px-2 py-1 rounded-md"
        style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}
      >
        <span
          className="material-symbols-outlined animate-pulse"
          style={{ fontSize: 12, color: SOLO.primaryLight, fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: SOLO.primaryLighter }}>
          Mới
        </span>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: SOLO.gradient }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff', fontVariationSettings: "'FILL' 1" }}>
              person
            </span>
          </div>
          <div className="text-[10px] tracking-widest uppercase font-bold" style={{ color: SOLO.primaryLighter }}>
            1 người chơi
          </div>
        </div>

        <h2 className="text-[20px] font-extrabold mb-1.5 leading-tight text-white">Solo Arena</h2>
        <p className="text-[12.5px] text-white/65 mb-4 leading-relaxed">
          Đấu trí 1 mình với câu hỏi ngẫu nhiên. Câu hỏi{' '}
          <strong className="text-white">chỉ xuất hiện</strong> khi bạn bấm bắt đầu — không thể xem trước.
        </p>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <SourceTag icon="casino" label="Hệ thống random" />
          <SourceTag icon="auto_awesome" label="AI sinh" />
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate('/solo-arena') }}
            className="flex items-center gap-2 h-11 px-5 rounded-lg text-[14px] font-bold transition-opacity hover:opacity-90"
            style={{ background: SOLO.gradient, color: '#fff' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              play_arrow
            </span>
            Bắt đầu Solo
          </button>
          <span className="text-[10px] text-white/35 text-right leading-tight whitespace-nowrap">
            Không vào<br />leaderboard
          </span>
        </div>
      </div>
    </div>
  )
}

function SourceTag({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      className="px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1"
      style={{
        background: 'rgba(99,102,241,0.1)',
        border: '1px solid rgba(99,102,241,0.2)',
        color: '#a5b4fc',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{icon}</span>
      {label}
    </span>
  )
}
