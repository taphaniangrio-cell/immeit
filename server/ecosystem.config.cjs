module.exports = {
  apps: [
    {
      name: 'immeit',
      script: require('path').join(__dirname, 'server.js'),
      cwd: __dirname,
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
      script: require('path').join(__dirname, 'tunnel-cf.js'),
      cwd: __dirname,
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
