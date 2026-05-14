import { useTranslation } from 'react-i18next'

interface HeroRankedCardProps {
  energyRemaining: number
  energyMax: number
  rankedAnswered: number
  rankedCap: number
  onEnter: () => void
  /**
   * Optional override. Default = "Tiếp theo · Bước vào đấu trường"
   * (Daily-done state). For Daily-todo state callers can pass
   * "Cạnh tranh · Ranking · Phần thưởng mùa".
   */
  label?: string
  /**
   * Optional override. Default = "Daily xong rồi — giờ cạnh tranh ranking thôi"
   * (Daily-done state). For Daily-todo state callers can pass
   * "Cạnh tranh ranking · Sẵn sàng thách thức chưa?".
   */
  tagline?: string
}

/**
 * State B hero — full gold-gradient Ranked card promoted to top after
 * Daily Challenge is completed. Per home_modern.html `.hero-ranked`.
 * Title uses t('gameModes.ranked') = "Đấu Hạng" (C2 lock).
 */
export default function HeroRankedCard({
  energyRemaining,
  energyMax,
  rankedAnswered,
  rankedCap,
  onEnter,
  label = 'Tiếp theo · Bước vào đấu trường',
  tagline = 'Daily xong rồi — giờ cạnh tranh ranking thôi',
}: HeroRankedCardProps) {
  const { t } = useTranslation()
  return (
    <div
      data-testid="hero-ranked-card"
      className="relative overflow-hidden rounded-[20px] p-6 md:p-8 mb-3.5 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
      onClick={onEnter}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEnter()
        }
      }}
      style={{
        background: 'linear-gradient(135deg, #e8a832 0%, #c98a1c 55%, #7a5818 100%)',
        boxShadow:
          '0 18px 50px -10px rgba(232,168,50,0.30), 0 0 0 1px rgba(232,168,50,0.4), inset 0 1px 0 rgba(255,220,140,0.4)',
      }}
    >
      {/* Radial gold highlight (overlay so jsdom can parse styles cleanly) */}
      <div
        data-testid="hero-ranked-card-highlight"
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 400px 200px at 30% 0%, rgba(255,220,140,0.20), transparent 60%)',
        }}
      />
      {/* Variant B ornament — Cross + Sunburst per
          docs/designs/hero_ornament_options.html (Bui choice 2026-05-14).
          Vertically centered, slotted in the negative space between the
          left content column and the right CTA. Hidden on mobile to
          avoid colliding with the stacked CTA. */}
      <svg
        data-testid="hero-ranked-card-ornament"
        aria-hidden
        className="hidden md:block absolute top-1/2 -translate-y-1/2 right-[220px] w-[200px] h-[200px] pointer-events-none"
        style={{ opacity: 0.14, color: '#1a1208' }}
        viewBox="0 0 200 200"
        fill="none"
      >
        {/* Sunburst — 8 main rays */}
        <g stroke="currentColor" strokeWidth="1.5" opacity="0.55">
          <line x1="100" y1="100" x2="100" y2="20" />
          <line x1="100" y1="100" x2="100" y2="180" />
          <line x1="100" y1="100" x2="20" y2="100" />
          <line x1="100" y1="100" x2="180" y2="100" />
          <line x1="100" y1="100" x2="160" y2="40" />
          <line x1="100" y1="100" x2="40" y2="40" />
          <line x1="100" y1="100" x2="160" y2="160" />
          <line x1="100" y1="100" x2="40" y2="160" />
        </g>
        {/* Sunburst — 8 secondary rays */}
        <g stroke="currentColor" strokeWidth="1" opacity="0.35">
          <line x1="100" y1="100" x2="140" y2="25" />
          <line x1="100" y1="100" x2="60" y2="25" />
          <line x1="100" y1="100" x2="175" y2="60" />
          <line x1="100" y1="100" x2="25" y2="60" />
          <line x1="100" y1="100" x2="175" y2="140" />
          <line x1="100" y1="100" x2="25" y2="140" />
          <line x1="100" y1="100" x2="140" y2="175" />
          <line x1="100" y1="100" x2="60" y2="175" />
        </g>
        {/* Inner halo */}
        <circle
          cx="100"
          cy="100"
          r="50"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.5"
          fill="rgba(26,18,8,0.08)"
        />
        {/* Cross */}
        <path
          d="M92 60 L108 60 L108 92 L140 92 L140 108 L108 108 L108 160 L92 160 L92 108 L60 108 L60 92 L92 92 Z"
          fill="currentColor"
        />
        {/* Cross center decoration */}
        <circle cx="100" cy="100" r="6" fill="rgba(26,18,8,0.15)" />
      </svg>

      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 md:gap-7 items-center">
        <div>
          <div
            data-testid="hero-ranked-card-label"
            className="text-[10px] font-bold tracking-[0.22em] uppercase mb-2"
            style={{ color: 'rgba(26,18,8,0.7)' }}
          >
            {label}
          </div>
          <h2
            data-testid="hero-ranked-card-title"
            className="text-[26px] md:text-[34px] font-extrabold leading-none tracking-[-0.035em] mb-2.5"
            style={{ color: '#1a1208', textShadow: '0 1px 0 rgba(255,220,140,0.4)' }}
          >
            {t('gameModes.ranked')}
          </h2>
          <p
            data-testid="hero-ranked-card-tagline"
            className="text-[13px] font-medium mb-4"
            style={{ color: 'rgba(26,18,8,0.75)' }}
          >
            {tagline}
          </p>
          <div
            data-testid="hero-ranked-card-stats"
            className="flex flex-wrap gap-4 text-[12px] font-semibold"
            style={{ color: 'rgba(26,18,8,0.8)' }}
          >
            <span data-testid="hero-ranked-card-energy" className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              {energyRemaining} / {energyMax} năng lượng
            </span>
            <span data-testid="hero-ranked-card-progress" className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 6v6l4 2" />
              </svg>
              {rankedAnswered} / {rankedCap} câu hôm nay
            </span>
          </div>
        </div>
        <button
          data-testid="hero-ranked-card-cta"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEnter()
          }}
          className="group inline-flex items-center justify-center gap-2.5 w-full md:w-auto px-5 md:px-6 py-3 md:py-3.5 rounded-xl font-bold text-[15px] tracking-[0.01em] transition-all duration-200 hover:translate-x-[3px]"
          style={{
            background: '#1a1208',
            color: '#e8a832',
            boxShadow: '0 6px 18px rgba(26,18,8,0.4), inset 0 1px 0 rgba(232,168,50,0.15)',
          }}
        >
          Vào trận
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
