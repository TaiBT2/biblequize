# Hướng dẫn chạy Local Development

## Yêu cầu hệ thống

| Tool | Version |
|------|---------|
| Java | 17+ |
| Node.js | 18+ |
| Docker Desktop | Đang chạy |
| Maven | Dùng `./mvnw` có sẵn |

---

## Bước 1 — Tạo file environment

### 1a. Backend — `apps/api/.env`
Tạo file này (không commit, đã có trong `.gitignore`):

```bash
# apps/api/.env

GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

> Spring Boot không tự đọc `.env`. Xem Bước 3 để biết cách truyền biến này khi chạy.

### 1b. Frontend — đã có sẵn
Các file `.env`, `.env.development`, `.env.local` đã được cấu hình đúng cho local:

```
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

Không cần tạo thêm gì.

---

## Bước 2 — Khởi động MySQL & Redis (Docker)

```bash
# Từ thư mục gốc dự án
cd d:/code/biblequize

docker compose up -d mysql redis
```

Kiểm tra đã healthy chưa:

```bash
docker compose ps
```

Output mong đợi:
```
NAME               STATUS          PORTS
biblequiz-mysql    Up (healthy)    0.0.0.0:3307->3306/tcp
biblequiz-redis    Up (healthy)    0.0.0.0:6379->6379/tcp
```

> **Port:** MySQL chạy ở host port **3307** (không phải 3306 mặc định).

---

## Bước 3 — Khởi động Backend (Spring Boot)

### Windows — PowerShell

```powershell
cd d:/code/biblequize/apps/api

$env:GOOGLE_CLIENT_ID="<your-google-client-id>"
$env:GOOGLE_CLIENT_SECRET="<your-google-client-secret>"

./mvnw spring-boot:run
```

### Windows — Command Prompt (cmd)

```cmd
cd d:\code\biblequize\apps\api

set GOOGLE_CLIENT_ID=<your-google-client-id>
set GOOGLE_CLIENT_SECRET=<your-google-client-secret>

mvnw spring-boot:run
```

### Kiểm tra backend đã lên:

```bash
curl http://localhost:8080/api/health
```

Hoặc mở trình duyệt: `http://localhost:8080/api/health`

> Backend chạy tại **http://localhost:8080**

---

## Bước 4 — Khởi động Frontend (Vite)

Mở terminal mới:

```bash
cd d:/code/biblequize/apps/web

npm install    # lần đầu hoặc sau khi thêm package

npm run dev
```

> Frontend chạy tại **http://localhost:5173**

---

## Trình tự tổng hợp

```
Docker (MySQL :3307 + Redis :6379)
         ↓
Backend Spring Boot (:8080)
         ↓
Frontend Vite (:5173)
```

**Luôn start theo thứ tự này.** Backend cần DB kết nối được khi khởi động (Flyway chạy migration).

---

## Cấu hình tổng quan

| Service | Host | Port | Config file |
|---------|------|------|-------------|
| MySQL | localhost | **3307** | `compose.yml` |
| Redis | localhost | 6379 | `compose.yml` |
| Backend API | localhost | **8080** | `apps/api/src/main/resources/application.yml` |
| Frontend | localhost | **5173** | `apps/web/.env.local` |

---

## Google OAuth — Google Cloud Console

Đảm bảo trong [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials** → OAuth 2.0 Client ID có:

**Authorized redirect URIs:**
```
http://localhost:8080/login/oauth2/code/google
```

---

## Troubleshooting

### Lỗi: `Communications link failure` (MySQL)
```bash
# Kiểm tra container đang chạy
docker compose ps

# Nếu chưa chạy
docker compose up -d mysql redis

# Nếu đang chạy nhưng vẫn lỗi — kiểm tra port
netstat -ano | findstr :3307
```

### Lỗi: `Port 8080 already in use`
```powershell
# Tìm process đang chiếm port
netstat -ano | findstr :8080

# Kill process (thay PID)
Stop-Process -Id <PID> -Force
```

### Lỗi: `Port 5173 already in use`
```bash
# Vite tự thử port tiếp theo (5174, 5175...)
# Hoặc kill process cũ rồi chạy lại npm run dev
```

### Reset database (nếu cần)
```bash
docker compose down -v        # xóa volumes (mất data)
docker compose up -d mysql redis
```
