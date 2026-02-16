#!/bin/bash
# blind.sh - Bash implementation for blocking heavy directories with awareness
# Reads patterns from .claudeignore file (defaults: node_modules, __pycache__, venv, .venv, .git, dist, build)
#
# Blocking Rules:
# - File paths: Blocks any file_path/path/pattern containing blocked directories
# - Bash commands: Blocks directory access (cd, ls, cat, etc.) but ALLOWS build commands
#   - Blocked: cd node_modules, ls build/, cat dist/file.js
#   - Allowed: npm build, pnpm build, yarn build, npm run build
#
# Awareness Feature:
# - When blocking, provides directory existence info: [EXISTS: N items]
# - Shows top-level listing without exposing full contents

# Read stdin
INPUT=$(cat)

# Validate input not empty
if [ -z "$INPUT" ]; then
  echo "ERROR: Empty input" >&2
  exit 2
fi

# Determine script directory for .claudeignore lookup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Look for .claudeignore in .claude/ folder (1 level up from .claude/hooks/)
CLAUDE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
AGENTIGNORE_FILE="$CLAUDE_DIR/.claudeignore"
PROJECT_DIR="$(cd "$CLAUDE_DIR/.." && pwd)"

# Parse JSON and extract all relevant parameters using Node.js
CHECK_RESULT=$(echo "$INPUT" | AGENTIGNORE_FILE="$AGENTIGNORE_FILE" PROJECT_DIR="$PROJECT_DIR" node -e "
const fs = require('fs');
const path = require('path');

const projectDir = process.env.PROJECT_DIR || process.cwd();

function getDirectoryInfo(dirPath) {
  // Try multiple possible paths
  const possiblePaths = [
    dirPath,
    path.join(projectDir, dirPath),
    path.resolve(dirPath)
  ];

  for (const tryPath of possiblePaths) {
    try {
      // Security: Validate path doesn't escape project directory via traversal
      const resolvedPath = path.resolve(tryPath);
      const resolvedProject = path.resolve(projectDir);

      // Skip paths that traverse outside project (except for absolute blocked dirs like /node_modules)
      const isAbsoluteBlockedDir = tryPath === dirPath && path.isAbsolute(dirPath);
      if (!isAbsoluteBlockedDir && !resolvedPath.startsWith(resolvedProject)) {
        continue; // Skip this path, try next
      }

      if (fs.existsSync(tryPath) && fs.statSync(tryPath).isDirectory()) {
        const items = fs.readdirSync(tryPath);
        const totalItems = items.length;

        // Get top 10 items with type indicators
        const topItems = items.slice(0, 10).map(item => {
          const itemPath = path.join(tryPath, item);
          try {
            const stat = fs.statSync(itemPath);
            return stat.isDirectory() ? item + '/' : item;
          } catch (e) {
            // Log unexpected errors (not ENOENT which is expected for race conditions)
            if (e.code !== 'ENOENT') {
              console.error('WARN: Error stating ' + itemPath + ': ' + e.code);
            }
            return item + ' [?]';
          }
        });

        // For node_modules, try to count packages
        let packageInfo = '';
        if (dirPath.includes('node_modules')) {
          const packageCount = items.filter(i => !i.startsWith('.')).length;
          packageInfo = ' (' + packageCount + ' packages)';
        }

        return {
          exists: true,
          path: tryPath,
          totalItems: totalItems,
          topItems: topItems,
          packageInfo: packageInfo
        };
      }
    } catch (e) {
      // Log unexpected errors (not ENOENT which is expected)
      if (e.code !== 'ENOENT') {
        console.error('WARN: Error accessing ' + tryPath + ': ' + e.code);
      }
    }
  }

  return { exists: false, path: dirPath };
}

function extractBlockedDir(str, patterns) {
  for (const pattern of patterns) {
    const regex = new RegExp('(^|.*?/)(' + pattern.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\' + '\$&') + ')(/.*)?$');
    const match = str.match(regex);
    if (match) {
      return match[1] + match[2];
    }
  }
  return null;
}

try {
  const input = fs.readFileSync(0, 'utf-8');
  const data = JSON.parse(input);

  if (!data.tool_input || typeof data.tool_input !== 'object') {
    console.error('ERROR: Invalid JSON structure, blocking for safety');
    console.log('BLOCKED');
    process.exit(0);
  }

  const toolInput = data.tool_input;

  // Read patterns from .claudeignore file
  const agentignorePath = process.env.claudeignore_FILE;
  let blockedPatterns = ['node_modules', '__pycache__', 'venv', '.venv', '.git', 'dist', 'build'];

  if (agentignorePath && fs.existsSync(agentignorePath)) {
    const content = fs.readFileSync(agentignorePath, 'utf-8');
    const patterns = content
      .split('\\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    if (patterns.length > 0) {
      blockedPatterns = patterns;
    }
  }

  // Escape special regex characters and build dynamic patterns
  const escapeRegex = (str) => str.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
  const escapedPatterns = blockedPatterns.map(escapeRegex);
  const patternGroup = escapedPatterns.join('|');

  // Pattern for directory paths
  const blockedDirPattern = new RegExp('(^|/|\\\\s)(' + patternGroup + ')(/|\$|\\\\s)');

  // Check file path parameters
  const fileParams = [
    toolInput.file_path,
    toolInput.path,
    toolInput.pattern
  ];

  for (const param of fileParams) {
    if (param && typeof param === 'string' && blockedDirPattern.test(param)) {
      const blockedDir = extractBlockedDir(param, blockedPatterns);
      if (blockedDir) {
        const info = getDirectoryInfo(blockedDir);
        const infoJson = JSON.stringify(info);
        console.log('BLOCKED_DIR:' + Buffer.from(infoJson).toString('base64'));
      } else {
        console.log('BLOCKED');
      }
      process.exit(0);
    }
  }

  // Check Bash command
  if (toolInput.command && typeof toolInput.command === 'string') {
    const cmd = toolInput.command;

    // Allow commands that explicitly exclude blocked directories
    // e.g., find . -not -path '*/node_modules/*'
    const hasExclusion = blockedPatterns.some(pattern => {
      const exclusionPatterns = [
        new RegExp('-not\\\\s+-path\\\\s+[\"\\']\\\\*/' + escapeRegex(pattern) + '/'),
        new RegExp('!\\\\s+-path\\\\s+[\"\\']\\\\*/' + escapeRegex(pattern) + '/'),
        new RegExp('--exclude[=-][\"\\']?' + escapeRegex(pattern)),
        new RegExp('-x\\\\s+[\"\\']?' + escapeRegex(pattern))
      ];
      return exclusionPatterns.some(ep => ep.test(cmd));
    });

    // Pattern 1: Command directly targets blocked dir
    // e.g., cd node_modules, ls build/, find node_modules
    const directTargetPattern = new RegExp(
      '(cd|ls|cat|rm|cp|mv|find|head|tail|less|more)\\\\s+[\"\\']?(' + patternGroup + ')(/|\\\\s|\$|[\"\\'])'
    );
    const directMatch = cmd.match(directTargetPattern);

    if (directMatch && !hasExclusion) {
      const blockedDir = directMatch[2];
      const info = getDirectoryInfo(blockedDir);
      const infoJson = JSON.stringify(info);
      console.log('BLOCKED_DIR:' + Buffer.from(infoJson).toString('base64'));
      process.exit(0);
    }

    // Pattern 2: Command contains path with blocked dir
    // e.g., cat node_modules/pkg/file.js
    // But NOT in exclusion context
    const pathPattern = new RegExp('(^|\\\\s)[\"\\']?([^\\\\s\"\\']*/)?(' + patternGroup + ')/[^\\\\s\"\\']');
    const pathMatch = cmd.match(pathPattern);

    if (pathMatch && !hasExclusion) {
      const blockedDir = pathMatch[3];
      const info = getDirectoryInfo(blockedDir);
      const infoJson = JSON.stringify(info);
      console.log('BLOCKED_DIR:' + Buffer.from(infoJson).toString('base64'));
      process.exit(0);
    }
  }

  console.log('ALLOWED');
} catch (error) {
  console.error('ERROR: JSON parse failed, blocking for safety -', error.message);
  console.log('BLOCKED');
  process.exit(0);
}
")

# Check if parsing failed
if [ $? -ne 0 ]; then
  exit 2
fi

# Helper function to escape string for JSON
escape_json() {
  printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
}

# Handle different result types - using JSON output with systemMessage for Claude awareness
case "$CHECK_RESULT" in
  BLOCKED_DIR:*)
    # Decode base64 and parse JSON for directory info
    INFO_JSON=$(echo "$CHECK_RESULT" | sed 's/^BLOCKED_DIR://' | base64 -d 2>/dev/null || echo "$CHECK_RESULT" | sed 's/^BLOCKED_DIR://' | base64 -D 2>/dev/null)

    # Parse JSON and build message using node
    MESSAGE=$(echo "$INFO_JSON" | node -e "
const fs = require('fs');
const info = JSON.parse(fs.readFileSync(0, 'utf-8'));

if (info.exists) {
  console.log('HEAVY DIRECTORY ACCESS BLOCKED - Directory exists:');
  console.log('');
  console.log(info.path + '/ [EXISTS: ' + info.totalItems + ' items' + info.packageInfo + ']');
  console.log('');
  if (info.topItems && info.topItems.length > 0) {
    console.log('Top-level contents (first 10):');
    info.topItems.forEach(item => console.log('  ' + item));
    if (info.totalItems > 10) {
      console.log('  ... and ' + (info.totalItems - 10) + ' more');
    }
  }
  console.log('');
  console.log('(Full contents blocked for performance - directory EXISTS and is accessible)');
} else {
  console.log('HEAVY DIRECTORY ACCESS BLOCKED');
  console.log('');
  console.log(info.path + '/ [NOT FOUND]');
  console.log('');
  console.log('(Directory does not exist or is not accessible)');
}
")

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
  BLOCKED)
    MESSAGE="HEAVY DIRECTORY ACCESS BLOCKED

Blocked directory pattern detected (node_modules, __pycache__, venv, .venv, .git/, dist/, build/, etc.)

These directories are blocked for performance reasons."

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
    # Unexpected output - block for safety with informative message
    MESSAGE="HOOK ERROR: Unexpected output from blind hook: $CHECK_RESULT"
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
esac
