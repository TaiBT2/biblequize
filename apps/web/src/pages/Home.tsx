import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
// import logo from '../assets/logo-new.png'

export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const [playerCount, setPlayerCount] = useState(0)
  const [isCounting, setIsCounting] = useState(false)

  useEffect(() => {
    // Start counting animation after component mounts
    const timer = setTimeout(() => {
      setIsCounting(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isCounting) {
      const targetCount = 10000
      const duration = 2000 // 2 seconds
      const increment = targetCount / (duration / 16) // 60fps

      const counter = setInterval(() => {
        setPlayerCount(prev => {
          if (prev >= targetCount) {
            clearInterval(counter)
            return targetCount
          }
          return Math.min(prev + increment, targetCount)
        })
      }, 16)

      return () => clearInterval(counter)
    }
  }, [isCounting])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 relative" style={{ marginTop: '120px' }}>
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10 rounded-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl"></div>

        <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                <span className="text-cyan-400 mr-2">✨</span>
                <span className="text-sm font-medium text-cyan-300">Học tập thú vị</span>
              </div>

              <h1
                className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-6 tracking-wide"
                style={{
                  lineHeight: '1.3',
                  textShadow: '0 0 30px rgba(0, 255, 255, 0.3)',
                  letterSpacing: '0.02em'
                }}
              >
                KHƠI NGUỒN TRI THỨC - THẮP SÁNG TÂM LINH ⚡
              </h1>

              <p
                className="text-xl lg:text-2xl max-w-2xl font-medium leading-[1.8] text-glow"
                style={{ color: '#E0E0E0', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}
              >
                Hàng ngàn câu hỏi thú vị đang chờ đón. Vừa chơi, vừa học, vừa thăng trưởng đức tin mỗi ngày! 🚀
              </p>
            </div>

            <div className="mt-12" style={{ marginBottom: '80px' }}>
              <Link
                to="/ranked"
                className="inline-block px-12 py-5 rounded-2xl font-black text-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group"
                style={{
                  backgroundColor: '#00FFFF',
                  color: '#0E0B1A',
                  boxShadow: '0 0 15px rgba(0, 255, 255, 0.4), 0 0 30px rgba(0, 255, 255, 0.2)',
                  animation: 'pulse-glow 2.5s ease-in-out infinite alternate'
                }}
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <span>🚀</span>
                  <span>BẮT ĐẦU HÀNH TRÌNH</span>
                  <span>🎯</span>
                </span>

                {/* Animated background */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(0, 255, 255, 0.3), rgba(255, 255, 255, 0.2))',
                    animation: 'shimmer 1.5s ease-in-out infinite'
                  }}
                />
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              {/* Floating elements */}
              <div className="relative w-80 h-80">
                {/* Main central element */}
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-400 to-purple-500 shadow-2xl animate-pulse z-10 neon-glow"
                >
                  <span className="text-7xl">📖</span>
                </div>

                {/* Floating icons around in a circle */}
                {[
                  { icon: '👤', color: 'from-cyan-400 to-blue-500' },
                  { icon: '⭐', color: 'from-yellow-400 to-orange-500' },
                  { icon: '🏆', color: 'from-purple-400 to-pink-500' },
                  { icon: '💎', color: 'from-emerald-400 to-cyan-500' },
                  { icon: '🎯', color: 'from-red-400 to-pink-500' },
                  { icon: '🚀', color: 'from-indigo-400 to-purple-500' },
                  { icon: '💫', color: 'from-pink-400 to-rose-500' },
                  { icon: '🌟', color: 'from-yellow-400 to-amber-500' }
                ].map((item, index, array) => {
                  const angle = (index / array.length) * 2 * Math.PI;
                  const radius = 160; // Increased radius
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  return (
                    <div
                      key={index}
                      className={`absolute w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br ${item.color} shadow-2xl animate-float neon-glow hover:scale-125 transition-transform duration-300`}
                      style={{
                        top: `calc(50% + ${y}px - 32px)`,
                        left: `calc(50% + ${x}px - 32px)`,
                        animationDelay: `${index * 0.4}s`
                      }}
                    >
                      <span className="text-3xl">{item.icon}</span>
                    </div>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="mt-8 text-center space-y-4">
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                  <span className="text-2xl mr-3">👥</span>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white animate-number-glow">
                      {Math.floor(playerCount).toLocaleString()}+
                    </div>
                    <div className="text-sm text-gray-300">Người chơi</div>
                  </div>
                </div>
                <p className="text-lg font-medium" style={{ color: '#E0E0E0' }}>
                  Tham gia cùng hàng nghìn người chơi!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="container mx-auto px-6 py-12 relative" style={{ marginTop: '0px' }}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent"></div>

        <div className="relative z-10">

          <div className="grid md:grid-cols-3 gap-10">
            {/* Single Player Card */}
            <div className="page-card group p-8 flex flex-col items-center text-center">
              <div
                className="w-20 h-20 mb-6 rounded-2xl flex items-center justify-center transition-all bg-[#4bbf9f] shadow-[0_8px_20px_rgba(75,191,159,0.3)] group-hover:scale-110"
              >
                <span className="text-4xl">📖</span>
              </div>
              <h3 className="text-2xl font-black mb-1 text-[#4a3f35] parchment-headline">
                ÔN LUYỆN
              </h3>
              <p className="text-sm italic mb-4 text-[#7a6a5a]">
                Học Không Áp Lực
              </p>
              <p className="text-base mb-8 leading-relaxed text-[#5a5048]">
                <span className="text-[#2e9e7a] font-bold">Ôn tập kiến thức</span> theo từng sách Kinh Thánh, không giới hạn thời gian.
                <br />
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mt-4 bg-[#eeeae0] text-[#7a6a5a]">📜 Kinh Thánh</span>
              </p>
              <Link
                to="/practice"
                className="btn-primary w-full py-4 text-center"
              >
                BẮT ĐẦU NGAY
              </Link>
            </div>

            {/* Team Battle Card */}
            <div className="page-card group p-8 flex flex-col items-center text-center">
              <div
                className="w-20 h-20 mb-6 rounded-2xl flex items-center justify-center transition-all bg-[#e05c5c] shadow-[0_8px_20px_rgba(224,92,92,0.3)] group-hover:scale-110"
              >
                <span className="text-4xl">⚔️</span>
              </div>
              <h3 className="text-2xl font-black mb-1 text-[#4a3f35] parchment-headline">
                THI ĐẤU
              </h3>
              <p className="text-sm italic mb-4 text-[#7a6a5a]">
                So Trình Đối Kháng
              </p>
              <p className="text-base mb-8 leading-relaxed text-[#5a5048]">
                <span className="text-[#c04a4a] font-bold">Thách đấu cùng bạn bè</span> hoặc đối thủ ngẫu nhiên để khẳng định vị thế!
                <br />
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mt-4 bg-[#eeeae0] text-[#7a6a5a]">🏆 Đối kháng</span>
              </p>
              <Link
                to="/rooms"
                className="btn-primary w-full py-4 text-center"
              >
                THAM GIA PHÒNG
              </Link>
            </div>

            {/* Daily Challenge Card */}
            <div className="page-card group p-8 flex flex-col items-center text-center border-2 border-[#f59e0b]">
              <div
                className="w-20 h-20 mb-6 rounded-2xl flex items-center justify-center transition-all bg-[#f59e0b] shadow-[0_8px_20px_rgba(245,158,11,0.3)] group-hover:scale-110"
              >
                <span className="text-4xl">🛡️</span>
              </div>
              <h3 className="text-2xl font-black mb-1 text-[#4a3f35] parchment-headline">
                ĐẤU XẾP HẠNG
              </h3>
              <p className="text-sm italic mb-4 text-[#7a6a5a]">
                Vinh Danh Anh Tài
              </p>
              <p className="text-base mb-8 leading-relaxed text-[#5a5048]">
                <span className="text-[#b45309] font-bold">Leo bảng vàng</span>, nhận danh hiệu độc quyền và phần thưởng hấp dẫn!
                <br />
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mt-4 bg-[#eeeae0] text-[#7a6a5a]">⚡ Thăng tiến</span>
              </p>
              <Link
                to="/ranked"
                className="btn-primary neon-glow w-full py-4 text-center"
              >
                LEO RANK NGAY
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* User Progress Section */}
      {isAuthenticated && (
        <section className="container mx-auto px-6 py-8 relative" style={{ marginTop: '20px' }} id="user-progress-section">
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2
                className="text-3xl font-bold mb-4 flex items-center justify-center gap-4"
                style={{ color: '#00FFFF', textShadow: '0 0 10px rgba(0,255,255,0.3)' }}
              >
                Hành Trình Tâm Linh Của Bạn 🗺️
                <button className="btn-share animate-pulse" title="Chia sẻ hành trình">
                  📤
                </button>
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: '#E0E0E0' }}>
                Từ <span className="text-cyan-300 font-semibold">"Người Tìm Hiểu"</span> đến <span className="text-purple-300 font-semibold">"Trưởng Lão Đáng Kính"</span> -
                Mỗi bước tiến đều mang ý nghĩa thiêng liêng!
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="page-card p-10 md:p-12 mb-8 transition-all duration-300 hover:shadow-2xl relative overflow-hidden card-hover-effect">
                <div className="grid md:grid-cols-3 gap-8 text-center items-center">
                  {/* Current Level */}
                  <div className="relative">
                    <div
                      className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl font-black"
                      style={{
                        background: 'linear-gradient(135deg, #4bbf9f 0%, #2e9e7a 100%)',
                        color: '#ffffff',
                        boxShadow: '0 8px 20px rgba(75,191,159,0.3)'
                      }}
                    >
                      5
                    </div>
                    <h3 className="text-xl font-bold mb-1 text-[#2d241e] parchment-headline">Cấp 5</h3>
                    <p className="text-sm font-bold text-[#4a3f35]">Người Tìm Hiểu</p>
                  </div>

                  {/* XP Progress */}
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-lg font-bold text-[#4a3f35]">Trí Tuệ Tích Lũy 📚</span>
                      <span className="text-sm font-black text-[#4bbf9f] pr-4">750 / 1000 XP</span>
                    </div>
                    <div className="w-full h-4 bg-[#eeeae0] rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#4bbf9f] to-[#2e9e7a]"
                        style={{ width: '75%' }}
                      ></div>
                    </div>
                    <p className="text-xs mt-4 text-[#4a3f35] font-semibold leading-loose">
                      Chỉ cần thêm <span className="text-[#2e9e7a] font-black">250 XP</span> nữa để thăng cấp danh hiệu mới. <span className="text-[#4bbf9f] font-black">Cố gắng lên nhé!</span> 🌟
                    </p>
                  </div>
                </div>

                {/* Ranking */}
                <div className="mt-10 pt-8 border-t border-[#eeeae0]">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-bold text-[#4a3f35] parchment-headline mb-1">Thứ Hạng Cộng Đồng 👑</h4>
                      <p className="text-sm text-[#7a6a5a]">
                        Thứ hạng của bạn so với các học giả khác.
                      </p>
                    </div>
                    <div className="bg-[#fdfaf3] border-2 border-[#4bbf9f] px-6 py-2 rounded-full shadow-sm">
                      <span className="text-2xl font-black text-[#4bbf9f]">#25</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Divider */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent relative my-10">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-px bg-cyan-400 shadow-[0_0_15px_#22d3ee]"></div>
      </div>

      {/* Leaderboard Section */}
      <section className="container mx-auto px-6 py-12 relative" style={{ marginTop: '20px' }}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-pink-900/10 rounded-3xl pointer-events-none"></div>

        <div className="relative z-10 pt-10">
          <div className="text-center mb-12">
            <h2
              className="text-4xl font-black mb-3 text-[#4bbf9f] parchment-headline tracking-tight"
            >
              BẢNG XẾP HẠNG
            </h2>
            <p className="text-[#7a6a5a] text-lg italic max-w-2xl mx-auto">Vị trí số 1 đang chờ tên bạn. Bắt đầu thi đấu để lật đổ vương triều ngay! 👑</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            <div className="flex flex-col h-full space-y-4">
              {/* Time Period Tabs */}
              <div className="flex justify-start mb-6">
                <div className="segmented-control">
                  <button className="segmented-control-item active">Theo ngày</button>
                  <button className="segmented-control-item">Theo tuần</button>
                  <button className="segmented-control-item">Theo tháng</button>
                </div>
              </div>

              {/* Top Players List */}
              <div className="page-card parchment-texture premium-border p-4 md:p-6 card-hover-effect">
                <div className="mb-6 flex justify-center">
                  <div className="relative w-full max-w-xs">
                    <input
                      type="text"
                      placeholder="Tìm đối thủ..."
                      className="w-full bg-[#fdfaf3]/60 border border-[#eeeae0] rounded-full py-1.5 px-10 text-xs focus:outline-none focus:border-[#00FFFF] transition-all shadow-inner font-bold text-[#4a3f35]"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60 text-xs">🔍</div>
                  </div>
                </div>
                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar" id="leaderboard-scroll-container">
                  {/* 1st Place */}
                  <div className="flex items-center gap-6 p-4 rounded-2xl bg-[#fdfaf3] border-2 border-[#4bbf9f] shadow-lg relative overflow-hidden group/rank neon-glow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#f59e0b]/10 to-transparent rounded-bl-full pointer-events-none"></div>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-4xl font-black shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#ffffff',
                        boxShadow: '0 8px 15px rgba(245,158,11,0.3)'
                      }}
                    >
                      1
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-[#4a3f35]" >Nguyễn Văn A</h3>
                        <span className="bg-[#4bbf9f] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">BẠN</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#7a6a5a]">
                        <span>Thành viên VIP</span>
                        <span className="w-1 h-1 rounded-full bg-[#eeeae0]"></span>
                        <span className="parchment-serif italic">1,550 điểm</span>
                      </div>
                    </div>
                    <div className="text-2xl">👑</div>
                  </div>

                  {/* 2nd Place */}
                  <div className="flex items-center gap-6 p-4 rounded-2xl bg-[#fdfaf3] border border-[#eeeae0] shadow-sm relative overflow-hidden group/rank">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-3xl font-black shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                        color: '#ffffff',
                        boxShadow: '0 8px 15px rgba(148,163,184,0.3)'
                      }}
                    >
                      2
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-[#4a3f35]">Trần Thị B</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#7a6a5a]">
                        <span>Thành viên Pro</span>
                        <span className="w-1 h-1 rounded-full bg-[#eeeae0]"></span>
                        <span className="parchment-serif italic">1,250 điểm</span>
                      </div>
                    </div>
                    <div className="text-2xl">🥈</div>
                  </div>


                  {/* 3rd Place */}
                  <div className="flex items-center gap-6 p-4 rounded-2xl bg-[#fdfaf3] border border-[#eeeae0] shadow-sm relative overflow-hidden group/rank">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-3xl font-black shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
                        color: '#ffffff',
                        boxShadow: '0 8px 15px rgba(180,83,9,0.3)'
                      }}
                    >
                      3
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-[#4a3f35]">Lê Văn C</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#7a6a5a]">
                        <span>Thành viên</span>
                        <span className="w-1 h-1 rounded-full bg-[#eeeae0]"></span>
                        <span className="parchment-serif italic">980 điểm</span>
                      </div>
                    </div>
                    <div className="text-2xl">🥉</div>
                  </div>

                  {/* 4th Place */}
                  <div className="flex items-center gap-6 p-4 rounded-2xl bg-[#fdfaf3]/50 border border-[#eeeae0] shadow-sm relative overflow-hidden group/rank">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shrink-0"
                      style={{
                        background: '#eeeae0',
                        color: '#4a3f35',
                        border: '2px solid #d6cfc4'
                      }}
                    >
                      4
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-bold text-[#4a3f35]">Phạm Văn D</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#7a6a5a]">
                        <span className="parchment-serif italic">850 điểm</span>
                      </div>
                    </div>
                  </div>

                  {/* 5th Place */}
                  <div className="flex items-center gap-6 p-4 rounded-2xl bg-[#fdfaf3]/50 border border-[#eeeae0] shadow-sm relative overflow-hidden group/rank">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shrink-0"
                      style={{
                        background: '#eeeae0',
                        color: '#4a3f35',
                        border: '2px solid #d6cfc4'
                      }}
                    >
                      5
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-bold text-[#4a3f35]">Hoàng Thị E</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#7a6a5a]">
                        <span className="parchment-serif italic">720 điểm</span>
                      </div>
                    </div>
                  </div>

                  {/* Rank 6 - 10 */}
                  {[
                    { rank: 6, name: 'Chu Văn F', points: 650 },
                    { rank: 7, name: 'Đặng Thị G', points: 580 },
                    { rank: 8, name: 'Bùi Văn H', points: 510 },
                    { rank: 9, name: 'Ngô Thị I', points: 440 },
                    { rank: 10, name: 'Lý Văn K', points: 370 },
                  ].map((player) => (
                    <div key={player.rank} className="flex items-center gap-6 p-4 rounded-2xl bg-[#fdfaf3]/30 border border-[#eeeae0]/50 shadow-sm relative overflow-hidden group/rank">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shrink-0"
                        style={{
                          background: '#f1ede4',
                          color: '#4a3f35',
                          border: '2px solid #d6cfc4'
                        }}
                      >
                        {player.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-bold text-[#4a3f35]/80">{player.name}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#7a6a5a]/70">
                          <span className="parchment-serif italic">{player.points} điểm</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Trophy Illustration */}
            <div className="flex justify-center lg:justify-end">
              <div className="page-card parchment-texture premium-border p-6 text-center max-w-sm relative card-hover-effect flex flex-col items-center">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, #4bbf9f 0%, transparent 70%)' }}></div>

                <div className="relative z-10 w-full">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl shadow-xl bg-white border-2 border-[#eeeae0] relative">
                    <div className="absolute inset-0 rounded-full animate-ping bg-[#4bbf9f]/10"></div>
                    🏆
                  </div>

                  <h4 className="text-xl font-black text-[#4a3f35] parchment-headline mb-1 uppercase tracking-wider">Vinh Quang</h4>
                  <p className="text-[#4a3f35] text-xs leading-relaxed mb-4 font-bold italic">
                    "Dành cho những tâm hồn kiên trì và trí tuệ mẫn tiệp nhất."
                  </p>

                  <div className="flex justify-center gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-xl mb-1">⭐</div>
                      <div className="text-[9px] font-black text-[#4bbf9f] uppercase">Kiên Trì</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl mb-1">✨</div>
                      <div className="text-[9px] font-black text-[#4bbf9f] uppercase">Trí Tuệ</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl mb-1">🌟</div>
                      <div className="text-[9px] font-black text-[#4bbf9f] uppercase">Mẫn Tiệp</div>
                    </div>
                  </div>

                  <div className="bg-[#fdfaf3]/80 p-5 rounded-2xl border border-[#eeeae0] backdrop-blur-sm">
                    <p className="text-lg font-black text-[#4a3f35] parchment-headline mb-1">
                      SẴN SÀNG CHƯA?
                    </p>
                    <p className="text-xs text-[#7a6a5a] mb-3">
                      Vị trí của bạn đang chờ trên bảng vàng danh dự.
                    </p>
                    <Link
                      to="/practice"
                      className="btn-primary w-full py-3 text-center flex items-center justify-center gap-2 group text-sm"
                    >
                      🚀 BẮT ĐẦU NGAY
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Artistic Glowing Divider - Increased Spacing for Perfection */}
      <div className="relative w-full h-[2px] mt-40 overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
          style={{
            animation: 'pulse-glow 3s ease-in-out infinite alternate',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)'
          }}
        ></div>
      </div>

      {/* Refined Footer V2.4 - Integrated & Balanced */}
      <footer className="w-full pt-32 pb-24 px-6 container mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-start">
          {/* Column 1: Brand & Slogan */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-black bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent tracking-tighter drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                BIBLE QUIZ
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs font-medium opacity-80 mb-6">
              Khám phá kho tàng tri thức Kinh Thánh qua những thử thách đầy thú vị và ý nghĩa. Vừa chơi, vừa học, vừa thăng trưởng đức tin mỗi ngày.
            </p>
            <div className="flex items-center space-x-5">
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#00FFFF] hover:border-[#00FFFF] hover:scale-110 transition-all duration-300 shadow-lg" title="Facebook">
                <span className="text-xs">FB</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#00FFFF] hover:border-[#00FFFF] hover:scale-110 transition-all duration-300 shadow-lg" title="YouTube">
                <span className="text-xs">YT</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#00FFFF] hover:border-[#00FFFF] hover:scale-110 transition-all duration-300 shadow-lg" title="TikTok">
                <span className="text-xs">TT</span>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-8">
            <h3 className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-50">Hành trình</h3>
            <div className="flex flex-col space-y-4">
              <Link to="/about" className="text-white hover:text-[#00FFFF] transition-all duration-300 text-sm font-bold w-fit">Về Chúng Tôi</Link>
              <Link to="/practice" className="text-white hover:text-[#00FFFF] transition-all duration-300 text-sm font-bold w-fit">Ôn luyện Kinh Thánh</Link>
              <Link to="/ranked" className="text-white hover:text-[#00FFFF] transition-all duration-300 text-sm font-bold w-fit">Thử thách Xếp hạng</Link>
              <Link to="/support" className="text-white hover:text-[#00FFFF] transition-all duration-300 text-sm font-bold w-fit">Hỗ trợ cộng đồng</Link>
            </div>
          </div>

          {/* Column 3: Policy & Rights */}
          <div className="space-y-8 md:text-right">
            <h3 className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-50">Quy định</h3>
            <div className="flex flex-col space-y-4 md:items-end">
              <Link to="/privacy" className="text-white hover:text-[#00FFFF] transition-all duration-300 text-sm font-bold w-fit">Chính sách bảo mật</Link>
              <Link to="/terms" className="text-white hover:text-[#00FFFF] transition-all duration-300 text-sm font-bold w-fit">Điều khoản sử dụng</Link>
            </div>
          </div>
        </div>

        {/* Centered Copyright - Final Perfection Accent */}
        <div className="mt-24 pt-12 border-t border-white/5 text-center space-y-3">
          <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.4em] leading-relaxed">
            © 2024 BIBLE QUIZ. <span className="text-gray-600 font-bold">ALL RIGHTS RESERVED.</span>
          </p>
          <div className="flex items-center justify-center space-x-3 text-gray-500/40 text-[10px] font-bold italic">
            <span>🛡️ Bảo mật tuyệt đối</span>
            <span className="w-1 h-1 rounded-full bg-gray-500/20"></span>
            <span>⚡ Tốc độ tối ưu</span>
            <span className="w-1 h-1 rounded-full bg-gray-500/20"></span>
            <span>❤️ Made for Community</span>
          </div>
        </div>
      </footer>
    </div>
  )
}