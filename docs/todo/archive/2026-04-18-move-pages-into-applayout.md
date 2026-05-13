# 2026-04-18 — Move Pages into AppLayout [DONE — pending local test run]

### Task L-1: Move routes into AppLayout in main.tsx [x] DONE
- Moved: /practice, /review, /multiplayer, /rooms, /room/create, /room/join into AppLayout block
- Kept full-screen: /quiz, /room/:id/lobby, /room/:id/quiz, /landing, /login, /register, /auth/callback
- Commit: "fix: move lobby, practice, review pages into AppLayout for consistent nav"

### Task L-2: Clean up page wrappers after AppLayout move [x] DONE
- Multiplayer.tsx: bỏ `max-w-7xl mx-auto`, giữ `space-y-8` + data-testid
- Practice.tsx: bỏ `max-w-7xl mx-auto`, giữ `space-y-10` + data-testid
- CreateRoom.tsx: bỏ `min-h-screen bg-[#11131e] text-[#e1e1f1] flex items-start justify-center px-4 py-12`, thay bằng `flex justify-center`
- Review.tsx:
  - Root wrapper: bỏ `min-h-screen bg-[#11131e] flex` → `flex flex-col`
  - Bỏ `<main className="flex-1 flex flex-col h-screen overflow-y-auto">` (AppLayout's main đã có overflow-y-auto)
  - Sticky header: z-50 → z-40 (dưới AppLayout global header z-50), thêm `-mx-8 md:-mx-14 -mt-8 md:-mt-14 mb-6` để break out khỏi AppLayout padding và trải full-width
  - Empty state: bỏ `min-h-screen bg-[#11131e]`, thay bằng `py-20 px-4`
- Commit: "refactor: remove redundant layout wrappers in pages moved to AppLayout"

### Task L-3: Add routing layout invariant test [x] DONE
- File mới: apps/web/src/__tests__/routing-layout.test.tsx
- Test 1: 22 cases — mỗi path INSIDE AppLayout phải declared trong AppLayout block
- Test 2: 7 paths × 2 = 14 cases — mỗi full-screen path KHÔNG được ở trong AppLayout block nhưng phải tồn tại trong main.tsx
- Test 3: 6 regression guards (Multiplayer/Practice/CreateRoom/Review inside; Quiz/RoomQuiz outside)
- Test 4: 4 wrapper cleanup invariants (Multiplayer/Practice/CreateRoom/Review không có layout-duplicating classes)
- Tổng: ~46 new test cases
- Commit: "test: add routing layout invariant test"

### Task L-4: Full regression
- Status: [ ] PENDING — user chạy local (sandbox không chạy được vitest vì node_modules Windows)
- Run: `cd apps/web && npx vitest run`
- Expected: 733 baseline + ~46 new = ~779 tests pass

### Task UM-1: Fix user menu không đóng khi click outside [x] DONE
- File(s): apps/web/src/layouts/AppLayout.tsx (FILE NHẠY CẢM)
- Root cause: overlay click-outside z-40 bị header z-50 che → click vào top 80px không đóng menu
- Fix:
  - Thêm `useRef<HTMLDivElement>` (userMenuRef) bọc container có avatar + dropdown
  - Thêm `useEffect` listen mousedown + touchstart + keydown (Escape) trên document, đóng menu nếu click ngoài menuRef
  - Bỏ overlay `<div className="fixed inset-0 z-40">` + bỏ fragment wrapper
  - Thêm data-testid (`user-menu-toggle`, `user-menu-dropdown`, `user-menu-container`) và aria (`role="menu"`, `aria-haspopup`, `aria-expanded`)
- Commit: "fix: user menu closes on click outside (document listener instead of z-40 overlay)"

### Task UM-2: Thêm test case cho click-outside behavior [x] DONE
- File(s): apps/web/src/layouts/__tests__/AppLayout.test.tsx
- Added describe block "AppLayout — User menu click-outside" với 7 test cases:
  1. click body outside → menu closes
  2. click header area → menu closes (regression guard cho bug gốc)
  3. press Escape → menu closes
  4. click inside menu → menu stays open
  5. click avatar 2 lần → toggle đóng lại
  6. aria-expanded phản ánh đúng state
  7. cleanup listeners khi menu đóng (no leaks)
- Commit: "test: add user menu click-outside behavior tests"
