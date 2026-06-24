# 2026-06-24 — Ranked: bỏ phễu 1-sách + chống lặp cross-day (RWP)

> **Source**: user report — Ranked trùng lặp + kẹt Sáng Thế Ký sau 350+ câu. DB xác nhận (user `75a6f113…`): UBP Genesis 77/100 unique, 43/70 correct; 144 lượt Genesis / 95 distinct (~34% lặp), 100% lượt Ranked trong Genesis. Không phải bug persistence — lỗi thiết kế phễu 1-sách + gate tiến sách yếu/chết. · **Scope**: `RankedController.selectRankedQuestions` + submit book-progression, `UserQuestionHistoryRepository`, FE `Ranked.tsx`/`Quiz.tsx`. KHÔNG đụng scoring (`calculateRanked`).

### Tasks
- RWP-1 (#1) Whole-pool: bỏ lọc `currentBook` ở Ranked select (non-coverage) → rút toàn 66 sách (3348 câu)
  - Status: [x] DONE — selectRankedQuestions else-branch `book=(String)null`; FE Ranked.tsx + Quiz.tsx bỏ gửi `book`.
- RWP-2 (#2) Cross-day exclude: loại N câu gần nhất theo UQH `lastSeenAt`, không chỉ asked-hôm-nay
  - Status: [x] DONE — `findRecentSeenQuestionIds(userId, Pageable)` + augment excludeSet 80 IDs (non-coverage).
- RWP-3 (#3) Bỏ gate tiến-sách chết + sửa UBP key
  - Status: [x] DONE — bỏ dead `shouldAdvanceToNextBook` + post-cycle; currentBook = sách câu vừa trả lời; UBP key theo `currentQ.getBook()` (stat đúng), bỏ advance.
- RWP-4 Test BE + regression
  - Status: [x] DONE — RankedControllerTest 57/57 (2 test cũ viết lại theo design mới + 1 test whole-pool/exclude); ScoringServiceTest 49; FE build + vitest 1415/1415.
- **Spec impact**: [x] SPEC_USER §3.2/§6 (book progression) — strategy (a) inline note Ranked dùng whole-pool history-aware thay vì sequential book funnel.
