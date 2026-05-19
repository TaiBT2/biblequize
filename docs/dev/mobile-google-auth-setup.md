# Mobile Google Sign-In Setup

> Hướng dẫn config OAuth credentials cho Google login mobile. Cần làm 1 lần per environment (dev / preview / production).

## Pre-flight

- App bundle IDs đã set trong [`apps/mobile/app.json`](../../apps/mobile/app.json):
  - iOS: `com.biblequiz.app`
  - Android: `com.biblequiz.app`
  - URL scheme: `biblequiz`
- BE endpoint `/api/auth/mobile/google` accepts `{ idToken, email, name, picture }` → returns `{ accessToken, refreshToken, id, name, email, avatar, role }` (xem [useGoogleAuth.ts](../../apps/mobile/src/hooks/useGoogleAuth.ts))

## 1. Tạo Google Cloud project

1. https://console.cloud.google.com → New Project → name "BibleQuiz Mobile" (hoặc reuse project hiện tại)
2. APIs & Services → Enabled APIs → "Google+ API" hoặc "People API" (cho userinfo endpoint)
3. APIs & Services → OAuth consent screen:
   - User type: External
   - App name: BibleQuiz
   - Support email: support@forbible.org
   - Developer email: cùng
   - Authorized domains: `forbible.org`
   - Scopes: `email`, `profile`, `openid` (default)
   - Test users: thêm email tester nếu app chưa published

## 2. Tạo 3 OAuth Client IDs

APIs & Services → Credentials → **+ CREATE CREDENTIALS → OAuth client ID**

### Client #1: Web application (bắt buộc)

- Application type: **Web application**
- Name: `BibleQuiz Mobile - Web`
- Authorized JavaScript origins: (để trống — không cần cho mobile flow)
- Authorized redirect URIs:
  - `https://auth.expo.io/@your-expo-username/biblequiz` (Expo Go dev, replace với username thật)
  - `https://be.forbible.org/api/auth/callback` (backend verify, nếu BE dùng web flow)

Sau khi save → copy Client ID → paste vào `.env`:
```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
```

### Client #2: Android (cho EAS Build APK)

- Application type: **Android**
- Name: `BibleQuiz Mobile - Android`
- Package name: `com.biblequiz.app`
- SHA-1 certificate fingerprint: lấy từ EAS:
  ```bash
  cd apps/mobile
  eas credentials
  # Chọn: Android → production → Keystore
  # Copy SHA-1 (format AA:BB:CC:...)
  ```
- (Optional) Thêm SHA-1 của dev keystore nếu test local APK

Save → copy Client ID → paste vào `.env`:
```bash
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=1234567890-xyz...apps.googleusercontent.com
```

### Client #3: iOS (cho EAS Build IPA / TestFlight)

- Application type: **iOS**
- Name: `BibleQuiz Mobile - iOS`
- Bundle ID: `com.biblequiz.app`

Save → copy Client ID → paste vào `.env`:
```bash
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=1234567890-def...apps.googleusercontent.com
```

iOS thêm bước: download `GoogleService-Info.plist` nếu dùng `@react-native-google-signin/google-signin` (KHÔNG cần cho `expo-auth-session` flow hiện tại).

## 3. Backend endpoint verify

BE `/api/auth/mobile/google` cần verify Google ID token. Set Spring config:

```yaml
google:
  client-ids:
    - ${GOOGLE_WEB_CLIENT_ID}      # Web client ID (audience cho token verify)
    - ${GOOGLE_ANDROID_CLIENT_ID}  # nếu tokens issued bằng Android client
    - ${GOOGLE_IOS_CLIENT_ID}
```

(Chi tiết theo `apps/api/.../GoogleAuthService.java` — verify khi BE setup.)

## 4. Test flow

### Expo Go (dev — chỉ cần WEB_CLIENT_ID)

```bash
cd apps/mobile
cp .env.example .env
# Edit .env, fill EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
pnpm start
# Scan QR với Expo Go → tap "Đăng nhập với Google" → browser OAuth flow → return app
```

**Note:** Expo Go dùng auth proxy `auth.expo.io/@username/slug` → redirect URI phải match trong Web Client #1.

### EAS Preview Build (real Android/iOS — cần đủ 3 client IDs)

```bash
# eas.json đã có preview profile (S2-2)
# .env values get baked vào build từ EAS secrets hoặc local .env
eas build --profile preview --platform android
# Install APK → tap Google Sign-In → native browser → return app
```

### Production (S7)

- Update OAuth consent screen → "Publish app" → status External + published (không cần Google verification trừ khi cần `userinfo.email` scope sensitive)
- EAS secrets: `eas secret:create --scope project EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "..."` (cho mỗi var)

## 5. Common errors

| Error | Fix |
|---|---|
| `redirect_uri_mismatch` | Add `https://auth.expo.io/@username/slug` vào Web client redirect URIs |
| `invalid_client` | Client ID sai env var (web vs android vs ios) — confirm bundleID/package match |
| `Native module RNGoogleSignin not found` | Đang import sai package — phải dùng `expo-auth-session/providers/google` chứ không phải `@react-native-google-signin` |
| Backend `IdToken invalid` | BE `audience` config thiếu Client ID đang dùng → add 3 client IDs vào allowed audiences |
| iOS works dev, fails standalone | URL scheme `biblequiz` chưa match reverse-DNS của iOS Client ID → check Info.plist generated bởi EAS |

## 6. Security notes

- 3 client IDs là PUBLIC (build vào app bundle, không secret) — KHÔNG có "client secret" cho native client types
- ID token verification BẮT BUỘC ở backend — không trust raw email từ FE
- Sentry mobile (S2-3) sẽ catch crash khi Google flow fail → check `EXPO_PUBLIC_SENTRY_DSN` set cho prod build

## References

- expo-auth-session Google provider: https://docs.expo.dev/guides/google-authentication/
- Mobile beta workflow: [`mobile-beta.md`](./mobile-beta.md)
- Roadmap S2 (where Google flow shipped): [`../todo/active/2026-05-19-mobile-rewrite-s2-beta-internal.md`](../todo/active/2026-05-19-mobile-rewrite-s2-beta-internal.md)
