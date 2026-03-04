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
                className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-6"
                style={{
                  lineHeight: '1.3',
                  textShadow: '0 0 30px rgba(0, 255, 255, 0.3)'
                }}
              >
                KHƠI NGUỒN TRI THỨC - THẮP SÁNG TÂM LINH ⚡
              </h1>

              <p
                className="text-xl lg:text-2xl max-w-2xl font-medium"
                style={{ color: '#E0E0E0', lineHeight: '1.6' }}
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
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-400 to-purple-500 shadow-2xl animate-pulse"
                >
                  <span className="text-6xl">📖</span>
                </div>

                {/* Floating icons around */}
                {[
                  { icon: '👤', color: 'from-cyan-400 to-blue-500', position: 'top-4 left-1/2 -translate-x-1/2', delay: '0s' },
                  { icon: '⭐', color: 'from-yellow-400 to-orange-500', position: 'top-1/2 -right-4 -translate-y-1/2', delay: '0.5s' },
                  { icon: '🏆', color: 'from-purple-400 to-pink-500', position: 'bottom-4 left-1/2 -translate-x-1/2', delay: '1s' },
                  { icon: '💎', color: 'from-emerald-400 to-cyan-500', position: 'top-1/2 -left-4 -translate-y-1/2', delay: '1.5s' },
                  { icon: '🎯', color: 'from-red-400 to-pink-500', position: 'top-8 left-8', delay: '2s' },
                  { icon: '🚀', color: 'from-indigo-400 to-purple-500', position: 'top-8 right-8', delay: '2.5s' },
                  { icon: '💫', color: 'from-pink-400 to-rose-500', position: 'bottom-8 left-8', delay: '3s' },
                  { icon: '🌟', color: 'from-yellow-400 to-amber-500', position: 'bottom-8 right-8', delay: '3.5s' }
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`absolute w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${item.color} shadow-lg animate-bounce ${item.position}`}
                    style={{
                      animationDelay: item.delay,
                      animationDuration: '2s'
                    }}
                  >
                    <span className="text-xl">{item.icon}</span>
                  </div>
                ))}
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
      <section className="container mx-auto px-6 py-24 relative" style={{ marginTop: '80px' }}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent"></div>

        <div className="relative z-10">

          <div className="grid md:grid-cols-3 gap-10">
            {/* Single Player Card */}
            <div
              className="gaming-card group"
              style={{ border: '2px solid #00FFFF', boxShadow: '0 0 10px rgba(0, 255, 255, 0.1)' }}
            >
              <div className="text-center">
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all bg-[#00FFFF] shadow-[0_0_20px_#00FFFF] group-hover:shadow-[0_0_30px_#00FFFF] group-hover:scale-110"
                >
                  <span className="text-4xl">📖</span>
                </div>
                <h3 className="text-2xl font-black mb-1 text-[#00FFFF]">
                  ÔN LUYỆN
                </h3>
                <p className="text-sm italic mb-4 text-[#B0B0B0]">
                  Học Không Áp Lực
                </p>
                <p className="text-lg mb-8 leading-relaxed text-[#E0E0E0]">
                  <span className="text-cyan-300 font-semibold">Ôn tập kiến thức</span> theo từng sách Kinh Thánh, không giới hạn thời gian.
                  <br />
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mt-4" style={{ backgroundColor: 'rgba(0, 255, 255, 0.1)', color: '#00FFFF', border: '1px solid rgba(0, 255, 255, 0.3)' }}>💡 Kinh Thánh</span>
                </p>
                <Link
                  to="/practice"
                  className="inline-block w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 bg-[#00FFFF] text-[#0E0B1A] shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:shadow-[0_0_25px_rgba(0,255,255,0.6)]"
                >
                  BẮT ĐẦU NGAY
                </Link>
              </div>
            </div>

            {/* Team Battle Card */}
            <div
              className="gaming-card group"
              style={{ border: '2px solid #FF8C00', boxShadow: '0 0 10px rgba(255, 140, 0, 0.1)' }}
            >
              <div className="text-center">
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all bg-[#FF8C00] shadow-[0_0_20px_#FF8C00] group-hover:shadow-[0_0_30px_#FF8C00] group-hover:scale-110 group-hover:animate-pulse"
                >
                  <span className="text-4xl group-hover:animate-icon-shake">⚔️</span>
                </div>
                <h3 className="text-2xl font-black mb-1 text-[#FF8C00]">
                  THI ĐẤU
                </h3>
                <p className="text-sm italic mb-4 text-[#B0B0B0]">
                  So Trình Đối Kháng
                </p>
                <p className="text-lg mb-8 leading-relaxed text-[#E0E0E0]">
                  <span className="text-orange-300 font-semibold">Thách đấu cùng bạn bè</span> hoặc đối thủ ngẫu nhiên để khẳng định vị thế!
                  <br />
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mt-4" style={{ backgroundColor: 'rgba(255, 140, 0, 0.1)', color: '#FF8C00', border: '1px solid rgba(255, 140, 0, 0.3)' }}>🏆 Đối kháng</span>
                </p>
                <Link
                  to="/rooms"
                  className="inline-block w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 bg-[#FF8C00] text-[#0E0B1A] shadow-[0_0_15px_rgba(255,140,0,0.4)] hover:shadow-[0_0_25px_rgba(255,140,0,0.6)]"
                >
                  THAM GIA PHÒNG
                </Link>
              </div>
            </div>

            {/* Daily Challenge Card */}
            <div
              className="gaming-card group"
              style={{ border: '2px solid #FFFF00', boxShadow: '0 0 10px rgba(255, 255, 0, 0.1)' }}
            >
              <div className="text-center">
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all bg-[#FFFF00] shadow-[0_0_20px_#FFFF00] group-hover:shadow-[0_0_30px_#FFFF00] group-hover:scale-110 group-hover:animate-pulse"
                >
                  <span className="text-4xl">🛡️</span>
                </div>
                <h3 className="text-2xl font-black mb-1 text-[#FFFF00]">
                  ĐẤU XẾP HẠNG
                </h3>
                <p className="text-sm italic mb-4 text-[#B0B0B0]">
                  Vinh Danh Anh Tài
                </p>
                <p className="text-lg mb-8 leading-relaxed text-[#E0E0E0]">
                  <span className="text-yellow-300 font-semibold">Leo bảng vàng</span>, nhận danh hiệu độc quyền và phần thưởng hấp dẫn!
                  <br />
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mt-4" style={{ backgroundColor: 'rgba(255, 255, 0, 0.1)', color: '#FFFF00', border: '1px solid rgba(255, 255, 0, 0.3)' }}>⚡ Thăng tiến</span>
                </p>
                <Link
                  to="/ranked"
                  className="inline-block w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 bg-[#FFFF00] text-[#0E0B1A] shadow-[0_0_15px_rgba(255,255,0,0.4)] hover:shadow-[0_0_25px_rgba(255,255,0,0.6)]"
                >
                  LEO RANK NGAY
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Progress Section */}
      {isAuthenticated && (
        <section className="container mx-auto px-6 py-16 relative" style={{ marginTop: '80px' }}>
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2
                className="text-3xl font-bold mb-4"
                style={{ color: '#00FFFF' }}
              >
                Hành Trình Tâm Linh Của Bạn 🗺️
              </h2>
              <p className="text-lg" style={{ color: '#E0E0E0' }}>
                Từ <span className="text-cyan-300 font-semibold">"Người Tìm Hiểu"</span> đến <span className="text-purple-300 font-semibold">"Trưởng Lão Đáng Kính"</span> -
                Mỗi bước tiến đều mang ý nghĩa thiêng liêng!
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div
                className="p-8 rounded-3xl mb-8 transition-all duration-300 hover:scale-105 group relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 255, 255, 0.05) 100%)',
                  border: '2px solid #00FFFF',
                  boxShadow: '0 0 25px rgba(0, 255, 255, 0.4), inset 0 0 20px rgba(0, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {/* Glow effect overlay */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(0, 255, 255, 0.1) 0%, transparent 70%)',
                    boxShadow: '0 0 40px #00FFFF, 0 0 80px #00FFFF'
                  }}
                />
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  {/* Current Level */}
                  <div>
                    <div
                      className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold"
                      style={{
                        backgroundColor: '#00FFFF',
                        color: '#0E0B1A',
                        boxShadow: '0 0 15px #00FFFF'
                      }}
                    >
                      5
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#FFFFFF' }}>Cấp 5</h3>
                    <p className="text-sm" style={{ color: '#E0E0E0' }}>Người Tìm Hiểu</p>
                    <p className="text-xs" style={{ color: '#90EE90' }}>✨ Đang kiến thiết nền tảng đức tin</p>
                  </div>

                  {/* XP Progress */}
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-bold" style={{ color: '#FFFFFF' }}>Trí Tuệ Tích Lũy 📚</span>
                      <span className="text-sm" style={{ color: '#00FFFF' }}>750/1000 XP</span>
                    </div>
                    <div
                      className="w-full h-6 rounded-full overflow-hidden relative"
                      style={{
                        border: '1px solid rgba(0, 255, 255, 0.3)',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500 relative"
                        style={{
                          width: '75%',
                          background: 'linear-gradient(90deg, #00FFFF 0%, #00BFFF 50%, #0080FF 100%)',
                          boxShadow: '0 0 15px rgba(0, 255, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        {/* Glow effect at the end */}
                        <div
                          className="absolute right-0 top-0 w-2 h-full rounded-r-full"
                          style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 100%)',
                            boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)'
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs mt-3 font-medium" style={{ color: '#E0E0E0' }}>
                      Chỉ cần thêm <span className="text-cyan-300 font-bold">250 XP</span> nữa để thăng cấp danh hiệu mới. <span className="text-purple-300">Đừng dừng lại nhé!</span> 🌟
                    </p>
                  </div>
                </div>

                {/* Ranking */}
                <div className="mt-6 pt-6 border-t" style={{ borderColor: '#00FFFF' }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-bold mb-1" style={{ color: '#FFFFFF' }}>Địa Vị Trong Cộng Đồng 👑</h4>
                      <p className="text-sm" style={{ color: '#E0E0E0' }}>
                        Vị trí của bạn trong <span className="text-cyan-300 font-semibold">cộng đồng học giả Kinh Thánh</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className="inline-flex items-center px-6 py-3 relative"
                        style={{
                          background: 'linear-gradient(135deg, #00FFFF 0%, #00BFFF 100%)',
                          color: '#0E0B1A',
                          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)',
                          boxShadow: '0 0 20px rgba(0, 255, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                        }}
                      >
                        <span className="text-lg mr-2">🏆</span>
                        <span className="text-xl font-bold">#25</span>
                        <div
                          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                          style={{
                            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                            boxShadow: '0 0 8px rgba(255, 215, 0, 0.6)'
                          }}
                        />
                      </div>
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

        <div className="relative z-10">
          <div>
            <h2
              className="text-4xl font-black mb-2"
              style={{ color: '#FF00FF' }}
            >
              BẢNG XẾP HẠNG
            </h2>
            <p className="text-[#B0B0B0] text-lg mb-8 italic">Vị trí số 1 đang chờ tên bạn. Bắt đầu thi đấu để lật đổ vương triều ngay! 👑</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              {/* Time Period Tabs */}
              <div className="flex space-x-8 mb-4">
                {/* Active Tab - Theo ngày */}
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group"
                  style={{
                    backgroundColor: 'rgba(255, 0, 255, 0.15)',
                    color: '#FF00FF',
                    border: '2px solid #FF00FF',
                    boxShadow: '0 0 20px #FF00FF, inset 0 0 20px rgba(255, 0, 255, 0.1)'
                  }}
                >
                  <span className="relative z-10 font-bold">Theo ngày</span>
                  {/* Active underline */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #FF00FF, #00FFFF, #FF00FF)',
                      boxShadow: '0 0 10px #FF00FF'
                    }}
                  />
                  {/* Active glow effect */}
                  <div
                    className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(45deg, rgba(255, 0, 255, 0.2), rgba(0, 255, 255, 0.1))',
                      boxShadow: '0 0 30px #FF00FF, 0 0 60px #FF00FF'
                    }}
                  />
                </button>

                {/* Inactive Tab - Theo tuần */}
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 group relative"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#B0B0B0',
                    border: '1px solid rgba(255, 0, 255, 0.3)',
                    boxShadow: '0 0 10px rgba(255, 0, 255, 0.2)'
                  }}
                >
                  <span className="relative z-10">Theo tuần</span>
                  <div
                    className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(45deg, rgba(255, 0, 255, 0.1), rgba(255, 0, 255, 0.2))',
                      boxShadow: 'inset 0 0 15px rgba(255, 0, 255, 0.3)'
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{
                      boxShadow: '0 0 20px #FF00FF, 0 0 40px #FF00FF'
                    }}
                  />
                  {/* Hover underline */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(90deg, #FF00FF, #00FFFF)',
                      boxShadow: '0 0 8px #FF00FF'
                    }}
                  />
                </button>

                {/* Inactive Tab - Theo tháng */}
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 group relative"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#B0B0B0',
                    border: '1px solid rgba(255, 0, 255, 0.3)',
                    boxShadow: '0 0 5px rgba(255, 0, 255, 0.2)'
                  }}
                >
                  <span className="relative z-10">Theo tháng</span>
                  <div
                    className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(45deg, rgba(255, 0, 255, 0.1), rgba(255, 0, 255, 0.2))',
                      boxShadow: 'inset 0 0 15px rgba(255, 0, 255, 0.3)'
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{
                      boxShadow: '0 0 20px #FF00FF, 0 0 40px #FF00FF'
                    }}
                  />
                  {/* Hover underline */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(90deg, #FF00FF, #00FFFF)',
                      boxShadow: '0 0 8px #FF00FF'
                    }}
                  />
                </button>
              </div>

              {/* Top Players */}
              <div
                className="rounded-2xl"
                style={{
                  backgroundColor: '#161228',
                  border: '2px solid #FF00FF',
                  boxShadow: '0 0 8px rgba(255, 0, 255, 0.4)',
                  padding: '32px 24px'
                }}
              >
                <div className="space-y-4">
                  {/* 1st Place */}
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold"
                      style={{
                        backgroundColor: '#FFFF00',
                        color: '#0E0B1A',
                        boxShadow: '0 0 20px #FFFF00'
                      }}
                    >
                      1
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-2xl font-black tracking-wide" style={{ color: '#FFFFFF' }}>Nguyễn Văn A</h3>
                        {user?.name === 'Nguyễn Văn A' && (
                          <span
                            className="px-2 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: '#00FFFF',
                              color: '#0E0B1A'
                            }}
                          >
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="text-lg" style={{ color: '#FFFFFF' }}>Thành viên VIP</p>
                        <div className="relative group">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold cursor-help transition-all duration-300"
                            style={{
                              backgroundColor: '#00FFFF',
                              color: '#0E0B1A',
                              boxShadow: '0 0 8px #00FFFF'
                            }}
                          >
                            i
                          </span>
                          <div
                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                            style={{
                              backgroundColor: '#161228',
                              color: '#FFFFFF',
                              border: '1px solid #00FFFF',
                              boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            VIP: Trên 1,000 điểm
                            <div
                              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                              style={{
                                borderLeft: '4px solid transparent',
                                borderRight: '4px solid transparent',
                                borderTop: '4px solid #00FFFF'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-xl font-bold" style={{ color: '#00FFFF' }}>1,550 điểm</p>
                    </div>
                  </div>

                  {/* 2nd Place */}
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold"
                      style={{
                        backgroundColor: '#00FFFF',
                        color: '#0E0B1A',
                        boxShadow: '0 0 20px #00FFFF'
                      }}
                    >
                      2
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-2xl font-black tracking-wide" style={{ color: '#FFFFFF' }}>Trần Thị B</h3>
                        {user?.name === 'Trần Thị B' && (
                          <span
                            className="px-2 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: '#00FFFF',
                              color: '#0E0B1A'
                            }}
                          >
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="text-lg" style={{ color: '#FFFFFF' }}>Thành viên Pro</p>
                        <div className="relative group">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold cursor-help transition-all duration-300"
                            style={{
                              backgroundColor: '#00FFFF',
                              color: '#0E0B1A',
                              boxShadow: '0 0 8px #00FFFF'
                            }}
                          >
                            i
                          </span>
                          <div
                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                            style={{
                              backgroundColor: '#161228',
                              color: '#FFFFFF',
                              border: '1px solid #00FFFF',
                              boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Pro: 500-1,000 điểm
                            <div
                              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                              style={{
                                borderLeft: '4px solid transparent',
                                borderRight: '4px solid transparent',
                                borderTop: '4px solid #00FFFF'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-xl font-bold" style={{ color: '#00FFFF' }}>50k điểm</p>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold"
                      style={{
                        backgroundColor: '#FF00FF',
                        color: '#0E0B1A',
                        boxShadow: '0 0 20px #FF00FF'
                      }}
                    >
                      3
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-2xl font-black tracking-wide" style={{ color: '#FFFFFF' }}>Lê Văn C</h3>
                        {user?.name === 'Lê Văn C' && (
                          <span
                            className="px-2 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: '#00FFFF',
                              color: '#0E0B1A'
                            }}
                          >
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="text-lg" style={{ color: '#FFFFFF' }}>Thành viên</p>
                        <div className="relative group">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold cursor-help transition-all duration-300"
                            style={{
                              backgroundColor: '#00FFFF',
                              color: '#0E0B1A',
                              boxShadow: '0 0 8px #00FFFF'
                            }}
                          >
                            i
                          </span>
                          <div
                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                            style={{
                              backgroundColor: '#161228',
                              color: '#FFFFFF',
                              border: '1px solid #00FFFF',
                              boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Thành viên: Dưới 500 điểm
                            <div
                              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                              style={{
                                borderLeft: '4px solid transparent',
                                borderRight: '4px solid transparent',
                                borderTop: '4px solid #00FFFF'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-xl font-bold" style={{ color: '#FF00FF' }}>290k điểm</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trophy Illustration */}
            <div className="flex justify-center lg:justify-end">
              <div className="text-center">
                <div className="mb-8">
                  <div className="relative group">
                    <div
                      className="w-40 h-40 mx-auto mb-6 rounded-full flex items-center justify-center relative animate-pulse"
                      style={{
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        boxShadow: '0 20px 40px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.2)'
                      }}
                    >
                      <span className="text-8xl group-hover:scale-110 transition-transform duration-300">🏆</span>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/50 to-orange-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    {/* Trophy Tooltip */}
                    <div
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                      style={{
                        backgroundColor: '#161228',
                        color: '#FFFFFF',
                        border: '1px solid #FFD700',
                        boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Cúp vàng - Biểu tượng chiến thắng
                      <div
                        className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                        style={{
                          borderLeft: '4px solid transparent',
                          borderRight: '4px solid transparent',
                          borderTop: '4px solid #FFD700'
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center space-x-6 mb-6">
                    {[
                      { rank: '1', color: 'from-yellow-400 to-orange-500', icon: '👑', tooltip: 'Vương miện - Hạng nhất' },
                      { rank: '2', color: 'from-cyan-400 to-blue-500', icon: '🥈', tooltip: 'Huy chương bạc - Hạng nhì' },
                      { rank: '3', color: 'from-pink-400 to-purple-500', icon: '🥉', tooltip: 'Huy chương đồng - Hạng ba' }
                    ].map((item, index) => (
                      <div key={index} className="relative group">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold hover:scale-110 transition-transform duration-300"
                          style={{
                            background: `linear-gradient(135deg, ${item.color})`,
                            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
                          }}
                        >
                          <span className="text-xl">{item.icon}</span>
                        </div>
                        {/* Medal Tooltip */}
                        <div
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                          style={{
                            backgroundColor: '#161228',
                            color: '#FFFFFF',
                            border: '1px solid #00FFFF',
                            boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.tooltip}
                          <div
                            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                            style={{
                              borderLeft: '4px solid transparent',
                              borderRight: '4px solid transparent',
                              borderTop: '4px solid #00FFFF'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center space-x-3 mb-6">
                    <div className="relative group">
                      <span className="text-3xl animate-bounce cursor-help" style={{ animationDelay: '0s' }}>⭐</span>
                      <div
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                        style={{
                          backgroundColor: '#161228',
                          color: '#FFFFFF',
                          border: '1px solid #FFD700',
                          boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Ngôi sao - Điểm thành tích
                        <div
                          className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                          style={{
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '4px solid #FFD700'
                          }}
                        />
                      </div>
                    </div>
                    <div className="relative group">
                      <span className="text-3xl animate-bounce cursor-help" style={{ animationDelay: '0.2s' }}>❤️</span>
                      <div
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                        style={{
                          backgroundColor: '#161228',
                          color: '#FFFFFF',
                          border: '1px solid #FF69B4',
                          boxShadow: '0 0 15px rgba(255, 105, 180, 0.3)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Trái tim - Sự yêu thích
                        <div
                          className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                          style={{
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '4px solid #FF69B4'
                          }}
                        />
                      </div>
                    </div>
                    <div className="relative group">
                      <span className="text-3xl animate-bounce cursor-help" style={{ animationDelay: '0.4s' }}>⭐</span>
                      <div
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                        style={{
                          backgroundColor: '#161228',
                          color: '#FFFFFF',
                          border: '1px solid #FFD700',
                          boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Ngôi sao - Điểm thành tích
                        <div
                          className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                          style={{
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '4px solid #FFD700'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p
                    className="text-2xl font-bold bg-gradient-to-r from-white via-yellow-200 to-orange-200 bg-clip-text text-transparent"
                  >
                    Bạn có thể trở thành người dẫn đầu!
                  </p>
                  <p className="text-lg text-gray-300">
                    Tham gia ngay để cạnh tranh và leo lên top
                  </p>
                  <Link
                    to="/practice"
                    className="inline-flex items-center px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 group/btn"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                      color: '#000000',
                      boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)'
                    }}
                  >
                    <span className="mr-2">🚀</span>
                    BẮT ĐẦU THI ĐẤU
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Gradient divider above footer */}
      <div className="w-full h-px mt-20" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.5), transparent)', opacity: 0.8 }}></div>
      {/* Footer */}
      <footer
        className="container mx-auto px-4 py-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <img
              src="/src/assets/logo-new.png"
              alt="Bible Quiz Logo"
              className="w-8 h-8"
              style={{
                filter: 'drop-shadow(0 0 8px #00FFFF) drop-shadow(0 0 16px #00FFFF)'
              }}
            />
            <span className="text-xl font-bold" style={{ color: '#00FFFF' }}>BIBLE QUIZ</span>
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-lg text-[#D9B8FF] hover:text-cyan-400 hover:drop-shadow-[0_0_8px_#00FFFF] transition-all duration-300">
              Chính sách
            </Link>
            <Link to="/terms" className="text-lg text-[#D9B8FF] hover:text-cyan-400 hover:drop-shadow-[0_0_8px_#00FFFF] transition-all duration-300">
              Điều khoản
            </Link>
            <Link to="/support" className="text-lg text-[#D9B8FF] hover:text-cyan-400 hover:drop-shadow-[0_0_8px_#00FFFF] transition-all duration-300">
              Hỗ trợ
            </Link>
          </div>
        </div>
        <div className="text-center mt-8">
          <p style={{ color: '#D9B8FF' }}>
            © 2024 Bible Quiz. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  )
}