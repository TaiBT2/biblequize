# MANUAL_TEST_QUIZSET — Solo Replay + Co-Play

> Run after merging branches up to `feat(fe): WebSocket carries quiz set context...`.
> Requires 2+ accounts in different groups, plus a leader account in the same group.

## Pre-flight
- [ ] BE on :8080, FE on :5173
- [ ] V54 migration applied cleanly (`SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_name = 'fk_rooms_group_quiz_set'` returns 1)
- [ ] At least one PUBLISHED quiz set in test group

---

## Solo replay (mastery semantics, NO 3-attempt cap)

- [ ] **S1.** Member opens published quiz set card → "Chơi solo" button enabled, no badge until first play
- [ ] **S2.** Click solo → modal "Lượt chơi đầu tiên — chúc may mắn!" → confirm → quiz launches with the set's exact questions (verify ID-by-ID via `SELECT id FROM questions WHERE id IN (?...)` matches `quiz_set.questionIds`)
- [ ] **S3.** Complete quiz → returns to group page → card now shows personal-best banner with score/accuracy
- [ ] **S4.** `SELECT total_attempts, best_score FROM group_quiz_set_mastery WHERE quiz_set_id=? AND user_id=?` → both incremented
- [ ] **S5.** Replay 4 more times (total 5 attempts) → button stays enabled the whole time (NO cap). best_score tracks the max.
- [ ] **S6.** GET `/api/groups/{g}/quiz-sets/{s}/my-attempts` → `attempts.length === 5` (or the cap of 10), `masterySummary.totalAttempts === 5`
- [ ] **S7.** GET `/api/groups/{g}/quiz-sets/{s}/leaderboard` → entry for user with `bestScore === MAX of 5 attempts`, `totalAttempts === 5`
- [ ] **S8.** Click chevron on my-attempts panel → expands list of (up to 10) past sessions. Best score row highlighted gold.
- [ ] **S9.** DRAFT quiz set → "Chơi solo" button NOT rendered (only "Tiếp tục soạn" for leader)
- [ ] **S10.** Non-member directly POSTs `/solo-practice` → 403

---

## Co-play security (Audit Gap 1)

> **CRITICAL — penetration test with 3 separate accounts.**

- [ ] **C1.** Member A on PUBLISHED quiz set → click "Chơi cùng nhau" → button shows "Đang tạo phòng..." → navigate `/room/{roomId}/lobby`
- [ ] **C2.** Topbar shows mode chip "Speed Race" + gold pill `📚 {QuizSetName}` + room code
- [ ] **C3.** Member B (same group) joins via room code → success, sees same banner
- [ ] **C4.** **User C (different group, valid account)** tries POST `/api/rooms/{code}/join` (or join via room code in UI) → 403 with message `Bạn không phải thành viên của nhóm này`
- [ ] **C5.** Anonymous user tries → 401 (auth required)
- [ ] **C6.** Game starts → questions match quiz set definition (`SELECT question_id FROM quiz_session_questions WHERE session_id=? ORDER BY order_index` if any per-session log; else verify via UI)
- [ ] **C7.** Game ends → final ranking displayed
- [ ] **C8.** **Q-A boundary**: `SELECT * FROM group_quiz_set_mastery WHERE quiz_set_id=? AND user_id IN (memberA, memberB)` count BEFORE vs AFTER co-play → unchanged. Co-play does NOT update mastery.
- [ ] **C9.** Member A solo `total_attempts` BEFORE co-play vs AFTER → unchanged (solo + co-play are separate paths)
- [ ] **C10.** DRAFT quiz set → "Chơi cùng nhau" button visible BUT direct POST to `/play` → 400 (defense in depth — current /play allows DRAFT for creator only; UI gates by isMember+PUBLISHED)
- [ ] **C11.** ARCHIVED quiz set → primary CTA shows "Xem chi tiết", co-play hidden
- [ ] **C12.** Member B mid-game leaves and rejoins via /lobby → success (existing RoomPlayer row exempts membership re-check)

---

## RoomLobby + RoomQuiz quiz set context

- [ ] **L1.** Refresh lobby page after creation → quiz set pill still rendered (BE supplies via RoomDetailsDTO, no localStorage dependency)
- [ ] **L2.** Open room via deep-link in fresh tab → pill renders correctly
- [ ] **L3.** Quiz screen header (during gameplay) shows the quiz set pill alongside the mode chip
- [ ] **L4.** Regular (non-quizset) multiplayer room → no quiz set pill anywhere (regression check)

---

## Card visual / mockup parity

- [ ] **V1.** Open `docs/group-page/MOCKUP_QUIZSET_CARDS.html` side-by-side with QuizSetList page
- [ ] **V2.** Header strip: status badge color matches (green/gray/copper/blue), book pill is gold tinted
- [ ] **V3.** Body: title (Sora 17px 700), italic "Chưa có mô tả" fallback, 3 difficulty pills, stats row pill
- [ ] **V4.** Action footer: 1 primary CTA (gold) + 2 icon buttons (40-42dp), state-aware
- [ ] **V5.** No CSS variable bug: card visible on dark navy background, no white-on-white text
- [ ] **V6.** Verify hardcoded hex: `grep "var(--" apps/web/src/components/group/QuizSetListCard.tsx` returns 0 hits

---

## Known deviations from mockup (documented)
- **Difficulty pill counts**: BE only exposes a single `difficulty` enum; the 3-pill display approximates by mapping single difficulty -> all-or-nothing distribution (MIXED splits 40/40/20). Real per-level counts would need a BE migration to denormalize. Flagged in IMPL_NOTES.md.
- **⋯ menu**: rendered for leader/mod but currently no-op (TODO marker). Edit/Delete are reachable via the QuizSet detail page; the menu is reserved for inline actions in a future commit.
