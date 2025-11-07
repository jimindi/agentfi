# AgentFi Test Client - Local Usage Guide

Run end-to-end swap tests from your local machine against the AgentFi API.

## Prerequisites

1. **Node.js 20+** installed
2. **NEAR CLI** installed and configured
3. **Your NEAR account** with wNEAR balance
4. **Internet connection** to reach API server

## Quick Setup
```bash
# 1. Extract package
tar -xzf agentfi-test-client.tar.gz
cd test-client

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 4. Run test
npm test
```

## Configuration

Edit `.env` with your details:
```env
API_BASE_URL=https://api.agentfi.divindi.tech/v1
NEAR_ACCOUNT_ID=your-account.near
TEST_AMOUNT=10000000000000000000000
```

## What It Does

1. ✅ Checks your wNEAR balance
2. ✅ Gets quote from API
3. ✅ Creates swap intent
4. ✅ **Sends your tokens via NEAR CLI** (5 second cancel window)
5. ✅ Monitors swap completion
6. ✅ Reports final results

## Important Notes

⚠️ **This sends REAL tokens on mainnet**
- Start with small amounts (0.01 wNEAR)
- You have 5 seconds to cancel (Ctrl+C)
- Test deposits go to OneClick Protocol
- Swaps typically complete in 20-60 seconds

## Troubleshooting

**"NEAR CLI not found"**
```bash
npm install -g near-cli
```

**"Insufficient balance"**
- Check you have enough wNEAR
- Run: `near view wrap.near ft_balance_of '{"account_id": "your-account.near"}'`

**"API connection refused"**
- Check API_BASE_URL in .env
- Ensure API server is running

## Support

- API Docs: https://docs.agentfi.divindi.tech
- Issues: support@divindi.tech
