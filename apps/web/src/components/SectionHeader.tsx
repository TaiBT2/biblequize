interface SectionHeaderProps {
  title: string
  /** Optional middle gold em-dashed flavor tag (uppercase tracked) — e.g.
   *  "— Quest Map —", "— Daily Quests —". Render order: title · tag · meta. */
  tag?: string
  /** Optional right-aligned secondary text. Hidden when omitted. */
  meta?: string
  className?: string
}

/**
 * HRV-8 vintage section header — Yeseva One display title, optional middle
 * gold tag, optional right meta. Replaces the prior Modern Spiritual style
 * (small-caps + accent bar). Match `docs/designs/biblequiz/Home.html`
 * `.section-h` block.
 */
export default function SectionHeader({
  title,
  tag,
  meta,
  className = '',
}: SectionHeaderProps) {
  return (
    <div
      data-testid="section-header"
      className={`flex items-baseline flex-wrap gap-x-4 gap-y-1 mt-10 mb-4 ${className}`}
    >
      <h2
        data-testid="section-header-title"
        className="font-display text-[22px] md:text-[28px] leading-none text-ivory"
      >
        {title}
      </h2>
      {tag && (
        <span
          data-testid="section-header-tag"
          className="text-[11px] font-semibold tracking-[0.24em] uppercase text-secondary"
        >
          — {tag} —
        </span>
      )}
      {meta && (
        <span
          data-testid="section-header-meta"
          className="ml-auto text-[12px] text-ivory-faint font-medium"
        >
          {meta}
        </span>
      )}
    </div>
  )
}
