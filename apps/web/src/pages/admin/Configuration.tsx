import React, { useState } from 'react'

const CONFIG_CATEGORIES = {
  Game: [
    { key: 'DAILY_ENERGY', default: '100', label: 'Năng lượng mỗi ngày' },
    { key: 'ENERGY_REGEN_PER_HOUR', default: '20', label: 'Phục hồi năng lượng/giờ' },
    { key: 'DAILY_QUESTION_CAP', default: '100', label: 'Giới hạn câu ranked/ngày' },
    { key: 'STREAK_FREEZE_PER_WEEK', default: '1', label: 'Streak freeze/tuần' },
  ],
  Scoring: [
    { key: 'BASE_POINTS_EASY', default: '8', label: 'Điểm cơ bản Easy' },
    { key: 'BASE_POINTS_MEDIUM', default: '12', label: 'Điểm cơ bản Medium' },
    { key: 'BASE_POINTS_HARD', default: '18', label: 'Điểm cơ bản Hard' },
    { key: 'COMBO_THRESHOLD_1', default: '5', label: 'Combo level 1 (x1.2)' },
    { key: 'COMBO_THRESHOLD_2', default: '10', label: 'Combo level 2 (x1.5)' },
  ],
  AI: [
    { key: 'AI_DAILY_QUOTA', default: '200', label: 'Câu/ngày/admin' },
    { key: 'AI_COST_ALERT_USD', default: '10.00', label: 'Alert threshold ($)' },
    { key: 'AI_DEFAULT_MODEL', default: 'gemini', label: 'Model mặc định' },
  ],
  Room: [
    { key: 'ROOM_MAX_PLAYERS', default: '20', label: 'Max players/phòng' },
    { key: 'ROOM_CODE_LENGTH', default: '6', label: 'Độ dài mã phòng' },
    { key: 'ROOM_IDLE_TIMEOUT_MIN', default: '30', label: 'Timeout phòng (phút)' },
  ],
}

export default function ConfigurationAdmin() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())

  const getValue = (key: string, def: string) => values[key] ?? def
  const setValue = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }))
    setDirty(prev => new Set(prev).add(key))
  }

  const saveAll = () => {
    // TODO: POST /api/admin/config with changed values
    alert(`Lưu ${dirty.size} thay đổi (API chưa implement)`)
    setDirty(new Set())
  }

  return (
    <div data-testid="admin-config-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-extrabold text-[#e1e1ef] tracking-tight">Cấu hình hệ thống</h2><p className="text-[#d5c4af] text-sm mt-1">Protocol Environment Parameters</p></div>
        {dirty.size > 0 && (
          <button data-testid="config-save-btn" onClick={saveAll} className="px-4 py-2 bg-[#e8a832] text-[#281900] rounded-lg text-sm font-bold hover:brightness-110">
            Lưu {dirty.size} thay đổi
          </button>
        )}
      </div>

      {dirty.size > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-400 text-sm">
          ⚠️ Thay đổi ảnh hưởng tất cả người dùng ngay lập tức
        </div>
      )}

      {Object.entries(CONFIG_CATEGORIES).map(([category, items]) => (
        <div key={category} data-testid={`config-${category.toLowerCase()}-panel`} className="rounded-lg border border-[#504535]/10 bg-[#1d1f29] p-5">
          <h3 className="font-bold text-[#e1e1ef] mb-4">{category}</h3>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#d5c4af]">{item.label}</p>
                  <p className="text-[#d5c4af]/30 text-xs">{item.key} (default: {item.default})</p>
                </div>
                <input {...(item.key === 'DAILY_ENERGY' ? { 'data-testid': 'config-daily-energy-input' } : {})} value={getValue(item.key, item.default)} onChange={e => setValue(item.key, e.target.value)}
                  className={`w-24 bg-[#0c0e17] border-none rounded px-3 py-1 text-sm text-[#e1e1ef] text-right focus:ring-1 focus:ring-[#e8a832] outline-none ${dirty.has(item.key) ? 'ring-1 ring-amber-500/50' : ''}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
