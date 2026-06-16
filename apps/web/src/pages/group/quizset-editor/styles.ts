// "Khung Sáng" (light) tokens. Literal hex required — NEVER use `var(--bq-*)`
// here: known production bug where CSS vars render white on input/textarea
// elements. Values mirror the resolved bq palette in src/styles/tokens.css.
import type React from 'react'

export const COLOR = {
  bgDeep: '#FBFAF5',        // bq-paper (page)
  bgPanel: '#FFFFFF',       // bq-white (cards / panels / top bar)
  bgSection: '#FBFAF5',     // bq-paper (editor pane)
  inputBg: '#FFFFFF',       // bq-white (inputs)
  borderSubtle: '#E7E4DA',  // bq-hairline
  borderXSubtle: '#E7E4DA', // bq-hairline
  gold: '#D97F06',          // bq-amber-deep (contrast-safe accent on light)
  goldBg: 'rgba(245,158,11,0.10)',
  goldBgStrong: 'rgba(245,158,11,0.15)',
  goldBorder: 'rgba(245,158,11,0.30)',
  goldFocus: 'rgba(245,158,11,0.25)',
  success: '#0E8A6B',       // bq-emerald
  warning: '#F59E0B',       // bq-amber
  danger: '#E0354B',        // bq-ruby (error)
  textPrimary: '#16151B',   // bq-ink
  textSecondary: '#6C6A62', // bq-ink-soft
  textMuted: '#6C6A62',     // bq-ink-soft
  textDisabled: '#A8A69C',  // bq-ink-faint
} as const

// Khung Sáng CTA — warm action gradient (mirrors --bq-action) + white text.
// Used for the primary "publish / save / generate / add" buttons that were
// solid gold on the dark theme.
export const ACTION_BG = 'linear-gradient(135deg, #FF9D2E 0%, #FF5A45 55%, #E0354B 100%)'
export const ACTION_BG_DISABLED = 'rgba(224,53,75,0.30)'
export const ACTION_FG = '#FFFFFF'
export const ACTION_SHADOW = '0 16px 34px -12px rgba(224,53,75,0.6), 0 4px 16px -6px rgba(245,158,11,0.55)'
// Neutral sunken fill (replaces translucent-white fills that vanish on paper).
export const INSET_BG = '#F2F0E7' // bq-paper-sunk

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
  easy:   { bg: 'rgba(14,138,107,0.08)',  border: 'rgba(14,138,107,0.30)',  accent: '#0E8A6B', chip: 'rgba(14,138,107,0.12)' },
  medium: { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.30)',  accent: '#D97F06', chip: 'rgba(245,158,11,0.14)' },
  hard:   { bg: 'rgba(224,53,75,0.08)',   border: 'rgba(224,53,75,0.30)',   accent: '#E0354B', chip: 'rgba(224,53,75,0.12)' },
} as const

// Canonical answer color mapping A/B/C/D per C2 (Coral / Sky / Gold / Sage),
// retuned for contrast on the light "Khung Sáng" surface.
export const ANSWER_OPTION_COLORS = [
  { letter: 'A', bg: 'rgba(224,53,75,0.12)',  text: '#E0354B', border: 'rgba(224,53,75,0.30)' },
  { letter: 'B', bg: 'rgba(45,70,200,0.12)',  text: '#2D46C8', border: 'rgba(45,70,200,0.30)' },
  { letter: 'C', bg: 'rgba(245,158,11,0.14)', text: '#D97F06', border: 'rgba(245,158,11,0.30)' },
  { letter: 'D', bg: 'rgba(14,138,107,0.12)', text: '#0E8A6B', border: 'rgba(14,138,107,0.30)' },
] as const

export type DifficultyKey = keyof typeof DIFFICULTY_COLORS
