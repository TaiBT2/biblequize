import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import ComebackModal from '../components/ComebackModal'
import DailyBonusModal from '../components/DailyBonusModal'
import TutorialOverlay from '../components/TutorialOverlay'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { getTierInfo } from '../data/tiers'
import { getTimeOfDayGreeting } from '../utils/greeting'
import { localizeSeasonName } from '../utils/seasonName'

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
      <div className="h-[150px] rounded-[22px] bg-bq-inset" />
      <div className="h-[220px] rounded-[22px] bg-bq-inset" />
      <div className="h-[120px] rounded-[22px] bg-bq-inset" />
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
    <section data-testid="home-verse" className="mb-1">
      <div
        className="relative mx-auto max-w-[740px] px-7 md:px-[54px] pt-11 pb-9 text-center
                   border border-bq-hair border-b-0 bq-arch-well
                   bg-[radial-gradient(120%_80%_at_50%_4%,rgba(255,236,190,.85),#fff_62%)] shadow-bq-amb"
      >
        <span aria-hidden className="absolute left-1/2 -translate-x-1/2 -top-px h-[3px] w-[74%] rounded-full bg-bq-spectrum opacity-60" />
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
      <div aria-hidden className="max-w-[740px] mx-auto h-3.5 rounded-b-xl bg-bq-spectrum shadow-[0_26px_50px_-22px_rgba(45,70,200,.35),0_26px_50px_-22px_rgba(224,53,75,.3)]" />
    </section>
  )
}

/* ── XP spectrum bar (10 segments filling along the refraction spectrum) ── */
function XpSpectrumBar({ pct }: { pct: number }) {
  const segments = 10
  const filled = Math.floor((pct / 100) * segments)
  const partial = ((pct / 100) * segments) - filled
  return (
    <div className="flex gap-[5px]">
      {Array.from({ length: segments }).map((_, i) => {
        if (i < filled)
          return (
            <span key={i} className="flex-1 h-[13px] rounded bg-bq-spectrum"
              style={{ backgroundSize: `${segments * 52}% 100%`, backgroundPosition: `${(i / (segments - 1)) * 100}% 50%` }} />
          )
        if (i === filled)
          return (
            <span key={i} className="flex-1 h-[13px] rounded bg-bq-inset border border-bq-hair relative overflow-hidden">
              <span className="absolute inset-0 bg-bq-amber" style={{ width: `${partial * 100}%` }} />
            </span>
          )
        return <span key={i} className="flex-1 h-[13px] rounded bg-bq-inset border border-bq-hair" />
      })}
    </div>
  )
}

/* ── Quest lamp row (no red = error; warm lamp encodes status) ── */
type QuestStatus = 'done' | 'progress' | 'todo'
function QuestRow({ label, value, target }: { label: string; value: number; target: number }) {
  const status: QuestStatus = value >= target ? 'done' : value > 0 ? 'progress' : 'todo'
  const pct = status === 'done' ? 100 : Math.round((value / Math.max(1, target)) * 100)
  const lamp = status === 'done'
    ? 'bg-[linear-gradient(180deg,#FFE08A,var(--bq-amber))] border-transparent shadow-[0_0_8px_rgba(245,158,11,.6)]'
    : status === 'progress'
      ? 'bg-[linear-gradient(180deg,#FFD98A,#FF8A3D)] border-transparent shadow-[0_0_7px_rgba(255,138,61,.5)]'
      : 'bg-bq-inset border-bq-hair'
  const fill = status === 'done'
    ? 'bg-[linear-gradient(90deg,#FFD773,var(--bq-amber))]'
    : status === 'progress'
      ? 'bg-[linear-gradient(90deg,var(--bq-amber),#FF8A3D)]'
      : 'bg-transparent'
  return (
    <div className="flex items-center gap-3.5 py-4 border-b border-bq-hair last:border-0">
      <span aria-hidden className={`w-2.5 h-[13px] shrink-0 border rounded-[50%_50%_50%_50%/60%_60%_40%_40%] ${lamp}`} />
      <span className={`flex-1 text-[13.5px] font-semibold ${status === 'done' ? 'text-bq-ink2' : 'text-bq-ink'}`}>{label}</span>
      <span className="w-[150px] h-[7px] bg-bq-inset rounded-full overflow-hidden hidden sm:block">
        <span className={`block h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="w-9 text-right text-xs font-extrabold text-bq-ink2 tabular-nums">
        {status === 'done' ? '✓' : `${value}/${target}`}
      </span>
    </div>
  )
}

/* ── Mode card (Khung Sáng jewel cards) ── */
type ModeVariant = 'study' | 'ranked' | 'rooms'
const MODE_STYLE: Record<ModeVariant, { edge: string; shadow: string; shadowHover: string; accent: string; tag: string }> = {
  study: { edge: 'from-bq-sapphire to-[#6E86F0]', shadow: 'shadow-bq-sap', shadowHover: 'hover:shadow-bq-sap-h', accent: 'text-bq-sapphire', tag: 'HỌC MỘT MÌNH' },
  ranked: { edge: 'from-bq-ruby to-[#FF7A5A]', shadow: 'shadow-bq-rub', shadowHover: 'hover:shadow-bq-rub-h', accent: 'text-bq-ruby', tag: 'THI ĐẤU' },
  rooms: { edge: 'from-bq-emerald to-[#46C89A]', shadow: 'shadow-bq-eme', shadowHover: 'hover:shadow-bq-eme-h', accent: 'text-bq-emerald', tag: 'CÙNG NHAU' },
}
function ModeCard({ variant, title, desc, inner, cta, onClick }: {
  variant: ModeVariant; title: string; desc: string; inner: React.ReactNode; cta: string; onClick: () => void
}) {
  const m = MODE_STYLE[variant]
  return (
    <button type="button" onClick={onClick} data-testid={`home-mode-${variant}`}
      className={`group relative text-left bg-bq-white border border-bq-hair p-6 min-h-[240px] flex flex-col gap-2 overflow-hidden bq-arch-card transition-transform duration-200 hover:-translate-y-1.5 ${m.shadow} ${m.shadowHover}`}>
      <span className={`absolute inset-x-0 top-0 h-[5px] bg-gradient-to-r ${m.edge}`} />
      <span className={`text-eyebrow font-extrabold tracking-[0.18em] mt-1 ${m.accent}`}>{m.tag}</span>
      <h4 className="font-display text-[23px] font-extrabold tracking-tight text-bq-ink">{title}</h4>
      <p className="text-[12.5px] text-bq-ink2 leading-relaxed">{desc}</p>
      <div className="mt-auto border border-bq-hair bg-bq-paper rounded-2xl px-3.5 py-3 text-xs text-bq-ink2">{inner}</div>
      <div className={`flex justify-between items-center mt-3.5 text-sm font-extrabold ${m.accent}`}>
        <span>{cta}</span><span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </button>
  )
}

/* ── Main ── */
export default function Home() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const dcLang = (i18n.language === 'en' ? 'en' : 'vi') as 'vi' | 'en'

  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(x => x + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['me'], queryFn: () => api.get('/api/me').then(r => r.data), staleTime: 5 * 60_000,
  })
  const { data: tierData } = useQuery({
    queryKey: ['me-tier-progress'], queryFn: () => api.get('/api/me/tier-progress').then(r => r.data), staleTime: 60_000,
  })
  const { data: rankedStatus } = useQuery<{ livesRemaining?: number; dailyLives?: number; seasonPoints?: number }>({
    queryKey: ['ranked-status'], queryFn: () => api.get('/api/me/ranked-status').then(r => r.data), staleTime: 60_000,
  })
  const { data: activeSeason } = useQuery<{ active?: boolean; name?: string }>({
    queryKey: ['active-season'], queryFn: () => api.get('/api/seasons/active').then(r => r.data), staleTime: 30 * 60_000,
  })
  const { data: weeklyRank } = useQuery<{ rank?: number; total?: number } | null>({
    queryKey: ['leaderboard', 'my-rank', 'weekly'],
    queryFn: () => api.get('/api/leaderboard/weekly/my-rank').then(r => r.data).catch(() => null),
    staleTime: 60_000,
  })
  const { data: dcData } = useQuery<{ alreadyCompleted?: boolean; totalQuestions?: number }>({
    queryKey: ['daily-challenge', dcLang],
    queryFn: () => api.get(`/api/daily-challenge?language=${dcLang}`).then(r => r.data), staleTime: 60_000,
  })
  const { data: dcResult } = useQuery<{ correctCount?: number; totalQuestions?: number }>({
    queryKey: ['daily-challenge-result'],
    queryFn: () => api.get('/api/daily-challenge/result').then(r => r.data),
    enabled: !!dcData?.alreadyCompleted, staleTime: 60_000,
  })
  const { data: missionsData } = useQuery<{ missions?: { description?: string; progress?: number; target?: number; completed?: boolean }[] }>({
    queryKey: ['daily-missions'],
    queryFn: () => api.get('/api/me/daily-missions').then(r => r.data).catch(() => null), staleTime: 60_000,
  })

  if (meLoading) return <HomeSkeleton />

  const totalPoints = tierData?.totalPoints ?? meData?.totalPoints ?? 0
  const currentStreak = meData?.currentStreak ?? 0
  const energy = rankedStatus?.livesRemaining ?? 100
  const seasonPoints = rankedStatus?.seasonPoints ?? 0
  const tier = getTierInfo(totalPoints)
  const greeting = getTimeOfDayGreeting(t)
  const userName = user?.name || t('home.defaultName')
  const lvl = tierData?.tierLevel ?? tier.current.id
  const isMaxTier = tier.next === null
  const dailyDone = !!dcData?.alreadyCompleted
  const dailyTotalQ = dcData?.totalQuestions ?? 5
  const dailyCorrect = dcResult?.correctCount ?? 0
  const dailyTotal = dcResult?.totalQuestions ?? dailyTotalQ
  const countdown = formatHHMMSS(msUntilMidnightUtc())
  const seasonLabel = activeSeason?.active && activeSeason.name
    ? (localizeSeasonName(activeSeason.name, t) ?? activeSeason.name)
    : t('home.greeting.seasonPoints')
  const wRank = weeklyRank?.rank ?? null

  const isNewUser = totalPoints === 0 && !dailyDone && currentStreak === 0
  const missions = missionsData?.missions ?? []
  const missionsDone = missions.filter(m => m.completed).length

  return (
    <div data-testid="home-page" className="max-w-[1180px] mx-auto w-full">
      <ComebackModal />
      <DailyBonusModal />
      <TutorialOverlay />

      {/* ── HERO (centered, mockup-faithful) ── */}
      <section data-testid="home-greeting-card" className="text-center pt-2 pb-1">
        <div className="text-[11px] font-extrabold tracking-[0.24em] text-bq-amberd mb-3 uppercase">✦ {greeting}</div>
        <h1 className="font-display text-[clamp(32px,5.6vw,56px)] font-extrabold tracking-[-0.03em] leading-[1.04] text-bq-ink">
          {t('home.hero.ready', 'Sẵn sàng chưa,')}{' '}
          <span data-testid="home-greeting-name" className="relative whitespace-nowrap">
            {userName}?
            {/* Full-spectrum underline — static + symmetric (sapphire→ruby trải đều dưới tên). */}
            <span aria-hidden className="absolute left-0 right-0 bottom-[6px] h-3 -z-10 rounded-full bg-bq-spectrum opacity-45 blur-[1px]" />
          </span>
        </h1>

        <div className="mt-4 flex items-center justify-center gap-x-3 gap-y-1.5 flex-wrap text-[15px] text-bq-ink2">
          <span className="text-[11px] font-extrabold text-white px-2.5 py-1 rounded-full bg-bq-ink">LV. {lvl}</span>
          {isMaxTier ? (
            <span data-testid="home-greeting-max-tier" className="font-semibold text-bq-amberd">
              👑 {t('home.maxTierReached')}
            </span>
          ) : (
            <span>
              <span data-testid="home-greeting-tier-label" className="text-bq-ink font-bold">{t(tier.current.nameKey)}</span>
              {' → '}
              <b className="text-bq-ink">{tier.next && t(tier.next.nameKey)}</b>
            </span>
          )}
          {wRank != null && (
            <>
              <span className="text-bq-ink3">·</span>
              <span>{t('home.hero.weeklyRank', 'Hạng tuần')} <b className="text-bq-ink">#{wRank}</b>{weeklyRank?.total ? ` / ${weeklyRank.total.toLocaleString()}` : ''}</span>
            </>
          )}
        </div>

        {!isMaxTier && (
          <div className="mt-6 max-w-[560px] mx-auto">
            <XpSpectrumBar pct={tier.progressPct} />
            <div className="flex justify-between mt-2.5 text-[12px] text-bq-ink2">
              <span><b className="text-bq-ink">{totalPoints.toLocaleString()}</b> / {tier.next?.minPoints.toLocaleString()} XP</span>
              <span>{t('home.hero.toNext', 'còn')} <b className="text-bq-ink">{tier.pointsToNext.toLocaleString()} XP</b></span>
            </div>
          </div>
        )}

        {/* Compact stat row (adapted: mockup keeps these in the top nav) */}
        <div className="mt-5 inline-flex items-center gap-5 text-[13px] font-bold text-bq-ink">
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-bq-ruby" />{currentStreak} <span className="text-bq-ink3 font-semibold text-[10.5px] uppercase tracking-wide">{t('home.greeting.streak')}</span></span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-bq-amber" />{energy} <span className="text-bq-ink3 font-semibold text-[10.5px] uppercase tracking-wide">{t('home.greeting.energy')}</span></span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-bq-emerald" />{seasonPoints.toLocaleString()} <span className="text-bq-ink3 font-semibold text-[10.5px] uppercase tracking-wide">{seasonLabel}</span></span>
        </div>
      </section>

      {isNewUser && (
        <div data-testid="home-start-here" className="rounded-2xl border border-bq-amber/30 bg-bq-amber/10 border-l-[3px] border-l-bq-amber px-4 py-3.5 mt-4 mb-1 flex items-center gap-3 max-w-[740px] mx-auto">
          <span aria-hidden className="material-symbols-outlined text-bq-amberd text-[26px] shrink-0">arrow_downward</span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-bq-amberd mb-0.5">{t('home.emptyState.label')}</div>
            <div className="text-[14px] font-bold text-bq-ink leading-tight">{t('home.emptyState.title')}</div>
            <p className="text-[12px] text-bq-ink2 mt-0.5">{t('home.emptyState.description')}</p>
          </div>
        </div>
      )}

      {/* ── VERSE LIGHTWELL ── */}
      <div className="mt-10"><VerseLightwell /></div>
      <p className="text-center text-[12px] text-bq-ink2 mt-3.5 mb-2">{t('home.verseDriver', 'Hoàn thành nhiệm vụ hôm nay để tích thêm ánh sáng cho hành trình của bạn')}</p>

      {/* ── DAILY ── */}
      <div className="flex items-center gap-3 mt-11 mb-4">
        <span className="font-display text-[12px] font-extrabold text-white w-[26px] h-[26px] rounded-lg grid place-items-center bg-bq-amber">1</span>
        <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-bq-ink">{t('home.daily.section', 'Thử thách hôm nay')}</h2>
      </div>
      <section data-testid="home-daily" className="relative bg-bq-white border border-bq-hair rounded-[22px] p-7 md:p-8 overflow-hidden shadow-bq-amb">
        <span aria-hidden className="absolute top-0 inset-x-0 h-[5px] bg-bq-spectrum" />
        <div className="flex gap-7 items-center flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[0.14em] text-bq-amberd bg-bq-amber/10 px-3 py-1.5 rounded-full mb-3.5 uppercase">
              <span className="w-[7px] h-[7px] rounded-full bg-bq-amber" /> {t('home.daily.priority', 'Ưu tiên hôm nay')}
            </span>
            <h3 className="font-display text-[clamp(24px,3vw,31px)] font-extrabold tracking-[-0.02em] leading-[1.12] text-bq-ink">
              {dailyDone ? t('home.daily.doneTitle', 'Bạn đã hoàn thành hôm nay') : <>{t('home.daily.title', 'Bắt đầu ngày mới với')} <span className="text-bq-amberd">{t('home.daily.titleAccent', 'Lời Chúa')}</span></>}
            </h3>
            <div className="flex gap-2 mt-3.5 flex-wrap">
              {dailyDone ? (
                <span className="text-[12px] font-semibold text-bq-ink2 border border-bq-hair bg-bq-paper px-3 py-1.5 rounded-full">✅ {dailyCorrect}/{dailyTotal} đúng</span>
              ) : (
                <>
                  <span className="text-[12px] font-semibold text-bq-ink2 border border-bq-hair bg-bq-paper px-3 py-1.5 rounded-full">📖 {dailyTotalQ} câu</span>
                  <span className="text-[12px] font-semibold text-bq-ink2 border border-bq-hair bg-bq-paper px-3 py-1.5 rounded-full">⏱ ~3 phút</span>
                  <span className="text-[12px] font-semibold text-bq-ink2 border border-bq-hair bg-bq-paper px-3 py-1.5 rounded-full">🌐 {t('home.daily.community', 'Cùng cộng đồng')}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="text-[12px] text-bq-ink2">{t('home.daily.remaining', 'Còn lại trong ngày')} · <b className="text-bq-ink tabular-nums">{countdown}</b></div>
            <button
              data-testid="featured-daily-cta"
              onClick={() => navigate('/daily')}
              className="inline-flex items-center gap-2.5 font-extrabold text-[14.5px] text-white bg-bq-action px-7 py-[15px] rounded-[14px] shadow-bq-action transition hover:-translate-y-0.5 hover:brightness-105"
            >
              {dailyDone ? t('home.daily.reviewCta', 'Xem lại') : t('home.daily.playCta', 'Chơi ngay')}
              {!dailyDone && <span className="bg-white/25 text-xs font-extrabold px-2 py-0.5 rounded-md">+50 XP</span>}
            </button>
          </div>
        </div>
      </section>

      {/* ── QUESTS ── */}
      <div className="flex items-center gap-3 mt-11 mb-4">
        <span className="font-display text-[12px] font-extrabold text-white w-[26px] h-[26px] rounded-lg grid place-items-center bg-bq-ruby">2</span>
        <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-bq-ink">{t('home.missions.section', 'Nhiệm vụ hôm nay')}</h2>
        <span className="ml-auto text-[12.5px] font-bold text-bq-ink2">{missionsDone}/{missions.length || 3} {t('home.missions.completed', 'hoàn thành')}</span>
      </div>
      <section data-testid="home-daily-missions" className="bg-bq-white border border-bq-hair rounded-[20px] px-6 py-1">
        {missions.length > 0 ? (
          missions.map((m, i) => (
            <QuestRow key={i} label={m.description || `Nhiệm vụ ${i + 1}`} value={m.progress ?? 0} target={m.target ?? 1} />
          ))
        ) : (
          <div className="py-6 text-center text-[13px] text-bq-ink2">{t('home.missions.empty', 'Chưa có nhiệm vụ hôm nay')}</div>
        )}
      </section>

      {/* ── 3 MODE CARDS ── */}
      <div className="flex items-center gap-3 mt-11 mb-4">
        <span className="font-display text-[12px] font-extrabold text-white w-[26px] h-[26px] rounded-lg grid place-items-center bg-bq-sapphire">3</span>
        <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-bq-ink">{t('home.primary.title')}</h2>
      </div>
      <div data-testid="home-modes-grid" className="grid grid-cols-1 sm:grid-cols-3 gap-[18px]">
        <ModeCard variant="study" title={t('gameModes.practice')} desc={t('home.compactSubtitles.practice')}
          inner={t('home.mode.studyInner', 'Tự do · không tính XP · luyện theo từng sách')} cta={t('home.mode.studyCta', 'Tiếp tục')} onClick={() => navigate('/practice')} />
        <ModeCard variant="ranked" title={t('gameModes.ranked', 'Đấu Hạng')} desc={t('home.mode.rankedDesc', 'Cạnh tranh bảng xếp hạng theo mùa')}
          inner={<span>{t('home.mode.rankedInner', 'Năng lượng')} · <b className="text-bq-ink">{energy}</b></span>} cta={t('home.mode.rankedCta', 'Vào trận')} onClick={() => navigate('/ranked')} />
        <ModeCard variant="rooms" title={t('gameModes.rooms')} desc={t('home.mode.roomsDesc', 'Chơi cùng bạn bè & hội thánh · 5 chế độ')}
          inner={t('home.mode.roomsInner', 'Tạo phòng hoặc tham gia bằng mã')} cta={t('home.mode.roomsCta', 'Tìm phòng')} onClick={() => navigate('/multiplayer')} />
      </div>

      <div className="h-16" />
    </div>
  )
}
