# Project State - Quick Reference
**Last Updated:** November 13, 2025  
**Branch:** agentfi-v2.0  
**Status:** ✅ API key authentication implemented - production ready

## Quick Status

**What Works:**
- ✅ POST /v2/swap - Create swap (requires API key authentication)
- ✅ GET /v2/swap/:id - Check swap status (public)
- ✅ POST /v2/auth/api-key - Create API key (public)
- ✅ GET /v2/auth/api-keys - List API keys (requires authentication)
- ✅ DELETE /v2/auth/api-key/:id - Revoke API key (requires authentication)
- ✅ Worker monitoring - Polls OneClick every 20s
- ✅ Intent expiration - Auto-expires abandoned swaps after 24h
- ✅ Direct delivery - USDC goes to user wallet automatically
- ✅ Platform fees - 15 bps deducted via appFees
- ✅ Minimum validation - $5 USD minimum enforced
- ✅ Fee transparency - Platform fee + network fee shown separately
- ✅ Webhook notifications - Real-time swap completion alerts

**Next Task:** Implement rate limiting

## Latest Achievement

### ✅ API Key Authentication

**Feature:** Complete API key management and authentication system

**Implementation:**
- ApiKeyService: Generate, validate, list, and revoke API keys
- Authentication middleware: Validates Bearer tokens on protected routes
- ApiKeyController: REST endpoints for key management
- bcrypt hashing: Secure key storage with 12 rounds
- Expiration support: Optional key expiration

**Security Features:**
- Keys hashed with bcrypt before storage
- Constant-time comparison via bcrypt
- Prefix-based fast lookup (12 chars)
- Last used timestamp tracking
- User-scoped key management

**API Endpoints:**
- POST /v2/auth/api-key - Create new API key (public)
- GET /v2/auth/api-keys - List user's keys (authenticated)
- DELETE /v2/auth/api-key/:id - Revoke key (authenticated)

**Protected Routes:**
- POST /v2/swap - Now requires API key authentication

**Public Routes:**
- GET /v2/swap/:id - Status check remains public
- POST /v2/auth/api-key - First key creation is public

**Test Results:**
- 36 tests passing (9 new auth tests)
- ApiKeyService: 9 tests
- SwapController: 4 tests (updated for auth)
- Integration: 1 test (updated for auth)
- All existing tests pass

**Manual Testing:**
- ✅ Create API key successfully
- ✅ Authenticate swap request with valid key
- ✅ Reject request without API key (401)
- ✅ Reject request with invalid key (401)
- ✅ List API keys for authenticated user
- ✅ Revoke API key successfully
- ✅ Public status endpoint works without auth

## Previous Achievements

### ✅ Intent Expiration System
- Automatic cleanup of abandoned swap intents after 24 hours
- Hourly cleanup prevents database bloat
- Clean worker logs - no spam from abandoned swaps

### ✅ Webhook Notifications
- Real-time HTTP callbacks when swaps complete or fail
- HMAC-SHA256 signatures for security
- Retry logic (3 attempts, 5 second delay)

### ✅ Fee Breakdown & Minimum Validation
- Transparent platform + network fee display
- $5 USD minimum transaction amount
- Real-time price validation

### ✅ Direct Delivery & Platform Fees
- Funds go directly to user wallet (no withdrawal step)
- Platform fee: 15 bps via appFees parameter
- Verified working on mainnet

## Service Account

**Account ID:** 6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709
**NEAR Balance:** ~3.52 NEAR
**wNEAR Balance:** ~5.73 wNEAR

## Complete Flow

1. User calls `POST /v2/auth/api-key` to get API key
2. User calls `POST /v2/swap` with API key in Authorization header
3. API validates API key using bcrypt comparison
4. API validates minimum amount ($5 USD)
5. API requests quote with `recipientType: DESTINATION_CHAIN` + `appFees: 15 bps`
6. API stores intent in database with userId and apiKeyId
7. API returns deposit address + transparent fee breakdown
8. User transfers tokens to unique depositAddress
9. OneClick detects deposit, coordinates with solvers
10. Solvers execute swap and deliver directly to user's wallet
11. Worker polls status every 20s, updates database when SUCCESS
12. Worker sends webhook notification
13. Worker expires intents after 24h if no deposit
14. User checks status: `GET /v2/swap/:id` (no auth required)

## Project Structure
```
/root/agentfi-sdk/
├── api/src/v2/
│   ├── services/
│   │   ├── OneClickService.ts       ✅ Fee capture
│   │   ├── SwapService.ts           ✅ Uses userId/apiKeyId
│   │   ├── TokenPriceService.ts     ✅ USD validation
│   │   ├── WebhookService.ts        ✅ Webhook delivery
│   │   └── ApiKeyService.ts         ✅ NEW - Key management
│   ├── controllers/
│   │   ├── SwapController.ts        ✅ Auth required
│   │   └── ApiKeyController.ts      ✅ NEW - Key endpoints
│   ├── middleware/
│   │   └── auth.middleware.ts       ✅ NEW - Authentication
│   ├── types/
│   │   └── swap.types.ts            ✅ Working
│   ├── routes/
│   │   ├── index.ts                 ✅ Auth routes added
│   │   ├── swap.routes.ts           ✅ Auth middleware added
│   │   └── auth.routes.ts           ✅ NEW - Auth endpoints
│   ├── workers/
│   │   ├── IntentMonitor.ts         ✅ Expiration + webhooks
│   │   └── index.ts                 ✅ Working
│   └── tests/                       ✅ 36 passing
│       ├── OneClickService.test.ts       (2 tests)
│       ├── SwapService.test.ts           (4 tests)
│       ├── SwapController.test.ts        (4 tests)
│       ├── TokenPriceService.test.ts     (7 tests)
│       ├── WebhookService.test.ts        (9 tests)
│       ├── ApiKeyService.test.ts         (9 tests) ✅ NEW
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
2. Implement rate limiting (Redis-based)
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

Create API key:
```bash
curl -X POST http://localhost:3000/v2/auth/api-key \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "My Key"}'
```

Test swap (with auth):
```bash
curl -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "from": {"chain": "near", "token": "wNEAR", "amount": "2200000000000000000000000"},
    "to": {"chain": "near", "token": "USDC"},
    "user": {"walletAddress": "YOUR_WALLET"}
  }'
```

Check status (public):
```bash
curl http://localhost:3000/v2/swap/{intentId}
```

## Success Metrics

✅ Non-custodial: Funds never held by AgentFi
✅ Direct delivery: Tokens go straight to user wallet
✅ Fast execution: ~43 seconds for $10 swap
✅ Platform fees: 15 bps successfully implemented
✅ Minimum validation: $5 USD minimum enforced
✅ Fee transparency: Complete breakdown shown to users
✅ Real-time notifications: Webhooks on completion/failure
✅ Monitoring: Worker detects completion automatically
✅ Automatic cleanup: Expired intents removed after 24h
✅ Clean logs: No spam from abandoned swaps
✅ Status tracking: API returns complete swap details
✅ Test coverage: 36 tests passing
✅ Security: HMAC-SHA256 webhook signatures
✅ Authentication: API key system with bcrypt
✅ Authorization: User-scoped key management
✅ Key security: Hashed storage, constant-time comparison
