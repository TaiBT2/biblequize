# 2026-06-11 — Redesign 2 màn Quản trò (in-game + wrap-up)

> **Source**: User feedback 2026-06-11 (screenshots) — cả 2 màn host hiện "xấu": full-width 1900px stretch,
> dead space lớn, hierarchy yếu, 4 nút control khổng lồ full-width.
> **Scope**: VISUAL redesign của `RoomQuizHost` (in-game view + wrap-up "Cảm ơn Quản trò!").
> Logic/event handling GIỮ NGUYÊN (vừa refactor FMR-5 — typed events). Theo design system
> `docs/dev/design-system.md` ("Sacred Modernist") — Stitch không có design màn này → dùng tokens + pattern sẵn.
> **Status**: DONE (2026-06-12)

### Code prefix: `QTR` (Quản Trò Redesign)

### Design direction (đã chốt theo tokens)
**A. In-game host view:**
- Desktop ≥lg: 2 cột. Cột chính: question card (`.glass-card`) — badge "QUẢN TRÒ" + "Câu X/N" + timer gold nổi bật; câu hỏi typography lớn; đáp án grid 2×2 theo C5 palette (A coral / B sky / C gold / D sage) + chip đếm số người chọn mỗi đáp án (live); sau reveal highlight đáp án đúng.
- Sidebar phải (sticky): card "Tình trạng trả lời" (n/m + dãy player chip sáng dần khi ANSWER_SUBMITTED) + card "Bảng xếp hạng tạm thời" (top 5, rank accent).
- Control bar: compact `.glass-panel` sticky bottom — 4 nút icon+label gọn (Tạm dừng toggle / Bỏ câu / Nhắn / Kết thúc outline-đỏ), KHÔNG full-width.
- Mobile: 1 cột, controls sticky bottom.

**B. Wrap-up "Cảm ơn Quản trò!":**
- Container căn giữa `max-w-3xl`/`4xl` (hết stretch 1900px).
- Winner hero card: gold-gradient accent + crown + glow.
- 4 stat tile 1 hàng (2×2 mobile) `.glass-card`.
- Xếp hạng cuối: row card với medal accent top 1/2/3 (gold/silver/bronze), mini progress-bar tỷ lệ đúng, điểm gold bên phải.
- Actions: primary `.gold-gradient` "Tổ chức trận mới với cùng nhóm"; hàng secondary ghost (Phân tích / Đóng).

### Tasks
- [x] QTR-1 Redesign in-game host view (layout 2 cột + answer grid C5 + control bar compact)
      — Note: per-option live count chip KHÔNG khả thi (ANSWER_SUBMITTED payload không có option index)
      → giữ aggregate counter "n/m đã trả lời" theo fallback đã chốt trong direction.
- [x] QTR-2 Redesign wrap-up screen (centered + winner hero + stat tiles + ranking medals)
- [x] QTR-3 Cập nhật test RoomQuizHost cho markup mới (chỉ chỗ layout đổi; giữ assertion ngữ nghĩa);
      sửa luôn test stale dòng ~64 ("✓ ĐÁP ÁN" pre-anti-spoiler) về hành vi anti-spoiler hiện tại → suite full green
- [x] QTR-4 vitest full green (129 files / 1284 tests passed, 2026-06-12); tsc --noEmit: 0 lỗi mới
      trong RoomQuizHost (các lỗi còn lại là baseline pre-existing ngoài scope)
      — i18n: không cần key mới (mọi label đều tái dùng chuỗi sẵn có của component)

### QTR-5 — TV presentation pass (user feedback 2026-06-12) — DONE 2026-06-12
> Màn in-game host được **chiếu lên TV cho cả phòng xem** → design phải là "presentation mode",
> không phải dashboard admin:
- [x] Typography scale lớn (đọc được từ xa): câu hỏi `text-3xl lg:text-4xl xl:text-5xl`,
      đáp án tile `py-5/6` min-h-[72px] + letter chip `w-12→14` + option text `text-xl→2xl`;
      container `max-w-7xl` (sidebar 340→380px ở xl).
- [x] Timer kịch tính: số `text-3xl→5xl` tabular + progress bar `h-2`, gold→cam (#d97706, ≤50%)
      →đỏ (#ef4444, ≤20%) — pure render math (`timerRatio`/`timerColor`), không thêm state.
- [x] Header brand strip gọn: badge 👑 QUẢN TRÒ • Câu X/N • tên quản trò (chuyển từ footer chip
      cũ, footer chip đã xoá) | timer to bên phải; countdown bar full-width ngay dưới header.
- [x] "Tình trạng trả lời" thành ticker nổi bật: counter `text-3xl→4xl` gold + `/m` + label;
      player chip to hơn (avatar w-8, text-sm) pop-in qua keyframe mới `.host-chip-pop`
      (global.css, cạnh answer-correct-anim). Per-option count vẫn KHÔNG khả thi (payload
      ANSWER_SUBMITTED không có option index) — giữ aggregate.
- [x] Controls KÍN ĐÁO: lg+ → floating pill cluster bottom-right (`.glass-panel` rounded-full,
      nút compact rounded-full, actionError tooltip phía trên), `lg:opacity-40` →
      `hover/focus-within:opacity-100`; mobile (<lg) giữ nguyên sticky bottom bar đầy đủ;
      "Kết thúc" giữ outline đỏ. Giữ mọi data-testid (host-controls-bar, host-control-*).
- [x] Reveal moment: tile đúng `scale-[1.02]` + glow xanh mạnh hơn (0 0 40px rgba(74,222,128,0.45)),
      tile khác dim sâu hơn (opacity-30→20); giữ `answer-correct-anim`.
- [x] vitest full green: 129 files / 1284 tests passed (2026-06-12), KHÔNG phải sửa test nào
      (mọi testid + text ngữ nghĩa giữ nguyên); `tsc --noEmit`: 0 lỗi trong RoomQuizHost.

### QTR-6 — Wrap-up polish (design review 2026-06-12) — DONE (commit 085699c)
- [x] Podium 3 bậc vào wrap-up Quản trò: `PodiumBlock` mới (RoomOverlays, inline, fallback rank
      theo điểm khi mode không set finalRank) thay winner hero card (trùng hạng 1); ranking list giữ dưới.
- [x] "Đóng" đỏ → ghost trung tính; bỏ ✕ góc trên (trùng affordance).
- [x] vitest 1287/1287 green (.test-baseline 1287).

### BUG kèm theo (màn player, residual F-web-2) — DONE (commit 085699c)
- [x] "Chưa xếp hạng" cho người thắng: 2 nguyên nhân — (a) `myRank` chỉ đọc `finalRank`
      (Speed Race không bao giờ set) → fallback thứ hạng theo điểm; (b) match "tôi" bằng username
      localStorage → ưu tiên `playerId === myUserId`. Nguồn userId: RoomLobby truyền `viewerUserId`
      qua nav state, RoomQuiz nâng cấp từ GET /api/rooms/{id} lúc mount (localStorage 'userId'
      legacy chưa từng được ghi — giữ làm last resort). 2 regression test.

### Invariants
- Logic + STOMP handling không đổi (handlers, state, effects giữ nguyên — chỉ JSX/class).
- Anti-spoiler: correct answer chỉ hiện sau ROUND_END/QUESTION_REVEALED.
- Tokens bắt buộc: bg `#11131e`, card `.glass-card`, CTA `.gold-gradient`, font Be Vietnam Pro, icon Material Symbols.
- i18n: dùng key sẵn có; key mới thêm cả vi + en.
- Giữ data-testid sẵn có; thêm mới nếu cần cho phần tử mới.
