# 2026-05-14 — Personal Quiz Set parity with Group (Phase 1 MVP)

> **Source**: User request 2026-05-14 — "ở page multiplayer có phần tạo bộ câu hỏi tôi muốn chức năng này tương tự phần tạo bộ câu hỏi ơ page group detail vậy". Confirmed target = MySets + SetEditor (vào từ button "Bộ câu hỏi" trên Multiplayer page). Approach = tái sử dụng `pages/group/QuizSetEditor.tsx` thành shared component, không xây song song.
>
> **Scope**: Phase 1 MVP — đem rich metadata + DRAFT→PUBLISHED workflow + auto-save vào flow personal, refactor `QuizSetEditor` chấp nhận API adapter để dùng chung cho cả 2 ownership. **Hoãn sang Phase 2**: folder, AI generate trên set (personal hiện đã có `/api/user-questions/generate` rời), AI rewrite. Lý do hoãn: keep MVP < 1 tuần, giảm risk migration + quota debate.
>
> **AI quota decision**: khi sang Phase 2, personal AI **dùng chung counter 200/ngày** với group (user choice 2026-05-14).
>
> **Status**: TODO

### Background

- Personal entity `QuestionSet` (table `question_sets`, 7 cột) ≠ group entity `GroupQuizSet` (table `group_quiz_sets`, 21 cột) — bảng riêng, không kế thừa.
- `QuizSetEditor.tsx` hiện hardcode `groupId` qua `useParams` + gọi tuyệt đối `/api/groups/{groupId}/...` ở mọi handler (xem [QuizSetEditor.tsx:27-106](apps/web/src/pages/group/QuizSetEditor.tsx#L27-L106)).
- 7 sub-component dưới [pages/group/quizset-editor/](apps/web/src/pages/group/quizset-editor/) (EditorTopBar, MetadataAccordion, QuestionSidebar, QuestionEditor, AIGeneratePanel, AIRewriteModal, PublishConfirmModal, useAutoSave) đa số là pure UI hoặc dùng state truyền vào — refactor sẽ tập trung ở file editor chính + tiêm 1 `api` adapter.
- Personal đã có `/api/user-questions/*` cho per-question CRUD và `/api/question-sets/{id}/items` cho add/remove khỏi set. Phase 1 sẽ tái dùng các endpoint này qua adapter, KHÔNG tạo endpoint mới cho per-question.
- `addQuestion` của group tạo question + gắn vào set 1 call → personal phải gộp 2 call (POST `/api/user-questions` + POST `/api/question-sets/{id}/items`).

### Tasks

- PQS-1 BE: Flyway migration thêm metadata + publish_status cho `question_sets`
  - Status: [x] DONE
  - Files: `apps/api/src/main/resources/db/migration/V{n}__add_metadata_to_question_sets.sql`, `apps/api/src/main/java/com/biblequiz/modules/userquiz/entity/QuestionSet.java`
  - Migration: thêm `cover_image_url VARCHAR(500)`, `tags JSON`, `cover_scripture VARCHAR(100)`, `author_note VARCHAR(1000)`, `difficulty VARCHAR(10)` (EASY/MEDIUM/HARD/MIXED nullable), `estimated_duration_min INT NULL`, `suggested_mode VARCHAR(50)`, `language VARCHAR(2) DEFAULT 'VI'`, `publish_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'`, `published_at TIMESTAMP NULL`. Backfill: tất cả row hiện có `publish_status = 'PUBLISHED'` + `published_at = NOW()` để không phá CreateRoom đang chạy.
  - Entity: thêm 10 field + getter/setter; ENUM `PublishStatus { DRAFT, PUBLISHED, ARCHIVED, SOFT_DELETED }` (chung style với GroupQuizSet).
  - Test: Testcontainers MySQL — migration chạy clean trên DB trống + DB có sẵn data; entity load lại đúng giá trị default.
  - **Spec impact**: [ ] None [x] BL-N (sẽ add BL ở PQS-9)
  - **Spec strategy**: [x] (b) new BL-N
  - Checklist: migration → entity update → JUnit pass → commit < 100 LOC

- PQS-2 BE: Mở rộng `QuestionSetController` accept + return metadata mới
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/api/QuestionSetController.java`
  - Update `POST /api/question-sets` accept full metadata body (cover/tags/scripture/authorNote/difficulty/duration/suggestedMode/language). Default `publish_status = DRAFT` khi tạo mới.
  - Update `PUT /api/question-sets/{id}` → đổi sang `PATCH` (partial update); accept đầy đủ metadata fields. Giữ PUT cũ tạm thời để FE chuyển dần (deprecate trong Phase 2).
  - Cập nhật `toDTO` trả về đầy đủ 17 fields (parity với group `quizSetToMap`).
  - Test: JUnit MockMvc — POST/PATCH với metadata, GET trả về đúng; tests `@WithMockUser`.
  - **Spec impact**: [x] BL-N
  - **Spec strategy**: [x] (b) new BL-N
  - Checklist: controller + service → JUnit pass → commit < 100 LOC

- PQS-3 BE: Endpoint publish + GET `/full` cho personal set
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/api/QuestionSetController.java` + service
  - `PATCH /api/question-sets/{id}/publish`: validate owner, status hiện tại = DRAFT, `questionCount >= 5`, `name.trim().length >= 3` → set `PUBLISHED` + `publishedAt = NOW()`. Trả lỗi 400 `{code: 'INSUFFICIENT_QUESTIONS' | 'NAME_TOO_SHORT'}` để FE hiển thị.
  - `GET /api/question-sets/{id}/full`: trả `{set, questions, locked}` với `questions` mảng object đầy đủ (content, options, correctAnswer, book, chapter, verseStart, verseEnd, difficulty, explanation, source, language) — shape khớp `EditorQuestion` của group.
  - CreateRoom phải lọc DRAFT (PQS-8): tạm thời `GET /api/question-sets` thêm query param `?status=PUBLISHED` optional; default trả tất cả như cũ.
  - Test: JUnit — publish thiếu câu / tên ngắn → 400; happy path → 200, status đổi PUBLISHED.
  - **Spec impact**: [x] BL-N
  - **Spec strategy**: [x] (b) new BL-N
  - Checklist: endpoint + service + test → commit < 100 LOC

- PQS-4 FE: API adapter `api/personalQuizSets.ts`
  - Status: [x] DONE
  - Files: `apps/web/src/api/personalQuizSets.ts` (mới)
  - Export functions với signature giống `api/quizSets.ts` nhưng KHÔNG nhận `groupId`: `createQuizSet`, `updateQuizSet`, `publishQuizSet`, `getQuizSetFull`, `addQuestion`, `updateQuestion`, `deleteQuestion`, `reorderQuestions`. Internally call `/api/question-sets/*` + `/api/user-questions/*`.
  - `addQuestion`: gộp 2 call (POST `/api/user-questions` → POST `/api/question-sets/{id}/items` với `questionId`). Trả về `{question: EditorQuestion, totalQuestions}`.
  - `updateQuestion`: PUT `/api/user-questions/{qid}` (chỉ owner-authored).
  - `deleteQuestion`: DELETE `/api/question-sets/{setId}/items/{qid}` (chỉ remove khỏi set, không xoá question khỏi bank).
  - Phase 1 KHÔNG có AI: export stub `aiGenerateForSet` + `aiRewriteQuestion` throw 'NOT_IMPLEMENTED' để TS happy.
  - Test: Vitest mock axios — mỗi function call đúng URL/body.
  - **Spec impact**: [x] BL-N
  - **Spec strategy**: [x] (b) new BL-N
  - Checklist: file mới + unit test → commit < 100 LOC

- PQS-5 FE: Refactor `QuizSetEditor` nhận API adapter qua prop
  - Status: [x] DONE
  - Files: `apps/web/src/pages/group/QuizSetEditor.tsx` (+ có thể rename → `pages/shared/QuizSetEditor.tsx` nếu cần — quyết định khi làm)
  - Đổi signature: thêm prop `api: QuizSetEditorApi` (interface gồm tất cả functions từ `quizSets.ts` đang dùng) + prop `backHref` + prop `ownership: 'personal' | 'group'`. Xoá hardcode `groupId` từ `useParams`, đổi sang `ownerScope` (group → `groupId`, personal → user implicit).
  - Tất cả handler (`handleAddManual`, `handleAIGenerate`, `handlePublishClick`, `handleConfirmPublish`, `persistQuestion`, `persistMetadata`) gọi `api.*` thay vì import trực tiếp.
  - Phase 1: AI buttons (`aiPanelOpen`, `rewriteOpen`) hidden nếu `ownership === 'personal'`. Folder UI cũng hidden.
  - Route group cũ `/groups/:id/quiz-sets/:setId/edit` vẫn render component này với adapter group; giữ E2E hiện hành pass.
  - Test: Vitest snapshot ownership=personal vs group; Playwright group flow vẫn pass.
  - **Spec impact**: [x] BL-N
  - **Spec strategy**: [x] (b) new BL-N
  - Checklist: refactor → Tầng 1+2 pass → group E2E pass → commit ~100 LOC (có thể tách 2 commit nếu lớn)

- PQS-6 FE: Route + page wrapper cho personal editor
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/PersonalQuizSetEditor.tsx` (mới — thin wrapper), `apps/web/src/main.tsx` (route)
  - Wrapper: mount `<QuizSetEditor api={personalApi} ownership="personal" backHref="/my-sets" />`. Logic create-then-redirect tương tự group: nếu route `/my-sets/new` → tạo DRAFT mới, navigate `/my-sets/:newId/edit`.
  - Routes mới: `/my-sets/new`, `/my-sets/:setId/edit`. Giữ `/my-sets/:setId` (read-only view? hoặc redirect → `/edit` nếu owner+DRAFT). Quyết định khi làm: redirect `/my-sets/:id` → `/edit` cho đơn giản.
  - Xoá `pages/SetEditor.tsx` (deprecated).
  - Test: Playwright — vào `/my-sets/new` tạo DRAFT, soạn tên, save, exit, quay lại thấy `DRAFT` badge.
  - **Spec impact**: [x] BL-N
  - **Spec strategy**: [x] (b) new BL-N
  - Checklist: wrapper + route + xoá SetEditor → Tầng 1+2+3 pass → commit < 80 LOC

- PQS-7 FE: Cập nhật `MySets.tsx` (status chip + bỏ inline form)
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/MySets.tsx`
  - Bỏ inline create form (40+ LOC `creating` state). Button "Tạo bộ mới" → navigate `/my-sets/new` luôn.
  - Card hiển thị thêm: `DRAFT`/`PUBLISHED` chip; cover image (nếu có); tags (max 2 + "+N"); scripture (1 dòng); suggested mode emoji.
  - Action button: `DRAFT` → "Tiếp tục soạn"; `PUBLISHED` → "Sửa" (vẫn vào `/edit`) + "Bắt đầu phòng" (link `/room/create?customSetId=…`).
  - List `useQuery` không đổi endpoint, hưởng lợi từ PQS-2 trả thêm fields.
  - Test: Vitest snapshot MySets có DRAFT + PUBLISHED cards; Playwright click "Tạo bộ mới" → vào editor.
  - **Spec impact**: [x] BL-N
  - **Spec strategy**: [x] (b) new BL-N
  - Checklist: rewrite card + xoá form → Tầng 1+2 pass → commit < 100 LOC

- PQS-8 FE: `CreateRoom.tsx` lọc PUBLISHED-only cho custom set picker
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/CreateRoom.tsx`
  - `useQuery` user sets pass `?status=PUBLISHED` để DRAFT không show trong dropdown. Empty state: "Chưa có bộ PUBLISHED nào. <Link>Soạn bộ mới</Link>".
  - Test: Playwright — user có 1 DRAFT + 1 PUBLISHED → dropdown chỉ list PUBLISHED.
  - **Spec impact**: [x] None (UI filtering nội bộ)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: edit query + empty state → Tầng 3 pass → commit < 30 LOC

- PQS-9 Docs: Thêm BL-N vào BACKLOG.md + cập nhật spec audit
  - Status: [ ] TODO
  - Files: `docs/spec/BACKLOG.md`
  - Thêm BL entry: "BL-N Personal Quiz Set parity with Group (Phase 1 MVP)" — link tới task file này; note Phase 2 hoãn (folder + AI generate trên set + AI rewrite).
  - Chạy `bash tools/spec-audit/audit.sh` → ensure không có NEW broken.
  - **Spec impact**: [x] BL-N (chính mình đăng ký)
  - **Spec strategy**: [x] (b) new BL-N
  - Checklist: append BACKLOG → audit clean → commit < 30 LOC

### Out of scope (Phase 2 — task riêng sau)

- Personal folder entity + endpoints + UI folder picker.
- `POST /api/question-sets/{id}/ai-generate` (gắn câu vào set, dùng chung quota 200/ngày với group).
- `POST /api/question-sets/{id}/questions/{qid}/ai-rewrite`.
- Migrate `/api/user-questions/generate` (rời) sang AI panel trong editor (hiện tại personal user vẫn dùng được endpoint cũ ngoài flow editor).
- Visibility public/private cho set DRAFT (Phase 1 giữ semantics PUBLIC/PRIVATE riêng + status DRAFT/PUBLISHED riêng — 2 concept khác nhau, hoãn unify).
