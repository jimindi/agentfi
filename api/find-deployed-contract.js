require('dotenv').config();
const { connect, keyStores, KeyPair } = require('near-api-js');

async function findContract() {
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(process.env.NEAR_PRIVATE_KEY);
  await keyStore.setKey('mainnet', process.env.NEAR_ACCOUNT_ID, keyPair);
  
  const near = await connect({
    networkId: 'mainnet',
    keyStore,
    nodeUrl: 'https://rpc.mainnet.near.org'
  });
  
  const account = await near.account(process.env.NEAR_ACCOUNT_ID);
  
  // Check common contract naming patterns
  const contractsToCheck = [
    'defuse.near',
    'intents.defuse.near',
    'verifier.intents.near',
    'solver.near',
    'intents-v1.near'
  ];
  
  for (const contractId of contractsToCheck) {
    try {
      const state = await account.connection.provider.query({
        request_type: 'view_account',
        finality: 'final',
        account_id: contractId
      });
      
      const hasContract = state.code_hash !== '11111111111111111111111111111111';
      console.log(`${contractId}: ${hasContract ? '✅ HAS CONTRACT' : '❌ No contract'}`);
      
      if (hasContract) {
        console.log(`  Code hash: ${state.code_hash.substring(0, 20)}...`);
      }
    } catch (e) {
      console.log(`${contractId}: ❌ Account doesn't exist`);
    }
  }
  
  console.log('\n---');
  console.log('Based on NEAR Intents docs, the flow might be:');
  console.log('1. Users deposit to intents.near (multi-token holder)');
  console.log('2. Solvers watch for deposits + signed intents');
  console.log('3. Solvers call execute on their own contracts');
  console.log('4. Settlement happens automatically');
  console.log('\nWe may need to use the OneClick API instead of direct contract calls.');
}

findContract().catch(console.error);
