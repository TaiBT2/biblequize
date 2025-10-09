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
        className="neon-input w-full p-3 bg-gray-800 border border-cyan-400 rounded-lg focus:border-cyan-300 focus:outline-none flex items-center justify-between"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-left truncate text-gray-200">{selected || placeholder}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-cyan-400 bg-gray-900 shadow-xl">
          <div className="p-2 border-b border-cyan-400/40">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder || 'Tìm kiếm...'}
              className="w-full p-2 rounded bg-gray-800 text-gray-200 focus:outline-none border border-cyan-400/50 focus:border-cyan-300"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm ${value === '' ? 'bg-cyan-900/40 text-cyan-200' : 'text-gray-200 hover:bg-cyan-900/30'}`}
              >{allLabel}</button>
            </li>
            {filtered.map(opt => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                  className={`w-full text-left px-3 py-2 text-sm ${value === opt.value ? 'bg-cyan-900/40 text-cyan-200' : 'text-gray-200 hover:bg-cyan-900/30'}`}
                >{opt.label}</button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">Không tìm thấy</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect


