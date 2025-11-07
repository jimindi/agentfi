require('dotenv').config();
const { connect, keyStores, KeyPair } = require('near-api-js');

async function checkV1Contract() {
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(process.env.NEAR_PRIVATE_KEY);
  await keyStore.setKey('mainnet', process.env.NEAR_ACCOUNT_ID, keyPair);
  
  const near = await connect({
    networkId: 'mainnet',
    keyStore,
    nodeUrl: 'https://rpc.mainnet.near.org'
  });
  
  const account = await near.account(process.env.NEAR_ACCOUNT_ID);
  
  console.log('Checking v1.intents.near...\n');
  
  try {
    const state = await account.connection.provider.query({
      request_type: 'view_account',
      finality: 'final',
      account_id: 'v1.intents.near'
    });
    
    console.log('v1.intents.near state:');
    console.log('Code hash:', state.code_hash);
    console.log('Has contract?', state.code_hash !== '11111111111111111111111111111111');
    
    if (state.code_hash !== '11111111111111111111111111111111') {
      console.log('\n✅ v1.intents.near has a contract deployed!');
      console.log('\nTrying to call execute_intents...');
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

checkV1Contract().catch(console.error);
