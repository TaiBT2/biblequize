# 2026-05-13 — Disable test data seed on prod + harden guard

> **Source**: Phát hiện trong session local-setup (2026-05-13). Server `52.194.243.39` đang chạy `SPRING_PROFILES_ACTIVE=docker` + `APP_TEST_DATA_ENABLED=true` → seed 26 test users vào prod DB, gồm 2 ADMIN (`admin@biblequiz.test`, `mod@biblequiz.test`) với password hardcoded `Test@123456`. Bất kỳ ai cũng có thể `POST https://be.quize.top/api/auth/login` để lấy token ADMIN.
>
> **Scope**: BE only — `deploy/compose.prod.yml` + `TestDataAutoSeeder.java`. User chấp nhận không xoá test users hiện có (Step 1 skipped) và không rotate JWT_SECRET (Step 4 skipped) — app chưa có dữ liệu quan trọng.

### Tasks

- SEC-1 Disable `APP_TEST_DATA_ENABLED` trên compose.prod.yml
  - Status: [ ] TODO
  - Files: `deploy/compose.prod.yml`
  - Test: redeploy + check BE log không có `=== Auto-seeding test data ===`
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: edit env → commit

- SEC-2 Harden TestDataAutoSeeder — refuse seed nếu frontend URL ko phải localhost
  - Status: [ ] TODO
  - Files: `apps/api/src/main/java/com/biblequiz/infrastructure/seed/TestDataAutoSeeder.java`
  - Test: BE local (FRONTEND_URL=http://localhost:5173) vẫn seed; nếu FRONTEND_URL=https://www.quize.top thì log warn + return không seed.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: thêm @Value frontendUrl + check trong run() → build BE pass → commit
