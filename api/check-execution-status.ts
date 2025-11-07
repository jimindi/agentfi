import { OneClickService, OpenAPI } from '@defuse-protocol/one-click-sdk-typescript';
import dotenv from 'dotenv';

dotenv.config();

OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.ONECLICK_JWT_TOKEN;

async function checkStatus() {
  const depositAddress = process.argv[2];
  
  if (!depositAddress) {
    console.error('Usage: npx tsx check-execution-status.ts <deposit-address>');
    process.exit(1);
  }
  
  try {
    console.log(`🔍 Checking execution status for: ${depositAddress}\n`);
    
    const status = await OneClickService.getExecutionStatus(depositAddress);
    
    console.log('Status:', JSON.stringify(status, null, 2));
    
    if (status.state === 'success') {
      console.log('\n✅ Swap completed successfully!');
      console.log('Output amount:', status.swap?.destinationAmount);
      console.log('TX Hash:', status.swap?.destinationTxHash);
    } else if (status.state === 'pending' || status.state === 'processing') {
      console.log('\n⏳ Swap is still processing...');
    } else {
      console.log(`\n❓ Status: ${status.state}`);
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.status === 404) {
      console.log('💡 Swap may still be processing - deposit not yet detected');
    }
  }
}

checkStatus();
