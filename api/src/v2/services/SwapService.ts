import OneClickService from './OneClickService';
import { SwapRequest, SwapResult } from '../types/swap.types';
import { PrismaClient } from '@prisma/client';

export class SwapService {
  private prisma: PrismaClient;
  private readonly SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
  private readonly SYSTEM_API_KEY_ID = '87075fb4-d9dd-499f-9e88-6a98783a6407';

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async executeSwap(request: SwapRequest): Promise<SwapResult> {
    // Get quote from OneClick
    const quote = await OneClickService.getQuote({
      fromAsset: this.getAssetId(request.from.chain, request.from.token),
      toAsset: this.getAssetId(request.to.chain, request.to.token),
      amount: request.from.amount,
      userWallet: request.user.walletAddress
    });

    // Store in database
    const intent = await this.prisma.intent.create({
      data: {
        user: {
          connect: { id: this.SYSTEM_USER_ID }
        },
        apiKey: {
          connect: { id: this.SYSTEM_API_KEY_ID }
        },
        fromChain: request.from.chain,
        fromToken: request.from.token,
        fromAmount: request.from.amount,
        toChain: request.to.chain,
        toToken: request.to.token,
        userWalletAddress: request.user.walletAddress,
        status: 'pending_deposit',
        metadata: {
          depositAddress: quote.depositAddress,
          estimatedOutput: quote.estimatedOutput
        }
      }
    });

    return {
      intentId: intent.id,
      status: 'pending_deposit',
      depositAddress: quote.depositAddress,
      estimatedOutput: quote.estimatedOutput,
      estimatedTimeSeconds: quote.estimatedTimeSeconds
    };
  }

  async getSwapStatus(intentId: string) {
    const intent = await this.prisma.intent.findUnique({
      where: { id: intentId }
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
      createdAt: intent.createdAt,
      completedAt: intent.completedAt
    };
  }

  private getAssetId(chain: string, token: string): string {
    // Map token symbols to asset IDs
    const assetMap: Record<string, string> = {
      'near:wNEAR': 'nep141:wrap.near',
      'near:USDC': 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1'
    };

    const key = `${chain}:${token}`;
    const assetId = assetMap[key];
    
    if (!assetId) {
      throw new Error(`Unsupported token: ${key}`);
    }

    return assetId;
  }
}
