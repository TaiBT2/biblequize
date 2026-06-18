# 2026-06-17 — Group Collective Growth ("Cùng nhau thuộc Lời")

> **Source**: Khảo sát tính năng Group 2026-06-17 — feature "không có điểm nổi bật". v1.4 đã sunset leaderboard cạnh tranh (Q-A / GD-1, BL-16) vì không hợp văn hóa Tin Lành, nhưng hook thay thế (BL-17 Activity Feed, BL-18 Pulse) đều defer → group im lặng giữa các buổi. · **Scope**: BE `modules/group` (mastery aggregation + service/controller/dto mới), FE web `components/group` + Activity tab, i18n, SPEC_GROUP §X (author khi duyệt).
> **Spec strategy**: (b) BL-23 (BACKLOG) — feature mới, cần user review trước khi code.
> **✅ D1–D5 LOCKED 2026-06-17** (default — xem DECISIONS.md). CG-1 DONE; đang chạy CG-2.

**Concept** — *anti-leaderboard*: KHÔNG xếp hạng ai. Hiển thị **một con số chung cả nhóm cùng lấp đầy** — "Nhóm đã cùng thuộc **N** câu Lời Chúa" + thanh tiến độ + cột mốc. Build trên `GroupQuizSetMastery` (Q-A SAFE — solo practice các bộ câu hỏi của nhóm), aggregate thành chỉ số tập thể *không-ranking* → KHÔNG tái sinh leaderboard đã sunset, KHÔNG đụng `ChurchGroupService.getLeaderboard` (BL-16). Đúng tinh thần "cùng nhau lớn lên"; differentiator không quiz-app generic nào có.

**Đã verify khả thi**: `GroupQuizSetMastery` {questionsLearned, learnedQuestionIds JSON, completedMastery}; `GroupQuizSetMasteryRepository.findByUserIdAndGroupId` đã JOIN `m.quizSetId = s.id AND s.group.id = :groupId` → group-scope aggregation bằng SQL thuần. `GroupQuizSet` {totalQuestions, publishStatus} cho mẫu số. **v1 không cần Flyway migration** (chỉ read-aggregation) — trừ khi chốt D4 = có group goal.

---

### Decisions — ✅ LOCKED 2026-06-17 (default, DECISIONS.md)

| # | Quyết định | Đề xuất (default) | Đánh đổi |
|---|---|---|---|
| **D1** | Hero metric | **SUM `questionsLearned`** toàn nhóm ("lượt câu cả nhóm đã thuộc") cho v1 | UNION distinct `learnedQuestionIds` ("số câu khác nhau nhóm đã chạm") đẹp & trung thực hơn nhưng phải union JSON ở app-layer → nặng hơn. Để v2. |
| **D2** | Nguồn tính | **Chỉ mastery (solo practice các set của nhóm)** cho v1 | Cộng cả group-play (live room + scheduled quiz) cần đọc data khác (ScheduledQuizAttempt, room results) → +infra. Để v2. |
| **D3** | Vị trí hiển thị | **Hero card trong Activity tab** (lấp đúng khoảng trống hiện tại) | Tab riêng "Hành Trình Nhóm" — nhiều không gian hơn nhưng thêm route + 1 chỗ phải chủ động vào. |
| **D4** | Group goal (leader đặt mục tiêu, vd "cùng thuộc 500 câu Giăng") | **v2** — v1 chỉ milestone tự động (100/500/1000…) | Goal tạo cảm giác "quest" mạnh hơn nhưng cần entity `group_growth_goal` + migration + UI đặt mục tiêu. |
| **D5** | Visibility | **Mọi member đều thấy** (đây là niềm tự hào chung) | Leader-only như Analytics/Pulse — nhưng vậy mất tác dụng "cả nhóm cùng nhìn về một đích". |

> Locked 2026-06-17 (user chốt default) → ghi `DECISIONS.md` + BL-23. CG-1 đã mở & DONE.

---

### Tasks (draft — kích hoạt sau khi chốt D1–D5)

- CG-1 BE: group-wide aggregate (repo) + `GroupCollectiveGrowthService` (hero + milestone)
  - Status: [x] DONE (5/5 Mockito pass, BUILD SUCCESS) · Files: `modules/group/repository/GroupQuizSetMasteryRepository.java` (`aggregateGrowthByGroupId`), `modules/group/service/GroupCollectiveGrowthService.java` (new), test `GroupCollectiveGrowthServiceTest.java` (new) · Test: Mockito service test
  - Query: `SUM(questionsLearned)` + `COUNT(DISTINCT userId)` + `COUNT(completedMastery=true)` over PUBLISHED sets (JOIN `GroupQuizSet.group.id`) → `List<Object[]>`. Service → `Map<String,Object>` {totalLearned, contributors, masteryCompletions, milestoneFloor, nextMilestone, milestonePct}. Hero = SUM (D1); milestone band 50→10000, vượt bảng bước 5000.
  - **Spec impact**: [x] None (read-only) · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl ✅ · Tầng 1 ✅ · commit (chờ user)
- CG-2 BE: per-set breakdown + group memberCount (repo GROUP BY + extend service)
  - Status: [x] DONE (6/6 Mockito + Tầng 3 BE 1072 pass) · Files: `GroupQuizSetMasteryRepository.java` (`aggregatePerSetByGroupId` GROUP BY, totalQuestions lấy từ JOIN), `GroupCollectiveGrowthService.java` (+`ChurchGroupRepository` memberCount + `buildPerSet`) · Test: Mockito service test
  - Map thêm: `memberCount` + `perSet[]` {quizSetId, name, totalQuestions, participants, completions, avgMasteryPct}. avgMasteryPct = SUM(learned)/participants/totalQuestions (cap 100).
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl ✅ · Tầng 1 ✅ · Tầng 3 ✅ · commit
- CG-3 BE: endpoint `GET /api/groups/{id}/collective-growth`
  - Status: [x] DONE (ChurchGroupControllerTest 35 pass: member 200 / non-member 400) · Files: `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` (+`collectiveGrowthService` field + endpoint) · Test: `ChurchGroupControllerTest` (WebMvcTest, +2 case)
  - Member-visible (verify membership như `getGroupStreak`; non-member → **400** qua catch theo house pattern, không 403). Trả Map `{success, growth}` — KHÔNG DTO.
  - **Spec impact**: [x] SPEC_GROUP §X (author ở CG-8) · **Spec strategy**: [x] (b) BL-23
  - Checklist: impl ✅ · Tầng 1 ✅ · Tầng 3 + commit
- CG-4 BE: Q-A guard test
  - Status: [x] DONE (7/7 service test) · Files: `GroupCollectiveGrowthServiceTest.java` · Test: structural guard
  - Reflection guard: constructor params + fields KHÔNG chứa `UserDailyProgress`/`leaderboard` → khóa invariant Q-A SAFE cho tương lai. (SUM-correctness là JPQL/DB-level — verify khi có @DataJpaTest infra.)
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl ✅ · Tầng 1 ✅ · Tầng 3 + commit
- CG-5 FE: api client + `useGroupCollectiveGrowth` hook
  - Status: [ ] TODO · Files: `apps/web/src/api/groups.ts` (hoặc quizSets), `apps/web/src/api/queryKeys.ts` · Test: n/a
  - TanStack Query (KHÔNG useEffect+fetch); typed response.
  - **Spec impact**: [ ] None · **Spec strategy**: [ ] (c) [no-spec-impact]
  - Checklist: impl · tsc · commit
- CG-6 FE: `CollectiveGrowthCard` component (Khung Sáng tokens)
  - Status: [ ] TODO · Files: `apps/web/src/components/group/CollectiveGrowthCard.tsx` (new) · Test: component test
  - Hero number + progress bar + milestone badge + per-set mini-list. 3 states (skeleton/error+retry/empty="chưa ai ôn"). Theo `docs/dev/design-system.md` + Khung Sáng (KHÔNG inline style, KHÔNG hardcode màu).
  - **Spec impact**: [ ] None · **Spec strategy**: [ ] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1 · commit
- CG-7 FE: wire vào `GroupActivityTab` + i18n vi/en (D3)
  - Status: [ ] TODO · Files: `apps/web/src/components/group/GroupActivityTab.tsx`, `apps/web/src/i18n/vi.json` + `en.json` · Test: component test
  - **Spec impact**: [ ] None · **Spec strategy**: [ ] (c) [no-spec-impact]
  - Checklist: impl · Tầng 2 (Group screen) · `npm run validate:i18n` không tăng debt · commit
- CG-8 Spec + full regression
  - Status: [ ] TODO · Files: `docs/spec/SPEC_GROUP_v1.3.md` (§X Collective Growth), `docs/spec/BACKLOG.md` (BL-23 → DONE) · Test: `bash tools/spec-audit/audit.sh`
  - **Spec impact**: [x] SPEC_GROUP §X new · **Spec strategy**: [x] (a) update inline (khi ship)
  - Checklist: author §X · BL-23 DONE · `audit.sh` no NEW broken · **Tầng 3 full regression (Vitest + JUnit ≥ baseline)** · commit

### Definition of Done
- Tầng 3 pass (số test ≥ baseline) · không tsc/Java error · audit.sh no new broken
- Q-A SAFE: không ghi/đọc leaderboard (BL-16) — verify ở CG-4
- UI Khung Sáng tokens · 3 states handled
- SPEC_GROUP §X authored · BL-23 đánh DONE + commit hash

### Mobile parity
- Defer (port `CollectiveGrowthScreen`/card sang RN) → track như follow-up sau khi web ship (theo pattern BL-11).
