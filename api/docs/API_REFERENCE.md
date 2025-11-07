# AgentFi SDK - API Reference

**Version:** 1.0.0  
**Last Updated:** November 7, 2025

---

## Base URL

Production: https://api.agentfi.io/v1

---

## Authentication

Protected endpoints require an API key in the Authorization header:

    Authorization: Bearer YOUR_API_KEY

Get your API key:

    POST /v1/auth/api-key

---

## Endpoints

### POST /v1/swap

Execute a cross-chain token swap.

**Authentication:** Required (future)

**Request Body:**

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
        "walletAddress": "your-account.near"
      },
      "signedIntent": {
        "standard": "nep413",
        "payload": {
          "message": "{...}",
          "nonce": "...",
          "recipient": "intents.near"
        },
        "signature": "ed25519:...",
        "public_key": "ed25519:..."
      },
      "options": {
        "webhookUrl": "https://your-app.com/webhook"
      }
    }

**Response (200 OK):**

    {
      "success": true,
      "data": {
        "intentId": "550e8400-e29b-41d4-a716-446655440000",
        "status": "pending_deposit",
        "quote": {
          "fromAmount": "10000000000000000000000",
          "fromAmountFormatted": "0.01",
          "estimatedOutput": "23336",
          "estimatedOutputFormatted": "0.023336",
          "depositAddress": "c9658b53ab3f8c475e1286a4bdc9003dbfebe1afecf59eceae8cfa11a036e5c5",
          "estimatedTime": "20-60 seconds",
          "fees": {
            "platformFeeUsd": "0.0035",
            "networkFeeUsd": "0.50",
            "totalFeeUsd": "0.5035"
          }
        },
        "tracking": {
          "statusUrl": "https://api.agentfi.io/v1/swap/550e8400-...",
          "intentId": "550e8400-e29b-41d4-a716-446655440000"
        }
      }
    }

**Error Response (400 Bad Request):**

    {
      "success": false,
      "error": {
        "code": "INVALID_PARAMETERS",
        "message": "Validation failed",
        "details": [
          {
            "field": "from.amount",
            "message": "Amount must be a positive number"
          }
        ]
      }
    }

---

### GET /v1/swap/:intentId

Get the status of a swap.

**Authentication:** Not required

**Path Parameters:**
- intentId (string, required) - The intent ID returned from POST /v1/swap

**Response (200 OK - Pending):**

    {
      "success": true,
      "data": {
        "intentId": "550e8400-e29b-41d4-a716-446655440000",
        "status": "pending_deposit",
        "from": {
          "chain": "near",
          "token": "wNEAR",
          "amount": "0.010000"
        },
        "to": {
          "chain": "near",
          "token": "USDC"
        },
        "quote": {
          "depositAddress": "c9658b53...",
          "estimatedOutput": "0.023336"
        },
        "createdAt": "2025-11-07T13:30:00.000Z"
      }
    }

**Response (200 OK - Completed):**

    {
      "success": true,
      "data": {
        "intentId": "550e8400-e29b-41d4-a716-446655440000",
        "status": "completed",
        "from": {
          "chain": "near",
          "token": "wNEAR",
          "amount": "0.010000"
        },
        "to": {
          "chain": "near",
          "token": "USDC",
          "actualOutput": "0.023256"
        },
        "txHash": "3H6hfJHaWb3bpgBWxLuRt6ey37aCH7juzwoUWqSsRUCr",
        "executionTimeMs": 518158,
        "completedAt": "2025-11-07T13:41:16.881Z",
        "createdAt": "2025-11-07T13:30:00.000Z"
      }
    }

**Error Response (404 Not Found):**

    {
      "success": false,
      "error": {
        "code": "INTENT_NOT_FOUND",
        "message": "Intent with ID 550e8400-... not found"
      }
    }

---

### GET /v1/tokens

List all supported tokens.

**Authentication:** Not required

**Query Parameters:**
- chain (string, optional) - Filter by chain (e.g., "near", "ethereum")
- search (string, optional) - Search by symbol or name

**Response (200 OK):**

    {
      "success": true,
      "data": {
        "tokens": [
          {
            "symbol": "wNEAR",
            "name": "Wrapped NEAR",
            "chains": [
              {
                "chain": "near",
                "decimals": 24,
                "assetId": "nep141:wrap.near",
                "contractAddress": "wrap.near"
              }
            ]
          },
          {
            "symbol": "USDC",
            "name": "USD Coin",
            "chains": [
              {
                "chain": "near",
                "decimals": 6,
                "assetId": "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
                "contractAddress": "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"
              }
            ]
          }
        ]
      }
    }

---

### GET /v1/chains

List all supported chains.

**Authentication:** Not required

**Response (200 OK):**

    {
      "success": true,
      "data": {
        "chains": [
          {
            "id": "near",
            "name": "NEAR Protocol",
            "nativeToken": "NEAR",
            "explorer": "https://nearblocks.io"
          },
          {
            "id": "ethereum",
            "name": "Ethereum",
            "nativeToken": "ETH",
            "explorer": "https://etherscan.io"
          },
          {
            "id": "solana",
            "name": "Solana",
            "nativeToken": "SOL",
            "explorer": "https://solscan.io"
          }
        ]
      }
    }

---

### POST /v1/auth/api-key

Create a new API key.

**Authentication:** Not required (for now)

**Request Body:**

    {
      "email": "your-email@example.com",
      "name": "My Trading Bot"
    }

**Response (200 OK):**

    {
      "success": true,
      "data": {
        "apiKey": "YOUR_API_KEY_HERE",
        "name": "My Trading Bot",
        "rateLimitPerHour": 10000,
        "createdAt": "2025-11-07T13:30:00.000Z"
      },
      "warning": "Store this key securely. It will not be shown again."
    }

---

### GET /health

Health check endpoint.

**Authentication:** Not required

**Response (200 OK):**

    {
      "status": "healthy",
      "timestamp": "2025-11-07T13:30:00.000Z",
      "services": {
        "database": "connected",
        "redis": "connected",
        "near": "connected"
      }
    }

---

## Status Values

All swaps go through these status values:

| Status | Description |
|--------|-------------|
| pending_deposit | Intent created, waiting for user to deposit tokens |
| deposited | Tokens received at deposit address |
| executing | Solver network processing swap |
| completed | Swap successful, output tokens delivered |
| failed | Swap failed, tokens refunded |

---

## Token Amounts

All token amounts use the smallest unit (no decimals).

### Conversion Examples

| Token | Decimals | Formatted | Raw Amount (API) |
|-------|----------|-----------|------------------|
| wNEAR | 24 | 0.01 NEAR | 10000000000000000000000 |
| USDC | 6 | 1.00 USDC | 1000000 |
| USDT | 6 | 0.50 USDT | 500000 |
| ETH | 18 | 0.001 ETH | 1000000000000000 |
| SOL | 9 | 0.1 SOL | 100000000 |

### Helper Functions

    function toRawAmount(formatted, decimals) {
      return (formatted * Math.pow(10, decimals)).toString();
    }
    
    function fromRawAmount(raw, decimals) {
      return Number(raw) / Math.pow(10, decimals);
    }
    
    // Examples
    toRawAmount(0.01, 24);  // "10000000000000000000000"
    fromRawAmount("1000000", 6);  // 1.0

---

## Platform Fees

AgentFi charges a flat platform fee of **15 basis points (0.15%)** on all swaps.

**Fee Calculation:**

    Platform Fee = Swap Amount × 0.0015
    
    Example: 0.01 wNEAR swap (≈$0.023 USD)
    Platform Fee = $0.023 × 0.0015 = $0.0000345 ≈ $0.0035

**Total Fees:**
- Platform Fee: 0.15% (15 bps)
- Network Fees: Variable (paid to blockchain networks)
- Total: Platform Fee + Network Fees

**Notes:**
- Platform fee is automatically deducted from swap output
- Network fees vary by blockchain and congestion
- No hidden fees or additional charges

---


## Asset IDs

Use these exact asset IDs in your swap requests:

### NEAR Tokens

| Symbol | Asset ID |
|--------|----------|
| wNEAR | nep141:wrap.near |
| USDC | nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1 |
| USDT | nep141:usdt.tether-token.near |

Get full list: GET /v1/tokens

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_PARAMETERS | 400 | Request validation failed |
| INVALID_API_KEY | 401 | API key is invalid or expired |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTENT_NOT_FOUND | 404 | Intent ID not found |
| INTERNAL_ERROR | 500 | Server error |
| ONECLICK_API_ERROR | 502 | OneClick API error |

---

## Rate Limits

| Plan | Requests/Hour | Swaps/Day |
|------|---------------|-----------|
| Free | 100 | 10 |
| Developer | 1,000 | 100 |
| Platform | 10,000 | 1,000 |
| Enterprise | Custom | Custom |

Rate limit headers are included in all responses:

    X-RateLimit-Limit: 1000
    X-RateLimit-Remaining: 950
    X-RateLimit-Reset: 1699459200

---

## Webhooks (Coming Soon)

Configure webhook URL in swap request:

    {
      "options": {
        "webhookUrl": "https://your-app.com/webhook"
      }
    }

Webhook payload:

    POST https://your-app.com/webhook
    X-Webhook-Signature: sha256=...
    
    {
      "event": "swap.completed",
      "eventId": "evt_123456",
      "timestamp": "2025-11-07T13:41:16.881Z",
      "data": {
        "intentId": "550e8400-...",
        "status": "completed",
        "txHash": "3H6hfJ..."
      }
    }

---

## Best Practices

### 1. Store Deposit Addresses

Always save the depositAddress returned from POST /v1/swap:

    const response = await fetch('/v1/swap', {...});
    const depositAddress = response.data.quote.depositAddress;
    // Save this to your database

### 2. Poll Status Reasonably

Don't poll too frequently:

    // Good: Poll every 5-10 seconds
    setInterval(() => checkStatus(intentId), 10000);
    
    // Bad: Poll every second
    setInterval(() => checkStatus(intentId), 1000);

### 3. Handle Errors Gracefully

    try {
      const swap = await agentfi.swap({...});
    } catch (error) {
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        // Wait and retry
      } else {
        // Log and alert
      }
    }

### 4. Verify Webhook Signatures

    const signature = request.headers['x-webhook-signature'];
    const computed = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(request.body)
      .digest('hex');
    
    if (signature !== `sha256=${computed}`) {
      throw new Error('Invalid webhook signature');
    }

---

**Last Updated:** November 7, 2025  
**Version:** 1.0.0
