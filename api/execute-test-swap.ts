import { connect, keyStores, KeyPair } from 'near-api-js';
import dotenv from 'dotenv';

dotenv.config();

async function executeSwap() {
  try {
    console.log('🚀 Executing test swap...\n');
    
    // Setup NEAR connection
    const keyStore = new keyStores.InMemoryKeyStore();
    const keyPair = KeyPair.fromString(process.env.NEAR_PRIVATE_KEY!);
    await keyStore.setKey('testnet', process.env.NEAR_ACCOUNT_ID!, keyPair);
    
    const near = await connect({
      networkId: 'testnet',
      keyStore,
      nodeUrl: 'https://rpc.testnet.near.org'
    });
    
    const account = await near.account(process.env.NEAR_ACCOUNT_ID!);
    
    console.log('📍 From account:', process.env.NEAR_ACCOUNT_ID);
    console.log('💰 Checking balance...\n');
    
    const balance = await account.getAccountBalance();
    console.log('Balance:', {
      total: (parseFloat(balance.total) / 1e24).toFixed(4) + ' NEAR',
      available: (parseFloat(balance.available) / 1e24).toFixed(4) + ' NEAR'
    });
    
    // Get deposit address from user
    const depositAddress = process.argv[2];
    
    if (!depositAddress) {
      console.error('\n❌ Please provide deposit address as argument');
      console.log('Usage: npx tsx execute-test-swap.ts <deposit-address>');
      process.exit(1);
    }
    
    console.log('\n📤 Sending 0.01 NEAR to deposit address...');
    console.log('To:', depositAddress);
    
    // Send 0.01 NEAR to deposit address
    const result = await account.sendMoney(
      depositAddress,
      '10000000000000000000000' // 0.01 NEAR
    );
    
    console.log('\n✅ Transaction sent!');
    console.log('TX Hash:', result.transaction.hash);
    console.log('Explorer:', `https://testnet.nearblocks.io/txns/${result.transaction.hash}`);
    console.log('\n⏳ Swap will execute automatically in ~20 seconds...');
    console.log('💡 Check status with: curl http://localhost:3000/v1/swap/<intentId>');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  }
}

executeSwap();
