// BL-AD-8: hardcoded hex tokens per C3/C4. NEVER use `var(--input-bg)` here —
// known production bug where it renders white on input/textarea elements.
import type React from 'react'

export const COLOR = {
  bgDeep: '#0a0c14',
  bgPanel: '#11131e',
  bgSection: '#0d0f18',
  inputBg: '#1a1d2e',
  borderSubtle: 'rgba(255,255,255,0.08)',
  borderXSubtle: 'rgba(255,255,255,0.06)',
  gold: '#e8a832',
  goldBg: 'rgba(232,168,50,0.10)',
  goldBgStrong: 'rgba(232,168,50,0.15)',
  goldBorder: 'rgba(232,168,50,0.30)',
  goldFocus: 'rgba(232,168,50,0.25)',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#ef4444',
  textPrimary: '#ffffff',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
  textDisabled: '#6b7280',
} as const

export const DARK_INPUT_STYLE: React.CSSProperties = {
  background: COLOR.inputBg,
  border: `1px solid ${COLOR.borderSubtle}`,
  color: COLOR.textPrimary,
  padding: '9px 12px',
  borderRadius: 7,
  fontSize: 13,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
}

export const DARK_INPUT_FOCUS_STYLE: React.CSSProperties = {
  ...DARK_INPUT_STYLE,
  borderColor: COLOR.goldFocus,
}

export const DARK_TEXTAREA_STYLE: React.CSSProperties = {
  ...DARK_INPUT_STYLE,
  resize: 'none',
  lineHeight: 1.5,
}

export const DIFFICULTY_COLORS = {
  easy:   { bg: 'rgba(74,222,128,0.06)',  border: 'rgba(74,222,128,0.30)',  accent: '#4ade80', chip: 'rgba(74,222,128,0.12)' },
  medium: { bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.30)',  accent: '#fbbf24', chip: 'rgba(251,191,36,0.12)' },
  hard:   { bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.30)',   accent: '#ef4444', chip: 'rgba(239,68,68,0.12)' },
} as const

// Canonical answer color mapping A/B/C/D per C2 (Coral / Sky / Gold / Sage).
export const ANSWER_OPTION_COLORS = [
  { letter: 'A', bg: 'rgba(255,107,107,0.15)', text: '#ff8585', border: 'rgba(255,107,107,0.30)' },
  { letter: 'B', bg: 'rgba(74,164,255,0.15)',  text: '#8ec6ff', border: 'rgba(74,164,255,0.30)'  },
  { letter: 'C', bg: 'rgba(232,168,50,0.15)',  text: '#e8a832', border: 'rgba(232,168,50,0.30)'  },
  { letter: 'D', bg: 'rgba(132,204,141,0.15)', text: '#a8d8ad', border: 'rgba(132,204,141,0.30)' },
] as const

export type DifficultyKey = keyof typeof DIFFICULTY_COLORS
