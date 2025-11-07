#!/bin/bash

cd /root/agentfi-sdk/client

echo "📦 Creating deployment package..."

# Create tarball
tar -czf ../agentfi-hybrid-client.tar.gz \
  package.json \
  tsconfig.json \
  .env.example \
  README.md \
  src/

echo "✅ Package created: /root/agentfi-sdk/agentfi-hybrid-client.tar.gz"
echo ""
echo "📥 To deploy to local machine:"
echo "   scp root@24.199.95.32:/root/agentfi-sdk/agentfi-hybrid-client.tar.gz ."
echo "   tar -xzf agentfi-hybrid-client.tar.gz"
echo "   cd client && npm install"
echo "   cp .env.example .env"
echo "   nano .env  # Add your credentials"
echo "   npm run test:swap"
