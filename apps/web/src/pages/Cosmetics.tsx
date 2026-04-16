import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

interface CosmeticItem {
  id: string
  name: string
  tier: number
  unlocked: boolean
  active: boolean
}

interface CosmeticsData {
  activeFrame: string
  activeTheme: string
  frames: CosmeticItem[]
  themes: CosmeticItem[]
}

const TIER_ICONS = ['🌱', '🌿', '📜', '🪔', '🔥', '👑']

const FRAME_COLORS: Record<string, string> = {
  frame_tier1: 'border-gray-400',
  frame_tier2: 'border-sky-400',
  frame_tier3: 'border-blue-500',
  frame_tier4: 'border-purple-500',
  frame_tier5: 'border-yellow-400',
  frame_tier6: 'border-red-400',
}

export default function Cosmetics() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<CosmeticsData>({
    queryKey: ['cosmetics'],
    queryFn: () => api.get('/api/me/cosmetics').then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (body: { activeFrame?: string; activeTheme?: string }) =>
      api.patch('/api/me/cosmetics', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cosmetics'] }),
  })

  if (isLoading || !data) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-surface-container rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-surface-container rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div data-testid="cosmetics-page" className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/profile" className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-on-surface">Ngoại hình</h1>
          <p className="text-sm text-on-surface-variant">Khung avatar & giao diện quiz</p>
        </div>
      </div>

      {/* Avatar Frames */}
      <section data-testid="cosmetics-frames-section">
        <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
            frame_person
          </span>
          Khung Avatar
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {data.frames.map((frame) => (
            <button
              key={frame.id}
              onClick={() => frame.unlocked && mutation.mutate({ activeFrame: frame.id })}
              disabled={!frame.unlocked}
              className={`relative rounded-xl p-4 border-2 transition-all text-center ${
                frame.active
                  ? `${FRAME_COLORS[frame.id] ?? 'border-secondary'} bg-secondary/10`
                  : frame.unlocked
                    ? 'border-outline-variant/20 bg-surface-container hover:border-secondary/50'
                    : 'border-outline-variant/10 bg-surface-container opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Tier icon as frame preview */}
              <div className={`w-16 h-16 mx-auto rounded-full border-4 flex items-center justify-center mb-3 ${
                FRAME_COLORS[frame.id] ?? 'border-gray-400'
              } ${frame.unlocked ? '' : 'grayscale'}`}>
                <span className="text-2xl">{TIER_ICONS[frame.tier - 1]}</span>
              </div>
              <p className="text-xs font-bold text-on-surface">{frame.name}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                {frame.unlocked ? (frame.active ? '✓ Đang dùng' : 'Đã mở') : `Đạt T${frame.tier} để mở`}
              </p>
              {!frame.unlocked && (
                <span className="material-symbols-outlined absolute top-2 right-2 text-sm text-on-surface-variant">
                  lock
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Quiz Themes */}
      <section data-testid="cosmetics-themes-section">
        <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
            palette
          </span>
          Giao diện Quiz
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {data.themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => theme.unlocked && mutation.mutate({ activeTheme: theme.id })}
              disabled={!theme.unlocked}
              className={`rounded-xl p-4 border-2 transition-all text-center ${
                theme.active
                  ? 'border-secondary bg-secondary/10'
                  : theme.unlocked
                    ? 'border-outline-variant/20 bg-surface-container hover:border-secondary/50'
                    : 'border-outline-variant/10 bg-surface-container opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="text-2xl mb-2">{TIER_ICONS[theme.tier - 1]}</div>
              <p className="text-xs font-bold text-on-surface">{theme.name}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                {theme.unlocked ? (theme.active ? '✓ Đang dùng' : 'Đã mở') : `Đạt T${theme.tier} để mở`}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
