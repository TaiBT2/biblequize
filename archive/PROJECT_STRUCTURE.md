# BibleQuiz — Project Structure

```
biblequize/
├── apps/
│   ├── api/                                    # Spring Boot Backend (port 8080)
│   │   ├── src/main/java/com/biblequiz/
│   │   │   ├── api/                            # REST Controllers
│   │   │   │   ├── dto/                        # Request/Response DTOs
│   │   │   │   ├── websocket/                  # WebSocket controllers
│   │   │   │   ├── AchievementController.java
│   │   │   │   ├── AdminQuestionController.java
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── BookController.java
│   │   │   │   ├── ChurchGroupController.java
│   │   │   │   ├── DailyChallengeController.java
│   │   │   │   ├── LeaderboardController.java
│   │   │   │   ├── RankedController.java
│   │   │   │   ├── RoomController.java
│   │   │   │   ├── SessionController.java
│   │   │   │   ├── ShareCardController.java
│   │   │   │   ├── TournamentController.java
│   │   │   │   └── UserController.java
│   │   │   │
│   │   │   ├── infrastructure/                 # Cross-cutting concerns
│   │   │   │   ├── audit/                      # Audit logging
│   │   │   │   ├── exception/                  # Global error handling
│   │   │   │   ├── security/                   # JWT, OAuth2, Rate limiting
│   │   │   │   ├── service/                    # Cache, monitoring
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── RedisConfig.java
│   │   │   │   └── WebSocketConfig.java
│   │   │   │
│   │   │   ├── modules/                        # Business modules
│   │   │   │   ├── achievement/                # Badges & achievements
│   │   │   │   │   ├── entity/
│   │   │   │   │   ├── repository/
│   │   │   │   │   └── service/
│   │   │   │   ├── auth/                       # Authentication (JWT, OAuth2)
│   │   │   │   │   ├── entity/
│   │   │   │   │   ├── repository/
│   │   │   │   │   └── service/
│   │   │   │   ├── daily/                      # Daily Challenge
│   │   │   │   │   └── service/
│   │   │   │   ├── group/                      # Church Group
│   │   │   │   │   ├── entity/                 # ChurchGroup, GroupMember, GroupAnnouncement, GroupQuizSet
│   │   │   │   │   ├── repository/
│   │   │   │   │   └── service/
│   │   │   │   ├── quiz/                       # Core quiz logic
│   │   │   │   │   ├── entity/                 # Question, QuizSession, Answer, UserDailyProgress
│   │   │   │   │   ├── repository/
│   │   │   │   │   └── service/                # SessionService, QuestionService, BookProgressionService
│   │   │   │   ├── ranked/                     # Ranked mode & scoring
│   │   │   │   │   ├── model/                  # RankTier enum
│   │   │   │   │   └── service/                # ScoringService, RankedSessionService
│   │   │   │   ├── room/                       # Multiplayer rooms
│   │   │   │   │   ├── entity/                 # Room, RoomPlayer, RoomRound, RoomAnswer
│   │   │   │   │   ├── repository/
│   │   │   │   │   └── service/                # RoomService, SpeedRace, BattleRoyale, etc.
│   │   │   │   ├── season/                     # Season rankings
│   │   │   │   │   ├── entity/
│   │   │   │   │   ├── repository/
│   │   │   │   │   └── service/
│   │   │   │   ├── share/                      # Share cards
│   │   │   │   │   ├── entity/
│   │   │   │   │   ├── repository/
│   │   │   │   │   └── service/
│   │   │   │   ├── tournament/                 # Tournament bracket system
│   │   │   │   │   ├── entity/                 # Tournament, TournamentMatch, TournamentParticipant
│   │   │   │   │   ├── repository/
│   │   │   │   │   └── service/                # TournamentService, TournamentMatchService
│   │   │   │   └── user/                       # User management
│   │   │   │       ├── entity/
│   │   │   │       ├── repository/
│   │   │   │       └── service/                # UserService, StreakService
│   │   │   │
│   │   │   └── shared/                         # Shared utilities
│   │   │       ├── aspect/
│   │   │       └── converter/
│   │   │
│   │   ├── src/main/resources/
│   │   │   ├── db/migration/                   # Flyway migrations (V1-V12)
│   │   │   ├── application.yml                 # Main config
│   │   │   ├── application-dev.yml             # Dev profile
│   │   │   └── application-docker.yml          # Docker profile
│   │   │
│   │   ├── src/test/java/com/biblequiz/
│   │   │   ├── api/                            # Controller tests (22 files)
│   │   │   ├── load/                           # Performance tests
│   │   │   └── service/                        # Service/unit tests (18 files)
│   │   │
│   │   ├── .env                                # Local secrets (gitignored)
│   │   └── pom.xml
│   │
│   └── web/                                    # React Frontend (port 5173)
│       ├── src/
│       │   ├── api/                            # API client & token management
│       │   ├── components/                     # Reusable UI components
│       │   │   └── ui/                         # Button, Card, Input, etc.
│       │   ├── contexts/                       # Auth, Error contexts
│       │   ├── hooks/                          # Custom hooks (WebSocket, STOMP)
│       │   ├── pages/                          # Route pages
│       │   │   └── admin/                      # Admin panel pages
│       │   └── test/                           # Test setup & utilities
│       ├── vitest.config.ts
│       └── package.json
│
├── tests/                                      # E2E Playwright tests (12 files)
│   ├── auth.spec.ts
│   ├── daily-challenge.spec.ts
│   ├── security.spec.ts
│   ├── ranked-mode.spec.ts
│   ├── church-group.spec.ts
│   └── ...
│
├── infra/k6/                                   # Performance test scripts
│   ├── perf-api-read.js                        # TC-PERF-001
│   ├── perf-websocket.js                       # TC-PERF-002
│   ├── perf-leaderboard.js                     # TC-PERF-003
│   ├── perf-share-card.js                      # TC-PERF-004
│   └── perf-answer-submit.js                   # TC-PERF-005
│
├── scripts/                                    # SQL seed scripts
├── compose.yml                                 # Docker Compose (MySQL, Redis)
├── playwright.config.ts                        # E2E test config
├── CLAUDE.md                                   # AI assistant rules
├── SPEC-v2.md                                  # Feature specification
├── BIBLEQUIZ_TEST_CASES.md                     # 100 test cases
└── LOCAL_DEV.md                                # Local development guide
```

## Module Count
- **Backend**: 12 modules, 19 controllers, 30 JPA repositories
- **DB Migrations**: V1 — V12 (Flyway)
- **Tests**: 363 JUnit + 45 E2E Playwright + 5 k6 scripts
- **Frontend**: 17 pages, 7 UI components
