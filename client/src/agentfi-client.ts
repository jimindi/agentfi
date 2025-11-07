import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SwapParams {
  from: {
    chain: string;
    token: string;
    amount: string;
  };
  to: {
    chain: string;
    token: string;
    minAmount?: string;
  };
  user: {
    walletAddress: string;
  };
  options?: {
    slippageTolerance?: number;
    webhookUrl?: string;
  };
}

export interface SwapResponse {
  success: boolean;
  data: {
    intentId: string;
    status: string;
    depositInstructions: {
      cliCommand: string;
      contractCall: {
        contractId: string;
        methodName: string;
        args: any;
        gas: string;
        deposit: string;
      };
    };
    quote: {
      fromAmount: string;
      fromAmountFormatted: string;
      estimatedOutput: string;
      estimatedOutputFormatted: string;
      exchangeRate: string;
      estimatedTime: string;
      fees: {
        platformFeeUsd: string;
        networkFeeUsd: string;
        totalFeeUsd: string;
      };
    };
    tracking: {
      statusUrl: string;
      intentId: string;
    };
  };
}

export interface SwapStatus {
  success: boolean;
  data: {
    intentId: string;
    status: string;
    from: {
      chain: string;
      token: string;
      amount: string;
      formatted: string;
    };
    to: {
      chain: string;
      token: string;
      actualOutput: string | null;
      formatted: string | null;
    };
    txHash: string | null;
    executionTimeMs: number | null;
    createdAt: string;
    completedAt: string | null;
    errorMessage: string | null;
  };
}

export class AgentFiClient {
  constructor(
    private apiUrl: string,
    private apiKey?: string
  ) {}

  async createSwap(params: SwapParams): Promise<SwapResponse> {
    console.log('📝 Creating swap intent via API...');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.apiUrl}/swap`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getSwapStatus(intentId: string): Promise<SwapStatus> {
    const response = await fetch(`${this.apiUrl}/swap/${intentId}`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Status check failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async executeDeposit(cliCommand: string): Promise<string> {
    console.log('💸 Executing deposit via NEAR CLI...');
    console.log(`   Command: ${cliCommand.substring(0, 80)}...`);

    try {
      const { stdout, stderr } = await execAsync(cliCommand);
      
      if (stderr && !stderr.includes('Doing account.functionCall')) {
        console.warn('⚠️  NEAR CLI warning:', stderr);
      }
      
      console.log('✅ Deposit executed successfully');
      return stdout;
    } catch (error: any) {
      console.error('❌ Deposit execution failed:', error.message);
      throw error;
    }
  }

  async waitForCompletion(
    intentId: string,
    pollIntervalMs: number = 5000,
    maxWaitTimeMs: number = 180000
  ): Promise<SwapStatus> {
    console.log(`⏳ Monitoring swap ${intentId}...`);
    console.log(`   Checking every ${pollIntervalMs / 1000}s for up to ${maxWaitTimeMs / 1000}s`);

    const startTime = Date.now();
    let lastStatus = '';
    let checks = 0;

    while (Date.now() - startTime < maxWaitTimeMs) {
      checks++;
      const status = await this.getSwapStatus(intentId);
      
      if (status.data.status !== lastStatus) {
        console.log(`   [${checks}] Status: ${lastStatus || 'starting'} → ${status.data.status}`);
        lastStatus = status.data.status;
      }

      if (status.data.status === 'completed') {
        console.log('✅ Swap completed successfully!');
        return status;
      }

      if (status.data.status === 'failed') {
        console.error('❌ Swap failed:', status.data.errorMessage);
        throw new Error(`Swap failed: ${status.data.errorMessage}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Swap timeout - exceeded ${maxWaitTimeMs}ms wait time`);
  }

  async executeFullSwap(params: SwapParams): Promise<SwapStatus> {
    console.log('\n🚀 Starting complete swap flow...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 1: Create swap intent
    console.log('📋 STEP 1: Creating Swap Intent\n');
    const swap = await this.createSwap(params);
    console.log(`   ✓ Intent ID: ${swap.data.intentId}`);
    console.log(`   ✓ Status: ${swap.data.status}`);
    console.log(`   ✓ Estimated output: ${swap.data.quote.estimatedOutputFormatted} ${params.to.token}`);
    console.log(`   ✓ Total fees: $${swap.data.quote.fees.totalFeeUsd}\n`);

    // Step 2: Execute deposit
    console.log('💰 STEP 2: Depositing Tokens\n');
    await this.executeDeposit(swap.data.depositInstructions.cliCommand);
    console.log('');

    // Step 3: Wait for completion
    console.log('⏱️  STEP 3: Monitoring Completion\n');
    const result = await this.waitForCompletion(swap.data.intentId);
    console.log('');

    // Step 4: Display results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 FINAL RESULTS:\n');
    console.log(`   From: ${result.data.from.formatted} ${result.data.from.token}`);
    console.log(`   To:   ${result.data.to.formatted} ${result.data.to.token}`);
    console.log(`   Time: ${result.data.executionTimeMs}ms`);
    console.log(`   TX:   ${result.data.txHash}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return result;
  }
}
