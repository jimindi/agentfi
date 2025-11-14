import { ExternalServiceError, ValidationError } from '../errors';

/**
 * Token Price Service
 * Fetches USD prices for tokens from external APIs
 */
interface TokenPrice {
  tokenId: string;
  priceUsd: number;
  lastUpdated: Date;
}

class TokenPriceService {
  private static priceCache: Map<string, TokenPrice> = new Map();
  private static CACHE_TTL_MS = 60000; // 1 minute

  /**
   * Get USD price for a token
   * Uses Defuse token API as primary source
   */
  static async getTokenPrice(chain: string, token: string): Promise<number> {
    const cacheKey = `${chain}:${token}`;
    
    // Check cache first
    const cached = this.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.CACHE_TTL_MS) {
      return cached.priceUsd;
    }

    try {
      // Fetch from Defuse token API
      const response = await fetch('https://api-mng-console.chaindefuser.com/api/tokens');
      
      if (!response.ok) {
        throw new ExternalServiceError('Token Price API', `HTTP ${response.status}`);
      }

      const data = await response.json();
      const tokens = data.items || [];

      // Find matching token
      const tokenData = tokens.find((t: any) => {
        return t.symbol === token && t.blockchain === chain;
      });

      if (!tokenData) {
        throw new ValidationError(
          `Price not available for ${token} on ${chain}`,
          { chain, token }
        );
      }

      const priceUsd = parseFloat(tokenData.price);
      
      // Cache the result
      this.priceCache.set(cacheKey, {
        tokenId: cacheKey,
        priceUsd,
        lastUpdated: new Date()
      });

      return priceUsd;
    } catch (error) {
      // Re-throw if already our custom error
      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error;
      }

      console.error('Error fetching token price:', error);
      
      // Fallback prices (approximate)
      const fallbackPrices: Record<string, number> = {
        'near:wNEAR': 2.34,
        'near:USDC': 1.0,
        'near:USDT': 1.0
      };

      const fallbackPrice = fallbackPrices[cacheKey];
      if (fallbackPrice) {
        console.warn(`Using fallback price for ${cacheKey}: $${fallbackPrice}`);
        return fallbackPrice;
      }

      throw new ExternalServiceError('Token Price API', 'Unable to fetch price');
    }
  }

  /**
   * Calculate USD value of token amount
   * @param chain - Blockchain (e.g., 'near')
   * @param token - Token symbol (e.g., 'wNEAR')
   * @param amount - Raw amount string (in smallest unit)
   * @param decimals - Token decimals
   */
  static async calculateUsdValue(
    chain: string,
    token: string,
    amount: string,
    decimals: number
  ): Promise<number> {
    const priceUsd = await this.getTokenPrice(chain, token);
    
    // Convert raw amount to decimal
    const amountDecimal = Number(amount) / Math.pow(10, decimals);
    
    // Calculate USD value
    const usdValue = amountDecimal * priceUsd;
    
    return usdValue;
  }

  /**
   * Get token decimals
   */
  static getTokenDecimals(chain: string, token: string): number {
    const decimalsMap: Record<string, number> = {
      'near:wNEAR': 24,
      'near:USDC': 6,
      'near:USDT': 6,
      'near:NEAR': 24
    };

    const key = `${chain}:${token}`;
    const decimals = decimalsMap[key];
    
    if (decimals === undefined) {
      throw new ValidationError(
        `Unknown decimals for token: ${token} on ${chain}`,
        { chain, token, supportedTokens: Object.keys(decimalsMap) }
      );
    }

    return decimals;
  }

  /**
   * Clear price cache (useful for testing)
   */
  static clearCache(): void {
    this.priceCache.clear();
  }
}

export default TokenPriceService;
