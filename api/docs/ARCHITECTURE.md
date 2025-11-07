# AgentFi SDK - System Architecture

**Version:** 1.0.0  
**Last Updated:** November 7, 2025

---

## Overview

AgentFi is a non-custodial B2B API platform that enables AI trading bots to execute cross-chain token swaps using NEAR Intents protocol via OneClick API.

---

## System Architecture

    ┌─────────────────┐
    │  CLIENT APP     │ Signs NEP-413 Intent
    │  (Trading Bot)  │
    └────────┬────────┘
             │ POST /v1/swap
             ▼
    ┌─────────────────┐
    │  AGENTFI API    │ Creates swap, stores intent
    │  (Express.js)   │ Returns deposit address
    └────────┬────────┘
             │
             ├─► PostgreSQL (Store intent + NEP-413 data)
             │
             ├─► OneClick API (Get quote + deposit address)
             │
             └─► Background Worker (Poll status every 20s)
                        │
                        ▼
             ┌──────────────────┐
             │  ONECLICK API    │ Coordinates solver network
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ NEAR INTENTS     │ Atomic cross-chain execution
             │ (intents.near)   │
             └──────────────────┘

---

## Components

### 1. AgentFi API (Express.js + TypeScript)

**Responsibilities:**
- Accept signed NEP-413 intents from clients
- Validate intent signatures
- Get swap quotes from OneClick API
- Store intents in PostgreSQL
- Return deposit addresses to clients
- Provide status endpoints

**Tech Stack:**
- Runtime: Node.js 20 LTS
- Framework: Express.js
- Language: TypeScript
- Database ORM: Prisma
- Validation: Zod
- Logging: Pino

**Key Files:**

    src/
    ├── routes/
    │   ├── swap.routes.ts          # Swap endpoints
    │   ├── token.routes.ts         # Token listing
    │   └── health.routes.ts        # Health check
    ├── services/
    │   ├── swap.service.ts         # Swap orchestration
    │   ├── oneclick.service.ts     # OneClick API client
    │   └── near.service.ts         # NEAR blockchain
    ├── middleware/
    │   ├── auth.middleware.ts      # API key validation
    │   └── error.middleware.ts     # Error handling
    └── server.ts                   # Express app

### 2. Background Worker

**Responsibilities:**
- Poll OneClick API every 20 seconds
- Update intent status in database
- Send webhooks (when implemented)
- Handle errors gracefully

**Polling Strategy:**

    setInterval(async () => {
      const pending = await getPendingIntents();
      for (const intent of pending) {
        const status = await OneClickService.getExecutionStatus(intent.depositAddress);
        await updateIntentStatus(intent.id, status);
      }
    }, 20000); // 20 seconds

**Key File:** src/worker.ts

### 3. PostgreSQL Database

**Key Tables:**
- intents - Swap records with NEP-413 signed data
- users - API key management (future)
- api_keys - Authentication tokens (future)

**Critical Schema:**

    model Intent {
      id                String   @id @default(uuid())
      userId            String?
      fromChain         String
      fromToken         String
      fromAmount        String
      toChain           String
      toToken           String
      toAmount          String?
      status            String   // pending_deposit, executing, completed, failed
      depositAddress    String?
      txHash            String?
      nep413SignedData  Json?    // CRITICAL: Stores signed intent
      metadata          Json?
      createdAt         DateTime @default(now())
      updatedAt         DateTime @updatedAt
    }

### 4. OneClick API Integration

**Base URL:** https://1click.chaindefuser.com

**Authentication:** Bearer JWT token

**Key Endpoints:**
- POST /v0/quote - Get swap quote with deposit address
- GET /v0/execution/{depositAddress} - Check swap status

**Quote Request:**

    POST /v0/quote
    Authorization: Bearer {JWT_TOKEN}
    
    {
      "dry": false,
      "swapType": "EXACT_INPUT",
      "depositType": "INTENTS",
      "originAsset": "nep141:wrap.near",
      "destinationAsset": "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
      "amount": "10000000000000000000000",
      "recipient": "user-account.near",
      "recipientType": "INTENTS",
      "deadline": "2025-11-08T00:00:00.000Z"
    }

**Quote Response:**

    {
      "quote": {
        "depositAddress": "c9658b53ab3f8c475e1286a4bdc9003dbfebe1afecf59eceae8cfa11a036e5c5",
        "amountOut": "23336",
        "estimatedTime": "20-60 seconds"
      }
    }

---

## Data Flow

### Complete Swap Flow

**Step 1: Client Signs Intent (NEP-413)**

Client creates and signs intent with private key:

    const intentMessage = {
      signer_id: "user-account.near",
      deadline: "2025-11-08T00:00:00.000Z",
      intents: [{
        intent: "token_diff",
        diff: {
          "nep141:wrap.near": "-10000000000000000000000",
          "nep141:17208628...": "1"
        }
      }]
    };
    
    const signedIntent = signWithNEP413(intentMessage, privateKey);

**Step 2: Client Submits to AgentFi API**

    POST /v1/swap
    {
      "from": {...},
      "to": {...},
      "user": {"walletAddress": "user-account.near"},
      "signedIntent": {...}
    }

**Step 3: AgentFi Processes Request**

    1. Validate request
    2. Get quote from OneClick API
    3. Store intent in database (with nep413SignedData)
    4. Return deposit address to client

**Step 4: User Deposits Tokens**

    near call wrap.near ft_transfer_call \
      '{"receiver_id":"intents.near","amount":"10000000000000000000000","msg":"{\"receiver_id\":\"DEPOSIT_ADDRESS\"}"}' \
      --accountId user-account.near --depositYocto 1

**Step 5: Worker Monitors Status**

    Every 20 seconds:
    1. Query OneClick API for status
    2. Update database if status changed
    3. Send webhook if completed (future)

**Step 6: Swap Completes**

    OneClick API returns SUCCESS
    - Worker updates status to "completed"
    - Stores transaction hash
    - User receives output tokens in their wallet

---

## Status Flow

    pending_deposit → deposited → executing → completed
                                           ↘ failed

**Status Definitions:**
- pending_deposit: Intent created, waiting for deposit
- deposited: Tokens received at deposit address
- executing: Solver network processing swap
- completed: Swap successful, output delivered
- failed: Swap failed, tokens refunded

---

## Security Architecture

### Non-Custodial Design

**AgentFi NEVER:**
- Holds user funds
- Has access to private keys
- Controls user wallets
- Can move user tokens

**How it works:**
1. User signs intent with their own private key
2. User deposits to unique OneClick deposit address
3. NEAR solver network executes swap atomically
4. Output tokens go directly to user's wallet

### NEP-413 Signing

NEP-413 is NEAR's standard for off-chain message signing. It proves wallet ownership without giving access.

**Signed Intent Structure:**

    {
      "standard": "nep413",
      "payload": {
        "message": "{...intent...}",
        "nonce": "base64_random_32_bytes",
        "recipient": "intents.near"
      },
      "signature": "ed25519:...",
      "public_key": "ed25519:..."
    }

### API Authentication (Future)

    Authorization: Bearer sk_live_abc123...

**API Key Format:**
- sk_live_... (production)
- sk_test_... (testnet)

---

## Scalability Considerations

### Current Design
- Single API server
- Single worker process
- PostgreSQL for persistence
- No caching layer

### Production Scaling (Future)
- Multiple API servers behind load balancer
- Multiple worker processes (distributed queue)
- Redis for rate limiting and caching
- Database read replicas
- CDN for static assets

---

## Error Handling

### API Errors

**400 Bad Request:**

    {
      "success": false,
      "error": {
        "code": "INVALID_PARAMETERS",
        "message": "Validation failed",
        "details": [...]
      }
    }

**500 Internal Server Error:**

    {
      "success": false,
      "error": {
        "code": "INTERNAL_ERROR",
        "message": "An unexpected error occurred"
      }
    }

### Swap Failures

**Automatic Refunds:**
- If swap fails, OneClick automatically refunds to user
- No manual intervention required
- Refund uses same deposit address

**Timeout Handling:**
- Intents have 24-hour deadline
- Worker continues polling until completed or failed
- No timeout errors for users

---

## Monitoring & Observability

### Logs (Pino)

    2025-11-07T13:30:00Z INFO  Swap created intentId=abc123
    2025-11-07T13:30:05Z INFO  Deposit detected intentId=abc123
    2025-11-07T13:30:15Z INFO  Swap completed intentId=abc123

### Metrics (Future)

- Swap success rate
- Average execution time
- API response times
- Error rates by type
- Active swaps count

### Alerts (Future)

- Worker stopped polling
- High error rate
- Slow API responses
- Database connection issues

---

## Technology Decisions

### Why TypeScript?
- Type safety reduces bugs
- Better IDE support
- Industry standard for Node.js APIs

### Why Prisma ORM?
- Type-safe database queries
- Automatic migrations
- Excellent TypeScript integration

### Why PostgreSQL?
- ACID compliance
- JSON column support (for NEP-413 data)
- Battle-tested reliability

### Why Express.js?
- Simple and familiar
- Large ecosystem
- Easy to deploy

### Why NEAR Intents?
- Non-custodial by design
- Fast execution (20-60 seconds)
- Multi-chain support
- Active solver network

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Core swap functionality
- ✅ NEP-413 signing
- ✅ OneClick API integration
- ✅ PostgreSQL storage
- ✅ Background worker

### Phase 2 (Next 2 weeks)
- [ ] API key authentication
- [ ] Rate limiting
- [ ] Webhook notifications
- [ ] Error retry logic
- [ ] Monitoring dashboard

### Phase 3 (1 month)
- [ ] Multi-region deployment
- [ ] SDK libraries (TypeScript, Python)
- [ ] Advanced analytics
- [ ] White-label options

---

**Last Updated:** November 7, 2025  
**Status:** ✅ Production Ready (Core Features)
