module.exports = {
  apps: [{
    name: 'immeit-server',
    script: './server.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    watch: false,
    max_restarts: 10,
    restart_delay: 3000,
    exp_backoff_restart_delay: 100,
  }]
};
