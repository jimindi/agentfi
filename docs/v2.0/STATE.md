# AgentFi SDK v2.0 - Project State

**Last Updated:** November 14, 2025 (Session 17)  
**Branch:** agentfi-v2.0  
**Status:** Multi-Token Support Complete - Ready for Mainnet Testing  
**Progress:** 70% Complete

## Quick Status

✅ **COMPLETE:**
- Core infrastructure (auth, rate limiting, error handling)
- OneClick API integration (quotes, deposits)
- Multi-token support (117+ tokens, 22+ blockchains)
- Token discovery and pricing services
- SwapService with dynamic token support
- Comprehensive test coverage (121/121 passing)

⏳ **IN PROGRESS:**
- Token discovery API endpoints

🔴 **CRITICAL NEXT STEP:**
- **Mainnet testing** - Test with real transactions before production

📋 **TODO:**
- TokenController and routes
- Production deployment
- Enhanced monitoring

## Test Status: 121/121 Passing ✅

All components fully tested and working:
- ApiKeyService: 9 tests
- RateLimitService: 15 tests  
- WebhookService: 9 tests
- OneClickService: 2 tests
- TokenService: 30 tests
- TokenPriceService: 15 tests
- SwapService: 4 tests
- SwapController: 4 tests
- Integration: 1 test
- Error System: 20 tests
- Error Handler: 12 tests

## Recent Changes (Session 17)

**Multi-Token Support Completion:**
1. ✅ Updated SwapService to use TokenService and TokenPriceService
2. ✅ Removed all hardcoded token logic
3. ✅ Enhanced swap responses with full token metadata
4. ✅ Updated SwapController with service dependencies
5. ✅ Updated all tests (121/121 passing)
6. ✅ Updated routes and app initialization
7. ✅ Added automatic token cache refresh (30-minute intervals)

**Key Improvements:**
- Supports 117+ tokens across 22+ blockchains (dynamic)
- Real-time pricing from OneClick API
- Enhanced error messages with token details
- Better token validation and resolution
- Automatic cache management

## Directory Structure
```
/root/agentfi-sdk/
├── api/
│   ├── src/
│   │   ├── v2/                          # V2 Implementation (Current)
│   │   │   ├── controllers/
│   │   │   │   └── SwapController.ts    # ✅ HTTP request handling (updated)
│   │   │   ├── services/
│   │   │   │   ├── SwapService.ts       # ✅ Swap orchestration (updated)
│   │   │   │   ├── TokenService.ts      # ✅ Token discovery (117+ tokens)
│   │   │   │   ├── TokenPriceService.ts # ✅ Pricing & validation
│   │   │   │   ├── OneClickService.ts   # ✅ OneClick API client
│   │   │   │   ├── ApiKeyService.ts     # ✅ API key management
│   │   │   │   ├── RateLimitService.ts  # ✅ Redis rate limiting
│   │   │   │   └── WebhookService.ts    # ✅ Webhook notifications
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts   # ✅ API key authentication
│   │   │   │   └── errorHandler.ts      # ✅ Global error handling
│   │   │   ├── routes/
│   │   │   │   ├── index.ts             # ✅ Route aggregator
│   │   │   │   └── swap.routes.ts       # ✅ Swap endpoints (updated)
│   │   │   ├── types/
│   │   │   │   └── swap.types.ts        # ✅ Type definitions (updated)
│   │   │   ├── errors/
│   │   │   │   └── index.ts             # ✅ Custom error classes
│   │   │   └── tests/                   # ✅ All tests (121 passing)
│   │   │       ├── ApiKeyService.test.ts
│   │   │       ├── RateLimitService.test.ts
│   │   │       ├── WebhookService.test.ts
│   │   │       ├── OneClickService.test.ts
│   │   │       ├── TokenService.test.ts
│   │   │       ├── TokenPriceService.test.ts
│   │   │       ├── SwapService.test.ts
│   │   │       ├── SwapController.test.ts
│   │   │       ├── integration.test.ts
│   │   │       ├── errors.test.ts
│   │   │       └── errorHandler.test.ts
│   │   ├── routes/                      # V1 Routes (Deprecated)
│   │   ├── services/                    # V1 Services (Deprecated)
│   │   ├── app.ts                       # ✅ Express app setup (updated)
│   │   └── index.ts                     # ✅ Server entry point
│   ├── prisma/
│   │   └── schema.prisma                # ✅ Database schema
│   ├── package.json                     # ✅ Dependencies
│   └── tsconfig.json                    # ✅ TypeScript config
├── docs/
│   └── v2.0/
│       ├── STATE.md                     # ✅ This file (updated)
│       ├── PROGRESS.md                  # ✅ Progress tracking (updated)
│       ├── ARCHITECTURE.md              # ✅ System design
│       ├── MULTI-TOKEN-IMPLEMENTATION.md # ✅ Implementation guide
│       ├── ONECLICK-API.md              # ✅ API documentation
│       ├── PROJECT-INSTRUCTIONS.md      # ✅ Development workflow
│       └── SESSION-17-START.md          # ✅ Session summary
└── README.md                            # ✅ Project overview
```

## API Endpoints

### V2 Endpoints (Production Ready)

#### Swap Endpoints
```
POST /v2/swap
  • Execute cross-chain swap
  • Requires: API key authentication
  • Rate limited: Per API key limits
  • Supports: 117+ tokens across 22+ blockchains
  • Returns: Enhanced response with full token metadata
  
GET /v2/swap/:intentId
  • Get swap status
  • Public endpoint (no auth required)
  • Returns: Intent status and transaction details
```

#### Token Endpoints (TODO - Next Priority)
```
GET /v2/tokens
  • List all supported tokens
  • Optional query params: chain, symbol
  • Returns: Token list with prices

GET /v2/tokens/chains
  • List supported blockchains
  • Returns: Array of blockchain names
```

### V1 Endpoints (Deprecated)
All V1 endpoints are deprecated. Use V2 endpoints instead.

## Service Layer Details

### TokenService (NEW - Session 16)
**Purpose:** Dynamic token discovery and resolution
**Status:** ✅ Complete (30 tests passing)

**Key Features:**
- Fetches 117+ tokens from OneClick API
- Caches tokens in memory (1-hour TTL)
- Resolves tokens by assetId or symbol+chain
- Price lookup for any supported token
- Blockchain enumeration

**Methods:**
- `refreshTokenCache()` - Fetch tokens from API
- `resolveToken(token, chain?)` - Resolve to OneClickToken
- `getTokenPrice(assetId)` - Get USD price
- `findByAssetId(assetId)` - Direct lookup
- `findBySymbol(symbol, chain?)` - Symbol search
- `getAllTokens()` - Get all cached tokens
- `getBlockchains()` - List supported chains

### TokenPriceService (NEW - Session 16)
**Purpose:** Token pricing and validation
**Status:** ✅ Complete (15 tests passing)

**Key Features:**
- $5 minimum transaction validation
- USD value calculation
- Amount formatting for display
- Integration with TokenService

**Methods:**
- `validateMinimumAmount(amount, decimals, assetId)` - Enforce $5 minimum
- `calculateUsdValue(amount, decimals, assetId)` - Get USD value
- `formatAmount(amount, decimals, symbol)` - Format for display
- `formatUsd(usdValue)` - Format USD value

### SwapService (UPDATED - Session 17)
**Purpose:** Orchestrate swap operations
**Status:** ✅ Complete (4 tests passing)

**Changes:**
- ✅ Removed hardcoded `getAssetId()` method
- ✅ Uses TokenService for token resolution
- ✅ Uses TokenPriceService for validation
- ✅ Enhanced responses with full token metadata
- ✅ Dynamic support for all OneClick tokens

**Methods:**
- `executeSwap(request, userId, apiKeyId)` - Execute swap with token resolution
- `getSwapStatus(intentId)` - Get intent status

### OneClickService
**Purpose:** Direct integration with OneClick API
**Status:** ✅ Complete (2 tests passing)

**Methods:**
- `getQuote(params)` - Get swap quote and deposit address
- Handles: wNEAR, USDC, BTC, SOL, etc. (all OneClick supported tokens)

### ApiKeyService
**Purpose:** API key lifecycle management
**Status:** ✅ Complete (9 tests passing)

**Methods:**
- `createApiKey(prisma, params)` - Generate new API key
- `validateApiKey(prisma, keyHash)` - Verify key and check expiry
- `revokeApiKey(prisma, keyId, userId)` - Revoke key
- `listApiKeys(prisma, userId)` - List user's keys

### RateLimitService
**Purpose:** Redis-based rate limiting
**Status:** ✅ Complete (15 tests passing)

**Features:**
- Per-API-key rate limiting
- Sliding window algorithm
- Rate limit info headers
- Configurable limits per tier

### WebhookService
**Purpose:** Async notifications for swap status updates
**Status:** ✅ Complete (9 tests passing)

**Features:**
- Retry mechanism (3 attempts with exponential backoff)
- Status update notifications
- Error handling and logging

## Token Support

**Supported Tokens:** 117+ (dynamic from OneClick API)
**Supported Blockchains:** 22+ including:
- NEAR Protocol
- Ethereum
- Solana
- Bitcoin
- Arbitrum
- Optimism
- Polygon
- Avalanche
- BNB Chain
- And more...

**Popular Token Pairs:**
- wNEAR ↔ USDC
- NEAR ↔ ETH
- wNEAR ↔ BTC
- USDC ↔ USDT
- Any supported token pair via OneClick

**Token Resolution:**
- By assetId: `nep141:wrap.near`
- By symbol: `wNEAR` (with optional chain filter)
- Real-time pricing from OneClick API
- Automatic cache refresh every 30 minutes

## Database Schema (Prisma)

**Tables:**
- `User` - User accounts with email and plan tier
- `ApiKey` - API keys with hashed values and rate limits
- `Intent` - Swap intents with status tracking
- `UsageLog` - API usage metrics
- `Invoice` - Billing records (future use)

**Key Relationships:**
- User → ApiKey (one-to-many)
- User → Intent (one-to-many)
- ApiKey → Intent (one-to-many)

## Environment Variables

**Required:**
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/agentfi
REDIS_URL=redis://localhost:6379
NEAR_NETWORK_ID=mainnet
NEAR_ACCOUNT_ID=agentfi.near
NEAR_PRIVATE_KEY=ed25519:...
```

**Optional:**
```bash
ONECLICK_API_URL=https://1click.chaindefuser.com
LOG_LEVEL=info
PORT=3000
```

## Swap Flow (Current Implementation)
```
1. Client Request
   └─> POST /v2/swap
       {
         "from": { "chain": "near", "token": "wNEAR", "amount": "2200000000000000000000000" },
         "to": { "chain": "near", "token": "USDC" },
         "user": { "walletAddress": "user.near" },
         "options": { "webhookUrl": "https://..." }
       }

2. Authentication & Rate Limiting
   └─> API key validated
   └─> Rate limit checked (Redis)

3. Token Resolution (NEW)
   └─> TokenService.resolveToken("wNEAR", "near")
   └─> TokenService.resolveToken("USDC", "near")

4. Validation (UPDATED)
   └─> TokenPriceService.validateMinimumAmount()
   └─> Calculates USD value using real-time prices
   └─> Enforces $5 minimum

5. OneClick Quote
   └─> OneClickService.getQuote()
       └─> Uses resolved assetIds
       └─> Returns deposit address, estimated output, fees

6. Database Storage
   └─> Create Intent record
       └─> Status: 'pending_deposit'
       └─> Metadata: deposit address, estimated output, fees

7. Enhanced Response (NEW)
   └─> {
         "intentId": "...",
         "status": "pending_deposit",
         "depositAddress": "...",
         "from": {
           "symbol": "wNEAR",
           "assetId": "nep141:wrap.near",
           "blockchain": "near",
           "decimals": 24,
           "contractAddress": "wrap.near",
           "amount": "2200000000000000000000000",
           "amountFormatted": "2.200000 wNEAR",
           "amountUsd": "$5.19"
         },
         "to": {
           "symbol": "USDC",
           "assetId": "nep141:17208628...",
           "blockchain": "near",
           "decimals": 6,
           "estimatedOutput": "5000000",
           "estimatedOutputFormatted": "5.000000 USDC",
           "estimatedOutputUsd": "$5.00"
         },
         "fees": { ... }
       }

8. Background Monitoring
   └─> Worker monitors OneClick API for status updates
   └─> Updates Intent status in database
   └─> Sends webhook notifications (if configured)
```

## Error Handling

**Custom Error Classes:**
- `ValidationError` (400) - Invalid input, token not found, below minimum
- `UnauthorizedError` (401) - Missing/invalid API key
- `ForbiddenError` (403) - Insufficient permissions
- `NotFoundError` (404) - Resource not found
- `RateLimitError` (429) - Rate limit exceeded
- `ExternalServiceError` (502) - OneClick API failures
- `InternalServerError` (500) - Unexpected errors

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Token \"UNKNOWN\" not found",
    "statusCode": 400,
    "details": {
      "token": "UNKNOWN",
      "chain": "near"
    }
  }
}
```

## Next Steps

### 1. CRITICAL: Mainnet Testing (Recommended Next)
**Priority:** HIGH  
**Duration:** 1-2 hours  
**Risk:** Testing with real funds

**Test Scenarios:**
1. Small wNEAR → USDC swap (~$5-10)
2. USDC → wNEAR reverse swap
3. Invalid token handling
4. Below minimum amount validation
5. Deposit address generation
6. Webhook delivery (if configured)

**Requirements:**
- NEAR mainnet account with funds
- Valid API key from database
- Test webhook endpoint (optional)

**Why Critical:**
- All code is tested in unit/integration tests
- But never tested with real OneClick API + real transactions
- Need to verify deposit address generation works
- Need to confirm real token transfers complete
- Need to validate pricing accuracy

### 2. Token Discovery API
**Priority:** Medium  
**Duration:** 2-3 hours

- Create TokenController
- Add GET /v2/tokens endpoints
- Add filtering and search
- Add tests (15-20 tests)

### 3. Production Readiness
**Priority:** Lower  
**Duration:** 3-4 hours

- Environment configuration
- Enhanced monitoring
- Performance tuning
- Documentation updates

## Commands Reference

### Development
```bash
# Start API server
cd /root/agentfi-sdk/api && npm run dev

# Start background worker
cd /root/agentfi-sdk/api && npm run worker

# Run all tests
cd /root/agentfi-sdk/api && npx vitest run

# Run specific test
cd /root/agentfi-sdk/api && npx vitest run src/v2/tests/SwapService.test.ts

# Watch mode
cd /root/agentfi-sdk/api && npx vitest
```

### Git Workflow
```bash
# Check status
cd /root/agentfi-sdk
git status
git log -1 --stat

# Commit changes
git add -A
git commit -m "v2.0: descriptive message"
git push origin agentfi-v2.0
```

### Database
```bash
# Apply migrations
cd /root/agentfi-sdk/api && npx prisma migrate dev

# Generate Prisma client
cd /root/agentfi-sdk/api && npx prisma generate

# Open Prisma Studio
cd /root/agentfi-sdk/api && npx prisma studio
```

## Resources

- **OneClick API:** https://1click.chaindefuser.com/docs
- **Project Instructions:** [PROJECT-INSTRUCTIONS.md](./PROJECT-INSTRUCTIONS.md)
- **Progress Log:** [PROGRESS.md](./PROGRESS.md)
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Implementation Plan:** [MULTI-TOKEN-IMPLEMENTATION.md](./MULTI-TOKEN-IMPLEMENTATION.md)
- **OneClick Integration:** [ONECLICK-API.md](./ONECLICK-API.md)

## Success Criteria

- [x] All tests passing (121/121) ✅
- [x] Zero hardcoded tokens ✅
- [x] Dynamic token discovery ✅
- [x] Real-time pricing ✅
- [x] Enhanced swap responses ✅
- [ ] Mainnet testing complete ⏳ NEXT
- [ ] Token API endpoints
- [ ] Production deployment

---

**Last Commit:** `v2.0: Update TokenPriceService and prepare for SwapService update` (Session 16)  
**Next Commit:** SwapService multi-token completion (Session 17)
