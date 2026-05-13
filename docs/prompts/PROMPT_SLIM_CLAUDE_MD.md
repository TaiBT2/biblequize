# PROMPT: Slim CLAUDE.md (Option A — extract reference docs)

> **Goal:** Slim CLAUDE.md từ 1083 dòng xuống **≤ 250 dòng** (target ~200) bằng cách tách reference content sang `docs/dev/`. CLAUDE.md chỉ giữ **behavioral rules + spec hierarchy + critical Known Issues** — phần load mỗi turn của Claude Code.
>
> **Output:**
> - `/mnt/user-data/outputs/CLAUDE.md` (target ~200 dòng, hard cap 250)
> - `/mnt/user-data/outputs/docs/dev/*.md` (5 reference files)
> - `/mnt/user-data/outputs/CLAUDE_MIGRATION_NOTES.md` (mapping audit trail)
>
> **Tại sao slim:** CLAUDE.md được Claude Code load **mỗi turn** vào context. 1083 dòng = 8-10K tokens mỗi message + attention dilution → core rules bị miss. Reference content (Stitch workflow chi tiết, Local Dev Start commands, Architecture trees, deps list) chỉ cần khi đụng task tương ứng — Claude Code follow link đọc on-demand.
>
> **Workflow:** Phase 1 verify → Phase 2 design split → Phase 3 extract → Phase 4 condense + add critical sections → Phase 5 self-check.

---

## Bối cảnh

CLAUDE.md hiện 1083 dòng. Phân tích:
- **~400 dòng = behavioral rules** (load mỗi turn): Think Before Code, 3-tier test, Quy ước code, KHÔNG được làm, Known Issues critical, Vibe guardrails.
- **~680 dòng = reference content** (load on-demand): Local Dev Start, Architecture trees, Design tokens chi tiết, Stitch workflow, Approved Dependencies, API Endpoints Map (đã thay bằng spec pointers per C-4 trong prompt cũ), Error Handling patterns, State Management map, etc.

Mục tiêu: chỉ giữ behavioral rules trong CLAUDE.md. Reference content move sang `docs/dev/`.

---

## Phase 1: VERIFY (giống prompt cũ V-1 → V-10)

> **Quy tắc:** Mọi data point trong CLAUDE.md mới phải có evidence từ verify, không từ trí nhớ.

### V-1. Versions từ package files

```bash
cat apps/web/package.json | grep -E "\"(vitest|tailwindcss|react|@tanstack/react-query|zustand|@playwright/test|react-i18next|react-helmet-async)\":"
cat apps/mobile/package.json 2>/dev/null | grep -E "\"(react-native|expo|@react-navigation|expo-haptics)\":"
grep -A1 "<artifactId>spring-boot-starter-parent</artifactId>" apps/api/pom.xml
```

### V-2. Backend modules đã ship
```bash
ls apps/api/src/main/java/com/biblequiz/modules/
```

### V-3. Sprint 4 host-organizer status
```bash
grep -r "hostPlaysGame" apps/api/src/main/java/ --include="*.java" -l | head -5
```

### V-4. Test baselines
```bash
cd apps/web && npx vitest run --reporter=verbose 2>&1 | tail -3 | grep -oP '\d+ passed' | head -1
cd apps/api && ./mvnw test -Dtest="com.biblequiz.api.**,com.biblequiz.service.**" 2>&1 | grep "Tests run:" | tail -1
```

### V-5. useWebSocket deprecation status
```bash
grep -rn "useWebSocket\b" apps/web/src --include="*.ts" --include="*.tsx" | wc -l
grep -rn "useStomp\b" apps/web/src --include="*.ts" --include="*.tsx" | wc -l
```

### V-6. Spec files paths confirm
```bash
ls docs/specs/SPEC_*.md docs/specs/BACKLOG.md 2>&1
```

### V-7. ShareCard supports `tier_up` type
```bash
grep -n "type.*tier_up\|'tier_up'\|\"tier_up\"" apps/web/src/components/ShareCard.tsx
```

### V-8. i18n hardcoded count
```bash
cd apps/web && npm run validate:i18n 2>&1 | tail -10
```

### V-9. Legacy SQL seed count
```bash
ls apps/api/src/main/resources/db/migration/R__*_questions.sql 2>/dev/null | wc -l
```

### V-10. Mobile app structure
```bash
ls apps/mobile/src/screens 2>/dev/null && echo "Mobile shipped" || echo "Mobile stub only"
ls apps/web/src/pages/*.tsx 2>/dev/null | wc -l
```

Output → `/tmp/verify_results.txt`. KHÔNG sang Phase 2 cho đến khi có đủ.

---

## Phase 2: DESIGN — split mapping

> **Output:** `/mnt/user-data/outputs/CLAUDE_MIGRATION_NOTES.md` chứa mapping table BEFORE edit.

### Mapping table cho Claude Code

| Section hiện tại trong CLAUDE.md | Line range | Đi đâu |
|---|---|---|
| Nguyên tắc tuyệt đối | 1-9 | **CLAUDE.md** (giữ, condense) |
| Think Before Code | 10-92 | **CLAUDE.md** (giữ 5 bước, bỏ ví dụ ShareCard 60 dòng) |
| Quy trình Task / TODO format | 94-194 | **CLAUDE.md** (giữ rules, bỏ ví dụ format dài) |
| Stack | 196-203 | **CLAUDE.md** (giữ super ngắn) + `docs/dev/setup.md` (chi tiết) |
| Product context | 205-208 | **CLAUDE.md** (giữ + add C2 mode names + C4 Bible) |
| Question Seeding | 210-222 | `docs/dev/seeding.md` (full) + 1 dòng pointer trong CLAUDE.md |
| Quản lý quyết định | 224-240 | **CLAUDE.md** (giữ ngắn) |
| Local Dev Start | 242-268 | `docs/dev/setup.md` (full) |
| Quy tắc bắt buộc | 270-276 | **CLAUDE.md** (giữ) |
| Quy trình test 3-tier | 278-357 | **CLAUDE.md** (giữ rules) + `docs/dev/testing.md` (commands chi tiết) |
| Cấu trúc package backend | 361-399 | `docs/dev/architecture.md` (full) |
| Cấu trúc frontend | 403-428 | `docs/dev/architecture.md` (full) |
| Design System (tokens + CSS utilities + Quy tắc UI) | 432-471 | `docs/dev/design-system.md` (full) + 5 dòng core rules trong CLAUDE.md |
| Quy ước code | 474-497 | **CLAUDE.md** (giữ) |
| Quy tắc test (unit/e2e/backend) | 499-535 | `docs/dev/testing.md` |
| Lệnh test | 538-557 | `docs/dev/testing.md` |
| Commit Convention | 560-578 | **CLAUDE.md** (giữ ngắn) |
| Approved Dependencies | 581-604 | `docs/dev/dependencies.md` |
| E2E Test Gate | 607-707 | `docs/dev/testing.md` (full) + 5 dòng rule trong CLAUDE.md |
| Workflow feature mới | 710-728 | `docs/dev/workflows.md` |
| Workflow Stitch sync | 730-783 | `docs/dev/workflows.md` |
| Definition of Done | 786-796 | **CLAUDE.md** (giữ) |
| KHÔNG được làm | 797-820 | **CLAUDE.md** (giữ — critical rules) |
| Mobile Code/Testing Rules | 820-848 | `docs/dev/architecture.md` (consolidate với mobile structure) |
| Known Issues & Tech Debt | 850-889 | **CLAUDE.md** (prune FIXED items, giữ Medium + i18n) |
| API Endpoints Map | 893-947 | DELETE → thay bằng spec pointer (đã handle trong Spec hierarchy section) |
| Error Handling Patterns | 950-975 | `docs/dev/conventions.md` |
| State Management Map | 978-1012 | `docs/dev/conventions.md` |
| Khi bị kẹt | 1015-1033 | **CLAUDE.md** (giữ ngắn) |
| Vibe Coding Guardrails | 1037-1083 | **CLAUDE.md** (giữ — anti-patterns critical) |

### Reference docs cấu trúc

```
docs/dev/
├── setup.md           — Local Dev (3 modes), env vars, ports
├── architecture.md    — Backend modules tree, frontend pages tree, mobile structure
├── design-system.md   — Sacred Modernist tokens, CSS utilities, Stitch workflow, Stitch HTML reading guide
├── testing.md         — Vitest config, Playwright config, E2E Test Gate full, lệnh test
├── dependencies.md    — Approved deps web/mobile/backend, request-to-add process
├── workflows.md       — Feature workflow, Stitch sync workflow, PROMPT_*.md pattern
└── conventions.md     — Error handling 3 layers, State management map, localStorage keys
```

7 file reference. Mỗi file 80-200 dòng.

---

## Phase 3: EXTRACT — tạo reference docs

> **Quy tắc:** Copy nguyên content từ CLAUDE.md hiện tại sang reference doc. KHÔNG rewrite, chỉ relocate + add header.

Mỗi reference file phải có:
1. Title H1: tên file
2. Subtitle: "Extracted from CLAUDE.md on [date]. Referenced from CLAUDE.md §[section]."
3. Original content (faithful copy, có thể fix typo nhỏ)
4. Footer: "Updates: nếu có thay đổi → update file này, không add lại vào CLAUDE.md"

### Order tạo reference docs

1. `docs/dev/setup.md` — content từ §Stack + §Local Dev Start + §Quy tắc bắt buộc OAuth env
2. `docs/dev/architecture.md` — content từ §Cấu trúc package backend + §Cấu trúc frontend + §Mobile Code Rules
3. `docs/dev/design-system.md` — content từ §Design System (tokens + CSS utilities + Stitch MCP)
4. `docs/dev/testing.md` — content từ §Quy tắc test + §Lệnh test + §E2E Test Gate
5. `docs/dev/dependencies.md` — content từ §Approved Dependencies (web + mobile add từ V-1)
6. `docs/dev/workflows.md` — content từ §Workflow feature mới + §Workflow Stitch sync + add A-4 PROMPT_*.md workflow
7. `docs/dev/conventions.md` — content từ §Error Handling Patterns + §State Management Map

**Commit:** `docs(dev): extract reference content from CLAUDE.md to docs/dev/` (1 commit cho cả 7 file).

---

## Phase 4: REWRITE CLAUDE.md (target ~200 dòng)

### Cấu trúc CLAUDE.md mới

```markdown
# Project: BibleQuiz

[1. Nguyên tắc tuyệt đối]              ~5 dòng
[2. Think Before Code (5 bước)]        ~25 dòng (bỏ ví dụ ShareCard)
[3. Spec hierarchy + C1-C9]            ~35 dòng (A-1 CRITICAL)
[4. Product context]                   ~8 dòng (add C2 mode + C4 Bible)
[5. Quy trình Task / TODO]             ~15 dòng (bỏ format example)
[6. 3-tier test (rules)]               ~20 dòng (commands → docs/dev/testing.md)
[7. Quy ước code core]                 ~20 dòng
[8. Definition of Done]                ~10 dòng
[9. Commit Convention]                 ~12 dòng
[10. KHÔNG được làm]                   ~25 dòng (giữ critical rules)
[11. Known Issues — fix-on-touch]      ~25 dòng (prune FIXED, add BACKLOG rule A-2)
[12. References → docs/dev/]           ~10 dòng

Total target: ~200 dòng (hard cap 250)
```

### Content cho mỗi section CLAUDE.md mới

#### Section 1: Nguyên tắc tuyệt đối (~5 dòng) — GIỮ NGUYÊN

```markdown
## Nguyên tắc tuyệt đối
- Không bao giờ sửa code module khác khi đang làm 1 module
- Mỗi thay đổi phải có test pass trước khi commit
- Không tự ý thêm dependency mới — hỏi trước (xem `docs/dev/dependencies.md`)
- Ưu tiên đọc TODO.md trước khi làm bất cứ thứ gì
- LUÔN chia nhỏ task vào TODO.md TRƯỚC khi code — không tự xử lý 1 lần
```

#### Section 2: Think Before Code (~25 dòng) — CONDENSE

Giữ 5 bước process. Bỏ:
- Ví dụ ShareCard chi tiết (line 53-71)
- Self-check sau 30 phút (line 84-92) — move sang `docs/dev/workflows.md`

```markdown
## Think Before Code (BẮT BUỘC trước khi viết dòng code đầu tiên)

> KHÔNG BAO GIỜ viết code ngay sau khi nhận prompt. Phải qua đủ 5 bước.

```
BƯỚC 1 — ĐỌC HIỂU: TODO.md có task dở? Prompt thực sự muốn gì? Known Issues?
BƯỚC 2 — KHẢO SÁT CODE: Đọc file sẽ sửa, grep pattern, đọc test, check file "nhạy cảm". E2E Test Gate (xem `docs/dev/testing.md`).
BƯỚC 3 — PLAN: Chia tasks < 100 LOC, ghi TODO.md, xác định test strategy.
BƯỚC 4 — VERIFY ASSUMPTIONS: API response shape? State shape? Function đã có chưa? Pattern khác codebase?
BƯỚC 5 — BẮT ĐẦU CODE (chỉ sau khi 1-4 xong)
```

### Rules cứng (vi phạm = revert)
1. KHÔNG tạo function/component/hook mới mà chưa grep codebase
2. KHÔNG đoán API response — đọc Controller + DTO hoặc test endpoint
3. KHÔNG viết > 50 LOC mà chưa đọc file đang sửa
4. KHÔNG bắt đầu code mà chưa ghi TODO.md
5. KHÔNG sửa file nào mà chưa đọc Known Issues
6. KHÔNG tạo CSS/style mới — check `docs/dev/design-system.md`
7. KHÔNG viết business logic trong component — tách hooks/utils
8. Prompt mơ hồ → DỪNG, hỏi clarify, KHÔNG tự suy diễn rồi code
```

#### Section 3: Spec hierarchy + C1-C9 (~35 dòng) — A-1 CRITICAL ADD

```markdown
## Spec hierarchy — Source of truth cho business rules

> KHÔNG đoán business behavior. Đọc spec tương ứng trước.

| Concern | Spec |
|---|---|
| Tier system, scoring, energy, lifeline, prestige, cosmetic, comeback, missions, journey, achievements, leaderboard, tournaments, mobile parity, i18n, sound/haptics, onboarding | `docs/specs/SPEC_USER_v3.1.md` |
| 5 multiplayer modes, R1–R5 room lifecycle, STOMP events, Quản trò mode (Sprint 4) | `docs/specs/SPEC_MULTIPLAYER.md` |
| Church Group (Q-A...Q-O locked), quiz sets, scheduled quizzes, group leaderboard, kick/report (V41) | `docs/specs/SPEC_GROUP_v1.2.md` |
| Admin panel (15 routes), AI generator, duplicate detection, audit log, configuration | `docs/specs/SPEC_ADMIN_v3.1.md` |
| Future / non-shipped (Friend, Premium, TV Host, Multi-leader, Sentry, Offline) | `docs/specs/SPEC_ROADMAP.md` |
| Code gaps vs canonical (BL-1...BL-15, BL-AD-1...BL-AD-6) | `docs/specs/BACKLOG.md` |

### Khi spec ↔ code lệch
1. Spec = canonical intent. Code phải catch up.
2. Mở `BACKLOG.md` tìm BL-N tương ứng. Không có → tạo issue mới.
3. KHÔNG sửa spec cho match code, trừ khi Bui confirm qua DECISIONS.md.

### Canonical constraints (C1–C9)

| # | Constraint |
|---|---|
| C1 | Tier names: Tân Tín Hữu / Người Tìm Kiếm / Môn Đồ / Hiền Triết / Tiên Tri / Sứ Đồ |
| C2 | Mode names VN: "Luyện Tập" + "Đấu Hạng" (KHÔNG "Leo Rank", "Thi Đấu Ranked") |
| C3 | 4 mùa Liturgical (Phục Sinh / Ngũ Tuần / Cảm Tạ / Giáng Sinh) + ×1.5 score |
| C4 | Bible BTTHĐ 2011, 66 books Protestant, 50/50 VN/EN |
| C5 | Answer colors: A=Coral / B=Sky / C=Gold / D=Sage |
| C6 | Group roles: Leader (gold) / Mod (blue) / Member |
| C7 | Room lifecycle 5 rules R1–R5; CANCELLED status deprecated |
| C8 | SPEC_GROUP locked decisions Q-A...Q-O preserved verbatim |
| C9 | Defer features chỉ trong ROADMAP, không trong current specs |
```

#### Section 4: Product context (~8 dòng) — UPDATE C-1

```markdown
## Product context

- **Target audience**: Tin Lành (Protestant) Việt Nam.
- **Bible canon**: 66 books Protestant. KHÔNG thêm 7 Deuterocanonical Công Giáo.
- **Bible version**: BTTHĐ 2011 canonical (C4). Code seed hiện vẫn BTT 1926 (public domain) — BL-1 track migration. Câu mới: BTT 1926 + comment `// TODO BL-1: BTTHĐ 2011`.
- **Tier naming**: religious (C1), KHÔNG light-themed (Tia Sáng/Vinh Quang).
- **Mode naming**: "Luyện Tập" + "Đấu Hạng" (C2 lock 2026-05-09).
- **Question seeding**: workflow + filename convention → `docs/dev/seeding.md`.

> Reference: DECISIONS.md cho lịch sử quyết định.
```

#### Section 5: Quy trình Task / TODO (~15 dòng) — CONDENSE

Giữ format rules, bỏ ví dụ chi tiết v2.5 Home Dashboard.

```markdown
## Quy trình quản lý Task

> KHÔNG nhận prompt rồi chạy hết 1 lần. Chia nhỏ → ghi TODO.md → làm từng task → ✅ → kế.

```
1. Đọc TODO.md hiện tại — task dở chưa xong?
2. Phân tích prompt mới → chia tasks (mỗi task = 1 commit)
3. Ghi tasks vào TODO.md theo format:
   ## [Phase] — [Tên nhóm] [IN PROGRESS/DONE]
   ### Task N: [Tên]
   - Status: [ ] TODO / [x] DONE / [!] BLOCKED
   - File(s): ...
   - Test: ...
   - Checklist + Commit message
4. Làm task đầu → test pass → ✅ → commit → task kế
5. Hết tasks → full regression → cập nhật TODO.md
```

### Rules
- 1 task = 1 commit, < 100 LOC
- KHÔNG gộp / skip / làm song song
- Sau mỗi task: cập nhật TODO.md NGAY
- BLOCKED: ghi lý do, chuyển task không phụ thuộc, quay lại
```

#### Section 6: 3-tier test rules (~20 dòng) — CONDENSE

Bỏ commands chi tiết (move `docs/dev/testing.md`).

```markdown
## Quy trình test bắt buộc (Regression Guard)

> Chạy test đơn lẻ chỉ chứng minh code mới hoạt động.
> Full regression chứng minh code mới KHÔNG phá code cũ.

### 3 tầng — KHÔNG bỏ tầng

| Tầng | Khi nào | Mục đích |
|---|---|---|
| 1 — Scope | Sau mỗi function/component | Code mới hoạt động đúng |
| 2 — Related | Sau hoàn thành 1 screen / sửa shared | Module liên quan không break |
| 3 — Full Regression | TRƯỚC mỗi commit (BẮT BUỘC) | KHÔNG regression toàn hệ thống |

Commands chi tiết: `docs/dev/testing.md`.

### Files "nhạy cảm" — sửa = chạy Tầng 3 ngay
`store/authStore.ts`, `api/client.ts`, `layouts/AppLayout.tsx`, `contexts/RequireAuth*.tsx`, `styles/global.css`, `hooks/useStomp.ts`, `main.tsx`, BE: `SecurityConfig`, `GlobalExceptionHandler`.

### Khi phát hiện regression
DỪNG ngay, KHÔNG code thêm feature mới. Xác định fail test → fix root cause → Tầng 3 lại → ALL PASS mới tiếp tục.

### Baseline
Số test KHÔNG giảm so với trước task. Baseline trong `apps/web/.test-baseline` + `apps/api/.test-baseline`. KHÔNG hardcode số trong CLAUDE.md.

### E2E Test Gate
Mọi feature/fix → check TC spec + Playwright code TRƯỚC khi code. Chi tiết: `docs/dev/testing.md` §E2E Test Gate.
```

#### Section 7: Quy ước code core (~20 dòng) — GIỮ

```markdown
## Quy ước code bắt buộc

### Backend
- Primary key UUID v7 (KHÔNG auto-increment)
- Mọi Entity: id, createdAt, updatedAt
- Mọi API lỗi: `{ code, message, requestId, details? }` — KHÔNG expose stack trace
- MapStruct cho Entity ↔ DTO
- Mọi DB change: Flyway script `db/migration/V{n}__{description}.sql`
- Mọi `/admin/**` endpoint: `@PreAuthorize("hasRole('ADMIN')")`
- `@Transactional` cho ghi nhiều bảng

### Frontend
- API call: TanStack Query (KHÔNG `useEffect + fetch`)
- Global state: Zustand (Exception: `ErrorContext` tree-scoped được phép)
- KHÔNG hardcode URL — `import.meta.env.VITE_API_URL`
- Form: loading + error handling
- Component max 300 LOC — vượt thì tách
- KHÔNG inline style — Tailwind hoặc global CSS utilities
- 3 states mỗi page: loading (Skeleton), error (msg + retry), success

### Architecture trees + design tokens + dependency list
→ `docs/dev/architecture.md`, `docs/dev/design-system.md`, `docs/dev/dependencies.md`
```

#### Section 8: Definition of Done (~10 dòng) — GIỮ

```markdown
## Definition of Done
- Tầng 3 pass: Vitest + Playwright + JUnit — tất cả green
- Số test ≥ baseline (`.test-baseline` files)
- Không TypeScript/Java compile error
- Không `@SuppressWarnings` mới
- Flyway migration clean trên DB trống
- Chạy được local end-to-end
- UI match design tokens (Stitch → pixel-perfect)
- Loading/error/success states đều handled
```

#### Section 9: Commit Convention (~12 dòng) — GIỮ

```markdown
## Commit Convention

```
feat: ...       fix: ...        refactor: ...
test: ...       style: ...      sync: ...
docs: ...       chore: ...      fix(BL-N): ...   # BACKLOG item
```

Ví dụ:
- `feat: add TournamentMatch page with 1v1 gameplay`
- `fix(BL-3): wire XP surge in ScoringService`
- `sync: Home dashboard from Stitch v5`
```

#### Section 10: KHÔNG được làm (~25 dòng) — GIỮ critical anti-patterns

```markdown
## KHÔNG được làm

### Code
- KHÔNG dùng H2 in-memory cho test — Testcontainers MySQL
- KHÔNG map Entity → DTO thủ công — MapStruct
- KHÔNG để business logic trong Controller — chỉ Service
- KHÔNG `System.out.println` — `@Slf4j` log
- KHÔNG xóa Flyway migration đã chạy — tạo migration mới
- KHÔNG hardcode màu/font ngoài design tokens
- KHÔNG `page.waitForTimeout()` Playwright — proper waits

### Workflow
- KHÔNG commit khi test fail
- KHÔNG file > 300 LOC
- KHÔNG skip Tầng 3 trước commit (kể cả 1 dòng CSS)
- KHÔNG disable test cũ để test mới pass
- KHÔNG tiếp tục feature khi đang regression
- KHÔNG nhận prompt rồi code 1 lần — chia TODO.md trước
- KHÔNG gộp nhiều thay đổi vào 1 commit
- KHÔNG bỏ section Stitch HTML khi sync

### Specs
- KHÔNG tự ý sửa SPEC_*.md để match code (ngược lại — code phải catch up)
- KHÔNG document defer features (Friend/Premium/TV Host) như shipped
- KHÔNG dùng tier names cũ (Tia Sáng/Vinh Quang) — đã C1 lock religious
- KHÔNG dùng "Leo Rank"/"Thi Đấu Ranked" trong VN UI — C2 lock "Đấu Hạng"
- KHÔNG seed câu hỏi mới mà thiếu `explanation` + `scriptureRef` (BTTHĐ 2011)
```

#### Section 11: Known Issues + fix-on-touch (~25 dòng) — PRUNE + ADD A-2

```markdown
## Known Issues & Fix-on-touch (cập nhật: [date từ V])

> Khi task chạm file có known issue → **tạo task fix issue đó** TRƯỚC task chính.

### Critical — fix ngay khi chạm

| # | File | Issue |
|---|------|-------|
[V-5 nếu useWebSocket còn callers > 0:]
| 1 | `hooks/useWebSocket.ts` | DEPRECATED — use `useStomp.ts` (STOMP CONNECT header). Migrate caller hoặc native WS. BL-15. |

### Medium — fix khi có thời gian

| # | File | Issue |
|---|------|-------|
| 1 | `pages/AuthCallback.tsx` | Dynamic `import()` trong useEffect — đổi static import |
| 2 | `pages/RoomQuiz.tsx` | `location.state as any` — typed interface |
| 3 | `pages/Achievements.tsx` | `useState<any>({})` — type stats object |
| 4 | `components/ui/SearchableSelect.tsx` | Inline styles → Tailwind |

### i18n Coverage
- Validator: `cd apps/web && npm run validate:i18n`
- Current: [V-8] hardcoded lines, 0 missing keys (initial baseline 578/32)
- Accepted debt: `data/verses.ts`, PrivacyPolicy/TermsOfService, LandingPage marketing, AIQuestionGenerator DEFAULT_PROMPT
- Rule: PR mới không tăng count trừ accepted-debt

### BACKLOG (BL-N items vs canonical specs)

> Source: `docs/specs/BACKLOG.md` — 21 items.

**Fix-on-touch:** task chạm file có BL-N → fix BL-N trước, commit `fix(BL-N): ...` riêng, cập nhật BACKLOG.md.

**Top-priority** (Bui Phase 2 confirmed):
- BL-2 group leaderboard Q-A scope · BL-3 wire XP surge · BL-13 wire Comeback multiplier · BL-4 i18n "Đấu Hạng"/"Luyện Tập" · BL-5 Pentecost+Thanksgiving · BL-15 useWebSocket migrate
```

#### Section 12: References (~10 dòng) — A-4 implicit

```markdown
## References — `docs/dev/`

| File | Khi nào đọc |
|------|-------------|
| `docs/dev/setup.md` | Setup local environment, env vars, ports |
| `docs/dev/architecture.md` | Hiểu cấu trúc backend modules / frontend pages / mobile |
| `docs/dev/design-system.md` | Sửa UI, sync Stitch design, design tokens |
| `docs/dev/testing.md` | Lệnh test chi tiết, E2E Test Gate full, viết test |
| `docs/dev/dependencies.md` | Add deps mới, check version |
| `docs/dev/workflows.md` | Feature workflow, Stitch sync workflow, PROMPT_*.md pattern |
| `docs/dev/conventions.md` | Error handling 3 layers, State management, localStorage keys |

> Khi sửa nội dung trong reference docs → KHÔNG add lại vào CLAUDE.md. CLAUDE.md chỉ giữ behavioral core.
```

**Commit Phase 4:** `docs: slim CLAUDE.md to ~200 lines + extract reference docs`

---

## Phase 5: Self-check

### Verify checklist trước nộp

- [ ] CLAUDE.md ≤ 250 dòng (target ~200) — verify `wc -l`
- [ ] 7 reference files trong `docs/dev/` đều ≥ 50 dòng (không file rỗng)
- [ ] Tất cả internal links từ CLAUDE.md sang `docs/dev/*.md` valid
- [ ] Tất cả links sang `docs/specs/*.md` valid (V-6 confirmed paths)
- [ ] Spec hierarchy section có C1-C9 đầy đủ
- [ ] Product context có C2 mode names + C4 Bible version
- [ ] Known Issues table FIXED items đã pruned (chỉ giữ active issues)
- [ ] BACKLOG fix-on-touch rule có top-priority list
- [ ] No mention "Sentry" (chưa ship)
- [ ] No mention "4 game modes" (đã 5 sau V39)
- [ ] No tier names cũ (Tia Sáng / Vinh Quang)
- [ ] No "Leo Rank" / "Thi Đấu" canonical (chỉ trong BL-4 fix context)
- [ ] No hardcoded test baseline `733`
- [ ] CLAUDE_MIGRATION_NOTES.md có đầy đủ mapping table
- [ ] Markdown render OK (preview if possible)

### Diff summary output

`/mnt/user-data/outputs/CLAUDE_MIGRATION_NOTES.md`:

```markdown
# CLAUDE.md Slim — Migration Notes

## Stats
- CLAUDE.md before: 1083 dòng
- CLAUDE.md after: [N] dòng
- Reduction: [N]%
- New reference files: 7 (`docs/dev/*.md`)

## Mapping Table
[Copy từ Phase 2 design]

## Critical content moved (with line refs)
| Section | Moved to | Original lines |
|---|---|---|
| Local Dev Start | docs/dev/setup.md | 242-268 |
| Backend modules tree | docs/dev/architecture.md | 361-399 |
| ... | ... | ... |

## Critical content added (NEW)
- Spec hierarchy + C1-C9 (CLAUDE.md §3)
- BACKLOG fix-on-touch rule (CLAUDE.md §11)
- Product context: C2 mode names, C4 Bible version (CLAUDE.md §4)
- References table → docs/dev/ (CLAUDE.md §12)

## Critical content deleted
- API Endpoints Map full table (replaced by spec pointer)
- Hardcoded test baseline `733`
- Workflow examples chi tiết (moved to docs/dev/workflows.md)

## Verify checklist
[Copy từ Phase 5 với ✅/❌]

## Outstanding questions for Bui
[Nếu có]

## Commits
1. `docs(dev): extract reference content from CLAUDE.md to docs/dev/` (Phase 3, 7 files)
2. `docs: slim CLAUDE.md to ~200 lines + extract reference docs` (Phase 4)
```

---

## Output rules

1. **CLAUDE.md** → `/mnt/user-data/outputs/CLAUDE.md`
2. **Reference docs** → `/mnt/user-data/outputs/docs/dev/{setup,architecture,design-system,testing,dependencies,workflows,conventions}.md`
3. **Migration notes** → `/mnt/user-data/outputs/CLAUDE_MIGRATION_NOTES.md`
4. **Verify outputs** → `/tmp/verify_results.txt`
5. **Commits:** 2 commits total
   - Phase 3: extract reference docs (1 commit, 7 files)
   - Phase 4: slim CLAUDE.md (1 commit)

---

## Anti-patterns

- ❌ Rewrite reference content — Phase 3 chỉ COPY từ CLAUDE.md hiện tại, không edit
- ❌ Để CLAUDE.md vượt 250 dòng — nếu vượt → tiếp tục slim, move thêm sang reference
- ❌ Giữ ví dụ chi tiết trong CLAUDE.md (vd ShareCard 60 dòng, Home v2.5 task list)
- ❌ Tạo reference docs với content chỉ 1-2 paragraph — gộp với file khác
- ❌ Skip Phase 1 verify — mọi data point phải từ V-1 → V-10
- ❌ Add Sprint 4 guardrail nếu V-3 không confirm merged
- ❌ Quên update internal links sau khi move content
- ❌ "Improve" content khi extract — relocate faithful, không edit

---

## Khi gặp ambiguity

Stop. Ghi `/mnt/user-data/outputs/QUESTIONS.md`:

```markdown
## Q1: [Question]
**Context:** file:line refs
**Options:** A. ... B. ...
**Recommendation:** ... + why
**Block:** Y/N — có chặn các Phase khác không?
```

Wait Bui clarification trước khi continue.

---

*End of prompt. Begin Phase 1 verify ngay sau khi đọc xong.*
