#!/usr/bin/env bash
# audit.sh — orchestrator for spec drift detection.
# Output: tools/spec-audit/REPORT.md
# Exit codes: 0 ok, 1 broken refs, 2 undocumented business-logic files.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# All paths handed to Node must be relative to repo root, because Git Bash on
# Windows uses POSIX paths but bundled Node uses Windows-native paths and
# can't resolve `/d/...` or `/tmp/...`. Run everything from repo root.
cd "$REPO_ROOT"
PARSER="tools/spec-audit/parse-spec-refs.js"
REPORT="tools/spec-audit/REPORT.md"
TMP="tools/spec-audit/.audit-tmp"
mkdir -p "$TMP"
trap 'rm -rf "$TMP"' EXIT

echo "spec-audit: building index..."
node "$PARSER" --json > "tools/spec-audit/.audit-tmp/index.json"

echo "spec-audit: validating refs..."
node "$PARSER" --validate > "tools/spec-audit/.audit-tmp/broken.json"

echo "spec-audit: scanning orphans..."
node "$PARSER" --orphans > "tools/spec-audit/.audit-tmp/orphans.json"

echo "spec-audit: scanning undocumented files..."
node "$PARSER" --undocumented > "tools/spec-audit/.audit-tmp/undoc.json"

# Stats from index
TOTAL_SPECS=$(node -e "console.log(require('./tools/spec-audit/.audit-tmp/index.json').stats.total_specs)")
TOTAL_SECTIONS=$(node -e "console.log(require('./tools/spec-audit/.audit-tmp/index.json').stats.total_sections)")
SECTIONS_WITH_REFS=$(node -e "console.log(require('./tools/spec-audit/.audit-tmp/index.json').stats.sections_with_refs)")
TOTAL_REFS=$(node -e "console.log(require('./tools/spec-audit/.audit-tmp/index.json').stats.total_code_refs)")
UNIQUE_FILES=$(node -e "console.log(require('./tools/spec-audit/.audit-tmp/index.json').stats.unique_code_files_referenced)")
BROKEN_COUNT=$(node -e "console.log(require('./tools/spec-audit/.audit-tmp/broken.json').length)")
ORPHAN_COUNT=$(node -e "console.log(require('./tools/spec-audit/.audit-tmp/orphans.json').length)")
UNDOC_COUNT=$(node -e "console.log(require('./tools/spec-audit/.audit-tmp/undoc.json').length)")

# Coverage by file label
COVERAGE_JSON=$(node -e '
const idx = require("./tools/spec-audit/.audit-tmp/index.json");
const referenced = new Set(idx.referenced_files);
const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();
const globs = [
  { dir: "apps/api/src/main/java/com/biblequiz/api", match: /Controller\.java$/, label: "BE Controller" },
  { dir: "apps/api/src/main/java/com/biblequiz/modules", match: /Service\.java$/, label: "BE Service" },
  { dir: "apps/web/src/pages", match: /\.tsx$/, exclude: /[\\\/]admin[\\\/]/, label: "FE User Page" },
  { dir: "apps/web/src/pages/admin", match: /\.tsx$/, label: "FE Admin Page" },
];
function walk(d, fn) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, e.name);
    if (e.isDirectory()) walk(full, fn); else fn(full);
  }
}
const out = {};
for (const g of globs) {
  const root = path.join(ROOT, g.dir);
  if (!fs.existsSync(root)) { out[g.label] = { total: 0, ref: 0 }; continue; }
  let total = 0, ref = 0;
  walk(root, (full) => {
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (!g.match.test(rel)) return;
    if (g.exclude && g.exclude.test(rel)) return;
    if (g.label === "FE User Page" && /pages\/admin\//.test(rel)) return;
    total++;
    if (referenced.has(rel)) ref++;
  });
  out[g.label] = { total, ref };
}
console.log(JSON.stringify(out));
')

# Render REPORT.md
{
  echo "# Spec Audit Report"
  echo ""
  echo "**Generated:** $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "**Specs scanned:** $TOTAL_SPECS files in \`docs/spec/\`"
  echo ""
  echo "## Summary"
  echo ""
  echo "| Metric | Count |"
  echo "|---|---|"
  echo "| Total spec sections | $TOTAL_SECTIONS |"
  echo "| Sections with code refs | $SECTIONS_WITH_REFS |"
  echo "| Total code refs | $TOTAL_REFS |"
  echo "| Unique code files referenced | $UNIQUE_FILES |"
  echo "| **Broken refs (HIGH)** | **$BROKEN_COUNT** |"
  echo "| Orphan sections (MEDIUM) | $ORPHAN_COUNT |"
  echo "| Undocumented business files (MEDIUM) | $UNDOC_COUNT |"
  echo ""
  echo "## Stats — file-level coverage"
  echo ""
  echo "| Concern | Files in scope | Files referenced | Coverage |"
  echo "|---|---|---|---|"
  node -e '
    const c = '"$COVERAGE_JSON"';
    for (const [label, v] of Object.entries(c)) {
      const pct = v.total === 0 ? "N/A" : Math.round(v.ref / v.total * 100) + "%";
      console.log(`| ${label} | ${v.total} | ${v.ref} | ${pct} |`);
    }
  '
  echo ""
  echo "## Broken Refs (HIGH)"
  echo ""
  if [ "$BROKEN_COUNT" -eq 0 ]; then
    echo "_No broken refs._"
  else
    echo "> Spec đề cập file:line không tồn tại — code đã đổi, spec chưa update."
    echo ""
    echo "| Spec | Section | File | Lines | Spec line | Reason |"
    echo "|---|---|---|---|---|---|"
    node -e '
      const items = require("'"./tools/spec-audit/.audit-tmp/broken.json"'");
      for (const b of items) {
        const lines = b.line === null ? "(no line)" : (b.line_end ? b.line + "-" + b.line_end : String(b.line));
        const sec = (b.section || "").replace(/\|/g, "\\|");
        console.log(`| ${b.spec} | ${sec} | \`${b.file}\` | ${lines} | ${b.spec_line} | ${b.reason} |`);
      }
    '
  fi
  echo ""
  echo "## Orphan Sections (MEDIUM)"
  echo ""
  if [ "$ORPHAN_COUNT" -eq 0 ]; then
    echo "_No orphan sections._"
  else
    echo "> Spec sections không có file:line ref — possible vaporware hoặc cần thêm refs."
    echo ""
    echo "_(Showing first 30 — full list via \`node parse-spec-refs.js --orphans\`.)_"
    echo ""
    echo "| Spec | Section | Spec line |"
    echo "|---|---|---|"
    node -e '
      const items = require("'"./tools/spec-audit/.audit-tmp/orphans.json"'").slice(0, 30);
      for (const o of items) {
        const sec = (o.section || "").replace(/\|/g, "\\|");
        console.log(`| ${o.spec} | ${sec} | ${o.line} |`);
      }
    '
  fi
  echo ""
  echo "## Undocumented Files (MEDIUM)"
  echo ""
  if [ "$UNDOC_COUNT" -eq 0 ]; then
    echo "_All business-logic files are referenced somewhere._"
  else
    echo "> Files thuộc business logic core không được reference trong spec nào."
    echo ""
    echo "_(Showing first 30 — full list via \`node parse-spec-refs.js --undocumented\`.)_"
    echo ""
    echo "| Label | File |"
    echo "|---|---|"
    node -e '
      const items = require("'"./tools/spec-audit/.audit-tmp/undoc.json"'").slice(0, 30);
      for (const u of items) console.log(`| ${u.label} | \`${u.path}\` |`);
    '
  fi
  echo ""
  echo "---"
  echo ""
  echo "_Run \`bash tools/spec-audit/audit.sh\` to regenerate. See \`tools/spec-audit/README.md\`._"
} > "$REPORT"

echo "spec-audit: report written to $REPORT"
echo "spec-audit: broken=$BROKEN_COUNT orphans=$ORPHAN_COUNT undocumented=$UNDOC_COUNT"

if [ "$BROKEN_COUNT" -gt 0 ]; then exit 1; fi
if [ "$UNDOC_COUNT" -gt 0 ]; then exit 2; fi
exit 0
