import 'dotenv/config';
import { createStageTransitionWorker } from '../src/lib/queue';

console.log('BullMQ worker started, waiting for jobs...');

const worker = createStageTransitionWorker();

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('Worker is running. Press Ctrl+C to stop.');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});
