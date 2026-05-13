# 2026-05-01 — Home Redesign Sacred Modernist v2 (H1-H8) [DONE]

> Source: `docs/prompts/PROMPT_HOME_REDESIGN.md` + mockups
> `docs/designs/biblequiz_home_redesign_proposal.html` (desktop) and
> `biblequiz_home_redesign_mobile.html` (responsive variant). Branch:
> `feat/home-redesign-v2`.

### Tasks H1-H8 — all shipped on branch
- [x] H1: Hero greeting + sub-tier stars (`feat: Home hero...` 7d05f63)
- [x] H2: Daily Challenge compact card (9a1df7d)
- [x] H3: Tiếp tục hành trình (Practice blue / Ranked gold) — supersedes
      PL-3 gold-outline intermediate (76b6d06)
- [x] H4: 6 mode cards with colors + live data hints (918fd75) +
      tracking gaps in `BACKEND_GAPS_HOME_V2.md`
- [x] H5: Daily missions compact section (1707f5e)
- [x] H6: Bible Journey 66 books (OT/NT split bar) — uses BE-provided
      `oldTestamentCompleted` / `newTestamentCompleted` fields (9980dba)
- [x] H7: Leaderboard with tier-color avatars + Activity card (10c867c)
- [x] H8: Daily verse decorative footer (555ff74)

### Mobile responsive — handled inline
AppLayout already hides sidebar < `md` and surfaces a bottom nav.
Each H-task component carries its own `md:` Tailwind breakpoints,
so the mobile mockup pattern (2-col mode-card grid, hero stat boxes
replacing the hidden sidebar widgets, stacked leaderboard/activity)
falls out of the responsive utilities — no separate mobile commit
needed.

### Final regression
- FE: 1053 pass / 2 pre-existing fails (BasicQuizCard cooldown timer,
      GroupDetail module-import timeout — both unchanged baseline).
- BE: 269 tests, 1 pre-existing fail + 17 cascading SecurityTest
      ApplicationContext errors. No new regressions introduced.
- i18n: 134 hardcoded = baseline, 0 missing keys.

### Backend gaps tracked for post-launch (see BACKEND_GAPS_HOME_V2.md)
- `GET /api/groups/me` — to power the Nhóm Giáo Xứ live hint.
- `GET /api/tournaments/upcoming` — to power the Giải Đấu live hint.
Cards without an endpoint silently render no hint instead of fake
placeholder text.

---
