# 2026-05-19 — Mobile rewrite S4: Quiz Set workflow (personal + group list)

> **Source**: Master roadmap [`2026-05-18-mobile-rewrite-roadmap.md`](2026-05-18-mobile-rewrite-roadmap.md) Sprint 4
> **Scope**: Personal quiz set CRUD MVP (list + editor + question CRUD + publish + detail view) + group quiz set LIST (read-only nav). **Defer**: AI generation, auto-save complex, folder mgmt, advanced filters, group set editor.
> **Why now**: BL-11 SetEditor + MySets gap còn open sau S3. M2 milestone (full parity) cần CRUD UI mobile.

> **Recon (2026-05-19)**: Web có 2 contexts personal (`/api/question-sets`) + group (`/api/groups/{id}/quiz-sets`). Editor shared (QuizSetEditor 600+ LOC, 15 metadata fields, DRAFT→PUBLISHED workflow). Question CRUD qua `/api/user-questions/*` rồi attach via `/items`. Mobile MVP cắt AI gen, auto-save, folder, visibility toggle.

> **Sprint status (2026-05-19)**: ✅ DONE — 7 task + plan + finalize.
> **Commits**: 5cdaaaa (plan) · 7bdaf80 (S4-1 API) · f7fd099 (S4-2 MySets) · ec7f23d (S4-3 Detail) · a4f04e5 (S4-4 Editor) · d8e8120 (S4-5 QuestionEditor) · aac1baf (S4-6 GroupList) · 17d0652 (S4-7 nav).
> **Regression**: mobile jest 33/33 PASS · mobile tsc CLEAN · web untouched.

### Tasks

- **S4-1 API client wrappers — personalQuizSets**
  - New `apps/mobile/src/api/personalQuizSets.ts` — mirror web shape:
    - `listMySets()`, `createSet(body)`, `getSetFull(id)`, `updateSet(id, body)`, `publishSet(id)`, `deleteSet(id)`
    - `addQuestion(setId, body)` → POST /api/user-questions → POST /items → refetch
    - `updateQuestion(setId, qid, body)`, `deleteQuestion(setId, qid)`, `reorderQuestions(setId, ids)`
  - Inline TypeScript types: QuizSet, QuizSetFull, EditorQuestion, CreateQuizSetBody
  - Status: [x] DONE
  - Files: `apps/mobile/src/api/personalQuizSets.ts` (new)
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S4-2 MySets screen**
  - New `apps/mobile/src/screens/quizSets/MySetsScreen.tsx` — list personal sets via `listMySets()`, render 2-col grid Cards
  - Card: status badge (NHÁP gold / ĐÃ XUẤT BẢN green), name, question count, updatedAt relative, tap → Detail
  - FAB "+ Tạo bộ mới" → navigate Editor (create mode)
  - Empty state: "Chưa có bộ câu hỏi nào" + CTA
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/quizSets/MySetsScreen.tsx` (new)
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S4-3 QuizSetDetailScreen — read-only view**
  - New `apps/mobile/src/screens/quizSets/QuizSetDetailScreen.tsx` — fetch `getSetFull(id)`, render:
    - Header: name + status badge + meta (difficulty, language, est duration)
    - Description + coverScripture + tags chips
    - Question count badge
    - Questions preview list (first 5 — full list trong editor)
    - "Bắt đầu Luyện Tập" gold button (calls solo practice — defer wire BE since `/api/question-sets/{id}/solo-practice` chưa expose cho personal; show coming soon nếu personal context)
    - Edit button → Editor (nếu owner — mặc định cho personal)
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/quizSets/QuizSetDetailScreen.tsx` (new)
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S4-4 PersonalQuizSetEditor screen — metadata + questions list**
  - New `apps/mobile/src/screens/quizSets/PersonalQuizSetEditorScreen.tsx`:
    - Mode: create (POST /api/question-sets ngay khi mount, redirect to edit với id) | edit
    - Top bar: name input (TextInput) + manual save button + publish button (label "Xuất bản" khi DRAFT, "Đã xuất bản ✓" khi PUBLISHED)
    - Metadata accordion: description, tags (comma-separated input), coverScripture, difficulty (segmented), estimatedDurationMin (number input)
    - Questions list: ordered, tap row → QuestionEditor sub-screen
    - "+ Thêm câu hỏi" button → QuestionEditor (create mode)
    - Delete question swipe action (or trash icon)
    - Publish validation: name truthy + ≥ 5 questions
  - Manual save (no auto-save complexity); show "Đã lưu lúc HH:MM" timestamp
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/quizSets/PersonalQuizSetEditorScreen.tsx` (new)
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S4-5 QuestionEditor sub-screen — full question form**
  - New `apps/mobile/src/screens/quizSets/QuestionEditorScreen.tsx`:
    - Mode: create (no qid) | edit (qid param)
    - Form: content (multiline), 4 option inputs với radio để pick correctAnswer, difficulty (segmented EASY/MEDIUM/HARD), book + chapter, explanation (multiline), language
    - Save button → addQuestion hoặc updateQuestion → navigate back to Editor
    - Cancel button → navigate back without saving
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/quizSets/QuestionEditorScreen.tsx` (new)
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S4-6 GroupQuizSetList screen — group context list**
  - New `apps/mobile/src/screens/quizSets/GroupQuizSetListScreen.tsx`:
    - Route param: groupId
    - GET /api/groups/{id}/quiz-sets (status=PUBLISHED filter mặc định)
    - List Cards: name, creator, difficulty, question count, playCount, avgRating
    - Tap → QuizSetDetail (group context — passes groupId for solo-practice endpoint)
    - Status filter pills (ALL/PUBLISHED/ARCHIVED) — KHÔNG show DRAFT cho MEMBER
  - Defer: search, sort, folder tree (S5+)
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/quizSets/GroupQuizSetListScreen.tsx` (new), `apps/mobile/src/api/groupQuizSets.ts` (new — minimal list endpoint)
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S4-7 Navigation wiring**
  - Add 4 routes vào navigation/types.ts + register MainTabNavigator hoặc tab-specific stack
  - MySetsScreen accessible từ ProfileTab hoặc MultiplayerTab — chọn ProfileTab (cùng user content)
  - GroupQuizSetListScreen accessible từ GroupDetailScreen ("Bộ câu hỏi" tab/button)
  - Status: [x] DONE
  - Files: `apps/mobile/src/navigation/types.ts`, `apps/mobile/src/navigation/MainTabNavigator.tsx`, `apps/mobile/src/screens/social/GroupDetailScreen.tsx` (add CTA), `apps/mobile/src/screens/user/ProfileScreen.tsx` (add MySets entry)
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S4-8 Tầng 3 regression + mark sprint DONE**
  - mobile jest ≥ 33 baseline
  - mobile tsc clean
  - Web không touched (skip vitest)
  - Update roadmap S4 → DONE, BL-11 SetEditor row marked closed (personal MVP done; group editor + AI + auto-save defer)
  - Status: [x] DONE

### Common

- **Spec impact**: BL-11 SetEditor row closed (personal MVP shipped; group editor + AI + auto-save defer S5+).
- **Spec strategy**: tất cả (c) `[no-spec-impact]` — FE wiring tới existing BE.
- **Sensitive files**: KHÔNG đụng. ProfileScreen + GroupDetailScreen chỉ thêm nav CTA.
- **Out of scope S4 (defer)**:
  - AI generation (`/ai-generate`, `/ai-rewrite`) — defer S6 nếu cần
  - Auto-save (1s/3s debounce web) — mobile dùng manual save button
  - Folder management — flat list only
  - Advanced filters (search, sort, pagination) — basic list
  - Visibility toggle PRIVATE/PUBLIC — mặc định PRIVATE personal
  - Group quiz set EDITOR (chỉ ship list) — defer S5+
  - Clone, archive, unarchive group set actions — defer
  - Set ratings + mastery + leaderboard views — defer
  - Question reordering drag-drop (complex RN — defer S6 polish)

### Verification

- Sau S4: user có thể tạo personal quiz set, thêm questions, publish; xem detail; list từ ProfileTab.
- Group context: members xem list group sets, mở detail.
- BL-11 SetEditor + MySets rows closed; remaining BL-11 gaps shifted to S5 (Scheduled) + S6 (Cosmetics + polish).
- Master roadmap S4 → ✅ DONE.
