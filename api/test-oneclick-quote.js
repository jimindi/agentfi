require('dotenv').config();

async function testQuote() {
  const url = 'https://1click.chaindefuser.com/v0/quote';
  
  const body = {
    dry: false,
    depositMode: 'SIMPLE',
    swapType: 'EXACT_INPUT',
    slippageTolerance: 100,
    originAsset: 'nep141:wrap.near',
    depositType: 'INTENTS',
    destinationAsset: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
    amount: '10000000000000000000000',
    refundTo: '0bdbb89f14ca51f13cc962c65b118b5ff93b1e1ed21aa80274fe558e5bfea0f1',
    refundType: 'INTENTS',
    recipient: '0bdbb89f14ca51f13cc962c65b118b5ff93b1e1ed21aa80274fe558e5bfea0f1',
    recipientType: 'INTENTS',
    deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  };
  
  console.log('Testing OneClick API quote...\n');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.ONECLICK_JWT_TOKEN
    },
    body: JSON.stringify(body)
  });
  
  console.log('Status:', response.status);
  
  const data = await response.json();
  console.log('\nFull Response:');
  console.log(JSON.stringify(data, null, 2));
  
  console.log('\nDeposit Address:', data.quote?.depositAddress || data.depositAddress || 'NOT FOUND');
}

testQuote().catch(console.error);
