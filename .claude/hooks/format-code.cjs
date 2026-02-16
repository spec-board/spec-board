#!/usr/bin/env node

/**
 * format-code.cjs - PostToolUse hook for auto-formatting code
 *
 * Automatically formats files after Write/Edit operations to ensure
 * consistent code style and prevent CI failures.
 *
 * Supported formatters:
 * - Prettier (JS/TS/JSON/CSS/MD/HTML/YAML)
 * - Ruff (Python)
 * - Go fmt (Go)
 * - Rustfmt (Rust)
 *
 * Configuration:
 * - Respects project's .prettierrc, pyproject.toml, etc.
 * - Only formats if formatter is available
 * - Silently skips if no formatter found
 *
 * Exit Codes:
 * - 0: Success (formatted or skipped)
 * - Non-zero only on critical errors
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// File extension to formatter mapping
const FORMATTER_MAP = {
  // Prettier-supported extensions
  '.js': 'prettier',
  '.jsx': 'prettier',
  '.ts': 'prettier',
  '.tsx': 'prettier',
  '.mjs': 'prettier',
  '.cjs': 'prettier',
  '.json': 'prettier',
  '.css': 'prettier',
  '.scss': 'prettier',
  '.less': 'prettier',
  '.html': 'prettier',
  '.htm': 'prettier',
  '.vue': 'prettier',
  '.svelte': 'prettier',
  '.yaml': 'prettier',
  '.yml': 'prettier',
  '.md': 'prettier',
  '.mdx': 'prettier',
  '.graphql': 'prettier',
  '.gql': 'prettier',

  // Python
  '.py': 'ruff',
  '.pyi': 'ruff',

  // Go
  '.go': 'gofmt',

  // Rust
  '.rs': 'rustfmt',
};

// Check if a command exists
function commandExists(cmd) {
  try {
    const result = spawnSync('which', [cmd], { encoding: 'utf-8', stdio: 'pipe' });
    return result.status === 0;
  } catch {
    return false;
  }
}

// Check if prettier is available (npx or global)
function hasPrettier(projectDir) {
  // Check for local prettier in node_modules
  const localPrettier = path.join(projectDir, 'node_modules', '.bin', 'prettier');
  if (fs.existsSync(localPrettier)) {
    return { type: 'local', path: localPrettier };
  }

  // Check for global prettier
  if (commandExists('prettier')) {
    return { type: 'global', path: 'prettier' };
  }

  return null;
}

// Check if ruff is available
function hasRuff() {
  return commandExists('ruff') ? { type: 'global', path: 'ruff' } : null;
}

// Check if gofmt is available
function hasGofmt() {
  return commandExists('gofmt') ? { type: 'global', path: 'gofmt' } : null;
}

// Check if rustfmt is available
function hasRustfmt() {
  return commandExists('rustfmt') ? { type: 'global', path: 'rustfmt' } : null;
}

// Format a file with the appropriate formatter
function formatFile(filePath, projectDir) {
  const ext = path.extname(filePath).toLowerCase();
  const formatter = FORMATTER_MAP[ext];

  if (!formatter) {
    // No formatter for this file type
    return { success: true, skipped: true, reason: 'no-formatter' };
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return { success: true, skipped: true, reason: 'file-not-found' };
  }

  try {
    switch (formatter) {
      case 'prettier': {
        const prettier = hasPrettier(projectDir);
        if (!prettier) {
          return { success: true, skipped: true, reason: 'prettier-not-found' };
        }

        const cmd = prettier.type === 'local' ? prettier.path : 'prettier';
        execSync(`${cmd} --write "${filePath}"`, {
          cwd: projectDir,
          stdio: 'pipe',
          encoding: 'utf-8',
        });
        return { success: true, formatter: 'prettier' };
      }

      case 'ruff': {
        const ruff = hasRuff();
        if (!ruff) {
          return { success: true, skipped: true, reason: 'ruff-not-found' };
        }

        // Ruff format (replaces black)
        execSync(`ruff format "${filePath}"`, {
          cwd: projectDir,
          stdio: 'pipe',
          encoding: 'utf-8',
        });
        // Also run ruff check with --fix for import sorting
        try {
          execSync(`ruff check --fix --select I "${filePath}"`, {
            cwd: projectDir,
            stdio: 'pipe',
            encoding: 'utf-8',
          });
        } catch {
          // Ignore ruff check errors (might have unfixable issues)
        }
        return { success: true, formatter: 'ruff' };
      }

      case 'gofmt': {
        const gofmt = hasGofmt();
        if (!gofmt) {
          return { success: true, skipped: true, reason: 'gofmt-not-found' };
        }

        execSync(`gofmt -w "${filePath}"`, {
          cwd: projectDir,
          stdio: 'pipe',
          encoding: 'utf-8',
        });
        return { success: true, formatter: 'gofmt' };
      }

      case 'rustfmt': {
        const rustfmt = hasRustfmt();
        if (!rustfmt) {
          return { success: true, skipped: true, reason: 'rustfmt-not-found' };
        }

        execSync(`rustfmt "${filePath}"`, {
          cwd: projectDir,
          stdio: 'pipe',
          encoding: 'utf-8',
        });
        return { success: true, formatter: 'rustfmt' };
      }

      default:
        return { success: true, skipped: true, reason: 'unknown-formatter' };
    }
  } catch (error) {
    // Format failed but don't block - just log
    return {
      success: true,
      skipped: true,
      reason: 'format-error',
      error: error.message,
    };
  }
}

// Main execution
try {
  // Read stdin synchronously
  const hookInput = fs.readFileSync(0, 'utf-8');

  if (!hookInput || hookInput.trim().length === 0) {
    // No input, exit silently
    process.exit(0);
  }

  let data;
  try {
    data = JSON.parse(hookInput);
  } catch {
    // Invalid JSON, exit silently
    process.exit(0);
  }

  // Get the file path from tool input
  const toolInput = data.tool_input || {};
  const filePath = toolInput.file_path || toolInput.path;

  if (!filePath) {
    // No file path in input, exit silently
    process.exit(0);
  }

  // Get project directory from environment or use cwd
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  // Resolve absolute path
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(projectDir, filePath);

  // Format the file
  const result = formatFile(absolutePath, projectDir);

  if (result.success && !result.skipped) {
    // Output formatted message to stderr (visible to user)
    console.error(`✓ Formatted: ${path.basename(filePath)} (${result.formatter})`);
  }

  // Always exit 0 - formatting should never block
  process.exit(0);
} catch (error) {
  // Log error but don't block
  console.error(`Format hook error: ${error.message}`);
  process.exit(0);
}
