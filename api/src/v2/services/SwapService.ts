import OneClickService from './OneClickService';
import TokenPriceService from './TokenPriceService';
import TokenService from './TokenService';
import { SwapRequest, SwapResult } from '../types/swap.types';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../errors';

export class SwapService {
  private prisma: PrismaClient;
  private tokenService: TokenService;
  private tokenPriceService: TokenPriceService;
  private readonly MINIMUM_USD_VALUE = 5.0; // $5 minimum

  constructor(
    prisma: PrismaClient,
    tokenService: TokenService,
    tokenPriceService: TokenPriceService
  ) {
    this.prisma = prisma;
    this.tokenService = tokenService;
    this.tokenPriceService = tokenPriceService;
  }

  async executeSwap(
    request: SwapRequest,
    userId: string,
    apiKeyId: string
  ): Promise<SwapResult> {
    // Resolve tokens
    const fromToken = this.tokenService.resolveToken(
      request.from.token,
      request.from.chain
    );
    const toToken = this.tokenService.resolveToken(
      request.to.token,
      request.to.chain
    );

    // Validate minimum transaction amount
    await this.tokenPriceService.validateMinimumAmount(
      request.from.amount,
      fromToken.decimals,
      fromToken.assetId
    );

    // Get quote from OneClick
    const quote = await OneClickService.getQuote({
      fromAsset: fromToken.assetId,
      toAsset: toToken.assetId,
      amount: request.from.amount,
      userWallet: request.user.walletAddress
    });

    // Calculate USD values
    const fromAmountUsd = await this.tokenPriceService.calculateUsdValue(
      request.from.amount,
      fromToken.decimals,
      fromToken.assetId
    );
    const estimatedOutputUsd = await this.tokenPriceService.calculateUsdValue(
      quote.estimatedOutput,
      toToken.decimals,
      toToken.assetId
    );

    // Format amounts for display
    const fromAmountFormatted = this.tokenPriceService.formatAmount(
      request.from.amount,
      fromToken.decimals,
      fromToken.symbol
    );
    const estimatedOutputFormatted = this.tokenPriceService.formatAmount(
      quote.estimatedOutput,
      toToken.decimals,
      toToken.symbol
    );

    // Store in database with actual user and API key
    const intent = await this.prisma.intent.create({
      data: {
        user: {
          connect: { id: userId }
        },
        apiKey: {
          connect: { id: apiKeyId }
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
      from: {
        symbol: fromToken.symbol,
        assetId: fromToken.assetId,
        blockchain: fromToken.blockchain,
        decimals: fromToken.decimals,
        contractAddress: fromToken.contractAddress,
        amount: request.from.amount,
        amountFormatted: fromAmountFormatted,
        amountUsd: this.tokenPriceService.formatUsd(fromAmountUsd)
      },
      to: {
        symbol: toToken.symbol,
        assetId: toToken.assetId,
        blockchain: toToken.blockchain,
        decimals: toToken.decimals,
        contractAddress: toToken.contractAddress,
        estimatedOutput: quote.estimatedOutput,
        estimatedOutputFormatted: estimatedOutputFormatted,
        estimatedOutputUsd: this.tokenPriceService.formatUsd(estimatedOutputUsd)
      },
      estimatedTimeSeconds: quote.estimatedTimeSeconds,
      fees: {
        platformFeeBps: quote.fees.platformFeeBps,
        platformFeeAmount: quote.fees.platformFeeAmount,
        platformFeeFormatted: this.tokenPriceService.formatAmount(
          quote.fees.platformFeeAmount,
          fromToken.decimals,
          fromToken.symbol
        ),
        networkFeeEstimate: quote.fees.networkFeeEstimate,
        networkFeeFormatted: this.tokenPriceService.formatAmount(
          quote.fees.networkFeeEstimate,
          fromToken.decimals,
          'NEAR'
        ),
        totalFeeFormatted: this.tokenPriceService.formatAmount(
          (BigInt(quote.fees.platformFeeAmount) + BigInt(quote.fees.networkFeeEstimate)).toString(),
          fromToken.decimals,
          'NEAR'
        )
      }
    };
  }

  async getSwapStatus(intentId: string) {
    const intent = await this.prisma.intent.findUnique({
      where: { id: intentId }
    });

    if (!intent) {
      throw new NotFoundError('Intent', intentId);
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
}
