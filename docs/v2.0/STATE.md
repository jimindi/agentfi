# Project State - Quick Reference
**Last Updated:** November 13, 2025  
**Branch:** agentfi-v2.0  
**Status:** ✅ Rate limiting implemented - production ready

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

**Next Task:** Comprehensive error handling

## Latest Achievement

### ✅ Rate Limiting System

**Feature:** Redis-based multi-tier rate limiting with proper IPv6 support

**Implementation:**
- RateLimitService: Redis-backed rate limiting for all endpoints
- Multiple tiers: IP-based, user-based, endpoint-specific
- Express-rate-limit integration with proper IPv6 handling
- Standard RateLimit headers in all responses

**Rate Limit Tiers:**
1. **IP-based** (all v2 endpoints): 100 requests/hour per IP
2. **Auth endpoints**: 5 requests/minute per IP (prevents brute force)
3. **API key operations**: 1000 requests/hour per user
4. **Swap endpoint**: 10 swaps/minute per user (protects expensive ops)

**Key Features:**
- Redis-backed storage for distributed rate limiting
- Proper IPv6 address handling (no bypass vulnerabilities)
- Standard RateLimit-* headers in responses
- Graceful degradation if Redis unavailable
- User-based limits when authenticated, IP fallback otherwise

**Headers Returned:**
```
RateLimit-Policy: 10;w=60
RateLimit-Limit: 10
RateLimit-Remaining: 9
RateLimit-Reset: 60
```

**Error Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "retryAfter": 3600
  }
}
```

**Test Results:**
- 51 tests passing (15 new rate limiting tests)
- Manual testing verified all tiers working
- IPv6 vulnerability fixed
- Redis connection stable

**Security Benefits:**
- Prevents DDoS attacks (IP-based limits)
- Prevents brute force (auth endpoint limits)
- Protects expensive operations (swap limits)
- Fair usage enforcement (per-user limits)

## Previous Achievements

### ✅ API Key Authentication
- Complete key management system with bcrypt hashing
- User-scoped operations with security best practices
- 36 tests passing before rate limiting

### ✅ Intent Expiration System
- Automatic cleanup of abandoned swaps after 24 hours
- Hourly cleanup prevents database bloat

### ✅ Webhook Notifications
- Real-time HTTP callbacks with HMAC-SHA256 signatures
- Retry logic (3 attempts, 5 second delay)

### ✅ Fee Breakdown & Minimum Validation
- Transparent platform + network fee display
- $5 USD minimum transaction amount

### ✅ Direct Delivery & Platform Fees
- Funds go directly to user wallet
- Platform fee: 15 bps via appFees parameter

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

## Project Structure
```
/root/agentfi-sdk/
├── api/src/v2/
│   ├── services/
│   │   ├── OneClickService.ts       ✅ Fee capture
│   │   ├── SwapService.ts           ✅ User/key tracking
│   │   ├── TokenPriceService.ts     ✅ USD validation
│   │   ├── WebhookService.ts        ✅ Notifications
│   │   ├── ApiKeyService.ts         ✅ Auth
│   │   └── RateLimitService.ts      ✅ NEW - Multi-tier limits
│   ├── controllers/
│   │   ├── SwapController.ts        ✅ Auth + rate limited
│   │   └── ApiKeyController.ts      ✅ Rate limited
│   ├── middleware/
│   │   └── auth.middleware.ts       ✅ Authentication
│   ├── routes/
│   │   ├── index.ts                 ✅ IP rate limiting
│   │   ├── swap.routes.ts           ✅ Swap rate limiting
│   │   └── auth.routes.ts           ✅ Auth rate limiting
│   ├── workers/
│   │   ├── IntentMonitor.ts         ✅ Expiration + webhooks
│   │   └── index.ts                 ✅ Working
│   └── tests/                       ✅ 51 passing
│       ├── OneClickService.test.ts       (2 tests)
│       ├── SwapService.test.ts           (4 tests)
│       ├── SwapController.test.ts        (4 tests)
│       ├── TokenPriceService.test.ts     (7 tests)
│       ├── WebhookService.test.ts        (9 tests)
│       ├── ApiKeyService.test.ts         (9 tests)
│       ├── RateLimitService.test.ts      (15 tests) ✅ NEW
│       └── integration.test.ts           (1 test)
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
3. Comprehensive error handling
4. Production deployment

### Medium Priority
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

Test rate limiting:
```bash
# Should show RateLimit headers
curl -i http://localhost:3000/v2

# Test auth rate limit (5/min)
for i in {1..6}; do
  curl -i -X POST http://localhost:3000/v2/auth/api-key \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"test$i@example.com\", \"name\": \"Test $i\"}"
done
# Request 6 should return 429
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
✅ Test coverage: 51 tests passing
✅ Security: HMAC-SHA256 signatures
✅ Authentication: bcrypt-based API keys
✅ Authorization: User-scoped operations
✅ Rate limiting: Multi-tier protection
✅ DDoS protection: IP-based limits
✅ Fair usage: Per-user limits enforced
