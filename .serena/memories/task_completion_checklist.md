# Task Completion Checklist

When you finish a task (a single commit ≤ 100 LOC), this is what must hold
before declaring it done. **Source of truth**: CLAUDE.md §"Quy trình test
bắt buộc" and §"Definition of Done".

## Three-tier test gate (NEVER skip a tier)

| Tier | When | Goal |
|---|---|---|
| **1 — Scope** | After each function/component edit | New code works correctly |
| **2 — Related** | After completing a screen / touching shared file | Adjacent modules don't break |
| **3 — Full regression** | **BEFORE every commit (mandatory)** | Nothing in the system regressed |

Tier-3 means running the full suite, not just the area you touched.
Commands & flow details: `docs/dev/testing.md`.

## Baselines (NEVER decrease)

- `apps/web/.test-baseline` — Vitest test count baseline
- `apps/api/.test-baseline` — JUnit test count baseline

If your change reduces the test count, you must add tests until it matches —
or document the deletion explicitly in `DECISIONS.md`.

## Definition of Done (CLAUDE.md)

1. **All Tier-3 tests green** (Vitest + Playwright + JUnit) — test count ≥ baseline.
2. **No TypeScript / Java compile errors**. No NEW `@SuppressWarnings`.
3. **Flyway migration runs clean on an empty DB** (verify locally with `docker compose down -v mysql; docker compose up -d mysql` then start BE).
4. **UI matches design tokens** (Stitch → pixel-perfect when applicable). All 3 page states handled (loading / error / success).
5. **Task file updated** in `docs/todo/active/<slug>.md`: change status box to `[x] DONE`. When **all** sub-tasks done → move the file to `docs/todo/archive/` and update the index in `TODO.md`.
6. **Spec strategy chosen** (one of a/b/c — see §"Spec Update Rule"):
   - (a) Update `docs/spec/SPEC_*.md` inline → commit `docs: update SPEC_X §Y`
   - (b) Append a new `BL-N` entry to `docs/spec/BACKLOG.md`
   - (c) Tag the commit `[no-spec-impact]`
7. **`bash tools/spec-audit/audit.sh`** introduces no new broken references (exit 0/1 acceptable; exit 2 blocks).
8. **i18n debt** not increased — run `npm run validate:i18n` if you touched FE strings. Current accepted-debt: 648 lines / 14 missing keys.
9. **Commit message** follows the convention (`feat`/`fix(BL-N)`/`docs`/`chore`/…).

## Commit etiquette (CLAUDE.md §Workflow)

- One task = one commit, ≤ 100 LOC. Don't bundle.
- Don't commit when tests fail.
- Don't skip Tier-3 even for "just a CSS line".
- Don't run `git commit --no-verify`. Fix the hook failure instead.
- Don't use `git commit --amend` after a hook failure — create a NEW commit
  (the failed commit didn't happen, so `--amend` rewrites the PREVIOUS commit).

## Tooling sanity before commit

```powershell
cd apps/web; npm run type-check; npm run lint:errors-only; npm run test
cd ../api;  ./mvnw test
bash tools/spec-audit/audit.sh
```

If you touched a "sensitive file" (see `codebase_structure.md` §Sensitive),
Tier-3 is mandatory **even for cosmetic edits**.

## When you find a regression mid-task

**Stop.** Don't continue the feature. Find the root cause, fix it,
re-run Tier-3 until everything is green, then resume.
