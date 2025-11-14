# Project State - Quick Reference
**Last Updated:** November 13, 2025  
**Branch:** agentfi-v2.0  
**Status:** ✅ Error handling implemented - production ready

## Quick Status

**What Works:**
- ✅ POST /v2/swap - Create swap (requires API key, rate limited: 10/min)
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

**Next Task:** Production deployment

## Latest Achievement

### ✅ Comprehensive Error Handling

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

### ✅ Rate Limiting System
- Redis-based multi-tier protection
- IP-based (100/hour), auth endpoints (5/min), swaps (10/min)
- Standard RateLimit-* headers
- 51 tests passing before error handling

### ✅ API Key Authentication
- bcrypt hashing, user-scoped operations
- 36 tests passing before rate limiting

### ✅ Intent Expiration System
- Automatic cleanup after 24 hours
- Hourly cleanup prevents database bloat

### ✅ Webhook Notifications
- HMAC-SHA256 signatures
- Retry logic (3 attempts, 5s delay)

### ✅ Fee Breakdown & Minimum Validation
- Transparent fees, $5 USD minimum

### ✅ Direct Delivery & Platform Fees
- Funds to user wallet, 15 bps via appFees

## Service Account

**Account ID:** 6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709
**NEAR Balance:** ~3.52 NEAR
**wNEAR Balance:** ~5.73 wNEAR

## Complete Flow

1. User calls `POST /v2/auth/api-key` (rate limited: 5/min)
2. User calls `POST /v2/swap` with API key (rate limited: 10/min)
3. API validates API key and rate limits
4. API validates minimum amount ($5 USD)
5. API requests quote with fees
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
│   │   ├── AppError.ts                ✅ NEW - Custom error classes
│   │   └── index.ts                   ✅ NEW - Error exports
│   ├── services/
│   │   ├── OneClickService.ts         ✅ Updated - Custom errors
│   │   ├── SwapService.ts             ✅ Updated - Custom errors
│   │   ├── TokenPriceService.ts       ✅ Updated - Custom errors
│   │   ├── WebhookService.ts          ✅ Notifications
│   │   ├── ApiKeyService.ts           ✅ Updated - Custom errors
│   │   └── RateLimitService.ts        ✅ Multi-tier limits
│   ├── controllers/
│   │   ├── SwapController.ts          ✅ Updated - Error handling
│   │   └── ApiKeyController.ts        ✅ Auth
│   ├── middleware/
│   │   ├── auth.middleware.ts         ✅ Updated - Custom errors
│   │   ├── errorHandler.ts            ✅ NEW - Error handling
│   │   └── index.ts                   ✅ NEW - Exports
│   ├── routes/
│   │   ├── index.ts                   ✅ Updated - Error handlers
│   │   ├── swap.routes.ts             ✅ Rate limiting
│   │   └── auth.routes.ts             ✅ Rate limiting
│   ├── workers/
│   │   ├── IntentMonitor.ts           ✅ Expiration + webhooks
│   │   └── index.ts                   ✅ Working
│   └── tests/                         ✅ 83 passing
│       ├── errors.test.ts             ✅ NEW - 20 tests
│       ├── errorHandler.test.ts       ✅ NEW - 12 tests
│       ├── OneClickService.test.ts    (2 tests)
│       ├── SwapService.test.ts        (4 tests - updated)
│       ├── SwapController.test.ts     (4 tests - updated)
│       ├── TokenPriceService.test.ts  (7 tests - updated)
│       ├── WebhookService.test.ts     (9 tests)
│       ├── ApiKeyService.test.ts      (9 tests - updated)
│       ├── RateLimitService.test.ts   (15 tests)
│       └── integration.test.ts        (1 test)
└── docs/v2.0/
    ├── STATE.md                     ✅ This file
    ├── PROGRESS.md                  ✅ Updated
    ├── WEBHOOKS.md                  ✅ Complete
    ├── ONECLICK-API.md              ✅ Complete
    └── ONECLICK-FEES.md             ✅ Complete
```

## Next Steps

### High Priority
1. ✅ Implement API key authentication
2. ✅ Implement rate limiting
3. ✅ Comprehensive error handling
4. Production deployment
5. Load testing

### Medium Priority
6. Multi-token support beyond wNEAR/USDC
7. Cross-chain swaps (ETH, SOL, BTC)
8. Advanced monitoring and alerting

### Future
9. SDK libraries (TypeScript, Python)
10. Dashboard for monitoring
11. Analytics and reporting

## Running Services

Start API:
```bash
cd /root/agentfi-sdk/api && npm run dev
```

Start worker:
```bash
cd /root/agentfi-sdk/api && npm run worker
```

Test error handling:
```bash
# Test validation error (amount too low)
curl -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "from": {"chain": "near", "token": "wNEAR", "amount": "1000000000000000000000"},
    "to": {"chain": "near", "token": "USDC"},
    "user": {"walletAddress": "test.near"}
  }'

# Expected: 422 ValidationError - below $5 minimum

# Test unauthorized error (no API key)
curl -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -d '{"from": {...}, "to": {...}}'

# Expected: 401 UnauthorizedError

# Test not found error
curl http://localhost:3000/v2/swap/nonexistent-id

# Expected: 404 NotFoundError
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
