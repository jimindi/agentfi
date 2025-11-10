# External API Verification Results

## 1. OneClick API ✅ VERIFIED
- **URL:** https://1click.chaindefuser.com
- **Status:** WORKS WITHOUT JWT
- **Purpose:** Get swap quotes and deposit addresses
- **Decision:** ✅ REQUIRED - provides deposit addresses for swaps

**Test Result:**
```json
{
  "quote": {
    "depositAddress": "aa4573279cbdb57026cd7c9981d7e3e29e7155ff03f6be312ecba2f4d4f7e170",
    "amountOut": "28583",
    "timeEstimate": 10
  }
}
```

**Required Parameters:**
- dry, swapType, slippageTolerance, depositType, originAsset, destinationAsset
- amount, refundTo, refundType, recipient, recipientType, deadline

---

## 2. NEAR RPC ✅ VERIFIED
- **URL:** https://rpc.mainnet.near.org
- **Status:** WORKS
- **Purpose:** Query blockchain state (account info, contract calls)
- **Decision:** ✅ REQUIRED - for blockchain queries

**Test Result:**
Successfully queried intents.near account.

---

## 3. Token Info API ✅ VERIFIED
- **URL:** https://api-mng-console.chaindefuser.com/api/tokens
- **Status:** WORKS
- **Purpose:** List supported tokens with prices
- **Decision:** ✅ USEFUL - provides token metadata and prices

**Test Result:**
Returns array of tokens with defuse_asset_id, decimals, symbol, price.

---

## Summary

All three endpoints work and are useful:
1. **OneClick API** - Critical for getting deposit addresses
2. **NEAR RPC** - Critical for blockchain queries
3. **Token API** - Useful for token info (could cache locally)

**Next Step:** Design component architecture using these endpoints.
