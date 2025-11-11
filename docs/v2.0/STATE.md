# Project State - Quick Reference
**Last Updated:** November 11, 2025  
**Branch:** agentfi-v2.0  
**Status:** ✅ End-to-end flow working on mainnet!

## Quick Status
✅ V2 components complete (8 tests passing)
✅ V2 routes integrated into server
✅ Intent monitoring worker working correctly
✅ **END-TO-END MAINNET SWAPS SUCCESSFUL**
✅ Two swaps completed: 0.01 wNEAR → 0.026534 USDC each
✅ Total USDC received: 0.053174 (53,174 microUSDC)

## Successful Mainnet Tests

**Swap 1:**
- Intent ID: 5994bfc1-0eaf-4ccb-b97a-50317102930e
- Input: 0.01 wNEAR
- Output: 0.026640 USDC
- Tx: CuBvT8GR8k2cdU7rnQ8dDKZQzPoH9NBtz2BSXbg22dPb
- Status: ✅ SUCCESS

**Swap 2:**
- Intent ID: ead57b08-0f8f-42fe-b212-22e0477779bd  
- Input: 0.01 wNEAR
- Output: 0.026534 USDC
- Tx: 2sCZuGPLBxdCPvMHKdZBSTc3f3ghTu5mLhrT4iTnzuac
- Status: ✅ SUCCESS

**USDC Location:**
- Held in intents.near contract
- Balance: 53,174 microUSDC (0.053174 USDC)
- Can be withdrawn using NEAR Intents withdrawal flow

## Service Account
**Account ID:** 6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709
**NEAR Balance:** ~0.27 NEAR
**wNEAR Balance:** ~0.06 wNEAR (after two swaps)
**USDC in Intents:** 0.053174 USDC

## Working Flow

1. Client calls `POST /v2/swap` with swap parameters
2. API requests quote from OneClick → receives depositAddress
3. Client transfers tokens to depositAddress
4. OneClick detects deposit and coordinates with solvers
5. Worker polls `/v0/status` every 20 seconds
6. When status = SUCCESS, worker updates database
7. USDC delivered to recipient in intents.near

**Key Discovery:** 
- Endpoint is `/v0/status?depositAddress=X` not `/v0/execution/X`
- Status values: PENDING_DEPOSIT, PROCESSING, SUCCESS, INCOMPLETE_DEPOSIT, REFUNDED, FAILED
- Recipients with `recipientType: INTENTS` receive funds in intents.near contract

## Project Structure
    /root/agentfi-sdk/
    ├── api/src/v2/
    │   ├── services/
    │   │   ├── OneClickService.ts    ✅ Working (correct endpoint)
    │   │   └── SwapService.ts        ✅ Working
    │   ├── controllers/
    │   │   └── SwapController.ts     ✅ Working
    │   ├── routes/
    │   │   ├── index.ts              ✅ Working
    │   │   └── swap.routes.ts        ✅ Working
    │   ├── workers/
    │   │   ├── IntentMonitor.ts      ✅ Working (detecting SUCCESS)
    │   │   └── index.ts              ✅ Working
    │   └── tests/                    ✅ 8 passing

## Next Steps

### Immediate (High Priority)
1. Add webhook support for swap completion notifications
2. Implement USDC withdrawal from intents.near
3. Add proper error handling and retry logic
4. Implement API key authentication

### Near Term
5. Add rate limiting
6. Implement comprehensive logging
7. Add monitoring/alerts
8. Production deployment setup

### Future
9. Multi-token support testing
10. Cross-chain swaps (ETH, SOL, BTC)
11. SDK libraries (TypeScript, Python)
12. Documentation site

## Running Services

API server:
    cd /root/agentfi-sdk/api && npm run dev

Worker (separate terminal):
    cd /root/agentfi-sdk/api && npm run worker

Test swap:
    curl -X POST http://localhost:3000/v2/swap \
      -H "Content-Type: application/json" \
      -d '{
        "from": {"chain": "near", "token": "wNEAR", "amount": "10000000000000000000000"},
        "to": {"chain": "near", "token": "USDC"},
        "user": {"walletAddress": "6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709"}
      }'

Check status:
    curl http://localhost:3000/v2/swap/{intentId}
