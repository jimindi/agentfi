# PM2 Process Manager Setup

**Last Updated:** November 15, 2025 (Session 20)  
**Status:** Complete and Running

## Current Configuration

Both API and Worker are running under PM2 process manager with auto-restart and boot startup configured.

### Process Status
```bash
pm2 status
```

Expected output:
```
┌────┬───────────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name              │ mode    │ pid     │ uptime   │ ↺     │ status    │
├────┼───────────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 0  │ agentfi-api       │ cluster │ 1353924 │ running  │ 0     │ online    │
│ 1  │ agentfi-worker    │ cluster │ 1353925 │ running  │ 0     │ online    │
└────┴───────────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

## Configuration File

Location: `/root/agentfi-sdk/api/ecosystem.config.js`
```javascript
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
```

## Common Commands

### Status and Monitoring
```bash
# Check process status
pm2 status

# View logs (all processes)
pm2 logs

# View logs (specific process)
pm2 logs agentfi-api
pm2 logs agentfi-worker

# Real-time monitoring dashboard
pm2 monit

# Show process details
pm2 show agentfi-api
```

### Process Control
```bash
# Restart all processes
pm2 restart all

# Restart specific process
pm2 restart agentfi-api
pm2 restart agentfi-worker

# Stop all processes
pm2 stop all

# Stop specific process
pm2 stop agentfi-api

# Start processes (if stopped)
pm2 start ecosystem.config.js

# Delete all processes from PM2
pm2 delete all
```

### Configuration Management
```bash
# Save current process list
pm2 save

# Restore saved processes
pm2 resurrect

# Update PM2
npm install -g pm2@latest
pm2 update
```

## Auto-Start on Reboot

PM2 is configured to start automatically when the server reboots.

**Verify startup configuration:**
```bash
systemctl status pm2-root
```

**If you need to reconfigure startup:**
```bash
pm2 startup
# Run the command it outputs
pm2 save
```

**Disable auto-start:**
```bash
pm2 unstartup systemd
```

## Log Files

### Location
- API logs: `/root/agentfi-sdk/api/logs/api-*.log`
- Worker logs: `/root/agentfi-sdk/api/logs/worker-*.log`

### Viewing Logs
```bash
# Tail API logs
tail -f /root/agentfi-sdk/api/logs/api-out.log
tail -f /root/agentfi-sdk/api/logs/api-error.log

# Tail Worker logs
tail -f /root/agentfi-sdk/api/logs/worker-out.log
tail -f /root/agentfi-sdk/api/logs/worker-error.log
```

### Log Rotation
PM2 doesn't rotate logs by default. Consider setting up logrotate:
```bash
sudo cat > /etc/logrotate.d/agentfi << 'LOGROTATE'
/root/agentfi-sdk/api/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
LOGROTATE
```

## Troubleshooting

### Service Not Starting
```bash
# Check logs for errors
pm2 logs agentfi-api --err

# Try manual start to see errors
cd /root/agentfi-sdk/api
npm run dev
```

### Service Keeps Restarting
```bash
# Check restart count (↺ column)
pm2 status

# View recent error logs
pm2 logs agentfi-api --err --lines 100
```

### High Memory Usage
```bash
# Monitor resource usage
pm2 monit

# Restart to clear memory
pm2 restart all
```

### After Code Changes
```bash
# Always restart after pulling new code
git pull
pm2 restart all
```

## Production Best Practices

1. **Always save after changes:**
```bash
   pm2 restart all
   pm2 save
```

2. **Monitor logs regularly:**
```bash
   pm2 logs --lines 100
```

3. **Check status after server reboot:**
```bash
   pm2 status
   curl https://api.agentfi.divindi.tech/health
```

4. **Set up monitoring alerts:**
   - Use PM2 Plus (paid): `pm2 link`
   - Or external monitoring (UptimeRobot, Pingdom)

## Current Status

✅ **Operational**
- API running at: https://api.agentfi.divindi.tech
- Worker: Monitoring pending intents
- Auto-restart: Enabled
- Boot startup: Configured
- Logs: Being written to `/root/agentfi-sdk/api/logs/`

---

**Setup completed:** November 15, 2025 (Session 20)
