# Project State - Quick Reference
**Last Updated:** November 14, 2025  
**Branch:** agentfi-v2.0  
**Status:** 🔄 Implementing multi-token support - preparing for production

## Quick Status

**What Works:**
- ✅ POST /v2/swap - Create swap (requires API key, rate limited: 10/min)
  - ⚠️ Currently limited to wNEAR/USDC only
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

**Next Task:** Implement multi-token support (117+ tokens, 22+ chains)

## Current Development Focus

### 🔄 Multi-Token Support Implementation

**Goal:** Support all 117+ tokens available through OneClick API across 22+ blockchains

**Current Limitation:** API only supports hardcoded wNEAR → USDC swaps

**Target:** Dynamic token discovery and resolution
- Native tokens: BTC, ETH, SOL (no contractAddress)
- Contract tokens: USDC, wNEAR, wBTC (with contractAddress)
- Cross-chain swaps: NEAR ↔ ETH ↔ SOL ↔ BTC, etc.

**Implementation Plan:**
1. Create TokenService - fetch/cache tokens from OneClick `/v0/tokens`
2. Update types - make contractAddress optional
3. Update TokenPriceService - use OneClick prices dynamically
4. Update SwapService - remove hardcoded logic, add token resolution
5. Create TokenController - add GET /v2/tokens endpoint
6. Add token routes with rate limiting
7. Write comprehensive tests
8. Update documentation

**Input Format (Hybrid):**
```json
// Simple (symbol + chain)
{"from": {"chain": "near", "token": "USDC"}}

// Explicit (assetId)
{"from": {"token": "nep141:17208628..."}}
```

**New Endpoint:**
```bash
GET /v2/tokens
GET /v2/tokens?chain=near
GET /v2/tokens?symbol=USDC
```

**Token Categories:**
- **Native tokens** (21 tokens): BTC, ETH, SOL, AVAX, BNB, POL, TRX, TON, ADA, APT, LTC, DOGE, XRP, XLM, BERA, ZEC
  - No contractAddress (they ARE the blockchain)
- **Contract tokens** (96 tokens): USDC, USDT, wNEAR, wBTC, DAI, etc.
  - Have contractAddress (smart contracts on blockchains)

**Supported Blockchains (22+):**
NEAR, Ethereum, Bitcoin, Solana, Arbitrum, Base, Polygon, BSC, Optimism, Avalanche, Gnosis, Tron, TON, Sui, Stellar, Cardano, Aptos, Litecoin, Dogecoin, XRP, Zcash, Berachain

## Latest Achievement

### ✅ Comprehensive Error Handling (Session 14)

**Feature:** Custom error classes with centralized error handling middleware

**Implementation:**
- 12 custom error classes for different HTTP status codes
- Centralized error handler middleware with logging
- AsyncHandler wrapper for automatic promise rejection handling
- 404 handler for unknown routes
- Updated all services and controllers to use custom errors

**Error Classes:**
1. **AppError** (base): Custom error with statusCode, code, isOperational
2. **BadRequestError** (400): Client error in request
3. **UnauthorizedError** (401): Missing/invalid authentication
4. **ForbiddenError** (403): Authenticated but not authorized
5. **NotFoundError** (404): Resource not found
6. **ConflictError** (409): Resource conflict
7. **ValidationError** (422): Input validation failed
8. **RateLimitError** (429): Rate limit exceeded
9. **InternalError** (500): Unexpected server error (non-operational)
10. **ExternalServiceError** (502): External service failure
11. **ServiceUnavailableError** (503): Temporary unavailability
12. **TimeoutError** (504): External service timeout

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Transaction amount ($4.50) is below minimum of $5.00",
    "details": {
      "actualUsd": 4.5,
      "minimumUsd": 5.0
    },
    "stack": "..." // Only in development
  }
}
```

**Key Features:**
- Operational vs non-operational error distinction
- Production mode hides sensitive error details
- Stack traces only in development
- Structured logging with pino (redacts sensitive data)
- Consistent error response format across all endpoints
- Proper HTTP status codes for each error type
- Error details for debugging (when appropriate)

**Services Updated:**
- SwapService: ValidationError for minimum amount, NotFoundError for intents
- TokenPriceService: ValidationError for unknown tokens, ExternalServiceError for API failures
- OneClickService: ExternalServiceError, TimeoutError with 30s timeout
- ApiKeyService: UnauthorizedError for invalid keys, ForbiddenError for unauthorized actions

**Test Coverage:**
- 20 tests for error classes (inheritance, properties, messages)
- 12 tests for error handler middleware (production/dev modes, asyncHandler)
- All 83 tests passing ✅

**Security Benefits:**
- No sensitive data in production errors
- Complete audit trail via logging
- Client-friendly error codes
- Proper error categorization

## Previous Achievements

### ✅ Rate Limiting System (Session 13)
- Redis-based multi-tier protection
- IP-based (100/hour), auth endpoints (5/min), swaps (10/min)
- Standard RateLimit-* headers
- 51 tests passing before error handling

### ✅ API Key Authentication (Session 12)
- bcrypt hashing, user-scoped operations
- 36 tests passing before rate limiting

### ✅ Intent Expiration System (Session 11)
- Automatic cleanup after 24 hours
- Hourly cleanup prevents database bloat

### ✅ Webhook Notifications (Session 10)
- HMAC-SHA256 signatures
- Retry logic (3 attempts, 5s delay)

### ✅ Fee Breakdown & Minimum Validation (Session 9)
- Transparent fees, $5 USD minimum

### ✅ Direct Delivery & Platform Fees (Sessions 1-8)
- Funds to user wallet, 15 bps via appFees

## Service Account

**Account ID:** 6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709
**NEAR Balance:** ~3.52 NEAR
**wNEAR Balance:** ~5.73 wNEAR

## Complete Flow (Current - wNEAR/USDC Only)

1. User calls `POST /v2/auth/api-key` (rate limited: 5/min)
2. User calls `POST /v2/swap` with API key (rate limited: 10/min)
3. API validates API key and rate limits
4. API validates minimum amount ($5 USD)
5. API requests quote with fees (hardcoded wNEAR/USDC)
6. API stores intent with userId/apiKeyId
7. API returns deposit address + fee breakdown
8. User transfers tokens to depositAddress
9. OneClick coordinates with solvers
10. Solvers deliver directly to user's wallet
11. Worker polls every 20s, updates on SUCCESS
12. Worker sends webhook notification
13. Worker expires intents after 24h if no deposit
14. Errors are handled gracefully with proper status codes

## Project Structure
```
/root/agentfi-sdk/
├── api/src/v2/
│   ├── errors/
│   │   ├── AppError.ts                ✅ Custom error classes
│   │   └── index.ts                   ✅ Error exports
│   ├── services/
│   │   ├── OneClickService.ts         ✅ OneClick integration
│   │   ├── SwapService.ts             ✅ Swap logic (needs update for multi-token)
│   │   ├── TokenPriceService.ts       ✅ Price validation (needs update)
│   │   ├── WebhookService.ts          ✅ Notifications
│   │   ├── ApiKeyService.ts           ✅ Authentication
│   │   └── RateLimitService.ts        ✅ Multi-tier limits
│   ├── controllers/
│   │   ├── SwapController.ts          ✅ Swap endpoints
│   │   └── ApiKeyController.ts        ✅ Auth endpoints
│   ├── middleware/
│   │   ├── auth.middleware.ts         ✅ API key validation
│   │   ├── errorHandler.ts            ✅ Error handling
│   │   └── index.ts                   ✅ Exports
│   ├── routes/
│   │   ├── index.ts                   ✅ Main router
│   │   ├── swap.routes.ts             ✅ Swap routes
│   │   └── auth.routes.ts             ✅ Auth routes
│   ├── workers/
│   │   ├── IntentMonitor.ts           ✅ Expiration + webhooks
│   │   └── index.ts                   ✅ Working
│   └── tests/                         ✅ 83 passing
│       ├── errors.test.ts             (20 tests)
│       ├── errorHandler.test.ts       (12 tests)
│       ├── OneClickService.test.ts    (2 tests)
│       ├── SwapService.test.ts        (4 tests)
│       ├── SwapController.test.ts     (4 tests)
│       ├── TokenPriceService.test.ts  (7 tests)
│       ├── WebhookService.test.ts     (9 tests)
│       ├── ApiKeyService.test.ts      (9 tests)
│       ├── RateLimitService.test.ts   (15 tests)
│       └── integration.test.ts        (1 test)
└── docs/v2.0/
    ├── STATE.md                     ✅ This file
    ├── PROGRESS.md                  ✅ Updated
    ├── MULTI-TOKEN-IMPLEMENTATION.md ✅ NEW - Implementation plan
    ├── WEBHOOKS.md                  ✅ Complete
    ├── ONECLICK-API.md              ✅ Complete
    └── ONECLICK-FEES.md             ✅ Complete
```

## Next Steps

### High Priority (Before Production)
1. 🔄 **Implement multi-token support** ⬅️ CURRENT TASK
   - Create TokenService
   - Update types and services
   - Add token discovery endpoint
   - Write comprehensive tests
   - Estimated: 7-11 hours over 4 days

2. Production deployment
3. Load testing with multiple token pairs

### Medium Priority
4. Multi-token cross-chain testing
5. Advanced monitoring and alerting
6. SDK libraries (TypeScript, Python)

### Future
7. Dashboard for monitoring
8. Analytics and reporting
9. Advanced features

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

Test swap (currently wNEAR/USDC only):
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
✅ Test coverage: 83 tests passing
✅ Security: HMAC-SHA256 signatures
✅ Authentication: bcrypt-based API keys
✅ Authorization: User-scoped operations
✅ Rate limiting: Multi-tier protection
✅ DDoS protection: IP-based limits
✅ Fair usage: Per-user limits enforced
✅ Error handling: Comprehensive custom error system
✅ Production ready: Proper error responses
✅ Developer friendly: Clear error codes and messages
🔄 Multi-token support: In progress
⏳ Cross-chain swaps: Pending multi-token
⏳ 117+ tokens: Pending multi-token
⏳ 22+ blockchains: Pending multi-token
