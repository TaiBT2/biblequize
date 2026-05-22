# PROMPT: Audit Ranked Question Selection Flow

## Mục tiêu

**Read-only audit.** Đọc toàn bộ flow chọn câu hỏi khi user chơi Rank mode và báo cáo chính xác `file:line` references cho từng quyết định logic.

**KHÔNG implement, KHÔNG fix, KHÔNG đề xuất.** Chỉ report ground truth.

Output: 1 file duy nhất `docs/audit/RANKED_SELECTION_AUDIT.md`.

---

## Canonical constraints (Bui-locked, tham chiếu khi audit)

- Tên tier OLD canonical (KHÔNG dùng Light-based names): Tân Tín Hữu / Người Tìm Kiếm / Môn Đồ / Hiền Triết / Tiên Tri / Sứ Đồ
- Tên mode: "Đấu Hạng" (Ranked)
- Bible scope: 66 sách Protestant (KHÔNG bao gồm Deuterocanonical)
- Liturgical seasons canonical (4): Phục Sinh (T2-T4) / Ngũ Tuần (T5-T7) / Cảm Tạ (T8-T10) / Giáng Sinh (T11-T1)
- Difficulty levels: `easy` / `medium` / `hard`

---

## Verification-first protocol

Mọi claim trong audit report phải có `file:line` reference. Không được paraphrase từ memory hoặc spec. Nếu code khác spec → report cả 2 với note "**SPEC DRIFT**".

Format reference: `apps/api/src/main/java/com/biblequiz/api/RankedController.java:226-300`

Nếu file path không tồn tại → report "FILE NOT FOUND" thay vì đoán.

---

## Phạm vi audit

### A. Backend — entry points

Đọc và report:

1. **`RankedController.java`** — toàn bộ file
   - Endpoint `POST /api/ranked/questions/select` (hoặc tên tương đương)
   - Endpoint `POST /api/ranked/answer` (submit answer)
   - Endpoint `GET /api/me/ranked-status`
   - Endpoint `GET /api/ranked/tier`
   - Bất kỳ endpoint khác liên quan đến Ranked

2. **`RankedSessionService.java`** (nếu tồn tại) — toàn bộ file

3. **`SmartQuestionSelector.java`** — toàn bộ file
   - Method `selectQuestions()` — phân bổ độ khó theo tier
   - Logic Pool 1/2/3/4 (chưa thấy / SRS review / >30 ngày / recent)
   - Cách shuffle (Collections.shuffle vs SQL ORDER BY RAND vs khác)

4. **`TierDifficultyConfig.java`** — toàn bộ file
   - Distribution theo tier (Easy/Medium/Hard%)
   - Timer per tier
   - Confirm 6 tier values khớp với spec §3.2

5. **`QuestionRepository`** — tìm tất cả method được gọi từ SmartQuestionSelector
   - `findAllActiveByLanguage()` hoặc tên tương đương
   - Method filter theo book / difficulty / language
   - Có sử dụng `LIMIT` ở SQL không hay load all rồi shuffle in-memory?

6. **`UserDailyProgress` entity + repository**
   - Field `currentBook` — kiểu dữ liệu, default value
   - Field `currentDifficulty` — kiểu dữ liệu, possible values
   - Field tracking câu đã hỏi trong ngày — tên field, kiểu dữ liệu
   - Reset logic (midnight UTC?)

7. **`UserQuestionHistory` entity + repository**
   - Schema fields
   - Method query Pool 1/2/3/4

### B. Backend — book progression logic

8. **`submitRankedAnswer` method** (trong `RankedController` hoặc service)
   - Logic advance `currentBook` — threshold mastery là bao nhiêu?
   - Order tiến độ — theo `book.order_index` hay logic khác?
   - Có wraparound Revelation → Genesis không?
   - Khi cán mastery 1 sách, có trigger gì khác không (badge, modal, event)?
   - Logic update `UserBookProgress` mastery — confirm Ranked đúng câu CÓ tăng mastery hay không?

9. **`BookMasteryService.java`** (nếu tồn tại)
   - Method update mastery — call sites từ mode nào (Practice / Ranked / Daily / Multiplayer / Variety)?
   - Formula tính mastery (xem spec §6.2 confirm)

### C. Backend — exclusion + fallback

10. **Exclusion logic**
    - Câu đã hỏi same-day được loại như thế nào? Truyền `excludeIds` từ FE hay BE tự query?
    - Có exclude theo SRS `next_review_at` chưa fire không?
    - Có exclude question status (DRAFT / PUBLISHED / ARCHIVED)?

11. **Fallback logic**
    - Khi pool theo `(book + tier difficulty + language - excludeIds)` cạn → behavior gì?
    - Có fallback bỏ filter book? Bỏ filter difficulty? Bỏ exclude?
    - Throw error hay graceful degrade?

### D. Backend — Liturgical Season integration

12. **Confirm hoặc disprove** các claim sau bằng `file:line`:
    - Claim 1: `Season` entity (`SeasonSeeder.java`) chỉ là leaderboard frame, không filter câu hỏi
    - Claim 2: `SmartQuestionSelector` không có chữ "season" (grep toàn file)
    - Claim 3: `ScoringService.calculateWithTier` chỉ áp ×1.5 cho `xpSurgeUntil` (Milestone Burst), không phải mùa liturgical
    - Claim 4: `/api/variety/seasonal` (VarietyQuizController) hard-code 2/4 mùa, dùng cho banner riêng

### E. Frontend — Web

13. **`apps/web/src/pages/Ranked.tsx`**
    - Build request body cho `POST /api/ranked/questions/select` — truyền những field gì?
    - Confirm có truyền `book: rankedStatus.currentBook` không (xem dòng ~49-54 per Bui's grep)
    - Logic re-fetch sau mỗi answer
    - UI element nào hiện `currentBook` cho user thấy? (nếu có, screenshot text/label)
    - UI element nào hiện `currentDifficulty`?
    - UI element nào hiện tier / mùa liturgical?

14. **`apps/web/src/hooks/useRankedSession.ts`** hoặc tương đương
    - State management cho rankedStatus
    - Cache strategy (TanStack Query?)

### F. Frontend — Mobile

15. **`apps/mobile/src/screens/quiz/RankedScreen.tsx`** (nếu tồn tại)
    - Build request body cho `POST /api/ranked/questions/select` — truyền những field gì?
    - **CRITICAL: Có truyền `book` field không?** (Bui đã confirm web có, mobile chưa verify)
    - Logic re-fetch sau mỗi answer
    - UI element nào hiện `currentBook` / `currentDifficulty` / tier

16. **Mobile hooks/services** liên quan đến Ranked

### G. Cross-cutting

17. **Authentication / Authorization**
    - Endpoint Ranked yêu cầu auth gì? Guest có gọi được không?
    - Tier 1 chưa pass Basic Quiz → behavior khi gọi `/ranked/questions/select`?

18. **Energy gate**
    - Khi energy = 0, user vẫn select questions được? Hay endpoint reject?
    - File `EnergyService.java` hoặc tương đương — check call sites trong Ranked flow

19. **`DailyProgressService` hoặc tương đương**
    - 100 câu/ngày cap — enforce ở đâu?
    - Reset midnight UTC — cron job hay lazy check on request?

---

## Output format

Tạo file `docs/audit/RANKED_SELECTION_AUDIT.md` với cấu trúc:

```markdown
# Ranked Question Selection — Code Audit

**Date:** [YYYY-MM-DD]
**Auditor:** Claude Code
**Scope:** Read-only audit, no code changes

---

## Executive Summary

[3-5 câu tóm tắt flow chính + những điểm quan trọng nhất phát hiện được]

---

## A. Backend Entry Points

### A.1 `POST /api/ranked/questions/select`

**File:** `apps/api/.../RankedController.java:226-300`

**Request body:**
```json
{
  "limit": number,
  "excludeIds": number[],
  "book": string | null,
  "difficulty": string | null,
  "language": string
}
```

**Flow:**
1. `:233` — Đọc `book` từ request body
2. `:255-256` — `filter.book = (book != null && !book.isBlank()) ? book : null`
3. ...

[Tiếp tục cho từng endpoint]

---

## B. Book Progression Logic

### B.1 `currentBook` advance condition

**File:** `RankedController.java:411-427`

**Trigger:** [exact condition từ code]

**Threshold mastery:** [số %, ví dụ 80%]

**Order rule:** [theo book.order_index? wraparound?]

**Side effects when advance:**
- [list]

---

## C. SmartQuestionSelector

### C.1 selectQuestions() signature

**File:** `SmartQuestionSelector.java:36-76`

```java
[paste exact signature]
```

### C.2 Tier difficulty distribution

**File:** `TierDifficultyConfig.java:13-22`

| Tier | Easy% | Medium% | Hard% | Timer |
|---|---|---|---|---|
| 1 | [from code] | ... | ... | ... |
[6 rows]

**Confirm khớp với SPEC §3.2:** [YES / NO + diff nếu có]

### C.3 4-pool priority

**File:** `SmartQuestionSelector.java:90-154`

| Pool | % | Query logic | File:line |
|---|---|---|---|
| 1 (chưa thấy) | [from code] | [SQL/JPQL summary] | ... |
| 2 (SRS review) | [from code] | ... | ... |
| 3 (>30 ngày) | [from code] | ... | ... |
| 4 (recent) | [from code] | ... | ... |

### C.4 Shuffle implementation

**Method:** [Collections.shuffle / SQL ORDER BY RAND / reservoir sampling / khác]

**File:line:** ...

**Memory characteristic:** [load all then shuffle / streaming / SQL-side]

---

## D. Frontend — Web

### D.1 Ranked.tsx request body

**File:** `apps/web/src/pages/Ranked.tsx:[lines]`

```tsx
[paste exact body code]
```

**Fields sent to BE:** `limit`, `excludeIds`, `book`, `difficulty`, `language`

**Source of each field:**
- `book` ← `rankedStatus.currentBook`
- `difficulty` ← `rankedStatus.currentDifficulty`
- ...

### D.2 UI display — currentBook visibility

**Component file:line:** ...

**Label text (i18n key + Vietnamese resolved):** ...

**Screenshot description:** "[describe what user sees, no actual image needed]"

---

## E. Frontend — Mobile

### E.1 RankedScreen.tsx request body

**File:** `apps/mobile/src/screens/quiz/RankedScreen.tsx:[lines]`

[Same structure as D.1]

**Comparison with web:**
| Field | Web sends? | Mobile sends? |
|---|---|---|
| limit | ✅ | ? |
| excludeIds | ✅ | ? |
| book | ✅ | ? |
| difficulty | ✅ | ? |
| language | ✅ | ? |

**⚠️ Discrepancy found:** [YES / NO + detail]

---

## F. Liturgical Season Integration (negative confirmation)

### F.1 Season filter in question selection

**Grep result for "season" in SmartQuestionSelector.java:** [count + locations or "0 matches"]

**Grep result for "season" in RankedController.java (selection methods only):** [count + locations]

**Conclusion:** [confirm Claim 1-4 from Section D of prompt, with evidence]

### F.2 ×1.5 multiplier source

**File:** `ScoringService.java:96-107`

```java
[paste exact multiplier formula]
```

**Multiplier active when:** [exact condition from code]

**Liturgical season multiplier:** [NOT WIRED / WIRED at file:line]

---

## G. Edge cases observed

### G.1 Pool exhaustion fallback

[Step-by-step what BE does when pool cạn]

### G.2 Energy = 0 behavior

[What happens to /ranked/questions/select call]

### G.3 Daily cap 100 reached

[What happens]

### G.4 Guest user

[What happens]

### G.5 Tier 1 without Basic Quiz passed

[What happens]

---

## H. Discrepancies between SPEC and code

| Spec reference | Spec says | Code says | File:line | Severity |
|---|---|---|---|---|
| §3.2 Tier distribution | 70/25/5 → 5/35/60 | [from code] | TierDifficultyConfig.java:13-22 | [match/drift] |
| §5.2 Endpoints | POST /api/ranked/session | [actual endpoint] | ... | ... |
| §5.6 ×1.5 season | Áp dụng Ranked + Daily | NOT WIRED | ScoringService.java:96-107 | DRIFT |
| §6.2 Mastery formula | Đáp đúng ≥ 1 lần / total | [from code] | BookMasteryService.java:... | ... |

---

## I. Open questions for Bui

[Liệt kê những điểm code KHÔNG ĐỦ rõ để conclude, cần Bui clarify business intent]

Ví dụ:
1. `RankedController.java:411-427` advance currentBook khi mastery ≥ 80%. Nhưng nếu user đã master Genesis 80%+ trước khi unlock Ranked (qua Practice), thì khi user lần đầu vào Ranked, currentBook khởi tạo là gì? [code path không rõ]

---

## Appendix: File inventory

Danh sách tất cả file đã đọc trong audit:

- `apps/api/src/main/java/com/biblequiz/api/RankedController.java` (full read)
- `apps/api/src/main/java/com/biblequiz/modules/ranked/service/SmartQuestionSelector.java` (full read)
- ...
```

---

## Rules cho Claude Code

1. **Verification-first:** Mọi claim có `file:line`. Không paraphrase từ memory.
2. **Read-only:** KHÔNG edit, KHÔNG create file ngoài `docs/audit/RANKED_SELECTION_AUDIT.md`.
3. **No suggestions:** KHÔNG đề xuất fix / refactor / improvement. Chỉ report.
4. **SPEC drift highlighted:** Khi code khác spec, đánh dấu rõ "**SPEC DRIFT**" ở cột severity.
5. **Honest unknowns:** Section I "Open questions for Bui" phải có ít nhất 3 câu hỏi nếu codebase có ambiguity. Đừng giấu dưới giả định.
6. **Mobile critical:** Phần E (Mobile) là MUST — không skip dù file có tồn tại hay không. Nếu file không tồn tại → report "FILE NOT FOUND at expected path" + grep alternative paths.
7. **No code changes:** Khi audit xong, KHÔNG run build / KHÔNG run tests. Bui sẽ review file `docs/audit/RANKED_SELECTION_AUDIT.md` rồi decide next steps.

---

## Done criteria

- [ ] File `docs/audit/RANKED_SELECTION_AUDIT.md` exists
- [ ] Tất cả 9 sections (A-I) đều có nội dung
- [ ] Mỗi claim quan trọng có `file:line` reference
- [ ] Section H (SPEC drift) có ít nhất 4 rows (4 claim Bui đã đề ra)
- [ ] Section I (Open questions) có ít nhất 3 câu hỏi
- [ ] Section E (Mobile) đã verify hoặc note "FILE NOT FOUND"
- [ ] KHÔNG có file nào khác được tạo / edit ngoài audit doc

Khi xong, output cuối cùng chỉ là 1 câu:
> "Audit complete. File saved at `docs/audit/RANKED_SELECTION_AUDIT.md`. Section H found [N] SPEC drifts. Section I has [N] open questions."

Sau đó STOP — đợi Bui review.
