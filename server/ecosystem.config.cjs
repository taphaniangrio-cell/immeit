module.exports = {
  apps: [
    {
      name: 'immeit',
      script: 'server.js',
      cwd: '.',
      env: { NODE_ENV: 'production' },
      watch: false,
      max_memory_restart: '300M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'immeit-tunnel',
      script: 'tunnel.js',
      cwd: '.',
      env: { NODE_ENV: 'production' },
      watch: false,
      max_memory_restart: '100M',
      error_file: './logs/tunnel-err.log',
      out_file: './logs/tunnel-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true
    }
  ]
};
