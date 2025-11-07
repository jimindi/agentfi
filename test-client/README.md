# AgentFi Test Client

Automated test client for AgentFi API with NEAR CLI integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure `.env`:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Ensure NEAR CLI is installed and configured:
```bash
near --version
```

## Usage

### Run Test
```bash
npm test
```

### Run with Debug Logging
```bash
npm run test:debug
```

### Configuration

Edit `.env` to configure:

- `API_BASE_URL` - AgentFi API endpoint
- `API_KEY` - Your API key (if required)
- `NEAR_NETWORK` - mainnet or testnet
- `NEAR_ACCOUNT_ID` - Your NEAR account
- `TEST_AMOUNT` - Amount to swap (in smallest unit)
- `FROM_TOKEN` - Source token (e.g., wNEAR)
- `TO_TOKEN` - Destination token (e.g., USDC)
- `MAX_WAIT_TIME` - Max time to wait for completion (ms)
- `POLL_INTERVAL` - Status check interval (ms)

## What It Does

1. ✅ Validates configuration
2. ✅ Checks initial token balance
3. ✅ Gets quote from API
4. ✅ Creates swap intent
5. ✅ Sends tokens via NEAR CLI
6. ✅ Polls for completion
7. ✅ Displays final results
8. ✅ Checks final balance

## Exit Codes

- `0` - Success (swap completed)
- `1` - Failure (swap failed or error)
- `2` - Incomplete (still processing)

## Example Output
```
╔═══════════════════════════════════════════════════════════╗
║         AgentFi Cross-Chain Swap Test Client            ║
╚═══════════════════════════════════════════════════════════╝

============================================================
STEP 0: Validating Configuration
============================================================
✅ API: http://localhost:3000/v1
✅ NEAR Network: mainnet
✅ NEAR Account: 0bdbb...
✅ Test Amount: 0.01 wNEAR
✅ Route: wNEAR → USDC

============================================================
STEP 1: Check Initial Balance
============================================================
ℹ️  Checking wNEAR balance...
✅ Balance: 0.050000 wNEAR

...
```

## Troubleshooting

### "Insufficient balance"
Ensure you have enough wNEAR in your account.

### "API key is invalid"
Check your API_KEY in .env or remove it for public endpoints.

### "near command not found"
Install NEAR CLI: `npm install -g near-cli`

### "Timeout: Swap did not complete"
Increase MAX_WAIT_TIME or check swap status manually.

## Notes

- ⚠️ This sends REAL tokens on mainnet
- ⚠️ Test with small amounts first
- ⚠️ 5-second cancellation window before sending
