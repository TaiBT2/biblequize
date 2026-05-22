# W-M06-QM — Đấu Nhanh (Quick Match) L1 Smoke

**Routes:** `/multiplayer`
**Spec ref:** `PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT.md` (2026-05-15), `SPEC_MULTIPLAYER.md §3` (4 modes)
**Implementation:** `apps/web/tests/e2e/smoke/web-user/W-M06-quickmatch.spec.ts`
**Source task:** `docs/todo/active/2026-05-23-e2e-quickmatch-4modes.md` (QM-1)

L1 Smoke covers card render + modal open/close + 4-mode picker shape only.
Realtime gameplay → happy-path/W-M06-quickmatch-{mode}.md.

---

## W-M06-QM-L1-001 — QuickMatch entry card render

**Priority:** P0 · **Auth:** tier3 · **Tags:** `@smoke @quickmatch`

**Actions:**
1. Goto `/multiplayer`.

**UI Assertions:**
- `qm-entry-card` visible.
- `qm-entry-cta` visible.
- `qm-entry-counter` visible, `data-used` ∈ [0,3].

---

## W-M06-QM-L1-002 — Modal open + Esc + backdrop dismiss

**Priority:** P0 · **Auth:** tier3 · **Tags:** `@smoke @quickmatch`

**Actions:**
1. Goto `/multiplayer` → click `qm-entry-cta`.
2. Verify modal opens.
3. Press Esc.
4. Reopen → click backdrop (corner).

**UI Assertions:**
- After step 1: `qm-modal` visible.
- After step 3: `qm-modal` count 0.
- After step 4: `qm-modal` count 0.

---

## W-M06-QM-L1-003 — 4 mode chips render + SPEED_RACE default

**Priority:** P0 · **Auth:** tier3 · **Tags:** `@smoke @quickmatch`

**Actions:**
1. Goto `/multiplayer` → open modal.

**UI Assertions:**
- `qm-mode-SPEED_RACE`, `qm-mode-BATTLE_ROYALE`, `qm-mode-TEAM_VS_TEAM`, `qm-mode-SUDDEN_DEATH` all visible.
- `qm-mode-SPEED_RACE` has `data-active="true"`.

---

## W-M06-QM-L1-004 — Đổi mode chip → active flag toggle

**Priority:** P1 · **Auth:** tier3 · **Tags:** `@smoke @quickmatch`

**Actions:**
1. Goto `/multiplayer` → open modal.
2. Click `qm-mode-BATTLE_ROYALE`.
3. Click `qm-mode-TEAM_VS_TEAM`.

**UI Assertions:**
- After step 2: BATTLE_ROYALE `data-active=true`, SPEED_RACE `data-active=false`.
- After step 3: TEAM_VS_TEAM `data-active=true`, BATTLE_ROYALE `data-active=false`.

---

## W-M06-QM-L1-005 — Source DB default + AI tier-gating (tier3 < 4 → locked)

**Priority:** P0 · **Auth:** tier3 · **Tags:** `@smoke @quickmatch`

**Actions:**
1. Goto `/multiplayer` → open modal.

**UI Assertions:**
- `qm-source-database` `data-active="true"`.
- `qm-source-ai` `data-disabled="true"` (Tier 3 < 4 = Hiền Triết).

---

## W-M06-QM-L1-006 — Mode labels Vietnamese không leak raw i18n key

**Priority:** P2 · **Auth:** tier3 · **Tags:** `@smoke @quickmatch @i18n`

**Actions:**
1. Set `localStorage.quizLanguage=vi`, `i18nextLng=vi`.
2. Goto `/multiplayer` → open modal.

**UI Assertions:**
- Visible text: `Speed Race`, `Battle Royale`, `Team vs Team`, `Đấu vương`.
- No text matching `/multiplayer\.config\./` or `/multiplayer\.quickMatch\./`.
