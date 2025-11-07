# AgentFi SDK - Deployment Guide

**Version:** 1.0.0  
**Last Updated:** November 7, 2025

---

## Overview

This guide covers deploying AgentFi SDK to production environments.

---

## Prerequisites

- Ubuntu 22.04 LTS server
- 2GB+ RAM
- Node.js 20 LTS
- PostgreSQL 16
- Redis 7
- Domain name with SSL
- NEAR mainnet account
- OneClick API JWT token

---

## Server Setup

### 1. Initial Server Configuration

    # Update system
    sudo apt update && sudo apt upgrade -y

    # Install Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs

    # Verify installation
    node --version  # Should show v20.x.x
    npm --version   # Should show v10.x.x

### 2. Install PostgreSQL 16

    # Add PostgreSQL repository
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    
    # Install PostgreSQL
    sudo apt update
    sudo apt install -y postgresql-16

    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql

    # Create database and user
    sudo -u postgres psql << EOF
    CREATE DATABASE agentfi;
    CREATE USER agentfi WITH ENCRYPTED PASSWORD 'secure_password';
    GRANT ALL PRIVILEGES ON DATABASE agentfi TO agentfi;
    \q
    EOF

### 3. Install Redis 7

    # Install Redis
    sudo apt install -y redis-server

    # Configure Redis for production
    sudo nano /etc/redis/redis.conf
    # Set: maxmemory 256mb
    # Set: maxmemory-policy allkeys-lru

    # Restart Redis
    sudo systemctl restart redis
    sudo systemctl enable redis

### 4. Install Nginx

    # Install Nginx
    sudo apt install -y nginx

    # Start and enable Nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx

---

## Application Deployment

### 1. Clone Repository

    # Create application directory
    sudo mkdir -p /var/www/agentfi
    sudo chown $USER:$USER /var/www/agentfi

    # Clone repository
    cd /var/www/agentfi
    git clone https://github.com/your-org/agentfi-sdk.git .

### 2. Install Dependencies

    cd /var/www/agentfi/api
    npm ci --production

### 3. Configure Environment

    # Create .env file
    nano /var/www/agentfi/api/.env

Add the following configuration:

    # Node Environment
    NODE_ENV=production
    PORT=3000

    # Database
    DATABASE_URL=postgresql://agentfi:secure_password@localhost:5432/agentfi

    # Redis
    REDIS_URL=redis://localhost:6379

    # NEAR Configuration
    NEAR_NETWORK=mainnet
    NEAR_ACCOUNT_ID=your-account.near
    NEAR_PRIVATE_KEY=ed25519:your-private-key-here

    # OneClick API
    ONECLICK_JWT_TOKEN=your-jwt-token-here

    # Security
    JWT_SECRET=generate-random-32-char-string
    WEBHOOK_SECRET=generate-random-32-char-string

Generate secure secrets:

    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

### 4. Setup Database

    cd /var/www/agentfi/api
    
    # Generate Prisma client
    npx prisma generate

    # Run migrations
    npx prisma migrate deploy

### 5. Build Application

    cd /var/www/agentfi/api
    npm run build

---

## Process Management with PM2

### 1. Install PM2

    sudo npm install -g pm2

### 2. Create PM2 Ecosystem File

    nano /var/www/agentfi/api/ecosystem.config.js

Add the following:

    module.exports = {
      apps: [
        {
          name: 'agentfi-api',
          script: './dist/server.js',
          instances: 2,
          exec_mode: 'cluster',
          env: {
            NODE_ENV: 'production',
            PORT: 3000
          },
          error_file: '/var/log/agentfi/api-error.log',
          out_file: '/var/log/agentfi/api-out.log',
          log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
          merge_logs: true
        },
        {
          name: 'agentfi-worker',
          script: './dist/worker.js',
          instances: 1,
          env: {
            NODE_ENV: 'production'
          },
          error_file: '/var/log/agentfi/worker-error.log',
          out_file: '/var/log/agentfi/worker-out.log',
          log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
        }
      ]
    };

### 3. Create Log Directory

    sudo mkdir -p /var/log/agentfi
    sudo chown $USER:$USER /var/log/agentfi

### 4. Start Application

    cd /var/www/agentfi/api
    pm2 start ecosystem.config.js

    # Save PM2 configuration
    pm2 save

    # Setup PM2 to start on boot
    pm2 startup
    # Follow the instructions output by the command

### 5. Monitor Application

    # View status
    pm2 status

    # View logs
    pm2 logs agentfi-api
    pm2 logs agentfi-worker

    # Restart application
    pm2 restart agentfi-api
    pm2 restart agentfi-worker

---

## Nginx Configuration

### 1. Create Nginx Config

    sudo nano /etc/nginx/sites-available/agentfi

Add the following:

    upstream agentfi_api {
        server 127.0.0.1:3000;
        keepalive 64;
    }

    server {
        listen 80;
        server_name api.agentfi.io;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.agentfi.io;

        # SSL certificates (managed by Certbot)
        ssl_certificate /etc/letsencrypt/live/api.agentfi.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.agentfi.io/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Proxy settings
        location / {
            proxy_pass http://agentfi_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Rate limiting
        limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
        limit_req zone=api_limit burst=20 nodelay;

        # Access logs
        access_log /var/log/nginx/agentfi-access.log;
        error_log /var/log/nginx/agentfi-error.log;
    }

### 2. Enable Site

    sudo ln -s /etc/nginx/sites-available/agentfi /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx

### 3. Setup SSL with Certbot

    # Install Certbot
    sudo apt install -y certbot python3-certbot-nginx

    # Get SSL certificate
    sudo certbot --nginx -d api.agentfi.io

    # Test auto-renewal
    sudo certbot renew --dry-run

---

## Firewall Configuration

    # Install UFW
    sudo apt install -y ufw

    # Configure firewall
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS

    # Enable firewall
    sudo ufw enable

---

## Monitoring Setup

### 1. Setup Log Rotation

    sudo nano /etc/logrotate.d/agentfi

Add:

    /var/log/agentfi/*.log {
        daily
        rotate 14
        compress
        delaycompress
        notifempty
        create 0640 $USER $USER
        sharedscripts
        postrotate
            pm2 reloadLogs
        endscript
    }

### 2. Setup Health Monitoring

Create a simple health check script:

    nano /usr/local/bin/check-agentfi-health.sh

Add:

    #!/bin/bash
    
    HEALTH_URL="https://api.agentfi.io/health"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
    
    if [ "$RESPONSE" != "200" ]; then
        echo "AgentFi API health check failed: HTTP $RESPONSE"
        # Send alert (email, Slack, PagerDuty, etc.)
        # pm2 restart agentfi-api
    fi

Make executable:

    sudo chmod +x /usr/local/bin/check-agentfi-health.sh

Add to crontab:

    crontab -e
    # Add: */5 * * * * /usr/local/bin/check-agentfi-health.sh

---

## Backup Strategy

### 1. Database Backups

Create backup script:

    nano /usr/local/bin/backup-agentfi-db.sh

Add:

    #!/bin/bash
    
    BACKUP_DIR="/var/backups/agentfi"
    DATE=$(date +%Y%m%d_%H%M%S)
    
    mkdir -p $BACKUP_DIR
    
    pg_dump -U agentfi agentfi | gzip > $BACKUP_DIR/agentfi_$DATE.sql.gz
    
    # Keep only last 30 days
    find $BACKUP_DIR -name "agentfi_*.sql.gz" -mtime +30 -delete

Make executable:

    sudo chmod +x /usr/local/bin/backup-agentfi-db.sh

Add to crontab (daily at 2 AM):

    crontab -e
    # Add: 0 2 * * * /usr/local/bin/backup-agentfi-db.sh

### 2. Application Backups

    # Backup .env file (encrypted)
    tar czf agentfi-env-backup.tar.gz /var/www/agentfi/api/.env
    gpg -c agentfi-env-backup.tar.gz
    
    # Store encrypted backup securely off-server

---

## Updates and Maintenance

### Update Application

    cd /var/www/agentfi
    
    # Pull latest code
    git pull origin main
    
    # Install dependencies
    cd api
    npm ci --production
    
    # Run migrations
    npx prisma migrate deploy
    
    # Build application
    npm run build
    
    # Restart services
    pm2 restart all

### Database Maintenance

    # Vacuum database weekly
    sudo -u postgres psql -d agentfi -c "VACUUM ANALYZE;"

---

## Security Checklist

- [ ] SSH key-only authentication enabled
- [ ] Firewall configured (UFW)
- [ ] SSL certificates installed and auto-renewing
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] Regular security updates applied
- [ ] Log rotation configured
- [ ] Backups automated and tested
- [ ] Monitoring and alerts configured
- [ ] Rate limiting enabled

---

## Troubleshooting

### API Not Responding

    # Check PM2 status
    pm2 status
    
    # Check logs
    pm2 logs agentfi-api
    
    # Restart if needed
    pm2 restart agentfi-api

### Database Connection Issues

    # Check PostgreSQL status
    sudo systemctl status postgresql
    
    # Check connection
    psql -U agentfi -d agentfi -h localhost
    
    # Check logs
    sudo tail -f /var/log/postgresql/postgresql-16-main.log

### Worker Not Processing

    # Check worker status
    pm2 logs agentfi-worker
    
    # Restart worker
    pm2 restart agentfi-worker

### High Memory Usage

    # Check process memory
    pm2 monit
    
    # Restart with lower instances
    pm2 scale agentfi-api 1

---

## Performance Tuning

### PostgreSQL Optimization

    sudo nano /etc/postgresql/16/main/postgresql.conf

Adjust based on server resources:

    shared_buffers = 256MB
    effective_cache_size = 1GB
    maintenance_work_mem = 64MB
    checkpoint_completion_target = 0.9
    wal_buffers = 16MB
    default_statistics_target = 100
    random_page_cost = 1.1
    effective_io_concurrency = 200
    work_mem = 4MB
    min_wal_size = 1GB
    max_wal_size = 4GB

Restart PostgreSQL:

    sudo systemctl restart postgresql

### Node.js Optimization

Adjust PM2 instances based on CPU cores:

    pm2 scale agentfi-api 4  # For 4-core server

---

## Rollback Procedure

If deployment fails:

    cd /var/www/agentfi
    
    # Revert to previous commit
    git log --oneline -n 10
    git reset --hard COMMIT_HASH
    
    # Rebuild
    cd api
    npm ci --production
    npm run build
    
    # Restart
    pm2 restart all

---

**Last Updated:** November 7, 2025  
**Version:** 1.0.0
