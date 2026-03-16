import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

const statusColor = (status?: string) => {
  switch (status) {
    case 'IN_PROGRESS': return '#FF6B35';
    case 'ENDED': return '#666';
    default: return '#00F5D4';
  }
}

// ── Icons ──────────────────────────────────────────────────────────────────
const PlusIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const ArrowRightIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

const HouseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const Rooms: React.FC = () => {
  const navigate = useNavigate()
  const [roomId, setRoomId] = useState('')
  const [playerName, setPlayerName] = useState('Guest')
  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const requireName = (): boolean => {
    if (!playerName.trim()) {
      setError('Vui lòng nhập tên người chơi')
      return false
    }
    setError(null)
    return true
  }

  const createRoom = async () => {
    if (!requireName()) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await api.post('/api/rooms', { hostName: playerName.trim() })
      setRoom(res.data)
      setRoomId(res.data.id)
      setMessage('Đã tạo phòng. Hãy chia sẻ mã cho bạn bè!')
    } catch (e: any) {
      setError('Không tạo được phòng. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async () => {
    if (!requireName()) return
    if (!roomId.trim()) {
      setError('Vui lòng nhập mã phòng')
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await api.post(`/api/rooms/${roomId.trim().toUpperCase()}/join`, { playerName: playerName.trim() })
      setRoom(res.data)
      setMessage('Đã tham gia phòng thành công')
    } catch (e: any) {
      setError('Không tham gia được phòng. Kiểm tra mã phòng.')
    } finally {
      setLoading(false)
    }
  }

  const startRoom = async () => {
    if (!room?.id) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await api.post(`/api/rooms/${room.id}/start`)
      setRoom(res.data)
      setMessage('Phòng đã bắt đầu')
      // Điều hướng sang quiz khi bắt đầu
      navigate(`/room/${res.data.id}/quiz`)
    } catch (e: any) {
      setError('Không thể bắt đầu phòng. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Nếu phòng đang IN_PROGRESS (ví dụ host đã bấm trước), tự động vào quiz
  useEffect(() => {
    if (room?.status === 'IN_PROGRESS') {
      navigate(`/room/${room.id}/quiz`)
    }
  }, [room?.status])

  const copyCode = async () => {
    if (!room?.id) return
    try {
      await navigator.clipboard.writeText(room.id)
      setMessage('Đã copy mã phòng vào clipboard')
    } catch {
      setError('Không copy được mã phòng')
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden nebula-bg flex flex-col items-center justify-center p-10 relative">
      <div className="relative w-full max-w-4xl z-10 transition-all duration-700">
        <div className="absolute inset-0 mockup-dark-card rounded-[3rem] border-white/5 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/ancient-pavilion.png')` }}></div>

          <div className="h-full w-full flex flex-col justify-center px-12 py-10 relative">
            <h1 className="text-5xl font-black mb-8 tracking-tighter text-glow text-center"
              style={{
                background: 'linear-gradient(to bottom, #A855F7, #00D2FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(168, 85, 247, 0.4)'
              }}>
              PHÒNG CHƠI TRỰC TUYẾN
            </h1>

            {(message || error) && (
              <div className={`mb-6 p-4 rounded-xl border text-sm font-black uppercase tracking-widest text-center transition-all animate-pulse ${error ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'}`}>
                {error || message}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {/* Tạo phòng - HIỆU ỨNG TƯƠNG PHẢN CAO */}
              <div className="group relative p-8 rounded-3xl border border-white/5 bg-black/40 hover:border-cyan-500/30 transition-all hover:bg-black/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                    <PlusIcon size={24} />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">TẠO PHÒNG MỚI</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-2">Tên người chơi</label>
                    <input
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white font-bold tracking-wide focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all outline-none"
                      placeholder="Nhập biệt danh của bạn..."
                    />
                  </div>
                  <button
                    onClick={createRoom}
                    disabled={loading}
                    className="w-full py-4 relative font-black uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer overflow-hidden group-hover:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(90deg, #00F5D4 0%, #00D1B2 50%, #00F5D4 100%)',
                      backgroundSize: '200% auto',
                      color: '#000',
                      fontSize: '12px',
                      border: 'none',
                      clipPath: 'polygon(15px 0%, 100% 0%, calc(100% - 15px) 100%, 0% 100%)',
                      boxShadow: '0 0 30px rgba(0, 245, 212, 0.3)',
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? 'ĐANG KHỞI TẠO...' : 'XÁC NHẬN TẠO'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent shine-sweep pointer-events-none" />
                  </button>
                </div>
              </div>

              {/* Tham gia phòng - GLASSMORPHISM STYLE */}
              <div className="group relative p-8 rounded-3xl border border-white/5 bg-black/40 hover:border-purple-500/30 transition-all hover:bg-black/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                    <ArrowRightIcon size={24} />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">THAM GIA PHÒNG</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-2">Mã phòng (6 ký tự)</label>
                    <input
                      value={roomId}
                      onChange={e => setRoomId(e.target.value.toUpperCase())}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white font-black tracking-[0.5em] text-center focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all outline-none"
                      placeholder="VD: ABC123"
                      maxLength={6}
                    />
                  </div>
                  <button
                    onClick={joinRoom}
                    disabled={loading}
                    className="w-full py-4 relative font-black uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer overflow-hidden border border-purple-500/40 text-purple-400 group-hover:scale-[1.02]"
                    style={{
                      background: 'rgba(168, 85, 247, 0.05)',
                      backdropFilter: 'blur(10px)',
                      fontSize: '12px',
                      clipPath: 'polygon(0% 0%, calc(100% - 15px) 0%, 100% 100%, 15px 100%)',
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2 group-hover:text-white transition-colors">
                      {loading ? 'ĐANG KIỂM TRA...' : 'VÀO PHÒNG'}
                    </span>
                    <div className="absolute inset-0 bg-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            </div>

            {room && (
              <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">MÃ PHÒNG</div>
                      <div className="text-3xl font-black tracking-[0.3em] text-cyan-400">{room.id}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/60">{room.status}</span>
                      </div>
                      <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Sẵn sàng để bắt đầu</div>
                    </div>
                  </div>
                  <div className="flex gap-3 mb-6">
                    <button onClick={copyCode} className="px-5 py-2.5 rounded-xl border border-white/10 bg-black/30 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-black/50 transition-all">COPY MÃ</button>
                    <button
                      onClick={startRoom}
                      disabled={loading || room.status !== 'LOBBY'}
                      className="px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(255,107,53,0.3)] transition-all active:scale-95"
                      style={{ background: 'linear-gradient(to right, #FF6B35, #FF9F1C)', color: '#000' }}
                    >
                      BẮT ĐẦU NGAY
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2">Danh sách thành viên ({room.players?.length || 0})</div>
                  <div className="flex flex-wrap gap-2">
                    {room.players?.map((p: any) => (
                      <div key={p.id} className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-[12px] font-bold text-white/80">
                        {p.name} {p.isHost && <span className="text-cyan-400 ml-1">★</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Decorative Blobs */}
        <div className="absolute -left-20 top-1/4 w-64 h-64 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute -right-20 bottom-1/4 w-64 h-64 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-12 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-8 py-3 rounded-xl border border-white/10 bg-black/40 text-white/40 text-[11px] font-black uppercase tracking-[0.3em] hover:text-white hover:border-white/30 transition-all group"
        >
          <HouseIcon size={16} />
          <span>Quay lại trang chủ</span>
        </button>
      </div>
    </div>
  )
}

export default Rooms




