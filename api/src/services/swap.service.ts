import { NEARIntentsService } from './near-intents.service';
import { QuoteService } from './quote.service';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface SwapParams {
  fromChain: string;
  fromToken: string;
  fromAmount: string;
  toChain: string;
  toToken: string;
  minToAmount?: string;
  userWalletAddress: string;
  userId: string;
  apiKeyId: string;
  slippageTolerance?: number;
  webhookUrl?: string;
  metadata?: any;
}

interface SwapResult {
  intentId: string;
  status: string;
  txHash?: string;
  quote: any;
}

export class SwapService {
  private nearIntents: NEARIntentsService;
  private quoteService: QuoteService;

  constructor() {
    this.nearIntents = NEARIntentsService.getInstance();
    this.quoteService = new QuoteService();
  }

  async executeSwap(params: SwapParams): Promise<SwapResult> {
    try {
      logger.info({ params }, 'Executing swap');

      // Format asset IDs for NEAR Intents
      const fromAssetId = this.formatAssetId(params.fromChain, params.fromToken);
      const toAssetId = this.formatAssetId(params.toChain, params.toToken);

      // Get quote first
      const quote = await this.quoteService.getQuote({
        fromAssetId,
        toAssetId,
        amount: params.fromAmount
      });

      // Create intent record in database
      const intent = await prisma.intent.create({
        data: {
          userId: params.userId,
          apiKeyId: params.apiKeyId,
          fromChain: params.fromChain,
          fromToken: params.fromToken,
          fromAmount: params.fromAmount,
          toChain: params.toChain,
          toToken: params.toToken,
          minToAmount: params.minToAmount || quote.estimatedOutput,
          userWalletAddress: params.userWalletAddress,
          status: 'pending',
          webhookUrl: params.webhookUrl,
          metadata: params.metadata || {}
        }
      });

      // Execute swap via NEAR Intents SDK
      const sdk = this.nearIntents.getSDK();
      
      const swapResult = await sdk.swap({
        fromAsset: fromAssetId,
        toAsset: toAssetId,
        amount: params.fromAmount,
        destinationAddress: params.userWalletAddress,
        slippageTolerance: params.slippageTolerance || 1.0
      });

      // Update intent with execution details
      await prisma.intent.update({
        where: { id: intent.id },
        data: {
          intentHash: swapResult.intent_id,
          txHash: swapResult.transaction_hash,
          status: 'submitted'
        }
      });

      logger.info({ 
        intentId: intent.id, 
        intentHash: swapResult.intent_id 
      }, 'Swap submitted successfully');

      return {
        intentId: intent.id,
        status: 'submitted',
        txHash: swapResult.transaction_hash,
        quote
      };

    } catch (error) {
      logger.error({ error, params }, 'Swap execution failed');
      throw new Error('Failed to execute swap');
    }
  }

  async getSwapStatus(intentId: string): Promise<any> {
    try {
      const intent = await prisma.intent.findUnique({
        where: { id: intentId },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      });

      if (!intent) {
        throw new Error('Intent not found');
      }

      return {
        intentId: intent.id,
        status: intent.status,
        from: {
          chain: intent.fromChain,
          token: intent.fromToken,
          amount: intent.fromAmount
        },
        to: {
          chain: intent.toChain,
          token: intent.toToken,
          actualOutput: intent.actualOutputAmount
        },
        txHash: intent.txHash,
        executionTimeMs: intent.executionTimeMs,
        createdAt: intent.createdAt,
        completedAt: intent.completedAt,
        errorMessage: intent.errorMessage
      };

    } catch (error) {
      logger.error({ error, intentId }, 'Failed to get swap status');
      throw error;
    }
  }

  private formatAssetId(chain: string, token: string): string {
    // Map chain and token to NEAR Intents asset format
    // This is a simplified version - production would need a proper token registry
    
    const chainMap: Record<string, string> = {
      'near': 'nep141',
      'ethereum': 'erc20',
      'solana': 'spl',
      'bitcoin': 'native'
    };

    const prefix = chainMap[chain.toLowerCase()] || chain;
    return `${prefix}:${token.toLowerCase()}`;
  }
}
