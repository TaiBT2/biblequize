# 2026-06-12 — Optimize trang chủ (Home)

> **Source**: Design review 2026-06-12 (screenshot Home của tài khoản MỚI, desktop + mobile).
> First-impression yếu vì empty-state, hero sai ưu tiên thị giác, mật độ section cao + trùng lặp.
> **Scope**: `apps/web/src/pages/Home.tsx` + các component liên quan (HomeBanner, FeaturedDailyCard,
> CompactCard, RankedStandardCard, BibleJourneyCard...). Theo `docs/dev/design-system.md` — token sẵn có,
> KHÔNG tạo style mới. Logic/API giữ nguyên; ưu tiên thay đổi render/layout/conditional.
> **Status**: HO-1/2/3 done; HO-4/5/6 partial-or-deferred (see notes); HO-7 green (1290 pass, 0 fail).
> **Branch**: `optimize/home-redesign` (base 7aa4018)
> **Baseline**: FE vitest 1287 pass (1 pre-existing fail RoomQuizHost — bỏ qua).

### Code prefix: `HO` (Home Optimize)

### Invariants (không được phá)
- Token "Sacred Modernist" (bg #11131e, glass-card, gold-gradient, Be Vietnam Pro, Material Symbols). KHÔNG hardcode màu mới ngoài bộ token.
- i18n: dùng key sẵn có; key mới thêm cả vi + en.
- Giữ data-testid hiện có (test + e2e selector); thêm mới nếu cần.
- KHÔNG đổi luồng API/auth; mode-card navigation giữ nguyên.

### Tasks (xếp theo đòn bẩy giảm dần)

- [x] **HO-1 🔴 Empty-state cho user mới** — tác động retention lớn nhất.
  - Với user 0 hoạt động (0 XP / chưa xếp hạng / 0/66 journey / 0/3 mission): ẩn hoặc gập các khối "thành tích rỗng" (xếp hạng, BibleJourney, có thể cả DailyMissions) thay bằng 1 lời dẫn "Bắt đầu từ đây" trỏ vào Daily/Luyện Tập. Các khối hiện dần khi có dữ liệu.
  - Tránh "bức tường số 0". Cần 1 cờ phân biệt new-user (vd totalPoints==0 && no streak && journey==0).
  - ✅ Done: derived `isNewUser = totalPoints===0 && !dailyDone && currentStreak===0` in Home.tsx. New `home-start-here` cue (i18n `home.emptyState.*` vi+en) leads into the Daily hero. BibleJourney section gated behind `!isNewUser`. DailyMissions kept for all (Bui decision). All gating byte-identical for users with data; 3 new Home tests cover it.

- [x] **HO-2 🟡 Hero card (HomeBanner)** — sửa ưu tiên thị giác.
  - Hạ cấp username (truncate, cỡ nhỏ hơn), làm nổi **tier + thanh XP** làm điểm nhấn chính.
  - Gọn 3 stat (streak / năng lượng / mùa) — nhãn "Mùa ... 2026" đang bị cắt; cân nhắc bỏ bớt hoặc xuống hàng có nhãn rõ. Mobile: hàng stat đang chật, cần thoáng.
  - ✅ Done: username → 16/19px font-bold text-ivory-dim (was 24/30px extrabold ivory); tier label bumped to 17/20px extrabold. Stat row gets `gap-2`/`pt-3` mobile breathing room; Stat label tracking 0.12em→0.06em + `leading-[1.2] break-words` + dropped rigid `min-w-[70px]` on mobile so "Mùa ... 2026" no longer clips. Visual-only; data bindings + testids unchanged. HomeBanner name test updated to assert de-emphasis.

- [x] **HO-3 🟡 Badge nhiễu** (ĐÍNH CHÍNH 2026-06-12)
  - ✅ Done: deleted the hardcoded "Đã mở khóa" pill (RankedStandardCard.tsx); icon row kept. No Practice dedup (non-issue). RankedStandardCard test now asserts pill absent.
  - ✗ "Trùng lặp Luyện Tập" trong review ban đầu là SAI: hai lần `renderModeCard(PRACTICE_CARD)` (Home.tsx ~286 vs ~319) nằm trong 2 nhánh loại trừ nhau qua `dailyDone` (State A primary+variety / State B explore 4-cột). KHÔNG dedup.
  - ✓ Việc thật: bỏ pill **"Đã mở khóa"** hardcode ở `RankedStandardCard.tsx:62` (nhiễu — chỉ nên giữ badge "Khóa" để tạo mục tiêu; affordance khóa/mở nhất quán). Pill này còn hardcode tiếng Việt, không qua i18n.

- [~] **HO-4 🟡 Giảm mật độ / monotone**
  - 6 section gần cùng trọng số → gộp/nhóm hợp lý (vd gộp "chế độ chính" + "đa dạng", hoặc tạo phân cấp thị giác rõ giữa nhóm). Giảm scroll dài, tăng khả năng quét.
  - ⚠️ Partial / conservative: addressed mainly via HO-1 (new users now see fewer blocks — journey hidden + cue replaces the empty stacks). Did NOT regroup the existing State A/B section pairs or touch shared SectionHeader margins — those are load-bearing (multiple Home tests assert exact section titles/order, and SectionHeader is shared across pages). Heavier regrouping deferred to avoid gold-plating + cross-page risk.

- [~] **HO-5 ⚪ Mobile polish**
  - Hero stat row thoáng hơn; 2 card sách journey cuối (đều khóa) đang trông dở dang → cải thiện hoặc gộp vào HO-1.
  - Anchor lại coachmark "Thử thách hàng ngày (1/3)" vào Daily card thay vì đè giữa mode cards.
  - ✅ Stat row breathing room done (in HO-2). Journey empty cards no longer dort-dang for new users (hidden, HO-1).
  - ⚠️ Deferred: coachmark re-anchoring. TutorialOverlay is a separate component and does NOT reference any Home testid (verified via grep — no querySelector/getElementById on home-* anchors), so changing anchoring would mean reworking that component's positioning logic — out of scope + risky. Noted, not forced.

- [~] **HO-6 ⚪ Consistency**
  - Section header đồng nhất (casing + affordance "Xem tất cả"). "Năng lượng 100" thêm ngữ cảnh ngắn nếu hợp.
  - ℹ️ SectionHeader already uniform (single shared component, all usages identical). Skipped the speculative "energy context" micro-copy to avoid gold-plating — low value, adds i18n surface for marginal gain.

- [x] **HO-7 vitest + verify** — chạy `npx vitest run src/pages/__tests__/` + screenshot lại Home (new-user + user có data) so sánh trước/sau. Cập nhật test bị move-by-layout, không weaken assertion.

### Notes
- Chụp Home thật: script `F:/f/tmp/pw-diag/shot-home.mjs` (login test user → screenshot fullPage desktop + mobile). Output ở `F:/f/tmp/pw-diag/home-*.png`.
- Nên chụp thêm **user CÓ dữ liệu** để chắc HO-1 không làm hỏng active-state.
- Commit nhỏ từng HO-n, English commit message, vitest pass trước mỗi commit.
