import fetch from 'node-fetch';

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
  status: 'PENDING_DEPOSIT' | 'EXECUTING' | 'SUCCESS' | 'FAILED';
  swapDetails?: {
    amountOut: string;
    nearTxHashes: string[];
  };
  error?: string;
}

export class OneClickService {
  private baseUrl = 'https://1click.chaindefuser.com';
  private jwtToken: string;

  constructor() {
    this.jwtToken = process.env.ONECLICK_JWT_TOKEN || '';
    if (!this.jwtToken) {
      throw new Error('ONECLICK_JWT_TOKEN not set');
    }
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
        recipientType: 'INTENTS',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`OneClick API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    
    return {
      depositAddress: data.quote.depositAddress,
      estimatedOutput: data.quote.amountOut,
      estimatedTimeSeconds: 10
    };
  }

  async getExecutionStatus(depositAddress: string): Promise<ExecutionStatus> {
    const response = await fetch(`${this.baseUrl}/v0/execution/${depositAddress}`, {
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
      swapDetails: data.swapDetails,
      error: data.error
    };
  }
}
