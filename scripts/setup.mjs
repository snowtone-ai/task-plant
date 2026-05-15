#!/usr/bin/env node
// pm-zero v9.3 -- Setup Script
import fs from 'node:fs/promises';

const dirs = [
  'docs',
  'scripts',
  '.claude/hooks',
  '.claude/skills',
  '.codex/hooks',
  'templates/agents',
  'templates/rules',
  'screenshots',
  'logs',
];

for (const dir of dirs) {
  await fs.mkdir(dir, { recursive: true });
  console.log(`created: ${dir}`);
}

console.log('pm-zero v9.3 directory structure ready.');
