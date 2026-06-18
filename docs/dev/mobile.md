# Mobile app (Capacitor) — dev & release reference

> The mobile app is the **web app (`apps/web`) wrapped with Capacitor 8** — one
> codebase, no separate React Native project. User pages only (admin is excluded
> from the mobile bundle). Android first; iOS later.

## TL;DR build

```bash
# from apps/web
pnpm run build:capacitor      # vite build --mode capacitor (.env.capacitor)
pnpm run cap:sync             # build:capacitor + cap sync (copy into android/)
pnpm run cap:run:android      # sync + cap run android (device/emulator)
```

**⚠️ Android build needs JDK 21** (Capacitor 8 / AGP). The Spring backend uses
JDK 17. Point Gradle at a JDK 21 (Android Studio bundles JBR 21):

```bash
JAVA_HOME="C:\Program Files\Android\Android Studio\jbr" ./gradlew assembleDebug
```

`android/local.properties` (gitignored) must hold `sdk.dir=…/Android/Sdk`.

## What is target-aware

Everything mobile-specific branches on `isCapacitor()`
(`src/platform/capacitor.ts`), driven by `VITE_TARGET=capacitor` in
`.env.capacitor`. On web builds the flag is unset → all mobile code paths are
dead and dynamic-imported, so the **web bundle and the 1300+ web tests are
untouched**.

| Concern | Web | Mobile (Capacitor) |
|---|---|---|
| API base | same-origin / proxy | absolute `https://be.quize.top` (`.env.capacitor`); `getApiBaseUrl()` throws if empty |
| CORS | browser CORS | `CapacitorHttp` native layer bypasses CORS |
| Auth | httpOnly refresh cookie | `/api/auth/mobile/{login,refresh,google}`, token-in-body |
| Refresh token | cookie | `@capacitor/preferences` (`mobileTokenStore.ts`) |
| Google login | OAuth redirect | native `@capgo/capacitor-social-login` → idToken → `/api/auth/mobile/google` |
| Back button | browser | `@capacitor/app` → React Router (`CapacitorBackButton.tsx`) |
| Haptics | `navigator.vibrate` | `@capacitor/haptics` (`nativeHaptics.ts`) |
| Admin | code-split, lazy | **dropped from bundle** (`AdminRoutes.tsx` + `VITE_TARGET` guard) |

Native shell setup (status bar, splash hide, keyboard) — `platform/initNative.ts`.

## App icon / splash

Source mark = gold open-book on `#11131e` (Sacred Modernist). Regenerate:

```bash
node scripts/gen-app-assets.mjs                 # SVG → PNG via sharp → assets/
npx @capacitor/assets generate --android        # → android res (icons+splash)
```

## Release checklist (manual — owner/account-gated)

### MOB-5b — Device smoke (needs device/emulator + running backend)
- Backend reachable at the `.env.capacitor` URL; CORS/`CapacitorHttp` OK.
- Verify: email login, **Google login**, play quiz, multiplayer (STOMP `wss`),
  hardware back, app backgrounding, no-network behavior.

### MOB-0a / Google — Google Cloud Console (needed before Google login works)
1. Create an **Android OAuth client**: package `org.forbible.app` + the signing
   **SHA-1** (debug: `keytool -list -v -keystore ~/.android/debug.keystore`;
   release: your upload keystore's SHA-1).
2. The plugin's `serverClientId` = the existing **Web** client id
   (`599482670828-…`, in `.env.capacitor`). Backend already verifies idToken
   against web + android client ids (`MobileAuthService`).
3. Optional: set env `GOOGLE_ANDROID_CLIENT_ID` on the backend.

### MOB-5c — Signing + Play Store
1. Create an upload keystore (keep it OUT of git):
   `keytool -genkey -v -keystore upload.jks -keyalg RSA -keysize 2048 -validity 9125 -alias upload`
2. Add a `signingConfig` to `android/app/build.gradle` reading from
   `keystore.properties` (gitignored) — do NOT commit keystore or passwords.
3. `JAVA_HOME=<jdk21> ./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`.
4. Upload AAB to Play Console; fill store listing (privacy URL `/privacy` exists).

### MOB-5d — iOS (needs macOS + Apple Developer)
`npx cap add ios` on a Mac; configure Google iOS client; archive in Xcode →
TestFlight.
