/**
 * E2B Test Runner Script
 *
 * Runs vitest tests in E2B cloud sandbox for isolation.
 * Usage: node scripts/e2b-run-tests.js [test-file-pattern]
 *
 * Key learnings:
 * - Default working directory is /home/user (writable)
 * - Use sandbox.files.write() for files
 * - Language defaults to Python, need to specify 'nodejs' or 'typescript'
 */

const { Sandbox } = require('@e2b/code-interpreter');
const fs = require('fs');
const path = require('path');

const E2B_API_KEY = process.env.E2B_API_KEY;

if (!E2B_API_KEY) {
  console.error('Error: E2B_API_KEY environment variable is required');
  console.log('Set it with: export E2B_API_KEY=your-api-key');
  process.exit(1);
}

const TEST_PATTERN = process.argv[2] || 'src/**/*.test.ts';
const PROJECT_ROOT = process.cwd();

// Files/dirs to exclude from upload
const EXCLUDE_DIRS = ['node_modules', '.git', '.next', '.vitest', 'coverage'];

function shouldExclude(filePath) {
  return EXCLUDE_DIRS.some(dir => filePath.includes(dir));
}

async function uploadDir(localDir, remoteDir, sandbox) {
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name);
    const remotePath = `${remoteDir}/${entry.name}`;

    if (entry.isDirectory()) {
      if (!shouldExclude(entry.name)) {
        // Create directory by writing a placeholder file
        await sandbox.files.write(`${remotePath}/.dir`, '');
        await uploadDir(localPath, remotePath, sandbox);
      }
    } else {
      const content = fs.readFileSync(localPath, 'utf-8');
      await sandbox.files.write(remotePath, content);
    }
  }
}

async function main() {
  console.log('🚀 Starting E2B Test Runner');
  console.log(`   Test pattern: ${TEST_PATTERN}`);
  console.log('');

  console.log('📦 Creating E2B sandbox with Node.js...');

  // Use Node.js template for TypeScript/JS projects
  const sandbox = await Sandbox.create({
    apiKey: E2B_API_KEY,
    timeoutMs: 300000,
  });

  console.log(`   Sandbox ID: ${sandbox.sandboxId}`);
  console.log('');

  try {
    console.log('📤 Setting up workspace in /home/user...');

    // Use /home/user as base (writable)
    const BASE = '/home/user';

    // Upload package.json
    const packageJson = fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8');
    await sandbox.files.write(`${BASE}/package.json`, packageJson);
    console.log('   ✓ package.json');

    // Upload tsconfig.json
    const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      const tsconfig = fs.readFileSync(tsconfigPath, 'utf-8');
      await sandbox.files.write(`${BASE}/tsconfig.json`, tsconfig);
      console.log('   ✓ tsconfig.json');
    }

    // Upload vitest.config.ts
    const vitestConfig = fs.readFileSync(path.join(PROJECT_ROOT, 'vitest.config.ts'), 'utf-8');
    await sandbox.files.write(`${BASE}/vitest.config.ts`, vitestConfig);
    console.log('   ✓ vitest.config.ts');

    // Upload next.config.ts if exists
    const nextConfigPath = path.join(PROJECT_ROOT, 'next.config.ts');
    if (fs.existsSync(nextConfigPath)) {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf-8');
      await sandbox.files.write(`${BASE}/next.config.ts`, nextConfig);
      console.log('   ✓ next.config.ts');
    }

    // Upload src directory
    console.log('   Uploading src/...');
    await uploadDir(path.join(PROJECT_ROOT, 'src'), `${BASE}/src`, sandbox);
    console.log('   ✓ src/');

    console.log('');

    // Install dependencies
    console.log('📥 Installing dependencies (this may take a while)...');
    const installResult = await sandbox.commands.run(
      `cd ${BASE} && npm install`,
      { timeoutMs: 300000 }
    );

    if (installResult.exitCode === 0) {
      console.log('   ✓ Dependencies installed');
    } else {
      console.log('   ⚠ npm install had issues, trying anyway...');
      console.log(installResult.stderr?.substring(0, 500) || '');
    }
    console.log('');

    // Run tests
    console.log('🧪 Running tests...');
    console.log('');

    const result = await sandbox.commands.run(
      `cd ${BASE} && npx vitest run --reporter=verbose ${TEST_PATTERN}`,
      {
        timeoutMs: 300000,
        onStdout: (data) => process.stdout.write(data),
        onStderr: (data) => process.stderr.write(data),
      }
    );

    console.log('');
    console.log('📊 Test Results:');
    console.log(`   Exit code: ${result.exitCode}`);

    if (result.exitCode === 0) {
      console.log('   ✅ All tests passed!');
    } else {
      console.log('   ❌ Some tests failed');
    }

    return result.exitCode;
  } finally {
    console.log('');
    console.log('🧹 Cleaning up sandbox...');
    await sandbox.kill();
    console.log('   Done!');
  }
}

main()
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
