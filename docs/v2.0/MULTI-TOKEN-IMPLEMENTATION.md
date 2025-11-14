# Multi-Token Support Implementation Plan

**Status:** Ready for Implementation  
**Priority:** High (Required before production)  
**Estimated Effort:** 4-6 hours

## Overview

Extend the AgentFi Swap API to support all 117 tokens available through OneClick API across 22+ blockchains, replacing the current hardcoded wNEAR/USDC implementation with dynamic token discovery and resolution.

## Current Limitations

- ❌ Hardcoded to only support wNEAR → USDC swaps
- ❌ No token discovery mechanism
- ❌ Cannot handle cross-chain swaps
- ❌ Manual price lookups for validation

## Goals

- ✅ Support all 117+ tokens from OneClick API
- ✅ Dynamic token discovery (no hardcoding)
- ✅ Support both native tokens (BTC, ETH) and contract tokens (USDC, wNEAR)
- ✅ Flexible input: symbol+chain OR assetId
- ✅ Automatic token price fetching
- ✅ Cross-chain swap capability
- ✅ Token discovery endpoint for API consumers

## Token Categories

### 1. Native Chain Tokens (no contractAddress)
**Examples:** BTC, ETH, SOL, AVAX, BNB, POL, TRX, TON, ADA, LTC, XRP, DOGE

These are the native currency of their blockchain and don't have smart contract addresses.

### 2. Token Contracts (have contractAddress)
**Examples:** USDC, USDT, wNEAR, wBTC, DAI, SHIB, PEPE

These are smart contracts deployed on various blockchains (ERC-20, NEP-141, SPL, etc.).

## API Changes

### Input Format (Hybrid Approach)

**Option 1: Symbol + Chain (Simple)**
```json
POST /v2/swap
{
  "from": {
    "chain": "near",
    "token": "wNEAR",
    "amount": "10000000000000000000000"
  },
  "to": {
    "chain": "near",
    "token": "USDC"
  },
  "user": {
    "walletAddress": "user.near"
  }
}
```

**Option 2: AssetId (Explicit)**
```json
POST /v2/swap
{
  "from": {
    "token": "nep141:wrap.near",
    "amount": "10000000000000000000000"
  },
  "to": {
    "token": "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"
  },
  "user": {
    "walletAddress": "user.near"
  }
}
```

### Output Format (Enhanced)
```json
{
  "success": true,
  "data": {
    "intentId": "abc123",
    "depositAddress": "0x...",
    "from": {
      "symbol": "wNEAR",
      "assetId": "nep141:wrap.near",
      "blockchain": "near",
      "decimals": 24,
      "contractAddress": "wrap.near",
      "amount": "10000000000000000000000",
      "amountFormatted": "10.0 wNEAR",
      "amountUsd": "23.60"
    },
    "to": {
      "symbol": "USDC",
      "assetId": "nep141:17208628...",
      "blockchain": "near",
      "decimals": 6,
      "contractAddress": "17208628...",
      "estimatedAmount": "23600000",
      "estimatedFormatted": "23.6 USDC",
      "estimatedUsd": "23.60"
    },
    "fees": { /* ... */ },
    "deadline": "2025-11-14T13:00:00Z"
  }
}
```

**Note:** `contractAddress` is optional and only present for token contracts, not native tokens.

### New Endpoint: GET /v2/tokens
```bash
# Get all tokens
GET /v2/tokens

# Filter by chain
GET /v2/tokens?chain=near

# Filter by symbol
GET /v2/tokens?symbol=USDC

# Get specific token
GET /v2/tokens?chain=near&symbol=USDC
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "assetId": "nep141:wrap.near",
        "symbol": "wNEAR",
        "blockchain": "near",
        "decimals": 24,
        "price": 2.36,
        "priceUpdatedAt": "2025-11-14T12:06:00.247Z",
        "contractAddress": "wrap.near"
      },
      {
        "assetId": "nep141:btc.omft.near",
        "symbol": "BTC",
        "blockchain": "btc",
        "decimals": 8,
        "price": 95863,
        "priceUpdatedAt": "2025-11-14T12:06:00.247Z"
      }
    ],
    "count": 2,
    "lastUpdated": "2025-11-14T12:06:00.247Z"
  }
}
```

## Implementation Tasks

### 1. Create TokenService

**File:** `api/src/v2/services/TokenService.ts`

**Responsibilities:**
- Fetch token list from OneClick API (`/v0/tokens`)
- Cache tokens in memory with TTL (1 hour)
- Refresh cache periodically
- Provide token lookup methods

**Methods:**
```typescript
class TokenService {
  // Fetch and cache tokens from OneClick
  async refreshTokenCache(): Promise<void>
  
  // Get all cached tokens
  getAllTokens(): OneClickToken[]
  
  // Find token by assetId
  findByAssetId(assetId: string): OneClickToken | null
  
  // Find tokens by symbol (may return multiple)
  findBySymbol(symbol: string, chain?: string): OneClickToken[]
  
  // Resolve user input to OneClickToken
  resolveToken(token: string, chain?: string): OneClickToken
  
  // Get token price in USD
  getTokenPrice(assetId: string): number
}
```

**Caching Strategy:**
- In-memory cache with Map structure
- TTL: 1 hour (tokens/prices update frequently)
- Automatic refresh on startup
- Background refresh every 30 minutes
- Fallback: Use stale cache if refresh fails

### 2. Update Type Definitions

**File:** `api/src/v2/types/index.ts`
```typescript
// OneClick token from /v0/tokens endpoint
export interface OneClickToken {
  assetId: string;
  decimals: number;
  blockchain: string;
  symbol: string;
  price: number;
  priceUpdatedAt: string;
  contractAddress?: string;  // Optional - only for token contracts
}

// User input format (hybrid)
export interface SwapRequest {
  from: {
    chain?: string;      // Optional if using assetId
    token: string;       // Symbol (e.g., "USDC") OR assetId
    amount: string;
  };
  to: {
    chain?: string;
    token: string;
  };
  user: {
    walletAddress: string;
  };
  webhookUrl?: string;
}

// Enhanced token info in response
export interface TokenInfo {
  symbol: string;
  assetId: string;
  blockchain: string;
  decimals: number;
  contractAddress?: string;  // Optional
  amount: string;
  amountFormatted: string;
  amountUsd: string;
}

export interface SwapResult {
  intentId: string;
  depositAddress: string;
  from: TokenInfo;
  to: Omit<TokenInfo, 'amount'> & {
    estimatedAmount: string;
    estimatedFormatted: string;
    estimatedUsd: string;
  };
  fees: FeeBreakdown;
  deadline: string;
}
```

### 3. Update TokenPriceService

**File:** `api/src/v2/services/TokenPriceService.ts`

**Changes:**
- Remove hardcoded token prices
- Use TokenService to get prices from OneClick cache
- Calculate USD values using cached prices
- Validate minimum amount using real-time prices
```typescript
class TokenPriceService {
  constructor(private tokenService: TokenService) {}
  
  // Get current price from cache
  getPrice(assetId: string): number {
    return this.tokenService.getTokenPrice(assetId);
  }
  
  // Calculate USD value
  calculateUsdValue(amount: string, decimals: number, assetId: string): number {
    const price = this.getPrice(assetId);
    const amountNum = parseFloat(amount) / Math.pow(10, decimals);
    return amountNum * price;
  }
  
  // Validate minimum amount ($5 USD)
  validateMinimumAmount(amount: string, decimals: number, assetId: string): void {
    const usdValue = this.calculateUsdValue(amount, decimals, assetId);
    if (usdValue < 5.0) {
      throw new ValidationError(
        `Transaction amount ($${usdValue.toFixed(2)}) is below minimum of $5.00`,
        { actualUsd: usdValue, minimumUsd: 5.0 }
      );
    }
  }
}
```

### 4. Update SwapService

**File:** `api/src/v2/services/SwapService.ts`

**Changes:**
- Remove hardcoded wNEAR/USDC logic
- Use TokenService to resolve tokens from user input
- Support both symbol+chain and assetId input formats
- Build OneClick request with resolved tokens
```typescript
class SwapService {
  constructor(
    private oneClickService: OneClickService,
    private tokenService: TokenService,
    private tokenPriceService: TokenPriceService
  ) {}
  
  async createSwap(request: SwapRequest, userId: string, apiKeyId: string): Promise<SwapResult> {
    // 1. Resolve tokens from user input
    const fromToken = this.tokenService.resolveToken(
      request.from.token,
      request.from.chain
    );
    const toToken = this.tokenService.resolveToken(
      request.to.token,
      request.to.chain
    );
    
    // 2. Validate minimum amount
    this.tokenPriceService.validateMinimumAmount(
      request.from.amount,
      fromToken.decimals,
      fromToken.assetId
    );
    
    // 3. Get quote from OneClick
    const quote = await this.oneClickService.getQuote({
      originAsset: fromToken.assetId,
      destinationAsset: toToken.assetId,
      amount: request.from.amount,
      // ... other params
    });
    
    // 4. Build enhanced response with token details
    return this.buildSwapResult(quote, fromToken, toToken, request);
  }
  
  private buildSwapResult(
    quote: OneClickQuote,
    fromToken: OneClickToken,
    toToken: OneClickToken,
    request: SwapRequest
  ): SwapResult {
    return {
      intentId: /* generate */,
      depositAddress: quote.depositAddress,
      from: {
        symbol: fromToken.symbol,
        assetId: fromToken.assetId,
        blockchain: fromToken.blockchain,
        decimals: fromToken.decimals,
        contractAddress: fromToken.contractAddress,  // May be undefined
        amount: request.from.amount,
        amountFormatted: this.formatAmount(request.from.amount, fromToken),
        amountUsd: this.calculateUsd(request.from.amount, fromToken)
      },
      to: {
        symbol: toToken.symbol,
        assetId: toToken.assetId,
        blockchain: toToken.blockchain,
        decimals: toToken.decimals,
        contractAddress: toToken.contractAddress,  // May be undefined
        estimatedAmount: quote.amountOut,
        estimatedFormatted: this.formatAmount(quote.amountOut, toToken),
        estimatedUsd: this.calculateUsd(quote.amountOut, toToken)
      },
      fees: /* ... */,
      deadline: quote.deadline
    };
  }
}
```

### 5. Create TokenController

**File:** `api/src/v2/controllers/TokenController.ts`
```typescript
export class TokenController {
  constructor(private tokenService: TokenService) {}
  
  // GET /v2/tokens
  async getTokens(req: Request, res: Response) {
    const { chain, symbol } = req.query;
    
    let tokens = this.tokenService.getAllTokens();
    
    // Apply filters
    if (chain) {
      tokens = tokens.filter(t => t.blockchain === chain);
    }
    if (symbol) {
      tokens = tokens.filter(t => t.symbol === symbol);
    }
    
    return res.json({
      success: true,
      data: {
        tokens,
        count: tokens.length,
        lastUpdated: /* cache timestamp */
      }
    });
  }
  
  // GET /v2/tokens/chains
  async getChains(req: Request, res: Response) {
    const tokens = this.tokenService.getAllTokens();
    const chains = [...new Set(tokens.map(t => t.blockchain))].sort();
    
    return res.json({
      success: true,
      data: { chains }
    });
  }
}
```

### 6. Add Token Routes

**File:** `api/src/v2/routes/token.routes.ts`
```typescript
import { Router } from 'express';
import { TokenController } from '../controllers/TokenController';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router = Router();
const tokenController = new TokenController(/* inject TokenService */);

// Public endpoints with rate limiting
router.get(
  '/',
  rateLimitMiddleware('ip', 100, 3600),  // 100/hour per IP
  asyncHandler(tokenController.getTokens.bind(tokenController))
);

router.get(
  '/chains',
  rateLimitMiddleware('ip', 100, 3600),
  asyncHandler(tokenController.getChains.bind(tokenController))
);

export default router;
```

### 7. Update Main Routes

**File:** `api/src/v2/routes/index.ts`
```typescript
import tokenRoutes from './token.routes';

const router = Router();

router.use('/swap', swapRoutes);
router.use('/auth', authRoutes);
router.use('/tokens', tokenRoutes);  // Add token routes

export default router;
```

### 8. Initialize TokenService on Startup

**File:** `api/src/app.ts`
```typescript
import { TokenService } from './v2/services/TokenService';

// Initialize TokenService
const tokenService = new TokenService();

// Fetch tokens on startup
await tokenService.refreshTokenCache();
logger.info('Token cache initialized', { 
  count: tokenService.getAllTokens().length 
});

// Refresh cache every 30 minutes
setInterval(async () => {
  try {
    await tokenService.refreshTokenCache();
    logger.info('Token cache refreshed');
  } catch (error) {
    logger.error('Failed to refresh token cache', { error });
  }
}, 30 * 60 * 1000);
```

## Token Resolution Logic

### Handling Ambiguous Symbols
```typescript
resolveToken(token: string, chain?: string): OneClickToken {
  // Case 1: Direct assetId provided (contains ":" or known prefixes)
  if (token.includes(':') || 
      token.startsWith('nep141:') || 
      token.startsWith('nep245:') ||
      token.startsWith('1cs_v1:')) {
    const found = this.findByAssetId(token);
    if (!found) {
      throw new ValidationError(`Invalid assetId: ${token}`);
    }
    return found;
  }
  
  // Case 2: Symbol lookup (with optional chain filter)
  const matches = this.findBySymbol(token, chain);
  
  if (matches.length === 0) {
    const chainMsg = chain ? ` on chain "${chain}"` : '';
    throw new ValidationError(`Token "${token}" not found${chainMsg}`);
  }
  
  if (matches.length > 1) {
    throw new ValidationError(
      `Multiple "${token}" tokens found. Please specify chain or use assetId.`,
      { 
        availableOptions: matches.map(t => ({
          blockchain: t.blockchain,
          assetId: t.assetId,
          contractAddress: t.contractAddress || null
        }))
      }
    );
  }
  
  return matches[0];
}
```

### Example Error Responses

**Ambiguous Symbol:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Multiple \"USDC\" tokens found. Please specify chain or use assetId.",
    "details": {
      "availableOptions": [
        {
          "blockchain": "near",
          "assetId": "nep141:17208628...",
          "contractAddress": "17208628..."
        },
        {
          "blockchain": "eth",
          "assetId": "eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
          "contractAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        }
      ]
    }
  }
}
```

**Token Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Token \"INVALID\" not found on chain \"near\""
  }
}
```

## Testing Requirements

### Unit Tests

**File:** `api/src/v2/tests/TokenService.test.ts`
```typescript
describe('TokenService', () => {
  describe('Token Resolution', () => {
    test('should resolve token by assetId', async () => {
      const token = tokenService.resolveToken('nep141:wrap.near');
      expect(token.symbol).toBe('wNEAR');
    });
    
    test('should resolve token by symbol + chain', async () => {
      const token = tokenService.resolveToken('USDC', 'near');
      expect(token.assetId).toContain('17208628');
    });
    
    test('should throw error for ambiguous symbol without chain', async () => {
      expect(() => {
        tokenService.resolveToken('USDC');  // Multiple USDC tokens exist
      }).toThrow('Multiple "USDC" tokens found');
    });
    
    test('should handle native tokens without contractAddress', async () => {
      const token = tokenService.resolveToken('BTC', 'btc');
      expect(token.contractAddress).toBeUndefined();
      expect(token.symbol).toBe('BTC');
    });
    
    test('should handle contract tokens with contractAddress', async () => {
      const token = tokenService.resolveToken('wNEAR', 'near');
      expect(token.contractAddress).toBe('wrap.near');
    });
  });
  
  describe('Cache Management', () => {
    test('should fetch and cache tokens on startup', async () => {
      await tokenService.refreshTokenCache();
      const tokens = tokenService.getAllTokens();
      expect(tokens.length).toBeGreaterThan(100);
    });
    
    test('should filter tokens by chain', async () => {
      const nearTokens = tokenService.findBySymbol('USDC', 'near');
      expect(nearTokens.every(t => t.blockchain === 'near')).toBe(true);
    });
  });
});
```

**File:** `api/src/v2/tests/SwapService.test.ts` (Update existing)
```typescript
describe('SwapService - Multi-Token Support', () => {
  test('should create swap with symbol + chain', async () => {
    const result = await swapService.createSwap({
      from: { chain: 'near', token: 'wNEAR', amount: '10000000...' },
      to: { chain: 'near', token: 'USDC' },
      user: { walletAddress: 'test.near' }
    }, userId, apiKeyId);
    
    expect(result.from.symbol).toBe('wNEAR');
    expect(result.to.symbol).toBe('USDC');
  });
  
  test('should create swap with assetId', async () => {
    const result = await swapService.createSwap({
      from: { token: 'nep141:wrap.near', amount: '10000000...' },
      to: { token: 'nep141:17208628...' },
      user: { walletAddress: 'test.near' }
    }, userId, apiKeyId);
    
    expect(result.from.assetId).toBe('nep141:wrap.near');
  });
  
  test('should support cross-chain swaps', async () => {
    const result = await swapService.createSwap({
      from: { chain: 'near', token: 'wNEAR', amount: '10000000...' },
      to: { chain: 'eth', token: 'USDC' },
      user: { walletAddress: '0x...' }
    }, userId, apiKeyId);
    
    expect(result.from.blockchain).toBe('near');
    expect(result.to.blockchain).toBe('eth');
  });
  
  test('should include contractAddress for token contracts', async () => {
    const result = await swapService.createSwap({
      from: { chain: 'near', token: 'wNEAR', amount: '10000000...' },
      to: { chain: 'near', token: 'USDC' },
      user: { walletAddress: 'test.near' }
    }, userId, apiKeyId);
    
    expect(result.from.contractAddress).toBe('wrap.near');
    expect(result.to.contractAddress).toContain('17208628');
  });
  
  test('should omit contractAddress for native tokens', async () => {
    const result = await swapService.createSwap({
      from: { chain: 'btc', token: 'BTC', amount: '100000000' },
      to: { chain: 'near', token: 'USDC' },
      user: { walletAddress: 'test.near' }
    }, userId, apiKeyId);
    
    expect(result.from.contractAddress).toBeUndefined();
  });
});
```

### Integration Tests

**File:** `api/src/v2/tests/integration.test.ts` (Update existing)
```typescript
describe('Multi-Token Integration', () => {
  test('should complete BTC → USDC swap', async () => {
    // Test native token swap
  });
  
  test('should complete cross-chain ETH → NEAR swap', async () => {
    // Test cross-chain swap
  });
  
  test('GET /v2/tokens should return all tokens', async () => {
    const res = await request(app).get('/v2/tokens');
    expect(res.status).toBe(200);
    expect(res.body.data.tokens.length).toBeGreaterThan(100);
  });
  
  test('GET /v2/tokens?chain=near should filter by chain', async () => {
    const res = await request(app).get('/v2/tokens?chain=near');
    expect(res.status).toBe(200);
    expect(res.body.data.tokens.every(t => t.blockchain === 'near')).toBe(true);
  });
});
```

## Migration Strategy

### Phase 1: Add Token Support (Non-Breaking)
1. Create TokenService
2. Add GET /v2/tokens endpoint
3. Keep existing wNEAR/USDC logic working
4. Test new token resolution in parallel

### Phase 2: Update Swap Endpoint (Breaking Change)
1. Update SwapService to use TokenService
2. Support both old and new input formats temporarily
3. Update response format with full token details
4. Deprecation notice for old format

### Phase 3: Remove Legacy Code
1. Remove hardcoded token logic
2. Remove old input format support
3. Update all documentation

## Documentation Updates

### API Documentation

**Example: wNEAR → USDC (Same Chain)**
```bash
curl -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "from": {"chain": "near", "token": "wNEAR", "amount": "10000000000000000000000"},
    "to": {"chain": "near", "token": "USDC"},
    "user": {"walletAddress": "user.near"}
  }'
```

**Example: BTC → USDC (Cross-Chain)**
```bash
curl -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "from": {"chain": "btc", "token": "BTC", "amount": "100000000"},
    "to": {"chain": "near", "token": "USDC"},
    "user": {"walletAddress": "user.near"}
  }'
```

**Example: Using AssetIds (Explicit)**
```bash
curl -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "from": {
      "token": "nep141:wrap.near",
      "amount": "10000000000000000000000"
    },
    "to": {
      "token": "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"
    },
    "user": {"walletAddress": "user.near"}
  }'
```

### SDK Documentation

**Supported Tokens:** See [Token List](./TOKENS.md)  
**Supported Chains:** 22+ blockchains including NEAR, Ethereum, Bitcoin, Solana, Arbitrum, Base, Polygon, and more

## Success Metrics

✅ Support all 117+ tokens from OneClick  
✅ Zero hardcoded token logic  
✅ Handle native tokens (no contractAddress)  
✅ Handle contract tokens (with contractAddress)  
✅ Graceful handling of ambiguous symbols  
✅ Token discovery endpoint functional  
✅ Cross-chain swaps working  
✅ All existing tests passing  
✅ New tests for multi-token scenarios  
✅ Documentation complete  

## Timeline

- **Day 1:** TokenService + types (2-3 hours)
- **Day 2:** Update SwapService + TokenPriceService (2-3 hours)
- **Day 3:** TokenController + routes (1-2 hours)
- **Day 4:** Testing + documentation (2-3 hours)

**Total:** 7-11 hours over 4 days

## Next Steps After Completion

1. Production deployment preparation
2. Load testing with various token pairs
3. Cross-chain swap testing
4. SDK development (TypeScript/Python)
5. Dashboard for monitoring all token pairs
