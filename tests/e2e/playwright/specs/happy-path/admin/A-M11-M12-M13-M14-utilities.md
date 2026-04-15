# A-M11 + A-M12 + A-M13 + A-M14 — Utilities Admin (L2 Happy Path)

**Routes:** `/admin/notifications`, `/admin/config`, `/admin/export`, `/admin/question-quality`
**Spec ref:** SPEC_ADMIN §12–15
**Module priority:** Tier 4 (partial NOT IMPL stubs)

---

## ⚠️ Implementation Status

Per Phase 2 L1 findings, các modules này có limited backend:
- **A-M11 Notifications**: broadcast form UI có, send endpoint `setTimeout` stub
- **A-M12 Configuration**: panels render, save endpoint NOT IMPL (stub button)
- **A-M13 Export Center**: cards + buttons render, export APIs `alert("API not implemented")`
- **A-M14 Question Quality**: page render, quality score hardcoded 72/100

L2 coverage focuses on: what IS implemented (render, read endpoints) + document gaps.

---

## A-M11 — Notifications Broadcast

### A-M11-L2-001 — GET /api/admin/notifications returns broadcast history

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @notifications @parallel-safe

**Actions**:
1. `GET /api/admin/notifications`

**API Verification**:
- Response array với broadcast history (có thể empty)
- Each item: `id, title, content, sentBy, sentAt, recipientCount`

**Notes**:
- Endpoint có thể return empty trong dev

---

### A-M11-L2-002 — POST /api/admin/notifications/broadcast → stub success

**Priority**: P2
**Est. runtime**: ~4s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @notifications @write @serial

**Actions**:
1. `POST /api/admin/notifications/broadcast` với body `{ title, content, audience: "ALL" }`

**API Verification**:
- Response 200 (stub) — no actual delivery verified
- **[NOT IMPLEMENTED]**: real delivery — `setTimeout` placeholder

---

## A-M12 — Configuration

### A-M12-L2-003 — GET /api/admin/config returns game config values

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @config @parallel-safe

**Actions**:
1. `GET /api/admin/config`

**API Verification**:
- Response: `{ game: { dailyEnergy, dailyQuestionCap, ... }, scoring: { ... } }`
- Values match TierRewardsConfig / ScoringService constants

---

### A-M12-L2-004 — PATCH /api/admin/config → stub, no persistence

**Priority**: P2
**Est. runtime**: ~3s
**Auth**: fresh login as admin@biblequiz.test
**Tags**: @happy-path @admin @config @write @serial

**Actions**:
1. `PATCH /api/admin/config` với body `{ "game": { "dailyEnergy": 120 } }`

**API Verification**:
- Response 200 hoặc **[NOT IMPLEMENTED]** — endpoint chưa có save logic
- Verify: subsequent GET returns unchanged value (stub behavior)

**Notes**:
- `[NOT IMPLEMENTED]`: Config save endpoint chưa có — button là stub

---

## A-M13 — Export Center

### A-M13-L2-005 — GET /api/admin/export/questions?format=csv → download stub

**Priority**: P2
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @export @parallel-safe

**Actions**:
1. `GET /api/admin/export/questions?format=csv`

**API Verification**:
- [NOT IMPLEMENTED]: endpoint return 404/501 hoặc `{ error: "API not implemented" }`

**Notes**:
- Frontend `alert("API not implemented")` fires — no actual download

---

### A-M13-L2-006 — GET /api/admin/export/users?format=json → stub

**Priority**: P2
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @export @parallel-safe

**Notes**: Same stub behavior as L2-005

---

## A-M14 — Question Quality

### A-M14-L2-007 — GET /api/admin/question-quality → score + coverage

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @quality @parallel-safe

**Actions**:
1. `GET /api/admin/question-quality`

**API Verification**:
- Response: `{ overallScore, coverage: [{ book, percent }], duplicateRate, lowQualityCount }`
- [NOTE]: `overallScore` hardcoded 72/100 hiện tại (per Phase 2 L1 finding)

---

### A-M14-L2-008 — Coverage map accuracy: %per book matches DB

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: storageState=admin
**Tags**: @happy-path @admin @quality @parallel-safe

**Actions**:
1. `GET /api/admin/questions/coverage` (from A-M03)
2. `GET /api/admin/question-quality`
3. Compare book coverage percentages

**API Verification**:
- Coverage array consistent giữa 2 endpoints

---

## NOT IMPLEMENTED Summary (carry-over from Phase 2 L1)

| Feature | Module | Status |
|---------|--------|--------|
| Broadcast notification delivery | A-M11 | `setTimeout` placeholder |
| Config save endpoint | A-M12 | Stub button only |
| Export APIs (all formats) | A-M13 | `alert("not implemented")` |
| Quality score dynamic calc | A-M14 | Hardcoded 72/100 |
| Admin tournament create | A-M09 | Read-only admin |

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 4s |
| L2-003 | 4s |
| L2-004 | 3s |
| L2-005 | 4s |
| L2-006 | 4s |
| L2-007 | 4s |
| L2-008 | 6s |
| **Total** | **~33s** |

---

## Summary
- **8 cases** (2 per module)
- **P1**: 4 | **P2**: 4
- **Runtime**: ~33s
- **NOT IMPLEMENTED**: 4 backend gaps documented
