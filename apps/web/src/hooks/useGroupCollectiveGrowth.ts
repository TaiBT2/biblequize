import { useQuery } from '@tanstack/react-query'
import { getCollectiveGrowth, type CollectiveGrowth } from '../api/groups'
import { queryKeys } from '../api/queryKeys'

/**
 * BL-23 — group collective-growth ("Cùng nhau thuộc Lời"). Anti-leaderboard,
 * Q-A SAFE. Member-visible; BE returns 400 for non-members so the card just
 * shows its error/empty state. staleTime 60s — slow-moving aggregate.
 */
export function useGroupCollectiveGrowth(groupId: string) {
  return useQuery<CollectiveGrowth>({
    queryKey: queryKeys.groups.collectiveGrowth(groupId),
    queryFn: () => getCollectiveGrowth(groupId),
    enabled: !!groupId,
    staleTime: 60_000,
  })
}
