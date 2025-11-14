import axios from 'axios';
import { logger } from '../../utils/logger';
import { ExternalServiceError, ValidationError } from '../errors';

export interface OneClickToken {
  assetId: string;
  symbol: string;
  blockchain: string;
  decimals: number;
  contractAddress: string;
  priceUsd: number;
  icon?: string;
}

interface TokenCache {
  tokens: OneClickToken[];
  lastUpdated: Date | null;
  isStale: boolean;
}

/**
 * Token Service - Singleton
 * Fetches and caches supported tokens from OneClick API
 */
export class TokenService {
  private static instance: TokenService | null = null;
  private cache: TokenCache = {
    tokens: [],
    lastUpdated: null,
    isStale: false,
  };

  private readonly ONECLICK_API_URL = process.env.ONECLICK_API_URL || 'https://1click.chaindefuser.com';
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Refresh token cache from OneClick API
   */
  async refreshTokenCache(): Promise<void> {
    try {
      logger.info('Fetching tokens from OneClick API...');
      
      const response = await axios.get<any[]>(
        `${this.ONECLICK_API_URL}/v0/tokens`
      );

      // Map response to our interface
      this.cache.tokens = response.data.map(token => ({
        assetId: token.assetId,
        symbol: token.symbol,
        blockchain: token.blockchain,
        decimals: token.decimals,
        contractAddress: token.contractAddress,
        priceUsd: parseFloat(token.price),
        icon: token.icon,
      }));

      this.cache.lastUpdated = new Date();
      this.cache.isStale = false;

      logger.info('Token cache refreshed', {
        tokenCount: this.cache.tokens.length,
        blockchains: this.getBlockchains().length,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to refresh token cache');
      this.cache.isStale = true;
      throw new ExternalServiceError(
        'Failed to fetch supported tokens from OneClick API',
        { originalError: error }
      );
    }
  }

  /**
   * Get all cached tokens
   */
  getAllTokens(): OneClickToken[] {
    this.checkCacheHealth();
    return [...this.cache.tokens];
  }

  /**
   * Get list of supported blockchains
   */
  getBlockchains(): string[] {
    const blockchains = new Set(this.cache.tokens.map(t => t.blockchain));
    return Array.from(blockchains).sort();
  }

  /**
   * Find token by assetId
   */
  findByAssetId(assetId: string): OneClickToken | null {
    return this.cache.tokens.find(t => t.assetId === assetId) || null;
  }

  /**
   * Find tokens by symbol (case-insensitive, partial match)
   * @param symbol - Token symbol to search
   * @param blockchain - Optional blockchain filter
   */
  findBySymbol(symbol: string, blockchain?: string): OneClickToken[] {
    const symbolLower = symbol.toLowerCase();
    
    let results = this.cache.tokens.filter(t =>
      t.symbol.toLowerCase().includes(symbolLower)
    );

    if (blockchain) {
      results = results.filter(t => 
        t.blockchain.toLowerCase() === blockchain.toLowerCase()
      );
    }

    return results;
  }

  /**
   * Resolve token string to OneClickToken
   * Supports both assetId and symbol (with optional chain)
   */
  resolveToken(token: string, chain?: string): OneClickToken {
    // Try assetId first (format: "protocol:address")
    if (token.includes(':')) {
      const found = this.findByAssetId(token);
      if (found) return found;
    }

    // Try symbol search
    const matches = this.findBySymbol(token, chain);
    
    if (matches.length === 0) {
      throw new ValidationError(
        `Token "${token}" not found${chain ? ` on ${chain}` : ''}`,
        { token, chain }
      );
    }

    if (matches.length > 1 && !chain) {
      const chains = matches.map(t => t.blockchain).join(', ');
      throw new ValidationError(
        `Multiple tokens found for "${token}". Please specify chain. Available: ${chains}`,
        { token, availableChains: chains }
      );
    }

    return matches[0];
  }

  /**
   * Get token price in USD
   */
  getTokenPrice(assetId: string): number {
    const token = this.findByAssetId(assetId);
    if (!token) {
      throw new ValidationError(`Token with assetId "${assetId}" not found`);
    }
    return token.priceUsd;
  }

  /**
   * Get cache information
   */
  getCacheInfo() {
    return {
      tokenCount: this.cache.tokens.length,
      lastUpdated: this.cache.lastUpdated,
      isStale: this.cache.isStale,
      blockchains: this.getBlockchains().length,
    };
  }

  /**
   * Check if cache is healthy and log warning if stale
   */
  private checkCacheHealth(): void {
    if (this.cache.isStale) {
      logger.warn('Token cache is stale - data may be outdated');
    }

    if (this.cache.lastUpdated) {
      const age = Date.now() - this.cache.lastUpdated.getTime();
      if (age > this.CACHE_TTL_MS) {
        logger.warn('Token cache is older than TTL', {
          ageMinutes: Math.round(age / 60000),
        });
      }
    }
  }
}

// Export singleton instance getter
export default TokenService.getInstance();
