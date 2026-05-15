# Project Purpose

**BibleQuiz** is a Bible-study quiz platform targeting Vietnamese Tin Lành
(Protestant) users. Users answer multiple-choice questions about the Bible
across multiple game modes, climb a tier ladder (religious-themed names),
and participate in liturgical-season events.

## Audience & doctrinal constraints
- **Target**: Tin Lành (Protestant) Việt Nam — UI is Vietnamese-first with
  EN parity in progress.
- **Bible canon**: 66 books Protestant. **NEVER** seed the 7 Deuterocanonical
  Catholic books.
- **Bible version**: BTTHĐ 2011 is canonical. Code seeds currently use BTT 1926
  (public domain) — migration tracked as BL-1 in `docs/spec/BACKLOG.md`.
  New questions: use BTT 1926 with a `// TODO BL-1: BTTHĐ 2011` marker.

## Canonical constraints (locked — see CLAUDE.md §"Canonical constraints")
| # | Constraint |
|---|---|
| C1 | Tier names (Vietnamese, religious): Tân Tín Hữu / Người Tìm Kiếm / Môn Đồ / Hiền Triết / Tiên Tri / Sứ Đồ. Never use the deprecated light-themed names (Tia Sáng / Vinh Quang). |
| C2 | Mode names in Vietnamese UI: **"Luyện Tập"** and **"Đấu Hạng"**. Never "Leo Rank" or "Thi Đấu Ranked". |
| C3 | 4 liturgical seasons (Phục Sinh, Ngũ Tuần, Cảm Tạ, Giáng Sinh) with ×1.5 score multiplier. |
| C4 | BTTHĐ 2011, 66 Protestant books, 50/50 VN/EN. |
| C5 | Answer colors: A=Coral, B=Sky, C=Gold, D=Sage. |
| C6 | Group roles: Leader (gold) / Mod (blue) / Member. |
| C7 | Room lifecycle 5 rules R1–R5; CANCELLED status deprecated. |
| C8 | SPEC_GROUP locked decisions Q-A…Q-O preserved verbatim. |
| C9 | Defer features only live in `docs/spec/SPEC_ROADMAP.md`, never in current specs. |

## Feature scope (currently shipping)
- 5 game modes (single-player practice, ranked, multiplayer rooms, group quiz, daily challenge)
- Tier progression with prestige + cosmetics
- Energy, lifelines, comeback multiplier
- Missions, journey, achievements
- Leaderboards (weekly / season / all-time)
- Liturgical season events with score multiplier
- Church Group feature (Q-A…Q-O scope locked) + Quiz Set Professional Sprint 5
  (multi-mode, mastery, workflow, folders, scheduled quizzes, group leaderboard)
- Admin panel (AI generator, duplicate detection, audit log, configuration)
- Mobile (Capacitor) parity in progress
- i18n VN/EN with hardcoded-string validator

## Defer features (NOT shipped — see `docs/spec/SPEC_ROADMAP.md`)
Friend system, Premium, TV Host mode, Multi-leader groups, Sentry,
Offline play. **Never document these as shipped.**

## Spec hierarchy (source of truth)
See CLAUDE.md §"Spec hierarchy". Key files in `docs/spec/`:
- `SPEC_USER_v3.1.md` — tier/scoring/energy/lifeline/prestige/cosmetic/comeback/missions/journey/achievements/leaderboard/tournaments/mobile parity/i18n/sound-haptics/onboarding
- `SPEC_MULTIPLAYER.md` — 5 multiplayer modes, R1–R5 room lifecycle, STOMP events, Quản trò mode
- `SPEC_GROUP_v1.3.md` — Church Group (Q-A…Q-O), Quiz Set Sprint 5, scheduled quizzes, group leaderboard
- `SPEC_ADMIN_v3.1.md` — admin panel, AI generator, duplicate detection, audit log, configuration
- `SPEC_ROADMAP.md` — future / non-shipped features
- `BACKLOG.md` — code gaps vs canonical spec (BL-1…BL-N)

When spec ↔ code diverge, **spec wins** — code must catch up. Never edit spec to match code unless `DECISIONS.md` confirms.
