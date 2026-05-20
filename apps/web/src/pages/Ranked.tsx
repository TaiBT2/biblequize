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
import EnergyCard from '../components/ranked/EnergyCard'
import RankedStreakCard from '../components/ranked/RankedStreakCard'
import DailyStatsCards from '../components/ranked/DailyStatsCards'
import SeasonCard from '../components/ranked/SeasonCard'
import RankedActionFooter from '../components/ranked/RankedActionFooter'

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

      const serverAskedIds: string[] = rankedStatus.askedQuestionIdsToday ?? []
      const localAskedIds: string[] = (() => { try { return JSON.parse(localStorage.getItem('askedQuestionIds') || '[]') } catch { return [] } })()
      const exclude = new Set<string>([...serverAskedIds, ...localAskedIds])

      const questions: any[] = []
      const addUnique = (items: any[]) => {
        for (const q of items ?? []) {
          if (!q?.id || exclude.has(q.id) || questions.find((x: any) => x.id === q.id)) continue
          questions.push(q)
          exclude.add(q.id)
          if (questions.length >= 10) break
        }
      }

      step = 'GET /api/questions (filtered)'
      if (questions.length < 10) {
        const params: any = { limit: 10 - questions.length, excludeIds: Array.from(exclude) }
        if (rankedStatus.currentBook) params.book = rankedStatus.currentBook
        if (rankedStatus.currentDifficulty && rankedStatus.currentDifficulty !== 'all') params.difficulty = rankedStatus.currentDifficulty
        addUnique((await api.get('/api/questions', { params })).data ?? [])
      }
      step = 'GET /api/questions (book-only fallback)'
      if (questions.length < 10 && rankedStatus.currentBook) {
        addUnique((await api.get('/api/questions', { params: { limit: 10 - questions.length, book: rankedStatus.currentBook, excludeIds: Array.from(exclude) } })).data ?? [])
      }
      step = 'GET /api/questions (any-book fallback)'
      if (questions.length < 10) {
        addUnique((await api.get('/api/questions', { params: { limit: 10 - questions.length, excludeIds: Array.from(exclude) } })).data ?? [])
      }

      if (questions.length === 0) {
        // BE returned no fresh questions — user has answered every question in
        // the seed pool for today (excludeIds covers all). Surface a specific
        // message instead of the generic "cannot start".
        alert(t('ranked.noQuestionsLeft', 'Bạn đã trả lời hết câu hỏi có sẵn hôm nay. Quay lại sau khi thêm câu mới.'))
        return
      }

      // Ranked timer = 90s/question (user policy 2026-05-20). Was previously
      // falling back to Quiz.tsx DEFAULT_TIMER=30 — too tight for the
      // long-form Bible scripture references the questions contain.
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
  // Prefer tier-progress API totalPoints (all-time accurate); fall
  // back to leaderboard rank or today's points.
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
  return (
    <main data-testid="ranked-page" className="max-w-5xl mx-auto space-y-6 pb-[120px] md:pb-[112px]">
      <RankedHeader />

      <TierProgressCard
        currentTier={currentTier}
        nextTier={nextTier}
        totalPoints={totalPoints}
        pointsToNext={pointsToNext}
        tierProgressPct={tierProgressPct}
        starIndex={tierData?.starIndex}
      />

      {/* Energy full-width — Streak moved out of the energy-streak grid
          into the 3-stat row below per RANK-INTRO-1. */}
      <EnergyCard
        energy={rankedStatus.livesRemaining ?? 0}
        energyMax={rankedStatus.dailyLives ?? 0}
        recoverTimeLeft={timeLeft || '--:--:--'}
      />

      {/* 3-stat row: Streak + Questions + Points (compact icon+number+label).
          DailyStatsCards renders as fragment ⇒ 2 sibling cards in this grid. */}
      <div className="grid grid-cols-3 gap-3">
        <RankedStreakCard streak={user?.currentStreak ?? 0} />
        <DailyStatsCards
          questionsAnswered={rankedStatus.questionsCounted ?? 0}
          questionsCap={rankedStatus.cap || 0}
          pointsToday={rankedStatus.pointsToday ?? 0}
          dailyDelta={rankedStatus.dailyDelta}
          pointsToTop100={rankedStatus.pointsToTop100}
          pointsToTop50={rankedStatus.pointsToTop50}
          pointsToTop10={rankedStatus.pointsToTop10}
        />
      </div>

      <SeasonCard />

      <RankedActionFooter
        canPlay={canPlay}
        capReached={rankedStatus.questionsCounted >= rankedStatus.cap}
        energy={rankedStatus.livesRemaining ?? 0}
        resetTimeLeft={timeLeft || '--:--:--'}
        onStart={startRankedQuiz}
      />
    </main>
  )
}
