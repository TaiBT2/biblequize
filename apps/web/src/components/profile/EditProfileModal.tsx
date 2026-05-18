import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { UserProfile } from './types'

const NAME_MAX = 50

export function EditProfileModal({ open, onClose, profile }: {
  open: boolean
  onClose: () => void
  profile: UserProfile
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState(profile.name)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (updates: { name: string; avatarUrl: string }) =>
      api.patch('/api/me', updates).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      onClose()
    },
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length === 0) { setFieldError(t('profile.editErrorEmpty')); return }
    if (trimmed.length > NAME_MAX) { setFieldError(t('profile.editErrorTooLong', { max: NAME_MAX })); return }
    setFieldError(null)
    mutation.mutate({ name: trimmed, avatarUrl: avatarUrl.trim() })
  }

  const submitError = mutation.isError
    ? ((mutation.error as any)?.response?.data?.message ?? t('profile.editErrorGeneric'))
    : null

  return (
    <div data-testid="edit-profile-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={handleSubmit} className="glass-card max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-bold text-on-surface">{t('profile.editModalTitle')}</h2>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {t('profile.editFieldName')}
          </span>
          <input
            data-testid="edit-profile-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX + 10}
            className="mt-1 w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-on-surface text-sm focus:border-secondary outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {t('profile.editFieldAvatarUrl')}
          </span>
          <input
            data-testid="edit-profile-avatar-input"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-on-surface text-sm focus:border-secondary outline-none"
          />
          <span className="text-[10px] text-on-surface-variant mt-1 block">{t('profile.editAvatarUrlHint')}</span>
        </label>

        <div className="text-[11px] text-on-surface-variant">
          <span className="font-semibold">{t('profile.editEmailReadOnly')}:</span> {profile.email}
        </div>

        {(fieldError || submitError) && (
          <p data-testid="edit-profile-error" className="text-sm text-error">{fieldError ?? submitError}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg border border-outline-variant/20 text-on-surface-variant text-sm hover:bg-surface-container-high disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            data-testid="edit-profile-submit"
            disabled={mutation.isPending}
            className="flex-1 gold-gradient text-on-secondary rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
          >
            {mutation.isPending ? t('profile.editSaving') : t('profile.editSubmit')}
          </button>
        </div>
      </form>
    </div>
  )
}
