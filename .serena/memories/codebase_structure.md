# Codebase Structure

```
biblequize/
├── CLAUDE.md                       ← canonical project rules; READ FIRST
├── TODO.md                         ← task index (rows) — DO NOT inline tasks
├── DECISIONS.md                    ← locked product decisions (history)
├── README.md / SETUP.md            ← setup pointers
├── compose.yml                     ← local Docker (mysql + redis + api + web)
├── compose.local-fe.yml            ← local FE only (BE remote)
│
├── apps/
│   ├── api/                        ← Spring Boot 3.3 backend
│   │   ├── pom.xml
│   │   ├── mvnw / mvnw.cmd         ← Maven wrapper (use ./mvnw, never global mvn)
│   │   ├── Dockerfile
│   │   ├── .test-baseline          ← test count baseline (regression guard)
│   │   └── src/main/
│   │       ├── java/com/biblequiz/
│   │       │   ├── api/            ← REST controllers (@RestController)
│   │       │   ├── modules/        ← domain modules: user, room, group, tournament, question, …
│   │       │   │   └── <module>/{entity,repository,service,dto,mapper}
│   │       │   └── infrastructure/
│   │       │       ├── security/   ← JWT filter, OAuth2 handlers, SecurityConfig
│   │       │       ├── seed/       ← TestData/User/Group/SessionSeeder + QuestionSeeder
│   │       │       ├── error/      ← GlobalExceptionHandler
│   │       │       ├── config/     ← Spring config beans
│   │       │       └── ws/         ← STOMP / WebSocket config
│   │       └── resources/
│   │           ├── application.yml             ← default (profile-agnostic) config
│   │           ├── application-dev.yml         ← `dev` profile (local default)
│   │           ├── application-docker.yml      ← `docker` profile (used in prod!)
│   │           ├── application-prod.yml        ← present but NOT used by deployment
│   │           ├── application-local.yml       ← variant
│   │           ├── .env                        ← local-only secrets (gitignored? check)
│   │           ├── db/migration/V{n}__*.sql    ← Flyway scripts
│   │           └── seed/questions/*.json       ← question seed data (~130 files VI+EN)
│   │
│   ├── web/                        ← React 18 + Vite 5 + TS 5.4 + Tailwind 3.4
│   │   ├── package.json
│   │   ├── .env / .env.production / .env.e2e.example
│   │   ├── playwright.config.ts
│   │   ├── .test-baseline          ← FE test count baseline
│   │   ├── scripts/                ← e2e.mjs, validate-i18n.mjs
│   │   ├── src/
│   │   │   ├── pages/              ← route-level components (max 300 LOC)
│   │   │   ├── components/         ← reusable + feature-folder UI
│   │   │   ├── hooks/              ← business-logic + STOMP (`useStomp.ts`)
│   │   │   ├── store/              ← Zustand stores (`authStore`, etc.)
│   │   │   ├── api/                ← axios `client.ts` + per-resource modules
│   │   │   ├── contexts/           ← React Context (auth gate, errors)
│   │   │   ├── layouts/            ← `AppLayout`, `AdminLayout`
│   │   │   ├── styles/             ← `global.css` + tailwind config
│   │   │   ├── i18n/               ← `vi`, `en` resource bundles
│   │   │   └── data/               ← static tier table, verses (accepted i18n debt)
│   │   └── tests/                  ← Vitest + Playwright (under tests/e2e/playwright)
│   │
│   ├── mobile/                     ← Capacitor wrapper (active)
│   └── mobile-old-backup-20260408/ ← IGNORE (legacy)
│
├── deploy/
│   ├── compose.prod.yml            ← prod docker-compose (SPRING_PROFILES_ACTIVE=docker)
│   └── biblequiz.nginx.conf        ← nginx config on prod host
│
├── infra/
│   └── docker/web.Dockerfile       ← FE image build
│
├── docs/
│   ├── spec/                       ← canonical specs (SPEC_USER, SPEC_MULTIPLAYER, …, BACKLOG)
│   ├── dev/                        ← architecture, design-system, testing, dependencies, workflows, conventions, seeding, setup
│   ├── todo/
│   │   ├── active/<YYYY-MM-DD-slug>.md   ← one file per task (detail)
│   │   └── archive/                ← DONE tasks
│   ├── designs/                    ← Stitch mockups + audit notes
│   ├── prompts/                    ← PROMPT_*.md long-running prompts
│   └── plans/                      ← architectural plans
│
├── tests/e2e/
│   ├── playwright/specs/{smoke,happy-path,...}
│   └── maestro/specs/              ← mobile E2E (Maestro)
│
├── tools/
│   └── spec-audit/audit.sh         ← spec ↔ code drift checker
│
├── archive/                        ← IGNORE (historical specs / prompts)
├── .github/workflows/ci.yml
├── .claude/                        ← Claude Code custom config (commands, settings)
└── .serena/                        ← Serena project config + memories (this folder)
```

## Sensitive / hot-touch files (CLAUDE.md §Known Issues)

Editing any of these requires Tầng 3 full regression immediately:

**FE:**
- `apps/web/src/store/authStore.ts`
- `apps/web/src/api/client.ts`
- `apps/web/src/layouts/AppLayout.tsx`
- `apps/web/src/contexts/RequireAuth*.tsx`
- `apps/web/src/styles/global.css`
- `apps/web/src/hooks/useStomp.ts`
- `apps/web/src/main.tsx`
- `apps/web/src/hooks/useWebSocket.ts` — **DEPRECATED**, migrate callers to `useStomp.ts` (BL-15)

**BE:**
- `SecurityConfig.java`
- `GlobalExceptionHandler.java`
