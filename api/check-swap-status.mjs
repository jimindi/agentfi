import { OneClickService, OpenAPI } from '@defuse-protocol/one-click-sdk-typescript';

OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.ONECLICK_JWT_TOKEN;

const depositAddress = process.argv[2];

if (!depositAddress) {
  console.error('Usage: node check-swap-status.js <depositAddress>');
  process.exit(1);
}

async function checkStatus() {
  try {
    console.log('Checking status for deposit address:', depositAddress);
    
    const status = await OneClickService.getExecutionStatus({
      depositAddress: depositAddress
    });
    
    console.log('Status:', JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkStatus();
