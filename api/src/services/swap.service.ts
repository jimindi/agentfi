// src/services/swap.service.ts
import { prisma } from '../models';
import { nearIntentsService } from './near-intents.service';
import { nearContractService } from './near-contract.service';
import { logger } from '../utils/logger';

interface SignedIntent {
  message: any;
  signature: string;
  publicKey: string;
}

interface SwapParams {
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
  signedIntent?: SignedIntent;
  metadata?: any;
}

interface SwapResult {
  success: boolean;
  data: {
    intentId: string;
    status: string;
    depositInstructions: {
      step1: string;
      step2: string;
      step3: string;
      contractId: string;
      methodName: string;
      args: any;
      gas: string;
      deposit: string;
      cliCommand: string;
    };
    quote: any;
    intentMessage: {
      signer_id: string;
      deadline: string;
      intents: any[];
    };
    tracking: {
      statusUrl: string;
      intentId: string;
    };
  };
}

export class SwapService {
  /**
   * Execute a cross-chain swap using hybrid approach
   */
  async executeSwap(params: SwapParams): Promise<SwapResult> {
    try {
      logger.info(
        {
          from: params.from,
          to: params.to,
          user: params.user.walletAddress,
          hasSignedIntent: !!params.signedIntent,
        },
        'Starting hybrid swap execution'
      );

      // Step 1: Get quote from OneClick API (for accurate pricing)
      const quote = await nearIntentsService.getQuote({
        fromAsset: params.from.token,
        toAsset: params.to.token,
        amount: params.from.amount,
        userWallet: params.user.walletAddress,
      });

      logger.info({ quote }, 'Received quote from OneClick API');

      // Step 2: Determine intent message (from signed or build new)
      let intentMessage: any;
      if (params.signedIntent) {
        intentMessage = params.signedIntent.message;
        logger.info('Using pre-signed intent from client');
      } else {
        // Build intent message if not provided
        const fromAssetId = this.getAssetId(params.from.token);
        const toAssetId = this.getAssetId(params.to.token);
        
        intentMessage = nearContractService.buildIntentMessage({
          userAccountId: params.user.walletAddress,
          fromAssetId: fromAssetId,
          toAssetId: toAssetId,
          amountIn: params.from.amount,
          amountOut: quote.estimatedOutput,
          deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        });
        logger.info('Built intent message on server');
      }

      // Step 3: Create intent record in database
      const intent = await prisma.intent.create({
        data: {
          userId: '00000000-0000-0000-0000-000000000000',
          apiKeyId: '00000000-0000-0000-0000-000000000001',
          fromChain: params.from.chain,
          fromToken: params.from.token,
          fromAmount: params.from.amount,
          toChain: params.to.chain,
          toToken: params.to.token,
          minToAmount: params.to.minAmount || quote.estimatedOutput,
          userWalletAddress: params.user.walletAddress,
          status: 'pending_deposit',
          webhookUrl: params.options?.webhookUrl,
          // CRITICAL FIX: Store signedIntent in dedicated field
          nep413SignedData: params.signedIntent || null,
          metadata: {
            ...params.metadata,
            intentMessage: intentMessage,
            quote: quote,
          },
        },
      });

      logger.info({ 
        intentId: intent.id, 
        hasSignedIntent: !!params.signedIntent,
        storedInNep413Field: !!intent.nep413SignedData 
      }, 'Created intent record');

      // Step 4: Generate deposit instructions for user
      const tokenContractId = this.getTokenContractId(params.from.token);
      const depositInstructions = await nearContractService.generateDepositInstructions({
        userAccountId: params.user.walletAddress,
        tokenContractId: tokenContractId,
        amount: params.from.amount,
      });

      // Step 5: Format amounts for display
      const fromDecimals = this.getTokenDecimals(params.from.token);
      const toDecimals = this.getTokenDecimals(params.to.token);
      const fromFormatted = (Number(params.from.amount) / 10 ** fromDecimals).toFixed(6);
      const toFormatted = (Number(quote.estimatedOutput) / 10 ** toDecimals).toFixed(6);

      // Step 6: Return instructions to user
      return {
        success: true,
        data: {
          intentId: intent.id,
          status: 'pending_deposit',
          depositInstructions: {
            step1: `Deposit ${fromFormatted} ${params.from.token} to intents.near`,
            step2: 'Your tokens will be held in your intents.near balance',
            step3: params.signedIntent 
              ? 'Our system will execute your pre-signed intent automatically'
              : 'Sign the intent message and deposit to execute',
            ...depositInstructions,
          },
          quote: {
            fromAmount: params.from.amount,
            fromAmountFormatted: fromFormatted,
            estimatedOutput: quote.estimatedOutput,
            estimatedOutputFormatted: toFormatted,
            exchangeRate: (Number(quote.estimatedOutput) / Number(params.from.amount)).toFixed(8),
            estimatedTime: '20-60 seconds',
            fees: quote.fees || {
              platformFeeUsd: '0.00',
              networkFeeUsd: '0.50',
              totalFeeUsd: '0.50',
            },
          },
          intentMessage: intentMessage,
          tracking: {
            statusUrl: `${process.env.API_BASE_URL || 'http://localhost:3000'}/v1/swap/${intent.id}`,
            intentId: intent.id,
          },
        },
      };
    } catch (error: any) {
      logger.error({ error, params }, 'Swap execution failed');
      throw new Error(`Swap execution failed: ${error.message}`);
    }
  }

  /**
   * Get swap status
   */
  async getSwapStatus(intentId: string): Promise<any> {
    try {
      const intent = await prisma.intent.findUnique({
        where: { id: intentId },
      });

      if (!intent) {
        throw new Error('Intent not found');
      }

      // Format amounts for display
      const fromDecimals = this.getTokenDecimals(intent.fromToken);
      const toDecimals = this.getTokenDecimals(intent.toToken);

      return {
        success: true,
        data: {
          intentId: intent.id,
          status: intent.status,
          from: {
            chain: intent.fromChain,
            token: intent.fromToken,
            amount: intent.fromAmount,
            formatted: (Number(intent.fromAmount) / 10 ** fromDecimals).toFixed(6),
          },
          to: {
            chain: intent.toChain,
            token: intent.toToken,
            actualOutput: intent.actualOutputAmount,
            formatted: intent.actualOutputAmount
              ? (Number(intent.actualOutputAmount) / 10 ** toDecimals).toFixed(6)
              : null,
          },
          txHash: intent.txHash,
          executionTimeMs: intent.executionTimeMs,
          createdAt: intent.createdAt,
          completedAt: intent.completedAt,
          errorMessage: intent.errorMessage,
        },
      };
    } catch (error: any) {
      logger.error({ error, intentId }, 'Failed to get swap status');
      throw error;
    }
  }

  /**
   * Get NEAR asset ID for token
   */
  private getAssetId(tokenSymbol: string): string {
    const assetMap: Record<string, string> = {
      wNEAR: 'nep141:wrap.near',
      NEAR: 'nep141:wrap.near',
      USDC: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
      USDT: 'nep141:usdt.tether-token.near',
    };

    return assetMap[tokenSymbol] || `nep141:${tokenSymbol}`;
  }

  /**
   * Get token contract ID for NEAR tokens
   */
  private getTokenContractId(tokenSymbol: string): string {
    const tokenMap: Record<string, string> = {
      wNEAR: 'wrap.near',
      NEAR: 'wrap.near',
      USDC: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
      USDT: 'usdt.tether-token.near',
    };

    return tokenMap[tokenSymbol] || tokenSymbol;
  }

  /**
   * Get token decimals
   */
  private getTokenDecimals(tokenSymbol: string): number {
    const decimalsMap: Record<string, number> = {
      wNEAR: 24,
      NEAR: 24,
      USDC: 6,
      USDT: 6,
      ETH: 18,
      BTC: 8,
      SOL: 9,
    };

    return decimalsMap[tokenSymbol] || 18;
  }
}

// Export singleton instance
export const swapService = new SwapService();
