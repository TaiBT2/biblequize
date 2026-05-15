# Suggested Commands

System: **Windows 11 + PowerShell** (Bash also available via the Bash tool for POSIX scripts).
Use PowerShell syntax for native commands (`$env:VAR`, not `$VAR`; `$null`, not `/dev/null`).
Repo root: `f:/git/biblequize`.

## Bring up local stack

```powershell
# 1. Infra (MySQL on :3307, Redis on :6379)
docker compose up -d mysql redis

# 2. Wait for MySQL healthy (Bash)
until [ "$(docker inspect -f '{{.State.Health.Status}}' biblequiz-mysql)" = "healthy" ]; do sleep 3; done

# 3. Backend (Spring Boot, port 8080)
cd apps/api
./mvnw spring-boot:run         # dev profile (active by default), auto-seeds test data

# 4. Frontend (Vite dev server, port 5173)
cd apps/web
npm install                    # only if first time / lock file changed
npm run dev
```

Health checks:
- BE: `curl http://localhost:8080/health` → `{ database:UP, redis:UP, status:UP }`
- FE: `curl -o NUL -w "%{http_code}" http://localhost:5173/` → 200, **then load in browser** — HTTP 200 on `/` only proves the Vite shell; transform errors still return 200 with an error overlay JS-side. To smoke-test a real module: `curl http://localhost:5173/src/main.tsx`.

## Backend (Maven wrapper)

```powershell
cd apps/api
./mvnw -q -DskipTests compile          # quick compile check
./mvnw test                            # full test suite (Testcontainers, slow)
./mvnw -Dtest=ClassName test           # single test class
./mvnw spring-boot:run                 # run with default `dev` profile
$env:SPRING_PROFILES_ACTIVE='docker'; ./mvnw spring-boot:run    # run as docker profile
./mvnw clean package -DskipTests       # build JAR
```

Build Docker image (uses `apps/api/Dockerfile`):
```powershell
docker build -t taibt2docker/biblequiz-be:latest -f apps/api/Dockerfile apps/api/
```

## Frontend (npm scripts)

```powershell
cd apps/web
npm run dev                  # vite dev server (port 5173)
npm run build                # production build (default mode)
npm run build:dev            # build with development env
npm run preview              # serve production build on :4173
npm run type-check           # tsc --noEmit
npm run lint                 # eslint (--max-warnings=9999)
npm run lint:errors-only     # only errors (gating signal)
npm run test                 # vitest run (unit tests)
npm run test:coverage        # with coverage report
npm run test:e2e             # playwright against local stack
npm run test:e2e:dev         # playwright against dev env
npm run test:e2e:prod        # smoke tests against prod
npm run test:e2e:headed      # run with browser visible
npm run validate:i18n        # hardcoded-string scanner
```

Build Docker image (uses `infra/docker/web.Dockerfile` from repo root):
```powershell
docker build -t taibt2docker/biblequiz-fe:latest -f infra/docker/web.Dockerfile .
```

## Database

```powershell
# MySQL CLI (inside container)
docker exec -it biblequiz-mysql mysql -uroot -ppass biblequiz

# Inspect Flyway state
docker exec biblequiz-mysql mysql -uroot -ppass biblequiz -e "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 10"

# Wipe & rerun (DESTRUCTIVE — only locally)
docker compose down -v mysql; docker compose up -d mysql
```

## Spec audit

```powershell
bash tools/spec-audit/audit.sh     # exit 0 clean / 1 warn / 2 block — runs before commits
```

## Production (`ubuntu@52.194.243.39:/opt/biblequiz`)

```powershell
# Tail BE logs on prod
ssh ubuntu@52.194.243.39 "docker logs -f --tail 200 biblequiz-api"

# Inspect prod env (read-only)
ssh ubuntu@52.194.243.39 "docker inspect biblequiz-api --format '{{range .Config.Env}}{{println .}}{{end}}'"

# Container status
ssh ubuntu@52.194.243.39 "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Full deploy flow lives in `.claude/commands/deploy.md` — uses docker build → push → ssh → compose pull/up.
```

## Git (Windows PowerShell)

```powershell
git status
git diff
git log --oneline -10
git checkout -b feat/<slug>
# NEVER use `git rebase -i` (interactive editor — blocked in this harness)
# NEVER skip hooks (--no-verify)
```

Slugs ascii-folded from Vietnamese (`docs/todo/active/<YYYY-MM-DD-slug>.md`).

## Common Windows-equivalents

| POSIX | PowerShell |
|---|---|
| `cat file` | `Get-Content file` / `cat` alias |
| `head -n 20` | `Get-Content file -TotalCount 20` |
| `tail -f` | `Get-Content -Wait file` |
| `grep 'x' file` | `Select-String 'x' file` — **prefer the Grep tool** in this harness |
| `find . -name X` | `Get-ChildItem -Recurse -Filter X` — **prefer the Glob tool** |
| `rm -rf dir` | `Remove-Item -Recurse -Force dir` |
| `which cmd` | `(Get-Command cmd).Source` |
| `export X=y` | `$env:X = 'y'` |

When the Bash tool is invoked (POSIX sub-shell), normal POSIX commands work — pick whichever is clearer.
