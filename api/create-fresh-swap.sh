#!/bin/bash

echo "=== Creating Fresh Swap with Current Time ==="

curl -X POST http://localhost:3000/v1/swap \
  -H "Content-Type: application/json" \
  -d '{
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
      "walletAddress": "0bdbb89f14ca51f13cc962c65b118b5ff93b1e1ed21aa80274fe558e5bfea0f1"
    },
    "signedIntent": {
      "standard": "nep413",
      "payload": {
        "message": "{\"signer_id\":\"0bdbb89f14ca51f13cc962c65b118b5ff93b1e1ed21aa80274fe558e5bfea0f1\",\"deadline\":\"2025-11-08T00:00:00.000Z\",\"intents\":[{\"intent\":\"token_diff\",\"diff\":{\"nep141:wrap.near\":\"-10000000000000000000000\",\"nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1\":\"1\"}}]}",
        "nonce": "fresh_nonce_'$(date +%s)'",
        "recipient": "intents.near"
      },
      "signature": "ed25519:test_sig_'$(date +%s)'",
      "public_key": "ed25519:oHopR7ectb1nPGGUeDovY9DkF7524tWFYoyzqwZ6BVi"
    }
  }' | jq '.'

echo ""
echo "New swap created! The deposit address will be different."
echo "But the user ALREADY has 0.02 wNEAR deposited in intents.near!"
echo "The OneClick API should detect this automatically."
