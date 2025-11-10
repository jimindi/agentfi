# Working Version Restored - November 10, 2025

## What Was Broken
The swap service was calling OneClick API and getting the depositAddress, but then ignoring it and returning manual depositInstructions instead.

## What We Fixed
File: `api/src/services/swap.service.ts`

Changed line ~100 from:
```typescript
depositInstructions: { ... }
```

To:
```typescript
quote: {
  ...
  depositAddress: quote.depositAddress,  // NOW RETURNED!
  ...
}
```

Also changed line ~75:
```typescript
userWalletAddress: quote.depositAddress,  // Store depositAddress as the wallet
```

## Test Result
```bash
curl response now shows:
"depositAddress":"58d5a3bf44b833db12a36a2e7f7ec4388b0b7a2b678dc614d219b42d6586f957"
```

## Git Tag
v1.0.1-working

## Never Lose This Again
This is the ACTUAL working code from November 7 success.
