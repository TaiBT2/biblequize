import { useTranslation } from 'react-i18next'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

interface YesterdaySummary {
  completed: boolean
  correctCount?: number
  totalQuestions?: number
  timeSeconds?: number
}

interface DoneSummary {
  correctCount: number
  totalQuestions: number
  score: number
  xpEarned: number
  betterThanPercent?: number
  completedAt?: string
  timeSeconds?: number
  rankGlobal?: number
  rankGroup?: number
  resultsBreakdown?: boolean[]
}

interface HeroCardProps {
  state: 'ready' | 'done'
  // Ready state inputs
  questionCount: number
  timeLimit: number
  currentStreak: number
  yesterday?: YesterdaySummary
  verseText?: string
  verseRef?: string
  onStart: () => void
  // Done state inputs
  done?: DoneSummary
  onReview: () => void
  onShare: () => void
  onDownload: () => void
}

function formatTime(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function HeroCard(props: HeroCardProps) {
  const { t } = useTranslation()

  return (
    <div className="relative bg-[rgba(50,52,64,0.4)] backdrop-blur-md border border-[rgba(232,168,50,0.15)] rounded-[20px] overflow-hidden mb-7">
      <div className="absolute inset-y-0 right-0 w-[400px] bg-[radial-gradient(circle_at_right,rgba(239,68,68,0.08)_0%,transparent_60%)] pointer-events-none" />
      <div className="relative z-[1] grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="p-8 lg:border-r border-white/5">
          {props.state === 'ready' ? <ReadyLeft {...props} /> : <DoneLeft {...props} />}
        </div>
        {/* RIGHT */}
        <div className="p-8 bg-[rgba(17,19,30,0.3)]">
          {props.state === 'ready' ? <ReadyRight {...props} /> : <DoneRight {...props} />}
        </div>
      </div>
    </div>
  )

  function ReadyLeft({ questionCount, timeLimit, yesterday, onStart }: HeroCardProps) {
    return (
      <>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[20px] mb-[18px] bg-gradient-to-br from-[rgba(239,68,68,0.15)] to-[rgba(249,115,22,0.1)] border border-[rgba(239,68,68,0.3)] text-[#fca5a5] text-xs font-bold uppercase tracking-[0.5px]">
          <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse-ring" />
          {t('daily.ready.statusBadge')}
        </div>
        <h3 className="text-[28px] font-extrabold mb-2.5 tracking-tight text-on-surface">
          {t('daily.ready.title', { count: questionCount })}
        </h3>
        <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
          {t('daily.ready.desc')}
        </p>
        <div className="flex gap-2 mb-[22px] flex-wrap">
          <MetaItem icon="quiz" text={t('daily.ready.metaQuestions', { count: questionCount })} />
          <MetaItem icon="timer" text={t('daily.ready.metaTime', { minutes: timeLimit })} />
          <MetaItem icon="public" text={t('daily.ready.metaGlobal')} />
          <MetaItem icon="shield" text={t('daily.ready.metaNoEnergy')} />
        </div>
        <div className="bg-[rgba(17,19,30,0.4)] border border-[rgba(232,168,50,0.12)] rounded-xl px-4 py-3.5 mb-[22px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[rgba(232,168,50,0.2)] to-[rgba(217,119,6,0.1)] border border-[rgba(232,168,50,0.3)] grid place-items-center text-secondary text-[22px] flex-shrink-0">
            <span className="material-symbols-outlined">workspace_premium</span>
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-[0.5px]">
              {t('daily.ready.rewardLabel')}
            </div>
            <div className="text-sm text-on-surface font-bold mt-0.5">
              <strong className="text-secondary">+50 XP</strong> {t('daily.ready.rewardBase')} ·{' '}
              <strong className="text-secondary">+25 XP</strong> {t('daily.ready.rewardPerfect')}
            </div>
          </div>
        </div>
        <button
          data-testid="daily-start-btn"
          onClick={onStart}
          className="w-full bg-gradient-to-br from-secondary to-[#d97706] text-on-secondary border-none px-7 py-4 rounded-2xl text-base font-extrabold cursor-pointer transition-all flex items-center justify-center gap-2.5 shadow-[0_6px_24px_rgba(232,168,50,0.35)] hover:-translate-y-px hover:shadow-[0_8px_28px_rgba(232,168,50,0.5)]"
        >
          <span className="material-symbols-outlined">play_arrow</span>
          {t('daily.ready.cta')}
        </button>
        {yesterday?.completed && (
          <div className="mt-4 px-3.5 py-3 bg-[rgba(17,19,30,0.4)] border-l-[3px] border-[rgba(96,165,250,0.5)] rounded-lg text-xs text-on-surface-variant leading-relaxed">
            📊 <strong className="text-[#93c5fd]">{t('daily.ready.yesterdayPrefix')}</strong>{' '}
            {t('daily.ready.yesterdayBody', {
              correct: yesterday.correctCount ?? 0,
              total: yesterday.totalQuestions ?? 5,
              time: formatTime(yesterday.timeSeconds),
            })}
          </div>
        )}
      </>
    )
  }

  function ReadyRight({ currentStreak, verseText, verseRef }: HeroCardProps) {
    return (
      <div className="text-center">
        <div className="w-[140px] h-[140px] mx-auto mb-4 rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.15)_0%,rgba(249,115,22,0.08)_50%,transparent_70%)] grid place-items-center relative">
          <span
            className="text-[80px]"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 12px rgba(239,68,68,0.4))',
            }}
          >
            🔥
          </span>
          <span className="absolute inset-0 rounded-full border-2 border-dashed border-[rgba(239,68,68,0.2)] animate-spin-slow" />
        </div>
        <div className="text-base font-bold mb-1.5 text-on-surface">{t('daily.ready.previewHeadline')}</div>
        <div className="text-xs text-on-surface-variant leading-relaxed mb-[18px]">
          {currentStreak > 0
            ? <>{t('daily.ready.previewSubStreak')} <strong className="text-[#f97316]">{t('daily.ready.streakDaysSpan', { count: currentStreak })}</strong>. {t('daily.ready.previewSubTail')}</>
            : t('daily.ready.previewSubFresh')}
        </div>
        {verseText && (
          <div className="bg-[rgba(17,19,30,0.5)] border border-[rgba(232,168,50,0.1)] rounded-xl px-4 py-3.5 text-left">
            <div className="text-[10px] text-secondary font-bold uppercase tracking-[0.5px] mb-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">menu_book</span>
              {t('daily.ready.versePreviewLabel')}
            </div>
            <div className="text-[13px] leading-relaxed text-on-surface italic mb-2">
              {verseText}
            </div>
            <div className="text-[11px] text-on-surface-variant font-semibold">— {verseRef}</div>
          </div>
        )}
      </div>
    )
  }

  function DoneLeft({ done, onReview }: HeroCardProps) {
    if (!done) return null
    const completedTimeLabel = done.completedAt
      ? new Date(done.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '—'
    return (
      <>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[20px] mb-[18px] bg-gradient-to-br from-[rgba(74,222,128,0.15)] to-[rgba(34,197,94,0.1)] border border-[rgba(74,222,128,0.3)] text-[#86efac] text-xs font-bold uppercase tracking-[0.5px]">
          <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse-ring-green" />
          {t('daily.done.statusBadge', { time: completedTimeLabel })}
        </div>
        <h3 data-testid="daily-completed-badge" className="text-[28px] font-extrabold mb-2.5 tracking-tight text-on-surface">
          {t('daily.done.title')}
        </h3>
        <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
          {done.betterThanPercent != null
            ? <>{t('daily.done.descPrefix')} <strong className="text-[#4ade80]">{done.betterThanPercent}%</strong> {t('daily.done.descPlayers')}</>
            : t('daily.done.descNoData')}
        </p>
        <div className="bg-[rgba(17,19,30,0.5)] border border-[rgba(74,222,128,0.15)] rounded-xl p-4 mb-[22px]">
          <SummaryRow icon="check_circle" label={t('daily.done.rowCorrect')} value={`${done.correctCount} / ${done.totalQuestions}`} valueClass="text-[#4ade80]" />
          {done.timeSeconds != null && (
            <SummaryRow icon="timer" label={t('daily.done.rowTime')} value={formatTime(done.timeSeconds)} />
          )}
          {done.betterThanPercent != null && (
            <SummaryRow icon="trending_up" label={t('daily.done.rowBetterThan')} value={t('daily.done.betterThanValue', { percent: done.betterThanPercent })} valueClass="text-[#4ade80]" />
          )}
          <SummaryRow icon="workspace_premium" label={t('daily.done.rowXP')} value={`+${done.xpEarned} XP`} valueClass="text-secondary" lastRow />
          {done.resultsBreakdown && done.resultsBreakdown.length > 0 && (
            <div className="flex gap-1 mt-3.5">
              {done.resultsBreakdown.map((correct, i) => (
                <div
                  key={i}
                  title={t('daily.done.qDotTitle', { num: i + 1, status: correct ? t('daily.done.qDotCorrect') : t('daily.done.qDotWrong') })}
                  className={`flex-1 h-2 rounded ${correct
                    ? 'bg-gradient-to-br from-[#4ade80] to-[#22c55e]'
                    : 'bg-gradient-to-br from-[#f87171] to-[#ef4444]'
                    }`}
                />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onReview}
          className="w-full bg-gradient-to-br from-secondary to-[#d97706] text-on-secondary border-none px-7 py-4 rounded-2xl text-base font-extrabold cursor-pointer transition-all flex items-center justify-center gap-2.5 shadow-[0_6px_24px_rgba(232,168,50,0.35)] hover:-translate-y-px"
        >
          <span className="material-symbols-outlined">visibility</span>
          {t('daily.done.cta')}
        </button>
      </>
    )
  }

  function DoneRight({ done, onShare, onDownload }: HeroCardProps) {
    if (!done) return null
    const percent = done.totalQuestions > 0
      ? Math.round((done.correctCount / done.totalQuestions) * 100)
      : 0
    const ringRadius = 70
    const ringCircumference = 2 * Math.PI * ringRadius
    const ringOffset = ringCircumference - (percent / 100) * ringCircumference

    return (
      <>
        <div className="text-center mb-[18px]">
          <div className="relative w-40 h-40 mx-auto mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <defs>
                <linearGradient id="dailyHeroScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle
                cx="80"
                cy="80"
                r={ringRadius}
                fill="none"
                stroke="url(#dailyHeroScoreGrad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                style={{ filter: 'drop-shadow(0 0 8px rgba(232,168,50,0.4))', transition: 'stroke-dashoffset 0.8s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <div
                  data-testid="daily-score-display"
                  className="text-[42px] font-extrabold leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #e8a832 0%, #fbbf24 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {done.correctCount}
                </div>
                <div className="text-sm text-on-surface-variant mt-1">
                  {t('daily.done.scoreOf', { total: done.totalQuestions })}
                </div>
                <div className="text-[11px] text-[#4ade80] font-bold mt-0.5">
                  {t('daily.done.scorePercent', { percent })}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3.5">
          <StatMini value={done.rankGlobal != null ? `#${done.rankGlobal}` : '—'} label={t('daily.done.rankGlobal')} highlight />
          <StatMini value={done.rankGroup != null ? `#${done.rankGroup}` : '—'} label={t('daily.done.rankGroup')} success />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ShareBtn icon="share" label={t('daily.done.share')} onClick={onShare} />
          <ShareBtn icon="photo_camera" label={t('daily.done.downloadImage')} onClick={onDownload} />
        </div>
      </>
    )
  }
}

function MetaItem({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[rgba(17,19,30,0.5)] border border-white/5 text-xs text-on-surface font-semibold">
      <span className="material-symbols-outlined text-base text-secondary">{icon}</span>
      {text}
    </span>
  )
}

function SummaryRow({ icon, label, value, valueClass = 'text-on-surface', lastRow = false }: { icon: string; label: string; value: string; valueClass?: string; lastRow?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2.5 ${!lastRow ? 'border-b border-white/5' : ''}`}>
      <div className="text-xs text-on-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-on-surface-variant">{icon}</span>
        {label}
      </div>
      <div className={`text-sm font-bold ${valueClass}`}>{value}</div>
    </div>
  )
}

function StatMini({ value, label, highlight = false, success = false }: { value: string; label: string; highlight?: boolean; success?: boolean }) {
  const valueColor = highlight ? 'text-secondary' : success ? 'text-[#4ade80]' : 'text-on-surface'
  return (
    <div className="bg-[rgba(17,19,30,0.4)] border border-white/5 rounded-[10px] px-3 py-2.5 text-center">
      <div className={`text-lg font-extrabold ${valueColor}`}>{value}</div>
      <div className="text-[10px] text-on-surface-variant uppercase tracking-[0.5px] mt-0.5">{label}</div>
    </div>
  )
}

function ShareBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-[rgba(232,168,50,0.1)] text-secondary border border-[rgba(232,168,50,0.25)] hover:bg-[rgba(232,168,50,0.2)] px-3 py-3 rounded-[10px] text-[13px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
      {label}
    </button>
  )
}

// Suppress unused-warn for FILL_1 — kept for parity if needed by future state badges.
void FILL_1
