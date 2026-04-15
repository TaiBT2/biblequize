# W-M01 — Auth & Onboarding (L2 Happy Path)

**Routes:** `/login`, `/register`, `/onboarding`, `/onboarding/try`, `/auth/callback`
**Spec ref:** SPEC_USER §2, §14.3
**Module priority:** Tier 3 (L1 đã deep với 9 cases, L2 focus: token refresh + session expire + OAuth callback)

---

## API Overview

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/register` | Email/password registration |
| `POST /api/auth/login` | Email/password login |
| `POST /api/auth/refresh` | Refresh access token via httpOnly cookie |
| `POST /api/auth/logout` | Clear refresh cookie + invalidate |
| `POST /api/auth/exchange` | OAuth2 exchange (Google) |
| `GET /api/auth/oauth/success` | OAuth callback handler |

**Auth model**:
- Access token: **in-memory** trong frontend (không lưu localStorage/cookie JS-accessible)
- Refresh token: **httpOnly cookie**, path `/api/auth/refresh`, secure in prod
- API calls qua axios với `withCredentials: true`

---

## W-M01-L2-001 — Register new user → success → auto-login → redirect to /onboarding

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: no auth (guest)
**Tags**: @happy-path @auth @critical @write @serial

**Setup**:
- Ephemeral email: `e2e-register-{timestamp}@dev.local`
- Cleanup: DELETE user after test

**Actions**:
1. `page.goto('/login')`
2. Click "Đăng ký" link → `/register`
3. Fill email, password, confirmPassword, name
4. Submit

**Assertions** (UI):
- `expect(page).toHaveURL(/\/onboarding|\//)` (after auto-login)
- User avatar visible trong app layout

**API Verification**:
- POST `/api/auth/register` → 201 với `{ id, email, name, role, accessToken }`
- Refresh token cookie set (httpOnly, verify via response headers)
- `GET /api/me` với new token → returns registered user

**Cleanup**:
- `DELETE /api/admin/test/users/{userId}` hoặc `POST /api/admin/seed/test-data` teardown reset

**Notes**:
- [NEEDS ENDPOINT]: `DELETE /api/admin/test/users/{id}` — clean ephemeral test users
- Ephemeral user pattern cho parallel-safe

---

## W-M01-L2-002 — Login success → access token stored → GET /api/me returns user

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: no auth (guest)
**Tags**: @happy-path @auth @critical @write @serial

**Actions**:
1. `page.goto('/login')`
2. Fill `test3@dev.local` / `Test@123456`
3. Click submit

**Assertions** (UI):
- Redirect to `/` (home)
- User avatar visible
- `home-user-name` contains "Test Tier 3"

**API Verification**:
- POST `/api/auth/login` → 200 với `{ accessToken, name, email, avatar, role }`
- Refresh cookie set
- Immediate `GET /api/me` succeeds
- `accessToken` được frontend set vào `api/client.ts` memory state

**Notes**:
- L1-001 đã cover basic UI. L2 verify API contract + token storage behavior

---

## W-M01-L2-003 — Login wrong password → 401 with error message

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: no auth
**Tags**: @happy-path @auth @critical @write @serial

**Actions**:
1. `page.goto('/login')`
2. Fill `test3@dev.local` / `wrong_password`
3. Submit

**Assertions** (UI):
- URL stays `/login`
- `expect(page.getByTestId('login-error-msg')).toBeVisible()`
- Error message contains `/invalid|incorrect|sai/i`

**API Verification**:
- POST `/api/auth/login` → 401
- Response body: `{ error: "..." }`
- NO refresh cookie set

---

## W-M01-L2-004 — Refresh token flow: expire access token → auto-refresh → request retries successfully

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @auth @critical @write @serial

**Setup**:
- Login → have refresh cookie

**Actions**:
1. Manually clear in-memory access token (via `page.evaluate` hoặc interceptor)
2. Navigate to `/` → triggers `GET /api/me`
3. Observe: axios interceptor fires `POST /api/auth/refresh`
4. Original `GET /api/me` retries with new token

**API Verification**:
- Network trace:
  - `GET /api/me` → 401 (initial)
  - `POST /api/auth/refresh` → 200 với new accessToken
  - `GET /api/me` retry → 200
- User stays logged in, no redirect to /login

**Notes**:
- Axios interceptor logic ở [api/client.ts](apps/web/src/api/client.ts)
- Critical flow — fail ở đây user bị kick out

---

## W-M01-L2-005 — Refresh token expired/invalid → redirect to /login

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @auth @critical @write @serial

**Setup**:
- Login successfully
- Manually clear refresh cookie qua `page.context().clearCookies()`

**Actions**:
1. Clear in-memory access token
2. Navigate to `/` → `GET /api/me` fails
3. Axios fires `POST /api/auth/refresh` → 401 (no cookie)
4. Interceptor redirects to `/login`

**API Verification**:
- `POST /api/auth/refresh` → 401
- Final URL: `/login`
- In-memory auth state cleared (verify via zustand store `useAuth().user === null`)

---

## W-M01-L2-006 — Logout → refresh cookie cleared → subsequent /api/me → 401

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @auth @critical @write @serial

**Actions**:
1. Login
2. Click logout button (in app layout / profile menu)
3. Navigate to `/`

**Assertions** (UI):
- Redirect to `/login`
- User not visible trong header

**API Verification**:
- `POST /api/auth/logout` → 200
- Response: `Set-Cookie` expire refresh token
- `page.context().cookies()` → no refresh token cookie
- Subsequent `GET /api/me` → 401

**Notes**:
- [NEEDS TESTID: logout-btn]
- Zustand `authStore.logout()` clears in-memory state

---

## W-M01-L2-007 — OAuth callback: /auth/callback với valid code → exchange → login success

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: no auth
**Tags**: @happy-path @auth @oauth @write @serial

**Setup**:
- **[BLOCKED - PARTIAL]**: Full OAuth flow cần Google redirect — hard to automate
- Alternative: Mock OAuth callback qua test admin endpoint nếu có

**Actions**:
1. Navigate to `/auth/callback?code=<test-oauth-code>&state=<state>`

**API Verification**:
- POST `/api/auth/exchange` với body `{ code, state }`
- Response: valid user + accessToken + refresh cookie
- Final URL: `/` home

**Notes**:
- [BLOCKED]: OAuth test realistic cần Google test account — defer hoặc mock
- Alternative: Test `oauth/success` page render if OAuth callback params present

---

## W-M01-L2-008 — Register with existing email → 409 Conflict

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: no auth
**Tags**: @happy-path @auth @write @serial

**Actions**:
1. `POST /api/auth/register` với body:
   ```json
   { "email": "test3@dev.local", "password": "...", "name": "..." }
   ```

**API Verification**:
- Response 409 Conflict (hoặc 400 tùy implementation)
- Response: `{ error: "Email already registered" }`

---

## NEEDS TESTID Summary (W-M01 L2)

| Element | Suggested testid | File |
|---------|-----------------|------|
| Login error message | `login-error-msg` | pages/Login.tsx |
| Logout button | `logout-btn` | layouts/AppLayout.tsx |
| Register form name input | `register-name-input` | pages/Register.tsx |
| Register submit btn | `register-submit-btn` | pages/Register.tsx |

---

## NOT IMPLEMENTED / BLOCKERS

| # | Issue | Impact |
|---|-------|--------|
| 1 | OAuth full flow automation | L2-007 blocked or mocked |
| 2 | DELETE test user endpoint | L2-001 ephemeral cleanup |

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 6s |
| L2-002 | 4s |
| L2-003 | 4s |
| L2-004 | 6s |
| L2-005 | 5s |
| L2-006 | 5s |
| L2-007 | 6s ⚠️ blocked |
| L2-008 | 4s |
| **Total** | **~40s** |

---

## Summary

- **8 cases** (matches estimate 8)
- **P0**: 6 | **P1**: 2
- **BLOCKED**: 1 (OAuth)
- **Runtime**: ~40s serial
