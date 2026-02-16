# Hooks Directory

## Purpose

Event-driven automation scripts that execute before or after Claude Code tool calls.

## Overview

This directory contains 3 hook implementations that intercept tool calls to enforce security policies, prevent access to sensitive or heavy directories, and ensure code quality. Hooks are configured in `settings.json` and run automatically.

## Key Files

| File | Purpose | Trigger |
|------|---------|---------|
| `README.md` | Hook documentation and setup guide | N/A |
| `blind.cjs` | Block access to heavy directories | PreToolUse (Bash, Read, Grep, Glob) |
| `blind.sh` | Shell implementation of blind hook | Called by blind.cjs |
| `secrets-aware.cjs` | Detect and warn about secrets | PreToolUse (Bash, Read, Grep, Glob) |
| `secrets-aware.sh` | Shell implementation of secrets hook | Called by secrets-aware.cjs |
| `format-code.cjs` | Auto-format code after Write/Edit | PostToolUse (Write, Edit) |

## Patterns & Conventions

- **Dual Implementation**: PreToolUse hooks have `.cjs` (Node.js) and `.sh` (shell) versions
- **PreToolUse Trigger**: Hooks run before tool execution (can block)
- **PostToolUse Trigger**: Hooks run after tool execution (non-blocking)
- **Exit Codes**: Non-zero exit blocks the tool call (PreToolUse only)
- **Error Messages**: Clear messages explain why access was blocked

## Hook Configuration (settings.json)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Read|Grep|Glob",
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/blind.cjs"
          },
          {
            "type": "command",
            "command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/secrets-aware.cjs"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/format-code.cjs"
          }
        ]
      }
    ]
  }
}
```

## Dependencies

- **Internal**: Configured in `settings.json`
- **External**: Node.js runtime, shell environment
- **Optional**: Formatters (prettier, ruff, gofmt, rustfmt) for format-code hook

## Common Tasks

- **Add new hook**: Create `.cjs` file, add to `settings.json` hooks array
- **Modify blocked patterns**: Edit the hook script's pattern matching
- **Disable hook**: Remove from `settings.json` or set `disabled: true`

## Important Notes

- `blind.cjs` blocks: `node_modules/`, `__pycache__/`, `.git/`, `dist/`, `build/`, `.next/`, `venv/`
- `secrets-aware.cjs` warns about: `.env`, `credentials.json`, API keys, tokens
- `format-code.cjs` formats: JS/TS (prettier), Python (ruff), Go (gofmt), Rust (rustfmt)
- Hooks receive tool input via stdin as JSON
- Use `${CLAUDE_PROJECT_DIR}` for project-relative paths
- Hook output goes to stderr for user visibility
