# BibleQuiz Mobile

React Native (Expo SDK 54) app cho Android + iOS. Cùng monorepo với `apps/web` (React) và `apps/api` (Spring Boot).

## Yêu cầu môi trường (lần đầu setup máy)

- **Node.js** 20+ và **pnpm** 9+
- **JDK 17** (Adoptium Temurin khuyến nghị) — Android Gradle Plugin yêu cầu
- **Android Studio** với SDK Platform API 34 (UpsideDownCake) + Google Play Intel x86_64 system image
- **Android emulator AVD** (Pixel 7, API 34) hoặc physical device bật USB debug
- Biến môi trường:
  ```powershell
  # Set persistent (chạy 1 lần)
  [Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
  $userPath = [Environment]::GetEnvironmentVariable("Path","User")
  [Environment]::SetEnvironmentVariable("Path", "$userPath;$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator", "User")
  # Restart shell sau khi set
  ```

## Tạo file `.env` (lần đầu setup project)

Mobile app đọc env vars qua `process.env.EXPO_PUBLIC_*`. Template có sẵn ở [`.env.example`](.env.example).

### Bước 1 — Copy template

```powershell
cd f:\git\biblequize\apps\mobile
Copy-Item .env.example .env
```

### Bước 2 — Edit `.env`

3 nhóm biến môi trường, mức bắt buộc khác nhau:

| Biến | Bắt buộc? | Giá trị mặc định | Ghi chú |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | Có (nếu test với BE local) | `https://be.forbible.org` (prod) | Android emulator: `http://10.0.2.2:8080`. iOS sim: `http://localhost:8080` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Chỉ khi test Google login | empty | Setup ở [Google Cloud Console](https://console.cloud.google.com/) — xem comment trong `.env.example` |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Chỉ EAS build standalone APK | empty | Package: `com.biblequiz.app`. SHA-1 từ `eas credentials` |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Chỉ EAS build iOS | empty | Bundle ID: `com.biblequiz.app` |
| `EXPO_PUBLIC_SENTRY_DSN` | Optional | empty → Sentry no-op | DSN từ Sentry project settings |
| `EXPO_PUBLIC_ENV` | Optional | `development` | Tag Sentry events. EAS profile sẽ override |

> **Nhanh nhất để chạy app:** chỉ cần `EXPO_PUBLIC_API_URL` (hoặc để mặc định prod BE). Các biến khác để trống → app vẫn chạy, chỉ một số feature (Google login, Sentry) sẽ no-op.

### Bước 3 — Restart Metro sau khi sửa `.env`

`.env` được đọc 1 lần khi Metro khởi động. Sửa rồi phải kill + restart:

```powershell
# Kill Metro
$ns = netstat -ano | Select-String ":8081.*LISTENING"
if ($ns -match '\s+(\d+)\s*$') { Stop-Process -Id $matches[1] -Force }

# Start lại
cd f:\git\biblequize\apps\mobile
npx expo start --clear
```

> File `.env` đã được `.gitignore` exclude — không commit. Chỉ commit `.env.example` (template).

## Quy trình thường ngày (dev mode, Fast Refresh)

> 95% trường hợp dùng workflow này. Edit code → save → app tự reload.

### 1. Khởi động emulator

```powershell
# List AVD đã có
emulator -list-avds
# Boot Pixel_7 (hoặc tên AVD của bạn)
emulator -avd Pixel_7 -no-snapshot-load
```

Hoặc mở Android Studio → Device Manager → bấm ▶ cạnh AVD.

### 2. Khởi động Metro bundler (Terminal 1, để cả ngày)

```powershell
cd f:\git\biblequize\apps\mobile
npx expo start
```

Khi Metro ready → log hiện `Waiting on http://localhost:8081`.

### 3. Lần đầu trong session — install APK + connect

```powershell
# Build debug APK + install + tự launch app
npx expo run:android
```

Lần đầu sẽ:
- `expo prebuild` → tạo `android/` folder
- Gradle build APK (~5-10 phút, cached lần sau)
- Install vào emulator + launch

### 4. Edit code → app tự update

```
Edit file trong apps/mobile/src/... → Ctrl+S
   ↓
Metro detect change → rebundle JS
   ↓
App trên emulator nhận hot update (Fast Refresh)
```

Force reload nếu Fast Refresh không bắt: bấm `R, R` trong dev menu (Ctrl+M trong emulator).

## Khi NÀO cần rebuild APK (không chỉ reload)

| Thay đổi | Action |
|---|---|
| Code JS/TS, style, component | Save → Fast Refresh tự reload |
| `metro.config.js`, `babel.config.js` | Kill Metro → `npx expo start --clear` |
| `polyfills.js` (Metro serializer polyfill) | Rebuild APK |
| `app.json` (plugins, permissions, package name) | `npx expo prebuild --clean && npx expo run:android` |
| Thêm/đổi/xóa native dep (lib có folder `android/`) | `npx expo run:android` |
| Sửa file trong `android/` folder trực tiếp | `cd android && ./gradlew installDebug` |

## Build APK release (chia sẻ test offline)

Debug APK **chỉ chạy được khi Metro cùng máy đang chạy**. Để share cho người khác hoặc test offline:

```powershell
cd f:\git\biblequize\apps\mobile
npx expo run:android --variant release
# Output: android\app\build\outputs\apk\release\app-release.apk
```

APK release có JS bundle baked-in, không cần Metro. Chậm hơn debug build ~50% (Hermes bytecode + R8 optimize).

Share APK:
```powershell
explorer.exe f:\git\biblequize\apps\mobile\android\app\build\outputs\apk\release\
# Copy file `app-release.apk` ra Desktop / Drive / Slack
# Người nhận: tap APK → cho phép "Unknown sources" → Install
```

## Build cloud cho beta tester (EAS)

Khi muốn ship cho tester nội bộ qua link tải, hoặc TestFlight/Play Store internal:

```powershell
cd f:\git\biblequize\apps\mobile
eas build --profile preview --platform android   # APK
eas build --profile preview --platform ios       # IPA (cần Apple Developer)
```

Chi tiết: [docs/dev/mobile-beta.md](../../docs/dev/mobile-beta.md).

## Test

```powershell
cd f:\git\biblequize\apps\mobile

# Unit test (Jest, chỉ pure logic — chưa có RN component test)
npm test                                    # tất cả
npm test -- src/logic/__tests__/scoring     # 1 file
npm test -- --watch                         # watch mode

# Type check (BẮT BUỘC trước commit)
npm run type-check
```

Test setup chi tiết: [docs/dev/testing.md](../../docs/dev/testing.md).

## Troubleshoot

### Emulator "offline" / không connect adb

```powershell
adb kill-server
adb start-server
adb devices
```

### AVD lock file conflict (boot fail)

```powershell
# Xóa lock files
Remove-Item "$env:USERPROFILE\.android\avd\Pixel_7.avd\*.lock" -Force -Recurse
# Boot lại
```

### App red screen "[runtime not ready]"

1. Xem stack trace trong red screen
2. Bấm `R, R` reload
3. Nếu vẫn lỗi → check `adb logcat | Select-String ReactNativeJS,TypeError,FATAL`
4. Nếu lỗi `SharedArrayBuffer`, `Cannot read property 'get'` → đã fix bằng Metro resolver hook + polyfill, xem [metro.config.js](metro.config.js)

### Metro port 8081 đã bị chiếm

```powershell
$ns = netstat -ano | Select-String ":8081.*LISTENING"
if ($ns -match '\s+(\d+)\s*$') { Stop-Process -Id $matches[1] -Force }
```

### Build fail sau khi đổi dep

```powershell
# Clean Gradle cache
cd android && ./gradlew clean && cd ..

# Regen android/ folder
npx expo prebuild --clean

# Nuclear: reinstall mọi thứ
Remove-Item -Recurse -Force node_modules, android, .expo
pnpm install
npx expo run:android
```

### Logcat xem JS error chi tiết

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

# Live stream chỉ JS logs
& $adb logcat ReactNativeJS:V ReactNative:V "*:S"

# Dump 1 lần, filter error
& $adb logcat -d | Select-String "ReactNativeJS","FATAL","JavascriptException"

# Clear buffer trước khi test
& $adb logcat -c
```

## Cấu trúc folder

```
apps/mobile/
├── App.tsx                    # Root component, NavigationContainer
├── index.ts                   # Entry point
├── polyfills.js               # Metro serializer polyfill (SharedArrayBuffer cho Hermes)
├── metro.config.js            # Metro bundler config (monorepo + resolver hook)
├── app.json                   # Expo config (name, plugins, permissions)
├── eas.json                   # EAS build profiles (dev/preview/production)
├── package.json
├── tsconfig.json
├── jest.config.js
├── src/
│   ├── api/                   # API client (axios + TanStack Query)
│   ├── components/            # Reusable RN components
│   ├── hooks/                 # Custom hooks (useStomp, useAuth, ...)
│   ├── logic/                 # Pure logic (scoring, tier, streaks)
│   │   └── __tests__/         # Jest tests (pure logic only)
│   ├── screens/               # Navigation screens
│   ├── store/                 # Zustand stores
│   ├── i18n/                  # Translations
│   └── ...
└── assets/                    # Icons, fonts, splash images
```

## Tham khảo

- [CLAUDE.md](../../CLAUDE.md) — project-wide rules
- [docs/dev/setup.md](../../docs/dev/setup.md) — full monorepo setup
- [docs/dev/mobile-beta.md](../../docs/dev/mobile-beta.md) — EAS beta workflow + manual QA checklist
- [docs/dev/testing.md](../../docs/dev/testing.md) — Quy trình test 3 tầng
- [docs/dev/dependencies.md](../../docs/dev/dependencies.md) — dependency policy
- [Expo SDK 54 docs](https://docs.expo.dev/)
- [React Native 0.81 docs](https://reactnative.dev/)
