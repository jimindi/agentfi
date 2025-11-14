# Project State - Quick Reference
**Last Updated:** November 14, 2025  
**Branch:** agentfi-v2.0  
**Status:** 🔄 Implementing multi-token support - SwapService update needed

## Quick Status

**What Works:**
- ✅ POST /v2/swap - Create swap (requires API key, rate limited: 10/min)
  - ⚠️ Currently limited to wNEAR/USDC only (SwapService needs update)
- ✅ GET /v2/swap/:id - Check swap status (public, rate limited: 100/hour per IP)
- ✅ POST /v2/auth/api-key - Create API key (public, rate limited: 5/min)
- ✅ GET /v2/auth/api-keys - List API keys (requires authentication)
- ✅ DELETE /v2/auth/api-key/:id - Revoke API key (requires authentication)
- ✅ Worker monitoring - Polls OneClick every 20s
- ✅ Intent expiration - Auto-expires abandoned swaps after 24h
- ✅ Direct delivery - USDC goes to user wallet automatically
- ✅ Platform fees - 15 bps deducted via appFees
- ✅ Minimum validation - $5 USD minimum enforced
- ✅ Fee transparency - Platform fee + network fee shown separately
- ✅ Webhook notifications - Real-time swap completion alerts
- ✅ API key authentication - Secure bcrypt-based auth
- ✅ Rate limiting - Redis-based multi-tier protection
- ✅ Error handling - Comprehensive custom error system
- ✅ TokenService - Dynamic token discovery and caching
- ✅ TokenPriceService - Real-time pricing from OneClick

**Next Task:** Update SwapService to use TokenService (remove hardcoded wNEAR/USDC)

## Current Development Focus

### 🔄 Multi-Token Support Implementation (60% Complete)

**Goal:** Support all 117+ tokens available through OneClick API across 22+ blockchains

**Progress:**
- ✅ Phase 1: TokenService implementation (DONE)
- ✅ Phase 2: TokenPriceService update (DONE)
- ✅ Phase 3: Type definitions update (DONE)
- ⏳ Phase 4: SwapService update (IN PROGRESS)
- ⏳ Phase 5: TokenController creation (TODO)
- ⏳ Phase 6: Token routes integration (TODO)
- ⏳ Phase 7: Test updates (TODO)
- ⏳ Phase 8: App.ts initialization (TODO)

**Completed Components:**

1. **TokenService** ✅
   - Fetches 117+ tokens from OneClick `/v0/tokens`
   - In-memory caching with 1-hour TTL
   - Supports hybrid input: symbol+chain OR assetId
   - Handles native tokens (no contractAddress) and contract tokens (with contractAddress)
   - Graceful ambiguity detection with helpful error messages
   - 30 tests passing

2. **TokenPriceService** ✅
   - Uses TokenService for dynamic pricing
   - Real-time prices from OneClick cache
   - Validates $5 USD minimum with actual prices
   - Formats amounts and USD values for display
   - 15 tests passing

3. **Type Definitions** ✅
   - SwapRequest: Supports hybrid input (chain+token OR assetId)
   - TokenInfo: Includes optional contractAddress
   - FeeBreakdown: Enhanced with USD values
   - SwapResult: Full token details in response

**Next Steps:**

1. **Update SwapService** (HIGH PRIORITY)
   - Remove hardcoded wNEAR/USDC logic
   - Inject TokenService dependency
   - Resolve tokens dynamically using TokenService.resolveToken()
   - Build enhanced responses with full token details
   - Update validation to use new TokenPriceService API

2. **Create TokenController**
   - GET /v2/tokens - List all tokens (with filtering)
   - GET /v2/tokens?chain=near - Filter by blockchain
   - GET /v2/tokens?symbol=USDC - Filter by symbol
   - GET /v2/tokens/chains - List supported blockchains

3. **Add Token Routes**
   - Create token.routes.ts
   - Add rate limiting (100/hour per IP)
   - Integrate into v2 router

4. **Fix Tests**
   - Update SwapService tests with TokenService mocks
   - Update SwapController tests
   - Fix integration test
   - Add TokenController tests

5. **Initialize TokenService**
   - Create instance in app.ts
   - Fetch tokens on startup
   - Set up 30-minute refresh interval

**Supported Token Types:**
- **Native tokens** (21): BTC, ETH, SOL, AVAX, BNB, POL, TRX, TON, ADA, etc.
  - No contractAddress field
- **Contract tokens** (96): USDC, USDT, wNEAR, wBTC, DAI, etc.
  - Have contractAddress field

**Supported Blockchains (22+):**
NEAR, Ethereum, Bitcoin, Solana, Arbitrum, Base, Polygon, BSC, Optimism, Avalanche, Gnosis, Tron, TON, Sui, Stellar, Cardano, Aptos, Litecoin, Dogecoin, XRP, Zcash, Berachain

## Test Status

**Total Tests:** 121
- **Passing:** 116 ✅
- **Failing:** 5 ⚠️ (expected - SwapService needs update)

**New Tests (Session 16):** 45
- TokenService: 30 tests ✅
- TokenPriceService: 15 tests ✅

**Failing Tests (Expected):**
- SwapService.test.ts: 2 tests (needs TokenService mocking)
- SwapController.test.ts: 2 tests (depends on SwapService)
- integration.test.ts: 1 test (depends on SwapService)

**All failures are isolated to SwapService integration** - expected as SwapService still uses old hardcoded API. Will be fixed in next session.

## Project Structure
```
/root/agentfi-sdk/
├── api/src/v2/
│   ├── services/
│   │   ├── TokenService.ts              ✅ NEW - Dynamic token discovery
│   │   ├── TokenPriceService.ts         ✅ UPDATED - Uses TokenService
│   │   ├── SwapService.ts               ⏳ NEEDS UPDATE - Remove hardcoded
│   │   ├── OneClickService.ts           ✅ Working
│   │   ├── WebhookService.ts            ✅ Working
│   │   ├── ApiKeyService.ts             ✅ Working
│   │   └── RateLimitService.ts          ✅ Working
│   ├── controllers/
│   │   ├── SwapController.ts            ⏳ NEEDS UPDATE - Use new SwapService
│   │   ├── ApiKeyController.ts          ✅ Working
│   │   └── TokenController.ts           ⏳ TODO - Create for /v2/tokens
│   ├── routes/
│   │   ├── index.ts                     ⏳ NEEDS UPDATE - Add token routes
│   │   ├── swap.routes.ts               ✅ Working
│   │   ├── auth.routes.ts               ✅ Working
│   │   └── token.routes.ts              ⏳ TODO - Create
│   ├── types/
│   │   ├── index.ts                     ✅ NEW - Type exports
│   │   └── swap.types.ts                ✅ UPDATED - Multi-token types
│   ├── errors/                          ✅ Working
│   ├── middleware/                      ✅ Working
│   ├── workers/                         ✅ Working
│   └── tests/                           ⏳ 5 FAILING (SwapService-related)
│       ├── TokenService.test.ts         ✅ 30 passing
│       ├── TokenPriceService.test.ts    ✅ 15 passing
│       ├── SwapService.test.ts          ⚠️ 2/4 passing
│       ├── SwapController.test.ts       ⚠️ 2/4 passing
│       ├── integration.test.ts          ⚠️ 0/1 passing
│       └── [others]                     ✅ All passing
└── docs/v2.0/
    ├── STATE.md                         ✅ This file
    ├── PROGRESS.md                      ✅ Updated
    ├── MULTI-TOKEN-IMPLEMENTATION.md    ✅ Implementation guide
    ├── WEBHOOKS.md                      ✅ Complete
    ├── ONECLICK-API.md                  ✅ Complete
    └── ONECLICK-FEES.md                 ✅ Complete
```

## Next Steps

### High Priority (Session 17)
1. 🔄 **Update SwapService** ⬅️ NEXT TASK
   - Remove hardcoded wNEAR/USDC logic
   - Add TokenService dependency
   - Implement dynamic token resolution
   - Build enhanced responses
   - Fix all failing tests
   - Estimated: 2-3 hours

2. **Create TokenController**
   - Implement token discovery endpoints
   - Estimated: 1 hour

3. **Add token routes**
   - Create and integrate routes
   - Estimated: 30 minutes

4. **Initialize TokenService in app.ts**
   - Startup and refresh logic
   - Estimated: 30 minutes

### Medium Priority
5. Manual testing with multiple token pairs
6. Update API documentation
7. Production deployment preparation

### Future
8. Load testing
9. SDK libraries
10. Monitoring dashboard

## Running Services

Start API:
```bash
cd /root/agentfi-sdk/api && npm run dev
```

Start worker:
```bash
cd /root/agentfi-sdk/api && npm run worker
```

Run tests:
```bash
cd /root/agentfi-sdk/api && npx vitest run
```

Run specific test:
```bash
cd /root/agentfi-sdk/api && npx vitest run src/v2/tests/TokenService.test.ts
```

Test swap (will work after SwapService update):
```bash
curl -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "from": {"chain": "near", "token": "wNEAR", "amount": "10000000000000000000000"},
    "to": {"chain": "near", "token": "USDC"},
    "user": {"walletAddress": "test.near"}
  }'
```

## Success Metrics

✅ Non-custodial: Funds never held by AgentFi
✅ Direct delivery: Tokens go straight to user wallet
✅ Fast execution: ~43 seconds for $10 swap
✅ Platform fees: 15 bps successfully implemented
✅ Minimum validation: $5 USD minimum enforced
✅ Fee transparency: Complete breakdown shown
✅ Real-time notifications: Webhooks working
✅ Monitoring: Worker detects completion automatically
✅ Automatic cleanup: Expired intents removed after 24h
✅ Clean logs: No spam from abandoned swaps
✅ Status tracking: Complete swap details
✅ Test coverage: 116 tests passing (5 expected failures)
✅ Security: HMAC-SHA256 signatures
✅ Authentication: bcrypt-based API keys
✅ Authorization: User-scoped operations
✅ Rate limiting: Multi-tier protection
✅ DDoS protection: IP-based limits
✅ Fair usage: Per-user limits enforced
✅ Error handling: Comprehensive custom error system
✅ Production ready: Proper error responses
✅ Developer friendly: Clear error codes and messages
✅ Token discovery: Dynamic from OneClick API
✅ Real-time pricing: From OneClick cache
🔄 Multi-token support: 60% complete (SwapService next)
⏳ Cross-chain swaps: Pending SwapService update
⏳ 117+ tokens: Pending SwapService update
⏳ 22+ blockchains: Pending SwapService update
