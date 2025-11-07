// Test the transformation logic
const signedData = {
  "standard": "nep413",
  "payload": {
    "message": "{\"signer_id\":\"test.testnet\",\"deadline\":\"2025-11-08T00:00:00.000Z\",\"intents\":[{\"intent\":\"token_diff\",\"diff\":{\"nep141:wrap.near\":\"-10000000000000000000000\",\"nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1\":\"1\"}}]}",
    "nonce": "test_nonce_123",
    "recipient": "intents.near"
  },
  "signature": "ed25519:test_signature",
  "public_key": "ed25519:test_public_key"
};

// Worker's transformation function
function transformToContractFormat(signedData) {
  const publicKey = signedData.publicKey || signedData.public_key;
  
  return {
    signed: {
      message: signedData.payload.message,
      nonce: signedData.payload.nonce,
      recipient: signedData.payload.recipient,
      callbackUrl: signedData.payload.callbackUrl || null
    },
    signature: {
      public_key: publicKey,
      signature: signedData.signature
    }
  };
}

console.log("Input format:");
console.log(JSON.stringify(signedData, null, 2));
console.log("\nTransformed to contract format:");
console.log(JSON.stringify(transformToContractFormat(signedData), null, 2));
