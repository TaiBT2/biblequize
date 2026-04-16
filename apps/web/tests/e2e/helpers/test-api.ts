/**
 * TestApi — typed wrapper for AdminTestController + auth endpoints.
 *
 * Uses native fetch() (no dependencies). All admin endpoints require an
 * admin bearer token which is obtained once via init() and cached.
 *
 * Test users: test1@dev.local .. test6@dev.local (password: Test@123456)
 * Admin user: admin@biblequiz.test (password: Admin@123456)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  name: string
  email: string
  avatar?: string
  role: string
}

export interface SetStatePayload {
  livesRemaining?: number
  questionsCounted?: number
  daysAtTier6?: number
  lastPlayedAt?: string // ISO date e.g. "2025-01-15"
  xpSurgeHoursFromNow?: number
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: string
  currentStreak: number
  longestStreak: number
  totalPoints: number
  [key: string]: unknown
}

export interface RankedStatus {
  livesRemaining: number
  questionsCounted: number
  pointsToday: number
  tierLevel: number
  tierName: string
  [key: string]: unknown
}

export interface DailyMission {
  missionType: string
  progress: number
  target: number
  completed: boolean
  bonusClaimed: boolean
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// TestApi class
// ---------------------------------------------------------------------------

export class TestApi {
  private readonly baseUrl: string
  private adminToken: string | null = null
  private readonly tokenCache = new Map<string, string>() // email -> accessToken
  private readonly userIdCache = new Map<string, string>() // email -> userId

  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────

  /** Login as admin and cache the token. Must be called before any admin endpoint. */
  async init(): Promise<void> {
    const res = await this.loginAs('admin@biblequiz.test', 'Admin@123456')
    this.adminToken = res.accessToken
  }

  // ── Auth helpers ───────────────────────────────────────────────────────

  /** Login via the mobile auth endpoint (returns tokens in JSON body). */
  async loginAs(
    email: string,
    password: string,
  ): Promise<LoginResponse> {
    const res = await fetch(`${this.baseUrl}/api/auth/mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      throw new Error(
        `loginAs(${email}) failed: ${res.status} ${await res.text()}`,
      )
    }
    const data = (await res.json()) as LoginResponse
    this.tokenCache.set(email, data.accessToken)
    return data
  }

  // ── User ID resolution ─────────────────────────────────────────────────

  /** Resolve email -> userId via /api/me. Caches the result. */
  async getUserIdByEmail(email: string): Promise<string> {
    const cached = this.userIdCache.get(email)
    if (cached) return cached

    const profile = await this.getMe(email)
    this.userIdCache.set(email, profile.id)
    return profile.id
  }

  // ── Admin test endpoints ───────────────────────────────────────────────

  /** Partial-update user state (energy, questions counted, etc.). */
  async setState(email: string, state: SetStatePayload): Promise<void> {
    const userId = await this.getUserIdByEmail(email)
    const res = await this.adminFetch(
      `/api/admin/test/users/${userId}/set-state`,
      { method: 'POST', body: JSON.stringify(state) },
    )
    if (!res.ok) {
      throw new Error(
        `setState(${email}) failed: ${res.status} ${await res.text()}`,
      )
    }
  }

  /** Set user to exact tier level (1-6). */
  async setTier(email: string, tierLevel: number): Promise<void> {
    const userId = await this.getUserIdByEmail(email)
    const res = await this.adminFetch(
      `/api/admin/test/users/${userId}/set-tier?tierLevel=${tierLevel}`,
      { method: 'POST' },
    )
    if (!res.ok) {
      throw new Error(
        `setTier(${email}, ${tierLevel}) failed: ${res.status} ${await res.text()}`,
      )
    }
  }

  /** Delete all question history for user. */
  async resetHistory(email: string): Promise<void> {
    const userId = await this.getUserIdByEmail(email)
    const res = await this.adminFetch(
      `/api/admin/test/users/${userId}/reset-history`,
      { method: 'POST' },
    )
    if (!res.ok) {
      throw new Error(
        `resetHistory(${email}) failed: ${res.status} ${await res.text()}`,
      )
    }
  }

  /** Refill energy to 100 for today. */
  async refillEnergy(email: string): Promise<void> {
    const userId = await this.getUserIdByEmail(email)
    const res = await this.adminFetch(
      `/api/admin/test/users/${userId}/refill-energy`,
      { method: 'POST' },
    )
    if (!res.ok) {
      throw new Error(
        `refillEnergy(${email}) failed: ${res.status} ${await res.text()}`,
      )
    }
  }

  /** Full reset: streak, history, daily progress. */
  async fullReset(email: string): Promise<void> {
    const userId = await this.getUserIdByEmail(email)
    const res = await this.adminFetch(
      `/api/admin/test/users/${userId}/full-reset`,
      { method: 'POST' },
    )
    if (!res.ok) {
      throw new Error(
        `fullReset(${email}) failed: ${res.status} ${await res.text()}`,
      )
    }
  }

  // ── User-scoped API reads ──────────────────────────────────────────────

  /** Login as user (if needed) then GET /api/me. */
  async getMe(email: string): Promise<UserProfile> {
    const token = await this.ensureUserToken(email)
    const res = await fetch(`${this.baseUrl}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      throw new Error(
        `getMe(${email}) failed: ${res.status} ${await res.text()}`,
      )
    }
    return (await res.json()) as UserProfile
  }

  /** Login as user (if needed) then GET /api/me/ranked-status. */
  async getRankedStatus(email: string): Promise<RankedStatus> {
    const token = await this.ensureUserToken(email)
    const res = await fetch(`${this.baseUrl}/api/me/ranked-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      throw new Error(
        `getRankedStatus(${email}) failed: ${res.status} ${await res.text()}`,
      )
    }
    return (await res.json()) as RankedStatus
  }

  /** Login as user (if needed) then GET /api/me/daily-missions. */
  async getMissions(email: string): Promise<DailyMission[]> {
    const token = await this.ensureUserToken(email)
    const res = await fetch(`${this.baseUrl}/api/me/daily-missions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      throw new Error(
        `getMissions(${email}) failed: ${res.status} ${await res.text()}`,
      )
    }
    return (await res.json()) as DailyMission[]
  }

  // ── Private helpers ────────────────────────────────────────────────────

  /** Ensure we have a cached access token for the given email. */
  private async ensureUserToken(email: string): Promise<string> {
    const cached = this.tokenCache.get(email)
    if (cached) return cached

    const password = email === 'admin@biblequiz.test'
      ? 'Admin@123456'
      : 'Test@123456'
    const loginRes = await this.loginAs(email, password)
    return loginRes.accessToken
  }

  /** Fetch with admin Authorization header. */
  private async adminFetch(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    if (!this.adminToken) {
      throw new Error('TestApi not initialized — call init() first')
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.adminToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    }
    return fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string>) },
    })
  }
}
