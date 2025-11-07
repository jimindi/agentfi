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

// Try to get quote from Defuse API directly
function getQuoteFromAPI(fromAsset, toAsset, amount) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      from_asset: fromAsset,
      to_asset: toAsset,
      amount: amount
    });

    const options = {
      hostname: 'api-mng-console.chaindefuser.com',
      path: '/api/quote',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`API returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testSwap() {
  try {
    console.log('🚀 Testing NEAR Intents Integration...\n');
    
    // Fetch tokens
    const data = await fetchTokens();
    const nearTokens = data.items.filter(t => t.blockchain === 'near');
    
    const fromToken = nearTokens.find(t => t.symbol === 'wNEAR');
    const toToken = nearTokens.find(t => t.symbol === 'USDC');
    
    console.log('📝 Quote Request:');
    console.log(`  From: ${fromToken.symbol} (${fromToken.defuse_asset_id})`);
    console.log(`  To: ${toToken.symbol} (${toToken.defuse_asset_id})`);
    console.log(`  Amount: 0.1 wNEAR\n`);
    
    // Try to get quote from API
    console.log('💰 Requesting quote from Defuse API...');
    
    try {
      const quote = await getQuoteFromAPI(
        fromToken.defuse_asset_id,
        toToken.defuse_asset_id,
        '100000000000000000000000' // 0.1 wNEAR
      );
      
      console.log('✅ Quote received:');
      console.log(JSON.stringify(quote, null, 2));
      
    } catch (quoteError) {
      console.log('❌ Direct API quote failed:', quoteError.message);
      
      // Try alternative endpoint
      console.log('\n🔄 Trying alternative approach...');
      console.log('The SDK appears to be for withdrawals only.');
      console.log('\nWe may need to:');
      console.log('1. Use a different package for swap intents');
      console.log('2. Call NEAR Intents smart contract directly');
      console.log('3. Check if there\'s a swap-specific SDK');
    }
    
    console.log('\n📚 Let me check the @defuse-protocol packages...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSwap();
