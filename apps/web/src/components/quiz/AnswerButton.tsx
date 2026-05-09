import React from 'react'
import { clsx } from 'clsx'

export type AnswerState =
  | 'default'      // not picked, before reveal
  | 'selected'     // user picked, awaiting reveal
  | 'correct'      // showResult: this option is the correct answer
  | 'wrong'        // showResult: user picked this and it was wrong
  | 'eliminated'   // hint lifeline removed this option
  | 'disabled'     // showResult: not the correct answer, not user's wrong pick

interface AnswerButtonProps {
  index: 0 | 1 | 2 | 3
  letter: 'A' | 'B' | 'C' | 'D'
  text: string
  state: AnswerState
  onClick?: () => void
  testId?: string
  /** QM-4: when true, mobile (<md) uses compact size (44px min-h, smaller
   *  padding/letter/text) — used when the question is very long so answers
   *  don't push content off-screen. Desktop layout is unchanged either way. */
  compact?: boolean
  /** Multiplayer reveal context (mockup state ②/④). When true on a
   *  `correct` state, renders the "✓ ĐÚNG · BẠN CHỌN" badge instead of
   *  the bare "✓ ĐÁP ÁN" badge. Defaults to true so single-player flows
   *  (where the user is always the picker) keep their existing label. */
  pickedByUser?: boolean
}

// Per-position color classes. Tailwind JIT needs literal class strings, so we
// cannot template `bg-answer-${color}` — every variant must appear here as a
// real string.
const COLORS = [
  // 0 = A → Coral
  {
    btnDefault: 'border-answer-a/30 bg-answer-a/10 hover:bg-answer-a/20',
    btnSelected: 'border-answer-a bg-answer-a/20 ring-2 ring-answer-a/40',
    btnFaded: 'border-answer-a/15 bg-answer-a/5',
    letterDefault: 'bg-answer-a/20 text-answer-a',
    letterSelected: 'bg-answer-a/30 text-answer-a',
  },
  // 1 = B → Sky
  {
    btnDefault: 'border-answer-b/30 bg-answer-b/10 hover:bg-answer-b/20',
    btnSelected: 'border-answer-b bg-answer-b/20 ring-2 ring-answer-b/40',
    btnFaded: 'border-answer-b/15 bg-answer-b/5',
    letterDefault: 'bg-answer-b/20 text-answer-b',
    letterSelected: 'bg-answer-b/30 text-answer-b',
  },
  // 2 = C → Gold (warmer than primary gold)
  {
    btnDefault: 'border-answer-c/30 bg-answer-c/10 hover:bg-answer-c/20',
    btnSelected: 'border-answer-c bg-answer-c/20 ring-2 ring-answer-c/40',
    btnFaded: 'border-answer-c/15 bg-answer-c/5',
    letterDefault: 'bg-answer-c/20 text-answer-c',
    letterSelected: 'bg-answer-c/30 text-answer-c',
  },
  // 3 = D → Sage
  {
    btnDefault: 'border-answer-d/30 bg-answer-d/10 hover:bg-answer-d/20',
    btnSelected: 'border-answer-d bg-answer-d/20 ring-2 ring-answer-d/40',
    btnFaded: 'border-answer-d/15 bg-answer-d/5',
    letterDefault: 'bg-answer-d/20 text-answer-d',
    letterSelected: 'bg-answer-d/30 text-answer-d',
  },
] as const

const FILL_STYLE = { fontVariationSettings: "'FILL' 1" } as const

export const AnswerButton: React.FC<AnswerButtonProps> = ({
  index,
  letter,
  text,
  state,
  onClick,
  testId,
  compact = false,
  pickedByUser = true,
}) => {
  const color = COLORS[index]
  const isInteractive = state === 'default' || state === 'selected'

  let btnClasses: string
  let letterClasses: string
  let textClasses: string
  let trailingIcon: React.ReactNode = null
  let inlineStyle: React.CSSProperties | undefined

  switch (state) {
    case 'default':
      btnClasses = clsx('border-2', color.btnDefault)
      letterClasses = color.letterDefault
      textClasses = 'text-on-surface'
      break
    case 'selected':
      btnClasses = clsx('border-2', color.btnSelected, 'gold-glow')
      letterClasses = color.letterSelected
      textClasses = 'text-on-surface'
      break
    case 'correct':
      // Mockup state ②/④: rgba(74,222,128,0.18) bg, border-2 #4ade80,
      // green-gradient letter chip, plain emerald-400 10px badge text
      // (NOT a pill, NOT a material icon — just "✓ ĐÚNG · BẠN CHỌN").
      btnClasses = 'answer-correct-anim border-2'
      letterClasses = 'text-white shadow-lg answer-letter-green-grad'
      textClasses = 'text-white font-semibold'
      inlineStyle = {
        background: 'rgba(74,222,128,0.18)',
        borderColor: '#4ade80',
        boxShadow: '0 0 24px rgba(74,222,128,0.25)',
      }
      trailingIcon = (
        <span
          className="text-[10px] font-bold whitespace-nowrap"
          style={{ color: '#4ade80' }}
        >
          ✓ {pickedByUser ? 'ĐÚNG · BẠN CHỌN' : 'ĐÁP ÁN'}
        </span>
      )
      break
    case 'wrong':
      // Mockup state ④: rgba(239,68,68,0.15) bg, border-2 #ef4444,
      // red-gradient letter chip, plain red-400 10px badge.
      btnClasses = 'answer-wrong-anim border-2'
      letterClasses = 'text-white shadow-lg answer-letter-red-grad'
      textClasses = 'text-white font-semibold'
      inlineStyle = {
        background: 'rgba(239,68,68,0.15)',
        borderColor: '#ef4444',
      }
      trailingIcon = (
        <span
          className="text-[10px] font-bold whitespace-nowrap"
          style={{ color: '#f87171' }}
        >
          ✗ BẠN CHỌN
        </span>
      )
      break
    case 'eliminated':
      btnClasses = clsx('border-2', color.btnFaded, 'opacity-40 pointer-events-none')
      letterClasses = clsx(color.letterDefault, 'line-through opacity-60')
      textClasses = 'text-on-surface-variant line-through'
      trailingIcon = (
        <span
          className="material-symbols-outlined text-on-surface-variant text-2xl opacity-60"
          aria-hidden="true"
        >
          close
        </span>
      )
      break
    case 'disabled':
    default:
      // Mockup spec: border-transparent + opacity-25 (was 0.6, too loud).
      // Per-letter color is preserved on the letter chip so the user
      // still gets the position-color cue while the row is dimmed.
      btnClasses = 'border border-transparent opacity-25 bg-transparent'
      letterClasses = color.letterDefault
      textClasses = 'text-white'
      break
  }

  return (
    <button
      type="button"
      data-testid={testId}
      data-answer-index={index}
      data-answer-state={state}
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      aria-disabled={!isInteractive}
      data-compact={compact || undefined}
      className={clsx(
        'group relative flex items-center rounded-2xl',
        'transition-all duration-200 text-left active:scale-[0.98]',
        compact
          ? 'gap-2.5 md:gap-4 p-2.5 md:p-5 min-h-[44px] md:min-h-[64px]'
          : 'gap-4 p-4 md:p-5 min-h-[64px]',
        btnClasses,
      )}
      style={inlineStyle}
    >
      <div
        className={clsx(
          'flex items-center justify-center rounded-lg',
          'font-medium flex-shrink-0',
          compact ? 'w-7 h-7 md:w-9 md:h-9 text-sm md:text-base' : 'w-9 h-9 text-base',
          letterClasses,
        )}
      >
        {letter}
      </div>
      <span className={clsx(
        'flex-1 font-medium leading-snug',
        compact ? 'text-xs md:text-base' : 'text-sm md:text-base',
        textClasses,
      )}>
        {text}
      </span>
      {trailingIcon && (
        <div className="flex-shrink-0">{trailingIcon}</div>
      )}
    </button>
  )
}

export default AnswerButton
