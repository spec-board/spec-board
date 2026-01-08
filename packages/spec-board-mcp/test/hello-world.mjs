import { Sandbox } from '@e2b/code-interpreter';

async function main() {
  const sandbox = await Sandbox.create();
  console.log('Sandbox created:', sandbox.sandboxId);

  const result = await sandbox.runCode(`
for i in range(10):
    print('hello world')
`);

  console.log('Output:');
  console.log(result.logs.stdout.join(''));

  await sandbox.kill();
  console.log('Sandbox terminated');
}

main().catch(console.error);
