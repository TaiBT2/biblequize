# Playwright Trailer Recording — BibleQuiz

> Record screen cho app trailer dùng Playwright.
> Output: nhiều file .mp4 cho từng scene → edit chung thành trailer.
> Paste vào Claude Code.

---

```
Tạo Playwright tests để record screen cho app trailer.
Mỗi test = 1 scene. Sau khi chạy xong → có nhiều file .mp4 để làm trailer.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

## Setup

### Task 1: Install Playwright (nếu chưa có)

```bash
cd apps/web  # hoặc root project
npm install -D @playwright/test
npx playwright install chromium
```

### Task 2: Cấu trúc

```
tests/
  trailer/
    record.config.ts       ← Playwright config riêng cho trailer
    helpers.ts              ← Common actions (login, slow click)
    scenes/
      01-landing.spec.ts    ← Scene 1: Landing page hero
      02-onboarding.spec.ts ← Scene 2: Welcome slides + try quiz
      03-home.spec.ts       ← Scene 3: Home dashboard overview
      04-quiz-play.spec.ts  ← Scene 4: Gameplay (đúng/sai/combo)
      05-results.spec.ts    ← Scene 5: Perfect score + celebration
      06-multiplayer.spec.ts ← Scene 6: Room lobby + race
      07-journey-map.spec.ts ← Scene 7: Bible Journey Map
      08-tier-up.spec.ts    ← Scene 8: Tier up celebration
      09-church-group.spec.ts ← Scene 9: Church Group leaderboard
      10-daily-challenge.spec.ts ← Scene 10: Daily challenge + share
  recordings/
    raw/                    ← Playwright .webm output
    converted/              ← .mp4 sau conversion
```

---

## Task 3: Playwright config cho trailer

```typescript
// tests/trailer/record.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './scenes',
  timeout: 60_000,
  
  // CHẤT LƯỢNG TRAILER
  use: {
    // Full HD cho trailer
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,  // Retina quality
    
    // Luôn record video
    video: {
      mode: 'on',
      size: { width: 1920, height: 1080 },
    },
    
    // Không headless — thấy browser chạy
    headless: false,
    
    // Chậm hơn để không giật
    launchOptions: {
      slowMo: 100,  // 100ms delay giữa actions
    },
    
    // Base URL
    baseURL: 'http://localhost:5173',
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Color scheme
    colorScheme: 'dark',
    
    // Locale
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  },
  
  // Output folder
  outputDir: './recordings/raw',
  
  // Chỉ dùng chromium (quality tốt nhất)
  projects: [
    {
      name: 'chromium-trailer',
      use: { ...devices['Desktop Chrome'] },
    },
    // Bonus: record mobile viewport
    {
      name: 'mobile-trailer',
      use: {
        viewport: { width: 390, height: 844 },  // iPhone 13
        deviceScaleFactor: 3,
        isMobile: true,
      },
    },
  ],
  
  // Không retry (trailer cần deterministic)
  retries: 0,
  
  // 1 worker (tránh race condition)
  workers: 1,
  
  // Reporter đơn giản
  reporter: [['list']],
})
```

### Task 4: Helpers

```typescript
// tests/trailer/helpers.ts
import { Page, expect } from '@playwright/test'

/**
 * Slow motion click — đợi animation xong
 */
export async function slowClick(page: Page, selector: string, waitAfter = 1500) {
  await page.click(selector)
  await page.waitForTimeout(waitAfter)
}

/**
 * Hover với smooth movement
 */
export async function smoothHover(page: Page, selector: string, waitAfter = 800) {
  await page.hover(selector)
  await page.waitForTimeout(waitAfter)
}

/**
 * Pause để camera "nhìn" vào element
 */
export async function pause(page: Page, ms = 2000) {
  await page.waitForTimeout(ms)
}

/**
 * Type với delay thật giống human
 */
export async function humanType(page: Page, selector: string, text: string) {
  await page.click(selector)
  await page.type(selector, text, { delay: 80 })
}

/**
 * Login nhanh (dùng test user)
 */
export async function loginAsTestUser(page: Page, tierLevel = 3) {
  // Option 1: dùng test endpoint
  await page.request.post('/api/admin/test/users/1/set-tier', {
    data: { tierLevel },
  })
  
  // Option 2: direct JWT injection
  await page.goto('/')
  await page.evaluate((token) => {
    localStorage.setItem('accessToken', token)
  }, process.env.TEST_USER_TOKEN || 'test-token')
  
  await page.reload()
  await page.waitForSelector('[data-testid="home-page"]')
}

/**
 * Ẩn các elements không muốn trong trailer
 */
export async function hideChrome(page: Page) {
  await page.addStyleTag({
    content: `
      /* Ẩn dev tools, console errors, etc. */
      .dev-banner, .debug-panel { display: none !important; }
      
      /* Ẩn scroll bar */
      ::-webkit-scrollbar { display: none !important; }
      html { scrollbar-width: none !important; }
    `,
  })
}

/**
 * Scroll mượt
 */
export async function smoothScroll(page: Page, pixels: number, duration = 1000) {
  await page.evaluate(
    ({ pixels, duration }) => {
      return new Promise<void>((resolve) => {
        const start = window.scrollY
        const startTime = Date.now()
        
        function step() {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          // Ease-in-out
          const easing = progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress
          window.scrollTo(0, start + pixels * easing)
          if (progress < 1) requestAnimationFrame(step)
          else resolve()
        }
        step()
      })
    },
    { pixels, duration }
  )
}
```

---

## Task 5: Scene Scripts

### Scene 1: Landing page hero

```typescript
// tests/trailer/scenes/01-landing.spec.ts
import { test } from '@playwright/test'
import { pause, smoothScroll, hideChrome } from '../helpers'

test('Scene 1: Landing page', async ({ page }) => {
  await page.goto('/landing')
  await hideChrome(page)
  
  // 1. Hero fade in
  await pause(page, 2500)
  
  // 2. Scroll xuống features
  await smoothScroll(page, 600, 2000)
  await pause(page, 1500)
  
  // 3. Scroll xuống testimonials
  await smoothScroll(page, 600, 2000)
  await pause(page, 1500)
  
  // 4. Scroll lên top
  await smoothScroll(page, -1200, 2000)
  await pause(page, 1000)
  
  // Total: ~12 giây
})
```

### Scene 2: Onboarding + Try Quiz

```typescript
// tests/trailer/scenes/02-onboarding.spec.ts
import { test } from '@playwright/test'
import { slowClick, pause, hideChrome } from '../helpers'

test('Scene 2: Onboarding flow', async ({ page }) => {
  // Clear onboarding flag
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  
  await hideChrome(page)
  
  // Language selection
  await pause(page, 1500)
  await slowClick(page, 'button:has-text("Tiếng Việt")', 1500)
  
  // Welcome slide 1
  await pause(page, 2000)
  await slowClick(page, 'button:has-text("Tiếp theo")', 1500)
  
  // Slide 2
  await pause(page, 2000)
  await slowClick(page, 'button:has-text("Tiếp theo")', 1500)
  
  // Slide 3
  await pause(page, 2000)
  await slowClick(page, 'button:has-text("Bắt đầu")', 2000)
  
  // Try quiz - câu 1
  await pause(page, 2000)
  await slowClick(page, '[data-testid="answer-button"]:nth-child(1)', 2000)
  
  // Câu 2
  await pause(page, 2000)
  await slowClick(page, '[data-testid="answer-button"]:nth-child(2)', 2000)
  
  // Câu 3
  await pause(page, 2000)
  await slowClick(page, '[data-testid="answer-button"]:nth-child(1)', 2000)
  
  // Result "2/3 đúng"
  await pause(page, 3000)
  
  // Total: ~30 giây
})
```

### Scene 3: Home dashboard

```typescript
// tests/trailer/scenes/03-home.spec.ts
import { test } from '@playwright/test'
import { loginAsTestUser, smoothHover, pause, smoothScroll, hideChrome } from '../helpers'

test('Scene 3: Home dashboard', async ({ page }) => {
  await loginAsTestUser(page, 3)
  await page.goto('/home')
  await hideChrome(page)
  
  // 1. Overall view
  await pause(page, 2500)
  
  // 2. Hover vào Streak card
  await smoothHover(page, '[data-testid="streak-card"]', 1500)
  
  // 3. Hover vào Daily Challenge
  await smoothHover(page, '[data-testid="daily-challenge-card"]', 1500)
  
  // 4. Hover vào Energy bar
  await smoothHover(page, '[data-testid="energy-bar"]', 1500)
  
  // 5. Scroll xuống xem Bible Journey preview
  await smoothScroll(page, 400, 1500)
  await pause(page, 2000)
  
  // 6. Scroll xuống Leaderboard
  await smoothScroll(page, 400, 1500)
  await pause(page, 2000)
  
  // Total: ~15 giây
})
```

### Scene 4: Quiz gameplay (đúng/sai/combo)

```typescript
// tests/trailer/scenes/04-quiz-play.spec.ts
import { test } from '@playwright/test'
import { loginAsTestUser, slowClick, pause, hideChrome } from '../helpers'

test('Scene 4: Quiz gameplay', async ({ page }) => {
  await loginAsTestUser(page, 3)
  await page.goto('/practice')
  await hideChrome(page)
  
  // Select book
  await slowClick(page, 'text=Sáng Thế Ký', 1000)
  await slowClick(page, 'button:has-text("Bắt đầu")', 2500)
  
  // Câu 1: trả lời đúng (nhanh)
  await pause(page, 2000)
  await slowClick(page, '[data-testid="answer-correct"]', 1500)
  // Quan sát: sound + animation đúng
  await pause(page, 1500)
  
  // Câu 2: trả lời đúng (combo x2)
  await pause(page, 2000)
  await slowClick(page, '[data-testid="answer-correct"]', 1500)
  await pause(page, 1500)
  
  // Câu 3: trả lời đúng (combo x3 — banner hiện)
  await pause(page, 2000)
  await slowClick(page, '[data-testid="answer-correct"]', 2500)  // Đợi combo banner
  
  // Câu 4: trả lời sai (xem shake animation + explanation)
  await pause(page, 2000)
  await slowClick(page, '[data-testid="answer-wrong"]', 3500)  // Đợi explanation panel
  
  // Câu 5: đúng (timer gần hết → warning state)
  await pause(page, 5000)  // Đợi timer xuống <5s
  await slowClick(page, '[data-testid="answer-correct"]', 1500)
  
  // Total: ~25 giây
})
```

### Scene 5: Results + Celebration

```typescript
// tests/trailer/scenes/05-results.spec.ts
import { test } from '@playwright/test'
import { loginAsTestUser, pause, hideChrome } from '../helpers'

test('Scene 5: Results with perfect score', async ({ page }) => {
  // Setup: trigger perfect score result
  await loginAsTestUser(page, 3)
  
  // Navigate trực tiếp đến results page với mock data
  await page.goto('/results/mock-perfect')  // Cần endpoint mock
  await hideChrome(page)
  
  // 1. Confetti + "PERFECT!" text
  await pause(page, 3000)
  
  // 2. Score counting up animation
  await pause(page, 2500)
  
  // 3. Grade text reveal
  await pause(page, 2000)
  
  // 4. Stats breakdown (accuracy, time, XP)
  await pause(page, 2500)
  
  // 5. Action buttons
  await pause(page, 2000)
  
  // Total: ~12 giây
})
```

### Scene 6: Multiplayer room

```typescript
// tests/trailer/scenes/06-multiplayer.spec.ts
import { test } from '@playwright/test'
import { loginAsTestUser, slowClick, pause, hideChrome } from '../helpers'

test('Scene 6: Multiplayer room', async ({ page, context }) => {
  await loginAsTestUser(page, 3)
  await page.goto('/multiplayer')
  await hideChrome(page)
  
  // 1. Multiplayer lobby
  await pause(page, 2000)
  
  // 2. Create room
  await slowClick(page, 'button:has-text("Tạo phòng")', 1500)
  
  // 3. Room config
  await slowClick(page, '[data-testid="mode-speed-race"]', 1000)
  await slowClick(page, 'button:has-text("Tạo")', 2500)
  
  // 4. Room lobby — hiện players đang join
  // Mở tab 2 cho player khác join
  const player2 = await context.newPage()
  await loginAsTestUser(player2, 2)
  await player2.goto('/multiplayer/join/' + await page.locator('[data-testid="room-code"]').textContent())
  
  await page.bringToFront()  // Focus về tab 1
  await pause(page, 3000)
  
  // 5. Start game
  await slowClick(page, 'button:has-text("Bắt đầu")', 2000)
  
  // 6. Live race — leaderboard thay đổi real-time
  await slowClick(page, '[data-testid="answer-button"]:first-child', 2000)
  await pause(page, 3000)
  
  // Total: ~20 giây
})
```

### Scene 7: Bible Journey Map

```typescript
// tests/trailer/scenes/07-journey-map.spec.ts
import { test } from '@playwright/test'
import { loginAsTestUser, pause, smoothScroll, smoothHover, hideChrome } from '../helpers'

test('Scene 7: Bible Journey Map', async ({ page }) => {
  await loginAsTestUser(page, 4)  // Tier 4 → có nhiều sách completed
  await page.goto('/journey')
  await hideChrome(page)
  
  // 1. Overview
  await pause(page, 2500)
  
  // 2. Hover vào sách completed
  await smoothHover(page, '[data-testid="book-completed-genesis"]', 1500)
  
  // 3. Hover vào sách đang chơi
  await smoothHover(page, '[data-testid="book-in-progress"]', 1500)
  
  // 4. Scroll qua Old Testament
  await smoothScroll(page, 500, 2000)
  await pause(page, 1500)
  
  // 5. Scroll qua New Testament
  await smoothScroll(page, 500, 2000)
  await pause(page, 1500)
  
  // 6. Xem milestone badges
  await smoothHover(page, '[data-testid="milestone-pentateuch"]', 2000)
  
  // Total: ~18 giây
})
```

### Scene 8: Tier Up Celebration

```typescript
// tests/trailer/scenes/08-tier-up.spec.ts
import { test } from '@playwright/test'
import { loginAsTestUser, pause, hideChrome } from '../helpers'

test('Scene 8: Tier up celebration', async ({ page }) => {
  await loginAsTestUser(page, 2)
  await hideChrome(page)
  
  // Trigger tier up via test endpoint
  await page.request.post('/api/admin/test/users/1/trigger-tier-up')
  
  await page.goto('/home')
  
  // Tier up modal xuất hiện
  await pause(page, 4000)  // Xem full animation
  
  // Rewards hiện
  await pause(page, 3000)
  
  // Click continue
  await page.click('button:has-text("Tiếp tục")')
  await pause(page, 2000)
  
  // Total: ~10 giây
})
```

### Scene 9: Church Group

```typescript
// tests/trailer/scenes/09-church-group.spec.ts
import { test } from '@playwright/test'
import { loginAsTestUser, slowClick, pause, smoothScroll, hideChrome } from '../helpers'

test('Scene 9: Church Group leaderboard', async ({ page }) => {
  await loginAsTestUser(page, 3)
  await page.goto('/groups')
  await hideChrome(page)
  
  // 1. My groups list
  await pause(page, 2000)
  
  // 2. Click vào 1 group
  await slowClick(page, '[data-testid="group-card"]:first-child', 2500)
  
  // 3. Group detail + leaderboard
  await pause(page, 3000)
  
  // 4. Tab Members
  await slowClick(page, 'button:has-text("Thành viên")', 2500)
  
  // 5. Tab Announcements
  await slowClick(page, 'button:has-text("Thông báo")', 2500)
  
  // 6. Tab Quiz Sets
  await slowClick(page, 'button:has-text("Quiz nhóm")', 2500)
  
  // Total: ~18 giây
})
```

### Scene 10: Daily Challenge + Share

```typescript
// tests/trailer/scenes/10-daily-challenge.spec.ts
import { test } from '@playwright/test'
import { loginAsTestUser, slowClick, pause, hideChrome } from '../helpers'

test('Scene 10: Daily challenge + share', async ({ page }) => {
  await loginAsTestUser(page, 3)
  await page.goto('/daily')
  await hideChrome(page)
  
  // 1. Daily challenge intro
  await pause(page, 2500)
  
  // 2. Start
  await slowClick(page, 'button:has-text("Bắt đầu")', 2000)
  
  // 3. Trả lời 5 câu nhanh
  for (let i = 0; i < 5; i++) {
    await pause(page, 1500)
    await slowClick(page, '[data-testid="answer-button"]:first-child', 1500)
  }
  
  // 4. Result với "giỏi hơn X%"
  await pause(page, 3500)
  
  // 5. Share card preview
  await slowClick(page, 'button:has-text("Chia sẻ")', 3000)
  
  // Total: ~22 giây
})
```

---

## Task 6: Run scripts

```bash
# Run tất cả scenes
npx playwright test --config=tests/trailer/record.config.ts

# Run 1 scene cụ thể
npx playwright test --config=tests/trailer/record.config.ts scenes/04-quiz-play

# Chỉ desktop
npx playwright test --config=tests/trailer/record.config.ts --project=chromium-trailer

# Chỉ mobile
npx playwright test --config=tests/trailer/record.config.ts --project=mobile-trailer
```

Output: `tests/trailer/recordings/raw/**/*.webm`

---

## Task 7: Convert WebM → MP4

Playwright xuất .webm. Cần MP4 cho editing tools.

```bash
# Cài ffmpeg (nếu chưa có)
# Windows: choco install ffmpeg  hoặc  download từ ffmpeg.org
# Mac: brew install ffmpeg
# Linux: apt install ffmpeg
```

Script convert tất cả:

```bash
# tests/trailer/convert.sh
#!/bin/bash

RAW_DIR="tests/trailer/recordings/raw"
OUT_DIR="tests/trailer/recordings/converted"
mkdir -p "$OUT_DIR"

find "$RAW_DIR" -name "*.webm" | while read file; do
  filename=$(basename "$file" .webm)
  echo "Converting: $filename"
  
  ffmpeg -i "$file" \
    -c:v libx264 \
    -preset slow \
    -crf 18 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    "$OUT_DIR/${filename}.mp4" \
    -y
done

echo "Done! Files in $OUT_DIR"
```

Chạy: `bash tests/trailer/convert.sh`

**Giải thích flags:**
- `-preset slow`: chất lượng tốt hơn (encode lâu hơn)
- `-crf 18`: quality (18 = gần lossless, 23 = default, càng cao càng nén)
- `-pix_fmt yuv420p`: tương thích mọi player
- `-movflags +faststart`: load nhanh khi play

---

## Task 8: Trim / Speed up nếu cần

Nếu scene nào quá dài, trim bằng ffmpeg:

```bash
# Trim từ 0:03 đến 0:15 (12 giây)
ffmpeg -i input.mp4 -ss 00:00:03 -to 00:00:15 -c copy output.mp4

# Speed up 2x (bỏ audio)
ffmpeg -i input.mp4 -filter:v "setpts=PTS/2" -an output.mp4

# Slow down 0.5x
ffmpeg -i input.mp4 -filter:v "setpts=PTS*2" -an output.mp4
```

---

## Task 9: Edit trailer (manual)

Sau khi có 10 MP4 files → import vào editing tool:

**Free:**
- DaVinci Resolve (chuyên nghiệp, free)
- OpenShot (đơn giản)
- Shotcut (middle ground)
- CapCut (có version desktop)

**Online:**
- Canva Video
- Clipchamp (Windows built-in)

**Cấu trúc trailer gợi ý (60 giây):**
```
0:00 - 0:03  Logo + "BibleQuiz" title card
0:03 - 0:08  Scene 1: Landing hero
0:08 - 0:15  Scene 4: Quiz gameplay (đúng + combo)
0:15 - 0:20  Scene 3: Home dashboard
0:20 - 0:26  Scene 7: Bible Journey Map
0:26 - 0:32  Scene 6: Multiplayer race
0:32 - 0:38  Scene 9: Church Group
0:38 - 0:42  Scene 8: Tier up celebration
0:42 - 0:48  Scene 10: Daily challenge + share
0:48 - 0:55  Scene 5: Perfect score + confetti
0:55 - 1:00  End card: "Tải miễn phí" + logo
```

**Audio:**
- Upbeat background music (không copyright): Epidemic Sound, YouTube Audio Library, Artlist
- Voiceover (tùy chọn): Vietnamese voice over
- Sound effects: dùng luôn trong app (correct sound, tier up sound)

---

## Troubleshooting

**Video bị mờ / low quality:**
- Check `viewport` 1920×1080
- Check `deviceScaleFactor: 2`
- Tăng CRF xuống 15 khi convert

**Video bị giật:**
- Tăng `slowMo` lên 150-200
- Thêm `pause()` giữa actions

**Không capture được animations:**
- Animations cần thời gian chạy → `pause(2000)` sau action trigger
- Check CSS animations không bị prefers-reduced-motion

**Test users không có data:**
- Chạy seed test users trước:
```bash
curl -X POST http://localhost:8080/api/admin/test/seed-users
```

---

## Output cuối cùng

Sau khi chạy xong:
- `tests/trailer/recordings/converted/01-landing.mp4`
- `tests/trailer/recordings/converted/02-onboarding.mp4`
- `tests/trailer/recordings/converted/03-home.mp4`
- ... (10 files)

Tổng effort: 1-2 ngày viết script + 1 ngày edit trailer.
```
