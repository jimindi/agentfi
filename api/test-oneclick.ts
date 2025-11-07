import { OneClickService, OpenAPI, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import dotenv from 'dotenv';

dotenv.config();

OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.ONECLICK_JWT_TOKEN;

async function test() {
  console.log('Testing OneClick API...');
  console.log('JWT Token present:', !!process.env.ONECLICK_JWT_TOKEN);
  
  try {
    console.log('\n1. Testing dry=false (get deposit address)...');
    
    const quoteRequest: QuoteRequest = {
      dry: false, // false = get deposit address for real swap
      swapType: QuoteRequest.swapType.EXACT_INPUT,
      slippageTolerance: 100, // 1%
      originAsset: 'nep141:wrap.near',
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
      destinationAsset: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
      amount: '10000000000000000000000', // 0.01 wNEAR
      refundTo: 'agentfi-dev-1762307277.testnet',
      refundType: QuoteRequest.refundType.INTENTS,
      recipient: 'agentfi-dev-1762307277.testnet',
      recipientType: QuoteRequest.recipientType.INTENTS,
      deadline: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    };
    
    console.log('Request:', JSON.stringify(quoteRequest, null, 2));
    
    const response = await OneClickService.getQuote(quoteRequest);
    
    console.log('\n✅ Response:', JSON.stringify(response, null, 2));
    console.log('\n📍 Deposit Address:', response.deposit?.address || response.deposit?.accountId);
    console.log('💰 Expected Output:', response.quote?.amountOut);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Status:', error.status);
    console.error('Body:', error.body);
  }
}

test();
