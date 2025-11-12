# 1Click App Fees Calculation

**Source:** NEAR Intents Documentation
**Last Updated:** November 11, 2025

## Overview

As a distribution channel using 1Click Swap API, you can specify fee distribution during quote requests. Fees are deducted from the input token during swap execution.

## Fee Parameters

When requesting a quote, include in `appFees` array:
```json
"appFees": [
  {
    "recipient": "your-fee-wallet.near",
    "fee": 100
  }
]
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `recipient` | string | Any NEAR-supported address (named account, implicit, or EVM-like) |
| `fee` | number | Fee in basis points (bps). `100` = `1.00%` |

### Conversion
```
percentage = fee / 10_000

Examples:
- 15 bps = 0.15%
- 100 bps = 1.00%
- 10000 bps = 100.00%
```

### Constraints

- `0 ≤ fee ≤ 10_000` (max 100%)
- Fee is always charged from **input token**

## How Fees Are Applied

### EXACT_INPUT

Fee is deducted from input before swap calculation.

**Formula:**
```
net_in = amount_in × (1 - p)
amount_out = calculate_from(net_in)
fee_amount = amount_in - net_in
```

**Example:**
- Input: `amount_in = 1,000,000`, `fee = 100` (1%)
- Calculation: `net_in = 1,000,000 × 0.99 = 990,000`
- User deposits: `1,000,000`
- Swap processes: `990,000`
- Fee collected: `10,000` (in input token)

### EXACT_OUTPUT

Fee is added to required input amount.

**Formula:**
```
net_in = min_amount_in × (1 + p)
fee_amount = net_in - min_amount_in
```

**Example:**
- Input: `min_amount_in = 500,000`, `fee = 100` (1%)
- Calculation: `net_in = 500,000 × 1.01 = 505,000`
- User must deposit: `505,000`
- Swap processes: `500,000`
- Fee collected: `5,000` (in input token)

**Note:** If user deposits more than `min_amount_in`, fees are deducted from actual `amount_in`:
```
fee_amount = net_in - amount_in
```

## AgentFi Fee Structure

**Platform Fee:** 15 basis points (0.15%)

### Implementation
```json
{
  "appFees": [
    {
      "recipient": "agentfi-fees.near",
      "fee": 15
    }
  ]
}
```

### Example Calculation (EXACT_INPUT)

**Swap:** 1.0 wNEAR → USDC
```
Input: 1.0 wNEAR (1000000000000000000000000 yoctoNEAR)
Fee: 15 bps (0.15%)

Calculation:
- Fee amount = 1.0 × 0.0015 = 0.0015 wNEAR
- Net input = 1.0 - 0.0015 = 0.9985 wNEAR
- Swap processes 0.9985 wNEAR → ~2.66 USDC (at $2.66/NEAR)

Result:
- User deposits: 1.0 wNEAR
- User receives: ~2.66 USDC
- AgentFi receives: 0.0015 wNEAR ($0.004 USD)
```

## Best Practices

1. **Always include app fees** in quote requests
2. **Display fees clearly** to users before swap
3. **Use named account** for fee recipient (easier tracking)
4. **Keep fees reasonable** (15-100 bps typical for platforms)
5. **Test fee calculations** with small amounts first

## Integration with AgentFi API

Update SwapService.executeSwap():
```typescript
const quoteRequest = {
  // ... other parameters
  appFees: [
    {
      recipient: env.AGENTFI_FEE_WALLET,
      fee: 15 // 0.15% platform fee
    }
  ]
};
```

## TODO

- [ ] Add AGENTFI_FEE_WALLET to .env
- [ ] Update SwapService to include appFees
- [ ] Update API response to show fee breakdown
- [ ] Add fee tracking to database
- [ ] Create fee collection monitoring
