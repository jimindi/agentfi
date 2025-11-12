# Project State - Quick Reference
**Last Updated:** November 12, 2025  
**Branch:** agentfi-v2.0  
**Status:** ✅ Minimum validation working! Ready for larger amount testing.

## Quick Status

**What Works:**
- ✅ POST /v2/swap - Create swap with correct recipient + fees
- ✅ GET /v2/swap/:id - Check swap status
- ✅ Worker monitoring - Polls OneClick every 20s
- ✅ Direct delivery - USDC goes to user wallet automatically
- ✅ Platform fees - 15 bps deducted via appFees
- ✅ Minimum validation - $5 USD minimum enforced

**Next Task:** Test with larger amounts ($10-50) and add fee breakdown to response

## Latest Achievement

### ✅ Minimum Transaction Validation Implemented

**Feature:** $5 USD minimum enforced on all swaps

**Implementation:**
- Created TokenPriceService for real-time USD prices
- Fetches from Defuse token API with 1-minute cache
- Fallback prices if API unavailable
- Clear error messages for users

**Test Results (November 12, 2025):**
```bash
# Below minimum - REJECTED
0.01 wNEAR ($0.03) → "Transaction amount ($0.03) is below minimum of $5.00"

# Above minimum - ACCEPTED
2.2 wNEAR ($5.15) → Quote generated with deposit address
```

**Code Quality:**
- All 17 tests passing
- 7 new TokenPriceService tests
- Proper error handling (400 for validation)

## Previous Achievement

### ✅ Recipient Issue Fixed & Verified

**Problem:** USDC was stuck in intents.near contract requiring manual withdrawal

**Solution:** Changed `recipientType: "INTENTS"` → `"DESTINATION_CHAIN"`

**Result:** Funds now go directly to user's wallet automatically!

**Test Swap (November 12, 2025):**
- Intent ID: `173bd2dc-90f3-4d3c-afa8-2ac38d6d18e8`
- Input: 0.01 wNEAR ($0.0234 USD)
- Output: 0.022979 USDC delivered to wallet
- Platform fee: 15 bps (0.15%) deducted
- Completion time: ~6 minutes
- Status: ✅ SUCCESS
- Transaction: [F3xCMTfZ...](https://nearblocks.io/txns/F3xCMTfZwHK5pAyF4UDFmFFJshtnpkTXt6ZLWKBdkd4Y)

## Service Account

**Account ID:** 6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709
**NEAR Balance:** ~0.27 NEAR
**wNEAR Balance:** ~0.03 wNEAR (after test swaps)

### Note on Old Account
**Old Account:** 0bdbb89f... (inaccessible due to key mismatch)
**Stuck USDC:** 0.053174 USDC in intents.near (from tests with wrong recipientType)
**Status:** Cannot recover - documented for reference only
**Impact:** None - new account (6c379f0b...) works correctly with DESTINATION_CHAIN

## Complete Flow

1. Client calls `POST /v2/swap` with swap parameters
2. **API validates minimum amount ($5 USD)** ✅
3. API requests quote with `recipientType: DESTINATION_CHAIN` + `appFees: 15 bps`
4. Client transfers tokens to unique depositAddress
5. OneClick detects deposit, coordinates with solvers
6. **Solvers execute swap and deliver USDC directly to user's wallet** ✅
7. Worker polls status, updates database when SUCCESS
8. Client checks status: `GET /v2/swap/:id` returns complete data

## Platform Fees

**Rate:** 15 basis points (0.15%)
**Method:** Deducted from input token via OneClick `appFees` parameter
**Recipient:** Service wallet (6c379f0b...)
**Status:** ✅ Verified working

**Example:**
- User deposits: 2.2 wNEAR
- Platform fee: 0.0033 wNEAR (15 bps)
- Net input: 2.1967 wNEAR
- Output: ~5.64 USDC (at current rates)

## Minimum Transaction Amount

**Limit:** $5 USD minimum
**Method:** Real-time price validation via TokenPriceService
**Price Source:** Defuse token API (https://api-mng-console.chaindefuser.com/api/tokens)
**Cache:** 1 minute TTL
**Fallback:** Hardcoded approximate prices if API fails
**Status:** ✅ Implemented and tested

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "AMOUNT_TOO_LOW",
    "message": "Transaction amount ($0.03) is below minimum of $5.00"
  }
}
```

## Project Structure
```
/root/agentfi-sdk/
├── api/src/v2/
│   ├── services/
│   │   ├── OneClickService.ts    ✅ Fixed recipient + fees
│   │   ├── SwapService.ts        ✅ With minimum validation
│   │   └── TokenPriceService.ts  ✅ NEW - USD price fetching
│   ├── controllers/
│   │   └── SwapController.ts     ✅ Proper error codes
│   ├── routes/
│   │   ├── index.ts              ✅ Working
│   │   └── swap.routes.ts        ✅ Working
│   ├── workers/
│   │   ├── IntentMonitor.ts      ✅ Working
│   │   └── index.ts              ✅ Working
│   └── tests/                    ✅ 17 passing
│       ├── OneClickService.test.ts      (2 tests)
│       ├── SwapService.test.ts          (4 tests)
│       ├── SwapController.test.ts       (3 tests)
│       ├── TokenPriceService.test.ts    (7 tests) ✅ NEW
│       └── integration.test.ts          (1 test)
└── docs/v2.0/
    ├── STATE.md                  ✅ This file
    ├── PROGRESS.md               ✅ Updated
    ├── ONECLICK-API.md           ✅ Complete reference
    └── ONECLICK-FEES.md          ✅ Fee guide
```

## Next Steps

### High Priority
1. ⏳ Test with larger amounts ($10-50) to verify at scale
2. Add fee breakdown to API response (platform fee + network fee separately)
3. Add redundant price sources (CoinGecko, CoinMarketCap)

### Medium Priority
4. Implement webhook notifications
5. Add comprehensive error handling
6. Implement API key authentication
7. Add rate limiting

### Future
8. Production deployment
9. Multi-token support
10. Cross-chain swaps (ETH, SOL, BTC)
11. SDK libraries

## Running Services

Start API:
```bash
cd /root/agentfi-sdk/api && npm run dev
```

Start worker:
```bash
cd /root/agentfi-sdk/api && npm run worker
```

Test minimum validation (should fail):
```bash
curl -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"chain": "near", "token": "wNEAR", "amount": "10000000000000000000000"},
    "to": {"chain": "near", "token": "USDC"},
    "user": {"walletAddress": "test.near"}
  }'
```

Test above minimum (should succeed):
```bash
curl -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"chain": "near", "token": "wNEAR", "amount": "2200000000000000000000000"},
    "to": {"chain": "near", "token": "USDC"},
    "user": {"walletAddress": "YOUR_WALLET"}
  }'
```

Check status:
```bash
curl http://localhost:3000/v2/swap/{intentId} | jq
```

## Success Metrics

✅ Non-custodial: Funds never held by AgentFi
✅ Direct delivery: USDC goes straight to user wallet
✅ Fast execution: ~6 minutes from deposit to completion
✅ Platform fees: 15 bps successfully implemented
✅ Minimum validation: $5 USD minimum enforced
✅ Monitoring: Worker detects completion automatically
✅ Status tracking: API returns complete swap details
✅ Test coverage: 17 tests passing
