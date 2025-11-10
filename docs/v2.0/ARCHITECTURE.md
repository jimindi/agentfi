# AgentFi v2.0 Architecture

## System Overview

Client Request → API Controller → Swap Service → External Services (OneClick, NEAR RPC, Database)

## Core Components

### 1. API Controller
- Responsibility: HTTP request/response handling
- Dependencies: None
- Testable: Yes - mock HTTP requests

### 2. Swap Service
- Responsibility: Orchestrate swap execution
- Dependencies: OneClick Service, Database Service
- Testable: Yes - mock dependencies

### 3. OneClick Service
- Responsibility: Get quotes from OneClick API
- Dependencies: None (external API)
- Testable: Yes - mock HTTP responses

### 4. NEAR RPC Service
- Responsibility: Query blockchain state
- Dependencies: None (external API)
- Testable: Yes - mock RPC responses

### 5. Database Service
- Responsibility: Store swap records
- Dependencies: PostgreSQL
- Testable: Yes - use test database

## Component Interfaces

SwapService.executeSwap()
- Input: from (chain, token, amount), to (chain, token), user (walletAddress)
- Output: intentId, depositAddress, estimatedOutput

OneClickService.getQuote()
- Input: originAsset, destinationAsset, amount, recipient
- Output: depositAddress, amountOut, timeEstimate

## Next Steps

1. Create component structure
2. Write tests for each component
3. Implement components one by one
