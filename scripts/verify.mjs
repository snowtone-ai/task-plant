#!/usr/bin/env node
// pm-zero v9.3 -- Unified Verification Script
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const results = [];

function run(label, command) {
  console.log(`\n--- ${label} ---`);
  try {
    execSync(command, { cwd: projectRoot, stdio: 'inherit', timeout: 120_000 });
    results.push({ label, status: 'PASS' });
  } catch (e) {
    results.push({ label, status: 'FAIL', code: e.status });
  }
}

try {
  await fs.access(path.join(projectRoot, 'pnpm-lock.yaml'));
  console.log('[verify] Package manager: pnpm');
} catch {
  console.warn('[verify] Warning: pnpm-lock.yaml not found');
}

const requiredFiles = [
  'AGENTS.md',
  'CLAUDE.md',
  'OS-KERNEL.md',
  'MEMORY.md',
  'CONTEXT.md',
  'HANDOFF-JA.md',
  'tasks.md',
  'docs/vision.md',
  'docs/state.md',
  'docs/decisions.md',
  'docs/issues.md',
  'docs/repo-map.md',
  '.claude/settings.json',
  '.claude/hooks/dispatcher.mjs',
  '.claude/skills/index.md',
];

console.log('\n--- Adapter Integrity ---');
for (const file of requiredFiles) {
  try {
    await fs.access(path.join(projectRoot, file));
    console.log(`  ✓ ${file}`);
  } catch {
    console.error(`  ✗ ${file} MISSING`);
    results.push({ label: `file:${file}`, status: 'FAIL' });
  }
}

run('Lint', 'pnpm lint');
run('Typecheck', 'pnpm typecheck');
run('Test', 'pnpm test');
run('Build', 'pnpm build');

console.log('\n=== Verification Summary ===');
for (const r of results) {
  console.log(`  ${r.status === 'PASS' ? '✓' : '✗'} ${r.label}`);
}

const failed = results.filter((r) => r.status === 'FAIL');
if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
  process.exit(0);
}
