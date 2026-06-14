import { useTranslation } from 'react-i18next'
import { FILL_STYLE } from './types'

export function StatsStrip({ points, currentStreak, longestStreak, totalSessions, totalQuestions, totalCorrect, correctRate }: {
  points: number
  currentStreak: number
  longestStreak: number
  totalSessions: number
  totalQuestions: number
  totalCorrect: number
  correctRate: number
}) {
  const { t } = useTranslation()
  const dayWord = t('common.days')

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        testId="profile-stats-points"
        icon="emoji_events"
        iconBg="bg-bq-amber/15 text-bq-amberd"
        label={t('profile.totalPoints')}
        value={points.toLocaleString()}
        sub={t('profile.statRankUnranked')}
      />
      <StatCard
        testId="profile-stats-streak"
        icon="local_fire_department"
        iconFill
        iconBg="bg-bq-ember/15 text-bq-ember"
        label={t('profile.currentStreak')}
        value={`${currentStreak} ${dayWord}`}
        sub={t('profile.statLongestSub', { n: longestStreak })}
        subClass="text-bq-emerald"
        extra={<span className="sr-only">{longestStreak} {dayWord}</span>}
      />
      <StatCard
        testId="profile-total-sessions"
        icon="history"
        iconBg="bg-bq-sapphire/15 text-bq-sapphire"
        label={t('profile.totalSessions')}
        value={`${totalSessions}`}
        sub={t('profile.statQuestionsAnswered', { n: totalQuestions })}
      />
      <StatCard
        testId="profile-correct-rate"
        icon="check_circle"
        iconFill
        iconBg="bg-bq-emerald/15 text-bq-emerald"
        label={t('profile.correctRate')}
        value={`${correctRate}%`}
        sub={t('profile.statCorrectFraction', { correct: totalCorrect, total: totalQuestions })}
      />
    </section>
  )
}

function StatCard({ testId, icon, iconFill, iconBg, label, value, sub, subClass, extra }: {
  testId?: string
  icon: string
  iconFill?: boolean
  iconBg: string
  label: string
  value: string
  sub?: string
  subClass?: string
  extra?: React.ReactNode
}) {
  return (
    <div data-testid={testId} className="bg-bq-white border border-bq-hair shadow-bq-soft rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <span className="material-symbols-outlined text-[22px]" style={iconFill ? FILL_STYLE : undefined}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-bq-ink2">{label}</p>
        <p className="text-[22px] font-extrabold text-bq-ink leading-tight tracking-tight mt-0.5 truncate">{value}</p>
        {sub && <p className={`text-[11px] mt-0.5 ${subClass ?? 'text-bq-ink2'}`}>{sub}</p>}
        {extra}
      </div>
    </div>
  )
}
