import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

const statusColor = (status?: string) => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'neon-orange'
    case 'ENDED':
      return 'neon-gray'
    default:
      return 'neon-green'
  }
}

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
    <div className="min-h-screen neon-bg flex items-center justify-center p-4">
      <div className="neon-card p-8 w-full max-w-3xl">
        <h1 className="neon-text text-3xl text-center mb-6">Phòng Chơi</h1>

        {(message || error) && (
          <div className={`mb-4 text-center ${error ? 'neon-red' : 'neon-green'}`}>
            {error || message}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Tạo phòng */}
          <div className="neon-card p-6 space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Tên người chơi</label>
              <input
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                className="neon-input w-full"
                placeholder="Tên của bạn"
              />
            </div>
            <button onClick={createRoom} className="neon-btn neon-btn-green w-full py-2" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo Phòng'}
            </button>
          </div>

          {/* Tham gia phòng */}
          <div className="neon-card p-6 space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Mã phòng</label>
              <input
                value={roomId}
                onChange={e => setRoomId(e.target.value.toUpperCase())}
                className="neon-input w-full tracking-widest text-center"
                placeholder="VD: ABC123"
                maxLength={6}
              />
            </div>
            <button onClick={joinRoom} className="neon-btn neon-btn-blue w-full py-2" disabled={loading}>
              {loading ? 'Đang tham gia...' : 'Tham Gia'}
            </button>
          </div>
        </div>

        {room && (
          <div className="neon-card p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-gray-300">Mã phòng</div>
                <div className="neon-blue text-2xl font-bold tracking-widest">{room.id}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${statusColor(room.status)}`}>
                {room.status}
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button onClick={copyCode} className="neon-btn neon-btn-gray px-4 py-2">Copy mã</button>
              <button onClick={startRoom} className="neon-btn neon-btn-orange px-4 py-2" disabled={loading || room.status !== 'LOBBY'}>
                Bắt Đầu
              </button>
            </div>

            <div className="text-gray-300 mb-2">Người chơi</div>
            <ul className="list-disc list-inside text-gray-200">
              {room.players?.map((p: any) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default Rooms


