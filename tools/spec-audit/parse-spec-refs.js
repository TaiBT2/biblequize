#!/usr/bin/env node
/**
 * parse-spec-refs.js — Extract code refs from docs/spec/*.md
 *
 * Modes:
 *   --json          (default) full index as JSON
 *   --by-file       invert mapping: file -> [spec sections]
 *   --orphans       spec sections with no code refs
 *   --undocumented  business-logic files with no spec ref
 *
 * Exit codes:
 *   0 on success
 *   1 on parse/IO error
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SPEC_DIR = path.join(REPO_ROOT, 'docs', 'spec');

// Paths considered "business logic" — should be referenced somewhere.
const BUSINESS_GLOBS = [
  { dir: 'apps/api/src/main/java/com/biblequiz/api', match: /Controller\.java$/, label: 'BE Controller' },
  { dir: 'apps/api/src/main/java/com/biblequiz/modules', match: /Service\.java$/, label: 'BE Service' },
  { dir: 'apps/web/src/pages', match: /\.tsx$/, exclude: /[\\/]admin[\\/]/, label: 'FE User Page' },
  { dir: 'apps/web/src/pages/admin', match: /\.tsx$/, label: 'FE Admin Page' },
];

// File extensions worth tracking as "code refs" inside specs.
const CODE_EXT_RE = /\.(java|ts|tsx|js|jsx|sql|yml|yaml)$/;

// Inline-code ref pattern. `path/to/file.ext` or `path/to/file.ext:N` or `path/to/file.ext:N-M`.
const REF_RE = /`([A-Za-z0-9_./\\-]+\.(?:java|ts|tsx|js|jsx|sql|yml|yaml))(?::(\d+)(?:-(\d+))?)?`/g;

function listSpecFiles() {
  if (!fs.existsSync(SPEC_DIR)) {
    throw new Error(`Spec dir not found: ${SPEC_DIR}`);
  }
  return fs.readdirSync(SPEC_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(SPEC_DIR, f));
}

function listBusinessFiles() {
  const out = [];
  for (const glob of BUSINESS_GLOBS) {
    const root = path.join(REPO_ROOT, glob.dir);
    if (!fs.existsSync(root)) continue;
    walk(root, (full) => {
      const rel = path.relative(REPO_ROOT, full).replace(/\\/g, '/');
      if (!glob.match.test(rel)) return;
      if (glob.exclude && glob.exclude.test(rel)) return;
      // Avoid double-counting Admin pages under FE User Page glob.
      if (glob.label === 'FE User Page' && /pages\/admin\//.test(rel)) return;
      out.push({ path: rel, label: glob.label });
    });
  }
  return out;
}

function walk(dir, fn) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, fn);
    else fn(full);
  }
}

/**
 * Parse one spec file → { sections: [...] }.
 * Section = block from one H2/H3 header to next H2/H3 (or EOF).
 * Inside each section, extract refs (skipping fenced code blocks).
 */
function parseSpec(specPath) {
  const text = fs.readFileSync(specPath, 'utf8');
  const lines = text.split(/\r?\n/);

  // Pass 1: collect headers (## or ###) with line numbers.
  const headers = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^```/.test(l)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(l);
    if (m) headers.push({ level: m[1].length, title: m[2], line: i + 1 });
  }

  if (headers.length === 0) return { sections: [] };

  // Pass 2: build sections (header N to header N+1 - 1, or EOF).
  const sections = headers.map((h, idx) => {
    const next = headers[idx + 1];
    const lineEnd = next ? next.line - 1 : lines.length;
    return { title: h.title, level: h.level, line_start: h.line, line_end: lineEnd, code_refs: [] };
  });

  // Pass 3: scan for refs, attribute to enclosing section, skip fenced code.
  inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^```/.test(l)) { inFence = !inFence; continue; }
    if (inFence) continue;

    REF_RE.lastIndex = 0;
    let m;
    while ((m = REF_RE.exec(l)) !== null) {
      const refPath = m[1].replace(/\\/g, '/');
      const lineN = m[2] ? parseInt(m[2], 10) : null;
      const lineEnd = m[3] ? parseInt(m[3], 10) : null;
      // Find owning section: the latest header where line_start <= i+1 <= line_end.
      const sec = findSection(sections, i + 1);
      if (!sec) continue;
      sec.code_refs.push({ file: refPath, line: lineN, line_end: lineEnd, source_line: i + 1 });
    }
  }

  return { sections };
}

function findSection(sections, lineNo) {
  // Sections are ordered. Linear scan is fine for small spec files.
  for (let i = sections.length - 1; i >= 0; i--) {
    const s = sections[i];
    if (s.line_start <= lineNo && lineNo <= s.line_end) return s;
  }
  return null;
}

// Cache of basename → matching paths under tracked source roots.
const SEARCH_ROOTS = ['apps/api/src', 'apps/web/src', 'scripts', 'docs/dev'];
let _basenameIndex = null;
function basenameIndex() {
  if (_basenameIndex) return _basenameIndex;
  _basenameIndex = new Map();
  for (const root of SEARCH_ROOTS) {
    const abs = path.join(REPO_ROOT, root);
    if (!fs.existsSync(abs)) continue;
    walk(abs, (full) => {
      const rel = path.relative(REPO_ROOT, full).replace(/\\/g, '/');
      const base = path.basename(rel);
      if (!_basenameIndex.has(base)) _basenameIndex.set(base, []);
      _basenameIndex.get(base).push(rel);
    });
  }
  return _basenameIndex;
}

/**
 * Validate one ref against filesystem.
 * Bare filenames (no `/`) resolve via basename index; ambiguous matches → broken.
 * Returns { ok: true, resolved? } or { ok: false, reason: '...' }.
 */
function validateRef(ref) {
  let target = ref.file;
  let bareResolved = false;
  if (!target.includes('/')) {
    const matches = basenameIndex().get(target) || [];
    if (matches.length === 0) return { ok: false, reason: 'bare_filename_not_found' };
    if (matches.length > 1) return { ok: false, reason: `bare_filename_ambiguous_(${matches.length}_matches)` };
    target = matches[0];
    bareResolved = true;
  }
  const abs = path.join(REPO_ROOT, target);
  if (!fs.existsSync(abs)) return { ok: false, reason: 'file_not_found' };
  const stat = fs.statSync(abs);
  if (!stat.isFile()) return { ok: false, reason: 'not_a_file' };
  if (ref.line === null) return { ok: true, resolved: bareResolved ? target : undefined };
  const lineCount = fs.readFileSync(abs, 'utf8').split(/\r?\n/).length;
  if (ref.line > lineCount) return { ok: false, reason: `line_${ref.line}_out_of_range_(file_has_${lineCount})` };
  if (ref.line_end !== null && ref.line_end > lineCount) {
    return { ok: false, reason: `line_end_${ref.line_end}_out_of_range_(file_has_${lineCount})` };
  }
  return { ok: true, resolved: bareResolved ? target : undefined };
}

function buildIndex() {
  const specFiles = listSpecFiles();
  const specs = {};
  let totalSections = 0;
  let sectionsWithRefs = 0;
  let totalRefs = 0;
  const referencedFiles = new Set();

  for (const sp of specFiles) {
    const name = path.basename(sp);
    const parsed = parseSpec(sp);
    specs[name] = parsed;
    totalSections += parsed.sections.length;
    for (const s of parsed.sections) {
      if (s.code_refs.length > 0) sectionsWithRefs++;
      totalRefs += s.code_refs.length;
      for (const r of s.code_refs) referencedFiles.add(r.file);
    }
  }

  return {
    specs,
    stats: {
      total_specs: specFiles.length,
      total_sections: totalSections,
      sections_with_refs: sectionsWithRefs,
      total_code_refs: totalRefs,
      unique_code_files_referenced: referencedFiles.size,
    },
    referenced_files: Array.from(referencedFiles).sort(),
  };
}

function modeJson(index) {
  process.stdout.write(JSON.stringify(index, null, 2) + '\n');
}

function modeByFile(index) {
  const byFile = {};
  for (const [specName, parsed] of Object.entries(index.specs)) {
    for (const s of parsed.sections) {
      for (const r of s.code_refs) {
        if (!byFile[r.file]) byFile[r.file] = [];
        byFile[r.file].push({
          spec: specName,
          section: s.title,
          spec_line: r.source_line,
          ref_line: r.line,
          ref_line_end: r.line_end,
        });
      }
    }
  }
  process.stdout.write(JSON.stringify(byFile, null, 2) + '\n');
}

function modeOrphans(index) {
  const out = [];
  for (const [specName, parsed] of Object.entries(index.specs)) {
    for (const s of parsed.sections) {
      if (s.code_refs.length === 0) {
        out.push({ spec: specName, section: s.title, line: s.line_start });
      }
    }
  }
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}

function modeUndocumented(index) {
  const referenced = new Set(index.referenced_files);
  const business = listBusinessFiles();
  const out = [];
  for (const f of business) {
    if (!referenced.has(f.path)) out.push(f);
  }
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}

function modeValidate(index) {
  const broken = [];
  for (const [specName, parsed] of Object.entries(index.specs)) {
    for (const s of parsed.sections) {
      for (const r of s.code_refs) {
        const v = validateRef(r);
        if (!v.ok) {
          broken.push({
            spec: specName,
            section: s.title,
            file: r.file,
            line: r.line,
            line_end: r.line_end,
            spec_line: r.source_line,
            reason: v.reason,
          });
        }
      }
    }
  }
  process.stdout.write(JSON.stringify(broken, null, 2) + '\n');
}

function main() {
  const mode = process.argv[2] || '--json';
  let index;
  try {
    index = buildIndex();
  } catch (e) {
    process.stderr.write(`parse-spec-refs: ${e.message}\n`);
    process.exit(1);
  }
  switch (mode) {
    case '--json': modeJson(index); break;
    case '--by-file': modeByFile(index); break;
    case '--orphans': modeOrphans(index); break;
    case '--undocumented': modeUndocumented(index); break;
    case '--validate': modeValidate(index); break;
    default:
      process.stderr.write(`Unknown mode: ${mode}\nUse --json | --by-file | --orphans | --undocumented | --validate\n`);
      process.exit(1);
  }
}

main();
