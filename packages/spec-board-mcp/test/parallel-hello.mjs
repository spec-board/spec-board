import { Sandbox } from '@e2b/code-interpreter';

async function runHelloWorld(id) {
  const start = Date.now();
  const sandbox = await Sandbox.create();

  const result = await sandbox.runCode(`print('hello world #${id}')`);
  const output = result.logs.stdout.join('').trim();

  await sandbox.kill();
  const duration = Date.now() - start;

  return { id, output, duration, sandboxId: sandbox.sandboxId };
}

async function main() {
  console.log('Launching 10 parallel E2B sandboxes...\n');
  const start = Date.now();

  // Launch all 10 in parallel
  const promises = [];
  for (let i = 1; i <= 10; i++) {
    promises.push(runHelloWorld(i));
  }

  // Wait for all to complete
  const results = await Promise.all(promises);

  const totalDuration = Date.now() - start;

  console.log('Results:');
  console.log('─'.repeat(60));
  for (const r of results) {
    console.log(`  [${r.id.toString().padStart(2)}] ${r.output} (${r.duration}ms, sandbox: ${r.sandboxId})`);
  }
  console.log('─'.repeat(60));
  console.log(`\nTotal time: ${totalDuration}ms (parallel execution)`);
  console.log(`Average per sandbox: ${Math.round(results.reduce((s, r) => s + r.duration, 0) / 10)}ms`);
}

main().catch(console.error);
