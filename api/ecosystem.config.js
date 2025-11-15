module.exports = {
  apps: [
    {
      name: 'agentfi-api',
      script: 'npm',
      args: 'run dev',
      cwd: '/root/agentfi-sdk/api',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/root/agentfi-sdk/api/logs/api-error.log',
      out_file: '/root/agentfi-sdk/api/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'agentfi-worker',
      script: 'npm',
      args: 'run worker',
      cwd: '/root/agentfi-sdk/api',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/root/agentfi-sdk/api/logs/worker-error.log',
      out_file: '/root/agentfi-sdk/api/logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
