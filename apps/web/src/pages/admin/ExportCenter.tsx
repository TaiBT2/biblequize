import React from 'react'

const EXPORTS = [
  { type: 'questions', icon: 'quiz', label: 'Câu hỏi', desc: 'Xuất toàn bộ câu hỏi với đáp án + giải thích', formats: ['CSV', 'JSON'] },
  { type: 'users', icon: 'group', label: 'Người dùng', desc: 'Danh sách users với role, tier, streak', formats: ['CSV', 'Excel'] },
  { type: 'leaderboard', icon: 'leaderboard', label: 'Bảng xếp hạng', desc: 'Top players theo season/period', formats: ['CSV', 'PDF'] },
  { type: 'groups', icon: 'church', label: 'Nhóm', desc: 'Groups với members và analytics', formats: ['CSV', 'Excel'] },
  { type: 'analytics', icon: 'analytics', label: 'Analytics', desc: 'Sessions, user activity, retention', formats: ['CSV', 'JSON'] },
]

export default function ExportCenter() {
  const handleExport = (type: string, format: string) => {
    alert(`Export ${type} as ${format} — API chưa implement`)
  }

  return (
    <div data-testid="admin-export-page" className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#e1e1ef] tracking-tight">Export Center</h1>
        <p className="text-[#d5c4af] text-sm">Xuất dữ liệu hệ thống</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORTS.map(e => (
          <div key={e.type} data-testid={`export-${e.type}-card`} className="bg-[#1d1f29] rounded-lg border border-[#504535]/10 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0c0e17] text-[#e8a832] rounded">
                <span className="material-symbols-outlined">{e.icon}</span>
              </div>
              <div><h4 className="font-semibold text-[#e1e1ef]">{e.label}</h4><p className="text-[#d5c4af]/40 text-xs">{e.desc}</p></div>
            </div>
            <div className="flex gap-2">
              {e.formats.map(f => (
                <button key={f} onClick={() => handleExport(e.type, f)}
                  className="px-4 py-1.5 bg-[#11131c] border border-[#504535]/20 rounded text-xs text-[#e1e1ef] hover:bg-[#32343e] transition-colors font-medium">{f}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
