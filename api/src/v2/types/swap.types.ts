export interface SwapRequest {
  from: {
    chain: string;
    token: string;
    amount: string;
  };
  to: {
    chain: string;
    token: string;
  };
  user: {
    walletAddress: string;
  };
}

export interface SwapResult {
  intentId: string;
  status: string;
  depositAddress: string;
  estimatedOutput: string;
  estimatedTimeSeconds: number;
}
