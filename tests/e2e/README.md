# BibleQuiz E2E Test Specs

## Mục đích

Thư mục này chứa **test case specs dạng markdown** — đặc tả cho bộ E2E automation của BibleQuiz.

Đây là **input** để engineer (hoặc Claude Code) dịch thành code automation:
- `tests/e2e/playwright/specs/` → code `.spec.ts` (Playwright, chạy trong `tests/`)
- `tests/e2e/maestro/specs/` → file `.yaml` (Maestro, chạy trên mobile emulator)

**Đây KHÔNG phải là test code thực thi được.** Specs là tài liệu đặc tả, code automation sẽ được generate ở phase sau.

---

## Cấu trúc

```
tests/e2e/
├── README.md                        # File này
├── CONVENTIONS.md                   # data-testid policy, auth strategy, naming
├── TEMPLATE.md                      # Template 1 test case spec
├── INDEX.md                         # Master tracking table (progress board)
├── playwright/
│   ├── fixtures/                    # storageState files (auth-tier1.json ... auth-admin.json)
│   └── specs/
│       ├── smoke/                   # L1 — kiểm tra feature tồn tại (P0/P1)
│       │   ├── W-M01-auth-onboarding.md
│       │   ├── W-M02-home-profile.md
│       │   ├── ...
│       │   └── admin/
│       │       ├── A-M01-dashboard.md
│       │       └── ...
│       ├── happy-path/              # L2 — full user flows (Phase 3+)
│       └── edge-cases/              # L3 — error states, edge cases (Phase 4+)
└── maestro/
    └── specs/
        ├── smoke/                   # Mobile smoke (Phase 3+)
        └── happy-path/
```

---

## Cách đọc một test case spec

Mỗi spec file chứa nhiều test cases theo format chuẩn (xem [TEMPLATE.md](TEMPLATE.md)):

```
### W-M01-L1-001 — Tên test case

Priority: P0/P1/P2
Auth: [storageState hoặc fresh login hoặc no auth]
Tags: @smoke @auth ...

Setup → Preconditions → Actions → Assertions → Cleanup → Notes
```

**Điểm quan trọng khi đọc**:
- `[NEEDS TESTID: name]` → element cần thêm `data-testid` vào source code trước khi viết code automation
- `[NOT IMPLEMENTED]` → feature có trong spec nhưng code chưa làm
- `[DEFERRED - WEBSOCKET PHASE]` → gameplay multiplayer, để Phase sau

---

## Pipeline

```
1. SPEC (file này)          ← bạn đang ở đây
        ↓ review + approve
2. CODE GENERATION          ← Claude Code dịch spec → .spec.ts / .yaml
        ↓
3. CI EXECUTION             ← npx playwright test / maestro test
        ↓
4. REPORT                   ← tests/playwright-report/ + maestro output
```

---

## Chạy Playwright (khi code đã generate)

```bash
# Từ root project
cd tests && npm test                        # all e2e
cd tests && npm run test:headed             # có browser UI
cd tests && npm run test:report             # xem HTML report

# Hoặc trực tiếp
npx playwright test --config tests/playwright.config.ts
npx playwright test --config tests/playwright.config.ts tests/auth.spec.ts
```

---

## Links

- [CONVENTIONS.md](CONVENTIONS.md) — data-testid naming, auth strategy, selector priority
- [TEMPLATE.md](TEMPLATE.md) — template chuẩn 1 test case
- [INDEX.md](INDEX.md) — master tracking table
- [SPEC_USER_v3.md](../../SPEC_USER_v3.md) — user feature spec
- [SPEC_ADMIN_v3.md](../../SPEC_ADMIN_v3.md) — admin feature spec
