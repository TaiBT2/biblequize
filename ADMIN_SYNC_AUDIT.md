# Admin Section — Sync & Test Audit
> Generated: 2026-04-02
> Method: Stitch screen mapping + code scan + test scan

---

## Tổng quan

| Metric | Count |
|--------|-------|
| Admin pages in code | 13 |
| Admin pages with Stitch design | 9 |
| Admin pages synced (HTML saved) | 3 (AI Generator, Users, User Detail) |
| Admin pages NOT synced (design exists, code custom) | 6 |
| Admin pages NO Stitch design | 4 |
| E2E test files | 0 |
| E2E test cases total | 0 |
| Unit test files (FE) | 3 (AdminLayout, Feedback, ReviewQueue) |
| Unit test cases (FE) | 18 |
| Backend admin test files | 3 |
| Backend admin test cases | 32 |

---

## Per-Page Detail

| # | Page | Route | LOC | Stitch ID | Sync Status | FE Tests | E2E | BE Tests |
|---|------|-------|-----|-----------|-------------|----------|-----|----------|
| 1 | AdminLayout | — | 50 | 05162533 (Shell) | ⚠️ Custom | 5 | 0 | N/A |
| 2 | Dashboard | /admin | 102 | 341c3e19 | ⚠️ Custom | 0 | 0 | 0 |
| 3 | Users | /admin/users | 197 | 2bd83830 + bae627fd | 🔄 HTML saved | 0 | 0 | 0 |
| 4 | Questions | /admin/questions | 666 | — | ⚠️ Custom | 0 | 0 | 15 |
| 5 | AIQuestionGenerator | /admin/ai-generator | 620 | 3c9e1319 | 🔄 HTML saved | 0 | 0 | 0 |
| 6 | ReviewQueue | /admin/review-queue | 250 | 642c89fa | ⚠️ Custom | 6 | 0 | 9 |
| 7 | Feedback | /admin/feedback | 311 | 39198a6b + 94ba24f3 | ⚠️ Custom | 7 | 0 | 8 |
| 8 | Rankings | /admin/rankings | 78 | 98fff6a8 | ⚠️ Custom | 0 | 0 | 0 |
| 9 | Events | /admin/events | 56 | ad6b15e1 | ⚠️ Custom | 0 | 0 | 0 |
| 10 | Groups | /admin/groups | 84 | 97d4d4d6 | ⚠️ Custom | 0 | 0 | 0 |
| 11 | Notifications | /admin/notifications | 94 | c52e3bb4 | ⚠️ Custom | 0 | 0 | 0 |
| 12 | Configuration | /admin/config | 81 | eba8f911 | ⚠️ Custom | 0 | 0 | 0 |
| 13 | ExportCenter | /admin/export | 38 | — | ⚠️ No design | 0 | 0 | 0 |
| 14 | QuestionQuality | /admin/question-quality | 75 | 8134718d | ⚠️ Custom | 0 | 0 | 0 |

### Stitch Screen Mapping

| Stitch Screen | ID | Code Page | HTML Saved |
|---|---|---|---|
| Admin Dashboard Shell | 05162533 | AdminLayout | No |
| Admin Dashboard Overview | 341c3e19 | Dashboard | No |
| Admin User Management | 2bd83830 | Users | Yes |
| Admin User Detail Modal Redesign | bae627fd | Users modal | Yes |
| Admin AI Question Generator Redesign | 3c9e1319 | AIQuestionGenerator | Yes |
| Admin Review Queue | 642c89fa | ReviewQueue | No |
| Admin Feedback Management | 39198a6b | Feedback | No |
| Admin Feedback Detail Modal | 94ba24f3 | Feedback modal | No |
| Seasons & Rankings Management | 98fff6a8 | Rankings | No |
| Events & Tournaments Management | ad6b15e1 | Events | No |
| Admin Groups Management | 97d4d4d6 | Groups | No |
| Admin Notifications Management | c52e3bb4 | Notifications | No |
| System Configuration & Settings | eba8f911 | Configuration | No |
| Admin Question Quality Dashboard | 8134718d | QuestionQuality | No |

---

## Design Consistency Issues

| # | Issue | Pages Affected | Fix |
|---|-------|---------------|-----|
| 1 | Rankings + Events use old HP theme vars | Rankings, Events | Migrate to Tailwind admin tokens |
| 2 | New pages (C8-C13) use `bg-white/5` inconsistently | Groups, Notifications, Config, Export, Quality, Dashboard | Standardize card bg |
| 3 | No admin pages synced pixel-perfect to Stitch | All 13 | Download HTML + sync each |
| 4 | Questions + AIGenerator LOC > 300 | Questions 666, AIGenerator 620 | Further split needed |
| 5 | 0 E2E tests for entire admin section | All 13 | Write E2E suite |

---

## E2E Test Gap — 0 coverage

**Zero E2E tests exist for admin.** All 13 pages have no E2E coverage.

### Priority E2E tests to write:

| Priority | Page | Route | Key Test Cases |
|----------|------|-------|---------------|
| Cao | Auth Guard | /admin/* | Admin allowed, user redirect, guest redirect |
| Cao | Questions | /admin/questions | List, filter, create, edit, delete, import |
| Cao | Users | /admin/users | List, search, ban, role change |
| Cao | Review Queue | /admin/review-queue | Approve, reject, content_mod access |
| TB | Dashboard | /admin | KPI cards, quick actions |
| TB | Feedback | /admin/feedback | List, filter, status change |
| TB | AI Generator | /admin/ai-generator | Generate, drafts, quota |
| Thấp | Rankings | /admin/rankings | Season CRUD |
| Thấp | Events | /admin/events | Tournament list |
| Thấp | Groups | /admin/groups | Lock, unlock |
| Thấp | Others | /admin/* | Basic render |

---

## Unit Test Gap

| Page | Has Tests | Cases | Missing |
|------|-----------|-------|---------|
| AdminLayout | ✅ | 5 | — |
| Feedback | ✅ | 7 | Detail modal, status transitions |
| ReviewQueue | ✅ | 6 | Approve/reject interactions |
| Dashboard | ❌ | 0 | KPI cards, quick actions |
| Users | ❌ | 0 | Table, search, ban flow |
| Questions | ❌ | 0 | CRUD, filters, import |
| AIQuestionGenerator | ❌ | 0 | Generate, drafts, quota |
| Rankings | ❌ | 0 | Season CRUD |
| Events | ❌ | 0 | Tournament list |
| Groups | ❌ | 0 | Lock/unlock |
| Notifications | ❌ | 0 | Compose, history |
| Configuration | ❌ | 0 | Edit, save |
| ExportCenter | ❌ | 0 | Export cards |
| QuestionQuality | ❌ | 0 | Score, coverage |

---

## Backend Test Status

| Controller | Tests | Cases | Coverage |
|-----------|-------|-------|----------|
| AdminQuestionController | ✅ | 15 | CRUD, import, coverage |
| QuestionReviewController | ✅ | 9 | Pending, approve, reject, stats |
| FeedbackController | ✅ | 8 | List, status change |
| AdminUserController | ❌ | 0 | NEW — needs tests |
| AdminSeasonController | ❌ | 0 | NEW — needs tests |
| AdminGroupController | ❌ | 0 | NEW — needs tests |
| AIAdminController | ❌ | 0 | Exists but no tests |

---

## Action Plan

### Ưu tiên cao
1. **Download ALL Stitch admin HTML** (11 screens not yet saved)
2. **Write auth guard E2E test** (shared across all admin pages)
3. **Write unit tests for Users, Questions, AIGenerator** (largest pages, 0 tests)
4. **Write BE tests for AdminUserController, AdminSeasonController, AdminGroupController**

### Ưu tiên trung bình
5. **Sync AdminLayout from Stitch** (shell affects all pages)
6. **Sync Dashboard from Stitch** (first page admins see)
7. **Sync Users from Stitch** (HTML already saved)
8. **Write E2E tests for Questions + Users + Review Queue**

### Ưu tiên thấp
9. **Sync remaining admin pages** (6 pages with Stitch design but no HTML saved)
10. **Further split Questions.tsx (666 LOC) + AIGenerator.tsx (620 LOC)**
11. **Write E2E tests for secondary admin pages**
