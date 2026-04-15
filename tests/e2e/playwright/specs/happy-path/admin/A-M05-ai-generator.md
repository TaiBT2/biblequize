# A-M05 — AI Question Generator (L2 Happy Path)

**Route:** `/admin/ai-generator`
**Spec ref:** SPEC_ADMIN §6
**Module priority:** Tier 2 (content ops)

---

## API Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/ai-generator/generate` | Request draft questions from AI |
| GET | `/api/admin/ai-generator/drafts` | List pending drafts |
| POST | `/api/admin/ai-generator/drafts/{id}/approve` | Approve → moves to question review queue |
| POST | `/api/admin/ai-generator/drafts/{id}/reject` | Reject draft (delete) |

---

## A-M05-L2-001 — Generate drafts with Gemini provider → returns N drafts

**Priority**: P0
**Est. runtime**: ~20s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @ai @write @serial

**Setup**:
- Mock Gemini API response (via test profile) hoặc confirm dev env has API key

**Actions**:
1. `POST /api/admin/ai-generator/generate` với body:
   ```json
   {
     "book": "Genesis",
     "chapter": 1,
     "difficulty": "easy",
     "count": 3,
     "provider": "gemini",
     "language": "vi"
   }
   ```

**API Verification**:
- Response 200 với `drafts` array length ≥ 1 (depends on AI response)
- Each draft: `{ id, content, options, correctAnswer, book, chapter, difficulty, status: "PENDING_REVIEW" }`

**Cleanup**:
- DELETE drafts via reject

**Notes**:
- Generation có thể mất 10-15s — extend runtime estimate
- [NEEDS MOCK]: consider intercepting in test environment via MSW hoặc feature flag

---

## A-M05-L2-002 — Generate with Claude provider → similar structure

**Priority**: P1
**Est. runtime**: ~20s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @ai @write @serial

**Actions**:
1. POST với `"provider": "claude"`

**API Verification**:
- Response 200 với drafts
- `provider: "claude"` recorded

---

## A-M05-L2-003 — Generate với invalid provider → 400

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @ai @write @serial

**Actions**:
1. POST với `"provider": "random_ai"`

**API Verification**:
- Response 400 — invalid provider

---

## A-M05-L2-004 — List drafts → returns pending drafts

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @ai @parallel-safe

**Actions**:
1. `GET /api/admin/ai-generator/drafts`

**API Verification**:
- Response array với drafts có status PENDING_REVIEW
- Sorted by createdAt desc

---

## A-M05-L2-005 — Approve draft → becomes question in review queue

**Priority**: P0
**Est. runtime**: ~8s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @ai @write @serial

**Setup**:
- Generate 1 draft (hoặc create directly via test helper)

**Actions**:
1. `POST /api/admin/ai-generator/drafts/{id}/approve`

**API Verification**:
- Response 200 với new `questionId`
- `GET /api/admin/questions/{questionId}` → exists, `reviewStatus: "PENDING"`, `aiGenerated: true`
- Draft removed from `GET /drafts`

**Cleanup**:
- DELETE question

---

## A-M05-L2-006 — Reject draft → deleted, not promoted

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @ai @write @serial

**Setup**:
- Generate 1 draft

**Actions**:
1. `POST /api/admin/ai-generator/drafts/{id}/reject`

**API Verification**:
- Response 200
- `GET /drafts` → draft ID không còn
- No new question created

---

## NEEDS TESTID Summary (A-M05 L2)

| Element | Suggested testid |
|---------|-----------------|
| Generator form | `ai-generator-form` |
| Book select | `ai-generator-book-select` |
| Difficulty select | `ai-generator-difficulty-select` |
| Count input | `ai-generator-count-input` |
| Provider select | `ai-generator-provider-select` |
| Generate button | `ai-generator-generate-btn` |
| Drafts list | `ai-generator-drafts-list` |
| Draft approve btn | `ai-generator-draft-approve-btn` |
| Draft reject btn | `ai-generator-draft-reject-btn` |

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 20s |
| L2-002 | 20s |
| L2-003 | 3s |
| L2-004 | 4s |
| L2-005 | 8s |
| L2-006 | 6s |
| **Total** | **~61s (~1 min)** |

---

## Summary
- **6 cases**
- **P0**: 2 | **P1**: 4
- **Runtime**: ~1 min (generation slow)
- **[NOTE]**: L2-001/002 runtime biến động theo AI response time
