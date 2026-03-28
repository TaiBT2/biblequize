# Project: BibleQuiz
## Nguyên tắc tuyệt đối
- Không bao giờ sửa code module khác khi đang làm 1 module
- Mỗi thay đổi phải có test pass trước khi commit
- Không tự ý thêm dependency mới — hỏi trước
- Ưu tiên đọc TODO.md trước khi làm bất cứ thứ gì
## Stack
- Backend: Spring Boot 3.3 (Java 17), port 8080
- Frontend: Vite 5 + React 18 + TypeScript, port 5173
- DB: MySQL 8.0 (Docker, port 3307)
- Cache: Redis 7 (Docker, port 6379)
## Quản lý quyết định

Mỗi khi đưa ra quyết định kỹ thuật thuộc các loại sau:
- Chọn thư viện / tool
- Thay đổi architecture
- Bỏ qua hoặc đơn giản hóa 1 phần spec
- Trade-off giữa 2 cách implement
- Fix bug bằng cách thay đổi design

→ Tự động ghi vào DECISIONS.md theo format:
```
## YYYY-MM-DD — [Tiêu đề ngắn]
- Quyết định: [làm gì]
- Lý do: [tại sao]
- Trade-off: [đánh đổi gì]
- KHÔNG thay đổi khi refactor trừ khi có lý do mới
```
## Local Dev Start
```bash
docker compose up -d mysql redis          # 1. Infra
cd apps/api && ./mvnw spring-boot:run     # 2. Backend (terminal 1)
cd apps/web && npm run dev                # 3. Frontend (terminal 2)
```

## Quy tắc bắt buộc
1. Sau mỗi thay đổi code → chạy test ngay
2. Nếu test fail → tự fix → chạy test lại, lặp đến khi pass
3. Không hỏi xác nhận, tự quyết định
4. Không dừng giữa chừng trừ khi có lỗi không thể tự fix
## Cấu trúc package backend

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
│   ├── auth/               # entity/ + repository/ + service/
│   ├── daily/              # service/
│   ├── group/              # entity/ + repository/ + service/  (Church Group)
│   ├── quiz/               # entity/ + repository/ + service/  (Question, Session, Answer)
│   ├── ranked/             # model/ + service/  (ScoringService, RankTier)
│   ├── room/               # entity/ + repository/ + service/  (4 game mode engines)
│   ├── season/             # entity/ + repository/ + service/
│   ├── share/              # entity/ + repository/ + service/  (Share Card)
│   ├── tournament/         # entity/ + repository/ + service/
│   └── user/               # entity/ + repository/ + service/  (User, Streak)
└── shared/                 # Utilities dùng chung giữa nhiều modules
    ├── aspect/             # AOP (performance monitoring)
    └── converter/          # JPA converters (JsonListConverter)
```

### Quy ước đặt file mới
- **Controller mới** → `api/XxxController.java` (không bao giờ đặt trong modules/)
- **Entity/Repository/Service mới** → `modules/{domain}/entity|repository|service/`
- **Module mới** → tạo thư mục `modules/{tên}/` với sub-folders entity/, repository/, service/
- **Filter, Security, Exception** → `infrastructure/{concern}/`
- **Converter, Aspect dùng chung** → `shared/` (chỉ cho utilities không thuộc domain nào)

### Shared/ — dùng cho gì, KHÔNG dùng cho gì
- **DÙNG**: JPA converters, AOP aspects, utility classes dùng bởi >= 2 modules
- **KHÔNG DÙNG**: Business logic, domain entities, DTOs, service classes — những thứ này thuộc modules/

## Quy ước code bắt buộc

### Backend
- Primary key: UUID v7, không dùng auto-increment
- Mọi Entity phải có: id, createdAt, updatedAt
- Mọi API lỗi trả về: { code, message, requestId, details? }
- Không bao giờ expose stack trace trong response
- Dùng MapStruct để map Entity ↔ DTO
- Mọi thay đổi DB phải có Flyway script: db/migration/V{n}__{description}.sql
- Mọi endpoint /admin/** phải có @PreAuthorize("hasRole('ADMIN')")
- Dùng @Transactional cho mọi thao tác ghi nhiều bảng

### Frontend
- Mọi API call qua TanStack Query — không dùng useEffect + fetch thủ công
- State global dùng Zustand — không dùng Context cho global state
  - Exception: ErrorContext (tree-scoped, render toasts trong React tree) được phép giữ Context
  - Auth state đã migrate sang `src/store/authStore.ts` (Zustand)
- Không hardcode URL — dùng import.meta.env.VITE_API_URL
- Mọi form phải có loading state + error handling
## Quy tắc test
- Unit test không được mock/hardcode config values (JWT secret, API keys...) khác với config thật
- Phải có integration test hoặc config validation test kiểm tra config file thật, không chỉ unit test với mock data
- Khi test service cần config value → dùng giá trị giống application-dev.yml, không tự bịa giá trị khác

## Lệnh test
- Backend API + WebSocket: `cd apps/api && ./mvnw test -Dtest="com.biblequiz.api.**"`
- Backend Service: `cd apps/api && ./mvnw test -Dtest="com.biblequiz.service.**"`
- Backend ALL: `cd apps/api && ./mvnw test -Dtest="com.biblequiz.api.**,com.biblequiz.service.**"`
- Frontend: `cd apps/web && npm test`
- E2E (cần app đang chạy): `npx playwright test`

## Definition of Done
- Tất cả test pass
- Không có TypeScript/Java compile error
- Không có @SuppressWarnings mới
- Flyway migration chạy clean trên DB trống
- Chạy được trên local end-to-end

## KHÔNG được làm
- Không dùng H2 in-memory cho test — dùng Testcontainers MySQL
- Không map Entity → DTO thủ công — dùng MapStruct
- Không để business logic trong Controller — chỉ ở Service
- Không commit code có System.out.println — dùng @Slf4j + log
- Không xóa Flyway migration đã chạy — tạo migration mới để fix
