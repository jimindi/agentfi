# AgentFi API - Quick Testing Guide

## Server Status

Check if server is running:
```bash
curl http://localhost:3000/health
```

## Available Endpoints

### 1. Get API Info
```bash
curl http://localhost:3000/v1
```

### 2. List Supported Chains
```bash
curl http://localhost:3000/v1/chains
```

### 3. List Supported Tokens
```bash
# All tokens
curl http://localhost:3000/v1/tokens

# Filter by chain
curl "http://localhost:3000/v1/tokens?chain=near"

# Search tokens
curl "http://localhost:3000/v1/tokens?search=usdc"
```

### 4. Get Quote
```bash
curl -X POST http://localhost:3000/v1/quote \
  -H "Content-Type: application/json" \
  -d '{
    "from": {
      "chain": "near",
      "token": "wNEAR",
      "amount": "1000000000000000000000000"
    },
    "to": {
      "chain": "near",
      "token": "USDC"
    }
  }'
```

### 5. Execute Swap (Mock)
```bash
curl -X POST http://localhost:3000/v1/swap \
  -H "Content-Type: application/json" \
  -d '{
    "from": {
      "chain": "near",
      "token": "wNEAR",
      "amount": "1000000000000000000000000"
    },
    "to": {
      "chain": "near",
      "token": "USDC"
    },
    "user": {
      "walletAddress": "agentfi-dev-1762307277.testnet"
    }
  }'
```

### 6. Check Swap Status
```bash
# Replace {intentId} with actual ID from swap response
curl http://localhost:3000/v1/swap/{intentId}
```

## Current Status

✅ Server running
✅ Health endpoint
✅ Quote endpoint (mock data)
✅ Tokens listing (fallback data)
✅ Chains listing
✅ Basic error handling

## Next Steps

- [ ] Integrate real NEAR Intents SDK for swaps
- [ ] Add authentication (API keys)
- [ ] Add rate limiting
- [ ] Create intent monitoring worker
- [ ] Add webhook notifications
