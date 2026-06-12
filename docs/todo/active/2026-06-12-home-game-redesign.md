# 2026-06-12 — Redesign trang chủ theo "Game vibe" (HGR)

> **Mục tiêu**: Làm lại Home theo tinh thần **trẻ trung – vui nhộn – cuốn hút – mang tính game**, vẫn giữ nét
> tôn nghiêm của app Kinh Thánh (gold + câu Kinh Thánh làm neo). Đã chốt qua nhiều vòng QA với chủ dự án.
> **Branch**: `redesign/home-game-vibe` (KHÔNG push remote cho tới khi review xong).
> **Trạng thái**: TODO — spec đã chốt, chưa promote vào Home thật.

### Code prefix: `HGR`

---

## 0. SPEC SỐNG — xem trước khi làm bất cứ gì
- **Mockup chạy thật trong app**: route `/home-game-preview` → component `apps/web/src/pages/HomeGameMock.tsx`
  (self-contained, CSS scoped `.hgm`, data tĩnh, KHÔNG đụng token/app thật). Chạy `pnpm --filter biblequiz-web dev` rồi mở route.
- **Mockup tĩnh + ảnh tham chiếu**: `docs/designs/home-game/home-game-mock-v2.html` (+ `.png`).
- `HomeGameMock.tsx` là **nguồn sự thật về visual** (màu/khoảng cách/animation/cấu trúc). Khi promote, copy giá trị từ đó.

## 1. Bảng màu + font (đề xuất thành design token)
> Token đổi = ảnh hưởng TOÀN app, không chỉ Home. Làm thận trọng: thêm token MỚI (additive) cho accent,
> giữ gold làm brand, rồi áp dần. KIỂM TRA các trang khác (Quiz/Ranked/Group…) không vỡ.

| Vai trò | Giá trị | Ghi chú |
|---|---|---|
| bg nền | `#0a0b16` | tối hơn, hơi ngả indigo |
| surface / surface2 | `#1b1f36` / `#232845` | card nền gradient 2 tông `linear-gradient(180deg,#222540,#181b2e)` |
| gold / gold2 | `#ffb52e` / `#ffd76a` | brand — giữ cho CTA + daily |
| violet / violet2 | `#8b5cff` / `#c3b0ff` | accent năng động chính (hero, XP) |
| cyan | `#21d4ff` | Phòng Chơi, năng lượng |
| pink / orange / green | `#ff5ca8` / `#ff8a3d` / `#36e2a0` | accent phụ (stat icon, progress) |
| ink / dim | `#f6f5fe` / `#c2c2e0` | `dim` PHẢI đạt AA (≥4.5:1) trên nền tối |
| **Font display** | **Lexend** (400–800) | thêm vào `index.html` / font setup chính thức; body có thể giữ Be Vietnam Pro hoặc dùng Lexend |

## 2. Information Architecture (ĐÃ CHỐT)
**Home chỉ còn các trục cốt lõi** — bỏ phần "gia vị":
- ✅ Giữ: Hero (profile/XP/3 stat) · Daily Challenge · Nhiệm vụ hôm nay · **3 card chế độ** · Leaderboard sidebar.
- ✅ **"Chế độ chơi chính" = 3 card ngang**: Luyện Tập (tím) · Đấu Hạng (cam-hồng) · **Phòng Chơi (xanh)**.
  Màn hẹp → 2 trên + 1 full-width dưới (giữ gradient); rất hẹp → xếp dọc.
- ❌ **BỎ khỏi Home**: section "Chế độ đa dạng" (Vòng Tốc Độ / Chế Độ Bí Ẩn / Chủ Đề Tuần), **Giải Đấu**, **Nhóm Giáo Xứ** (đã có ở sidebar). Bỏ luôn section header "Chơi cùng nhau" riêng.
- ✅ **Sidebar thêm mục "Phòng Chơi"** (ngang hàng Nhóm) → multiplayer có 2 đường vào (card Home + sidebar).
> Lưu ý phạm vi: chỉ **bỏ khỏi GIAO DIỆN Home**. Xóa hẳn các mode/route/BE là việc riêng, lớn hơn — KHÔNG làm trong task này.

## 3. Việc theo component (Home thật)
- [ ] **HGR-1 Tokens + font**: thêm palette §1 vào `tailwind.config`/global + nạp Lexend chính thức. Verify trang khác không vỡ màu.
- [ ] **HGR-2 HomeBanner (hero)**: avatar bo-vuông gradient + badge **"LV.X"** NGẮN (chỉ level, KHÔNG nhồi tên tier — xem bug §5); tier name "X → Y" ở hàng dưới tên; XP bar (xem HGR-3); 3 stat box **thống nhất** (cùng container, khác icon Material + màu accent chip): 🔥 Streak / ⚡ Năng lượng / 🏅 Điểm mùa.
- [ ] **HGR-3 XP bar**: **track TỐI `#2a2a3e`** + **fill SÁNG** (gradient `#7c5cff→#a78bfa`) + glow + **cap trắng** đầu fill. Nguyên tắc: đọc % trong <1s, contrast fill/track ≥3:1. (Đừng làm track sáng — fill nhạt sẽ blend, lỗi đã gặp.)
- [ ] **HGR-4 Daily card**: phải NỔI BẬT hơn mọi card (hook retention). Dùng **nền ấm gold-tối** (`linear-gradient(135deg,#2b2417,#1b1810)` + ánh vàng radial) — khác hẳn tông lạnh; + viền vàng + glow vàng + thanh accent trái + tag "⚡ ƯU TIÊN HÔM NAY". (Chỉ nút vàng là KHÔNG đủ.)
- [ ] **HGR-5 Nhiệm vụ hôm nay**: card tối trung tính, mỗi dòng có icon + thanh tiến độ nhiều màu. Giữ thấp hơn Daily về hierarchy.
- [ ] **HGR-6 3 card chế độ**: cấu trúc chung `mhead (icon+title+1 dòng) + mfoot (preview panel + CTA)`.
  - Luyện Tập (gradient tím): preview = "Đang học dở · <sách> · X/Y câu" + thanh tiến độ; CTA "Tiếp tục →".
  - Đấu Hạng (gradient cam-hồng): preview = "N người đang thi đấu" + avatar stack + "Hạng của bạn #k"; CTA "Vào trận →".
  - Phòng Chơi (gradient xanh `#22b8ff→#3a5bf0`): preview = "N phòng đang mở" + avatar đang chơi; CTA "Vào phòng →".
  - **Inner preview panel: nền TỐI đậm** (`rgba(8,9,18,.5)`) để text trắng đọc tốt trên MỌI màu card (bug §5).
  - **Avatar stack TRUNG TÍNH**: nền tối + viền trắng (đừng để avatar tím trên card cam → lạc tông).
- [ ] **HGR-7 Sidebar**: thêm mục "Phòng Chơi" (icon `stadia_controller`); widget **"Top điểm tuần"** (top 3, huy hiệu vàng/bạc/đồng, avatar, badge "Bạn", "Xem bảng đầy đủ →"). "Hạng tuần của bạn #k / tổng" — **phân biệt rõ với "Điểm mùa"** ở header (2 metric khác nhau phải tự label được).
- [ ] **HGR-8 Wiring data thật** (xem §4) — một phần cần BE.
- [ ] **HGR-9 Dọn dẹp**: xóa route `/home-game-preview` + `HomeGameMock.tsx` + section đã bỏ trong Home cũ; cập nhật i18n; chạy test.

## 4. Data wiring — CHÚ Ý có việc BE
| Chỗ | Nguồn | Trạng thái |
|---|---|---|
| Hero XP/tier/streak/năng lượng | `/api/me`, `/api/me/tier-progress`, `/api/me/ranked-status` | ✅ đã có |
| Daily card | `/api/daily-challenge` | ✅ đã có |
| Nhiệm vụ | DailyMissions hiện có | ✅ đã có |
| Leaderboard "Top tuần" + hạng tuần | `/api/leaderboard/weekly` | ✅ đã có (cần lấy top 3 + rank của mình) |
| **Luyện Tập "đang học dở"** (sách + tiến độ) | `UserBookProgress`/lịch sử practice | ⚠️ cần kiểm tra có field sẵn không, có thể thêm endpoint nhỏ |
| **Đấu Hạng "N đang thi đấu"** | — | ⚠️ **CHƯA CÓ** đếm online realtime; cần endpoint nhẹ (vd đếm user có ranked-activity trong X phút) hoặc xấp xỉ |
| **Phòng Chơi "N phòng đang mở / người đang chơi"** | `GET /api/rooms/public` (đếm) + đếm player | ⚠️ phần "đang chơi" cần đếm; phòng mở thì list đã có |
> Nếu số online chưa làm kịp: dùng số "thực tế gần đúng" có sẵn (vd số phòng public đang mở) thay vì số giả; KHÔNG hard-code số đẹp lên prod.

## 5. ⚠️ BÀI HỌC QA — đừng lặp lại (đều là lỗi đã gặp & sửa trong mock)
1. **Badge level absolute + text dài → vỡ layout** (tràn mép, đè avatar, che chữ). → Badge chỉ chứa text NGẮN ("LV.12"); nội dung dài đặt trong luồng bình thường.
2. **XP bar track sáng + fill nhạt = blend, không đọc được.** → track tối + fill sáng + cap. So sánh chuẩn: mission bar (đọc tức thì).
3. **Text wrap không kiểm soát** ("Ngũ Tuần 2026" rớt dòng). → rút gọn ("’26") / giảm size / `white-space:nowrap`+ellipsis. Test với chuỗi i18n thật (tiếng Việt dài).
4. **Panel mờ trên card sáng** (Đấu Hạng cam) khó đọc. → inner panel nền tối đậm, text trắng; tránh cặp màu đánh nhau (tím trên cam).
5. **Avatar/element màu cố định trên card đổi màu** → dùng trung tính (nền tối + viền trắng) để hợp mọi nền.
6. **Mọi element phải tự giải thích** hoặc bỏ. 2 metric khác nhau (điểm tuần vs điểm mùa) phải có label rõ.
7. **Decor trôi nổi vô nghĩa** (sparkle ngẫu nhiên) → bỏ hoặc làm pattern nhất quán.
8. **Hierarchy**: Daily > Nhiệm vụ về độ nổi bật (Daily là hook chính).
9. **Font tiếng Việt**: display font PHẢI hỗ trợ đầy đủ dấu (ữ/ậ/ạ…). Lexend đạt; KHÔNG dùng font thiếu dấu (vd Space Grotesk) → lệch glyph.
10. **Accessibility**: text phụ màu xám chạy qua contrast checker (WCAG AA 4.5:1 body); UI component (progress) ≥3:1.

## 6. Invariants (không được phá khi promote)
- Token "Sacred Modernist" hiện hành: thêm/mở rộng, đừng phá các trang khác. Verify Quiz/Ranked/Group/Profile sau khi đổi token.
- i18n: mọi chuỗi mới có cả `vi` + `en`. Mock đang hard-code tiếng Việt → khi promote phải i18n hóa.
- Giữ `data-testid` mà test/e2e đang dùng; thêm mới cho element mới.
- KHÔNG đổi luồng API/auth/route hiện có (ngoài việc thêm route/sidebar "Phòng Chơi" + xóa section đã chốt).
- Mỗi HGR-n: commit nhỏ, vitest pass trước commit, commit message tiếng Anh.

## 7. Thứ tự đề xuất
HGR-1 (token+font) → HGR-2/3 (hero+XP) → HGR-4/5 (daily+missions) → HGR-6 (3 card) → HGR-7 (sidebar) → HGR-8 (data, gồm việc BE) → HGR-9 (dọn preview + xóa section + test).

### Liên kết
- Live preview: `/home-game-preview` · Component spec: `apps/web/src/pages/HomeGameMock.tsx`
- Mockup tĩnh: `docs/designs/home-game/home-game-mock-v2.html` (+ ảnh các vòng QA)
- Home hiện tại: `apps/web/src/pages/Home.tsx` + `components/{HomeBanner,FeaturedDailyCard,CompactCard,RankedStandardCard,DailyMissionsCard,BibleJourneyCard,SectionHeader}`
