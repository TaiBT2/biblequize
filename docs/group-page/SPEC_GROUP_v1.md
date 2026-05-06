# BibleQuiz — SPEC GROUP (v1)

> Spec chuyên sâu về Church Group — feature differentiator chính của BibleQuiz.
> Tách riêng khỏi SPEC_USER vì group complexity đủ lớn để xứng 1 spec riêng.
> Last updated: 2026-05-06
> Replaces: Section 9.1 trong SPEC_USER_v3.md

---

## Mục lục

1. Tầm nhìn & Đối tượng
2. Roles & Permissions
3. Group Lifecycle
4. Group Discovery & Joining
5. Group Settings & Management
6. Multiple Leaders System
7. Quiz Sets (Bộ câu hỏi nhóm)
8. Activities — "Chơi cùng nhau" (Live)
9. Activities — "Đặt lịch chơi" (Scheduled)
10. Group Leaderboard & Stats
11. Notifications cho group
12. Edge Cases & Conflict Resolution
13. API Reference
14. Database Schema
15. Migration từ SPEC cũ

---

## 1. Tầm nhìn & Đối tượng

### 1.1 Tại sao Group là differentiator chính

BibleQuiz không phải Duolingo cho Bible — nó là **công cụ ministry cho hội thánh**. Group feature là khác biệt cốt lõi:

| Quiz solo | Quiz trong Group |
|---|---|
| Học cá nhân, lonely loop | Học cùng anh chị em đức tin |
| Cạnh tranh với người lạ | Cạnh tranh với mục sư, bạn nhóm tế bào |
| Nội dung random | Leader chọn quiz theo bài giảng/series |
| Engagement phụ thuộc app design | Engagement phụ thuộc cộng đồng thực |

Hội thánh Tin Lành Methodist (target user) đã có structure: nhóm tế bào, Trường Chúa Nhật, ban thanh niên. App phải fit vào structure đó, không tạo structure mới.

### 1.2 Use cases chính

| Use case | Group context | Activity type |
|---|---|---|
| Ôn bài sau buổi nhóm tế bào | 8-15 người | "Chơi cùng nhau" (live, sequential) |
| Học Trường Chúa Nhật | 15-30 người | "Chơi cùng nhau" + Quiz tuần |
| Thử thách ban thanh niên | 30-60 người | "Đặt lịch chơi" (async, deadline) |
| Bible challenge cả hội thánh | 100-200 người | "Đặt lịch chơi" + Group Leaderboard |
| Ban giáo phẩm thi đua | 5-10 người | Tất cả |

### 1.3 Personas

| Persona | Vai trò | Nhu cầu chính |
|---|---|---|
| **Mục sư trưởng** | Leader nhóm hội thánh tổng | Track member engagement, schedule quiz tuần, rally cộng đồng |
| **Trưởng nhóm tế bào** | Leader nhóm 8-15 người | Ôn bài cùng nhóm sau buổi nhóm, tạo gắn kết |
| **Giáo viên CN** | Co-leader nhóm Trường Chúa Nhật | Tạo quiz theo bài học, theo dõi học viên |
| **Member tích cực** | Member nhiều nhóm | Tham gia hoạt động, leo leaderboard nhóm |
| **Member casual** | Member 1 nhóm | Khi rảnh thì chơi, không bị áp lực |

---

## 2. Roles & Permissions

### 2.1 Hai roles duy nhất

App chỉ có **2 roles** trong group context:

- **Leader** — người tạo group hoặc được promote bởi leader hiện tại
- **Member** — mọi người khác đã join group

Không có Mod role để giảm complexity. Multi-leader system (Section 6) đảm nhiệm vai trò "phụ trợ" mà Mod role thường handle.

### 2.2 Permission Matrix

| Action | Leader | Member |
|---|---|---|
| **Group Management** | | |
| Edit group info (tên, mô tả, ảnh) | ✅ | ❌ |
| Toggle privacy (public/private) | ✅ | ❌ |
| Lock/unlock group | ✅ | ❌ |
| Delete group | ✅ (with confirm) | ❌ |
| Invite via code | ✅ | ❌ |
| Approve/reject join requests | ✅ | ❌ |
| Kick member | ✅ | ❌ |
| Promote member to leader | ✅ | ❌ |
| Demote co-leader to member | ✅ (chỉ original creator) | ❌ |
| **Quiz Sets** | | |
| Tạo quiz set | ✅ | ❌ |
| Edit/delete quiz set | ✅ (creator hoặc leader) | ❌ |
| Archive quiz set | ✅ | ❌ |
| Tự ôn solo từ quiz set | ✅ | ✅ |
| **Activities** | | |
| Tạo phòng "Chơi cùng nhau" | ✅ | ❌ |
| Đặt lịch "Quiz tuần" | ✅ | ❌ |
| Tham gia phòng đã mở | ✅ | ✅ |
| Chơi Quiz tuần | ✅ | ✅ |
| Cancel/end activity sớm | ✅ (creator) | ❌ |
| **Communications** | | |
| Đăng announcement | ✅ | ❌ |
| Edit/pin announcement | ✅ | ❌ |
| **Member actions** | | |
| Xem leaderboard nhóm | ✅ | ✅ |
| Xem member list | ✅ | ✅ |
| Rời nhóm | ✅ (nếu còn leader khác) | ✅ |
| Báo cáo group (cho admin) | ✅ | ✅ |

### 2.3 Backend authorization

Mọi endpoint POST/PATCH/DELETE phải check role server-side. **KHÔNG** trust client.

```
@PreAuthorize("@groupSecurity.isLeader(#groupId, principal)")
@PostMapping("/api/groups/{groupId}/quiz-sets")
```

Member hack request → backend reject 403.

---

## 3. Group Lifecycle

### 3.1 State machine

```
             [Created]
                 ↓
              Active ←──────┐
              ↓ ↓ ↓         │
       Inactive ↓ Locked    │ unlock
       (30+    Archived     │ (admin only)
        ngày    ↓           │
        no act)  ↓           │
              ↓ ↓           │
             Soft-deleted ──┘
              (orphan timer)
                 ↓
           Hard-deleted
           (after 7 ngày)
```

### 3.2 States và transitions

| State | Mô tả | Có thể join? | Có thể chơi? |
|---|---|---|---|
| **Active** | Group bình thường | ✅ | ✅ |
| **Inactive** | Không có activity 30+ ngày, vẫn xem được | ✅ | ✅ |
| **Archived** | Leader tự archive — paused | ❌ | ❌ |
| **Locked** | Admin lock vì vi phạm | ❌ | ❌ (read-only) |
| **Soft-deleted** | Tất cả leader đã rời, đếm 7 ngày | ❌ | ❌ |
| **Hard-deleted** | Đã xóa khỏi DB | N/A | N/A |

### 3.3 Auto-detect Inactive

Cron job daily check:
```sql
UPDATE group SET status = 'INACTIVE'
WHERE status = 'ACTIVE'
  AND last_activity_at < NOW() - INTERVAL 30 DAY
```

`last_activity_at` update khi: có session play, announcement post, member join.

Inactive → Active tự động khi có activity mới.

### 3.4 Soft delete grace period

Khi tất cả leaders rời group:
1. Group → status `SOFT_DELETED`
2. `orphan_at = NOW()`
3. Cron daily: `WHERE orphan_at < NOW() - INTERVAL 7 DAY` → hard delete
4. Trong 7 ngày, leader cũ có thể restore qua email link

**Lưu ý:** Member còn trong group khi soft-deleted → group hiện trong list của họ với badge "🗑️ Đang xóa - 5 ngày nữa", có thể join group khác.

---

## 4. Group Discovery & Joining

### 4.1 Privacy levels

Chỉ **2 levels** cho v1:

| Level | Discovery | Join method |
|---|---|---|
| **Public** (default) | Hiện trong `/groups` discovery | Click "Tham gia" → join ngay |
| **Private** | Không hiện trong discovery | Cần mã 6 ký tự để join |

Toggle trong Group Settings. Switch Public→Private không kick existing members.

### 4.2 Tạo group

**Constraint:** 1 user max 2 groups đã tạo (là leader).

```
User A click "Tạo nhóm mới":
  ↓
Backend check: COUNT(groups WHERE creator = A AND status NOT IN ('soft_deleted', 'hard_deleted')) >= 2
  ↓
  Nếu >= 2 → block với modal:
    "Bạn đã tạo 2 nhóm: 'FMC Đà Nẵng' và 'Nhóm Tế Bào'. 
     Hãy giải tán hoặc chuyển quyền 1 nhóm trước khi tạo nhóm mới."
    [Quản lý nhóm cũ →]
  ↓
  Nếu < 2 → form tạo group
```

**Form fields:**
- Tên nhóm (3-50 ký tự, required)
- Mô tả (0-200 ký tự)
- Avatar emoji hoặc upload ảnh
- Privacy: Public (default) / Private
- Welcome message (gửi tự động khi member join)

Sau khi tạo:
- Creator tự động là leader
- Group code 6 ký tự auto-generated unique (uppercase A-Z, 0-9)
- Status = `ACTIVE`
- `last_activity_at = NOW()`

### 4.3 Joining flows

**Public group via discovery:**
```
/groups → "Khám phá" tab → list public groups
  ↓
Click card → preview modal: avatar, name, member count, leader name, description
  ↓
"Tham gia" button → POST /api/groups/{id}/join → success → redirect to group detail
```

**Private group via code:**
```
/groups → "Tham gia bằng mã" button → input 6 ký tự
  ↓
POST /api/groups/join-by-code { code }
  ↓
  Code valid + group active → join success
  Code invalid → "Mã không tồn tại"
  Group full / locked → error message rõ ràng
```

**Constraint khi join:**
- Group full (max members configurable, default 200) → "Nhóm đã đầy"
- User đã trong group → "Bạn đã là thành viên"
- Group locked/archived → "Nhóm tạm khóa, không nhận thành viên mới"
- User reach max 5 groups joined → "Bạn đã tham gia tối đa 5 nhóm" (anti-spam, tăng nếu cần)

### 4.4 Welcome flow

Member join lần đầu:
1. Receive welcome message từ leader (push notification)
2. Group detail mở với highlight banner "👋 Chào mừng bạn đến với [Group Name]!"
3. Banner auto-dismiss sau 24h hoặc click X
4. Group leaderboard hiện rank "#?" (chưa có activity)

---

## 5. Group Settings & Management

### 5.1 Settings page (`/groups/{id}/settings`)

**Chỉ leader truy cập được.** Layout:

```
[Thông tin chung]
- Avatar (upload hoặc emoji)
- Tên nhóm
- Mô tả
- Welcome message
- [Lưu thay đổi]

[Privacy]
- Toggle Public/Private
- Mã nhóm (read-only) + button "Tạo lại mã" (confirm modal)

[Thành viên]
- Max members slider (50/100/200)
- Approval mode: instant join / leader approve (defer v1.5)

[Quản lý leaders]
- List current leaders (với crown icon cho original creator)
- "Promote member thành leader" → modal chọn member
- Co-leader cards với button "Demote về member" (chỉ creator thấy)

[Lưu trữ]
- Toggle archive group (paused, không xóa)
- Restore archived → quay về Active

[Khu vực nguy hiểm — Danger Zone]
- "Rời nhóm" (nếu là co-leader, không phải creator)
- "Xóa nhóm" (chỉ creator) → confirm bằng input tên nhóm
```

### 5.2 Delete group flow

```
Creator click "Xóa nhóm":
  ↓
Modal: "Hành động này KHÔNG THỂ hoàn tác sau 7 ngày.
        Sẽ xóa: tất cả quiz sets, history, leaderboard, member relationships.
        
        Để xác nhận, nhập tên nhóm: [____]"
  ↓
Confirm → group → SOFT_DELETED, orphan_at = NOW()
  ↓
Tất cả member nhận push: "Nhóm '...' sẽ bị xóa trong 7 ngày"
  ↓
Trong 7 ngày: creator có thể restore từ email link
  ↓
Sau 7 ngày: hard delete (CASCADE: members, quiz sets, history)
```

### 5.3 Lock group (admin only)

Admin có thể lock group vì vi phạm. UI member thấy:
- Banner đỏ "🔒 Nhóm bị khóa: [lý do]"
- Không tạo activity được, không post được
- Vẫn xem được history (read-only)
- Member có thể rời tự do

---

## 6. Multiple Leaders System

### 6.1 Tại sao multiple leaders

Solve "leader đi vắng" problem mà không cần Mod role:
- Leader chính bận → co-leader handle quiz tuần
- Leader đi công tác 1 tuần → group vẫn active
- Phân quyền tự nhiên: trưởng nhóm + giáo viên CN cùng admin

### 6.2 Promotion flow

```
Leader hiện tại (creator hoặc co-leader đều được) → Settings → Quản lý leaders
  ↓
"Promote member thành leader" → modal hiện member list (search + filter)
  ↓
Chọn member → confirm "Bạn muốn cấp quyền leader cho [Name]?"
  ↓
Confirm → POST /api/groups/{id}/leaders { userId }
  ↓
Member trở thành co-leader, nhận push notification
  Status row member trên member list update với crown badge
```

**Constraint:**
- Max 5 leaders per group (anti-abuse, configurable)
- Member phải đã join group >= 7 ngày (anti-spam)
- Member chưa từng bị kick khỏi group (audit log check)

### 6.3 Demotion (rút quyền)

**Chỉ creator (leader đầu tiên) được demote co-leaders.** Co-leader không demote nhau và không demote creator.

```
Creator → Settings → Quản lý leaders → co-leader card → "Demote về member"
  ↓
Confirm "Rút quyền leader của [Name]? Họ vẫn là member."
  ↓
DELETE /api/groups/{id}/leaders/{userId}
  ↓
Co-leader nhận push notification (gentle wording)
```

### 6.4 Creator quyền đặc biệt

Creator (người tạo group) có 1 quyền duy nhất khác co-leaders:
- **Demote co-leader về member**
- Mọi quyền khác giống co-leader (edit, delete group, tạo activity, etc.)

Trong UI, creator hiện crown icon vàng đặc biệt. Co-leader hiện crown icon gold normal.

### 6.5 Tất cả leaders rời group

```
Leader cuối cùng click "Rời nhóm":
  ↓
Modal warning: "Bạn là leader cuối cùng. Rời nhóm sẽ bắt đầu quá trình xóa nhóm trong 7 ngày."
  
  Lựa chọn:
    [Hủy]
    [Promote member khác trước rồi rời] → đi flow promote
    [Vẫn rời và xóa nhóm] → soft delete
```

**Edge case:** Nếu creator bị ban hệ thống → group → SOFT_DELETED ngay lập tức (không grace period). Member nhận thông báo.

---

## 7. Quiz Sets (Bộ câu hỏi nhóm)

### 7.1 Ownership rules

- **Quiz Set thuộc về group, không phải user cá nhân**
- Tạo bởi leader, dùng được bởi tất cả leaders trong cùng group
- Member KHÔNG tạo được quiz set (per Q4 decision)
- Member chỉ chơi qua activities (live phòng / scheduled quiz) hoặc "Tự ôn solo"

### 7.2 Lifecycle

```
[Draft] (leader đang tạo, chưa save)
   ↓ save
[Active] (sẵn sàng dùng)
   ↓ leader archive
[Archived] (không tạo activity mới được, history vẫn xem)
   ↓ leader restore
[Active] (loop)

[Active] hoặc [Archived]
   ↓ leader delete
[Soft-deleted] (30 ngày grace)
   ↓ auto
[Hard-deleted]
```

### 7.3 Tạo Quiz Set

```
Leader trong group → Tab "Bộ câu hỏi" → "Tạo bộ câu hỏi" button
  ↓
Form modal:
  - Tên (required, 3-100 ký tự)
  - Mô tả (optional)
  - Source: Manual / AI Generate / Browse Library
  
  [Manual] → search & pick câu từ thư viện 4,000+ câu
  [AI Generate] → input chương Kinh Thánh → AI tạo (5-20 câu)
  [Browse Library] → existing quiz sets templates (church-shared)
  
  - Difficulty mix: Dễ/Trung bình/Khó/Mixed
  - Số câu: 5-50
  - Language: VN / EN
  ↓
Save → Quiz Set thuộc group này
```

### 7.4 Quiz Set limits per group

- Max **20 active quiz sets** per group (configurable)
- Quiz set archived không tính
- Đạt limit → phải archive cũ trước khi tạo mới

### 7.5 "Tự ôn solo" — đặc biệt

Đây là **exception duy nhất** cho rule "member không dùng quiz set":

```
Member trong group → Tab "Bộ câu hỏi" → click quiz set card → "Tự ôn solo"
  ↓
Member vào Practice mode với câu hỏi từ quiz set
  ↓
Không tính XP, không vào leaderboard chính, không vào group leaderboard
  ↓
Mục đích: cho member ôn bài cá nhân giữa các activities
```

Lý do exception: nếu không có "Tự ôn solo", quiz set chỉ dùng được khi leader online → group dependency quá lớn.

### 7.6 Quiz Set bị xóa khi đang dùng

Edge cases:
- Quiz Set bị archive → live room đang dùng nó tiếp tục bình thường (đã load câu hỏi vào memory)
- Quiz Set bị delete → live room đang chạy: tiếp tục với câu đã load. Sau khi end, quiz set vẫn delete được.
- Scheduled quiz đang chờ deadline + quiz set bị delete → BLOCK delete với message "Bộ câu hỏi đang được dùng cho 'Quiz tuần ...'. Hãy hủy lịch trước."

---

## 8. Activities — "Chơi cùng nhau" (Live)

### 8.1 Concept

Live multiplayer cho group. Sequential format (chờ tất cả trả lời mới sang câu kế) — context "ôn bài + thảo luận", không phải đua tốc độ.

### 8.2 Tạo phòng

```
Leader → Tab "Bộ câu hỏi" → quiz set card → "Chơi cùng nhau" button
  ↓
Modal config:
  - Tên phòng (required, default = "Ôn bài [date]")
  - Số câu lấy từ quiz set: all hoặc subset (5/10/15)
  - Time per câu: 20s / 30s (default) / 45s
  - Pause sau mỗi câu: 5s / 10s / 15s (cho discussion)
  - Max players: 1-20 (default 20)
  ↓
Submit → POST /api/groups/{id}/live-rooms
  ↓
Room created, leader auto-joined as host, navigate to lobby
```

### 8.3 Member tham gia

3 ways:

**A. Live Call Banner** (recommended):
```
Leader tạo phòng → push notification cho tất cả member
  ↓
Member mở app → Group Detail tab "Bộ câu hỏi" → banner prominent đầu trang:
  "🟣 Trưởng vừa mở phòng 'Ôn bài tối thứ Sáu' - 5/20 người"
  [Tham gia phòng →]
  ↓
Click → join lobby
```

**B. Direct link** (deep link từ push):
```
Push notification → click → biblequiz://room/{roomCode} → vào lobby
```

**C. Room code manual:**
```
Member → /groups → "Tham gia bằng mã" → input code (6 ký tự)
```

### 8.4 Gameplay rules

**Sequential flow:**
1. Host (leader) bấm "Bắt đầu"
2. Câu 1 hiện cho tất cả players cùng lúc
3. Player chọn đáp án → submit (timer count down)
4. **Không thể đổi answer sau khi submit** (anti-cheat khi thấy người khác)
5. Waiting strip "Chờ X người trả lời..." cho đến khi tất cả xong (hoặc hết timer)
6. Reveal đáp án + explanation + scriptureRef
7. Pause discussion (5/10/15s configurable)
8. Auto next câu
9. Lặp đến hết quiz

**Scoring:**
- Đúng: 100 điểm + speed bonus (max +50)
- Sai: 0 điểm
- Timeout không answer: 0 điểm
- **Score KHÔNG vào XP/Group Leaderboard chính** — chỉ trong room

### 8.5 Disconnect handling

- Player disconnect → 60s grace period
- Trong grace period: câu mới → auto-skip player đó (counted as no_answer)
- Reconnect trong grace → resume current question
- Không reconnect 60s → marked as `LEFT`, score frozen ở thời điểm leave

**Host disconnect:**
- 60s grace → nếu không reconnect:
  - Có co-leader trong room → auto-promote thành host
  - Không có co-leader → room paused, member vote tiếp tục/end

### 8.6 Final & history

```
Hết câu cuối → final screen:
  - 🎉 banner "Hoàn thành!"
  - Podium top 3 với crown #1
  - Full leaderboard với accuracy + avg response time
  - Action buttons cho host: [Tạo phòng mới] [Đóng phòng]
  - Action buttons cho member: [Quay lại nhóm]
  ↓
Room → status `ENDED`, lưu vào group history
  ↓
History entry: ngày, quiz set, players count, top 3 names, average score
```

### 8.7 Concurrent rooms

- 1 group có thể có **nhiều rooms cùng lúc** (vd: 2 nhóm tế bào con cùng chơi parallel)
- Không hạn chế số rooms — leader nào tạo người đó host
- Member có thể join nhiều rooms (consecutive, không simultaneous)

---

## 9. Activities — "Đặt lịch chơi" (Scheduled)

### 9.1 Concept

Async quiz với deadline. Member chơi rải rác trong khoảng thời gian, cuối deadline công bố winner.

### 9.2 Tạo lịch

```
Leader → quiz set card → "Đặt lịch" button
  ↓
Form:
  - Tên (required, default "Quiz tuần - [date]")
  - Mô tả (optional)
  - Quiz Set (read-only, đã chọn từ card)
  - Deadline preset: 24 giờ / 7 ngày / 14 ngày / Tùy chỉnh
  - Số lần thử cho mỗi member: 1 / 3 (default) / unlimited
  - Toggle: "Hiện leaderboard công khai" (default ON)
  - Toggle: "Push notification" (default ON, 3 events: created, 24h_remaining, ended)
  ↓
Submit → POST /api/groups/{id}/scheduled-quiz
  ↓
Push notification cho tất cả member: "Quiz tuần mới: '[name]' - hạn chót [date]"
  Group Detail tab "Bộ câu hỏi" hiện scheduled card prominent
```

### 9.3 Member chơi

```
Member nhận noti → click → Group Detail
  ↓
Scheduled card hiện:
  - Status pulse animated
  - Tên + countdown ("Còn 2 ngày 14h")
  - Progress dots (•••) — ✓ done, • available, ✗ used
  - "Bạn đã chơi X/3 lần. Cao nhất: Y điểm"
  - Button "Chơi lần đầu" / "Chơi tiếp" / "Đã chơi hết"
  ↓
Click → mode like Practice nhưng với câu hỏi từ quiz set
  ↓
Submit answer → score recorded
  Lưu best score (lấy max trong số lần thử)
  Update live leaderboard real-time
```

### 9.4 Constraint

- Max **3 active scheduled quizzes** per group cùng lúc (configurable)
- Vượt → block với message "Đã có 3 quiz đang chạy. Hãy đợi hoặc cancel quiz cũ."
- Member chơi xong vẫn xem được leaderboard live cho đến deadline
- Không cho member chơi sau deadline (read-only)

### 9.5 Deadline & winner announcement

```
Cron job mỗi phút:
  WHERE deadline < NOW() AND status = 'ACTIVE'
  ↓
Each:
  - status → 'ENDED'
  - Freeze leaderboard
  - Determine winner: max best_score, tie-break = total time taken
  - Auto-create group announcement: "🏆 [Winner Name] đã thắng Quiz tuần '[name]' với X điểm!"
  - Push notification cho tất cả member
  - Move card to "Đã kết thúc" tab
```

### 9.6 History

Sau khi end:
- Tab "Đã kết thúc" trong Group Detail (collapsed default)
- Click expand → list past scheduled quizzes với winner + leaderboard final
- Vĩnh viễn không tự delete

### 9.7 Edge cases

- **Quiz set bị delete khi scheduled quiz đang chạy** → BLOCK delete (xem 7.6)
- **Member rời group khi đang chơi** → Score giữ trong leaderboard với tag "(đã rời nhóm)"
- **Member join group sau khi quiz published** → vẫn được chơi nếu deadline chưa hết
- **Group bị soft-deleted khi quiz đang chạy** → cancel quiz, không announce winner

---

## 10. Group Leaderboard & Stats

### 10.1 Leaderboard tabs

3 tabs trong Group Detail → Tab "Xếp hạng":

| Tab | Period | Reset |
|---|---|---|
| **Tuần** | 7 ngày gần nhất (UTC) | Tự động hàng tuần |
| **Tháng** | 30 ngày gần nhất | Tự động hàng tháng |
| **Tất cả thời gian** | All-time since user join group | Không reset |

### 10.2 Scoring vào group leaderboard

Chỉ activities sau đóng góp:
- ✅ Scheduled quiz (best score per user)
- ✅ "Chơi cùng nhau" live rooms (sum scores)
- ✅ Tự ôn solo từ quiz set của group

KHÔNG đóng góp:
- ❌ Practice mode general (ngoài group quiz set)
- ❌ Ranked Mode (đã có leaderboard riêng global)
- ❌ Daily Challenge

### 10.3 Around-me pattern

Member xem leaderboard:
- Top 3 hiện full
- Sau đó hiện around-me: 2 trên + me + 2 dưới
- Click "Xem tất cả" → full list paginated

### 10.4 Group stats (leader only)

Leader → "Thống kê" button → analytics page:

**Engagement metrics:**
- Active members tuần này / tháng này
- Đường cong activity 30 ngày (line chart)
- Top 5 active members
- Members chưa active 7+ ngày (warning section, để leader nhắc nhở)

**Content metrics:**
- Quiz sets used most
- Average accuracy by quiz set
- Difficulty distribution

**Activity metrics:**
- Tổng số live rooms tổ chức
- Tổng số scheduled quizzes hoàn thành
- Average participation rate per activity

---

## 11. Notifications cho group

### 11.1 Auto notifications

| Event | Recipient | Default |
|---|---|---|
| Member join group | Leaders | ✅ ON |
| Member leave group | Leaders | ✅ ON |
| Member promoted to leader | Promoted user + other leaders | ✅ ON |
| Live room opened | All members | ✅ ON |
| Live room starts (host bấm Start) | Members in lobby | ✅ ON |
| Scheduled quiz published | All members | ✅ ON |
| Scheduled quiz 24h remaining | Members chưa chơi | ✅ ON |
| Scheduled quiz ended + winner | All members | ✅ ON |
| Group announcement posted | All members | ✅ ON |
| Group locked by admin | All members | ✅ ON |
| Group will be deleted (orphan) | All members | ✅ ON |

### 11.2 Member control

Settings → Notifications → Group: toggle on/off per group.

Mute group: không nhận noti từ group cụ thể nhưng vẫn member.

### 11.3 Group announcement

Leader post announcement:
```
Tab "Thông báo" → "Đăng thông báo" button
  ↓
Form: title (50 chars) + content (markdown supported)
  ↓
Submit → push notification cho tất cả member + email digest weekly
  ↓
Hiện trên Group Detail header banner cho 7 ngày
```

Pin announcement: max 3 pinned, hiện đầu list.

---

## 12. Edge Cases & Conflict Resolution

### 12.1 Race conditions

| Scenario | Resolution |
|---|---|
| 2 leaders cùng tạo phòng cùng lúc | Cả 2 thành công, là 2 rooms riêng |
| Leader delete quiz set lúc member đang "Tự ôn solo" | Member tiếp tục với câu đã load, kết thúc bình thường |
| Last leader leave + member promote race | DB transaction lock, ai commit trước thắng |
| Member tạo "Tự ôn solo" lúc group bị delete | Session continue, kết quả không lưu |

### 12.2 Member conflicts

**Member bị kick:**
1. Leader → member list → "..." → "Kick" → confirm với reason
2. Member nhận noti "Bạn đã bị xóa khỏi nhóm '...'. Lý do: ..."
3. Member loses access ngay lập tức
4. Member không thể rejoin trong 7 ngày (cooldown anti-spam)
5. Audit log

**Member rời group:**
- Có thể rời bất cứ lúc nào
- Score lịch sử giữ trong group leaderboard với tag "(đã rời)"
- Personal history trong profile vẫn còn

**Member bị ban từ hệ thống:**
- Tất cả group memberships → status `BANNED`
- Hide từ leaderboard, member list
- Quiz history giữ nhưng không hiện

### 12.3 Group deletion edge cases

**Active scheduled quiz khi group delete:**
- Cancel quiz, không announce winner
- Member nhận push: "Quiz '...' đã hủy do nhóm bị xóa"

**Active live room khi group soft-delete:**
- Room tiếp tục đến hết tự nhiên
- Sau end: history lưu nhưng group không restore được

**Restore soft-deleted group:**
- Trong 7 ngày grace
- Original creator click email link → group về `ACTIVE`
- Members nhận noti "Nhóm '...' đã được khôi phục"
- Quiz sets, history, leaderboard giữ nguyên

### 12.4 Reporting & moderation

Member có thể report group cho admin:
```
Group Detail → "..." menu → "Báo cáo nhóm" → modal chọn reason:
  - Spam
  - Nội dung không phù hợp
  - Quấy rối
  - Khác (text input)
  ↓
Admin queue → review → action (warn / lock / delete)
```

Admin actions xem SPEC_ADMIN.md section 11.

---

## 13. API Reference

### 13.1 Group CRUD

```
POST   /api/groups                              create new group
GET    /api/groups/{id}                         get detail (with userRole field)
PATCH  /api/groups/{id}                         update info (leader only)
DELETE /api/groups/{id}                         soft delete (creator only)
POST   /api/groups/{id}/restore                 restore soft-deleted (creator, within 7d)
GET    /api/groups                              list user's groups
GET    /api/groups/discover                     public groups discovery
```

### 13.2 Membership

```
POST   /api/groups/{id}/join                    join public group
POST   /api/groups/join-by-code                 join via code { code }
POST   /api/groups/{id}/leave                   leave group
GET    /api/groups/{id}/members                 member list
DELETE /api/groups/{id}/members/{userId}        kick member (leader only) { reason }
```

### 13.3 Leadership

```
GET    /api/groups/{id}/leaders                 list leaders
POST   /api/groups/{id}/leaders                 promote member { userId }
DELETE /api/groups/{id}/leaders/{userId}        demote co-leader (creator only)
```

### 13.4 Quiz Sets

```
GET    /api/groups/{id}/quiz-sets               list active + archived
POST   /api/groups/{id}/quiz-sets               create (leader only)
PATCH  /api/groups/{id}/quiz-sets/{setId}       update (leader)
DELETE /api/groups/{id}/quiz-sets/{setId}       soft delete
PATCH  /api/groups/{id}/quiz-sets/{setId}/archive
PATCH  /api/groups/{id}/quiz-sets/{setId}/restore
POST   /api/groups/{id}/quiz-sets/{setId}/play  → { sessionId } (member: solo practice)
```

### 13.5 Live Activities

```
POST   /api/groups/{id}/live-rooms              create live room (leader)
GET    /api/groups/{id}/live-rooms              list active rooms in group
GET    /api/rooms/{roomCode}                    room detail by code (any user)
POST   /api/rooms/{roomCode}/join               join lobby
POST   /api/rooms/{roomCode}/leave              leave lobby/game
POST   /api/rooms/{roomCode}/start              start game (host only)
POST   /api/rooms/{roomCode}/end                force end (host only)
WebSocket /room/{roomCode}                      real-time gameplay
```

### 13.6 Scheduled Activities

```
POST   /api/groups/{id}/scheduled-quiz          create new
GET    /api/groups/{id}/scheduled-quiz          list (active + ended)
GET    /api/groups/{id}/scheduled-quiz/{quizId}  detail
DELETE /api/groups/{id}/scheduled-quiz/{quizId}  cancel before deadline
POST   /api/groups/{id}/scheduled-quiz/{quizId}/play  start an attempt → { sessionId }
GET    /api/groups/{id}/scheduled-quiz/{quizId}/leaderboard
```

### 13.7 Stats & Leaderboard

```
GET    /api/groups/{id}/leaderboard?period=week|month|all
GET    /api/groups/{id}/leaderboard/around-me?period=week
GET    /api/groups/{id}/stats                   leader analytics
```

### 13.8 Communications

```
POST   /api/groups/{id}/announcements           post (leader)
GET    /api/groups/{id}/announcements
PATCH  /api/groups/{id}/announcements/{annId}/pin
DELETE /api/groups/{id}/announcements/{annId}
```

### 13.9 Reports

```
POST   /api/groups/{id}/report                  member report group { reason, note }
```

---

## 14. Database Schema

### 14.1 Core tables

```sql
-- Groups
CREATE TABLE group (
  id BIGINT PK AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  avatar_url VARCHAR(500),
  avatar_emoji VARCHAR(10),
  code VARCHAR(6) NOT NULL UNIQUE,
  privacy ENUM('public', 'private') NOT NULL DEFAULT 'public',
  status ENUM('active', 'inactive', 'archived', 'locked', 'soft_deleted') NOT NULL DEFAULT 'active',
  max_members INT NOT NULL DEFAULT 200,
  welcome_message TEXT,
  creator_user_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP NOT NULL,
  orphan_at TIMESTAMP NULL,
  locked_reason TEXT,
  INDEX idx_status (status),
  INDEX idx_orphan (orphan_at),
  FOREIGN KEY (creator_user_id) REFERENCES user(id)
);

-- Group members (combines members + leaders into 1 table với role enum)
CREATE TABLE group_member (
  id BIGINT PK AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role ENUM('member', 'leader') NOT NULL DEFAULT 'member',
  is_creator BOOLEAN NOT NULL DEFAULT FALSE,  -- creator can demote co-leaders
  joined_at TIMESTAMP NOT NULL,
  promoted_at TIMESTAMP,
  promoted_by_user_id BIGINT,
  status ENUM('active', 'left', 'kicked', 'banned') NOT NULL DEFAULT 'active',
  left_at TIMESTAMP,
  kick_reason TEXT,
  UNIQUE KEY uk_group_user (group_id, user_id),
  INDEX idx_user_role (user_id, role),
  FOREIGN KEY (group_id) REFERENCES group(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Constraint: max 2 groups owned per user (enforce in app layer or trigger)
-- Constraint: max 5 leaders per group
```

### 14.2 Quiz sets

```sql
CREATE TABLE quiz_set (
  id BIGINT PK AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  creator_user_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  difficulty_mix ENUM('easy', 'medium', 'hard', 'mixed') NOT NULL,
  language ENUM('vi', 'en') NOT NULL DEFAULT 'vi',
  total_questions INT NOT NULL,
  status ENUM('active', 'archived', 'soft_deleted') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX idx_group_status (group_id, status),
  FOREIGN KEY (group_id) REFERENCES group(id) ON DELETE CASCADE
);

CREATE TABLE quiz_set_question (
  quiz_set_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  order_index INT NOT NULL,
  PRIMARY KEY (quiz_set_id, question_id),
  FOREIGN KEY (quiz_set_id) REFERENCES quiz_set(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES question(id)
);
```

### 14.3 Activities

```sql
-- Live rooms
CREATE TABLE group_live_room (
  id BIGINT PK AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  quiz_set_id BIGINT NOT NULL,
  host_user_id BIGINT NOT NULL,
  code VARCHAR(6) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  question_count INT NOT NULL,
  time_per_question_sec INT NOT NULL DEFAULT 30,
  pause_sec INT NOT NULL DEFAULT 5,
  max_players INT NOT NULL DEFAULT 20,
  status ENUM('lobby', 'in_progress', 'ended', 'cancelled') NOT NULL,
  created_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  INDEX idx_group_status (group_id, status),
  INDEX idx_code (code),
  FOREIGN KEY (group_id) REFERENCES group(id),
  FOREIGN KEY (quiz_set_id) REFERENCES quiz_set(id)
);

-- Scheduled quizzes
CREATE TABLE group_scheduled_quiz (
  id BIGINT PK AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  quiz_set_id BIGINT NOT NULL,
  creator_user_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  deadline TIMESTAMP NOT NULL,
  attempts_per_user INT NOT NULL DEFAULT 3,
  show_public_leaderboard BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('active', 'ended', 'cancelled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  winner_user_id BIGINT,
  INDEX idx_deadline_status (deadline, status),
  FOREIGN KEY (group_id) REFERENCES group(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_set_id) REFERENCES quiz_set(id)
);

CREATE TABLE group_scheduled_quiz_attempt (
  id BIGINT PK AUTO_INCREMENT,
  scheduled_quiz_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  attempt_number INT NOT NULL,
  score INT NOT NULL,
  correct_count INT NOT NULL,
  total_time_ms BIGINT NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  INDEX idx_quiz_user (scheduled_quiz_id, user_id, score DESC),
  FOREIGN KEY (scheduled_quiz_id) REFERENCES group_scheduled_quiz(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id)
);
```

### 14.4 Communications & meta

```sql
CREATE TABLE group_announcement (
  id BIGINT PK AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  author_user_id BIGINT NOT NULL,
  title VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL,
  INDEX idx_group (group_id, created_at DESC),
  FOREIGN KEY (group_id) REFERENCES group(id) ON DELETE CASCADE
);

CREATE TABLE group_report (
  id BIGINT PK AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  reporter_user_id BIGINT NOT NULL,
  reason ENUM('spam', 'inappropriate', 'harassment', 'other') NOT NULL,
  note TEXT,
  status ENUM('open', 'reviewed', 'actioned', 'dismissed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (group_id) REFERENCES group(id) ON DELETE CASCADE
);

-- Group leaderboard (denormalized for performance, refresh nightly)
CREATE TABLE group_leaderboard (
  group_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  period ENUM('week', 'month', 'all_time') NOT NULL,
  total_score INT NOT NULL,
  rank_in_group INT NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  PRIMARY KEY (group_id, user_id, period),
  INDEX idx_group_period_rank (group_id, period, rank_in_group),
  FOREIGN KEY (group_id) REFERENCES group(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id)
);
```

### 14.5 Indexes & Performance Notes

- Group code lookup: `idx_code` cho fast join-by-code
- Active rooms in group: `idx_group_status` cho display
- Scheduled deadline: `idx_deadline_status` cho cron job efficient
- Leaderboard: denormalized table refresh by cron, không compute on-the-fly

---

## 15. Migration từ SPEC cũ

### 15.1 Breaking changes từ SPEC_USER_v3.md section 9.1

| Cũ | Mới |
|---|---|
| 3 roles (leader/mod/member) | 2 roles (leader/member) với multi-leader support |
| 1 user = 1 group | 1 user join unlimited groups, max 2 groups owned |
| Mod role có quyền create | Không có Mod, leaders chỉ creator + promoted users |
| Quiz Set: leader/mod tạo, member chơi | Quiz Set: chỉ leader tạo, member chơi via "Tự ôn solo" hoặc activities |
| Group privacy không clear | 2 levels: Public / Private (code-based) |

### 15.2 Data migration

```sql
-- Convert old mod role to leader role
UPDATE group_member SET role = 'leader' WHERE role = 'mod';

-- Mark creator
UPDATE group_member gm
JOIN group g ON g.creator_user_id = gm.user_id AND g.id = gm.group_id
SET gm.is_creator = TRUE
WHERE gm.role = 'leader';

-- Set max members default
UPDATE group SET max_members = 200 WHERE max_members IS NULL;

-- Default privacy public
UPDATE group SET privacy = 'public' WHERE privacy IS NULL;
```

### 15.3 Frontend migration

Components cần update:
- `GroupDetailHeader` — render dựa trên `userRole` ('leader' | 'member')
- `MemberList` — show crown icon cho leaders, gold crown cho creator
- `GroupSettings` — restructure thành sections (per 5.1)
- `QuizSetCard` — different actions per role
- `LiveCallBanner` — new component cho member view

### 15.4 Endpoint deprecation

Old endpoints to remove:
- `POST /api/groups/{id}/mods` (Mod role removed)
- `DELETE /api/groups/{id}/mods/{userId}`

Replace với leader endpoints (Section 13.3).

### 15.5 Migration timeline

- **Week 1**: DB migration scripts + backend endpoint changes
- **Week 2**: Frontend role-based UI
- **Week 3**: Testing với real church group beta
- **Week 4**: Cutover, deprecate old endpoints

---

## Phụ lục A: Anti-spam constraints

| Constraint | Limit | Reason |
|---|---|---|
| Max groups owned by user | 2 | Prevent spam group creation |
| Max groups joined by user | 5 | Prevent membership farming |
| Max leaders per group | 5 | Prevent leader chaos |
| Max members per group | 200 (configurable) | Performance + meaningful community |
| Max active quiz sets per group | 20 | Storage + UX clarity |
| Max active scheduled quizzes per group | 3 | Prevent member overwhelm |
| Member promotion eligibility | >= 7 days in group | Prevent fast role escalation |
| Re-join after kick cooldown | 7 days | Prevent harassment loops |
| Group code length | 6 chars | Memorable + unique enough (3.6B combos) |

---

## Phụ lục B: SPEC scope clarifications

**Trong scope spec này:**
- Group lifecycle, roles, permissions
- Quiz Set ownership và lifecycle
- 2 activity types (live + scheduled)
- Group leaderboard và stats cơ bản
- Notifications related to group

**Ngoài scope (xem spec khác):**
- Tournament module (SPEC_USER section 5.5) — separate feature
- Admin moderation flow (SPEC_ADMIN section 11)
- Search và discovery algorithm chi tiết
- AI question generation (SPEC_ADMIN section 6)
- Multi-language quiz set localization
- Achievement/badge system per group context

---

*Living spec — cập nhật theo từng milestone hoặc khi có user feedback từ beta testers.*
