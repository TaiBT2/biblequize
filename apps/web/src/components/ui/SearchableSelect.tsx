import React, { useEffect, useMemo, useRef, useState } from 'react'

export interface SearchableOption {
  value: string
  label: string
}

interface Props {
  options: SearchableOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allLabel?: string
}

const SearchableSelect: React.FC<Props> = ({ options, value, onChange, placeholder = 'Chọn...', allLabel = 'Tất cả' }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(() => options.find(o => o.value === value)?.label ?? allLabel, [options, value, allLabel])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full p-3 bg-white border-2 border-[#d6cfc4] rounded-xl text-[#4a3f35] font-semibold focus:border-[#4bbf9f] focus:outline-none flex items-center justify-between hover:border-[#4bbf9f] transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-left truncate">{selected || placeholder}</span>
        <svg className={`w-4 h-4 text-[#8a7a6e] transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border-2 border-[#d6cfc4] bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[#e8e0d5]">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder || 'Tìm kiếm...'}
              className="w-full p-2 rounded-lg bg-[#f9f6f1] text-[#4a3f35] placeholder-[#b0a090] focus:outline-none border border-[#d6cfc4] focus:border-[#4bbf9f] text-sm"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm font-semibold transition-colors ${value === '' ? 'bg-[#edfaf5] text-[#2e7a65]' : 'text-[#4a3f35] hover:bg-[#f5f0ea]'}`}
              >{allLabel}</button>
            </li>
            {filtered.map(opt => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${value === opt.value ? 'bg-[#edfaf5] text-[#2e7a65] font-semibold' : 'text-[#4a3f35] hover:bg-[#f5f0ea]'}`}
                >{opt.label}</button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-[#a09080]">Không tìm thấy</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect


