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
  options?: {
    webhookUrl?: string;
  };
}

export interface TransferInstructions {
  method: 'ft_transfer_call' | 'ft_transfer';
  contract: string;
  receiver: string;
  amount: string;
  msg?: string;
  deposit: string;
  gas: string;
  nearCliCommand: string;
}

export interface SwapResult {
  intentId: string;
  status: string;
  depositAddress: string;
  from: {
    symbol: string;
    assetId: string;
    blockchain: string;
    decimals: number;
    contractAddress: string | null;
    amount: string;
    amountFormatted: string;
    amountUsd: string;
  };
  to: {
    symbol: string;
    assetId: string;
    blockchain: string;
    decimals: number;
    contractAddress: string | null;
    estimatedOutput: string;
    estimatedOutputFormatted: string;
    estimatedOutputUsd: string;
  };
  estimatedTimeSeconds: number;
  fees: {
    platformFeeBps: number;
    platformFeeAmount: string;
    platformFeeFormatted: string;
    networkFeeEstimate: string;
    networkFeeFormatted: string;
    totalFeeFormatted: string;
  };
  transferInstructions: TransferInstructions;
}

export interface SwapStatus {
  intentId: string;
  status: string;
  from: {
    chain: string;
    token: string;
    amount: string;
  };
  to: {
    chain: string;
    token: string;
    estimatedOutput: string;
    actualOutput?: string;
  };
  depositAddress: string;
  txHash?: string;
  createdAt: Date;
  completedAt?: Date;
}
