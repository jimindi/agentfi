const { OneClickService, OpenAPI } = require('@defuse-protocol/one-click-sdk-typescript');

OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.ONECLICK_JWT_TOKEN;

console.log('Testing OneClick API...');
console.log('Token set:', !!process.env.ONECLICK_JWT_TOKEN);
console.log('');

// Test with minimal parameters
OneClickService.getQuote({
  receiver_id: 'agentfi-dev-1762307277.testnet',
  assets_in: [{
    asset_id: 'nep141:wrap.near',
    amount: '100000000000000000000000'
  }],
  assets_out: [{
    asset_id: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1'
  }]
}).then(result => {
  console.log('SUCCESS!');
  console.log(JSON.stringify(result, null, 2));
}).catch(error => {
  console.log('ERROR:', error.message);
  console.log('Status:', error.status);
  console.log('Body:', error.body);
  console.log('');
  
  // Try to see more details
  if (error.body) {
    console.log('Error details:', JSON.stringify(error.body, null, 2));
  }
});
