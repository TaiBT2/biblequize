import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useTranslation } from 'react-i18next'

interface PreviewData {
  totalSelected: number
  poolBreakdown: Record<string, number>
  difficultyBreakdown: Record<string, number>
  questions: Array<{ id: string; content: string; book: string; difficulty: string; previouslySeen: boolean }>
}

const testApi = {
  setTier: (userId: string, tier: number) =>
    api.post(`/api/admin/test/users/${userId}/set-tier?tierLevel=${tier}`),
  resetHistory: (userId: string) =>
    api.post(`/api/admin/test/users/${userId}/reset-history`),
  mockHistory: (userId: string, percentSeen: number, percentWrong: number) =>
    api.post(`/api/admin/test/users/${userId}/mock-history?percentSeen=${percentSeen}&percentWrong=${percentWrong}`),
  previewQuestions: (userId: string, count: number) =>
    api.get<PreviewData>(`/api/admin/test/users/${userId}/preview-questions?count=${count}`).then(r => r.data),
  refillEnergy: (userId: string) =>
    api.post(`/api/admin/test/users/${userId}/refill-energy`),
  setStreak: (userId: string, days: number) =>
    api.post(`/api/admin/test/users/${userId}/set-streak?days=${days}`),
  fullReset: (userId: string) =>
    api.post(`/api/admin/test/users/${userId}/full-reset`),
}

export default function TestPanel() {
  const { t } = useTranslation()
  const [userId, setUserId] = useState('')
  const [status, setStatus] = useState('')
  const [preview, setPreview] = useState<PreviewData | null>(null)

  if (import.meta.env.PROD) return <Navigate to="/" />

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setStatus(`${label}...`)
    try {
      const res = await fn()
      setStatus(`✅ ${label} — ${JSON.stringify((res as any)?.data ?? res)}`)
    } catch (e: any) {
      setStatus(`❌ ${label} — ${e.response?.data?.error ?? e.message}`)
    }
  }

  const btnClass = 'px-4 py-3 rounded-lg text-sm font-bold transition-all active:scale-95'

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Warning banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <h1 className="text-xl font-display font-bold text-bq-amberd flex items-center gap-2">
          <span className="material-symbols-outlined">science</span>
          Test Panel — DEV ONLY
        </h1>
        <p className="text-sm text-bq-ink2 mt-1">
          Panel này chỉ enable trong dev/staging. Production sẽ không có.
        </p>
      </div>

      {/* User selector */}
      <div className="bg-bq-white border border-bq-hair shadow-bq-soft rounded-xl p-5 flex items-center gap-3">
        <label className="text-sm text-bq-ink2 font-medium">User ID:</label>
        <input
          type="text"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          placeholder="Paste user UUID"
          className="flex-1 bg-bq-white border border-bq-hair px-3 py-2 rounded-lg text-bq-ink text-sm placeholder:text-bq-ink3 focus:ring-1 focus:ring-bq-sapphire outline-none"
        />
      </div>

      {/* Status */}
      {status && (
        <div className="bg-bq-inset rounded-lg px-4 py-2 text-xs text-bq-ink2 font-mono break-all">
          {status}
        </div>
      )}

      {/* Section 1: Tier */}
      <section className="bg-bq-white border border-bq-hair shadow-bq-soft rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-bold text-bq-ink flex items-center gap-2">
          <span className="material-symbols-outlined text-bq-amberd">emoji_events</span>
          Test Tier Progression
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(tier => (
            <button key={tier} onClick={() => run(`Set Tier ${tier}`, () => testApi.setTier(userId, tier))}
              className={`${btnClass} bg-amber-500/10 text-bq-amberd border border-amber-500/20 hover:bg-amber-500/20`}>
              Tier {tier}
            </button>
          ))}
        </div>
      </section>

      {/* Section 2: Smart Selection */}
      <section className="bg-bq-white border border-bq-hair shadow-bq-soft rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-bold text-bq-ink flex items-center gap-2">
          <span className="material-symbols-outlined text-bq-sapphire">psychology</span>
          Test Smart Question Selection
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => run('Reset History', () => testApi.resetHistory(userId))}
            className={`${btnClass} bg-sapphire/10 text-bq-sapphire border border-sapphire/20 hover:bg-sapphire/20`}>
            Reset History
          </button>
          <button onClick={() => run('Mock 50% seen', () => testApi.mockHistory(userId, 50, 20))}
            className={`${btnClass} bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/20`}>
            Mock 50% seen, 20% wrong
          </button>
        </div>
        <button
          onClick={async () => {
            setStatus('Previewing...')
            try {
              const data = await testApi.previewQuestions(userId, 10)
              setPreview(data)
              setStatus(`✅ Preview: ${data.totalSelected} questions`)
            } catch (e: any) {
              setStatus(`❌ Preview failed: ${e.message}`)
            }
          }}
          className={`${btnClass} w-full bg-bq-inset text-bq-ink border border-bq-hair hover:bg-bq-hair/40`}>
          Preview 10 Questions
        </button>

        {preview && (
          <div className="bg-bq-inset rounded-lg p-4 space-y-3 text-sm">
            <div className="flex gap-4">
              <span className="text-bq-ink2">Pool:</span>
              <span className="text-emerald-700">NEW {preview.poolBreakdown.NEW ?? 0}</span>
              <span className="text-bq-amberd">REVIEW {preview.poolBreakdown.REVIEW ?? 0}</span>
              <span className="text-bq-ink2">OLD {preview.poolBreakdown.OLD ?? 0}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-bq-ink2">Difficulty:</span>
              <span className="text-emerald-700">easy {preview.difficultyBreakdown.easy ?? 0}</span>
              <span className="text-bq-amberd">medium {preview.difficultyBreakdown.medium ?? 0}</span>
              <span className="text-bq-ruby">hard {preview.difficultyBreakdown.hard ?? 0}</span>
            </div>
            <ul className="text-xs text-bq-ink2 space-y-1 max-h-40 overflow-y-auto">
              {preview.questions.map(q => (
                <li key={q.id} className="flex gap-2">
                  <span className={q.difficulty === 'hard' ? 'text-bq-ruby' : q.difficulty === 'medium' ? 'text-bq-amberd' : 'text-emerald-700'}>
                    [{q.difficulty}]
                  </span>
                  <span>{q.book}</span>
                  <span className="text-bq-ink3 truncate">{q.content}</span>
                  {q.previouslySeen && <span className="text-bq-amberd">(seen)</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Section 3: Utilities */}
      <section className="bg-bq-white border border-bq-hair shadow-bq-soft rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-bold text-bq-ink flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-700">build</span>
          Utilities
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => run('Refill Energy', () => testApi.refillEnergy(userId))}
            className={`${btnClass} bg-amber-500/10 text-bq-amberd border border-amber-500/20`}>
            Refill Energy
          </button>
          <button onClick={() => run('Set Streak 30', () => testApi.setStreak(userId, 30))}
            className={`${btnClass} bg-emerald-500/10 text-emerald-700 border border-emerald-500/20`}>
            Set Streak 30
          </button>
          <button onClick={() => run('Set Streak 100', () => testApi.setStreak(userId, 100))}
            className={`${btnClass} bg-emerald-500/10 text-emerald-700 border border-emerald-500/20`}>
            Set Streak 100
          </button>
          <button onClick={() => run('Full Reset', () => testApi.fullReset(userId))}
            className={`${btnClass} bg-bq-ruby/10 text-bq-ruby border border-bq-ruby/20`}>
            Full Reset
          </button>
        </div>
      </section>
    </div>
  )
}
