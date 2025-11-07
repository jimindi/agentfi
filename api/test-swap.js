const { IntentsSDK } = require('@defuse-protocol/intents-sdk');
const https = require('https');

function fetchTokens() {
  return new Promise((resolve, reject) => {
    https.get('https://api-mng-console.chaindefuser.com/api/tokens', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testSwap() {
  try {
    console.log('🚀 Initializing NEAR Intents SDK...');
    
    const sdk = new IntentsSDK({
      network: 'testnet'
    });
    
    console.log('✅ SDK initialized\n');
    
    // Check what methods are available
    console.log('🔍 Available SDK methods:');
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(sdk)));
    console.log('\n');
    
    // Fetch supported tokens
    console.log('📋 Fetching supported tokens...');
    const data = await fetchTokens();
    
    console.log(`✅ Found ${data.items?.length || 0} tokens\n`);
    
    const nearTokens = data.items.filter(t => t.blockchain === 'near');
    console.log(`🔍 NEAR tokens available: ${nearTokens.length}`);
    nearTokens.slice(0, 5).forEach(t => {
      console.log(`  - ${t.symbol}: ${t.defuse_asset_id}`);
    });
    
    const fromToken = nearTokens.find(t => t.symbol === 'wNEAR');
    const toToken = nearTokens.find(t => t.symbol === 'USDC');
    
    console.log(`\n📝 Test parameters:`);
    console.log(`  From: ${fromToken.defuse_asset_id}`);
    console.log(`  To: ${toToken.defuse_asset_id}`);
    console.log(`  Amount: 100000000000000000000000 (0.1 wNEAR)`);
    
    // Try different method names
    console.log('\n🧪 Testing SDK methods...\n');
    
    if (typeof sdk.quote === 'function') {
      console.log('Trying sdk.quote()...');
      const quote = await sdk.quote({
        fromAsset: fromToken.defuse_asset_id,
        toAsset: toToken.defuse_asset_id,
        amount: '100000000000000000000000'
      });
      console.log('✅ Quote:', quote);
    } else if (typeof sdk.swap === 'function') {
      console.log('⚠️  Only swap() method found - we need to check documentation');
      console.log('SDK might only support direct swaps without quotes');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testSwap();
