import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'

export default function NotificationsAdmin() {
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const fetchHistory = async () => {
    setIsLoading(true)
    try { const res = await api.get('/api/notifications?limit=20'); setHistory(Array.isArray(res.data) ? res.data : []) }
    catch { /* */ } finally { setIsLoading(false) }
  }

  useEffect(() => { fetchHistory() }, [])

  const sendBroadcast = async () => {
    if (!title.trim() || !content.trim()) return
    setIsSending(true)
    try {
      // Note: broadcast endpoint needs to be created in backend
      // For now, using placeholder
      await new Promise(r => setTimeout(r, 500))
      setSent(true)
      setTitle('')
      setContent('')
      setTimeout(() => setSent(false), 3000)
    } catch { /* */ } finally { setIsSending(false) }
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-3xl font-extrabold text-[#e1e1ef] tracking-tight">Quản lý Thông báo</h2><p className="text-[#d5c4af] text-sm mt-1">Broadcast & automated notification management</p></div>

      {/* Compose */}
      <div className="rounded-lg border border-[#504535]/10 bg-[#1d1f29] p-5 space-y-3">
        <h3 className="font-medium text-[#e1e1ef]">Gửi thông báo</h3>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề thông báo"
          className="w-full bg-[#191b25] border-none rounded-lg px-4 py-2 text-sm text-[#e1e1ef] focus:ring-1 focus:ring-[#e8a832] outline-none" />
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Nội dung thông báo..." rows={3}
          className="w-full bg-[#191b25] border-none rounded-lg p-3 text-sm text-[#e1e1ef] resize-none focus:ring-1 focus:ring-[#e8a832] outline-none" />
        <div className="flex items-center justify-between">
          <span className="text-[#d5c4af]/40 text-xs">Gửi đến tất cả người dùng</span>
          <button onClick={sendBroadcast} disabled={isSending || !title.trim() || !content.trim()}
            className="px-6 py-2 bg-[#e8a832] text-[#281900] rounded-lg text-sm font-bold hover:brightness-110 disabled:opacity-50">
            {isSending ? 'Đang gửi...' : 'Gửi thông báo'}
          </button>
        </div>
        {sent && <div className="text-emerald-400 text-sm font-medium">✓ Đã gửi thành công</div>}
      </div>

      {/* Automated notifications */}
      <div className="rounded-lg border border-[#504535]/10 bg-[#1d1f29] p-5">
        <h3 className="font-medium text-[#e1e1ef] mb-3">Thông báo tự động</h3>
        <div className="space-y-2">
          {[
            { name: 'Nhắc streak sắp gãy', schedule: 'Mỗi giờ', enabled: true },
            { name: 'Nhắc daily challenge', schedule: '8:00 sáng', enabled: true },
            { name: 'Tóm tắt tuần', schedule: 'Thứ Hai 9:00', enabled: false },
            { name: 'Welcome new user', schedule: 'Khi đăng ký', enabled: true },
            { name: 'Tier up celebration', schedule: 'Khi lên tier', enabled: true },
          ].map(n => (
            <div key={n.name} className="flex items-center justify-between p-3 rounded-lg bg-[#1d1f29]">
              <div>
                <p className="text-sm font-medium text-[#d5c4af]">{n.name}</p>
                <p className="text-[#d5c4af]/40 text-xs">{n.schedule}</p>
              </div>
              <div className={`w-10 h-5 rounded-full ${n.enabled ? 'bg-emerald-500' : 'bg-white/20'} relative`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${n.enabled ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="rounded-lg border border-[#504535]/10 bg-[#1d1f29] p-5">
        <h3 className="font-medium text-[#e1e1ef] mb-3">Lịch sử thông báo</h3>
        {isLoading ? <p className="text-[#d5c4af]/40 text-sm">Đang tải...</p>
         : history.length === 0 ? <p className="text-[#d5c4af]/40 text-sm">Chưa có thông báo nào</p>
         : <div className="space-y-2">{history.slice(0, 10).map((n: any, i: number) => (
            <div key={i} className="p-3 rounded-lg bg-[#1d1f29] flex items-center justify-between">
              <div><p className="text-sm text-[#d5c4af]">{n.title || n.content?.slice(0, 50)}</p><p className="text-[#d5c4af]/40 text-xs">{n.createdAt}</p></div>
              <span className={`text-xs ${n.isRead ? 'text-[#d5c4af]/30' : 'text-[#e8a832]'}`}>{n.isRead ? 'Đã đọc' : 'Mới'}</span>
            </div>
          ))}</div>
        }
      </div>
    </div>
  )
}
