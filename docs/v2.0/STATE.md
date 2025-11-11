# Project State - Quick Reference

**Last Updated:** November 11, 2025  
**Branch:** agentfi-v2.0  
**Status:** V2 API integrated and working ✅

## Quick Status

✅ V2 components complete (8 tests passing)
✅ V2 routes integrated into server
✅ Endpoints tested and working:
   - POST /v2/swap - Creates swap, returns deposit address
   - GET /v2/swap/:id - Returns swap status

## Working Endpoints

Create swap:

    curl -X POST http://localhost:3000/v2/swap \
      -H "Content-Type: application/json" \
      -d '{
        "from": {"chain": "near", "token": "wNEAR", "amount": "10000000000000000000000"},
        "to": {"chain": "near", "token": "USDC"},
        "user": {"walletAddress": "test.near"}
      }'

Response:

    {"success":true,"data":{"intentId":"...","status":"pending_deposit","depositAddress":"...","estimatedOutput":"..."}}

Check status:

    curl http://localhost:3000/v2/swap/{intentId}

Response:

    {"success":true,"data":{"intentId":"...","status":"pending_deposit"}}

## Project Structure

    /root/agentfi-sdk/
    ├── api/
    │   ├── src/
    │   │   ├── app.ts                    ✅ V2 routes mounted
    │   │   ├── server.ts                 
    │   │   ├── v2/
    │   │   │   ├── services/
    │   │   │   │   ├── OneClickService.ts    ✅ Complete
    │   │   │   │   └── SwapService.ts        ✅ Complete
    │   │   │   ├── controllers/
    │   │   │   │   └── SwapController.ts     ✅ Complete
    │   │   │   ├── routes/
    │   │   │   │   ├── index.ts              ✅ NEW - Router index
    │   │   │   │   └── swap.routes.ts        ✅ Complete
    │   │   │   ├── types/
    │   │   │   │   └── index.ts              ✅ Complete
    │   │   │   └── tests/
    │   │   │       └── (8 tests passing)     ✅ Complete
    │   │   └── routes/
    │   │       ├── swap.routes.ts        ⚠️  V1 (deprecated)
    │   │       ├── tokens.routes.ts
    │   │       └── auth.routes.ts
    └── docs/v2.0/                        ✅ Updated

## Next Task

**Test end-to-end flow with real deposit**

Steps:
1. Create swap via API
2. Make actual NEAR deposit to deposit address
3. Monitor status updates
4. Verify completion

## Environment Variables

Required variables:

    DATABASE_URL=postgresql://...
    ONECLICK_JWT_TOKEN=your-token
    NEAR_NETWORK=mainnet
    NEAR_ACCOUNT_ID=your-account.near
    NEAR_PRIVATE_KEY=ed25519:...

## Test Commands

Run all tests:

    cd /root/agentfi-sdk/api && npm test src/v2/tests

Start server:

    cd /root/agentfi-sdk/api && npm run dev

## Known Issues

None currently - all tests passing, API working.

## Decision Log

### November 11, 2025 - Session 3
- **Decision:** Mount v2 routes at /v2 prefix
- **Reason:** Clean separation from v1, easy to deprecate v1 later
- **Impact:** Users will access POST /v2/swap instead of /v1/swap

### November 11, 2025 - Session 2
- **Decision:** Use OneClick API directly instead of hybrid approach
- **Reason:** Simpler, more reliable, official distribution channel
- **Impact:** V2 routes will replace V1 routes eventually

### November 10, 2025 - Session 1
- **Decision:** Create separate v2 directory for new implementation
- **Reason:** Keep old code working while building new approach
- **Impact:** Need to migrate or deprecate v1 routes later
