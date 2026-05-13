# PROMPT: Fix Group Detail visual gaps so vs MOCKUP_GROUP_DETAIL_REDESIGN.html

> **Context:** Claude Code đã implement Sprint UX-polish nhưng kết quả khác mockup khá nhiều. Screenshot user gửi ngày 2026-05-10 reveal 9 visual + structural gaps cần fix.
>
> **Reference:**
> - Mockup canonical: `/mnt/user-data/outputs/MOCKUP_GROUP_DETAIL_REDESIGN.html` (1029 dòng, 2 views: member + leader)
> - Implementation hiện tại: screenshot user gửi (`1778422362159_image.png`)
> - Group test: FMC Đà Nẵng · 3 thành viên · NVH059 · TAI THANH leader
>
> **Mục tiêu:** Match pixel-perfect với mockup. KHÔNG add features mới, chỉ fix visual gaps.

---

## So sánh implementation hiện tại vs mockup

### ✅ Điểm tốt (đã match)

1. Header layout với group avatar, name, "BẠN LÀ TRƯỞNG NHÓM" badge ✓
2. 5 tabs (Hoạt động · Thành viên · Thông báo · Bộ câu hỏi · Phân tích 👑) ✓
3. Tab count badges (Thành viên 3 · Bộ câu hỏi 4) ✓
4. Onboarding banner "BẮT ĐẦU VỚI NHÓM MỚI" với 3 tasks + checkmark task 2 ✓
5. Tournament card disabled state với hint "Cần ≥4 thành viên (hiện 3)" ✓
6. Activity Feed placeholder với "Sắp ra mắt — SPRINT 6" ✓
7. Sidebar Group Quick Info card "ĐANG THAM GIA" ✓
8. Members preview right column ✓
9. Quiz Sets list right column ✓
10. Code copy button + QR icon ✓

### 🔴 9 Gaps cần fix (theo priority)

| # | Sev | Gap | Impact |
|---|---|---|---|
| 1 | 🔴 P0 | **Cell Group Pulse banner BỊ MISSING** trên tab Hoạt động (mockup có, code không có) | Tính năng signature của Sprint 5 polish bị thiếu |
| 2 | 🔴 P0 | **Live Now banner BỊ MISSING** — pinned top khi có active rooms | Member không thấy live đang diễn ra |
| 3 | 🟠 P1 | **Members preview KHÔNG split online/offline** — chỉ list 3 avatars cùng nhau | Mất feature "🟢 Đang online (X)" + "Khác (Y)" |
| 4 | 🟠 P1 | **Quiz Sets cards thiếu metadata** — chỉ có tên + câu hỏi count, mockup có icon, play count, rating | Visual nghèo, không match Sprint 5 design |
| 5 | 🟠 P1 | **Sidebar "ĐANG THAM GIA · 0/3 · Chưa có phòng live"** — wording rối | Nên show "🟢 Đang online · 1/3 thành viên" thay vì "0/3" mơ hồ |
| 6 | 🟠 P1 | **Activity Feed filters MISSING** — mockup có 4 chips (Tất cả/Quiz/Live/Tin) | Sprint 5 placeholder thiếu filter UI preview |
| 7 | 🟡 P2 | **Onboarding banner "Đăng thông báo" task ICON sai** — mockup dùng 📢 icon trong checkbox style, code dùng emoji rời rạc | Visual inconsistency |
| 8 | 🟡 P2 | **Header "MÃ" + code "NVH059" + QR layout** — code positioned giữa MÃ và Thống Kê Nhóm, không cạnh actions | Layout breakdown trên các viewport hẹp hơn |
| 9 | 🟡 P2 | **Quick Actions colors** — mockup highlight "Bắt đầu Live" với emerald accent border, code hiện tại đều giống nhau | "Bắt đầu Live" là primary action, cần stand out |

---

## Verification protocol (TRƯỚC khi sửa)

1. **Mở mockup HTML trong browser** để compare side-by-side với implementation
2. **Read code hiện tại** trước khi edit:
   - `apps/web/src/pages/GroupDetail.tsx`
   - `apps/web/src/components/group/GroupActivityTab.tsx`
   - `apps/web/src/components/group/QuickActionsPanel.tsx`
   - `apps/web/src/components/group/MembersPreviewCard.tsx`
   - `apps/web/src/components/group/QuizSetsPreviewCard.tsx`
   - `apps/web/src/components/group/CellGroupPulseCard.tsx` (NEW nếu chưa có)
   - `apps/web/src/components/group/LiveNowBanner.tsx` (NEW nếu chưa có)
3. **Memory rules apply:**
   - Hardcoded hex `#e8a832 / #11131e`, KHÔNG CSS variables
   - Be Vietnam Pro 800/900 cho headings tiếng Việt
   - Glass cards: `rgba(50,52,64,0.55)` + `backdrop-blur(12px)`
4. **i18n complete:** vi.json + en.json cho mọi string mới
5. **Test count >= baseline + 8 (cho 9 gaps fixed)**

---

## Task GD-FIX-1 — Cell Group Pulse banner trên tab Hoạt động (LEADER ONLY) 🔴

**Goal:** Add Pulse placeholder card vào TOP của tab Hoạt động cho leader view. Member KHÔNG thấy.

**Files:**
- `apps/web/src/components/group/CellGroupPulseCard.tsx` (verify exists hoặc tạo mới)
- `apps/web/src/components/group/GroupActivityTab.tsx` (insert Pulse card before Quick Actions)

**Steps:**

1. **Verify component exists:** từ Sprint UX-polish task GD-9, `CellGroupPulseCard` đáng lẽ đã tạo trong tab Phân tích. Cần CHỈ ADD VÀO TAB HOẠT ĐỘNG TOO cho leader.

2. **GroupActivityTab structure:**
```tsx
export function GroupActivityTab({ group, isLeader }: Props) {
  return (
    <div className="space-y-5">
      {/* Pulse banner — leader only, top placement */}
      {isLeader && <CellGroupPulseCard groupId={group.id} variant="banner" />}
      
      {/* Live Now banner */}
      <LiveNowBanner groupId={group.id} />
      
      {/* Onboarding banner (existing) */}
      {showOnboarding && <NewGroupOnboarding ... />}
      
      {/* Quick Actions */}
      <QuickActionsPanel ... />
      
      {/* 2-column layout: feed + sidebar */}
      ...
    </div>
  );
}
```

3. **CellGroupPulseCard variants:**
   - `variant="banner"` — slim 1-line card cho tab Hoạt động (leader)
   - `variant="full"` — full card cho tab Phân tích với details

4. **Banner variant (Sprint 5 placeholder, không có data thật):**
```tsx
function PulseBannerPlaceholder() {
  return (
    <div className="rounded-2xl p-4 border border-dashed border-emerald-400/20" 
         style={{background: 'rgba(74,222,128,0.04)'}}>
      <div className="flex items-center gap-3">
        <div className="text-3xl opacity-30">💚</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Nhịp sinh hoạt nhóm
            </span>
            <span className="text-[9px] text-gray-500 px-1.5 py-0.5 rounded bg-white/5">👑 Chỉ Leader</span>
            <span className="text-[9px] text-gray-500 px-1.5 py-0.5 rounded bg-white/5">Sắp ra mắt</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {t('group.pulse.placeholder.banner')}
          </p>
        </div>
      </div>
    </div>
  );
}
```

5. **i18n:**
```json
{
  "group.pulse.placeholder.banner": "Cell Group Pulse — chỉ số tổng hợp về sinh hoạt nhóm (active rate + live rooms + content). Sẽ ra mắt Sprint tới."
}
```

**Verify:** Manual — leader login, vào tab Hoạt động → thấy Pulse placeholder ở top. Member login → KHÔNG thấy.

**Commit:** `fix(group): add Cell Group Pulse banner to Hoạt động tab (leader only)`

---

## Task GD-FIX-2 — Live Now banner pinned top 🔴

**Goal:** Khi group có active live rooms (status LOBBY hoặc IN_PROGRESS), pinned banner emerald glow ở top.

**Files:**
- `apps/web/src/components/group/LiveNowBanner.tsx` (NEW nếu chưa có)
- Backend: `GET /api/groups/{id}/active-rooms` endpoint

**Steps:**

1. **Backend endpoint:**
```java
// ChurchGroupController.java
@GetMapping("/{id}/active-rooms")
public List<RoomSummaryDTO> getActiveRooms(@PathVariable Long id, @AuthenticationPrincipal User user) {
    // Verify user is member
    requireGroupMember(id, user.getId());
    
    return roomService.findByGroupIdAndStatusIn(
        id, 
        List.of(RoomStatus.LOBBY, RoomStatus.IN_PROGRESS)
    ).stream()
        .map(this::toSummaryDTO)
        .toList();
}
```

2. **LiveNowBanner component:**
```tsx
export function LiveNowBanner({ groupId }: { groupId: string }) {
  const { data } = useQuery({
    queryKey: ['group-active-rooms', groupId],
    queryFn: () => api.get(`/api/groups/${groupId}/active-rooms`),
    refetchInterval: 30000, // 30s refresh
  });
  
  if (!data?.length) return null;
  
  // Show first active room as primary banner
  const room = data[0];
  
  return (
    <div className="rounded-xl p-3 border-2 border-emerald-400/40" 
         style={{background: 'rgba(74,222,128,0.08)'}}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
             style={{background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'}}>
          🎮
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-emerald-400 uppercase animate-pulse">
              ● ĐANG DIỄN RA
            </span>
            <span className="text-[10px] text-gray-500">
              {formatRelative(room.startedAt)}
            </span>
            {data.length > 1 && (
              <span className="text-[10px] text-emerald-400 font-semibold ml-auto">
                +{data.length - 1} phòng khác
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-white mt-0.5">
            Live Room: "{room.name}"
          </div>
          <div className="text-[10px] text-gray-300 mt-0.5">
            Mode: {modeLabel(room.mode)} · Host: {room.hostName} · 
            {room.playerCount}/{room.maxPlayers} người tham gia
          </div>
        </div>
        <button 
          onClick={() => navigate(`/room/${room.code}`)}
          className="px-3 py-1.5 rounded-lg text-[#11131e] text-xs font-bold whitespace-nowrap"
          style={{background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'}}
        >
          Tham gia →
        </button>
      </div>
    </div>
  );
}

const modeLabel = (mode) => ({
  GROUP_LIVE_SEQUENTIAL: '📚 Sequential',
  SPEED_RACE: '⚡ Speed Race',
  TEAM_VS_TEAM: '⚔️ Team vs Team',
  BATTLE_ROYALE: '💀 Battle Royale',
  SUDDEN_DEATH: '🥊 Sudden Death',
}[mode] ?? mode);
```

3. **Tests:**
- Active rooms exists → banner render với first room
- No active rooms → KHÔNG render (return null)
- Multiple rooms → "+N phòng khác" hint

**Verify:** 
- Manual: tạo live room trong group → reload → thấy banner emerald pinned top
- Manual: end room → reload → banner disappear

**Commit:** `feat(group): add Live Now banner pinned at top of Hoạt động tab`

---

## Task GD-FIX-3 — Members preview split online/offline 🟠

**Goal:** Member preview card phân biệt online/offline theo mockup.

**Files:**
- `apps/web/src/components/group/MembersPreviewCard.tsx`
- Backend: members API trả về `online: boolean` field

**Steps:**

1. **Backend update DTO:**
```java
public class GroupMemberSummaryDTO {
    private Long userId;
    private String name;
    private String avatar;
    private GroupRole role; // LEADER/MOD/MEMBER
    private boolean online; // NEW: from Redis presence
    private String currentActivity; // NEW: optional, "đang chơi", "đang xem", null
}
```

2. **Service populate online status (verify Redis presence pattern):**
```java
// MemberSummaryService.java
public List<GroupMemberSummaryDTO> getGroupMembersWithOnline(Long groupId) {
    List<GroupMember> members = memberRepository.findByGroupId(groupId);
    
    Set<Long> onlineUserIds = redisTemplate.opsForSet().members("online:users")
        .stream()
        .map(s -> Long.parseLong((String) s))
        .collect(Collectors.toSet());
    
    return members.stream()
        .map(m -> {
            DTO dto = new DTO();
            dto.setUserId(m.getUserId());
            dto.setName(m.getUser().getName());
            dto.setAvatar(m.getUser().getAvatar());
            dto.setRole(m.getRole());
            dto.setOnline(onlineUserIds.contains(m.getUserId()));
            return dto;
        })
        .toList();
}
```

3. **Frontend MembersPreviewCard:**
```tsx
export function MembersPreviewCard({ groupId }: { groupId: string }) {
  const { data } = useQuery({
    queryKey: ['group-members-preview', groupId],
    queryFn: () => api.get(`/api/groups/${groupId}/members?limit=20`),
    refetchInterval: 60000, // 1min refresh online status
  });
  
  if (!data) return <SkeletonMembers />;
  
  const onlineMembers = data.filter(m => m.online);
  const offlineMembers = data.filter(m => !m.online);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-[#e8a832] uppercase tracking-wider">
          👥 Thành viên ({data.length})
        </h2>
        <button onClick={() => setActiveTab('members')} 
                className="text-[10px] text-gray-400 hover:text-[#e8a832]">
          Xem tất cả →
        </button>
      </div>
      <div className="rounded-xl p-3" 
           style={{background: 'rgba(50,52,64,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)'}}>
        
        {/* Online section */}
        {onlineMembers.length > 0 && (
          <>
            <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
              🟢 Đang online ({onlineMembers.length})
            </div>
            <div className="space-y-1.5 mb-3">
              {onlineMembers.slice(0, 5).map(m => (
                <div key={m.userId} className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <Avatar member={m} size="xs" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#11131e]"></span>
                  </div>
                  <span className="text-xs text-white font-semibold">{m.name}</span>
                  {m.role === 'LEADER' && <span className="text-[9px] text-[#e8a832] ml-auto">👑</span>}
                  {m.currentActivity && (
                    <span className="text-[9px] text-emerald-400 ml-auto">{m.currentActivity}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Offline section */}
        {offlineMembers.length > 0 && (
          <>
            <div className={`text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2 ${onlineMembers.length > 0 ? 'pt-2 border-t border-white/5' : ''}`}>
              {onlineMembers.length > 0 ? `Khác (${offlineMembers.length})` : `Thành viên (${offlineMembers.length})`}
            </div>
            <div className="flex flex-wrap gap-1">
              {offlineMembers.slice(0, 9).map(m => (
                <Avatar key={m.userId} member={m} size="xs" />
              ))}
              {offlineMembers.length > 9 && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 text-[10px]"
                     style={{background: 'rgba(50,52,64,0.3)', border: '1px solid rgba(255,255,255,0.1)'}}>
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

**Verify:** Manual — login user A → mở group → user B login → reload group → thấy "🟢 Đang online (2)" với cả 2 avatars có green dot.

**Commit:** `fix(group): split members preview into online/offline sections`

---

## Task GD-FIX-4 — Quiz Sets cards rich metadata 🟠

**Goal:** Quiz Set mini cards có icon emoji, play count, accuracy, multi-mode badges (theo mockup).

**Files:**
- `apps/web/src/components/group/QuizSetMiniCard.tsx`
- `apps/web/src/components/group/QuizSetsPreviewCard.tsx`

**Steps:**

1. **QuizSetMiniCard — match mockup design:**
```tsx
export function QuizSetMiniCard({ quizSet }: Props) {
  const icon = parseIcon(quizSet.coverImageUrl) ?? '📖'; // emoji prefix support
  const gradient = pickGradient(quizSet.id); // deterministic color per quiz
  
  return (
    <button className="w-full glass rounded-xl p-2.5 flex items-center gap-2.5 hover:border-[#e8a832]/30 transition-all border border-white/5 text-left"
            onClick={() => navigate(`/group/${quizSet.groupId}/quiz-sets/${quizSet.id}`)}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0"
           style={{background: gradient}}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white truncate">{quizSet.name}</div>
        <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
          <span>{quizSet.totalQuestions} câu</span>
          {quizSet.playCount > 0 && (
            <>
              <span>·</span>
              <span>▶ {quizSet.playCount}x</span>
            </>
          )}
          {quizSet.averageRating && (
            <>
              <span>·</span>
              <span className="text-[#e8a832]">⭐ {quizSet.averageRating.toFixed(1)}</span>
            </>
          )}
        </div>
      </div>
      <button className="px-2.5 py-1 rounded-md text-[10px] font-bold text-[#11131e]"
              style={{background: 'linear-gradient(135deg, #e8a832 0%, #d4941f 100%)'}}>
        Chơi
      </button>
    </button>
  );
}

function pickGradient(id: number) {
  const gradients = [
    'linear-gradient(135deg, #1a1d2e 0%, #4a3d2e 100%)', // gold/dark
    'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)', // green
    'linear-gradient(135deg, #1a3d2e 0%, #2a4d3e 100%)', // dark green
    'linear-gradient(135deg, #ff7a59 0%, #cf5a39 100%)', // orange
    'linear-gradient(135deg, #4ea8de 0%, #2d88be 100%)', // sky
  ];
  return gradients[id % gradients.length];
}

function parseIcon(coverUrl?: string): string | null {
  if (!coverUrl) return null;
  if (coverUrl.startsWith('emoji:')) return coverUrl.slice(6);
  return null; // future: render <img> for HTTP URLs
}
```

2. **QuizSetsPreviewCard wrapper:**
```tsx
export function QuizSetsPreviewCard({ groupId, limit = 3 }: Props) {
  const { data } = useQuery({
    queryKey: ['group-quiz-sets-popular', groupId, limit],
    queryFn: () => api.get(`/api/groups/${groupId}/quiz-sets?sort=popular&limit=${limit}&status=PUBLISHED`),
  });
  
  if (!data?.items?.length) {
    return <EmptyQuizSetsCard isLeader={isLeader} />;
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-[#e8a832] uppercase tracking-wider">
          📚 BỘ CÂU HỎI ({data.totalCount})
        </h2>
        <button onClick={() => setActiveTab('quiz-sets')} 
                className="text-[10px] text-gray-400 hover:text-[#e8a832]">
          Xem tất cả →
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

**Verify:** Manual — quiz sets list trong sidebar có icon emoji + play count + rating (nếu có data).

**Commit:** `fix(group): quiz set mini cards with rich metadata (icon, play count, rating)`

---

## Task GD-FIX-5 — Sidebar "ĐANG THAM GIA" wording fix 🟠

**Goal:** Sidebar Group Quick Info card hiện tại confusing — "0/3 · Chưa có phòng live nào" không clear. Theo mockup phải là "🟢 Đang online · X/Y" + list active rooms.

**Files:**
- `apps/web/src/components/sidebar/GroupQuickInfoCard.tsx`

**Steps:**

1. **Component restructure:**
```tsx
export function GroupQuickInfoCard({ groupId }: { groupId: string }) {
  const { data: members } = useQuery({
    queryKey: ['group-online-summary', groupId],
    queryFn: () => api.get(`/api/groups/${groupId}/online-summary`),
    refetchInterval: 30000,
  });
  
  const { data: activeRooms } = useQuery({
    queryKey: ['group-active-rooms-mini', groupId],
    queryFn: () => api.get(`/api/groups/${groupId}/active-rooms`),
    refetchInterval: 30000,
  });
  
  if (!members) return null;
  
  return (
    <div className="m-3 rounded-xl p-3 border border-emerald-400/20" 
         style={{background: 'rgba(74,222,128,0.05)'}}>
      
      {/* Online count — primary */}
      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className="text-base animate-pulse">🟢</span>
        <span>Đang online</span>
      </div>
      <div className="text-2xl font-extrabold text-white">
        {members.onlineCount} 
        <span className="text-xs text-gray-400 font-normal ml-1">/{members.totalCount}</span>
      </div>
      
      {/* Active rooms section — only if any */}
      {activeRooms && activeRooms.length > 0 && (
        <div className="mt-3 pt-3 border-t border-emerald-400/15">
          <div className="text-[9px] text-gray-400 uppercase font-semibold mb-1">
            🎮 Phòng đang mở ({activeRooms.length})
          </div>
          {activeRooms.slice(0, 3).map(room => (
            <button 
              key={room.id}
              onClick={() => navigate(`/room/${room.code}`)}
              className="text-[11px] text-emerald-400 hover:underline block leading-tight mt-0.5 truncate w-full text-left"
            >
              "{room.name}" →
            </button>
          ))}
        </div>
      )}
      
      {/* Empty state — KHÔNG có rooms thì show nothing thay vì "Chưa có phòng live nào" */}
    </div>
  );
}
```

2. **Backend endpoint mới (light, cached):**
```java
@GetMapping("/{id}/online-summary")
public OnlineSummaryDTO getOnlineSummary(@PathVariable Long id) {
    return new OnlineSummaryDTO(
        memberRepository.countByGroupId(id),
        memberRepository.countOnlineByGroupId(id) // uses Redis presence
    );
}
```

3. **Hide card khi user không trong group nào** — tránh empty card.

**Verify:**
- Manual: 1 user online → "🟢 Đang online · 1/3"
- Manual: tạo live room → card thêm section "🎮 Phòng đang mở (1)"
- Manual: end room → section disappear, card chỉ còn online count

**Commit:** `fix(group): sidebar Group Quick Info — clearer wording (online count + conditional rooms)`

---

## Task GD-FIX-6 — Activity Feed filters preview 🟠

**Goal:** Placeholder Activity Feed có 4 filter chips (Tất cả/Quiz/Live/Tin) như mockup, dù chưa wire backend.

**Files:**
- `apps/web/src/components/group/ActivityFeedPlaceholder.tsx`

**Steps:**

```tsx
export function ActivityFeedPlaceholder() {
  return (
    <div>
      {/* Header với filter chips (preview Sprint 6) */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-[#e8a832] uppercase tracking-wider flex items-center gap-1.5">
          <span>📜</span><span>Hoạt động nhóm</span>
        </h2>
        <div className="flex gap-1.5">
          <button className="text-[10px] px-2 py-1 rounded-full font-semibold border bg-[#e8a832]/15 text-[#e8a832] border-[#e8a832]/30">
            Tất cả
          </button>
          <button disabled className="text-[10px] px-2 py-1 rounded-full font-semibold border opacity-40 border-white/10 text-gray-400"
                  style={{background: 'rgba(50,52,64,0.3)'}}>
            📚 Quiz
          </button>
          <button disabled className="text-[10px] px-2 py-1 rounded-full font-semibold border opacity-40 border-white/10 text-gray-400"
                  style={{background: 'rgba(50,52,64,0.3)'}}>
            🎮 Live
          </button>
          <button disabled className="text-[10px] px-2 py-1 rounded-full font-semibold border opacity-40 border-white/10 text-gray-400"
                  style={{background: 'rgba(50,52,64,0.3)'}}>
            📢 Tin
          </button>
        </div>
      </div>
      
      {/* Empty state */}
      <div className="rounded-2xl p-8 text-center border border-dashed border-white/10"
           style={{background: 'rgba(50,52,64,0.3)'}}>
        <div className="text-5xl mb-3 opacity-40">📜</div>
        <h3 className="text-white font-bold mb-1">Hoạt động nhóm</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
          Sắp ra mắt — feed sẽ hiển thị thi đấu, bộ câu hỏi mới, thông báo và streak của các thành viên.
        </p>
        <div className="mt-3 text-[10px] text-gray-500 uppercase tracking-wider">SPRINT 6</div>
      </div>
    </div>
  );
}
```

**Note:** Filter chips disabled state vẫn render để member preview UX, nhưng không clickable (defer Sprint 6).

**Commit:** `fix(group): activity feed placeholder with filter chips preview`

---

## Task GD-FIX-7 — Onboarding banner task icons consistent 🟡

**Goal:** 3 onboarding tasks có icon style consistent (theo mockup từng task có emoji icon trong colored circle hoặc check checkbox khi done).

**Files:**
- `apps/web/src/components/group/NewGroupOnboarding.tsx`

**Steps:**

```tsx
// Mockup style: icon emoji KHÔNG phải button rời rạc, mà inline với task text
const tasks = [
  {
    id: 'invite',
    icon: '👥',
    iconBg: 'rgba(168,85,247,0.15)', // purple
    label: t('group.onboarding.task1'), // "Mời thêm thành viên (≥5 người để bắt đầu)"
    done: group.memberCount >= 5,
    action: () => onAction('invite'),
  },
  {
    id: 'create-quiz',
    icon: '📚',
    iconBg: 'rgba(74,222,128,0.15)', // emerald
    label: t('group.onboarding.task2'), // "Tạo bộ câu hỏi đầu tiên (bài giảng / sinh hoạt)"
    done: group.quizSetsCount > 0,
    action: () => onAction('create-quiz-set'),
  },
  {
    id: 'announcement',
    icon: '📢',
    iconBg: 'rgba(232,168,50,0.15)', // gold
    label: t('group.onboarding.task3'), // "Đăng thông báo chào mừng cho cả nhóm"
    done: group.announcementsCount > 0,
    action: () => onAction('create-announcement'),
  },
];

return (
  <div className="rounded-2xl p-5 border border-[#e8a832]/30" style={{background: 'rgba(232,168,50,0.06)'}}>
    {/* Header — same as before */}
    
    <div className="space-y-2">
      {tasks.map(task => (
        <button
          key={task.id}
          onClick={task.action}
          disabled={task.done}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
            task.done 
              ? 'border-emerald-400/30' 
              : 'border-white/10 hover:border-[#e8a832]/30 hover:bg-white/5 cursor-pointer'
          }`}
          style={task.done ? {background: 'rgba(74,222,128,0.05)'} : {}}
        >
          {/* Icon: green check khi done, otherwise colored emoji */}
          {task.done ? (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                 style={{background: 'rgba(74,222,128,0.2)'}}>
              ✅
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                 style={{background: task.iconBg}}>
              {task.icon}
            </div>
          )}
          
          {/* Label */}
          <span className={`flex-1 text-left text-sm ${task.done ? 'text-emerald-400 line-through' : 'text-white'}`}>
            {task.label}
          </span>
          
          {/* Arrow */}
          {!task.done && <span className="text-[#e8a832] text-base">→</span>}
        </button>
      ))}
    </div>
  </div>
);
```

**Verify:** Manual — task done có ✅ + line-through; task chưa done có emoji + arrow.

**Commit:** `fix(group): onboarding task icons consistent (checkbox done state, colored emoji incomplete)`

---

## Task GD-FIX-8 — Header code position + spacing 🟡

**Goal:** Header layout — code "MÃ: NVH059 [copy] [QR]" cần ở 1 group cohesive, không tách rời giữa text "MÃ" và actions.

**Files:**
- `apps/web/src/components/group/GroupHeader.tsx`

**Steps:**

```tsx
<header className="rounded-2xl p-5 mb-5"
        style={{background: 'rgba(50,52,64,0.78)', backdropFilter: 'blur(20px)', border: '1px solid rgba(232,168,50,0.15)'}}>
  <div className="flex items-start gap-4">
    {/* Avatar */}
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg"
         style={{background: 'linear-gradient(135deg, #e8a832 0%, #d4941f 100%)'}}>
      ⛪
    </div>
    
    {/* Title block */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-extrabold text-white">{group.name}</h1>
        {isLeader && <RoleBadge role="leader" isCurrentUser />}
      </div>
      
      {/* Meta info — single row, gap properly */}
      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span>👥</span>
          <span className="text-gray-300 font-semibold">{group.memberCount} thành viên</span>
        </span>
        <span className="text-gray-600">·</span>
        <span className="flex items-center gap-1.5">
          <span>👑</span>
          <span>{group.leaderName}</span>
        </span>
      </div>
    </div>
    
    {/* Code section — its own visual group */}
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
         style={{background: 'rgba(50,52,64,0.5)', border: '1px solid rgba(255,255,255,0.05)'}}>
      <span className="text-[10px] text-gray-500 uppercase font-semibold">Mã</span>
      <button onClick={handleCopyCode}
              className="font-mono text-sm text-[#e8a832] flex items-center gap-1.5 hover:opacity-80">
        <span>{group.code}</span>
        {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
      </button>
      <button onClick={() => setShowQrModal(true)}
              className="text-gray-400 hover:text-[#e8a832]"
              title="QR Code">
        <QrCodeIcon className="w-4 h-4" />
      </button>
    </div>
    
    {/* Actions — separate group */}
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={handleAnalytics}
              className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-gray-300 hover:text-white"
              style={{background: 'rgba(50,52,64,0.3)', border: '1px solid rgba(255,255,255,0.1)'}}>
        <span>📊</span><span>Thống Kê Nhóm</span>
      </button>
      <button onClick={handleSettings}
              className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-gray-300"
              style={{background: 'rgba(50,52,64,0.3)', border: '1px solid rgba(255,255,255,0.1)'}}>
        <span>⚙️</span><span>Cài Đặt</span>
      </button>
      <button onClick={handleInvite}
              className="px-4 py-2 rounded-lg text-[#11131e] text-sm font-extrabold flex items-center gap-1.5"
              style={{background: 'linear-gradient(135deg, #e8a832 0%, #d4941f 100%)'}}>
        <span>🔗</span><span>Mời</span>
      </button>
    </div>
  </div>
</header>
```

**Verify:** 
- Header KHÔNG break ở viewport ≥1024px
- Code section có border riêng, không trôi tự do
- "MÃ" label gắn liền với code value và actions

**Commit:** `fix(group): header layout — group code section visually cohesive`

---

## Task GD-FIX-9 — Quick Actions "Bắt đầu Live" highlight 🟡

**Goal:** "Bắt đầu Live" là primary action cho leader — highlight với emerald accent border + subtle bg.

**Files:**
- `apps/web/src/components/group/QuickActionsPanel.tsx`

**Steps:**

```tsx
// Leader actions
<ActionCard 
  icon="📚"
  label="Tạo bộ câu hỏi"
  hint="Bài giảng / Sinh hoạt"
  onClick={...}
/>
<ActionCard 
  icon="🎮"
  label="Bắt đầu Live"
  hint="Realtime · 5 modes"
  highlight  // NEW prop — primary action
  onClick={...}
/>
<ActionCard 
  icon="🏆"
  label="Tổ chức giải đấu"
  hint={memberCount < 4 
    ? `Cần ≥4 thành viên (hiện ${memberCount})`
    : "Bracket 4-32 người"
  }
  disabled={memberCount < 4}
/>
<ActionCard 
  icon="📢"
  label="Đăng thông báo"
  hint={`Cho ${memberCount} thành viên`}
  onClick={...}
/>

// ActionCard component
function ActionCard({ icon, label, hint, highlight, disabled, onClick }) {
  const baseStyle = {
    background: highlight 
      ? 'rgba(74,222,128,0.05)' 
      : 'rgba(50,52,64,0.55)',
    backdropFilter: 'blur(12px)',
    border: highlight
      ? '1px solid rgba(74,222,128,0.3)'
      : '1px solid rgba(255,255,255,0.06)',
  };
  
  return (
    <button 
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`rounded-xl p-3 text-left transition-all ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-0.5 cursor-pointer'
      }`}
      style={baseStyle}
      title={disabled ? hint : undefined}
    >
      <div className="text-2xl mb-1.5">{icon}</div>
      <div className="text-sm font-bold text-white">{label}</div>
      <div className={`text-[10px] mt-0.5 ${highlight ? 'text-emerald-400 font-semibold' : 'text-gray-400'}`}>
        {hint}
      </div>
    </button>
  );
}
```

**Verify:** Manual — "Bắt đầu Live" card có emerald border + emerald hint text, các cards khác neutral.

**Commit:** `fix(group): Bắt đầu Live primary action with emerald accent`

---

## Final regression sau 9 fixes

1. **Visual diff:** mở mockup HTML side-by-side với group detail page → nhận xét pixel-level
2. **Tests:** baseline + 8-12 new tests pass
3. **Screenshot smoke test (manual):**
   - [ ] Tab Hoạt động (leader): Pulse banner top → Live Now banner (nếu có) → Onboarding → Quick Actions với "Bắt đầu Live" emerald → Activity placeholder với 4 filter chips → Members preview với online/offline → Quiz Sets cards rich
   - [ ] Tab Hoạt động (member): KHÔNG Pulse, có Live Now, Quick Actions chỉ 2 cards
   - [ ] Sidebar: "🟢 Đang online · X/Y" + "🎮 Phòng đang mở (N)" hoặc empty
   - [ ] Header: code section visually cohesive, KHÔNG trôi
   - [ ] Onboarding tasks: icon emoji colored, done state có ✅
4. **i18n:** vi.json + en.json đầy đủ, KHÔNG tăng hardcoded count

---

## Rules cho Claude Code

1. **Mở mockup HTML trong browser TRƯỚC khi sửa** — đọc cấu trúc, design tokens
2. **Commit từng fix riêng** — 9 commits
3. **Memory rules:** hardcoded hex `#e8a832/#11131e`, no CSS variables
4. **i18n complete:** mọi string mới có vi.json + en.json
5. **Test sau mỗi commit** — báo delta tests
6. **STOP sau mỗi fix** — đợi Bui review screenshot trước khi sang fix tiếp

---

## Effort estimate

| Phase | Tasks | Effort |
|---|---|---|
| Critical (Pulse, Live Now) | GD-FIX-1, 2 | 0.5 ngày |
| Members + Quiz Sets | GD-FIX-3, 4 | 0.5 ngày |
| Sidebar + Activity Feed | GD-FIX-5, 6 | 0.5 ngày |
| Polish (icons, header, highlight) | GD-FIX-7, 8, 9 | 0.5 ngày |
| **Total** | **9 commits** | **~2 ngày** |

LOC change: ~800-1200 lines (chủ yếu UI refinement, không entity changes lớn).

---

**Bắt đầu GD-FIX-1 (Cell Group Pulse banner). Stop sau commit, screenshot. Confirm Bui trước khi sang GD-FIX-2.**
