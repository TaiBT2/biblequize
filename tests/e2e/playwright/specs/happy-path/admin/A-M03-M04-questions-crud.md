# A-M03 + A-M04 — Questions CRUD + Duplicate Detection (L2 Happy Path)

**Route:** `/admin/questions`
**Spec ref:** SPEC_ADMIN §4, §5
**Module priority:** Tier 1 (core content management)

---

## API Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/questions` | Paginated list with filters |
| POST | `/api/admin/questions` | Create new question |
| POST | `/api/admin/questions/check-duplicate` | 3-layer duplicate detection |
| PUT | `/api/admin/questions/{id}` | Update question |
| DELETE | `/api/admin/questions/{id}` | Soft delete (mark inactive) |
| DELETE | `/api/admin/questions` | Bulk delete by ID list |
| POST | `/api/admin/questions/import` | Import JSON multipart |
| GET | `/api/admin/questions/coverage` | Per-book coverage stats |

---

## A-M03-L2-001 — Create question → persisted with UUID v7, reviewStatus=pending

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @questions @write @serial

**Actions**:
1. `POST /api/admin/questions` với body:
   ```json
   {
     "book": "Genesis",
     "chapter": 1,
     "difficulty": "easy",
     "type": "multiple_choice_single",
     "language": "vi",
     "content": "Ai đã tạo ra trời và đất?",
     "options": ["Chúa", "Thiên thần", "Con người", "Tự nhiên"],
     "correctAnswer": [0],
     "explanation": "Sáng thế ký 1:1",
     "scriptureRef": "Genesis 1:1"
   }
   ```

**API Verification**:
- Response 200 với:
  - `id` (UUID v7 format: `01XXXXXX-XXXX-7XXX-XXXX-XXXXXXXXXXXX`)
  - All fields match request
  - `reviewStatus: "pending"` (default khi create — per SPEC §7)
  - `isActive: true`
  - `createdAt`, `updatedAt` set
- `GET /api/admin/questions/{id}` → same data

**Cleanup**:
- `DELETE /api/admin/questions/{id}`

---

## A-M03-L2-002 — List questions với book filter → return filtered set

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @questions @parallel-safe

**Actions**:
1. `GET /api/admin/questions?book=Genesis&page=0&size=20`

**API Verification**:
- Response: paginated
  - `content[]` length ≤ 20
  - All items `book === "Genesis"`
  - `totalElements, totalPages, number, size` fields present

---

## A-M03-L2-003 — List với difficulty filter → only hard questions

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @questions @parallel-safe

**Actions**:
1. `GET /api/admin/questions?difficulty=hard&size=10`

**API Verification**:
- All items `difficulty === "hard"`

---

## A-M03-L2-004 — Search by text content → matching results

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @questions @parallel-safe

**Actions**:
1. `GET /api/admin/questions?search=Chúa&size=10`

**API Verification**:
- All items có "Chúa" trong `content` hoặc `explanation`

---

## A-M03-L2-005 — Update question → PUT /{id} → fields persist

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @questions @write @serial

**Setup**:
- Create test question via API

**Actions**:
1. `PUT /api/admin/questions/{id}` với body `{ "content": "Updated content", "difficulty": "medium" }`

**API Verification**:
- Response 200
- `GET /api/admin/questions/{id}` → `content: "Updated content"`, `difficulty: "medium"`
- `updatedAt` > `createdAt`

**Cleanup**:
- DELETE question

---

## A-M03-L2-006 — Delete question → soft delete (isActive=false)

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @questions @write @serial

**Setup**:
- Create test question

**Actions**:
1. `DELETE /api/admin/questions/{id}`

**API Verification**:
- Response 204 No Content
- `GET /api/admin/questions/{id}` → either 404 or returns with `isActive: false`
- Question không xuất hiện trong `GET /api/admin/questions` (default filter `isActive=true`)

---

## A-M03-L2-007 — Delete not found → 404

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @questions @write @serial

**Actions**:
1. `DELETE /api/admin/questions/non-existent-id`

**API Verification**:
- Response 404

---

## A-M03-L2-008 — Bulk delete: 5 IDs → all soft-deleted

**Priority**: P1
**Est. runtime**: ~8s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @questions @write @serial

**Setup**:
- Create 5 test questions, collect IDs

**Actions**:
1. `DELETE /api/admin/questions` với body `{ "ids": ["id1", "id2", "id3", "id4", "id5"] }`

**API Verification**:
- Response 200 với `{ deletedCount: 5 }`
- Each question `isActive: false` sau DELETE

---

## A-M03-L2-009 — Bulk delete với empty array → 400

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @questions @write @serial

**Actions**:
1. `DELETE /api/admin/questions` với body `{ "ids": [] }`

**API Verification**:
- Response 400 Bad Request

---

## A-M03-L2-010 — Coverage endpoint: GET /coverage → per-book stats

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @questions @parallel-safe

**Actions**:
1. `GET /api/admin/questions/coverage`

**API Verification**:
- Response array với per-book entries:
  - `book, totalQuestions, easyCount, mediumCount, hardCount, coveragePercent`
- All 66 books present (or subset với questions > 0)

---

## A-M03-L2-011 — UI CRUD flow: create → list refresh → edit → delete

**Priority**: P0
**Est. runtime**: ~20s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @questions @write @serial

**Actions**:
1. `page.goto('/admin/questions')`
2. Click "Tạo câu hỏi" → fill form → submit
3. Verify new question xuất hiện trong list
4. Click edit → update content → save
5. Verify updated content hiển thị
6. Click delete → confirm → question ẩn khỏi list

**Assertions** (UI):
- `expect(page.getByTestId('admin-questions-table')).toBeVisible()`
- After create: row count tăng 1
- After edit: cell content matches
- After delete: row count giảm 1

**API Verification**:
- POST/PUT/DELETE all fire successfully

**Cleanup**:
- Cleanup any remaining test question

---

## A-M04-L2-012 — Duplicate detection: POST /check-duplicate với exact match → returns similarity=1.0

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @questions @duplicate @write @serial

**Setup**:
- Create question X với content "Ai đã tạo ra Adam và Eva?"

**Actions**:
1. `POST /api/admin/questions/check-duplicate` với body:
   ```json
   { "book": "Genesis", "content": "Ai đã tạo ra Adam và Eva?" }
   ```

**API Verification**:
- Response: `{ duplicates: [...], topSimilarity: 1.0 }` hoặc similar
- Duplicate array chứa question X

**Cleanup**:
- DELETE question X

**Notes**:
- 3-layer detection: normalized content hash → Levenshtein → semantic
- Full semantic layer có thể dùng embeddings — confirm implementation

---

## A-M04-L2-013 — Duplicate detection: partial match (80% similar) → topSimilarity > 0.8

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @questions @duplicate @write @serial

**Setup**:
- Create question với content "Moses dẫn dân Do Thái ra khỏi Ai Cập"

**Actions**:
1. `POST /check-duplicate` với `"Môi-se dẫn dân Israel khỏi Ai Cập"` (semantic similar)

**API Verification**:
- `topSimilarity > 0.6` (tolerance depending on layer)
- Warning flagged trong UI

**Cleanup**:
- DELETE question

---

## NEEDS TESTID Summary (A-M03 + A-M04 L2)

| Element | Suggested testid |
|---------|-----------------|
| Questions table | `admin-questions-table` |
| Create button | `admin-questions-create-btn` |
| Create form modal | `admin-questions-create-modal` |
| Content input | `admin-question-content-input` |
| Options inputs | `admin-question-option-{n}` |
| Correct answer select | `admin-question-correct-select` |
| Save button | `admin-question-save-btn` |
| Edit button (row) | `admin-question-edit-btn` |
| Delete button (row) | `admin-question-delete-btn` |
| Book filter | `admin-questions-book-filter` |
| Difficulty filter | `admin-questions-difficulty-filter` |
| Search input | `admin-questions-search-input` |
| Duplicate warning | `admin-question-duplicate-warning` |

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 5s |
| L2-002 | 4s |
| L2-003 | 4s |
| L2-004 | 4s |
| L2-005 | 6s |
| L2-006 | 5s |
| L2-007 | 3s |
| L2-008 | 8s |
| L2-009 | 3s |
| L2-010 | 5s |
| L2-011 | 20s |
| L2-012 | 5s |
| L2-013 | 5s |
| **Total** | **~77s (~1.3 min)** |

---

## Summary
- **13 cases** (A-M03: 11, A-M04: 2 — combined file)
- **P0**: 5 | **P1**: 8
- **NEEDS TESTID**: 13 elements
- **Runtime**: ~1.3 min
