#!/bin/bash
# secrets-aware.sh - Bash implementation for secret awareness
#
# Blocks direct reading AND writing of secret files/env vars but provides awareness
# of their existence with masked values: VAR_NAME=[SET:12chars]
#
# Protected Resources:
# - Files matching patterns in .claude/.secretsignore
# - System env vars matching sensitive patterns (*KEY*, *SECRET*, *PASS*, *TOKEN*, etc.)
#
# Read Blocking:
# - cat .env, Read .env → BLOCKED, returns masked output
# - grep pass .env → BLOCKED
# - printenv VAR → BLOCKED, returns VAR=[SET:Nchars]
# - printenv (list all) → TRANSFORMED, sensitive values masked
# - echo $VAR → ALLOWED (can't reliably intercept)
#
# Write Blocking:
# - echo/printf ... > .env → BLOCKED
# - tee .env → BLOCKED
# - cat > .env → BLOCKED
# - sed -i ... .env → BLOCKED
# - cp ... .env → BLOCKED
# - mv ... .env → BLOCKED
# - dd ... of=.env → BLOCKED
#
# Safe Files (allowlist - NOT blocked):
# - .env.example, .env.sample, .env.template, .env.defaults
# - example.env, sample.env, template.env
#
# Known Limitations:
# - Variable expansion bypasses detection (e.g., FILE=".env" && echo x > $FILE)
# - Shell variable interpolation cannot be reliably intercepted
# - Complex command chaining may evade pattern matching

# Read stdin
INPUT=$(cat)

# Validate input not empty
if [ -z "$INPUT" ]; then
  # Empty input is allowed (fail-open for usability)
  exit 0
fi

# Determine script directory for .secretsignore lookup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SECRETSIGNORE_FILE="$CLAUDE_DIR/.secretsignore"

# Parse JSON and check for secret access using Node.js
CHECK_RESULT=$(echo "$INPUT" | SECRETSIGNORE_FILE="$SECRETSIGNORE_FILE" CLAUDE_DIR="$CLAUDE_DIR" node -e "
const fs = require('fs');
const path = require('path');

// Sensitive env var patterns (case-insensitive)
// Note: These patterns match substrings. SAFE_ENV_VARS takes precedence.
// _PWD pattern matches suffixes like DB_PWD, MYSQL_PWD but not PWD itself (which is in SAFE_ENV_VARS)
const SENSITIVE_ENV_PATTERNS = [
  /KEY/i, /SECRET/i, /PASS/i, /TOKEN/i, /API/i, /AUTH/i,
  /CREDENTIAL/i, /PRIVATE/i, /CERT/i, /_PWD/i, /PWD_/i
];

// Non-sensitive env vars (allowlist)
const SAFE_ENV_VARS = new Set([
  'PATH', 'HOME', 'USER', 'SHELL', 'TERM', 'LANG', 'LC_ALL',
  'NODE_ENV', 'EDITOR', 'VISUAL', 'PAGER', 'PWD', 'OLDPWD',
  'HOSTNAME', 'LOGNAME', 'TMPDIR', 'TMP', 'TEMP'
]);

// Template/example files that are safe to read (contain placeholders, not real secrets)
const SAFE_FILE_PATTERNS = [
  '.env.example', '.env.sample', '.env.template', '.env.defaults',
  'example.env', 'sample.env', 'template.env'
];

function isSensitiveEnvVar(name) {
  if (SAFE_ENV_VARS.has(name)) return false;
  return SENSITIVE_ENV_PATTERNS.some(pattern => pattern.test(name));
}

function maskValue(value) {
  if (!value) return '[SET:0chars]';
  return '[SET:' + value.length + 'chars]';
}

function getSecretFilePatterns() {
  const secretsignorePath = process.env.SECRETSIGNORE_FILE;
  const defaultPatterns = [
    '.env', '.env.*', '.env.local', '.env.development', '.env.production',
    '*.pem', '*.key', 'credentials.json', 'secrets.json', 'secrets.yaml'
  ];

  if (secretsignorePath && fs.existsSync(secretsignorePath)) {
    const content = fs.readFileSync(secretsignorePath, 'utf-8');
    const patterns = content
      .split('\\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    if (patterns.length > 0) return patterns;
  }
  return defaultPatterns;
}

function patternToRegex(pattern) {
  // Convert glob pattern to regex
  let regex = pattern
    .replace(/[.+^\${}()|[\\]\\\\]/g, '\\\\' + '\$&')  // Escape special chars except * and ?
    .replace(/\\*/g, '.*')                        // * -> .*
    .replace(/\\?/g, '.');                        // ? -> .
  return new RegExp('(^|/)' + regex + '\$');
}

function isSecretFile(filePath) {
  if (!filePath) return false;
  const fileName = path.basename(filePath);

  // Check safe patterns first (allowlist takes precedence)
  for (const safePattern of SAFE_FILE_PATTERNS) {
    if (fileName === safePattern || filePath.endsWith('/' + safePattern)) {
      return false;  // Safe template file, not a secret
    }
  }

  // Check blocking patterns
  const patterns = getSecretFilePatterns();
  for (const pattern of patterns) {
    const regex = patternToRegex(pattern);
    if (regex.test(filePath) || regex.test(fileName)) {
      return true;
    }
  }
  return false;
}

function getMaskedEnvOutput(specificVar = null) {
  const claudeDir = process.env.CLAUDE_DIR || '.';
  const lines = [];

  // If specific var requested
  if (specificVar) {
    const value = process.env[specificVar];
    if (value !== undefined) {
      if (isSensitiveEnvVar(specificVar)) {
        lines.push(specificVar + '=' + maskValue(value));
      } else {
        lines.push(specificVar + '=' + value);
      }
    } else {
      lines.push(specificVar + '=[NOT SET]');
    }
    return lines.join('\\n');
  }

  // List all env vars with masking
  for (const [key, value] of Object.entries(process.env)) {
    if (isSensitiveEnvVar(key)) {
      lines.push(key + '=' + maskValue(value));
    } else {
      lines.push(key + '=' + value);
    }
  }
  return lines.sort().join('\\n');
}

function getMaskedFileOutput(filePath) {
  const claudeDir = process.env.CLAUDE_DIR || '.';
  const lines = [];

  // Try to find and read the file
  const possiblePaths = [
    filePath,
    path.join(claudeDir, '..', filePath),
    path.join(process.cwd(), filePath)
  ];

  let content = null;
  let foundPath = null;

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        content = fs.readFileSync(p, 'utf-8');
        foundPath = p;
        break;
      }
    } catch (e) {
      // Log unexpected errors (not ENOENT which is expected)
      if (e.code !== 'ENOENT') {
        console.error('WARN: Error reading ' + p + ': ' + e.code);
      }
    }
  }

  if (!content) {
    return 'File not found or not readable: ' + filePath;
  }

  // Parse env-style file and mask values
  const fileLines = content.split('\\n');
  for (const line of fileLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      lines.push(line);
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.substring(0, eqIndex);
      const value = trimmed.substring(eqIndex + 1);
      // Remove quotes if present
      const cleanValue = value.replace(/^[\"']|[\"']$/g, '');
      lines.push(key + '=' + maskValue(cleanValue));
    } else {
      lines.push(line);
    }
  }

  return lines.join('\\n');
}

try {
  const input = fs.readFileSync(0, 'utf-8');
  const data = JSON.parse(input);

  if (!data.tool_input || typeof data.tool_input !== 'object') {
    console.log('ALLOWED');
    process.exit(0);
  }

  const toolInput = data.tool_input;

  // Check file_path (Read tool)
  if (toolInput.file_path && isSecretFile(toolInput.file_path)) {
    const masked = getMaskedFileOutput(toolInput.file_path);
    console.log('BLOCKED_FILE:' + Buffer.from(masked).toString('base64'));
    process.exit(0);
  }

  // Check Bash commands
  if (toolInput.command && typeof toolInput.command === 'string') {
    const cmd = toolInput.command;

    // Check for cat/head/tail/less on secret files
    const catMatch = cmd.match(/(?:cat|head|tail|less|more)\\s+([^|;&]+)/);
    if (catMatch) {
      const targetFile = catMatch[1].trim();
      if (isSecretFile(targetFile)) {
        const masked = getMaskedFileOutput(targetFile);
        console.log('BLOCKED_FILE:' + Buffer.from(masked).toString('base64'));
        process.exit(0);
      }
    }

    // Check for printenv with specific var
    const printenvVarMatch = cmd.match(/printenv\\s+(\\w+)/);
    if (printenvVarMatch) {
      const varName = printenvVarMatch[1];
      if (isSensitiveEnvVar(varName)) {
        const masked = getMaskedEnvOutput(varName);
        console.log('BLOCKED_ENV:' + Buffer.from(masked).toString('base64'));
        process.exit(0);
      }
    }

    // Check for grep on secret files (more flexible pattern)
    const grepMatch = cmd.match(/grep\\s+(?:-[^\\s]+\\s+)*[^\\s]+\\s+[\"']?([^|;&\\s\"']+)[\"']?/);
    if (grepMatch) {
      const targetFile = grepMatch[1].trim();
      if (isSecretFile(targetFile)) {
        console.log('BLOCKED_GREP');
        process.exit(0);
      }
    }

    // Check for write operations to secret files (echo/printf redirect, tee, cat redirect)
    // Pattern: echo/printf ... > file OR echo/printf ... >> file (handles quoted paths)
    const redirectMatch = cmd.match(/(?:echo|printf)\\s+.*?\\s*>{1,2}\\s*[\"']?([^|;&\\s\"']+)[\"']?/);
    if (redirectMatch) {
      const targetFile = redirectMatch[1].trim();
      if (isSecretFile(targetFile)) {
        console.log('BLOCKED_WRITE');
        process.exit(0);
      }
    }

    // Pattern: tee file OR tee -a file (handles quoted paths)
    const teeMatch = cmd.match(/tee\\s+(?:-a\\s+)?[\"']?([^|;&\\s\"']+)[\"']?/);
    if (teeMatch) {
      const targetFile = teeMatch[1].trim();
      if (isSecretFile(targetFile)) {
        console.log('BLOCKED_WRITE');
        process.exit(0);
      }
    }

    // Pattern: cat > file OR cat >> file (heredoc style, handles quoted paths)
    const catWriteMatch = cmd.match(/cat\\s*>{1,2}\\s*[\"']?([^|;&\\s\"']+)[\"']?/);
    if (catWriteMatch) {
      const targetFile = catWriteMatch[1].trim();
      if (isSecretFile(targetFile)) {
        console.log('BLOCKED_WRITE');
        process.exit(0);
      }
    }

    // Pattern: > file at start (truncate) or >> file (append, handles quoted paths)
    const bareRedirectMatch = cmd.match(/^\\s*>{1,2}\\s*[\"']?([^|;&\\s\"']+)[\"']?/);
    if (bareRedirectMatch) {
      const targetFile = bareRedirectMatch[1].trim();
      if (isSecretFile(targetFile)) {
        console.log('BLOCKED_WRITE');
        process.exit(0);
      }
    }

    // Pattern: sed -i (in-place edit) targeting secret files (handles quoted paths)
    const sedMatch = cmd.match(/sed\\s+(?:-[^\\s]*i[^\\s]*|--in-place)\\s+.*?\\s+[\"']?([^|;&\\s\"']+)[\"']?/);
    if (sedMatch) {
      const targetFile = sedMatch[1].trim();
      if (isSecretFile(targetFile)) {
        console.log('BLOCKED_WRITE');
        process.exit(0);
      }
    }

    // Pattern: cp ... .env (copy to secret file, handles quoted paths)
    const cpMatch = cmd.match(/cp\\s+(?:-[^\\s]+\\s+)*[^|;&\\s]+\\s+[\"']?([^|;&\\s\"']+)[\"']?\\s*$/);
    if (cpMatch) {
      const targetFile = cpMatch[1].trim();
      if (isSecretFile(targetFile)) {
        console.log('BLOCKED_WRITE');
        process.exit(0);
      }
    }

    // Pattern: mv ... .env (move/rename to secret file, handles quoted paths)
    const mvMatch = cmd.match(/mv\\s+(?:-[^\\s]+\\s+)*[^|;&\\s]+\\s+[\"']?([^|;&\\s\"']+)[\"']?\\s*$/);
    if (mvMatch) {
      const targetFile = mvMatch[1].trim();
      if (isSecretFile(targetFile)) {
        console.log('BLOCKED_WRITE');
        process.exit(0);
      }
    }

    // Pattern: dd ... of=.env (block copy to secret file, handles quoted paths)
    const ddMatch = cmd.match(/dd\\s+.*?of=[\"']?([^|;&\\s\"']+)[\"']?/);
    if (ddMatch) {
      const targetFile = ddMatch[1].trim();
      if (isSecretFile(targetFile)) {
        console.log('BLOCKED_WRITE');
        process.exit(0);
      }
    }
  }

  console.log('ALLOWED');
} catch (error) {
  console.error('WARN: Error in secrets-aware hook:', error.message);
  console.log('ALLOWED');
  process.exit(0);
}
")

# Check if parsing failed
if [ $? -ne 0 ]; then
  exit 0
fi

# Helper function to escape string for JSON
escape_json() {
  printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
}

# Handle different block types - using JSON output with systemMessage for Claude awareness
case "$CHECK_RESULT" in
  BLOCKED_FILE:*)
    MASKED_OUTPUT=$(echo "$CHECK_RESULT" | sed 's/^BLOCKED_FILE://' | base64 -d 2>/dev/null || echo "$CHECK_RESULT" | sed 's/^BLOCKED_FILE://' | base64 -D 2>/dev/null)

    # Build the message
    MESSAGE="SECRET FILE ACCESS BLOCKED - Showing masked content:

${MASKED_OUTPUT}

(Values masked as [SET:Nchars] for security)"

    # Escape for JSON and output to stdout
    ESCAPED_MESSAGE=$(escape_json "$MESSAGE")

    cat << EOF
{
  "hookSpecificOutput": {
    "permissionDecision": "deny"
  },
  "systemMessage": ${ESCAPED_MESSAGE}
}
EOF
    exit 0
    ;;
  BLOCKED_ENV:*)
    MASKED_OUTPUT=$(echo "$CHECK_RESULT" | sed 's/^BLOCKED_ENV://' | base64 -d 2>/dev/null || echo "$CHECK_RESULT" | sed 's/^BLOCKED_ENV://' | base64 -D 2>/dev/null)

    # Build the message
    MESSAGE="SENSITIVE ENV VAR ACCESS BLOCKED - Showing masked value:

${MASKED_OUTPUT}

(Value masked as [SET:Nchars] for security)"

    # Escape for JSON and output to stdout
    ESCAPED_MESSAGE=$(escape_json "$MESSAGE")

    cat << EOF
{
  "hookSpecificOutput": {
    "permissionDecision": "deny"
  },
  "systemMessage": ${ESCAPED_MESSAGE}
}
EOF
    exit 0
    ;;
  BLOCKED_GREP)
    MESSAGE="GREP ON SECRET FILE BLOCKED

To check if a key exists, use: grep -qE '^KEY_NAME=' .env && echo 'exists'"

    ESCAPED_MESSAGE=$(escape_json "$MESSAGE")

    cat << EOF
{
  "hookSpecificOutput": {
    "permissionDecision": "deny"
  },
  "systemMessage": ${ESCAPED_MESSAGE}
}
EOF
    exit 0
    ;;
  BLOCKED_WRITE)
    MESSAGE="WRITE TO SECRET FILE BLOCKED

Writing to .env files via shell commands is not allowed.
Blocked commands: echo, printf, tee, cat redirect, sed -i, cp, mv, dd

Use the Write tool to create .env.example with placeholder values instead."

    ESCAPED_MESSAGE=$(escape_json "$MESSAGE")

    cat << EOF
{
  "hookSpecificOutput": {
    "permissionDecision": "deny"
  },
  "systemMessage": ${ESCAPED_MESSAGE}
}
EOF
    exit 0
    ;;
  ALLOWED)
    exit 0
    ;;
  *)
    # Unexpected output - allow but log for debugging (fail-open for usability)
    echo "WARN: Unexpected secrets-aware hook output: $CHECK_RESULT" >&2
    exit 0
    ;;
esac
