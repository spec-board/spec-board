# Hooks

Cross-platform hooks for Claude Code security, performance, and code quality.

## Available Hooks

| Hook | Purpose | Trigger | Config File |
|------|---------|---------|-------------|
| `blind.cjs` | Blocks heavy directories (node_modules, etc.) | PreToolUse | `.claudeignore` |
| `secrets-aware.cjs` | Protects secrets while providing awareness | PreToolUse | `.secretsignore` |
| `format-code.cjs` | Auto-formats code after Write/Edit | PostToolUse | Project formatters |

---

# Blind Hook

Cross-platform hook that blocks Claude Code from accessing heavy directories while providing awareness of their existence.

## Overview

The Blind hook prevents Claude from reading or navigating into directories that typically contain large amounts of files that aren't useful for code understanding. **Unlike a complete block, it provides awareness** - showing that directories exist with item counts and top-level listings.

## Awareness Feature

When blocking, the hook provides:
- Directory existence confirmation: `[EXISTS: N items]`
- Package count for node_modules: `(247 packages)`
- Top-level listing (first 10 items)
- Clear indication if directory doesn't exist: `[NOT FOUND]`

### Example Output

```
HEAVY DIRECTORY ACCESS BLOCKED - Directory exists:

/project/node_modules/ [EXISTS: 847 items (847 packages)]

Top-level contents (first 10):
  @babel/
  @types/
  react/
  typescript/
  lodash/
  express/
  webpack/
  eslint/
  prettier/
  jest/
  ... and 837 more

(Full contents blocked for performance - directory EXISTS and is accessible)
```

## Blocked Patterns

Default patterns (configured in `.claude/.claudeignore`):
- `node_modules` - NPM dependencies
- `__pycache__` - Python cache
- `venv`, `.venv` - Python virtual environments
- `.git` - Git internal files
- `dist` - Distribution builds
- `build` - Build artifacts

## Blocking Rules

| Operation | Blocked | Allowed |
|-----------|---------|---------|
| File paths | `node_modules/package.json` | `src/index.js` |
| Directory access | `cd node_modules`, `ls build/` | `npm build`, `yarn build` |
| Grep/Glob | `**/node_modules/**` | `src/**/*.ts` |

## Configuration

### Enable Hook

Add to `.claude/settings.json`:

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
          }
        ]
      }
    ]
  }
}
```

### Customize Blocked Patterns

Edit `.claude/.claudeignore`:

```bash
# Lines starting with # are comments
# One pattern per line
node_modules
__pycache__
.git
dist
build
vendor
.cache
```

## Platform Support

| Platform | Implementation |
|----------|----------------|
| macOS/Linux | `blind.sh` (Bash) |
| Windows | `blind.ps1` (PowerShell) |
| WSL | `blind.sh` (Bash) |

The `blind.cjs` dispatcher automatically detects the platform and runs the appropriate script.

## Requirements

- Node.js >= 18.0.0

## Testing

```bash
# Test blocking (should exit with code 2)
echo '{"tool_input":{"command":"ls node_modules"}}' | node .claude/hooks/blind.cjs
echo $?  # Should output: 2

# Test allowing (should exit with code 0)
echo '{"tool_input":{"command":"npm build"}}' | node .claude/hooks/blind.cjs
echo $?  # Should output: 0
```

## Exit Codes

- `0` - Command allowed
- `2` - Command blocked or error occurred

---

# Secrets Aware Hook

Cross-platform hook that protects secrets while providing awareness of their existence.

## Overview

The Secrets Aware hook blocks Claude from reading AND writing actual secret values, but provides awareness that secrets exist with masked output format: `VAR_NAME=[SET:12chars]`

This prevents:
- Accidental exposure of API keys, passwords, tokens
- Claude assuming env vars are "not set" when they actually exist
- Security risks from secrets appearing in conversation logs
- Unauthorized modification of secret files via shell commands

## Protected Resources

### Secret Files (configured in `.claude/.secretsignore`)

Default patterns:
- `.env*` - Environment files (`.env`, `.env.local`, `.env.production`)
- `*.pem`, `*.key` - Certificates and private keys
- `credentials.json`, `secrets.*` - Credential files
- `*-credentials.json`, `*-secret.json` - Named credential files
- Cloud provider credentials (AWS, GCloud, Firebase)
- SSH keys (`id_rsa`, `id_ed25519`, etc.)

### Safe Files (Allowlist - NOT blocked)

Template files that contain placeholders, not real secrets:
- `.env.example`, `.env.sample`, `.env.template`, `.env.defaults`
- `example.env`, `sample.env`, `template.env`

### System Environment Variables

Auto-masked patterns (case-insensitive):
- `*KEY*`, `*SECRET*`, `*PASS*`, `*TOKEN*`
- `*API*`, `*AUTH*`, `*CREDENTIAL*`
- `*PRIVATE*`, `*CERT*`, `*_PWD*`, `*PWD_*`

Safe vars (not masked): `PATH`, `HOME`, `USER`, `NODE_ENV`, `SHELL`, `PWD`, etc.

## Behavior Matrix

### Read Operations

| Command | Action | Output |
|---------|--------|--------|
| `cat .env` | BLOCKED | `API_KEY=[SET:32chars]` |
| `Read .env` | BLOCKED | `DB_PASS=[SET:16chars]` |
| `grep pass .env` | BLOCKED | Suggestion to use existence check |
| `printenv API_KEY` | BLOCKED | `API_KEY=[SET:32chars]` |
| `printenv` (list all) | ALLOWED | Sensitive values masked |
| `echo $VAR` | ALLOWED | Can't reliably intercept |
| `cat config.json` | ALLOWED | Not in secret patterns |
| `cat .env.example` | ALLOWED | Template file (allowlist) |

### Write Operations

| Command | Action | Output |
|---------|--------|--------|
| `echo x > .env` | BLOCKED | Write blocked message |
| `printf x >> .env` | BLOCKED | Write blocked message |
| `tee .env` | BLOCKED | Write blocked message |
| `cat > .env` | BLOCKED | Write blocked message |
| `sed -i 's/x/y/' .env` | BLOCKED | Write blocked message |
| `cp other.txt .env` | BLOCKED | Write blocked message |
| `mv temp.txt .env` | BLOCKED | Write blocked message |
| `dd if=x of=.env` | BLOCKED | Write blocked message |
| `echo x > .env.example` | ALLOWED | Template file (allowlist) |

## Known Limitations

The hook cannot intercept:
- **Variable expansion**: `FILE=".env" && echo x > $FILE` bypasses detection
- **Shell variable interpolation**: Cannot reliably intercept `$VAR` references
- **Complex command chaining**: Some elaborate command chains may evade pattern matching
- **Indirect writes**: Commands that write via subprocesses or scripts

These limitations exist because the hook performs static pattern matching on command strings, not runtime execution analysis.

## Output Format

```
API_KEY=[SET:32chars]
DATABASE_URL=[SET:45chars]
JWT_SECRET=[SET:64chars]
NODE_ENV=development        # non-sensitive, shown as-is
```

## Configuration

### Enable Hook

Add to `.claude/settings.json`:

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
    ]
  }
}
```

### Customize Secret Patterns

Edit `.claude/.secretsignore`:

```bash
# Lines starting with # are comments
# One pattern per line

# Environment files
.env
.env.*

# Custom patterns for your project
config/production.yml
firebase-admin.json
my-app-secrets.json
```

## Platform Support

| Platform | Implementation |
|----------|----------------|
| macOS/Linux | `secrets-aware.sh` (Bash) |
| Windows | `secrets-aware.ps1` (PowerShell) |
| WSL | `secrets-aware.sh` (Bash) |

The `secrets-aware.cjs` dispatcher automatically detects the platform.

## Requirements

- Node.js >= 18.0.0

## Testing

```bash
# Test blocking secret file (should exit with code 2 and show masked output)
echo '{"tool_input":{"file_path":".env"}}' | node .claude/hooks/secrets-aware.cjs
echo $?  # Should output: 2

# Test blocking printenv for sensitive var
echo '{"tool_input":{"command":"printenv API_KEY"}}' | node .claude/hooks/secrets-aware.cjs
echo $?  # Should output: 2

# Test allowing normal file (should exit with code 0)
echo '{"tool_input":{"file_path":"src/index.ts"}}' | node .claude/hooks/secrets-aware.cjs
echo $?  # Should output: 0
```

## Exit Codes

- `0` - Command allowed
- `2` - Command blocked (masked output provided in stderr)

---

# Hook Interaction & Design Philosophy

## Error Handling Philosophy

The two hooks have **intentionally different** error handling strategies based on their security implications:

| Hook | Strategy | Rationale |
|------|----------|-----------|
| `blind.cjs` | **Fail-closed** (exit 2 on error) | Performance protection - blocking on error prevents accidental large directory reads |
| `secrets-aware.cjs` | **Fail-open** (exit 0 on error) | Usability - parsing errors shouldn't block legitimate operations |

### Why Different Strategies?

**Blind Hook (Fail-Closed)**:
- Worst case if error blocks: User retries or adjusts command
- Worst case if error allows: Claude reads 100K+ files, context overflow, slow response
- Decision: Block on error - false positives are recoverable, false negatives are expensive

**Secrets-Aware Hook (Fail-Open)**:
- Worst case if error blocks: Legitimate file operations fail repeatedly
- Worst case if error allows: Secret might be exposed (but user can see it in logs)
- Decision: Allow on error - secrets are already visible to user, blocking hurts productivity

## Hook Execution Order

```
Tool Call (Bash, Read, Grep, Glob)
    │
    ▼
┌─────────────────────────────────────┐
│ PreToolUse Hook Chain               │
│                                     │
│  1. blind.cjs                       │
│     └─ Checks for heavy directories │
│     └─ Exit 2 → BLOCKED             │
│     └─ Exit 0 → Continue            │
│                                     │
│  2. secrets-aware.cjs               │
│     └─ Checks for secret files/vars │
│     └─ Exit 2 → BLOCKED (masked)    │
│     └─ Exit 0 → Continue            │
│                                     │
└─────────────────────────────────────┘
    │
    ▼ (if all hooks exit 0)
Tool Executes
```

## Conflict Scenarios

| Scenario | blind.cjs | secrets-aware.cjs | Result |
|----------|-----------|-------------------|--------|
| `cat .env` | ALLOW | BLOCK (masked) | Blocked with masked output |
| `ls node_modules` | BLOCK | ALLOW | Blocked (heavy dir) |
| `cat node_modules/.env` | BLOCK | N/A (never reached) | Blocked (heavy dir) |
| `cat src/config.ts` | ALLOW | ALLOW | Allowed |

## Security Considerations

### Path Traversal Protection

The `blind.sh` hook (in its embedded Node.js code) validates that resolved paths stay within the project directory:

```javascript
// Security: Validate path doesn't escape project directory via traversal
const resolvedPath = path.resolve(tryPath);
const resolvedProject = path.resolve(projectDir);

// Skip paths that traverse outside project (except for absolute blocked dirs like /node_modules)
const isAbsoluteBlockedDir = tryPath === dirPath && path.isAbsolute(dirPath);
if (!isAbsoluteBlockedDir && !resolvedPath.startsWith(resolvedProject)) {
  continue; // Skip this path, try next
}
```

This prevents attacks like `cat ../../../etc/passwd` from bypassing directory checks.

### Shell Injection Prevention

The `blind.cjs` dispatcher uses `execFileSync` instead of `execSync` to prevent shell injection:

```javascript
// Safe: Arguments passed as array, not interpolated into shell command
execFileSync('bash', [bashScript], { input: hookInput, ... });

// Unsafe alternative (DO NOT USE): Shell injection possible via hookInput
// execSync(`bash "${bashScript}"`, { input: hookInput, ... });
```

## Windows Support

Windows uses PowerShell implementations (`blind.ps1`, `secrets-aware.ps1`) with equivalent functionality. The `.cjs` dispatchers automatically detect the platform:

```javascript
if (process.platform === 'win32') {
  execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psScript], ...);
} else {
  execFileSync('bash', [bashScript], ...);
}
```

## Troubleshooting

### Hook Not Triggering

1. Check `settings.json` has correct hook configuration
2. Verify `matcher` regex matches the tool name (Bash, Read, Grep, Glob)
3. Ensure hook scripts are executable: `chmod +x *.sh`

### False Positives

1. Check `.claudeignore` / `.secretsignore` for overly broad patterns
2. Use exclusion syntax in commands: `find . -not -path '*/node_modules/*'`
3. Temporarily disable hook to verify it's the cause

### Debugging

```bash
# Test hook directly with JSON input
echo '{"tool_input":{"command":"your command"}}' | node .claude/hooks/blind.cjs

# Check exit code
echo $?

# View stderr output for block messages
echo '{"tool_input":{"file_path":".env"}}' | node .claude/hooks/secrets-aware.cjs 2>&1
```

---

# Format Code Hook

PostToolUse hook that automatically formats code after Write/Edit operations.

## Overview

The Format Code hook runs after Claude writes or edits files, automatically applying the appropriate formatter to ensure consistent code style. This catches the ~10% of formatting issues that might slip through, preventing CI failures.

**Philosophy**: Claude already formats code well. This hook handles edge cases to ensure CI passes.

## Supported Formatters

| Formatter | Extensions | Notes |
|-----------|------------|-------|
| **Prettier** | `.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.css`, `.scss`, `.html`, `.vue`, `.svelte`, `.yaml`, `.yml`, `.md`, `.mdx`, `.graphql` | Uses local or global installation |
| **Ruff** | `.py`, `.pyi` | Format + import sorting |
| **gofmt** | `.go` | Go standard formatter |
| **rustfmt** | `.rs` | Rust standard formatter |

## Behavior

- **Non-blocking**: Formatting errors never block file operations
- **Silent skip**: If no formatter is available, silently continues
- **Project-aware**: Uses local formatters (node_modules) when available
- **Respects config**: Uses project's `.prettierrc`, `pyproject.toml`, etc.

## Output

When formatting succeeds:
```
✓ Formatted: component.tsx (prettier)
```

When skipped (no formatter, file not found, etc.): No output

## Configuration

### Enable Hook

Add to `.claude/settings.json`:

```json
{
  "hooks": {
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

### Formatter Priority

1. **Local installation** (e.g., `node_modules/.bin/prettier`) - preferred
2. **Global installation** (e.g., `prettier` in PATH) - fallback

### Requirements

For each language you want formatted:

| Language | Requirement |
|----------|-------------|
| JS/TS/Web | `npm install -D prettier` or global `prettier` |
| Python | `pip install ruff` or global `ruff` |
| Go | Go toolchain installed (`gofmt` available) |
| Rust | Rust toolchain installed (`rustfmt` available) |

## Testing

```bash
# Test with a TypeScript file
echo '{"tool_input":{"file_path":"src/test.ts"}}' | node .claude/hooks/format-code.cjs
echo $?  # Should output: 0

# Test with unsupported file (should skip silently)
echo '{"tool_input":{"file_path":"README.txt"}}' | node .claude/hooks/format-code.cjs
echo $?  # Should output: 0
```

## Exit Codes

- `0`: Always (formatting should never block operations)
