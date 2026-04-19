import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

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

const SearchableSelect: React.FC<Props> = ({ options, value, onChange, placeholder, allLabel }) => {
  const { t } = useTranslation()
  const effectivePlaceholder = placeholder ?? t('components.searchableSelect.chooseDefault')
  const effectiveAllLabel = allLabel ?? t('common.all')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(() => options.find(o => o.value === value)?.label ?? effectiveAllLabel, [options, value, effectiveAllLabel])
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
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%', padding: '10px 14px',
          background: 'rgba(255,255,255,.04)',
          border: `1px solid ${open ? 'rgba(212,168,67,.4)' : 'rgba(212,168,67,.15)'}`,
          borderRadius: '10px',
          color: value ? 'var(--hp-text)' : 'var(--hp-muted)',
          fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: '.875rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'border-color .2s',
        }}
      >
        <span style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected || effectivePlaceholder}
        </span>
        <svg
          style={{ width: '14px', height: '14px', color: 'var(--hp-muted)', flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', zIndex: 50, marginTop: '4px', width: '100%',
          background: 'var(--hp-card)',
          border: '1px solid rgba(212,168,67,.2)',
          borderRadius: '12px',
          boxShadow: '0 16px 40px rgba(0,0,0,.5)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={effectivePlaceholder || t('common.search')}
              style={{
                width: '100%', padding: '8px 10px',
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(212,168,67,.12)',
                borderRadius: '8px',
                color: 'var(--hp-text)',
                fontFamily: "'Nunito', sans-serif", fontSize: '.85rem',
                outline: 'none',
              }}
            />
          </div>
          <ul role="listbox" style={{ maxHeight: '224px', overflowY: 'auto', padding: '4px 0' }}>
            <li>
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 14px',
                  fontSize: '.85rem', fontWeight: value === '' ? 700 : 600,
                  background: value === '' ? 'rgba(212,168,67,.1)' : 'transparent',
                  color: value === '' ? 'var(--hp-gold)' : 'var(--hp-muted)',
                  border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { if (value !== '') e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
                onMouseLeave={e => { if (value !== '') e.currentTarget.style.background = 'transparent' }}
              >{effectiveAllLabel}</button>
            </li>
            {filtered.map(opt => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery('') }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 14px',
                    fontSize: '.85rem', fontWeight: value === opt.value ? 700 : 600,
                    background: value === opt.value ? 'rgba(212,168,67,.1)' : 'transparent',
                    color: value === opt.value ? 'var(--hp-gold)' : 'var(--hp-text)',
                    border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
                  onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.background = 'transparent' }}
                >{opt.label}</button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li style={{ padding: '8px 14px', fontSize: '.85rem', color: 'var(--hp-muted)', fontFamily: "'Nunito', sans-serif" }}>
                {t('components.searchableSelect.noMatch')}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect
