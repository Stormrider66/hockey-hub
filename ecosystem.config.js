// PM2 Configuration for Hockey Hub
module.exports = {
  apps: [
    {
      name: 'hockey-hub-frontend',
      script: 'pnpm',
      args: 'start',
      cwd: './apps/frontend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    },
    {
      name: 'hockey-hub-api-gateway',
      script: './dist/index.js',
      cwd: './services/api-gateway',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/api-gateway-error.log',
      out_file: './logs/api-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    },
    {
      name: 'hockey-hub-user-service',
      script: './dist/index.js',
      cwd: './services/user-service',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/user-service-error.log',
      out_file: './logs/user-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    },
    {
      name: 'hockey-hub-communication-service',
      script: './dist/index.js',
      cwd: './services/communication-service',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './logs/communication-service-error.log',
      out_file: './logs/communication-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'hockey-hub.com',
      ref: 'origin/main',
      repo: 'git@github.com:hockey-hub/hockey-hub.git',
      path: '/var/www/hockey-hub',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};