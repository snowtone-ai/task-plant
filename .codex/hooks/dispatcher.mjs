#!/usr/bin/env node
// pm-zero v9.3 — Codex CLI Hook Dispatcher
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
      warnHookFailure('codex:SessionStart', error);
    }
  },

  async PreToolUse() {
    try {
      const toolInput = process.env.TOOL_INPUT || '';
      const dangerous = [
        /rm\s+-rf/,
        /git\s+push\s+--force/,
        /git\s+push\s+-f\b/,
        /git\s+reset\s+--hard/,
        /git\s+clean\s+-fd/,
        /sudo\s+/,
      ];
      for (const pattern of dangerous) {
        if (pattern.test(toolInput)) {
          console.error('[pm-zero] BLOCKED: dangerous command detected');
          process.exit(1);
        }
      }
    } catch (error) {
      warnHookFailure('codex:PreToolUse', error);
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
      warnHookFailure('codex:PostToolUseFailure', error);
    }
  },

  async Stop() {
    try {
      const stateFile = path.join(projectRoot, 'docs', 'state.md');
      const state = await fs.readFile(stateFile, 'utf-8');
      const doingSection = state.split('## Doing')[1]?.split('##')[0] || '';
      const doingItems = doingSection.match(/- \[ \] .+/g) || [];
      if (doingItems.length > 0) {
        console.log(
          `[pm-zero] Warning: ${doingItems.length} task(s) still in Doing. Update state.md if completed.`
        );
      }
    } catch (error) {
      warnHookFailure('codex:Stop', error);
    }
  },
};

if (event && handlers[event]) {
  try {
    await handlers[event]();
  } catch (error) {
    warnHookFailure(`codex:${event}`, error);
  }
}
