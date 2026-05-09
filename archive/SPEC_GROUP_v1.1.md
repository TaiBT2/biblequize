# BibleQuiz — SPEC GROUP (v1.1)

> Spec chuyên sâu về Church Group — feature differentiator chính của BibleQuiz.
> Last updated: 2026-05-06
> Replaces: SPEC_GROUP_v1.0.md (sau audit từ implementation team)

---

## Changelog v1.0 → v1.1

Spec v1.1 sửa **6 inconsistencies** mà implementation audit đã phát hiện sau khi ship 10 fixes:

| # | Section | Thay đổi |
|---|---|---|
| 1 | 7.5 + 10.2 | Align: "Tự ôn solo" KHÔNG vào group leaderboard (trước đây 2 sections conflict) |
| 2 | 8.4 | Sequential mode: leader manual advance (trước đây: auto-advance + pause config) |
| 3 | 8.5 | Host disconnect v1: cancel room broadcast (trước đây: auto-promote co-leader) |
| 4 | 6 + 15 | Multi-leader system marked **"v1.5 target — defer"** với rationale |
| 5 | 13.5 + 14 | API endpoint `/live-rooms` (rename từ `/live-quiz`); DB schema match implementation (`questionIds JSON`) |
| 6 | New §16 | Roadmap section phân biệt v1 / v1.5 / v2.0 scope |

**Backward compatibility**: Spec v1.1 align với code đang ship. Implementation team không cần revert work, chỉ cần 3 small adjustments (xem §15.4).

---

## Mục lục

1. Tầm nhìn & Đối tượng
2. Roles & Permissions
3. Group Lifecycle
4. Group Discovery & Joining
5. Group Settings & Management
6. Multiple Leaders System (**v1.5 target**)
7. Quiz Sets (Bộ câu hỏi nhóm)
8. Activities — "Chơi cùng nhau" (Live)
9. Activities — "Đặt lịch chơi" (Scheduled)
10. Group Leaderboard & Stats
11. Notifications cho group
12. Edge Cases & Conflict Resolution
13. API Reference
14. Database Schema
15. Migration & Implementation Notes
16. **Roadmap (v1 / v1.5 / v2.0)**

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
| **Giáo viên CN** | Leader nhóm Trường Chúa Nhật | Tạo quiz theo bài học, theo dõi học viên |
| **Member tích cực** | Member nhiều nhóm | Tham gia hoạt động, leo leaderboard nhóm |
| **Member casual** | Member 1 nhóm | Khi rảnh thì chơi, không bị áp lực |

---

## 2. Roles & Permissions

### 2.1 Roles trong v1

App có **3 roles** trong group context cho v1:

- **Leader** — người tạo group
- **Mod** — co-helper được leader cấp quyền (giữ tạm trong v1, defer remove đến v1.5)
- **Member** — mọi người khác đã join group

> ⚠️ **Roadmap note**: Mod role giữ trong v1 vì multi-leader system (Section 6) là **v1.5 target**. Khi multi-leader ship, Mod role sẽ migrate thành co-leader rồi remove. Xem §16 Roadmap.

### 2.2 Permission Matrix

| Action | Leader | Mod | Member |
|---|---|---|---|
| **Group Management** | | | |
| Edit group info (tên, mô tả, ảnh) | ✅ | ❌ | ❌ |
| Toggle privacy (public/private) | ✅ | ❌ | ❌ |
| Lock/unlock group | ✅ | ❌ | ❌ |
| Delete group | ✅ (with confirm) | ❌ | ❌ |
| Invite via code | ✅ | ✅ | ❌ |
| Approve/reject join requests | ✅ | ✅ | ❌ |
| Kick member | ✅ | ❌ | ❌ |
| Promote member to mod | ✅ | ❌ | ❌ |
| Demote mod | ✅ | ❌ | ❌ |
| **Quiz Sets** | | | |
| Tạo quiz set | ✅ | ✅ | ❌ |
| Edit/delete quiz set | ✅ (own + others) | ✅ (own only) | ❌ |
| Archive quiz set | ✅ | ✅ | ❌ |
| Tự ôn solo từ quiz set | ✅ | ✅ | ✅ |
| **Activities** | | | |
| Tạo phòng "Chơi cùng nhau" | ✅ | ✅ | ❌ |
| Đặt lịch "Quiz tuần" | ✅ | ✅ | ❌ |
| Tham gia phòng đã mở | ✅ | ✅ | ✅ |
| Chơi Quiz tuần | ✅ | ✅ | ✅ |
| Cancel/end activity sớm | ✅ (any) | ✅ (own) | ❌ |
| **Communications** | | | |
| Đăng announcement | ✅ | ✅ | ❌ |
| Edit/pin announcement | ✅ | ✅ (own) | ❌ |
| **Member actions** | | | |
| Xem leaderboard nhóm | ✅ | ✅ | ✅ |
| Xem member list | ✅ | ✅ | ✅ |
| Rời nhóm | ❌ (delete instead) | ✅ | ✅ |
| Báo cáo group (cho admin) | ❌ | ✅ | ✅ |

### 2.3 Backend authorization

Mọi endpoint POST/PATCH/DELETE phải check role server-side. **KHÔNG** trust client.

Existing helper trong code:
```java
@PreAuthorize("@groupSecurity.requireLeaderOrMod(#groupId, principal)")
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
| **Soft-deleted** | Leader đã rời/xóa, đếm 7 ngày | ❌ | ❌ |
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

Khi leader rời group (v1: 1 leader/group nên = leader cuối cùng):
1. Group → status `SOFT_DELETED`
2. `orphan_at = NOW()`
3. Cron daily: `WHERE orphan_at < NOW() - INTERVAL 7 DAY` → hard delete
4. Trong 7 ngày, leader cũ có thể restore qua email link

**Lưu ý:** Member còn trong group khi soft-deleted → group hiện trong list của họ với badge "🗑️ Đang xóa - 5 ngày nữa", có thể join group khác.

> 🔄 **v1.5 change**: Khi multi-leader system ship, soft-delete chỉ trigger khi **TẤT CẢ leaders** rời. Logic update tự động.

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
Backend check: 
  COUNT(groups WHERE creator_user_id = A 
        AND status NOT IN ('soft_deleted', 'hard_deleted')) >= 2
  ↓
  Nếu >= 2 → block với modal:
    "Bạn đã tạo 2 nhóm: 'FMC Đà Nẵng' và 'Nhóm Tế Bào'. 
     Hãy giải tán hoặc chuyển quyền 1 nhóm trước khi tạo nhóm mới."
    [Quản lý nhóm cũ →]
  ↓
  Nếu < 2 → form tạo group
```

> ⚠️ **Implementation gap (Q-E)**: Backend chưa enforce constraint này. Track riêng, fix khi convenient.

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
- User reach max 5 groups joined → "Bạn đã tham gia tối đa 5 nhóm" (anti-spam)

> ⚠️ **Implementation gap (Q-F)**: Backend chưa enforce 5-group limit. Track riêng.

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

[Quản lý mods] (v1)
- List current mods (với shield icon)
- "Promote member thành mod" → modal chọn member
- Mod cards với button "Demote về member"

[Quản lý leaders] (v1.5 target — không có v1)
- ...

[Lưu trữ]
- Toggle archive group (paused, không xóa)
- Restore archived → quay về Active

[Khu vực nguy hiểm — Danger Zone]
- "Xóa nhóm" (chỉ leader) → confirm bằng input tên nhóm
```

### 5.2 Delete group flow

```
Leader click "Xóa nhóm":
  ↓
Modal: "Hành động này KHÔNG THỂ hoàn tác sau 7 ngày.
        Sẽ xóa: tất cả quiz sets, history, leaderboard, member relationships.
        
        Để xác nhận, nhập tên nhóm: [____]"
  ↓
Confirm → group → SOFT_DELETED, orphan_at = NOW()
  ↓
Tất cả member nhận push: "Nhóm '...' sẽ bị xóa trong 7 ngày"
  ↓
Trong 7 ngày: leader có thể restore từ email link
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

> ⚠️ **TARGET v1.5 — KHÔNG implement trong v1.**

### 6.1 Tại sao defer

- v1 đã có Mod role handle "leader cần phụ tá" use case
- Multi-leader = breaking architectural change (DB + permission + UI)
- Chưa có evidence từ user beta rằng church groups thực sự cần multi-leader (validation principle)
- Beta launch timeline 1 tuần — không đủ runway cho 3-5 days work

### 6.2 v1.5 design (preserved cho future implementation)

Khi v1.5 ship, system sẽ thay đổi:

**Roles:** Leader / Member (Mod role removed)

**Multi-leader rules:**
- 1 group có thể có nhiều leaders
- Leader hiện tại có thể promote member thành co-leader
- Original creator có quyền đặc biệt: demote co-leaders
- Co-leader không demote nhau, không demote creator
- Max 5 leaders per group
- Member phải >= 7 ngày trong group mới promote được

**Edge cases:**
- Tất cả leaders rời → soft-delete 7 ngày (như v1 với 1 leader)
- Creator bị system ban → group → SOFT_DELETED ngay, không grace

**UI:**
- Creator: gold crown đặc biệt
- Co-leaders: gold crown normal
- Members: không icon

### 6.3 Migration path v1 → v1.5

```sql
-- Step 1: Add columns
ALTER TABLE group_member ADD COLUMN is_creator BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Backfill creator flag
UPDATE group_member gm
JOIN group g ON g.creator_user_id = gm.user_id AND g.id = gm.group_id
SET gm.is_creator = TRUE
WHERE gm.role = 'leader';

-- Step 3: Convert mods to leaders
UPDATE group_member SET role = 'leader' WHERE role = 'mod';

-- Step 4: Remove mod from enum (Spring side)
-- Update GroupMember.GroupRole enum: LEADER, MEMBER (drop MOD)
```

**Rollout sequence:**
1. Deploy DB migration (additive — safe)
2. Deploy BE với new permission helper (`requireLeader` thay `requireLeaderOrMod`)
3. Deploy FE với promotion/demotion UI
4. Run migration script convert mods → leaders
5. Communicate change cho existing leaders

### 6.4 Validation triggers cho v1.5 launch

Build v1.5 multi-leader **chỉ khi** thỏa mãn ít nhất 1:
- 5+ leaders complain "tôi đi vắng group im ắng"
- 3+ groups request co-leadership feature
- Beta data show >30% groups inactive khi leader offline 3+ ngày

Nếu không trigger → defer indefinitely.

---

## 7. Quiz Sets (Bộ câu hỏi nhóm)

### 7.1 Ownership rules

- **Quiz Set thuộc về group, không phải user cá nhân**
- Tạo bởi leader hoặc mod, dùng được bởi tất cả leaders + mods trong cùng group
- Member KHÔNG tạo được quiz set
- Member chỉ chơi qua activities (live phòng / scheduled quiz) hoặc "Tự ôn solo" (xem 7.5)

### 7.2 Lifecycle

```
[Draft] (đang tạo, chưa save)
   ↓ save
[Active] (sẵn sàng dùng)
   ↓ leader/mod archive
[Archived] (không tạo activity mới được, history vẫn xem)
   ↓ leader/mod restore
[Active] (loop)

[Active] hoặc [Archived]
   ↓ delete
[Soft-deleted] (30 ngày grace)
   ↓ auto
[Hard-deleted]
```

### 7.3 Tạo Quiz Set

```
Leader/Mod trong group → Tab "Bộ câu hỏi" → "Tạo bộ câu hỏi" button
  ↓
Form modal:
  - Tên (required, 3-100 ký tự)
  - Mô tả (optional)
  - Source: Manual / AI Generate
  
  [Manual] → search & pick câu từ thư viện 4,000+ câu
  [AI Generate] → input chương Kinh Thánh → AI tạo (5-20 câu)
  
  - Difficulty mix: Dễ/Trung bình/Khó/Mixed
  - Số câu: 5-50
  - Language: VN / EN
  ↓
Save → Quiz Set thuộc group này
```

> 📌 **Future v2.0**: "Browse Library" source — quiz set templates shared cross-church. Defer.

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
KHÔNG tính XP
KHÔNG vào group leaderboard (xem §10.2)
KHÔNG vào ranked leaderboard chính
  ↓
Mục đích: cho member ôn bài cá nhân giữa các activities
```

Lý do exception: nếu không có "Tự ôn solo", quiz set chỉ dùng được khi leader online → group dependency quá lớn.

> 🔧 **Implementation note (GFA-17)**: Hiện tại "Tự ôn solo" tạo SPEED_RACE room (architectural mismatch). Refactor sang Practice session API là tech debt — track riêng, defer cho đến khi có evidence solo mode được dùng nhiều.
> 
> **Short-term v1**: bỏ dedup logic trong solo path (5 LOC) để 2 members cùng "Tự ôn" không bị merge vào 1 room. Mỗi click → room riêng (vẫn SPEED_RACE 1-player). Functional bug fix.
> 
> **Long-term GFA-17**: refactor solo → Practice session, drop room creation. ~50 LOC + new endpoint.

### 7.6 Quiz Set bị xóa khi đang dùng

Edge cases:
- Quiz Set bị archive → live room đang dùng nó tiếp tục bình thường (đã load câu hỏi vào memory)
- Quiz Set bị delete → live room đang chạy: tiếp tục với câu đã load. Sau khi end, quiz set vẫn delete được.
- Scheduled quiz đang chờ deadline + quiz set bị delete → BLOCK delete với message "Bộ câu hỏi đang được dùng cho 'Quiz tuần ...'. Hãy hủy lịch trước."

---

## 8. Activities — "Chơi cùng nhau" (Live)

### 8.1 Concept

Live multiplayer cho group. **Sequential format** (chờ tất cả trả lời mới sang câu kế) — context "ôn bài + thảo luận", không phải đua tốc độ.

### 8.2 Tạo phòng

```
Leader/Mod → Tab "Bộ câu hỏi" → quiz set card → "Chơi cùng nhau" button
  ↓
Modal config:
  - Tên phòng (required, default = "Ôn bài [date]")
  - Số câu lấy từ quiz set: all hoặc subset (5/10/15)
  - Time per câu: 20s / 30s (default) / 45s
  - Max players: 1-20 (default 20)
  ↓
Submit → POST /api/groups/{id}/live-rooms
  ↓
Room created, leader auto-joined as host, navigate to lobby
```

**Concurrent rooms:** 1 group có thể có **nhiều rooms cùng lúc** (vd: 2 nhóm tế bào con cùng chơi parallel). Mỗi click "Chơi cùng nhau" tạo room mới — KHÔNG dedup.

> 🔧 **Implementation note**: Code đã ship initial version có dedup logic — đã revert per audit. Mỗi click tạo room riêng từ v1.

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

### 8.4 Gameplay rules — Sequential với Manual Advance

**Sequential flow:**
1. Host (leader/mod) bấm "Bắt đầu"
2. Câu 1 hiện cho tất cả players cùng lúc
3. Player chọn đáp án → submit (timer count down 30s)
4. **Không thể đổi answer sau khi submit** (anti-cheat khi thấy người khác)
5. Waiting strip "Chờ X người trả lời..." cho đến khi tất cả xong (hoặc hết timer)
6. Reveal đáp án + explanation + scriptureRef
7. **Host bấm "Sang câu tiếp"** để continue (manual advance, KHÔNG auto)
8. Member thấy waiting state với hint "Đang chờ trưởng nhóm sang câu..."
9. Lặp đến hết quiz

**Tại sao manual advance:**
- Use case là **ôn bài + thảo luận** — discussion không có timer fixed
- Có câu cần 5s, có câu cần 5 phút (giáo viên giải thích, member hỏi)
- Auto-advance ép pace, kill purpose của sequential format
- Pattern Kahoot có "Show Answer" countdown auto bị giáo viên complain → manual là pattern đúng cho learning context

> 🔧 **v1.0 → v1.1 change**: Trước có config `pause_sec` (5/10/15s) cho auto-advance. **Bỏ config này hoàn toàn.** Host fully control pace.

**Scoring:**
- Đúng: 100 điểm + speed bonus (max +50)
- Sai: 0 điểm
- Timeout không answer: 0 điểm
- **Score KHÔNG vào XP/Group Leaderboard chính** — chỉ trong room

### 8.5 Disconnect handling

**Player disconnect:**
- 60s grace period
- Trong grace period: câu mới → auto-skip player đó (counted as no_answer)
- Reconnect trong grace → resume current question
- Không reconnect 60s → marked as `LEFT`, score frozen ở thời điểm leave

**Host disconnect (v1):**
- 60s grace period
- Không reconnect 60s → **broadcast `ROOM_CLOSED`** đến tất cả players
- Room status → `ENDED` với reason `host_disconnected`
- Players nhận notification "Trưởng nhóm mất kết nối, phòng đã đóng. Score đã được lưu."
- Members về Group Detail
- Result page hiển thị partial leaderboard (đã chơi đến đâu)

> 🔄 **v1.5 change**: Khi multi-leader system ship, host disconnect → auto-promote co-leader đầu tiên trong room thành new host. Game tiếp tục seamless. Cần co-leader system trước (Section 6).

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

### 8.7 Concurrent rooms (recap)

- 1 group có thể có **nhiều rooms cùng lúc** (vd: 2 nhóm tế bào con cùng chơi parallel)
- Không hạn chế số rooms — leader/mod nào tạo người đó host
- Member có thể join nhiều rooms (consecutive, không simultaneous)
- 1 user chỉ trong 1 active room tại 1 thời điểm

> ⚠️ **Implementation gap (Q-J)**: BE chưa enforce 1-active-room-per-user. Track riêng.

---

## 9. Activities — "Đặt lịch chơi" (Scheduled)

### 9.1 Concept

Async quiz với deadline. Member chơi rải rác trong khoảng thời gian, cuối deadline công bố winner.

### 9.2 Tạo lịch

```
Leader/Mod → quiz set card → "Đặt lịch" button
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
- ✅ **Scheduled quiz** (best score per user per quiz)
- ✅ **"Chơi cùng nhau" live rooms** (sum scores per user across rooms)

KHÔNG đóng góp:
- ❌ **Tự ôn solo** từ quiz set của group (đã align với §7.5)
- ❌ **Practice mode general** (ngoài group quiz set)
- ❌ **Ranked Mode** (đã có leaderboard riêng global)
- ❌ **Daily Challenge**

> 🔧 **v1.0 → v1.1 change**: Trước đây spec conflict — §7.5 nói "Tự ôn solo KHÔNG vào leaderboard" nhưng §10.2 list nó là source. **v1.1 align: KHÔNG vào.**
> 
> **Rationale:**
> - Group leaderboard reflect **group activity** (cùng nhau chơi). "Tự ôn solo" là cá nhân, không có group context.
> - Member chăm chỉ tự ôn solo sẽ leo top mặc dù không tham gia activities thật → không fair với người tham gia "Chơi cùng nhau" và "Quiz tuần".
> - Risk farm điểm: member spam solo để leo rank giả tạo.

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

| Event | Recipient | Default | Status v1 |
|---|---|---|---|
| Member join group | Leaders/Mods | ✅ ON | 🚧 Gap |
| Member leave group | Leaders/Mods | ✅ ON | 🚧 Gap |
| Member promoted to mod | Promoted user + leaders | ✅ ON | 🚧 Gap |
| Live room opened | All members | ✅ ON | 🚧 Gap |
| Live room starts (host bấm Start) | Members in lobby | ✅ ON | 🚧 Gap |
| Scheduled quiz published | All members | ✅ ON | 🚧 Gap |
| Scheduled quiz 24h remaining | Members chưa chơi | ✅ ON | 🚧 Gap |
| Scheduled quiz ended + winner | All members | ✅ ON | 🚧 Gap |
| Group announcement posted | All members | ✅ ON | 🚧 Gap |
| Group locked by admin | All members | ✅ ON | 🚧 Gap |
| Group will be deleted (orphan) | All members | ✅ ON | 🚧 Gap |

> ⚠️ **Implementation gap (Q-K)**: Push notifications cho 11 events chưa implement. Track riêng — incremental implement, prioritize "Live room opened" + "Scheduled quiz published" trước.

### 11.2 Member control

Settings → Notifications → Group: toggle on/off per group.

Mute group: không nhận noti từ group cụ thể nhưng vẫn member.

### 11.3 Group announcement

Leader/Mod post announcement:
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
| 2 leaders/mods cùng tạo phòng cùng lúc | Cả 2 thành công, là 2 rooms riêng (no dedup) |
| Leader delete quiz set lúc member đang "Tự ôn solo" | Member tiếp tục với câu đã load, kết thúc bình thường |
| Leader leave + member promote race (v1.5) | DB transaction lock, ai commit trước thắng |
| Member tạo "Tự ôn solo" lúc group bị delete | Session continue, kết quả không lưu |

### 12.2 Member conflicts

**Member bị kick:**
1. Leader → member list → "..." → "Kick" → confirm với reason
2. Member nhận noti "Bạn đã bị xóa khỏi nhóm '...'. Lý do: ..."
3. Member loses access ngay lập tức
4. Member không thể rejoin trong 7 ngày (cooldown anti-spam)
5. Audit log

> ⚠️ **Implementation gap (Q-L)**: 7-day cooldown chưa enforce. Track riêng.

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

> ⚠️ **Implementation gap (Q-M)**: Report group endpoint chưa implement. Track riêng.

---

## 13. API Reference

### 13.1 Group CRUD

```
POST   /api/groups                              create new group
GET    /api/groups/{id}                         get detail (with userRole field)
PATCH  /api/groups/{id}                         update info (leader only)
DELETE /api/groups/{id}                         soft delete (leader only)
POST   /api/groups/{id}/restore                 restore soft-deleted (leader, within 7d)
GET    /api/groups                              list user's groups
GET    /api/groups/discover                     public groups discovery
```

### 13.2 Membership

```
POST   /api/groups/{id}/join                    join public group
POST   /api/groups/join-by-code                 join via code { code }
POST   /api/groups/{id}/leave                   leave group
GET    /api/groups/{id}/members                 member list
DELETE /api/groups/{id}/members/{userId}        kick member (leader/mod) { reason }
```

### 13.3 Mods (v1) / Leaders (v1.5)

**v1 (current):**
```
GET    /api/groups/{id}/mods                    list mods
POST   /api/groups/{id}/mods                    promote member to mod (leader)
DELETE /api/groups/{id}/mods/{userId}           demote mod (leader)
```

**v1.5 (target — không implement v1):**
```
GET    /api/groups/{id}/leaders                 list leaders
POST   /api/groups/{id}/leaders                 promote member { userId }
DELETE /api/groups/{id}/leaders/{userId}        demote co-leader (creator only)
```

### 13.4 Quiz Sets

```
GET    /api/groups/{id}/quiz-sets               list active + archived
POST   /api/groups/{id}/quiz-sets               create (leader/mod)
PATCH  /api/groups/{id}/quiz-sets/{setId}       update (leader/mod own)
DELETE /api/groups/{id}/quiz-sets/{setId}       soft delete
PATCH  /api/groups/{id}/quiz-sets/{setId}/archive
PATCH  /api/groups/{id}/quiz-sets/{setId}/restore
POST   /api/groups/{id}/quiz-sets/{setId}/play  → { sessionId } (member: solo practice)
```

### 13.5 Live Activities

```
POST   /api/groups/{id}/live-rooms              create live room (leader/mod)
GET    /api/groups/{id}/live-rooms              list active rooms in group
GET    /api/rooms/{roomCode}                    room detail by code (any user)
POST   /api/rooms/{roomCode}/join               join lobby
POST   /api/rooms/{roomCode}/leave              leave lobby/game
POST   /api/rooms/{roomCode}/start              start game (host only)
POST   /api/rooms/{roomCode}/advance            host advance to next question (manual)
POST   /api/rooms/{roomCode}/end                force end (host only)
WebSocket /room/{roomCode}                      real-time gameplay
```

> 🔧 **v1.0 → v1.1 change**: 
> - Renamed endpoint `/live-quiz` → `/live-rooms` (4 files: ChurchGroupController.java, groups.ts:23, ChurchGroupControllerTest.java, e2e specs)
> - Added new endpoint `POST /api/rooms/{roomCode}/advance` cho manual advance pattern (§8.4)

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
POST   /api/groups/{id}/announcements           post (leader/mod)
GET    /api/groups/{id}/announcements
PATCH  /api/groups/{id}/announcements/{annId}/pin
DELETE /api/groups/{id}/announcements/{annId}
```

### 13.9 Reports

```
POST   /api/groups/{id}/report                  member report group { reason, note }
```

> ⚠️ **Implementation gap (Q-M)**: Endpoint chưa implement.

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

-- Group members (combines members + leaders + mods into 1 table với role enum)
CREATE TABLE group_member (
  id BIGINT PK AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role ENUM('member', 'mod', 'leader') NOT NULL DEFAULT 'member',  -- v1; v1.5 drops 'mod'
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

-- v1.5 migration:
-- ALTER TABLE group_member ADD COLUMN is_creator BOOLEAN NOT NULL DEFAULT FALSE;
-- UPDATE group_member ... SET is_creator = TRUE WHERE creator;
-- UPDATE group_member SET role = 'leader' WHERE role = 'mod';
-- (Then update enum to drop 'mod')

-- Constraint: max 2 groups owned per user (enforce in app layer)
-- Constraint v1.5: max 5 leaders per group
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
  question_ids JSON NOT NULL,  -- array of question IDs in order
  status ENUM('active', 'archived', 'soft_deleted') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX idx_group_status (group_id, status),
  FOREIGN KEY (group_id) REFERENCES group(id) ON DELETE CASCADE
);
```

> 🔧 **v1.0 → v1.1 change**: Spec v1.0 đề xuất join table `quiz_set_question`. Implementation đã ship dùng JSON list (`question_ids`). Spec v1.1 align với code — JSON list. Lý do code chọn JSON: simpler, atomic update, no JOIN cần thiết khi serve quiz set (always need full list).

### 14.3 Activities

```sql
-- Live rooms (renamed từ "live_quiz" trong code)
CREATE TABLE group_live_room (
  id BIGINT PK AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  quiz_set_id BIGINT NOT NULL,
  host_user_id BIGINT NOT NULL,
  code VARCHAR(6) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  question_count INT NOT NULL,
  time_per_question_sec INT NOT NULL DEFAULT 30,
  -- pause_sec column REMOVED in v1.1 (manual advance, no auto pause)
  max_players INT NOT NULL DEFAULT 20,
  status ENUM('lobby', 'in_progress', 'ended', 'cancelled') NOT NULL,
  created_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  end_reason VARCHAR(50),  -- 'normal', 'host_disconnected', 'cancelled'
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

## 15. Migration & Implementation Notes

### 15.1 v1 vs v1.5 architectural diff

| Aspect | v1 (current target) | v1.5 (future) |
|---|---|---|
| Roles | Leader / Mod / Member | Leader (multi) / Member |
| Leader count | 1 per group | 1+ per group, max 5 |
| Mod role | Exists, has create permissions | Removed |
| Creator privileges | None special | Can demote co-leaders |
| Promotion eligibility | Any member promotable to mod | Member >= 7 days promotable to leader |
| Host disconnect | Cancel room broadcast | Auto-promote co-leader |
| `is_creator` flag | Not present | Required column |

### 15.2 v1 implementation checklist (current)

✅ **Done in v1:**
- Group CRUD (create, get, update, soft delete)
- Membership (join, leave, kick, code-based join)
- Quiz Sets (CRUD, archive, JSON question_ids)
- Live rooms with sequential format
- Manual advance pattern (host bấm "Sang câu tiếp")
- Concurrent rooms (no dedup live mode)
- Scheduled quiz with deadline
- Group leaderboard (week/month/all-time)
- Mod role with create permissions

🚧 **Gaps in v1 (track separately):**
- Q-E: Backend max-2-groups-owned constraint
- Q-F: Backend max-5-groups-joined constraint
- Q-J: 1-active-room-per-user enforcement
- Q-K: Push notifications (11 events)
- Q-L: 7-day re-join cooldown after kick
- Q-M: Report group endpoint
- GFA-17: Refactor "Tự ôn solo" sang Practice session API

### 15.3 Spec v1.0 → v1.1 changes summary

| Issue | v1.0 says | v1.1 says |
|---|---|---|
| Q-A: Solo into leaderboard | Conflict (§7.5 no, §10.2 yes) | Aligned: NO. Solo doesn't contribute. |
| Q-B: Sequential advance | Auto-advance + pause config | Manual advance, host clicks "Sang câu tiếp" |
| Q-C: Concurrent rooms | Implicit (multiple rooms OK) | Explicit: no dedup, mỗi click tạo room |
| Q-D: Mod role | Removed in v1 | Kept in v1, removal target v1.5 |
| Q-N: Endpoint name | `/live-rooms` | `/live-rooms` (rename from `/live-quiz`) |
| Q-O: DB schema | Join table `quiz_set_question` | JSON list `question_ids` |

### 15.4 Code adjustments required from v1.1 spec

Implementation team đã ship 10 fixes trong audit. Sau v1.1, cần **3 small adjustments**:

1. **Revert dedup live mode** (Q-C): bỏ dedup trong `createLiveQuiz` cho live rooms. Mỗi click tạo room mới.
2. **Bỏ dedup solo path** (GFA-17 short-term): bỏ dedup hoàn toàn cho solo path để 2 members không cross-contaminate. 5 LOC.
3. **Rename endpoint** (Q-N): `/live-quiz` → `/live-rooms`. 4 file changes.

Total estimate: <1 day work.

### 15.5 v1 → v1.5 migration path

Khi đến v1.5 (validation triggers đạt — xem §6.4):

```sql
-- Step 1: Add columns (additive, safe)
ALTER TABLE group_member ADD COLUMN is_creator BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Backfill creator flag
UPDATE group_member gm
JOIN group g ON g.creator_user_id = gm.user_id AND g.id = gm.group_id
SET gm.is_creator = TRUE
WHERE gm.role = 'leader';

-- Step 3: Convert mods to leaders
UPDATE group_member SET role = 'leader' WHERE role = 'mod';

-- Step 4: Update enum (drop 'mod' value)
ALTER TABLE group_member MODIFY COLUMN role ENUM('member', 'leader') NOT NULL DEFAULT 'member';
```

**BE changes:**
- `requireLeaderOrMod()` → `requireLeader()` ở all endpoints
- Add promotion/demotion endpoints (Section 13.3 v1.5)
- Add max 5 leaders constraint
- Add 7-day eligibility check
- Update host disconnect logic: auto-promote co-leader

**FE changes:**
- Settings → "Quản lý leaders" section thay "Quản lý mods"
- Member list crown icons: gold đặc biệt cho creator, gold normal cho co-leader
- Promotion modal cho leaders

**Estimated v1.5 work:** 3-5 days, 8-10 files touched.

---

## 16. Roadmap

### 16.1 v1 — Beta Launch (current)

**Scope:**
- Single leader per group, Mod role for co-help
- Quiz Sets với JSON question_ids
- Live "Chơi cùng nhau" với sequential + manual advance
- Scheduled "Đặt lịch chơi" với 3 attempts default
- Group leaderboard 3 periods
- Public/Private privacy

**Deferred from v1:**
- Multi-leader system → v1.5
- Mod role removal → v1.5
- Browse Library quiz set source → v2.0
- Auto-promote co-leader on host disconnect → v1.5
- Many notifications events → incremental
- Approval-based join mode → v1.5
- Cross-language quiz sets → v2.0

### 16.2 v1.5 — Multi-Leader System (post-beta)

**Trigger conditions** (build only when met):
- 5+ leaders complain "tôi đi vắng group im ắng"
- 3+ groups request co-leadership
- Beta data show >30% groups inactive khi leader offline 3+ ngày

**Scope:**
- Multi-leader per group (max 5)
- Creator special privileges (demote co-leaders)
- 7-day promotion eligibility
- Mod role migration → co-leader
- Auto-promote co-leader on host disconnect
- Approval-based join mode
- 7-day re-join cooldown after kick
- All push notification events implemented

### 16.3 v2.0 — Scale & Cross-Group (future)

**Scope:**
- Browse Library: shared quiz set templates cross-church
- Multi-language quiz sets (translate single set sang VN/EN)
- Group-to-group challenges (FMC Đà Nẵng vs FMC Hà Nội tournament)
- Advanced group analytics (engagement curves, content efficacy, predictive models)
- Custom badges per group
- Group merch/branding (custom avatar themes)
- Public group rankings (top groups by activity)

---

## Phụ lục A: Anti-spam constraints

| Constraint | Limit | Reason | v1 Status |
|---|---|---|---|
| Max groups owned by user | 2 | Prevent spam group creation | 🚧 Q-E gap |
| Max groups joined by user | 5 | Prevent membership farming | 🚧 Q-F gap |
| Max mods per group (v1) | 5 | Prevent mod chaos | ✅ TBD |
| Max leaders per group (v1.5) | 5 | Prevent leader chaos | N/A v1 |
| Max members per group | 200 (configurable) | Performance + meaningful community | ✅ |
| Max active quiz sets per group | 20 | Storage + UX clarity | ✅ |
| Max active scheduled quizzes per group | 3 | Prevent member overwhelm | ✅ |
| Member promotion eligibility (v1.5) | >= 7 days in group | Prevent fast role escalation | N/A v1 |
| Re-join after kick cooldown | 7 days | Prevent harassment loops | 🚧 Q-L gap |
| Group code length | 6 chars | Memorable + unique enough (3.6B combos) | ✅ |

---

## Phụ lục B: Endpoint deprecation tracking

**Renamed in v1.1:**
- ❌ `/api/groups/{id}/live-quiz` → ✅ `/api/groups/{id}/live-rooms`

**Will be removed in v1.5:**
- `GET /api/groups/{id}/mods`
- `POST /api/groups/{id}/mods`
- `DELETE /api/groups/{id}/mods/{userId}`

Replace với leader endpoints (Section 13.3 v1.5).

---

## Phụ lục C: Open questions for v1.1+

Captured for future spec versions:

- **Group transfer ownership** — leader có thể transfer group cho người khác? Hiện không hỗ trợ, defer.
- **Leader exit alternative** — thay vì soft-delete khi leader cuối rời, có nên có "transfer trước khi rời"? v1.5 với multi-leader sẽ giải quyết tự nhiên.
- **Quiz Set sharing** — leader có thể share quiz set với group khác không? v2.0 Browse Library.
- **Pinned quiz sets** — leader pin 1 quiz set "đang dùng" prominent? UX improvement, not architectural.
- **Group templates** — pre-built group structure (vd: "Trường Chúa Nhật" template với quiz sets sẵn)? v2.0.
- **Group invite link** (vs code) — link share-able dài thay vì 6 ký tự? UX consideration.

---

*Living spec — cập nhật theo từng milestone hoặc khi có user feedback từ beta testers.*
*Spec v1.1 reflects audit findings và implementation reality. v1.2 sẽ ra khi beta data có để adjust thêm.*
