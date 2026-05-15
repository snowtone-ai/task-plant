#!/usr/bin/env node
// pm-zero v9.3 — Claude Code Hook Dispatcher
import fs from 'node:fs/promises';
import path from 'node:path';
import { redact, warnHookFailure } from '../../scripts/lib/redact.mjs';

const event = process.argv.find((a) => a.startsWith('--event='))?.split('=')[1];
const projectRoot = path.resolve(import.meta.dirname, '..', '..');

const handlers = {
  async SessionStart() {
    try {
      const stateFile = path.join(projectRoot, 'docs', 'state.md');
      const state = await fs.readFile(stateFile, 'utf-8');
      const current = state.split('## Current')[1]?.split('##')[0]?.trim() || '';
      if (current) {
        const lines = current.split('\n').map((l) => l.trim()).filter(Boolean);
        console.log(`[pm-zero] State: ${lines.join(' | ')}`);
      }
    } catch (error) {
      warnHookFailure('claude:SessionStart', error);
    }
  },

  async PostToolUseFailure() {
    try {
      const input = process.env.TOOL_RESULT || '';
      if (input) {
        console.error(
          `[pm-zero] Tool failure (redacted): ${redact(input).slice(0, 200)}`
        );
      }
    } catch (error) {
      warnHookFailure('claude:PostToolUseFailure', error);
    }
  },

  async UserPromptSubmit() {
    try {
      const stateFile = path.join(projectRoot, 'docs', 'state.md');
      const state = await fs.readFile(stateFile, 'utf-8');
      const doneSection = state.split('## Done')[1]?.split('##')[0] || '';
      const doneItems = doneSection.match(/- \[x\] .+/g) || [];
      if (doneItems.length > 0) {
        console.log(
          `[pm-zero] ${doneItems.length} tasks already done. Check state.md before re-implementing.`
        );
      }
    } catch (error) {
      warnHookFailure('claude:UserPromptSubmit', error);
    }
  },
};

if (event && handlers[event]) {
  try {
    await handlers[event]();
  } catch (error) {
    warnHookFailure(`claude:${event}`, error);
  }
}
