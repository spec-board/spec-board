/**
 * E2B Sandbox MCP Server/Client Test
 *
 * Tests MCP protocol behavior in an isolated E2B sandbox environment.
 * This validates:
 * 1. MCP server startup and initialization
 * 2. MCP client connection via different transports
 * 3. Tool listing (listTools)
 * 4. Tool execution (callTool)
 * 5. Error handling
 *
 * Requirements:
 * - E2B_API_KEY environment variable
 * - Built spec-board-mcp package
 */

import { Sandbox } from '@e2b/code-interpreter';

// ============================================
// Test Configuration
// ============================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

// ============================================
// Test Utilities
// ============================================

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration });
    console.log(`✓ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: message, duration });
    console.log(`✗ ${name}: ${message}`);
  }
}

// ============================================
// MCP Server Code (to run in sandbox)
// ============================================

const MCP_SERVER_CODE = `
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Simple test tools
const tools = [
  {
    name: "echo",
    description: "Echo back the input message",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Message to echo" }
      },
      required: ["message"]
    }
  },
  {
    name: "add",
    description: "Add two numbers",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number", description: "First number" },
        b: { type: "number", description: "Second number" }
      },
      required: ["a", "b"]
    }
  },
  {
    name: "fail",
    description: "Always fails with an error",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

const server = new Server(
  { name: "test-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "echo":
      return {
        content: [{ type: "text", text: args?.message || "" }]
      };
    case "add":
      const sum = (args?.a || 0) + (args?.b || 0);
      return {
        content: [{ type: "text", text: String(sum) }]
      };
    case "fail":
      return {
        content: [{ type: "text", text: "Intentional error" }],
        isError: true
      };
    default:
      return {
        content: [{ type: "text", text: "Unknown tool: " + name }],
        isError: true
      };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Test MCP server started");
`;

const MCP_CLIENT_CODE = `
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testMCPClient() {
  const results = [];

  // Start MCP server as subprocess
  const transport = new StdioClientTransport({
    command: "node",
    args: ["mcp-server.mjs"]
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    // Test 1: Connect to server
    await client.connect(transport);
    results.push({ test: "connect", passed: true });

    // Test 2: List tools
    const toolsResponse = await client.listTools();
    const toolNames = toolsResponse.tools.map(t => t.name);
    results.push({
      test: "listTools",
      passed: toolNames.includes("echo") && toolNames.includes("add"),
      tools: toolNames
    });

    // Test 3: Call echo tool
    const echoResult = await client.callTool({
      name: "echo",
      arguments: { message: "Hello MCP!" }
    });
    const echoText = echoResult.content[0]?.text;
    results.push({
      test: "callTool_echo",
      passed: echoText === "Hello MCP!",
      result: echoText
    });

    // Test 4: Call add tool
    const addResult = await client.callTool({
      name: "add",
      arguments: { a: 5, b: 3 }
    });
    const addText = addResult.content[0]?.text;
    results.push({
      test: "callTool_add",
      passed: addText === "8",
      result: addText
    });

    // Test 5: Call failing tool
    const failResult = await client.callTool({
      name: "fail",
      arguments: {}
    });
    results.push({
      test: "callTool_fail",
      passed: failResult.isError === true,
      isError: failResult.isError
    });

    // Test 6: Call unknown tool
    const unknownResult = await client.callTool({
      name: "nonexistent",
      arguments: {}
    });
    results.push({
      test: "callTool_unknown",
      passed: unknownResult.isError === true,
      isError: unknownResult.isError
    });

  } catch (error) {
    results.push({
      test: "error",
      passed: false,
      error: error.message
    });
  } finally {
    try {
      await client.close();
      await transport.close();
    } catch {}
  }

  return results;
}

const results = await testMCPClient();
console.log(JSON.stringify(results, null, 2));
`;

// ============================================
// E2B Sandbox Tests
// ============================================

async function testMCPInSandbox(): Promise<void> {
  console.log('\n=== E2B Sandbox MCP Tests ===\n');

  // Check for API key
  if (!process.env.E2B_API_KEY) {
    console.log('⚠ E2B_API_KEY not set. Running local tests only.\n');
    await runLocalTests();
    return;
  }

  let sandbox: Sandbox | null = null;

  try {
    // Create sandbox
    console.log('Creating E2B sandbox...');
    sandbox = await Sandbox.create({ timeoutMs: 300000 }); // 5 min timeout
    console.log(`Sandbox created: ${sandbox.sandboxId}\n`);

    // Test 1: Install MCP SDK in sandbox
    await runTest('Install MCP SDK in sandbox', async () => {
      const result = await sandbox!.runCode(`
        import subprocess
        result = subprocess.run(
          ['npm', 'init', '-y'],
          capture_output=True,
          text=True,
          cwd='/home/user'
        )
        print(result.stdout)
        print(result.stderr)
      `);
      console.log('  npm init:', result.logs.stdout);

      const installResult = await sandbox!.runCode(`
        import subprocess
        result = subprocess.run(
          ['npm', 'install', '@modelcontextprotocol/sdk'],
          capture_output=True,
          text=True,
          cwd='/home/user'
        )
        print(result.stdout)
        print(result.stderr)
      `);
      console.log('  npm install:', installResult.logs.stdout);

      assert(!installResult.error, 'MCP SDK installation failed');
    });

    // Test 2: Create MCP server file in sandbox
    await runTest('Create MCP server in sandbox', async () => {
      await sandbox!.files.write('/home/user/mcp-server.mjs', MCP_SERVER_CODE);

      // Verify file exists
      const content = await sandbox!.files.read('/home/user/mcp-server.mjs');
      assert(content.includes('test-mcp-server'), 'Server file not created correctly');
    });

    // Test 3: Create MCP client test file in sandbox
    await runTest('Create MCP client test in sandbox', async () => {
      await sandbox!.files.write('/home/user/mcp-client-test.mjs', MCP_CLIENT_CODE);

      // Verify file exists
      const content = await sandbox!.files.read('/home/user/mcp-client-test.mjs');
      assert(content.includes('test-client'), 'Client file not created correctly');
    });

    // Test 4: Run MCP client tests in sandbox
    await runTest('Run MCP protocol tests in sandbox', async () => {
      const result = await sandbox!.runCode(`
        import subprocess
        import json

        result = subprocess.run(
          ['node', 'mcp-client-test.mjs'],
          capture_output=True,
          text=True,
          cwd='/home/user',
          timeout=60
        )

        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        print("RETURN:", result.returncode)
      `);

      console.log('  Test output:', result.logs.stdout);

      // Parse results from stdout (logs.stdout is an array)
      const stdout = Array.isArray(result.logs.stdout)
        ? result.logs.stdout.join('\n')
        : result.logs.stdout;
      const jsonMatch = stdout.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const testResults = JSON.parse(jsonMatch[0]);
        console.log('  Parsed results:', JSON.stringify(testResults, null, 2));

        // Verify all tests passed
        const allPassed = testResults.every((r: any) => r.passed);
        assert(allPassed, `Some MCP tests failed: ${JSON.stringify(testResults.filter((r: any) => !r.passed))}`);
      } else {
        // If we can't parse JSON, check for error
        assert(!result.error, `Test execution failed: ${result.error}`);
      }
    });

    // Test 5: Test MCP server error handling
    await runTest('Test MCP error handling', async () => {
      const errorServerCode = `
        import { Server } from "@modelcontextprotocol/sdk/server/index.js";
        import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
        import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

        const server = new Server(
          { name: "error-test-server", version: "1.0.0" },
          { capabilities: { tools: {} } }
        );

        server.setRequestHandler(ListToolsRequestSchema, async () => ({
          tools: [{
            name: "throw_error",
            description: "Throws an exception",
            inputSchema: { type: "object", properties: {} }
          }]
        }));

        server.setRequestHandler(CallToolRequestSchema, async () => {
          throw new Error("Intentional server error");
        });

        const transport = new StdioServerTransport();
        await server.connect(transport);
      `;

      await sandbox!.files.write('/home/user/error-server.mjs', errorServerCode);

      const errorClientCode = `
        import { Client } from "@modelcontextprotocol/sdk/client/index.js";
        import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

        const transport = new StdioClientTransport({
          command: "node",
          args: ["error-server.mjs"]
        });

        const client = new Client(
          { name: "error-test-client", version: "1.0.0" },
          { capabilities: {} }
        );

        await client.connect(transport);

        try {
          await client.callTool({ name: "throw_error", arguments: {} });
          console.log("ERROR_HANDLED: false");
        } catch (error) {
          console.log("ERROR_HANDLED: true");
          console.log("ERROR_MESSAGE:", error.message);
        }

        await client.close();
        await transport.close();
      `;

      await sandbox!.files.write('/home/user/error-client.mjs', errorClientCode);

      const result = await sandbox!.runCode(`
        import subprocess
        result = subprocess.run(
          ['node', 'error-client.mjs'],
          capture_output=True,
          text=True,
          cwd='/home/user',
          timeout=30
        )
        print(result.stdout)
        print(result.stderr)
      `);

      const errorOutput = Array.isArray(result.logs.stdout)
        ? result.logs.stdout.join('\n')
        : result.logs.stdout;
      console.log('  Error handling output:', errorOutput);
      assert(
        errorOutput.includes('ERROR_HANDLED: true'),
        'Server error was not properly handled by client'
      );
    });

  } finally {
    // Cleanup sandbox
    if (sandbox) {
      console.log('\nCleaning up sandbox...');
      await sandbox.kill();
      console.log('Sandbox terminated.');
    }
  }
}

// ============================================
// Local Tests (fallback when no E2B key)
// ============================================

async function runLocalTests(): Promise<void> {
  console.log('Running local MCP protocol tests...\n');

  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
  const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
  const { InMemoryTransport } = await import('@modelcontextprotocol/sdk/inMemory.js');
  const { ListToolsRequestSchema, CallToolRequestSchema } = await import('@modelcontextprotocol/sdk/types.js');

  // Test with in-memory transport (no subprocess needed)
  await runTest('Create MCP server with in-memory transport', async () => {
    const server = new Server(
      { name: 'test-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'test_tool',
          description: 'A test tool',
          inputSchema: { type: 'object', properties: {} }
        }
      ]
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => ({
      content: [{ type: 'text', text: `Called: ${request.params.name}` }]
    }));

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    const client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );

    // Connect both ends
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport)
    ]);

    // Test listTools
    const tools = await client.listTools();
    assert(tools.tools.length === 1, 'Expected 1 tool');
    assert(tools.tools[0].name === 'test_tool', 'Expected test_tool');

    // Test callTool
    const result = await client.callTool({ name: 'test_tool', arguments: {} });
    assert(
      result.content[0].type === 'text' && result.content[0].text === 'Called: test_tool',
      'Unexpected tool result'
    );

    await client.close();
    await server.close();
  });

  // Test spec-board-mcp server (if built)
  await runTest('Test spec-board-mcp server via stdio', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const serverPath = path.resolve(__dirname, '../dist/index.js');

    // Check if server is built
    try {
      await fs.access(serverPath);
    } catch {
      console.log('  (skipped - server not built)');
      return;
    }

    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath]
    });

    const client = new Client(
      { name: 'spec-board-test', version: '1.0.0' },
      { capabilities: {} }
    );

    await client.connect(transport);

    // List tools
    const tools = await client.listTools();
    const toolNames = tools.tools.map(t => t.name);

    assert(toolNames.includes('pull_spec'), 'Missing pull_spec tool');
    assert(toolNames.includes('push_spec'), 'Missing push_spec tool');

    console.log(`  Found tools: ${toolNames.join(', ')}`);

    await client.close();
    await transport.close();
  });
}

// ============================================
// Main Entry Point
// ============================================

async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('  MCP Server/Client E2B Sandbox Tests');
  console.log('========================================\n');

  try {
    await testMCPInSandbox();
  } catch (error) {
    console.error('Test suite error:', error);
  }

  // Print summary
  console.log('\n=== Test Summary ===\n');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);
  console.log(`Total time: ${totalDuration}ms`);

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
  console.error('Fatal error:', error);
  process.exit(1);
});
