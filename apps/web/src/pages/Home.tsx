import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import GameModeGrid from '../components/GameModeGrid'
import TutorialOverlay from '../components/TutorialOverlay'
import { useAuthStore } from '../store/authStore'
import { api } from '../api/client'
import { getDailyVerse } from '../data/verses'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

/* ── Tier System (from SPEC-v2 section 2.1) ── */
const TIERS = [
  { nameKey: 'tiers.spark', minPoints: 0, icon: 'spa', color: 'text-outline' },
  { nameKey: 'tiers.seeker', minPoints: 1_000, icon: 'eco', color: 'text-green-400' },
  { nameKey: 'tiers.disciple', minPoints: 5_000, icon: 'scrollable_header', color: 'text-[#4a9eff]' },
  { nameKey: 'tiers.sage', minPoints: 15_000, icon: 'lightbulb', color: 'text-[#9b59b6]' },
  { nameKey: 'tiers.prophet', minPoints: 40_000, icon: 'local_fire_department', color: 'text-secondary' },
  { nameKey: 'tiers.apostle', minPoints: 100_000, icon: 'workspace_premium', color: 'text-[#ff6b6b]' },
]

function getTierInfo(points: number) {
  let currentIdx = 0
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) { currentIdx = i; break }
  }
  const current = TIERS[currentIdx]
  const next = TIERS[currentIdx + 1] ?? null
  const progressPct = next
    ? Math.min(100, Math.round(((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100))
    : 100
  const pointsToNext = next ? next.minPoints - points : 0
  return { current, next, progressPct, pointsToNext }
}

function getGreeting(t: any): string {
  const h = new Date().getHours()
  if (h < 12) return t('home.greetingMorning')
  if (h < 18) return t('home.greetingAfternoon')
  return t('home.greetingEvening')
}

/* ── Skeleton ── */
function HomeSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[200px] rounded-2xl bg-surface-container" />
        <div className="h-[200px] rounded-2xl bg-surface-container-low" />
      </div>
      <div className="h-8 w-48 rounded-lg bg-surface-container" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 rounded-2xl bg-surface-container" />)}
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 h-80 rounded-2xl bg-surface-container" />
        <div className="col-span-4 h-80 rounded-2xl bg-surface-container-low" />
      </div>
    </div>
  )
}

/* ── Main ── */
export default function Home() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [lbPeriod, setLbPeriod] = useState<'daily' | 'weekly'>('daily')

  // TanStack Query: user profile
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/me').then(r => r.data),
    staleTime: 5 * 60_000, // 5 min
  })

  // TanStack Query: leaderboard
  const { data: lbData, isLoading: lbLoading, isFetching: lbFetching } = useQuery({
    queryKey: ['home-leaderboard', lbPeriod],
    queryFn: () => api.get(`/api/leaderboard/${lbPeriod}?size=5`).then(r => r.data),
    staleTime: 30_000,
    keepPreviousData: true,
  })

  // TanStack Query: my rank
  const { data: rankData } = useQuery({
    queryKey: ['home-my-rank', lbPeriod],
    queryFn: () => api.get(`/api/leaderboard/${lbPeriod}/my-rank`).then(r => r.data),
    staleTime: 30_000,
  })

  if (meLoading && lbLoading) return <HomeSkeleton />

  const totalPoints = meData?.totalPoints ?? 0
  const leaderboard: any[] = Array.isArray(lbData) ? lbData : []
  const myRank = rankData?.rank ?? null
  const userName = user?.name || t('home.defaultName')
  const tier = getTierInfo(totalPoints)
  const greeting = getGreeting(t)

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      <TutorialOverlay />
      {/* ── Hero: Greeting + Tier ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-surface-container p-8 border border-outline-variant/10 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-secondary/10 transition-colors" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-secondary/20 flex items-center justify-center bg-surface-container-high shadow-inner">
                <span className={`material-symbols-outlined text-6xl ${tier.current.color}`} style={FILL_1}>{tier.current.icon}</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary text-[10px] font-black px-2 py-1 rounded-md shadow-lg uppercase tracking-tighter">
                {t(tier.current.nameKey)}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-on-surface mb-1">
                  {greeting}, {userName}!
                </h1>
                <p className="text-on-surface-variant text-sm font-medium">
                  {tier.next ? (
                    <>{t('home.journeyTo')} <span className="text-secondary font-bold">{t(tier.next.nameKey)}</span>.</>
                  ) : (
                    <span className="text-secondary font-bold">{t('home.maxTierReached')}</span>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('home.tierProgress')}</span>
                  <span className="text-xs font-bold text-on-surface">
                    {totalPoints.toLocaleString()} {tier.next ? `/ ${tier.next.minPoints.toLocaleString()} ${t('home.points')}` : t('home.points')}
                  </span>
                </div>
                <div className="h-3 w-full bg-primary-container rounded-full overflow-hidden">
                  <div className="h-full gold-gradient rounded-full shadow-[0_0_12px_rgba(248,189,69,0.3)]" style={{ width: `${tier.progressPct}%` }} />
                </div>
                {tier.next && (
                  <p className="text-[10px] text-right text-on-surface-variant font-medium">
                    {t('home.pointsToNext', { points: tier.pointsToNext.toLocaleString(), tier: t(tier.next.nameKey) })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Next Rank Preview */}
        <div className="rounded-2xl bg-surface-container-low border border-outline-variant/10 p-6 flex flex-col items-center justify-center text-center space-y-4">
          {tier.next ? (
            <>
              <div className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center border border-white/5">
                <span className={`material-symbols-outlined text-4xl ${tier.next.color}`} style={FILL_1}>{tier.next.icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface uppercase tracking-tight">{t('home.nextTier')}</h3>
                <p className={`text-2xl font-black ${tier.next.color}`}>{t(tier.next.nameKey)}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/20">
                <span className="material-symbols-outlined text-xs text-tertiary">auto_awesome</span>
                <span className="text-[10px] font-bold text-tertiary uppercase">{t('home.unlockRewards')}</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center border border-white/5">
                <span className="material-symbols-outlined text-4xl text-secondary" style={FILL_1}>workspace_premium</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-secondary uppercase tracking-tight">{t('home.maxTier')}</h3>
                <p className="text-sm text-on-surface-variant">{t('home.conqueredAll')}</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Game Modes ── */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black tracking-tight text-on-surface">{t('home.gameModes')}</h2>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('home.explore6Modes')}</span>
        </div>
        <GameModeGrid />
      </section>

      {/* ── Journey Widget ── */}
      <JourneyWidget />

      {/* ── Leaderboard + Feed ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-black tracking-tight text-on-surface">{t('home.leaderboard')}</h3>
            {/* Period tabs */}
            <div className="flex p-1 bg-surface-container-high rounded-lg">
              {([['daily', 'home.daily'], ['weekly', 'home.weekly']] as const).map(([key, labelKey]) => (
                <button
                  key={key}
                  onClick={() => setLbPeriod(key)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${lbPeriod === key ? 'bg-secondary text-on-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className={`space-y-3 transition-opacity duration-200 ${lbFetching ? 'opacity-50' : 'opacity-100'}`}>
            {leaderboard.length === 0 ? (
              <p className="text-center text-on-surface-variant py-8">{t('home.noLeaderboardData')}</p>
            ) : leaderboard.map((p: any, i: number) => (
              <div key={p.userId || i} className={`flex items-center justify-between p-4 rounded-xl ${i === 0 ? 'bg-secondary/5 border border-secondary/10' : 'hover:bg-surface-container-high transition-colors'}`}>
                <div className="flex items-center gap-4">
                  <span className={`text-xl font-black w-6 text-center ${i === 0 ? 'text-secondary' : 'text-on-surface-variant'}`}>{i + 1}</span>
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/20 overflow-hidden">
                    {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                      <span className="text-sm font-bold text-on-surface-variant">{(p.name || p.userName || '?').charAt(0).toUpperCase()}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{p.name || p.userName}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">{p.groupName || ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${i === 0 ? 'text-secondary' : 'text-on-surface'}`}>{(p.points || 0).toLocaleString()} XP</p>
                  <p className="text-[10px] font-bold text-on-surface-variant">{(p.questions || 0)} {t('home.questions')}</p>
                </div>
              </div>
            ))}
            {myRank && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-highest border-l-4 border-secondary">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-on-surface w-6 text-center">#{myRank}</span>
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-secondary overflow-hidden">
                    <span className="material-symbols-outlined text-secondary text-sm">person</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{t('home.you', { name: userName })}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">{t(tier.current.nameKey)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-on-surface text-sm">{totalPoints.toLocaleString()} XP</p>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">{t(tier.current.nameKey)}</p>
                </div>
              </div>
            )}
          </div>

          <Link to="/leaderboard" className="block mt-4 text-center text-xs font-bold text-secondary hover:underline uppercase tracking-widest">
            {t('home.viewAll')}
          </Link>
        </div>

        {/* Activity + Verse */}
        <div className="lg:col-span-4 space-y-6">
          {/* Activity Feed */}
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-on-surface text-sm">{t('home.recentActivity')}</h4>
              <button className="material-symbols-outlined text-on-surface-variant text-sm hover:text-on-surface transition-colors">refresh</button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary text-sm" style={FILL_1}>celebration</span>
                </div>
                <p className="text-xs text-on-surface leading-tight">
                  <span className="font-bold">Nguyễn A</span> {t('home.activityReachedTier', { tier: t('tiers.sage') })}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-sm">group_add</span>
                </div>
                <p className="text-xs text-on-surface leading-tight">
                  <span className="font-bold">Minh Tâm</span> {t('home.activityJoinedGroup')}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-sm">local_fire_department</span>
                </div>
                <p className="text-xs text-on-surface leading-tight">
                  <span className="font-bold">Hùng Dũng</span> {t('home.activityStreak', { days: 30 })}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Scripture */}
          {(() => { const verse = getDailyVerse(); return (
          <div className="glass-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-secondary/10 blur-2xl" />
            <div className="flex flex-col gap-4 relative z-10">
              <div className="h-1 w-8 bg-secondary rounded-full" />
              <p className="text-sm font-medium italic text-on-surface leading-relaxed">
                "{verse.text}"
              </p>
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{verse.ref}</p>
            </div>
          </div>
          ) })()}
        </div>
      </section>
    </div>
  )
}

function JourneyWidget() {
  const { t, i18n } = useTranslation()
  const isVi = i18n.language === 'vi'

  const { data } = useQuery<{ summary: { completedBooks: number; totalBooks: number; currentBook: string | null; overallMasteryPercent: number } }>({
    queryKey: ['journey-summary', i18n.language],
    queryFn: async () => (await api.get(`/api/me/journey?language=${i18n.language}`)).data,
  })

  if (!data) return null

  const { summary } = data
  const pct = summary.totalBooks > 0 ? Math.round((summary.completedBooks / summary.totalBooks) * 100) : 0

  return (
    <Link to="/journey" className="block">
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 hover:border-secondary/20 transition-all group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
            <div>
              <p className="text-sm font-bold text-on-surface">
                {t('journey.homeWidget', { count: summary.completedBooks, total: summary.totalBooks })}
              </p>
              {summary.currentBook && (
                <p className="text-xs text-on-surface-variant">
                  {t('journey.currentBook', { book: summary.currentBook, percent: summary.overallMasteryPercent })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary transition-colors">chevron_right</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
