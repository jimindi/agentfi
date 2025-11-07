import dotenv from 'dotenv';
import { AgentFiClient } from './agentfi-client.js';

dotenv.config();

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║     AgentFi Hybrid API - Mainnet Swap Test Client        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Validate environment
  const requiredVars = [
    'AGENTFI_API_URL',
    'NEAR_NETWORK',
    'NEAR_ACCOUNT_ID',
    'FROM_CHAIN',
    'FROM_TOKEN',
    'FROM_AMOUNT',
    'TO_CHAIN',
    'TO_TOKEN',
  ];

  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    console.error('   Copy .env.example to .env and fill in your values\n');
    process.exit(1);
  }

  // Initialize client
  const client = new AgentFiClient(
    process.env.AGENTFI_API_URL!,
    process.env.AGENTFI_API_KEY
  );

  // Prepare swap parameters
  const swapParams = {
    from: {
      chain: process.env.FROM_CHAIN!,
      token: process.env.FROM_TOKEN!,
      amount: process.env.FROM_AMOUNT!,
    },
    to: {
      chain: process.env.TO_CHAIN!,
      token: process.env.TO_TOKEN!,
    },
    user: {
      walletAddress: process.env.NEAR_ACCOUNT_ID!,
    },
  };

  console.log('⚙️  Configuration:');
  console.log(`   API:     ${process.env.AGENTFI_API_URL}`);
  console.log(`   Network: ${process.env.NEAR_NETWORK}`);
  console.log(`   Account: ${process.env.NEAR_ACCOUNT_ID}`);
  console.log(`   From:    ${swapParams.from.token} on ${swapParams.from.chain}`);
  console.log(`   To:      ${swapParams.to.token} on ${swapParams.to.chain}`);
  console.log(`   Amount:  ${swapParams.from.amount}\n`);

  try {
    // Execute complete swap flow
    const result = await client.executeFullSwap(swapParams);

    console.log('✅ SUCCESS! Swap completed.\n');
    console.log(`   View on NEAR Explorer:`);
    console.log(`   https://nearblocks.io/txns/${result.data.txHash}\n`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ FAILED:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('');
    process.exit(1);
  }
}

main();
