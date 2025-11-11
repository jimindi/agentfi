import { nearContractService } from './src/services/near-contract.service';
import { logger } from './src/utils/logger';

const DEPOSIT_ADDRESS = 'aea7e00400c9a63833f9f4b3c60e64e27eaccfb9db5ae18e292ac1879d602386';
const AMOUNT = '10000000000000000000000'; // 0.01 wNEAR

async function makeDeposit() {
  await nearContractService.init();
  
  logger.info('Making deposit to OneClick address', { 
    depositAddress: DEPOSIT_ADDRESS,
    amount: AMOUNT 
  });
  
  // Access the private account object
  const account = (nearContractService as any).account;
  
  if (!account) {
    throw new Error('NEAR account not initialized');
  }
  
  logger.info('Calling ft_transfer_call on wrap.near');
  
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
  
  logger.info('✅ Deposit successful!', { 
    txHash: result.transaction.hash,
    explorerUrl: `https://nearblocks.io/txns/${result.transaction.hash}`
  });
  
  console.log('\n✅ Transfer successful!');
  console.log('Transaction:', result.transaction.hash);
  console.log('View on explorer: https://nearblocks.io/txns/' + result.transaction.hash);
}

makeDeposit().catch(error => {
  logger.error('Deposit failed', { error: error.message || String(error) });
  console.error('Error:', error);
  process.exit(1);
});
