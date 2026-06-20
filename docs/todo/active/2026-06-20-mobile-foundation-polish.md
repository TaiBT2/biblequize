# 2026-06-20 — Mobile foundation polish (cross-cutting, Capacitor-aware)

> **Source**: Đào sâu responsive mobile 2026-06-20 (3-agent sweep: shell / page / Capacitor). Bổ sung lớp **cross-cutting** mà 2 audit trước KHÔNG phủ:
> - [MOBILE_RESPONSIVE_AUDIT.md](../../audit/MOBILE_RESPONSIVE_AUDIT.md) → page-level layout (MRF-1..14 DONE)
> - [TABLET_RESPONSIVE_AUDIT.md](../../audit/TABLET_RESPONSIVE_AUDIT.md) → breakpoint tablet (TBL-1..13 DONE)
> **Scope**: web + Capacitor shell. Chỉ layout/CSS/native-init — KHÔNG đụng business logic, KHÔNG đụng gameplay. 1 task = 1 commit < 100 LOC.
> **Prefix**: `MFP`. Files "nhạy cảm" chạm: `styles/global.css`, `layouts/AppLayout.tsx` → BẮT BUỘC Tầng 3 trước mỗi commit.
> **Verify-before-code**: line numbers dưới là tham chiếu khảo sát 2026-06-20 — grep lại trước khi sửa (MRF/TBL có thể đã dịch dòng).

## Bối cảnh — vì sao đây là gap thật

Cả MRF (per-page) lẫn TBL (tablet) không xử lý 4 thứ sau, đều ảnh hưởng **mọi trang** trên app native:
1. Clearance đáy + safe-area bị **hardcode rải rác** mỗi nơi 1 con số (72px / 16px / 80px) → đổi 1 chỗ là lệch hết.
2. Hiệu ứng tương tác **chỉ `:hover`** → vô hình trên cảm ứng (app native = 100% touch). 23 `group-hover:` (13 file) + ~55 `:hover` trong global.css, **0 cái** gate `@media (hover:hover)` hay có `:active`/`group-active:` tương đương.
3. `min-h-screen`/`h-screen` = `100vh` (64 chỗ) → clip trên mobile **web browser** khi address bar ẩn/hiện (severity thấp trong Capacitor WebView vì không có address bar).
4. Android keyboard có thể che input — `initNative.ts:23` ghi rõ đã bỏ qua resize.

---

## Tasks (cheap+sure → structural)

- MFP-1 **Gom clearance đáy về 1 nguồn (CSS var)**
  - Thêm token `--mobile-nav-h: calc(56px + env(safe-area-inset-bottom, 0px))` trong `styles/global.css` (hoặc tokens layer).
  - `AppLayout.tsx:~101` spacer `h-20` (80px cứng) → `h-[var(--mobile-nav-h)]`. Lý do: tab bar = `min-h-[52px] + pt-1 + max(8px, env(safe-area-inset-bottom))` ≈ 64–90px trên máy notch → `h-20` thiếu ~10px, nội dung cuối trang bị che.
  - Status: [x] DONE · Files: `styles/global.css` (`--mobile-nav-h` token), `layouts/AppLayout.tsx:119` (`h-20`→`h-[var(--mobile-nav-h)]`) · Test: Tầng 3 FE **1357 pass** (≥ baseline 1277) + build exit 0
  - Note: var base 72px (≥64 floor để luôn clear nav 52+pt-1+max(8px,safe-area)) + `env(safe-area-inset-bottom)`.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`

- MFP-2 **Migrate 3 offset hardcode → `--mobile-nav-h`**
  - `DailyChallenge.tsx:~571` `bottom-[calc(72px+env(safe-area-inset-bottom))]`, `room/RoomQuizShell.tsx:~195` `calc(env(...)+16px)`, `components/ranked/RankedActionFooter.tsx:~107` `bottom-20` → tham chiếu var chung (giữ nguyên hành vi, chỉ bỏ magic number). Mỗi chỗ đối chiếu kỹ vì là fixed overlay trên gameplay.
  - Status: [ ] TODO · Files: 3 file trên · Test: Tầng 3 + manual: dock "Câu tiếp theo" (Daily), action footer (Ranked), Room quiz không đè `MobileBottomTabs`/home-indicator
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`

- MFP-3 **Touch feedback cho global.css `:hover`**
  - Bọc các `:hover` *trang trí* (glow/scale/translate, KHÔNG phải nav-link cơ bản) trong `@media (hover:hover)` để không "dính" trạng thái hover sau tap trên cảm ứng; thêm `:active` tương đương cho control quan trọng (`.neon-btn`, `.cta-button`, `.answer-hover`).
  - Status: [ ] TODO · Files: `styles/global.css` (~55 `:hover`) · Test: Tầng 3 + screenshot tap state mobile
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`

- MFP-4 **`group-hover:` → thêm `group-active:` / gate hover** cho card CTA chính
  - Ưu tiên card tương tác cốt lõi: `Home.tsx` (featured cards), `components/HeroRankedCard.tsx`, `RankedStandardCard.tsx`, `components/ranked/SeasonCard.tsx`. Thêm `group-active:` (feedback khi chạm) cho glow/scale/mũi tên; LandingPage/Onboarding (marketing) có thể defer.
  - Status: [ ] TODO · Files: 13 file có `group-hover:` (ưu tiên 4 file trên) · Test: Tầng 3 + manual tap feedback
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`

- MFP-5 **`100vh` → dynamic viewport** cho full-screen page (mobile web)
  - `min-h-screen`/`h-screen` → `min-h-[100dvh]` ở các trang full-screen: `Login`, `Register`, `LandingPage`, `Onboarding`, `OnboardingTryQuiz`, `DailyChallenge` immersive + 3 chỗ `100vh` trong `global.css`. Kiểm Tailwind version hỗ trợ `dvh` (nếu chưa, dùng arbitrary `[100dvh]` — đã an toàn). Fallback desktop tự về 100vh.
  - Status: [ ] TODO · Files: các page trên + `styles/global.css` · Test: Tầng 3 + manual iOS Safari (web) không clip
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`

- MFP-6 **Android keyboard: scroll focused input vào tầm nhìn** (Capacitor-only)
  - Listener `keyboardWillShow` → `document.activeElement.scrollIntoView({block:'center'})` trong `initNative.ts` (hoặc hook nhỏ). Kiểm input code-entry JoinRoom / QuizSetEditor không bị keyboard che.
  - **BLOCKED-pending-dep**: cần xác nhận `@capacitor/keyboard` đã có trong deps chưa — nếu chưa, HỎI trước khi thêm (CLAUDE.md §dependencies). Grep `apps/web/package.json` trước.
  - Status: [!] BLOCKED (dep check) · Files: `platform/initNative.ts` · Test: emulator Android Pixel — tap input không bị che
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`

## Out of scope (đã xử lý / không phải gap)
- Page-layout overflow từng trang → MRF-1..14 DONE. Tablet breakpoint → TBL-1..13 DONE.
- AdminLayout không responsive → admin đã loại khỏi bundle mobile (`VITE_TARGET` guard) → ưu tiên thấp nhất, KHÔNG nằm trong sprint này.
- `viewport-fit=cover`, StatusBar, overscroll, tap-highlight, user-select, `isCapacitor()` branching → đã đúng, không sửa.

## Thứ tự đề xuất
MFP-1 → MFP-2 (foundation, gỡ coupling) → MFP-3 → MFP-4 (native feel, giá trị cao nhất) → MFP-5 (web) → MFP-6 (sau khi clear dep).
