# OneClick API Documentation

**Source:** https://docs.near-intents.org/near-intents/integration/distribution-channels/1click-api
**Last Updated:** November 11, 2025

## What is 1Click Swap API?

1Click simplifies NEAR Intents by temporarily transferring assets to a trusted swapping agent that coordinates with Market Makers to execute your intent. This REST API abstracts away the complexity of intent creation, solver coordination, and transaction execution.

### Features
- Simple REST endpoints for intent creation and management
- Automatic solver discovery and competitive pricing
- Built-in transaction handling and status tracking
- Support for cross-chain intents

## How 1Click API Works

1. **Request a quote** - Send intent request to Request Quote endpoint
   - Receive best available quote with unique deposit address

2. **Transfer tokens** - Deposit tokens to the unique address provided
   - 1Click automatically begins swapping process upon receipt

3. **Submit deposit transaction** (optional)
   - Use Submit Deposit Tx endpoint with transaction hash to speed up processing

4. **Monitor progress** (optional)
   - Query process anytime with Get Execution Status endpoint

**Result:** Swap either succeeds with tokens delivered to specified address, or fails with automatic refund to refund address.

### Important Note
Centralized exchanges (CEXes) often use intermediate or per-user deposit addresses. These may not credit deposits sent via NEAR Intents until recognized or whitelisted. Recommend sending small test amount before full-scale transfers.

## Base URL

`https://1click.chaindefuser.com/`

## Authentication

**Required:** JWT token to avoid 0.1% (10 basis points) fee

Request token: https://docs.google.com/forms/d/e/1FAIpQLSdrSrqSkKOMb_a8XhwF0f7N5xZ0Y5CYgyzxiAuoC2g4a2N68g/viewform

## SDKs

Pre-built SDKs available:
- TypeScript SDK
- Go SDK
- Rust SDK

## Swap Statuses

| Status | Description |
|--------|-------------|
| `PENDING_DEPOSIT` | Awaiting deposit to deposit address |
| `PROCESSING` | Deposit detected, being executed by Market Makers |
| `SUCCESS` | Funds delivered to specified destination |
| `INCOMPLETE_DEPOSIT` | Deposit received but below required amount |
| `REFUNDED` | Swap not completed, funds returned to refund address |
| `FAILED` | Swap failed due to error |

## API Endpoints

### GET /v0/tokens

Retrieves list of tokens currently supported by 1Click.

Each token entry includes:
- `assetId` - Asset identifier (e.g., "nep141:wrap.near")
- `decimals` - Token decimals
- `blockchain` - Chain name
- `symbol` - Token symbol
- `price` - Price in USD
- `priceUpdatedAt` - Last price update timestamp
- `contractAddress` - Token contract address

**Example Response:**
```json
[
  {
    "assetId": "nep141:wrap.near",
    "decimals": 24,
    "blockchain": "near",
    "symbol": "wNEAR",
    "price": "2.79",
    "priceUpdatedAt": "2025-03-28T12:23:00.070Z",
    "contractAddress": "wrap.near"
  }
]
```

### POST /v0/quote

Generates swap quote based on input parameters. Returns pricing details, estimated time, and unique deposit address.

**Important:** Set `dry: true` to preview without generating deposit address. Use `dry: false` only at confirmation to reduce system load.

**Warning:** `amountOutUsd` field should NOT be used in business logic. It's for display only. Always use actual token amounts for programmatic operations.

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dry` | boolean | No | If true, simulates quote without creating deposit address |
| `depositMode` | enum | No | `SIMPLE` (default) or `MEMO` (some chains require memo) |
| `swapType` | enum | Yes | `EXACT_INPUT`, `EXACT_OUTPUT`, or `FLEX_INPUT` |
| `slippageTolerance` | number | Yes | Slippage in basis points (100 = 1%) |
| `originAsset` | string | Yes | ID of origin asset |
| `depositType` | enum | Yes | `ORIGIN_CHAIN` or `INTENTS` |
| `destinationAsset` | string | Yes | ID of destination asset |
| `amount` | string | Yes | Amount in smallest unit (wei, satoshi, etc.) |
| `refundTo` | string | Yes | Address for refunds |
| `refundType` | enum | Yes | `ORIGIN_CHAIN` or `INTENTS` |
| `recipient` | string | Yes | Recipient address |
| `recipientType` | enum | Yes | `DESTINATION_CHAIN` or `INTENTS` |
| `deadline` | string | Yes | ISO timestamp for refund deadline |
| `connectedWallets` | string[] | No | Array of connected wallet addresses |
| `sessionId` | string | No | Unique client session identifier |
| `virtualChainRecipient` | string | No | EVM address for virtual chain recipient |
| `virtualChainRefundRecipient` | string | No | EVM address for virtual chain refund |
| `customRecipientMsg` | string | No | EXPERIMENTAL - Message for ft_transfer_call |
| `referral` | string | No | Referral identifier (lowercase only) |
| `quoteWaitingTimeMs` | number | No | Wait time for quote in ms (default: 3000) |
| `appFees` | object[] | No | List of recipients and their fees |

#### Swap Types

**EXACT_INPUT:**
- Requests output amount for exact input
- If deposit < amountIn: refunded by deadline
- If deposit > amountIn: excess refunded after swap

**EXACT_OUTPUT:**
- Requests input amount for exact output
- Response has `minAmountIn` and `maxAmountIn`
- If input > maxAmountIn: excess refunded after swap
- If input < minAmountIn: refunded by deadline

**FLEX_INPUT:**
- Flexible input allowing partial deposits
- Slippage applies to both amountOut and amountIn
- Any amount > minAmountIn accepted
- If deposits exceed upper bound, swap still processed

#### Recipient Type (CRITICAL)

**`DESTINATION_CHAIN`** ✅ RECOMMENDED
- Assets transferred to chain of destinationAsset
- Funds go directly to user's wallet
- No manual withdrawal needed

**`INTENTS`** ❌ AVOID FOR END USERS
- Assets transferred to account inside Intents contract
- Requires manual withdrawal
- Use only for intermediate processing

#### Response
```json
{
  "timestamp": "2019-08-24T14:15:22Z",
  "signature": "text",
  "quoteRequest": { /* echoes request */ },
  "quote": {
    "depositAddress": "0x76b4c56085ED136a8744D52bE956396624a730E8",
    "depositMemo": "1111111",
    "amountIn": "1000000",
    "amountInFormatted": "1",
    "amountInUsd": "1",
    "minAmountIn": "995000",
    "amountOut": "9950000",
    "amountOutFormatted": "9.95",
    "amountOutUsd": "9.95",
    "minAmountOut": "9900000",
    "deadline": "2025-03-04T15:00:00Z",
    "timeWhenInactive": "2025-03-04T15:00:00Z",
    "timeEstimate": 120,
    "virtualChainRecipient": "0xb4c2fbec9d610F9A3a9b843c47b1A8095ceC887C",
    "virtualChainRefundRecipient": "0xb4c2fbec9d610F9A3a9b843c47b1A8095ceC887C",
    "customRecipientMsg": "smart-contract-recipient.near"
  }
}
```

### POST /v0/deposit/submit

Optionally notifies 1Click that deposit has been sent. Can speed up swap processing.

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `txHash` | string | Yes | Transaction hash of deposit |
| `depositAddress` | string | Yes | Deposit address from quote |
| `nearSenderAccount` | string | No | Sender account (NEAR only) |
| `memo` | string | No | Memo if deposit submitted with one |

### GET /v0/status

Retrieves current swap status using deposit address from quote.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `depositAddress` | string | Yes | Deposit address from quote |
| `depositMemo` | string | No | Memo if quote included one |

#### Response
```json
{
  "quoteResponse": { /* original quote */ },
  "status": "SUCCESS",
  "updatedAt": "2025-11-11T22:06:20.201Z",
  "swapDetails": {
    "intentHashes": ["text"],
    "nearTxHashes": ["text"],
    "amountIn": "1000",
    "amountInFormatted": "0.1",
    "amountInUsd": "0.1",
    "amountOut": "9950000",
    "amountOutFormatted": "9.95",
    "amountOutUsd": "9.95",
    "slippage": 50,
    "originChainTxHashes": [
      {
        "hash": "0x123abc456def789",
        "explorerUrl": "text"
      }
    ],
    "destinationChainTxHashes": [
      {
        "hash": "0x123abc456def789",
        "explorerUrl": "text"
      }
    ],
    "refundedAmount": "1000",
    "refundedAmountFormatted": "0.1",
    "refundedAmountUsd": "0.1",
    "referral": "referral"
  }
}
```

### GET /v0/any-input/withdrawals

Retrieves withdrawals for ANY_INPUT quotes with filtering, pagination, and sorting.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `depositAddress` | string | Yes | Deposit address |
| `depositMemo` | string | No | Deposit memo if applicable |
| `timestampFrom` | string | No | Filter from timestamp (ISO string) |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Per page (max: 50, default: 50) |
| `sortOrder` | enum | No | Sort order (asc/desc) |

## Current AgentFi Implementation Issue

**Problem:** We're using `recipientType: "INTENTS"` which leaves funds in intents.near contract requiring manual withdrawal.

**Solution:** Change to `recipientType: "DESTINATION_CHAIN"` with user's wallet address as recipient for direct delivery.

## Best Practices

1. Use `dry: true` for quote preview, `dry: false` only at confirmation
2. Set reasonable `deadline` (must exceed deposit mining time)
3. Always specify `refundTo` address
4. Use `recipientType: "DESTINATION_CHAIN"` for end-user swaps
5. Poll `/v0/status` every 20-30 seconds
6. Handle all swap statuses (SUCCESS, FAILED, REFUNDED)
7. Test with small amounts first on CEX addresses

## Error Responses

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - JWT token invalid |
| 404 | Deposit address not found |

