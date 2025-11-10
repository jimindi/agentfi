# External API Verification

## Purpose
Verify which external APIs we actually need and document their exact usage.

## Endpoints to Verify

### 1. OneClick API
- **URL:** https://1click.chaindefuser.com
- **Claimed Purpose:** Swap quotes and execution coordination
- **Status:** 🔲 NOT VERIFIED
- **Question:** Do we need this or can we use NEAR directly?

### 2. NEAR RPC
- **URL:** https://rpc.mainnet.near.org
- **Purpose:** Direct blockchain queries
- **Status:** 🔲 NOT VERIFIED
- **Question:** Can we execute swaps directly via RPC?

### 3. Token Info API
- **URL:** https://api-mng-console.chaindefuser.com/api/tokens
- **Purpose:** List of supported tokens
- **Status:** 🔲 NOT VERIFIED
- **Question:** Can we maintain our own token list?

## Verification Plan

For each endpoint:
1. Test without authentication
2. Document actual response
3. Determine if required
4. Document alternatives
5. Make decision: use/skip/replace
