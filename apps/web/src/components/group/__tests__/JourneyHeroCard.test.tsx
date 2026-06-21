import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'vi' } }),
}))

const navigateMock = vi.fn()
vi.mock('react-router-dom', async (orig) => {
  const actual = await (orig() as Promise<typeof import('react-router-dom')>)
  return { ...actual, useNavigate: () => navigateMock }
})

let listResult: any = { data: undefined, isLoading: false }
let detailResult: any = { data: undefined }
vi.mock('../../../hooks/useGroupJourney', () => ({
  useGroupJourneys: () => listResult,
  useGroupJourney: () => detailResult,
}))

import JourneyHeroCard from '../JourneyHeroCard'

const render_ = (isLeaderOrMod: boolean) =>
  render(<MemoryRouter><JourneyHeroCard groupId="g-1" isLeaderOrMod={isLeaderOrMod} /></MemoryRouter>)

beforeEach(() => {
  vi.clearAllMocks()
  listResult = { data: [], isLoading: false }
  detailResult = { data: undefined }
})

describe('JourneyHeroCard', () => {
  it('no journey + leader → shows the create CTA and navigates to /journey/new', () => {
    render_(true)
    const cta = screen.getByTestId('journey-hero-create')
    fireEvent.click(cta)
    expect(navigateMock).toHaveBeenCalledWith('/groups/g-1/journey/new')
  })

  it('no journey + member → renders nothing', () => {
    const { container } = render_(false)
    expect(container).toBeEmptyDOMElement()
  })

  it('active journey → shows the hero with stage k/N and opens the view', () => {
    listResult = { data: [{ id: 'j-1', title: 'Hành trình Sáng Thế', status: 'ACTIVE', weekCount: 3 }], isLoading: false }
    detailResult = { data: { weeksOpened: 2, weeksTotal: 3 } }
    render_(false)
    expect(screen.getByTestId('journey-hero-stage')).toHaveTextContent('2/3')
    fireEvent.click(screen.getByTestId('journey-hero'))
    expect(navigateMock).toHaveBeenCalledWith('/groups/g-1/journey/j-1')
  })

  it('draft journey + leader → shows draft chip and opens the builder', () => {
    listResult = { data: [{ id: 'j-9', title: 'Bản nháp', status: 'DRAFT', weekCount: 1 }], isLoading: false }
    render_(true)
    expect(screen.getByTestId('journey-hero-draft-chip')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('journey-hero'))
    expect(navigateMock).toHaveBeenCalledWith('/groups/g-1/journey/j-9/edit')
  })

  it('member never sees a DRAFT-only journey', () => {
    listResult = { data: [{ id: 'j-9', title: 'Bản nháp', status: 'DRAFT', weekCount: 1 }], isLoading: false }
    const { container } = render_(false)
    expect(container).toBeEmptyDOMElement()
  })
})
