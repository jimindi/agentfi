# AgentFi Hybrid API - Test Client

Test client for the AgentFi cross-chain swap API using the new hybrid approach.

## Features

- ✅ Uses AgentFi hybrid API (OneClick quotes + direct contract execution)
- ✅ Handles deposit instructions from API
- ✅ Executes NEAR CLI commands automatically
- ✅ Monitors swap completion via background worker
- ✅ Full error handling and detailed logging
- ✅ Non-custodial throughout the flow

## Prerequisites

1. **Node.js 20+** installed
2. **NEAR CLI** installed: `npm install -g near-cli`
3. **NEAR account** with wNEAR balance
4. **AgentFi API** running and accessible

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env
```

Fill in your values:
```env
AGENTFI_API_URL=http://24.199.95.32:3000/v1
NEAR_NETWORK=mainnet
NEAR_ACCOUNT_ID=your-account.near
FROM_AMOUNT=10000000000000000000000
```

### 3. Run Test
```bash
npm run test:swap
```

## What It Does

The test client executes a complete swap flow:

1. **Creates Intent** - Calls API to create swap intent
2. **Gets Instructions** - Receives deposit instructions from API
3. **Executes Deposit** - Sends tokens to intents.near via NEAR CLI
4. **Monitors Status** - Polls API until swap completes
5. **Reports Results** - Shows final output and transaction hash

## Expected Output
```
╔═══════════════════════════════════════════════════════════╗
║     AgentFi Hybrid API - Mainnet Swap Test Client        ║
╚═══════════════════════════════════════════════════════════╝

⚙️  Configuration:
   API:     http://24.199.95.32:3000/v1
   Network: mainnet
   Account: your-account.near
   From:    wNEAR on near
   To:      USDC on near
   Amount:  10000000000000000000000

🚀 Starting complete swap flow...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 STEP 1: Creating Swap Intent

📝 Creating swap intent via API...
   ✓ Intent ID: 4cea6f94-3d0d-4060-b898-e988d8fd6e36
   ✓ Status: pending_deposit
   ✓ Estimated output: 0.020339 USDC
   ✓ Total fees: $0.519

💰 STEP 2: Depositing Tokens

💸 Executing deposit via NEAR CLI...
   Command: near call wrap.near ft_transfer_call...
✅ Deposit executed successfully

⏱️  STEP 3: Monitoring Completion

⏳ Monitoring swap 4cea6f94-3d0d-4060-b898-e988d8fd6e36...
   Checking every 5s for up to 180s
   [1] Status: starting → deposited
   [5] Status: deposited → executing
   [12] Status: executing → completed
✅ Swap completed successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FINAL RESULTS:

   From: 0.010000 wNEAR
   To:   0.020245 USDC
   Time: 23456ms
   TX:   ABC123DEF456...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SUCCESS! Swap completed.

   View on NEAR Explorer:
   https://nearblocks.io/txns/ABC123DEF456...
```

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AGENTFI_API_URL` | AgentFi API endpoint | `http://24.199.95.32:3000/v1` |
| `AGENTFI_API_KEY` | API key (optional) | `sk_live_...` |
| `NEAR_NETWORK` | NEAR network | `mainnet` or `testnet` |
| `NEAR_ACCOUNT_ID` | Your NEAR account | `your-account.near` |
| `NEAR_PRIVATE_KEY` | NEAR private key | `ed25519:...` |
| `FROM_CHAIN` | Source blockchain | `near` |
| `FROM_TOKEN` | Source token | `wNEAR` |
| `FROM_AMOUNT` | Amount in smallest units | `10000000000000000000000` |
| `TO_CHAIN` | Destination blockchain | `near` |
| `TO_TOKEN` | Destination token | `USDC` |
| `POLL_INTERVAL_MS` | Status check interval | `5000` |
| `MAX_WAIT_TIME_MS` | Max wait time | `180000` |

### Understanding Token Amounts

All amounts use the smallest unit (like wei for ETH):

| Token | Decimals | Formatted | Raw Amount |
|-------|----------|-----------|------------|
| wNEAR | 24 | 0.01 NEAR | 10000000000000000000000 |
| USDC | 6 | 1.00 USDC | 1000000 |
| ETH | 18 | 0.1 ETH | 100000000000000000 |

## Deployment to Local Machine

To run on your local machine:

1. **Download client:**
```bash
scp -r root@24.199.95.32:/root/agentfi-sdk/client ./agentfi-client
cd agentfi-client
```

2. **Install:**
```bash
npm install
```

3. **Configure:**
```bash
cp .env.example .env
nano .env
# Add your NEAR credentials
```

4. **Run:**
```bash
npm run test:swap
```

## Troubleshooting

### "near: command not found"

Install NEAR CLI:
```bash
npm install -g near-cli
```

### "API connection refused"

Check API is running:
```bash
curl http://24.199.95.32:3000/health
```

### "Invalid private key"

Ensure format is correct:
```
ed25519:5abc...xyz
```

Get from credentials:
```bash
cat ~/.near-credentials/mainnet/your-account.near.json
```

### "Insufficient balance"

Check your wNEAR balance:
```bash
near view wrap.near ft_balance_of '{"account_id":"your-account.near"}'
```

## Important Notes

⚠️ **This sends REAL tokens on mainnet**
- Test with small amounts first (0.01 wNEAR ≈ $0.02)
- Tokens go to intents.near contract
- Swaps typically complete in 20-60 seconds
- You maintain full control (non-custodial)

## Support

- Documentation: https://docs.agentfi.io
- Issues: support@divindi.tech
- API Status: curl http://24.199.95.32:3000/health

## License

MIT
