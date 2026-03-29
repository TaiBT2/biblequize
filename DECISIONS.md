# Decisions Log

---

## Cleanup & Dead Code

## 2026-03-28 — Xóa 8 dead infrastructure classes (1,649 lines)
- Quyết định: Xóa CircuitBreakerService, DistributedTransactionManager, EventSourcingService, InterServiceCommunicationService, PerformanceMonitoringService, BusinessRulesEngine, ServiceRegistry, PerformanceMonitoringAspect. Sửa HealthCheckController bỏ serviceRegistry khỏi health response.
- Lý do: Grep toàn bộ codebase xác nhận 0 references đến 7/8 class. ServiceRegistry chỉ dùng bởi HealthCheckController nhưng luôn trả `totalServices: 0, status: DOWN` gây nhầm lẫn. PerformanceMonitoringAspect pointcut trỏ đến packages cũ (`com.biblequiz.service`, `com.biblequiz.repository`) không còn tồn tại.
- Trade-off: Nếu sau này cần circuit breaker/distributed transactions, phải viết lại. Nhưng các class này là skeleton không có logic thật, viết lại từ đầu sẽ tốt hơn dùng code cũ.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

---

## Architecture & Code Structure

## 2026-03-15 — Tách package: api/ vs modules/ vs infrastructure/ vs shared/
- Quyết định: Code backend chia 4 top-level packages: `api/` (controllers + DTOs), `modules/` (business logic theo domain), `infrastructure/` (cross-cutting concerns), `shared/` (utilities dùng chung).
- Lý do: Tách biệt responsibilities — controller chỉ handle HTTP, business logic nằm trong modules, infrastructure (security, cache, exception, audit) độc lập domain. Mỗi module tự chứa entity/repository/service → dễ tìm, dễ test riêng biệt.
- Trade-off: Nhiều package hơn so với flat structure. Nhưng khi project lớn (12 modules), tổ chức theo domain giúp navigate nhanh hơn nhiều so với tổ chức theo layer (all entities in one folder, all services in another).
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-15 — Mỗi module = entity/ + repository/ + service/
- Quyết định: Mỗi module trong `modules/` follow pattern: `entity/` (JPA entities), `repository/` (Spring Data interfaces), `service/` (business logic). Controller nằm ngoài ở `api/`.
- Lý do: Module tự chứa (self-contained) — khi đọc module `room/`, thấy ngay tất cả entities, repos, services liên quan. Controller tách ra `api/` vì 1 controller có thể dùng nhiều module services.
- Trade-off: Controller phải import cross-module. Đổi lại, không có circular dependency giữa modules.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

---

## Game Modes & Scoring

## 2026-03-20 — Tách riêng scoring engine cho mỗi game mode
- Quyết định: Mỗi multiplayer game mode có service riêng: `SpeedRaceScoringService`, `BattleRoyaleEngine`, `TeamScoringService`, `SuddenDeathMatchService`. Ranked mode có `ScoringService` riêng.
- Lý do: Mỗi mode có rules hoàn toàn khác nhau — Speed Race tính điểm theo tốc độ (100-150 pts), Battle Royale dùng elimination, Team vs Team có perfect round bonus +50, Sudden Death dùng king-of-the-hill queue. Gộp vào 1 class sẽ tạo god class với quá nhiều if/else.
- Trade-off: 5 service classes thay vì 1. Nhưng mỗi class < 100 lines, dễ test riêng, dễ thêm mode mới mà không sợ break mode cũ.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-20 — Ranked scoring: quadratic speed bonus + combo multiplier
- Quyết định: Công thức điểm ranked: `base (8/12/18) + floor(base * 0.5 * speedRatio²)`, combo x1.2 (5-streak) / x1.5 (10-streak), daily first x2. Time limit = 30s.
- Lý do: Quadratic curve (thay vì linear) tạo cảm giác rewarding hơn cho câu trả lời nhanh — khác biệt lớn giữa 3s và 10s, nhưng ít khác biệt giữa 25s và 30s. Combo khuyến khích chơi liên tục thay vì random guess.
- Trade-off: Phức tạp hơn cho user hiểu, nhưng feel tốt hơn khi chơi. Max score per question = 18 + 9 = 27 (hard, instant) * 1.5 (combo) * 2 (daily) = 81 pts.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-20 — Battle Royale: không loại ai nếu TẤT CẢ trả lời sai
- Quyết định: Trong Battle Royale, nếu tất cả active players đều trả lời sai hoặc không trả lời → không ai bị loại, round tiếp tục.
- Lý do: Tránh stalemate — nếu câu hỏi quá khó, loại tất cả sẽ kết thúc game đột ngột. Giữ game tiếp tục cho đến khi ít nhất 1 người trả lời đúng.
- Trade-off: Có thể kéo dài game nếu nhiều câu khó liên tiếp. Nhưng UX tốt hơn so với game kết thúc đột ngột không ai thắng.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-20 — Sudden Death: king-of-the-hill thay vì bracket
- Quyết định: Sudden Death mode dùng queue — champion giữ vị trí, challenger mới lên thách đấu. Winner stays, loser out.
- Lý do: Thú vị hơn bracket thông thường — tạo "king" narrative, khán giả có thể cổ vũ, winning streak có giá trị. Đơn giản hơn bracket elimination cho 1v1 liên tiếp.
- Trade-off: Player vào sau queue bất lợi (champion đã warm-up). Đổi lại, tạo drama và excitement tự nhiên.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

---

## Data & Persistence

## 2026-03-15 — Flyway migration-first, không dùng Hibernate ddl-auto (production)
- Quyết định: Schema changes qua Flyway migrations (V1-V12). Production: `ddl-auto: none`. Dev: `ddl-auto: update` + Flyway enabled.
- Lý do: Flyway versioned migrations đảm bảo schema nhất quán giữa environments, có thể review SQL trước khi apply, rollback bằng cách tạo migration mới. `ddl-auto: create-drop` đã gây bug (mất data, column mismatch với SQL seed files).
- Trade-off: Phải viết SQL migration thủ công. Đổi lại, an toàn cho production deploys, không bao giờ mất data.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-15 — FlywayConfig: auto-repair trước khi migrate
- Quyết định: `FlywayConfig.java` gọi `flyway.repair()` trước `flyway.migrate()` mỗi lần app start.
- Lý do: Nếu migration fail giữa chừng (ví dụ: V9), flyway_schema_history bị corrupt → app không start được. Auto-repair fix checksum mismatch tự động.
- Trade-off: Có thể mask underlying migration bugs. Nhưng trong dev environment, tốt hơn so với manual repair mỗi lần DB bị lỗi.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-15 — UUID string cho primary keys, không dùng auto-increment
- Quyết định: Tất cả entity dùng `String id` (`VARCHAR(36)`), generate bằng `UUID.randomUUID().toString()` trong service layer.
- Lý do: UUID không predictable (security — tránh IDOR), không cần DB sequence (distributed-friendly), merge data giữa environments không conflict.
- Trade-off: Larger index size (36 bytes vs 8 bytes BIGINT), slightly slower joins. Nhưng với quy mô app này, không ảnh hưởng đáng kể.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-15 — JSON columns cho list fields (correctAnswer, questionIds, tags)
- Quyết định: Dùng `@Convert(converter = JsonListConverter.class)` để lưu `List<String>` / `List<Integer>` dưới dạng JSON string trong DB column.
- Lý do: Đơn giản hơn normalized table (không cần join table cho correctAnswer chỉ có 1-4 elements). MySQL 8.0 hỗ trợ JSON natively.
- Trade-off: Không query được bên trong JSON bằng standard SQL (cần JSON_CONTAINS). Nhưng app chỉ cần read/write toàn bộ list, không query partial.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

---

## Cache & State Management

## 2026-03-15 — Redis cho game state, MySQL cho persistent data
- Quyết định: Game state (room state, ranked session, current question) lưu Redis với TTL. User data, scores, achievements lưu MySQL.
- Lý do: Game state là ephemeral — chỉ cần trong lúc chơi, tự cleanup sau game end. Redis O(1) read/write phù hợp real-time game loop. MySQL cho data cần persist lâu dài.
- Trade-off: Mất game state nếu Redis restart. Nhưng game session chỉ 5-30 phút, player có thể rejoin/restart.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-20 — RankedSessionService TTL 26 giờ
- Quyết định: Ranked session trong Redis có TTL 26h (thay vì 24h).
- Lý do: 26h buffer cho timezone — user ở UTC+7 chơi lúc 23:00, session phải tồn tại đến khi daily reset ở UTC midnight + buffer. 24h chính xác sẽ expire trước khi user kịp sync progress.
- Trade-off: 2h extra memory usage. Negligible cost.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-20 — RoomStateService: comma-separated strings cho queue
- Quyết định: Sudden Death queue lưu trong Redis dưới dạng comma-separated user IDs (ví dụ: `"user-1,user-2,user-3"`).
- Lý do: Đơn giản, human-readable khi debug Redis trực tiếp. Queue operations (poll, peek) dễ implement bằng string split/join.
- Trade-off: Không type-safe, manual parsing, giới hạn bởi max string size. Nhưng queue hiếm khi > 32 players → không vấn đề.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

---

## Security

## 2026-03-15 — JWT stateless + Redis blacklist cho logout
- Quyết định: Auth bằng JWT (access 15 phút + refresh 30 ngày). Logout invalidate bằng Redis blacklist (key = JTI, TTL = remaining expiration).
- Lý do: JWT stateless = không cần session store cho mỗi request. Blacklist chỉ cần cho tokens chưa expired khi user logout — nhỏ hơn nhiều so với session store.
- Trade-off: Token vẫn valid trong window giữa issue và blacklist check (milliseconds). Acceptable risk.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-15 — STOMP simple broker thay vì external broker
- Quyết định: WebSocket dùng Spring built-in simple message broker, không dùng RabbitMQ/Redis Pub/Sub.
- Lý do: Single server deployment — không cần distributed message routing. Simple broker = zero infrastructure overhead, latency thấp nhất.
- Trade-off: Không horizontal scale được (2 server instances sẽ không share WS state). Khi cần scale, migrate sang Redis Pub/Sub hoặc RabbitMQ.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-28 — JWT secret phải là base64-encoded
- Quyết định: Tất cả JWT secret trong config phải là base64-encoded string, thêm test validate config secret.
- Lý do: Bug production — `application-dev.yml` có JWT secret plaintext (chứa `-`), JwtService dùng `Decoders.BASE64.decode()` → crash khi OAuth login. Unit test không phát hiện vì dùng hardcoded valid base64 secret khác config thật.
- Trade-off: Dev cần encode secret trước khi đặt vào config. Đổi lại, tránh runtime crash hoàn toàn.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-28 — Secrets qua env vars + spring-dotenv
- Quyết định: Google OAuth credentials chỉ lưu trong `.env` files (gitignored). Config files dùng `${GOOGLE_CLIENT_ID}` không có default value. Dùng `spring-dotenv` để Spring Boot tự đọc `.env`.
- Lý do: GitHub Push Protection chặn push vì phát hiện secrets hardcode. Từ đó, mọi secret chỉ qua env vars.
- Trade-off: Dev mới cần tạo `.env` file thủ công. Đổi lại, không bao giờ leak secrets vào git history.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

---

## Frontend

## 2026-03-29 — Accent colors riêng cho mỗi Game Mode card
- Quyết định: Mỗi game mode card dùng accent color riêng: Practice #4a9eff (blue), Ranked #e8a832 (gold), Daily #ff8c42 (orange), Multiplayer #9b59b6 (purple)
- Lý do: Giúp user phân biệt nhanh giữa các mode qua visual cue. Stitch design system cho phép accent colors ngoài palette chính cho functional differentiation.
- Trade-off: Thêm 3 màu ngoài design system chính, nhưng chỉ dùng cho game mode cards.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-29 — Practice + Ranked tự thiết kế (không có Stitch screen)
- Quyết định: Tạo Practice.tsx và Ranked.tsx theo design tokens từ DESIGN_STATUS.md thay vì chờ Stitch design
- Lý do: Hai routes cần hoàn thành để Game Mode Hub hoạt động end-to-end. Design system đã đủ mature.
- Trade-off: Có thể cần update lại nếu Stitch tạo design chính thức, nhưng logic/data flow giữ nguyên.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-29 — GameModeGrid tách thành component riêng
- Quyết định: Tạo GameModeGrid.tsx riêng thay vì inline trong Home.tsx
- Lý do: Component có logic riêng (4 API calls, countdown timer, state management), tách ra giữ Home.tsx clean.
- Trade-off: Thêm 1 file, nhưng separation of concerns tốt hơn.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

## 2026-03-28 — Migrate AuthContext → Zustand store
- Quyết định: Chuyển AuthContext (global state) sang Zustand store (`src/store/authStore.ts`). Giữ ErrorContext vì nó là tree-scoped UI concern (render toasts trong React tree).
- Lý do: CLAUDE.md rule: "State global dùng Zustand — không dùng Context cho global state". AuthContext quản lý user/auth state toàn app = global state thuần. ErrorContext render `<ErrorToast>` components = cần React tree context.
- Trade-off: Zustand store không có Provider wrapper → cần gọi `checkAuth()` manually khi app mount. Đổi lại, state accessible ngoài React components (middleware, interceptors).
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

---

## Dependencies

## 2026-03-15 — Chọn stack chính
- Quyết định: Spring Boot 3.3 + MySQL 8.0 + Redis 7 + Vite/React 18.
- Lý do:
  - **Spring Boot**: Ecosystem lớn nhất Java, OAuth2/WebSocket/JPA built-in, production-ready.
  - **MySQL 8.0**: JSON support, UTF8MB4 cho tiếng Việt, phổ biến → dễ tìm hosting.
  - **Redis 7**: Sub-millisecond latency cho game state, built-in TTL, pub/sub sẵn cho future scaling.
  - **JJWT 0.11.5**: Lightweight JWT library, không cần full Spring Security OAuth2 resource server.
  - **Flyway**: Industry standard DB migration, tốt hơn Liquibase cho SQL-first approach.
  - **spring-dotenv**: Load `.env` files mà không cần external tools (dotenv-java alternative phức tạp hơn).
  - **springdoc-openapi**: Auto-generate Swagger UI từ annotations, zero config.
- Trade-off: Java verbose hơn Kotlin/Go. Nhưng team quen, ecosystem mature, hiring dễ.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới

---

## Testing

## 2026-03-28 — Unit test phải dùng config values thật
- Quyết định: Test không được mock/hardcode config values khác với config thật. Phải có integration test hoặc config validation test kiểm tra config file thật.
- Lý do: JwtServiceTest dùng base64 secret hardcode khác `application-dev.yml` → JWT decode crash ở runtime nhưng test pass. Gap giữa test và reality.
- Trade-off: Test setup phức tạp hơn (cần sync với config). Đổi lại, phát hiện config bugs sớm.
- KHÔNG thay đổi khi refactor trừ khi có lý do mới
