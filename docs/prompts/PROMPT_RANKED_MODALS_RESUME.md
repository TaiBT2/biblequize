# PROMPT: Resume Sacred Modernist Modals (Commits 3, 4, 6)

## Context

**BE COMPLETE** as of 2026-05-21:
- `POST /api/ranked/sessions/{id}/answer` returns `weekCompleted` (always), `completedWeek` + `nextWeekBooks` (when true)
- `GET /api/me/coverage-status` returns `unshownBadge` (badge DTO or explicit null)
- `POST /api/me/badges/{badgeId}/mark-shown` — ownership-checked endpoint

**FE COMPLETE** (commits 1+2+5 from `PROMPT_RANKED_MODALS.md`):
- `Modal.tsx` base component
- `PoolExhaustedModal.tsx` with i18n + Ranked.tsx wire
- 12 unit tests passing

**This PROMPT covers remaining 3 commits:**
- Commit 3: WeekCompleteModal
- Commit 4: BadgeAwardModal
- Commit 6: Playwright E2E full suite

---

## Canonical constraints (Bui-locked)

- Spec: `docs/spec/SPEC_USER_v3.2.md §7`
- Design: Sacred Modernist — hardcoded hex (#11131e bg, #e8a832 gold), Be Vietnam Pro + Cormorant Garamond italic (sacred moments only)
- No CSS variables (white-bg rendering bug per memory)
- NO `alert()` introduced
- Reuse `Modal.tsx` base (shipped Commit 1)
- i18n strict — no hard-coded Vietnamese strings

---

## ⚠️ CRITICAL UX DECISION (Bui-confirmed 2026-05-21)

**WeekCompleteModal display timing: Option B (defer to results page)**

Ranked session = batch 10 questions. `weekCompleted: true` can fire on question 7/10. Three options were considered:

| Option | Behavior | Verdict |
|---|---|---|
| A — Show ngay giữa quiz | Modal blocks q8-10 | ❌ Phá flow 10-câu |
| **B — Defer to results page** | Carry flag via navigation state | ✅ **CHOSEN** |
| C — Show after explanation | Bật giữa 2 câu | ⚠️ Vẫn ngắt mạch |

**Implementation:**
- **Capture:** `apps/web/src/pages/Quiz.tsx:310` — read `data.weekCompleted`, `data.completedWeek`, `data.nextWeekBooks` from submit-answer response
- **Carry:** Pass via navigation state when transitioning to results
- **Display:** `apps/web/src/pages/RankedQuizResults.tsx` — render WeekCompleteModal AFTER user views their session results

**Reference pattern:** `RankedQuizResults.tsx:58` comment notes "from the last submitRankedAnswer response" — pattern already exists for carrying data from Quiz → Results. Follow this precedent.

---

## Phase 1: Pre-flight audit (Read-only, MUST DO FIRST)

### 1.1 Grep wire points

```bash
# Confirm Quiz.tsx submit handler structure
grep -n "submitAnswer\|sessions.*answer\|rankedResponse" apps/web/src/pages/Quiz.tsx

# Confirm navigation pattern Quiz → Results
grep -n "navigate.*Results\|useNavigate\|navigate.*state" apps/web/src/pages/Quiz.tsx

# Confirm RankedQuizResults receives data via state
grep -n "useLocation\|location.state\|state\." apps/web/src/pages/RankedQuizResults.tsx

# Confirm CoverageStatus hook structure
grep -n "useCoverageStatus\|unshownBadge" apps/web/src/

# Confirm i18n base structure
grep -A 5 "\"ranked\":" apps/web/src/i18n/locales/vi.json
```

### 1.2 Type definitions check

Verify types match BE actual response:

```bash
grep -rn "weekCompleted\|completedWeek\|nextWeekBooks" apps/web/src/types/
grep -rn "unshownBadge\|UnshownBadge\|BadgeTier" apps/web/src/types/
```

If types missing or outdated → flag in audit summary, will need type update before Commit 3.

### 1.3 Audit summary deliverable

Inline trong response:

```markdown
## Pre-flight Audit Summary

### Quiz.tsx submit handler
- File:line: `apps/web/src/pages/Quiz.tsx:310-311`
- Response variable name: `data` (or actual)
- Existing pattern for carrying data to Results: [describe]

### Navigation Quiz → Results
- Pattern: `navigate('/ranked/results', { state: {...} })` at `file:line`
- Existing state fields: [list]

### RankedQuizResults state consumption
- Hook: `useLocation()` at `file:line`
- Existing state fields read: [list]

### useCoverageStatus
- File:line: `apps/web/src/hooks/useCoverageStatus.ts`
- Returns shape: [paste type]
- Already includes `unshownBadge`? [yes/no — if no, update type]

### Type definitions status
| Type | File:line | Up to date? |
|---|---|---|
| Submit answer response | [path] | [yes/no — needs weekCompleted/completedWeek/nextWeekBooks] |
| Coverage status response | [path] | [yes/no — needs unshownBadge] |

### Open questions for Bui
1. [Anything ambiguous]
```

**STOP after audit. Wait for Bui review if discrepancies found.**

If audit clean → proceed Phase 2.

---

## Phase 2: Implementation

### Commit 3: WeekCompleteModal (Option B wire pattern)

**Files:**
- `apps/web/src/components/ranked/WeekCompleteModal.tsx` — TO CREATE
- `apps/web/src/types/ranked.ts` or similar — UPDATE (add weekCompleted fields to submit response type)
- `apps/web/src/pages/Quiz.tsx` — UPDATE (capture + carry to navigation state)
- `apps/web/src/pages/RankedQuizResults.tsx` — UPDATE (read state + render modal)
- `apps/web/src/i18n/locales/vi.json` — UPDATE
- `apps/web/src/i18n/locales/en.json` — UPDATE

#### 3.1 Type update first

Add fields to submit-answer response type:

```typescript
// In apps/web/src/types/ranked.ts (or wherever submit response type lives)
export interface RankedAnswerResponse {
  // ... existing fields ...
  weekCompleted: boolean;         // always present
  completedWeek?: number;          // present if weekCompleted=true
  nextWeekBooks?: string[];        // present if next week exists
}
```

#### 3.2 Component spec

```tsx
interface WeekCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedWeek: number;
  nextWeekBooks: string[];         // empty array if at week 13 (Mastery, no next)
  onStartNextWeek: () => void;     // Calls unlockNextWeek mutation
}
```

**Layout:**

```
┌─────────────────────────────────┐
│         ┌──────────┐             │
│         │  ✓ 80px   │             │
│         │ gold glow │             │
│         └──────────┘             │
│                                  │
│      HOÀN THÀNH TUẦN [N]         │
│      [11px uppercase gold]       │
│                                  │
│      Chinh phục 6 sách           │
│      [22px Be Vietnam Pro 800]   │
│                                  │
│   "[Verse Vietnamese]"           │
│   [Cormorant Garamond italic]    │
│                                  │
│   ┌─────────────────────────┐   │
│   │ TUẦN [N+1] MỞ KHÓA      │   │
│   │ [Book pills wrap]        │   │
│   └─────────────────────────┘   │
│                                  │
│   ┌─────────────────────────┐   │
│   │ ▶ BẮT ĐẦU TUẦN [N+1]    │   │
│   └─────────────────────────┘   │
│   ┌─────────────────────────┐   │
│   │ Để mai chơi              │   │
│   └─────────────────────────┘   │
│                                  │
└─────────────────────────────────┘
```

**Conditional rendering:**

- If `nextWeekBooks.length === 0` (user at week 13 Mastery Week):
  - Hide "TUẦN N+1 MỞ KHÓA" preview card
  - Hide "BẮT ĐẦU TUẦN N+1" CTA
  - Show only "Đóng" CTA + slightly different verse (cuối mùa context)

- Else (normal week complete):
  - Full layout with next week preview + 2 CTAs

**Style requirements (hardcoded hex per Sacred Modernist):**

- Celebration mark: 80px circle, radial `rgba(232, 168, 50, 0.3)` outer + gold gradient inner
- Check icon: Material Symbols `check`, 36px, filled, color `#11131e`
- Heading sm: 11px uppercase letter-spacing 0.2em, color `#e8a832`, weight 700
- Heading lg: 22px Be Vietnam Pro 800, color `#ffffff`
- Verse: Cormorant Garamond italic 16px, color `#c5c8d8`, line-height 1.4
- Next week card: bg `rgba(232, 168, 50, 0.08)`, border `rgba(232, 168, 50, 0.2)`, radius 12px
- Book pills: bg `rgba(232, 168, 50, 0.15)`, border `rgba(232, 168, 50, 0.3)`, radius 6px, padding 3px 8px, font 11px gold weight 600
- Primary CTA: gold gradient `linear-gradient(135deg, #e8a832, #d4951f)`, dark text
- Secondary CTA: outline transparent

**Verse rotation (deterministic per `completedWeek % 4`):**

```typescript
const verses = [
  i18n.t('ranked.week_complete.verses.0'),
  i18n.t('ranked.week_complete.verses.1'),
  i18n.t('ranked.week_complete.verses.2'),
  i18n.t('ranked.week_complete.verses.3'),
];
const verse = verses[completedWeek % verses.length];
```

#### 3.3 i18n keys

```json
{
  "ranked": {
    "week_complete": {
      "heading_sm": "HOÀN THÀNH TUẦN {{week}}",
      "heading_lg": "Chinh phục 6 sách",
      "next_week_label": "Tuần {{next}} mở khóa",
      "start_next_cta": "Bắt đầu tuần {{next}}",
      "defer_cta": "Để mai chơi",
      "close_cta": "Đóng",
      "mastery_week_heading": "Hoàn thành Tuần Hoàn Thiện",
      "mastery_week_body": "Bạn đã chinh phục tuần cuối của mùa.",
      "verses": [
        "Hỡi linh hồn ta, hãy ngợi khen Đức Giê-hô-va.",
        "Lời Chúa là ngọn đèn cho chân tôi.",
        "Hãy vui mừng luôn luôn trong Chúa.",
        "Phước cho người làm xong việc hôm nay."
      ]
    }
  }
}
```

```json
{
  "ranked": {
    "week_complete": {
      "heading_sm": "WEEK {{week}} COMPLETE",
      "heading_lg": "Conquered 6 books",
      "next_week_label": "Week {{next}} unlocked",
      "start_next_cta": "Start week {{next}}",
      "defer_cta": "Come back tomorrow",
      "close_cta": "Close",
      "mastery_week_heading": "Mastery Week Complete",
      "mastery_week_body": "You conquered the final week of the season.",
      "verses": [
        "Bless the Lord, O my soul.",
        "Your word is a lamp to my feet.",
        "Rejoice in the Lord always.",
        "Blessed is the one who finishes their work today."
      ]
    }
  }
}
```

#### 3.4 Wire pattern — Quiz.tsx (capture)

**At `Quiz.tsx:310` (or wherever submit-answer response is read):**

```tsx
// Existing pattern (don't modify):
const data = await api.submitRankedAnswer(...);
// ... existing handling ...

// NEW — capture weekCompleted data
if (data.weekCompleted) {
  setWeekCompletionData({
    completedWeek: data.completedWeek!,
    nextWeekBooks: data.nextWeekBooks ?? [],
  });
}
```

**Use local state to hold completion data through batch:**

```tsx
const [weekCompletionData, setWeekCompletionData] = useState<{
  completedWeek: number;
  nextWeekBooks: string[];
} | null>(null);
```

**When transitioning to results (existing navigation code):**

```tsx
// Find existing navigate() call to RankedQuizResults
navigate('/ranked/results', {
  state: {
    // ... existing state fields (rankedResponse data etc.) ...
    weekCompletion: weekCompletionData,  // NEW
  }
});
```

#### 3.5 Wire pattern — RankedQuizResults.tsx (display)

**Read from location state:**

```tsx
const location = useLocation();
const weekCompletion = location.state?.weekCompletion as {
  completedWeek: number;
  nextWeekBooks: string[];
} | undefined;

const [weekModalOpen, setWeekModalOpen] = useState(false);

useEffect(() => {
  if (weekCompletion) {
    // Show modal after user has had time to see results (small delay for UX)
    const timer = setTimeout(() => setWeekModalOpen(true), 800);
    return () => clearTimeout(timer);
  }
}, [weekCompletion]);

// Handler for unlock next week CTA
const handleStartNextWeek = async () => {
  try {
    await unlockNextWeekMutation.mutateAsync();
    setWeekModalOpen(false);
    navigate('/ranked');  // back to Ranked entry, will load new week
  } catch (e) {
    // Handle error gracefully
  }
};

return (
  <>
    {/* Existing results UI */}
    
    {weekCompletion && (
      <WeekCompleteModal
        isOpen={weekModalOpen}
        onClose={() => setWeekModalOpen(false)}
        completedWeek={weekCompletion.completedWeek}
        nextWeekBooks={weekCompletion.nextWeekBooks}
        onStartNextWeek={handleStartNextWeek}
      />
    )}
  </>
);
```

#### 3.6 Acceptance

- [ ] Modal does NOT appear during Quiz session (no q8-10 blocking)
- [ ] Modal appears on RankedQuizResults page, ~800ms after mount
- [ ] Verse rotates deterministic by `completedWeek % 4`
- [ ] 6 book pills wrap correctly in container
- [ ] Mastery Week scenario (nextWeekBooks empty) shows simplified layout
- [ ] Tap "BẮT ĐẦU TUẦN [N+1]" → unlockNextWeek mutation → navigate /ranked
- [ ] Tap "Để mai chơi" → modal closes → user stays on results page
- [ ] No TypeScript errors
- [ ] i18n vi/en both work

#### 3.7 Telemetry

Per SPEC §7.16.1, `week_completed` event fires from **BE** when transition happens (already wired in Commit 1 BE). FE does NOT need to fire — BE handles canonical event.

FE can optionally track `week_complete_modal_shown` for product analytics if needed. Default: skip, BE event sufficient.

#### 3.8 Commit message

```
feat(ranked): WeekCompleteModal with Option B defer-to-results pattern

Capture weekCompleted/completedWeek/nextWeekBooks in Quiz.tsx submit handler.
Carry via navigation state to RankedQuizResults.tsx.
Display modal ~800ms after results mount (no quiz interruption).

Sacred Modernist style: gold celebration mark, Cormorant italic verse,
6 book pills for next week preview, 2 CTAs (unlock | defer).

Mastery Week scenario handled (nextWeekBooks empty → simplified layout).
Deterministic verse rotation by completedWeek % 4.

Refs: SPEC_USER_v3.2 §7.1.5, §7.16.1
UX decision: Option B (Bui 2026-05-21) — defer to results to preserve 10-câu batch flow
```

---

### Commit 4: BadgeAwardModal

**Files:**
- `apps/web/src/components/ranked/BadgeAwardModal.tsx` — TO CREATE
- `apps/web/src/hooks/useMarkBadgeShown.ts` — TO CREATE (mutation hook)
- `apps/web/src/types/coverage.ts` — UPDATE (unshownBadge type if missing)
- `apps/web/src/pages/Ranked.tsx` (or root layout) — UPDATE (badge modal trigger)
- `apps/web/src/i18n/locales/vi.json` — UPDATE
- `apps/web/src/i18n/locales/en.json` — UPDATE

#### 4.1 Type definitions

```typescript
// apps/web/src/types/coverage.ts
export type BadgeTier = 'TOAN_THU' | 'TAN_TAM' | 'HANH_HUONG';

export interface UnshownBadge {
  id: string;                  // For markAsShown call
  badgeTier: BadgeTier;
  seasonCode: 'EASTER' | 'PENTECOST' | 'THANKSGIVING' | 'CHRISTMAS';
  booksCovered: number;
  totalQuestions: number;
  accuracy: number;            // 0-100
  daysActive: number;
}

export interface CoverageStatusResponse {
  // ... existing fields ...
  unshownBadge: UnshownBadge | null;
}
```

#### 4.2 Component spec

```tsx
interface BadgeAwardModalProps {
  isOpen: boolean;
  onClose: () => void;          // Calls markAsShown then closes
  badge: UnshownBadge;
  onShare?: () => void;         // Optional share action — defer impl v1.1
}
```

**3-tier visual hierarchy:**

| Tier | Icon (Material Symbols) | Mark size | Glow | Heading style |
|---|---|---|---|---|
| TOAN_THU | `auto_stories` | 120px | strong gold | Cormorant italic + gradient text-fill |
| TAN_TAM | `star` | 100px | medium gold | Be Vietnam Pro bold solid gold |
| HANH_HUONG | `volunteer_activism` | 80px | subtle gold | Be Vietnam Pro bold simple |

**Layout (Toàn Thư example):**

```
┌─────────────────────────────────┐
│        ┌────────────┐            │
│        │  120px     │            │
│        │ strong glow│            │
│        │   👑       │            │
│        └────────────┘            │
│                                  │
│      BẠN ĐÃ ĐẠT ĐƯỢC             │
│      [11px uppercase gold]       │
│                                  │
│      Toàn Thư                    │
│      [26px Cormorant italic     │
│       gradient gold text-fill]   │
│                                  │
│      Mùa Phục Sinh 2026          │
│      [13px gray]                 │
│                                  │
│   "[Verse Cormorant italic]"     │
│                                  │
│   ┌──────┬──────┬──────┬──────┐ │
│   │  66  │1,247 │ 82%  │  87  │ │
│   │ Sách │ Câu  │ Acc  │Ngày  │ │
│   └──────┴──────┴──────┴──────┘ │
│                                  │
│   ┌─────────────────────────┐   │
│   │ 📤 CHIA SẺ THÀNH TỰU   │   │
│   └─────────────────────────┘   │
│   ┌─────────────────────────┐   │
│   │ Đóng                    │   │
│   └─────────────────────────┘   │
│                                  │
└─────────────────────────────────┘
```

**Style by tier:**

```tsx
const tierStyles = {
  TOAN_THU: {
    icon: 'auto_stories',
    markSize: 120,
    glowColor: 'rgba(232, 168, 50, 0.7)',
    headingFontFamily: 'Cormorant Garamond, serif',
    headingFontStyle: 'italic',
    headingStyle: 'gradient',  // text-fill gradient
  },
  TAN_TAM: {
    icon: 'star',
    markSize: 100,
    glowColor: 'rgba(232, 168, 50, 0.5)',
    headingFontFamily: 'Be Vietnam Pro, sans-serif',
    headingFontStyle: 'normal',
    headingStyle: 'solid_gold',  // color: #e8a832
  },
  HANH_HUONG: {
    icon: 'volunteer_activism',
    markSize: 80,
    glowColor: 'rgba(232, 168, 50, 0.3)',
    headingFontFamily: 'Be Vietnam Pro, sans-serif',
    headingFontStyle: 'normal',
    headingStyle: 'solid_gold',  // color: #e8a832, smaller size
  },
};
```

#### 4.3 i18n keys (locked verses per badge tier — Q3 Option A 2026-05-21)

```json
{
  "ranked": {
    "badge_award": {
      "heading_sm": "BẠN ĐÃ ĐẠT ĐƯỢC",
      "season_name": {
        "EASTER": "Mùa Phục Sinh {{year}}",
        "PENTECOST": "Mùa Ngũ Tuần {{year}}",
        "THANKSGIVING": "Mùa Cảm Tạ {{year}}",
        "CHRISTMAS": "Mùa Giáng Sinh {{year}}"
      },
      "tier_name": {
        "TOAN_THU": "Toàn Thư",
        "TAN_TAM": "Tận Tâm",
        "HANH_HUONG": "Hành Hương"
      },
      "verses": {
        "TOAN_THU": "Lời Chúa là ngọn đèn cho chân tôi, ánh sáng cho đường lối tôi.",
        "TAN_TAM": "Hỡi linh hồn ta, hãy ngợi khen Đức Giê-hô-va.",
        "HANH_HUONG": "Hãy đi và làm cho muôn dân trở nên môn đồ ta."
      },
      "stats": {
        "books": "Sách",
        "questions": "Câu",
        "accuracy": "Độ chính xác",
        "days": "Ngày"
      },
      "share_cta": "Chia sẻ thành tựu",
      "close_cta": "Đóng"
    }
  }
}
```

EN version mirror structure.

#### 4.4 useMarkBadgeShown hook

```tsx
// apps/web/src/hooks/useMarkBadgeShown.ts
export function useMarkBadgeShown() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (badgeId: string) => {
      await api.post(`/api/me/badges/${badgeId}/mark-shown`);
    },
    onSuccess: () => {
      // Invalidate coverage-status to clear unshownBadge field
      queryClient.invalidateQueries({ queryKey: ['coverage-status'] });
    },
  });
}
```

#### 4.5 Wire pattern — Ranked.tsx (or root layout)

```tsx
const { data: coverageStatus } = useCoverageStatus();
const markShown = useMarkBadgeShown();

const [badgeModalOpen, setBadgeModalOpen] = useState(false);
const [activeBadge, setActiveBadge] = useState<UnshownBadge | null>(null);

useEffect(() => {
  if (coverageStatus?.unshownBadge && !badgeModalOpen) {
    setActiveBadge(coverageStatus.unshownBadge);
    setBadgeModalOpen(true);
  }
}, [coverageStatus?.unshownBadge?.id]);  // dep on ID to handle multi-season scenarios

const handleBadgeClose = async () => {
  if (activeBadge) {
    try {
      await markShown.mutateAsync(activeBadge.id);
    } catch (e) {
      // Log but don't block close — user can mark via next session
      console.error('Mark badge shown failed', e);
    }
  }
  setBadgeModalOpen(false);
  setActiveBadge(null);
};

return (
  <>
    {/* Existing Ranked UI */}
    
    {activeBadge && (
      <BadgeAwardModal
        isOpen={badgeModalOpen}
        onClose={handleBadgeClose}
        badge={activeBadge}
      />
    )}
  </>
);
```

#### 4.6 Acceptance

- [ ] Modal triggers on Ranked page mount if unshownBadge present
- [ ] Visual hierarchy correct per tier (Toàn Thư > Tận Tâm > Hành Hương)
- [ ] Cormorant italic + gradient text-fill works for TOAN_THU only
- [ ] Verse correct per badge tier (locked Q3 Option A)
- [ ] Stats grid renders all 4 cells with correct values
- [ ] Season name interpolation works (vd "Mùa Phục Sinh 2026")
- [ ] On close → markAsShown API called → coverage-status invalidated → no re-trigger
- [ ] If markAsShown fails → modal still closes (graceful degrade)
- [ ] Share button calls `onShare` callback (impl deferred to v1.1 — pass `() => {}` for now)
- [ ] Cross-browser test: gradient text-fill works Chrome + Firefox + Safari

#### 4.7 Telemetry

BE fires `season_badge_awarded` event when badge created (already wired Commit 4 BE).

FE can optionally fire `badge_modal_viewed` for product analytics. Default: skip.

#### 4.8 Commit message

```
feat(ranked): BadgeAwardModal with 3-tier visual hierarchy

Trigger: coverageStatus.unshownBadge present on Ranked.tsx mount.
On close: POST /api/me/badges/{id}/mark-shown + invalidate coverage cache.

Visual hierarchy:
- TOAN_THU (66/66): 120px mark, Cormorant italic + gradient text-fill
- TAN_TAM (51-65): 100px mark, solid gold bold heading
- HANH_HUONG (21-50): 80px mark, simple solid gold

Verses locked per tier (SPEC §7.14 Q3 Option A 2026-05-21).
Stats grid: books / questions / accuracy / days.

Refs: SPEC_USER_v3.2 §7.1.8, §7.16.1
Unblocks: full Sacred Modernist modal suite shipped
```

---

### Commit 6: Playwright E2E full suite

**Files:**
- `apps/web/e2e/ranked/coverage-modals.spec.ts` — TO CREATE

**E2E scenarios per SPEC §7.15.3:**

#### W-M07-002: Week complete flow

```typescript
test('W-M07-002: User completes week → modal on results → unlocks next week', async ({ page }) => {
  // Setup: seed test user with 5/6 books covered in current week
  await seedTestUser(page, {
    coverage: { weekNumber: 3, booksCovered: 5, threshold: 4 }
  });
  
  // Action: Play Ranked session that ticks 6th book to ≥4
  await page.goto('/ranked');
  await page.click('button:has-text("Bắt đầu")');
  // ... answer questions sufficient to complete week ...
  
  // Assert: NO modal during Quiz
  await expect(page.locator('[role="dialog"][aria-label*="tuần"]')).not.toBeVisible();
  
  // Continue to results page (finish 10 câu)
  await completeAllQuestions(page);
  
  // Assert: Modal appears on results page after ~800ms
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('text=HOÀN THÀNH TUẦN 3')).toBeVisible();
  await expect(page.locator('text=Chinh phục 6 sách')).toBeVisible();
  
  // Verify next week books displayed
  await expect(page.locator('.book-pill')).toHaveCount(6);
  
  // Action: Tap "BẮT ĐẦU TUẦN 4"
  await page.click('button:has-text("Bắt đầu tuần 4")');
  
  // Assert: Navigate back to Ranked with week 4 active
  await expect(page).toHaveURL('/ranked');
  await expect(page.locator('text=Tuần 4')).toBeVisible();
});
```

#### W-M07-007: Pool exhaustion modal

```typescript
test('W-M07-007: Pool exhaustion → modal with conditional CTAs', async ({ page }) => {
  // Setup: seed user with tiny pool for current week
  await seedTestUser(page, { 
    coverage: { weekNumber: 1, allBooksCovered: false },
    smallPool: true  // helper to set up exhaustion scenario
  });
  
  await page.goto('/ranked');
  await page.click('button:has-text("Bắt đầu")');
  
  // Answer until pool exhausted
  await exhaustQuestionPool(page);
  
  // Assert: PoolExhaustedModal shown
  await expect(page.locator('text=Pool Tuần Cạn')).toBeVisible();
  
  // Scenario A: canUnlockNext = true → 2 CTAs
  // (If test user completed current week earlier)
  await expect(page.locator('button:has-text("Sang Tuần Kế Tiếp")')).toBeVisible();
  await expect(page.locator('button:has-text("Để mai chơi")')).toBeVisible();
  
  // Action: Tap unlock
  await page.click('button:has-text("Sang Tuần Kế Tiếp")');
  
  // Assert: Modal closes, next week loaded
  await expect(page.locator('text=Pool Tuần Cạn')).not.toBeVisible();
});
```

#### W-M07-008: Badge award flow

```typescript
test('W-M07-008: Season end → badge modal → mark shown', async ({ page }) => {
  // Setup: seed user with completed season + unshown badge
  await seedTestUser(page, {
    completedSeason: {
      code: 'EASTER',
      booksCovered: 66,
      badgeTier: 'TOAN_THU'
    }
  });
  
  // Action: Navigate to Ranked
  await page.goto('/ranked');
  
  // Assert: BadgeAwardModal appears
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('text=BẠN ĐÃ ĐẠT ĐƯỢC')).toBeVisible();
  await expect(page.locator('text=Toàn Thư')).toBeVisible();
  
  // Assert: TOAN_THU visual hierarchy (gradient text-fill check)
  const heading = page.locator('text=Toàn Thư');
  // Note: CSS gradient text-fill is hard to assert directly
  // Use class/data attribute check instead
  await expect(heading).toHaveClass(/badge-tier-toan-thu/);
  
  // Assert: 4-stat grid present
  await expect(page.locator('.badge-stat')).toHaveCount(4);
  
  // Action: Close modal
  await page.click('button:has-text("Đóng")');
  
  // Assert: API called
  await page.waitForResponse(resp => 
    resp.url().includes('/mark-shown') && resp.status() === 200
  );
  
  // Reload page → modal should NOT reappear
  await page.reload();
  await expect(page.locator('text=Toàn Thư')).not.toBeVisible();
});
```

#### Additional helpers needed

```typescript
// apps/web/e2e/helpers/coverage.ts
export async function seedTestUser(page: Page, opts: SeedOptions): Promise<void> { ... }
export async function completeAllQuestions(page: Page): Promise<void> { ... }
export async function exhaustQuestionPool(page: Page): Promise<void> { ... }
```

#### Commit message

```
test(e2e): coverage modals W-M07 suite

W-M07-002: WeekComplete modal via Option B (defer to results)
W-M07-007: PoolExhausted modal with conditional CTAs
W-M07-008: BadgeAward modal + mark-shown flow

Helpers for seed test users, complete questions, exhaust pool.

Refs: SPEC_USER_v3.2 §7.15.3
```

---

## Phase 3: Manual QA checklist

After all 3 commits merged:

### WeekCompleteModal
- [ ] Modal does NOT appear during Quiz session
- [ ] Modal appears on results page ~800ms after mount
- [ ] Verse rotates: completedWeek=1 → verse[1], week=2 → verse[2], etc.
- [ ] 6 book pills wrap correctly on narrow screens
- [ ] Mastery Week (week 13) → simplified layout
- [ ] "BẮT ĐẦU TUẦN N+1" navigates correctly

### BadgeAwardModal
- [ ] TOAN_THU: Cormorant italic + gradient gold text-fill visible
- [ ] TAN_TAM: Solid gold bold heading
- [ ] HANH_HUONG: Simple solid gold smaller heading
- [ ] Stats grid: all 4 values correct
- [ ] Close → mark-shown API called → modal doesn't re-appear on reload
- [ ] Cross-browser: gradient text-fill works in Chrome + Firefox + Safari

### Integration
- [ ] No alert() in Ranked flow (`grep -r "alert(" apps/web/src/pages/Ranked.tsx apps/web/src/pages/Quiz.tsx`)
- [ ] All 3 modals (Pool/Week/Badge) use Modal base component
- [ ] i18n vi/en switch works for all modals
- [ ] Esc key closes all modals
- [ ] Focus trap works (Tab cycles)

---

## Rules cho Claude Code

1. **Verification-first:** Phase 1 audit BEFORE code.

2. **Reuse Modal base:** Don't recreate base modal — use shipped `Modal.tsx`.

3. **Hardcoded hex only:** Per memory rule.

4. **Option B wire pattern:** WeekComplete deferred to RankedQuizResults, NOT shown in Quiz. This is non-negotiable per Bui's UX decision.

5. **Separate commits:** 3 commits independent, rollback-safe.

6. **No backend changes:** All BE work done. If BE field missing → raise as gap, don't workaround.

7. **i18n strict:** No hard-coded Vietnamese strings.

8. **Telemetry:** BE handles canonical events. FE optional tracking only.

9. **Accessibility:** Focus trap, Esc key, ARIA labels.

10. **Mobile responsive:** Modals fit small screens (test 375px width).

---

## Done criteria

- [ ] Phase 1 audit summary delivered inline
- [ ] 3 commits merged (WeekComplete + BadgeAward + E2E)
- [ ] Manual QA passed
- [ ] 0 alert() in Ranked flow
- [ ] All modals match Sacred Modernist (hardcoded hex)
- [ ] E2E suite W-M07-002/007/008 passing

When done, output:
> "Sacred Modernist modal suite complete. 3 modals shipped (Pool/Week/Badge). 0 alert() in Ranked flow. E2E W-M07-002/007/008 passing."

Then STOP — Bui review before merging.

---

## NOTE

After this PROMPT done:

**Web FE launch-ready** ✅
**Mobile FE pending** — `PROMPT_MOBILE_RANKED_MIGRATE.md` còn chờ (Bui Q3 = b = ship web first, mobile follow)

**Pre-launch remaining:**
1. Focus books Q2/Q3/Q4 confirmation (Bui + FMC ministry team)
2. Mobile RankedScreen migration (per PROMPT_MOBILE_RANKED_MIGRATE)
3. Beta test FMC users 2 weeks
4. Telemetry baseline monitoring setup

Path to launch: ~5-7 ngày work remaining (modals ~2.5 ngày + mobile ~2-2.5 ngày).
