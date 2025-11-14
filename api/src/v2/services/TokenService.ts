import axios from 'axios';
import { logger } from '../../utils/logger';
import { ExternalServiceError, ValidationError } from '../errors';

export interface OneClickToken {
  assetId: string;
  decimals: number;
  blockchain: string;
  symbol: string;
  price: number;
  priceUpdatedAt: string;
  contractAddress?: string; // Optional - only for token contracts
}

export class TokenService {
  private tokens: Map<string, OneClickToken> = new Map();
  private lastUpdated: Date | null = null;
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
  private readonly ONECLICK_API_URL = 'https://1click.chaindefuser.com';

  constructor() {}

  /**
   * Fetch and cache tokens from OneClick API
   */
  async refreshTokenCache(): Promise<void> {
    try {
      logger.info('Fetching tokens from OneClick API...');
      
      const response = await axios.get(`${this.ONECLICK_API_URL}/v0/tokens`, {
        timeout: 10000, // 10 second timeout
      });

      if (!Array.isArray(response.data)) {
        throw new ExternalServiceError(
          'Invalid response format from OneClick tokens endpoint',
          { responseType: typeof response.data }
        );
      }

      // Clear existing cache
      this.tokens.clear();

      // Populate cache
      for (const token of response.data) {
        this.tokens.set(token.assetId, {
          assetId: token.assetId,
          decimals: token.decimals,
          blockchain: token.blockchain,
          symbol: token.symbol,
          price: parseFloat(token.price),
          priceUpdatedAt: token.priceUpdatedAt,
          contractAddress: token.contractAddress, // May be undefined
        });
      }

      this.lastUpdated = new Date();

      logger.info('Token cache refreshed', {
        tokenCount: this.tokens.size,
        timestamp: this.lastUpdated.toISOString(),
      });
    } catch (error) {
      // If it's already our custom error, re-throw it
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        throw new ExternalServiceError(
          'Failed to fetch tokens from OneClick API',
          {
            status: error.response?.status,
            message: error.message,
          }
        );
      }
      
      // Re-throw unexpected errors
      throw error;
    }
  }

  /**
   * Get all cached tokens
   */
  getAllTokens(): OneClickToken[] {
    return Array.from(this.tokens.values());
  }

  /**
   * Get cache metadata
   */
  getCacheInfo(): { lastUpdated: Date | null; tokenCount: number; isStale: boolean } {
    const now = Date.now();
    const lastUpdateTime = this.lastUpdated?.getTime() || 0;
    const isStale = now - lastUpdateTime > this.CACHE_TTL_MS;

    return {
      lastUpdated: this.lastUpdated,
      tokenCount: this.tokens.size,
      isStale,
    };
  }

  /**
   * Find token by assetId
   */
  findByAssetId(assetId: string): OneClickToken | null {
    return this.tokens.get(assetId) || null;
  }

  /**
   * Find tokens by symbol (may return multiple)
   */
  findBySymbol(symbol: string, chain?: string): OneClickToken[] {
    const results: OneClickToken[] = [];

    for (const token of this.tokens.values()) {
      // Match symbol (case-insensitive)
      if (token.symbol.toLowerCase() === symbol.toLowerCase()) {
        // If chain specified, must match
        if (chain && token.blockchain.toLowerCase() !== chain.toLowerCase()) {
          continue;
        }
        results.push(token);
      }
    }

    return results;
  }

  /**
   * Resolve user input to OneClickToken
   * Supports both assetId and symbol+chain formats
   */
  resolveToken(token: string, chain?: string): OneClickToken {
    // Case 1: Direct assetId provided (contains ":")
    if (token.includes(':')) {
      const found = this.findByAssetId(token);
      if (!found) {
        throw new ValidationError(`Invalid assetId: ${token}`);
      }
      return found;
    }

    // Case 2: Symbol lookup (with optional chain filter)
    const matches = this.findBySymbol(token, chain);

    if (matches.length === 0) {
      const chainMsg = chain ? ` on chain "${chain}"` : '';
      throw new ValidationError(`Token "${token}" not found${chainMsg}`);
    }

    if (matches.length > 1) {
      throw new ValidationError(
        `Multiple "${token}" tokens found. Please specify chain or use assetId.`,
        {
          availableOptions: matches.map((t) => ({
            blockchain: t.blockchain,
            assetId: t.assetId,
            contractAddress: t.contractAddress || null,
          })),
        }
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
      throw new ValidationError(`Token not found: ${assetId}`);
    }
    return token.price;
  }

  /**
   * Get list of unique blockchains
   */
  getBlockchains(): string[] {
    const blockchains = new Set<string>();
    for (const token of this.tokens.values()) {
      blockchains.add(token.blockchain);
    }
    return Array.from(blockchains).sort();
  }
}
