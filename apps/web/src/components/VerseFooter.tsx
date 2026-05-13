import { getDailyVerse } from '../data/verses'

interface VerseFooterProps {
  /** Override the daily verse for tests / preview contexts. */
  verse?: { text: string; ref: string }
  /** Source translation note appended to the cite line. Default = "BTTHĐ 2011"
   *  per CLAUDE.md C4 canonical (Vietnamese audience). */
  source?: string
}

/**
 * Footer-style verse — Cormorant Garamond italic 22px with a gold
 * drop cap (`.hr-verse-text::first-letter` rule in global.css), gold
 * line + star ornament above, em-dash uppercase cite below. Per
 * home_modern.html `.verse-section`. This is the ONLY component allowed
 * to render Cormorant Garamond per HR-1 typography rules.
 */
export default function VerseFooter({ verse, source = 'BTTHĐ 2011' }: VerseFooterProps = {}) {
  const v = verse ?? getDailyVerse()

  return (
    <section
      data-testid="verse-footer"
      className="relative mt-8 pt-7"
    >
      {/* Ornament: line · star · line */}
      <div
        aria-hidden
        data-testid="verse-footer-ornament"
        className="flex items-center justify-center gap-3 mb-4"
      >
        <span
          className="flex-1 max-w-[160px] h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(232,168,50,0.4), transparent)',
          }}
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#e8a832"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
        >
          <path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
        </svg>
        <span
          className="flex-1 max-w-[160px] h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(232,168,50,0.4), transparent)',
          }}
        />
      </div>

      <p
        data-testid="verse-footer-text"
        className="hr-verse-text font-verse italic text-[18px] md:text-[22px] font-medium text-ivory text-center max-w-[720px] mx-auto px-4 md:px-8 leading-[1.55]"
      >
        {v.text}
      </p>

      <div
        data-testid="verse-footer-cite"
        className="text-center mt-4 text-[11px] font-semibold tracking-[0.22em] text-ivory-dim uppercase"
      >
        <span className="text-ivory-faint mr-2">—</span>
        {v.ref} · {source}
        <span className="text-ivory-faint ml-2">—</span>
      </div>
    </section>
  )
}
