import { execSync } from 'child_process';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';

config();

// Configuration
const CONFIG = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/v1',
  apiKey: process.env.API_KEY || '',
  nearNetwork: process.env.NEAR_NETWORK || 'mainnet',
  nearAccount: process.env.NEAR_ACCOUNT_ID || '',
  testAmount: process.env.TEST_AMOUNT || '10000000000000000000000', // 0.01 wNEAR
  fromToken: process.env.FROM_TOKEN || 'wNEAR',
  toToken: process.env.TO_TOKEN || 'USDC',
  maxWaitTime: parseInt(process.env.MAX_WAIT_TIME || '120000'), // 2 minutes
  pollInterval: parseInt(process.env.POLL_INTERVAL || '5000') // 5 seconds
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: number, message: string) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`STEP ${step}: ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

// API Client
class AgentFiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async getQuote(params: {
    from: { chain: string; token: string; amount: string };
    to: { chain: string; token: string };
  }) {
    logInfo(`Requesting quote: ${this.formatAmount(params.from.amount, params.from.token)} → ${params.to.token}`);
    
    const response = await fetch(`${this.baseUrl}/swap/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Quote request failed: ${response.statusText} - ${error}`);
    }

    const data = await response.json();
    return data.data.quote;
  }

  async createSwap(params: {
    from: { chain: string; token: string; amount: string };
    to: { chain: string; token: string };
    user: { walletAddress: string };
  }) {
    logInfo(`Creating swap intent...`);
    
    const response = await fetch(`${this.baseUrl}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Swap creation failed: ${response.statusText} - ${error}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getSwapStatus(intentId: string) {
    const response = await fetch(`${this.baseUrl}/swap/${intentId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Status check failed: ${response.statusText} - ${error}`);
    }

    const data = await response.json();
    return data.data;
  }

  private formatAmount(amount: string, token: string): string {
    const decimals = token === 'wNEAR' ? 24 : 6;
    const formatted = Number(amount) / Math.pow(10, decimals);
    return `${formatted} ${token}`;
  }
}

// NEAR CLI wrapper
class NearCli {
  private network: string;
  private accountId: string;

  constructor(network: string, accountId: string) {
    this.network = network;
    this.accountId = accountId;
  }

  checkBalance(token: string = 'NEAR'): string {
    try {
      logInfo(`Checking ${token} balance for ${this.accountId}...`);
      
      if (token === 'NEAR') {
        const output = execSync(
          `near state ${this.accountId} --networkId ${this.network}`,
          { encoding: 'utf-8' }
        );
        
        const match = output.match(/amount:\s+'(\d+)'/);
        if (match) {
          const balance = Number(match[1]) / 1e24;
          logSuccess(`Balance: ${balance.toFixed(4)} NEAR`);
          return match[1];
        }
      } else if (token === 'wNEAR') {
        // Check wNEAR balance
        const output = execSync(
          `near view wrap.near ft_balance_of '{"account_id": "${this.accountId}"}' --networkId ${this.network}`,
          { encoding: 'utf-8' }
        );
        
        const match = output.match(/'(\d+)'/);
        if (match) {
          const balance = Number(match[1]) / 1e24;
          logSuccess(`Balance: ${balance.toFixed(4)} wNEAR`);
          return match[1];
        }
      }
      
      throw new Error('Could not parse balance');
    } catch (error: any) {
      logError(`Failed to check balance: ${error.message}`);
      throw error;
    }
  }

  sendTokens(to: string, amount: string, token: string = 'NEAR') {
    try {
      logInfo(`Sending ${this.formatAmount(amount, token)} to ${to}...`);
      
      let command: string;
      
      if (token === 'NEAR') {
        command = `near send ${this.accountId} ${to} ${Number(amount) / 1e24} --networkId ${this.network}`;
      } else if (token === 'wNEAR') {
        // Transfer wNEAR using ft_transfer
        command = `near call wrap.near ft_transfer '{"receiver_id": "${to}", "amount": "${amount}"}' --accountId ${this.accountId} --depositYocto 1 --gas 300000000000000 --networkId ${this.network}`;
      } else {
        throw new Error(`Unsupported token: ${token}`);
      }
      
      logInfo(`Executing: ${command}`);
      const output = execSync(command, { encoding: 'utf-8' });
      
      // Extract transaction hash
      const txMatch = output.match(/Transaction Id ([A-Za-z0-9]+)/);
      if (txMatch) {
        const txHash = txMatch[1];
        logSuccess(`Transaction sent: ${txHash}`);
        logInfo(`View on explorer: https://nearblocks.io/txns/${txHash}`);
        return txHash;
      }
      
      logSuccess('Transaction sent successfully');
      return 'unknown';
    } catch (error: any) {
      logError(`Failed to send tokens: ${error.message}`);
      throw error;
    }
  }

  private formatAmount(amount: string, token: string): string {
    const decimals = token === 'wNEAR' ? 24 : token === 'NEAR' ? 24 : 6;
    const formatted = Number(amount) / Math.pow(10, decimals);
    return `${formatted} ${token}`;
  }
}

// Wait for swap completion
async function waitForCompletion(
  client: AgentFiClient,
  intentId: string,
  maxWaitTime: number,
  pollInterval: number
): Promise<any> {
  const startTime = Date.now();
  let attempts = 0;
  
  logInfo(`Waiting for swap completion (max ${maxWaitTime / 1000}s, checking every ${pollInterval / 1000}s)...`);
  
  while (Date.now() - startTime < maxWaitTime) {
    attempts++;
    
    try {
      const status = await client.getSwapStatus(intentId);
      
      logInfo(`[Attempt ${attempts}] Status: ${status.status}`);
      
      if (status.status === 'completed') {
        logSuccess('Swap completed!');
        return status;
      } else if (status.status === 'failed') {
        logError(`Swap failed: ${status.errorMessage || 'Unknown error'}`);
        return status;
      } else if (status.status === 'refunded') {
        logWarning('Swap was refunded');
        return status;
      }
      
      // Still processing
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error: any) {
      logWarning(`Status check failed: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  logError(`Timeout: Swap did not complete within ${maxWaitTime / 1000} seconds`);
  return await client.getSwapStatus(intentId);
}

// Main test flow
async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║         AgentFi Cross-Chain Swap Test Client            ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
  
  try {
    // Validate configuration
    logStep(0, 'Validating Configuration');
    
    if (!CONFIG.apiKey && CONFIG.apiBaseUrl.includes('localhost')) {
      logWarning('No API key provided - public endpoints only');
    }
    
    if (!CONFIG.nearAccount) {
      throw new Error('NEAR_ACCOUNT_ID not configured in .env');
    }
    
    logSuccess(`API: ${CONFIG.apiBaseUrl}`);
    logSuccess(`NEAR Network: ${CONFIG.nearNetwork}`);
    logSuccess(`NEAR Account: ${CONFIG.nearAccount}`);
    logSuccess(`Test Amount: ${Number(CONFIG.testAmount) / 1e24} ${CONFIG.fromToken}`);
    logSuccess(`Route: ${CONFIG.fromToken} → ${CONFIG.toToken}`);
    
    // Initialize clients
    const apiClient = new AgentFiClient(CONFIG.apiBaseUrl, CONFIG.apiKey);
    const nearCli = new NearCli(CONFIG.nearNetwork, CONFIG.nearAccount);
    
    // Step 1: Check initial balance
    logStep(1, 'Check Initial Balance');
    const initialBalance = nearCli.checkBalance(CONFIG.fromToken);
    
    if (Number(initialBalance) < Number(CONFIG.testAmount)) {
      throw new Error(`Insufficient balance: ${initialBalance} < ${CONFIG.testAmount}`);
    }
    
    // Step 2: Get quote from API
    logStep(2, 'Get Quote from API');
    const quote = await apiClient.getQuote({
      from: {
        chain: 'near',
        token: CONFIG.fromToken,
        amount: CONFIG.testAmount
      },
      to: {
        chain: 'near',
        token: CONFIG.toToken
      }
    });
    
    logSuccess(`Estimated output: ${quote.estimatedOutputFormatted || quote.estimatedOutput}`);
    logSuccess(`Exchange rate: ${quote.exchangeRate}`);
    logSuccess(`Estimated time: ${quote.estimatedTime}`);
    logInfo(`Quote valid until: ${quote.validUntil || 'N/A'}`);
    
    // Step 3: Create swap intent
    logStep(3, 'Create Swap Intent');
    const swap = await apiClient.createSwap({
      from: {
        chain: 'near',
        token: CONFIG.fromToken,
        amount: CONFIG.testAmount
      },
      to: {
        chain: 'near',
        token: CONFIG.toToken
      },
      user: {
        walletAddress: CONFIG.nearAccount
      }
    });
    
    logSuccess(`Intent ID: ${swap.intentId}`);
    logSuccess(`Deposit Address: ${swap.depositAddress}`);
    logInfo(`Status URL: ${swap.tracking?.statusUrl || 'N/A'}`);
    
    // Step 4: Send tokens via NEAR CLI
    logStep(4, 'Send Tokens to Deposit Address');
    logWarning('This will send REAL tokens on mainnet!');
    logInfo('Press Ctrl+C within 5 seconds to cancel...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const txHash = nearCli.sendTokens(
      swap.depositAddress,
      CONFIG.testAmount,
      CONFIG.fromToken
    );
    
    logSuccess(`Tokens sent! TX: ${txHash}`);
    
    // Step 5: Wait for completion
    logStep(5, 'Wait for Swap Completion');
    const result = await waitForCompletion(
      apiClient,
      swap.intentId,
      CONFIG.maxWaitTime,
      CONFIG.pollInterval
    );
    
    // Step 6: Display results
    logStep(6, 'Final Results');
    
    log('\n📊 Swap Summary:', 'bright');
    log('─'.repeat(60), 'cyan');
    log(`Intent ID:        ${result.intentId}`, 'reset');
    log(`Status:           ${result.status}`, result.status === 'completed' ? 'green' : 'red');
    log(`From:             ${result.from?.formatted || 'N/A'} ${CONFIG.fromToken}`, 'reset');
    log(`To:               ${result.to?.formatted || 'N/A'} ${CONFIG.toToken}`, 'reset');
    
    if (result.txHash) {
      log(`TX Hash:          ${result.txHash}`, 'reset');
      log(`Explorer:         https://nearblocks.io/txns/${result.txHash}`, 'blue');
    }
    
    if (result.executionTimeMs) {
      log(`Execution Time:   ${(result.executionTimeMs / 1000).toFixed(2)}s`, 'reset');
    }
    
    log('─'.repeat(60), 'cyan');
    
    // Step 7: Check final balance
    logStep(7, 'Check Final Balance');
    nearCli.checkBalance(CONFIG.fromToken);
    
    if (result.status === 'completed') {
      log('\n🎉 TEST PASSED - Swap completed successfully!', 'green');
      process.exit(0);
    } else if (result.status === 'failed') {
      log('\n💥 TEST FAILED - Swap failed', 'red');
      logError(`Error: ${result.errorMessage || 'Unknown error'}`);
      process.exit(1);
    } else {
      log('\n⏳ TEST INCOMPLETE - Swap still processing', 'yellow');
      logWarning('Check status manually or increase MAX_WAIT_TIME');
      process.exit(2);
    }
    
  } catch (error: any) {
    log('\n💥 TEST ERROR', 'red');
    logError(error.message);
    
    if (error.stack) {
      log('\nStack trace:', 'red');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test
main();
