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
- **Spec impact**: [x] SPEC_USER §3.2/§6 (book progression) — strategy (a) inline note.

### Addendum — Option C (hybrid, user chốt 2026-06-24)
> Sau khi ship whole-pool (RWP, commit `b2a2687d`), user muốn GIỮ cảm giác "đi xuyên Kinh Thánh theo sách". Đổi sang **hybrid**: ~70% câu sách hiện tại + ~30% toàn pool; sách tiến đều theo sample-target.
- C-1 select hybrid 70/30 (current book + whole pool), cross-day exclude giữ nguyên — Status: [x] DONE (`RANKED_CURRENT_BOOK_RATIO=0.7`, LinkedHashMap dedup, whole-pool fill khi sách hiện tại cạn).
- C-2 advance gate hoạt động: `answeredCount(currentBook) ≥ rankedBookSampleTarget = clamp(round(bookTotal×0.25),12,40)` → sang sách kế. Tỷ lệ 25% (user chốt 2026-06-24, hợp tinh thần dưỡng linh — tôn trọng sách giàu). currentBook ổn định — Status: [x] DONE.
- C-3 FE re-add `book: currentBook` (Ranked.tsx + Quiz.tsx) — Status: [x] DONE.
- C-4 Test: RankedControllerTest 57/57 (hybrid select 2-call + advance-gate reached/below) — Status: [x] DONE. SPEC §3.2 updated → hybrid.
