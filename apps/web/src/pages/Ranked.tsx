import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { getQuizLanguage } from '../utils/quizLanguage'
import { useAuth } from '../store/authStore'
import { getTierInfo } from '../data/tiers'
import { useRankedPage } from '../hooks/useRankedPage'
import RankedSkeleton from '../components/ranked/RankedSkeleton'
import RankedHeader from '../components/ranked/RankedHeader'
import TierProgressCard from '../components/ranked/TierProgressCard'
import SeasonCard from '../components/ranked/SeasonCard'
import RankedActionFooter from '../components/ranked/RankedActionFooter'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

export default function Ranked() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    rankedStatus,
    userRank,
    tierData,
    timeLeft,
    isLoading,
    isInitialized,
    refetch,
  } = useRankedPage()

  const startRankedQuiz = async () => {
    if (!rankedStatus) return
    let step = 'init'
    try {
      step = 'POST /api/ranked/sessions'
      const res = await api.post('/api/ranked/sessions', { language: getQuizLanguage() })
      const sessionId = res.data.sessionId
      if (!sessionId) throw new Error('BE returned no sessionId')

      // Tier-aware question pick — BE endpoint runs SmartQuestionSelector
      // server-side so Easy/Medium/Hard% follows SPEC §3.2 tier table (T1
      // 70/25/5 → T6 5/35/60). Replaces the previous FE pattern that
      // issued up to 3 /api/questions queries and never applied tier
      // distribution at all (BL-20, fix 2026-05-20).
      const serverAskedIds: string[] = rankedStatus.askedQuestionIdsToday ?? []
      const localAskedIds: string[] = (() => { try { return JSON.parse(localStorage.getItem('askedQuestionIds') || '[]') } catch { return [] } })()
      const excludeIds = Array.from(new Set<string>([...serverAskedIds, ...localAskedIds]))

      step = 'POST /api/ranked/questions/select'
      const pickRes = await api.post('/api/ranked/questions/select', {
        limit: 10,
        excludeIds,
        book: rankedStatus.currentBook,
        difficulty: rankedStatus.currentDifficulty,
        language: getQuizLanguage(),
      })
      const questions: any[] = pickRes.data?.questions ?? []

      if (questions.length === 0) {
        alert(t('ranked.noQuestionsLeft', 'Bạn đã trả lời hết câu hỏi có sẵn hôm nay. Quay lại sau khi thêm câu mới.'))
        return
      }

      navigate('/quiz', { state: { sessionId, mode: 'ranked', questions, showExplanation: false, isRanked: true, timePerQuestion: 90 } })
    } catch (err) {
      const e = err as { response?: { status?: number; data?: unknown }; message?: string }
      const detail = e?.response?.status
        ? `HTTP ${e.response.status} · ${JSON.stringify(e.response.data ?? {}).slice(0, 200)}`
        : e?.message ?? String(err)
      console.error(`[startRankedQuiz] failed at "${step}":`, err)
      alert(`${t('ranked.cannotStart')}\n\n[${step}] ${detail}`)
    }
  }

  if (isLoading || !isInitialized) return <RankedSkeleton />

  if (!rankedStatus) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="bg-surface-container p-10 rounded-2xl text-center max-w-md">
          <span className="material-symbols-outlined text-error text-5xl mb-4 block">error</span>
          <p className="text-on-surface font-bold text-lg mb-2">{t('ranked.loadError')}</p>
          <p className="text-on-surface-variant text-sm mb-6">{t('ranked.tryAgainLater')}</p>
          <button onClick={refetch} className="gold-gradient text-on-secondary font-black px-8 py-3 rounded-xl text-sm uppercase tracking-widest">
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  // Derived values
  const canPlay = rankedStatus.livesRemaining > 0 && rankedStatus.questionsCounted < rankedStatus.cap
  const capReached = rankedStatus.questionsCounted >= rankedStatus.cap
  const energy = rankedStatus.livesRemaining ?? 0
  const energyMax = rankedStatus.dailyLives ?? 100
  const energyPct = energyMax > 0 ? Math.max(0, Math.min(100, (energy / energyMax) * 100)) : 0
  const questionsLeftFromEnergy = Math.floor(energy / 5)
  const isOutOfEnergy = energy <= 0
  const totalPoints = tierData?.totalPoints ?? userRank?.points ?? rankedStatus.pointsToday ?? 0
  const tierInfo = getTierInfo(totalPoints)
  const currentTier = tierInfo.current
  const nextTier = tierInfo.next
  const pointsToNext = tierData
    ? Math.max(0, tierData.nextTierPoints - tierData.totalPoints)
    : tierInfo.pointsToNext
  const tierProgressPct = nextTier
    ? (tierData?.tierProgressPercent ?? tierInfo.progressPct)
    : 100
  const streak = user?.currentStreak ?? 0
  const questionsAnswered = rankedStatus.questionsCounted ?? 0
  const questionsCap = rankedStatus.cap || 100
  const pointsToday = rankedStatus.pointsToday ?? 0
  const resetTimeLeft = timeLeft || '--:--:--'

  return (
    <main data-testid="ranked-page" className="max-w-5xl mx-auto pb-[120px] md:pb-10">
      <RankedHeader />

      <div className="space-y-4 md:space-y-[18px]">
        <TierProgressCard
          currentTier={currentTier}
          nextTier={nextTier}
          totalPoints={totalPoints}
          pointsToNext={pointsToNext}
          tierProgressPct={tierProgressPct}
          starIndex={tierData?.starIndex}
        />

        {/* Stats + Action — 1-col stack on mobile, 2-col 1.55fr/1fr on md+. */}
        <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-[18px]">

          {/* ─── Stats composite card ──────────────────────────────── */}
          <section
            data-testid="ranked-stats-card"
            className="rounded-[22px] border border-white/[0.06] overflow-hidden"
            style={{ background: 'rgba(50,52,64,0.35)', backdropFilter: 'blur(12px)' }}
          >
            {/* Energy section */}
            <div className="px-5 md:px-7 pt-5 md:pt-6 pb-5 md:pb-[22px] border-b border-white/[0.06]">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2 text-on-surface-variant/70">
                  <span className="material-symbols-outlined text-[17px] text-secondary">bolt</span>
                  <span className="text-[11px] font-bold uppercase tracking-[1.3px]">
                    {t('ranked.energy')}
                  </span>
                </div>
                <div
                  data-testid="ranked-reset-timer"
                  className="text-on-surface-variant/55 text-[12px] inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">schedule</span>
                  {t('ranked.energyRecoverIn', { time: resetTimeLeft })}
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-3 flex-wrap">
                <span
                  data-testid="ranked-energy-display"
                  className="text-secondary text-[36px] md:text-[40px] font-extrabold leading-none tracking-tight"
                >
                  {energy}
                </span>
                <span className="text-on-surface-variant/55 text-[14px] md:text-[15px] font-semibold">
                  / {energyMax}
                </span>
                {!isOutOfEnergy && (
                  <span
                    data-testid="ranked-energy-status"
                    className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-3 py-1"
                    style={{ background: 'rgba(109,208,160,0.08)', color: '#6dd0a0' }}
                  >
                    <span className="material-symbols-outlined text-[14px]" style={FILL_1}>check_circle</span>
                    {t('ranked.energyEnoughForNQuestions', { count: questionsLeftFromEnergy })}
                  </span>
                )}
                {isOutOfEnergy && (
                  <span className="ml-auto text-[11px] text-on-surface-variant/55 font-semibold">
                    {t('ranked.outOfEnergy')}
                  </span>
                )}
              </div>

              <div className="bg-white/[0.05] rounded-full h-[7px] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${energyPct}%`,
                    background: 'linear-gradient(90deg, #e8a832, #f0c060)',
                  }}
                />
              </div>
            </div>

            {/* 3-mini stats row — internal grid w/ desktop dividers. */}
            <div className="grid grid-cols-3">
              {/* Streak */}
              <div
                data-testid="ranked-streak-card"
                className="px-3 md:px-4 py-4 md:py-[18px] text-center border-r border-white/[0.06]"
              >
                <div className="text-[10px] font-bold uppercase tracking-[1.2px] text-on-surface-variant/55 mb-2">
                  {t('ranked.streakHeader')}
                </div>
                <div className="mb-1">
                  <span
                    className="material-symbols-outlined text-[17px]"
                    style={{ color: '#ff7a3a', ...FILL_1 }}
                  >
                    local_fire_department
                  </span>
                </div>
                <div className="text-[22px] md:text-[24px] font-extrabold leading-none tracking-tight" style={{ color: '#ff7a3a' }}>
                  <span data-testid="ranked-streak-count">{streak}</span>
                  <span className="text-on-surface-variant/55 text-[13px] font-semibold ml-1">
                    {t('ranked.streakDaysShort', 'ngày')}
                  </span>
                </div>
                <div className="hidden md:block text-[11px] text-on-surface-variant/55 mt-1.5">
                  {streak > 0 ? t('ranked.streakKeepGoing') : t('ranked.streakBadgeHint')}
                </div>
              </div>

              {/* Câu hôm nay */}
              <div
                data-testid="ranked-questions-card"
                className="px-3 md:px-4 py-4 md:py-[18px] text-center border-r border-white/[0.06]"
              >
                <div className="text-[10px] font-bold uppercase tracking-[1.2px] text-on-surface-variant/55 mb-2">
                  {t('ranked.questionsTodayShort')}
                </div>
                <div className="mb-1">
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant/70">quiz</span>
                </div>
                <div className="text-[22px] md:text-[24px] font-extrabold leading-none tracking-tight text-on-surface">
                  <span data-testid="ranked-questions-counted">{questionsAnswered}</span>
                  <span className="text-on-surface-variant/55 text-[13px] font-semibold ml-1">
                    / {questionsCap}
                  </span>
                </div>
                <div className="hidden md:block text-[11px] text-on-surface-variant/55 mt-1.5">
                  {t('ranked.capPerDay', { count: questionsCap })}
                </div>
              </div>

              {/* Điểm hôm nay */}
              <div
                data-testid="ranked-points-card"
                className="px-3 md:px-4 py-4 md:py-[18px] text-center"
              >
                <div className="text-[10px] font-bold uppercase tracking-[1.2px] text-on-surface-variant/55 mb-2">
                  {t('ranked.pointsTodayShort')}
                </div>
                <div className="mb-1">
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant/70">military_tech</span>
                </div>
                <div
                  data-testid="ranked-points-today"
                  className="text-[22px] md:text-[24px] font-extrabold leading-none tracking-tight text-on-surface"
                >
                  {pointsToday}
                </div>
                <div className="hidden md:block text-[11px] text-on-surface-variant/55 mt-1.5">
                  {t('ranked.pointsCountsToSeason', 'Cộng vào điểm mùa')}
                </div>
              </div>
            </div>
          </section>

          {/* ─── Action card (md+) ─────────────────────────────────── */}
          <section
            data-testid="ranked-action-card"
            className="hidden md:flex flex-col relative overflow-hidden rounded-[22px] border border-white/[0.06] p-6 md:p-7"
            style={{
              background:
                'linear-gradient(155deg, rgba(232,168,50,0.10), rgba(50,52,64,0.35) 55%)',
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(50% 70% at 80% 10%, rgba(232,168,50,0.18), transparent 60%)',
              }}
            />
            <div className="relative z-10 flex flex-col h-full">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[1.8px] text-secondary">
                <span className="w-4 h-px bg-secondary" />
                {t('ranked.actionEyebrow', 'Bắt đầu trận đấu')}
              </div>
              <h2 className="text-[20px] font-extrabold mt-2.5 leading-snug tracking-tight">
                {t('ranked.actionTitleLeading', 'Sẵn sàng')}{' '}
                <span className="font-headline italic font-semibold text-secondary">
                  {t('ranked.actionTitleAccent', 'leo hạng')}
                </span>
                ?
              </h2>
              <p className="text-[12px] text-on-surface-variant/65 mt-2 leading-relaxed">
                {t('ranked.energyExplainer')}
              </p>

              <button
                data-testid="ranked-start-btn-desktop"
                onClick={canPlay ? startRankedQuiz : undefined}
                disabled={!canPlay}
                className="mt-auto pt-4 group"
              >
                <div
                  className={`flex items-center justify-center gap-2 rounded-[13px] py-4 px-6 font-bold text-[15px] transition-transform ${
                    canPlay
                      ? 'text-[#1a1206] hover:-translate-y-0.5 active:translate-y-0'
                      : 'text-on-surface-variant/55 cursor-not-allowed opacity-50'
                  }`}
                  style={
                    canPlay
                      ? {
                          background: 'linear-gradient(180deg, #f0b84a, #e09a28)',
                          boxShadow: '0 12px 30px -10px rgba(232,168,50,0.55)',
                        }
                      : { background: 'rgba(255,255,255,0.05)' }
                  }
                >
                  <span className="material-symbols-outlined text-[22px]" style={FILL_1}>play_arrow</span>
                  {canPlay
                    ? t('ranked.ctaPlayMain')
                    : capReached
                      ? t('ranked.ctaCapMain')
                      : t('ranked.ctaNoEnergyMain')}
                </div>
                <div className="text-center text-[11px] text-on-surface-variant/55 mt-2.5">
                  {canPlay
                    ? t('ranked.ctaPlaySub', { count: questionsLeftFromEnergy })
                    : capReached
                      ? t('ranked.ctaCapSub', { time: resetTimeLeft })
                      : t('ranked.ctaNoEnergySub', { time: resetTimeLeft })}
                </div>
              </button>
            </div>
          </section>
        </div>

        <SeasonCard />
      </div>

      {/* Mobile sticky CTA — hidden on md+ since the Action card above
          already surfaces the primary CTA inline. */}
      <div className="md:hidden">
        <RankedActionFooter
          canPlay={canPlay}
          capReached={capReached}
          energy={energy}
          resetTimeLeft={resetTimeLeft}
          onStart={startRankedQuiz}
        />
      </div>
    </main>
  )
}
