import { OneClickQuoteRequest, OneClickQuoteResponse, OneClickQuoteResult } from '../types/oneclick.types';

export class OneClickService {
  private readonly baseUrl = 'https://1click.chaindefuser.com';

  async getQuote(params: {
    originAsset: string;
    destinationAsset: string;
    amount: string;
    recipient: string;
  }): Promise<OneClickQuoteResult> {
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const request: OneClickQuoteRequest = {
      dry: false,
      swapType: 'EXACT_INPUT',
      slippageTolerance: 1.0,
      depositType: 'INTENTS',
      originAsset: params.originAsset,
      destinationAsset: params.destinationAsset,
      amount: params.amount,
      refundTo: params.recipient,
      refundType: 'INTENTS',
      recipient: params.recipient,
      recipientType: 'INTENTS',
      deadline: deadline
    };

    const response = await fetch(`${this.baseUrl}/v0/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`OneClick API error: ${response.status}`);
    }

    const data: OneClickQuoteResponse = await response.json();

    return {
      depositAddress: data.quote.depositAddress,
      estimatedOutput: data.quote.amountOut,
      estimatedTimeSeconds: data.quote.timeEstimate
    };
  }
}
