// MPP-4 — Placeholder for /solo-arena route. Real implementation tracked
// as BL-MP-SOLO. Keeps the Solo Arena entry card + empty-state soft-link
// from breaking with a 404.

import { useNavigate } from 'react-router-dom'

export default function SoloArenaPlaceholder() {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-center px-4 py-16" style={{ background: '#11131e' }}>
      <div className="max-w-md text-center">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#fff', fontVariationSettings: "'FILL' 1" }}>
            person
          </span>
        </div>

        <div className="text-[11px] tracking-[0.2em] uppercase font-bold mb-2" style={{ color: '#a5b4fc' }}>
          Sắp ra mắt
        </div>
        <h1 className="text-[32px] font-extrabold mb-3 text-white">Solo Arena</h1>
        <p className="text-[14px] text-white/65 mb-6 leading-relaxed">
          Chế độ chơi 1 mình với câu hỏi ngẫu nhiên từ hệ thống hoặc AI sinh.
          Đang được xây dựng — sẽ ra mắt trong sprint tới.
        </p>

        <button
          onClick={() => navigate('/multiplayer')}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-lg font-bold text-[14px] text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Quay về Phòng Chơi
        </button>
      </div>
    </div>
  )
}
