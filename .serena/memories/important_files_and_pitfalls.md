# Important Files & Pitfalls

Things you should know **before** touching this codebase. Some of these
have already burned us — they're not theoretical.

## 1. Production runs the `docker` Spring profile, not `prod`

[deploy/compose.prod.yml](deploy/compose.prod.yml) sets `SPRING_PROFILES_ACTIVE: docker`.
The standalone `application-prod.yml` is **not used** by deployment.

This means **any `@Profile("!prod")` guard is INEFFECTIVE in production**
because the active profile is `docker`, which doesn't match `!prod`'s negation
the way you'd expect (Spring evaluates `!prod` against the active profile
list; `docker` ≠ `prod`, so beans annotated `@Profile("!prod")` still load).

Affected (loaded on prod even though they look "test-only"):
- `TestDataSeeder` and all seeders (`UserSeeder`, `GroupSeeder`, `SessionSeeder`, …)
- `TestDataSeedController` — exposes `POST/DELETE /api/admin/seed/test-data`
- `AdminTestController` — explicitly `@Profile({"dev","staging","docker"})`

When you add anything you do NOT want on prod, gate it by env property
(e.g. `@ConditionalOnProperty(name="app.test-data.enabled", havingValue="true")`)
plus runtime URL check, **not** `@Profile("!prod")`.

## 2. `TestDataSeeder.clearAllData()` wipes real data on prod

`GroupSeeder.clear()`, `SessionSeeder.clear()`, etc. call
`repository.deleteAll()` with **no email/tag filter** — so calling
`DELETE /api/admin/seed/test-data` on prod deletes all real user groups
and sessions, not just seeded ones. Only `UserSeeder.clear()` filters
correctly (by `@biblequiz.test` / `@dev.local` suffix).

We hit this on 2026-05-13: FK constraint from `group_quiz_sets → church_groups`
saved us halfway through, but feedback/notifications/tournaments for real
users had already been deleted.

Don't call that endpoint on prod. Cleanup must be done via crafted SQL
filtered by user email or by deleting target child rows only — there's no
guard inside the seeder itself yet.

## 3. Deprecated `useWebSocket.ts`

`apps/web/src/hooks/useWebSocket.ts` is **deprecated**. Use `useStomp.ts`
(adds STOMP CONNECT header for JWT auth). Migration tracked as BL-15
in `docs/spec/BACKLOG.md`. If your task touches this file, migrate the
caller first (separate commit) — don't extend the deprecated hook.

## 4. MySQL on port **3307**, not 3306

`compose.yml` maps the container's 3306 → host's **3307** to avoid clashing
with a local MySQL install. Connection strings hard-coded around the repo
reflect this — copy from `application-dev.yml`, don't guess.

## 5. Vite shell vs Vite transform

`curl http://localhost:5173/` returns HTTP 200 with the static index.html
shell **even when the React modules fail to transform**. A real smoke test
must fetch a transformed module URL, e.g.
`curl http://localhost:5173/src/main.tsx` — successful transform returns
rewritten JS. We hit this on 2026-05-13 (missing `qrcode.react` install).

## 6. `docker` profile config gaps

`application-docker.yml` ≠ `application-prod.yml`. The docker profile has
extra Facebook OAuth registration, Redis session config, debug logging.
Be intentional about which keys live in which file. When you add a new
config key, put it in `application.yml` (default) with the `${ENV_VAR:default}`
pattern; override per profile only if it must differ.

## 7. Hardcoded test admin password (historical)

`UserSeeder.java` seeds `admin@biblequiz.test` / `mod@biblequiz.test` with
the literal password `Test@123456`. The local-login endpoint
(`POST /api/auth/login`, AuthController.java:232) accepts these. As of
2026-05-13 the prod DB has these users with `password_hash = NULL` (cleared
manually) so the credential no longer works, but **don't seed them on prod again**.

`APP_TEST_DATA_ENABLED=false` is the primary guard
(set in `deploy/compose.prod.yml`). `TestDataAutoSeeder` also refuses to
seed when `app.frontend-url` doesn't look like localhost (defense in depth).

## 8. JWT secret committed in `deploy/compose.prod.yml`

The prod JWT secret currently sits in git history. Anyone with repo access
can forge tokens. Rotate when convenient (re-issue all sessions, redeploy).
Tracked but not yet executed.

## 9. Files & flows that MUST trigger Tier-3 regression

Editing any of these = run Tier-3 immediately, even for a one-line tweak:

**FE:**
- `apps/web/src/store/authStore.ts`
- `apps/web/src/api/client.ts`
- `apps/web/src/layouts/AppLayout.tsx`
- `apps/web/src/contexts/RequireAuth*.tsx`
- `apps/web/src/styles/global.css`
- `apps/web/src/hooks/useStomp.ts`
- `apps/web/src/main.tsx`

**BE:**
- `SecurityConfig.java`
- `GlobalExceptionHandler.java`

## 10. Mobile-old-backup folder

`apps/mobile-old-backup-20260408/` is legacy. **Never edit it.** Active
mobile work lives in `apps/mobile/`. Already excluded in `.serena/project.yml`
`ignored_paths`.

## 11. Question seed JSON files

`apps/api/src/main/resources/seed/questions/*.json` — ~130 files (VI + EN).
These drive `QuestionSeeder` at boot. They're slow to load into Serena memory
and rarely need code-level analysis — already excluded in `ignored_paths`.

For seeding workflow (Gemini translation pipeline, JSON shape), see
`docs/dev/seeding.md`. New questions need `explanation` + `scriptureRef`
(BTTHĐ 2011 ideally; BTT 1926 acceptable with `// TODO BL-1` marker).

## 12. Spec-vs-code drift detection

`bash tools/spec-audit/audit.sh` — run before commit. Exit 0 = clean,
1 = warn, 2 = block. PRs must NOT introduce new broken spec references.
The audit is part of CLAUDE.md §"Spec Update Rule".

## 13. The "Think Before Code" gate

CLAUDE.md mandates a 5-step think-before-code flow before writing the
first line of code. Skipping it (e.g., reading a prompt and jumping
straight to implementation) is a hard rule violation. The 5 steps:

1. READ — TODO.md, prompt, Known Issues.
2. SURVEY — read the files you'll edit, grep patterns, read tests,
   check sensitive-file list, run E2E Test Gate (`docs/dev/testing.md`).
3. PLAN — split into < 100 LOC sub-tasks, write to TODO/active, decide
   test strategy.
4. VERIFY ASSUMPTIONS — API response shape (read Controller + DTO or
   test endpoint), state shape, existing helpers, codebase patterns.
5. CODE — only now.

Self-check every 30 min of coding; see `docs/dev/workflows.md`.
