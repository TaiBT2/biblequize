// MLR — Avatar stack with capacity counter (X/Y) + ghost slots.
// Used inside RoomCard footer to show who's in the room at a glance.

const PALETTE = [
  { bg: 'rgba(245,158,11,0.18)', fg: '#D97F06' },  // amber
  { bg: 'rgba(45,70,200,0.18)',  fg: '#2D46C8' },  // sapphire
  { bg: 'rgba(14,138,107,0.18)', fg: '#0E8A6B' },  // emerald
  { bg: 'rgba(224,53,75,0.16)',  fg: '#E0354B' },  // ruby
  { bg: 'rgba(255,111,61,0.18)', fg: '#FF6F3D' },  // ember
]

interface Props {
  initials: string[]
  current: number
  max: number
  /** Hide the "X/Y · còn N nữa" sublabel — RoomCard renders capacity inline. */
  compact?: boolean
}

export default function AvatarStack({ initials, current, max, compact }: Props) {
  const shown = initials.slice(0, 5)
  const empty = Math.max(0, max - current)
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {shown.map((initial, i) => {
          const c = PALETTE[i % PALETTE.length]
          return (
            <div
              key={i}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2"
              style={{
                background: c.bg, color: c.fg, borderColor: '#FFFFFF',
                marginLeft: i > 0 ? '-8px' : undefined,
                zIndex: 10 - i,
              }}
            >
              {initial}
            </div>
          )
        })}
        {empty > 0 && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2"
            style={{
              background: 'rgba(231,228,218,0.5)',
              color: 'rgba(108,106,98,0.9)',
              borderColor: '#FFFFFF',
              marginLeft: shown.length > 0 ? '-8px' : undefined,
              zIndex: 10 - shown.length,
            }}
          >
            +{empty}
          </div>
        )}
      </div>
      {!compact && (
        <span className="text-[11px] text-bq-ink2 font-semibold">{current} / {max}</span>
      )}
    </div>
  )
}
