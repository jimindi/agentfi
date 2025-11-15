# AgentFi SDK v2.0 - Production Deployment Guide

**Last Updated:** November 15, 2025 (Session 20)  
**Target Server:** api.agentfi.divindi.tech  
**Status:** Ready for Production

## Environment Configuration

### Create Production .env File
```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

DATABASE_URL=postgresql://agentfi:PASSWORD@localhost:5433/agentfi_prod
REDIS_URL=redis://localhost:6379

NEAR_NETWORK=mainnet
NEAR_ACCOUNT_ID=your-mainnet-account.near
NEAR_PUBLIC_KEY=ed25519:YourPublicKey
NEAR_PRIVATE_KEY=ed25519:YourPrivateKey

ONECLICK_JWT_TOKEN=your_production_token

JWT_SECRET=generate_secure_32_chars_minimum
WEBHOOK_SECRET=generate_secure_32_chars_minimum

API_BASE_URL=https://api.agentfi.divindi.tech

FEE_RECIPIENT_ACCOUNT=your-fee-account.near
PLATFORM_FEE_BPS=15
MIN_SWAP_VALUE_USD=5.00
AGENTFI_FEE_WALLET=your-fee-wallet.near
```

## Process Management with PM2
```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start ecosystem.config.js --env production

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

## Nginx Configuration
```nginx
server {
    server_name api.agentfi.divindi.tech;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.agentfi.divindi.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.agentfi.divindi.tech/privkey.pem;
}
```

## Testing Production
```bash
# Health check
curl https://api.agentfi.divindi.tech/health

# List tokens
curl https://api.agentfi.divindi.tech/v2/tokens

# Test swap flow
curl -X POST https://api.agentfi.divindi.tech/v2/swap \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":{"chain":"near","token":"wNEAR","amount":"1000000000000000000000000"},"to":{"chain":"near","token":"USDC"},"user":{"walletAddress":"test.near"}}'
```

## Monitoring

- Uptime monitoring (UptimeRobot)
- Error tracking (Sentry)
- Log aggregation (Logtail)

## Backup Strategy
```bash
# Daily database backups
pg_dump -U agentfi_prod agentfi_prod > backup_$(date +%Y%m%d).sql
```

---

**Deployment Checklist:**
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] PM2 services running
- [ ] Worker monitoring intents
- [ ] Health check passing
- [ ] Backups configured
