# Architecture

> Extracted from CLAUDE.md on 2026-05-09. Referenced from CLAUDE.md §References.
> Updates: thay đổi → update file này, KHÔNG add lại vào CLAUDE.md.

## Backend package structure

```
com.biblequiz/
├── api/                    # REST Controllers + DTOs + WebSocket controllers
│   ├── dto/                # Request/Response DTOs
│   └── websocket/          # STOMP WebSocket controllers
├── infrastructure/         # Cross-cutting concerns (không chứa business logic)
│   ├── audit/              # Audit logging
│   ├── exception/          # GlobalExceptionHandler, custom exceptions
│   ├── security/           # JWT, OAuth2, RateLimiting filters
│   └── service/            # CacheService, monitoring
├── modules/                # Business logic, tổ chức theo domain
│   ├── achievement/        # entity/ + repository/ + service/
│   ├── adminai/            # AI question generation admin
│   ├── auth/               # entity/ + repository/ + service/
│   ├── daily/              # service/
│   ├── feedback/           # User feedback collection
│   ├── group/              # entity/ + repository/ + service/  (Church Group)
│   ├── lifeline/           # Lifeline (hint, askOpinion deferred)
│   ├── notification/       # User notifications
│   ├── quiz/               # entity/ + repository/ + service/  (Question, Session, Answer)
│   ├── ranked/             # model/ + service/  (ScoringService, RankTier)
│   ├── room/               # entity/ + repository/ + service/  (game mode engines)
│   ├── season/             # entity/ + repository/ + service/
│   ├── share/              # entity/ + repository/ + service/  (Share Card)
│   ├── tournament/         # entity/ + repository/ + service/
│   ├── user/               # entity/ + repository/ + service/  (User, Streak)
│   └── userquiz/           # User-generated quiz sets
└── shared/                 # Utilities dùng chung giữa nhiều modules
    ├── aspect/             # AOP (performance monitoring)
    └── converter/          # JPA converters (JsonListConverter)
```

### Quy ước đặt file mới (BE)
- **Controller mới** → `api/XxxController.java` (KHÔNG bao giờ đặt trong modules/)
- **Entity/Repository/Service mới** → `modules/{domain}/entity|repository|service/`
- **Module mới** → tạo thư mục `modules/{tên}/` với sub-folders entity/, repository/, service/
- **Filter, Security, Exception** → `infrastructure/{concern}/`
- **Converter, Aspect dùng chung** → `shared/` (chỉ cho utilities không thuộc domain nào)

### Shared/ — dùng cho gì, KHÔNG dùng cho gì
- **DÙNG**: JPA converters, AOP aspects, utility classes dùng bởi >= 2 modules
- **KHÔNG DÙNG**: Business logic, domain entities, DTOs, service classes — những thứ này thuộc modules/

---

## Frontend structure

```
apps/web/src/
├── api/                    # Axios client (client.ts) + token store (tokenStore.ts)
├── components/             # Shared reusable components + tests
│   └── ui/                 # Button, Card, Input, SearchableSelect
├── contexts/               # ErrorContext, RequireAuth, RequireAdmin
├── hooks/                  # useWebSocket (deprecated), useStomp, useRankedDataSync
├── layouts/                # AppLayout, AdminLayout
├── pages/                  # 44 user pages + admin/
│   └── admin/              # admin sub-pages
├── store/                  # Zustand (authStore.ts, onboardingStore.ts)
├── styles/                 # global.css (Tailwind + Stitch tokens)
└── test/                   # setup.ts (Vitest global setup)

apps/web/tests/e2e/         # Playwright e2e tests (xem PLAYWRIGHT_CODE_CONVENTIONS.md)
```

### Quy ước đặt file mới (FE)
- **Page mới** → `pages/XxxPage.tsx`, route thêm trong `main.tsx`
- **Component shared** → `components/XxxComponent.tsx` (hoặc `components/ui/` nếu primitive)
- **Hook mới** → `hooks/useXxx.ts`
- **Unit test** → cạnh source file: `pages/Xxx.test.tsx` hoặc `pages/__tests__/Xxx.test.tsx`
- **E2E test** → `tests/e2e/{smoke|happy-path}/xxx.spec.ts` (xem PLAYWRIGHT_CODE_CONVENTIONS.md)
- **Admin page** → `pages/admin/XxxPage.tsx`

---

## Mobile

> **Đã gỡ 2026-06-17.** `apps/mobile` (RN Expo) và bản backup cũ đã bị remove để viết lại bản mới từ đầu. Lịch sử rewrite S0–S6 lưu ở `docs/todo/archive/2026-05-*-mobile-*`. Section này sẽ được dựng lại khi bản mobile mới khởi động.
