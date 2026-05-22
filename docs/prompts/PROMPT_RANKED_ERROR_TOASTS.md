# PROMPT: Replace 4 error-path alert() with Sacred Modernist Toast System

## Mục tiêu

Replace 4 browser `alert()` calls còn lại trong Ranked flow bằng custom toast notification system match Sacred Modernist design. Đây là follow-up cho PROMPT_RANKED_MODALS — modal system đã ship cho 3 user-facing flows (Pool/Week/Badge), giờ error-path UX cần consistency.

## Context

**Status sau PROMPT_RANKED_MODALS:**
- ✅ Modal base + 3 user-flow modals shipped (Pool/Week/Badge)
- ⚠️ 4 alert() còn lại trong error paths:
  - `Ranked.tsx:71` — unlockError (failed to unlock next week)
  - `Ranked.tsx:112` — noQuestionsLeft (pool empty edge case)
  - `Ranked.tsx:135` — cannotStart (session creation failed)
  - `Quiz.tsx:287` — quiz.noQuestions (boot error)

Đây là **error-path alerts**, không phải user celebration moments → toast pattern phù hợp hơn modal (less intrusive, auto-dismiss).

**Output:** 1 toast system + 4 wire updates = 5 commits separate.

---

## Canonical constraints (Bui-locked)

- Spec authority: `docs/spec/SPEC_USER_v3.2.md §7`
- Design: Sacred Modernist — hardcoded hex (#11131e bg, #e8a832 gold), Be Vietnam Pro font
- No CSS variables (white-bg rendering bug per memory)
- NO `alert()` introduced
- 4 toast types needed:
  - `error` — red accent
  - `warning` — amber accent
  - `info` — gold accent (default)
  - `success` — green accent (future use)

---

## Verification-first protocol

Mọi file path có `file:line` evidence. Grep before assuming.

---

## Phase 1: Pre-flight audit (Read-only)

### 1.1 Find existing toast/notification infrastructure

```bash
# Check if app already has toast library
grep -rn "react-hot-toast\|sonner\|react-toastify" apps/web/package.json apps/web/src/
grep -rn "useToast\|toast\." apps/web/src/ | head -20

# Check existing notification patterns
grep -rn "Toast\|Notification\|Snackbar" apps/web/src/components/
```

Determine:
- (A) Library exists → reuse + customize style → 1 commit setup
- (B) No library → build minimal custom toast → 1 commit foundation

### 1.2 Find all alert() locations

```bash
grep -rn "alert(" apps/web/src/pages/Ranked.tsx apps/web/src/pages/Quiz.tsx
grep -rn "alert(" apps/web/src/components/ranked/
grep -rn "alert(" apps/web/src/hooks/useRanked*.ts
```

Verify 4 alerts match Bui's report. Identify any additional alerts in Ranked-adjacent files.

### 1.3 Find existing error toast keys in i18n

```bash
grep -n "error\|warning\|toast" apps/web/src/i18n/locales/vi.json | head -20
```

Confirm what error message text currently exists.

### 1.4 Audit summary inline

```markdown
## Toast System Audit Summary

### Toast infrastructure
- Library present: [yes - name / no]
- File:line: [if yes]
- Customization needed: [theme override / wrap component]

### alert() locations confirmed
| File:line | Trigger | Current message |
|---|---|---|
| Ranked.tsx:71 | unlockError | "[text]" |
| Ranked.tsx:112 | noQuestionsLeft | "[text]" |
| Ranked.tsx:135 | cannotStart | "[text]" |
| Quiz.tsx:287 | quiz.noQuestions | "[text]" |

### Additional alerts found
[Any not in Bui's list]

### i18n keys existing
- `ranked.errors.*` exists? [yes/no]
- Pattern for error messages: [snake_case / camelCase / kebab-case]

### Open questions for Bui
1. [If toast library exists, use it or replace?]
```

**STOP after audit. Wait for Bui review.**

---

## Phase 2: Implementation

### Commit 1: Toast component foundation

**Files (depend on Phase 1 finding):**

**Path A — Reuse existing library (vd react-hot-toast):**
- `apps/web/src/lib/toast.ts` — wrapper với Sacred Modernist style overrides
- Effort: ~2 hours

**Path B — Build minimal custom toast:**
- `apps/web/src/components/ui/Toast.tsx` — TO CREATE
- `apps/web/src/contexts/ToastContext.tsx` — TO CREATE
- `apps/web/src/hooks/useToast.ts` — TO CREATE
- Effort: ~4 hours

Default assumption: Path B (build minimal) unless audit finds library.

#### Component spec (Path B)

```tsx
// types
type ToastType = 'error' | 'warning' | 'info' | 'success';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;  // default 4000ms, 0 = manual dismiss
}

// Hook API
const { showToast, dismissToast } = useToast();

showToast({
  type: 'error',
  message: t('ranked.errors.unlock_failed'),
  duration: 4000,
});
```

#### Layout

```
┌─────────────────────────────────────┐
│ Top-right of viewport               │
│                                      │
│  ┌──────────────────────────────┐  │
│  │ ⚠  Không thể mở khóa tuần   │  │
│  │    kế tiếp                  ✕│  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ ℹ  Đã hết câu hỏi cho ngày  ✕│  │
│  └──────────────────────────────┘  │
│                                      │
└─────────────────────────────────────┘
```

#### Style requirements (hardcoded hex)

**Container (top-right viewport):**
```css
position: fixed;
top: 24px;
right: 24px;
z-index: 10000;
display: flex;
flex-direction: column;
gap: 12px;
max-width: 380px;
```

**Toast item base:**
```css
background: rgba(20, 22, 32, 0.95);
border: 1px solid rgba(232, 168, 50, 0.2);
border-radius: 12px;
padding: 12px 16px;
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
display: flex;
align-items: flex-start;
gap: 12px;
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
animation: slideInRight 0.3s ease;
```

**Type accents (left border 3px):**
```css
.toast-error    { border-left: 3px solid #c54a4a; }
.toast-warning  { border-left: 3px solid #d4951f; }
.toast-info     { border-left: 3px solid #e8a832; }
.toast-success  { border-left: 3px solid #4a9d6c; }
```

**Icon (Material Symbols):**
```css
font-size: 20px;
flex-shrink: 0;
```

| Type | Icon | Color |
|---|---|---|
| error | `error` | #c54a4a |
| warning | `warning` | #d4951f |
| info | `info` | #e8a832 |
| success | `check_circle` | #4a9d6c |

**Message text:**
```css
font-family: 'Be Vietnam Pro', sans-serif;
font-size: 14px;
font-weight: 500;
color: #e4e6f0;
line-height: 1.4;
flex: 1;
```

**Close button:**
```css
background: transparent;
border: none;
color: #8a8da0;
cursor: pointer;
padding: 4px;
border-radius: 4px;
transition: color 0.2s, background 0.2s;
```

```css
.close-btn:hover {
  color: #e4e6f0;
  background: rgba(255, 255, 255, 0.05);
}
```

**Animations:**
```css
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
```

#### Auto-dismiss + manual dismiss

```tsx
useEffect(() => {
  if (duration > 0) {
    const timer = setTimeout(() => dismissToast(id), duration);
    return () => clearTimeout(timer);
  }
}, [id, duration]);
```

#### ToastContext provider

```tsx
// Wrap app in main.tsx or App.tsx
<ToastProvider>
  <App />
</ToastProvider>
```

#### Acceptance

- [ ] Toast stacks top-right of viewport (max 3-4 visible, queue extras)
- [ ] Auto-dismiss after 4000ms by default
- [ ] Manual dismiss via close button
- [ ] Esc key dismisses most recent toast
- [ ] Multiple toasts stack with 12px gap
- [ ] Animation slideInRight on mount, slideOutRight on dismiss
- [ ] Type accents render correct color
- [ ] No CSS variables — all hex hardcoded
- [ ] Mobile responsive: 16px from edges instead of 24px
- [ ] A11y: `role="status"` for info/success, `role="alert"` for error/warning

#### Commit message

```
feat(ui): Toast notification system with Sacred Modernist style

4 toast types (error/warning/info/success) with left-border accents.
Top-right viewport stack, auto-dismiss 4s, manual close, Esc dismiss.
Backdrop blur, hardcoded hex per design system.

Refs: SPEC_USER_v3.2 design system
```

---

### Commit 2: Replace Ranked.tsx:71 unlockError alert

**Files:**
- `apps/web/src/pages/Ranked.tsx` — UPDATE (line 71)
- `apps/web/src/i18n/locales/vi.json` — ADD key
- `apps/web/src/i18n/locales/en.json` — ADD key

**Change:**

```tsx
// Before
} catch (err) {
  alert('Không thể mở khóa tuần kế tiếp');
}

// After
} catch (err) {
  showToast({
    type: 'error',
    message: t('ranked.errors.unlock_failed'),
  });
}
```

**i18n keys:**

```json
{
  "ranked": {
    "errors": {
      "unlock_failed": "Không thể mở khóa tuần kế tiếp. Vui lòng thử lại."
    }
  }
}
```

```json
{
  "ranked": {
    "errors": {
      "unlock_failed": "Failed to unlock next week. Please try again."
    }
  }
}
```

**Acceptance:**
- [ ] alert() removed at Ranked.tsx:71
- [ ] Error toast appears on unlock failure
- [ ] User can dismiss manually or wait 4s
- [ ] i18n vi/en switch works

**Commit message:**
```
fix(ranked): replace unlockError alert() with toast

Use Sacred Modernist error toast instead of browser alert.

Refs: SPEC_USER_v3.2 §7.1.5
```

---

### Commit 3: Replace Ranked.tsx:112 noQuestionsLeft alert

**Same pattern as Commit 2 for line 112.**

**i18n key:**
```json
{
  "ranked": {
    "errors": {
      "no_questions_left": "Đã hết câu hỏi cho ngày hôm nay. Quay lại ngày mai!"
    }
  }
}
```

**Note:** Đây là warning, không phải error → dùng `type: 'warning'`.

**Commit message:**
```
fix(ranked): replace noQuestionsLeft alert() with toast

Daily limit warning toast.
```

---

### Commit 4: Replace Ranked.tsx:135 cannotStart alert

**Same pattern for line 135.**

**i18n key:**
```json
{
  "ranked": {
    "errors": {
      "cannot_start": "Không thể bắt đầu phiên. Vui lòng kiểm tra kết nối và thử lại."
    }
  }
}
```

**Use `type: 'error'`.**

**Commit message:**
```
fix(ranked): replace cannotStart alert() with toast

Session creation failure → user-friendly error toast.
```

---

### Commit 5: Replace Quiz.tsx:287 quiz.noQuestions alert

**Same pattern for Quiz.tsx:287.**

**Already uses i18n key `quiz.noQuestions`** — verify key exists, just swap alert → toast.

```tsx
// Before
alert(t('quiz.noQuestions'));

// After
showToast({
  type: 'error',
  message: t('quiz.noQuestions'),
});
```

**Commit message:**
```
fix(quiz): replace noQuestions alert() with toast

Boot error → toast instead of browser alert.
```

---

## Phase 3: Manual QA + verification

After all 5 commits:

### Verification grep

```bash
# Should return 0 results
grep -rn "alert(" apps/web/src/pages/Ranked.tsx apps/web/src/pages/Quiz.tsx
grep -rn "alert(" apps/web/src/components/ranked/

# Should return 5+ results (toast usage)
grep -rn "showToast\|useToast" apps/web/src/pages/Ranked.tsx apps/web/src/pages/Quiz.tsx
```

### Manual test scenarios

- [ ] Trigger unlock failure (force 500 error from API) → red error toast appears
- [ ] Reach daily question limit → amber warning toast
- [ ] Force session creation failure → red error toast
- [ ] Boot Quiz with empty pool → red error toast
- [ ] Multiple errors at once → stack max 3-4, queue extras
- [ ] Esc dismisses most recent
- [ ] Auto-dismiss after 4s
- [ ] Manual close button works
- [ ] Mobile responsive (375px width)
- [ ] i18n vi/en switch all 4 messages

---

## Rules cho Claude Code

1. **Verification-first:** Phase 1 audit confirm 4 alerts BEFORE code.

2. **Reuse Modal pattern:** Toast là separate component, KHÔNG dùng Modal base.

3. **Hardcoded hex only:** Per memory rule.

4. **Separate commits:** Each alert replacement own commit cho rollback safety.

5. **No regression:** Existing functionality preserved — chỉ thay UI display method.

6. **i18n keys consistent:** `ranked.errors.*` namespace.

7. **A11y mandatory:** `role="status"`/`role="alert"` per toast type.

8. **No backend changes:** FE-only PROMPT.

---

## Done criteria

- [ ] Phase 1 audit summary delivered inline
- [ ] Toast system shipped (Commit 1)
- [ ] All 4 alerts replaced (Commits 2-5)
- [ ] `grep alert(` returns 0 in Ranked + Quiz files
- [ ] Manual test scenarios passed
- [ ] No TypeScript errors

When done, output:
> "Error toast system shipped. 5 commits merged. alert() count in Ranked+Quiz: 0. All error paths use Sacred Modernist toasts."

Then STOP — Bui review before merging.

---

## NOTE

After this PROMPT done, **0 alert() trong toàn bộ Ranked + Quiz flow**. Brand consistency complete.

Possible future enhancement: Toast for success states (vd "Đã unlock tuần 4 thành công") — defer v1.1.
