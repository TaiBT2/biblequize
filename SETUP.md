# Bible Quiz - Hướng dẫn Setup Sprint 1

## Tổng quan Sprint 1
Sprint 1 đã hoàn thành các tính năng cơ bản:
- ✅ Database schema với MySQL + Flyway migrations
- ✅ JPA entities và repositories
- ✅ Authentication system với OAuth2 (Google/Facebook) và JWT
- ✅ Basic REST APIs cho auth, books, questions
- ✅ React frontend với Vite + TypeScript
- ✅ Docker Compose cho local development

## Yêu cầu hệ thống
- Java 17+
- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0
- Redis 7

## Cài đặt và chạy

### 1. Khởi động dịch vụ nền tảng
```bash
# Khởi động MySQL và Redis
docker compose up -d

# Kiểm tra các dịch vụ đang chạy
docker compose ps
```

### 2. Cấu hình OAuth2 (Tùy chọn)
Để sử dụng OAuth2, bạn cần tạo ứng dụng OAuth2:

#### Google OAuth2:
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Kích hoạt Google+ API
4. Tạo OAuth 2.0 Client ID
5. Thêm redirect URI: `http://localhost:8080/login/oauth2/code/google`

#### Facebook OAuth2:
1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Tạo ứng dụng mới
3. Thêm Facebook Login product
4. Cấu hình redirect URI: `http://localhost:8080/login/oauth2/code/facebook`

#### Cập nhật environment variables:
```bash
# Tạo file .env trong thư mục apps/api
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
```

### 3. Chạy Backend API
```bash
cd apps/api

# Cài đặt dependencies (nếu cần)
./mvnw clean install

# Chạy ứng dụng
./mvnw spring-boot:run

# API sẽ chạy tại http://localhost:8080
```

### 4. Chạy Frontend Web
```bash
cd apps/web

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Frontend sẽ chạy tại http://localhost:5173
```

## Kiểm tra tính năng

### 1. API Endpoints
- `GET /books` - Danh sách sách Kinh Thánh
- `GET /questions` - Danh sách câu hỏi (có filter)
- `GET /auth/me` - Thông tin user hiện tại
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Đăng xuất

### 2. Frontend Features
- Trang đăng nhập với Google/Facebook OAuth2
- Trang chủ với các chế độ chơi
- Navigation và authentication state management
- Responsive UI với Tailwind CSS

### 3. Database
- Tự động tạo database `biblequiz`
- Chạy Flyway migrations để tạo tables
- Seed data với 66 sách Kinh Thánh và 5 câu hỏi mẫu

## Cấu trúc dự án

```
biblequize/
├── apps/
│   ├── api/                 # Spring Boot Backend
│   │   ├── src/main/java/com/biblequiz/
│   │   │   ├── entity/      # JPA Entities
│   │   │   ├── repository/  # JPA Repositories
│   │   │   ├── service/     # Business Logic
│   │   │   ├── controller/  # REST Controllers
│   │   │   ├── auth/        # Authentication
│   │   │   └── config/      # Configuration
│   │   └── src/main/resources/
│   │       ├── application.yml
│   │       └── db/migration/ # Flyway migrations
│   └── web/                 # React Frontend
│       ├── src/
│       │   ├── components/  # UI Components
│       │   ├── pages/       # Page Components
│       │   ├── store/       # State Management
│       │   ├── api/         # API Client
│       │   └── styles/      # CSS Styles
│       └── package.json
├── compose.yml              # Docker Compose
└── README.md
```

## Troubleshooting

### Lỗi kết nối database
```bash
# Kiểm tra MySQL container
docker compose logs mysql

# Restart MySQL
docker compose restart mysql
```

### Lỗi OAuth2
- Kiểm tra redirect URI trong Google/Facebook console
- Đảm bảo client ID và secret đúng
- Kiểm tra CORS configuration

### Lỗi frontend
```bash
# Clear node_modules và reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
npm run dev -- --force
```

## Tiếp theo - Sprint 2
Sprint 2 sẽ triển khai:
- Single-player & Practice Mode
- Quiz session management
- Question selection logic
- Scoring system
- Practice mode UI

## Liên hệ
Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.
