# Prompt fix 15 issues từ Code Review

Copy toàn bộ phần dưới đây paste vào Claude Code:

---

## PROMPT

Fix 15 issues từ code review đã được xác nhận 15/15 ĐÚNG. Tuân thủ CLAUDE.md — chia nhỏ tasks vào TODO.md, làm từng task, test, commit.

**QUAN TRỌNG:** Đọc TODO.md trước. Nếu có task dở thì hoàn thành trước. Sau đó ghi tất cả tasks bên dưới vào TODO.md rồi bắt đầu làm từng task.

---

### CRITICAL FIXES (Task 1-5)

#### Task 1: Fix duplicate auth interceptor trong client.ts
- File: `apps/web/src/api/client.ts`
- Vấn đề: `addAuthInterceptor(api)` (line ~30) đã thêm Bearer header, sau đó block `api.interceptors.request.use` (line ~33-50) lại thêm lần nữa. Mỗi request bị set Authorization 2 lần.
- Fix: Xóa block `api.interceptors.request.use` thứ hai (cái có debug logging). Di chuyển debug logging vào trong `addAuthInterceptor` factory nếu cần giữ lại.
- Test: `apps/web/src/api/__tests__/tokenStore.test.ts` + verify không có regression
- Commit: `fix: remove duplicate auth interceptor in api client`

#### Task 2: Tighten CSP trong vite.config.ts
- File: `apps/web/vite.config.ts`
- Vấn đề: CSP có `'unsafe-inline'` và `'unsafe-eval'` trong script-src — vô hiệu hóa XSS protection.
- Fix: 
  - Xóa `'unsafe-eval'` khỏi script-src hoàn toàn
  - Giữ `'unsafe-inline'` cho style-src (Tailwind cần) nhưng xóa khỏi script-src
  - CSP mới: `"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*;"`
  - Áp dụng cho cả `server.headers` và `preview.headers`
  - Sau khi sửa, chạy `npm run dev` verify app vẫn hoạt động (Vite + React cần check)
- Commit: `fix: tighten CSP by removing unsafe-inline and unsafe-eval from script-src`

#### Task 3: Fix production .env
- File: `apps/web/.env.production`
- Vấn đề: `VITE_API_BASE_URL=http://localhost:8080` và `VITE_WS_URL=ws://localhost:8080/ws` — sẽ fail khi deploy.
- Fix: Đổi thành empty string hoặc placeholder rõ ràng:
  ```
  VITE_API_BASE_URL=
  VITE_WS_URL=
  ```
  Lý do: `config.ts` đã có fallback logic — nếu empty string thì dùng same-origin (Vite proxy hoặc production reverse proxy). Thêm comment giải thích:
  ```
  # Leave empty to use same-origin (reverse proxy handles routing)
  # Set explicit URL only if API is on a different domain
  VITE_API_BASE_URL=
  VITE_WS_URL=
  ```
- Commit: `fix: remove hardcoded localhost from production env`

#### Task 4: Thêm JWT auth cho useWebSocket
- File: `apps/web/src/hooks/useWebSocket.ts`
- Vấn đề: Raw WebSocket không gửi JWT token, trong khi `useStomp.ts` gửi Bearer trong connectHeaders.
- Fix: Thêm token vào WebSocket URL dưới dạng query parameter (WebSocket API không hỗ trợ custom headers):
  ```typescript
  import { getAccessToken } from '../api/tokenStore';
  
  // Trong connect():
  const token = getAccessToken();
  const wsUrlWithAuth = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;
  const newSocket = new WebSocket(wsUrlWithAuth);
  ```
  **LƯU Ý:** Cần kiểm tra backend có đọc token từ query param không. Nếu backend chỉ đọc từ header, thì cần sửa backend `SecurityConfig` hoặc WebSocket handshake handler. Kiểm tra trước, nếu backend chưa hỗ trợ thì ghi TODO riêng cho backend.
- Đồng thời fix dependency array (Issue 9):
  ```typescript
  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, [url]); // Thêm url vào dependency
  ```
- Test: `apps/web/src/pages/__tests__/RoomLobby.test.tsx`, `apps/web/src/pages/__tests__/RoomQuiz.test.tsx`
- Commit: `fix: add JWT auth to useWebSocket + fix stale connection on url change`

#### Task 5: Thay thế localStorage monkeypatch
- File: `apps/web/src/utils/localStorageClearDetector.ts`
- Vấn đề: Override `localStorage.clear()` và `.removeItem()`, polling 2 giây không cleanup.
- Fix: Viết lại hoàn toàn — KHÔNG override native APIs:
  ```typescript
  // Detect cross-tab localStorage changes via native 'storage' event
  // For same-tab: use explicit function calls instead of monkeypatching
  
  export function initStorageSync() {
    // Cross-tab detection (native, no monkeypatch)
    window.addEventListener('storage', (e) => {
      if (e.key === 'rankedSnapshot' || e.key === 'rankedProgress' || e.key === null) {
        window.dispatchEvent(new CustomEvent('rankedDataCleared', {
          detail: { method: 'cross-tab', key: e.key }
        }));
      }
    });
  }
  
  // Call this explicitly when clearing ranked data (same-tab)
  export function clearRankedData() {
    localStorage.removeItem('rankedSnapshot');
    localStorage.removeItem('rankedProgress');
    localStorage.removeItem('rankedStatus');
    window.dispatchEvent(new CustomEvent('rankedDataCleared', {
      detail: { method: 'explicit' }
    }));
  }
  ```
  - Cập nhật `main.tsx`: thay `import './utils/localStorageClearDetector'` bằng `import { initStorageSync } from './utils/localStorageClearDetector'; initStorageSync();`
  - Cập nhật `authStore.ts`: thay `window.dispatchEvent(new CustomEvent('localStorageCleared'))` bằng import + gọi explicit function hoặc dispatch event tên mới `rankedDataCleared`
  - Tìm tất cả listeners `localStorageCleared` trong codebase và đổi tên thành `rankedDataCleared`
  - **Đổi event name** cũng fix Issue 12 (misleading event name)
- Test: Tìm test liên quan đến localStorage/ranked sync, chạy full regression
- Commit: `fix: replace localStorage monkeypatch with native storage event + explicit calls`

---

### MEDIUM FIXES (Task 6-10)

#### Task 6: Fix window.location.href redirect trong client.ts  
- File: `apps/web/src/api/client.ts`
- Vấn đề: Dùng `window.location.href = '/login'` và xóa localStorage trực tiếp thay vì dùng authStore.
- Fix: 
  - Thay `window.location.href = '/login'` bằng cách dispatch custom event:
    ```typescript
    window.dispatchEvent(new CustomEvent('auth:session-expired'))
    ```
  - Trong `main.tsx` hoặc `AppLayout.tsx`, listen event này và dùng React Router navigate
  - Xóa 3 dòng `localStorage.removeItem(...)` — thay bằng gọi qua event để authStore.logout() xử lý
- Commit: `fix: use event-based redirect instead of window.location.href in api client`

#### Task 7: Normalize role check trong RequireAdmin.tsx
- File: `apps/web/src/contexts/RequireAdmin.tsx`
- Vấn đề: Check cả `'CONTENT_MOD'` lẫn `'content_mod'`
- Fix: Normalize role to uppercase khi nhận từ backend:
  ```typescript
  const userRole = user?.role?.toUpperCase();
  const isContentMod = userRole === 'CONTENT_MOD';
  ```
  Cũng normalize trong `authStore.ts` login function:
  ```typescript
  role: tokens.role?.toUpperCase()
  ```
- Commit: `fix: normalize user role to uppercase consistently`

#### Task 8: Fix PLAYER_UNREADY handler trong useWebSocket.ts
- File: `apps/web/src/hooks/useWebSocket.ts`
- Vấn đề: `PLAYER_UNREADY` gọi `onPlayerReady` — không phân biệt được.
- Fix: Thêm `onPlayerUnready` callback vào interface và dispatch riêng:
  ```typescript
  // Trong UseWebSocketProps interface:
  onPlayerUnready?: (data: PlayerReadyData) => void;
  
  // Trong switch case:
  case MESSAGE_TYPES.PLAYER_UNREADY:
    onPlayerUnready?.(message.data);
    break;
  ```
  Kiểm tra các component đang dùng useWebSocket có cần handle PLAYER_UNREADY riêng không.
- Commit: `fix: add separate onPlayerUnready callback in useWebSocket`

#### Task 9: Fix dynamic import trong AuthCallback.tsx
- File: `apps/web/src/pages/AuthCallback.tsx`
- Vấn đề: `await import('../api/client')` trong useEffect thay vì top-level import.
- Fix: Đổi thành static import:
  ```typescript
  import { api } from '../api/client';
  ```
  Xóa `const { api } = await import('../api/client');` trong useEffect.
- Commit: `fix: use static import for api client in AuthCallback`

#### Task 10: i18n cho error messages trong client.ts
- File: `apps/web/src/api/client.ts`
- Vấn đề: `error.userMessage` hardcoded tiếng Việt, bypass i18n.
- Fix: Import i18n instance và dùng translation keys:
  ```typescript
  import i18n from '../i18n';
  
  // Trong error handler:
  error.userMessage = i18n.t('errors.networkError');     // thay cho 'Không thể kết nối server...'
  error.userMessage = i18n.t('errors.sessionExpired');   // thay cho 'Phiên đăng nhập đã hết hạn...'
  error.userMessage = i18n.t('errors.forbidden');        // thay cho 'Bạn không có quyền...'
  error.userMessage = i18n.t('errors.notFound');         // thay cho 'Nội dung không tìm thấy'
  error.userMessage = i18n.t('errors.tooManyRequests');  // thay cho 'Bạn thao tác quá nhanh...'
  error.userMessage = i18n.t('errors.serverError');      // thay cho 'Lỗi hệ thống...'
  error.userMessage = i18n.t('errors.generic');          // thay cho 'Có lỗi xảy ra...'
  ```
  Thêm translation keys vào cả 2 file i18n (vi + en).
- Commit: `fix: internationalize error messages in api client`

---

### LOW / CLEANUP (Task 11-13)

#### Task 11: Fix type safety — xóa `as any`
- Files: `apps/web/src/pages/RoomQuiz.tsx`, `apps/web/src/pages/Achievements.tsx`
- Fix RoomQuiz.tsx: Tạo interface cho location.state:
  ```typescript
  interface RoomQuizState { roomId: string; roomName: string; /* ... */ }
  const state = location.state as RoomQuizState;
  ```
- Fix Achievements.tsx: Type stats object thay vì `useState<any>({})`
- Commit: `fix: replace unsafe any casts with proper types`

#### Task 12: Thêm error UI cho Leaderboard + GroupAnalytics
- Files: `apps/web/src/pages/Leaderboard.tsx`, `apps/web/src/pages/GroupAnalytics.tsx`  
- Thêm error state UI khi useQuery fails (error message + retry button)
- GroupAnalytics: flag mock data rõ ràng hoặc replace với real API calls
- Commit: `fix: add error UI for Leaderboard and GroupAnalytics`

#### Task 13: Full regression
- Chạy đủ 3 tầng test theo CLAUDE.md:
  ```bash
  cd apps/web && npx vitest run                    # FE unit
  cd apps/web && npx playwright test               # FE e2e  
  cd apps/api && ./mvnw test -Dtest="com.biblequiz.api.**,com.biblequiz.service.**"  # BE
  ```
- Đảm bảo số test >= baseline (518)
- Không có test bị skip/disabled
- Nếu có regression → DỪNG → fix → chạy lại

---

### Thứ tự thực hiện:
1. Đọc TODO.md → ghi tất cả 13 tasks vào
2. Task 1 → test → commit
3. Task 2 → test → commit  
4. Task 3 → commit (no code test needed)
5. Task 4 → test → commit
6. Task 5 → test → commit
7. Task 6 → test → commit
8. Task 7 → test → commit
9. Task 8 → test → commit
10. Task 9 → test → commit
11. Task 10 → test → commit
12. Task 11 → test → commit
13. Task 12 → test → commit
14. Task 13: Full regression → verify tất cả pass
