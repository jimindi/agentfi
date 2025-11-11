import { OneClickService } from './OneClickService';
import { SwapRequest, SwapResult } from '../types/swap.types';
import { PrismaClient } from '@prisma/client';

export class SwapService {
  private oneClickService: OneClickService;
  private prisma: PrismaClient;
  private readonly SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
  private readonly SYSTEM_API_KEY_ID = '87075fb4-d9dd-499f-9e88-6a98783a6407';

  constructor(prisma: PrismaClient) {
    this.oneClickService = new OneClickService();
    this.prisma = prisma;
  }

  async executeSwap(request: SwapRequest): Promise<SwapResult> {
    // Get quote from OneClick
    const quote = await this.oneClickService.getQuote({
      originAsset: this.getAssetId(request.from.chain, request.from.token),
      destinationAsset: this.getAssetId(request.to.chain, request.to.token),
      amount: request.from.amount,
      recipient: request.user.walletAddress
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
