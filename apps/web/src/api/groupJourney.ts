import { api } from './client'

// BL-25 — Group Journey. Mirrors GroupJourneyController response shapes.
// A journey = the whole group walking through one book/topic across N weeks;
// each week's checkpoint is a ScheduledQuiz and progress is aggregated
// server-side from ScheduledQuizAttempt.

export type JourneyStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED'
export type WeekStatus = 'LOCKED' | 'OPEN' | 'ENDED'

export interface GroupJourneySummary {
  id: string
  groupId: string
  title: string
  description?: string
  status: JourneyStatus
  weekCount: number
  createdBy: string
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export interface JourneyWeek {
  id: string
  weekNumber: number
  title: string
  quizSetId: string
  scheduledQuizId?: string | null
  status: WeekStatus
  deadline?: string
  /** Live status of the underlying scheduled quiz (ACTIVE/ENDED/CANCELLED). */
  scheduledStatus?: string
  /** Distinct members who have at least one attempt for this week. */
  doneCount?: number
  /** Whether the viewer has done this week. */
  viewerDone?: boolean
  /** Leader/mod only — roster who has NOT done this open week. */
  notDone?: Array<{ userId: string; name: string }>
}

export interface JourneyWithProgress extends GroupJourneySummary {
  totalMembers: number
  weeksTotal: number
  weeksOpened: number
  viewerDoneCount: number
  viewerIsLeader: boolean
  weeks: JourneyWeek[]
}

const base = (groupId: string) => `/api/groups/${groupId}/journeys`

export async function listJourneys(groupId: string): Promise<GroupJourneySummary[]> {
  const res = await api.get(base(groupId))
  return res.data.journeys
}

export async function getJourney(
  groupId: string,
  journeyId: string
): Promise<JourneyWithProgress> {
  const res = await api.get(`${base(groupId)}/${journeyId}`)
  return res.data.journey
}

export async function createJourney(
  groupId: string,
  body: { title: string; description?: string }
): Promise<GroupJourneySummary> {
  const res = await api.post(base(groupId), body)
  return res.data.journey
}

export async function updateJourney(
  groupId: string,
  journeyId: string,
  body: { title?: string; description?: string }
): Promise<GroupJourneySummary> {
  const res = await api.patch(`${base(groupId)}/${journeyId}`, body)
  return res.data.journey
}

export async function addJourneyWeek(
  groupId: string,
  journeyId: string,
  body: { title?: string; quizSetId: string }
): Promise<JourneyWeek> {
  const res = await api.post(`${base(groupId)}/${journeyId}/weeks`, body)
  return res.data.week
}

export async function removeJourneyWeek(
  groupId: string,
  journeyId: string,
  weekId: string
): Promise<void> {
  await api.delete(`${base(groupId)}/${journeyId}/weeks/${weekId}`)
}

export async function startJourney(
  groupId: string,
  journeyId: string
): Promise<GroupJourneySummary> {
  const res = await api.post(`${base(groupId)}/${journeyId}/start`)
  return res.data.journey
}

export async function openNextWeek(
  groupId: string,
  journeyId: string,
  deadline: string // ISO local date-time
): Promise<JourneyWeek> {
  const res = await api.post(`${base(groupId)}/${journeyId}/open-next`, { deadline })
  return res.data.week
}
