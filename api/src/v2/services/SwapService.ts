import OneClickService from './OneClickService';
import TokenPriceService from './TokenPriceService';
import { SwapRequest, SwapResult } from '../types/swap.types';
import { PrismaClient } from '@prisma/client';

export class SwapService {
  private prisma: PrismaClient;
  private readonly SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
  private readonly SYSTEM_API_KEY_ID = '87075fb4-d9dd-499f-9e88-6a98783a6407';
  private readonly MINIMUM_USD_VALUE = 5.0; // $5 minimum

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async executeSwap(request: SwapRequest): Promise<SwapResult> {
    // Validate minimum transaction amount
    await this.validateMinimumAmount(request);

    // Get quote from OneClick
    const quote = await OneClickService.getQuote({
      fromAsset: this.getAssetId(request.from.chain, request.from.token),
      toAsset: this.getAssetId(request.to.chain, request.to.token),
      amount: request.from.amount,
      userWallet: request.user.walletAddress
    });

    // Format fees for display
    const platformFeeFormatted = this.formatAmount(quote.fees.platformFeeAmount, 24);
    const networkFeeFormatted = this.formatAmount(quote.fees.networkFeeEstimate, 24);
    const totalFee = BigInt(quote.fees.platformFeeAmount) + BigInt(quote.fees.networkFeeEstimate);
    const totalFeeFormatted = this.formatAmount(totalFee.toString(), 24);

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
        webhookUrl: request.options?.webhookUrl || null,
        status: 'pending_deposit',
        metadata: {
          depositAddress: quote.depositAddress,
          estimatedOutput: quote.estimatedOutput,
          fees: {
            platformFeeBps: quote.fees.platformFeeBps,
            platformFeeAmount: quote.fees.platformFeeAmount,
            networkFeeEstimate: quote.fees.networkFeeEstimate
          }
        }
      }
    });

    return {
      intentId: intent.id,
      status: 'pending_deposit',
      depositAddress: quote.depositAddress,
      estimatedOutput: quote.estimatedOutput,
      estimatedTimeSeconds: quote.estimatedTimeSeconds,
      fees: {
        platformFeeBps: quote.fees.platformFeeBps,
        platformFeeAmount: quote.fees.platformFeeAmount,
        platformFeeFormatted: `${platformFeeFormatted} wNEAR`,
        networkFeeEstimate: quote.fees.networkFeeEstimate,
        networkFeeFormatted: `${networkFeeFormatted} NEAR`,
        totalFeeFormatted: `${totalFeeFormatted} NEAR (approx)`
      }
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

  private formatAmount(amount: string, decimals: number): string {
    const value = Number(amount) / Math.pow(10, decimals);
    return value.toFixed(6);
  }

  private async validateMinimumAmount(request: SwapRequest): Promise<void> {
    const decimals = TokenPriceService.getTokenDecimals(
      request.from.chain,
      request.from.token
    );

    const usdValue = await TokenPriceService.calculateUsdValue(
      request.from.chain,
      request.from.token,
      request.from.amount,
      decimals
    );

    if (usdValue < this.MINIMUM_USD_VALUE) {
      throw new Error(
        `Transaction amount ($${usdValue.toFixed(2)}) is below minimum of $${this.MINIMUM_USD_VALUE.toFixed(2)}`
      );
    }
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
