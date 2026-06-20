# 2026-06-20 — Multiplayer: đa dạng phần chọn sách (nhóm chủ đề + từng sách)

> **Source**: User — "trong chế độ multiplayer, phần chọn sách từ hệ thống để khá ít, tôi muốn đa dạng hơn". · **Scope**: Multiplayer room book-scope picker (CreateRoom + QuickMatch) + question selection BE.

Hiện tại dropdown chọn sách multiplayer chỉ có 4 option (ALL / OLD_TESTAMENT / NEW_TESTAMENT / GOSPELS) — và **3 nhóm OT/NT/GOSPELS là no-op** (RoomQuizService coi mọi giá trị ≠ ALL/_TESTAMENT/GOSPELS là tên sách literal → 3 nhóm này rơi vào nhánh "không filter" = giống ALL).

Quyết định (xác nhận với user 2026-06-20):
- Hành vi: **Cả nhóm chủ đề + từng sách** (groups + 66 sách riêng lẻ).
- Phạm vi: **Tất cả 66 sách** hiển thị; nếu pool sách/nhóm rỗng → **fallback về pool chung**.

Dữ liệu nền:
- `Question.book` lưu **tên tiếng Anh** ("Genesis", "1 Chronicles", "Acts"). Cả 66 sách đều có câu hỏi seeded.
- Practice đã gửi `Book.name` (English) qua `/api/books`. MP option value = tên English; label hiển thị VN (`useBookName`).
- Sentinel nhóm: ALL / OLD_TESTAMENT / NEW_TESTAMENT / PENTATEUCH / HISTORY / WISDOM / PROPHETS / GOSPELS / EPISTLES.

### Tasks

- MBV-1 BE: helper `BookScopes.expand(scope) → List<String>` (nhóm→sách; sách→single; ALL/unknown→empty)
  - Status: [x] DONE · Files: `infrastructure/bible/BookScopes.java` · Test: `BookScopesTest`
  - Group index ranges bám `BibleStructure.getCanonicalBooks()` (Pentateuch 0-4, History 5-16, Wisdom 17-21, Prophets 22-38, Gospels 39-42, Epistles 43-65).
  - **Spec impact**: [ ] SPEC_MULTIPLAYER (book scope) · **Spec strategy**: [ ] (a) update inline (gộp MBV-4)

- MBV-2 BE: repo IN-methods + wire `RoomQuizService.loadQuestionsFromDatabase` (expand + fallback)
  - Status: [x] DONE · Files: `QuestionRepository.java`, `RoomQuizService.java` · Test: existing AI/room tests + new
  - Add `findRandomQuestionsByLanguageAndBooksExcludingIds` + `...AndBooksAndDifficultyExcludingIds`. Empty filtered result + scope≠empty → fallback pool chung (giữ difficulty nếu có).
  - **Spec impact**: [ ] (gộp) · **Spec strategy**: [ ] (a)

- MBV-3 BE: wire `QuickMatchQuestionSourceService.pickDatabaseIds` (expand + fallback) + AI-path guard
  - Status: [x] DONE · Files: `QuickMatchQuestionSourceService.java`, `RoomController.java` (AI branch resolve group→1 sách) · Test: new
  - **Spec impact**: [ ] (gộp) · **Spec strategy**: [ ] (a)

- MBV-4 FE: component dùng chung `BookScopeOptions` (nhóm + 66 sách) cho CreateRoom + QuickMatchConfigModal + i18n
  - Status: [x] DONE · Files: `pages/create-room/BookScopeOptions.tsx`, `CreateRoom.tsx`, `multiplayer/QuickMatchConfigModal.tsx`, `i18n/vi.json`, `i18n/en.json` · Test: CreateRoom.test + modal test
  - `<select>` + `<optgroup>` (Nhóm chủ đề / Cựu Ước / Tân Ước); value nhóm=sentinel, value sách=English name.
  - **Spec impact**: [ ] SPEC_MULTIPLAYER · **Spec strategy**: [ ] (a) update inline · i18n no tăng count
