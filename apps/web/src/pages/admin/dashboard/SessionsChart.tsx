import React from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function SessionsChart({ totalSessions }: { totalSessions?: number }) {
  return (
    <div className="bg-[#1d1f29] p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-lg font-bold text-white">Sessions 7 ngày qua</h3>
          <p className="text-[10px] uppercase tracking-widest text-[#d5c4af]/50 mt-1">Lưu lượng truy cập hệ thống</p>
        </div>
        <span className="text-2xl font-black text-[#e8a832] font-mono">{totalSessions?.toLocaleString() ?? '—'} <span className="text-[10px] font-normal opacity-50 uppercase tracking-widest text-white">total</span></span>
      </div>
      <div className="relative h-48 w-full flex items-end justify-between px-2 pt-4">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="goldGradient" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#e8a832" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M 0 80 Q 15 70 25 75 T 40 40 T 60 55 T 80 20 T 100 30" fill="none" stroke="#e8a832" strokeWidth="2" />
          <path d="M 0 80 Q 15 70 25 75 T 40 40 T 60 55 T 80 20 T 100 30 V 100 H 0 Z" fill="url(#goldGradient)" fillOpacity="0.1" />
        </svg>
        <div className="absolute inset-0 border-b border-[#32343e] border-dashed h-1/2 opacity-20" />
        <div className="w-full flex justify-between relative z-10">
          {DAYS.map((day, i) => (
            <div key={day} className="relative flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full bg-[#e8a832] border-2 border-[#1d1f29] ${i === 0 ? 'shadow-[0_0_8px_#e8a832]' : ''}`} />
              <span className="text-[10px] mt-2 font-mono text-[#d5c4af]/40 uppercase tracking-tighter">{day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
