import { OpenAPI, OneClickService } from '@defuse-protocol/one-click-sdk-typescript';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// Configure OneClick API
OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = env.ONECLICK_JWT_TOKEN;

interface QuoteParams {
  fromToken: string;
  toToken: string;
  fromAmount: string;
}

export class QuoteService {
  constructor() {
    logger.info('QuoteService initialized with OneClick API');
  }

  async getQuote(params: QuoteParams) {
    try {
      // Map simple symbols to Defuse asset IDs
      const tokenMap: Record<string, string> = {
        'wNEAR': 'nep141:wrap.near',
        'USDC': 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
        'USDT': 'nep141:usdt.tether-token.near',
        'ETH': 'nep141:eth.bridge.near',
      };

      const originAsset = tokenMap[params.fromToken] || params.fromToken;
      const destinationAsset = tokenMap[params.toToken] || params.toToken;

      // Use direct fetch with ALL required fields
      const response = await fetch('https://1click.chaindefuser.com/v0/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.ONECLICK_JWT_TOKEN}`
        },
        body: JSON.stringify({
          originAsset,
          destinationAsset,
          amount: params.fromAmount,
          dry: true,
          swapType: 'EXACT_INPUT',
          depositType: 'ORIGIN_CHAIN',
          refundType: 'INTENTS',
          recipientType: 'INTENTS',
          slippageTolerance: 50,
          refundTo: 'agentfi-dev-1762307277.testnet',
          recipient: 'agentfi-dev-1762307277.testnet',
          deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OneClick API error: ${error}`);
      }

      const quote = await response.json();

      logger.info({ quote }, 'Quote received from OneClick');

      const platformFeeUsd = (Number(params.fromAmount) * 0.001).toFixed(2);

      return {
        success: true,
        data: {
          quote: {
            fromAmount: params.fromAmount,
            estimatedOutput: quote.amountOut || quote.amount_out || '0',
            exchangeRate: quote.exchangeRate || '0',
            estimatedTime: '20-30 seconds',
            fees: {
              platformFeeUsd,
              networkFeeUsd: '0.50',
              totalFeeUsd: (Number(platformFeeUsd) + 0.5).toFixed(2),
            },
          },
          route: {
            path: [originAsset, destinationAsset],
            hops: 1,
          },
        },
      };
    } catch (error: any) {
      logger.error({ error, params }, 'Quote generation failed');
      throw error;
    }
  }
}
