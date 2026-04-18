# Google OAuth Credentials — Hướng dẫn đầy đủ

## Tổng quan — Cần tạo gì

```
Google Cloud Console
├── Project: "BibleQuiz"
├── OAuth Consent Screen (1 lần)
├── Credential 1: Web Application         ← cho React web app
├── Credential 2: Android (Debug)         ← cho dev/test trên emulator
├── Credential 3: Android (Release)       ← cho publish Play Store
└── Credential 4: iOS (sau này)           ← khi có Mac
```

---

## Bước 1: Tạo Google Cloud Project

1. Vào https://console.cloud.google.com
2. Click dropdown project trên thanh trên → **New Project**
3. Điền:
   - Project name: `BibleQuiz`
   - Organization: để trống (hoặc chọn FMC nếu có)
4. **Create**
5. Chờ tạo xong → chọn project BibleQuiz

**Lưu ý:** 1 project dùng cho cả web + Android + iOS. Không cần tạo nhiều projects.

---

## Bước 2: Bật Google APIs cần thiết

1. Menu trái → **APIs & Services** → **Library**
2. Tìm và **Enable** các API sau:
   - **Google Identity Services** (hoặc Google Sign-In)
   - **Google People API** (lấy thông tin user)

---

## Bước 3: Cấu hình OAuth Consent Screen

Làm 1 lần, dùng chung cho tất cả credentials.

1. Menu trái → **APIs & Services** → **OAuth consent screen**
2. Chọn **External** → Create

3. **App information:**
   - App name: `BibleQuiz`
   - User support email: email của bạn
   - App logo: upload logo BibleQuiz (optional)

4. **App domain:** (optional, thêm sau khi có domain)
   - Application home page: `https://biblequiz.app`
   - Privacy policy: `https://biblequiz.app/privacy`
   - Terms of service: `https://biblequiz.app/terms`

5. **Authorized domains:**
   - `biblequiz.app`

6. **Developer contact:** email của bạn

7. **Scopes** → Add scopes:
   - `email` — xem email
   - `profile` — xem tên, avatar
   - `openid` — xác thực danh tính

8. **Test users** (khi app ở trạng thái Testing):
   - Thêm email của bạn + email test
   - Chỉ test users mới login được khi app chưa publish

9. **Save**

### Trạng thái app:

```
Testing (mặc định):
  → Chỉ test users (max 100) login được
  → Đủ cho dev + pilot test

Production (publish sau):
  → Tất cả Google users login được
  → Cần Google review (1-2 tuần)
  → Submit khi app ready launch
```

**Lưu ý:** Để ở **Testing** trong lúc dev. Chuyển **Production** trước khi launch public. Google sẽ review app name, logo, scopes — thường approve trong 1-2 tuần.

---

## Bước 4: Tạo Credential — Web Application

Dùng cho React web app (browser login).

1. Menu trái → **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `BibleQuiz Web`

5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000          ← Vite dev (nếu port 3000)
   http://localhost:5173          ← Vite dev (default port)
   http://localhost:4173          ← Vite preview
   https://biblequiz.app         ← Production (thêm sau)
   ```

6. **Authorized redirect URIs:**
   ```
   http://localhost:8080/oauth2/callback/google     ← Backend dev
   http://localhost:8080/api/auth/callback/google    ← Tùy backend route
   https://api.biblequiz.app/oauth2/callback/google  ← Production (thêm sau)
   ```

   **Lưu ý:** Redirect URI phải CHÍNH XÁC khớp với backend config. Sai 1 ký tự = lỗi `redirect_uri_mismatch`.

7. **Create**

8. **Kết quả:**
   ```
   Client ID:     123456789-abc.apps.googleusercontent.com
   Client Secret: GOCSPX-xyz789abc123
   ```

9. **Lưu lại cả 2** → dùng trong backend:

```yaml
# application.yml (backend Spring Boot)
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}       # ← Client ID
            client-secret: ${GOOGLE_CLIENT_SECRET} # ← Client Secret
```

```bash
# .env (backend, KHÔNG commit git)
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xyz789abc123
```

### Lưu ý Web Credential:

```
✅ Client ID → dùng ở frontend + backend
✅ Client Secret → CHỈ dùng ở backend
❌ KHÔNG BAO GIỜ đặt Client Secret trong:
   - Frontend code (React)
   - Git repository
   - File public
```

---

## Bước 5: Tạo Credential — Android (Debug)

Dùng để test Google Sign-In trên emulator/device khi đang dev.

### 5a. Lấy SHA-1 Debug Key

```bash
# Windows CMD:
keytool -keystore "%USERPROFILE%\.android\debug.keystore" -list -v -storepass android

# Windows PowerShell:
keytool -keystore "$env:USERPROFILE\.android\debug.keystore" -list -v -storepass android

# Mac / Linux:
keytool -keystore ~/.android/debug.keystore -list -v -storepass android
```

Nếu lỗi `keytool not found`:
```bash
# Windows — thêm Java vào PATH:
# keytool nằm trong: C:\Program Files\Java\jdk-XX\bin\
# Hoặc: C:\Program Files\Android\Android Studio\jbr\bin\

# Chạy trực tiếp:
"C:\Program Files\Android\Android Studio\jbr\bin\keytool" -keystore "%USERPROFILE%\.android\debug.keystore" -list -v -storepass android
```

Kết quả → tìm dòng SHA1:
```
Certificate fingerprints:
  SHA1: DA:39:A3:EE:5E:6B:4B:0D:32:55:BF:EF:95:60:18:90:AF:D8:07:09
```

Copy **toàn bộ** chuỗi SHA1 (bao gồm dấu `:`)

### 5b. Xác định Package Name

```bash
# Expo — xem app.json:
grep -A2 "android" app.json
# Tìm "package": "com.biblequiz.app"

# Bare RN — xem build.gradle:
grep "applicationId" android/app/build.gradle
# applicationId "com.biblequiz.app"

# Hoặc xem AndroidManifest.xml:
grep "package=" android/app/src/main/AndroidManifest.xml
```

Nếu chưa có → đặt: `com.biblequiz.app`

**Lưu ý:** Package name KHÔNG ĐỔI ĐƯỢC sau khi publish Play Store. Chọn cẩn thận.

Recommend format: `com.[tên tổ chức].[tên app]`
- `com.biblequiz.app` ✅
- `com.fmc.biblequiz` ✅
- `biblequiz` ❌ (thiếu domain prefix)

### 5c. Tạo trên Google Console

1. **+ Create Credentials** → **OAuth client ID**
2. Application type: **Android**
3. Name: `BibleQuiz Android Debug`
4. Package name: `com.biblequiz.app`
5. SHA-1: paste SHA-1 từ bước 5a
6. **Create**

7. **Kết quả:**
   ```
   Client ID: 987654321-def.apps.googleusercontent.com
   (Không có Client Secret — Android không cần)
   ```

### Lưu ý Android Debug Credential:

```
✅ Client ID → KHÔNG dùng trực tiếp trong code
   (React Native Google Sign-In dùng Web Client ID, 
    Android Client ID chỉ để Google verify app)
✅ Mỗi máy dev có SHA-1 khác nhau
   → Mỗi developer trong team cần tạo Debug credential riêng
   → Hoặc share debug.keystore file giữa team
❌ KHÔNG dùng debug credential cho production
```

---

## Bước 6: Tạo Credential — Android (Release)

Dùng khi publish lên Play Store.

### 6a. Tạo Release Keystore

```bash
keytool -genkey -v \
  -keystore biblequiz-release.keystore \
  -alias biblequiz \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Trả lời các câu hỏi:
```
Enter keystore password: [đặt password mạnh]
Re-enter new password: [nhập lại]
What is your first and last name?: [Tên bạn]
What is the name of your organizational unit?: Development
What is the name of your organization?: Free Methodist Church
What is the name of your City or Locality?: An Khe
What is the name of your State or Province?: Gia Lai
What is the two-letter country code?: VN
Is ... correct?: yes

Enter key password for <biblequiz>: [Enter để dùng cùng password keystore]
```

### 6b. Lấy SHA-1 Release Key

```bash
keytool -keystore biblequiz-release.keystore -list -v
# Nhập password → copy SHA1
```

### 6c. Tạo trên Google Console

1. **+ Create Credentials** → **OAuth client ID**
2. Application type: **Android**
3. Name: `BibleQuiz Android Release`
4. Package name: `com.biblequiz.app` (PHẢI GIỐNG debug)
5. SHA-1: paste SHA-1 từ release keystore
6. **Create**

### 6d. HOẶC dùng Google Play App Signing (recommend)

Nếu dùng Play App Signing (app mới tự bật):
1. Upload app lên Play Console lần đầu
2. Play Console → **Setup** → **App signing**
3. Copy **SHA-1 certificate fingerprint** từ trang này
4. Dùng SHA-1 đó tạo credential trên Google Console

```
Play App Signing:
  Bạn ký bằng: Upload Key (mất → tạo lại được)
  Google ký bằng: App Signing Key (Google giữ hộ → không mất)
  SHA-1 trên Google Console: dùng SHA-1 của App Signing Key (từ Play Console)
```

### Lưu ý Release Keystore:

```
⚠️ NẾU TỰ QUẢN LÝ KEY (không dùng Play App Signing):
   Backup biblequiz-release.keystore → 3 nơi:
   1. USB drive
   2. Cloud storage (encrypted)
   3. Password manager
   
   GHI LẠI password ở nơi an toàn
   
   MẤT KEY = MẤT APP VĨNH VIỄN
   (không thể update app trên Play Store)

✅ NẾU DÙNG PLAY APP SIGNING (recommend):
   Chỉ cần giữ Upload Key
   Mất Upload Key → reset qua Play Console
   Yên tâm hơn nhiều
```

---

## Bước 7: Config trong code

### Backend — application.yml

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}

biblequiz:
  auth:
    google:
      android-client-id: ${GOOGLE_ANDROID_CLIENT_ID}
      # ios-client-id: ${GOOGLE_IOS_CLIENT_ID}  # thêm sau
```

```bash
# .env (backend)
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com          # Web Client ID
GOOGLE_CLIENT_SECRET=GOCSPX-xyz789abc123                           # Web Client Secret
GOOGLE_ANDROID_CLIENT_ID=987654321-def.apps.googleusercontent.com  # Android Client ID
```

### Frontend Web — .env

```bash
# apps/web/.env
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com    # Web Client ID
# KHÔNG CÓ secret ở frontend
```

### React Native — config

```typescript
// src/config/auth.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin'

GoogleSignin.configure({
  webClientId: '123456789-abc.apps.googleusercontent.com',  // ← WEB Client ID
  // KHÔNG phải Android Client ID
  // Google Sign-In SDK cần Web Client ID để request ID Token
  // Android Client ID chỉ dùng ngầm bởi Google Services
  offlineAccess: false,
})
```

**Tại sao React Native dùng Web Client ID?**
```
App → Google SDK: "Tôi cần ID Token, audience là Web Client ID"
Google SDK → verify app qua Android Client ID (package + SHA-1) → OK
Google SDK → tạo ID Token với audience = Web Client ID
App → gửi ID Token cho Backend
Backend → verify token, check audience = Web Client ID → match!
```

---

## Bước 8: Test

### Test Web Login:
```
1. npm run dev (frontend)
2. Start backend
3. Click "Đăng nhập với Google"
4. Redirect → Google login → redirect back
5. Check: user created in DB, JWT returned
```

### Test Android Login:
```
1. Start emulator
2. npx expo run:android
3. Tap "Login with Google"
4. Google account picker popup
5. Select account
6. Check: POST /api/auth/mobile/google called, tokens returned
```

### Lỗi thường gặp:

| Lỗi | Nguyên nhân | Fix |
|-----|------------|-----|
| `redirect_uri_mismatch` | Redirect URI không khớp | Check URI trong Console vs backend — phải CHÍNH XÁC |
| `invalid_client` | Client ID/Secret sai | Check lại .env |
| `DEVELOPER_ERROR` (Android) | SHA-1 sai hoặc package name sai | Chạy lại keytool, check package name |
| `Sign in failed: 10` | SHA-1 debug không match | Tạo lại debug credential với SHA-1 đúng |
| `Sign in failed: 12500` | SHA-1 đúng nhưng Google Play Services cần update | Update Google Play Services trên emulator |
| `access_denied` | User không trong test users list | Thêm email vào OAuth consent screen → Test users |
| `org_internal` | App bị giới hạn organization | Đổi OAuth consent screen sang External |

---

## Checklist tổng hợp

```
Google Cloud Console:
  ✅ Project "BibleQuiz" created
  ✅ APIs enabled (Identity Services, People API)
  ✅ OAuth Consent Screen configured
  ✅ Test users added

Credentials:
  ✅ Web Application credential
     - Client ID → backend + frontend
     - Client Secret → backend only
     - Redirect URIs correct
  ✅ Android Debug credential  
     - Package name: com.biblequiz.app
     - SHA-1 from debug.keystore
  ⬜ Android Release credential (trước khi publish)
     - SHA-1 from release keystore hoặc Play App Signing
  ⬜ iOS credential (khi có Mac)

Code config:
  ✅ Backend .env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_ANDROID_CLIENT_ID
  ✅ Frontend .env: VITE_GOOGLE_CLIENT_ID  
  ✅ React Native: GoogleSignin.configure({ webClientId: ... })

Security:
  ✅ Client Secret KHÔNG ở frontend/git
  ✅ .env trong .gitignore
  ⬜ Release keystore backed up (nếu tự quản lý)

Testing:
  ✅ Web login works
  ✅ Android login works on emulator
  ⬜ Android login works on real device
  ⬜ Production redirect URIs added
```

---

## Tóm tắt nhanh — Ai dùng gì

```
                    Web          Web         Android      Android
                    Client ID    Secret      Client ID    SHA-1
                    
Backend (.env)      ✅           ✅          ✅           —
Frontend Web        ✅           ❌          —            —
React Native        ✅ (config)  ❌          (ngầm)       —
Google Console      —            —           —            ✅ (đăng ký)
```

**1 câu tóm gọn:** Web Client ID dùng ở mọi nơi. Web Secret chỉ ở backend. Android Client ID chỉ để Google verify app. SHA-1 chỉ để đăng ký trên Console.
