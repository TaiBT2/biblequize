# PROMPT — Home Page Redesign (Modern Spiritual Direction)

> **Target:** Áp dụng mockup `home_modern.html` vào trang Home thực tế.
> **Scope:** Chỉ thay đổi Frontend. Backend không động trừ khi audit chứng minh là bắt buộc.
> **Pattern:** Audit-first → Implementation theo tasks độc lập → Tests.
> **Workflow:** Mỗi task = 1 commit riêng. Stop và confirm với Bui sau mỗi task.

---

## 0. Bối cảnh

User của BibleQuiz đã complain trang chủ "nhìn không đẹp". Sau khi audit + thiết kế 3 vòng mockup, đã chốt direction **"Modern Spiritual"**:

- **Sans dominant** (Be Vietnam Pro 700/800) — match audience 18-40, optimize dấu tiếng Việt
- **Serif chỉ ở verse** (Cormorant Garamond italic + drop cap) — 1 khoảnh khắc contrast spiritual
- **Sport-app numbers** (tabular-nums, weight 800)
- **Atmosphere** (gold radial gradient + maroon hint + noise overlay + vignette)
- **Dynamic Hierarchy** ⭐ — pattern "next-best-action" giống Duolingo/Spotify:
  - Daily **chưa làm** → Featured Daily là hero ở top, Ranked là standard mode card
  - Daily **đã làm** → Daily strip thin, **Hero Ranked promoted lên top**

Mockup file: `docs/designs/mockups/home_modern.html` (Bui sẽ commit trước khi bạn kick off).

---

## 1. Mục tiêu

Refactor trang `apps/web/src/pages/Home.tsx` để khớp với mockup. KHÔNG đổi structure data flow hay business logic — chỉ presentation layer.

**Deliverables:**

1. Home.tsx render đúng 2 states (Daily todo / Daily done) với dynamic hierarchy
2. Typography + atmosphere theo design tokens mới
3. Components mới đúng spec từ mockup
4. Tests cho mỗi component + Home page (Vitest)
5. Tầng 1 + Tầng 2 + Tầng 3 regression đầy đủ

**Non-goals:**

- ❌ Không sửa Sidebar (làm batch khác — đã có thiết kế riêng)
- ❌ Không sửa Quiz/Ranked/Practice screens (out of scope)
- ❌ Không sửa Mobile app (apps/mobile/)
- ❌ Không thêm tính năng mới — chỉ refactor presentation của tính năng đang có

---

## 2. Canonical Constraints — KHÔNG ĐƯỢC VI PHẠM

### 2.1 Tier system

Tier names: **Tân Tín Hữu → Người Tìm Kiếm → Môn Đồ → Hiền Triết → Tiên Tri → Sứ Đồ**.

⚠️ KHÔNG dùng Light-based system ("Tia Sáng / Ánh Bình Minh / Ngọn Đèn..."). SPEC_USER_v3 §3.1 có ghi tên Light-based — bỏ qua. CLAUDE.md là nguồn chính xác.

### 2.2 Design tokens

- Dark navy base: `#0a0c14` (deeper than current `#11131e` — phần atmosphere)
- Card surface: `#181a24`
- Glass: `rgba(50,52,64,0.4)` + `backdrop-filter: blur(12px)` (existing) — mockup dùng `rgba(24,26,36,0.55)` warmer; pick existing để không phá Sacred Modernist
- Ivory text: `#f5f0e6` (NEW — warmer than current `#e7e9ee`)
- Gold: `#e8a832` (existing)
- Gold light: `#e7c268` (existing)
- Gold deep: `#c98a1c`, `#7a5818` (NEW — for gradient depth)
- Streak ember: `#fb923c` (existing)
- Maroon hint: `#7c2d3a` (NEW — Pentecost season subtle accent, dùng 5% opacity)
- Sage hint: `#4a6b52` (NEW — Daily strip "đã hoàn thành")

**Mọi giá trị hardcode hex.** KHÔNG dùng CSS variables — gây white-background rendering bug (memory ghi rõ).

### 2.3 Fonts

- Body/UI: **Be Vietnam Pro** weights 400/500/600/700/**800**. Đã có. Thêm weight 800 nếu chưa load.
- Display serif: **Cormorant Garamond** italic 500/600/700. **CHỈ DÙNG Ở 2 NƠI**:
  1. Verse text (`.verse-text`)
  2. Verse drop cap (`.verse-text::first-letter`)

  Không dùng serif cho headings, tier names, mode titles, hay bất cứ đâu khác.

### 2.4 Bottom nav

Pattern "Hướng 3" giữ nguyên (inactive icon-only, active pill với label). KHÔNG đụng vào AppLayout.tsx bottom nav.

### 2.5 Existing components — KHÔNG REWRITE, REUSE

Đã có sẵn (đừng tạo lại):

- `TierProgressBar` — `apps/web/src/components/TierProgressBar.tsx` (Task TP-2 DONE)
- `StarPopup` — `apps/web/src/components/StarPopup.tsx`
- `DailyMissionsCard` — `apps/web/src/components/DailyMissionsCard.tsx` (Task TP-4 DONE)
- `TierUpModal` — đã có
- `ComebackModal` — đã có

Nếu cần thay đổi internal của các component này — hỏi Bui trước, không tự ý sửa.

### 2.6 i18n

Strings Vietnamese hardcoded OK (memory: technical debt accepted). Có thể dùng `t('home.dailyFeatured.title')` nếu key đã có trong `apps/web/src/i18n/vi.json`. Không tạo thêm i18n keys mới trong sprint này.

---

## 3. Files Claude Code phải đọc TRƯỚC khi viết code

### 3.1 Mockup nguồn (ground truth visual)

```
docs/designs/mockups/home_modern.html
```

Đọc TOÀN BỘ. Trích CSS rules cho từng component. Khi implement, **so sánh từng pixel** với mockup. Nếu khác biệt — refer mockup, không tự sáng tạo.

### 3.2 Trang đích

```
apps/web/src/pages/Home.tsx
```

Đọc full. Note current sections, data fetching (useQuery hooks), component imports.

### 3.3 Reference docs

```
CLAUDE.md                          (rules tổng)
docs/dev/DESIGN_TOKENS.md          (Sacred Modernist palette)
SPEC_USER_v3.md §3 (Tier)
SPEC_USER_v3.md §5.3 (Daily Challenge — kiểm tra alreadyCompleted field có sẵn)
SPEC_USER_v3.md §17.6 (Daily Challenge API)
```

### 3.4 Existing data hooks/APIs

Grep + đọc:

```bash
grep -rn "useQuery.*me" apps/web/src/pages/Home.tsx
grep -rn "daily-challenge" apps/web/src/api/
grep -rn "ranked-status" apps/web/src/api/
grep -rn "tier-progress" apps/web/src/api/
grep -rn "daily-missions" apps/web/src/api/
grep -rn "journey" apps/web/src/api/
```

Mục đích: confirm endpoint URL, response shape, query key names.

### 3.5 Existing components để inspire pattern

```
apps/web/src/components/TierProgressBar.tsx     (gold gradient bar reference)
apps/web/src/components/DailyMissionsCard.tsx   (card pattern reference)
apps/web/src/pages/__tests__/Home.test.tsx      (test pattern reference)
```

---

## 4. Phase 1: AUDIT (output report, STOP)

> **STOP CHECKPOINT 1**: Cuối phase này, tạo `HOME_REDESIGN_AUDIT.md`, commit, **dừng lại**. Bui review trước khi Phase 2.

### 4.1 Audit checklist

Đọc các file ở §3 và trả lời từng câu hỏi sau với **`file:line` references**:

1. **Current Home.tsx structure** — liệt kê các section (greeting, hero, game modes, journey, verse, etc.) với line ranges.

2. **Data fetching hiện tại** — list mọi `useQuery` trong Home.tsx + query keys + endpoint URLs.

3. **Daily challenge state** — endpoint nào trả về `alreadyCompleted: boolean`?
   - Nếu CÓ → dùng trực tiếp, ZERO backend changes
   - Nếu KHÔNG → đề xuất MINIMAL BE change: thêm 1 field vào response của 1 endpoint có sẵn (KHÔNG tạo endpoint mới)

4. **Components in Home.tsx hiện tại** — list mọi component import + đánh dấu component nào sẽ:
   - **KEEP** (reuse as-is): vd TierProgressBar, DailyMissionsCard
   - **MODIFY** (cần update visual nhỏ): vd GameModeGrid → có thể cần thay
   - **REMOVE** (xóa hoặc replace): vd GameModeGrid có thể bị replace bởi components mới

5. **CSS approach hiện tại** — Tailwind classes vs CSS modules vs styled? Mockup dùng plain CSS — Claude Code phải convert sang Tailwind nếu Home.tsx dùng Tailwind, hoặc tạo `Home.module.css` nếu đang dùng CSS modules.

6. **Test files hiện tại** — `apps/web/src/pages/__tests__/Home.test.tsx` — count tests, list những gì test.

7. **Mockup vs Home.tsx diff** — liệt kê những điểm khác nhau lớn, mỗi điểm 1 dòng:
   - Banner: serif italic name → sans 800 uppercase? (mockup dùng sans 800)
   - Daily strip: ...
   - Featured Daily card: tồn tại trong Home.tsx hay phải tạo mới?
   - Hero Ranked: ...
   - Section "Khám phá thêm" 4-col: ...
   - Journey card: tồn tại với UI cũ nào?
   - Verse footer drop cap: tồn tại?

### 4.2 Output format

File: `apps/web/src/pages/__tests__/HOME_REDESIGN_AUDIT.md`

Template:

```markdown
# Home Redesign Audit — [DATE]

## 1. Current Home.tsx Structure
- Section X: Home.tsx:42-87 (component XCard)
- Section Y: Home.tsx:88-130
...

## 2. Data Fetching
- useQuery(['me']) → GET /api/me · Home.tsx:25
- useQuery(['daily-challenge']) → GET /api/daily-challenge · Home.tsx:35
...

## 3. Daily Completed Flag
- ✅ EXISTS: GET /api/daily-challenge returns `alreadyCompleted` per SessionService.java:142
- (or) ❌ MISSING: must add to /api/daily-challenge response, see DailyChallengeService.java:55

## 4. Components Inventory
| Component | Action | Reason |
|---|---|---|
| TierProgressBar | KEEP | exact match |
| GameModeGrid | REMOVE | replaced by inline grids per state |
| ... | ... | ... |

## 5. CSS Approach
Current: Tailwind utility classes (e.g., `bg-glass-card backdrop-blur-md`)
Plan: Tailwind primary, custom CSS in Home.module.css for: noise SVG, drop cap, ornament

## 6. Test Files
__tests__/Home.test.tsx — 26 tests covering [list]

## 7. Mockup vs Current Diff
| Element | Mockup | Current Home.tsx | Action |
|---|---|---|---|
| Banner name font | Sans 800 30px | Sans 700 24px | Update class |
| Featured Daily card | NEW | Does not exist | CREATE |
| Hero Ranked promoted | NEW (state-done only) | Does not exist | CREATE |
| Daily Missions | EXISTS as component | EXISTS as DailyMissionsCard | KEEP |
| ... | | | |

## 8. Backend Changes Required
- ✅ NONE (or)
- ⚠️ 1 small change: add `alreadyCompleted: boolean` to `GET /api/daily-challenge` response

## 9. Estimated Tasks
- HR-1: ...
- HR-2: ...
```

### 4.3 Phase 1 commit

```
chore: home redesign audit (HOME_REDESIGN_AUDIT.md)
```

**STOP. Wait for Bui confirmation before Phase 2.**

---

## 5. Phase 2: Implementation (8 tasks, mỗi task = 1 commit)

> **Quy tắc chung:**
> - Sau MỖI task: `npm run build` pass + `npx vitest run [related-test-file]` pass (Tầng 1)
> - Mỗi task = 1 commit riêng. Format: `feat: HR-X <ngắn gọn>`
> - **Stop sau mỗi task. Confirm với Bui trước khi sang task tiếp.**

### Task HR-1 — Atmosphere + global tokens

**File(s):**
- `apps/web/src/styles/global.css` (hoặc tên tương đương — grep `body {` để tìm)
- `apps/web/tailwind.config.ts`

**Changes:**

1. Thêm noise SVG data URI làm body::before:
   ```css
   body::before {
     content: '';
     position: fixed;
     inset: 0;
     pointer-events: none;
     z-index: 0;
     background-image: url("data:image/svg+xml,...");  /* copy từ mockup */
     opacity: 0.04;
   }
   ```

2. Thêm radial gradients trên body:
   ```css
   body {
     background:
       radial-gradient(ellipse 1000px 700px at 18% -5%, rgba(232,168,50,0.10), transparent 55%),
       radial-gradient(ellipse 700px 500px at 92% 20%, rgba(124,45,58,0.04), transparent 60%),
       radial-gradient(ellipse 900px 600px at 50% 110%, rgba(232,168,50,0.04), transparent 60%),
       #0a0c14;
   }
   body::after {
     /* vignette */
     content: '';
     position: fixed;
     inset: 0;
     pointer-events: none;
     background: radial-gradient(ellipse 1400px 900px at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%);
   }
   ```

3. Thêm font weight 800 vào Be Vietnam Pro import (index.html hoặc font-face declaration):
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
   ```

4. Thêm Cormorant Garamond import (chỉ italic 500/600/700):
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500;1,600;1,700&display=swap" rel="stylesheet">
   ```

5. Tailwind config — thêm:
   - `colors.ivory: '#f5f0e6'`
   - `colors['gold-deep']: '#c98a1c'`
   - `colors['gold-shadow']: '#7a5818'`
   - `colors.maroon: '#7c2d3a'`
   - `colors.sage: '#4a6b52'`
   - `fontFamily.serif: ['"Cormorant Garamond"', 'serif']` (chỉ verse dùng)

**Verify:**
- Build pass
- Mở trang home → thấy noise + gradient subtle ở background (so sánh với mockup)
- KHÔNG có gradient quá mạnh — phải subtle

**Commit:** `feat: HR-1 atmosphere tokens + Cormorant Garamond italic`

---

### Task HR-2 — Banner update (sport-app numbers)

**File:** Component banner trong Home.tsx hoặc trong `apps/web/src/components/HomeBanner.tsx` (nếu đã tách).

**Changes:**

1. User name `TAI THANH`:
   - Class: `font-bevn font-extrabold text-[30px] tracking-tight text-ivory`
   - **KHÔNG uppercase CSS** (đã là caps trong data)
   - Letter-spacing: `-0.025em`

2. Tier name "Tân Tín Hữu":
   - Class: `font-bevn font-bold text-[14px] text-gold` (không serif italic)
   - Letter-spacing: `0.02em`

3. Next tier "Người Tìm Kiếm":
   - `text-[13px] font-medium text-ivory-dim` (#b8b1a3)

4. XP "191 / 1,000 XP":
   - Container: `tabular-nums font-bold text-[14px]`
   - Number "191": `text-gold`
   - "/ 1,000 XP": `text-ivory-dim text-[12px]`

5. Stats (Streak / Năng lượng / Mùa này):
   - Number: `font-extrabold text-[22px] tabular-nums tracking-tight text-ivory`
   - Label: `text-[9px] uppercase tracking-widest text-ivory-faint` (#6e6a60)
   - Icons: line icons stroke-1.6 — copy SVG paths từ mockup
   - Streak icon: thêm class `animate-breathe` (xem CSS animation định nghĩa task HR-1)

6. Border + glow:
   - Border: `border border-[rgba(232,168,50,0.14)]`
   - Banner background giữ glass-card hiện tại
   - Thêm `::before` radial gradient gold top-left (xem mockup CSS)

**Test:**

```typescript
// apps/web/src/components/__tests__/HomeBanner.test.tsx
test('banner displays user name in sans 800', () => {...})
test('stats display numbers with tabular-nums', () => {...})
test('streak icon has breathing animation class', () => {...})
test('banner has gold border tint', () => {...})
```

**Commit:** `feat: HR-2 banner sport-app typography`

---

### Task HR-3 — FeaturedDailyCard component (State A hero)

**Tạo file mới:** `apps/web/src/components/FeaturedDailyCard.tsx`

**Spec (copy từ mockup CSS `.daily-featured`):**

- Background: 2 radial gradients (maroon top-right + gold top-left) + warm dark glass
- Border: 1px gold-tint + 3px solid gold left border
- Border-radius: 16px
- Padding: 22px 28px

**Props:**

```typescript
interface FeaturedDailyCardProps {
  questionCount: number;        // mặc định 5
  estimatedMinutes: number;     // mặc định 3
  globalParticipants?: number;  // nếu có
  countdownText: string;        // "20:35:43" — computed client-side
  onStart: () => void;
}
```

**Layout (grid-template-columns 1fr auto):**

```
LEFT:
  [pulsing gold dot] THỬ THÁCH HÔM NAY · MỚI SẴN SÀNG
  Bắt đầu ngày mới với Lời Chúa
  5 câu · 3 phút · Reset mỗi 24 giờ · Cùng cộng đồng
  [⚫⚫⚫⚫⚫ 5 câu hỏi] [🕐 ~3 phút] [👥 1,247 đã chơi hôm nay]

RIGHT:
  CÒN LẠI TRONG NGÀY
  20:35:43
  [Vào chơi ngay →] (gold gradient button)
```

**Animation:**

- Pulsing dot: `@keyframes pulse { 50% opacity: 1 }` 2s ease-in-out infinite
- Hover: `transform: translateY(-1px)` + box-shadow gold tint

**State logic:**

- Nếu `globalParticipants === undefined` hoặc 0 → ẩn dòng "X đã chơi hôm nay"
- Countdown text format: compute client-side bằng `useEffect` + `setInterval(1000)`, format `HH:MM:SS` từ thời gian còn lại đến `00:00:00 UTC` ngày tiếp theo

**Test:**

```typescript
test('FeaturedDailyCard renders title, tagline, meta')
test('FeaturedDailyCard fires onStart on CTA click')
test('FeaturedDailyCard hides global stats if undefined')
test('FeaturedDailyCard countdown updates every second')
test('FeaturedDailyCard renders 5 empty dot indicators')
```

**Commit:** `feat: HR-3 FeaturedDailyCard component`

---

### Task HR-4 — HeroRankedCard component (State B hero)

**Tạo file mới:** `apps/web/src/components/HeroRankedCard.tsx`

**Spec (copy từ mockup `.hero-ranked`):**

- Background: radial gradient (light gold top) + linear gradient (gold → deep → shadow)
- Border-radius: 20px
- Padding: 28px 32px
- Box-shadow: `0 18px 50px -10px rgba(232,168,50,0.30), 0 0 0 1px rgba(232,168,50,0.4)`
- Inset highlight: `inset 0 1px 0 rgba(255,220,140,0.4)`
- Noise overlay 25% mix-blend-mode overlay

**Props:**

```typescript
interface HeroRankedCardProps {
  energyRemaining: number;
  energyMax: number;
  rankedAnswered: number;
  rankedCap: number;
  onEnter: () => void;
  /** 
   * Optional label override.
   * Default state-done: "Tiếp theo · Bước vào đấu trường"
   * Default state-todo: "Cạnh tranh · Ranking · Phần thưởng mùa"
   */
  label?: string;
  /**
   * Default state-done: "Daily xong rồi — giờ cạnh tranh ranking thôi"
   * Default state-todo: "Cạnh tranh ranking · Sẵn sàng thách thức chưa?"
   */
  tagline?: string;
}
```

**Layout (grid-template-columns 1fr auto):**

```
LEFT:
  LABEL UPPERCASE GOLD (small caps)
  Thi đấu Ranked (sans 800 34px, tight tracking, dark color #1a1208)
  Tagline (sans 500 13px, dark muted)
  [⚡ 100 năng lượng] [🕐 0 / 100 câu hôm nay]

RIGHT:
  [Vào trận →] (dark button with gold text)
```

**Button:**

- Background: `#1a1208`
- Color: `#e8a832`
- Padding: 14px 26px
- Border-radius: 12px
- Font: sans 700, no italic
- Hover: `translateX(3px)` + arrow icon translates 4px

**Test:**

```typescript
test('HeroRankedCard renders default labels')
test('HeroRankedCard accepts custom label and tagline')
test('HeroRankedCard fires onEnter on CTA')
test('HeroRankedCard displays energy and daily progress')
test('HeroRankedCard has gold gradient background')
```

**Commit:** `feat: HR-4 HeroRankedCard component`

---

### Task HR-5 — RankedStandardCard component (State A standard)

**Tạo file mới:** `apps/web/src/components/RankedStandardCard.tsx`

**Spec (copy mockup `.mode-card.ranked-standard`):**

- Standard glass card background + gold-tinted (linear gradient 6% gold)
- Border: 1px gold tint
- KHÔNG full gold gradient fill (đó là Hero Ranked's job)

**Props:**

```typescript
interface RankedStandardCardProps {
  energyRemaining: number;
  rankedAnswered: number;
  rankedCap: number;
  onEnter: () => void;
}
```

**Layout — same as other mode cards:**

```
[Icon] [Pill "Đã mở khóa" gold]
Thi đấu Ranked
Cạnh tranh ranking · 100 năng lượng sẵn sàng
─────
Vào trận →                    0 / 100 câu hôm nay
```

**Test (≥4):**

```typescript
test('RankedStandardCard renders title and description')
test('RankedStandardCard shows energy hint')
test('RankedStandardCard fires onEnter')
test('RankedStandardCard has gold tint background (not gradient fill)')
```

**Commit:** `feat: HR-5 RankedStandardCard component`

---

### Task HR-6 — SectionHeader + DailyCompletedStrip components

**Tạo 2 files:**

#### a) `apps/web/src/components/SectionHeader.tsx`

```typescript
interface SectionHeaderProps {
  title: string;
  meta?: string;       // right-aligned secondary text
  className?: string;
}
```

**Spec:** Small caps, tracked 0.16em, ivory text, gold 3px×14px accent bar left.

```css
.sec-head { display: flex; align-items: center; gap: 12px; margin: 30px 0 14px; }
.sec-head::before {
  content: ''; width: 3px; height: 14px;
  background: linear-gradient(180deg, #e8a832, #c98a1c);
  border-radius: 2px;
}
.sec-head h2 {
  font-size: 11px; font-weight: 700; color: #f5f0e6;
  letter-spacing: 0.16em; text-transform: uppercase;
}
.sec-head .meta { margin-left: auto; font-size: 11px; color: #6e6a60; font-weight: 500; }
```

#### b) `apps/web/src/components/DailyCompletedStrip.tsx`

```typescript
interface DailyCompletedStripProps {
  correctCount: number;
  totalCount: number;
  trailingText: string;     // "Hành trình qua 5 sách"
  countdownText: string;    // "20:35:43"
  onReview: () => void;
}
```

**Spec (mockup `.daily-strip`):**

- Sage green tint: `rgba(74,107,82,0.10)` bg + `rgba(74,107,82,0.25)` border
- Check icon trong tròn `rgba(74,107,82,0.3)`
- "3/5 đúng — Giỏi lắm!" (sans 700) + sub line muted
- Right: "Xem lại bài làm" button (glass)

**Tests (≥6 total cho cả 2 components).**

**Commit:** `feat: HR-6 SectionHeader + DailyCompletedStrip`

---

### Task HR-7 — Home.tsx refactor: dynamic hierarchy

**File:** `apps/web/src/pages/Home.tsx`

**Implement state-aware rendering theo logic mockup:**

```tsx
const Home = () => {
  const { data: me } = useQuery(['me'], ...);
  const { data: dailyStatus } = useQuery(['daily-challenge'], ...);
  const { data: rankedStatus } = useQuery(['ranked-status'], ...);
  // ... existing queries

  const dailyDone = dailyStatus?.alreadyCompleted ?? false;

  return (
    <div data-daily={dailyDone ? 'done' : 'todo'}>
      <HomeBanner user={me} />

      {/* Daily state */}
      {dailyDone ? (
        <DailyCompletedStrip {...} />
      ) : (
        <FeaturedDailyCard {...} />
      )}

      {/* State B: Hero Ranked promoted to top — before Daily Missions */}
      {dailyDone && (
        <HeroRankedCard {...} />
      )}

      <DailyMissionsCard />  {/* always shown, existing component */}

      {/* Mode sections — different per state */}
      {!dailyDone ? (
        <>
          <SectionHeader title="Chế độ chơi chính" />
          <div className="grid grid-cols-2 gap-3.5">
            <PracticeCard onStart={...} />
            <RankedStandardCard {...} />
          </div>
          <SectionHeader title="Chế độ đa dạng" meta="Không ảnh hưởng XP / xếp hạng" />
          <div className="grid grid-cols-3 gap-3.5">
            <WeeklyCard /> <MysteryCard /> <SpeedCard />
          </div>
        </>
      ) : (
        <>
          <SectionHeader title="Khám phá thêm" meta="Luyện tập tự do — không tính XP" />
          <div className="grid grid-cols-4 gap-3">
            <PracticeCard /> <WeeklyCard /> <MysteryCard /> <SpeedCard />
          </div>
        </>
      )}

      <SectionHeader title="Thi đấu cộng đồng" meta="trong FMC Danang" />
      <div className="grid grid-cols-3 gap-3.5">
        <GroupCard /> <RoomCard /> <TournamentCard />
      </div>

      <JourneyCard journey={me?.journey} />
      <VerseFooter />
    </div>
  );
};
```

**Lưu ý:**

- PracticeCard, WeeklyCard, MysteryCard, SpeedCard, GroupCard, RoomCard, TournamentCard — có thể tái dùng từ `GameModeGrid` component cũ. Nếu chưa có dạng tách rời, tạo wrapper hoặc trích từ GameModeGrid hiện tại. KHÔNG viết logic từ đầu.

- `dailyStatus.alreadyCompleted` — từ audit task. Nếu BE chưa trả về → đã sửa BE ở Phase 1 audit hoặc workaround:
  - Workaround: check `dailyStatus.score !== null` hay `dailyStatus.completedAt !== null`
  - Nhưng ưu tiên: thêm field `alreadyCompleted` vào response nếu cần (xem audit recommendation)

**Test cập nhật:**

```typescript
// apps/web/src/pages/__tests__/Home.test.tsx
test('renders FeaturedDailyCard when daily not done', () => {
  mockApi({ '/api/daily-challenge': { alreadyCompleted: false } });
  // expect FeaturedDailyCard visible
  // expect HeroRankedCard NOT in document
});

test('renders DailyCompletedStrip + HeroRankedCard promoted when daily done', () => {
  mockApi({ '/api/daily-challenge': { alreadyCompleted: true } });
  // expect DailyCompletedStrip visible
  // expect HeroRankedCard visible BEFORE DailyMissionsCard in DOM order
  // expect FeaturedDailyCard NOT in document
});

test('renders "Chế độ chơi chính" 2-col grid (Practice + Ranked-standard) when daily not done');
test('renders "Khám phá thêm" 4-col grid when daily done');
test('renders SectionHeader components with correct titles per state');
```

Update existing tests for new layout.

**Commit:** `feat: HR-7 Home dynamic hierarchy (state-aware layout)`

---

### Task HR-8 — Verse footer (drop cap + ornament)

**File:** Có thể tạo `apps/web/src/components/VerseFooter.tsx` hoặc inline trong Home.tsx.

**Spec (mockup `.verse-section`):**

```css
.verse-ornament {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  margin-bottom: 18px;
}
.verse-ornament .line {
  flex: 1; max-width: 160px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(232,168,50,0.4), transparent);
}

.verse-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px; font-style: italic; line-height: 1.55;
  color: #f5f0e6; text-align: center;
  max-width: 720px; margin: 0 auto; padding: 0 32px;
}
.verse-text::first-letter {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.4em; font-weight: 700;
  float: left; line-height: 0.85;
  padding: 4px 8px 0 0;
  color: #e8a832;
  text-shadow: 0 2px 12px rgba(232,168,50,0.25);
}
.verse-cite {
  text-align: center; margin-top: 18px;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.22em; color: #b8b1a3;
  text-transform: uppercase;
}
.verse-cite::before, .verse-cite::after {
  content: '—'; color: #6e6a60; margin: 0 8px;
}
```

**Data:** Dùng `getDailyVerse()` từ `apps/web/src/data/verses.ts` (đã có per Task 1.3).

**Test:**

```typescript
test('VerseFooter renders verse text in serif italic')
test('VerseFooter renders cite uppercase with em-dashes')
test('VerseFooter::first-letter applies drop cap styling')
test('VerseFooter rotates verse based on UTC date')
```

**Commit:** `feat: HR-8 Verse footer drop cap + ornament`

---

## 6. Phase 3: Tests & Regression

> **STOP CHECKPOINT 2**: Sau HR-8, chạy full regression. Confirm với Bui trước khi merge.

### 6.1 Test counts target

Baseline trước khi start: lưu lại `npx vitest run --reporter=verbose 2>&1 | tail -5` đầu Phase 1 cho biết test count gốc.

Sau Phase 2: tests phải `>= baseline + new tests`. Mỗi task HR-2 đến HR-8 thêm ~4-6 tests.

### 6.2 Tầng test thực thi

Theo memory pattern 4-tier:

```bash
# Tầng 1 (sau mỗi task)
cd apps/web && npx vitest run src/components/__tests__/<NewComponent>.test.tsx

# Tầng 2 (cuối Phase 2)
cd apps/web && npx vitest run src/pages/__tests__/

# Tầng 3 (cuối Phase 3)
cd apps/web && npx vitest run

# Tầng 4 (smoke — optional, nếu Playwright đã setup local)
cd apps/web && npx playwright test --grep "@smoke"
```

### 6.3 Regression checklist

- [ ] Build pass (`npm run build`)
- [ ] All vitest tests pass
- [ ] Home page render đúng cả 2 states (manual check):
  - [ ] Login + chưa làm Daily → thấy FeaturedDailyCard ở top, Ranked là standard card
  - [ ] Login + làm Daily xong → thấy DailyCompletedStrip + HeroRankedCard promoted lên top
- [ ] Banner sport-app numbers (tabular-nums, weight 800)
- [ ] Verse footer có drop cap chữ đầu màu gold
- [ ] Background có atmosphere (noise + gradients subtle)
- [ ] Tier name hiển thị "Tân Tín Hữu" không phải "Tia Sáng"
- [ ] Mobile responsive — viewport <768px không bị bể layout
- [ ] Animation: streak flame breathing, page load stagger fade-in

### 6.4 Phase 3 final commit

```
test: HR-9 home redesign full regression (X new tests, baseline Y → Y+X pass)
```

---

## 7. Anti-patterns — Lỗi CẦN TRÁNH

### 7.1 ❌ Đừng tự sáng tạo design

Khi gặp ambiguity, **đọc lại mockup**, đừng "improve". Mockup là spec.

### 7.2 ❌ Đừng dùng Light-based tier names

Tên Light-based ("Tia Sáng / Ánh Bình Minh / ...") có trong SPEC_USER_v3 §3.1 nhưng đã **deprecated**. Dùng:

```
Tân Tín Hữu → Người Tìm Kiếm → Môn Đồ → Hiền Triết → Tiên Tri → Sứ Đồ
```

### 7.3 ❌ Đừng dùng Cormorant Garamond ngoài verse

Chỉ 2 nơi: `.verse-text` và `.verse-text::first-letter`. Tier names, mode titles, banner name — TẤT CẢ dùng Be Vietnam Pro.

### 7.4 ❌ Đừng dùng CSS variables cho design tokens

Hardcode hex. Memory ghi rõ: CSS variables gây white-background rendering bug.

### 7.5 ❌ Đừng skip audit phase

Phase 1 BẮT BUỘC trước Phase 2. Nếu nhảy thẳng vào code → có thể duplicate components đã có (TierProgressBar, DailyMissionsCard).

### 7.6 ❌ Đừng commit gộp nhiều tasks

Mỗi task = 1 commit. Nếu HR-3 + HR-4 commit chung → khó rollback nếu Bui chỉ không thích HR-4.

### 7.7 ❌ Đừng tạo backend changes ngoài audit khuyến nghị

Nếu Phase 1 audit kết luận "ZERO backend changes" → giữ vậy. Nếu audit cần 1 small BE change → hỏi Bui confirm trước khi viết code BE.

### 7.8 ❌ Đừng đụng Sidebar, AppLayout, hay components ngoài Home

Sidebar đã có thiết kế riêng chưa apply. Đừng touch.

### 7.9 ❌ Đừng đổi tên file mà không có lý do

Home.tsx giữ tên Home.tsx. Đừng rename thành HomeV2.tsx hay HomeRedesign.tsx.

### 7.10 ❌ Đừng emoji trong nav/stats — dùng line icons

Line icons stroke-1.5 hoặc 1.6 (per Lucide pattern). Emoji OK cho celebrations/badges, KHÔNG cho UI navigation hay stats.

---

## 8. Stop Checkpoints Summary

| Checkpoint | Sau task | Action | Wait for |
|---|---|---|---|
| CP1 | Phase 1 audit complete | Commit AUDIT_REPORT, dừng | Bui confirm "OK đi tiếp HR-1" |
| CP2 | HR-1 | Commit, dừng | Bui confirm |
| CP3 | HR-2 | Commit, dừng | Bui confirm |
| CP4 | HR-3 | Commit, dừng | Bui confirm |
| CP5 | HR-4 | Commit, dừng | Bui confirm |
| CP6 | HR-5 | Commit, dừng | Bui confirm |
| CP7 | HR-6 | Commit, dừng | Bui confirm |
| CP8 | HR-7 | Commit, dừng + manual UI review | Bui confirm |
| CP9 | HR-8 | Commit, dừng | Bui confirm |
| CP10 | Phase 3 regression | Final report | Bui approve merge |

---

## 9. Estimated effort

- Phase 1 (Audit): 30-60 phút
- Phase 2 (HR-1 → HR-8): 8 tasks × 30-60 phút = 4-8 giờ
- Phase 3 (Regression): 30-60 phút
- **Total: 5-10 giờ thực thi** (chưa kể stop-and-confirm thời gian Bui review)

LOC estimate: ~600-900 (5 new components + Home.tsx refactor + tests + global.css atmosphere).

---

## 10. Output expected sau khi xong

1. ✅ 1 audit report (`HOME_REDESIGN_AUDIT.md`)
2. ✅ 8 implementation commits (HR-1 → HR-8)
3. ✅ 1 regression commit (HR-9)
4. ✅ 5+ component files mới
5. ✅ 1 Home.tsx refactored
6. ✅ 20+ new tests
7. ✅ Trang home thực tế match mockup `home_modern.html`

---

## Phụ lục A — Component file paths checklist

```
apps/web/src/components/
├── FeaturedDailyCard.tsx          [HR-3 NEW]
├── FeaturedDailyCard.module.css   [HR-3 optional]
├── HeroRankedCard.tsx             [HR-4 NEW]
├── HeroRankedCard.module.css      [HR-4 optional]
├── RankedStandardCard.tsx         [HR-5 NEW]
├── SectionHeader.tsx              [HR-6 NEW]
├── DailyCompletedStrip.tsx        [HR-6 NEW]
├── VerseFooter.tsx                [HR-8 NEW]
├── HomeBanner.tsx                 [HR-2 MODIFY hoặc create nếu tách]
├── TierProgressBar.tsx            [KEEP — đã có]
├── DailyMissionsCard.tsx          [KEEP — đã có]
└── __tests__/
    ├── FeaturedDailyCard.test.tsx
    ├── HeroRankedCard.test.tsx
    ├── RankedStandardCard.test.tsx
    ├── SectionHeader.test.tsx
    ├── DailyCompletedStrip.test.tsx
    ├── VerseFooter.test.tsx
    └── HomeBanner.test.tsx

apps/web/src/pages/
├── Home.tsx                       [HR-7 REFACTOR]
└── __tests__/
    ├── Home.test.tsx              [HR-7 UPDATE]
    └── HOME_REDESIGN_AUDIT.md     [HR-1 NEW]

apps/web/src/styles/
└── global.css (or equivalent)     [HR-1 MODIFY]
```

---

## Phụ lục B — Mockup paths reference

```
docs/designs/mockups/home_modern.html        ← MAIN reference (Bui commits this first)
docs/designs/mockups/home_illuminated.html   ← alternative direction (rejected — too serif)
docs/designs/mockups/home_redesign.html      ← earlier 3-variants (superseded)
```

---

*Living prompt — Claude Code follow strictly. Khi gặp vấn đề không cover trong prompt — STOP và hỏi Bui, không tự quyết.*
