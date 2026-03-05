import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState({
    level: 3,
    highScore: 0,
    totalPoints: 0,
    streak: 0,
    accuracy: 0
  })
  const [loading, setLoading] = useState(true)
  const [showTitleTooltip, setShowTitleTooltip] = useState(false)
  const [showProgressTooltip, setShowProgressTooltip] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState('TOÀN BỘ')

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return

      try {
        // Simulate loading delay for animation
        setTimeout(() => {
          setStats({
            level: 3,
            highScore: 0,
            totalPoints: 0,
            streak: 0,
            accuracy: 0
          })
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Error loading profile data:', error)
        setLoading(false)
      }
    }

    loadProfileData()
  }, [user])


  const getBibleData = () => {
    return {
      'NGŨ KINH': [
        { book: 'Sáng Thế Ký', progress: 85 },
        { book: 'Xuất Ê-díp-tô Ký', progress: 70 },
        { book: 'Lê-vi Ký', progress: 45 },
        { book: 'Dân Số Ký', progress: 30 },
        { book: 'Phục Truyền Luật Lệ Ký', progress: 15 }
      ],
      'SÁCH LỊCH SỬ': [
        { book: 'Giô-suê', progress: 60 },
        { book: 'Các Quan Xét', progress: 40 },
        { book: 'Ru-tơ', progress: 90 },
        { book: '1 Sa-mu-ên', progress: 25 },
        { book: '2 Sa-mu-ên', progress: 20 },
        { book: '1 Các Vua', progress: 15 },
        { book: '2 Các Vua', progress: 10 },
        { book: '1 Sử Ký', progress: 5 },
        { book: '2 Sử Ký', progress: 5 },
        { book: 'Ê-xơ-ra', progress: 30 },
        { book: 'Nê-hê-mi', progress: 25 },
        { book: 'Ê-xơ-tê', progress: 80 }
      ],
      'SÁCH THI CA': [
        { book: 'Gióp', progress: 35 },
        { book: 'Thi Thiên', progress: 70 },
        { book: 'Châm Ngôn', progress: 55 },
        { book: 'Truyền Đạo', progress: 40 },
        { book: 'Nhã Ca', progress: 20 }
      ],
      'SÁCH TIÊN TRI': [
        { book: 'Ê-sai', progress: 30 },
        { book: 'Giê-rê-mi', progress: 20 },
        { book: 'Ca Thương', progress: 15 },
        { book: 'Ê-xê-chi-ên', progress: 10 },
        { book: 'Đa-ni-ên', progress: 45 },
        { book: 'Ô-sê', progress: 25 },
        { book: 'Giô-ên', progress: 35 },
        { book: 'A-mốt', progress: 20 },
        { book: 'Áp-đia', progress: 15 },
        { book: 'Giô-na', progress: 60 },
        { book: 'Mi-chê', progress: 25 },
        { book: 'Na-hum', progress: 20 },
        { book: 'Ha-ba-cúc', progress: 15 },
        { book: 'Sô-phô-ni', progress: 10 },
        { book: 'A-ghê', progress: 30 },
        { book: 'Xa-cha-ri', progress: 20 },
        { book: 'Ma-la-chi', progress: 25 }
      ],
      'SÁCH TIN MỪNG': [
        { book: 'Ma-thi-ơ', progress: 80 },
        { book: 'Mác', progress: 75 },
        { book: 'Lu-ca', progress: 70 },
        { book: 'Giăng', progress: 85 }
      ],
      'SÁCH CÔNG VỤ': [
        { book: 'Công Vụ', progress: 60 }
      ],
      'CÁC THƯ TÍN': [
        { book: 'Rô-ma', progress: 45 },
        { book: '1 Cô-rinh-tô', progress: 40 },
        { book: '2 Cô-rinh-tô', progress: 35 },
        { book: 'Ga-la-ti', progress: 50 },
        { book: 'Ê-phê-sô', progress: 55 },
        { book: 'Phi-líp', progress: 60 },
        { book: 'Cô-lô-se', progress: 45 },
        { book: '1 Tê-sa-lô-ni-ca', progress: 40 },
        { book: '2 Tê-sa-lô-ni-ca', progress: 35 },
        { book: '1 Ti-mô-thê', progress: 50 },
        { book: '2 Ti-mô-thê', progress: 45 },
        { book: 'Tít', progress: 40 },
        { book: 'Phi-lê-môn', progress: 55 },
        { book: 'Hê-bơ-rơ', progress: 30 },
        { book: 'Gia-cơ', progress: 65 },
        { book: '1 Phi-e-rơ', progress: 50 },
        { book: '2 Phi-e-rơ', progress: 45 },
        { book: '1 Giăng', progress: 60 },
        { book: '2 Giăng', progress: 40 },
        { book: '3 Giăng', progress: 35 },
        { book: 'Giu-đe', progress: 30 }
      ],
      'SÁCH KHẢI HUYỀN': [
        { book: 'Khải Huyền', progress: 25 }
      ]
    }
  }

  const getProgressData = () => {
    const bibleData = getBibleData()

    if (selectedGroup === 'TOÀN BỘ') {
      // Return all books for overview
      return Object.values(bibleData).flat()
    } else if (selectedGroup === 'CỰU ƯỚC') {
      return [
        ...bibleData['NGŨ KINH'],
        ...bibleData['SÁCH LỊCH SỬ'],
        ...bibleData['SÁCH THI CA'],
        ...bibleData['SÁCH TIÊN TRI']
      ]
    } else if (selectedGroup === 'TÂN ƯỚC') {
      return [
        ...bibleData['SÁCH TIN MỪNG'],
        ...bibleData['SÁCH CÔNG VỤ'],
        ...bibleData['CÁC THƯ TÍN'],
        ...bibleData['SÁCH KHẢI HUYỀN']
      ]
    } else {
      return (bibleData as Record<string, any>)[selectedGroup] || []
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0E0B1A' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#00FFFF' }}>
            Vui lòng đăng nhập để xem hồ sơ
          </h2>
          <Link
            to="/login"
            className="px-6 py-3 rounded-lg font-medium transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #00FFFF 0%, #9333EA 100%)',
              color: '#0E0B1A',
              boxShadow: '0 4px 15px rgba(0, 255, 255, 0.3)'
            }}
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0E0B1A' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-medium" style={{ color: '#00FFFF' }}>
            Đang tải hồ sơ...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-bg min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="page-title text-4xl mb-4">
            NHẬT KÝ HÀNH TRÌNH
          </h1>
          <p className="text-[#7a6a5a] text-lg font-medium">
            Theo dõi tiến độ học tập và sự thăng tiến của bạn
          </p>
        </div>

        {/* User Info */}
        <div className="page-card p-8 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black shadow-lg border-4 border-white"
                style={{
                  background: 'linear-gradient(135deg, #4bbf9f 0%, #38a169 100%)',
                  color: '#ffffff'
                }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-black text-[#4a3f35] parchment-headline mb-2">{user.name}</h2>
                <div
                  className="relative inline-block"
                  onMouseEnter={() => setShowTitleTooltip(true)}
                  onMouseLeave={() => setShowTitleTooltip(false)}
                >
                  <span className="px-4 py-1.5 rounded-full bg-[#fdfaf3] border border-[#eeeae0] text-[#7a6a5a] text-sm font-bold cursor-help shadow-sm">
                    {stats.level >= 10 ? '🌟 Bậc Thầy Học Thuật' :
                      stats.level >= 5 ? '⭐ Học Giả Tiên Tiến' :
                        '📚 Người Bắt Đầu'}
                  </span>

                  {/* Title Tooltip */}
                  {showTitleTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-[#12103a] text-white text-xs rounded-xl shadow-xl z-50 min-w-[200px] border border-[#4bbf9f]/30">
                      <div className="font-bold mb-1 text-[#4bbf9f]">Danh hiệu của bạn</div>
                      <div className="text-xs opacity-90 leading-relaxed">
                        {stats.level >= 10 ? 'Bậc thầy học thuật - Đã chinh phục mọi thử thách!' :
                          stats.level >= 5 ? 'Học giả tiên tiến - Đang trên đường trở thành bậc thầy!' :
                            'Người bắt đầu - Hãy hoàn thành các thử thách để thăng tiến lên "Người Tìm Hiểu", "Môn Đồ", "Học Giả"...'}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-[#12103a]"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3 min-w-[200px]">
              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#7a6a5a] font-bold text-sm uppercase tracking-wider">Cấp độ {stats.level}</span>
                  <span className="text-[#4bbf9f] font-black">{Math.floor((stats.level % 10) * 10)}%</span>
                </div>

                {/* Level Progress Bar */}
                <div
                  className="relative"
                  onMouseEnter={() => setShowProgressTooltip(true)}
                  onMouseLeave={() => setShowProgressTooltip(false)}
                >
                  <div className="w-full h-3 bg-[#eeeae0] rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-[#4bbf9f] to-[#38a169] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(75,191,159,0.3)]"
                      style={{
                        width: `${(stats.level % 10) * 10}%`,
                      }}
                    ></div>
                  </div>

                  {/* Progress Tooltip */}
                  {showProgressTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-[#12103a] text-white text-xs rounded-xl shadow-xl z-50 min-w-[200px] border border-[#4bbf9f]/30">
                      <div className="font-bold mb-1 text-[#4bbf9f]">Tiến độ thăng cấp</div>
                      <div className="text-xs opacity-90 leading-relaxed">
                        {stats.level % 10 === 0 ? 'Đã đạt cấp độ mới!' :
                          `Bạn cần thêm ${(10 - (stats.level % 10)) * 10} điểm kinh nghiệm để lên cấp.`}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-[#12103a]"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Left Side Stats */}
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{
                background: 'linear-gradient(135deg, #FF8C42, #FF6B9D)',
                border: '2px solid #FF8C42',
                boxShadow: '0 0 15px #FF8C42, inset 0 0 15px rgba(255, 140, 66, 0.1)'
              }}>
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <div className="text-white opacity-80">ĐIỂM CAO</div>
                {stats.highScore > 0 ? (
                  <div className="text-2xl font-bold" style={{ color: '#FF8C42' }}>{stats.highScore}</div>
                ) : (
                  <div className="text-lg font-semibold italic" style={{ color: '#FF8C42' }}>
                    Hãy ghi dấu ấn đầu tiên!
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{
                background: 'linear-gradient(135deg, #FF6B9D, #9333EA)',
                border: '2px solid #FF6B9D',
                boxShadow: '0 0 15px #FF6B9D, inset 0 0 15px rgba(255, 107, 157, 0.1)'
              }}>
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <div className="text-white opacity-80">ĐIỂM TỔNG</div>
                {stats.totalPoints > 0 ? (
                  <div className="text-2xl font-bold" style={{ color: '#FF6B9D' }}>{stats.totalPoints}</div>
                ) : (
                  <div className="text-lg font-semibold italic" style={{ color: '#FF6B9D' }}>
                    Sẵn sàng chinh phục!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side Stats */}
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{
                background: 'linear-gradient(135deg, #FF6B9D, #9333EA)',
                border: '2px solid #FF6B9D',
                boxShadow: '0 0 15px #FF6B9D, inset 0 0 15px rgba(255, 107, 157, 0.1)'
              }}>
                <span className="text-2xl">🔥</span>
              </div>
              <div>
                <div className="text-white opacity-80">Chuỗi thắng: {stats.streak}</div>
                {stats.streak > 0 ? (
                  <div className="text-2xl font-bold" style={{ color: '#FF6B9D' }}>{stats.streak}</div>
                ) : (
                  <div className="text-lg font-semibold italic" style={{ color: '#FF6B9D' }}>
                    Bắt đầu ngay!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Graph */}
        <div className="bg-black bg-opacity-40 rounded-2xl p-6 mb-8" style={{
          border: '1px solid rgba(0, 255, 136, 0.3)',
          boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), inset 0 0 20px rgba(0, 255, 136, 0.1)'
        }}>
          <h3 className="text-2xl font-bold mb-2" style={{
            color: '#00FF88',
            textShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
            fontSize: '1.5rem'
          }}>TIẾN ĐỘ HỌC TẬP</h3>
          <p className="text-sm italic mb-4" style={{ color: '#B0B0B0' }}>
            Tỷ lệ trả lời đúng trung bình theo Sách
          </p>

          {/* Group Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['TOÀN BỘ', 'CỰU ƯỚC', 'TÂN ƯỚC', 'NGŨ KINH', 'SÁCH LỊCH SỬ', 'SÁCH THI CA', 'SÁCH TIÊN TRI', 'SÁCH TIN MỪNG', 'CÁC THƯ TÍN'].map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${selectedGroup === group
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-400 text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                style={{
                  boxShadow: selectedGroup === group ? '0 0 10px rgba(0, 255, 255, 0.3)' : 'none'
                }}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="bg-black bg-opacity-40 p-6 rounded-2xl relative" style={{
            border: '1px solid rgba(0, 255, 136, 0.3)',
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), inset 0 0 20px rgba(0, 255, 136, 0.1)'
          }}>
            {/* List View */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getProgressData().map((item: { book: string; progress: number }, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white mb-1">{item.book}</div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-green-400 rounded-full transition-all duration-1000"
                        style={{
                          width: `${item.progress}%`,
                          boxShadow: '0 0 8px rgba(0, 255, 255, 0.5)'
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-lg font-bold" style={{ color: '#00FF88' }}>
                      {item.progress}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {item.progress >= 80 ? '🌟 Xuất sắc' :
                        item.progress >= 60 ? '⭐ Tốt' :
                          item.progress >= 40 ? '📈 Đang tiến bộ' : '💪 Cần cố gắng'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Button */}
        <div className="text-center">
          <Link
            to="/"
            className="px-12 py-4 text-xl font-bold tracking-wider rounded-2xl transition-all duration-300 group relative overflow-hidden"
            style={{
              border: '2px solid #00FFFF',
              backgroundColor: '#161228',
              boxShadow: '0 0 20px #00FFFF, inset 0 0 20px rgba(0, 255, 255, 0.1)',
              color: '#00FFFF'
            }}
          >
            <span className="relative z-10">QUAY VỀ SẢNH CHỜ</span>
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(45deg, rgba(0, 255, 255, 0.1), rgba(0, 255, 255, 0.2))',
                boxShadow: '0 0 30px #00FFFF, 0 0 60px #00FFFF'
              }}
            />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Profile