import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addJourneyWeek,
  createJourney,
  getJourney,
  listJourneys,
  openNextWeek,
  removeJourneyWeek,
  startJourney,
  updateJourney,
  type GroupJourneySummary,
  type JourneyWithProgress,
} from '../api/groupJourney'
import { queryKeys } from '../api/queryKeys'

/**
 * BL-25 — Hành Trình Nhóm hooks. Reads aggregate live progress from the BE
 * (derived from ScheduledQuizAttempt). Mutations invalidate both the list and
 * the affected journey detail so the hero + builder stay in sync.
 */

export function useGroupJourneys(groupId: string) {
  return useQuery<GroupJourneySummary[]>({
    queryKey: queryKeys.groupJourney.list(groupId),
    queryFn: () => listJourneys(groupId),
    enabled: !!groupId,
    staleTime: 30_000,
  })
}

export function useGroupJourney(groupId: string, journeyId: string) {
  return useQuery<JourneyWithProgress>({
    queryKey: queryKeys.groupJourney.detail(groupId, journeyId),
    queryFn: () => getJourney(groupId, journeyId),
    enabled: !!groupId && !!journeyId,
    staleTime: 15_000,
  })
}

export function useCreateJourney(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title: string; description?: string }) =>
      createJourney(groupId, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.groupJourney.list(groupId) }),
  })
}

export function useUpdateJourney(groupId: string, journeyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title?: string; description?: string }) =>
      updateJourney(groupId, journeyId, body),
    onSuccess: () => invalidateJourney(qc, groupId, journeyId),
  })
}

export function useAddJourneyWeek(groupId: string, journeyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title?: string; quizSetId: string }) =>
      addJourneyWeek(groupId, journeyId, body),
    onSuccess: () => invalidateJourney(qc, groupId, journeyId),
  })
}

export function useRemoveJourneyWeek(groupId: string, journeyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (weekId: string) => removeJourneyWeek(groupId, journeyId, weekId),
    onSuccess: () => invalidateJourney(qc, groupId, journeyId),
  })
}

export function useStartJourney(groupId: string, journeyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => startJourney(groupId, journeyId),
    onSuccess: () => invalidateJourney(qc, groupId, journeyId),
  })
}

export function useOpenNextWeek(groupId: string, journeyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (deadline: string) => openNextWeek(groupId, journeyId, deadline),
    onSuccess: () => invalidateJourney(qc, groupId, journeyId),
  })
}

function invalidateJourney(
  qc: ReturnType<typeof useQueryClient>,
  groupId: string,
  journeyId: string
) {
  qc.invalidateQueries({ queryKey: queryKeys.groupJourney.list(groupId) })
  qc.invalidateQueries({ queryKey: queryKeys.groupJourney.detail(groupId, journeyId) })
}
