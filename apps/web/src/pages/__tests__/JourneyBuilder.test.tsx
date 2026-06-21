import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── mocks ────────────────────────────────────────────────────────────────────

const mockApiGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: { get: (...args: any[]) => mockApiGet(...args) },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'vi' } }),
}))

const navigateMock = vi.fn()
let routeParams: Record<string, string> = {}
vi.mock('react-router-dom', async (orig) => {
  const actual = await (orig() as Promise<typeof import('react-router-dom')>)
  return { ...actual, useNavigate: () => navigateMock, useParams: () => routeParams }
})

const createMutate = vi.fn()
const addWeekMutate = vi.fn()
const removeWeekMutate = vi.fn()
const startMutate = vi.fn()
let journeyData: any = null
let journeyState = { isLoading: false, isError: false }

vi.mock('../../hooks/useGroupJourney', () => ({
  useGroupJourney: () => ({ data: journeyData, ...journeyState }),
  useCreateJourney: () => ({ mutateAsync: createMutate, isPending: false }),
  useAddJourneyWeek: () => ({ mutateAsync: addWeekMutate, isPending: false }),
  useRemoveJourneyWeek: () => ({ mutate: removeWeekMutate, isPending: false }),
  useStartJourney: () => ({ mutateAsync: startMutate, isPending: false }),
}))

import JourneyBuilder from '../JourneyBuilder'

function renderBuilder() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><JourneyBuilder /></MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  routeParams = {}
  journeyData = null
  journeyState = { isLoading: false, isError: false }
  mockApiGet.mockResolvedValue({ data: { quizSets: [{ id: 'qs-1', name: 'Sáng Thế', questionIds: ['a', 'b'] }] } })
})

// ── create mode ──────────────────────────────────────────────────────────────

describe('JourneyBuilder — create mode', () => {
  it('creates a journey then navigates to the edit step', async () => {
    routeParams = { id: 'g-1' }
    createMutate.mockResolvedValue({ id: 'j-1' })
    renderBuilder()

    expect(screen.getByTestId('journey-builder-create')).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('journey-title-input'), { target: { value: 'Hành trình Sáng Thế' } })
    await act(async () => { fireEvent.click(screen.getByTestId('journey-create-submit')) })

    await waitFor(() =>
      expect(createMutate).toHaveBeenCalledWith({ title: 'Hành trình Sáng Thế', description: undefined }))
    expect(navigateMock).toHaveBeenCalledWith('/groups/g-1/journey/j-1/edit', { replace: true })
  })
})

// ── build-weeks mode ─────────────────────────────────────────────────────────

describe('JourneyBuilder — build-weeks mode', () => {
  beforeEach(() => {
    routeParams = { id: 'g-1', journeyId: 'j-1' }
    journeyData = {
      id: 'j-1', title: 'Hành trình Sáng Thế', status: 'DRAFT',
      weeks: [{ id: 'w-1', weekNumber: 1, title: 'Chương 1-3', quizSetId: 'qs-1', status: 'LOCKED' }],
    }
  })

  it('lists existing weeks and adds a new one', async () => {
    addWeekMutate.mockResolvedValue({ id: 'w-2' })
    renderBuilder()

    expect(screen.getByTestId('journey-builder-weeks')).toBeInTheDocument()
    expect(screen.getAllByTestId('journey-week-row')).toHaveLength(1)

    // Wait for the async quiz-set option to render before selecting it.
    await waitFor(() => expect(screen.getByRole('option', { name: /Sáng Thế/ })).toBeInTheDocument())
    fireEvent.change(screen.getByTestId('journey-week-quizset-select'), { target: { value: 'qs-1' } })
    await act(async () => { fireEvent.click(screen.getByTestId('journey-add-week-submit')) })

    await waitFor(() =>
      expect(addWeekMutate).toHaveBeenCalledWith({ title: undefined, quizSetId: 'qs-1' }))
  })

  it('starts the journey and navigates to the view', async () => {
    startMutate.mockResolvedValue({})
    renderBuilder()

    await act(async () => { fireEvent.click(screen.getByTestId('journey-start-submit')) })

    await waitFor(() => expect(startMutate).toHaveBeenCalled())
    expect(navigateMock).toHaveBeenCalledWith('/groups/g-1/journey/j-1', { replace: true })
  })

  it('disables start when there are no weeks', () => {
    journeyData = { ...journeyData, weeks: [] }
    renderBuilder()
    expect(screen.getByTestId('journey-start-submit')).toBeDisabled()
    expect(screen.getByTestId('journey-weeks-empty')).toBeInTheDocument()
  })

  it('redirects to the view when the journey already started', () => {
    journeyData = { ...journeyData, status: 'ACTIVE' }
    renderBuilder()
    expect(navigateMock).toHaveBeenCalledWith('/groups/g-1/journey/j-1', { replace: true })
  })
})
