# Development Progress

## Current Phase: Production Features

### Completed ✅
- Created v2.0 branch
- Cleaned git history of secrets
- Set up documentation structure
- Verified all external endpoints (OneClick, NEAR RPC, Token API)
- Designed component architecture
- Implemented OneClickService with tests
- Implemented SwapService with tests
- Implemented SwapController and routes with tests
- Integration testing complete - All 8 tests passing
- V2 routes integrated into main server
- V2 API endpoints tested and working
- Implemented IntentMonitor worker
- Worker polling OneClick API every 20 seconds
- Discovered simplified OneClick flow (no NEP-413 signing needed)
- Resolved NEAR account key mismatch issue
- Created new implicit account with correct keys
- Successfully wrapped NEAR to wNEAR
- Created atomic swap test script
- **Fixed OneClick API endpoint (v0/status not v0/execution)**
- **Successfully completed 2 mainnet swaps**
- **Worker correctly detecting swap completion**
- **Verified USDC delivery to intents.near**

### Current Task 🔄
Add webhook support and implement withdrawal flow

### No Active Blockers ✅
All critical issues resolved!

### Next Steps 📋
1. ✅ Implement OneClickService with tests
2. ✅ Implement SwapService with tests
3. ✅ Create API controller
4. ✅ Integration testing
5. ✅ Integrate v2 routes into main app.ts
6. ✅ Implement monitoring worker
7. ✅ Resolve NEAR key issues
8. ✅ Test end-to-end with real mainnet deposit
9. ✅ Debug worker status detection
10. Implement webhook notifications
11. Add USDC withdrawal from intents.near
12. Implement API key authentication
13. Add rate limiting
14. Production deployment

## Session History

### November 10, 2025 - Session 1
- Started v2.0 branch
- Removed secrets from git history
- Created documentation framework
- Verified external endpoints work
- Designed component architecture

### November 11, 2025 - Session 2
- Implemented OneClickService (2 tests)
- Implemented SwapService (2 tests)
- Implemented SwapController (3 tests)
- Created integration test (1 test)
- All 8 tests passing

### November 11, 2025 - Session 3
- Created v2 router index (api/src/v2/routes/index.ts)
- Integrated v2 routes into app.ts
- Fixed route mounting (use / instead of /swap in swap.routes.ts)
- Successfully tested POST /v2/swap and GET /v2/swap/:id
- Created STATE.md as primary project reference
- Updated PROJECT-INSTRUCTIONS.md
- Decision: Mount v2 at /v2 prefix, mark v1 as deprecated

### November 11, 2025 - Session 4
- Implemented IntentMonitor worker (polls every 20s)
- Added getExecutionStatus to OneClickService
- Created worker entry point (api/src/v2/workers/index.ts)
- Added npm run worker script
- Discovery: OneClick API uses simple deposit flow, no NEP-413 signing needed
- Decision: Simplified architecture - just token transfers to deposit addresses
- Updated STATE.md with corrected workflow
- Ready for mainnet end-to-end test

### November 11, 2025 - Session 5
- Encountered NEAR key mismatch issue
- Account 0bdbb89f... had wrong key in .env
- Created new implicit account: 6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709
- Funded account with 0.3756 NEAR from Coinbase
- Wrapped 0.09875 NEAR to wNEAR
- Created atomic-swap-test.sh for immediate deposits
- Successfully executed deposit transaction (GBqafimY7bFY3C8R7SPKX2QaBgYmmtQQYWfTKxo7E4tU)
- Worker monitoring but status not progressing from PENDING_DEPOSIT
- Discovered wrong endpoint being used

### November 11, 2025 - Session 6
- Fixed critical bug: endpoint was /v0/execution not /v0/status
- Updated status enum to include all documented values
- Fixed remaining syntax errors in OneClickService and IntentMonitor
- Worker now successfully detecting swap completion
- Verified 2 mainnet swaps completed successfully
- Confirmed USDC delivery: 53,174 microUSDC in intents.near
- End-to-end flow fully working!

## Key Learnings
- OneClick API uses `/v0/status?depositAddress=X` not `/v0/execution/X`
- Status values: PENDING_DEPOSIT, PROCESSING, SUCCESS, INCOMPLETE_DEPOSIT, REFUNDED, FAILED
- With `recipientType: INTENTS`, funds go to intents.near contract
- Worker polling every 20 seconds is sufficient
- Implicit NEAR accounts work perfectly for service accounts

## Fee Structure Requirements

### Platform Fees (Not Yet Implemented)
- **15 basis points (0.15%)** on all swap transactions
- Fee should be added to swap amount and charged to user
- Fee goes to service wallet (AgentFi revenue)

### Minimum Transaction Amount
- **$5 USD minimum** per swap
- Reject swaps below minimum with clear error message
- Calculate based on real-time token prices

### Implementation Notes
- Fee calculation must happen before quote request
- Need to add USD price lookup for input token
- Fee wallet address: TBD (create dedicated account)
- Add fee validation in SwapService.executeSwap()
- Update API response to show fees clearly

### Example Fee Calculation
```
Input: 0.01 wNEAR ($0.0266 USD)
Status: ❌ Below $5 minimum, rejected

Input: 2.0 wNEAR ($5.32 USD)
Platform fee: 2.0 × 0.0015 = 0.003 wNEAR ($0.008 USD)
Total required: 2.003 wNEAR
Output: ~5.31 USDC (after fees)
Status: ✅ Approved
```

### TODO
- [ ] Add fee calculation to SwapService
- [ ] Create fee collection wallet
- [ ] Add minimum transaction validation
- [ ] Update quote response to show fees
- [ ] Add fee tracking to database
- [ ] Update API documentation with fee structure

### November 12, 2025 - Session 7
- Fixed critical recipient issue: Changed recipientType from INTENTS to DESTINATION_CHAIN
- Added platform fee: 15 basis points via appFees parameter
- Updated environment: Added AGENTFI_FEE_WALLET to config
- Created documentation: ONECLICK-API.md (comprehensive API reference)
- Created documentation: ONECLICK-FEES.md (fee calculation guide)
- Verified fix: Quote requests now show correct recipientType and appFees
- Next: Test complete swap with deposit to verify USDC goes to user wallet

## Key Decisions

### Recipient Type Fix
**Problem:** Funds were stuck in intents.near contract requiring manual withdrawal
**Solution:** Use `recipientType: "DESTINATION_CHAIN"` for direct delivery to user wallet
**Impact:** Eliminates withdrawal step, better UX, true non-custodial flow

### Platform Fee Implementation  
**Decision:** 15 basis points (0.15%) charged via OneClick appFees
**Method:** Fee deducted from input token before swap
**Recipient:** Service wallet (same as NEAR account for now)
**Future:** Dedicated fee collection wallet


### Session 7 Summary (November 12, 2025)

**Major Achievement:** ✅ Fixed recipient issue + verified end-to-end working

**Changes Made:**
1. Fixed OneClickService.ts:
   - Changed `recipientType: "INTENTS"` → `"DESTINATION_CHAIN"`
   - Changed `refundType: "INTENTS"` → `"ORIGIN_CHAIN"`
   - Added platform fee: 15 bps via `appFees` parameter

2. Fixed SwapController.ts:
   - Removed hardcoded `pending_deposit` response
   - Now properly calls `swapService.getSwapStatus()`

3. Added documentation:
   - ONECLICK-API.md (comprehensive API reference)
   - ONECLICK-FEES.md (fee calculation guide)

4. Environment updates:
   - Added AGENTFI_FEE_WALLET to config
   - Set fee wallet to service account

**Test Results:**
- Created swap: Intent ID `173bd2dc-90f3-4d3c-afa8-2ac38d6d18e8`
- Input: 0.01 wNEAR ($0.0234 USD)
- Output: 0.022979 USDC delivered to wallet
- Platform fee: ~15 bps deducted
- Status: ✅ SUCCESS in ~6 minutes
- Tx: F3xCMTfZwHK5pAyF4UDFmFFJshtnpkTXt6ZLWKBdkd4Y

**Key Verification:**
- USDC withdrawn from intents.near and delivered to user wallet ✅
- No manual withdrawal needed ✅
- Platform fee correctly applied ✅

**Commits:**
- 60a47fd: Fix recipient type + add platform fees
- 51c6ad8: Fix getSwapStatus controller

**Remaining Work:**
1. Withdraw stuck 0.053174 USDC from previous tests
2. Add minimum transaction validation ($5 USD)
3. Implement webhooks
4. Add API key authentication
