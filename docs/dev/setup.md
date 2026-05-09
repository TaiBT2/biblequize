# Local Setup & Stack

> Extracted from CLAUDE.md on 2026-05-09. Referenced from CLAUDE.md §References.
> Updates: thay đổi → update file này, KHÔNG add lại vào CLAUDE.md.

## Stack
- Backend: Spring Boot 3.3.0 (Java 17), port 8080
- Frontend: Vite 5 + React 18 + TypeScript 5.4, port 5173
- Mobile: Expo 54 + React Native 0.81.5
- DB: MySQL 8.0 (Docker, port 3307)
- Cache: Redis 7 (Docker, port 6379)
- Unit Test: Vitest 4.1 (happy-dom) + @testing-library/react
- E2E Test: Playwright (`apps/web/playwright.config.ts` + `tests/e2e/{smoke,happy-path,fixtures,helpers,pages}` + npm scripts `test:e2e`)
- Design: Stitch MCP (project ID `5341030797678838526`)

## Local Dev Start — 3 modes

### Mode 1 — Everything native (fastest BE iteration, hot-reload both sides)
```bash
docker compose up -d mysql redis          # 1. Infra only
cd apps/api && ./mvnw spring-boot:run     # 2. Backend native (terminal 1)
cd apps/web && npm run dev                # 3. Frontend native (terminal 2)
```

### Mode 2 — Full Docker stack (production-like, no hot-reload)
```bash
docker compose up -d                      # api + web + mysql + redis
# FE on http://localhost:3000 (nginx, built SPA), API on :8080
```
Rebuild after code changes: `docker compose up -d --build api web`.

### Mode 3 — Hybrid: BE in Docker, FE native (most common dev flow)
```bash
docker compose -f compose.yml -f compose.local-fe.yml up -d api mysql redis
cd apps/web && npm run dev
# Open http://localhost:5173 — OAuth redirects here after login.
```
Override file (`compose.local-fe.yml`) flips `APP_FRONTEND_URL` to `http://localhost:5173` so Google OAuth lands on Vite, not dockerised nginx. CORS đã include 5173 trong base `compose.yml`.

## Ports & URLs

| Service | Native | Docker |
|---------|--------|--------|
| Backend API | 8080 | 8080 |
| Web (Vite dev) | 5173 | — |
| Web (nginx prod) | — | 3000 |
| MySQL | 3307 | 3307 |
| Redis | 6379 | 6379 |

## Env vars cần thiết

- `VITE_API_URL` (web dev, optional — default same-origin)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (BE OAuth)
- `JWT_SECRET` (BE)
- `GEMINI_API_KEY` (chỉ cần khi chạy `scripts/translate_to_en.py`)

## Quick troubleshooting

- OAuth redirect về sai port → check `APP_FRONTEND_URL` trong env
- CORS error → verify port FE trong `SecurityConfig` CORS allowlist
- WebSocket connect fail → check `VITE_WS_URL` + `?token=` query param trong `useWebSocket`/`useStomp`
