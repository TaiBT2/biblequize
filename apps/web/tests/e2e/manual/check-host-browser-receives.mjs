// Browser-level test: open RoomQuizHost in real browser, players answer via
// STOMP, observe whether host DOM updates "Tình trạng trả lời" count.
//
// Run from apps/web/:
//   node tests/e2e/manual/check-host-browser-receives.mjs
//
// Distinguishes:
//   - BE bug: no ANSWER_SUBMITTED frame in host browser WS
//   - FE bug: frame arrives but handler doesn't update DOM
//   - All-OK: DOM updates correctly (then user's local issue is cache)

import { chromium } from 'playwright'
import { Client } from '@stomp/stompjs'

const API = process.env.API_BASE ?? 'https://be.forbible.org'
const WEB = process.env.WEB_BASE ?? 'https://www.forbible.org'
const WS = process.env.WS_URL ?? 'wss://be.forbible.org/ws'
const PWD = 'Test@123456'
const ts = Date.now()
const PREFIX = `diag-browser-${ts}-`

async function postJson(path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.json().catch(() => ({})) }
}

async function provision(name) {
  const email = `${PREFIX}${name}@dev.local`
  let r = await postJson('/api/auth/register', { name: `${PREFIX}${name}`, email, password: PWD })
  if (r.status >= 400) r = await postJson('/api/auth/mobile/login', { email, password: PWD })
  if (!r.body.accessToken) throw new Error(`${name}: ${JSON.stringify(r)}`)
  return { email, name: `${PREFIX}${name}`, token: r.body.accessToken, userId: r.body.user?.id ?? r.body.userId }
}

function stompClient(label, token, roomId) {
  return new Promise((resolve, reject) => {
    const events = []
    const client = new Client({
      brokerURL: WS,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0, heartbeatIncoming: 0, heartbeatOutgoing: 0,
    })
    const timer = setTimeout(() => reject(new Error(`${label} timeout`)), 15000)
    client.onConnect = () => {
      clearTimeout(timer)
      client.subscribe(`/topic/room/${roomId}`, (frame) => {
        try { events.push(JSON.parse(frame.body)) } catch {}
      })
      resolve({ client, events, send: (d, p) => client.publish({
        destination: d, body: JSON.stringify(p),
        headers: { Authorization: `Bearer ${token}` },
      }) })
    }
    client.onStompError = (f) => { clearTimeout(timer); reject(new Error(f.headers.message)) }
    client.activate()
  })
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

;(async () => {
  console.log(`\n=== Setup ===`)
  const host = await provision('host')
  const a = await provision('a')
  const b = await provision('b')
  console.log(`provisioned 3 users`)

  // Create BR room
  const create = await postJson('/api/rooms', {
    roomName: 'Diag browser host', mode: 'BATTLE_ROYALE', maxPlayers: 10,
    questionCount: 5, timePerQuestion: 30, hostPlaysGame: false,
  }, host.token)
  if (create.status !== 200) throw new Error(`createRoom: ${JSON.stringify(create)}`)
  const room = create.body.room
  console.log(`room: ${room.id} code=${room.roomCode}`)

  // Players join
  await postJson('/api/rooms/join', { roomCode: room.roomCode }, a.token)
  await postJson('/api/rooms/join', { roomCode: room.roomCode }, b.token)

  // ── Open browser as HOST and navigate to host page ───────────────────
  console.log(`\n=== Browser ===`)
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  // Capture WS frames
  const wsFrames = []
  page.on('websocket', (ws) => {
    console.log(`[browser-ws] open ${ws.url()}`)
    ws.on('framereceived', (data) => {
      try {
        const txt = typeof data === 'string' ? data : data.payload
        if (typeof txt === 'string' && txt.includes('ANSWER_SUBMITTED')) {
          wsFrames.push({ time: Date.now(), type: 'ANSWER_SUBMITTED', raw: txt.slice(0, 200) })
        }
      } catch {}
    })
  })
  page.on('console', (m) => console.log(`[browser-console] ${m.type()}: ${m.text()}`))
  page.on('pageerror', (e) => console.log(`[browser-error] ${e.message}`))

  // Set localStorage token so the SPA recognises us as authenticated
  await page.goto(`${WEB}/landing`)
  await page.evaluate(({ token, name, userId }) => {
    localStorage.setItem('accessToken', token)
    localStorage.setItem('userName', name)
    if (userId) localStorage.setItem('userId', userId)
  }, { token: host.token, name: host.name, userId: host.userId })

  // Navigate to host page directly
  await page.goto(`${WEB}/room/${room.id}/host`)
  await sleep(2000)
  console.log(`browser at ${page.url()}`)

  // ── STOMP players connect ────────────────────────────────────────────
  const aWs = await stompClient('A', a.token, room.id)
  const bWs = await stompClient('B', b.token, room.id)
  await sleep(500)

  aWs.send(`/app/room/${room.id}/ready`, {})
  bWs.send(`/app/room/${room.id}/ready`, {})
  await sleep(1000)

  // Start the room
  const start = await postJson(`/api/rooms/${room.id}/start`, {}, host.token)
  console.log(`start: ${start.status}`)

  // Wait QUESTION_START on player side
  await new Promise((resolve) => {
    const check = () => aWs.events.some(e => e.type === 'QUESTION_START') ? resolve() : setTimeout(check, 200)
    check()
  })
  const qi = aWs.events.find(e => e.type === 'QUESTION_START').data.questionIndex

  // Player A submits
  aWs.send(`/app/room/${room.id}/answer`, { questionIndex: qi, answerIndex: 0, reactionTimeMs: 500 })
  console.log(`A submitted answer`)

  // Wait 5s, then check browser DOM
  await sleep(5000)

  // ── DOM check ────────────────────────────────────────────────────────
  console.log(`\n=== Browser DOM ===`)
  const statusText = await page.locator('section:has-text("Tình trạng trả lời")').first().textContent().catch(() => 'NOT FOUND')
  console.log(`status section: ${statusText}`)
  const hasLiveAnswers = await page.locator('[data-testid="host-live-answers"]').count()
  console.log(`live-answers list present: ${hasLiveAnswers > 0}`)
  console.log(`ANSWER_SUBMITTED WS frames received by browser: ${wsFrames.length}`)

  if (wsFrames.length > 0 && !statusText?.includes('1 /')) {
    console.log(`\n❌ FE BUG: frame arrived but DOM not updated`)
    console.log(`   frame: ${wsFrames[0].raw}`)
  } else if (wsFrames.length === 0) {
    console.log(`\n❌ WS NOT REACHING BROWSER`)
  } else {
    console.log(`\n✅ PASS — DOM updated correctly`)
  }

  // Cleanup
  await fetch(`${API}/api/rooms/${room.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${host.token}` } }).catch(() => {})
  await browser.close()
  aWs.client.deactivate(); bWs.client.deactivate()
  process.exit(0)
})().catch((e) => { console.error('FAIL:', e); process.exit(2) })
