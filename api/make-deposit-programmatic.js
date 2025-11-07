require('dotenv').config();
const { connect, keyStores, KeyPair, transactions, utils } = require('near-api-js');

async function makeDeposit() {
  const depositAddress = 'c9658b53ab3f8c475e1286a4bdc9003dbfebe1afecf59eceae8cfa11a036e5c5';
  const amount = '10000000000000000000000'; // 0.01 wNEAR
  const accountId = '0bdbb89f14ca51f13cc962c65b118b5ff93b1e1ed21aa80274fe558e5bfea0f1';
  
  console.log('=== Making Deposit to OneClick ===\n');
  console.log('From:', accountId);
  console.log('Amount:', '0.01 wNEAR');
  console.log('Deposit Address:', depositAddress);
  console.log('');
  
  // Setup
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(process.env.NEAR_PRIVATE_KEY);
  await keyStore.setKey('mainnet', accountId, keyPair);
  
  const near = await connect({
    networkId: 'mainnet',
    keyStore,
    nodeUrl: 'https://rpc.mainnet.near.org'
  });
  
  const account = await near.account(accountId);
  
  console.log('Calling wrap.near.ft_transfer_call...\n');
  
  // Make the deposit
  const result = await account.functionCall({
    contractId: 'wrap.near',
    methodName: 'ft_transfer_call',
    args: {
      receiver_id: 'intents.near',
      amount: amount,
      msg: JSON.stringify({ receiver_id: depositAddress })
    },
    gas: '300000000000000',
    attachedDeposit: '1' // 1 yoctoNEAR
  });
  
  console.log('✅ Deposit successful!');
  console.log('Transaction hash:', result.transaction.hash);
  console.log('Explorer:', `https://nearblocks.io/txns/${result.transaction.hash}`);
  console.log('');
  console.log('Now watch the worker logs - swap should complete in ~10 seconds!');
}

makeDeposit().catch(console.error);
