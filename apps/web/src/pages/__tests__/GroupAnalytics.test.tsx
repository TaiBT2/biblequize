import { describe, it, expect, vi } from 'vitest'

/**
 * Phase C.9 — GroupAnalytics unit tests.
 * Component requires route params + API. Module structure tests.
 */

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ id: 'g1' }) }
})

vi.mock('../../store/authStore', () => ({
  useAuthStore: (s?: (st: any) => any) => s ? s({ isAuthenticated: true, user: { name: 'T', email: 'a@b.com' } }) : { isAuthenticated: true },
  useAuth: () => ({ isAuthenticated: true, user: { name: 'T', email: 'a@b.com' } }),
}))

vi.mock('../../api/client', () => ({
  api: { get: vi.fn().mockResolvedValue({ data: {} }) },
}))

describe('GroupAnalytics', () => {
  it('module exports default component', async () => {
    const mod = await import('../GroupAnalytics')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('component has a name', async () => {
    const mod = await import('../GroupAnalytics')
    expect(mod.default.name).toBeTruthy()
  })
})
