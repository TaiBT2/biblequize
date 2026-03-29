import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GameModeGrid from '../components/GameModeGrid'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

/* ── Static data ── */
const leaderboardPlayers = [
  {
    rank: 1,
    name: 'Minh Tâm',
    xp: '2,840',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdSWu5Vt8vBhG2O4usyFtwteyx8cytrk0uKZhYkw7P3G58SKAqB83IK41fpvqHf_fNuTjnAZPCBDSFRgfBvJaYyZiSnjzNVjidbsRXXKWApr7zMaD8oHWBe7Lby5ws6gw5g0DjllGSINFrgDhdFk5kGk-ApIhot804GXmHEDDkLq_6Rv024banAHe_K_vevARIwPggAYz-IbmN4QdLUq8xyBEaX6vpXdhBDD9HoAP6rQiv4HG-FDmU_7ZT2Zh-0sJAVDpgRIh6C8I',
    highlighted: true,
  },
  {
    rank: 2,
    name: 'Thế Vinh',
    xp: '2,610',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHqN9sg79WenvYcROC_t6ZIEZTrsIA9p4QOp1dEXVCbLpGupAxPWp4V1AC6sUXRkvvlcLBMZ2f86--vc3PCIO4z9vh3GmEaDw6i1X49-uxChla1LIOuAjxxp2ZqKcFag5UTRssk8xKroNsCQ8vIWyyFi1I2nWUk11OIztz5dZN_Ssou3Sjw6fbtBtACuFuE0W7lDX-dEnL6-HjZwazikoFfDdSfJua9whz7663HSFG9wKd7YFsWnPeQ1WHed8BH5YZqDAIkzGC-x4',
    highlighted: false,
  },
  {
    rank: 3,
    name: 'Phương Mai',
    xp: '2,450',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYZPKlCtR-3pgNrWf13PFWTzJWciETSeXqtNDiC_vG_q2p1UiE4X-IUN_wWXgdg8GzsHpltxY-3kcaBdELcLqZeAW43bZU90CbA01EP9Q_bD0r1yQCbiQdBj350qkzPVpkdnTPhhIUI2ECFbLlZr0EE12a8if1t0zoDLuHqYEGQTe5PLUYV2xaY_T6obdfDGa3GmNjYyYD28BHsnNLhoot_qigJ2ZHRDP8Nf9uYimppHcTqlzYL0uMeRS9l0JuxPf20e7-jlG5938',
    highlighted: false,
  },
]

const currentPlayer = {
  rank: 14,
  name: 'Bạn (Tôi)',
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
      {/* ── Hero Section ── */}
      <section className="relative h-[240px] rounded-3xl overflow-hidden bg-surface-container shadow-xl">
        <div className="absolute inset-0 opacity-40">
          <img
            className="w-full h-full object-cover"
            alt="Sacred background with golden light"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_PpEQUKHKbtKT1Y87DoRzXZC2RsPvIjLbLOY__uk1l0Np-jmmKZER93_IKeETZ-hm0SG9RV3NyYsjzIs5KgUaKPwUtc6cNpDMONvGXfyzLxivF-jRzs_7ZlSZAD_2QWFiwq4Wsu_DKJB_QVz3Z69dao8fOakWGYu10l3Mp--NZwOxmU4uE4VKMeG8a0IihRCvtNh6h7i92jiITzT_kOFAGaq0xFdhlgF7EekhSQNcKI1V8hWzW___1APjjorMJw6qkIskKFFPIwk"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-dim via-surface-dim/80 to-transparent" />
        </div>
        <div className="relative h-full flex flex-col justify-center px-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 w-fit">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em]">Sự kiện đặc biệt</span>
          </div>
          <h2 className="text-5xl font-black text-on-surface tracking-tighter leading-none">Khám phá Lời Chúa</h2>
          <p className="text-on-surface-variant max-w-md text-lg leading-relaxed">
            Tham gia các thử thách đố vui Kinh Thánh hằng ngày để tích lũy phước lành và kiến thức.
          </p>
          <button
            onClick={() => navigate('/practice')}
            className="w-fit px-8 py-3 gold-gradient-bg text-on-secondary rounded-xl font-bold tracking-tight active:scale-95 transition-transform shadow-lg shadow-secondary/20"
          >
            Chơi Ngay
          </button>
        </div>
      </section>

      {/* ── Quick Stats Row ── */}
      <section className="flex gap-4">
        {/* Streak */}
        <div className="flex-1 bg-surface-container-low p-4 rounded-2xl flex items-center justify-between border-l-4 border-error/50">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-3xl" style={FILL_1}>local_fire_department</span>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Streak</p>
              <p className="text-xl font-black text-on-surface">12 Ngày</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl">trending_up</span>
        </div>

        {/* Rank */}
        <div className="flex-1 bg-surface-container-low p-4 rounded-2xl flex items-center justify-between border-l-4 border-secondary/50">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-3xl" style={FILL_1}>workspace_premium</span>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Hạng</p>
              <p className="text-xl font-black text-on-surface">Vàng III</p>
            </div>
          </div>
          <span className="text-xs font-bold text-secondary">Thăng hạng: 45%</span>
        </div>

        {/* Today's XP */}
        <div className="flex-1 bg-surface-container-low p-4 rounded-2xl flex items-center justify-between border-l-4 border-primary/50">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">insights</span>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Điểm hôm nay</p>
              <p className="text-xl font-black text-on-surface">450 XP</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl">history_edu</span>
        </div>
      </section>

      {/* ── Main Grid (12 cols) ── */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left column (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-on-surface tracking-tight">Chọn Chế Độ Chơi</h3>
            <button className="text-sm font-bold text-secondary hover:underline">Xem tất cả</button>
          </div>

          {/* Game Mode Grid */}
          <GameModeGrid />

          {/* Daily Verse */}
          <div className="mt-8 p-8 rounded-3xl bg-surface-container-low border-l-4 border-secondary relative overflow-hidden group">
            <span className="material-symbols-outlined absolute -right-4 -top-4 text-[120px] text-secondary/5 rotate-12">
              format_quote
            </span>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Câu gốc hằng ngày</p>
              <blockquote className="text-2xl font-medium text-on-surface leading-relaxed italic pr-12">
                &ldquo;Lời Chúa là ngọn đèn cho chân con, là ánh sáng cho đường lối con.&rdquo;
              </blockquote>
              <cite className="block mt-6 text-on-surface-variant font-bold tracking-tight">— Thi Thiên 119:105</cite>
            </div>
          </div>
        </div>

        {/* Right column (4 cols) — Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Leaderboard Preview */}
          <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-on-surface">Bảng Xếp Hạng</h4>
              <Link to="/leaderboard">
                <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-on-surface">open_in_new</span>
              </Link>
            </div>
            <div className="space-y-4">
              {leaderboardPlayers.map((player) => (
                <div
                  key={player.rank}
                  className={
                    player.highlighted
                      ? 'flex items-center gap-4 p-3 rounded-2xl bg-secondary/5 border border-secondary/20'
                      : 'flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container-highest transition-colors'
                  }
                >
                  <span className={`font-black w-6 ${player.highlighted ? 'text-xl text-secondary' : 'text-lg text-on-surface-variant'}`}>
                    {player.rank}
                  </span>
                  <div className={`w-10 h-10 rounded-full overflow-hidden ${player.highlighted ? 'bg-surface-container-highest border-2 border-secondary' : 'bg-surface-container-highest'}`}>
                    <img alt={player.name} className="w-full h-full object-cover" src={player.avatar} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface">{player.name}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">{player.xp} XP</p>
                  </div>
                  {player.highlighted && (
                    <span className="material-symbols-outlined text-secondary" style={FILL_1}>workspace_premium</span>
                  )}
                </div>
              ))}

              {/* Current Player */}
              <div className="pt-4 border-t border-outline-variant/15 mt-4">
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-primary-container/30 border border-primary/20">
                  <span className="text-sm font-bold text-on-primary-container w-6">{currentPlayer.rank}</span>
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-primary/40">
                    <img alt="you" className="w-full h-full object-cover" src={currentPlayer.avatar} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface">{currentPlayer.name}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">{currentPlayer.xp} XP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Mini Card */}
          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4">Thành tích mới nhất</h4>
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center border border-white/5">
                <span className="material-symbols-outlined text-secondary text-3xl" style={FILL_1}>local_fire_department</span>
              </div>
              <div className="flex-1 justify-center flex flex-col">
                <p className="font-bold text-on-surface leading-tight">Ngọn Lửa Đức Tin</p>
                <p className="text-xs text-on-surface-variant">Duy trì streak 10 ngày liên tục</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
