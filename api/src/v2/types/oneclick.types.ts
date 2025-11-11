// OneClick API Types
export interface OneClickQuoteRequest {
  dry: boolean;
  swapType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  slippageTolerance: number;
  depositType: 'INTENTS';
  originAsset: string;
  destinationAsset: string;
  amount: string;
  refundTo: string;
  refundType: 'INTENTS';
  recipient: string;
  recipientType: 'INTENTS';
  deadline: string;
}

export interface OneClickQuoteResponse {
  quote: {
    depositAddress: string;
    amountOut: string;
    timeEstimate: number;
  };
}

export interface OneClickQuoteResult {
  depositAddress: string;
  estimatedOutput: string;
  estimatedTimeSeconds: number;
}
