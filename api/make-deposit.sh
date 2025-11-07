#!/bin/bash

DEPOSIT_ADDRESS="330776c6c83c424633d8add9824804a8b01feb45f477b2b0e8358fd55196ab23"
AMOUNT="10000000000000000000000"  # 0.01 wNEAR
USER_ACCOUNT="0bdbb89f14ca51f13cc962c65b118b5ff93b1e1ed21aa80274fe558e5bfea0f1"

echo "=== Depositing to OneClick Swap ==="
echo ""
echo "Deposit Address: $DEPOSIT_ADDRESS"
echo "Amount: 0.01 wNEAR"
echo "User: $USER_ACCOUNT"
echo ""
echo "This will deposit wNEAR to intents.near with the deposit address as receiver_id"
echo ""

near call wrap.near ft_transfer_call \
  "{\"receiver_id\":\"intents.near\",\"amount\":\"$AMOUNT\",\"msg\":\"{\\\"receiver_id\\\":\\\"$DEPOSIT_ADDRESS\\\"}\"}" \
  --accountId $USER_ACCOUNT \
  --networkId mainnet \
  --depositYocto 1 \
  --gas 300000000000000

echo ""
echo "After deposit, watch the worker logs for status updates!"
