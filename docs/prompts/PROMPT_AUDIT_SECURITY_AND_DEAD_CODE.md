# PROMPT: Audit 3 findings từ CODE_REVIEW.md (verify, không fix)

> **Mục tiêu**: Verify 3 findings từ CODE_REVIEW (2026-05-08) là confirmed bug hay false positive bằng cách đọc code thực tế. **KHÔNG fix gì** — chỉ audit và báo cáo.
>
> **Output**: `BUG_REPORT_AUDIT_3FINDINGS.md` tại root repo.

---

## ⚠️ Quy tắc bắt buộc

1. **Verification-first**: Mỗi finding phải `grep` + `view` actual code trước khi conclude. KHÔNG assume.
2. **Quote evidence**: Mỗi conclusion phải kèm file:line + code snippet (3-10 dòng).
3. **Phân biệt rõ**:
   - ✅ **CONFIRMED** — Reviewer đúng, bug có thật
   - ❌ **FALSE POSITIVE** — Reviewer sai, code đã handle correctly
   - ⚠️ **PARTIAL** — Đúng một phần, sai một phần (ghi rõ phần nào)
4. **KHÔNG modify code**. Đây là audit, không phải fix.
5. **Stop sau khi tạo bug report** để Bui review trước khi quyết định action.

---

## Finding 1 (B12): `/api/me/bootstrap-admin` permitAll trong production?

### Reviewer claim
> `infrastructure/security/SecurityConfig.java:83-113` — `/api/me/bootstrap-admin` `permitAll()` — hint là test endpoint, prod phải gate ADMIN

### Verify steps

**Step 1.1**: Đọc `SecurityConfig.java` đầy đủ
```bash
grep -n "bootstrap-admin\|permitAll\|@Profile" apps/api/src/main/java/com/biblequiz/infrastructure/security/SecurityConfig.java
```
- Xem dòng 83-113 thực sự có gì
- Endpoint pattern là gì? `/api/me/bootstrap-admin` exact match hay wildcard?

**Step 1.2**: Tìm controller xử lý endpoint này
```bash
grep -rn "bootstrap-admin\|bootstrapAdmin" apps/api/src/main/java/
```
- Controller nào handle? Method nào?
- Có `@PreAuthorize` không?
- Có `@Profile({"dev", "staging"})` gate không?

**Step 1.3**: Check application.yml cho production
```bash
grep -n "bootstrap-admin\|app.bootstrap" apps/api/src/main/resources/application*.yml
```
- Có flag enable/disable theo profile không?

**Step 1.4**: Reproduce risk
- Nếu **CONFIRMED**: trả lời câu hỏi — "Trong prod, ai đó gọi `POST /api/me/bootstrap-admin` có tạo được admin không?"
- Test logic: có check `existingAdminCount == 0` không? Hay luôn cho phép?

### Output cho Finding 1

```markdown
## Finding 1 (B12): bootstrap-admin permitAll

**Status**: ✅ CONFIRMED | ❌ FALSE POSITIVE | ⚠️ PARTIAL

**Evidence**:
- SecurityConfig.java:XX — [code snippet]
- Controller XYZ.java:XX — [code snippet]
- application.yml profile config: [snippet hoặc "không có"]

**Reproduce risk in prod**:
[Mô tả attack scenario nếu CONFIRMED, hoặc giải thích why safe nếu FALSE POSITIVE]

**Severity nếu confirmed**: CRITICAL / HIGH / MEDIUM / LOW
**Recommended fix** (nếu CONFIRMED, không implement): [1-2 câu]
```

---

## Finding 2 (B15): `xpSurgeUntil` dead code?

### Reviewer claim
> `modules/user/entity/User.java:64-73` — TODO `xpSurgeUntil` — code có nhưng không wire vào scoring → dead code

### Bui's nghi vấn
TODO.md ghi `Task TP-5: P1-A Milestone Burst (backend + frontend) - DONE`, bao gồm:
- ✅ Add `xp_surge_until` to users table (V24 migration)
- ✅ Milestone detection (50%/90%) in TierProgressService
- ✅ XP surge multiplier in ScoringService

→ Nếu TODO chính xác, reviewer SAI. Cần verify.

### Verify steps

**Step 2.1**: Confirm field existence
```bash
grep -n "xpSurgeUntil\|xp_surge_until" apps/api/src/main/java/com/biblequiz/modules/user/entity/User.java
```
- Có field không? Type gì?
- Có comment TODO không?

**Step 2.2**: Confirm migration
```bash
ls apps/api/src/main/resources/db/migration/ | grep V24
cat apps/api/src/main/resources/db/migration/V24*.sql
```

**Step 2.3**: Verify wire vào ScoringService
```bash
grep -rn "xpSurgeUntil\|getXpSurgeUntil\|xp_surge" apps/api/src/main/java/com/biblequiz/modules/
```
- Có usage trong ScoringService không?
- Logic check `now < xpSurgeUntil` có đúng không?
- Multiplier áp dụng đâu?

**Step 2.4**: Verify wire vào TierProgressService
```bash
grep -n "xpSurgeUntil\|setXpSurgeUntil\|surgeUntil" apps/api/src/main/java/com/biblequiz/modules/ranked/service/TierProgressService.java
```
- Có set field này khi milestone đạt được không?
- Trigger khi nào (50%/90% tier progress)?

**Step 2.5**: Tests
```bash
grep -rn "xpSurgeUntil\|surge" apps/api/src/test/
```
- Có test cho XP surge không?

### Output cho Finding 2

```markdown
## Finding 2 (B15): xpSurgeUntil dead code

**Status**: ✅ CONFIRMED dead code | ❌ FALSE POSITIVE (already wired) | ⚠️ PARTIAL

**Evidence**:
- User.java:64-73 — [snippet field declaration]
- V24 migration: [exists/not exists, content]
- ScoringService usage: [file:line + snippet, hoặc "không tìm thấy"]
- TierProgressService set field: [file:line + snippet]
- Tests: [count, file paths]

**Wire-up flow** (nếu FALSE POSITIVE):
1. Milestone đạt → set xpSurgeUntil ở [file:line]
2. Quiz answer → ScoringService check ở [file:line]
3. Multiplier applied: [giá trị, ví dụ 1.5x trong N giây]

**Conclusion**: [Reviewer đúng/sai, lý do cụ thể]
```

---

## Finding 3 (P15): Leaderboard render 1000+ entries không virtualize?

### Reviewer claim
> `pages/Leaderboard.tsx:128,221` — Render 1000+ entries không virtualization → 500+ ms layout thrash mobile

### Bui's nghi vấn
SPEC_USER §17.11 ghi `GET /api/leaderboard/global` có pagination với `limit, cursor`. Default limit thường là 20-50, không phải 1000+.

### Verify steps

**Step 3.1**: Đọc pagination logic ở backend
```bash
grep -rn "leaderboard\|/api/leaderboard" apps/api/src/main/java/com/biblequiz/api/LeaderboardController.java
```
- Default `limit` parameter là bao nhiêu?
- Max `limit` clamp là bao nhiêu?
- Có Pageable không?

**Step 3.2**: Đọc frontend fetch
```bash
grep -n "leaderboard\|api.get.*leaderboard" apps/web/src/pages/Leaderboard.tsx
```
- Frontend gửi `limit=?` khi fetch?
- Có infinite scroll / pagination UI không?
- Hay fetch hết một lần?

**Step 3.3**: Đọc render logic
```bash
view apps/web/src/pages/Leaderboard.tsx (line 100-250)
```
- Render bao nhiêu rows max trong 1 frame?
- Có virtualization library import không (react-window, react-virtual)?

**Step 3.4**: Check actual data shape
```bash
grep -n "limit\|cursor\|pageSize" apps/web/src/pages/Leaderboard.tsx
```

### Output cho Finding 3

```markdown
## Finding 3 (P15): Leaderboard virtualization

**Status**: ✅ CONFIRMED | ❌ FALSE POSITIVE | ⚠️ PARTIAL

**Evidence**:
- LeaderboardController default limit: [number]
- Leaderboard.tsx fetch limit: [number]
- Pagination UI: [exists/not exists]
- Max rows rendered in single frame: [number]

**Real-world impact**:
[Tính lại impact dựa trên actual limit. Ví dụ: nếu limit=50 thì không cần virtualize → reviewer's "🟠 500+ ms layout thrash" sai]

**Conclusion**: [Pagination đã handle / Cần virtualize / Edge case]
```

---

## Tổng kết Bug Report

Sau khi verify 3 findings, tạo summary table ở đầu file:

```markdown
# BUG_REPORT_AUDIT_3FINDINGS.md

**Date**: [today]
**Audit của**: 3 findings từ CODE_REVIEW.md (B12, B15, P15)
**Method**: Static code analysis — grep + view actual code

## Summary

| # | Finding | Reviewer Status | Audit Status | Severity |
|---|---|---|---|---|
| B12 | bootstrap-admin permitAll | Critical | [confirmed/false] | [actual] |
| B15 | xpSurgeUntil dead code | High | [confirmed/false] | [actual] |
| P15 | Leaderboard 1000+ render | High | [confirmed/false] | [actual] |

## Recommendations

[Bullet list các action cụ thể, KHÔNG implement]
- B12: [fix nếu confirmed / no action nếu false]
- B15: [...]
- P15: [...]

[Findings chi tiết bên dưới...]
```

---

## ⛔ Rules nhắc lại

1. **KHÔNG fix code**. Audit only.
2. **KHÔNG run migrations**. Read-only.
3. **KHÔNG modify tests**. Just count + grep.
4. **Stop sau khi commit bug report** để Bui review.
5. **1 commit duy nhất**: `audit: verify 3 findings từ code review (B12, B15, P15)`

## Expected files

Sau khi xong:
- `BUG_REPORT_AUDIT_3FINDINGS.md` ở root repo (~150-300 dòng)
- 0 source files modified
- 0 tests modified
- 1 commit
