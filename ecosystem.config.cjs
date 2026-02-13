module.exports = {
  apps: [
    {
      name: "askify-bot",
      script: "dist/app.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
      },
      // Logs
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
      // Restart behavior
      exp_backoff_restart_delay: 1000,
      max_restarts: 10,
      restart_delay: 5000,
    },
    // {
    //   name: 'askify-web',
    //   cwd: './web',
    //   script: 'npm',
    //   args: 'run preview',
    //   instances: 1,
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '256M',
    //   env: {
    //     NODE_ENV: 'production',
    //   },
    //   // Logs
    //   log_date_format: 'YYYY-MM-DD HH:mm:ss',
    //   merge_logs: true,
    //   // Restart behavior
    //   exp_backoff_restart_delay: 1000,
    //   max_restarts: 10,
    //   restart_delay: 5000,
    // },
  ],
};
