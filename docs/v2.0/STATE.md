# Project State - Quick Reference
**Last Updated:** November 12, 2025  
**Branch:** agentfi-v2.0  
**Status:** ✅ Fee breakdown implemented! Ready for production features.

## Quick Status

**What Works:**
- ✅ POST /v2/swap - Create swap with correct recipient + fees + **fee breakdown**
- ✅ GET /v2/swap/:id - Check swap status
- ✅ Worker monitoring - Polls OneClick every 20s
- ✅ Direct delivery - USDC goes to user wallet automatically
- ✅ Platform fees - 15 bps deducted via appFees
- ✅ Minimum validation - $5 USD minimum enforced
- ✅ **Fee transparency - Platform fee + network fee shown separately**

**Next Task:** Add redundant price sources (CoinGecko, CoinMarketCap)

## Latest Achievement

### ✅ Fee Breakdown Added to API Response

**Feature:** Transparent fee display showing platform and network fees separately

**Implementation:**
- Enhanced OneClickService to capture fee details from quote
- Added fee calculation in SwapService (15 bps platform fee)
- Formatted fees for easy reading (e.g., "0.003300 wNEAR")
- Updated all tests to include new fee structure

**Response Example:**
```json
{
  "fees": {
    "platformFeeBps": 15,
    "platformFeeAmount": "3300000000000000000000",
    "platformFeeFormatted": "0.003300 wNEAR",
    "networkFeeEstimate": "500000000000000000000000",
    "networkFeeFormatted": "0.500000 NEAR",
    "totalFeeFormatted": "0.503300 NEAR (approx)"
  }
}
```

**Test Results (November 12, 2025):**
- All 17 tests passing
- API response includes complete fee breakdown
- Calculations verified: 15 bps of 2.2 wNEAR = 0.0033 wNEAR ✅

## Previous Achievements

### ✅ Minimum Transaction Validation ($5 USD)
- TokenPriceService for real-time USD prices
- $5 USD minimum enforced on all swaps
- Clear error messages for users

### ✅ Recipient Issue Fixed & Platform Fees
- Changed `recipientType: "INTENTS"` → `"DESTINATION_CHAIN"`
- Funds go directly to user's wallet
- Platform fee: 15 bps via appFees parameter

**Verified Test Swap:**
- Input: 4.27 wNEAR ($10 USD)
- Output: 10.602487 USDC delivered to wallet
- Platform fee: 15 bps deducted
- Completion time: ~43 seconds
- Status: ✅ SUCCESS

## Service Account

**Account ID:** 6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709
**NEAR Balance:** ~3.52 NEAR
**wNEAR Balance:** ~5.73 wNEAR

### Note on Old Account
**Old Account:** 0bdbb89f... (inaccessible due to key mismatch)
**Stuck USDC:** 0.053174 USDC in intents.near
**Status:** Cannot recover - documented for reference only
**Impact:** None - new account works correctly

## Complete Flow

1. Client calls `POST /v2/swap` with swap parameters
2. API validates minimum amount ($5 USD) ✅
3. API requests quote with `recipientType: DESTINATION_CHAIN` + `appFees: 15 bps`
4. **API returns deposit address + transparent fee breakdown** ✅
5. Client transfers tokens to unique depositAddress
6. OneClick detects deposit, coordinates with solvers
7. Solvers execute swap and deliver USDC directly to user's wallet ✅
8. Worker polls status, updates database when SUCCESS
9. Client checks status: `GET /v2/swap/:id` returns complete data

## Platform Fees

**Rate:** 15 basis points (0.15%)
**Method:** Deducted from input token via OneClick `appFees` parameter
**Recipient:** Service wallet (6c379f0b...)
**Display:** Shown separately in API response ✅
**Status:** ✅ Verified working with transparent breakdown

**Example Fee Breakdown:**
```json
{
  "platformFeeBps": 15,
  "platformFeeAmount": "3300000000000000000000",
  "platformFeeFormatted": "0.003300 wNEAR",
  "networkFeeEstimate": "500000000000000000000000",
  "networkFeeFormatted": "0.500000 NEAR",
  "totalFeeFormatted": "0.503300 NEAR (approx)"
}
```

## Minimum Transaction Amount

**Limit:** $5 USD minimum
**Method:** Real-time price validation via TokenPriceService
**Price Source:** Defuse token API
**Cache:** 1 minute TTL
**Fallback:** Hardcoded approximate prices
**Status:** ✅ Implemented and tested

## Project Structure
```
/root/agentfi-sdk/
├── api/src/v2/
│   ├── services/
│   │   ├── OneClickService.ts    ✅ With fee capture
│   │   ├── SwapService.ts        ✅ With fee formatting
│   │   └── TokenPriceService.ts  ✅ USD price fetching
│   ├── controllers/
│   │   └── SwapController.ts     ✅ Returns fee breakdown
│   ├── types/
│   │   └── swap.types.ts         ✅ Updated with fee structure
│   ├── routes/
│   │   ├── index.ts              ✅ Working
│   │   └── swap.routes.ts        ✅ Working
│   ├── workers/
│   │   ├── IntentMonitor.ts      ✅ Working
│   │   └── index.ts              ✅ Working
│   └── tests/                    ✅ 17 passing
│       ├── OneClickService.test.ts      (2 tests)
│       ├── SwapService.test.ts          (4 tests) ✅ Updated
│       ├── SwapController.test.ts       (3 tests)
│       ├── TokenPriceService.test.ts    (7 tests)
│       └── integration.test.ts          (1 test)
└── docs/v2.0/
    ├── STATE.md                  ✅ This file
    ├── PROGRESS.md               ✅ Updated
    ├── ONECLICK-API.md           ✅ Complete reference
    └── ONECLICK-FEES.md          ✅ Fee guide
```

## Next Steps

### High Priority
1. Add redundant price sources (CoinGecko, CoinMarketCap)
2. Implement webhook notifications
3. Add comprehensive error handling

### Medium Priority
4. Implement API key authentication
5. Add rate limiting
6. Production deployment

### Future
7. Multi-token support
8. Cross-chain swaps (ETH, SOL, BTC)
9. SDK libraries

## Running Services

Start API:
```bash
cd /root/agentfi-sdk/api && npm run dev
```

Start worker:
```bash
cd /root/agentfi-sdk/api && npm run worker
```

Test swap with fee breakdown:
```bash
curl -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"chain": "near", "token": "wNEAR", "amount": "2200000000000000000000000"},
    "to": {"chain": "near", "token": "USDC"},
    "user": {"walletAddress": "YOUR_WALLET"}
  }' | jq '.data.fees'
```

Check status:
```bash
curl http://localhost:3000/v2/swap/{intentId} | jq
```

## Success Metrics

✅ Non-custodial: Funds never held by AgentFi
✅ Direct delivery: USDC goes straight to user wallet
✅ Fast execution: ~43 seconds for $10 swap
✅ Platform fees: 15 bps successfully implemented
✅ Minimum validation: $5 USD minimum enforced
✅ **Fee transparency: Complete breakdown shown to users**
✅ Monitoring: Worker detects completion automatically
✅ Status tracking: API returns complete swap details
✅ Test coverage: 17 tests passing
