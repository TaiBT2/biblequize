## Bible Quiz — Học Kinh Thánh qua trắc nghiệm

Bible Quiz là ứng dụng “chơi mà học” Kinh Thánh: luyện tập cá nhân, leo hạng hằng ngày, thi phòng nhiều người, giải đấu 1v1, và trang admin quản trị nội dung/câu hỏi (kể cả sinh tự động bằng AI).

### Tính năng chính
- Chơi 1 người (Single-player) và Luyện tập (Practice, không giới hạn, không ảnh hưởng leaderboard)
- Leo hạng (Ranked): giới hạn 50 câu/ngày, 10 mạng/ngày, tự động chuyển sách theo thứ tự Sáng Thế Ký → Khải Huyền và hậu chu kỳ tăng độ khó
- Phòng thi (Multiplayer Room) + realtime scoreboard
- Tournament 1v1 loại trực tiếp (mỗi người 3 mạng/trận)
- Thư viện câu hỏi theo sách/chương/độ khó, review lịch sử và giải thích đáp án
- Admin: CRUD/import câu hỏi, duyệt góp ý, analytics; AI Question Generator (AWS Bedrock)

### Tech stack (mặc định)
- FE: React + Vite (TypeScript)
- BE: Java Spring Boot
- DB: MySQL (RDS), Cache: Redis (ElastiCache)
- Realtime: Spring WebSocket (STOMP/native)
- Hạ tầng: AWS (RDS, ElastiCache, S3, CloudFront, ECS/ALB), CI: GitHub Actions

### Cấu trúc thư mục
```
apps/
  web/         # React (Vite)
  api/         # Spring Boot API
infra/
  docker/      # Dockerfiles
compose.yml    # MySQL + Redis cho local dev
SPEC.md        # Tài liệu đặc tả đầy đủ
```

### Khởi chạy nhanh (local)
1) Dịch vụ nền tảng
```
docker compose up -d  # MySQL (3306), Redis (6379)
```
2) Backend API
```
cd apps/api
./mvnw spring-boot:run  # hoặc mvn spring-boot:run
```
3) Frontend Web
```
cd apps/web
npm i && npm run dev
```

### Tài liệu chi tiết
- Đọc SPEC: xem `SPEC.md` (yêu cầu, kiến trúc, mô hình dữ liệu, API, realtime, AI…)

### Lộ trình
- v1: Single-player, OAuth, thư viện câu, lịch sử, góp ý, admin CRUD/import, WS phòng cơ bản
- v1.1: Leaderboard global, bookmark, practice theo chương, một phần ý tưởng học tập nâng cao
- v1.2: Tournament hoàn thiện, AI Generator production, analytics nâng cao

### Giấy phép & đóng góp
- License: cập nhật theo nhu cầu dự án
- Đóng góp: PR/Issue chào mừng. Vui lòng tuân theo SPEC và coding style đã nêu.

