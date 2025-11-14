import { ValidationError } from '../errors';
import { TokenService } from './TokenService';

/**
 * Token Price Service
 * Uses TokenService for dynamic pricing from OneClick API
 */
class TokenPriceService {
  constructor(private tokenService: TokenService) {}

  /**
   * Get current price from TokenService cache
   */
  getPrice(assetId: string): number {
    return this.tokenService.getTokenPrice(assetId);
  }

  /**
   * Calculate USD value of token amount
   * @param amount - Raw amount string (in smallest unit)
   * @param decimals - Token decimals
   * @param assetId - Token assetId
   */
  calculateUsdValue(amount: string, decimals: number, assetId: string): number {
    const price = this.getPrice(assetId);
    const amountNum = parseFloat(amount) / Math.pow(10, decimals);
    return amountNum * price;
  }

  /**
   * Validate minimum amount ($5 USD)
   */
  validateMinimumAmount(amount: string, decimals: number, assetId: string): void {
    const usdValue = this.calculateUsdValue(amount, decimals, assetId);
    
    if (usdValue < 5.0) {
      throw new ValidationError(
        `Transaction amount ($${usdValue.toFixed(2)}) is below minimum of $5.00`,
        { actualUsd: usdValue, minimumUsd: 5.0 }
      );
    }
  }

  /**
   * Format token amount for display
   * @param amount - Raw amount string (in smallest unit)
   * @param decimals - Token decimals
   * @param symbol - Token symbol for display
   */
  formatAmount(amount: string, decimals: number, symbol: string): string {
    const amountNum = parseFloat(amount) / Math.pow(10, decimals);
    return `${amountNum.toFixed(decimals <= 6 ? decimals : 6)} ${symbol}`;
  }

  /**
   * Format USD value for display
   */
  formatUsd(usdValue: number): string {
    return `$${usdValue.toFixed(2)}`;
  }
}

export default TokenPriceService;
