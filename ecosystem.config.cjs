/**
 * PM2 Ecosystem Configuration for SpecBoard
 *
 * @description Production process manager configuration for the SpecBoard Next.js application.
 *              Automatically loads environment variables from .env file.
 *
 * @example Start in production mode
 * ```bash
 * pnpm build && pm2 start ecosystem.config.cjs
 * ```
 *
 * @example Start in development mode
 * ```bash
 * pm2 start ecosystem.config.cjs --env development
 * ```
 *
 * @example Common PM2 commands
 * ```bash
 * pm2 status              # Check process status
 * pm2 logs specboard      # View logs (tail -f style)
 * pm2 logs specboard --lines 100  # View last 100 lines
 * pm2 restart specboard   # Restart the process
 * pm2 reload specboard    # Zero-downtime reload
 * pm2 stop specboard      # Stop the process
 * pm2 delete specboard    # Remove from PM2
 * pm2 monit               # Real-time monitoring dashboard
 * ```
 *
 * @example Persist across reboots
 * ```bash
 * pm2 startup             # Generate startup script
 * pm2 save                # Save current process list
 * ```
 *
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

// Load environment variables from .env file
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  apps: [
    {
      /** @type {string} Process name in PM2 */
      name: 'specboard',
      /** @type {string} Path to the Next.js binary */
      script: 'node_modules/.bin/next',

      /** @type {string} Arguments passed to the script */
      args: 'start',

      /** @type {string} Working directory for the process */
      cwd: __dirname,

      /**
       * @type {number} Number of instances to run
       * @description Use 'max' for cluster mode with all CPU cores
       */
      instances: 1,

      /**
       * @type {'fork'|'cluster'} Execution mode
       * @description 'fork' for single instance, 'cluster' for load balancing
       */
      exec_mode: 'fork',

      /** @type {boolean} Auto-restart on crash */
      autorestart: true,

      /** @type {boolean} Watch for file changes (disable in production) */
      watch: false,

      /** @type {string} Restart if memory exceeds this limit */
      max_memory_restart: '500M',

      /**
       * Production environment variables
       * @description Includes all vars from .env plus production overrides
       */
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },

      /**
       * Development environment variables
       * @description Use with: pm2 start ecosystem.config.cjs --env development
       */
      env_development: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: process.env.PORT || 3000,
      },

      // ─────────────────────────────────────────────────────────────
      // Logging Configuration
      // ─────────────────────────────────────────────────────────────

      /** @type {string} Error log file path */
      error_file: 'logs/specboard-error.log',

      /** @type {string} Output log file path */
      out_file: 'logs/specboard-out.log',

      /** @type {string} Log timestamp format */
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      /** @type {boolean} Merge logs from all instances into single files */
      merge_logs: true,

      // ─────────────────────────────────────────────────────────────
      // Graceful Shutdown Configuration
      // ─────────────────────────────────────────────────────────────

      /** @type {number} Time (ms) to wait before force killing the process */
      kill_timeout: 5000,

      /** @type {boolean} Wait for process to send 'ready' signal */
      wait_ready: true,

      /** @type {number} Time (ms) to wait for 'ready' signal before considering started */
      listen_timeout: 10000,
    },
  ],
};
