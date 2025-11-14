import { env } from '../../config/env';
import { ExternalServiceError, InternalError, TimeoutError } from '../errors';

export interface QuoteRequest {
  fromAsset: string;
  toAsset: string;
  amount: string;
  userWallet: string;
}

export interface QuoteResponse {
  depositAddress: string;
  estimatedOutput: string;
  estimatedTimeSeconds: number;
  amountIn: string;
  amountOut: string;
  fees: {
    platformFeeBps: number;
    platformFeeAmount: string;
    networkFeeEstimate: string;
  };
}

export interface ExecutionStatus {
  status: 'PENDING_DEPOSIT' | 'PROCESSING' | 'SUCCESS' | 'INCOMPLETE_DEPOSIT' | 'REFUNDED' | 'FAILED';
  swapDetails?: {
    amountOut: string;
    nearTxHashes: string[];
  };
}

class OneClickService {
  private baseUrl = 'https://1click.chaindefuser.com';
  private jwtToken: string;
  private feeRecipient: string;
  private readonly PLATFORM_FEE_BPS = 15; // 15 basis points = 0.15%
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  constructor() {
    if (!env.ONECLICK_JWT_TOKEN) {
      throw new InternalError('ONECLICK_JWT_TOKEN is required');
    }
    this.jwtToken = env.ONECLICK_JWT_TOKEN;
    this.feeRecipient = env.AGENTFI_FEE_WALLET;
  }

  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${this.baseUrl}/v0/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.jwtToken}`
        },
        body: JSON.stringify({
          dry: false,
          swapType: 'EXACT_INPUT',
          depositType: 'INTENTS',
          originAsset: request.fromAsset,
          destinationAsset: request.toAsset,
          amount: request.amount,
          recipient: request.userWallet,
          recipientType: 'DESTINATION_CHAIN',
          refundTo: request.userWallet,
          refundType: 'ORIGIN_CHAIN',
          slippageTolerance: 100,
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          appFees: [
            {
              recipient: this.feeRecipient,
              fee: this.PLATFORM_FEE_BPS
            }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new ExternalServiceError(
          'OneClick API',
          `${response.statusText} - ${errorText}`
        );
      }

      const data: any = await response.json();
      
      // Calculate platform fee amount (15 bps of input)
      const platformFeeAmount = this.calculatePlatformFee(request.amount);

      return {
        depositAddress: data.quote.depositAddress,
        estimatedOutput: data.quote.amountOut,
        estimatedTimeSeconds: 10,
        amountIn: data.quote.amountIn,
        amountOut: data.quote.amountOut,
        fees: {
          platformFeeBps: this.PLATFORM_FEE_BPS,
          platformFeeAmount: platformFeeAmount,
          networkFeeEstimate: '500000000000000000000000' // ~0.0005 NEAR estimated
        }
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new TimeoutError('OneClick API', this.REQUEST_TIMEOUT);
      }
      
      // Re-throw if already our custom error
      if (error instanceof ExternalServiceError || error instanceof TimeoutError) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new ExternalServiceError('OneClick API', error.message);
    }
  }

  private calculatePlatformFee(amount: string): string {
    const amountBigInt = BigInt(amount);
    const feeBigInt = (amountBigInt * BigInt(this.PLATFORM_FEE_BPS)) / BigInt(10000);
    return feeBigInt.toString();
  }

  async getExecutionStatus(depositAddress: string): Promise<ExecutionStatus> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${this.baseUrl}/v0/status?depositAddress=${depositAddress}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.jwtToken}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          return { status: 'PENDING_DEPOSIT' };
        }
        throw new ExternalServiceError('OneClick API', response.statusText);
      }

      const data: any = await response.json();
      
      return {
        status: data.status,
        swapDetails: data.swapDetails
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new TimeoutError('OneClick API', this.REQUEST_TIMEOUT);
      }
      
      // Re-throw if already our custom error
      if (error instanceof ExternalServiceError || error instanceof TimeoutError) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new ExternalServiceError('OneClick API', error.message);
    }
  }
}

export default new OneClickService();
