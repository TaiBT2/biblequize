# BibleQuiz — Codebase Overview
> Last updated: 2026-04-02

## 1. Cấu trúc thư mục (Tree)

```
biblequize/
├── apps/
│   ├── api/                            # Spring Boot 3.3 Backend
│   │   ├── src/main/java/com/biblequiz/
│   │   │   ├── api/                    # 19 REST Controllers + DTOs + WebSocket
│   │   │   ├── infrastructure/         # Security, exception, audit, config
│   │   │   ├── modules/               # Domain logic (12 modules)
│   │   │   │   ├── achievement/        # Badge & achievement system
│   │   │   │   ├── auth/              # JWT, OAuth2, token management
│   │   │   │   ├── daily/             # Daily challenge service
│   │   │   │   ├── feedback/          # User feedback
│   │   │   │   ├── group/             # Church groups (CRUD, analytics)
│   │   │   │   ├── notification/      # Push & in-app notifications
│   │   │   │   ├── quiz/              # Core quiz engine (Question, Session, Book)
│   │   │   │   ├── ranked/            # Ranked mode (Scoring, RankTier)
│   │   │   │   ├── room/             # Multiplayer (4 game mode engines)
│   │   │   │   ├── season/            # Season rankings
│   │   │   │   ├── share/             # Share card generation
│   │   │   │   ├── tournament/        # Tournament brackets
│   │   │   │   └── user/              # User profile, streak
│   │   │   └── shared/                # Converters, AOP aspects
│   │   └── src/main/resources/
│   │       ├── db/migration/           # 40 Flyway scripts (V1-V15 + 24 R__*)
│   │       └── application*.yml        # Config profiles (dev/docker/prod)
│   │
│   └── web/                            # Vite 5 + React 18 + TypeScript
│       └── src/
│           ├── api/                    # Axios client, token store
│           ├── components/             # 10 reusable components + tests
│           ├── contexts/               # ErrorContext, RequireAuth, RequireAdmin
│           ├── hooks/                  # useWebSocket, useStomp, useRankedDataSync
│           ├── layouts/                # AppLayout, AdminLayout
│           ├── pages/                  # 26 page components
│           │   └── admin/              # 7 admin sub-pages
│           ├── store/                  # Zustand (authStore)
│           └── styles/                 # global.css (Tailwind + Stitch tokens)
│
├── infra/docker/                       # Dockerfiles + nginx.conf
├── docs/designs/                       # Stitch HTML + screenshots + tokens
├── compose.yml                         # MySQL + Redis + API + Web
├── CLAUDE.md                           # Dev rules
├── SPEC-v2.md                          # Feature spec
├── DECISIONS.md                        # Technical decisions log
├── TODO.md                             # Task tracking
├── DESIGN_STATUS.md                    # Stitch screen mapping
└── DESIGN_AUDIT.md                     # Design cross-check
```

## 2. Tech Stack & Dependencies

### Backend
| Tech | Version | Usage |
|------|---------|-------|
| Java | 17 | Language |
| Spring Boot | 3.3.0 | Framework |
| MySQL | 8.0 | Database (Docker, port 3307) |
| Redis | 7 | Cache + session (Docker, port 6379) |
| Flyway | Latest | DB migrations |
| JJWT | 0.11.5 | JWT auth |
| spring-dotenv | 4.0.0 | .env loading |
| springdoc-openapi | 2.2.0 | Swagger UI |

### Frontend
| Tech | Version | Usage |
|------|---------|-------|
| React | 18.2 | UI framework |
| TypeScript | 5.4 | Type safety |
| Vite | 5.3 | Build tool |
| Tailwind CSS | 3.4 | Styling |
| Zustand | 4.5 | State management |
| TanStack Query | 5.56 | Server state |
| Axios | 1.7 | HTTP client |
| @stomp/stompjs | 7.0 | WebSocket |
| React Router | 6.23 | Routing |
| Vitest | 4.1 | Testing |

## 3. Danh sách Screens

### User-facing Pages (26)
| # | Screen | File | Route | Stitch Design |
|---|--------|------|-------|---------------|
| 1 | Landing Page (guest) | `pages/LandingPage.tsx` | `/landing` | ✅ |
| 2 | Home Dashboard | `pages/Home.tsx` | `/` | ✅ |
| 3 | Login | `pages/Login.tsx` | `/login` | ✅ |
| 4 | Auth Callback | `pages/AuthCallback.tsx` | `/auth/callback` | N/A (redirect) |
| 5 | Profile | `pages/Profile.tsx` | `/profile` | ✅ |
| 6 | Leaderboard | `pages/Leaderboard.tsx` | `/leaderboard` | ✅ |
| 7 | Achievements | `pages/Achievements.tsx` | `/achievements` | ✅ |
| 8 | Practice | `pages/Practice.tsx` | `/practice` | Custom |
| 9 | Quiz | `pages/Quiz.tsx` | `/quiz` | ✅ |
| 10 | Quiz Results | `pages/QuizResults.tsx` | (sub-component) | Custom |
| 11 | Ranked | `pages/Ranked.tsx` | `/ranked` | Custom |
| 12 | Daily Challenge | `pages/DailyChallenge.tsx` | `/daily` | ✅ |
| 13 | Review | `pages/Review.tsx` | `/review` | Custom (old) |
| 14 | Groups | `pages/Groups.tsx` | `/groups` | ✅ |
| 15 | Group Detail | `pages/GroupDetail.tsx` | `/groups/:id` | ✅ |
| 16 | Group Analytics | `pages/GroupAnalytics.tsx` | `/groups/:id/analytics` | Custom |
| 17 | Tournaments | `pages/Tournaments.tsx` | `/tournaments` | ✅ |
| 18 | Tournament Detail | `pages/TournamentDetail.tsx` | `/tournaments/:id` | Custom |
| 19 | Tournament Match | `pages/TournamentMatch.tsx` | `/tournaments/:id/match/:matchId` | Custom |
| 20 | Multiplayer | `pages/Multiplayer.tsx` | `/multiplayer` | ✅ |
| 21 | Rooms | `pages/Rooms.tsx` | `/rooms` | Custom (old) |
| 22 | Create Room | `pages/CreateRoom.tsx` | `/room/create` | Custom |
| 23 | Join Room | `pages/JoinRoom.tsx` | `/room/join` | Custom |
| 24 | Room Lobby | `pages/RoomLobby.tsx` | `/room/:roomId/lobby` | ✅ |
| 25 | Room Quiz | `pages/RoomQuiz.tsx` | `/room/:roomId/quiz` | ✅ |
| 26 | 404 Not Found | `pages/NotFound.tsx` | `*` | Custom |

### Admin Pages (7)
| # | Screen | File | Route |
|---|--------|------|-------|
| 1 | Users | `pages/admin/Users.tsx` | `/admin/users` |
| 2 | Questions | `pages/admin/Questions.tsx` | `/admin/questions` |
| 3 | AI Generator | `pages/admin/AIQuestionGenerator.tsx` | `/admin/ai-generator` |
| 4 | Review Queue | `pages/admin/ReviewQueue.tsx` | `/admin/review-queue` |
| 5 | Feedback | `pages/admin/Feedback.tsx` | `/admin/feedback` |
| 6 | Rankings | `pages/admin/Rankings.tsx` | `/admin/rankings` |
| 7 | Events | `pages/admin/Events.tsx` | `/admin/events` |

## 4. Navigation / Routing Structure

```
/                        → HomeOrLanding (guest=LandingPage, auth=Home+AppLayout)
├── /landing             → LandingPage (full-screen, no layout)
├── /login               → Login (full-screen)
├── /auth/callback       → AuthCallback (redirect)
│
├── [AppLayout wrapper — sidebar + top nav + bottom mobile nav]
│   ├── /                → Home (dashboard + GameModeGrid)
│   ├── /leaderboard     → Leaderboard
│   ├── /profile         → Profile (RequireAuth)
│   ├── /achievements    → Achievements
│   ├── /ranked          → Ranked
│   ├── /daily           → DailyChallenge
│   ├── /groups          → Groups (RequireAuth)
│   ├── /groups/:id      → GroupDetail (RequireAuth)
│   ├── /groups/:id/analytics → GroupAnalytics (RequireAuth)
│   ├── /tournaments     → Tournaments (RequireAuth)
│   ├── /tournaments/:id → TournamentDetail (RequireAuth)
│   └── /tournaments/:id/match/:matchId → TournamentMatch (RequireAuth)
│
├── [Full-screen pages — no AppLayout]
│   ├── /quiz            → Quiz
│   ├── /practice        → Practice
│   ├── /review          → Review
│   ├── /multiplayer     → Multiplayer (RequireAuth)
│   ├── /rooms           → Rooms (RequireAuth)
│   ├── /room/create     → CreateRoom (RequireAuth)
│   ├── /room/join       → JoinRoom (RequireAuth)
│   ├── /room/:id/lobby  → RoomLobby (RequireAuth)
│   └── /room/:id/quiz   → RoomQuiz (RequireAuth)
│
├── [Admin — AdminLayout wrapper]
│   └── /admin/*         → RequireAdmin guard
│       ├── /users
│       ├── /questions
│       ├── /feedback
│       ├── /rankings
│       ├── /events
│       ├── /ai-generator
│       └── /review-queue
│
└── /*                   → NotFound (404)
```

## 5. State Management

| Layer | Tech | Scope | File |
|-------|------|-------|------|
| **Auth state** | Zustand | Global | `store/authStore.ts` |
| **Server state** | TanStack Query | Per-component | via `@tanstack/react-query` |
| **Error UI** | React Context | Tree-scoped | `contexts/ErrorContext.tsx` |
| **Auth guards** | React Context | Route-scoped | `contexts/RequireAuth.tsx`, `RequireAdmin.tsx` |
| **Local component** | useState/useEffect | Component | Inline |
| **WebSocket** | Custom hooks | Component | `hooks/useStomp.ts`, `hooks/useWebSocket.ts` |
| **Ranked sync** | Custom hook | Component | `hooks/useRankedDataSync.ts` |
| **Token** | In-memory | Global | `api/tokenStore.ts` (NOT localStorage) |

## 6. API / Services Layer

### Frontend API Client (`api/client.ts`)
```
api          → Axios instance, baseURL from env, 10s timeout
aiApi        → Axios instance, 90s timeout (for Gemini AI)
interceptor  → Adds Bearer token from tokenStore to all requests
```

### Backend REST API (19 controllers)
| Endpoint | Controller | Auth |
|----------|-----------|------|
| `POST /api/auth/login` | AuthController | Public |
| `POST /api/auth/refresh` | AuthController | Public |
| `POST /api/auth/logout` | AuthController | Auth |
| `GET /api/me` | UserController | Auth |
| `GET /api/books` | BookController | Public |
| `GET /api/questions` | QuestionController | Public |
| `POST /api/sessions` | SessionController | Auth |
| `GET /api/daily-challenge` | DailyChallengeController | Public |
| `POST /api/daily-challenge/start` | DailyChallengeController | Auth |
| `GET /api/leaderboard` | LeaderboardController | Public |
| `GET /api/me/ranked-status` | RankedController | Auth |
| `POST /api/ranked/start` | RankedController | Auth |
| `GET /api/rooms` | RoomController | Auth |
| `POST /api/rooms` | RoomController | Auth |
| `GET /api/groups` | ChurchGroupController | Auth |
| `GET /api/tournaments` | TournamentController | Auth |
| `GET /api/achievements` | AchievementController | Auth |
| `GET /api/notifications` | NotificationController | Auth |
| `GET /api/share/:token` | ShareCardController | Public |
| `GET /api/seasons/current` | SeasonController | Public |
| `POST /api/admin/questions` | AdminQuestionController | Admin |
| `GET /api/admin/review` | QuestionReviewController | Admin |
| `GET /api/admin/audit` | AdminAuditController | Admin |

### WebSocket (STOMP)
```
/ws                              → WebSocket endpoint
/app/room/{roomId}/answer        → Submit answer
/app/room/{roomId}/chat          → Send chat message
/topic/room/{roomId}/question    → Receive new question
/topic/room/{roomId}/scores      → Receive score updates
/topic/room/{roomId}/result      → Receive round result
```

## 7. Design System / Shared Components

### Design Theme: "The Sacred Modernist"
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#11131e` | Page background |
| Surface Container | `#1d1f2a` | Cards |
| Secondary (Gold) | `#e8a832` | CTA, highlights |
| Tertiary | `#e7c268` | Gold gradient end |
| On-Surface | `#e1e1f1` | Primary text |
| Font | Be Vietnam Pro | All text |

### Global CSS Utilities (`styles/global.css`)
```css
.glass-card     → rgba(50,52,64,0.6) + backdrop-blur(12px)
.glass-panel    → rgba(50,52,64,0.6) + backdrop-blur(20px)
.gold-gradient  → linear-gradient(135deg, #e8a832, #e7c268)
.gold-glow      → box-shadow: 0 0 20px rgba(232,168,50,0.2)
.streak-grid    → grid 20 columns for heatmap
.timer-svg      → rotate(-90deg) for circular timer
```

### Shared Components
| Component | File | Usage |
|-----------|------|-------|
| Button | `components/ui/Button.tsx` | Styled button (primary/secondary/ghost) |
| Card | `components/ui/Card.tsx` | Card container |
| Input | `components/ui/Input.tsx` | Form input |
| SearchableSelect | `components/ui/SearchableSelect.tsx` | Dropdown with search |
| GameModeGrid | `components/GameModeGrid.tsx` | 4 game mode cards (Home page) |
| BookProgress | `components/BookProgress.tsx` | Bible book progress tracker |
| ShareCard | `components/ShareCard.tsx` | Social sharing card |
| ErrorToast | `components/ErrorToast.tsx` | Error notification toast |
| ErrorBoundary | `components/ErrorBoundary.tsx` | React error boundary |
| Header | `components/Header.tsx` | Navigation header (legacy) |

### Layouts
| Layout | File | Usage |
|--------|------|-------|
| AppLayout | `layouts/AppLayout.tsx` | Sidebar + top nav + bottom nav + logout dropdown |
| AdminLayout | `layouts/AdminLayout.tsx` | Admin panel layout |

## 8. Stitch Integration Status

### Connection
- **MCP Server**: `https://stitch.googleapis.com/mcp` (HTTP transport)
- **Auth**: Google OAuth2 Bearer token (expires ~1hr, refresh via `gcloud auth print-access-token`)
- **Config**: `.mcp.json` at project root
- **Quota Project**: `devops-469902`

### Screen Coverage
| Metric | Count |
|--------|-------|
| Stitch Active Screens | 15 |
| Screens synced to code | **15/15 (100%)** |
| Code screens with Stitch design | 15/33 (45%) |
| Code screens with custom design | 12 |
| Code screens (admin, no design) | 8 |
| Missing from code | 0 |

### Stitch Screens (Active → Code mapping)
| Stitch Screen | Code File | Version |
|---------------|-----------|---------|
| BibleQuiz Dashboard - Final Redesign | `Home.tsx` | v5 |
| Guest Landing Page (Desktop) | `LandingPage.tsx` | NEW |
| Leaderboard v2 | `Leaderboard.tsx` | v2 |
| User Profile v2 | `Profile.tsx` | v2 |
| Quiz Gameplay - Timer Added | `Quiz.tsx` | v3 |
| Tournament Bracket - Enhanced UX | `Tournaments.tsx` | v3 |
| Church Group - Data Viz Update | `Groups.tsx` | v3 |
| Login Page | `Login.tsx` | NEW |
| Daily Challenge | `DailyChallenge.tsx` | NEW |
| Multiplayer Lobby | `RoomLobby.tsx` | NEW |
| Room Quiz Gameplay | `RoomQuiz.tsx` | NEW |
| Achievements | `Achievements.tsx` | NEW |
| Multiplayer Lobby List | `Multiplayer.tsx` | NEW |
| Group Detail | `GroupDetail.tsx` | NEW |
| Guest Landing Page (Mobile) | `LandingPage.tsx` | Reference |

## 9. Test Coverage

| Suite | Files | Tests | Status |
|-------|-------|-------|--------|
| Frontend (Vitest) | 13 | 113 | Pass |
| Backend API (JUnit) | 21 | 191 | Pass |
| Backend Service (JUnit) | 18 | 214 | Pass |
| **Total** | **52** | **518** | **All green** |

## 10. Số liệu codebase

| Metric | Count |
|--------|-------|
| Frontend TypeScript LOC | ~13,400 |
| Backend Java LOC | ~4,400 |
| Total LOC | ~17,800 |
| Frontend pages | 26 + 7 admin |
| Backend controllers | 19 REST + 1 WebSocket |
| Backend entities | 31 |
| Backend services | 27 |
| Flyway migrations | 40 (16 versioned + 24 repeatable) |
| Docker services | 4 (MySQL, Redis, API, Web) |
| Documentation files | 15+ |
