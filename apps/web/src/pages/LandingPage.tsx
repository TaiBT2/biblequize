import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/* ────────────────────────────── Guest Header ────────────────────────────── */

function GuestHeader() {
  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#11131e] shadow-sm shadow-[#0b0e18]/20">
      <div className="flex items-center gap-8 max-w-7xl mx-auto w-full">
        <div className="text-2xl font-bold tracking-tighter text-[#f8bd45] font-headline">BibleQuiz</div>
        <div className="hidden md:flex gap-6 items-center flex-1">
          <a className="font-be-vietnam-pro tracking-tight text-[#f8bd45] border-b-2 border-[#f8bd45] pb-1" href="#">
            Home
          </a>
          <Link
            to="/leaderboard"
            className="font-be-vietnam-pro tracking-tight text-[#e1e1f1]/70 hover:text-[#e1e1f1] transition-colors duration-300"
          >
            Leaderboard
          </Link>
          <a className="font-be-vietnam-pro tracking-tight text-[#e1e1f1]/70 hover:text-[#e1e1f1] transition-colors duration-300" href="#">
            About
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold text-[#e1e1f1]/70 hover:text-[#e1e1f1] transition-colors active:scale-95"
          >
            Login
          </Link>
          <Link
            to="/login"
            className="gold-gradient px-6 py-2 rounded-xl text-on-secondary font-bold active:scale-95 transition-transform shadow-lg shadow-secondary/10 inline-block"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ────────────────────────────── Hero Section ────────────────────────────── */

function HeroSection() {
  return (
    <header className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary-container rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left – copy */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/20 border border-secondary/20 text-secondary text-sm font-medium tracking-wide">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            ỨNG DỤNG HỌC KINH THÁNH THẾ HỆ MỚI
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-on-surface">
            Học Lời Chúa mỗi ngày qua những <span className="text-secondary">thử thách</span> thú vị
          </h1>

          <p className="text-xl text-on-surface-variant leading-relaxed max-w-lg">
            Khám phá kho tàng tri thức Kinh Thánh thông qua các trò chơi tương tác, thi đấu cùng cộng đồng và theo dõi tiến trình thuộc linh của bạn.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/practice"
              className="gold-gradient px-8 py-4 rounded-xl text-on-secondary font-bold text-lg shadow-xl shadow-secondary/20 active:scale-95 transition-transform text-center"
            >
              Chơi Thử Ngay
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl border border-outline-variant/30 text-on-surface font-bold text-lg hover:bg-surface-container transition-colors active:scale-95 text-center"
            >
              Đăng Nhập
            </Link>
          </div>
        </div>

        {/* Right – image */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-secondary/10 rounded-[2rem] blur-2xl group-hover:bg-secondary/20 transition-all" />
          <img
            alt="Bible and Light"
            className="relative rounded-[2rem] shadow-2xl border border-outline-variant/15 w-full object-cover aspect-[4/3]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpEFLF4HdAAZtQmV6p7ZFtq-07HGD2UVS1ZVgbPxSev4YKp18Amt4MdHqCFGh2JrRl5z8UyUtxx7O5an0EGofE1Kkzf-lnCx_fHn2-S1-sdjas2YKfjghtOoVc-9_Vb69hY_f1Kee_27xarqfLFbHwfQelEbTOKW_ouxi_PqBWzhBFPVaR7BQBwYz9FkBO6DlHAdNGeKKuOutu3XwrKIR75hoWBmThBK6KGHpGo8uO9ZNvkcSIwpmItnWjnMcoahC_NJDQhMWkspM"
          />

          {/* Floating streak card */}
          <div className="absolute -bottom-6 -left-6 glass-card p-6 rounded-2xl border border-outline-variant/20 shadow-xl hidden lg:block">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center text-on-secondary">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-secondary font-bold">Daily Streak</p>
                <p className="text-xl font-bold text-on-surface">15 Ngày Liên Tiếp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ────────────────────────────── Features Grid ───────────────────────────── */

const features = [
  { icon: 'menu_book', title: '6 Chế Độ Chơi', desc: 'Từ trắc nghiệm nhanh đến thử thách trí nhớ và giải đố ô chữ Kinh Thánh.' },
  { icon: 'stars', title: 'Hạng Kinh Thánh', desc: "Thăng cấp từ 'Người Tìm Hiểu' đến 'Bậc Thầy Kinh Thánh' qua từng bài học." },
  { icon: 'church', title: 'Nhóm Hội Thánh', desc: 'Kết nối với ban ngành, cùng nhau học hỏi và tổ chức các giải đấu nội bộ.' },
  { icon: 'workspace_premium', title: 'Chuỗi Ngày & Thành Tích', desc: 'Duy trì thói quen đọc Lời Chúa mỗi ngày để nhận những phần thưởng hấp dẫn.' },
]

function FeaturesGrid() {
  return (
    <section className="py-24 px-6 bg-surface-container-low">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Tính Năng Nổi Bật</h2>
          <div className="h-1 w-20 gold-gradient mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.icon}
              className="p-8 bg-surface-container rounded-2xl hover:bg-surface-container-high transition-all duration-300 border-b-2 border-transparent hover:border-secondary group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">{f.icon}</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-on-surface-variant">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────── Try Now Section ─────────────────────────── */

function TryNowSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left info */}
        <div>
          <h2 className="text-4xl font-bold mb-6">Trải Nghiệm Thử Thách</h2>
          <p className="text-lg text-on-surface-variant mb-10 leading-relaxed">
            Không cần đăng ký, bạn có thể bắt đầu ngay bây giờ với các thử thách nhanh để kiểm tra kiến thức Kinh Thánh của mình.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-6 bg-surface-container rounded-2xl border-l-4 border-secondary">
              <span className="material-symbols-outlined text-secondary text-3xl mt-1">verified</span>
              <div>
                <h4 className="font-bold text-lg mb-1">Cập Nhật Thường Xuyên</h4>
                <p className="text-on-surface-variant text-sm">
                  Hơn 5000+ câu hỏi được biên soạn kỹ lưỡng từ các mục sư và giáo sư thần học.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-surface-container rounded-2xl border-l-4 border-primary">
              <span className="material-symbols-outlined text-primary text-3xl mt-1">devices</span>
              <div>
                <h4 className="font-bold text-lg mb-1">Đa Nền Tảng</h4>
                <p className="text-on-surface-variant text-sm">
                  Học trên web, máy tính bảng hoặc ứng dụng di động mọi lúc mọi nơi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right cards */}
        <div className="grid gap-6">
          {/* Daily Challenge Card */}
          <div className="bg-surface-container-high p-8 rounded-3xl relative overflow-hidden group border border-outline-variant/10">
            <div className="absolute top-0 right-0 p-4">
              <span className="px-3 py-1 bg-secondary/20 text-secondary text-xs font-bold rounded-full">
                POPULAR
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Thử Thách Hằng Ngày</h3>
            <p className="text-on-surface-variant mb-6">
              5 câu hỏi - 5 phút. Nội dung trọng tâm về các sự kiện trong tuần.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-primary-container flex items-center justify-center text-[10px] font-bold">
                  +1.2k players
                </div>
              </div>
              <Link
                to="/daily"
                className="gold-gradient px-6 py-3 rounded-xl text-on-secondary font-bold active:scale-95 transition-transform inline-block"
              >
                Thử Thách Ngay
              </Link>
            </div>
          </div>

          {/* Quick Practice Card */}
          <div className="bg-surface-container p-8 rounded-3xl border border-outline-variant/10 hover:bg-surface-container-high transition-colors">
            <h3 className="text-2xl font-bold mb-2">Luyện Tập Nhanh</h3>
            <p className="text-on-surface-variant mb-6">
              Thử 10 câu ngẫu nhiên từ toàn bộ kho dữ liệu Kinh Thánh.
            </p>
            <Link
              to="/practice"
              className="block w-full py-4 rounded-xl border border-secondary text-secondary font-bold hover:bg-secondary/10 transition-all active:scale-95 text-center"
            >
              Bắt Đầu
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────── Leaderboard Preview ─────────────────────── */

const leaderboardData = [
  { rank: '01', initials: 'AN', name: 'Nguyễn Văn An', xp: '24,500', title: 'Sứ Giả', top: true },
  { rank: '02', initials: 'LH', name: 'Lê Hồng Hạnh', xp: '21,200', title: 'Trưởng Lão', top: false },
  { rank: '03', initials: 'TM', name: 'Trần Minh', xp: '19,850', title: 'Chấp Sự', top: false },
  { rank: '10', initials: 'DP', name: 'Đặng Phương', xp: '12,400', title: 'Môn Đồ', top: false },
]

function LeaderboardPreview() {
  return (
    <section className="py-24 px-6 bg-surface-container-lowest">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block px-6 py-2 rounded-full gold-gradient text-on-secondary font-extrabold text-lg mb-6 shadow-xl shadow-secondary/10">
            MÙA PHỤC SINH 2025
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">Bảng Xếp Hạng Toàn Quốc</h2>
        </div>

        <div className="bg-surface-container rounded-[2rem] overflow-hidden border border-outline-variant/15 shadow-2xl">
          {/* Header row */}
          <div className="grid grid-cols-12 px-8 py-4 bg-surface-container-high text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            <div className="col-span-2">Hạng</div>
            <div className="col-span-6">Chiến Binh</div>
            <div className="col-span-2">XP</div>
            <div className="col-span-2 text-right">Danh Hiệu</div>
          </div>

          <div className="divide-y divide-outline-variant/10">
            {leaderboardData.map((entry, idx) => (
              <div key={entry.rank}>
                <div
                  className={`grid grid-cols-12 px-8 py-5 items-center ${
                    entry.top ? 'bg-secondary/5' : 'hover:bg-surface-container-high transition-colors'
                  }`}
                >
                  <div className={`col-span-2 ${entry.top ? 'font-black text-2xl text-secondary' : 'font-bold text-on-surface-variant'}`}>
                    {entry.rank}
                  </div>
                  <div className="col-span-6 flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        entry.top
                          ? 'bg-secondary text-on-secondary'
                          : 'bg-primary-container text-primary'
                      }`}
                    >
                      {entry.initials}
                    </div>
                    <span className={`font-bold ${entry.top ? 'text-lg' : ''}`}>{entry.name}</span>
                  </div>
                  <div className={`col-span-2 font-mono ${entry.top ? 'text-secondary' : 'text-on-surface-variant'}`}>
                    {entry.xp}
                  </div>
                  <div
                    className={`col-span-2 text-right text-xs font-bold uppercase ${
                      entry.top ? 'text-secondary' : idx < 3 ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {entry.title}
                  </div>
                </div>

                {/* Ellipsis between rank 03 and rank 10 */}
                {entry.rank === '03' && (
                  <div className="text-center py-4 text-on-surface-variant/40">&bull;&bull;&bull;</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────── Church Group Showcase ────────────────────── */

function ChurchGroupShowcase() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Image */}
        <div className="order-2 lg:order-1 relative">
          <div className="absolute -inset-10 bg-primary/10 rounded-full blur-[100px]" />
          <img
            alt="Group studying together"
            className="relative rounded-[2rem] shadow-2xl z-10"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnm3LIt9EiyqGvjOzhF7rg8NoKMQoAjbDHWgkYgYTcjATw8YGu6nvIwD21ypU3A5cSNU5YgzZ4oStRZaYpVP37Fv9KrmqJ1yTWYyNV8MPJOP9EQDvi7dwbLUPj2GK18ZXveYRRuAkiOMNcerFyYD3JwSSOXaWoBWLHZnb1UJZSmhsA5ppJF4A78tXcbZMRiP5dnGucV58PQs__oVK1uan3IZwbSeQ1R7wfr--M3W8K2cn0zQGPw2NGpSpzUFnFsNsWkUcurItdKsw"
          />

          {/* Floating stats */}
          <div className="absolute top-10 -right-8 glass-card p-6 rounded-2xl shadow-xl z-20 border border-white/10 hidden md:block">
            <div className="text-sm font-bold text-secondary mb-4 uppercase tracking-widest">Team Progress</div>
            <div className="space-y-3">
              <div className="h-2 w-48 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full w-[75%] gold-gradient" />
              </div>
              <div className="h-2 w-48 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full w-[45%] gold-gradient" />
              </div>
            </div>
          </div>
        </div>

        {/* Text + features */}
        <div className="order-1 lg:order-2 space-y-8">
          <h2 className="text-4xl font-bold leading-tight">Gắn Kết Cộng Đồng Hội Thánh Của Bạn</h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Tạo không gian học tập riêng cho Hội Thánh, ban ngành hoặc nhóm nhỏ của bạn. Theo dõi tiến độ và khích lệ nhau mỗi ngày.
          </p>

          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">qr_code_2</span>
              <span className="text-on-surface font-medium">Tham gia nhanh qua mã QR cho từng nhóm</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">analytics</span>
              <span className="text-on-surface font-medium">Báo cáo tiến độ học tập hàng tuần của thành viên</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">emoji_events</span>
              <span className="text-on-surface font-medium">Tự tổ chức các giải đấu nội bộ theo chủ đề</span>
            </li>
          </ul>

          <Link
            to="/groups"
            className="gold-gradient px-8 py-4 rounded-xl text-on-secondary font-bold text-lg active:scale-95 transition-transform shadow-xl shadow-secondary/10 inline-block"
          >
            Tạo Nhóm Miễn Phí
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────── Daily Verse ──────────────────────────────── */

function DailyVerse() {
  return (
    <section className="py-24 px-6 bg-surface-container-low">
      <div className="max-w-4xl mx-auto text-center">
        <div className="w-16 h-1 bg-secondary mx-auto mb-10 rounded-full" />
        <div className="relative px-12">
          <span className="material-symbols-outlined text-7xl text-secondary/20 absolute -top-8 -left-2 scale-x-[-1]">
            format_quote
          </span>
          <blockquote className="text-3xl md:text-4xl font-light italic leading-relaxed text-on-surface mb-8">
            &ldquo;Lời Chúa là ngọn đèn cho chân tôi, ánh sáng cho đường lối tôi.&rdquo;
          </blockquote>
          <cite className="text-xl font-bold text-secondary not-italic">— Thi Thiên 119:105</cite>
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────── Footer CTA ───────────────────────────────── */

function FooterCTA() {
  const handleGoogleSignup = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google'
  }

  return (
    <section className="py-32 px-6 relative overflow-hidden text-center">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface to-primary-container/20" />
      <div className="max-w-2xl mx-auto space-y-10">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Sẵn sàng khám phá Lời Chúa?
        </h2>
        <p className="text-on-surface-variant text-lg">
          Gia nhập cộng đồng hơn 50,000 người đang học Kinh Thánh mỗi ngày.
        </p>
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleGoogleSignup}
            className="flex items-center gap-3 bg-on-surface text-surface px-10 py-4 rounded-xl font-bold text-lg hover:bg-on-surface-variant transition-colors active:scale-95"
          >
            <img
              alt="Google"
              className="w-6 h-6"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcJIraLBnXjAOS0EXUCIC2rsomKCPxGvpBNYCmt4hQSQzzTt3HaTfkiLVJf9Wgb_lImqBmvVodHASMpqGU5bh1M6pMBhnDWC4ACT6pdtz__gRW5ca7GOmAoVj9qqJAfvRUSwIg27rDceLWagSU29hiYRkHKoVLfsohGVdXJWj01Kae2VDprsg2QNIbxhKzQTIsCspOQnwjByjN_-TX-4TvnQUGIy7hPsg0H5mcnRNMACynXMRatZ3R8cLaWiPG4q6Qko0ODPnYMLE"
            />
            Đăng Ký Miễn Phí với Google
          </button>
          <p className="text-sm text-on-surface-variant/60">
            Hoàn toàn miễn phí. Không quảng cáo. Không giới hạn.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────── Footer ───────────────────────────────────── */

function Footer() {
  return (
    <footer className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-[#11131e] border-t border-[#46464d]/15">
      <div className="flex flex-col items-center md:items-start gap-2">
        <div className="text-lg font-bold text-[#f8bd45]">BibleQuiz</div>
        <p className="font-be-vietnam-pro text-sm leading-relaxed text-[#e1e1f1]/60">
          &copy; 2024 BibleQuiz. The Sacred Modernist Path.
        </p>
      </div>
      <div className="flex gap-8">
        <a className="font-be-vietnam-pro text-sm text-[#e1e1f1]/50 hover:text-[#f8bd45] transition-colors cursor-pointer" href="#">
          About
        </a>
        <a className="font-be-vietnam-pro text-sm text-[#e1e1f1]/50 hover:text-[#f8bd45] transition-colors cursor-pointer" href="#">
          Contact
        </a>
        <a className="font-be-vietnam-pro text-sm text-[#e1e1f1]/50 hover:text-[#f8bd45] transition-colors cursor-pointer" href="#">
          Terms
        </a>
      </div>
      <div className="flex gap-4">
        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-secondary transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-lg">language</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-secondary transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-lg">share</span>
        </div>
      </div>
    </footer>
  )
}

/* ────────────────────────────── Landing Page ─────────────────────────────── */

export default function LandingPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isLoading, isAuthenticated, navigate])

  if (isLoading) return null

  return (
    <div className="bg-background font-body text-on-surface selection:bg-secondary selection:text-on-secondary min-h-screen">
      <GuestHeader />
      <HeroSection />
      <FeaturesGrid />
      <TryNowSection />
      <LeaderboardPreview />
      <ChurchGroupShowcase />
      <DailyVerse />
      <FooterCTA />
      <Footer />
    </div>
  )
}
