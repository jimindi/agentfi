# AgentFi SDK v2.0 - API Usage Guide

**Last Updated:** November 15, 2025 (Session 19)  
**API Base URL:** `https://api.agentfi.divindi.tech`  
**Version:** 2.0.0

## Table of Contents

1. [Authentication](#authentication)
2. [Swap Execution](#swap-execution)
3. [Token Discovery](#token-discovery)
4. [Rate Limits](#rate-limits)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)

---

## Authentication

All authenticated endpoints require an API key in the `Authorization` header.

### Creating an API Key

**Endpoint:** `POST /v2/auth/api-key`

**Request:**
```bash
curl -X POST https://api.agentfi.divindi.tech/v2/auth/api-key \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "name": "My Application"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apiKey": "agfi_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx...",
    "keyId": "cf86dc9c-d529-48b0-a78d-0439c0d19de4",
    "name": "My App",
    "rateLimitPerHour": 1000,
    "createdAt": "2025-11-15T00:12:36.001Z"
  },
  "warning": "Store this key securely. It will not be shown again."
}
```

**⚠️ Important:** Save the API key immediately - it won't be shown again.

### Using Your API Key

Include the API key in the `Authorization` header:
```bash
curl -H "Authorization: Bearer agfi_live_your_api_key_here" \
  https://api.agentfi.divindi.tech/v2/swap
```

---

## Swap Execution

### Step 1: Request a Swap

**Endpoint:** `POST /v2/swap`

**Request Body:**
```json
{
  "from": {
    "chain": "near",
    "token": "wNEAR",
    "amount": "2200000000000000000000000"
  },
  "to": {
    "chain": "near",
    "token": "USDC"
  },
  "user": {
    "walletAddress": "your-wallet.near"
  }
}
```

**Important Notes:**
- **Amount Format:** Always provide amounts in the token's smallest unit (e.g., yoctoNEAR for NEAR)
  - 1 NEAR = 10^24 yoctoNEAR
  - 1 USDC = 10^6 micro-USDC
- **Token Symbols:** Use exact symbols from the token discovery API
- **Chain Names:** Must match supported blockchain names

**Response:**
```json
{
  "success": true,
  "data": {
    "intentId": "2c27fa24-bf54-4d07-9dfe-100102b0912a",
    "status": "pending_deposit",
    "quote": {
      "fromToken": {
        "symbol": "wNEAR",
        "chain": "near",
        "decimals": 24,
        "usdValue": "5.19"
      },
      "toToken": {
        "symbol": "USDC",
        "chain": "near",
        "decimals": 6,
        "estimatedOutput": "5206494",
        "usdValue": "5.21"
      },
      "exchangeRate": "2.36679",
      "priceImpact": "0.12",
      "estimatedTime": "~1 minute"
    },
    "depositAddress": "7067b3a0b35933d5ad34ce0ccc22e8402040c6d81bea8e111237fe30fea29e93",
    "transferInstructions": {
      "method": "ft_transfer_call",
      "contract": "wrap.near",
      "receiver": "intents.near",
      "amount": "2200000000000000000000000",
      "msg": "{\"receiver_id\":\"7067b3a0b35933d5ad34ce0ccc22e8402040c6d81bea8e111237fe30fea29e93\"}",
      "deposit": "1",
      "gas": "300000000000000",
      "nearCliCommand": "near call wrap.near ft_transfer_call '{\"receiver_id\":\"intents.near\",\"amount\":\"2200000000000000000000000\",\"msg\":\"{\\\"receiver_id\\\":\\\"7067b3a0b35933d5ad34ce0ccc22e8402040c6d81bea8e111237fe30fea29e93\\\"}\"}' --accountId YOUR_WALLET --depositYocto 1 --gas 300000000000000 --networkId mainnet"
    },
    "expiresAt": "2025-11-15T00:29:36.515Z"
  }
}
```

### Step 2: Execute the Transfer

**CRITICAL:** You MUST use the exact command from `transferInstructions.nearCliCommand`

#### Option 1: Using NEAR CLI (Recommended)

Copy the `nearCliCommand` from the response and replace `YOUR_WALLET` with your actual wallet:
```bash
near call wrap.near ft_transfer_call \
  '{"receiver_id":"intents.near","amount":"2200000000000000000000000","msg":"{\"receiver_id\":\"7067b3a0b35933d5ad34ce0ccc22e8402040c6d81bea8e111237fe30fea29e93\"}"}' \
  --accountId your-wallet.near \
  --depositYocto 1 \
  --gas 300000000000000 \
  --networkId mainnet
```

#### Option 2: Using NEAR JavaScript API
```javascript
import { connect, keyStores, Contract } from 'near-api-js';

const near = await connect({
  networkId: 'mainnet',
  keyStore: new keyStores.InFileKeyStore(),
  nodeUrl: 'https://rpc.mainnet.near.org'
});

const account = await near.account('your-wallet.near');

const result = await account.functionCall({
  contractId: 'wrap.near',
  methodName: 'ft_transfer_call',
  args: {
    receiver_id: 'intents.near',
    amount: '2200000000000000000000000',
    msg: '{"receiver_id":"7067b3a0b35933d5ad34ce0ccc22e8402040c6d81bea8e111237fe30fea29e93"}'
  },
  gas: '300000000000000',
  attachedDeposit: '1'
});
```

### Step 3: Monitor Swap Status

**Endpoint:** `GET /v2/swap/:intentId`

**Request:**
```bash
curl https://api.agentfi.divindi.tech/v2/swap/2c27fa24-bf54-4d07-9dfe-100102b0912a
```

**Response:**
```json
{
  "success": true,
  "data": {
    "intentId": "2c27fa24-bf54-4d07-9dfe-100102b0912a",
    "status": "completed",
    "fromToken": {
      "symbol": "wNEAR",
      "amount": "2200000000000000000000000",
      "usdValue": "5.19"
    },
    "toToken": {
      "symbol": "USDC",
      "amount": "5206494",
      "usdValue": "5.21"
    },
    "transactions": [
      {
        "type": "deposit",
        "hash": "BBUr6YPuC8BzTmXWw84AGz4mK8VxR9FGP4oiCEbinaHD",
        "status": "success",
        "timestamp": "2025-11-15T00:15:23.000Z"
      },
      {
        "type": "swap",
        "hash": "...",
        "status": "success",
        "timestamp": "2025-11-15T00:16:12.000Z"
      }
    ],
    "completedAt": "2025-11-15T00:16:12.000Z"
  }
}
```

**Status Values:**
- `pending_deposit` - Waiting for user to deposit tokens
- `deposit_confirmed` - Deposit received, processing swap
- `swapping` - Executing cross-chain swap
- `completed` - Swap successfully completed
- `failed` - Swap failed (reason provided in error field)
- `expired` - Deposit window expired

---

## Token Discovery

### List All Tokens

**Endpoint:** `GET /v2/tokens`

**Optional Query Parameters:**
- `chain` - Filter by blockchain (e.g., `?chain=near`)
- `symbol` - Filter by token symbol (e.g., `?symbol=USDC`)

**Request:**
```bash
curl https://api.agentfi.divindi.tech/v2/tokens?chain=near
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "assetId": "near:mainnet:wrap.near",
        "symbol": "wNEAR",
        "name": "Wrapped NEAR",
        "blockchain": "near",
        "decimals": 24,
        "address": "wrap.near",
        "logoUrl": "https://...",
        "priceUsd": "2.36"
      },
      {
        "assetId": "near:mainnet:usdc.near",
        "symbol": "USDC",
        "name": "USD Coin",
        "blockchain": "near",
        "decimals": 6,
        "address": "usdc.near",
        "logoUrl": "https://...",
        "priceUsd": "1.00"
      }
    ],
    "totalCount": 117,
    "filteredCount": 12
  }
}
```

### List Supported Blockchains

**Endpoint:** `GET /v2/tokens/chains`

**Request:**
```bash
curl https://api.agentfi.divindi.tech/v2/tokens/chains
```

**Response:**
```json
{
  "success": true,
  "data": {
    "blockchains": [
      "arbitrum",
      "avalanche",
      "base",
      "bitcoin",
      "bnb",
      "ethereum",
      "near",
      "optimism",
      "polygon",
      "solana"
    ],
    "totalCount": 22
  }
}
```

### Search Tokens

**Endpoint:** `GET /v2/tokens/search`

**Query Parameter:** `q` - Search query

**Request:**
```bash
curl https://api.agentfi.divindi.tech/v2/tokens/search?q=USDC
```

### Get Specific Token

**Endpoint:** `GET /v2/tokens/:assetId`

**Request:**
```bash
curl https://api.agentfi.divindi.tech/v2/tokens/near:mainnet:wrap.near
```

---

## Rate Limits

### Default Limits

- **Unauthenticated:** 100 requests per hour
- **Authenticated:** 1000 requests per hour per API key
- **Burst:** Up to 20 requests per minute

### Rate Limit Headers

All responses include rate limit information:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1699920000
```

### Handling Rate Limits

If you exceed the rate limit, you'll receive a `429 Too Many Requests` response:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 3600 seconds.",
    "statusCode": 429,
    "details": {
      "limit": 1000,
      "remaining": 0,
      "resetAt": "2025-11-15T01:00:00.000Z"
    }
  }
}
```

---

## Error Handling

### Error Response Format

All errors follow this structure:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "statusCode": 400,
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `TOKEN_NOT_FOUND` | 404 | Token not supported |
| `INSUFFICIENT_LIQUIDITY` | 400 | Not enough liquidity for swap |
| `AMOUNT_TOO_LOW` | 400 | Swap amount below minimum |
| `EXTERNAL_API_ERROR` | 502 | OneClick API unavailable |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Example Error Responses

**Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid swap parameters",
    "statusCode": 400,
    "details": {
      "field": "from.amount",
      "issue": "Must be a positive integer string"
    }
  }
}
```

**Token Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_NOT_FOUND",
    "message": "Token 'XYZ' not found on chain 'near'",
    "statusCode": 404
  }
}
```

---

## Code Examples

### Complete Swap Flow (Node.js)
```javascript
const AGENTFI_API = 'https://api.agentfi.divindi.tech';
const API_KEY = 'agfi_live_your_api_key_here';

async function executeSwap() {
  // Step 1: Request swap
  const swapResponse = await fetch(`${AGENTFI_API}/v2/swap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      from: {
        chain: 'near',
        token: 'wNEAR',
        amount: '2200000000000000000000000' // 2.2 NEAR
      },
      to: {
        chain: 'near',
        token: 'USDC'
      },
      user: {
        walletAddress: 'your-wallet.near'
      }
    })
  });

  const swap = await swapResponse.json();
  
  if (!swap.success) {
    throw new Error(swap.error.message);
  }

  const { intentId, transferInstructions } = swap.data;
  
  console.log('Swap created:', intentId);
  console.log('Execute this command:');
  console.log(transferInstructions.nearCliCommand);
  
  // Step 2: Wait for user to execute transfer
  // (In a real app, you'd use the NEAR API to execute the transfer)
  
  // Step 3: Poll for completion
  let status = 'pending_deposit';
  while (status !== 'completed' && status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
    
    const statusResponse = await fetch(`${AGENTFI_API}/v2/swap/${intentId}`);
    const statusData = await statusResponse.json();
    
    status = statusData.data.status;
    console.log('Current status:', status);
  }
  
  if (status === 'completed') {
    console.log('Swap completed successfully!');
  } else {
    console.log('Swap failed');
  }
}

executeSwap().catch(console.error);
```

### Token Search (Python)
```python
import requests

AGENTFI_API = 'https://api.agentfi.divindi.tech'

def search_tokens(query):
    response = requests.get(
        f'{AGENTFI_API}/v2/tokens/search',
        params={'q': query}
    )
    data = response.json()
    
    if data['success']:
        for token in data['data']['tokens']:
            print(f"{token['symbol']}: {token['name']} on {token['blockchain']}")
    else:
        print(f"Error: {data['error']['message']}")

search_tokens('USDC')
```

### Error Handling Best Practices
```javascript
async function safeSwap(swapParams) {
  try {
    const response = await fetch(`${AGENTFI_API}/v2/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(swapParams)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      // Handle specific error codes
      switch (data.error.code) {
        case 'RATE_LIMIT_EXCEEDED':
          const resetTime = new Date(data.error.details.resetAt);
          console.log(`Rate limited until ${resetTime}`);
          break;
        case 'INSUFFICIENT_LIQUIDITY':
          console.log('Not enough liquidity, try a smaller amount');
          break;
        case 'TOKEN_NOT_FOUND':
          console.log('Invalid token, check available tokens');
          break;
        default:
          console.log(`Error: ${data.error.message}`);
      }
      return null;
    }
    
    return data.data;
    
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

---

## Best Practices

### 1. Always Use Transfer Instructions

**❌ WRONG - Will fail:**
```bash
# Don't transfer directly to deposit address
near call wrap.near ft_transfer \
  '{"receiver_id":"7067b3...","amount":"2200000000000000000000000"}' \
  --accountId your-wallet.near
```

**✅ CORRECT - Use exact command from API:**
```bash
# Always use the nearCliCommand from transferInstructions
near call wrap.near ft_transfer_call \
  '{"receiver_id":"intents.near","amount":"2200000000000000000000000","msg":"{\"receiver_id\":\"7067b3...\"}"}' \
  --accountId your-wallet.near \
  --depositYocto 1 \
  --gas 300000000000000
```

### 2. Handle Amount Conversions Carefully
```javascript
// Convert human-readable amounts to token units
function toTokenUnits(amount, decimals) {
  return BigInt(amount * 10 ** decimals).toString();
}

// Example: 2.2 NEAR = 2200000000000000000000000 yoctoNEAR
const nearAmount = toTokenUnits(2.2, 24);
```

### 3. Implement Exponential Backoff for Retries
```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        // Rate limited - wait and retry
        const waitTime = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

### 4. Cache Token Information
```javascript
const tokenCache = new Map();

async function getToken(assetId) {
  if (tokenCache.has(assetId)) {
    return tokenCache.get(assetId);
  }
  
  const response = await fetch(`${AGENTFI_API}/v2/tokens/${assetId}`);
  const data = await response.json();
  
  if (data.success) {
    tokenCache.set(assetId, data.data.token);
    return data.data.token;
  }
  
  return null;
}
```

### 5. Monitor Swap Status with Webhooks (Coming Soon)

While polling works, webhooks will be more efficient:
```javascript
// Register webhook endpoint (coming soon)
await fetch(`${AGENTFI_API}/v2/webhooks`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    url: 'https://your-app.com/webhooks/swap-status',
    events: ['swap.completed', 'swap.failed']
  })
});
```

---

## Support

- **Documentation:** https://docs.agentfi.divindi.tech
- **API Status:** https://api.agentfi.divindi.tech/health
- **Issues:** https://github.com/jimindi/agentfi/issues

---

**Last Updated:** Session 19 - Transfer Instructions API Complete
