// User input format (hybrid - supports both symbol+chain and assetId)
export interface SwapRequest {
  from: {
    chain?: string;      // Optional if using assetId
    token: string;       // Symbol (e.g., "USDC") OR assetId (e.g., "nep141:wrap.near")
    amount: string;
  };
  to: {
    chain?: string;      // Optional if using assetId
    token: string;       // Symbol (e.g., "USDC") OR assetId
  };
  user: {
    walletAddress: string;
  };
  options?: {
    webhookUrl?: string;
  };
}

// Enhanced token info in response
export interface TokenInfo {
  symbol: string;
  assetId: string;
  blockchain: string;
  decimals: number;
  contractAddress?: string;  // Optional - only for token contracts, not native tokens
  amount: string;
  amountFormatted: string;
  amountUsd: string;
}

// Fee breakdown
export interface FeeBreakdown {
  platformFeeBps: number;
  platformFeeAmount: string;
  platformFeeFormatted: string;
  platformFeeUsd: string;
  networkFeeEstimate: string;
  networkFeeFormatted: string;
  networkFeeUsd: string;
  totalFeeFormatted: string;
  totalFeeUsd: string;
}

// Enhanced swap result with full token details
export interface SwapResult {
  intentId: string;
  status: string;
  depositAddress: string;
  from: TokenInfo;
  to: Omit<TokenInfo, 'amount' | 'amountFormatted' | 'amountUsd'> & {
    estimatedAmount: string;
    estimatedFormatted: string;
    estimatedUsd: string;
  };
  fees: FeeBreakdown;
  estimatedTimeSeconds: number;
  deadline: string;
}

// Legacy types for backward compatibility (if needed during migration)
export interface LegacySwapRequest {
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
