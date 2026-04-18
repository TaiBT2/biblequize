# BibleQuiz — Environment Setup Guide

## Prerequisites

- Java 17 (JDK)
- Node.js 20+
- Docker Desktop (for MySQL + Redis)
- Android Studio (for mobile development)
- Git

---

## 1. Infrastructure (Docker)

```bash
# Start MySQL + Redis
docker compose up -d mysql redis
```

| Service | Port | Credentials |
|---------|------|-------------|
| MySQL 8.0 | `3307` | root/pass, db: `biblequiz` |
| Redis 7 | `6379` | no password |

---

## 2. Backend API (`apps/api/`)

### 2.1 Tạo file `.env`

```bash
cd apps/api
cp .env.example .env   # hoặc tạo mới
```

Nội dung file `apps/api/.env`:

```env
# Google OAuth2 (Web client — cho login web)
GOOGLE_CLIENT_ID=your-web-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google OAuth2 (Android client — cho login mobile)
GOOGLE_ANDROID_CLIENT_ID=your-android-google-client-id.apps.googleusercontent.com
```

### 2.2 Các config trong `application.yml` (đã có sẵn, không cần sửa)

| Config | Default | Mô tả |
|--------|---------|-------|
| `server.port` | `8080` | API port |
| `spring.datasource.url` | `jdbc:mysql://localhost:3307/biblequiz` | MySQL connection |
| `spring.datasource.username` | `root` | DB user |
| `spring.datasource.password` | `pass` | DB password |
| `spring.data.redis.host` | `localhost` | Redis host |
| `spring.data.redis.port` | `6379` | Redis port |
| `biblequiz.jwt.secret` | (hardcoded default) | JWT signing key |
| `biblequiz.jwt.expiration` | `900000` (15 min) | Access token TTL |
| `biblequiz.jwt.refresh-expiration` | `2592000000` (30 days) | Refresh token TTL |
| `biblequiz.cors.allowed-origins` | `localhost:3000,5173,5174` | CORS origins |

### 2.3 Start

```bash
cd apps/api
./mvnw spring-boot:run
```

API sẽ chạy tại `http://localhost:8080`.

### 2.4 Verify

```bash
curl http://localhost:8080/api/health
```

---

## 3. Frontend Web (`apps/web/`)

### 3.1 Tạo file `.env`

```bash
cd apps/web
cp .env.example .env   # hoặc tạo mới
```

Nội dung file `apps/web/.env`:

```env
# API Backend
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws

# App Info
VITE_APP_NAME=Bible Quiz
VITE_APP_VERSION=0.1.0

# Google OAuth2 (Web client ID — cùng ID với backend)
VITE_GOOGLE_CLIENT_ID=your-web-google-client-id.apps.googleusercontent.com

# Dev flags
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_MOCK_DATA=false
```

### 3.2 Install & Start

```bash
cd apps/web
npm install
npm run dev
```

Web sẽ chạy tại `http://localhost:5173`.

### 3.3 Verify

Mở browser → `http://localhost:5173` → thấy trang Landing/Login.

---

## 4. Mobile App (`apps/mobile/`)

### 4.1 Tạo file `.env`

```bash
cd apps/mobile
cp .env.example .env   # hoặc tạo mới
```

Nội dung file `apps/mobile/.env`:

```env
# Google OAuth2 — Web client ID (dùng cho GoogleSignin.configure webClientId)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-google-client-id.apps.googleusercontent.com

# Google OAuth2 — Android client ID (SHA-1 + package name phải khớp trên GCP)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-google-client-id.apps.googleusercontent.com
```

### 4.2 Google OAuth Setup cho Mobile

Trên **Google Cloud Console** (APIs & Services > Credentials):

1. **Web client** (type: Web application):
   - Dùng cho `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
   - Cần có để lấy `idToken` từ native SDK

2. **Android client** (type: Android):
   - Package name: `com.biblequiz.mobile`
   - SHA-1 fingerprint (lấy từ debug keystore):
     ```bash
     keytool -list -v -keystore apps/mobile/android/app/debug.keystore \
       -alias androiddebugkey -storepass android | grep SHA1
     ```
   - Thêm SHA-1 này vào Android client trên GCP Console

3. **OAuth consent screen** (Branding):
   - Điền App name, Support email
   - Nếu ở mode "Testing" → thêm email test user vào Audience

### 4.3 Install & Build

```bash
cd apps/mobile
npm install

# Prebuild Android
npx expo prebuild --platform android

# Fix local.properties (Windows)
echo "sdk.dir=C:/Users/<username>/AppData/Local/Android/Sdk" > android/local.properties

# Build & Run
npx expo run:android
```

### 4.4 API Connection

Mobile app kết nối backend qua `apps/mobile/src/api/config.ts`.
Mặc định: `http://10.0.2.2:8080` (Android emulator → localhost host machine).

Nếu dùng device thật → đổi sang IP LAN của máy.

### 4.5 Run Tests

```bash
cd apps/mobile
npm test              # 97 tests
```

---

## 5. Tổng hợp Google OAuth Client IDs

| Client | Type | Dùng ở đâu |
|--------|------|-----------|
| Web client ID | Web application | Backend (`GOOGLE_CLIENT_ID`), Web (`VITE_GOOGLE_CLIENT_ID`), Mobile (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`) |
| Web client secret | Web application | Backend only (`GOOGLE_CLIENT_SECRET`) |
| Android client ID | Android | Backend (`GOOGLE_ANDROID_CLIENT_ID`), Mobile (`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`) |

> **Lưu ý**: Web client ID dùng chung cho cả 3 apps. Android client ID cần SHA-1 + package name khớp.

---

## 6. Quick Start (Full Stack)

```bash
# Terminal 1: Infrastructure
docker compose up -d mysql redis

# Terminal 2: Backend
cd apps/api && ./mvnw spring-boot:run

# Terminal 3: Frontend Web
cd apps/web && npm run dev

# Terminal 4: Mobile (optional)
cd apps/mobile && npx expo run:android
```

| Service | URL |
|---------|-----|
| API | http://localhost:8080 |
| Web | http://localhost:5173 |
| Mobile (emulator) | Metro on port 8081 |
| MySQL | localhost:3307 |
| Redis | localhost:6379 |

---

## 7. Troubleshooting

| Vấn đề | Giải pháp |
|---------|-----------|
| MySQL connection refused | `docker compose up -d mysql` — đợi 10s |
| CORS error trên web | Kiểm tra `VITE_API_BASE_URL` khớp với backend port |
| Google login blank page (mobile) | Kiểm tra SHA-1, package name, OAuth consent screen |
| `sdk.dir` not found (mobile) | Tạo `android/local.properties` với đường dẫn SDK |
| 401 Unauthorized | Access token hết hạn — app tự refresh, nếu fail → re-login |
| Redis connection refused | `docker compose up -d redis` |
