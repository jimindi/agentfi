import { env } from '../../config/env';

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

  constructor() {
    if (!env.ONECLICK_JWT_TOKEN) {
      throw new Error('ONECLICK_JWT_TOKEN is required');
    }
    this.jwtToken = env.ONECLICK_JWT_TOKEN;
    this.feeRecipient = env.AGENTFI_FEE_WALLET;
  }

  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
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
            fee: 15
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OneClick API error: ${response.statusText} - ${errorText}`);
    }

    const data: any = await response.json();
    
    return {
      depositAddress: data.quote.depositAddress,
      estimatedOutput: data.quote.amountOut,
      estimatedTimeSeconds: 10
    };
  }

  async getExecutionStatus(depositAddress: string): Promise<ExecutionStatus> {
    const response = await fetch(`${this.baseUrl}/v0/status?depositAddress=${depositAddress}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.jwtToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { status: 'PENDING_DEPOSIT' };
      }
      throw new Error(`OneClick API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    
    return {
      status: data.status,
      swapDetails: data.swapDetails
    };
  }
}

export default new OneClickService();
