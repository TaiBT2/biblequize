# Prompt để Claude Code xác nhận Code Review

Paste prompt bên dưới vào Claude Code:

---

## PROMPT

Đọc các file sau và xác nhận từng issue bên dưới là ĐÚNG hay SAI. Với mỗi issue, trích dẫn dòng code cụ thể làm bằng chứng. Nếu issue sai, giải thích tại sao.

### Files cần đọc:
1. `apps/web/src/api/client.ts`
2. `apps/web/src/api/config.ts`
3. `apps/web/src/api/tokenStore.ts`
4. `apps/web/src/store/authStore.ts`
5. `apps/web/src/hooks/useWebSocket.ts`
6. `apps/web/src/hooks/useStomp.ts`
7. `apps/web/src/contexts/RequireAuth.tsx`
8. `apps/web/src/contexts/RequireAdmin.tsx`
9. `apps/web/src/pages/AuthCallback.tsx`
10. `apps/web/src/utils/localStorageClearDetector.ts`
11. `apps/web/vite.config.ts`
12. `apps/web/.env.production`
13. `apps/web/src/main.tsx`
14. `apps/web/src/pages/RoomQuiz.tsx`
15. `apps/web/src/pages/Leaderboard.tsx`
16. `apps/web/src/pages/Achievements.tsx`
17. `apps/web/src/pages/GroupAnalytics.tsx`
18. `apps/web/src/pages/TournamentMatch.tsx`
19. `apps/web/src/components/ui/SearchableSelect.tsx`
20. `apps/web/src/components/ShareCard.tsx`

### Danh sách issues cần xác nhận:

#### CRITICAL (5 issues)

**Issue 1: Duplicate auth interceptor trong client.ts**
- Claim: `addAuthInterceptor(api)` thêm Bearer header, sau đó `api.interceptors.request.use` lại thêm lần nữa. Mỗi request bị set Authorization header 2 lần.
- Kiểm tra: Đọc client.ts, xác nhận có 2 chỗ gắn interceptor cho `api` instance không?

**Issue 2: CSP cho phép unsafe-inline và unsafe-eval trong vite.config.ts**
- Claim: Content-Security-Policy có `unsafe-inline` và `unsafe-eval` trong script-src, vô hiệu hóa XSS protection.
- Kiểm tra: Đọc vite.config.ts, tìm CSP header, xác nhận có unsafe-inline/unsafe-eval không?

**Issue 3: Production .env vẫn trỏ localhost:8080**
- Claim: `.env.production` có VITE_API_BASE_URL=http://localhost:8080 — sẽ fail khi deploy thật.
- Kiểm tra: Đọc `.env.production`, xác nhận URL có phải localhost không?

**Issue 4: useWebSocket không có JWT authentication**
- Claim: `useWebSocket.ts` mở raw WebSocket không gửi token, trong khi `useStomp.ts` gửi Bearer token trong connectHeaders.
- Kiểm tra: So sánh 2 file, xác nhận useWebSocket thiếu auth và useStomp có auth?

**Issue 5: Monkeypatch localStorage.clear() và .removeItem()**
- Claim: `localStorageClearDetector.ts` override native browser APIs `localStorage.clear` và `localStorage.removeItem`, kèm polling 2 giây không có cleanup.
- Kiểm tra: Đọc file, xác nhận có override native methods và setInterval không clearInterval không?

#### MEDIUM (10 issues)

**Issue 6: window.location.href = '/login' trong error handler**
- Claim: client.ts dùng `window.location.href` thay vì React Router, bypass SPA state. Cũng xóa localStorage trực tiếp thay vì gọi authStore.logout().
- Kiểm tra: Tìm window.location.href trong client.ts, xác nhận nó có trong response interceptor không?

**Issue 7: Role check case-insensitive trong RequireAdmin.tsx**
- Claim: Check cả `'CONTENT_MOD'` (uppercase) lẫn `'content_mod'` (lowercase) thay vì normalize ở backend.
- Kiểm tra: Đọc RequireAdmin.tsx, tìm role check logic.

**Issue 8: PLAYER_UNREADY gọi onPlayerReady**
- Claim: Trong useWebSocket.ts, case PLAYER_UNREADY dispatch đến `onPlayerReady` handler, không phân biệt được 2 events.
- Kiểm tra: Đọc switch case trong useWebSocket.ts, xác nhận PLAYER_UNREADY và PLAYER_READY gọi cùng handler?

**Issue 9: useEffect dependency array rỗng trong useWebSocket**
- Claim: `useEffect(connect, [])` không re-run khi `url` prop thay đổi, gây stale WebSocket connections.
- Kiểm tra: Đọc useEffect cuối file useWebSocket.ts, xác nhận dependency array.

**Issue 10: Dynamic import() trong AuthCallback useEffect**
- Claim: `await import('../api/client')` trong useEffect thay vì import ở đầu file.
- Kiểm tra: Đọc AuthCallback.tsx, tìm dynamic import.

**Issue 11: Nhiều setTimeout cho navigation trong AuthCallback**
- Claim: Dùng setTimeout 1.5-3 giây trước khi redirect, UX confusing.
- Kiểm tra: Đếm số setTimeout calls trong AuthCallback.tsx.

**Issue 12: Dispatch 'localStorageCleared' event khi login**
- Claim: authStore.ts login() dispatch `new CustomEvent('localStorageCleared')` — misleading event name.
- Kiểm tra: Đọc login function trong authStore.ts, tìm dispatchEvent.

**Issue 13: checkAuth() không được await trước render**
- Claim: main.tsx gọi `useAuthStore.getState().checkAuth()` synchronously, auth state chưa ready khi render.
- Kiểm tra: Đọc main.tsx, xác nhận checkAuth() có await không.

**Issue 14: Error messages hardcoded tiếng Việt trong client.ts**
- Claim: error.userMessage có Vietnamese text, bypass i18n system.
- Kiểm tra: Tìm userMessage assignments trong client.ts, xác nhận có text tiếng Việt không.

**Issue 15: location.state as any trong RoomQuiz.tsx**
- Claim: Dùng `(location.state as any)` thay vì typed interface.
- Kiểm tra: Tìm `as any` trong RoomQuiz.tsx.

### Format output yêu cầu:

Với mỗi issue, trả lời theo format:

```
### Issue [number]: [tên]
- Verdict: ✅ ĐÚNG / ❌ SAI / ⚠️ ĐÚNG MỘT PHẦN
- Evidence: [trích dẫn dòng code cụ thể]
- Giải thích: [nếu SAI hoặc ĐÚNG MỘT PHẦN, giải thích chi tiết]
```

Cuối cùng, tổng kết: bao nhiêu issue ĐÚNG, bao nhiêu SAI, bao nhiêu ĐÚNG MỘT PHẦN.
