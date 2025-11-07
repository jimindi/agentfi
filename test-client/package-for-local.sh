#!/bin/bash
# Package test client for local machine use

echo "📦 Packaging AgentFi Test Client..."

# Create a tarball
tar -czf agentfi-test-client.tar.gz \
  package.json \
  tsconfig.json \
  test-swap-flow.ts \
  .env.example \
  README.md

echo "✅ Package created: agentfi-test-client.tar.gz"
echo ""
echo "📋 To use on your local machine:"
echo "1. Download: scp root@24.199.95.32:/root/agentfi-sdk/test-client/agentfi-test-client.tar.gz ."
echo "2. Extract: tar -xzf agentfi-test-client.tar.gz"
echo "3. Install: npm install"
echo "4. Configure: cp .env.example .env (edit with your settings)"
echo "5. Run: npm test"
