# Project State - Quick Reference
**Last Updated:** November 11, 2025  
**Branch:** agentfi-v2.0  
**Status:** Swap created successfully, worker monitoring issue

## Quick Status
✅ V2 components complete (8 tests passing)
✅ V2 routes integrated into server
✅ Intent monitoring worker implemented
✅ New NEAR account created with correct keys
✅ Deposit transaction successful
❌ Worker not detecting swap execution (troubleshooting needed)

## New Service Account
**Account ID:** 6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709
**Balance:** ~0.27 NEAR
**wNEAR Balance:** ~0.08 wNEAR (need to wrap more for testing)
**Credentials:** ~/.near-credentials/mainnet/[account-id].json

## Recent Test Results
**Latest Swap:**
- Intent ID: ead57b08-0f8f-42fe-b212-22e0477779bd
- Deposit Address: 741bffdf8329d9564f0378e12698aa97a567c750452f92dcfe90f4a8c990e435
- Transaction: GBqafimY7bFY3C8R7SPKX2QaBgYmmtQQYWfTKxo7E4tU
- Status: Deposit successful, worker shows PENDING_DEPOSIT

**Issue:** Worker polls OneClick API but status remains PENDING_DEPOSIT despite successful deposit transaction.

## Working Endpoints
Create swap (works):
    curl -X POST http://localhost:3000/v2/swap \
      -H "Content-Type: application/json" \
      -d '{
        "from": {"chain": "near", "token": "wNEAR", "amount": "10000000000000000000000"},
        "to": {"chain": "near", "token": "USDC"},
        "user": {"walletAddress": "6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709"}
      }'

Check status:
    curl http://localhost:3000/v2/swap/{intentId}

Atomic swap script (immediate deposit):
    ./atomic-swap-test.sh

## Project Structure
    /root/agentfi-sdk/
    ├── api/src/v2/
    │   ├── services/
    │   │   ├── OneClickService.ts    ✅ Complete
    │   │   └── SwapService.ts        ✅ Complete
    │   ├── controllers/
    │   │   └── SwapController.ts     ✅ Complete
    │   ├── routes/
    │   │   ├── index.ts              ✅ Complete
    │   │   └── swap.routes.ts        ✅ Complete
    │   ├── workers/
    │   │   ├── IntentMonitor.ts      ⚠️ Runs but not detecting execution
    │   │   └── index.ts              ✅ Complete
    │   └── tests/                    ✅ 8 passing
    ├── atomic-swap-test.sh           ✅ NEW - Atomic swap tester
    └── ~/.near-credentials/mainnet/  ✅ Valid credentials

## Next Task
1. Debug why worker doesn't detect swap execution
2. Check OneClick API response format
3. Verify depositAddress matches transaction
4. Wrap more NEAR for additional tests
5. Check if USDC arrived in wallet

## Key Learnings
- Implicit NEAR accounts (64-char hash) work correctly
- Must create credentials file in ~/.near-credentials/
- Deposit must be made immediately after getting quote
- Worker successfully polls but may need response format fix

## Environment Configuration
All credentials in:
- .env file (account ID, OneClick JWT)
- ~/.near-credentials/mainnet/[account-id].json (private keys)

## Running Services
API server:
    cd /root/agentfi-sdk/api && npm run dev

Worker (separate terminal):
    cd /root/agentfi-sdk/api && npm run worker
