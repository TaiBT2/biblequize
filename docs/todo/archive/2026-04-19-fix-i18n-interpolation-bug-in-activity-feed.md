# 2026-04-19 — Fix i18n interpolation bug in Activity Feed [DONE]

### Task AF-1: Remove broken HTML tags + placeholder mismatch
- Status: [x] DONE
- File(s): apps/web/src/i18n/vi.json + en.json
- Root cause: 3 lỗi chồng nhau trong `home.activity*`:
  1. `<b>` HTML tags trong translation string — i18next render literal text (không parse HTML by default)
  2. `{{name}}` placeholder tồn tại trong translation nhưng call site không pass `name` (vì name ĐÃ render bold separately trong JSX) → literal "{{name}}"
  3. `{{count}}` trong JSON vs `{ days: 30 }` từ call site → mismatch
- Fix:
  - Bỏ `<b>{{name}}</b>` prefix khỏi 3 keys (activityReachedTier, activityJoinedGroup, activityStreak) — name đã bold trong JSX rồi
  - Bỏ `<b>` xung quanh `{{tier}}` — plain text v1 (polish bold tier sau bằng `Trans` component nếu cần)
  - Rename `{{count}}` → `{{days}}` trong activityStreak để match call site
- Follow-up (không làm): dùng `Trans` component + custom `<bold>` tag để tier name lại được emphasize. Scope v2.
- Commit: "fix(web): remove broken HTML tags and placeholder mismatches in activity feed i18n"
