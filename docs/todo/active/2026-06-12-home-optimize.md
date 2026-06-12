# 2026-06-12 — Optimize trang chủ (Home)

> **Source**: Design review 2026-06-12 (screenshot Home của tài khoản MỚI, desktop + mobile).
> First-impression yếu vì empty-state, hero sai ưu tiên thị giác, mật độ section cao + trùng lặp.
> **Scope**: `apps/web/src/pages/Home.tsx` + các component liên quan (HomeBanner, FeaturedDailyCard,
> CompactCard, RankedStandardCard, BibleJourneyCard...). Theo `docs/dev/design-system.md` — token sẵn có,
> KHÔNG tạo style mới. Logic/API giữ nguyên; ưu tiên thay đổi render/layout/conditional.
> **Status**: TODO
> **Branch**: `optimize/home-redesign` (base 7aa4018)
> **Baseline**: FE vitest 1287 pass (1 pre-existing fail RoomQuizHost — bỏ qua).

### Code prefix: `HO` (Home Optimize)

### Invariants (không được phá)
- Token "Sacred Modernist" (bg #11131e, glass-card, gold-gradient, Be Vietnam Pro, Material Symbols). KHÔNG hardcode màu mới ngoài bộ token.
- i18n: dùng key sẵn có; key mới thêm cả vi + en.
- Giữ data-testid hiện có (test + e2e selector); thêm mới nếu cần.
- KHÔNG đổi luồng API/auth; mode-card navigation giữ nguyên.

### Tasks (xếp theo đòn bẩy giảm dần)

- [ ] **HO-1 🔴 Empty-state cho user mới** — tác động retention lớn nhất.
  - Với user 0 hoạt động (0 XP / chưa xếp hạng / 0/66 journey / 0/3 mission): ẩn hoặc gập các khối "thành tích rỗng" (xếp hạng, BibleJourney, có thể cả DailyMissions) thay bằng 1 lời dẫn "Bắt đầu từ đây" trỏ vào Daily/Luyện Tập. Các khối hiện dần khi có dữ liệu.
  - Tránh "bức tường số 0". Cần 1 cờ phân biệt new-user (vd totalPoints==0 && no streak && journey==0).

- [ ] **HO-2 🟡 Hero card (HomeBanner)** — sửa ưu tiên thị giác.
  - Hạ cấp username (truncate, cỡ nhỏ hơn), làm nổi **tier + thanh XP** làm điểm nhấn chính.
  - Gọn 3 stat (streak / năng lượng / mùa) — nhãn "Mùa ... 2026" đang bị cắt; cân nhắc bỏ bớt hoặc xuống hàng có nhãn rõ. Mobile: hàng stat đang chật, cần thoáng.

- [ ] **HO-3 🟡 Bỏ trùng lặp + badge nhiễu**
  - `Home.tsx` render `PRACTICE_CARD` ở CẢ "Chế độ chính" lẫn grid 4-cột lg → bỏ trùng (xác nhận: `renderModeCard(PRACTICE_CARD)` 2 lần, dòng ~286 và ~319).
  - Bỏ badge "Đã mở khóa" (nhiễu — chỉ giữ badge "Khóa" để tạo mục tiêu). Affordance khóa/mở nhất quán.

- [ ] **HO-4 🟡 Giảm mật độ / monotone**
  - 6 section gần cùng trọng số → gộp/nhóm hợp lý (vd gộp "chế độ chính" + "đa dạng", hoặc tạo phân cấp thị giác rõ giữa nhóm). Giảm scroll dài, tăng khả năng quét.

- [ ] **HO-5 ⚪ Mobile polish**
  - Hero stat row thoáng hơn; 2 card sách journey cuối (đều khóa) đang trông dở dang → cải thiện hoặc gộp vào HO-1.
  - Anchor lại coachmark "Thử thách hàng ngày (1/3)" vào Daily card thay vì đè giữa mode cards.

- [ ] **HO-6 ⚪ Consistency**
  - Section header đồng nhất (casing + affordance "Xem tất cả"). "Năng lượng 100" thêm ngữ cảnh ngắn nếu hợp.

- [ ] **HO-7 vitest + verify** — chạy `npx vitest run src/pages/__tests__/` + screenshot lại Home (new-user + user có data) so sánh trước/sau. Cập nhật test bị move-by-layout, không weaken assertion.

### Notes
- Chụp Home thật: script `F:/f/tmp/pw-diag/shot-home.mjs` (login test user → screenshot fullPage desktop + mobile). Output ở `F:/f/tmp/pw-diag/home-*.png`.
- Nên chụp thêm **user CÓ dữ liệu** để chắc HO-1 không làm hỏng active-state.
- Commit nhỏ từng HO-n, English commit message, vitest pass trước mỗi commit.
