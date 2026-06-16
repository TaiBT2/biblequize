# 2026-06-12 — Redesign trang chủ "Khung Sáng" (HGR)

> **Mục tiêu**: Làm lại Home theo concept **"Khung Sáng" (ánh sáng xuyên kính màu / light through stained glass)** —
> nền sáng gallery, card trắng, **bóng khúc xạ có màu**, **phổ sapphire→emerald→amber→ruby** làm chữ ký, **đèn/ngọn lửa**
> làm biểu tượng tiến trình, **vòm giếng trời** ôm câu Kinh Thánh. Vẫn giữ nét tôn nghiêm (câu Kinh Thánh = focal point).
> **Branch**: `redesign/home-game-vibe` (KHÔNG push remote cho tới khi review xong).
> **Trạng thái**: TODO — spec "Khung Sáng" đã chốt mockup, chưa promote vào Home thật.

### Code prefix: `HGR`

> ⚠️ **PIVOT 2026-06-14**: design đổi từ **"Game vibe" (nền tối indigo + tím/cyan, font Lexend)** → **"Khung Sáng"
> (nền sáng + phổ khúc xạ, font Bricolage Grotesque + Literata)**. Mock dark cũ (`HomeGameMock.tsx` + `home-game-mock-v2.html`)
> **ĐÃ SUPERSEDED** — KHÔNG dùng làm nguồn nữa. Mọi giá trị visual lấy từ bộ "Khung Sáng" §0.

---

## 0. NGUỒN SỰ THẬT — xem trước khi làm bất cứ gì
Thư mục `docs/designs/home-game vibe/` (⚠️ tên folder có dấu cách):
- **Mockup HTML chạy thật**: `biblequiz-home-khungsang (1).html` — mở trực tiếp bằng browser. **Nguồn sự thật về visual** (màu/bóng/shape/animation/cấu trúc DOM). Khi promote, copy giá trị từ đây.
- **Design spec**: `biblequiz-khungsang-spec.md` — nguyên tắc nhận diện, bản đồ component, props TypeScript mẫu (`ModeCard`/`QuestRow`/`XpSpectrumBar`/`VersePane`), data shape, checklist QA.
- **Tokens**: `biblequiz-tokens.css` — Layer 1 primitives + Layer 2 semantic (`--bq-*`), atmosphere `.bq-lightwell`, motion-safety, season-theming hook.
- **Tailwind extend**: `biblequiz-tailwind.config.js` — `theme.extend` (colors `bq.*`, fonts, shadows khúc xạ, animations `flick`/`shimmer`) để merge vào config hiện có.

## 1. 4 nguyên tắc nhận diện (giữ đúng = ra "BibleQuiz")
1. **Ánh sáng xuyên kính** — nền sáng, card trắng, mỗi khối phát **quầng/bóng CÓ MÀU** (không bóng xám). Bóng màu = nắng xuyên kính.
2. **Phổ khúc xạ** (`--bq-spectrum`: sapphire `#2D46C8` → emerald `#0E8A6B` → amber `#F59E0B` → ruby `#E0354B`) lặp ở: gạch chân tên, đỉnh card (5px), thanh XP, bệ giếng trời, logo. Chữ ký — KHÔNG thay bằng gradient ngẫu nhiên.
3. **Đèn / ngọn lửa** — biểu tượng tiến trình (streak, verse mark, quest). Cùng họ ấm; **KHÔNG dùng đỏ làm "đang làm"** (đỏ = lỗi).
4. **Vòm giếng trời** — câu Kinh Thánh trong khối đỉnh bo vòm (`border-radius:240px 240px 0 0/180px 180px 0 0`), focal point tĩnh lặng. Mode card lặp vòm nhẹ (`64px 64px 22px 22px/30px 30px 22px 22px`).

> Kỷ luật màu: **mỗi component 1 màu jewel chủ đạo**. Spectrum chỉ cho "đường/cạnh", không tô kín mảng lớn.

### Bảng token cốt lõi (từ `biblequiz-tokens.css`)
| Vai trò | Giá trị |
|---|---|
| paper / paper-sunk / white / hairline | `#FBFAF5` / `#F2F0E7` / `#FFFFFF` / `#E7E4DA` |
| ink / ink-soft / ink-faint | `#16151B` / `#6C6A62` / `#A8A69C` |
| sapphire / emerald / amber / amber-deep / ruby / ember | `#2D46C8` / `#0E8A6B` / `#F59E0B` / `#D97F06` / `#E0354B` / `#FF6F3D` |
| action (CTA) | `linear-gradient(135deg,#FF9D2E,#FF5A45 55%,#E0354B)` |
| **Fonts** | display **Bricolage Grotesque** · body **Be Vietnam Pro** · verse **Literata** |

## 2. Information Architecture (theo mockup)
Layout **1 cột giữa** (`max-width:1180px`) + **TopNav sticky ngang** (KHÔNG sidebar):
- **TopNav**: logo (mark phổ khúc xạ) · nav (Trang chủ/Xếp hạng/Nhóm/Phòng Chơi/Cá nhân) · **3 stat** (🔴 Streak / 🟡 NL / 🟢 Mùa) · avatar.
- **Hero**: eyebrow (chào + ngày) · "Sẵn sàng chưa, **\<tên\>**?" (tên gạch chân phổ shimmer) · LV chip + "Tier → NextTier" + "Hạng tuần #k / N người" · **XP spectrum bar 10 ô** (ô đầy sáng dần theo phổ, ô đang nhen amber) + caption "x / max XP · còn N đến \<tier\>".
- **Verse Lightwell**: vòm giếng trời + ngọn lửa giữa (flicker) + câu gốc (Literata) + ref; **bệ phổ (`.sill`)** đổ bóng màu; dòng dẫn dắt bên dưới.
- **Daily** (section idx 1, amber): card glow ấm + badge "ƯU TIÊN HÔM NAY" + tiêu đề + chips (5 câu/~3 phút/cộng đồng) + timer + CTA "Chơi ngay +50 XP".
- **Quests + Leaderboard** (section idx 2, ruby) — grid `1.6fr 1fr`: trái = 3 quest (đèn theo trạng thái done/prog/todo), phải = "Top điểm tuần" (top 3, row "me" highlight amber, foot "Mùa …").
- **3 Mode card** (section idx 3, sapphire): Luyện Tập (sapphire, "HỌC MỘT MÌNH", CTA "Tiếp tục") · Đấu Hạng (ruby, "THI ĐẤU", CTA "Vào trận") · Phòng Chơi (emerald, "CÙNG NHAU", CTA "Tìm phòng"). Mỗi card: vòm + đỉnh 5px gradient + bóng màu jewel + inner panel + avatar stack.
- Responsive `<980px`: cols → 1 cột, modes → 1 cột, nav ẩn, verse giảm padding + font 21px.

> ❌ **BỎ khỏi Home** (giữ nguyên quyết định cũ): section "Chế độ đa dạng", "Giải Đấu", "Nhóm Giáo Xứ" (đã có route riêng). Chỉ bỏ khỏi **giao diện Home** — KHÔNG xóa mode/route/BE.

## 3. Tasks theo component
- [ ] **HGR-1 Tokens + fonts**: copy `biblequiz-tokens.css` → `apps/web/src/styles/tokens.css`, `import` ở `main.tsx`; merge `theme.extend` (`bq.*` colors, fonts display/verse, shadows khúc xạ, anim `flick`/`shimmer`) vào `tailwind.config.js`; thêm 2 class `.bq-arch-card`/`.bq-arch-well`; nạp 3 font (Bricolage Grotesque + Literata; Be Vietnam Pro đã có) vào `index.html`. **Verify trang khác KHÔNG vỡ** (token mới namespaced `bq-*`/`--bq-*`, additive). ⚠️ Xem rủi ro CSS-var §5.
- [x] **HGR-2 Live preview route** `/home-khung-sang-preview` → `HomeKhungSangMock.tsx` — DONE (build ✓). Port trung thực HTML mockup, CSS scoped `.hks`, data tĩnh. Mở `localhost:5173/home-khung-sang-preview` để duyệt visual trước khi promote.
- [ ] **HGR-3 AppShell / lightwell**: wrapper `.bq-lightwell` (godray + grain, `position:fixed; z-index:0; pointer-events:none`). **Quyết định nav**: Home dùng TopNav mới hay giữ `AppLayout` hiện có? → khảo sát `layouts/AppLayout.tsx` (file nhạy cảm) rồi chốt ở §6.
- [ ] **HGR-4 HeroGreeting**: tên + gạch phổ shimmer + LV chip NGẮN + "tier → nextTier" + "Hạng tuần #k / N". Test chuỗi VN dài (tier name) không vỡ.
- [ ] **HGR-5 XpSpectrumBar**: 10 ô, ô đầy lấy lát spectrum (`background-position` dịch), ô đang nhen amber. Đọc % <1s, contrast ≥3:1 (props `value/max/segments` — xem spec §3.3).
- [ ] **HGR-6 VersePane**: vòm `bq-arch-well` + ngọn lửa flicker + Literata + ref + bệ phổ `.sill` bóng màu (spec §3.4). Mobile: padding + font 21px.
- [ ] **HGR-7 DailyChallenge**: card glow ấm + badge + chips + timer + CTA gradient `--bq-action` (spec §3.5). NỔI BẬT nhất (hook retention) > Nhiệm vụ.
- [ ] **HGR-8 QuestList/QuestRow**: đèn 3 trạng thái (done/progress/todo) — **KHÔNG đỏ**; bar nhiều màu ấm; số/✓. `statusOf(v,t)` ở util không nhúng JSX (spec §3.2). 3 tín hiệu (đèn+nhãn+bar) cho mù màu.
- [ ] **HGR-9 Leaderboard "Top điểm tuần"**: top 3 + row "me" highlight amber + foot "Mùa \<X\> · còn N ngày". Phân biệt rõ "điểm tuần" vs "điểm mùa".
- [ ] **HGR-10 ModeCard ×3**: 1 component `variant: 'study'|'ranked'|'rooms'` (spec §3.1) — accent/edge/shadow/tag/CTA theo variant; vòm + inner panel + avatar stack trung tính (viền trắng).
- [ ] **HGR-11 Wiring data thật** (xem §4) — một phần cần BE.
- [ ] **HGR-12 Dọn dẹp**: xóa route preview + `HomeKhungSangMock.tsx` + **mock dark cũ** (`HomeGameMock.tsx` + route `/home-game-preview`) + section đã bỏ trong Home cũ; i18n hóa; chạy test.

## 4. Data wiring — CHÚ Ý có việc BE
| Chỗ | Nguồn | Trạng thái |
|---|---|---|
| Hero XP/tier/streak/năng lượng/điểm mùa | `/api/me`, `/api/me/tier-progress`, `/api/me/ranked-status` | ✅ đã có |
| Hạng tuần (#k / N) + Top 3 tuần | `/api/leaderboard/weekly` | ✅ đã có (lấy top 3 + rank của mình + tổng N) |
| Verse "câu gốc hôm nay" (+ keyword `<em>`) | ⚠️ kiểm tra có endpoint verse-of-day chưa; nếu chưa, tĩnh/seed | ⚠️ cần verify |
| Daily card | `/api/daily-challenge` | ✅ đã có |
| Quests (3 nhiệm vụ) | DailyMissions hiện có | ✅ đã có (map `value/target` → status) |
| **Luyện Tập "đang học dở"** (sách + tiến độ) | `UserBookProgress`/lịch sử practice | ⚠️ kiểm tra field, có thể thêm endpoint nhỏ |
| **Đấu Hạng "N đang thi đấu"** | — | ⚠️ CHƯA CÓ đếm online realtime; endpoint nhẹ hoặc xấp xỉ |
| **Phòng Chơi "N phòng / N người"** | `GET /api/rooms/public` (đếm) + đếm player | ⚠️ "đang chơi" cần đếm; phòng mở đã có |
> Số online chưa kịp → dùng số thực gần đúng (vd số phòng public đang mở); KHÔNG hard-code số đẹp lên prod.

## 5. ⚠️ BÀI HỌC QA + RỦI RO — đừng lặp lại
1. **CSS variables vs bug nền trắng**: project memory ghi "CSS variables gây white-background rendering bug" (token Tailwind hardcode hex). Nhưng "Khung Sáng" CỐ Ý dùng `var(--bq-*)` để season-theming. → **Verify kỹ**: design này vốn nền SÁNG nên rủi ro thấp, nhưng phải test render thật (đặc biệt component dùng chung) trước khi mở rộng. Nếu vỡ → cân nhắc hardcode hex cho phần lõi, giữ CSS-var chỉ cho lớp season.
2. **Badge level absolute + text dài → vỡ layout** → LV chip chỉ chứa text NGẮN ("LV.12").
3. **XP bar đọc được <1s**: ô đầy spectrum sáng / ô trống `--bq-paper-sunk` viền hairline — contrast rõ.
4. **Text wrap VN dài** ("Ngũ Tuần 2026" rớt dòng) → rút gọn ("'26") / `nowrap`+ellipsis. Test chuỗi i18n thật.
5. **Avatar/element trên card đổi màu** → trung tính (viền trắng) hợp mọi nền jewel.
6. **Mọi element tự giải thích**: "điểm tuần" vs "điểm mùa" phải label rõ (2 metric khác).
7. **Đèn quest = 3 tín hiệu** (đèn+nhãn+bar) — an toàn mù màu; KHÔNG đỏ làm "đang làm".
8. **Hierarchy**: Daily > Nhiệm vụ về độ nổi bật.
9. **Font VN đủ dấu**: Bricolage Grotesque + Literata + Be Vietnam Pro phải render đủ dấu (ữ/ậ/ạ…) — verify glyph.
10. **A11y**: chữ phụ `--bq-ink-faint` ≥4.5:1; CTA có `:focus-visible` (outline 2px offset); godray/grain `pointer-events:none`.

## 6. Invariants (không được phá khi promote)
- Token "Sacred Modernist" hiện hành: thêm/mở rộng (namespace `bq-*`), đừng phá Quiz/Ranked/Group/Profile. Verify sau khi merge tokens.
- **Nav decision** (HGR-3): chốt rõ Home dùng TopNav "Khung Sáng" hay giữ `AppLayout`; nếu đổi shell của Home → ghi `DECISIONS.md`, KHÔNG đụng shell các trang khác.
- i18n: mọi chuỗi mới có cả `vi` + `en`. Mock hard-code tiếng Việt → promote phải i18n hóa.
- Giữ `data-testid` test/e2e đang dùng; thêm mới cho element mới.
- KHÔNG đổi luồng API/auth/route hiện có (ngoài thêm route preview + xóa section đã chốt).
- Mỗi HGR-n: commit nhỏ < 100 LOC, vitest pass trước commit, commit message tiếng Anh.

## 7. Thứ tự đề xuất
HGR-1 (tokens+fonts) → HGR-2 (live preview để duyệt) → HGR-3 (shell/nav decision) → HGR-4/5 (hero+XP) → HGR-6 (verse) → HGR-7 (daily) → HGR-8/9 (quests+leaderboard) → HGR-10 (3 mode card) → HGR-11 (data, gồm BE) → HGR-12 (dọn preview + xóa mock dark + section + test).

### Liên kết
- Mockup "Khung Sáng": `docs/designs/home-game vibe/biblequiz-home-khungsang (1).html` + `biblequiz-khungsang-spec.md` + `biblequiz-tokens.css` + `biblequiz-tailwind.config.js`
- Home hiện tại: `apps/web/src/pages/Home.tsx` + `components/{HomeBanner,FeaturedDailyCard,CompactCard,RankedStandardCard,DailyMissionsCard,BibleJourneyCard,SectionHeader}`
- ~~Mock dark cũ (SUPERSEDED)~~: `apps/web/src/pages/HomeGameMock.tsx` + `docs/designs/home-game/home-game-mock-v2.html`
