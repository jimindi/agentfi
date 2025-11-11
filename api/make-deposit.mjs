import { connect, keyStores, KeyPair } from 'near-api-js';
import { config } from 'dotenv';

// Load .env file
config();

const DEPOSIT_ADDRESS = 'aea7e00400c9a63833f9f4b3c60e64e27eaccfb9db5ae18e292ac1879d602386';
const AMOUNT = '10000000000000000000000'; // 0.01 wNEAR

async function makeDeposit() {
  const accountId = process.env.NEAR_ACCOUNT_ID;
  const privateKey = process.env.NEAR_PRIVATE_KEY;
  
  console.log('Account ID:', accountId);
  
  // Setup keystore
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(privateKey);
  await keyStore.setKey('mainnet', accountId, keyPair);

  // Connect to NEAR with explicit config
  const config = {
    networkId: 'mainnet',
    keyStore: keyStore,
    nodeUrl: 'https://rpc.mainnet.near.org',
    walletUrl: 'https://wallet.mainnet.near.org',
    helperUrl: 'https://helper.mainnet.near.org',
    explorerUrl: 'https://nearblocks.io'
  };
  
  const near = await connect(config);
  const account = await near.account(accountId);

  console.log('Transferring 0.01 wNEAR to deposit address...');
  
  const result = await account.functionCall({
    contractId: 'wrap.near',
    methodName: 'ft_transfer_call',
    args: {
      receiver_id: 'intents.near',
      amount: AMOUNT,
      msg: JSON.stringify({ receiver_id: DEPOSIT_ADDRESS })
    },
    gas: '300000000000000',
    attachedDeposit: '1'
  });

  console.log('✅ Transfer successful!');
  console.log('Transaction hash:', result.transaction.hash);
  console.log('View on explorer: https://nearblocks.io/txns/' + result.transaction.hash);
}

makeDeposit().catch(console.error);
