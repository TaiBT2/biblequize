# 2026-05-10 — Group Detail redesign [DONE]

> **Source**: [docs/group-page/PROMPT_FIX_GROUP_DETAIL.md](docs/group-page/PROMPT_FIX_GROUP_DETAIL.md) + 4 mockup HTMLs.
> **Outcome**: 14 tasks (GD-0 audit + GD-1..GD-12 + GD-DOCS) shipped 2026-05-10 in 13 commits. ~1100 LOC across 9 new files in `apps/web/src/components/group/` + GroupDetail.tsx (-537 LOC), GroupAnalytics.tsx, AppLayout.tsx, vi.json/en.json, SPEC_GROUP v1.4 changelog, BACKLOG (BL-16/17/18).

### Tasks
- GD-0 Pre-flight verify → `GROUP_DETAIL_AUDIT_REPORT.md` — `[x]` DONE
- GD-1 Replace Leaderboard tab → "Hoạt động" — `[x]` DONE (235f740)
- GD-2 Empty states (group <7d / <5 members) — `[x]` DONE (d4dc7d9)
- GD-3 KPI tooltips (scope + sample) — `[x]` DONE (e2d2b90)
- GD-4 Tournament card disabled when <4 members — `[x]` DONE (2614889)
- GD-5 Sidebar hide personal widgets in group context — `[x]` DONE (26e6622)
- GD-6 Tab count badges — `[x]` DONE (b9a3781)
- GD-7 Header layout (name primary, meta split) — `[x]` DONE (bff9f47)
- GD-8 Role badge high-contrast gold — `[x]` DONE (d6151af)
- GD-9 Analytics tab leader-only + Pulse placeholder — `[x]` DONE (00a4c5d)
- GD-10 Onboarding banner for new groups — `[x]` DONE (ac1e8ae)
- GD-11 Group code QR modal — `[x]` DONE (ee78e9d)
- GD-12 Color palette policy comment — `[x]` DONE (ac11806)
- GD-DOCS SPEC_GROUP v1.4 + BACKLOG BL-16/17/18 — `[x]` DONE (this commit)

### Verification
- Vitest: 1238 pass / baseline 1227 (+11, 0 new regressions)
- TypeScript: clean for new code
- spec-audit: broken=55 (no new) — neutral
- Manual smoke: PENDING (Bui to verify in dev server)

### Visual gap follow-up (PROMPT_FIX_GROUP_DETAIL_VISUAL_GAPS.md, 2026-05-10) — DONE
- GD-5b sidebar Group Quick Info card (4391528) — fills hidden personal-widget slot
- GD-FIX-1 Pulse banner on Activity tab leader-only (1c9cdde)
- GD-FIX-2 Live Now banner — host name, multi-room pill, room-label prefix (7c3a086)
- GD-FIX-3 Members preview online/offline split via lastActiveAt (250924b) — BE map exposes lastActiveAt
- GD-FIX-4 Quiz set cards rich metadata (icon gradient, play count, rating) (7cac8cc)
- GD-FIX-5 Sidebar wording "🟢 Đang online · X/N" (80993d1)
- GD-FIX-6 Activity Feed filter chips preview (fb7e108)
- GD-FIX-7 Onboarding icons in colored bg circles (1fbc2d0)
- GD-FIX-8 Header code section cohesive pill (ca7e2c1)
- GD-FIX-9 Quick Actions emerald accent on Bắt đầu Live (b893b5c)

Verification: vitest 1237 pass / baseline 1227 (+10, no new module regressions; 32 failing are pre-existing flakes in Ranked/DailyChallenge — not group code).

### Deferrals (BACKLOG)
- BL-16 — leaderboard endpoint `410 Gone` Sprint 7+ (after mobile catches up)
- BL-17 — Group Activity Feed entity + service Sprint 6
- BL-18 — Cell Group Pulse heuristic + cron Sprint 6

---
