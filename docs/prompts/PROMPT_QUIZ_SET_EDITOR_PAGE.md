# PROMPT: Quiz Set Editor — Unified Page Redesign

> **For Claude Code agent** — Verification-first, phase-separated, stop-and-confirm between phases.
> **Estimated effort:** ~2,500-3,500 LOC, ~7-10 days
> **Created:** 2026-05-13
> **Status:** Ready for execution
> **Spec impact:** SPEC_GROUP §6.X (NEW section), §6.Y modal removal
> **Backlog entry:** BL-AD-8

---

## 📋 Context

User đã decided pivot pattern tạo quiz set từ **modal 2-tab "AI tạo / Tự soạn"** sang **trang editor riêng** với AI là tool button trong editor thống nhất. Lý do (decided trước):

- AI và Manual không phải 2 workflow tách biệt — user mix cả 2 trong cùng 1 task
- Modal không phù hợp cho task slow + high-stakes (gõ 5-50 câu, mỗi câu 6 fields = 300+ input events)
- Không có persistence trong modal (đóng nhầm → mất hết)
- Sidebar question list pattern cần full viewport

Mockup canonical (2 mockups visualizer rendered trong chat session 2026-05-13):

1. **Desktop**: 3-section layout (top bar + metadata accordion + body grid sidebar/editor)
2. **Mobile**: Single-column với sticky bottom action bar (prev/next + AI/manual add + publish)

---

## 🎯 Locked Decisions (DO NOT re-litigate)

| ID | Decision |
|---|---|
| D1 | Modal "Tạo bộ câu hỏi" 2-tab → **REMOVE hoàn toàn**. Button "+ Tạo bộ câu hỏi" trong group page → navigate trực tiếp `/groups/{id}/quiz-sets/new` |
| D2 | Route `/groups/{groupId}/quiz-sets/new` (create) + `/groups/{groupId}/quiz-sets/{setId}/edit` (edit) — cùng component, conditional fetch |
| D3 | AI và Manual KHÔNG phải 2 mode tách biệt. AI là **tool button** trong editor thống nhất ("⚡ AI tạo nháp" + "+ Thêm thủ công" + per-question "AI viết lại") |
| D4 | Auto-save draft mỗi 30s (forced) + debounce 2s on field change. Status DRAFT (existing per Sprint 5 SPEC_GROUP §5.2 workflow statuses) |
| D5 | Difficulty per-question, không phải global setting. Set difficulty mix qua AI gen panel (theo 3 steppers Dễ/TB/Khó) |
| D6 | Permission: `group_leader` hoặc `mod` của group đó. Member → 403 |
| D7 | AI integration dùng **DeepSeek V3.2 Bedrock** (per BL-AD-7) — KHÔNG hardcode provider name trong FE. Backend chọn default provider |
| D8 | Per-question AI: chỉ 1 button "AI viết lại câu này" trong v1. "AI sinh tương tự" và "AI gợi ý đáp án nhiễu" defer v2 |
| D9 | Quota: shared global 200 câu/day (per D5 của BL-AD-7) — UI display ngay trong top bar |
| D10 | Validation block Publish: tên bộ ≥ 3 ký tự, ≥ 1 câu hỏi valid, mỗi câu cần question + 4 options + correct marked + explanation + scriptureRef |

---

## 🚫 Canonical Constraints (C1-C12) — DO NOT VIOLATE

- **C1** Tier names UNCHANGED (Tân Tín Hữu → Sứ Đồ). Không touch tier code.
- **C2** Answer color mapping: A=Coral, B=Sky, C=Gold, D=Sage. Hardcoded hex values:
  - A: `rgba(255,107,107,0.15)` bg, `#ff8585` text, `rgba(255,107,107,0.3)` border
  - B: `rgba(74,164,255,0.15)` bg, `#8ec6ff` text, `rgba(74,164,255,0.3)` border
  - C: `rgba(232,168,50,0.15)` bg, `#e8a832` text, `rgba(232,168,50,0.3)` border
  - D: `rgba(132,204,141,0.15)` bg, `#a8d8ad` text, `rgba(132,204,141,0.3)` border
- **C3** Sacred Modernist hardcoded hex ONLY (no CSS variables for input backgrounds — known bug `var(--input-bg)` renders white on production):
  - Dark navy bg: `#11131e`
  - Input bg: `#1a1d2e`
  - Border subtle: `rgba(255,255,255,0.08)`
  - Gold accent: `#e8a832`
  - Gold focus border: `rgba(232,168,50,0.25)` to `rgba(232,168,50,0.3)`
  - Success green: `#4ade80`
  - Warning yellow: `#fbbf24`
  - Danger red: `#ef4444`
  - Text primary: `#ffffff`
  - Text secondary: `#d1d5db`
  - Text muted: `#9ca3af`
  - Text disabled: `#6b7280`
- **C4** All input/textarea: USE hardcoded hex inline style, NEVER `var(--input-bg)` or Tailwind class `bg-input` (causes white render bug)
- **C5** Bottom nav giữ Hướng 3 (inactive icon only, active pill + label) — không change AppLayout
- **C6** Role hierarchy 👑 Leader (gold) / 🛡️ Mod (blue) / Member plain
- **C7** Bible version BTTHĐ 2011 (vi), ESV (en). 66 books, Vietnamese names ("Sáng Thế Ký" not "Genesis")
- **C8** No Stitch redesign rounds — surgical FE work, mockup từ visualizer là source of truth
- **C9** Existing GroupQuizSetController endpoints must keep working — additive changes only, không break existing API
- **C10** Vitest + Playwright testing tiers — new tests added, không drop test count
- **C11** Vietnamese throughout UI strings (i18n keys với fallback vi)
- **C12** Tabler outline icons only (`<i class="ti ti-...">`), no Material Symbols mix

---

## 🛑 Stop-and-Confirm Checkpoints

Mỗi phase = 1 commit (rollback-safe per project pattern):

```
Phase A (Audit) → STOP → human review AUDIT_REPORT.md → "go Phase B"
Phase B (Backend) → STOP → curl test endpoints + tests pass → "go Phase C"
Phase C (Routing + Page scaffold) → STOP → manual nav test → "go Phase D"
Phase D (Sidebar + Question List) → STOP → manual UI test → "go Phase E"
Phase E (Question Editor) → STOP → manual edit + save test → "go Phase F"
Phase F (AI Integration) → STOP → AI gen + per-question rewrite test → "go Phase G"
Phase G (Auto-save + Publish) → STOP → draft persistence test → "go Phase H"
Phase H (Mobile responsive) → STOP → mobile emulator test → "go Phase I"
Phase I (Cleanup old modal) → STOP → ensure no regression → "merge"
```

⚠️ Trong commit message Phase F+: nhắc tới BL-AD-7 (DeepSeek integration dependency).

---

# Phase A — Audit (verification-first)

> **Goal:** Map current architecture. Output `AUDIT_REPORT_QUIZSET_EDITOR.md` với file:line citations. KHÔNG đoán từ spec.

## A.1 Backend grep targets

```bash
# 1. Existing group quiz set endpoints
grep -rn "GroupQuizSetController\|@RequestMapping.*quiz-sets\|@PostMapping.*quiz-sets\|@PatchMapping.*quiz-sets" \
  apps/api/src/main/java --include="*.java" | head -30

# 2. Question entity + group quiz set link
grep -rn "GroupQuizSet\|QuizSetQuestion\|GroupQuizSetRepository" \
  apps/api/src/main/java --include="*.java"

# 3. Workflow status enum (Sprint 5)
grep -rn "DRAFT\|PUBLISHED\|ARCHIVED\|SOFT_DELETED" \
  apps/api/src/main/java/com/biblequiz/modules/groups --include="*.java"

# 4. Existing AI generation endpoint (admin)
grep -rn "AdminAIController\|AIGenerationService\|@PostMapping.*ai/generate" \
  apps/api/src/main/java --include="*.java"

# 5. Group AI generation endpoint (if Sprint 5 added it)
grep -rn "groups.*ai-generate\|generateForGroup\|GroupAIController" \
  apps/api/src/main/java --include="*.java"

# 6. Permission guard pattern
grep -rn "GroupSecurity\|isLeaderOrMod\|isGroupLeader\|@PreAuthorize.*group" \
  apps/api/src/main/java --include="*.java"

# 7. Question entity fields
grep -A30 "class Question" apps/api/src/main/java/com/biblequiz/modules/quiz/entity/QuestionEntity.java
```

## A.2 Frontend grep targets

```bash
# 1. Existing modal (will be removed)
find apps/web/src -iname "*CreateQuizSet*" -o -iname "*QuizSetModal*"
grep -rn "CreateQuizSetModal\|QuizSetCreateModal" apps/web/src --include="*.tsx"

# 2. Group page where modal is triggered
grep -rn "CreateQuizSetModal\|setShowQuizSetModal" apps/web/src --include="*.tsx"

# 3. Existing quiz set play page (reuse styles)
find apps/web/src -iname "*QuizSetPlay*" -o -iname "*QuizSetDetail*"

# 4. Admin question editor (potential code reuse)
find apps/web/src/pages/admin -iname "Questions.tsx"
grep -n "QuestionForm\|QuestionEditor" apps/web/src/pages/admin/Questions.tsx

# 5. Routes config
grep -rn "/quiz-sets/new\|/quiz-sets/.*edit" apps/web/src --include="*.tsx" --include="*.ts"
cat apps/web/src/main.tsx | grep -A2 "Route path"

# 6. Existing API client for group quiz sets
grep -rn "quiz-sets" apps/web/src/api --include="*.ts"
```

## A.3 Mobile grep targets (RN equivalent)

```bash
# Check if RN has equivalent screen yet
find apps/mobile/src/screens -iname "*QuizSet*"
grep -rn "CreateQuizSet" apps/mobile/src --include="*.tsx"
```

## A.4 Critical questions to answer

Answer mỗi với `file:line` citation:

1. **Existing API endpoints for group quiz sets** — list method + path + DTO. Đặc biệt:
   - Có endpoint `PATCH /api/groups/{gid}/quiz-sets/{sid}` cho partial update (draft save) chưa?
   - Có endpoint `POST /api/groups/{gid}/quiz-sets/{sid}/publish` không?
   - Endpoint nào trả về full set với questions inline (cho edit page load)?

2. **Question linkage to quiz set** — JSON array `questionIds` trong GroupQuizSet entity (per memory Q-O), hay junction table? Câu hỏi tạo trong scope quiz set vs từ question pool admin → tách bằng field nào (`scope`, `groupId`, `quizSetId`)?

3. **Workflow statuses** — enum exact values (DRAFT/PUBLISHED/ARCHIVED/SOFT_DELETED)? Transitions allowed? Backend validation hay client-side?

4. **AI gen endpoint cho group context** — đã tồn tại từ Sprint 5 chưa? Nếu có: path, body schema, return shape? Nếu chưa: cần build mới ở Phase B?

5. **Existing modal location + integration points** — file path, parent component triggers it, API calls inside modal (sẽ port sang page mới hoặc bỏ?)

6. **Mobile equivalent** — đã có CreateQuizSet screen trong apps/mobile chưa? Status?

7. **Question editor reuse opportunity** — admin Questions page có QuestionForm component reusable không? Hay phải build mới for group context?

## A.5 Output AUDIT_REPORT_QUIZSET_EDITOR.md

```markdown
# Audit Report: Quiz Set Editor Redesign

## Section 1: Backend — Group Quiz Set Endpoints
- Existing endpoints: <list with file:line>
- Missing endpoints (need to build): <list>
- DTO shapes: <reference>

## Section 2: Data Model
- GroupQuizSet entity: <file:line, fields>
- Question linkage: <JSON list | junction table | other>
- Workflow status enum: <exact values>

## Section 3: Frontend — Current Modal
- File location: <path>
- Triggers: <where button is>
- API calls: <list>
- LOC: ~N lines (will be deleted in Phase I)

## Section 4: AI Generation for Group Context
- Status: <exists / missing>
- If exists: <endpoint + path>
- Dependency on BL-AD-7 (DeepSeek): <state>

## Section 5: Mobile
- Equivalent screen: <exists/missing/partial>
- Phase H scope: <full build vs adapt>

## Section 6: Reusable Components
- Admin QuestionForm: <yes/no, reusable yes/no>
- Other relevant components: <list>

## Section 7: Recommended Phase B-I Plan
- Endpoints to add: <list>
- Migrations needed: V?? (latest from grep ls apps/api/.../migration/)
- Estimated LOC delta per phase: <breakdown>
- Risks: <list>
```

## A.6 ✋ STOP at end of Phase A

```
git add docs/audit/AUDIT_REPORT_QUIZSET_EDITOR.md
git commit -m "chore: audit report — quiz set editor redesign (BL-AD-8)"
```

Wait for human review → "go Phase B".

---

# Phase B — Backend API Layer

> **Conditional on audit findings.** Some endpoints may exist from Sprint 5, others need to be built.

## B.1 Endpoints needed (verify each in audit)

### Existing or new (per audit):

```
GET    /api/groups/{gid}/quiz-sets/{sid}              — fetch full set with questions
POST   /api/groups/{gid}/quiz-sets                    — create new (returns set with status=DRAFT)
PATCH  /api/groups/{gid}/quiz-sets/{sid}              — update metadata (name, book, range, topic)
DELETE /api/groups/{gid}/quiz-sets/{sid}              — soft delete (status=SOFT_DELETED)
POST   /api/groups/{gid}/quiz-sets/{sid}/publish      — transition DRAFT → PUBLISHED with validation
POST   /api/groups/{gid}/quiz-sets/{sid}/archive      — transition PUBLISHED → ARCHIVED

POST   /api/groups/{gid}/quiz-sets/{sid}/questions    — add 1 question
PATCH  /api/groups/{gid}/quiz-sets/{sid}/questions/{qid} — update question
DELETE /api/groups/{gid}/quiz-sets/{sid}/questions/{qid} — remove question
POST   /api/groups/{gid}/quiz-sets/{sid}/questions/reorder — bulk reorder
                                                       Body: { questionIds: [uuid, uuid, ...] }

POST   /api/groups/{gid}/quiz-sets/{sid}/ai-generate  — gen N questions, save directly to set
                                                       Body: { countEasy, countMedium, countHard,
                                                              chapterFrom, chapterTo,
                                                              verseFrom?, verseTo?, topic? }
POST   /api/groups/{gid}/quiz-sets/{sid}/questions/{qid}/ai-rewrite — regen single question
                                                       Body: { hint?: string }
                                                       Returns: new question content (NOT auto-save)
```

## B.2 Permission guard

```java
@PreAuthorize("@groupSecurity.isLeaderOrMod(#gid, principal)")
public ResponseEntity<?> updateQuestion(@PathVariable Long gid, ...) { ... }
```

Reuse pattern from audit findings. Member calling these → 403 with body `{"error":"forbidden","reason":"not_group_leader_or_mod"}`.

## B.3 Validation rules

### Quiz set level (block PUBLISH transition):
- `name` ≥ 3 chars, ≤ 200 chars
- ≥ 1 question with status `valid`
- `book` từ 66 books canonical list (BookNameMapper)
- `chapterFrom` ≤ `chapterTo`
- `verseFrom`/`verseTo`: both null OR both filled (Bean Validation `@AssertTrue`)
- If both filled: `verseFrom` ≤ `verseTo` (same chapter) OR cross-chapter range valid

### Question level (per question, block individual valid status):
- `question` text ≥ 10 chars, ≤ 500 chars
- `options[]` length = 4, each ≥ 2 chars, ≤ 200 chars
- `correctAnswer` integer 0-3 (index into options)
- `explanation` ≥ 20 chars, ≤ 500 chars (per SPEC_ADMIN §4.2 BẮT BUỘC)
- `scriptureRef` matches regex: `^[A-Za-zÀ-ỹ\s]+\s\d+:\d+(-\d+)?$` (e.g., "Sáng Thế Ký 2:7" or "John 3:16-18")
- `difficulty` enum: EASY, MEDIUM, HARD

## B.4 AI generation endpoint integration

`POST /api/groups/{gid}/quiz-sets/{sid}/ai-generate`:

```java
@PostMapping("/api/groups/{gid}/quiz-sets/{sid}/ai-generate")
@PreAuthorize("@groupSecurity.isLeaderOrMod(#gid, principal)")
public ResponseEntity<?> aiGenerate(
    @PathVariable Long gid,
    @PathVariable Long sid,
    @Valid @RequestBody AIGenerateForSetRequest request,
    @AuthenticationPrincipal AppUser actor
) {
    int totalCount = request.countEasy() + request.countMedium() + request.countHard();
    if (!quotaService.tryAcquire(totalCount)) {
        return ResponseEntity.status(429).body(Map.of(
            "error", "daily_quota_exhausted",
            "remaining", quotaService.getRemainingQuota()
        ));
    }

    // Build AI request preserving distribution
    AIGenerationRequest aiReq = buildRequest(request);
    AIGenerationResponse aiResp = router.generate(aiReq, null /* auto provider */, actor.getId());

    // Save directly to quiz set (per BL-AD-7 D4)
    List<Question> saved = quizSetService.addQuestions(sid, aiResp.drafts(), actor.getId());

    log.info("group_ai_generate group={} set={} actor={} count={} provider={} cost_usd={}",
        gid, sid, actor.getId(), saved.size(), aiResp.providerUsed(), aiResp.estimatedCostUSD());

    return ResponseEntity.ok(Map.of("questions", saved, "remaining", quotaService.getRemainingQuota()));
}
```

`POST /api/groups/{gid}/quiz-sets/{sid}/questions/{qid}/ai-rewrite`:

```java
@PostMapping(".../ai-rewrite")
@PreAuthorize("@groupSecurity.isLeaderOrMod(#gid, principal)")
public ResponseEntity<?> aiRewrite(..., @Valid @RequestBody AIRewriteRequest request) {
    if (!quotaService.tryAcquire(1)) {
        return ResponseEntity.status(429).body(...);
    }
    Question existing = quizSetService.getQuestion(sid, qid);
    AIGenerationRequest aiReq = buildRewriteRequest(existing, request.hint());
    aiReq.setCount(1);
    AIGenerationResponse aiResp = router.generate(aiReq, null, actor.getId());

    // Return draft WITHOUT auto-save — frontend will let user accept/discard
    return ResponseEntity.ok(Map.of(
        "draft", aiResp.drafts().get(0),
        "remaining", quotaService.getRemainingQuota()
    ));
}
```

## B.5 Unit tests required

```java
// GroupQuizSetControllerTest.java (extend if exists)
@Test void getQuizSet_asLeader_returns200()
@Test void getQuizSet_asMember_returns200_readOnly()
@Test void updateQuizSet_asLeader_succeeds()
@Test void updateQuizSet_asMember_returns403()
@Test void publishQuizSet_validData_transitionsToPublished()
@Test void publishQuizSet_invalidData_returns400_withErrorDetails()
@Test void publishQuizSet_zeroQuestions_returns400()

// Question CRUD tests
@Test void addQuestion_validData_appendsToSet()
@Test void updateQuestion_partialFields_mergesCorrectly()
@Test void deleteQuestion_removesFromSet_preservesOthers()
@Test void reorderQuestions_validIdsArray_updatesOrder()
@Test void reorderQuestions_includesMissingId_returns400()

// AI integration tests (mock provider)
@Test void aiGenerate_validRequest_savesQuestions()
@Test void aiGenerate_quotaExhausted_returns429()
@Test void aiGenerate_asMember_returns403()
@Test void aiRewrite_returnsdraft_doesNotAutoSave()
```

Minimum 15 new tests.

## B.6 ✋ STOP at end of Phase B

```bash
cd apps/api && ./mvnw test
# Expect ≥ baseline + 15 new tests

# Manual integration test:
curl -X POST http://localhost:8080/api/groups/1/quiz-sets \
  -H "Authorization: Bearer <leader-jwt>" \
  -d '{"name":"Test set"}'
```

Commit: `feat(quizset): backend endpoints for editor page (BL-AD-8 Phase B)`

---

# Phase C — Routing + Page Scaffold

## C.1 Routes

`apps/web/src/main.tsx`:

```tsx
<Route element={<AppLayout />}>
  ...
  <Route path="/groups/:groupId/quiz-sets/new" element={<QuizSetEditor mode="create" />} />
  <Route path="/groups/:groupId/quiz-sets/:setId/edit" element={<QuizSetEditor mode="edit" />} />
</Route>
```

⚠️ Routes inside `AppLayout` keep sidebar nav (consistency with rest of app). Top bar of editor sits below AppLayout header.

## C.2 Page scaffold

Create `apps/web/src/pages/groups/QuizSetEditor.tsx`:

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

type Mode = 'create' | 'edit';

interface QuizSetEditorProps {
  mode: Mode;
}

export default function QuizSetEditor({ mode }: QuizSetEditorProps) {
  const { groupId, setId } = useParams<{ groupId: string; setId?: string }>();
  const navigate = useNavigate();

  // Fetch existing set if edit mode
  const { data: quizSet, isLoading } = useQuery({
    queryKey: ['quizSet', groupId, setId],
    queryFn: () => fetchQuizSet(groupId!, setId!),
    enabled: mode === 'edit',
  });

  // Create empty set on mount if create mode
  const createMutation = useMutation({
    mutationFn: () => createQuizSet(groupId!),
    onSuccess: (newSet) => navigate(`/groups/${groupId}/quiz-sets/${newSet.id}/edit`, { replace: true }),
  });

  useEffect(() => {
    if (mode === 'create') createMutation.mutate();
  }, [mode]);

  // ... rest of logic in Phase D+
  return <div>{/* scaffold */}</div>;
}
```

## C.3 Update group page to navigate (remove modal trigger)

Find file from audit (likely `apps/web/src/pages/groups/GroupDetail.tsx` or similar). Replace:

```tsx
// ❌ Before
<button onClick={() => setShowQuizSetModal(true)}>+ Tạo bộ câu hỏi</button>
{showQuizSetModal && <CreateQuizSetModal onClose={...} />}

// ✅ After
<button onClick={() => navigate(`/groups/${groupId}/quiz-sets/new`)}>
  + Tạo bộ câu hỏi
</button>
```

⚠️ DO NOT delete CreateQuizSetModal component yet — defer to Phase I cleanup to preserve rollback safety.

## C.4 Tests

```tsx
// QuizSetEditor.test.tsx
test('renders editor in create mode', ...)
test('renders editor in edit mode with existing data', ...)
test('redirects to edit URL after create mutation succeeds', ...)
```

## C.5 ✋ STOP at end of Phase C

```bash
cd apps/web && npm run build
cd apps/web && npx vitest run
```

Manual test:
- Login as group leader
- Group page → click "+ Tạo bộ câu hỏi"
- Verify navigate to `/groups/{id}/quiz-sets/new`
- Verify auto-redirect to `/quiz-sets/{newId}/edit`
- Verify blank scaffold renders

Commit: `feat(quizset): editor page scaffold + routing (BL-AD-8 Phase C)`

---

# Phase D — Sidebar + Question List

## D.1 Layout (desktop)

```
┌─────────────────────────────────────────────┐
│ EditorTopBar (back, name, save state, AI quota, Publish) │
├─────────────────────────────────────────────┤
│ MetadataAccordion (collapsible)             │
├──────────────┬──────────────────────────────┤
│ QuestionSidebar (260px) │ QuestionEditor    │
│ - distribution bar      │ (empty state in   │
│ - question list items   │  Phase D)         │
│ - AI tạo nháp button    │                   │
│ - + Thêm thủ công       │                   │
└──────────────┴──────────────────────────────┘
```

## D.2 Components

```
apps/web/src/pages/groups/quizset-editor/
├── QuizSetEditor.tsx              (parent, ~300 LOC)
├── EditorTopBar.tsx               (~120 LOC)
├── MetadataAccordion.tsx          (~150 LOC)
├── QuestionSidebar.tsx            (~200 LOC)
├── QuestionListItem.tsx           (~120 LOC)
├── DistributionBar.tsx            (~80 LOC)
└── (Phase E adds editor components)
```

## D.3 Visual spec (per desktop mockup canonical)

### EditorTopBar
- Bg: `#11131e`, border-bottom: `1px solid rgba(255,255,255,0.06)`, padding: 14px 24px
- Left: back button (← icon) + breadcrumb "Bộ câu hỏi mới · FMC Đà Nẵng" + status badge "NHÁP · ĐÃ LƯU 8s TRƯỚC"
- Right: AI quota pill (`Hôm nay: 45/200` gold) + "Lưu nháp" (secondary) + "Xuất bản (N câu)" (gold primary)
- Status badge color logic: yellow `rgba(251,191,36,0.10)` when DRAFT, green `rgba(74,222,128,0.12)` when PUBLISHED

### MetadataAccordion
- Bg: `rgba(50,52,64,0.25)`, padding: 14px 24px
- Collapsible: chevron-down icon + label "THÔNG TIN BỘ CÂU HỎI" + subtitle với inline summary "Sáng Thế Ký 1-3 · Sự sáng tạo"
- Default state: expanded if create mode, collapsed if edit mode
- Fields trong expanded state: `name`, `book` (dropdown), chapter range, verse range (optional), topic (textarea)
- Auto-save trigger on field blur (debounce 2s)

### QuestionSidebar
- Width: 260px, bg: `rgba(50,52,64,0.15)`, border-right: `1px solid rgba(255,255,255,0.06)`
- Top section: DistributionBar (3 colored segments showing Easy/Medium/Hard count)
- Middle: scrollable list of QuestionListItem
- Bottom: 2 buttons (vertical stack)
  - "⚡ AI tạo nháp" (gold filled)
  - "+ Thêm thủ công" (neutral outline)

### QuestionListItem
- Layout: `bg`, `border` 1px, `border-left` 3px difficulty color, `padding` 9px 11px
- Top row: `#N` label + status icon + source icon (AI vs Manual) + (right-aligned) edit indicator
- Bottom: question text preview (truncated, single line)
- Active state: gold border `rgba(232,168,50,0.3)` + slight gold bg
- Status icons:
  - `ti-circle-check` `#4ade80` — valid
  - `ti-alert-triangle` `#fbbf24` — missing required field
  - `ti-circle-x` `#ef4444` — error
- Source icons:
  - `ti-sparkles` muted — AI generated
  - `ti-pencil` muted — manual
  - Both icons shown — AI generated then manually edited

### DistributionBar
- Mini horizontal bar showing 3 segments with counts
- Format: `1 dễ | 1 TB | 1 khó` (each segment color-coded)
- Update reactively as questions added/removed/difficulty changed

## D.4 Critical input style guidance (C4 compliance)

**ALL inputs/textareas inside the editor MUST use hardcoded hex inline styles**, NOT Tailwind classes or CSS variables. Reason: known production bug where `var(--input-bg)` renders white on input/textarea elements.

Create shared style constants:

```tsx
// apps/web/src/pages/groups/quizset-editor/styles.ts
export const DARK_INPUT_STYLE: React.CSSProperties = {
  background: '#1a1d2e',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#ffffff',
  padding: '10px 12px',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
};

export const DARK_INPUT_FOCUS_STYLE: React.CSSProperties = {
  ...DARK_INPUT_STYLE,
  borderColor: 'rgba(232,168,50,0.3)',
};

export const DARK_TEXTAREA_STYLE: React.CSSProperties = {
  ...DARK_INPUT_STYLE,
  resize: 'none',
  lineHeight: 1.5,
};

// Difficulty colors (canonical, hardcoded per C2)
export const DIFFICULTY_COLORS = {
  EASY: { bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.2)', accent: '#4ade80' },
  MEDIUM: { bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.2)', accent: '#fbbf24' },
  HARD: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', accent: '#ef4444' },
} as const;

// Answer option colors (canonical A/B/C/D mapping per C2)
export const ANSWER_OPTION_COLORS = {
  A: { bg: 'rgba(255,107,107,0.15)', text: '#ff8585', border: 'rgba(255,107,107,0.3)' },
  B: { bg: 'rgba(74,164,255,0.15)', text: '#8ec6ff', border: 'rgba(74,164,255,0.3)' },
  C: { bg: 'rgba(232,168,50,0.15)', text: '#e8a832', border: 'rgba(232,168,50,0.3)' },
  D: { bg: 'rgba(132,204,141,0.15)', text: '#a8d8ad', border: 'rgba(132,204,141,0.3)' },
} as const;
```

Use everywhere:
```tsx
<input type="text" style={DARK_INPUT_STYLE} />
<textarea style={DARK_TEXTAREA_STYLE} />
```

## D.5 Tests

```tsx
test('renders question list with N items')
test('shows distribution bar with correct counts')
test('highlights active question with gold border')
test('shows AI source icon for ai-generated questions')
test('shows alert icon for invalid questions')
test('clicking question item activates it (callback called)')
test('clicking "AI tạo nháp" opens AI generate panel')
test('clicking "+ Thêm thủ công" adds blank question + activates it')
```

## D.6 ✋ STOP at end of Phase D

Manual test:
- Page loads with empty sidebar
- Click "+ Thêm thủ công" → blank question added
- Click question → highlight active
- Distribution bar updates count

Commit: `feat(quizset): sidebar + question list (BL-AD-8 Phase D)`

---

# Phase E — Question Editor

## E.1 Components

```
quizset-editor/editor/
├── QuestionEditor.tsx             (~250 LOC, main container)
├── QuestionHeader.tsx             (~120 LOC, difficulty toggle + actions)
├── AnswerOptionsList.tsx          (~200 LOC, 4 options A/B/C/D)
├── ExplanationField.tsx           (~80 LOC)
├── ScriptureRefField.tsx          (~120 LOC, with verse preview)
└── VersePreview.tsx               (~100 LOC, fetches verse text)
```

## E.2 QuestionEditor visual spec (per desktop mockup)

Top header row:
- "Câu #N" (large, white)
- Difficulty toggle (segmented control: Dễ/TB/Khó) — color matches difficulty
- Right-aligned actions: "AI viết lại" (gold outline) + Copy (icon) + Delete (red)

Body:
- Question textarea — `DARK_INPUT_STYLE` + focus border gold, rows={2}, resize vertical
- Label hint above each section in `#9ca3af` 11px letter-spacing 0.6

Answer Options:
- 4 stacked rows, each row:
  - Color badge A/B/C/D (22px circle, ANSWER_OPTION_COLORS)
  - Radio circle (16px) — click to set as correct
  - Inline text input (transparent bg, no border, just text)
- Selected correct: row bg `rgba(74,222,128,0.06)`, border `rgba(74,222,128,0.3)`, green check inside radio

Bottom grid (2-col):
- Explanation textarea (1.5fr)
- Scripture ref input + verse preview card (1fr)
- Verse preview: fetch verse text on debounce, render italic gold card

## E.3 Verse fetching

Reuse existing endpoint (audit will find — likely `/api/bible/verse?ref=...`). On scriptureRef field change → debounce 500ms → fetch verse text → render preview.

If endpoint doesn't exist, defer verse preview to v2 (display reference only without preview).

## E.4 Per-question AI rewrite

Button "AI viết lại" → opens small popover/modal:
- Input field: optional hint (e.g., "tập trung vào nhân vật A-bra-ham")
- Button "Tạo lại" → calls `POST .../questions/{qid}/ai-rewrite`
- Loading state: spinner + "Đang viết lại..." 10-15s
- Result: shows new draft side-by-side with current
- 2 buttons: "Giữ bản cũ" / "Dùng bản mới"
- Quota deducted only on accept (or always? Backend already deducted — need clarify in audit)

⚠️ Per D8: only "AI viết lại" in v1. Defer "AI sinh tương tự" + "AI gợi ý đáp án nhiễu" to v2.

## E.5 Auto-save logic

```tsx
const debouncedUpdateQuestion = useDebouncedCallback(
  (updates: Partial<Question>) => updateQuestionMutation.mutate(updates),
  2000
);

// On field change
onChange={(e) => {
  setLocalState({ ...localState, question: e.target.value });
  debouncedUpdateQuestion({ question: e.target.value });
}}
```

Force save on:
- Question switch (click another question in sidebar)
- Tab close (`beforeunload` event)
- Page navigate away (React Router prompt)
- 30-second interval (cron via `setInterval`)

## E.6 Validation feedback

Real-time validation per field (don't block typing, just visual hint):
- Question < 10 chars: yellow border + tooltip "Câu hỏi quá ngắn"
- Options < 2 chars: yellow border
- Correct not marked: yellow exclamation icon on radio column
- Explanation < 20 chars: yellow border + char count "20+ ký tự"
- ScriptureRef invalid format: red border + tooltip "Format: Sáng Thế Ký 2:7"

Sidebar status icon updates reactively (✓ valid / ⚠ missing).

## E.7 Tests

Minimum 12 new tests covering:
- Render question with all fields
- Edit question text → auto-save mutation called after debounce
- Click radio → correct answer updates
- Click AI viết lại → modal opens, mutation called
- Difficulty toggle → field updates + sidebar refresh
- Delete button → confirm dialog → delete mutation
- Validation: empty question shows yellow border
- Validation: scripture ref invalid format shows red border
- Switch question while editing → force save called

## E.8 ✋ STOP at end of Phase E

Manual test:
- Add question manually
- Type question text, options, mark correct, fill explanation + verse
- Auto-save happens (verify network tab)
- Click another question → previous saved before switch
- Refresh page → all data persisted

Commit: `feat(quizset): question editor with auto-save (BL-AD-8 Phase E)`

---

# Phase F — AI Integration

## F.1 AIGeneratePanel component

Opens when click "⚡ AI tạo nháp" in sidebar. Modal or slide-down panel containing the difficulty distribution mockup from session (3 steppers + presets).

```
quizset-editor/ai/
├── AIGeneratePanel.tsx            (~250 LOC, modal with form)
├── DifficultyStepperGroup.tsx     (~150 LOC, 3 steppers + distribution bar)
└── PresetChips.tsx                (~50 LOC, "Đều nhau" / "Đề xuất 40/40/20")
```

## F.2 Visual spec (per mockup canonical with difficulty mix)

Modal centered, max-width 580px, bg `#11131e`:

- Title: "⚡ AI tạo nháp câu hỏi"
- Section 1: Phạm vi (book name display from quiz set metadata + chapter range editable)
- Section 2: Difficulty distribution
  - DistributionBar header: "Tổng: N câu"
  - Horizontal color bar showing ratio
  - 3 stepper cards (Dễ/TB/Khó):
    - Color-coded background (green/yellow/red tints)
    - Stepper: `[− value +]` with each level 0-15
  - Preset chips below: "Đều nhau" + "Đề xuất 40/40/20"
- Footer: primary button "Tạo N câu" với breakdown text "· 2 dễ + 2 TB + 1 khó"
- Quota check: if total > remaining quota → disable button + show warning

## F.3 Loading + result handling

After submit:
1. Modal shows loading state: "Đang tạo N câu... ~20-30s" + spinner
2. Backend POST `/api/groups/{gid}/quiz-sets/{sid}/ai-generate`
3. On 200: close modal, append questions to sidebar list (toast "Đã thêm N câu mới")
4. On 429 (quota): show warning in modal + "Thử lại ngày mai" button
5. On 500: show error + retry option
6. Audit log entry happens server-side (per BL-AD-7 D4)

## F.4 Provider transparency

Per D7, do NOT hardcode "DeepSeek" in UI. Backend chooses provider. Frontend just shows generic "AI" wording.

Exception: if backend response includes `providerUsed` field, show small subtle label in dev mode only (env check). In production, hide.

## F.5 Quota display sync

After AI gen returns, update top bar quota display from response `remaining` field. No need to refetch.

## F.6 Tests

```tsx
test('AI panel opens when click "AI tạo nháp"')
test('default distribution is 2/2/1 (or equivalent locked default)')
test('preset "Đều nhau" sets equal distribution')
test('preset "Đề xuất 40/40/20" sets that ratio')
test('total > quota disables submit button')
test('submit calls AI generate mutation')
test('success appends questions to sidebar + closes modal')
test('429 quota response shows warning')
test('500 shows retry option')
test('per-question AI rewrite opens popover + calls rewrite endpoint')
```

## F.7 ✋ STOP at end of Phase F

Manual test:
- Click AI tạo nháp → modal opens
- Set 2/2/1 → click Tạo → wait ~20s
- Verify 5 new questions appear in sidebar
- Verify all marked with ✨ source icon
- Click question → edit → AI viết lại button works
- Verify quota counter decreases

Commit: `feat(quizset): AI integration via DeepSeek (BL-AD-8 Phase F) — depends on BL-AD-7`

---

# Phase G — Auto-save + Publish Flow

## G.1 Publish validation modal

When click "Xuất bản" button:
1. Client-side validation runs: collect errors per question
2. If errors: show modal "Còn N vấn đề cần sửa"
   - List each invalid question + issue
   - "Đi tới câu N" button → close modal + activate that question
3. If valid: show confirmation modal
   - "Xuất bản bộ câu hỏi này?"
   - Show summary: N câu (X dễ, Y TB, Z khó)
   - "Hủy" / "Xuất bản"
4. On confirm: POST `.../publish` → toast success + navigate back to group page

## G.2 Draft persistence verification

Test scenarios:
- Edit → close tab → reopen → data preserved (latest auto-save state)
- Edit → click back → React Router prompt "Bỏ thay đổi chưa lưu?" (only if pending debounce)
- Idle 30s → forced save triggers
- Network failure during save → retry with exponential backoff (3 tries) + toast on final fail

## G.3 React Router navigation guard

```tsx
import { useBlocker } from 'react-router-dom';

const blocker = useBlocker(({ currentLocation, nextLocation }) => 
  hasPendingChanges && currentLocation.pathname !== nextLocation.pathname
);

if (blocker.state === 'blocked') {
  // Show confirm dialog
}
```

## G.4 ✋ STOP at end of Phase G

Manual test:
- Edit → close tab → reopen → data preserved
- Click Xuất bản with invalid → see error list
- Fix → Xuất bản again → confirm dialog → publish → redirect to group page
- Status badge changes DRAFT → PUBLISHED

Commit: `feat(quizset): publish flow + draft persistence (BL-AD-8 Phase G)`

---

# Phase H — Mobile Responsive

## H.1 Breakpoint strategy

Per mockup canonical mobile:
- < 768px: single-column layout
- Sidebar replaced by:
  - Top: small progress segments bar (each question = 1 segment, color = difficulty)
  - "Tất cả" button → opens bottom sheet with full question list
- Bottom: sticky 3-row action bar
  - Row 1: Prev / Next buttons
  - Row 2: AI tạo nháp / Thêm tay
  - Row 3: Xuất bản primary

## H.2 Implementation

```tsx
// QuizSetEditor.tsx
const isMobile = useMediaQuery('(max-width: 768px)');

return isMobile ? <MobileLayout /> : <DesktopLayout />;
```

Two separate layout components, share child components (QuestionEditor, AIGeneratePanel) untouched. Only the orchestration shell differs.

## H.3 Mobile-specific components

```
quizset-editor/mobile/
├── MobileLayout.tsx               (~200 LOC)
├── MobileTopBar.tsx               (~150 LOC)
├── ProgressSegmentBar.tsx         (~80 LOC)
├── QuestionListBottomSheet.tsx    (~180 LOC)
└── MobileActionBar.tsx            (~120 LOC)
```

## H.4 Touch optimizations

- Min tap target 44x44dp (Apple HIG)
- Disable hover styles on touch devices
- Bottom sheet uses `vaul` library or custom CSS transform (no `position: fixed` issues for editor itself, only modal/sheet)
- Difficulty toggle larger on mobile (pill instead of small segment)

## H.5 RN equivalent (if applicable)

Per audit: if `apps/mobile/src/screens` has equivalent, plan separate sprint for RN port. Phase H only handles responsive web for now.

## H.6 Tests

```tsx
test('renders MobileLayout when viewport < 768px')
test('renders DesktopLayout when viewport ≥ 768px')
test('"Tất cả" button opens bottom sheet')
test('bottom sheet shows all questions')
test('Prev disabled on first question')
test('Next disabled on last question')
```

Playwright responsive tests:
- viewport 375x812 (iPhone 14)
- viewport 768x1024 (iPad)
- viewport 1440x900 (desktop)

## H.7 ✋ STOP at end of Phase H

Manual test on real Android device (per memory: Expo + AVD setup):
- Mobile Chrome → /groups/X/quiz-sets/Y/edit
- All buttons tappable (44dp+)
- Bottom sheet opens
- Editing works without virtual keyboard hiding inputs

Commit: `feat(quizset): mobile responsive layout (BL-AD-8 Phase H)`

---

# Phase I — Cleanup Old Modal

## I.1 Delete old modal

Per audit findings, delete:
- `CreateQuizSetModal.tsx` (or equivalent name)
- Related tests
- Imports from group page

## I.2 Verify no references remain

```bash
grep -rn "CreateQuizSetModal\|QuizSetCreateModal" apps/web/src --include="*.tsx" --include="*.ts"
# Expect: 0 results
```

## I.3 Update SPEC_GROUP_v1.3

Patch `SPEC_GROUP_v1.3.md` with new section §6.X (replace any modal-based sections):

```markdown
### 6.X Quiz Set Creation (Editor Page)

**Pattern:** Trang editor riêng, KHÔNG dùng modal.

**Routes:**
- `/groups/{groupId}/quiz-sets/new` — create (auto-creates DRAFT then redirects)
- `/groups/{groupId}/quiz-sets/{setId}/edit` — edit existing

**Permission:** group_leader/mod của nhóm. Member → 403.

**Layout:**
- Desktop: top bar + metadata accordion + sidebar question list + main editor
- Mobile: single column với bottom action bar + bottom sheet "Tất cả"

**AI integration:**
- "⚡ AI tạo nháp" — gen N câu với difficulty distribution (3 steppers Dễ/TB/Khó)
- Per-question "AI viết lại" — regen 1 câu cụ thể với hint optional
- KHÔNG có concept "AI mode" vs "Manual mode" — AI là tool button trong editor thống nhất
- Provider invisible (per BL-AD-7 D3 + D7)

**Workflow statuses (per Sprint 5):**
- DRAFT: auto-save mỗi 30s, members không thấy
- PUBLISHED: members thấy + play được
- ARCHIVED: ẩn nhưng giữ kết quả cũ
- SOFT_DELETED: hidden, 30 ngày hard delete

**Auto-save:**
- Field change → debounce 2s → PATCH endpoint
- 30s interval → forced save
- Page navigate → React Router prompt nếu có pending changes
- Tab close → beforeunload event force save

**Validation (block Publish):**
- Tên bộ ≥ 3 ký tự
- ≥ 1 câu hỏi valid
- Mỗi câu: question text ≥ 10 chars, 4 options ≥ 2 chars each, correct marked,
  explanation ≥ 20 chars, scriptureRef valid format

**Removed from spec:** Modal "Tạo bộ câu hỏi" 2-tab ("AI tạo / Tự soạn") — fully replaced by this editor page.
```

## I.4 Update BACKLOG.md

Mark BL-AD-8 as ✅ DONE:

```markdown
## BL-AD-8 — Quiz Set Editor Unified Page
**Status:** ✅ DONE (2026-05-XX)
**Decisions locked:** D1-D10 (PROMPT_QUIZ_SET_EDITOR_PAGE.md)
**Spec impact:** SPEC_GROUP §6.X (new section)
**Total:** ~2,800 LOC, 8 days, 50+ new tests
**Dependencies satisfied:** BL-AD-7 (DeepSeek integration)
**Linked migrations:** none (existing schema sufficient)
```

## I.5 Final regression

```bash
# Full suites
cd apps/api && ./mvnw test
cd apps/web && npm run build
cd apps/web && npx vitest run
cd apps/web && npx playwright test
```

Compare test counts vs baseline:
- BE: previous + 15 (Phase B) = expected new total
- FE Vitest: previous + ~40 new tests
- Playwright: previous + 3 responsive tests

## I.6 ✋ STOP at end of Phase I

```
Commit: `chore(quizset): remove old modal + spec update (BL-AD-8 Phase I)`
```

Wait for human approval to merge to main.

---

# 📊 Severity Classification

- **P0 (blocking):** Phase A audit reveals AI gen endpoint missing AND BL-AD-7 not yet merged → cannot proceed Phase F. Pause and merge BL-AD-7 first.
- **P0 (blocking):** Backend question CRUD endpoints missing for partial updates → must build in Phase B.
- **P1:** Auto-save conflict if 2 leaders edit same set simultaneously → last-write-wins for v1 (Sprint 7+ may add CRDT).
- **P1:** Verse preview endpoint missing → defer feature, ship without preview.
- **P2:** Cmd+S keyboard shortcut not implemented → backlog for v2.
- **P2:** "AI sinh tương tự" + "AI gợi ý đáp án nhiễu" deferred per D8.

---

# 🔗 Spec Update Strategy (per CLAUDE.md rule)

**Strategy chosen:** (a) Spec update commit cùng PR

**Affected sections:**
- SPEC_GROUP_v1.3 §6.X (NEW)
- SPEC_GROUP_v1.3 §6.Y modal description (REMOVE)
- BACKLOG.md BL-AD-8 entry update

**Audit pass requirement:**
```bash
bash tools/spec-audit/audit.sh
# Expect: exit 0, no broken refs
```

---

# ✅ Definition of Done

- [ ] All 9 phases complete with separate commits
- [ ] BE test count: baseline + 15+
- [ ] FE Vitest count: baseline + 40+
- [ ] Playwright responsive tests pass (3 viewports)
- [ ] No `var(--input-bg)` usage in editor components (grep verify)
- [ ] No hardcoded "deepseek" string in FE (grep verify)
- [ ] Mobile tested on real device (Android via Expo)
- [ ] Manual test scenarios from each phase pass
- [ ] SPEC_GROUP §6.X updated
- [ ] BACKLOG BL-AD-8 marked DONE
- [ ] Old CreateQuizSetModal deleted, 0 grep references
- [ ] Spec audit exit 0
- [ ] PR description references both BL-AD-7 (DeepSeek) and BL-AD-8 (this work)

---

*End of PROMPT_QUIZ_SET_EDITOR_PAGE.md*
