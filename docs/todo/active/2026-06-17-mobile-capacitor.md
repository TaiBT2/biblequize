# 2026-06-17 — Mobile app (Capacitor wrap web) — chỉ trang User

> **Source**: User request "làm bản mobile, chỉ trang user, không admin" (2026-06-17)
> **Scope**: Đóng gói `apps/web` (React+Vite) thành app Android (rồi iOS) bằng Capacitor. 1 codebase. KHÔNG động trang admin (loại khỏi bundle mobile).
> **Decisions (user-confirmed 2026-06-17)**:
> - D1 Google OAuth: **native Google Sign-In plugin → idToken → `POST /api/auth/mobile/google`** (backend đã có sẵn).
> - D2 OS: **Android trước, iOS sau**.
> - D3 Refresh token: **lưu trong body + `@capacitor/preferences`** (backend `/api/auth/mobile/*` đã trả token trong body, không cookie).
> - D4 Offline: **online-only** — có mạng mới chạy, không cache offline.

## Key findings (đã verify)
- App Expo cũ đã xóa sạch; `apps/` chỉ còn `api` + `web`.
- Backend **đã có** `MobileAuthController` (`/api/auth/mobile/login|refresh|google`) + `MobileAuthService` (verify GoogleIdToken, config `biblequiz.auth.google.android-client-id`) + `MobileAuthResponse` trả token trong body. `/api/auth/**` permitAll. → D1 & D3 backend gần như xong.
- Web đã có `MobileBottomTabs` + `MobileTopBar` + `AppLayout` responsive (Tailwind `md:`×464). UX shell mobile sẵn.
- `getApiBaseUrl()` rỗng ở prod = same-origin → **bắt buộc** set absolute trong build capacitor.
- Router = `BrowserRouter` (main.tsx:126). Admin gated `RequireAdmin` (main.tsx:195), 14 trang import sẵn.
- **3 thứ vỡ nếu wrap thẳng**: (1) Google redirect `window.location.href` (Login.tsx:47), (2) refresh-token httpOnly cookie cross-origin, (3) Android hardware back.

---

## Phase 0 — Pre-flight (chặn) — ✅ DONE 2026-06-17 (verify, no code change)
- MOB-0a Google config — **✅ Backend ready, no code change.**
  - Status: [x] DONE · **Spec strategy**: [x] (c)
  - Verified: `application.yml:71-72` `google.android-client-id: ${GOOGLE_ANDROID_CLIENT_ID:}` tồn tại. `MobileAuthService.verifyGoogleIdToken()` (line 118-132) set audience = **cả web client id + android client id** → idToken verify OK chỉ cần plugin native dùng `serverClientId` = web client id hiện có (`599482670828-...apps.googleusercontent.com`, đã ở `apps/web/.env`).
  - **Action items (external, Phase 2/5)**: (1) tạo Android OAuth client trong GCP với package `org.forbible.app` + SHA-1 fingerprint (bắt buộc để native sign-in chạy, tránh DEVELOPER_ERROR); (2) config plugin `serverClientId` = web client id; (3) optional set env `GOOGLE_ANDROID_CLIENT_ID` ở prod.
- MOB-0b CORS / reachability — **✅ Verified, cần 1 quyết định Phase 2.**
  - Status: [x] DONE · **Spec strategy**: [x] (c)
  - Verified: `/api/auth/mobile/**` reachable qua `/api/auth/**` permitAll (SecurityConfig:92). Mobile auth = **token in body, KHÔNG cookie** → không cần credentials. NHƯNG webview origin `https://localhost` → `https://be.quize.top` là cross-origin → CORS bị enforce. CORS hiện chỉ allow `cors.allowed-origins` (explicit, allowCredentials=true).
  - **Decision Phase 2**: (A) thêm `https://localhost` vào env `cors.allowed-origins`; **(B) khuyến nghị: dùng `CapacitorHttp` (native HTTP) → bypass CORS hoàn toàn**, không đụng backend. → chọn B; tắt `withCredentials` cho path mobile.
- MOB-0c Route whitelist — **✅ Done.**
  - Status: [x] DONE
  - Admin = 1 block sạch `main.tsx:195-211` + imports 34-47 → MOB-4a chỉ cần gate cả block sau `VITE_TARGET!=='capacitor'`. Trang user = phần còn lại. Loại khỏi mobile: `/home-khung-sang-preview` (dev preview, line 130), `/auth/callback` (OAuth web redirect — thừa khi dùng native Google). Không có admin leak nào khác.

## Phase 1 — Scaffold Capacitor — ✅ DONE 2026-06-18 (commit 325b5172)
> **Quyết định kỹ thuật**: Capacitor co-located **trong `apps/web`** (không phải `apps/mobile`) vì plugins được import từ `apps/web/src` → deps + config + `android/` phải cùng package. Capacitor **8.4**.
> **⚠️ Build requires JDK 21** (Cap8 AGP). Backend dùng JDK 17. Local build: `JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"` (JBR 21).
- MOB-1a Capacitor trong `apps/web` (appId `org.forbible.app`, webDir `dist`, androidScheme `https`, CapacitorHttp enabled).
  - Status: [x] DONE · **Spec strategy**: [x] (c)
- MOB-1b `.env.capacitor` (API/WS absolute) + scripts `build:capacitor` / `cap:sync` / `cap:android`.
  - Status: [x] DONE
- MOB-1c `cap add android` (7 plugins) + build debug APK (`app-debug.apk` 11MB, JDK21). Smoke emulator → Phase 5b.
  - Status: [x] DONE (APK built; device smoke deferred to MOB-5b)

## Phase 2 — Sửa blocker (target-aware: `isCapacitor()`) — ✅ DONE 2026-06-18
> Foundation: `src/platform/capacitor.ts` `isCapacitor()` (env flag `VITE_TARGET`). Mobile code dynamic-imported → tree-split, web bundle/tests không đổi. Test: `src/api/__tests__/mobileAuth.test.ts` (7 tests).
- MOB-2a API base guard: `getApiBaseUrl()` throw khi rỗng + target=capacitor.
  - Status: [x] DONE · Files: `api/config.ts`
- MOB-2b Hardware back: `CapacitorBackButton` (render trong BrowserRouter) → `@capacitor/app` backButton → `navigate(-1)`, exitApp ở root paths.
  - Status: [x] DONE · Files: `platform/CapacitorBackButton.tsx`, `main.tsx`
- MOB-2c Auth path mobile: `mobileLogin`/`mobileRefresh`/`mobileGoogle` → `/api/auth/mobile/*`; branch trong `authStore.checkAuth`/`logout` + `client.ts` interceptor 401.
  - Status: [x] DONE · Files: `api/mobileAuth.ts`, `authStore.ts`, `client.ts`
- MOB-2d Native Google Sign-In: `@capgo/capacitor-social-login` (Cap8-compat) → idToken → `mobileGoogle`. Login.tsx branch.
  - Status: [x] DONE · Files: `api/nativeGoogleAuth.ts`, `Login.tsx`
- MOB-2e Persist refresh token: `mobileTokenStore` (`@capacitor/preferences`), rotate trong mobileRefresh.
  - Status: [x] DONE · Files: `api/mobileTokenStore.ts`

## Phase 3 — Native shell polish
- MOB-3a Safe-area: `viewport-fit=cover` + `env(safe-area-inset-*)` cho TopBar/BottomTabs.
  - Status: [ ] TODO
- MOB-3b StatusBar + SplashScreen + app icon/launch (brand `#11131e`/gold).
  - Status: [ ] TODO
- MOB-3c Haptics native: `@capacitor/haptics` thay `navigator.vibrate` khi target=capacitor (`utils/haptics.ts`).
  - Status: [ ] TODO
- MOB-3d UX webview: chặn overscroll/pull-refresh, disable text-select, keyboard resize.
  - Status: [ ] TODO

## Phase 4 — Admin gating + responsive còn thiếu
- MOB-4a Loại admin khỏi bundle mobile (conditional route + lazy khi `VITE_TARGET!=='capacitor'`).
  - Status: [ ] TODO · Files: `main.tsx`
- MOB-4b Sweep responsive trang user chưa polish (Multiplayer/Room, Tournaments, QuizSet editor). 1 task/nhóm.
  - Status: [ ] TODO · **Spec strategy**: [x] (c)

## Phase 5 — Build / test / phát hành
- MOB-5a Regression Tầng 3 web (Vitest+Playwright+JUnit) ≥ baseline sau mọi sửa shared.
  - Status: [ ] TODO
- MOB-5b Smoke thiết bị Android thật: login (Google+email), quiz, multiplayer, back, mất mạng.
  - Status: [ ] TODO
- MOB-5c Signing + build AAB release; chuẩn bị Play Store (icon, screenshots, privacy `/privacy`).
  - Status: [ ] TODO
- MOB-5d (sau) `cap add ios` + TestFlight (cần Mac + Apple Dev).
  - Status: [ ] TODO

## Risks
- 🔴 CORS/cookie cross-origin → đã né bằng `/api/auth/mobile/*` (token body). Verify MOB-0b.
- 🟡 STOMP `wss` trong WebView → test sớm MOB-1c.
- 🟡 Google native plugin = dependency mới → **hỏi user trước khi add** (CLAUDE.md rule).
