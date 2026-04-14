# W-M03 — Practice Mode (L1 Smoke)

**Routes:** `/practice`, `/quiz`, `/review`
**Spec ref:** SPEC_USER §5.1

---

### W-M03-L1-001 — Trang Practice Selection render đúng

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @practice

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/practice')`
2. `page.waitForSelector('[data-testid="practice-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/practice')`
- `expect(page.getByTestId('practice-book-select')).toBeVisible()`
- `expect(page.getByTestId('practice-difficulty-all')).toBeVisible()`
- `expect(page.getByTestId('practice-count-10')).toBeVisible()`
- `expect(page.getByTestId('practice-start-btn')).toBeVisible()`
- `expect(page.getByTestId('practice-start-btn')).toBeEnabled()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: practice-page] — wrapper trang Practice
- [NEEDS TESTID: practice-book-select] — SearchableSelect chọn sách
- [NEEDS TESTID: practice-difficulty-all, practice-difficulty-easy, practice-difficulty-medium, practice-difficulty-hard] — 4 nút difficulty
- [NEEDS TESTID: practice-count-5, practice-count-10, practice-count-20, practice-count-50] — 4 nút số câu
- [NEEDS TESTID: practice-start-btn] — nút "Bắt Đầu Luyện Tập"

---

### W-M03-L1-002 — Chọn difficulty Easy và bắt đầu quiz

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @smoke @practice

**Setup**: none

**Preconditions**:
- User đã đăng nhập
- Có questions trong DB

**Actions**:
1. `page.goto('/practice')`
2. `page.getByTestId('practice-difficulty-easy').click()`
3. `page.getByTestId('practice-count-5').click()`
4. `page.getByTestId('practice-start-btn').click()`
5. `page.waitForURL('/quiz')`

**Assertions**:
- `expect(page).toHaveURL('/quiz')`
- `expect(page.getByTestId('quiz-question-text')).toBeVisible()`
- `expect(page.getByTestId('quiz-option-0')).toBeVisible()`
- `expect(page.getByTestId('quiz-option-1')).toBeVisible()`
- `expect(page.getByTestId('quiz-option-2')).toBeVisible()`
- `expect(page.getByTestId('quiz-option-3')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: quiz-question-text] — text nội dung câu hỏi
- [NEEDS TESTID: quiz-option-0, quiz-option-1, quiz-option-2, quiz-option-3] — 4 đáp án (index 0-3)
- POST /api/sessions được gọi khi bắt đầu

---

### W-M03-L1-003 — Quiz: chọn đáp án → nhận feedback

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @smoke @practice @critical

**Setup**: none

**Preconditions**:
- Đang ở `/quiz` với session active (navigate từ W-M03-L1-002)
- Hoặc: tạo fresh session qua API

**Actions**:
1. `page.goto('/practice')` → start 5 câu dễ → navigated to `/quiz`
2. `page.waitForSelector('[data-testid="quiz-question-text"]')`
3. `page.getByTestId('quiz-option-0').click()`
4. `page.waitForSelector('[data-testid="quiz-feedback"]')`

**Assertions**:
- `expect(page.getByTestId('quiz-feedback')).toBeVisible()`
- `expect(page.getByTestId('quiz-next-btn')).toBeVisible()`
- `expect(page.getByTestId('quiz-option-0')).toHaveAttribute('data-state', /correct|wrong/)` ← option được highlight

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: quiz-feedback] — panel kết quả đáp án (Correct/Incorrect + points)
- [NEEDS TESTID: quiz-next-btn] — nút "Next Question" sau khi trả lời
- `data-state` attribute hoặc class tương đương cho correct/wrong state

---

### W-M03-L1-004 — Quiz: hoàn thành → redirect đến trang kết quả

**Priority**: P0
**Est. runtime**: ~20s
**Auth**: storageState=tier3
**Tags**: @smoke @practice @critical

**Setup**: none

**Preconditions**:
- User đã đăng nhập, có questions trong DB

**Actions**:
1. `page.goto('/practice')` → chọn 5 câu, click Start
2. `page.waitForURL('/quiz')`
3. Loop 5 lần: click `quiz-option-0` → click `quiz-next-btn`
4. `page.waitForSelector('[data-testid="quiz-results-page"]')`

**Assertions**:
- `expect(page.getByTestId('quiz-results-page')).toBeVisible()`
- `expect(page.getByTestId('quiz-results-score')).toBeVisible()`
- `expect(page.getByTestId('quiz-results-review-btn')).toBeVisible()`
- `expect(page.getByTestId('quiz-results-home-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: quiz-results-page] — trang QuizResults
- [NEEDS TESTID: quiz-results-score] — SVG circle với "X/5"
- [NEEDS TESTID: quiz-results-review-btn] — nút "Review"
- [NEEDS TESTID: quiz-results-home-btn] — nút "Home" (gold gradient)
- Timeout tăng lên ~20s vì cần click qua 5 câu

---

### W-M03-L1-005 — Navigate từ kết quả → Review page

**Priority**: P1
**Est. runtime**: ~25s
**Auth**: storageState=tier3
**Tags**: @smoke @practice

**Setup**: none

**Preconditions**:
- Đang ở trang Quiz Results sau khi hoàn thành quiz

**Actions**:
1. (Hoàn thành quiz như W-M03-L1-004)
2. `page.getByTestId('quiz-results-review-btn').click()`
3. `page.waitForURL('/review')`

**Assertions**:
- `expect(page).toHaveURL('/review')`
- `expect(page.getByTestId('review-page')).toBeVisible()`
- `expect(page.getByTestId('review-filter-all')).toBeVisible()`
- `expect(page.getByTestId('review-filter-wrong')).toBeVisible()`
- `expect(page.getByTestId('review-filter-correct')).toBeVisible()`
- `expect(page.getByTestId('review-question-list').locator('[data-testid="review-question-item"]')).toHaveCount(5)`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: review-page] — wrapper trang Review
- [NEEDS TESTID: review-filter-all, review-filter-wrong, review-filter-correct] — 3 tab filter
- [NEEDS TESTID: review-question-list] — container danh sách câu hỏi
- [NEEDS TESTID: review-question-item] — mỗi question card

---

### W-M03-L1-006 — Review: filter tab "Wrong" chỉ hiện câu sai

**Priority**: P1
**Est. runtime**: ~30s
**Auth**: storageState=tier3
**Tags**: @smoke @practice

**Setup**: none

**Preconditions**:
- Đang ở `/review` với stats có ít nhất 1 câu sai

**Actions**:
1. (Hoàn thành quiz có ít nhất 1 sai, navigate đến /review)
2. `page.getByTestId('review-filter-wrong').click()`

**Assertions**:
- `expect(page.getByTestId('review-filter-wrong')).toHaveAttribute('data-active', 'true')` ← tab active
- `expect(page.getByTestId('review-question-list').locator('[data-testid="review-question-item"]').count())` < tổng số câu

**Cleanup**: none

**Notes**:
- Tab active state cần `data-active` attribute hoặc class indicator

---

### W-M03-L1-007 — Review: nút "Retry Wrong" tạo session mới

**Priority**: P1
**Est. runtime**: ~30s
**Auth**: fresh login as test3@dev.local
**Tags**: @smoke @practice @write

**Setup**: none

**Preconditions**:
- Đang ở `/review` với ít nhất 1 câu sai (wrongCount > 0)

**Actions**:
1. (Hoàn thành quiz có câu sai → navigate đến /review)
2. `page.getByTestId('review-retry-btn').click()`
3. `page.waitForURL('/quiz')`

**Assertions**:
- `expect(page).toHaveURL('/quiz')`
- `expect(page.getByTestId('quiz-question-text')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: review-retry-btn] — nút "Làm lại" (gold gradient, chỉ hiện khi có câu sai)
- Gọi `POST /api/sessions/{sessionId}/retry`

---

### W-M03-L1-008 — Practice với sách cụ thể (filter by book)

**Priority**: P2
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @smoke @practice

**Setup**: none

**Preconditions**:
- User đã đăng nhập
- Có questions cho sách "Genesis" trong DB

**Actions**:
1. `page.goto('/practice')`
2. `page.getByTestId('practice-book-select').click()`
3. `page.getByRole('option', { name: 'Genesis' }).click()` ← hoặc type + select
4. `page.getByTestId('practice-count-5').click()`
5. `page.getByTestId('practice-start-btn').click()`
6. `page.waitForURL('/quiz')`

**Assertions**:
- `expect(page).toHaveURL('/quiz')`
- `expect(page.getByTestId('quiz-question-book')).toHaveText(/Genesis|Sáng Thế/)`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: quiz-question-book] — label sách hiển thị trên quiz header
- Nếu không có questions cho sách được chọn → nút Start bị disabled hoặc hiện error

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Practice page wrapper | `practice-page` | Practice.tsx |
| Book selector | `practice-book-select` | Practice.tsx |
| Difficulty buttons | `practice-difficulty-all/easy/medium/hard` | Practice.tsx |
| Count buttons | `practice-count-5/10/20/50` | Practice.tsx |
| Start button | `practice-start-btn` | Practice.tsx |
| Quiz question text | `quiz-question-text` | Quiz.tsx |
| Quiz question book label | `quiz-question-book` | Quiz.tsx |
| Answer options | `quiz-option-0/1/2/3` | Quiz.tsx |
| Answer feedback panel | `quiz-feedback` | Quiz.tsx |
| Next question button | `quiz-next-btn` | Quiz.tsx |
| Results page | `quiz-results-page` | QuizResults.tsx |
| Results score | `quiz-results-score` | QuizResults.tsx |
| Review button | `quiz-results-review-btn` | QuizResults.tsx |
| Home button | `quiz-results-home-btn` | QuizResults.tsx |
| Review page | `review-page` | Review.tsx |
| Filter tabs | `review-filter-all/wrong/correct` | Review.tsx |
| Question list | `review-question-list` | Review.tsx |
| Question item | `review-question-item` | Review.tsx |
| Retry button | `review-retry-btn` | Review.tsx |

---

## NOT IMPLEMENTED Summary

_Không phát hiện feature nào spec mô tả mà code chưa implement._
