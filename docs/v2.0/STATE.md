# Project State - Quick Reference
**Last Updated:** November 12, 2025  
**Branch:** agentfi-v2.0  
**Status:** ✅ Intent expiration implemented - production quality monitoring

## Quick Status

**What Works:**
- ✅ POST /v2/swap - Create swap with correct recipient + fees + fee breakdown
- ✅ GET /v2/swap/:id - Check swap status
- ✅ Worker monitoring - Polls OneClick every 20s
- ✅ Intent expiration - Auto-expires abandoned swaps after 24h
- ✅ Direct delivery - USDC goes to user wallet automatically
- ✅ Platform fees - 15 bps deducted via appFees
- ✅ Minimum validation - $5 USD minimum enforced
- ✅ Fee transparency - Platform fee + network fee shown separately
- ✅ Webhook notifications - Real-time swap completion alerts

**Next Task:** Implement API key authentication

## Latest Achievement

### ✅ Intent Expiration System

**Feature:** Automatic cleanup of abandoned swap intents

**Problem Solved:**
- 15 abandoned intents from testing were clogging worker logs
- Worker was polling OneClick API for swaps that would never complete
- No automatic cleanup of stale intents

**Implementation:**
- IntentMonitor checks intent age on startup and hourly
- Intents in `pending_deposit` status expire after 24 hours
- Expired intents marked with status `expired` and error message
- Worker skips expired intents in polling loop
- Cleaner logs - removed repetitive "still PENDING_DEPOSIT" messages

**Results:**
- Cleaned up 15 stale intents from Nov 11
- Worker now runs silently when no active swaps
- Hourly cleanup prevents accumulation
- Clear status tracking: 0 pending, 15 expired, 5 completed

## Previous Achievements

### ✅ Webhook Notifications
- Real-time HTTP callbacks when swaps complete or fail
- HMAC-SHA256 signatures for security
- Retry logic (3 attempts, 5 second delay)
- Complete documentation with examples

### ✅ Fee Breakdown
- Transparent platform + network fee display
- Human-readable formatted amounts
- Complete fee transparency

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

1. Client calls `POST /v2/swap` with swap parameters + optional webhookUrl
2. API validates minimum amount ($5 USD) ✅
3. API requests quote with `recipientType: DESTINATION_CHAIN` + `appFees: 15 bps`
4. API stores intent with webhookUrl in database ✅
5. API returns deposit address + transparent fee breakdown ✅
6. Client transfers tokens to unique depositAddress
7. OneClick detects deposit, coordinates with solvers
8. Solvers execute swap and deliver USDC directly to user's wallet ✅
9. Worker polls status every 20s, updates database when SUCCESS
10. Worker sends webhook notification with swap details ✅
11. Worker expires intents after 24h if no deposit ✅
12. Client checks status: `GET /v2/swap/:id` returns complete data

## Platform Fees

**Rate:** 15 basis points (0.15%)
**Method:** Deducted from input token via OneClick `appFees` parameter
**Recipient:** Service wallet (6c379f0b...)
**Display:** Shown separately in API response ✅
**Status:** ✅ Verified working with transparent breakdown

## Minimum Transaction Amount

**Limit:** $5 USD minimum
**Method:** Real-time price validation via TokenPriceService
**Price Source:** Defuse token API
**Cache:** 1 minute TTL
**Fallback:** Hardcoded approximate prices
**Status:** ✅ Implemented and tested

## Intent Expiration

**Timeout:** 24 hours from creation
**Check Interval:** Hourly (plus immediate on startup)
**Status Change:** pending_deposit → expired
**Error Message:** "Intent expired after 24 hours without deposit"
**Impact:** Keeps database clean, reduces unnecessary API calls
**Status:** ✅ Implemented and tested

## Webhooks

**URL:** Provided in `options.webhookUrl` field
**Events:** swap.completed, swap.failed
**Signature:** HMAC-SHA256 (sha256=...)
**Retries:** 3 attempts, 5 second delay
**Timeout:** 10 seconds per attempt
**Status:** ✅ Implemented and tested
**Documentation:** docs/v2.0/WEBHOOKS.md

## Project Structure
```
/root/agentfi-sdk/
├── api/src/v2/
│   ├── services/
│   │   ├── OneClickService.ts       ✅ With fee capture
│   │   ├── SwapService.ts           ✅ With fee formatting + webhook support
│   │   ├── TokenPriceService.ts     ✅ USD price fetching
│   │   └── WebhookService.ts        ✅ Webhook delivery
│   ├── controllers/
│   │   └── SwapController.ts        ✅ Returns fee breakdown
│   ├── types/
│   │   └── swap.types.ts            ✅ Updated with webhookUrl option
│   ├── routes/
│   │   ├── index.ts                 ✅ Working
│   │   └── swap.routes.ts           ✅ Working
│   ├── workers/
│   │   ├── IntentMonitor.ts         ✅ With webhook delivery + expiration
│   │   ├── IntentCleaner.ts         ✅ NEW - Expiration logic (unused, integrated into monitor)
│   │   └── index.ts                 ✅ Working
│   └── tests/                       ✅ 26 passing
│       ├── OneClickService.test.ts       (2 tests)
│       ├── SwapService.test.ts           (4 tests)
│       ├── SwapController.test.ts        (3 tests)
│       ├── TokenPriceService.test.ts     (7 tests)
│       ├── WebhookService.test.ts        (9 tests)
│       └── integration.test.ts           (1 test)
└── docs/v2.0/
    ├── STATE.md                     ✅ This file
    ├── PROGRESS.md                  ✅ Updated
    ├── WEBHOOKS.md                  ✅ Complete guide
    ├── ONECLICK-API.md              ✅ Complete reference
    └── ONECLICK-FEES.md             ✅ Fee guide
```

## Next Steps

### High Priority
1. Implement API key authentication
2. Add rate limiting
3. Comprehensive error handling

### Medium Priority
4. Production deployment
5. Multi-token support beyond wNEAR/USDC
6. Cross-chain swaps (ETH, SOL, BTC)

### Future
7. SDK libraries (TypeScript, Python)
8. Dashboard for monitoring
9. Analytics and reporting

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
    "from": {"chain": "near", "token": "wNEAR", "amount": "2200000000000000000000000"},
    "to": {"chain": "near", "token": "USDC"},
    "user": {"walletAddress": "YOUR_WALLET"},
    "options": {
      "webhookUrl": "https://your-app.com/webhook"
    }
  }'
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
✅ Fee transparency: Complete breakdown shown to users
✅ Real-time notifications: Webhooks on completion/failure
✅ Monitoring: Worker detects completion automatically
✅ Automatic cleanup: Expired intents removed after 24h
✅ Clean logs: No spam from abandoned swaps
✅ Status tracking: API returns complete swap details
✅ Test coverage: 26 tests passing
✅ Security: HMAC-SHA256 webhook signatures
