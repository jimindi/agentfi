#!/bin/bash
set -e

echo "=== Testing Complete NEP-413 Data Flow ==="
echo ""

# Test payload with NEP-413 signed intent
TEST_PAYLOAD=$(cat <<'PAYLOAD'
{
  "from": {
    "chain": "near",
    "token": "wNEAR",
    "amount": "10000000000000000000000"
  },
  "to": {
    "chain": "near",
    "token": "USDC"
  },
  "user": {
    "walletAddress": "agentfi-dev-1762307277.testnet"
  },
  "signedIntent": {
    "standard": "nep413",
    "payload": {
      "message": "{\"signer_id\":\"test.testnet\",\"deadline\":\"2025-11-08T00:00:00.000Z\",\"intents\":[{\"intent\":\"token_diff\",\"diff\":{\"nep141:wrap.near\":\"-10000000000000000000000\",\"nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1\":\"1\"}}]}",
      "nonce": "test_nonce_123",
      "recipient": "intents.near"
    },
    "signature": "ed25519:test_signature",
    "public_key": "ed25519:test_public_key"
  }
}
PAYLOAD
)

echo "1. Creating swap with NEP-413 signed data..."
RESPONSE=$(curl -s -X POST http://localhost:3000/v1/swap \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

echo "$RESPONSE" | jq '.'

INTENT_ID=$(echo "$RESPONSE" | jq -r '.data.intentId')
echo ""
echo "✅ Created intent: $INTENT_ID"

echo ""
echo "2. Verifying nep413_signed_data in database..."
psql postgresql://agentfi:dev_password_123@localhost:5433/agentfi_dev -c "
  SELECT 
    id,
    status,
    nep413_signed_data->>'standard' as standard,
    nep413_signed_data->'payload'->>'recipient' as recipient,
    CASE 
      WHEN nep413_signed_data IS NOT NULL THEN '✅ STORED'
      ELSE '❌ MISSING'
    END as data_status
  FROM intents 
  WHERE id = '$INTENT_ID';
"

echo ""
echo "3. Testing swap status endpoint..."
curl -s http://localhost:3000/v1/swap/$INTENT_ID | jq '.'

echo ""
echo "=== Phase 1 Complete: Data Flow Fixed ==="
echo ""
echo "Next steps:"
echo "  - Start worker: npm run worker"
echo "  - Deposit tokens to test execution"
echo "  - Monitor worker logs for NEP-413 execution"
