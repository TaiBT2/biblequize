#!/usr/bin/env node
// PreToolUse hook for Write|Edit.
// Blocks attempts to append a `## YYYY-MM-DD — ...` section to the root TODO.md.
// Rationale: root TODO.md is index-only; task detail must live in docs/todo/active/<slug>.md.
// See CLAUDE.md §Quy trình quản lý Task.

import fs from 'node:fs';

let raw = '';
try {
  raw = fs.readFileSync(0, 'utf-8');
} catch {
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const toolName = payload.tool_name;
const toolInput = payload.tool_input || {};
const filePath = (toolInput.file_path || '').replace(/\\/g, '/');

if (!filePath) process.exit(0);

const parts = filePath.split('/').filter(Boolean);
const leaf = parts[parts.length - 1] || '';
const parentLeaf = parts[parts.length - 2] || '';

// Only target root TODO.md. Allow any TODO.md nested under docs/todo/*.
if (leaf !== 'TODO.md') process.exit(0);
if (['todo', 'active', 'archive'].includes(parentLeaf)) process.exit(0);

let content = '';
if (toolName === 'Write') content = toolInput.content || '';
else if (toolName === 'Edit') content = toolInput.new_string || '';
else process.exit(0);

const SECTION_RE = /^## \d{4}-\d{2}-\d{2}\s+[—–-]/m;
if (SECTION_RE.test(content)) {
  const msg = [
    'BLOCKED: root TODO.md is index-only — do NOT append "## YYYY-MM-DD — ..." sections here.',
    'Create docs/todo/active/YYYY-MM-DD-<slug>.md instead, then add 1 row to the Active table in TODO.md.',
    'Shortcut: /new-task <slug>. See CLAUDE.md §Quy trình quản lý Task.'
  ].join('\n');
  process.stderr.write(msg + '\n');
  process.exit(2);
}

process.exit(0);
