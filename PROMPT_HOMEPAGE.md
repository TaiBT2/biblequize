# Prompt cho Claude Code — BibleQuiz Homepage

---

## Context & Stack

Tôi đang xây dựng app **BibleQuiz** — game quiz Kinh Thánh nhiều người chơi realtime, stack: React (Vite + TypeScript) + Tailwind CSS, routing bằng React Router v6. Hãy tạo file `src/pages/HomePage.tsx`.

---

## Design System — PHẢI tuân thủ chính xác

### Màu sắc (dùng CSS variables hoặc Tailwind arbitrary values)
```
--bg:     #0A0A0E   (background chính)
--bg2:    #111118   (background thứ cấp)
--card:   #16161F   (card surface)
--gold:   #D4A843   (accent chính)
--gold2:  #F5C842   (accent sáng hơn)
--lime:   #B8F55A   (success / highlight)
--coral:  #FF6B5B   (error / danger / timer)
--text:   #F0E8D0   (text chính)
--muted:  #6B6355   (text phụ)
```

### Typography
- **Heading** (h1, h2, tên chế độ, số lớn): font `Syne`, weight 800, letter-spacing tight (`-0.03em`)
- **Body** (mô tả, paragraph, nav): font `Nunito`, weight 400–700
- Import từ Google Fonts: `Syne:wght@400;700;800` + `Nunito:wght@400;500;600;700;800`

### Border radius: 6–12px cho card. 100px cho pill/badge. 8px cho button.
### Transition chủ đạo: `cubic-bezier(0.34, 1.56, 0.64, 1)` — có độ "nảy" nhẹ.

---

## Sections — thứ tự từ trên xuống

---

### 1. `<Nav>` — Fixed top

- Logo trái: icon ✝ (rotated -5deg, rotate về +5deg khi hover) + chữ "BibleQuiz", font Syne 800, màu `--gold2`
- Links giữa/phải: "Chế độ", "Rank"
- CTA button phải: "Chơi ngay" — background `--gold`, màu text `#0A0A0E`, font Nunito 800
- Background: `rgba(10,10,14,0.85)` + `backdrop-filter: blur(12px)`
- Border bottom: `1px solid rgba(212,168,67,0.08)`
- Height: 64px

---

### 2. `<HeroSection>` — 2 cột, min-height 100vh

**Cột trái (text)**

Thứ tự từ trên xuống:

1. **Badge "live"**: pill nhỏ màu lime (`rgba(184,245,90,0.1)` bg, border lime), text: `🔥 2,847 người đang online ngay lúc này`, chữ 0.75rem uppercase tracking wide. Icon lửa wiggle animation.

2. **H1** — 3 dòng riêng biệt:
   - Dòng 1: `"Kinh Thánh."` — màu `#ffffff`
   - Dòng 2: `"Thời gian thực."` — màu `--gold2`, có underline animation từ scaleX(0) → scaleX(1) delay 0.8s
   - Dòng 3 (nhỏ hơn, ~0.55em): `"Không phải giờ học giáo lý đâu nhé."` — màu `--muted`, font-weight 600

3. **Subtext**: `"Thi đua câu hỏi Kinh Thánh với hàng nghìn người — Battle Royale, Speed Race, 1v1 Sudden Death. Học thật sự, cạnh tranh thật sự."` — màu `rgba(240,232,208,0.6)`

4. **Buttons row**:
   - Primary: `"Bắt đầu — miễn phí ↗"` — bg `--gold`, text dark, hover scale + `translateY(-3px)`, có shimmer effect (`::after` skew slide)
   - Ghost: `"Xem chế độ chơi"` — border `rgba(240,232,208,0.15)`, hover border sang `--gold`

5. **Social proof**: 5 avatar tròn overlap (margin-left: -8px mỗi cái) + text `"31,240 người đã tham gia / Câu hỏi mới mỗi ngày · 66 sách Kinh Thánh"`
   - Avatar colors: tím, xanh lá, cam, xanh dương, hồng — initials TH/MK/LP/HN/QL

**Background effect cột trái**: chữ "BIBLE" font Syne 800, cỡ 22vw, màu `rgba(212,168,67,0.03)`, position absolute centered, rotate -8deg, pointer-events none.

**Cột phải — Demo Card tương tác**

Card `background: --card`, border `rgba(212,168,67,0.2)`, border-radius 16px, padding 1.75rem.

Top bar của card:
- `border-top: 2px solid` gradient `--gold → --gold2 → --lime`
- Float badge trên card: `"🔴 LIVE · Battle Royale"` — pill background `--lime`, text dark, position absolute top: -14px, animation float up/down

Nội dung card (quiz demo):
- **Header row**: text mode `"• Câu 12 / 20 · 43 người còn lại"` (dot pulse lime) + timer countdown `8s → 0s` loop với progress bar màu `--coral`
- **Badge verse**: `"Sáng thế ký 7:1–4"` — pill nhỏ màu gold
- **Câu hỏi**: `"Đức Chúa Trời bảo Nô-ê đưa bao nhiêu đôi thú sạch vào tàu?"`
- **4 đáp án** (A/B/C/D), mỗi đáp án là một row: key badge + text, hover `translateX(4px)`
  - A: "Một đôi" (sai)
  - B: "Hai đôi" (sai)
  - C: "Bảy đôi" **(đúng)**
  - D: "Mười đôi" (sai)
- **Click interaction**: click sai → `shake` animation + highlight đỏ coral. Click đúng → `scale pop` animation + highlight xanh lime. Reset sau 3.2s. Disable click sau khi đã chọn.
- **Footer card**: `"👥 43 người còn lại"` + `"🔥 Streak ×7"`

**Float badge bên ngoài card** (position absolute right: -20px, top: 30%): `"+150 / Speed bonus!"` — card nhỏ màu `--card`, border gold, font Syne, animation float + rotate(2deg).

---

### 3. `<TickerBanner>` — Full width

- Background: `--gold`, padding 0.5rem
- Chạy marquee vô tận (animation ticker 25s linear infinite)
- Content: `Battle Royale ✦ Speed Race ✦ Team vs Team ✦ Sudden Death 1v1 ✦ Leo Rank hàng ngày ✦ Luyện tập tự do ✦ 66 sách Kinh Thánh ✦ 8,500+ câu hỏi ✦` (lặp lại 2 lần để loop mượt)
- Font Syne 700, text `#0A0A0E`, uppercase, tracking wide
- Dấu `✦` màu `rgba(10,10,14,0.3)`

---

### 4. `<ModesSection>` id="modes" — Background `--bg2`

**Header**:
- Eyebrow: `// Chế độ chơi` — gold, uppercase, tracking
- H2: `"Chọn cách bạn muốn thống trị."` — Syne 800
- Sub: `"Solo, đội nhóm, hay một mình đấu cả phòng — BibleQuiz có đủ."`

**Row 1 — 2 card Solo (grid 1fr 1fr)**

**Card Luyện Tập** (accent tím `#9B59B6`):
- Top accent bar: gradient tím
- Icon 📖 trong box tím nhạt
- Title: `"Luyện Tập"` Syne 800
- Desc: `"Không áp lực, không giới hạn. Tự chọn sách, độ khó, số câu. Lý tưởng cho người mới bắt đầu hoặc ôn lại trước khi leo rank."`
- Feature list (4 items, dot tím trước mỗi item):
  - Chọn bất kỳ sách nào trong 66 sách
  - Xem giải thích sau mỗi câu
  - Lưu câu sai để ôn lại
  - Không ảnh hưởng điểm rank
- Badge pill cuối: `"✨ Bắt đầu ở đây"` — tím nhạt

**Card Leo Rank** (accent cam `#E67E22`):
- Top accent bar: gradient cam
- Icon 🏆 trong box cam nhạt
- Title: `"Leo Rank"` Syne 800
- Desc: `"Hành trình có hệ thống từ Genesis đến Revelation. Mỗi ngày 50 câu, 10 mạng — sai là mất mạng, hết mạng là hết ngày."`
- **Lives row**: 10 chấm tròn — 7 đỏ `#FF6B5B` + 3 xám `rgba(255,107,91,0.15)` + label `"7/10 mạng còn lại"`
- **Progress bar**: label `"Genesis 12" + "23 / 50 câu hôm nay"` + bar height 5px, fill 46% màu cam
- Feature list (3 items, dot cam):
  - Genesis → Revelation theo thứ tự
  - Câu khó dần sau khi hoàn thành toàn bộ
  - Reset lúc nửa đêm mỗi ngày
- Badge pill cuối: `"🔥 Tính điểm xếp hạng"` — cam nhạt

**Divider** giữa 2 row: `------ Multiplayer · Realtime ------` (line + text + line)

**Row 2 — 4 card Multiplayer (grid 4 cột → responsive 2 cột → 1 cột)**

Mỗi card có: tag nhỏ (số người), emoji lớn, tên, mô tả ngắn, count row dưới.

| Card | Accent | Emoji | Tên | Mô tả | Số người |
|------|--------|-------|-----|-------|----------|
| battle | `--gold` | ⚔️ | Battle Royale | Sai là bay. Người cuối sống sót thắng. Top 3 nhận huy chương. | 5–100 người |
| speed | `#5DADE2` | ⚡ | Speed Race | Không ai bị loại, nhưng tốc độ tính điểm. Đúng + nhanh = thống trị. | 2–20 người |
| team | `#58D68D` | 🤝 | Team vs Team | Hai đội đấu. Cả đội đúng hết được Perfect Round bonus +50 điểm. | 4–40 người |
| sudden | `--coral` | 💀 | Sudden Death | Ai sai trước thua. Người thắng giữ ghế. Hàng chờ vô tận. | 2 người · 1v1 |

Mỗi card: hover `translateY(-4px)`, border-color sang màu accent, glow orb `blur(20px)` ở góc dưới phải, tilt 3D theo mouse.

---

### 5. `<WhySection>` — Background `--bg`

H2: `"Khác với những app Kinh Thánh khác."`

3 cards (grid 3 cột → 1 cột mobile):

- **01** — `"Học bằng cách thi đấu, không phải đọc"` — Não bộ nhớ lâu hơn khi có áp lực và cảm xúc. Battle Royale tạo ra đúng điều đó — bạn sẽ không quên câu trả lời sau khi bị loại vì nó.
- **02** — `"Streak và rank khiến bạn quay lại"` — Hệ thống Leo Rank daily reset, streak ngày liên tiếp, và bảng xếp hạng realtime tạo động lực học mỗi ngày — không cần ý chí.
- **03** — `"Chơi cùng nhóm nhà thờ, không cần setup phức tạp"` — Tạo phòng, chia sẻ mã 6 ký tự, bắt đầu trong 30 giây. Team vs Team hoàn hảo cho lớp học Kinh Thánh hoặc sự kiện nhóm.

Số "01"/"02"/"03": Syne 800, font-size 2.5rem, màu `rgba(212,168,67,0.2)`

---

### 6. `<LeaderboardSection>` id="lb-section" — Background `--bg2`

H2: `"Ai đang dẫn đầu tuần này?"`

**Tab bar** (3 tab): Tuần này (active) / Hôm nay / Mọi thời đại
- Active: text gold, border-bottom 2px gold. Inactive: muted.

**5 rows** — mỗi row: rank emoji + avatar tròn + tên + meta + (streak badge nếu top 3) + điểm

| Rank | Avatar | Tên | Meta | Streak | Điểm |
|------|--------|-----|------|--------|------|
| 🥇 | TH (tím) | Thanh Hằng | Battle Royale · 28 trận thắng liên tiếp | 🔥 28 | 124,850 |
| 🥈 | MK (xanh) | Minh Khoa | Speed Race · Avg 2.1s / câu | 🔥 14 | 118,420 |
| 🥉 | LP (lá) | Lan Phương | Team vs Team · 95% accuracy | 🔥 9 | 103,710 |
| 4 | HN (cam) | Hoàng Nam | Sudden Death · 41 trận giữ ghế | — | 97,300 |
| 5 | QL (đỏ) | Quỳnh Liên | Leo Rank · 22 ngày streak | — | 89,150 |

Row hover: `translateX(3px)` + border-color gold nhạt.
Tab click chỉ cần toggle active class, không cần thay data.

---

### 7. `<QuoteSection>` — Background `--bg`

Centered, max-width 640px.

Text Syne 700: `"Hãy` **`siêng năng dạy`** `những điều này cho con cái ngươi — hoặc là dùng BibleQuiz, cũng được."`
- Từ "siêng năng dạy" màu `--gold2`

Sub: `"Phục Truyền 6:7 · (có chút diễn giải)"` — muted, uppercase, tracking

---

### 8. `<CTASection>` — Background `--bg2`

Centered, có radial glow `rgba(212,168,67,0.07)` behind.

H2 Syne 800: `"Đăng nhập."` + dòng 2: `"Bắt đầu. Thắng."` (màu `--gold2`)
Sub: `"Không cần tạo tài khoản. Đăng nhập Google là chơi ngay."`
Buttons: Primary + Ghost (giống hero)
Note nhỏ dưới: `"Miễn phí · Không quảng cáo · 66 sách Kinh Thánh đầy đủ"`

---

### 9. `<Footer>`

3 phần flex row: Logo trái + Links giữa (Về chúng tôi / Điều khoản / Quyền riêng tư / Liên hệ) + Copyright phải
Border top: `1px solid rgba(255,255,255,0.06)`

---

## Animations cần implement

```css
/* Wiggle cho icon lửa */
@keyframes wiggle {
  0%,100% { transform: rotate(-10deg); }
  50%     { transform: rotate(10deg); }
}

/* Underline hero title */
@keyframes underlineGrow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

/* Float up/down */
@keyframes float {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-8px); }
}

/* Shake khi sai */
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%     { transform: translateX(-6px); }
  75%     { transform: translateX(6px); }
}

/* Pop khi đúng */
@keyframes correctPop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.04); }
  100% { transform: scale(1); }
}

/* Ticker marquee */
@keyframes ticker {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* Scroll reveal */
/* Dùng IntersectionObserver: thêm class "on" khi visible */
/* Default: opacity 0, translateY(24px), transition 0.6s cubic-bezier(0.22,1,0.36,1) */
/* .on: opacity 1, translateY(0) */
```

Timer countdown: `useEffect` setInterval 1s, đếm từ 20 về 0 rồi reset, hiển thị `Xs`.

3D tilt card: `onMouseMove` tính x/y relative, set `rotateX` + `rotateY` max ±5deg, `onMouseLeave` reset transform.

---

## Responsive breakpoints

- `< 900px`: modes-grid 4 cột → 2 cột
- `< 680px`: hero 2 cột → 1 cột (demo card ẩn), modes solo 2 cột → 1 cột, modes-grid → 1 cột
- Nav mobile: ẩn nav-links, giữ logo + button

---

## Routing

Các button CTA dùng `<Link to="/play">` hoặc `<Link to="/login">` tùy logic auth. Các href="#modes" dùng smooth scroll bình thường (không cần React Router).

---

## Lưu ý quan trọng

1. **KHÔNG dùng thư viện animation ngoài** (no framer-motion, no GSAP) — CSS + React state là đủ.
2. **KHÔNG dùng màu hardcode khác** ngoài design system đã định nghĩa ở trên, trừ màu avatar (có thể hardcode vì là mock data).
3. **Demo card là decorative** — không cần connect API, dùng local state.
4. **Grain texture overlay** là `body::after` dùng SVG noise inline base64, opacity 0.025, `pointer-events: none`, z-index cao nhất.
5. Đặt tất cả CSS variables vào `:root` trong `index.css` hoặc một file `theme.css` riêng để dùng lại toàn app.
6. Mỗi section nên là một component riêng: `<HeroSection>`, `<TickerBanner>`, `<ModesSection>`, `<WhySection>`, `<LeaderboardSection>`, `<QuoteSection>`, `<CTASection>` — import vào `HomePage.tsx`.
