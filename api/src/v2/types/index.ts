// Re-export all types
export * from './swap.types';

// TokenService types
export interface OneClickToken {
  assetId: string;
  decimals: number;
  blockchain: string;
  symbol: string;
  price: number;
  priceUpdatedAt: string;
  contractAddress?: string; // Optional - only for token contracts
}
