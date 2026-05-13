# PROMPT: Fix Group Detail page — UX Polish + Architecture Redesign

> **Mục tiêu:** Fix Group Detail page (`/group/:id`) dựa trên audit screenshot ngày 2026-05-09 + 4 architectural decisions chốt 2026-05-10.
>
> **Reference:**
> - Screenshot bug: `1778403120553_image.png`
> - Mockup redesign: `MOCKUP_GROUP_DETAIL_REDESIGN.html` (member view + leader view với Pulse)
> - SPEC: `SPEC_GROUP_v1_3.md` → bump v1.4 trong sprint này
> - Memory rules: hardcoded hex `#e8a832/#11131e`, Be Vietnam Pro 800/900, no CSS variables
>
> **Position:** Group module polish + architectural cleanup. **Phải làm TRƯỚC Sprint 5** (Quiz Set Professional) vì:
> - Sprint 5 thêm tab "Bộ câu hỏi" cần count badges từ task này
> - Q-A leaderboard rule sunset → backend leaderboard query bị xoá → Sprint 5 entity changes không break gì leaderboard logic cũ
> - UX polish làm foundation tốt cho Sprint 5 features

---

## 🔥 Architectural decisions (Bui ủy quyền 2026-05-10)

| # | Decision | Impact |
|---|---|---|
| 1 | **Bỏ Leaderboard hoàn toàn** | Không phù hợp văn hóa Tin Lành. Replace bằng Activity Feed (Sprint 6) + Personal Mastery (Sprint 5). Backend `GET /leaderboard` deprecate. |
| 2 | **Defer Tournament** | Group hầu hết &lt;4 members. Disable UI, giữ backend code, defer Sprint 7+. |
| 3 | **Activity Feed Sprint 6** | Sprint hiện tại CHỈ UX polish. Activity Feed entity + Pulse heuristic làm Sprint 6 sau Quiz Set. |
| 4 | **Pulse heuristic approved** | `pulse = active_ratio×0.5 + live_rooms×0.3 + new_content×0.2`. Strong ≥0.7, Medium 0.4-0.7, Weak &lt;0.4. Cron @1am daily. Leader-only view. |

**Sprint hiện tại scope:**
- ✅ Bỏ tab Leaderboard khỏi UI (nhưng KHÔNG xoá backend ngay — soft sunset)
- ✅ Header polish + role badge + code copy/QR
- ✅ Empty states + onboarding banner
- ✅ Sidebar context fix (hide personal cards in group)
- ✅ Disable Tournament UI khi members &lt;4
- ✅ Tab Analytics riêng leader-only
- ❌ Activity Feed → Sprint 6
- ❌ Cell Group Pulse → Sprint 6

---

---

## Issues summary (revised)

| # | Sev | Issue | Effort |
|---|---|---|---|
| 1 | 🔴 P0 | **Bỏ tab Leaderboard** — replace bằng "Hành động nhanh" + Members preview + Quiz Sets preview top 3 | M |
| 2 | 🔴 P0 | Empty states cho new groups (chart, alerts hidden khi <7 ngày hoặc <5 members) | M |
| 3 | 🔴 P0 | KPI numbers thiếu scope tooltip (avg trên ai? sample size?) — chuyển vào tab Analytics | S |
| 4 | 🟠 P1 | Disable "Tổ chức giải đấu" card khi members <4 (Tournament defer) | S |
| 5 | 🟠 P1 | Sidebar streak + daily missions hiển thị trong group context | M |
| 6 | 🟠 P1 | Tab labels không có count badges (Members/Announcements/Quiz Sets) | S |
| 7 | 🟠 P1 | Header layout cramped — group name + meta + 3 buttons cùng row | M |
| 8 | 🟠 P1 | "BẠN LÀ TRƯỞNG NHÓM" badge low contrast | S |
| 9 | 🟠 P1 | Tab thứ N "Phân tích" tách riêng (leader-only) — chứa KPI cards + Pulse placeholder cho Sprint 6 | M |
| 10 | 🟡 P2 | Onboarding banner cho new groups (<7 ngày tuổi hoặc <5 members) | M |
| 11 | 🟡 P2 | Group code copy button + QR modal | S |
| 12 | 🟡 P2 | Color palette consolidate (3 shades orange → 1 system) | S |

**Total:** 12 commits + 1 verify task (GD-0) + 1 docs commit (SPEC v1.4 update). Effort ~4 ngày.

**Tab structure mới (post-fix):**
- **Member view (4 tabs):** Hoạt động (default) · Thành viên · Thông báo · Bộ câu hỏi
- **Leader view (5 tabs):** Hoạt động · Thành viên · Thông báo · Bộ câu hỏi · 📊 Phân tích

**"Hoạt động" tab content:**
- Sprint hiện tại: placeholder với "Hành động nhanh" + Members preview + Quiz Sets top 3
- Sprint 6: replace bằng full Activity Feed + Live Now banner

---

## Verification Protocol (BẮT BUỘC trước mỗi task)

1. **Read code trước khi sửa** — `pages/GroupDetail.tsx` đã grow lớn (>500 LOC?), cần verify structure
2. **Quote line numbers** trong commit message
3. **Tests pre-existing fail** = baseline, KHÔNG block
4. **Memory rules apply** — hex colors, Be Vietnam Pro fonts, no CSS variables
5. **i18n complete** — vi.json + en.json cho mọi string mới
6. **Mobile responsive** — fix desktop nhưng test ≥768px breakpoint không break

---

## Commit hygiene

- **Mỗi task = 1 commit riêng.** Format: `fix(group):` hoặc `feat(group):` hoặc `refactor(group):`
- Sau mỗi commit: STOP, chạy test, báo cáo, đợi Bui confirm
- KHÔNG chạy 12 tasks liên tiếp một lèo

---

## Task GD-0 — Pre-flight verification 🔴 (mandatory, no commit)

**Goal:** Verify codebase state trước khi start fixes. Output report file.

**Output:** `GROUP_DETAIL_AUDIT_REPORT.md` ở root.

**Checks:**

### Check 1 — GroupDetail.tsx structure
```bash
wc -l apps/web/src/pages/GroupDetail.tsx
grep -n "useState\|useQuery\|useEffect" apps/web/src/pages/GroupDetail.tsx | head -30
grep -n "Tabs\|TabPanel\|defaultTab" apps/web/src/pages/GroupDetail.tsx
```
Báo cáo:
- LOC count
- Số state hooks + queries (nếu >10 → cần refactor sau)
- Tab implementation (custom hay library?)

### Check 2 — Tab content rendering (CRITICAL)
```bash
grep -B 2 -A 10 "Leaderboard\|leaderboard" apps/web/src/pages/GroupDetail.tsx | head -60
```
Báo cáo:
- Tab "Leaderboard" hiện render component nào?
- Có conditional rendering switch không?
- Tab default value khi mount là gì?
- **Confirm:** đây là bug (tab Leaderboard render Phân tích) hay intentional design?

### Check 3 — Group analytics queries
```bash
grep -rn "GET /api/groups.*analytics\|/api/groups.*stats\|getGroupAnalytics" apps/web/src/
grep -rn "@GetMapping.*analytics\|/groups/.*analytics" apps/api/src/main/java/com/biblequiz/
```
Báo cáo:
- Endpoint analytics đang có không?
- Frontend gọi endpoint nào?
- Permission check leader-only?

### Check 4 — Group sidebar layout
```bash
find apps/web/src -name "GroupLayout*.tsx" -o -name "AppLayout.tsx" | head
grep -rn "Streak\|DailyMission" apps/web/src/components/layout/ | head
```
Báo cáo:
- Sidebar shared giữa group detail vs home page hay riêng?
- StreakCard + DailyMissionCard render conditional theo route hay always?
- → Confirm: nên hide trong group context hay không

### Check 5 — Group entity counts data
```bash
grep -n "totalMembers\|memberCount\|quizSetCount" apps/api/src/main/java/com/biblequiz/modules/group/dto/
```
Báo cáo:
- DTO trả về những count nào?
- Cần thêm fields nào cho tab count badges (announcements count, quiz sets count, members count)?

### Check 6 — Group age tracking
```bash
grep -n "createdAt\|created_at" apps/api/src/main/java/com/biblequiz/modules/group/entity/ChurchGroup.java
```
Báo cáo:
- Field có sẵn không? Type?
- Cần expose qua DTO nếu chưa có (cho onboarding banner logic)

### Check 7 — Tournament min members validation
```bash
grep -rn "tournament.*min\|MIN_TOURNAMENT_PARTICIPANTS" apps/api/src/main/java/com/biblequiz/
```
Báo cáo:
- Backend đã enforce min 4 chưa?
- Frontend có check để disable button không?

### Check 8 — i18n keys
```bash
grep -E "leaderboard|analytics|tournament|onboarding" apps/web/src/i18n/vi.json | head -20
grep -E "leaderboard|analytics|tournament|onboarding" apps/web/src/i18n/en.json | head -20
```
Báo cáo:
- Existing keys related Group Detail
- Missing keys cần add cho fix

### Check 9 — Test baseline
```bash
cd apps/web && npm run test 2>&1 | grep -E "Tests:|passed" | tail -3
cd apps/api && ./mvnw test 2>&1 | grep -E "Tests run" | tail -3
```
Lưu vào `GROUP_DETAIL_BASELINE.txt`.

### Check 10 — Existing GroupDetail tests
```bash
find apps/web/src -name "GroupDetail*.test.*" -o -name "GroupDetail.test.tsx"
```
Báo cáo:
- Có test file không?
- Coverage thế nào?

**Acceptance:**
- File `GROUP_DETAIL_AUDIT_REPORT.md` với 10 sections
- File `GROUP_DETAIL_BASELINE.txt` với test counts
- Bui review report → confirm trước khi start GD-1

**KHÔNG commit gì — chỉ verification step.**

---

## Task GD-1 — Replace tab "Leaderboard" với tab "Hoạt động" 🔴

**Goal:** Bỏ ranking-style leaderboard. Default tab "Hoạt động" hiển thị: Quick Actions + Members preview + Quiz Sets top 3 + Live Now banner. Sprint 6 sẽ replace bằng full Activity Feed.

**Files:**
- `apps/web/src/pages/GroupDetail.tsx`
- `apps/web/src/components/group/GroupActivityTab.tsx` (NEW)
- `apps/web/src/components/group/QuickActionsPanel.tsx` (extract existing)
- `apps/web/src/components/group/MembersPreviewCard.tsx` (NEW)
- `apps/web/src/components/group/QuizSetsPreviewCard.tsx` (NEW)
- **DELETE** old leaderboard components nếu chỉ dùng cho Group context (verify GD-0 Check 2 trước)

**Steps:**

1. **Verify từ GD-0 Check 2** — confirm:
   - Component `<GroupLeaderboard>` đang dùng ở đâu khác không?
   - Hooks/queries liên quan có shared với features khác không?
   - → Nếu shared (vd cả Personal Leaderboard) → KHÔNG xoá, chỉ unmount khỏi Group Detail

2. **New tab structure:**
```tsx
const tabs = [
  { id: 'activity', label: t('group.tabs.activity'), icon: '📜' },
  { id: 'members', label: t('group.tabs.members'), icon: '👥' },
  { id: 'announcements', label: t('group.tabs.announcements'), icon: '📢' },
  { id: 'quiz-sets', label: t('group.tabs.quizSets'), icon: '📚' },
  // Leader-only:
  ...(isLeaderOrMod ? [{ 
    id: 'analytics', 
    label: t('group.tabs.analytics'), 
    icon: '📊',
    leaderOnly: true 
  }] : [])
];

// Default tab
const [activeTab, setActiveTab] = useState<TabId>('activity');
```

3. **GroupActivityTab component (Sprint 5 placeholder, Sprint 6 sẽ replace):**
```tsx
export function GroupActivityTab({ group, isLeader }: Props) {
  return (
    <div className="space-y-5">
      {/* Live Now banner if có active live rooms */}
      <LiveNowBanner groupId={group.id} />
      
      {/* Quick Actions — DIFFERENT cho leader vs member */}
      <QuickActionsPanel 
        group={group}
        isLeader={isLeader}
        // Leader: 4 actions (Tạo quiz, Bắt đầu Live, Lên lịch, Đăng thông báo)
        // Member: 2 actions (Tự ôn quiz, Quiz đang lên lịch)
        // KHÔNG có "Tham gia Live Room" cho member vì:
        //   - Live Now banner đã display + button "Tham gia →"
        //   - Sidebar Group Quick Info đã list active rooms
        //   - Duplicate UI = clutter, không actionable
      />
      
      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {/* Sprint 6 NOTE: Activity Feed sẽ thay placeholder này */}
          <ActivityFeedPlaceholder />
        </div>
        <div className="space-y-4">
          <MembersPreviewCard groupId={group.id} />
          <QuizSetsPreviewCard groupId={group.id} limit={3} />
        </div>
      </div>
    </div>
  );
}
```

**QuickActionsPanel implementation:**
```tsx
export function QuickActionsPanel({ group, isLeader }: Props) {
  // Leader: 4 cards CREATE actions
  if (isLeader) {
    return (
      <section>
        <h2 className="text-xs font-bold text-[#e8a832] uppercase tracking-wider mb-3">
          ⚡ {t('group.quickActions.title')}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionCard icon="📚" label={t('group.action.createQuizSet')} hint="Bài giảng / Sinh hoạt" onClick={...} />
          <ActionCard icon="🎮" label={t('group.action.startLive')} hint="Realtime · 5 modes" highlight onClick={...} />
          <ActionCard 
            icon="🏆" 
            label={t('group.action.tournament')} 
            hint={group.memberCount < 4 
              ? t('group.action.tournament.needMembers', { current: group.memberCount, min: 4 })
              : "Bracket 4-32 người"
            }
            disabled={group.memberCount < 4}
          />
          <ActionCard icon="📢" label={t('group.action.announce')} hint={`Cho ${group.memberCount} thành viên`} onClick={...} />
        </div>
      </section>
    );
  }
  
  // Member: 2 cards CONSUME actions only
  // Note: KHÔNG có "Tham gia Live Room" — Live Now banner đã handle
  return (
    <section>
      <h2 className="text-xs font-bold text-[#e8a832] uppercase tracking-wider mb-3">
        ⚡ {t('group.quickActions.title')}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <ActionCard 
          icon="📚" 
          label={t('group.action.practice')} 
          hint={t('group.action.practice.hint', { count: group.quizSetsCount })}
          onClick={() => setActiveTab('quiz-sets')}
        />
        {hasActiveScheduledQuiz && (
          <ActionCard 
            icon="📅" 
            label={t('group.action.scheduledQuiz')} 
            hint={t('group.action.scheduledQuiz.hint', { count: scheduledCount, deadline })}
            highlight  // purple accent
            onClick={() => navigate('/scheduled-quiz')}
          />
        )}
      </div>
    </section>
  );
}
```

**Hide rule:** Nếu member KHÔNG có scheduled quiz active VÀ chỉ còn 1 action (Tự ôn) → Quick Actions section có thể hide/show 1 column tùy preference. Default: vẫn show Tự ôn quiz card.

4. **ActivityFeedPlaceholder (Sprint 5 only, removed Sprint 6):**
```tsx
function ActivityFeedPlaceholder() {
  return (
    <div className="glass-subtle rounded-2xl p-8 text-center border border-dashed border-white/10">
      <div className="text-5xl mb-3 opacity-40">📜</div>
      <h3 className="text-white font-bold mb-1">{t('group.activity.placeholder.title')}</h3>
      <p className="text-sm text-gray-400 max-w-md mx-auto">
        {t('group.activity.placeholder.desc')}
      </p>
      <div className="mt-3 text-[10px] text-gray-500">{t('group.activity.placeholder.sprint')}</div>
    </div>
  );
}
```

5. **LiveNowBanner — pinned khi có active live rooms:**
```tsx
function LiveNowBanner({ groupId }: { groupId: string }) {
  const { data } = useQuery({
    queryKey: ['group-active-rooms', groupId],
    queryFn: () => api.get(`/api/groups/${groupId}/active-rooms`),
    refetchInterval: 30000, // refresh 30s
  });
  
  if (!data?.length) return null;
  
  const room = data[0]; // first active room
  
  return (
    <div className="rounded-xl p-3 border-2 border-emerald-400/40 bg-emerald-500/8">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-base shrink-0">🎮</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-emerald-400 uppercase animate-pulse">● ĐANG DIỄN RA</span>
            <span className="text-[10px] text-gray-500">{formatRelative(room.startedAt)}</span>
          </div>
          <div className="text-sm font-bold text-white mt-0.5">{room.name}</div>
          <div className="text-[10px] text-gray-300 mt-0.5">
            Mode: {room.modeLabel} · Host: {room.hostName} · {room.playerCount}/{room.maxPlayers} người
          </div>
        </div>
        <button 
          onClick={() => navigate(`/room/${room.code}`)}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-[#11131e] text-xs font-bold whitespace-nowrap"
        >
          Tham gia →
        </button>
      </div>
    </div>
  );
}
```

6. **MembersPreviewCard — show online + avatars:**
```tsx
export function MembersPreviewCard({ groupId }: { groupId: string }) {
  const { data } = useQuery({
    queryKey: ['group-members-preview', groupId],
    queryFn: () => api.get(`/api/groups/${groupId}/members?limit=20`),
  });
  
  const onlineMembers = data?.filter(m => m.online) ?? [];
  const offlineMembers = data?.filter(m => !m.online) ?? [];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-[#e8a832] uppercase tracking-wider">
          👥 {t('group.members.title')} ({data?.length ?? 0})
        </h2>
        <button onClick={() => navigate('members')} className="text-[10px] text-gray-400 hover:text-[#e8a832]">
          {t('common.viewAll')} →
        </button>
      </div>
      <div className="glass rounded-xl p-3">
        {onlineMembers.length > 0 && (
          <>
            <div className="text-[9px] font-bold text-emerald-400 uppercase mb-2">
              🟢 Đang online ({onlineMembers.length})
            </div>
            <div className="space-y-1.5 mb-3">
              {onlineMembers.slice(0, 5).map(m => (
                <MemberRow key={m.id} member={m} showOnline />
              ))}
            </div>
          </>
        )}
        {offlineMembers.length > 0 && (
          <>
            <div className="text-[9px] font-bold text-gray-500 uppercase mb-2 pt-2 border-t border-white/5">
              Khác ({offlineMembers.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {offlineMembers.slice(0, 9).map(m => (
                <Avatar key={m.id} member={m} size="sm" />
              ))}
              {offlineMembers.length > 9 && (
                <div className="w-7 h-7 rounded-full glass-subtle border border-white/10 flex items-center justify-center text-gray-500 text-[10px]">
                  +{offlineMembers.length - 9}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

7. **QuizSetsPreviewCard — top 3 by play_count:**
```tsx
export function QuizSetsPreviewCard({ groupId, limit = 3 }: Props) {
  const { data } = useQuery({
    queryKey: ['group-quiz-sets-top', groupId, limit],
    queryFn: () => api.get(`/api/groups/${groupId}/quiz-sets?sort=popular&limit=${limit}&status=PUBLISHED`),
  });
  
  if (!data?.length) {
    return <EmptyQuizSets isLeader={isLeader} />;
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-[#e8a832] uppercase tracking-wider">
          📚 {t('group.quizSets.popular')}
        </h2>
        <button onClick={() => setActiveTab('quiz-sets')} className="text-[10px] text-gray-400 hover:text-[#e8a832]">
          Tất cả {data.totalCount} →
        </button>
      </div>
      <div className="space-y-2">
        {data.items.map(set => (
          <QuizSetMiniCard key={set.id} quizSet={set} />
        ))}
      </div>
    </div>
  );
}
```

8. **Backend: deprecate leaderboard endpoint (soft sunset):**
```java
// ChurchGroupController.java
@Deprecated
@GetMapping("/{id}/leaderboard")
public ResponseEntity<?> getLeaderboard(@PathVariable Long id) {
    // Sprint 5: vẫn trả về data nếu old client gọi (backward compat)
    // Sprint 7+: xoá endpoint hoàn toàn
    return ResponseEntity.ok(leaderboardService.getLeaderboard(id));
}
```
NOTE: KHÔNG xoá ngay vì:
- Mobile app có thể đang dùng (cần version check)
- Test data seeder có thể reference
- Sunset gradually qua 2-3 sprints

9. **i18n strings:**
```json
{
  "group.tabs.activity": "Hoạt động",
  "group.tabs.analytics": "Phân tích",
  "group.activity.placeholder.title": "Activity Feed sắp ra mắt",
  "group.activity.placeholder.desc": "Sprint tới sẽ hiển thị dòng thời gian: ai đã thuộc bộ câu hỏi nào, live room nào kết thúc, thông báo mới...",
  "group.activity.placeholder.sprint": "Dự kiến Sprint 6"
}
```

10. **Tests:**
- Default tab = 'activity' on mount
- LiveNowBanner render khi có active rooms, hidden khi không
- MembersPreviewCard separate online/offline
- QuizSetsPreviewCard top 3 by play_count
- Member role: KHÔNG có tab "Phân tích" trong tabs array
- Leader role: tab "Phân tích" hiện thị

**Verify:**
- Manual: load /group/123 → default tab "Hoạt động" với placeholder + members + quiz sets
- Manual: KHÔNG còn tab "Leaderboard" trong UI
- Manual: leader thấy 5 tabs, member thấy 4 tabs
- Manual: live room đang chạy → banner pinned top
- Backend test: `/api/groups/{id}/leaderboard` vẫn work (soft sunset)

**Commit:** `feat(group): replace Leaderboard tab with Activity tab (Quick Actions + Members + Quiz Sets preview)`

---

## Task GD-2 — Empty states cho chart + alerts 🔴

**Goal:** Group <7 ngày tuổi hoặc <5 members không show analytics misleading.

**Files:**
- `apps/web/src/components/group/GroupAnalyticsPanel.tsx`
- `apps/web/src/components/group/ActivityChart.tsx`
- `apps/web/src/components/group/InactiveMembersAlert.tsx`

**Steps:**

1. **Group age helper:**
```tsx
function getGroupAge(createdAt: string): { days: number; isNew: boolean } {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  return { days, isNew: days < 7 };
}
```

2. **ActivityChart empty state:**
```tsx
export function ActivityChart({ data, groupAge, memberCount }: Props) {
  // Hide chart entirely cho groups quá nhỏ/mới
  if (groupAge.isNew || memberCount < 3) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <div className="text-4xl mb-2 opacity-50">📊</div>
        <h4 className="text-white font-semibold text-sm mb-1">
          {t('group.analytics.chart.empty.title')}
        </h4>
        <p className="text-xs text-gray-400">
          {groupAge.isNew 
            ? t('group.analytics.chart.empty.tooNew', { days: 7 - groupAge.days })
            : t('group.analytics.chart.empty.tooSmall')}
        </p>
      </div>
    );
  }
  
  // Show chart only if has actual data points
  if (!data?.length || data.every(d => d.count === 0)) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <div className="text-4xl mb-2 opacity-50">📈</div>
        <p className="text-xs text-gray-400">{t('group.analytics.chart.empty.noActivity')}</p>
      </div>
    );
  }
  
  return <ActualChart data={data} />;
}
```

3. **InactiveMembersAlert logic:**
```tsx
export function InactiveMembersAlert({ inactiveCount, totalMembers, groupAge }: Props) {
  // Hide alert cho group quá mới
  if (groupAge.isNew) return null;
  
  // Hide alert nếu inactive% quá cao do sample nhỏ (statistical noise)
  if (totalMembers < 5) return null;
  
  // Chỉ alert khi inactive >= 30% members (meaningful)
  const inactiveRatio = inactiveCount / totalMembers;
  if (inactiveRatio < 0.3) return null;
  
  return (
    <div className="rounded-xl p-4 border border-orange-400/30" style={{background: 'rgba(255,165,0,0.06)'}}>
      <div className="flex items-center gap-2">
        <span>⚠️</span>
        <span className="text-sm text-orange-300 font-semibold">
          {t('group.alert.inactive.title', { count: inactiveCount, days: 7 })}
        </span>
        <button className="ml-auto text-xs text-orange-300 hover:underline">
          {t('group.alert.inactive.viewList')} →
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1">{t('group.alert.inactive.desc')}</p>
    </div>
  );
}
```

4. **i18n strings (vi.json):**
```json
{
  "group.analytics.chart.empty.title": "Chưa đủ dữ liệu",
  "group.analytics.chart.empty.tooNew": "Nhóm mới · còn {{days}} ngày để có thống kê",
  "group.analytics.chart.empty.tooSmall": "Cần ít nhất 3 thành viên để hiển thị biểu đồ",
  "group.analytics.chart.empty.noActivity": "Chưa có hoạt động nào trong khoảng thời gian này"
}
```

5. **Tests:**
   - ActivityChart với groupAge=3 days → empty state "tooNew"
   - ActivityChart với memberCount=2 → empty state "tooSmall"
   - InactiveMembersAlert với groupAge=3 → null (hidden)
   - InactiveMembersAlert với 1/2 inactive (50%) + memberCount=2 → null (sample nhỏ)
   - InactiveMembersAlert với 4/10 inactive (40%) + memberCount=10 → render

**Verify:**
- Manual: group 2-member mới → KHÔNG show "1 thành viên không hoạt động" alert
- Manual: chart area show empty state thay vì axis trống

**Commit:** `fix(group): empty states for analytics chart and inactive alert (group age + member count gates)`

---

## Task GD-3 — KPI scope tooltips 🔴

**Goal:** 4 KPI cards (Active, Avg Score, Accuracy, Inactive) có tooltip rõ scope.

**Files:**
- `apps/web/src/components/group/GroupKpiCard.tsx`
- `apps/web/src/components/ui/Tooltip.tsx` (verify existing hoặc tạo)

**Steps:**

1. **GroupKpiCard component:**
```tsx
interface Props {
  label: string;
  value: string | number;
  unit?: string;
  subLabel?: string;
  color: 'gold' | 'sky' | 'emerald' | 'orange';
  tooltip: string;  // Sample size + scope
}

export function GroupKpiCard({ label, value, unit, subLabel, color, tooltip }: Props) {
  return (
    <div className="glass rounded-xl p-4 relative group cursor-help">
      <div className="text-[10px] text-gray-400 uppercase font-semibold">{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`text-2xl font-extrabold ${colorClass[color]}`}>{value}</span>
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
      {subLabel && <div className="text-xs text-gray-400 mt-0.5">{subLabel}</div>}
      
      {/* Tooltip on hover */}
      <Tooltip content={tooltip} position="bottom">
        <span className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 text-xs">ⓘ</span>
      </Tooltip>
    </div>
  );
}
```

2. **Usage with tooltips:**
```tsx
<GroupKpiCard 
  label={t('group.kpi.activeWeek')}
  value={`${activeCount}/${totalMembers}`}
  subLabel={`${(activeCount/totalMembers*100).toFixed(0)}%`}
  color="gold"
  tooltip={t('group.kpi.activeWeek.tooltip', { 
    active: activeCount, 
    total: totalMembers,
    period: 'tuần này'
  })}
/>

<GroupKpiCard 
  label={t('group.kpi.avgScore')}
  value={avgScore}
  unit="đ"
  subLabel={t('group.kpi.avgScore.subLabel', { count: activeCount })}  // "đ/người active"
  color="sky"
  tooltip={t('group.kpi.avgScore.tooltip', { 
    sample: activeCount,
    note: activeCount < 3 ? '⚠️ Sample nhỏ, độ tin cậy thấp' : ''
  })}
/>

<GroupKpiCard 
  label={t('group.kpi.accuracy')}
  value={`${accuracy}%`}
  subLabel={accuracy >= 70 ? t('group.kpi.accuracy.stable') : t('group.kpi.accuracy.improving')}
  color="emerald"
  tooltip={t('group.kpi.accuracy.tooltip', { sample: activeCount })}
/>

<GroupKpiCard 
  label={t('group.kpi.inactive')}
  value={inactiveCount}
  subLabel={t('group.kpi.inactive.encourage')}
  color="orange"
  tooltip={t('group.kpi.inactive.tooltip', { 
    count: inactiveCount, 
    total: totalMembers,
    days: 7 
  })}
/>
```

3. **i18n examples:**
```json
{
  "group.kpi.activeWeek": "Active tuần này",
  "group.kpi.activeWeek.tooltip": "{{active}}/{{total}} thành viên active trong {{period}}. Active = chơi ít nhất 1 quiz trong period.",
  "group.kpi.avgScore.subLabel": "đ/người ({{count}} active)",
  "group.kpi.avgScore.tooltip": "Trung bình điểm trên {{sample}} thành viên có hoạt động. {{note}}",
  "group.kpi.inactive.tooltip": "{{count}}/{{total}} thành viên không hoạt động {{days}}+ ngày qua"
}
```

4. **Sample size warning:**
- `activeCount < 3` → show ⚠️ icon + "Sample nhỏ"
- `activeCount < 5` → tooltip note "Độ tin cậy thấp do ít dữ liệu"

5. **Tests:**
   - Tooltip render khi hover
   - Sample warning hiện khi activeCount < 3

**Verify:**
- Manual: hover từng KPI card → tooltip giải thích scope
- Manual: 2-member group → KPI cards hiện cảnh báo sample nhỏ

**Commit:** `feat(group): KPI cards with scope tooltips and sample size warnings`

---

## Task GD-4 — Disable Tournament card khi members <4 🟠

**Goal:** "Tổ chức giải đấu" card grayed out + tooltip nếu group <4 members.

**Files:**
- `apps/web/src/components/group/QuickActionsPanel.tsx` (hoặc tên đúng)

**Steps:**

1. **Conditional disable:**
```tsx
function QuickActionCard({ icon, label, hint, disabled, disabledReason, onClick }) {
  return (
    <button 
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`glass rounded-xl p-4 text-left ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-[#e8a832]/30'}`}
      title={disabled ? disabledReason : undefined}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-bold text-white">{label}</div>
      <div className="text-xs text-gray-400 mt-1">
        {disabled && disabledReason ? disabledReason : hint}
      </div>
    </button>
  );
}

// Usage:
<QuickActionCard
  icon="🏆"
  label={t('group.quickAction.tournament')}
  hint={t('group.quickAction.tournament.hint')}
  disabled={memberCount < 4}
  disabledReason={t('group.quickAction.tournament.needMembers', { current: memberCount, min: 4 })}
  onClick={() => navigate(`/group/${id}/create-tournament`)}
/>
```

2. **Update các cards khác** với hint thay vì data echo:
```tsx
// Trước (data echo):
<QuickActionCard label="Tạo quiz set" hint="4 bộ quiz" />
<QuickActionCard label="Quản lý thành viên" hint="2 thành viên" />

// Sau (action hint):
<QuickActionCard label="Tạo quiz set" hint="Bài giảng / Sinh hoạt" />
<QuickActionCard label="Quản lý thành viên" hint="Mời / Kick / Promote" />
```

3. **i18n:**
```json
{
  "group.quickAction.tournament": "Tổ chức giải đấu",
  "group.quickAction.tournament.hint": "Bracket 4-32 người",
  "group.quickAction.tournament.needMembers": "Cần ≥{{min}} thành viên (hiện {{current}})"
}
```

4. **Tests:**
   - memberCount=2 → button disabled + reason hiển thị
   - memberCount=4 → button enabled, hint default
   - memberCount=10 → button enabled

**Verify:**
- Manual: 2-member group → "Tổ chức giải đấu" gray out + "Cần ≥4 thành viên (hiện 2)"

**Commit:** `fix(group): disable tournament quick action when members < 4`

---

## Task GD-5 — Move streak + daily missions khỏi group sidebar 🟠

**Goal:** Sidebar trong group context không show personal stats (streak, missions). Chỉ show group-relevant info.

**Files:**
- `apps/web/src/components/layout/AppLayout.tsx`
- `apps/web/src/components/sidebar/StreakCard.tsx`
- `apps/web/src/components/sidebar/DailyMissionsCard.tsx`

**Steps:**

1. **Verify GD-0 Check 4 result** — sidebar shared hay riêng?

2. **Conditional render based on route:**
```tsx
// AppLayout.tsx
function AppLayout() {
  const location = useLocation();
  const isGroupContext = location.pathname.startsWith('/group/');
  
  return (
    <div className="flex">
      <aside className="w-[240px] sidebar">
        <GroupSwitcher />
        <Nav />
        
        {/* Personal cards: KHÔNG show in group context */}
        {!isGroupContext && (
          <>
            <StreakCard />
            <DailyMissionsCard />
          </>
        )}
        
        {/* Group-specific card khi in group context */}
        {isGroupContext && (
          <GroupQuickInfoCard groupId={extractGroupId(location.pathname)} />
        )}
      </aside>
      <main>{children}</main>
    </div>
  );
}
```

3. **GroupQuickInfoCard (NEW):** Show group-relevant info trong sidebar:
```tsx
function GroupQuickInfoCard({ groupId }: { groupId: string }) {
  const { data } = useQuery({ queryKey: ['group-mini', groupId] });
  
  return (
    <div className="glass rounded-xl p-3 m-3">
      <div className="text-[10px] text-gray-400 uppercase font-semibold mb-2">
        {t('group.sidebar.activeNow')}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-sm text-white font-semibold">{data?.activeNow ?? 0} online</span>
      </div>
      
      {data?.liveRooms?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">
            🎮 {t('group.sidebar.liveRooms')}
          </div>
          {data.liveRooms.map(room => (
            <button key={room.id} className="text-xs text-emerald-400 hover:underline block">
              {room.name} →
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

4. **Tests:**
   - Render AppLayout với route `/group/123` → StreakCard not in DOM
   - Render với route `/home` → StreakCard rendered
   - Group context → GroupQuickInfoCard rendered

**Verify:**
- Manual: vào group detail → sidebar KHÔNG có streak/missions
- Manual: vào /home → sidebar CÓ streak/missions

**Commit:** `refactor(layout): hide personal cards in group context, show group quick info instead`

---

## Task GD-6 — Tab labels với count badges 🟠

**Goal:** Tab labels hiện count: `Leaderboard (2)`, `Thành viên (2)`, `Thông báo (0)`, `Bộ câu hỏi (4)`.

**Files:**
- `apps/web/src/components/group/GroupTabs.tsx`
- `apps/api/src/main/java/com/biblequiz/modules/group/dto/GroupSummaryDTO.java`

**Steps:**

1. **Backend: extend DTO** (nếu chưa có):
```java
public class GroupSummaryDTO {
    // ... existing fields
    private Integer membersCount;
    private Integer activeMembersCount; // for leaderboard count
    private Integer announcementsCount;
    private Integer quizSetsCount; // PUBLISHED only
}
```

2. **Service populate counts:**
```java
GroupSummaryDTO toDTO(ChurchGroup group) {
    DTO dto = new DTO();
    // ...
    dto.setMembersCount(memberRepository.countByGroupId(group.getId()));
    dto.setActiveMembersCount(memberRepository.countActiveByGroupId(group.getId()));
    dto.setAnnouncementsCount(announcementRepository.countByGroupId(group.getId()));
    dto.setQuizSetsCount(quizSetRepository.countByGroupIdAndPublishStatus(
        group.getId(), PublishStatus.PUBLISHED));
    return dto;
}
```

3. **Frontend tab component:**
```tsx
const tabs = [
  // 'activity' tab KHÔNG có count badge (mixed content)
  { id: 'activity', label: t('group.tabs.activity'), icon: '📜' },
  { id: 'members', label: t('group.tabs.members'), count: data?.membersCount },
  { id: 'announcements', label: t('group.tabs.announcements'), count: data?.announcementsCount },
  { id: 'quiz-sets', label: t('group.tabs.quizSets'), count: data?.quizSetsCount },
  ...(isLeaderOrMod ? [{ 
    id: 'analytics', 
    label: t('group.tabs.analytics'),
    icon: '📊',
    leaderOnly: true 
  }] : [])
];

return (
  <div className="flex gap-6 border-b border-white/5">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
          activeTab === tab.id 
            ? 'text-[#e8a832] border-b-2 border-[#e8a832]' 
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        {tab.icon && <span>{tab.icon}</span>}
        <span>{tab.label}</span>
        {tab.count !== undefined && tab.count > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            activeTab === tab.id ? 'bg-[#e8a832]/20' : 'bg-white/5'
          }`}>
            {tab.count}
          </span>
        )}
        {tab.leaderOnly && (
          <span className="text-[9px] text-[#e8a832] bg-[#e8a832]/15 px-1.5 py-0.5 rounded font-bold">👑</span>
        )}
      </button>
    ))}
  </div>
);
```

4. **Tests:**
   - Tab "Leaderboard" với count=2 → badge "2" hiện
   - Tab "Thông báo" với count=0 → badge ẩn
   - Tab active → badge gold; inactive → badge gray

**Verify:**
- Manual: 4 tabs hiện count badges đúng
- Backend test: countByGroupIdAndPublishStatus filter PUBLISHED only

**Commit:** `feat(group): tab count badges (members/announcements/quiz-sets)`

---

## Task GD-7 — Header layout improvements 🟠

**Goal:** Header less cramped — group name standalone, meta info gọn, copy button cho code.

**Files:**
- `apps/web/src/components/group/GroupHeader.tsx`

**Steps:**

1. **New header structure:**
```tsx
<header className="glass-strong rounded-2xl p-5 mb-5">
  {/* Row 1: Group identity + actions */}
  <div className="flex items-start gap-4">
    {/* Avatar */}
    <div className="w-16 h-16 rounded-2xl gold-grad flex items-center justify-center text-3xl shrink-0">
      ⛪
    </div>
    
    {/* Title + meta */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-extrabold text-white">{group.name}</h1>
        {isLeader && <RoleBadge role="leader" />}
      </div>
      
      {/* Meta info — 2 visual groups */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        {/* Stats group */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            👥 <span className="text-gray-300 font-semibold">{group.memberCount}</span> {t('group.members')}
          </span>
          <span className="text-gray-600">·</span>
          <span className="flex items-center gap-1">
            🔥 {group.streakDays || 0} {t('group.streak.days')}
          </span>
        </div>
        
        {/* Code with copy button */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-gray-500 text-xs">{t('group.code')}:</span>
          <button 
            onClick={handleCopyCode}
            className="font-mono text-sm text-[#e8a832] bg-[#e8a832]/10 px-2 py-1 rounded border border-[#e8a832]/20 hover:bg-[#e8a832]/15 flex items-center gap-1.5"
          >
            <span>{group.code}</span>
            {copied ? <span>✓</span> : <CopyIcon className="w-3 h-3" />}
          </button>
          <button onClick={() => setShowQrModal(true)} className="text-gray-400 hover:text-[#e8a832]">
            <QrCodeIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    
    {/* Actions: Invite primary, others icon-only */}
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={handleAnalytics} className="w-9 h-9 rounded-lg glass flex items-center justify-center hover:bg-white/10" title={t('group.analytics')}>
        📊
      </button>
      <button onClick={handleSettings} className="w-9 h-9 rounded-lg glass flex items-center justify-center hover:bg-white/10" title={t('group.settings')}>
        <SettingsIcon className="w-4 h-4 text-gray-400" />
      </button>
      <button onClick={handleInvite} className="px-4 py-2 rounded-lg gold-grad text-[#11131e] text-sm font-extrabold flex items-center gap-1.5">
        <span>👥</span><span>{t('group.invite')}</span>
      </button>
    </div>
  </div>
  
  {/* Optional: leader name row */}
  {group.leaderName && (
    <div className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
      <span>👑</span>
      <span>{t('group.leader')}: <span className="text-gray-300">{group.leaderName}</span></span>
    </div>
  )}
</header>
```

2. **Copy code feedback:**
```tsx
const [copied, setCopied] = useState(false);
const handleCopyCode = async () => {
  await navigator.clipboard.writeText(group.code);
  setCopied(true);
  toast.success(t('group.code.copied'));
  setTimeout(() => setCopied(false), 2000);
};
```

3. **Tests:**
   - Header render với leader → role badge hiện
   - Click copy code → clipboard called + toast
   - Settings button → click navigate

**Verify:**
- Manual: header gọn, group name nổi bật, code có copy button working

**Commit:** `refactor(group): header layout — group name primary, meta info grouped, code copyable`

---

## Task GD-8 — Role badge "TRƯỞNG NHÓM" — gold gradient 🟠

**Goal:** Role badge contrast cao, dễ thấy.

**Files:**
- `apps/web/src/components/group/RoleBadge.tsx`

**Steps:**

```tsx
const roleConfig = {
  leader: {
    icon: '👑',
    label: 'group.role.leader',
    bgClass: 'bg-gradient-to-r from-[#e8a832]/20 to-[#d4941f]/20',
    borderClass: 'border-[#e8a832]/40',
    textClass: 'text-[#e8a832]',
  },
  mod: {
    icon: '🛡️',
    label: 'group.role.mod',
    bgClass: 'bg-gradient-to-r from-sky-500/20 to-sky-600/20',
    borderClass: 'border-sky-400/40',
    textClass: 'text-sky-400',
  },
  member: null, // không show badge cho regular member
};

export function RoleBadge({ role, isCurrentUser = false }: Props) {
  const config = roleConfig[role];
  if (!config) return null;
  
  const label = isCurrentUser 
    ? t('group.role.youAre', { role: t(config.label) })
    : t(config.label);
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.bgClass} ${config.borderClass} ${config.textClass}`}>
      <span>{config.icon}</span>
      <span>{label}</span>
    </span>
  );
}
```

i18n:
```json
{
  "group.role.leader": "TRƯỞNG NHÓM",
  "group.role.mod": "MOD",
  "group.role.youAre": "BẠN LÀ {{role}}"
}
```

**Tests:** badge render với role=leader → gold styling visible.

**Commit:** `fix(group): role badge gold gradient with high contrast`

---

## Task GD-9 — Tab "Phân tích" leader-only với Pulse placeholder 🟠

**Goal:** Phân tích là tab leader-only, chứa KPI cards + chart + alerts từ "Phân tích nhóm" cũ + **placeholder cho Cell Group Pulse** (Sprint 6 sẽ wire backend).

**Files:**
- `apps/web/src/pages/GroupDetail.tsx`
- `apps/web/src/components/group/GroupAnalyticsTab.tsx`
- `apps/web/src/components/group/CellGroupPulseCard.tsx` (NEW, placeholder Sprint 5, real Sprint 6)

**Steps:**

1. **Tab visibility (Leader/Mod only):**
```tsx
const tabs = [
  { id: 'activity', label: t('group.tabs.activity'), icon: '📜' },
  { id: 'members', ...},
  { id: 'announcements', ...},
  { id: 'quiz-sets', ...},
  ...(isLeaderOrMod ? [{
    id: 'analytics',
    label: t('group.tabs.analytics'),
    icon: '📊',
    leaderOnly: true,
    badge: { text: '👑', color: 'gold' }, // Visual hint leader-only
  }] : [])
];
```

2. **GroupAnalyticsTab structure:**
```tsx
export function GroupAnalyticsTab({ group }: Props) {
  return (
    <div className="space-y-5">
      {/* Cell Group Pulse — Sprint 5 placeholder, Sprint 6 wire backend */}
      <CellGroupPulseCard groupId={group.id} />
      
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{t('group.analytics.period')}:</span>
        <PeriodFilter value={period} onChange={setPeriod} default="30d" />
      </div>
      
      {/* KPI cards (4 cards với tooltips từ GD-3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <GroupKpiCard {...activeKpi} />
        <GroupKpiCard {...avgScoreKpi} />
        <GroupKpiCard {...accuracyKpi} />
        <GroupKpiCard {...inactiveKpi} />
      </div>
      
      {/* Activity chart (empty state từ GD-2) */}
      <ActivityChart 
        data={analyticsData.daily}
        groupAge={getGroupAge(group.createdAt)}
        memberCount={group.memberCount}
      />
      
      {/* Inactive members alert (gated từ GD-2) */}
      <InactiveMembersAlert
        inactiveCount={analyticsData.inactiveCount}
        totalMembers={group.memberCount}
        groupAge={getGroupAge(group.createdAt)}
      />
    </div>
  );
}
```

3. **CellGroupPulseCard (Sprint 5 placeholder):**
```tsx
export function CellGroupPulseCard({ groupId }: { groupId: string }) {
  // Sprint 5: dummy data, Sprint 6 fetch from /api/groups/{id}/pulse
  const [enabled] = useState(false); // Toggle khi Sprint 6 ship backend
  
  if (!enabled) {
    // Sprint 5 placeholder
    return (
      <div className="rounded-2xl p-4 border border-dashed border-emerald-400/20" style={{background: 'rgba(74,222,128,0.03)'}}>
        <div className="flex items-center gap-3">
          <div className="text-3xl opacity-30">💚</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Nhịp sinh hoạt nhóm (Pulse)</span>
              <span className="text-[9px] text-gray-500 px-1.5 py-0.5 rounded bg-white/5">Sắp ra mắt</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('group.pulse.placeholder.desc')}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Sprint 6: real implementation
  const { data } = useQuery({
    queryKey: ['group-pulse', groupId],
    queryFn: () => api.get(`/api/groups/${groupId}/pulse`),
  });
  
  if (!data) return <PulseSkeleton />;
  
  const { score, status, activeRatio, liveRoomsCount, newContentCount } = data;
  const statusConfig = {
    STRONG: { label: 'MẠNH', color: 'emerald', bg: 'pulse-strong', icon: '🟢' },
    MEDIUM: { label: 'TRUNG BÌNH', color: 'gold', bg: 'pulse-medium', icon: '🟡' },
    WEAK: { label: 'YẾU', color: 'orange', bg: 'pulse-weak', icon: '🔴' },
  };
  const config = statusConfig[status];
  
  return (
    <div className={`rounded-2xl p-4 ${config.bg}`}>
      <div className="flex items-center gap-3">
        <div className="text-3xl pulse-dot">{config.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold text-${config.color}-400 uppercase tracking-wider`}>
              Nhịp sinh hoạt nhóm
            </span>
            <span className="text-[9px] text-gray-500 px-1.5 py-0.5 rounded bg-white/5">👑 Chỉ Leader</span>
            <span className="text-[9px] text-gray-500 ml-auto">Cập nhật mỗi 24h</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-base font-extrabold text-${config.color}-400`}>{config.label}</span>
            <div className="flex-1 max-w-md">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full bg-gradient-to-r from-${config.color}-400 to-${config.color}-600`} style={{width: `${score * 100}%`}}></div>
              </div>
            </div>
            <span className={`text-xs text-${config.color}-400 font-bold`}>{Math.round(score * 100)}/100</span>
          </div>
          <div className="text-xs text-gray-300 mt-1.5 leading-relaxed">
            {activeRatio * 100}/{group.memberCount} active · {liveRoomsCount} live rooms · {newContentCount} content mới
          </div>
        </div>
      </div>
    </div>
  );
}
```

4. **i18n strings:**
```json
{
  "group.tabs.analytics": "Phân tích",
  "group.analytics.period": "Khoảng thời gian",
  "group.pulse.placeholder.desc": "Cell Group Pulse — chỉ số tổng hợp về sinh hoạt nhóm dựa trên active rate, live rooms, và content mới. Sẽ ra mắt Sprint tới với cập nhật hàng ngày."
}
```

5. **Permission check backend (verify từ GD-0 Check 1):**
- Endpoint `/api/groups/{id}/analytics` đã có check leader-only chưa?
- Nếu chưa → add `@PreAuthorize` hoặc service-level check

6. **Tests:**
- Member role → tab "Phân tích" KHÔNG hiện trong tabs array
- Leader role → tab hiện
- CellGroupPulseCard render placeholder (Sprint 5)
- Click tab → analytics content render với KPI + chart + alert

**Verify:**
- Manual: leader thấy 5 tabs, member thấy 4 tabs
- Manual: tab Analytics có Pulse placeholder card

**Commit:** `feat(group): Analytics tab leader-only with Cell Group Pulse placeholder for Sprint 6`

---

## Task GD-10 — Onboarding banner cho new groups 🟡

**Goal:** Group <7 ngày tuổi hoặc <5 members → banner gợi ý 3 việc cần làm.

**Files:**
- `apps/web/src/components/group/NewGroupOnboarding.tsx`

**Steps:**

```tsx
export function NewGroupOnboarding({ group, onDismiss }: Props) {
  const { isNew } = getGroupAge(group.createdAt);
  const isSmall = group.memberCount < 5;
  const showBanner = isLeader && (isNew || isSmall);
  
  if (!showBanner) return null;
  
  const tasks = [
    {
      icon: '👥',
      label: t('group.onboarding.task1'),  // "Mời thêm thành viên"
      done: group.memberCount >= 5,
      action: () => onAction('invite'),
    },
    {
      icon: '📚',
      label: t('group.onboarding.task2'),  // "Tạo bộ câu hỏi đầu tiên"
      done: group.quizSetsCount > 0,
      action: () => onAction('create-quiz-set'),
    },
    {
      icon: '📢',
      label: t('group.onboarding.task3'),  // "Đăng thông báo welcome"
      done: group.announcementsCount > 0,
      action: () => onAction('create-announcement'),
    },
  ];
  
  const completed = tasks.filter(t => t.done).length;
  
  return (
    <div className="rounded-2xl p-5 border border-[#e8a832]/30 mb-5" style={{background: 'rgba(232,168,50,0.06)'}}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-bold text-[#e8a832] uppercase tracking-wider mb-1">
            👋 {t('group.onboarding.title')}
          </div>
          <div className="text-sm text-white">
            {t('group.onboarding.subtitle', { completed, total: tasks.length })}
          </div>
        </div>
        <button onClick={onDismiss} className="text-gray-500 hover:text-white">×</button>
      </div>
      
      <div className="space-y-2">
        {tasks.map((task, idx) => (
          <button
            key={idx}
            onClick={task.action}
            disabled={task.done}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border ${
              task.done 
                ? 'border-emerald-400/30 bg-emerald-500/5' 
                : 'border-white/10 hover:border-[#e8a832]/30 hover:bg-white/5 cursor-pointer'
            }`}
          >
            <span className="text-xl">{task.done ? '✅' : task.icon}</span>
            <span className={`flex-1 text-left text-sm ${task.done ? 'text-emerald-400 line-through' : 'text-white'}`}>
              {task.label}
            </span>
            {!task.done && <span className="text-[#e8a832] text-xs font-semibold">→</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Dismiss state:** lưu vào localStorage per group (`onboarding-dismissed-${groupId}: true`).

**Tests:**
- Group new + leader → banner render
- Member role → KHÔNG render
- Group >7 days + ≥5 members → KHÔNG render

**Commit:** `feat(group): onboarding banner for new/small groups (leader-only)`

---

## Task GD-11 — Group code QR modal 🟡

**Goal:** Click QR icon → modal hiện big code + QR + share link.

**Files:**
- `apps/web/src/components/group/GroupCodeModal.tsx`
- Install `qrcode.react` nếu chưa có

**Steps:**

1. **Install:**
```bash
cd apps/web && npm install qrcode.react
```

2. **Modal:**
```tsx
import { QRCodeSVG } from 'qrcode.react';

export function GroupCodeModal({ group, onClose }: Props) {
  const joinUrl = `https://biblequiz.app/group/join/${group.code}`;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-strong rounded-3xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-white">{t('group.code.modal.title')}</h2>
          <button onClick={onClose}>×</button>
        </div>
        
        {/* Big code */}
        <div className="text-center mb-5">
          <div className="text-4xl font-mono font-extrabold text-[#e8a832] tracking-wider mb-2">
            {group.code}
          </div>
          <button onClick={() => copy(group.code)} className="text-xs text-gray-400 hover:text-[#e8a832]">
            {copied ? '✓ Đã sao chép' : '📋 Sao chép mã'}
          </button>
        </div>
        
        {/* QR */}
        <div className="bg-white p-4 rounded-xl flex items-center justify-center mb-4">
          <QRCodeSVG value={joinUrl} size={200} />
        </div>
        
        <div className="text-xs text-gray-400 text-center mb-4">
          {t('group.code.modal.scanHint')}
        </div>
        
        {/* Share link */}
        <div className="flex gap-2">
          <input 
            readOnly 
            value={joinUrl} 
            className="flex-1 glass rounded-lg px-3 py-2 text-xs text-gray-300 outline-none"
          />
          <button 
            onClick={() => copy(joinUrl)}
            className="px-4 py-2 rounded-lg gold-grad text-[#11131e] text-xs font-bold"
          >
            {t('common.copy')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Tests:** modal render với code + QR svg.

**Commit:** `feat(group): code QR modal with copy and share link`

---

## Task GD-12 — Color palette consolidate 🟡

**Goal:** 3 shades of orange → 1 system. Streak red, alert orange, link gold.

**Files:**
- Quét toàn bộ `apps/web/src/components/group/` và `pages/GroupDetail.tsx`

**Steps:**

1. **Define color usage rules:**
```typescript
// design tokens (commented in code)
// #ef4444 (red) — Streak warning, urgent alerts
// #ff7a59 (orange) — Inactive members, soft warnings
// #e8a832 (gold) — Primary CTAs, links, active states
// #4ade80 (emerald) — Success, completed, online status
```

2. **Audit + fix:**
- Streak card "🔥 2 ngày liên tục" → red `#ef4444`
- "Đừng dừng — chơi tiếp!" → red gradient
- Alert "1 thành viên không hoạt động" → giữ orange `#ff7a59`
- Link "Xem danh sách →" → đổi sang gold `#e8a832`

3. **Verify:** screenshot diff trước/sau, không có 3 shades orange cạnh nhau.

**Commit:** `refactor(group): color palette consolidate (streak red, alert orange, link gold)`

---

## Task GD-DOCS — SPEC_GROUP v1.3 → v1.4 update

**Goal:** Bump SPEC reflect 4 architectural decisions.

**Files:**
- `docs/SPEC_GROUP_v1_3.md` → archive
- `docs/SPEC_GROUP_v1_4.md` (NEW)

**Changes:**

1. **Header changelog v1.3 → v1.4:**
```markdown
## Changelog v1.3 → v1.4 (2026-05-10)

| # | Section | Change |
|---|---|---|
| 1 | §10 Group Leaderboard | **DEPRECATED** — Q-A leaderboard sunset. Replace bằng Activity Feed (Sprint 6) + Personal Mastery (Sprint 5). UI removed Sprint UX-polish, backend endpoint deprecated nhưng giữ 2-3 sprints cho mobile compat. |
| 2 | §3.x (NEW) | **GroupActivity entity** — for Activity Feed Sprint 6. Migration V53. Types: MASTERY_COMPLETED, QUIZ_SET_CREATED, LIVE_ROOM_STARTED/ENDED, ANNOUNCEMENT_POSTED, MEMBER_JOINED/LEFT, SCHEDULED_QUIZ_CREATED. |
| 3 | §3.x (NEW) | **GroupPulseSnapshot entity** — Sprint 6. Migration V54. Cron @1am daily. Pulse heuristic: `active_ratio*0.5 + live_rooms*0.3 + new_content*0.2`. Status STRONG ≥0.7, MEDIUM 0.4-0.7, WEAK <0.4. |
| 4 | §11 Group Tournament | **DEFERRED** Sprint 7+ — group <4 members = useless. Backend code giữ, UI disable, không ưu tiên. |
| 5 | §12 (NEW) | **Group Activity Feed** specification — list types, filtering, real-time refresh, pagination. |
| 6 | §13 (NEW) | **Cell Group Pulse** specification — heuristic formula, snapshot schedule, leader-only access. |
| 7 | §17 Known Issues | Close: "Q-A code drift sums all UserDailyProgress" — leaderboard sunset, query becomes irrelevant. |
| 8 | §18 Roadmap | Sprint 6 = Activity Feed + Pulse. Sprint 7+ = Tournament revival (if data justifies). |
```

2. **§10 Group Leaderboard → mark DEPRECATED:**
   - Add deprecation notice top of section
   - Keep description for historical reference
   - Note: backend endpoint `/api/groups/{id}/leaderboard` returns 410 Gone Sprint 8+

3. **NEW §12 Group Activity Feed:**
   - Entity schema (V53)
   - Service: `recordActivity(group, actor, type, metadata)` called từ:
     - QuizSetMasteryService khi `completedMastery=true`
     - GroupQuizSetService khi create/update
     - RoomService khi LIVE_ROOM_STARTED/ENDED
     - GroupAnnouncementService khi post
     - ChurchGroupService khi member join/leave
     - ScheduledQuizService khi create
   - API endpoints:
     - `GET /api/groups/{id}/activity?type=&limit=20&before=`
     - `GET /api/groups/{id}/active-rooms` (for Live Now banner)
   - Real-time: refetch interval 30s; future websocket push
   - Retention: 90 days, sau đó hard delete

4. **NEW §13 Cell Group Pulse:**
   - Entity schema (V54)
   - Calculation: `pulse = activeRatio*0.5 + (liveRoomsPerWeek/expectedLiveRooms)*0.3 + (newContentPerWeek/expectedContent)*0.2`
   - `expectedLiveRooms = 2`, `expectedContent = 1` (configurable per group)
   - Status thresholds: STRONG ≥0.7, MEDIUM 0.4-0.7, WEAK <0.4
   - Cron: `@Scheduled(cron = "0 0 1 * * *")` daily 1am
   - API: `GET /api/groups/{id}/pulse` — leader/mod only
   - Trend: store 7-day history, frontend hiện sparkline mini chart

5. **§11 Tournament — DEFERRED note:**
```markdown
> ⏭️ **DEFERRED Sprint 7+**: Group Tournament defer vì hầu hết groups <4 members. Backend bracket logic giữ, UI ẩn cho group <4 members. Sẽ revisit khi data show ≥30% groups có ≥8 active members.
```

**Commit:** `docs(spec): SPEC_GROUP v1.4 — leaderboard sunset, Activity Feed + Pulse spec, Tournament defer`

---

## Final regression

1. **Tests:** baseline + ~30 new tests pass
2. **Visual smoke test (manual):**
   - [ ] Default tab "Hoạt động" với placeholder + Members preview + Quiz Sets top 3
   - [ ] **KHÔNG còn tab "Leaderboard"** trong UI (cả member và leader)
   - [ ] Tab Members click → members list
   - [ ] Tab Announcements click → announcements
   - [ ] Tab Quiz Sets click → quiz sets list
   - [ ] Tab Analytics click (leader only) → KPI + chart + Pulse placeholder
   - [ ] Member view: 4 tabs (Hoạt động, Thành viên, Thông báo, Bộ câu hỏi)
   - [ ] Leader view: 5 tabs (4 trên + Phân tích với 👑 badge)
   - [ ] Live Now banner pinned top khi có active rooms
   - [ ] 2-member group: KHÔNG show inactive alert, chart empty state
   - [ ] Tournament card disabled với tooltip "Cần ≥4"
   - [ ] Hover KPI card → tooltip scope hiện
   - [ ] Sidebar không show streak/missions trong group context, có Group Quick Info card thay
   - [ ] Header gọn, code có copy button + QR icon
   - [ ] Click QR icon → modal hiện big code + QR + share link
   - [ ] Onboarding banner hiện cho new group (leader only, member KHÔNG)
3. **Backend test:**
   - [ ] `/api/groups/{id}/leaderboard` vẫn work (soft sunset, return 200)
   - [ ] `/api/groups/{id}/active-rooms` mới (NEW endpoint cho Live Now banner)
   - [ ] Tab count badges từ DTO populated
4. **i18n:** vi.json + en.json đầy đủ, KHÔNG tăng hardcoded count
5. **Update TODO.md:** Section "Group Detail UX Polish + Architectural Cleanup [DONE]"

---

## Rules cho Claude Code

1. **Verification-first** — đọc code trước khi sửa, đặc biệt GD-1 (verify components shared không)
2. **Stop sau mỗi commit** — báo Bui delta tests + screenshot
3. **Memory rules:** hardcoded hex, Be Vietnam Pro, no CSS variables
4. **i18n complete:** mọi string mới có vi.json + en.json
5. **Mobile responsive:** test ≥768px breakpoint không break
6. **GD-0 verify task BẮT BUỘC** — nhiều issues có thể đã fixed/khác với assumption
7. **Q-A leaderboard sunset:** KHÔNG xoá backend ngay, soft deprecate qua 2-3 sprints (mobile app compat)
8. **Tournament defer:** UI disable, backend code giữ — defer Sprint 7+

---

## Task ordering (mandatory)

```
GD-0 (verify, no commit) 
  ↓ [Bui review GROUP_DETAIL_AUDIT_REPORT.md, confirm]
GD-1 (replace Leaderboard → Hoạt động tab) ← BIGGEST CHANGE
  ↓ commit, stop, screenshot
GD-2 (empty states)
  ↓ commit, stop
GD-3 (KPI tooltips)
  ↓ commit, stop
GD-4 (Tournament disable)
  ↓ commit, stop
GD-5 (sidebar context)
  ↓ commit, stop
GD-6 (tab count badges)
  ↓ commit, stop
GD-7 (header layout)
  ↓ commit, stop
GD-8 (role badge contrast)
  ↓ commit, stop
GD-9 (Analytics tab + Pulse placeholder)
  ↓ commit, stop
GD-10 (onboarding banner)
  ↓ commit, stop
GD-11 (code QR modal)
  ↓ commit, stop
GD-12 (color consolidate)
  ↓ commit, stop
GD-DOCS (SPEC v1.4)
  ↓ commit, stop
```

**13 commits + GD-0 verify report.**

---

## Effort estimate

| Phase | Tasks | Effort |
|---|---|---|
| Verify | GD-0 | 0.5 ngày |
| Architecture | GD-1 (replace leaderboard) | 1 ngày |
| Empty states + tooltips | GD-2, GD-3 | 0.5 ngày |
| P1 polish | GD-4, GD-5, GD-6, GD-7, GD-8 | 1.5 ngày |
| Analytics tab | GD-9 (with Pulse placeholder) | 0.5 ngày |
| P2 polish | GD-10, GD-11, GD-12 | 0.5 ngày |
| Docs | GD-DOCS (SPEC v1.4) | 0.5 ngày |
| **Total** | **14 tasks (13 commits + 1 verify)** | **~5 ngày** |

LOC change: ~2000-2500 lines (mostly UI refactor + new components + SPEC update).

---

**Bắt đầu bằng GD-0 (verify), output report. Stop, đợi Bui review trước khi GD-1.**

**GD-1 là biggest change — replace toàn bộ tab Leaderboard. Bui review carefully sau commit GD-1, có thể cần adjust trước khi tiếp.**
