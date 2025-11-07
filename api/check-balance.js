require('dotenv').config();
const { connect, keyStores, KeyPair } = require('near-api-js');

async function checkBalance() {
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(process.env.NEAR_PRIVATE_KEY);
  
  await keyStore.setKey(process.env.NEAR_NETWORK, process.env.NEAR_ACCOUNT_ID, keyPair);
  
  const near = await connect({
    networkId: process.env.NEAR_NETWORK,
    keyStore,
    nodeUrl: process.env.NEAR_NETWORK === 'mainnet' 
      ? 'https://rpc.mainnet.near.org'
      : 'https://rpc.testnet.near.org'
  });
  
  const account = await near.account(process.env.NEAR_ACCOUNT_ID);
  
  console.log('Network:', process.env.NEAR_NETWORK);
  console.log('Account:', process.env.NEAR_ACCOUNT_ID);
  console.log('');
  
  // Check balance in intents.near
  try {
    const result = await account.viewFunction({
      contractId: 'intents.near',
      methodName: 'mt_batch_balance_of',
      args: {
        account_id: '0bdbb89f14ca51f13cc962c65b118b5ff93b1e1ed21aa80274fe558e5bfea0f1',
        token_ids: ['nep141:wrap.near']
      }
    });
    
    console.log('Balance in intents.near for user 0bdbb89f14ca51f13cc962c65b118b5ff93b1e1ed21aa80274fe558e5bfea0f1:');
    console.log('wNEAR:', result[0]);
    console.log('Required:', '10000000000000000000000');
    console.log('Has enough?', BigInt(result[0]) >= BigInt('10000000000000000000000'));
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

checkBalance().catch(console.error);
