# 2026-04-19 — UX Fix: Tier Gating + Overload + Text Mismatch [DONE]

### Task G-1: Tier gating cho Ranked + Tournament
- Status: [x] DONE
- Spec ref: 3.2.3 (Ranked tier 2, Tournament tier 4)
- File(s): GameModeGrid.tsx, getRecommendedMode.ts + tests
- Changes:
  - Add `requiredTier?: number` vào CardConfig; Ranked=2, Tournament=4
  - GameModeGrid nhận prop `userTier: number` (1-6)
  - Compute `isLocked = userTier < card.requiredTier`; disabled nav + visual:
    - Icon khóa (🔒 material-symbols lock) top-left
    - Replace CTA button thành disabled "Mở khóa ở {tierName}"
    - Opacity-80, cursor-not-allowed
    - Subtitle text: reason unlock (replace description)
  - Recommendation engine: accept `unlockedModes` set, skip rule pointing to locked mode (fallback next priority)
- Commit: "feat(web): add tier gating for Ranked and Tournament game modes"

### Task G-2: Discovery tier compact chip-style
- Status: [x] DONE — h-32 (was h-40), icon-xl (was 2xl), title-sm, description line-clamp-1
- File: GameModeGrid.tsx
- Discovery tier: thay h-40 card thành chip-style h-28: horizontal layout icon+title+CTA inline, no description, smaller padding
- Rationale: de-emphasize novelty modes so Tier 1 user tập trung vào core loop trước
- Commit: "style(web): compact discovery tier game-mode cards"

### Task G-3: Fix "Khám phá 6 chế độ" text mismatch
- Status: [x] DONE — thêm key `home.exploreModes` với `{{count}}` interpolation, Home.tsx pass count=9
- File: Home.tsx, i18n vi/en
- Hiện: hardcoded "KHÁM PHÁ 6 CHẾ ĐỘ" nhưng show 9 cards
- Fix: đổi thành "Khám phá {{count}} chế độ" interpolation, pass số unlocked count từ GameModeGrid
- Alternative: bỏ số hẳn, chỉ "Tất cả chế độ chơi"
- Commit: "fix(web): correct game mode count text to match actual cards"

### Task G-4: Remove sidebar BẮT ĐẦU button
- Status: [x] DONE — xóa block trong AppLayout + comment giải thích
- File: AppLayout.tsx (line ~205-211)
- Lý do: duplicate với "Bắt Đầu" trong Practice card + không có session state → click sẽ crash/redirect
- Action: xóa block
- Commit: "chore(web): remove redundant sidebar start button"

### Task G-5: Update tests
- Status: [x] DONE
  - getRecommendedMode.test.ts: +5 cases cho unlockedModes gating (fallback Practice, skip fullEnergy, allow khi unlocked, omit = all unlocked, onboarding vẫn fire)
  - GameModeGrid.test.tsx: +4 cases (lock Ranked tier-1, lock Tournament tier-2, unlock Ranked tier-2, không recommend locked)
  - AppLayout.test.tsx: +1 regression guard cho sidebar button removed
- File(s): GameModeGrid.test.tsx, getRecommendedMode.test.ts, AppLayout.test.tsx
- Tests mới:
  - Locked card renders lock icon + unlock message
  - Locked card not clickable
  - Recommendation engine skips locked mode
  - Sidebar start button NOT present
- Commit: "test: add tier gating tests + sidebar button removal guard"
