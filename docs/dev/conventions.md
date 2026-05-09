# Conventions — Error Handling & State Management

> Extracted from CLAUDE.md on 2026-05-09. Referenced from CLAUDE.md §References.
> Updates: thay đổi → update file này, KHÔNG add lại vào CLAUDE.md.

## Error Handling Patterns (bắt buộc tuân theo)

### Backend error response format (mọi endpoint)
```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Question not found",
  "requestId": "abc-123",
  "details": {}
}
```

### Frontend error handling (3 layers)
```
Layer 1: TanStack Query onError → showError() from ErrorContext → toast
Layer 2: Axios response interceptor → auto-refresh token on 401, attach userMessage
Layer 3: ErrorBoundary → catch render crashes → fallback UI
```

### Quy tắc khi viết error handling mới
- LUÔN dùng `showError(error.userMessage || error.message)` — không tự viết message
- LUÔN handle 3 states trong page: loading (Skeleton), error (message + retry button), success
- API errors trong TanStack Query → dùng `onError` callback hoặc `isError` + `error` từ useQuery
- KHÔNG dùng try/catch cho API calls khi đã dùng TanStack Query — Query tự handle
- KHÔNG swallow errors silently (`catch {}` trống) — ít nhất phải `console.warn`

---

## State Management Map

### Zustand Stores

| Store | File | Scope | Persistence |
|-------|------|-------|-------------|
| `useAuthStore` | `store/authStore.ts` | User auth, role, token | In-memory token + localStorage profile cache |
| `useOnboardingStore` | `store/onboardingStore.ts` | Onboarding completion | localStorage |

### React Context (chỉ cho tree-scoped concerns)

| Context | File | Scope |
|---------|------|-------|
| `ErrorContext` | `contexts/ErrorContext.tsx` | Toast notifications (render trong React tree) |

### TanStack Query (server state)

- Tất cả API data → TanStack Query (cache, refetch, stale)
- KHÔNG dùng useState cho data từ API
- Stale time mặc định: 5 phút
- Retry: 3 lần với exponential backoff

### localStorage keys đang dùng

| Key | Mô tả | Đọc bởi |
|-----|--------|---------|
| `userName` | Cached user name | authStore (checkAuth) |
| `userEmail` | Cached user email | authStore |
| `userAvatar` | Cached avatar URL | authStore |
| `rankedSnapshot` | Ranked progress snapshot | useRankedDataSync |
| `rankedProgress` | Ranked progress data | useRankedDataSync |
| `rankedStatus` | Ranked status cache | useRankedDataSync |
| `quizLanguage` | vi / en preference | quizLanguage util |
| `hasSeenOnboarding` | Boolean | onboardingStore |
| `i18nextLng` | Language preference | i18n |
| `dailyBonusDismissed` | `YYYY-MM-DD` of last-dismissed daily bonus | DailyBonusModal |

> KHÔNG thêm localStorage key mới mà không ghi vào bảng trên.
