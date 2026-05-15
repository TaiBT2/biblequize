// MLR — Avatar stack with capacity counter (X/Y) + ghost slots.
// Used inside RoomCard footer to show who's in the room at a glance.

const PALETTE = [
  { bg: 'rgba(232,168,50,0.3)', fg: '#e8a832' },
  { bg: 'rgba(74,158,255,0.3)', fg: '#6AB8E8' },
  { bg: 'rgba(168,85,247,0.3)', fg: '#c084fc' },
  { bg: 'rgba(99,153,34,0.3)',  fg: '#97C459' },
  { bg: 'rgba(255,140,66,0.3)', fg: '#ff8c42' },
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
                background: c.bg, color: c.fg, borderColor: '#11131e',
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
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.6)',
              borderColor: '#11131e',
              marginLeft: shown.length > 0 ? '-8px' : undefined,
              zIndex: 10 - shown.length,
            }}
          >
            +{empty}
          </div>
        )}
      </div>
      {!compact && (
        <span className="text-[11px] text-white/60 font-semibold">{current} / {max}</span>
      )}
    </div>
  )
}
