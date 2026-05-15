# Code Style & Conventions

The canonical rules live in `CLAUDE.md` §"Quy ước code bắt buộc". Summary:

## Backend (Java / Spring Boot 3.3)

- **Primary keys**: UUID v7 strings, NOT auto-increment integers.
- **Every Entity** has: `id`, `createdAt`, `updatedAt` (managed via `@PrePersist`/`@PreUpdate`).
- **API error shape** (`GlobalExceptionHandler`):
  ```json
  { "code": "...", "message": "...", "requestId": "...", "details": "?" }
  ```
  Never expose stack traces. Never `System.out.println` — use `@Slf4j`.
- **Entity ↔ DTO** mapping: **MapStruct only**. Hand-written mapping is forbidden.
- **DB changes**: write a Flyway migration `db/migration/V{n}__{description}.sql`. Never edit a migration that has run anywhere — write a follow-up migration instead.
- **All `/admin/**` endpoints**: `@PreAuthorize("hasRole('ADMIN')")`.
- **Transactional rule**: `@Transactional` on any service method writing to multiple tables.
- **No business logic in controllers** — controllers are thin shells calling services.
- **Test framework**: JUnit 5 with **Testcontainers MySQL**. **H2 in-memory tests are forbidden** (they let buggy SQL pass and then crash on prod migrations).
- **No `@SuppressWarnings`** added on new code (existing ones allowed).

## Frontend (React 18 / TS 5.4 / Tailwind 3.4)

- **All API calls via TanStack Query** (`useQuery` / `useMutation`). Never `useEffect + fetch`.
- **Global state via Zustand**. The single exception is tree-scoped `ErrorContext`.
- **No hardcoded URLs** — read from `import.meta.env.VITE_API_URL` / `VITE_API_BASE_URL`.
- **Every form** has loading + error states; every page has the **3 states**:
  loading (Skeleton), error (message + retry), success.
- **Component max 300 LOC** — exceed → split into sub-components / hooks.
- **No inline styles** — use Tailwind utilities or `global.css` design tokens.
  Design tokens are documented in `docs/dev/design-system.md`.
- **Business logic out of components** — extract into custom hooks (`hooks/*.ts`) or pure utils.
- **i18n keys**: prefer `react-i18next` `useTranslation` over hardcoded strings.
  Validator: `npm run validate:i18n` (currently 648 lines / 14 missing keys is the accepted-debt baseline).
- **Tier names / mode names**: enforce constants from `docs/spec` (C1, C2 locks) — never invent variations.
- **Playwright**: `page.waitForTimeout()` is forbidden — wait on selectors or network state instead.

## Naming

- Vietnamese-first UI strings (with EN parity progressing).
- File/folder slugs: ascii-folded Vietnamese → kebab-case, ≤ 70 chars. Example:
  `quiz-set-card-actions` (not `Quiz Set card: thêm action buttons`).
- BACKLOG items: `BL-N` (project-wide gap counter). Commit messages reference them: `fix(BL-3): ...`.

## Commit message convention

```
feat | fix | refactor | test | style | sync | docs | chore
fix(BL-N): ...                # when fixing a BACKLOG item
[no-spec-impact]              # tag refactors / pure code-quality changes with no behaviour change
```

Examples:
- `feat: add TournamentMatch page`
- `fix(BL-3): wire XP surge`
- `sync: Home dashboard from Stitch v5`

## File-style hard rules (CLAUDE.md §KHÔNG được làm)

- Don't write multi-paragraph docstrings or multi-line comment blocks — one short line max.
- Default to no comments. Add a comment only when the *why* is non-obvious (a hidden constraint, a subtle invariant, a workaround for a specific bug).
- Don't add error handling / fallbacks / validation for impossible scenarios. Trust framework + internal guarantees.
- Don't add features, refactor, or introduce abstractions beyond what the task requires.
- Don't keep half-finished implementations; finish or revert.
- Don't introduce backwards-compatibility shims when you can simply change the code.
- Don't disable an existing test to make a new one pass.

## Spec drift policy (CLAUDE.md §"Spec Update Rule")

Every feature commit ships with exactly one of these:

| Strategy | When | Action |
|---|---|---|
| (a) Spec update inline | Behavior change is final | Edit spec → commit `docs: update SPEC_X §Y` in the same PR |
| (b) BACKLOG BL-N entry | Need user review before locking | Append BL-N to `docs/spec/BACKLOG.md` |
| (c) `[no-spec-impact]` tag | Refactor / cleanup with no behavior change | Tag the commit message |

Run `bash tools/spec-audit/audit.sh` before commit; exit codes 0 (clean), 1 (warn), 2 (block). PRs must not introduce **new** broken refs.
