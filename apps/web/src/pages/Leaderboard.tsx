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
  const [totalPages, setTotalPages] = useState(0)
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
        setRows(res.data || [])
        
        // Estimate total pages (simplified - in real app you'd get this from API)
        setTotalPages(Math.max(1, Math.ceil(rows.length / pageSize)))
        
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
            className="neon-btn neon-btn-green px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Trở lại trang chủ</span>
          </button>
        </div>

        <h1 className="neon-text text-4xl text-center mb-6">Bảng Xếp Hạng</h1>

        <div className="flex justify-center gap-3 mb-6">
          <button className={`neon-btn px-4 py-2 ${tab==='daily'?'neon-btn-blue':''}`} onClick={() => setTab('daily')}>Ngày</button>
          <button className={`neon-btn px-4 py-2 ${tab==='weekly'?'neon-btn-blue':''}`} onClick={() => setTab('weekly')}>Tuần</button>
          <button className={`neon-btn px-4 py-2 ${tab==='all-time'?'neon-btn-blue':''}`} onClick={() => setTab('all-time')}>Tất cả</button>
        </div>

        <div className="neon-card p-4">
          {tab==='daily' && (
            <div className="mb-4 flex items-center gap-3">
              <label className="text-white">Chọn ngày:</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="neon-input" />
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
            <div className="text-center text-white">Đang tải...</div>
          ) : rows.length === 0 ? (
            <div className="text-center text-white">Chưa có dữ liệu</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-white">
                  <th className="py-2">#</th>
                  <th className="py-2">Người chơi</th>
                  <th className="py-2">Điểm</th>
                  <th className="py-2">Câu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="text-gray-200 border-b border-gray-700">
                    <td className="py-2">{i+1}</td>
                    <td className="py-2">{r.name}</td>
                    <td className="py-2">{r.points}</td>
                    <td className="py-2">{r.questions}</td>
                  </tr>
                ))}
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
              
              <div className="flex space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(0, Math.min(totalPages - 1, currentPage - 2 + i))
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded ${
                        pageNum === currentPage 
                          ? 'neon-btn-blue bg-blue-600' 
                          : 'neon-btn text-white hover:bg-gray-700'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
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


