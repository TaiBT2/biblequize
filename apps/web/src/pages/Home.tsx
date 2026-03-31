import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GameModeGrid from '../components/GameModeGrid'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

/* ── Static data ── */
const leaderboardPlayers = [
  {
    rank: 1,
    name: 'Minh T\u00e2m',
    xp: '2,840',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdSWu5Vt8vBhG2O4usyFtwteyx8cytrk0uKZhYkw7P3G58SKAqB83IK41fpvqHf_fNuTjnAZPCBDSFRgfBvJaYyZiSnjzNVjidbsRXXKWApr7zMaD8oHWBe7Lby5ws6gw5g0DjllGSINFrgDhdFk5kGk-ApIhot804GXmHEDDkLq_6Rv024banAHe_K_vevARIwPggAYz-IbmN4QdLUq8xyBEaX6vpXdhBDD9HoAP6rQiv4HG-FDmU_7ZT2Zh-0sJAVDpgRIh6C8I',
    highlighted: true,
  },
  {
    rank: 2,
    name: 'Th\u1ebf Vinh',
    xp: '2,610',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHqN9sg79WenvYcROC_t6ZIEZTrsIA9p4QOp1dEXVCbLpGupAxPWp4V1AC6sUXRkvvlcLBMZ2f86--vc3PCIO4z9vh3GmEaDw6i1X49-uxChla1LIOuAjxxp2ZqKcFag5UTRssk8xKroNsCQ8vIWyyFi1I2nWUk11OIztz5dZN_Ssou3Sjw6fbtBtACuFuE0W7lDX-dEnL6-HjZwazikoFfDdSfJua9whz7663HSFG9wKd7YFsWnPeQ1WHed8BH5YZqDAIkzGC-x4',
    highlighted: false,
  },
  {
    rank: 3,
    name: 'Ph\u01b0\u01a1ng Mai',
    xp: '2,450',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYZPKlCtR-3pgNrWf13PFWTzJWciETSeXqtNDiC_vG_q2p1UiE4X-IUN_wWXgdg8GzsHpltxY-3kcaBdELcLqZeAW43bZU90CbA01EP9Q_bD0r1yQCbiQdBj350qkzPVpkdnTPhhIUI2ECFbLlZr0EE12a8if1t0zoDLuHqYEGQTe5PLUYV2xaY_T6obdfDGa3GmNjYyYD28BHsnNLhoot_qigJ2ZHRDP8Nf9uYimppHcTqlzYL0uMeRS9l0JuxPf20e7-jlG5938',
    highlighted: false,
  },
]

const currentPlayer = {
  rank: 14,
  name: 'B\u1ea1n (T\u00f4i)',
  xp: '1,820',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYYwX1zsDjBj3jm21pJ6y1CXygnlFCbncE_SEqnEG51ucLvIZ-JbGbQ_nHC_dH7bkUWWHE00ej1g3VQ4z2U6Gu3NyljN2vhT8b1MV12TOlf3IgbGXngOf-3ym1iKLOCFdYdMGBeFyIrbqdmdElnTLiSZWjepM8SK8z5bAKCU8z0CLzcNOVO4q71fD3urGPMstQgGiJKoTNhQtWs0YMURQSI2BiP55y6TBveNE0WqnzROp7dUwWXmGYyrTmZoFKElHKfVU-P4N8EaY',
}

/* ── Skeleton Loading Component ── */
function HomeSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[240px] rounded-3xl bg-surface-container" />

      {/* Quick stats skeleton */}
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-24 rounded-2xl bg-surface-container-low" />
        ))}
      </div>

      {/* Main grid skeleton */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="h-8 w-48 rounded-lg bg-surface-container" />
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[220px] rounded-3xl bg-surface-container" />
            ))}
          </div>
          <div className="h-40 rounded-3xl bg-surface-container-low" />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="h-96 rounded-3xl bg-surface-container" />
          <div className="h-32 rounded-3xl bg-surface-container-low" />
        </div>
      </div>
    </div>
  )
}

/* ── Main Home Page ── */
function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate initial data readiness
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <HomeSkeleton />

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* ── Hero Bento Section: Greeting + Rank ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rank Card with Greeting */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-surface-container p-8 border border-outline-variant/10 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-secondary/10 transition-colors" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            {/* Rank Badge */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-secondary/20 flex items-center justify-center bg-surface-container-high shadow-inner">
                <span className="material-symbols-outlined text-6xl text-secondary" style={FILL_1}>scrollable_header</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary text-[10px] font-black px-2 py-1 rounded-md shadow-lg uppercase tracking-tighter">
                {'\u0056\u00e0ng III'}
              </div>
            </div>
            {/* Greeting & Progress */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-on-surface mb-1">
                  {'Ch\u00e0o m\u1eebng!'}
                </h1>
                <p className="text-on-surface-variant text-sm font-medium">
                  {'B\u1ea1n \u0111ang tr\u00ean h\u00e0nh tr\u00ecnh tr\u1edf th\u00e0nh '}
                  <span className="text-secondary font-bold">{'Hi\u1ec1n Tri\u1ebft'}</span>.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    {'Ti\u1ebfn tr\u00ecnh h\u1ea1ng'}
                  </span>
                  <span className="text-xs font-bold text-on-surface">{'8,200 / 15,000 \u0111i\u1ec3m'}</span>
                </div>
                <div className="h-3 w-full bg-primary-container rounded-full overflow-hidden">
                  <div className="h-full gold-gradient-bg rounded-full shadow-[0_0_12px_rgba(248,189,69,0.3)]" style={{ width: '54.6%' }} />
                </div>
                <p className="text-[10px] text-right text-on-surface-variant font-medium">
                  {'C\u00f2n 6,800 \u0111i\u1ec3m \u0111\u1ec3 \u0111\u1ea1t h\u1ea1ng Hi\u1ec1n Tri\u1ebft'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Rank Preview */}
        <div className="rounded-2xl bg-surface-container-low border border-outline-variant/10 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center border border-white/5">
            <span className="material-symbols-outlined text-4xl text-tertiary" style={FILL_1}>lightbulb</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-on-surface uppercase tracking-tight">
              {'H\u1ea1ng k\u1ebf ti\u1ebfp'}
            </h3>
            <p className="text-2xl font-black text-tertiary">{'Hi\u1ec1n Tri\u1ebft'}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/20">
            <span className="material-symbols-outlined text-xs text-tertiary">auto_awesome</span>
            <span className="text-[10px] font-bold text-tertiary uppercase">
              {'M\u1edf kh\u00f3a: \u0110\u00e8n D\u1ea7u C\u1ed5'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Game Modes Section ── */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black tracking-tight text-on-surface">
            {'Ch\u1ebf \u0111\u1ed9 ch\u01a1i'}
          </h2>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            {'Kh\u00e1m ph\u00e1 6 ch\u1ebf \u0111\u1ed9'}
          </span>
        </div>

        {/* Game Mode Grid */}
        <GameModeGrid />
      </section>

      {/* ── Bottom Row: Leaderboard & Feed ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaderboard Section */}
        <div className="lg:col-span-8 bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-black tracking-tight text-on-surface">
              {'B\u1ea3ng X\u1ebfp H\u1ea1ng'}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex p-1 bg-surface-container-high rounded-lg">
                <button className="px-3 py-1.5 text-[10px] font-bold bg-secondary text-on-secondary rounded-md shadow-sm">
                  {'To\u00e0n c\u1ea7u'}
                </button>
                <button className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant hover:text-on-surface transition-colors">
                  {'B\u1ea1n b\u00e8'}
                </button>
                <button className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant hover:text-on-surface transition-colors">
                  {'Nh\u00f3m'}
                </button>
                <button className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant hover:text-on-surface transition-colors">
                  Season
                </button>
              </div>
              <div className="flex p-1 bg-surface-container-high rounded-lg">
                <button className="px-3 py-1.5 text-[10px] font-bold text-on-surface">
                  {'H\u00e0ng ng\u00e0y'}
                </button>
                <button className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant">
                  {'H\u00e0ng tu\u1ea7n'}
                </button>
              </div>
            </div>
          </div>

          {/* Ranking List */}
          <div className="space-y-3">
            {leaderboardPlayers.map((player) => (
              <div
                key={player.rank}
                className={
                  player.highlighted
                    ? 'flex items-center justify-between p-4 rounded-xl bg-secondary/5 border border-secondary/10'
                    : 'flex items-center justify-between p-4 rounded-xl hover:bg-surface-container-high transition-colors'
                }
              >
                <div className="flex items-center gap-4">
                  <span className={`text-xl font-black w-6 text-center ${player.highlighted ? 'text-secondary' : 'text-on-surface-variant'}`}>
                    {player.rank}
                  </span>
                  <div className={`w-10 h-10 rounded-full overflow-hidden ${player.highlighted ? 'border-2 border-secondary' : ''}`}>
                    <img alt={player.name} className="w-full h-full object-cover" src={player.avatar} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">{player.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">{player.xp} XP</p>
                  </div>
                </div>
                {player.highlighted && (
                  <span className="material-symbols-outlined text-secondary" style={FILL_1}>workspace_premium</span>
                )}
              </div>
            ))}

            {/* Current Player */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-highest border-l-4 border-secondary">
              <div className="flex items-center gap-4">
                <span className="text-sm font-black text-on-surface w-6 text-center">{currentPlayer.rank}</span>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-secondary">
                  <img alt="you" className="w-full h-full object-cover" src={currentPlayer.avatar} />
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm">{currentPlayer.name}</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">{currentPlayer.xp} XP</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feed & Social Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Activity Feed */}
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-on-surface text-sm">
                {'Ho\u1ea1t \u0111\u1ed9ng g\u1ea7n \u0111\u00e2y'}
              </h3>
              <button className="material-symbols-outlined text-on-surface-variant text-sm">refresh</button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary text-sm" style={FILL_1}>celebration</span>
                </div>
                <p className="text-xs text-on-surface leading-tight">
                  <span className="font-bold">{'Nguy\u1ec5n A'}</span>
                  {' v\u1eeba \u0111\u1ea1t '}
                  <span className="text-tertiary font-bold">{'Hi\u1ec1n Tri\u1ebft'}</span>
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-sm">group_add</span>
                </div>
                <p className="text-xs text-on-surface leading-tight">
                  <span className="font-bold">{'Minh T\u00e2m'}</span>
                  {' \u0111\u00e3 tham gia v\u00e0o Nh\u00f3m Gi\u00e1o X\u1ee9 c\u1ee7a b\u1ea1n.'}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-sm">local_fire_department</span>
                </div>
                <p className="text-xs text-on-surface leading-tight">
                  <span className="font-bold">{'H\u00f9ng D\u0169ng'}</span>
                  {' \u0111\u1ea1t chu\u1ed7i h\u1ecdc t\u1eadp 30 ng\u00e0y!'}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Scripture Glass Card */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-secondary/10 blur-2xl" />
            <div className="flex flex-col gap-4 relative z-10">
              <div className="h-1 w-8 bg-secondary rounded-full" />
              <p className="text-sm font-medium italic text-on-surface leading-relaxed">
                {'\u201cL\u1eddi Ch\u00faa l\u00e0 ng\u1ecdn \u0111\u00e8n cho ch\u00e2n t\u00f4i, \u00e1nh s\u00e1ng cho \u0111\u01b0\u1eddng l\u1ed1i t\u00f4i.\u201d'}
              </p>
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Thi Thi\u00ean 119:105</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
