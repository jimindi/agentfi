# Project State - Quick Reference
**Last Updated:** November 11, 2025  
**Branch:** agentfi-v2.0  
**Status:** Worker implemented, ready for end-to-end test

## Quick Status
✅ V2 components complete (8 tests passing)
✅ V2 routes integrated into server
✅ Intent monitoring worker implemented
⚠️ Ready for mainnet deposit test

## 1Click API Flow (No Signing Required)

The workflow is simpler than initially thought:

1. Client calls AgentFi API POST /v2/swap
2. AgentFi requests quote from 1Click API → receives unique depositAddress
3. Client transfers tokens to depositAddress using standard NEAR transfer
4. 1Click detects deposit automatically and executes swap
5. Worker polls 1Click API for status updates
6. Tokens delivered to recipient address

NO NEP-413 signing needed - just standard token transfers.

## Working Endpoints

Create swap:
    curl -X POST http://localhost:3000/v2/swap \
      -H "Content-Type: application/json" \
      -d '{
        "from": {"chain": "near", "token": "wNEAR", "amount": "10000000000000000000000"},
        "to": {"chain": "near", "token": "USDC"},
        "user": {"walletAddress": "account.near"}
      }'

Response includes depositAddress where user sends tokens.

Check status:
    curl http://localhost:3000/v2/swap/{intentId}

## Project Structure

    /root/agentfi-sdk/
    ├── api/src/v2/
    │   ├── services/
    │   │   ├── OneClickService.ts    ✅ getQuote + getExecutionStatus
    │   │   └── SwapService.ts        ✅ Complete
    │   ├── controllers/
    │   │   └── SwapController.ts     ✅ Complete
    │   ├── routes/
    │   │   ├── index.ts              ✅ Router
    │   │   └── swap.routes.ts        ✅ Complete
    │   ├── workers/
    │   │   ├── IntentMonitor.ts      ✅ NEW - Polls every 20s
    │   │   └── index.ts              ✅ NEW - Worker entry
    │   ├── types/
    │   │   └── index.ts              ✅ Complete
    │   └── tests/                    ✅ 8 passing

## Next Task

Test end-to-end with mainnet deposit:

1. Create swap via API (get depositAddress)
2. Transfer wNEAR to depositAddress using NEAR CLI on mainnet
3. Monitor worker logs for status changes
4. Verify completion in database

## Running Services

API server:
    cd /root/agentfi-sdk/api && npm run dev

Worker (separate terminal):
    cd /root/agentfi-sdk/api && npm run worker

## Environment Variables

Required:
    DATABASE_URL=postgresql://...
    ONECLICK_JWT_TOKEN=your-token
    NEAR_NETWORK=mainnet
    NEAR_ACCOUNT_ID=agentfi.near  (for mainnet)
    NEAR_PRIVATE_KEY=ed25519:...

## Decision Log

### November 11, 2025 - Session 4
- **Discovery:** No NEP-413 signing needed for 1Click API
- **Reason:** 1Click uses simple deposit addresses, not intents protocol directly
- **Impact:** Simplified client integration - just standard token transfers
- **Implementation:** Created monitoring worker to poll 1Click status endpoint

### November 11, 2025 - Session 3
- Mount v2 routes at /v2 prefix
- Mark v1 as deprecated

### November 11, 2025 - Session 2
- Use OneClick API directly
- Simpler, more reliable

### November 10, 2025 - Session 1
- Create v2 directory for new implementation
- Keep v1 working during transition
