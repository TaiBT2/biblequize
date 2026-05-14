# 2026-05-14 — Season overlap: defensive read + admin write guard

> **Source**: prod incident 2026-05-14 — UI hiển thị "Season E2E Test 1777474379772" do test data leak khiến `getActiveSeason()` pick nhầm khi nhiều seasons cùng cover today.
> **Scope**: BE only (`SeasonService` + `SeasonRepository` + `AdminSeasonController` + tests). Không chạm FE, không chạm seeder.

## Background

`getActiveSeason()` dùng date-range lookup theo DECISIONS 2026-05-01 §4B. Tiebreak hiện tại `findTop...OrderByStartDateDesc` chỉ chống legacy data có startDate cũ hơn canonical; **không** chống test data có startDate mới hơn. Trên prod hôm 2026-05-14:

- `season-2026-q2` Mùa Ngũ Tuần 2026 (2026-04-01 → 2026-06-30, is_active=1) — canonical
- `9173bce0...` Mùa Phục Sinh 2026 dup (2026-03-01 → 2026-05-31, is_active=1) — legacy
- `905345ed...` Season E2E Test 1777474379772 (2026-05-01 → 2026-05-31, is_active=0) — **test leak**

Cả 3 cover today. Tiebreak "newer startDate wins" → pick `905345ed` (start=2026-05-01) → UI sai.

Cleanup data đã chạy (xem chat 2026-05-14). Task này chốt 2 layer hardening để tránh tái phát.

## Tasks

- SOG-1 Defensive read trong `getActiveSeason()`
  - Status: [ ] TODO
  - Files: `apps/api/src/main/java/com/biblequiz/modules/season/service/SeasonService.java`, `.../repository/SeasonRepository.java`
  - Test: `apps/api/src/test/java/com/biblequiz/service/SeasonServiceTest.java` (+1 case overlap → prefer is_active=true)
  - Change: thay `findTop...OrderByStartDateDesc` bằng `findTop...OrderByIsActiveDescStartDateDesc` — khi nhiều rows cover today, ưu tiên `is_active=true` rồi mới fallback newest startDate. Vẫn giữ `findByIsActiveTrue()` cho case không có row cover (zero seasons today).
  - **Spec impact**: [x] BL-N (cập nhật DECISIONS 4B note về tiebreak)
  - **Spec strategy**: [x] (a) update inline (DECISIONS.md note dưới entry 2026-05-01 §4B)
  - Checklist: impl · Tầng 1+2 BE pass · DECISIONS updated · commit `fix(season): prefer is_active when seasons overlap today`

- SOG-2 Write validation trong `AdminSeasonController.createSeason()`
  - Status: [ ] TODO
  - Files: `apps/api/src/main/java/com/biblequiz/api/AdminSeasonController.java`, `.../repository/SeasonRepository.java`
  - Test: `apps/api/src/test/java/com/biblequiz/api/AdminSeasonControllerTest.java` (+1 case overlap → 409)
  - Change: trước khi save, query `existsByStartDateLessThanEqualAndEndDateGreaterThanEqual(newEnd, newStart)` (overlap criterion: existing.start ≤ new.end AND existing.end ≥ new.start). Nếu tồn tại → reject 409 với message "season date range overlaps existing season(s)".
  - **Spec impact**: [x] None (code-side guard, không thay đổi spec)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+2 BE pass · commit `fix(season): reject overlapping date range in admin create`

- SOG-3 Tầng 3 regression
  - Status: [ ] TODO
  - Files: none
  - Test: `cd apps/api && mvn test`
  - Checklist: số test ≥ baseline · commit (no code change)

## Out of scope (follow-up)

- SeasonSeeder không có overlap check — nếu admin tạo random-UUID season chiếm Q2 trước khi seeder chạy, seeder vẫn insert `season-2026-q2`. Để follow-up vì seeder chạy 1 lần lúc startup, ảnh hưởng nhỏ hơn admin endpoint.
- Test data leak vào prod (E2E test gọi admin endpoint trên prod env) — task riêng đã có: [2026-05-13-disable-seed-on-prod-and-harden-guard](2026-05-13-disable-seed-on-prod-and-harden-guard.md).
- Frontend không có thay đổi: tab "MÙA" vẫn dùng `season.name` từ `/api/seasons/active`.
