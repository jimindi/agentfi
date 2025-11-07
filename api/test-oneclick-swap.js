const { OneClickService, OpenAPI } = require('@defuse-protocol/one-click-sdk-typescript');
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

async function testOneClickSwap() {
  try {
    console.log('🚀 Testing Defuse OneClick SDK...\n');
    
    // Try different API endpoints
    const endpoints = [
      'https://1click.defuse.io',
      'https://api.defuse.io',
      'https://defuse.io/api'
    ];
    
    let workingEndpoint = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`);
        OpenAPI.BASE = endpoint;
        
        // Fetch tokens
        const data = await fetchTokens();
        const nearTokens = data.items.filter(t => t.blockchain === 'near');
        
        const fromToken = nearTokens.find(t => t.symbol === 'wNEAR');
        const toToken = nearTokens.find(t => t.symbol === 'USDC');
        
        // Try to get quote
        const quote = await OneClickService.getQuote({
          tokenIn: fromToken.defuse_asset_id,
          tokenOut: toToken.defuse_asset_id,
          amountIn: '100000000000000000000000'
        });
        
        workingEndpoint = endpoint;
        
        console.log(`✅ Success! Working endpoint: ${endpoint}\n`);
        console.log('📝 Test Parameters:');
        console.log(`  From: ${fromToken.symbol} (${fromToken.defuse_asset_id})`);
        console.log(`  To: ${toToken.symbol} (${toToken.defuse_asset_id})`);
        console.log(`  Amount: 0.1 wNEAR\n`);
        
        console.log('✅ Quote received:');
        console.log(JSON.stringify(quote, null, 2));
        
        if (quote.amountOut) {
          const usdcAmount = (parseInt(quote.amountOut) / Math.pow(10, toToken.decimals)).toFixed(6);
          console.log(`\n💵 Expected output: ${usdcAmount} ${toToken.symbol}`);
        }
        
        break;
        
      } catch (error) {
        console.log(`❌ Failed: ${error.message.substring(0, 80)}...\n`);
        continue;
      }
    }
    
    if (!workingEndpoint) {
      console.log('❌ None of the endpoints worked.');
      console.log('\n📚 Let me check the README for the correct endpoint...');
      
      // Read the README
      const fs = require('fs');
      const readmePath = './node_modules/@defuse-protocol/one-click-sdk-typescript/README.md';
      if (fs.existsSync(readmePath)) {
        const readme = fs.readFileSync(readmePath, 'utf8');
        console.log('\n📖 README.md excerpt:');
        console.log(readme.substring(0, 1000));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOneClickSwap();
