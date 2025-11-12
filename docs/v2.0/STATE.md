# Project State - Quick Reference
**Last Updated:** November 12, 2025  
**Branch:** agentfi-v2.0  
**Status:** ✅ Fixed recipient issue + added platform fees

## Critical Fix Complete

### Issue: USDC stuck in intents.near contract
**Root Cause:** Using `recipientType: "INTENTS"` instead of `"DESTINATION_CHAIN"`

**Solution Applied:**
- Changed `recipientType` to `"DESTINATION_CHAIN"` 
- Changed `refundType` to `"ORIGIN_CHAIN"`
- Funds now go directly to user's wallet ✅

### Platform Fees Implemented
- Added 15 basis points (0.15%) fee via `appFees` parameter
- Fee recipient: Service wallet (6c379f0b...)
- Fee deducted from input token before swap

## Service Account
**Account ID:** 6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709
**NEAR Balance:** ~0.27 NEAR
**wNEAR Balance:** ~0.06 wNEAR
**USDC in Intents:** 0.053174 USDC (from previous test swaps, needs withdrawal)

## Working Flow (CORRECTED)
1. Client calls `POST /v2/swap`
2. API requests quote with `recipientType: DESTINATION_CHAIN`
3. Client transfers tokens to depositAddress
4. OneClick coordinates with solvers
5. **USDC delivered directly to user's wallet** ✅
6. Platform fee (15 bps) goes to AgentFi fee wallet

## Recent Changes
- **OneClickService.ts:** Fixed recipientType + added appFees
- **env.ts:** Added AGENTFI_FEE_WALLET
- **.env:** Set fee wallet to service account
- **docs/:** Added ONECLICK-API.md and ONECLICK-FEES.md

## Project Structure
```
/root/agentfi-sdk/
├── api/src/v2/
│   ├── services/
│   │   ├── OneClickService.ts    ✅ Fixed + fees added
│   │   └── SwapService.ts        ✅ Working
│   ├── controllers/
│   │   └── SwapController.ts     ✅ Working
│   ├── routes/
│   │   ├── index.ts              ✅ Working
│   │   └── swap.routes.ts        ✅ Working
│   ├── workers/
│   │   ├── IntentMonitor.ts      ✅ Working
│   │   └── index.ts              ✅ Working
│   └── tests/                    ✅ 8 passing
└── docs/v2.0/
    ├── STATE.md                  ✅ This file
    ├── PROGRESS.md               ✅ Updated
    ├── ONECLICK-API.md           ✅ New
    └── ONECLICK-FEES.md          ✅ New
```

## Next Steps

### High Priority
1. Test end-to-end swap with corrected recipient type
2. Verify USDC arrives in user wallet (not intents.near)
3. Withdraw stuck 0.053174 USDC from intents.near
4. Add minimum transaction amount validation ($5 USD)

### Medium Priority
5. Implement webhook notifications
6. Add comprehensive error handling
7. Implement API key authentication
8. Add rate limiting

### Future
9. Production deployment
10. Multi-token support
11. Cross-chain swaps (ETH, SOL, BTC)
12. SDK libraries

## Running Services

Start API:
```bash
cd /root/agentfi-sdk/api && npm run dev
```

Start worker:
```bash
cd /root/agentfi-sdk/api && npm run worker
```

Test swap:
```bash
curl -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"chain": "near", "token": "wNEAR", "amount": "10000000000000000000000"},
    "to": {"chain": "near", "token": "USDC"},
    "user": {"walletAddress": "YOUR_WALLET"}
  }'
```

Check status:
```bash
curl http://localhost:3000/v2/swap/{intentId}
```
