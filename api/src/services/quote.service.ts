import { NEARIntentsService } from './near-intents.service';
import { logger } from '../utils/logger';

interface QuoteParams {
  fromAssetId: string;
  toAssetId: string;
  amount: string;
}

interface Quote {
  fromAmount: string;
  estimatedOutput: string;
  exchangeRate: number;
  priceImpact: number;
  estimatedTimeSeconds: number;
  fees: {
    platformFeeUsd: string;
    networkFeeUsd: string;
    totalFeeUsd: string;
  };
  solver?: string;
  validUntil: Date;
}

export class QuoteService {
  private nearIntents: NEARIntentsService;

  constructor() {
    this.nearIntents = NEARIntentsService.getInstance();
  }

  async getQuote(params: QuoteParams): Promise<Quote> {
    try {
      logger.info({ params }, 'Fetching quote');

      // Mock quote calculation
      // Convert from smallest unit (yoctoNEAR) to NEAR: divide by 10^24
      const amountInNear = parseFloat(params.amount) / 1e24;
      
      // Mock exchange rate: 1 NEAR = 3.5 USDC
      const usdcAmount = amountInNear * 3.5;
      
      // Convert back to smallest unit (USDC has 6 decimals)
      const estimatedOutput = Math.floor(usdcAmount * 1e6).toString();
      
      const platformFeeUsd = this.calculatePlatformFee(amountInNear);
      const networkFeeUsd = '0.50';
      const totalFeeUsd = (parseFloat(platformFeeUsd) + parseFloat(networkFeeUsd)).toFixed(2);
      
      const exchangeRate = usdcAmount / amountInNear;

      const result: Quote = {
        fromAmount: params.amount,
        estimatedOutput,
        exchangeRate,
        priceImpact: 0.15,
        estimatedTimeSeconds: 3,
        fees: {
          platformFeeUsd,
          networkFeeUsd,
          totalFeeUsd
        },
        validUntil: new Date(Date.now() + 5 * 60 * 1000)
      };

      logger.info({ quote: result }, 'Quote generated successfully');
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error({ 
        error: errorMessage,
        stack: errorStack,
        params 
      }, 'Failed to get quote');
      
      throw new Error(`Quote generation failed: ${errorMessage}`);
    }
  }

  private calculatePlatformFee(amountInNear: number): string {
    // 0.1% platform fee in USD (assuming 1 NEAR = $3.5)
    const nearPriceUsd = 3.5;
    const fee = amountInNear * nearPriceUsd * 0.001;
    return fee.toFixed(2);
  }
}
