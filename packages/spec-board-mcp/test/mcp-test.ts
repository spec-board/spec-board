/**
 * MCP Server/Client Test Script
 * Tests the spec-board-mcp functionality in isolation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================
// Mock API Server
// ============================================

interface MockSpec {
  featureId: string;
  featureName: string;
  files: Array<{
    type: 'spec' | 'plan' | 'tasks';
    content: string;
    lastModified: string;
  }>;
}

// In-memory storage for mock cloud
const mockCloudStorage: Map<string, MockSpec[]> = new Map();

// Mock API functions
function mockGetApiConfig() {
  return {
    baseUrl: 'http://mock-api',
    apiToken: 'mock-token-12345',
  };
}

async function mockFetchCloudSpecs(
  _config: { baseUrl: string; apiToken: string },
  cloudProjectId: string,
  featureId?: string
): Promise<MockSpec[]> {
  const specs = mockCloudStorage.get(cloudProjectId) || [];
  if (featureId) {
    return specs.filter(s => s.featureId === featureId);
  }
  return specs;
}

async function mockUploadSpecs(
  _config: { baseUrl: string; apiToken: string },
  cloudProjectId: string,
  specs: MockSpec[]
): Promise<{ success: boolean; message: string; syncedFeatures: string[] }> {
  const existing = mockCloudStorage.get(cloudProjectId) || [];

  for (const spec of specs) {
    const idx = existing.findIndex(s => s.featureId === spec.featureId);
    if (idx >= 0) {
      existing[idx] = spec;
    } else {
      existing.push(spec);
    }
  }

  mockCloudStorage.set(cloudProjectId, existing);

  return {
    success: true,
    message: `Synced ${specs.length} feature(s)`,
    syncedFeatures: specs.map(s => s.featureId),
  };
}

// ============================================
// Core Functions (copied from source with mock injection)
// ============================================

const SPEC_FILE_TYPES = ['spec', 'plan', 'tasks'] as const;

async function pullSpec(
  projectPath: string,
  cloudProjectId: string,
  featureId?: string
) {
  // Validate project path exists
  try {
    await fs.access(projectPath);
  } catch {
    throw new Error(`Project path does not exist: ${projectPath}`);
  }

  const config = mockGetApiConfig();
  const cloudSpecs = await mockFetchCloudSpecs(config, cloudProjectId, featureId);

  if (cloudSpecs.length === 0) {
    return {
      success: true,
      message: featureId
        ? `No specs found for feature '${featureId}' in cloud project`
        : 'No specs found in cloud project',
      pulledFeatures: [],
      filesWritten: 0,
    };
  }

  const specsDir = path.join(projectPath, 'specs');
  await fs.mkdir(specsDir, { recursive: true });

  let filesWritten = 0;
  const pulledFeatures: string[] = [];

  for (const spec of cloudSpecs) {
    const featureDir = path.join(specsDir, spec.featureId);
    await fs.mkdir(featureDir, { recursive: true });

    for (const file of spec.files) {
      const filename = `${file.type}.md`;
      const filePath = path.join(featureDir, filename);
      await fs.writeFile(filePath, file.content, 'utf-8');
      filesWritten++;
    }

    pulledFeatures.push(spec.featureId);
  }

  return {
    success: true,
    message: `Successfully pulled ${pulledFeatures.length} feature(s) from cloud`,
    pulledFeatures,
    filesWritten,
  };
}

async function readFeatureSpec(specsDir: string, featureId: string): Promise<MockSpec | null> {
  const featureDir = path.join(specsDir, featureId);

  try {
    await fs.access(featureDir);
  } catch {
    return null;
  }

  const files: MockSpec['files'] = [];

  for (const type of SPEC_FILE_TYPES) {
    const filePath = path.join(featureDir, `${type}.md`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      files.push({
        type,
        content,
        lastModified: stats.mtime.toISOString(),
      });
    } catch {
      // File doesn't exist, skip
    }
  }

  if (files.length === 0) {
    return null;
  }

  return {
    featureId,
    featureName: featureId,
    files,
  };
}

async function pushSpec(
  projectPath: string,
  cloudProjectId: string,
  featureId?: string
) {
  const specsDir = path.join(projectPath, 'specs');
  try {
    await fs.access(specsDir);
  } catch {
    throw new Error(`Specs directory does not exist: ${specsDir}`);
  }

  const config = mockGetApiConfig();
  const specs: MockSpec[] = [];
  let filesRead = 0;

  if (featureId) {
    const spec = await readFeatureSpec(specsDir, featureId);
    if (spec) {
      specs.push(spec);
      filesRead += spec.files.length;
    }
  } else {
    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const spec = await readFeatureSpec(specsDir, entry.name);
        if (spec) {
          specs.push(spec);
          filesRead += spec.files.length;
        }
      }
    }
  }

  if (specs.length === 0) {
    return {
      success: true,
      message: featureId
        ? `No spec files found for feature '${featureId}'`
        : 'No spec files found in project',
      pushedFeatures: [],
      filesUploaded: 0,
    };
  }

  const result = await mockUploadSpecs(config, cloudProjectId, specs);

  return {
    success: result.success,
    message: result.message,
    pushedFeatures: result.syncedFeatures,
    filesUploaded: filesRead,
  };
}

// ============================================
// Test Runner
// ============================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: message });
    console.log(`✗ ${name}: ${message}`);
  }
}

async function setupTestProject(testDir: string) {
  await fs.mkdir(path.join(testDir, 'specs', '001-auth'), { recursive: true });
  await fs.mkdir(path.join(testDir, 'specs', '002-dashboard'), { recursive: true });

  // Create spec files for feature 001
  await fs.writeFile(
    path.join(testDir, 'specs', '001-auth', 'spec.md'),
    '# Auth Feature\n\nUser authentication spec.'
  );
  await fs.writeFile(
    path.join(testDir, 'specs', '001-auth', 'plan.md'),
    '# Auth Plan\n\nImplementation plan for auth.'
  );
  await fs.writeFile(
    path.join(testDir, 'specs', '001-auth', 'tasks.md'),
    '# Auth Tasks\n\n- [ ] T001 Implement login'
  );

  // Create spec files for feature 002
  await fs.writeFile(
    path.join(testDir, 'specs', '002-dashboard', 'spec.md'),
    '# Dashboard Feature\n\nDashboard spec.'
  );
}

async function cleanupTestDir(testDir: string) {
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

// ============================================
// Tests
// ============================================

async function main() {
  const testDir = path.join(__dirname, 'test-project');
  const cloudProjectId = 'test-cloud-project';

  console.log('\n=== MCP Server/Client Tests ===\n');

  // Setup
  await cleanupTestDir(testDir);
  await setupTestProject(testDir);

  // Test 1: Push all specs to cloud
  await runTest('Push all specs to cloud', async () => {
    const result = await pushSpec(testDir, cloudProjectId);

    assert(result.success, 'Push should succeed');
    assert(result.pushedFeatures.length === 2, 'Should push 2 features');
    assert(result.pushedFeatures.includes('001-auth'), 'Should include 001-auth');
    assert(result.pushedFeatures.includes('002-dashboard'), 'Should include 002-dashboard');
    assert(result.filesUploaded === 4, 'Should upload 4 files (3 + 1)');
  });

  // Test 2: Push specific feature
  await runTest('Push specific feature', async () => {
    const result = await pushSpec(testDir, cloudProjectId, '001-auth');

    assert(result.success, 'Push should succeed');
    assert(result.pushedFeatures.length === 1, 'Should push 1 feature');
    assert(result.pushedFeatures[0] === '001-auth', 'Should push 001-auth');
  });

  // Test 3: Push non-existent feature
  await runTest('Push non-existent feature returns empty', async () => {
    const result = await pushSpec(testDir, cloudProjectId, 'non-existent');

    assert(result.success, 'Should succeed with empty result');
    assert(result.pushedFeatures.length === 0, 'Should push 0 features');
  });

  // Test 4: Pull all specs from cloud
  await runTest('Pull all specs from cloud', async () => {
    // First clear local specs
    const pullDir = path.join(testDir, 'pull-test');
    await fs.mkdir(pullDir, { recursive: true });

    const result = await pullSpec(pullDir, cloudProjectId);

    assert(result.success, 'Pull should succeed');
    assert(result.pulledFeatures.length === 2, 'Should pull 2 features');
    assert(result.filesWritten === 4, 'Should write 4 files');

    // Verify files exist
    const specContent = await fs.readFile(
      path.join(pullDir, 'specs', '001-auth', 'spec.md'),
      'utf-8'
    );
    assert(specContent.includes('Auth Feature'), 'Spec content should match');
  });

  // Test 5: Pull specific feature
  await runTest('Pull specific feature', async () => {
    const pullDir = path.join(testDir, 'pull-single');
    await fs.mkdir(pullDir, { recursive: true });

    const result = await pullSpec(pullDir, cloudProjectId, '001-auth');

    assert(result.success, 'Pull should succeed');
    assert(result.pulledFeatures.length === 1, 'Should pull 1 feature');
    assert(result.pulledFeatures[0] === '001-auth', 'Should pull 001-auth');
  });

  // Test 6: Pull from empty project
  await runTest('Pull from empty cloud project', async () => {
    const pullDir = path.join(testDir, 'pull-empty');
    await fs.mkdir(pullDir, { recursive: true });

    const result = await pullSpec(pullDir, 'empty-project');

    assert(result.success, 'Should succeed with empty result');
    assert(result.pulledFeatures.length === 0, 'Should pull 0 features');
  });

  // Test 7: Push to non-existent project path
  await runTest('Push from non-existent path throws error', async () => {
    let threw = false;
    try {
      await pushSpec('/non/existent/path', cloudProjectId);
    } catch (error) {
      threw = true;
      assert(
        error instanceof Error && error.message.includes('does not exist'),
        'Should throw path error'
      );
    }
    assert(threw, 'Should throw an error');
  });

  // Test 8: Pull to non-existent project path
  await runTest('Pull to non-existent path throws error', async () => {
    let threw = false;
    try {
      await pullSpec('/non/existent/path', cloudProjectId);
    } catch (error) {
      threw = true;
      assert(
        error instanceof Error && error.message.includes('does not exist'),
        'Should throw path error'
      );
    }
    assert(threw, 'Should throw an error');
  });

  // Test 9: Round-trip sync (push then pull)
  await runTest('Round-trip sync preserves content', async () => {
    const originalContent = '# Updated Auth\n\nNew content for testing round-trip.';

    // Update local file
    await fs.writeFile(
      path.join(testDir, 'specs', '001-auth', 'spec.md'),
      originalContent
    );

    // Push to cloud
    await pushSpec(testDir, cloudProjectId, '001-auth');

    // Pull to new directory
    const roundTripDir = path.join(testDir, 'round-trip');
    await fs.mkdir(roundTripDir, { recursive: true });
    await pullSpec(roundTripDir, cloudProjectId, '001-auth');

    // Verify content matches
    const pulledContent = await fs.readFile(
      path.join(roundTripDir, 'specs', '001-auth', 'spec.md'),
      'utf-8'
    );
    assert(pulledContent === originalContent, 'Content should match after round-trip');
  });

  // Cleanup
  await cleanupTestDir(testDir);

  // Summary
  console.log('\n=== Test Summary ===\n');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }

  console.log('\nAll tests passed!');
}

main().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
