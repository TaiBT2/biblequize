/**
 * REST helpers for multiplayer e2e tests — user provisioning + room lifecycle.
 *
 * `createRoom` returns the inner `room` object: POST /api/rooms responds with
 * `{ success, room, viewerUserId }` (RoomController.java:113).
 */

const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080'
const PASSWORD = 'Test@123456'

export interface TestUser {
  email: string
  token: string
}

export interface RoomDetails {
  id: string
  roomCode: string
  mode: string
  status: string
  maxPlayers: number
  players: Array<{ userId: string; username?: string; isReady: boolean; playerStatus?: string }>
}

async function postJson(path: string, body: unknown, token?: string): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

/** Register the user; if it already exists, fall back to login. */
async function registerOrLogin(name: string, email: string): Promise<string> {
  const reg = await postJson('/api/auth/register', { name, email, password: PASSWORD })
  if (reg.ok) return (await reg.json()).accessToken

  const login = await postJson('/api/auth/mobile/login', { email, password: PASSWORD })
  if (!login.ok) {
    throw new Error(`Auth failed for ${email}: register=${reg.status} login=${login.status}`)
  }
  return (await login.json()).accessToken
}

/**
 * Provision `count` deterministic test accounts (`{prefix}{n}@dev.local`).
 * Reused across runs — registered once, logged in thereafter.
 */
export async function provisionUsers(prefix: string, count: number): Promise<TestUser[]> {
  const tasks = Array.from({ length: count }, async (_unused, i) => {
    const email = `${prefix}${i + 1}@dev.local`
    const token = await registerOrLogin(`${prefix}${i + 1}`, email)
    return { email, token }
  })
  return Promise.all(tasks)
}

export async function createRoom(
  token: string,
  body: Record<string, unknown>,
): Promise<RoomDetails> {
  const res = await postJson('/api/rooms', body, token)
  if (!res.ok) throw new Error(`createRoom failed: ${res.status}`)
  return (await res.json()).room as RoomDetails
}

export async function joinRoom(token: string, roomCode: string): Promise<Response> {
  return postJson('/api/rooms/join', { roomCode }, token)
}

export async function startRoom(token: string, roomId: string): Promise<Response> {
  return postJson(`/api/rooms/${roomId}/start`, {}, token)
}

export async function getRoom(token: string, roomId: string): Promise<RoomDetails> {
  const res = await fetch(`${API_URL}/api/rooms/${roomId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`getRoom failed: ${res.status}`)
  // GET /api/rooms/{id} responds with { success, viewerUserId, room }.
  return (await res.json()).room as RoomDetails
}

export async function getLeaderboard(token: string, roomId: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/api/rooms/${roomId}/leaderboard`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`getLeaderboard failed: ${res.status}`)
  // Responds with { leaderboard: [...], success }.
  return (await res.json()).leaderboard ?? []
}

// ── Extended helpers (MPL/MPM audit 2026-05-23) ─────────────────────────────

export interface QuickMatchBody {
  mode: 'SPEED_RACE' | 'BATTLE_ROYALE' | 'TEAM_VS_TEAM' | 'SUDDEN_DEATH'
  bookScope?: string
  questionCount?: number
  timePerQuestion?: number
  source?: 'DATABASE' | 'AI_GENERATED'
  language?: 'vi' | 'en'
  chapterFrom?: number; chapterTo?: number
  verseFrom?: number; verseTo?: number
}

/** POST /api/rooms/quick-match — soft-host Đấu Nhanh room. Returns full response (success/error wrapper). */
export async function createQuickMatch(token: string, body: QuickMatchBody): Promise<Response> {
  return postJson('/api/rooms/quick-match', { source: 'DATABASE', bookScope: 'ALL', ...body }, token)
}

/** POST /api/rooms/{id}/leave — voluntary leave. Mid-game → LEFT; LOBBY → row deleted. */
export async function leaveRoom(token: string, roomId: string): Promise<Response> {
  return postJson(`/api/rooms/${roomId}/leave`, {}, token)
}

/** POST /api/rooms/{id}/kick — host-only, LOBBY only. Body: { userId }. */
export async function kickPlayer(token: string, roomId: string, userId: string): Promise<Response> {
  return postJson(`/api/rooms/${roomId}/kick`, { userId }, token)
}

/** POST /api/rooms/{id}/switch-team — TEAM_VS_TEAM LOBBY only. Body: { team: 'A'|'B' }. */
export async function switchTeam(token: string, roomId: string, team: 'A' | 'B'): Promise<Response> {
  return postJson(`/api/rooms/${roomId}/switch-team`, { team }, token)
}

/** DELETE /api/rooms/{id} — host-only cleanup helper. */
export async function deleteRoom(token: string, roomId: string): Promise<Response> {
  return fetch(`${API_URL}/api/rooms/${roomId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

// ── Quản trò Sprint 4 controls (host-only when hostPlaysGame=false) ────────

export const hostPause     = (t: string, r: string) => postJson(`/api/rooms/${r}/host/pause`, {}, t)
export const hostResume    = (t: string, r: string) => postJson(`/api/rooms/${r}/host/resume`, {}, t)
export const hostSkip      = (t: string, r: string) => postJson(`/api/rooms/${r}/host/skip-question`, {}, t)
export const hostBroadcast = (t: string, r: string, message: string) =>
  postJson(`/api/rooms/${r}/host/broadcast`, { message }, t)
export const hostEndEarly  = (t: string, r: string) => postJson(`/api/rooms/${r}/host/end-early`, {}, t)

/** GET /api/rooms/{id}/current-question — rehydrate after reconnect. 204 if none. */
export async function getCurrentQuestion(token: string, roomId: string): Promise<Response> {
  return fetch(`${API_URL}/api/rooms/${roomId}/current-question`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
