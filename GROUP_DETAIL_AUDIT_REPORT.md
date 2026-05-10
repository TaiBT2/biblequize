# GROUP_DETAIL_AUDIT_REPORT

> Pre-flight verify cho redesign `/group/:id` — task GD-0 trong [PROMPT_FIX_GROUP_DETAIL.md](docs/group-page/PROMPT_FIX_GROUP_DETAIL.md). No commit. Output này để Bui review trước khi GD-1.
>
> **Date:** 2026-05-10 · **Branch:** main · **Reviewer:** Claude (no human review yet)

## Check 1 — `GroupDetail.tsx` structure

| Metric | Value | Note |
|---|---|---|
| LOC | **2663** | Vượt rule 300 LOC ~9× |
| useState/useQuery/useEffect total | **73** | Lớn — file đã grow vượt limit, refactor cần thiết nhưng PROMPT_FIX không yêu cầu refactor như task riêng → tách inline trong GD-1 (extract Activity + GD-9 (extract Analytics) |
| Tab impl | Custom inline (`TabKey` union + `activeTab` useState) | KHÔNG dùng library — đơn giản, dễ thay đổi |
| Tab default | `'leaderboard'` ([line 135](apps/web/src/pages/GroupDetail.tsx#L135)) | Sẽ đổi `'activity'` ở GD-1 |

[apps/web/src/pages/GroupDetail.tsx](apps/web/src/pages/GroupDetail.tsx) · [apps/web/src/pages/GroupAnalytics.tsx](apps/web/src/pages/GroupAnalytics.tsx) (406 LOC, page riêng `/groups/:id/analytics`)

## Check 2 — Tab "Leaderboard" rendering 🔴 CRITICAL

**Đã được redesign 1 lần** ([line 923](apps/web/src/pages/GroupDetail.tsx#L923)):
```
{/* ===== OVERVIEW TAB (formerly LEADERBOARD; redesigned per groups_leader_dashboard.html / groups_member_dashboard.html) ===== */}
{activeTab === 'leaderboard' && (
  ...
  {isLeader ? (
    <>{/* Analytics inline (leader-only) */}</>
  ) : (
    <>{/* Member/Mod overview: leaderboard + quiz sets + sidebar */}</>
  )}
```

**Nghĩa là:**
- Tab key vẫn `leaderboard` nhưng nội dung đã rẽ nhánh: leader thấy analytics inline, member thấy podium ranking
- Member view tại [line 1117–1216](apps/web/src/pages/GroupDetail.tsx#L1117) vẫn là podium 3 + danh sách (ranking-style)
- Đây là **trạng thái nửa-vời** — GD-1 sẽ chuẩn hoá thành "Hoạt động" tab cho cả 2 role + chuyển analytics ra tab GD-9

**Confirm:** đây không phải bug; là intentional redesign chưa hoàn thành. GD-1 đi đúng hướng.

## Check 3 — Group analytics endpoints

| Endpoint | File | Status |
|---|---|---|
| `GET /api/groups/{id}/analytics` | [ChurchGroupController.java:283-285](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L283) | ✅ Tồn tại, leader/mod-only |
| `GET /api/groups/{id}/leaderboard?period=...` | [ChurchGroupController.java:272](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L272) | ✅ Tồn tại — **soft sunset** (giữ BE 2-3 sprints cho mobile) |
| FE call analytics | `GroupAnalytics.tsx`, header link `/groups/${id}/analytics` ([line 807](apps/web/src/pages/GroupDetail.tsx#L807)) | Page riêng — GD-9 sẽ extract làm tab |
| FE call leaderboard | [GroupDetail.tsx:389](apps/web/src/pages/GroupDetail.tsx#L389) | Sẽ unmount FE ở GD-1 |

## Check 4 — Sidebar layout (route-aware widgets)

Sidebar shared toàn app: [AppLayout.tsx](apps/web/src/layouts/AppLayout.tsx).

**Logic hiện tại** ([lines 92–108](apps/web/src/layouts/AppLayout.tsx#L92-L108)):
```tsx
{location.pathname.startsWith('/ranked') ? (
  <SeasonGoalWidget /> <WinRateWidget /> <WeekComboWidget />
) : location.pathname.startsWith('/leaderboard') ? (
  <LeaderboardRankWidget /> <LeaderboardSeasonWidget />
) : (
  <StreakWidget /> <DailyMissionWidget />  // ← /groups và /group/:id rơi vào else này
)}
```

**Confirm GD-5 cần:** thêm nhánh `location.pathname.startsWith('/group/')` (route detail là `/group/:id`, NHƯNG lưu ý route group list là `/groups`). Cần verify route exact path bằng router config trước khi sửa. → action GD-5: hide hoặc thay bằng widget context-relevant (group streak / active scheduled).

**Sensitive file** ([AppLayout.tsx](apps/web/src/layouts/AppLayout.tsx) per CLAUDE.md) → Tầng 3 regression bắt buộc cho GD-5.

## Check 5 — DTO counts data

DTO không có file riêng — backend trả `Map<String, Object>` trong [ChurchGroupController.java](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java).

| Field | Có sẵn? | Source |
|---|---|---|
| `memberCount` | ✅ | `ChurchGroup.memberCount` (denormalized) |
| `quizSetsCount` | ❌ | Cần derive: `GroupQuizSet.findByGroupId(...).size()` hoặc count query |
| `announcementsCount` | ❌ | Cần derive: `GroupAnnouncement.findByGroupId(...).size()` |
| `unreadAnnouncementsCount` | ❌ | Tracking unread chưa có server-side ([line 728-732 GroupDetail.tsx](apps/web/src/pages/GroupDetail.tsx#L728)) — derive client-side bằng "tạo trong 7 ngày" |

**GD-6 strategy:** dùng `members.length`, `announcements.length`, `quizSets.length` từ existing fetch ở FE — KHÔNG cần BE thay đổi. (Nếu pagination → cần thêm `total` field, nhưng hiện tại FE đã load full list rồi).

## Check 6 — Group age tracking

[ChurchGroup.java:44-45](apps/api/src/main/java/com/biblequiz/modules/group/entity/ChurchGroup.java#L44):
```java
@Column(name = "created_at")
private LocalDateTime createdAt;
```
✅ Có sẵn. DTO có expose `createdAt` cho FE — verify khi GD-2/GD-10 sử dụng. Nếu chưa expose → thêm field vào response map (1 dòng).

## Check 7 — Tournament min members

| Layer | Min check? |
|---|---|
| Backend `TournamentService` | KHÔNG tìm thấy `MIN_TOURNAMENT_PARTICIPANTS` constant hay validation rule |
| Frontend Tournament card | Hiện chưa disable theo memberCount |

**GD-4 scope:** UI-only. Disable card khi `group.memberCount < 4` + tooltip "Cần ≥4 members". Backend không sửa (defer Sprint 7+).

## Check 8 — i18n keys

**Existing** ([vi.json:1557-1560](apps/web/src/i18n/vi.json#L1557-L1560)):
```json
"leaderboardTab": "Leaderboard",
"membersTab": "Thành viên",
"announcementsTab": "Thông báo",
"quizSetsTab": "Bộ câu hỏi"
```

**Missing cần add cho fix:**
| Key | vi | en |
|---|---|---|
| `groups.tabs.activity` | "Hoạt động" | "Activity" |
| `groups.tabs.analytics` | "Phân tích" | "Analytics" |
| `groups.activity.placeholder.*` | (placeholder messages) | ... |
| `groups.action.createQuizSet/startLive/tournament/announce/practice/scheduledQuiz` | (Quick Actions labels) | ... |
| `groups.action.tournament.needMembers` | "Cần {{min}} thành viên (hiện {{current}})" | "Need {{min}} members ({{current}} now)" |
| `groups.onboarding.*` | (Onboarding banner copy) | ... |
| `groups.kpi.tooltip.*` | (KPI scope tooltips) | ... |
| `groups.qrModal.*` | (QR share copy) | ... |

Effort: ~25-30 keys × 2 locales = ~60 entries.

## Check 9 — Test baseline

| Layer | Baseline | File |
|---|---|---|
| Web (Vitest) | **1227** tests | [apps/web/.test-baseline](apps/web/.test-baseline) |
| API (JUnit) | **829** tests | [apps/api/.test-baseline](apps/api/.test-baseline) |

**GD-0 KHÔNG chạy full test** (tốn ~3-5 phút). Sẽ chạy Tầng 3 sau mỗi commit task GD-N. Baseline hiện tại stale-but-valid (CLAUDE.md: số test ≥ baseline).

## Check 10 — Existing GroupDetail tests

[apps/web/src/pages/__tests__/GroupDetail.test.tsx](apps/web/src/pages/__tests__/GroupDetail.test.tsx) — **1 test only** (module export check). KHÔNG có rendering tests. Coverage thấp.

**GD-1 strategy:** thêm rendering test cơ bản cho Activity tab khi extract component, KHÔNG block nếu module-export test vẫn pass.

---

## Summary — Issues verification

| # | Issue (PROMPT_FIX) | Status verify | Notes |
|---|---|---|---|
| 1 | Bỏ tab Leaderboard → Hoạt động | ✅ Confirmed needed | Leader đã thấy analytics inline, member vẫn podium → cần chuẩn hoá |
| 2 | Empty states <7d / <5 members | ✅ Confirmed needed | `createdAt` + `memberCount` có sẵn |
| 3 | KPI tooltips clarity | ✅ Confirmed needed | KPI cards trong analytics inline ([line 928](apps/web/src/pages/GroupDetail.tsx#L928)) thiếu tooltip scope |
| 4 | Tournament disable <4 | ✅ Confirmed needed | FE chưa check |
| 5 | Sidebar Streak/DailyMission trong group | ✅ Confirmed needed | AppLayout fall-through default |
| 6 | Tab count badges | ✅ Confirmed needed | Hiện chỉ có notification dot (announcements > 0) |
| 7 | Header layout cramped | ⚠️ Partially fixed | Có separate mobile/desktop blocks ([line 851](apps/web/src/pages/GroupDetail.tsx#L851)) — kiểm tra screenshot mobile thực tế xem còn cramped không |
| 8 | Role badge contrast | ⚠️ Partially OK | `bg-[rgba(232,168,50,0.2)]` text `secondary` text-[9px] — text 9px nhỏ, cần raise contrast + font-weight |
| 9 | Analytics tab leader-only | ✅ Confirmed needed | Hiện là page riêng `/groups/:id/analytics`, cần move thành tab |
| 10 | Onboarding banner | ✅ Confirmed needed | Chưa có |
| 11 | Group code QR modal | ⚠️ Copy có sẵn | Copy button đã hoạt động ([line 791](apps/web/src/pages/GroupDetail.tsx#L791)) — chỉ cần thêm QR modal |
| 12 | Color palette consolidate | ⚠️ Mixed | Đã thấy `#e8a832` / `rgba(232,168,50,...)` — cần grep/audit kỹ trong GD-12 |

---

## Risk flags before GD-1

1. **GroupDetail.tsx 2663 LOC** — extract Activity tab thành component riêng (~300-400 LOC) là điều kiện cần. KHÔNG sửa inline.
2. **Member view leaderboard** ([line 1117](apps/web/src/pages/GroupDetail.tsx#L1117)) — code Podium hiện tại sẽ bị xóa hoàn toàn ở GD-1. Verify không có test nào khẳng định podium hiển thị (current test chỉ check module export → an toàn).
3. **Header analytics button** ([line 805](apps/web/src/pages/GroupDetail.tsx#L805)) — link tới `/groups/${id}/analytics` (page riêng). GD-9 sẽ thay bằng tab; cần xoá button này khi tab analytics có (hoặc giữ song song để không break URL — quyết định ở GD-9).
4. **Q-A backend leaderboard query** — `ChurchGroupService` dùng `UserDailyProgressRepository` (sum all activity). KHÔNG fix trong scope này, GD-DOCS thêm BL-N.

---

**Acceptance:**
- [x] 10 sections completed
- [x] Test baseline confirmed (1227 web / 829 api)
- [ ] Bui review report → confirm GD-1 start

**Next:** GD-1 — Replace tab Leaderboard với tab Hoạt động ([PROMPT_FIX §Task GD-1](docs/group-page/PROMPT_FIX_GROUP_DETAIL.md)). User đã uỷ quyền tiếp tục → proceed.
