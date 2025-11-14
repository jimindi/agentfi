# AgentFi SDK v2.0 - Project State

**Last Updated:** November 14, 2025 (Session 18)  
**Branch:** agentfi-v2.0  
**Status:** Token Discovery API Complete - Ready for Mainnet Testing  
**Progress:** 75% Complete

## Quick Status

✅ **COMPLETE:**
- Core infrastructure (auth, rate limiting, error handling)
- OneClick API integration (quotes, deposits)
- Multi-token support (117+ tokens, 22+ blockchains)
- Token discovery and pricing services
- SwapService with dynamic token support
- Token Discovery API endpoints (4 endpoints)
- Comprehensive test coverage (127/127 passing)

🔴 **CRITICAL NEXT STEP:**
- **Mainnet testing** - Test with real transactions before production

📋 **TODO:**
- Production deployment
- Enhanced monitoring

## Test Status: 127/127 Passing ✅

All components fully tested and working:
- ApiKeyService: 9 tests
- RateLimitService: 15 tests  
- WebhookService: 9 tests
- OneClickService: 2 tests
- TokenService: 20 tests
- TokenPriceService: 15 tests
- SwapService: 4 tests
- SwapController: 4 tests
- TokenController: 16 tests ⭐ NEW
- Integration: 1 test
- Error System: 20 tests
- Error Handler: 12 tests

## Recent Changes (Session 18)

**Token Discovery API Implementation:**
1. ✅ Created TokenController with 4 endpoints (16 tests)
2. ✅ Implemented singleton TokenService pattern
3. ✅ Fixed OneClick API endpoint (/v0/tokens)
4. ✅ Added token routes to v2 router
5. ✅ Fixed authentication middleware imports
6. ✅ All 127 tests passing

**New Endpoints:**
- GET /v2/tokens (list/filter)
- GET /v2/tokens/chains
- GET /v2/tokens/search
- GET /v2/tokens/:assetId

**Key Improvements:**
- Public token discovery (no auth)
- Filtering by chain and symbol
- Search with partial matching
- Blockchain listing with token counts
- Singleton pattern for TokenService

## Directory Structure
```
/root/agentfi-sdk/
├── api/
│   ├── src/
│   │   ├── v2/                          # V2 Implementation (Current)
│   │   │   ├── controllers/
│   │   │   │   ├── SwapController.ts    # ✅ HTTP request handling
│   │   │   │   └── TokenController.ts   # ✅ Token endpoints (NEW)
│   │   │   ├── services/
│   │   │   │   ├── SwapService.ts       # ✅ Swap orchestration
│   │   │   │   ├── TokenService.ts      # ✅ Token discovery (Singleton)
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
│   │   │   │   ├── swap.routes.ts       # ✅ Swap endpoints
│   │   │   │   ├── auth.routes.ts       # ✅ Auth endpoints
│   │   │   │   └── token.routes.ts      # ✅ Token endpoints (NEW)
│   │   │   ├── types/
│   │   │   │   └── swap.types.ts        # ✅ Type definitions
│   │   │   ├── errors/
│   │   │   │   └── index.ts             # ✅ Custom error classes
│   │   │   └── tests/                   # ✅ All tests (127 passing)
│   │   │       ├── ApiKeyService.test.ts
│   │   │       ├── RateLimitService.test.ts
│   │   │       ├── WebhookService.test.ts
│   │   │       ├── OneClickService.test.ts
│   │   │       ├── TokenService.test.ts
│   │   │       ├── TokenPriceService.test.ts
│   │   │       ├── SwapService.test.ts
│   │   │       ├── SwapController.test.ts
│   │   │       ├── TokenController.test.ts  # ✅ NEW
│   │   │       ├── integration.test.ts
│   │   │       ├── errors.test.ts
│   │   │       └── errorHandler.test.ts
│   │   ├── routes/                      # V1 Routes (Deprecated)
│   │   ├── services/                    # V1 Services (Deprecated)
│   │   ├── app.ts                       # ✅ Express app setup
│   │   └── index.ts                     # ✅ Server entry point
│   ├── prisma/
│   │   └── schema.prisma                # ✅ Database schema
│   ├── package.json                     # ✅ Dependencies
│   └── tsconfig.json                    # ✅ TypeScript config
├── docs/
│   └── v2.0/
│       ├── STATE.md                     # ✅ This file
│       ├── PROGRESS.md                  # ✅ Progress tracking
│       ├── ARCHITECTURE.md              # ✅ System design
│       ├── ONECLICK-API.md              # ✅ API documentation
│       └── PROJECT-INSTRUCTIONS.md      # ✅ Development workflow
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
  
GET /v2/swap/:intentId
  • Get swap status
  • Public endpoint (no auth required)
```

#### Token Endpoints (NEW - Session 18)
```
GET /v2/tokens
  • List all supported tokens
  • Optional filters: ?chain=near&symbol=USDC
  • Public endpoint (no auth required)
  • Returns: 117+ tokens with prices

GET /v2/tokens/chains
  • List supported blockchains
  • Returns: 22+ blockchains with token counts

GET /v2/tokens/search?q=USDC
  • Search tokens by symbol
  • Optional filter: &chain=near

GET /v2/tokens/:assetId
  • Get specific token details
  • Example: /v2/tokens/nep141:wrap.near
```

#### Auth Endpoints
```
POST /v2/auth/api-key
  • Create API key (public, rate limited)

GET /v2/auth/api-keys
  • List user's API keys (requires auth)

DELETE /v2/auth/api-key/:id
  • Revoke API key (requires auth)
```

## Service Layer Details

### TokenService (Singleton - Updated Session 18)
**Purpose:** Dynamic token discovery and resolution
**Status:** ✅ Complete (20 tests passing)

**Architecture:** Singleton pattern
- Single shared instance across all routes
- Prevents duplicate API calls
- Consistent cache across services

**Key Features:**
- Fetches 117+ tokens from OneClick API
- Caches tokens in memory (auto-refresh every 30 min)
- Resolves tokens by assetId or symbol+chain
- Price lookup for any supported token
- Blockchain enumeration

**Methods:**
- `getInstance()` - Get singleton instance
- `refreshTokenCache()` - Fetch tokens from API
- `resolveToken(token, chain?)` - Resolve to OneClickToken
- `getTokenPrice(assetId)` - Get USD price
- `findByAssetId(assetId)` - Direct lookup
- `findBySymbol(symbol, chain?)` - Symbol search
- `getAllTokens()` - Get all cached tokens
- `getBlockchains()` - List supported chains

### TokenController (NEW - Session 18)
**Purpose:** HTTP handlers for token endpoints
**Status:** ✅ Complete (16 tests passing)

**Methods:**
- `listTokens()` - List/filter all tokens
- `getChains()` - List blockchains with counts
- `searchTokens()` - Search by symbol
- `getToken()` - Get specific token by assetId

### TokenPriceService
**Purpose:** Token pricing and validation
**Status:** ✅ Complete (15 tests passing)

**Key Features:**
- $5 minimum transaction validation
- USD value calculation
- Amount formatting for display
- Integration with TokenService

### SwapService
**Purpose:** Orchestrate swap operations
**Status:** ✅ Complete (4 tests passing)

**Features:**
- Uses TokenService for token resolution
- Uses TokenPriceService for validation
- Enhanced responses with full token metadata
- Dynamic support for all OneClick tokens

### OneClickService
**Purpose:** Direct integration with OneClick API
**Status:** ✅ Complete (2 tests passing)

**Methods:**
- `getQuote(params)` - Get swap quote and deposit address
- Supports all OneClick tokens (117+)

## Token Support

**Supported Tokens:** 117+ (dynamic from OneClick API)
**Supported Blockchains:** 22+ including:
- NEAR Protocol (26 tokens)
- Ethereum (20 tokens)
- Solana (13 tokens)
- Gnosis, BSC, Base, Arbitrum, Optimism
- Avalanche, Polygon, Aptos, Stellar
- Sui, TON, Tron, Bitcoin, Cardano
- Dogecoin, Litecoin, XRP, Zcash

**Token Resolution:**
- By assetId: `nep141:wrap.near`
- By symbol: `wNEAR` (with optional chain filter)
- Real-time pricing from OneClick API
- Automatic cache refresh every 30 minutes

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

## Next Steps

### 1. CRITICAL: Mainnet Testing (Recommended Next)
**Priority:** HIGH  
**Duration:** 1-2 hours

**Test Scenarios:**
1. Small wNEAR → USDC swap (~$5-10)
2. Test token discovery endpoints
3. Verify deposit address generation
4. Monitor real transactions
5. Test error handling

**Why Critical:**
- All code tested but not with real transactions
- Need to verify OneClick integration works end-to-end
- Validate pricing accuracy
- Confirm deposit flow

### 2. Production Deployment
**Priority:** Medium  
**Duration:** 2-3 hours

- Environment configuration
- Enhanced monitoring
- Performance tuning
- Documentation

## Commands Reference

### Development
```bash
# Start API server
cd /root/agentfi-sdk/api && npm run dev

# Run all tests
cd /root/agentfi-sdk/api && npx vitest run

# Run specific test
cd /root/agentfi-sdk/api && npx vitest run src/v2/tests/TokenController.test.ts

# Watch mode
cd /root/agentfi-sdk/api && npx vitest
```

### Testing Token Endpoints
```bash
# List all tokens
curl http://localhost:3000/v2/tokens

# Filter by chain
curl "http://localhost:3000/v2/tokens?chain=near"

# Search tokens
curl "http://localhost:3000/v2/tokens/search?q=USDC"

# Get blockchains
curl http://localhost:3000/v2/tokens/chains

# Get specific token
curl http://localhost:3000/v2/tokens/nep141:wrap.near
```

## Success Criteria

- [x] All tests passing (127/127) ✅
- [x] Zero hardcoded tokens ✅
- [x] Dynamic token discovery ✅
- [x] Real-time pricing ✅
- [x] Enhanced swap responses ✅
- [x] Token API endpoints ✅
- [ ] Mainnet testing complete ⏳ NEXT
- [ ] Production deployment

---

**Last Commit:** Session 17 - Multi-token support complete
**Next Commit:** Session 18 - Token Discovery API implementation
