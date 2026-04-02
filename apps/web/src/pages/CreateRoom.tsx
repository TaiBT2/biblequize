import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { api } from '../api/client'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

const MODES = [
  { id: 'SPEED_RACE', icon: 'speed', label: 'Speed Race', desc: 'Ai nhanh hơn thắng', color: '#4a9eff' },
  { id: 'BATTLE_ROYALE', icon: 'swords', label: 'Battle Royale', desc: 'Sai là bị loại', color: '#e8a832' },
  { id: 'TEAM_VS_TEAM', icon: 'groups', label: 'Team vs Team', desc: 'Chia đội thi đấu', color: '#9b59b6' },
  { id: 'SUDDEN_DEATH', icon: 'bolt', label: 'Sudden Death', desc: '1v1 King of the Hill', color: '#ff8c42' },
] as const

const QUESTION_COUNTS = [10, 15, 20, 30]
const TIME_OPTIONS = [10, 15, 20, 30]
const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
  { value: 'MIXED', label: 'Hỗn hợp' },
]

export default function CreateRoom() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    roomName: '',
    mode: searchParams.get('mode') ?? 'SPEED_RACE',
    questionCount: 10,
    timePerQuestion: 15,
    difficulty: 'MIXED',
    maxPlayers: 8,
    isPublic: false,
  })

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/api/rooms', formData)
      const room = res.data
      navigate(`/room/${room.id}/lobby`, { state: { room, mode: formData.mode } })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tạo phòng. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[#11131e] text-[#e1e1f1] flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Back link */}
        <Link to="/multiplayer" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface text-sm transition-colors">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Quay lại
        </Link>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="glass-card rounded-3xl border border-outline-variant/10 p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-3xl" style={FILL_1}>gamepad</span>
              Tạo phòng mới
            </h1>
            <div className="h-1 w-16 gold-gradient rounded-full mt-3" />
          </div>

          {/* Room name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tên phòng (tùy chọn)</label>
            <input
              type="text"
              value={formData.roomName}
              onChange={(e) => setFormData(prev => ({ ...prev, roomName: e.target.value }))}
              placeholder="Phòng của bạn..."
              className="w-full bg-surface-container-highest border border-outline-variant/15 rounded-xl px-4 py-3 text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-secondary/50 focus:border-secondary/30 outline-none transition-all"
            />
          </div>

          {/* Game mode cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Chế độ chơi</label>
            <div className="grid grid-cols-2 gap-3">
              {MODES.map((m) => {
                const active = formData.mode === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, mode: m.id }))}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      active
                        ? 'border-secondary/50 bg-secondary/10'
                        : 'border-outline-variant/10 bg-surface-container hover:border-outline-variant/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${m.color}15` }}>
                        <span className="material-symbols-outlined text-xl" style={{ color: m.color, ...FILL_1 }}>{m.icon}</span>
                      </div>
                      <span className={`font-bold text-sm ${active ? 'text-secondary' : 'text-on-surface'}`}>{m.label}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{m.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Segmented controls row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Question count */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Số câu hỏi</label>
              <div className="flex rounded-xl overflow-hidden border border-outline-variant/15">
                {QUESTION_COUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, questionCount: n }))}
                    className={`flex-1 py-2.5 text-sm font-bold transition-all ${
                      formData.questionCount === n
                        ? 'gold-gradient text-on-secondary'
                        : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Time per question */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Thời gian/câu</label>
              <div className="flex rounded-xl overflow-hidden border border-outline-variant/15">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, timePerQuestion: t }))}
                    className={`flex-1 py-2.5 text-sm font-bold transition-all ${
                      formData.timePerQuestion === t
                        ? 'gold-gradient text-on-secondary'
                        : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Độ khó</label>
            <div className="flex rounded-xl overflow-hidden border border-outline-variant/15">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, difficulty: d.value }))}
                  className={`flex-1 py-2.5 text-sm font-bold transition-all ${
                    formData.difficulty === d.value
                      ? 'gold-gradient text-on-secondary'
                      : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max players slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Số người tối đa</label>
              <span className="text-sm font-black text-secondary">{formData.maxPlayers}</span>
            </div>
            <input
              type="range"
              min={2}
              max={20}
              value={formData.maxPlayers}
              onChange={(e) => setFormData(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
              className="w-full accent-[#e8a832] h-2 rounded-full appearance-none bg-surface-container-highest cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant">
              <span>2</span>
              <span>20</span>
            </div>
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">
                {formData.isPublic ? 'public' : 'lock'}
              </span>
              <div>
                <p className="text-sm font-bold text-on-surface">{formData.isPublic ? 'Phòng công khai' : 'Phòng riêng tư'}</p>
                <p className="text-xs text-on-surface-variant">{formData.isPublic ? 'Mọi người có thể tìm thấy' : 'Chỉ có mã mời'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
              className={`w-12 h-7 rounded-full transition-colors relative ${formData.isPublic ? 'bg-secondary' : 'bg-surface-container-highest'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-transform ${formData.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-error">error</span>
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 gold-gradient text-on-secondary font-black rounded-2xl shadow-xl shadow-secondary/20 hover:scale-[1.01] active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                Đang tạo...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Tạo phòng
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
