# 2026-05-19 — Mobile rewrite S6: Cosmetics + Help + a11y polish

> **Source**: Master roadmap [`2026-05-18-mobile-rewrite-roadmap.md`](2026-05-18-mobile-rewrite-roadmap.md) Sprint 6
> **Scope**: Last sprint trước M2 milestone (full feature parity). Ship CosmeticsScreen + HelpScreen (FAQ accordion) + onboarding polish + a11y audit pass. **Defer**: Group Sequential reveal, Group SetEditor (still pending decision), AI gen, push notif.
> **Why now**: BL-11 còn 1 row (Cosmetics) cần close. Help/FAQ là essential cho beta tester onboarding. A11y bare minimum cho App Store/Play Store review.

> **Recon (2026-05-19)**: `/api/me/cosmetics` returns { activeFrame, activeTheme, frames: CosmeticItem[], themes: CosmeticItem[] }. PATCH same endpoint với activeFrame/activeTheme. CosmeticItem: { id, name, tier, unlocked, active }. Web FAQ embedded data trong `data/faqData.ts` (FAQ_ITEMS + FAQ_CATEGORIES) — i18n via `help.items.<id>.{q,a}` keys.

### Tasks

- **S6-1 cosmetics API + CosmeticsScreen**
  - New `apps/mobile/src/api/cosmetics.ts` — `getCosmetics()`, `updateCosmetics({ activeFrame?, activeTheme? })`
  - New `apps/mobile/src/screens/user/CosmeticsScreen.tsx`:
    - 2 sections: Avatar Frames + Themes
    - Grid 3-col items với tier icon + name + locked overlay (🔒) khi !unlocked
    - Tap unlocked item → mut activate
    - Active item: gold ring border + "✓ Đang dùng" badge
  - Status: [ ] TODO
  - Files: `apps/mobile/src/api/cosmetics.ts` (new), `apps/mobile/src/screens/user/CosmeticsScreen.tsx` (new)
  - Spec impact: BL-11 close (Cosmetics row). Strategy: (c) `[no-spec-impact]`.

- **S6-2 HelpScreen — FAQ accordion**
  - New `apps/mobile/src/screens/system/HelpScreen.tsx`:
    - Port FAQ_CATEGORIES + FAQ_ITEMS list từ web `data/faqData.ts` (inline copy)
    - Group by category: gettingStarted, tiers, modes, gameplay, account
    - Per item: accordion (tap chevron → expand/collapse Q+A từ i18n keys)
    - Top sticky: section anchor jump buttons
  - i18n keys `help.categories.<cat>` + `help.items.<id>.{q,a}` — copy từ web vi.json + en.json (port relevant subset)
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/system/HelpScreen.tsx` (new), `apps/mobile/src/i18n/vi.json` + `en.json` (add `help.*` keys)
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S6-3 Onboarding polish — skip + better copy**
  - `WelcomeSlidesScreen`: thêm "Bỏ qua" button top-right → navigate.replace('Login')
  - `TryQuizScreen`: thêm progress dots indicator dưới (1 of 3 → 2 of 3 → 3 of 3)
  - `SplashScreen`: extend 1500ms → 2500ms để hiển thị logo lâu hơn (cảm giác polished)
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/onboarding/{WelcomeSlidesScreen,TryQuizScreen,SplashScreen}.tsx`
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S6-4 A11y audit pass**
  - Add `accessibilityLabel` + `accessibilityRole="button"` cho:
    - Tab bar items (5 tabs trong MainTabNavigator)
    - FAB buttons (chat fab, + tạo bộ mới, + tạo lịch mới)
    - Modal close buttons (chat overlay X, elimination overlay)
    - Quiz answer buttons (label "Đáp án A: <content>")
  - Verify minimum tap target 44x44 cho touch surfaces
  - `accessibilityState={{ selected: isActive }}` cho filter pills
  - Status: [ ] TODO
  - Files: ~5-7 files với hot-spots a11y touches
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S6-5 Navigation wiring + menu items**
  - types.ts ProfileStack: add Cosmetics + Help routes
  - MainTabNavigator: register CosmeticsScreen + HelpScreen vào ProfileStack
  - ProfileScreen menu thêm "🎨 Trang trí" → Cosmetics + "❓ Trợ giúp" → Help
  - Status: [ ] TODO
  - Files: `apps/mobile/src/navigation/types.ts`, `MainTabNavigator.tsx`, `screens/user/ProfileScreen.tsx`
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S6-6 Tầng 3 regression + mark sprint DONE + M2 milestone**
  - mobile jest ≥ 33, mobile tsc clean
  - Web vitest baseline check (no S6 web touched)
  - Update roadmap S6 → DONE, BL-11 Cosmetics row closed, M2 milestone reached
  - Status: [ ] TODO

### Common

- **Spec impact**: BL-11 Cosmetics row close. Còn Group SetEditor + AI gen + Group Sequential reveal vẫn defer dài hạn (chỉ ship cần decision sản phẩm).
- **Spec strategy**: tất cả (c) `[no-spec-impact]`.
- **Sensitive files**: KHÔNG đụng App.tsx, authStore. ProfileScreen + tabs menu thêm items.
- **Out of scope S6 (defer)**:
  - Cosmetics PURCHASE flow (chỉ activate unlocked items)
  - Help search functionality
  - Help inline tutorials (defer post-launch)
  - Full a11y audit với screen reader testing (cần real device QA)
  - Onboarding skip-to-app gate validation

### Verification

- Sau S6: M2 milestone reached — mọi flow web đều có trên mobile (5 BL-11 rows closed, còn 3 defer items đều có rationale).
- Master roadmap S6 → ✅ DONE.
- Ready cho S7 production release prep.
