/**
 * PM2 Ecosystem Configuration
 * 
 * Usage:
 *   pm2 start ecosystem.config.js                  # Start all apps
 *   pm2 start ecosystem.config.js --env production # Start in production mode
 *   pm2 stop ecosystem.config.js                   # Stop all apps
 *   pm2 restart ecosystem.config.js                # Restart all apps
 *   pm2 logs                                       # View all logs
 *   pm2 monit                                      # Monitor resources
 *   pm2 startup                                    # Enable auto-start on reboot
 *   pm2 save                                       # Save PM2 config
 */

module.exports = {
  apps: [
    // API Server
    {
      name: "ftth-api",
      script: "./api-server/dist/index.mjs",
      cwd: "./",
      instances: 1,
      
      // Environment variables
      env: {
        NODE_ENV: "development",
        LOG_LEVEL: "info",
      },
      env_production: {
        NODE_ENV: "production",
        LOG_LEVEL: "warn",
      },
      
      // Resource limits
      max_memory_restart: "512M",
      node_args: "--enable-source-maps",
      
      // Logging
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      listen_timeout: 5000,
      kill_timeout: 5000,
      
      // Graceful reload
      wait_ready: true,
      kill_timeout: 5000,
      
      // Source map support
      exec_mode: "fork",
    },

    // Frontend (Vite Preview)
    {
      name: "ftth-frontend",
      script: "pnpm",
      args: "--filter @workspace/ftth-calculator preview",
      cwd: "./",
      instances: 1,
      
      // Environment variables
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      
      // Resource limits
      max_memory_restart: "256M",
      
      // Logging
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      
      // Auto restart
      autorestart: true,
      max_restarts: 5,
      min_uptime: "10s",
      listen_timeout: 5000,
      kill_timeout: 5000,
    },
  ],

  // Deployment settings
  deploy: {
    production: {
      user: "app",
      host: "your-server.com",
      ref: "origin/main",
      repo: "git@github.com:yourorg/ftth-calculator.git",
      path: "/var/www/ftth-calculator",
      "post-deploy": "pnpm install --prod && pnpm --recursive build && pm2 restart ecosystem.config.js --env production",
      "pre-deploy-local": "echo 'Deploying to production'",
    },
  },
};
