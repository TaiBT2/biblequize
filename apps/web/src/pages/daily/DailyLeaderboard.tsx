import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface DailyLbEntry {
  rank: number
  name: string
  tier?: string
  score: number
  correctCount?: number
  totalQuestions?: number
  timeLabel?: string
  avatarUrl?: string
  avatarInitial?: string
  avatarHue?: 'gold' | 'silver' | 'bronze' | 'gray'
  isMe?: boolean
}

interface DailyLeaderboardProps {
  entries: DailyLbEntry[]
  myEntry?: DailyLbEntry | null
  myCompleted: boolean
}

export function DailyLeaderboard({ entries, myEntry, myCompleted }: DailyLeaderboardProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'global' | 'group'>('global')

  return (
    <div className="bg-[rgba(50,52,64,0.4)] backdrop-blur-md border border-[rgba(232,168,50,0.1)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[15px] font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-secondary">leaderboard</span>
          {t('daily.lbToday')}
        </div>
        <div className="flex gap-1 bg-[rgba(17,19,30,0.5)] p-1 rounded-[10px]">
          <button
            onClick={() => setTab('global')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'global' ? 'bg-[rgba(232,168,50,0.15)] text-secondary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('daily.lbTabGlobal')}
          </button>
          <button
            onClick={() => setTab('group')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'group' ? 'bg-[rgba(232,168,50,0.15)] text-secondary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('daily.lbTabGroup')}
          </button>
        </div>
      </div>

      <div data-testid="daily-leaderboard">
        {entries.length === 0 ? (
          <div className="p-6 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl block opacity-40 mb-2">leaderboard</span>
            <p className="text-sm">{t('daily.noOneCompleted')}</p>
          </div>
        ) : (
          entries.slice(0, 5).map((e) => <Row key={e.rank} entry={e} />)
        )}
      </div>

      <div className="text-center text-[11px] text-on-surface-variant tracking-[2px] my-3">···</div>

      {/* User row */}
      {myEntry ? (
        <Row entry={{ ...myEntry, isMe: true }} />
      ) : (
        <div className="grid grid-cols-[32px_36px_1fr_auto_auto] gap-3.5 items-center px-3 py-2.5 rounded-[10px] bg-[rgba(232,168,50,0.08)] border border-[rgba(232,168,50,0.25)] opacity-60">
          <div className="text-[13px] font-extrabold text-on-surface-variant text-center">—</div>
          <div className="w-9 h-9 rounded-full grid place-items-center text-on-secondary font-bold text-[13px] bg-gradient-to-br from-secondary to-[#d97706]">
            {myEntry === null ? '?' : '...'}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold truncate text-on-surface">{t('daily.lbYouLine')}</div>
            <div className="text-[11px] text-[#f87171] mt-0.5">
              {myCompleted ? t('daily.lbLoadingMyRank') : t('daily.lbNotCompleted')}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-extrabold text-on-surface-variant text-right tabular-nums">— đ</div>
          </div>
          <div className="text-[11px] text-on-surface-variant text-right tabular-nums min-w-[50px]">—</div>
        </div>
      )}
    </div>
  )
}

function Row({ entry }: { entry: DailyLbEntry }) {
  const { t } = useTranslation()
  const isMedal = entry.rank <= 3
  const medalEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null
  const medalClass = entry.rank === 1 ? 'text-[#fbbf24] text-lg'
    : entry.rank === 2 ? 'text-[#d1d5db] text-base'
    : entry.rank === 3 ? 'text-[#d97706] text-base'
    : 'text-on-surface-variant text-[13px]'

  const avatarBg = entry.isMe
    ? 'bg-gradient-to-br from-secondary to-[#d97706] text-on-secondary'
    : entry.rank === 1 ? 'bg-gradient-to-br from-[#fbbf24] to-[#d97706] text-on-secondary'
    : entry.rank === 2 ? 'bg-gradient-to-br from-[#9ca3af] to-[#4b5563] text-on-surface'
    : entry.rank === 3 ? 'bg-gradient-to-br from-[#d97706] to-[#7c2d12] text-on-surface'
    : 'bg-gradient-to-br from-[#6b7280] to-[#4b5563] text-on-surface'

  return (
    <div
      data-testid="daily-leaderboard-row"
      className={`grid grid-cols-[32px_36px_1fr_auto_auto] gap-3.5 items-center px-3 py-2.5 rounded-[10px] mb-1 transition-colors ${
        entry.isMe
          ? 'bg-[rgba(232,168,50,0.08)] border border-[rgba(232,168,50,0.25)]'
          : 'hover:bg-[rgba(232,168,50,0.04)]'
      }`}
    >
      <div className={`font-extrabold text-center ${medalClass}`}>
        {isMedal ? medalEmoji : entry.rank}
      </div>
      <div className={`w-9 h-9 rounded-full grid place-items-center font-bold text-[13px] flex-shrink-0 overflow-hidden ${avatarBg}`}>
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover" />
        ) : (
          entry.avatarInitial ?? entry.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold truncate text-on-surface">
          {entry.name}{entry.isMe ? ` ${t('daily.lbYouSuffix')}` : ''}
        </div>
        {entry.tier && <div className="text-[11px] text-on-surface-variant mt-0.5">{entry.tier}</div>}
      </div>
      <div className="text-right">
        <div className="text-[13px] font-extrabold text-secondary tabular-nums">{entry.score} đ</div>
        {entry.correctCount != null && entry.totalQuestions != null && (
          <div className="text-[10px] text-on-surface-variant font-medium mt-0.5">
            {entry.correctCount}/{entry.totalQuestions}
            {entry.correctCount === entry.totalQuestions ? ' · perfect' : ''}
          </div>
        )}
      </div>
      <div className="text-[11px] text-on-surface-variant text-right tabular-nums min-w-[50px]">
        {entry.timeLabel ?? '—'}
      </div>
    </div>
  )
}
