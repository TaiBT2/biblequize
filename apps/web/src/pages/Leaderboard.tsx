import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

type Tab = 'daily' | 'weekly' | 'all-time'

const Leaderboard: React.FC = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('daily')
  const [rows, setRows] = useState<Array<any>>([])
  const [date, setDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [pageSize] = useState(20)
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const params: any = { page: currentPage, size: pageSize }
        if (tab === 'daily' && date) {
          params.date = date
        }
        
        const res = await api.get(`/api/leaderboard/${tab}`, { params })
        const data = Array.isArray(res.data) ? res.data : []
        setRows(data)
        // We don't have total count from API; infer if there is a next page
        setHasNextPage(data.length === pageSize)
        
        // Get user's rank if authenticated
        if (user) {
          try {
            const userRes = await api.get(`/api/leaderboard/${tab}/my-rank`, { 
              params: tab==='daily' && date ? { date } : {} 
            })
            setUserRank(userRes.data)
          } catch (err) {
            console.log('User rank not available')
            setUserRank(null)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tab, date, user, currentPage])

  return (
    <div className="min-h-screen neon-bg p-4">
      <div className="container mx-auto max-w-3xl">
        {/* Back to Home Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/')}
            className="neon-btn neon-btn-green px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform duration-200 hover:brightness-110"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Trở lại trang chủ</span>
          </button>
        </div>

        <h1 className="neon-text text-4xl text-center mb-6">Bảng Xếp Hạng</h1>

        <div className="flex justify-center gap-3 mb-6">
          <button className={`neon-btn px-4 py-2 transition-colors duration-150 hover:brightness-110 ${tab==='daily'?'neon-btn-blue':''}`} onClick={() => setTab('daily')}>Ngày</button>
          <button className={`neon-btn px-4 py-2 transition-colors duration-150 hover:brightness-110 ${tab==='weekly'?'neon-btn-blue':''}`} onClick={() => setTab('weekly')}>Tuần</button>
          <button className={`neon-btn px-4 py-2 transition-colors duration-150 hover:brightness-110 ${tab==='all-time'?'neon-btn-blue':''}`} onClick={() => setTab('all-time')}>Tất cả</button>
        </div>

        <div className="neon-card p-4">
          {tab==='daily' && (
            <div className="mb-4 flex items-center gap-3">
              <label className="text-white">Chọn ngày:</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="neon-input" />
            </div>
          )}
          {tab==='weekly' && (
            <div className="mb-4 text-sm text-white/80">
              Xếp hạng cộng dồn 7 ngày gần nhất. Sắp có chọn tuần cụ thể.
            </div>
          )}
          
          {/* User's Rank Display */}
          {userRank && (
            <div className="mb-6 p-4 neon-border-blue bg-black bg-opacity-30 rounded-lg">
              <h3 className="text-lg font-bold neon-blue mb-2">Vị trí của bạn</h3>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white">Hạng: </span>
                  <span className="neon-pink font-bold text-xl">#{userRank.rank}</span>
                </div>
                <div>
                  <span className="text-white">Điểm: </span>
                  <span className="neon-green font-bold">{userRank.points}</span>
                </div>
                <div>
                  <span className="text-white">Câu: </span>
                  <span className="neon-orange font-bold">{userRank.questions}</span>
                </div>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="text-center text-white animate-pulse">Đang tải...</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-9 h-9 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8m-6-4h4m-8-8a4 4 0 118 0c0 7-4 8-4 8s-4-1-4-8z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Chưa có dữ liệu</h3>
              <p className="text-white/70 text-sm max-w-md">
                {tab==='daily' ? 'Chưa có ai ghi danh trong ngày này. Hãy là người đầu tiên!' : 'Dữ liệu xếp hạng sẽ được cập nhật liên tục. Quay lại sau nhé!'}
              </p>
              <div className="w-full mt-6">
                <table className="w-full text-left opacity-60">
                  <thead>
                    <tr className="text-white">
                      <th className="py-2">#</th>
                      <th className="py-2">Người chơi</th>
                      <th className="py-2">Điểm</th>
                      <th className="py-2">Câu</th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>
          ) : (
            <table className="w-full text-left transition-opacity duration-200">
              <thead>
                <tr className="text-white">
                  <th className="py-2">#</th>
                  <th className="py-2">Người chơi</th>
                  <th className="py-2">Điểm</th>
                  <th className="py-2">Câu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const absoluteRank = currentPage * pageSize + i + 1
                  const isTop1 = absoluteRank === 1
                  const isTop2 = absoluteRank === 2
                  const isTop3 = absoluteRank === 3
                  return (
                    <tr key={i} className={`text-gray-200 border-b border-gray-700 ${isTop1 ? 'bg-yellow-500/10' : isTop2 ? 'bg-gray-300/10' : isTop3 ? 'bg-amber-700/10' : ''}`}>
                      <td className="py-2">
                        {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : absoluteRank}
                      </td>
                      <td className="py-2 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 text-sm">
                          {(r.name || '?').substring(0,1).toUpperCase()}
                        </div>
                        <span>{r.name}</span>
                      </td>
                      <td className="py-2">{r.points}</td>
                      <td className="py-2">{r.questions}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          
          {/* Pagination */}
          {rows.length > 0 && (
            <div className="mt-6 flex justify-center items-center space-x-4">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="neon-btn neon-btn-blue px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Trước
              </button>

              <span className="text-white/80">Trang {currentPage + 1}</span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!hasNextPage}
                className="neon-btn neon-btn-blue px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Leaderboard


