// Standalone diagnostic for "BR host không nhận ANSWER_SUBMITTED" bug.
// Run with:
//   node tests/e2e/manual/check-host-receives-answer.mjs
//
// Connects 1 Quản trò observer + 2 BR players to PROD, starts a BR room,
// has player 1 submit an answer, observes host's WS frames for 10s,
// reports whether ANSWER_SUBMITTED arrived.
//
// Prerequisite: `@stomp/stompjs` available via apps/web node_modules.

import { Client } from '@stomp/stompjs'

const API = process.env.API_BASE ?? 'https://be.forbible.org'
const WS = process.env.WS_URL ?? 'wss://be.forbible.org/ws'
const PWD = 'Test@123456'
const ts = Date.now()
const PREFIX = `diag-host-recv-${ts}-`

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
  if (r.status >= 400) {
    r = await postJson('/api/auth/mobile/login', { email, password: PWD })
  }
  if (!r.body.accessToken) throw new Error(`provision ${name}: ${JSON.stringify(r)}`)
  console.log(`[provision] ${name} OK`)
  return { email, token: r.body.accessToken }
}

function connectWs(label, token, roomId) {
  return new Promise((resolve, reject) => {
    const events = []
    const client = new Client({
      brokerURL: WS,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
    })
    const timer = setTimeout(() => reject(new Error(`${label} WS connect timeout`)), 15000)
    client.onConnect = () => {
      clearTimeout(timer)
      client.subscribe(`/topic/room/${roomId}`, (frame) => {
        try {
          const m = JSON.parse(frame.body)
          events.push(m)
          console.log(`[${label}] ${m.type}`)
        } catch {}
      })
      resolve({ client, events, send: (dest, payload) => client.publish({
        destination: dest, body: JSON.stringify(payload),
        headers: { Authorization: `Bearer ${token}` },
      }) })
    }
    client.onStompError = (f) => { clearTimeout(timer); reject(new Error(`${label} STOMP error: ${f.headers.message}`)) }
    client.activate()
  })
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

;(async () => {
  const host = await provision('host')
  const a = await provision('a')
  const b = await provision('b')

  // Host creates BR room (Quản trò mode)
  const create = await postJson('/api/rooms', {
    roomName: 'Diag BR host recv', mode: 'BATTLE_ROYALE', maxPlayers: 10,
    questionCount: 5, timePerQuestion: 30, hostPlaysGame: false,
  }, host.token)
  if (create.status !== 200) throw new Error(`createRoom: ${JSON.stringify(create)}`)
  const room = create.body.room
  console.log(`[room] id=${room.id} code=${room.roomCode}`)

  // Players join
  for (const p of [a, b]) {
    const r = await postJson('/api/rooms/join', { roomCode: room.roomCode }, p.token)
    if (r.status !== 200) throw new Error(`join ${p.email}: ${JSON.stringify(r)}`)
  }

  // Connect 3 WS clients
  const hostWs = await connectWs('HOST', host.token, room.id)
  const aWs = await connectWs('A', a.token, room.id)
  const bWs = await connectWs('B', b.token, room.id)
  await sleep(500)

  // Both players ready (via WS as per BE contract)
  aWs.send(`/app/room/${room.id}/ready`, {})
  bWs.send(`/app/room/${room.id}/ready`, {})
  await sleep(1000)

  // Start the room via REST (host)
  const start = await postJson(`/api/rooms/${room.id}/start`, {}, host.token)
  if (start.status !== 200) throw new Error(`start: ${JSON.stringify(start)}`)
  console.log(`[start] OK`)

  // Wait for QUESTION_START on host observer
  await new Promise((resolve) => {
    const check = () => {
      if (hostWs.events.some(e => e.type === 'QUESTION_START')) return resolve()
      setTimeout(check, 200)
    }
    check()
  })
  console.log(`[event] HOST received QUESTION_START`)
  const qIdx = hostWs.events.find(e => e.type === 'QUESTION_START').data.questionIndex

  // Player A submits answer
  aWs.send(`/app/room/${room.id}/answer`, {
    questionIndex: qIdx, answerIndex: 0, reactionTimeMs: 500,
  })
  console.log(`[submit] A answered`)

  // Wait 5s for events
  await sleep(5000)

  // Report
  const types = {}
  for (const e of hostWs.events) types[e.type] = (types[e.type] ?? 0) + 1
  console.log(`\n=== HOST observer event counts ===`)
  for (const t of Object.keys(types).sort()) console.log(`  ${t}: ${types[t]}`)

  const ans = hostWs.events.find(e => e.type === 'ANSWER_SUBMITTED')
  if (ans) {
    console.log(`\n✅ PASS — host received ANSWER_SUBMITTED:`)
    console.log(`   data:`, JSON.stringify(ans.data))
  } else {
    console.log(`\n❌ FAIL — host did NOT receive ANSWER_SUBMITTED after A submitted`)
  }

  // Cleanup
  try {
    await fetch(`${API}/api/rooms/${room.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${host.token}` },
    })
  } catch {}
  hostWs.client.deactivate()
  aWs.client.deactivate()
  bWs.client.deactivate()
  process.exit(ans ? 0 : 1)
})().catch((e) => { console.error('FAIL:', e); process.exit(2) })
