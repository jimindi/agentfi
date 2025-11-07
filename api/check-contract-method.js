require('dotenv').config();
const { connect, keyStores, KeyPair } = require('near-api-js');

async function checkContractMethods() {
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(process.env.NEAR_PRIVATE_KEY);
  await keyStore.setKey('mainnet', process.env.NEAR_ACCOUNT_ID, keyPair);
  
  const near = await connect({
    networkId: 'mainnet',
    keyStore,
    nodeUrl: 'https://rpc.mainnet.near.org'
  });
  
  const account = await near.account(process.env.NEAR_ACCOUNT_ID);
  
  // Try to get contract metadata
  try {
    const contract = await account.viewFunction({
      contractId: 'intents.near',
      methodName: '__contract_abi',
      args: {}
    });
    console.log('Contract ABI:', JSON.stringify(contract, null, 2));
  } catch (e) {
    console.log('No ABI available, checking account info instead');
    
    // Check the contract code
    const state = await account.state();
    console.log('Contract state:', state);
  }
}

checkContractMethods().catch(console.error);
