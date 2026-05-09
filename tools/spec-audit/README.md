# Spec Audit Tool

Detect drift giữa specs (`docs/spec/`) và code reality.

## Run

```bash
bash tools/spec-audit/audit.sh
# Output: tools/spec-audit/REPORT.md
```

Standalone parser modes (debug):

```bash
node tools/spec-audit/parse-spec-refs.js --json           # full index
node tools/spec-audit/parse-spec-refs.js --by-file        # invert: file -> sections
node tools/spec-audit/parse-spec-refs.js --orphans        # sections with 0 refs
node tools/spec-audit/parse-spec-refs.js --undocumented   # business files with no spec ref
node tools/spec-audit/parse-spec-refs.js --validate       # broken refs (file:line wrong)
```

## Khi nào chạy

- Sau mỗi feature commit (manual hoặc qua workflow)
- Trước khi merge to main
- Hàng tuần — drift early warning

## Exit codes

| Code | Nghĩa |
|---|---|
| 0 | All good |
| 1 | Broken refs (file:line không tồn tại) |
| 2 | Undocumented business logic files |

> Exit code phản ánh nghiêm trọng nhất: nếu cả broken + undocumented → exit 1 (broken thắng).

## Ref pattern detected

Inline-code spans trong markdown:

- `` `apps/web/src/data/tiers.ts` `` — file only
- `` `apps/api/.../Controller.java:42` `` — file + line
- `` `apps/api/.../Service.java:42-89` `` — file + line range

Extensions tracked: `.java`, `.ts`, `.tsx`, `.js`, `.jsx`, `.sql`, `.yml`, `.yaml`.

> Refs inside fenced code blocks (` ``` `) are skipped — those are examples, not authoritative refs.

## Business-logic scope (for `--undocumented`)

| Label | Path glob |
|---|---|
| BE Controller | `apps/api/src/main/java/com/biblequiz/api/**/*Controller.java` |
| BE Service | `apps/api/src/main/java/com/biblequiz/modules/**/*Service.java` |
| FE User Page | `apps/web/src/pages/*.tsx` (excluding `admin/`) |
| FE Admin Page | `apps/web/src/pages/admin/**/*.tsx` |

## Output: REPORT.md

4 sections:
- **Broken refs (HIGH)** — fix ngay (update spec line numbers hoặc remove obsolete ref)
- **Orphan sections (MEDIUM)** — review (vaporware? hoặc cần thêm refs)
- **Undocumented files (MEDIUM)** — add spec ref hoặc note BL-N
- **Stats** — coverage % per concern (track over time)

## Limitations

- Doesn't detect "spec says X, code does Y" — only structural drift (refs missing/broken).
- Doesn't parse anchors in non-code files (`.md`, `.json` keys).
- Line range validation is loose: only checks `line ≤ file_line_count`, not whether content at that line still matches spec intent.
