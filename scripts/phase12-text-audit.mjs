#!/usr/bin/env node
/**
 * Phase 12 — fail CI if forbidden substrings appear in shipping TS/TSX (excluding tests).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const BANNED = [
  /\bmockCatches\b/i,
  /\bMockCatch\b/,
  /\bTODO:/,
  /\bFIXME:/,
  /\bXXX\b/,
  /\blorem ipsum\b/i,
];

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  '.turbo',
]);

const exts = new Set(['.ts', '.tsx']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (exts.has(path.extname(name))) {
      if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) continue;
      out.push(full);
    }
  }
  return out;
}

let failed = false;
for (const file of walk(path.join(ROOT, 'apps'))) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, 'utf8');
  for (const rx of BANNED) {
    if (rx.test(text)) {
      console.error(`Phase 12 audit: ${rel} matches ${rx}`);
      failed = true;
    }
  }
}
for (const file of walk(path.join(ROOT, 'packages'))) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, 'utf8');
  for (const rx of BANNED) {
    if (rx.test(text)) {
      console.error(`Phase 12 audit: ${rel} matches ${rx}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Phase 12 text audit: OK');
