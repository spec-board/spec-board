#!/usr/bin/env node

/**
 * secrets-aware.cjs - Cross-platform hook for secret awareness
 *
 * Blocks direct reading of secret files/env vars but provides awareness
 * of their existence with masked values: VAR_NAME=[SET:12chars]
 *
 * Protected Resources:
 * - Files matching patterns in .claude/.secretsignore
 * - System env vars matching sensitive patterns (*KEY*, *SECRET*, *PASS*, *TOKEN*, etc.)
 *
 * Behavior:
 * - cat .env, Read .env → BLOCKED, returns masked output
 * - grep pass .env → BLOCKED
 * - printenv VAR → BLOCKED, returns VAR=[SET:Nchars]
 * - printenv (list all) → TRANSFORMED, sensitive values masked
 * - echo $VAR → ALLOWED (can't reliably intercept)
 *
 * Exit Codes:
 * - 0: Command allowed
 * - 2: Command blocked (with masked output in stderr)
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
  // Read stdin synchronously
  const hookInput = fs.readFileSync(0, 'utf-8');

  // Validate input not empty
  if (!hookInput || hookInput.trim().length === 0) {
    process.exit(0); // Allow on empty input
  }

  // Parse JSON
  let data;
  try {
    data = JSON.parse(hookInput);
    if (!data.tool_input || typeof data.tool_input !== 'object') {
      process.exit(0); // Allow on invalid structure
    }
  } catch (parseError) {
    process.exit(0); // Allow on parse error
  }

  // Determine platform and execute appropriate script
  const platform = process.platform;
  const scriptDir = __dirname;

  if (platform === 'win32') {
    // Windows: Use PowerShell implementation
    const psScript = path.join(scriptDir, 'secrets-aware.ps1');
    if (!fs.existsSync(psScript)) {
      console.error(`WARN: PowerShell script not found: ${psScript}`);
      process.exit(0); // Allow if script missing
    }

    execFileSync('powershell', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', psScript
    ], {
      input: hookInput,
      stdio: ['pipe', 'inherit', 'inherit'],
      encoding: 'utf-8'
    });
  } else {
    // Unix (Linux, macOS, WSL): Use bash implementation
    const bashScript = path.join(scriptDir, 'secrets-aware.sh');
    if (!fs.existsSync(bashScript)) {
      console.error(`WARN: Bash script not found: ${bashScript}`);
      process.exit(0); // Allow if script missing
    }

    execFileSync('bash', [bashScript], {
      input: hookInput,
      stdio: ['pipe', 'inherit', 'inherit'],
      encoding: 'utf-8'
    });
  }
} catch (error) {
  // Exit with error code from child process, or 0 if undefined (fail-open)
  process.exit(error.status || 0);
}
