import { useTranslation } from 'react-i18next'

/**
 * DTAG — shared per-question difficulty badge, used across all quiz screens
 * (Luyện Tập / Đấu Hạng via Quiz, Daily Challenge, Multiplayer rooms).
 *
 * Reuses the existing `.badge-easy/.badge-medium/.badge-hard` CSS classes
 * (global.css) and `practice.easy/medium/hard` i18n keys — no new tokens.
 * Accepts difficulty in any case; returns null for missing/unknown values so
 * callers can drop it in unconditionally (AI/custom questions may omit it).
 */

type DifficultyMeta = { cls: string; labelKey: string }

export function difficultyMeta(difficulty?: string | null): DifficultyMeta | null {
  switch ((difficulty ?? '').toLowerCase()) {
    case 'easy':   return { cls: 'badge-easy',   labelKey: 'practice.easy' }
    case 'medium': return { cls: 'badge-medium', labelKey: 'practice.medium' }
    case 'hard':   return { cls: 'badge-hard',   labelKey: 'practice.hard' }
    default:       return null
  }
}

export default function DifficultyBadge({
  difficulty,
  className = '',
}: {
  difficulty?: string | null
  className?: string
}) {
  const { t } = useTranslation()
  const meta = difficultyMeta(difficulty)
  if (!meta) return null
  return (
    <span
      data-testid="question-difficulty-badge"
      className={`${meta.cls} inline-flex items-center ${className}`}
    >
      {t(meta.labelKey)}
    </span>
  )
}
