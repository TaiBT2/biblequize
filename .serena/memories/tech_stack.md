# Tech Stack

## Backend — `apps/api/`
- **Java 17** + **Spring Boot 3.3.0** (Maven, wrapper `./mvnw`)
- **MySQL 8** (port 3307 locally to avoid host MySQL clash on 3306)
- **Redis 7-alpine** for Spring Session + caching
- **Flyway** for schema migrations (`apps/api/src/main/resources/db/migration/V{n}__*.sql`)
- **Spring Security** + **OAuth2 Client** (Google login on web)
- **JWT** (`io.jsonwebtoken:jjwt 0.11.5`) — `accessToken` (15 min) + refresh cookie (30 days)
- **Google API Client 2.7.0** — Google ID-Token verification for mobile auth
- **STOMP over WebSocket** — multiplayer rooms (`spring-boot-starter-websocket`)
- **MapStruct** — Entity ↔ DTO mapping. Manual mapping is forbidden.
- **AWS Bedrock SDK** (DeepSeek) — AI question generator (`biblequiz.ai.bedrock`)
- **Gemini API** (Google AI) — translation pipeline
- **JPA / Hibernate** with `ddl-auto: none` (Flyway-only schema control)
- **Testcontainers MySQL** for integration tests (H2 in-memory is **forbidden** for tests)
- **JUnit 5** test runner
- Logging: **SLF4J + Logback** via `@Slf4j` — never `System.out.println`
- `spring-boot-devtools` for hot-reload during dev

## Frontend — `apps/web/`
- **React 18** + **TypeScript 5.4** + **Vite 5.3**
- **React Router 6.23** — file path: `apps/web/src/pages/*.tsx`
- **TanStack Query 5.56** — all API calls. **Never** `useEffect + fetch`.
- **Zustand 4.5** — global state. Exception: tree-scoped `ErrorContext`.
- **Axios 1.7** — HTTP client (`apps/web/src/api/client.ts`)
- **STOMP.js 7 + sockjs-client** — multiplayer WebSocket (`hooks/useStomp.ts`)
- **react-i18next 17** + **i18next 26** + browser language detector — VN/EN i18n
- **Tailwind 3.4** + design tokens (`docs/dev/design-system.md`). **Never inline styles.**
- **happy-dom** + **jsdom** + **@testing-library/react** — Vitest 4.1 unit tests
- **Playwright** (via `scripts/e2e.mjs`) — E2E across local/dev/prod
- **react-helmet-async** — SEO meta tags
- **canvas-confetti** — celebration animations
- **qrcode.react** — group QR codes
- **sharp** — image processing in build pipeline
- Node engine required: `>=20` (warnings on 18 but builds work)

## Mobile — `apps/mobile/`
- **Capacitor**-based shell wrapping the web app
- Mobile-only auth flow via `apps/api/src/main/java/com/biblequiz/api/MobileAuthController.java` (`/api/auth/mobile/google`)

## Infra & Tooling
- **Docker Compose** (`compose.yml` local, `deploy/compose.prod.yml` prod)
- **Nginx** at edge in prod (`deploy/biblequiz.nginx.conf`)
- **GitHub Actions** (`.github/workflows/ci.yml`)
- Custom Docker images pushed to Docker Hub `taibt2docker/biblequiz-be:latest` / `biblequiz-fe:latest`
- Deploy target: `ubuntu@52.194.243.39:/opt/biblequiz`
- **GitLab MCP** + **Serena MCP** + **Figma MCP** + Google Workspace MCPs configured
