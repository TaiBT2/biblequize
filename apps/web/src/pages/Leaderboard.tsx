import { useState } from 'react'

type Tab = 'daily' | 'weekly' | 'all'

// ── Top 3 Podium Data ─────────────────────────────────────────────────────
const podiumPlayers = [
  {
    rank: 1,
    name: 'Lm. Giuse',
    points: '15,820',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYzkN3J_q7mpBCFPzcJtgL_KvmEl0kNMXV5jMqOsIK5n9z95xwzimbTu8ij08uKbruTuqzJNWedTy8wbve-qikq13bJAhQB4SIHNVxKO0Y8-wi76pna02j4M6aGvJcpTUJ-Av4LCduak-vudFXcmnX7ayDAcPQkEK5ViYDnm_egx630Hf1LH7Lrq8CRytke-TbhNpPqYFCW4BPR4ywJDOQV5n2q8IVVqpEaj_XD8Yp_zNN7QbCJLulFXwKNMZ1-cvYqi2oTa9PV4A',
  },
  {
    rank: 2,
    name: 'Minh Anh',
    points: '12,450',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7vVFZDDfh6YhfakkW57gBfLWSEUFWqmrWXgIwH4Uygudrnn4oIDDFHUzel9toDZzms6rJ0LfExHmd-edtKMiZICWfBBvpC28EK1RshLc9jEmYYxf-av-9B3a4HTo_nyQGXMj3cRrJjGM1zsup1a86_1OvJ9pxNWWBIn7GTzdR_lwv1Bu1W1DFdVYo9lAWZ5Ro4Xt--4-yboiuyHbgduzn5kPXuZnNAdebYWWawzpib-yVhV4LAa-CuOa39fC3qggUzY7bjw8Wb68',
  },
  {
    rank: 3,
    name: 'Thanh Tâm',
    points: '11,200',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCGtb046yyc8qnzj2Qk1Rv1eF_-CJbMk4lltFLWOqZJx4FtDEeRwKPL-DWHhv11ZHiU5kE8HvI-3mBq0oLzCgQRrrbxHStYkJNQvs6LuvjZmAREX790EnqfmwB3gbVK_6Hp9zE2JR9Jd3SFbgvsTz0hLrIh_LtXOAmMQc_bKfj2Q0jvV4lj_h6E4jCO3UEGgy_SiHYKnaxsA1WIHNxWbmY4aAQgHmhhmmp3YCmlTKz7HkxFC4huiewl7wFsu0NxHw3lAZl3VYx8XY',
  },
]

// ── Leaderboard Table Data ────────────────────────────────────────────────
interface LeaderboardEntry {
  rank: number
  name: string
  tier: string
  points: string
  avatar: string
  isMe?: boolean
}

const leaderboardEntries: LeaderboardEntry[] = [
  {
    rank: 4,
    name: 'Nguyễn Văn A',
    tier: 'Hạng Bạc',
    points: '9,840',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEO3eOXeGnqNGhRh8ycEXmXC6QaHjbmPMIfR3hiARcEiEU5Z5uoKzDhIBfK9aN6odcFJ7i-vQxgWVxGfEbNvrPBNNJVg0jqIIaQksB-hdHrTAYxGQIoPp0U8S_jI6ooDyvezfBWI3LJ9-14UzHO2eX_bXwvsJH89EGvlUrrbth3WX1Mn-VwXXbTNwEMVMD1GYsmir6a-lNDbCaCTU1gYHKxRTXUQhcZ9ox-svhnDBGJ6W9rtAURNwlR8KR0VXrzAOv0ZqqVmtyt84',
  },
  {
    rank: 24,
    name: 'Người Học (Bạn)',
    tier: 'Hạng Vàng',
    points: '4,520',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwYmfw0E-U4kxmRpKjb0aW0plPsNKA2ZcAhGxaFeZUQrink7tAEw_iShxIYYhs81dW3ybGsvyrNC7y615zccZrSuM1ETN34Ku7oyJ19Gdp25nLiiH4Y-3tjL0oXhlgRL9hooWdnvRIriiuAQTtiqESYj7v38Q5jUoR4rRhk_MAapaeTrtlB2PrgxH1-qqovk9x9sJc4WC6fOpQZAA3doktrea6KVEXosdaUL7o9riVeDqN4Oo6_3l63b_gU9u-exmcV1IqHgVa7SM',
    isMe: true,
  },
  {
    rank: 5,
    name: 'Bà Maria',
    tier: 'Hạng Đồng',
    points: '8,210',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYmkFMwW0gNU-KBL2S4tsf7uwmBwsIKMRpWt-4jB510_HzzVD-QEBuF7dOYCugopAwqaU6zpEfA-nKjRiUw95tUg56N_ryopl32qLE14hS46qormdl4KFN6ER9uPBp2LjeNS3vvvJgMNuGjLvc95bp1R23k9zOD4T4VdYsWa3utMf9YRPOGOgrKiVkskSf6FO4fnAnHwyUgPC1Mb2DQYfeyLCJGzRKpOyfiq9Yp_W1mfWyvqaj0PZPs7lhLndpxqBqXMvjneHVfGI',
  },
  {
    rank: 6,
    name: 'Tân Phước',
    tier: 'Hạng Sắt',
    points: '7,550',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA28lfrRzH0NyAMi5LKjjwLKUntZOOKfJisalP27xAdXd3BfC2yguRLEJ1rLevExTXj4YsjM7ZsQzPZchYCkqth5-J-oYbmmn23SIvSPCOMj57cdoFrDfL4JJCfb6lxkq_HT0qx-0TugaBaGX1KAJghkOjbGxh9gH-_bxNxodOZyHRW2Esj-PH5RH8o2hTFHJz3puHtVyMBQnPBU124qT9WTPqgKzpW5qJvy5YyQgrHWxCuDvrPQ1PiNJOLsoX202vspIwPBdi3t2E',
  },
]

// ── Tier Info Data ────────────────────────────────────────────────────────
const tierInfo = [
  {
    icon: 'workspace_premium',
    iconColor: 'text-secondary',
    borderColor: 'border-secondary/40',
    name: 'Hạng Vàng',
    description: 'Top 5% người chơi có điểm số cao nhất mùa giải.',
    filled: true,
  },
  {
    icon: 'military_tech',
    iconColor: 'text-[#c0c0c0]',
    borderColor: 'border-[#c0c0c0]/40',
    name: 'Hạng Bạc',
    description: 'Top 15% người chơi tích cực trong tuần.',
    filled: true,
  },
  {
    icon: 'award_star',
    iconColor: 'text-[#cd7f32]',
    borderColor: 'border-[#cd7f32]/40',
    name: 'Hạng Đồng',
    description: 'Top 40% người chơi hoàn thành thử thách.',
    filled: true,
  },
  {
    icon: 'stars',
    iconColor: 'text-outline',
    borderColor: 'border-outline/40',
    name: 'Hạng Sắt',
    description: 'Hạng khởi đầu cho mọi thành viên mới.',
    filled: false,
  },
]

// ── Tab Config ────────────────────────────────────────────────────────────
const tabs: { key: Tab; label: string }[] = [
  { key: 'daily', label: 'Hàng ngày' },
  { key: 'weekly', label: 'Hàng tuần' },
  { key: 'all', label: 'Tất cả' },
]

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<Tab>('daily')

  return (
    <div className="px-4 md:px-10 max-w-5xl mx-auto py-6">
      {/* Header & Countdown */}
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2">Bảng Xếp Hạng</h1>
          <p className="text-on-surface-variant text-sm">Tranh tài cùng cộng đồng tín hữu trên toàn thế giới.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-low px-4 py-3 rounded-xl border-l-4 border-secondary">
          <span
            className="material-symbols-outlined text-secondary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            timer
          </span>
          <div>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Kết thúc mùa giải trong</p>
            <p className="text-secondary font-bold font-mono">03 Ngày : 12 Giờ : 45 Phút</p>
          </div>
        </div>
      </header>

      {/* Top 3 Podium */}
      <section className="grid grid-cols-3 gap-4 md:gap-10 items-end mb-16 px-2">
        {/* Rank 2 */}
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-[#c0c0c0]/30 overflow-hidden">
              <img alt="Rank 2" className="w-full h-full object-cover" src={podiumPlayers[1].avatar} />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#c0c0c0] text-[#11131e] w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</div>
          </div>
          <p className="font-bold text-xs md:text-sm text-center truncate w-full">{podiumPlayers[1].name}</p>
          <p className="text-secondary text-[10px] md:text-xs font-bold">{podiumPlayers[1].points} pts</p>
          <div className="w-full h-20 md:h-24 bg-surface-container rounded-t-xl mt-6 flex items-end justify-center pb-2 opacity-60">
            <span className="text-[#c0c0c0] font-black text-2xl">II</span>
          </div>
        </div>

        {/* Rank 1 */}
        <div className="flex flex-col items-center">
          <div className="relative mb-6 scale-110">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <span
                className="material-symbols-outlined text-secondary text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>
            </div>
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-secondary overflow-hidden shadow-[0_0_30px_rgba(232,168,50,0.3)]">
              <img alt="Rank 1" className="w-full h-full object-cover" src={podiumPlayers[0].avatar} />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-secondary text-on-secondary w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
          </div>
          <p className="font-black text-sm md:text-base text-center truncate w-full">{podiumPlayers[0].name}</p>
          <p className="text-secondary text-xs md:text-sm font-bold">{podiumPlayers[0].points} pts</p>
          <div className="w-full h-28 md:h-36 bg-gradient-to-t from-surface-container to-surface-container-high rounded-t-2xl mt-6 flex items-end justify-center pb-4">
            <span className="text-secondary font-black text-4xl">I</span>
          </div>
        </div>

        {/* Rank 3 */}
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-[#cd7f32]/30 overflow-hidden">
              <img alt="Rank 3" className="w-full h-full object-cover" src={podiumPlayers[2].avatar} />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#cd7f32] text-[#11131e] w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">3</div>
          </div>
          <p className="font-bold text-xs md:text-sm text-center truncate w-full">{podiumPlayers[2].name}</p>
          <p className="text-secondary text-[10px] md:text-xs font-bold">{podiumPlayers[2].points} pts</p>
          <div className="w-full h-16 md:h-20 bg-surface-container rounded-t-xl mt-6 flex items-end justify-center pb-2 opacity-40">
            <span className="text-[#cd7f32] font-black text-2xl">III</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <nav className="flex p-1 bg-surface-container-low rounded-2xl mb-10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.key
                ? 'text-on-surface bg-surface-container-highest rounded-xl shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Table List */}
      <div className="space-y-4 mb-16">
        {leaderboardEntries.map((entry) =>
          entry.isMe ? (
            /* My Rank Row (Highlighted) */
            <div
              key={entry.rank}
              className="flex items-center gap-4 p-6 bg-[#e8a832] rounded-2xl border-l-8 border-background/20 shadow-[0_15px_30px_rgba(232,168,50,0.3)] transition-transform hover:scale-[1.01]"
            >
              <div className="w-8 text-center font-black text-[#11131e]">{entry.rank}</div>
              <div className="relative">
                <img
                  alt="Me"
                  className="w-12 h-12 rounded-full border-2 border-[#11131e] shadow-lg"
                  src={entry.avatar}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-[#11131e]">{entry.name}</h3>
                  <span className="bg-[#11131e]/10 text-[#11131e] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                    Của Tôi
                  </span>
                </div>
                <p className="text-[10px] uppercase font-bold text-[#11131e]/80 tracking-wider">{entry.tier}</p>
              </div>
              <div className="text-right">
                <p className="text-[#11131e] font-black text-lg">{entry.points}</p>
                <p className="text-[10px] uppercase text-[#11131e]/60 font-bold">Điểm</p>
              </div>
            </div>
          ) : (
            /* Normal Rank Row */
            <div
              key={entry.rank}
              className="flex items-center gap-4 p-5 bg-surface-container-low rounded-2xl hover:bg-surface-container-high transition-all group"
            >
              <div className="w-8 text-center font-black text-on-surface-variant group-hover:text-on-surface transition-colors">
                {entry.rank}
              </div>
              <div className="relative">
                <img
                  alt="Player"
                  className="w-10 h-10 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all"
                  src={entry.avatar}
                />
                <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-surface-container border border-surface-container-high rounded-full flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[10px] text-tertiary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    military_tech
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-on-surface">{entry.name}</h3>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">{entry.tier}</p>
              </div>
              <div className="text-right">
                <p className="text-on-surface font-black text-sm">{entry.points}</p>
                <p className="text-[10px] uppercase text-on-surface-variant">Điểm</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Tier Info */}
      <section className="glass-card p-8 rounded-3xl mb-24 border border-outline-variant/10">
        <h4 className="text-lg font-black mb-8 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">info</span>
          Phân Hạng Mùa Giải
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {tierInfo.map((tier) => (
            <div key={tier.name} className={`p-5 bg-surface-container-lowest rounded-2xl border-t-2 ${tier.borderColor}`}>
              <span
                className={`material-symbols-outlined ${tier.iconColor} mb-3`}
                style={tier.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tier.icon}
              </span>
              <p className="font-bold text-sm mb-2">{tier.name}</p>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">{tier.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
