# Prompt — Tier Progression Enhancement (BibleQuiz)

> Dùng cho Claude Code. Paste toàn bộ file này.
> Stack giả định: Spring Boot (backend) + React/React Native (frontend).
> Nếu stack khác, nói rõ ở đầu chat với Claude Code.

---

## Nhiệm vụ

Implement 6 cơ chế mới cho hệ thống Tier Progression của BibleQuiz nhằm tăng
D7 và D30 retention. Thực hiện theo đúng thứ tự ưu tiên P0 → P1 → P2.

**TRƯỚC KHI VIẾT BẤT KỲ CODE NÀO:**
1. Đọc toàn bộ prompt này.
2. Scan codebase: tìm file liên quan đến `tier`, `xp`, `user`, `session`, `score`.
3. Ghi ra `TODO.md` danh sách file cần sửa, bảng DB cần thêm, và thứ tự thực hiện.
4. Hỏi nếu có gì không rõ trước khi code.

---

## Bối cảnh hệ thống hiện tại

Tier hệ thống hiện có (đã tồn tại trong codebase):

```
6 tiers: Tia Sáng (0) → Ánh Bình Minh (1000) → Ngọn Đèn (5000)
       → Ngọn Lửa (15000) → Ngôi Sao (40000) → Vinh Quang (100000)

User.tierLevel: int (1–6)
User.totalPoints: long (all-time, chỉ tăng)
User.seasonPoints: long (reset mỗi season)

Tier benefits đã có: XP multiplier, energy regen/hour, freezePerWeek,
difficulty distribution, timer per tier, game mode unlocks.
```

---

## P0 — Phải làm trước (2–3 ngày)

### P0-A: Sub-tier Stars (Sao Nội Tầng)

**Mục tiêu:** Chia mỗi tier thành 5 sao. Cứ hoàn thành 1 sao → micro-celebration
+ bonus XP nhỏ. Giảm thời gian giữa các dopamine hit.

**Ngưỡng XP mỗi sao theo tier:**

| Tier | Total XP range | XP mỗi sao |
|------|---------------|-----------|
| 1 | 0–999 | 200 |
| 2 | 1000–4999 | 800 |
| 3 | 5000–14999 | 2000 |
| 4 | 15000–39999 | 5000 |
| 5 | 40000–99999 | 12000 |
| 6 | 100000+ | không có sao (đã max tier) |

**Cần implement:**

```
Backend:
- Không cần cột mới trong DB — tính từ totalPoints
- TierProgressService.getStarInfo(long totalPoints) → StarInfo {
    tierLevel, starIndex (0–4), starXp, nextStarXp, progressPercent
  }
- Khi answer đúng → sau khi cộng XP → kiểm tra star boundary đã vượt chưa
- Nếu vượt boundary → emit event STAR_ACHIEVED { starIndex, bonusXp: 30 }
- Cộng thêm 30 XP bonus vào User.totalPoints

API mới:
  GET /api/me/tier-progress
  Response: {
    tierLevel: int,
    tierName: string,           // "Ngọn Đèn"
    totalPoints: long,
    nextTierPoints: long,       // 14999
    tierProgressPercent: float, // 0.0–100.0
    starIndex: int,             // 0–4 (sao hiện tại đang ở)
    starXp: long,               // XP đầu sao này
    nextStarXp: long,           // XP sao kế tiếp
    starProgressPercent: float, // 0.0–100.0
    milestone: string|null      // "50%" hoặc "90%" nếu vừa hit, else null
  }

Frontend:
- Component TierProgressBar: hiện 5 dots/sao, filled vs empty
- Khi backend trả về event STAR_ACHIEVED → popup nhỏ ở góc màn hình:
  "⭐ Sao mới! +30 XP" (auto-dismiss sau 2.5s, không block UI)
- Màu sao theo tier: T1=amber, T2=blue, T3=blue-dark, T4=purple, T5=yellow, T6=red-gold
```

---

### P0-B: Daily Missions (Nhiệm vụ hàng ngày)

**Mục tiêu:** 3 nhiệm vụ/ngày, tự động chọn theo tier của user.
Hoàn thành cả 3 → Mission Bonus 50 XP.

**Mission definitions theo tier:**

```
Tier 1 (Tia Sáng):
  M1: answer_correct { count: 3 }
  M2: complete_daily_challenge {}
  M3: answer_combo { streak: 5 }

Tier 2 (Ánh Bình Minh):
  M1: play_any_mode {}
  M2: answer_correct_difficulty { difficulty: MEDIUM, count: 5 }
  M3: ranked_score { minScore: 60 }

Tier 3 (Ngọn Đèn):
  M1: answer_srs_review { count: 3 }
  M2: answer_correct_difficulty { difficulty: HARD, count: 3 }
  M3: win_multiplayer_room {}

Tier 4 (Ngọn Lửa):
  M1: answer_correct_book { count: 5 }    // 5 câu đúng trong cùng 1 sách
  M2: complete_speed_round {}
  M3: answer_correct_difficulty { difficulty: HARD, count: 10 }

Tier 5 (Ngôi Sao):
  M1: complete_mystery_mode {}
  M2: answer_combo { streak: 10 }
  M3: leaderboard_daily_top3 {}

Tier 6 (Vinh Quang):
  M1: review_ai_draft { count: 3 }        // review câu AI (nếu user là reviewer)
  M2: answer_hard_fast { count: 5, maxSec: 10 }
  M3: complete_prestige_weekly {}         // nếu đã prestige
```

**Schema DB mới:**

```sql
daily_mission (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id),
  date          DATE NOT NULL,               -- UTC date
  mission_slot  INT NOT NULL,                -- 1, 2, 3
  mission_type  VARCHAR(50) NOT NULL,        -- "answer_correct"
  config        JSONB NOT NULL,              -- { "count": 3 }
  progress      INT NOT NULL DEFAULT 0,
  target        INT NOT NULL,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  bonus_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, date, mission_slot)
)
```

**Cần implement:**

```
Backend:
- DailyMissionService.getOrCreateMissions(userId, date) → List<DailyMission>
  Logic: nếu chưa có record hôm nay → tạo 3 missions theo tierLevel hiện tại
- DailyMissionService.trackProgress(userId, event) → void
  Gọi sau mỗi answer/session end để update progress
- Khi mission hoàn thành → completed=true, completedAt=now()
- Khi cả 3 hoàn thành → tự động cộng 50 XP bonus_claimed=true

API mới:
  GET /api/me/daily-missions
  Response: {
    date: "2026-04-07",
    missions: [
      { slot: 1, type, description, progress, target, completed },
      { slot: 2, ... },
      { slot: 3, ... }
    ],
    allCompleted: boolean,
    bonusClaimed: boolean,
    bonusXp: 50
  }

Frontend:
- Card "Nhiệm vụ hôm nay" trên Home screen, hiện dưới Daily Challenge
- 3 dòng mission với progress bar nhỏ
- Khi allCompleted → card đổi màu xanh + "🎁 +50 XP nhận được!"
- Chest icon animate khi nhận bonus
```

---

## P1 — Làm sau P0 (1–2 ngày mỗi cái)

### P1-A: Milestone Burst (Cột mốc nội tầng)

**Mục tiêu:** Khi user đạt 50% và 90% XP đến tier tiếp theo,
trigger event đặc biệt.

```
Backend:
- Sau mỗi lần cộng XP → tính tierProgressPercent mới
- Lưu vào Redis: milestone:{userId}:50 và milestone:{userId}:90
  (để không trigger lại nhiều lần)
- 50% hit: trả về field milestone="50" trong /api/me/tier-progress
- 90% hit:
  a. Activate XP_SURGE_2H: user.xpSurgeUntil = now() + 2 hours
  b. Apply xpSurgeMultiplier (1.5×) trong SessionScoreService
  c. Gửi push notification: "Chỉ còn X XP đến [TierName]! XP ×1.5 trong 2 giờ 🚀"
  d. Trả về milestone="90" + surgeActiveUntil: timestamp

Schema bổ sung trong users hoặc Redis:
  xp_surge_until TIMESTAMPTZ   -- null nếu không active

Frontend:
- 50%: Banner nhỏ dưới progress bar (non-blocking): "Nửa đường đến 🪔 Ngọn Đèn!"
- 90%: Banner lớn hơn với countdown timer "XP ×1.5 còn 1:45:22"
       Timer tự update mỗi giây
```

---

### P1-B: Comeback Bridge (Cầu nối trở lại)

**Mục tiêu:** User vắng X ngày → khi quay lại → nhận reward tương xứng.
KHÔNG phạt, chỉ reward.

```sql
-- Thêm vào bảng users hoặc tạo bảng riêng:
last_active_date   DATE,         -- cập nhật mỗi khi user hoàn thành 1 action
comeback_claimed_at TIMESTAMPTZ  -- tránh claim nhiều lần trong 1 lần quay lại
```

```
Backend:
- ComebackService.checkAndGrant(userId) → ComebackResult | null
  Gọi khi user authenticate thành công (login / token refresh)
  Logic:
    daysSince = today - user.lastActiveDate
    if daysSince < 3 → return null (không làm gì)
    if already claimed today → return null
    
    Tier reward theo daysSince:
      3–6  → xpBonus=50, bonusType="XP_BOOST"
      7–13 → xpBonus=0, bonusType="2X_XP_DAY", xpMultiplierUntil=endOfDay
      14–29 → xpBonus=0, bonusType="2X_XP_DAY", grantFreezeToken=1
             + tạo "Tái Khởi mission set" (5 nhiệm vụ nhẹ riêng)
      30+  → bonusType="STARTER_PACK":
               2× XP 3 ngày + 50 energy + 1 free freeze
               + reset tutorial hints

  Sau khi grant: cập nhật comeback_claimed_at = now()

API mới:
  GET  /api/me/comeback-status
  Response: { daysSinceLastPlay, rewardTier, claimed, reward? }

  POST /api/me/comeback-claim (gọi khi user tap "Nhận thưởng")
  Response: { xpGranted, bonusType, expiresAt?, message }

Frontend:
- Ngay sau login (nếu comeback_status có reward):
  Hiện modal "Chào mừng trở lại, [Name]! 🎉"
  Mô tả reward, button "Nhận ngay"
- Không popup nếu user đã claim rồi trong ngày
- Streak bị reset → KHÔNG hiện "Streak của bạn đã mất"
  → Hiện: "Bắt đầu chuỗi mới! 3 ngày liên tiếp = badge Phục Hồi 🔄"
```

---

## P2 — Làm sau P1 (3–5 ngày)

### P2-A: Tier Cosmetics (Phần thưởng ngoại hình)

**Mục tiêu:** Mỗi tier unlock avatar frame + quiz theme.
Cosmetics là persistent — không mất khi prestige.

```sql
user_cosmetics (
  user_id       UUID PRIMARY KEY REFERENCES users(id),
  unlocked_frames  VARCHAR[]  DEFAULT '{"frame_tier1"}',
  active_frame     VARCHAR    DEFAULT 'frame_tier1',
  unlocked_themes  VARCHAR[]  DEFAULT '{"theme_default"}',
  active_theme     VARCHAR    DEFAULT 'theme_default'
)
```

```
Frame IDs theo tier:
  frame_tier1: "plain_gray"      -- viền xám
  frame_tier2: "sky_blue"        -- viền xanh nhạt
  frame_tier3: "lamp_blue"       -- viền xanh dương
  frame_tier4: "flame_purple"    -- viền tím + flame tip
  frame_tier5: "star_gold"       -- viền vàng + stars
  frame_tier6: "glory_royal"     -- viền vàng đỏ + crown
  
Theme IDs theo tier:
  theme_default, theme_sky, theme_lamp, theme_ember, theme_night, theme_royal

Backend:
- Khi user tier-up → tự động add frame + theme mới vào unlocked arrays
- CosmeticService.unlockForTier(userId, newTierLevel)

API:
  GET   /api/me/cosmetics
  PATCH /api/me/cosmetics { activeFrame, activeTheme }

Frontend:
- Settings > Appearance: grid chọn frame (locked ones hiện khóa + "Đạt T3 để mở")
- Avatar component nhận frameId → render border đúng style
- Quiz screen nhận themeId → apply CSS class tương ứng
```

---

### P2-B: Prestige System (Thăng Hoa)

**Mục tiêu:** User đạt Tier 6 ≥ 30 ngày → được phép prestige.
Reset XP, giữ cosmetics, nhận badge đặc biệt.

```sql
-- Thêm vào users:
prestige_level       INT DEFAULT 0,      -- 0 = chưa prestige
prestige_at          TIMESTAMPTZ[],      -- lịch sử các lần prestige
days_at_tier6        INT DEFAULT 0,      -- tăng mỗi ngày khi ở T6
tier6_reached_at     TIMESTAMPTZ,        -- khi nào lên T6

-- Prestige badges (thêm vào badges table):
  prestige_1: "Vinh Quang Tái Sinh"   -- silver frame
  prestige_2: "Vinh Quang Bất Diệt"  -- gold frame
  prestige_3: "Vinh Quang Đời Đời"   -- rainbow frame
```

```
Backend:
- Cron job hàng ngày: user có tierLevel=6 → days_at_tier6 += 1
- PrestigeService.canPrestige(userId) → bool (tierLevel=6 AND days_at_tier6 >= 30)
- PrestigeService.executePrestige(userId):
  a. Validate canPrestige
  b. prestige_level += 1, prestige_at.append(now())
  c. totalPoints = 0, tierLevel = 1, seasonPoints = 0
  d. days_at_tier6 = 0, tier6_reached_at = null
  e. Grant prestige badge (P1/P2/P3)
  f. Grant prestige cosmetic frame
  g. Reset SRS next_review_at cho tất cả câu (để học lại)
  h. GIỮ NGUYÊN: badges, cosmetics.unlocked*, journeyProgress, groupMembership
  i. Audit log: user.prestige

API:
  GET  /api/me/prestige-status
  Response: {
    canPrestige: bool,
    prestigeLevel: int,       -- 0, 1, 2, 3
    daysAtTier6: int,
    daysRequired: 30,
    nextPrestigeName: string  -- "Vinh Quang Tái Sinh"
  }

  POST /api/me/prestige
  Body: { confirm: true }    -- phải gửi confirm để tránh accident
  Response: { newPrestigeLevel, badgeGranted, message }

Frontend:
- Profile page: hiện "Prestige: P1 🥈" badge cạnh tier name
- Leaderboard: hiện P-badge nhỏ cạnh username (P1/P2/P3)
- Khi canPrestige=true: notification + banner trên profile
  "🏆 Bạn đủ điều kiện Prestige! Bắt đầu hành trình mới?"
- Confirmation dialog kỹ: list rõ "Bạn sẽ mất: XP, Tier level"
  và "Bạn giữ: Badges, Cosmetics, Bible Journey, Groups"
- Sau prestige: full-screen celebration "✨ Vinh Quang Tái Sinh!"
```

---

## Lưu ý chung cho toàn bộ implementation

### Performance
- `GET /api/me/tier-progress` được gọi thường xuyên → cache 30s trong Redis
- Daily missions: cache `daily_mission:{userId}:{date}` → invalidate khi có update
- Prestige status: không cache (dữ liệu nhạy cảm)

### Audit log
Thêm các action sau vào AuditLog:
```
star_achieved      { starIndex, bonusXp }
milestone_hit      { percent: 50|90 }
xp_surge_activated { duration: "2h", multiplier: 1.5 }
mission_completed  { slot, missionType }
mission_bonus      { xp: 50 }
comeback_claimed   { daysSince, bonusType }
cosmetic_changed   { frameId, themeId }
prestige_executed  { fromPrestige, toPrestige }
```

### Test Panel bổ sung (`/admin/test`)
Thêm vào Test Panel (dev/staging only):
```
POST /api/admin/test/users/{userId}/simulate-star-achieved?starIndex=3
POST /api/admin/test/users/{userId}/simulate-milestone?percent=90
POST /api/admin/test/users/{userId}/simulate-comeback?daysSince=30
POST /api/admin/test/users/{userId}/set-prestige?level=1
POST /api/admin/test/users/{userId}/set-days-at-tier6?days=30
```

### Thứ tự thực hiện khuyến nghị
```
Day 1:  P0-A backend (TierProgressService + /api/me/tier-progress)
Day 2:  P0-A frontend (TierProgressBar component + star popup)
Day 3:  P0-B backend (DailyMissionService + schema + tracking hooks)
Day 4:  P0-B frontend (Mission card + progress UI)
Day 5:  P1-A (Milestone Burst — backend + frontend)
Day 6:  P1-B (Comeback Bridge — backend + frontend)
Day 7:  Test Panel additions + integration testing
Day 8+: P2-A (Cosmetics) → P2-B (Prestige)
```

### Định nghĩa "Done" cho mỗi feature
- [ ] Unit tests cho service logic (đặc biệt boundary conditions của star/tier)
- [ ] API trả đúng shape như spec ở trên
- [ ] Test Panel có thể trigger từng feature thủ công
- [ ] Không có breaking change cho client cũ (dùng `?` optional fields)
- [ ] Audit log ghi đầy đủ

---

*Hỏi trước khi code nếu codebase có kiến trúc khác với giả định trên.*
