#!/bin/bash

echo "Step 1: Creating swap and getting deposit address..."
RESPONSE=$(curl -s -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"chain": "near", "token": "wNEAR", "amount": "10000000000000000000000"},
    "to": {"chain": "near", "token": "USDC"},
    "user": {"walletAddress": "6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709"}
  }')

DEPOSIT_ADDR=$(echo $RESPONSE | jq -r '.data.depositAddress')
INTENT_ID=$(echo $RESPONSE | jq -r '.data.intentId')

echo "Intent ID: $INTENT_ID"
echo "Deposit Address: $DEPOSIT_ADDR"
echo ""
echo "Step 2: Making deposit immediately..."

near call wrap.near ft_transfer_call \
  "{\"receiver_id\":\"intents.near\",\"amount\":\"10000000000000000000000\",\"msg\":\"{\\\"receiver_id\\\":\\\"$DEPOSIT_ADDR\\\"}\"}" \
  --accountId 6c379f0bec7563a607ed663e3d5be642dd8de19c7a5dcac9acf1a9cbefb0a709 \
  --networkId mainnet \
  --depositYocto 1 \
  --gas 300000000000000

echo ""
echo "Deposit complete! Intent ID: $INTENT_ID"
echo "Monitor status with: curl http://localhost:3000/v2/swap/$INTENT_ID"
