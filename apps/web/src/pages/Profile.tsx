import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/authStore'

// --- Static data (to be replaced with API data later) ---

const USER = {
  name: 'Nguyễn Văn A',
  title: 'Tân Tín Hữu',
  level: 12,
  coverImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA_2svHltkb34shYGCf9-PJfW2HOHx01DO6y2JrTlRvjlC_vZTTHkhGqs0F4n0VTURex5c6114-NHHBlkEnO7rZ_93rp-maO7WIucjrwDzki0RPNnhC9uQvSafCfrUHRRUdGdBh3BCwfciA5NJVr5qr8Bm3Tl9ltKBBQGZEmxsv9faaVUr8EanCHevebtowhmvYNCwxdF1DdJ34yD4qzbChuPdMU14lRuW1S1o-gveLcFFV88qOM4UAQdd7IHcCN9Q2k_7gkRLIOUQ',
  avatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAP5PpXpHAtcFcSJwbaIdBNeUoaxx07hCqk-27gR9A1zQ3lGwgrex4TF5GKVtAPXpJoVpXsGGx4GA1sPQ89bl3xQXewGAYRGMxAvYG2VZ1Hly5ExAxxgcyz4IF4vej4DEYCbAF40BMMQ2eB06NXCbSztvyPEwU0ABywxhIOM9NP5Kxw8qnHuJVj2Sm0NR8VkJ1XnEqo8JvRDeiKTWQtWut9CvCrxIGNxyj3YWwYDxAMkMMiM0qI3wNoN5k7Xd_D1CM6XWROSsRfEeg',
}

const TIER_PROGRESS = {
  currentTier: 'Tân Tín Hữu',
  nextTier: 'Sứ Đồ',
  currentExp: 850,
  nextTierExp: 1200,
  progressPercent: 65,
  expRemaining: 350,
}

const QUICK_STATS = [
  { icon: 'quiz', iconFill: false, label: 'Số câu hỏi', value: '1,420', bgColor: 'bg-secondary/10', textColor: 'text-secondary' },
  { icon: 'bolt', iconFill: true, label: 'Chuỗi tốt nhất', value: '24 Ngày', bgColor: 'bg-[#e7c268]/10', textColor: 'text-[#e7c268]' },
  { icon: 'target', iconFill: false, label: 'Độ chính xác', value: '92.5%', bgColor: 'bg-primary/10', textColor: 'text-primary', hiddenOnMobile: true },
]

type HeatmapColor =
  | 'bg-secondary'
  | 'bg-secondary/60'
  | 'bg-secondary/80'
  | 'bg-secondary/30'
  | 'bg-surface-container-high'

const HEATMAP_CELLS: HeatmapColor[] = [
  'bg-secondary', 'bg-secondary/60', 'bg-secondary', 'bg-surface-container-high', 'bg-secondary/30', 'bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-secondary/80', 'bg-secondary', 'bg-surface-container-high', 'bg-surface-container-high', 'bg-secondary', 'bg-secondary/60', 'bg-secondary', 'bg-secondary/30', 'bg-secondary', 'bg-secondary', 'bg-secondary/80', 'bg-secondary',
  'bg-secondary/30', 'bg-secondary', 'bg-surface-container-high', 'bg-surface-container-high', 'bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-secondary/80', 'bg-secondary', 'bg-secondary', 'bg-secondary/30', 'bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-surface-container-high', 'bg-secondary/30', 'bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-secondary',
  'bg-secondary', 'bg-secondary/60', 'bg-secondary', 'bg-surface-container-high', 'bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-surface-container-high', 'bg-surface-container-high', 'bg-secondary', 'bg-secondary/80', 'bg-secondary', 'bg-surface-container-high', 'bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-secondary/30', 'bg-secondary', 'bg-secondary/80',
  'bg-surface-container-high', 'bg-surface-container-high', 'bg-secondary/30', 'bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-secondary/60', 'bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-secondary/80', 'bg-secondary', 'bg-secondary', 'bg-surface-container-high', 'bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-secondary/30', 'bg-secondary', 'bg-secondary/80',
]

const BADGES = [
  { icon: 'auto_stories', name: 'Học giả', description: 'Đọc 50 chương', locked: false },
  { icon: 'local_fire_department', name: 'Rực cháy', description: '7 ngày liên tiếp', locked: false },
  { icon: 'military_tech', name: 'Vô địch', description: 'Top 1 tuần', locked: false },
  { icon: 'trophy', name: 'Nhà truyền giáo', description: 'Mời 10 bạn bè', locked: true },
  { icon: 'workspace_premium', name: 'Thánh kinh', description: 'Hoàn thành 500 câu', locked: true },
]

// --- Component ---

const FILL_STYLE = { fontVariationSettings: "'FILL' 1" }

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-secondary">
            Vui lòng đăng nhập để xem hồ sơ
          </h2>
          <Link
            to="/login"
            className="px-6 py-3 rounded-lg font-bold gold-gradient text-on-secondary inline-block"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden mb-12">
        <div className="h-48 md:h-72 relative">
          <img
            className="w-full h-full object-cover opacity-50"
            src={USER.coverImage}
            alt="Cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        <div className="absolute bottom-6 left-6 md:left-10 flex flex-col md:flex-row items-end gap-6 w-full pr-12">
          <div className="w-24 h-24 md:w-40 md:h-40 rounded-3xl border-4 border-background bg-surface-container-high overflow-hidden shadow-2xl relative z-10">
            <img
              alt="User avatar"
              className="w-full h-full object-cover"
              src={(user as any).picture || USER.avatar}
            />
          </div>
          <div className="flex-1 pb-4">
            <h1 className="text-3xl md:text-5xl font-black text-on-surface tracking-tight mb-1">
              {user.name || USER.name}
            </h1>
            <p className="text-secondary font-bold flex items-center gap-2 text-lg">
              <span
                className="material-symbols-outlined text-xl"
                style={FILL_STYLE}
              >
                verified
              </span>
              {TIER_PROGRESS.currentTier} &bull; Cấp độ {USER.level}
            </p>
          </div>
          <div className="hidden lg:flex gap-3 pb-4">
            <button className="px-6 py-3 bg-surface-container-highest border border-outline-variant/20 rounded-xl font-bold text-sm hover:bg-surface-bright transition-colors">
              Chỉnh sửa hồ sơ
            </button>
            <button className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary hover:bg-secondary/20 transition-colors">
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid Stats & Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        {/* Tier Progress */}
        <div className="md:col-span-2 bg-surface-container rounded-3xl p-10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-on-surface tracking-tight uppercase">
                Tiến trình danh hiệu
              </h2>
              <span className="text-xs font-black bg-tertiary-container text-tertiary px-4 py-1.5 rounded-full uppercase tracking-widest">
                {TIER_PROGRESS.nextTier} (Tiếp theo)
              </span>
            </div>
            <div className="relative h-5 w-full bg-primary-container rounded-full overflow-hidden mb-6">
              <div
                className="absolute top-0 left-0 h-full gold-gradient rounded-full shadow-[0_0_12px_rgba(232,168,50,0.3)]"
                style={{ width: `${TIER_PROGRESS.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-sm font-bold text-on-surface-variant uppercase tracking-tighter">
              <span>{TIER_PROGRESS.currentTier}</span>
              <span>
                {TIER_PROGRESS.currentExp} / {TIER_PROGRESS.nextTierExp.toLocaleString()} EXP
              </span>
              <span>{TIER_PROGRESS.nextTier}</span>
            </div>
          </div>
          <div className="mt-10 flex gap-6 items-center">
            <div className="flex -space-x-3">
              <div className="w-12 h-12 rounded-full border-2 border-surface-container bg-surface-container-high flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-surface-container bg-surface-container-high flex items-center justify-center text-on-surface-variant opacity-50">
                <span className="material-symbols-outlined text-2xl">lock</span>
              </div>
            </div>
            <p className="text-base text-on-surface-variant italic font-medium leading-relaxed">
              &ldquo;Còn {TIER_PROGRESS.expRemaining} EXP nữa để nhận danh hiệu{' '}
              {TIER_PROGRESS.nextTier} và mở khóa phần thưởng đặc biệt.&rdquo;
            </p>
          </div>
        </div>

        {/* Quick Stats Column */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
          {QUICK_STATS.map((stat) => (
            <div
              key={stat.label}
              className={`bg-surface-container rounded-3xl p-8 flex items-center gap-5${
                stat.hiddenOnMobile ? ' hidden md:flex' : ''
              }`}
            >
              <div className={`p-4 ${stat.bgColor} rounded-2xl ${stat.textColor}`}>
                <span
                  className="material-symbols-outlined text-3xl"
                  style={stat.iconFill ? FILL_STYLE : undefined}
                >
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-on-surface-variant tracking-widest">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-on-surface">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Section */}
      <section className="bg-surface-container rounded-3xl p-10 mb-12 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-xl font-bold text-on-surface tracking-tight uppercase">
            Nhật ký học tập
          </h2>
          <div className="flex items-center gap-6 text-xs font-bold text-on-surface-variant">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-surface-container-high rounded-sm" />
              <span>Nghỉ ngơi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-secondary/30 rounded-sm" />
              <span>Học ít</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-secondary rounded-sm" />
              <span>Năng nổ</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto pb-4">
          <div className="streak-grid min-w-[600px] gap-1.5">
            {HEATMAP_CELLS.map((colorClass, i) => (
              <div key={i} className={`h-5 ${colorClass} rounded-sm`} />
            ))}
          </div>
        </div>
      </section>

      {/* Badge Collection */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-on-surface tracking-tight uppercase">
            Bộ sưu tập huy hiệu
          </h2>
          <a
            className="text-secondary text-sm font-black uppercase tracking-widest hover:underline"
            href="#"
          >
            Xem tất cả
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {BADGES.map((badge) => (
            <div
              key={badge.name}
              className={`bg-surface-container rounded-3xl p-8 flex flex-col items-center text-center group${
                badge.locked
                  ? ' opacity-40 grayscale'
                  : ' hover:bg-surface-container-high'
              } transition-all`}
            >
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 border ${
                  badge.locked
                    ? 'bg-surface-container-high border-outline-variant/10'
                    : 'glass-effect border-secondary/20 shadow-[0_0_15px_rgba(232,168,50,0.1)] group-hover:scale-110'
                } transition-transform`}
              >
                <span
                  className={`material-symbols-outlined text-4xl ${
                    badge.locked ? 'text-on-surface-variant' : 'text-secondary'
                  }`}
                  style={!badge.locked ? FILL_STYLE : undefined}
                >
                  {badge.icon}
                </span>
              </div>
              <p className="text-sm font-black text-on-surface mb-2">{badge.name}</p>
              <p className="text-xs text-on-surface-variant font-medium">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default Profile