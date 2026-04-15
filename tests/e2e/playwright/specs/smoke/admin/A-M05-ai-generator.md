# A-M05 — AI Question Generator (L1 Smoke)

**Routes:** `/admin/ai-generator`
**Spec ref:** SPEC_ADMIN §5

---

### A-M05-L1-001 — AI Generator page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @ai-generator @critical

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/ai-generator')`
2. `page.waitForSelector('[data-testid="ai-generator-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/ai-generator')`
- `expect(page.getByTestId('ai-generator-page')).toBeVisible()`
- `expect(page.getByTestId('ai-scripture-selector')).toBeVisible()`
- `expect(page.getByTestId('ai-settings-panel')).toBeVisible()`
- `expect(page.getByTestId('ai-generate-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: ai-generator-page] — wrapper
- [NEEDS TESTID: ai-scripture-selector] — selector book/chapter/verse
- [NEEDS TESTID: ai-settings-panel] — panel difficulty/type/count
- [NEEDS TESTID: ai-generate-btn] — nút "Tạo Câu Hỏi"

---

### A-M05-L1-002 — Provider selector (Gemini/Claude) visible

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @ai-generator

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/ai-generator')`
2. `page.waitForSelector('[data-testid="ai-provider-select"]')`

**Assertions**:
- `expect(page.getByTestId('ai-provider-select')).toBeVisible()`
- `expect(page.getByTestId('ai-provider-gemini')).toBeVisible()` ← option Gemini
- `expect(page.getByTestId('ai-provider-claude')).toBeVisible()` ← option Claude

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: ai-provider-select] — provider selector
- [NEEDS TESTID: ai-provider-gemini] — Gemini option
- [NEEDS TESTID: ai-provider-claude] — Claude option (khi chọn hiện model picker)

---

### A-M05-L1-003 — Generate drafts → draft cards xuất hiện

**Priority**: P1
**Est. runtime**: ~10s
**Auth**: storageState=admin
**Tags**: @smoke @admin @ai-generator @write

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập, AI provider configured (API key set)

**Actions**:
1. `page.goto('/admin/ai-generator')`
2. Chọn book (Genesis) + chapter 1
3. Set count=2
4. `page.getByTestId('ai-generate-btn').click()`
5. `page.waitForSelector('[data-testid="ai-draft-card"]', { timeout: 15000 })`

**Assertions**:
- `expect(page.getByTestId('ai-draft-card')).toHaveCount({ min: 1 })`
- `expect(page.getByTestId('ai-draft-approve-btn').first()).toBeVisible()`
- `expect(page.getByTestId('ai-draft-reject-btn').first()).toBeVisible()`

**Cleanup**:
- Reject all drafts: `page.getByTestId('ai-draft-reject-btn').click()` (lặp)

**Notes**:
- [NEEDS TESTID: ai-draft-card] — mỗi draft question card
- [NEEDS TESTID: ai-draft-approve-btn] — approve button
- [NEEDS TESTID: ai-draft-reject-btn] — reject button
- Timeout 15s vì AI generation có thể chậm

---

### A-M05-L1-004 — Approve draft → gọi API save

**Priority**: P1
**Est. runtime**: ~12s
**Auth**: storageState=admin
**Tags**: @smoke @admin @ai-generator @write

**Setup**: none

**Preconditions**:
- Đang có draft cards (từ case -003)

**Actions**:
1. (Generate drafts như case -003)
2. `page.getByTestId('ai-draft-approve-btn').first().click()`
3. `page.waitForResponse('/api/admin/questions')`

**Assertions**:
- `expect(page.getByTestId('ai-draft-card').first()).toHaveAttribute('data-status', 'approved')` ← draft marked approved

**Cleanup**: none

**Notes**:
- Approve không save ngay — save khi click "Lưu Tất Cả Đã Duyệt"

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Generator page | `ai-generator-page` | admin/AIQuestionGenerator.tsx |
| Scripture selector | `ai-scripture-selector` | admin/AIQuestionGenerator.tsx |
| Settings panel | `ai-settings-panel` | admin/AIQuestionGenerator.tsx |
| Generate button | `ai-generate-btn` | admin/AIQuestionGenerator.tsx |
| Provider select | `ai-provider-select` | admin/AIQuestionGenerator.tsx |
| Gemini option | `ai-provider-gemini` | admin/AIQuestionGenerator.tsx |
| Claude option | `ai-provider-claude` | admin/AIQuestionGenerator.tsx |
| Draft card | `ai-draft-card` | admin/AIQuestionGenerator.tsx |
| Approve button | `ai-draft-approve-btn` | admin/AIQuestionGenerator.tsx |
| Reject button | `ai-draft-reject-btn` | admin/AIQuestionGenerator.tsx |
