import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import ComebackModal from '../components/ComebackModal'
import DailyBonusModal from '../components/DailyBonusModal'
import DailyCompletedStrip from '../components/DailyCompletedStrip'
import DailyMissionsCard from '../components/DailyMissionsCard'
import FeaturedDailyCard from '../components/FeaturedDailyCard'
import HeroRankedCard from '../components/HeroRankedCard'
import HomeBanner from '../components/HomeBanner'
import SectionHeader from '../components/SectionHeader'
import TutorialOverlay from '../components/TutorialOverlay'
import { api } from '../api/client'

/* ── Helpers ── */
function msUntilMidnightUtc(): number {
  const now = new Date()
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  )
  return next.getTime() - now.getTime()
}

function formatHHMMSS(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ── Skeleton ── */
function HomeSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-[160px] rounded-[22px] bg-bq-inset" />
      <div className="h-[200px] rounded-[22px] bg-bq-inset" />
      <div className="h-[140px] rounded-2xl bg-bq-inset" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-[200px] rounded-2xl bg-bq-inset" />
        <div className="h-[200px] rounded-2xl bg-bq-inset" />
        <div className="h-[200px] rounded-2xl bg-bq-inset" />
      </div>
    </div>
  )
}

/* ── Verse lightwell (Khung Sáng signature focal point) ── */
function VerseLightwell() {
  const { t } = useTranslation()
  return (
    <section data-testid="home-verse" className="mb-2">
      <div
        className="relative mx-auto max-w-[740px] px-7 md:px-[54px] pt-11 pb-9 text-center
                   border border-bq-hair border-b-0 bq-arch-well
                   bg-[radial-gradient(120%_80%_at_50%_4%,rgba(255,236,190,.85),#fff_62%)] shadow-bq-amb"
      >
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 -top-px h-[3px] w-[74%] rounded-full bg-bq-spectrum opacity-60"
        />
        <div className="text-[10.5px] font-extrabold tracking-eyebrow text-bq-amberd mb-[18px] uppercase">
          {t('home.verseOfDay', 'Câu gốc hôm nay')}
        </div>
        <div className="flex justify-center mb-4" aria-hidden>
          <span className="w-[15px] h-[21px] rounded-[50%_50%_50%_50%/62%_62%_38%_38%] bg-bq-flame shadow-bq-flame animate-flick" />
        </div>
        <p className="font-literata text-[21px] md:text-verse leading-[1.5] text-bq-ink">
          “Lời Chúa là <em className="italic text-bq-amberd">ngọn đèn</em> cho chân tôi, ánh sáng cho đường lối tôi.”
        </p>
        <div className="mt-4 text-eyebrow font-extrabold tracking-eyebrow text-bq-ink3">THI THIÊN 119 : 105</div>
      </div>
      <div
        aria-hidden
        className="max-w-[740px] mx-auto h-3.5 rounded-b-xl bg-bq-spectrum
                   shadow-[0_26px_50px_-22px_rgba(45,70,200,.35),0_26px_50px_-22px_rgba(224,53,75,.3)]"
      />
    </section>
  )
}

/* ── Mode card (Khung Sáng jewel cards) ── */
type ModeVariant = 'study' | 'ranked' | 'rooms'
const MODE_STYLE: Record<ModeVariant, { edge: string; shadow: string; shadowHover: string; accent: string; tag: string }> = {
  study: { edge: 'from-bq-sapphire to-[#6E86F0]', shadow: 'shadow-bq-sap', shadowHover: 'hover:shadow-bq-sap-h', accent: 'text-bq-sapphire', tag: 'HỌC MỘT MÌNH' },
  ranked: { edge: 'from-bq-ruby to-[#FF7A5A]', shadow: 'shadow-bq-rub', shadowHover: 'hover:shadow-bq-rub-h', accent: 'text-bq-ruby', tag: 'THI ĐẤU' },
  rooms: { edge: 'from-bq-emerald to-[#46C89A]', shadow: 'shadow-bq-eme', shadowHover: 'hover:shadow-bq-eme-h', accent: 'text-bq-emerald', tag: 'CÙNG NHAU' },
}

interface ModeCardProps {
  variant: ModeVariant
  title: string
  desc: string
  inner: React.ReactNode
  cta: string
  onClick: () => void
}

function ModeCard({ variant, title, desc, inner, cta, onClick }: ModeCardProps) {
  const m = MODE_STYLE[variant]
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`home-mode-${variant}`}
      className={`group relative text-left bg-bq-white border border-bq-hair p-6 min-h-[240px]
                  flex flex-col gap-2 overflow-hidden bq-arch-card transition-transform duration-200
                  hover:-translate-y-1.5 ${m.shadow} ${m.shadowHover}`}
    >
      <span className={`absolute inset-x-0 top-0 h-[5px] bg-gradient-to-r ${m.edge}`} />
      <span className={`text-eyebrow font-extrabold tracking-[0.18em] mt-1 ${m.accent}`}>{m.tag}</span>
      <h4 className="font-display text-[23px] font-extrabold tracking-tight text-bq-ink">{title}</h4>
      <p className="text-[12.5px] text-bq-ink2 leading-relaxed">{desc}</p>
      <div className="mt-auto border border-bq-hair bg-bq-paper rounded-2xl px-3.5 py-3 text-xs text-bq-ink2">
        {inner}
      </div>
      <div className={`flex justify-between items-center mt-3.5 text-sm font-extrabold ${m.accent}`}>
        <span>{cta}</span>
        <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </button>
  )
}

/* ── Main ── */
export default function Home() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const dcLang = (i18n.language === 'en' ? 'en' : 'vi') as 'vi' | 'en'

  // Tick once per second to refresh the daily countdown.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/me').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  const { data: tierData } = useQuery({
    queryKey: ['me-tier-progress'],
    queryFn: () => api.get('/api/me/tier-progress').then(r => r.data),
    staleTime: 60_000,
  })

  const { data: dcData } = useQuery<{ alreadyCompleted?: boolean; totalQuestions?: number }>({
    queryKey: ['daily-challenge', dcLang],
    queryFn: () => api.get(`/api/daily-challenge?language=${dcLang}`).then(r => r.data),
    staleTime: 60_000,
  })

  const { data: dcResult } = useQuery<{ correctCount?: number; totalQuestions?: number }>({
    queryKey: ['daily-challenge-result'],
    queryFn: () => api.get('/api/daily-challenge/result').then(r => r.data),
    enabled: !!dcData?.alreadyCompleted,
    staleTime: 60_000,
  })

  const { data: rankedStatus } = useQuery<{
    livesRemaining?: number
    dailyLives?: number
    questionsCounted?: number
    cap?: number
  }>({
    queryKey: ['ranked-status'],
    queryFn: () => api.get('/api/me/ranked-status').then(r => r.data),
    staleTime: 60_000,
  })

  if (meLoading) return <HomeSkeleton />

  const totalPoints = tierData?.totalPoints ?? meData?.totalPoints ?? 0
  const dailyDone = !!dcData?.alreadyCompleted
  const dailyCorrect = dcResult?.correctCount ?? 0
  const dailyTotal = dcResult?.totalQuestions ?? dcData?.totalQuestions ?? 5
  const energyRemaining = rankedStatus?.livesRemaining ?? 100
  const energyMax = rankedStatus?.dailyLives ?? 100
  const rankedAnswered = rankedStatus?.questionsCounted ?? 0
  const rankedCap = rankedStatus?.cap ?? 100
  const currentStreak = meData?.currentStreak ?? 0

  // HO-1: brand-new account — lead with the Daily step, hide empty blocks.
  const isNewUser = totalPoints === 0 && !dailyDone && currentStreak === 0
  const countdown = formatHHMMSS(msUntilMidnightUtc())

  return (
    <div data-testid="home-page" className="max-w-7xl mx-auto w-full">
      <ComebackModal />
      <DailyBonusModal />
      <TutorialOverlay />

      {/* Hero */}
      <HomeBanner />

      {/* HO-1: "start here" cue for brand-new users → points at Daily below. */}
      {isNewUser && (
        <div
          data-testid="home-start-here"
          className="rounded-2xl border border-bq-amber/30 bg-bq-amber/10 border-l-[3px] border-l-bq-amber px-4 py-3.5 mb-3 flex items-center gap-3"
        >
          <span aria-hidden className="material-symbols-outlined text-bq-amberd text-[26px] shrink-0">
            arrow_downward
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-bq-amberd mb-0.5">
              {t('home.emptyState.label')}
            </div>
            <div className="text-[14px] font-bold text-bq-ink leading-tight">{t('home.emptyState.title')}</div>
            <p className="text-[12px] text-bq-ink2 mt-0.5">{t('home.emptyState.description')}</p>
          </div>
        </div>
      )}

      {/* Verse lightwell — Khung Sáng focal point */}
      <VerseLightwell />

      {/* Daily — State A featured / State B completed strip + ranked hero */}
      {dailyDone ? (
        <DailyCompletedStrip
          correctCount={dailyCorrect}
          totalCount={dailyTotal}
          countdownText={countdown}
          onReview={() => navigate('/daily')}
        />
      ) : (
        <FeaturedDailyCard onStart={() => navigate('/daily')} />
      )}
      {dailyDone && (
        <HeroRankedCard
          energyRemaining={energyRemaining}
          energyMax={energyMax}
          rankedAnswered={rankedAnswered}
          rankedCap={rankedCap}
          onEnter={() => navigate('/ranked')}
        />
      )}

      {/* Quests — today's missions */}
      <section data-testid="home-daily-missions" className="mb-5">
        <DailyMissionsCard />
      </section>

      {/* 3 core mode cards (Khung Sáng) */}
      <SectionHeader title={t('home.primary.title')} />
      <div data-testid="home-modes-grid" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ModeCard
          variant="study"
          title={t('gameModes.practice')}
          desc={t('home.compactSubtitles.practice')}
          inner={t('home.mode.studyInner', 'Tự do · không tính XP · luyện theo từng sách')}
          cta={t('home.mode.studyCta', 'Tiếp tục')}
          onClick={() => navigate('/practice')}
        />
        <ModeCard
          variant="ranked"
          title={t('gameModes.ranked', 'Đấu Hạng')}
          desc={t('home.mode.rankedDesc', 'Cạnh tranh bảng xếp hạng theo mùa')}
          inner={
            <span>
              {t('home.mode.rankedInner', 'Năng lượng')} ·{' '}
              <b className="text-bq-ink">{energyRemaining}/{energyMax}</b>
            </span>
          }
          cta={t('home.mode.rankedCta', 'Vào trận')}
          onClick={() => navigate('/ranked')}
        />
        <ModeCard
          variant="rooms"
          title={t('gameModes.rooms')}
          desc={t('home.mode.roomsDesc', 'Chơi cùng bạn bè & hội thánh · 5 chế độ')}
          inner={t('home.mode.roomsInner', 'Tạo phòng hoặc tham gia bằng mã')}
          cta={t('home.mode.roomsCta', 'Tìm phòng')}
          onClick={() => navigate('/multiplayer')}
        />
      </div>
    </div>
  )
}
