# 2026-05-20 — Mobile RankedScreen redesign → web parity (Sacred Modernist v2)

> **Source**: user request — "redesign màn này như bản web".
> **Scope**: rewrite `apps/mobile/src/screens/quiz/RankedScreen.tsx` toàn bộ UI (giữ nguyên handleStart logic + data hooks). ~280 LOC.

## Trước/Sau

**Trước** (simple): title plain + tier card (icon + name + XP + progress bar + next tier text) + 3 generic info rows (Năng lượng / Độ khó / XP nhân tier) + Button `Vào Thi Đấu`.

**Sau** (web parity): 5 sections theo `apps/web/src/pages/Ranked.tsx` + components/ranked/*.

## 5 sections mới

1. **RankedHeader** — title 2-tone "Thi Đấu [gold]Xếp Hạng[/]" 28px black + subtitle "Leo tier, vào BXH mùa, nhận Vinh Quang"

2. **TierProgressCard** (port `TierProgressCard.tsx`):
   - Tier badge: icon trong rounded colored circle (15% gold alpha bg + 30% border)
   - 5-star sub-tier indicator (★ filled gold cho i < starInfo.starIndex, faded cho rest; skip max tier 6)
   - "ĐÍCH TIẾP THEO" eyebrow + next tier name italic gold + "Còn N XP" caption
   - Linear progress bar 9px gold với glow shadow
   - Footer "X XP / Y XP"

3. **Stats composite card** (port `Ranked.tsx:145-279`):
   - Energy section (primary): "NĂNG LƯỢNG" label + big gold number `{energy}` + `/{max}` + thin bar (4px) + status chip ("✓ N câu từ năng lượng" green | "⚠ Hết năng lượng" red | "⚠ Đã đạt giới hạn" red)
   - Divider 1px
   - 3 mini stats row: Streak (🔥 + number) / Câu hôm nay (📝 + `{counted}/{cap}`) / Điểm hôm nay (🏆 + pointsToday)

4. **SeasonCard** (conditional render khi `season.active === true`, port `SeasonCard.tsx`):
   - Trophy icon + season name 18px black
   - "×1.5 XP bonus" chip
   - Italic quote "Top 3 mỗi tier nhận [gold]Vinh Quang {season}[/]"
   - 2 sub-stats grid: `#{seasonRank}` HẠNG MÙA + `{seasonPoints}` ĐIỂM MÙA (chỉ render khi BE trả về)

5. **Fixed bottom CTA footer** (port `RankedActionFooter.tsx`):
   - `position: absolute bottom` với background semi-opaque + gold border-top
   - Button states (web parity caption states):
     - `canPlay` → "Vào Thi Đấu" + caption "10 câu · trừ 5 năng lượng / sai"
     - `isOutOfEnergy` → "Hết năng lượng" (gray disabled) + caption "Chờ năng lượng phục hồi (+20/giờ)"
     - `capReached` → "Đã đạt giới hạn hôm nay" (gray disabled) + caption "Quay lại ngày mai để chơi tiếp"
   - Spacer 100px ở cuối ScrollView để content không bị che bởi fixed footer

## Data hooks (parity)

- `['me']` → currentStreak
- `['tier-progress']` → totalPoints
- `['ranked-status']` → energy + cap + pointsToday + seasonRank + seasonPoints (NEW: was not queried trước)
- `['season', 'active']` → season info (NEW)

### Tasks

- M7-1 Rewrite RankedScreen full layout web parity
  - Status: [x] DONE (tsc clean + 33 jest pass)
  - Files: `apps/mobile/src/screens/quiz/RankedScreen.tsx`
  - **Spec impact**: [x] None (UI redesign, không thay đổi behavior)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

## Out of scope

- Live countdown timer (HH:MM:SS đến energy reset) — web có, mobile defer vì add complexity nhỏ + cần useEffect interval. Replace bằng static caption "Chờ năng lượng phục hồi (+20/giờ)".
- Material Symbols icons (FILL=1 variant) → mobile dùng emoji (⚡🏆🔥📝★) cho cross-platform simplicity.
- Backdrop blur + radial gold accents → defer (RN không hỗ trợ backdrop-filter trên Android stable).
- Animations (transition-[width] duration-700) — RN cần useNativeDriver: false cho width, defer.
- Practice mode hint card / Stats divider → defer pending user feedback.
