require('dotenv').config();

module.exports = {
  apps: [
    // Next.js Application
    {
      name: 'specboard-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '.',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        DATABASE_URL: process.env.DATABASE_URL,
      },
    },

    // BullMQ Worker
    {
      name: 'specboard-worker',
      script: 'node_modules/tsx/bin/tsx',
      args: 'scripts/worker.ts',
      cwd: '.',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
        DATABASE_URL: process.env.DATABASE_URL,
      },
      error_file: 'logs/worker-error.log',
      out_file: 'logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
