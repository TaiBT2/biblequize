// Repro: player joins a Quản trò room from /multiplayer via SPA navigation
// (NO reload) and immediately clicks "Sẵn sàng". User reports the click is
// dead until F5. This script distinguishes:
//   - WS bug:  lobby shows "Mất kết nối" / send swallowed
//   - UI bug:  frame round-trips but button state never flips
//   - All-OK:  button flips to "Hủy sẵn sàng" without reload
//
// Run from apps/web/:  node tests/e2e/manual/check-ready-after-spa-join.mjs

import { chromium } from 'playwright'

const API = process.env.API_BASE ?? 'http://localhost:8080'
const WEB = process.env.WEB_BASE ?? 'http://localhost:5173'
const PWD = 'Test@123456'
const ts = Date.now()
const PREFIX = `diag-ready-${ts}-`

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
  if (r.status >= 400 || !r.body.accessToken) r = await postJson('/api/auth/mobile/login', { email, password: PWD })
  if (!r.body.accessToken) throw new Error(`${name}: ${JSON.stringify(r)}`)
  return { email, name: `${PREFIX}${name}`, token: r.body.accessToken }
}

const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a)

async function main() {
  // 1. Host creates a Quản trò room over REST
  const host = await provision('host')
  const player = await provision('player')
  const create = await postJson('/api/rooms', {
    roomName: `${PREFIX}room`, maxPlayers: 5, questionCount: 5, timePerQuestion: 30,
    mode: 'SPEED_RACE', isPublic: true, difficulty: 'MIXED', bookScope: 'ALL',
    hostPlaysGame: false,
  }, host.token)
  if (create.status >= 400) throw new Error(`create: ${JSON.stringify(create)}`)
  const roomCode = create.body.room.roomCode
  log(`room created code=${roomCode} hostPlaysGame=${create.body.room.hostPlaysGame}`)

  // 2. Player real browser: login (cookie) → /multiplayer → SPA-join → click ready
  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const wsFrames = []
  page.on('websocket', (ws) => {
    ws.on('framereceived', (f) => { if (typeof f.payload === 'string' && f.payload.includes('MESSAGE')) wsFrames.push(f.payload.slice(0, 120)) })
  })
  page.on('console', (m) => { if (m.type() === 'error') log('console.error:', m.text().slice(0, 160)) })

  await page.goto(WEB, { waitUntil: 'domcontentloaded' })
  const login = await page.request.post(`${API}/api/auth/login`, {
    data: { email: player.email, password: PWD, rememberMe: 'true' },
  })
  if (!login.ok()) throw new Error(`browser login: ${login.status()} ${await login.text()}`)
  const loginData = await login.json()
  await page.evaluate(({ name, email }) => {
    localStorage.setItem('userName', name)
    localStorage.setItem('userEmail', email)
    localStorage.setItem('quizLanguage', 'vi')
  }, { name: loginData.name, email: loginData.email })

  await page.goto(`${WEB}/multiplayer`, { waitUntil: 'networkidle' })
  log('on /multiplayer')

  // Join via the room card CTA (SPA navigation — the user's exact path)
  const card = page.locator('[data-testid="room-card"]', { hasText: `${PREFIX}room` })
  await card.waitFor({ timeout: 15000 })
  await card.locator('button').last().click()
  await page.waitForURL('**/lobby', { timeout: 15000 })
  log('SPA-navigated to lobby (no reload)')

  const probe = async (label) => {
    const conn = await page.locator('text=/Đã kết nối|Mất kết nối/').first().textContent().catch(() => '(no indicator)')
    const readyBtn = page.locator('button', { hasText: /Sẵn sàng|Hủy sẵn sàng/ }).first()
    const before = (await readyBtn.textContent().catch(() => '(no button)'))?.trim()
    await readyBtn.click({ timeout: 5000 }).catch((e) => log('click failed:', e.message.slice(0, 80)))
    await page.waitForTimeout(2500)
    const after = (await readyBtn.textContent().catch(() => '(no button)'))?.trim()
    log(`[${label}] conn="${conn}" button: "${before}" -> "${after}" | ws MESSAGE frames so far: ${wsFrames.length}`)
    return { before, after, conn }
  }

  // Probe 1: click INSTANTLY after the URL flips (user mashes the button
  // before STOMP has connected — worst case)
  const p1 = await probe('instant click, no reload')

  let verdict
  if (p1.after?.includes('Hủy')) {
    verdict = 'OK-WITHOUT-RELOAD: ready toggled — could not reproduce'
  } else if ((await probe('retry 3s later, still no reload')).after?.includes('Hủy')) {
    verdict = 'SWALLOWED-THEN-RECOVERS: first click lost in connect window, later click works without reload'
  } else {
    // Probe 2: after F5 (user's workaround)
    await page.reload({ waitUntil: 'networkidle' })
    log('reloaded (F5)')
    await page.waitForTimeout(1500)
    const p2 = await probe('after F5')
    verdict = p2.after?.includes('Hủy')
      ? `REPRODUCED: dead before reload (conn="${p1.conn}"), works after F5`
      : `BOTH DEAD: ready never toggles (conn p1="${p1.conn}" p2="${p2.conn}")`
  }
  log('VERDICT:', verdict)

  await browser.close()
}

main().catch((e) => { console.error('FATAL', e); process.exit(1) })
