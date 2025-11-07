// What we're sending
const ourFormat = {
  intents: [
    {
      signed: {
        message: "...",
        nonce: "...",
        recipient: "intents.near",
        callbackUrl: null
      },
      signature: {
        public_key: "ed25519:...",
        signature: "ed25519:..."
      }
    }
  ]
};

// What contract might expect (based on NEP-413 spec)
const expectedFormat = [
  {
    signed: {
      message: "...",
      nonce: "...",
      recipient: "intents.near",
      callbackUrl: null
    },
    signature: {
      public_key: "ed25519:...",
      signature: "ed25519:..."
    }
  }
];

console.log("Our format:");
console.log(JSON.stringify(ourFormat, null, 2));
console.log("\nExpected format (array only):");
console.log(JSON.stringify(expectedFormat, null, 2));
