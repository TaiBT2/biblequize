# Testing — Full Reference

> Extracted from CLAUDE.md on 2026-05-09. Referenced from CLAUDE.md §References.
> Updates: thay đổi → update file này, KHÔNG add lại vào CLAUDE.md.

## Quy trình test bắt buộc (Regression Guard)

### Nguyên tắc cốt lõi
> **Mỗi dòng code thay đổi đều có thể phá vỡ chức năng khác.**
> Chạy test đơn lẻ chỉ chứng minh code mới hoạt động.
> Chạy full regression chứng minh code mới KHÔNG phá code cũ.

### 3 tầng test — chạy theo thứ tự, KHÔNG được bỏ tầng nào

**Tầng 1 — Scope Test (sau mỗi thay đổi nhỏ, trong khi code)**
```bash
cd apps/web && npx vitest run src/pages/Home.test.tsx        # FE unit
cd apps/api && ./mvnw test -Dtest="XxxServiceTest"           # BE unit
```
- Mục đích: kiểm tra code vừa viết hoạt động đúng
- Khi nào: sau mỗi function/component hoàn thành

**Tầng 2 — Related Test (sau khi hoàn thành 1 screen/feature)**
```bash
cd apps/web && npx vitest run src/pages/         # Tất cả page tests
cd apps/web && npx vitest run src/components/    # Tất cả component tests
```
- Mục đích: kiểm tra các component/page dùng chung không bị break
- Khi nào: sau khi hoàn thành 1 screen hoặc sửa shared component/hook/store
- **Đặc biệt quan trọng khi sửa**: authStore, AppLayout, global.css, api/client.ts, shared hooks, RequireAuth/RequireAdmin

**Tầng 3 — Full Regression (TRƯỚC khi commit)**
```bash
# Frontend: tất cả unit tests
cd apps/web && npx vitest run

# Frontend: e2e tests
cd apps/web && npx playwright test

# Backend: tất cả tests
cd apps/api && ./mvnw test -Dtest="com.biblequiz.api.**,com.biblequiz.service.**"
```
- Mục đích: đảm bảo KHÔNG có regression trên toàn bộ hệ thống
- Khi nào: **BẮT BUỘC** trước mỗi commit, không có ngoại lệ
- Kết quả: tất cả tests pass, số test >= baseline trong `apps/web/.test-baseline` + `apps/api/.test-baseline`

### Quy trình khi phát hiện regression

```
1. DỪNG ngay — không code thêm feature mới
2. Xác định test nào fail → đọc error message
3. Xác định nguyên nhân:
   a. Code mới phá logic cũ → sửa code mới cho compatible
   b. Test cũ outdated (assertion sai do UI thay đổi hợp lệ) → cập nhật test
   c. Shared dependency bị thay đổi → review impact, sửa tất cả chỗ bị ảnh hưởng
4. Sửa xong → chạy lại Full Regression (Tầng 3)
5. ALL PASS → mới được tiếp tục feature hoặc commit
```

### Files "nhạy cảm" — khi sửa PHẢI chạy Full Regression ngay

| File | Lý do | Impact |
|------|-------|--------|
| `store/authStore.ts` | Global auth state | Mọi page dùng RequireAuth |
| `api/client.ts` | Axios interceptor, token | Mọi API call |
| `api/tokenStore.ts` | Token storage | Auth flow |
| `layouts/AppLayout.tsx` | Sidebar, nav | Mọi page trong AppLayout |
| `contexts/RequireAuth.tsx` | Auth guard | Mọi protected route |
| `contexts/RequireAdmin.tsx` | Admin guard | Mọi admin page |
| `styles/global.css` | Design tokens, utilities | Mọi component dùng glass-card, gold-gradient |
| `hooks/useStomp.ts` | WebSocket | RoomLobby, RoomQuiz |
| `main.tsx` | Routing | Mọi navigation |
| Backend: `SecurityConfig` | JWT, CORS | Mọi API endpoint |
| Backend: `GlobalExceptionHandler` | Error format | Mọi error response |

### Checklist trước commit (tự kiểm)
```
□ Tầng 1 pass — test file vừa sửa
□ Tầng 2 pass — test các module liên quan
□ Tầng 3 pass — full regression (FE unit + BE) (+ FE e2e)
□ Số test KHÔNG giảm so với trước task (xem .test-baseline files)
□ Không có test bị skip/disabled mà trước đó đang pass
□ Nếu sửa file "nhạy cảm" → đã chạy full regression ngay sau khi sửa
```

---

## Quy tắc test

### Nguyên tắc chung
- Mỗi screen/component PHẢI có unit test
- Mỗi user flow PHẢI có e2e test
- Test không được mock/hardcode config values khác config thật
- Khi test service cần config value → dùng giá trị giống application-dev.yml
- KHÔNG commit code mà test đang fail

### Unit Test (Vitest)
- **Config**: `vitest.config.ts` (happy-dom, setup `src/test/setup.ts`)
- **Pattern**: `src/**/*.{test,spec}.{ts,tsx}`
- **Đặt file**: cạnh source `Xxx.test.tsx` hoặc trong `__tests__/Xxx.test.tsx`
- **Minimum per screen**: 8 test cases (render, props, state, interactions, loading, error, responsive, accessibility)
- **Mock strategy**:
  - API calls → mock TanStack Query hooks hoặc MSW
  - Navigation → mock `useNavigate` from react-router-dom
  - Auth state → mock Zustand store
  - WebSocket → mock useStomp/useWebSocket hooks
  - KHÔNG mock implementation details — test behavior, not internals

### E2E Test (Playwright)
- **Config**: `apps/web/playwright.config.ts` (Chromium, serial, baseURL localhost:5173)
- **testDir**: `./tests/e2e`
- **Đặt file**: `tests/e2e/{smoke|happy-path}/web-user/<screen-name>.spec.ts`
- **Conventions**: Đọc `PLAYWRIGHT_CODE_CONVENTIONS.md` (4-section anatomy, POM, selectors, auth patterns)
- **Minimum per screen**: 5 test cases (happy path, navigation in/out, key interactions, error state, mobile viewport)
- **Quy tắc**:
  - Cần app đang chạy (dev server + backend + DB)
  - Dùng `page.goto()` với relative path (baseURL đã set)
  - KHÔNG dùng `page.waitForTimeout()` — dùng `waitFor()` hoặc `expect().toBeVisible()`

### Backend Test
- Unit test không dùng H2 — dùng Testcontainers MySQL
- Integration test phải kiểm tra config file thật
- Mọi Service method PHẢI có unit test

---

## Lệnh test (cheatsheet)

```bash
# Backend
cd apps/api && ./mvnw test -Dtest="com.biblequiz.api.**"         # API tests
cd apps/api && ./mvnw test -Dtest="com.biblequiz.service.**"     # Service tests
cd apps/api && ./mvnw test -Dtest="com.biblequiz.api.**,com.biblequiz.service.**"  # All BE

# Frontend unit
cd apps/web && npm test                     # Vitest watch mode
cd apps/web && npx vitest run               # Vitest single run (CI)
cd apps/web && npx vitest run src/pages/    # Vitest chỉ pages

# E2E
cd apps/web && npm run test:e2e                                # All e2e
cd apps/web && npx playwright test tests/e2e/smoke/            # Chỉ smoke
cd apps/web && npm run test:e2e:headed                         # Có browser UI
cd apps/web && npm run test:e2e:report                         # Xem HTML report

# i18n validator
cd apps/web && npm run validate:i18n                           # Check hardcoded VN
```

---

## E2E Test Gate (BẮT BUỘC cho mọi feature/fix)

> **Mọi thay đổi code PHẢI kiểm tra E2E coverage trước khi code.**
> Không có TC spec + Playwright code = không được ship.

### Quy trình kiểm tra E2E trước khi code

```
BƯỚC 1 — XÁC ĐỊNH SCREEN/FLOW bị ảnh hưởng
├── Feature mới: screen nào sẽ thêm/thay đổi?
├── Fix bug: bug ở screen nào? flow nào bị ảnh hưởng?
└── Output: danh sách routes/screens bị ảnh hưởng

BƯỚC 2 — KIỂM TRA TC SPEC ĐÃ CÓ CHƯA
├── Đọc tests/e2e/INDEX.md → module nào cover screen đó?
├── Đọc TC spec file tương ứng trong tests/e2e/playwright/specs/
│   ├── Smoke: tests/e2e/playwright/specs/smoke/W-M{xx}-*.md
│   └── Happy path: tests/e2e/playwright/specs/happy-path/W-M{xx}-*.md
├── Tìm TC ID cover đúng scenario đang fix/thêm
└── Output: "TC đã có: W-M04-L2-003" hoặc "CHƯA CÓ TC cho scenario này"

BƯỚC 3 — KIỂM TRA PLAYWRIGHT CODE ĐÃ CÓ CHƯA
├── Tìm file .spec.ts tương ứng:
│   ├── tests/e2e/smoke/web-user/W-M{xx}-*.spec.ts
│   └── tests/e2e/happy-path/web-user/W-M{xx}-*.spec.ts
├── Grep TC ID trong file: "W-M04-L2-003"
└── Output: "Code đã có" hoặc "CHƯA CÓ code Playwright"

BƯỚC 4 — HÀNH ĐỘNG THEO KẾT QUẢ
```

| TC Spec | Playwright Code | Hành động |
|---------|----------------|-----------|
| ✅ Có | ✅ Có | Code feature/fix → chạy e2e test đó → phải pass |
| ✅ Có | ❌ Chưa có | **Viết code Playwright TRƯỚC** (theo PLAYWRIGHT_CODE_CONVENTIONS.md) → rồi mới code feature |
| ❌ Chưa có | ❌ Chưa có | **Viết TC spec TRƯỚC** (theo tests/e2e/TEMPLATE.md) → viết Playwright code → rồi mới code feature |
| ✅ Có | ✅ Có nhưng outdated | Cập nhật TC spec + Playwright code cho match behavior mới |

### Khi fix bug

```
1. Xác định: bug ở screen nào, flow nào?
2. Tìm TC spec cover scenario đó
3. Nếu TC đã có nhưng test PASS → TC chưa đủ chi tiết → BỔ SUNG test case mới vào TC spec
4. Nếu TC đã có và test FAIL → đây là regression được detect → fix bug, test phải green lại
5. Nếu TC CHƯA CÓ → viết TC spec cho bug scenario → viết Playwright code → fix bug → test pass
6. Rule: mỗi bug fix PHẢI có ít nhất 1 e2e test case đảm bảo bug không quay lại
```

### Khi thêm feature mới

```
1. Feature ở screen mới → tạo TC spec file mới (smoke + happy path)
2. Feature ở screen đã có → bổ sung TC vào spec file hiện tại
3. Viết Playwright code cho TCs mới TRƯỚC khi code feature (TDD-style)
4. Code feature → e2e tests phải chuyển từ fail → pass
5. Nếu feature thêm UI elements mới → thêm data-testid vào source code
6. Cập nhật tests/e2e/INDEX.md: số TC mới, status
```

### TC-TODO.md tracking

> **Mỗi khi viết hoặc hoàn thành TC e2e, PHẢI cập nhật trạng thái trong [tests/e2e/TC-TODO.md](../../tests/e2e/TC-TODO.md).**

File `TC-TODO.md` là tracker cho các TC còn thiếu. Mỗi TC có status: ⬜ todo · 🔄 in progress · ✅ done · ⏭️ deferred · ❌ blocked.

| Hành động | Cập nhật TC-TODO.md |
|---|---|
| Bắt đầu viết spec markdown cho 1 TC | Đổi status ⬜ → 🔄 |
| Spec markdown + Playwright code đã viết, chạy pass | Đổi status 🔄 → ✅ |
| Chạy fail vì backend/feature chưa implement | Đổi status → ❌ blocked + ghi rõ block reason |
| Test bị defer (Phase sau, infra chưa sẵn) | Đổi status → ⏭️ deferred |
| Phát hiện gap mới (screen/flow chưa có trong file) | Append section mới với TC list |

**Khi tất cả TC trong 1 module đã ✅** → đồng thời update [INDEX.md](../../tests/e2e/INDEX.md).

**KHÔNG được**:
- Viết TC mới mà không add vào TC-TODO.md trước
- Skip TC đã ✅ trong TC-TODO.md mà không có lý do
- Để TC ở trạng thái 🔄 quá 1 commit
