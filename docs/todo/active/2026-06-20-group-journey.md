# 2026-06-20 — Hành Trình Nhóm (Group Journey) — group differentiator

> **Source**: Đánh giá Group (2026-06-20) — user chốt: live co-play trùng multiplayer, group thiếu lý do tồn tại. Hướng A: dồn vào trục **bất đồng bộ + bền bỉ + mục vụ** mà multiplayer không nhái được. · **Scope**: BE `modules/group` (entities + service + endpoints, reuse ScheduledQuiz), FE group (builder + journey view), SPEC_GROUP §X. · **Spec strategy**: (b) BL-25.

**Concept:** Cả nhóm cùng đi qua 1 sách/chủ đề trong N **chặng** — mỗi người tự học theo nhịp riêng, có **tiến độ chung + checkpoint mỗi chặng**. Khác multiplayer (1 trận rồi tan) = hành trình bền có người dẫn.

**✅ Nguồn dữ liệu đã verify SỐNG (bài học Collective Growth):** mỗi **chặng = một `ScheduledQuiz`** (primitive async DUY NHẤT vừa khác multiplayer vừa đang chạy thật). Tiến độ chặng = suy từ `ScheduledQuizAttempt` — flow create/play/submit đã wired end-to-end (FE ScheduledQuizCreate/Detail/Play + BE `submitAttempt` save attempt). **KHÔNG** phụ thuộc solo-practice (đã chết).

### Decisions (LOCKED 2026-06-20 — user OK)
- **D1** Nhịp: **leader tự mở từng chặng** (mỗi chặng có deadline = ScheduledQuiz deadline). Auto-mở-hàng-tuần → v2 (toggle).
- **D2** Hoàn thành 1 chặng = **chỉ cần LÀM** (có `ScheduledQuizAttempt` cho chặng đó). Hiện điểm/% để khích lệ, KHÔNG gate.
- **D3** **Hành trình = nhân vật chính**; Quiz tuần lẻ giữ cho ad-hoc (chặng = scheduled quiz có `journeyWeekId`; lẻ = scheduled quiz không thuộc journey). Cùng hạ tầng.
- **D4** Live "Chơi cùng nhau" → **hạ xuống shortcut phụ** trên thẻ bộ câu hỏi (nhường spotlight cho Hành trình).

### Mô hình
- `GroupJourney`: id, groupId, title, description, status (DRAFT/ACTIVE/COMPLETED), createdBy, createdAt, startedAt, completedAt.
- `GroupJourneyWeek`: id, journeyId, weekNumber, title, quizSetId (nội dung chặng), scheduledQuizId (null→set khi mở chặng), status (LOCKED/OPEN/ENDED).
- Tiến độ = JOIN `ScheduledQuizAttempt` qua `scheduledQuizId` (v1 không cần bảng progress riêng).

### Tasks
- GJ-1 BE: migration (V70) + entities `GroupJourney` + `GroupJourneyWeek` + repositories
  - Status: [x] DONE · Files: `entity/GroupJourney.java`, `entity/GroupJourneyWeek.java`, `repository/GroupJourney{,Week}Repository.java`, `db/migration/V70__group_journey.sql` · Test: `mvnw compile` PASS
  - **Spec impact**: [ ] SPEC_GROUP §X (GJ-8) · **Spec strategy**: [ ] (b) BL-25
- GJ-2 BE: `GroupJourneyService` — create/edit journey + weeks · start · **openNextWeek** (delegate `ScheduledQuizService.create` → lưu scheduledQuizId) · `getJourneyWithProgress` (aggregate ScheduledQuizAttempt: chặng k/N, per-week X/Y done, personal done-list)
  - Status: [x] DONE · Files: `service/GroupJourneyService.java` · Test: `GroupJourneyServiceTest` (8 tests) PASS
  - **Spec impact**: [ ] §X · **Spec strategy**: [ ] (b) BL-25
- GJ-3 BE: endpoints (CRUD journey + add/edit week + open-next-week + get-with-progress), role-gate leader/mod cho write
  - Status: [x] DONE · Files: `api/GroupJourneyController.java` · Test: `GroupJourneyControllerTest` (9 tests: member 200 read / non-member 400 / non-leader 403 write / no-auth 401) PASS
  - **Spec impact**: [ ] §X · **Spec strategy**: [ ] (b) BL-25
- GJ-4 FE: api client + hooks (`useGroupJourney`, mutations) — TanStack Query
  - Status: [x] DONE · Files: `api/groupJourney.ts`, `api/queryKeys.ts` (+groupJourney keys), `hooks/useGroupJourney.ts` (query + 6 mutation hooks) · Test: `tsc --noEmit` clean (component tests in GJ-5/6)
- GJ-5 FE: **Leader builder** — tạo journey + thêm chặng (mỗi chặng: title + chọn/soạn quiz set), "Bắt đầu hành trình"
  - Status: [x] DONE · Files: `pages/JourneyBuilder.tsx` (+routes main.tsx) · Test: `JourneyBuilder.test.tsx` (5 tests) PASS · Note: "Mở chặng tiếp" thuộc JourneyView (GJ-6) vì chặng chỉ mở được khi journey ACTIVE
- GJ-6 FE: **Journey view** — thanh tiến độ chung (chặng k/N) + per-chặng status + "Làm chặng này" → reuse ScheduledQuiz flow; leader thấy per-week X/Y done + ai chưa làm + "Mở chặng" (openNextWeek + deadline preset)
  - Status: [x] DONE · Files: `pages/JourneyView.tsx` · Test: `JourneyView.test.tsx` (6 tests) PASS
- GJ-7 FE: đưa Hành trình thành **hero** trong group (tab/section) + **hạ live co-play xuống shortcut** (D4) + i18n vi/en
  - Status: [x] DONE · Files: `components/group/JourneyHeroCard.tsx` (hero, above CollectiveGrowthCard), `GroupActivityTab.tsx` (wire), `QuickActionsPanel.tsx` (drop `highlight` từ "Bắt đầu Live" = D4 demote), `i18n/{vi,en}.json` (+`groupJourney` namespace, 38 keys parity) · Test: `JourneyHeroCard.test.tsx` (5 tests) + group suite (20) PASS · `validate:i18n` no new debt (1131 hardcoded / 84 missing — none mới)
- GJ-8 Spec + regression
  - Status: [x] DONE · Files: `SPEC_GROUP_v1.3.md` §19 (Hành Trình Nhóm) + §7 demote + v1.6 changelog + Mục lục, `BACKLOG.md` BL-25 → DONE · Test: `audit.sh` broken 103→102 (no NEW; journey refs resolve) · **Tầng 3: BE 1122 ≥ 828 ✅ + FE 1385 ≥ 1277 ✅** (FE full suite via `--no-file-parallelism` — `threads` pool thrashes on Windows)
  - **Spec impact**: [x] SPEC_GROUP §19 new + §7 (live demote) · **Spec strategy**: [x] (a) update inline

### Definition of Done
- Leader dựng được hành trình N chặng, mở từng chặng; member làm chặng (= scheduled quiz) → tiến độ chung + cá nhân cập nhật từ dữ liệu THẬT.
- Tiến độ KHÔNG rỗng (verify nguồn = ScheduledQuizAttempt sống).
- Live co-play hạ xuống phụ. Tầng 3 pass · SPEC §X · BL-25 DONE.

### Notes
- Effort: **L** (multi-day) — entities + migration + 2 UI (builder + view). Đây là cú đặt cược differentiator chính của group.
- ⚠️ Concurrent-git ([[feedback_concurrent_git_workflow]]): nên làm trong **git worktree riêng** để tránh bị cuốn/clobber như BL-23/24.
- Reuse tối đa: `ScheduledQuiz` (checkpoint), `GroupQuizSet`+AI (nội dung chặng), `GroupAnnouncement`+noti BL-24 (auto báo khi mở/đóng chặng).
- Defer v2: badge hoàn thành hành trình · journey templates ("Tân Ước 90 ngày") · auto-mở hàng tuần · nhắc-tự-động leader.
