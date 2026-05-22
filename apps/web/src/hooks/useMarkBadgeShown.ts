import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

/**
 * Marks a season badge as shown (§7.1.8) after the BadgeAwardModal closes.
 * Invalidates coverage-status so the cleared {@code unshownBadge} field is
 * re-fetched and the modal does not re-trigger.
 */
export function useMarkBadgeShown() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (badgeId: string) => {
      await api.post(`/api/me/badges/${badgeId}/mark-shown`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-coverage-status'] })
    },
  })
}
