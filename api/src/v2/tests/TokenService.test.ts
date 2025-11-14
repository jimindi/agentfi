import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TokenService } from '../services/TokenService';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('TokenService', () => {
  let tokenService: TokenService;

  const mockTokensResponse = [
    {
      assetId: 'nep141:wrap.near',
      symbol: 'wNEAR',
      blockchain: 'near',
      decimals: 24,
      contractAddress: 'wrap.near',
      price: '2.5',
      icon: 'https://example.com/wnear.png',
    },
    {
      assetId: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
      symbol: 'USDC',
      blockchain: 'near',
      decimals: 6,
      contractAddress: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
      price: '1.0',
      icon: 'https://example.com/usdc.png',
    },
    {
      assetId: 'erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      symbol: 'USDC',
      blockchain: 'ethereum',
      decimals: 6,
      contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      price: '1.0',
      icon: 'https://example.com/usdc.png',
    },
  ];

  beforeEach(() => {
    // Get singleton instance
    tokenService = TokenService.getInstance();
    vi.clearAllMocks();
  });

  describe('refreshTokenCache', () => {
    it('should fetch and cache tokens from OneClick API', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockTokensResponse });

      await tokenService.refreshTokenCache();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v0/tokens')
      );

      const cacheInfo = tokenService.getCacheInfo();
      expect(cacheInfo.tokenCount).toBe(3);
      expect(cacheInfo.isStale).toBe(false);
      expect(cacheInfo.lastUpdated).toBeInstanceOf(Date);
    });

    it('should mark cache as stale on API failure', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(tokenService.refreshTokenCache()).rejects.toThrow();

      const cacheInfo = tokenService.getCacheInfo();
      expect(cacheInfo.isStale).toBe(true);
    });
  });

  describe('getAllTokens', () => {
    it('should return all cached tokens', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockTokensResponse });
      await tokenService.refreshTokenCache();

      const tokens = tokenService.getAllTokens();

      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toHaveProperty('assetId');
      expect(tokens[0]).toHaveProperty('symbol');
    });
  });

  describe('getBlockchains', () => {
    it('should return unique list of blockchains', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockTokensResponse });
      await tokenService.refreshTokenCache();

      const blockchains = tokenService.getBlockchains();

      expect(blockchains).toContain('near');
      expect(blockchains).toContain('ethereum');
      expect(blockchains).toHaveLength(2);
      expect(blockchains).toEqual(['ethereum', 'near']); // Should be sorted
    });
  });

  describe('findByAssetId', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ data: mockTokensResponse });
      await tokenService.refreshTokenCache();
    });

    it('should find token by exact assetId', () => {
      const token = tokenService.findByAssetId('nep141:wrap.near');

      expect(token).toBeDefined();
      expect(token?.symbol).toBe('wNEAR');
      expect(token?.blockchain).toBe('near');
    });

    it('should return null for non-existent assetId', () => {
      const token = tokenService.findByAssetId('nep141:nonexistent.near');
      expect(token).toBeNull();
    });
  });

  describe('findBySymbol', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ data: mockTokensResponse });
      await tokenService.refreshTokenCache();
    });

    it('should find tokens by exact symbol', () => {
      const tokens = tokenService.findBySymbol('wNEAR');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].symbol).toBe('wNEAR');
    });

    it('should find tokens by case-insensitive symbol', () => {
      const tokens = tokenService.findBySymbol('wnear');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].symbol).toBe('wNEAR');
    });

    it('should find multiple tokens with same symbol', () => {
      const tokens = tokenService.findBySymbol('USDC');

      expect(tokens).toHaveLength(2);
      expect(tokens.every(t => t.symbol === 'USDC')).toBe(true);
    });

    it('should filter by blockchain when provided', () => {
      const tokens = tokenService.findBySymbol('USDC', 'near');

      expect(tokens).toHaveLength(1);
      expect(tokens[0].blockchain).toBe('near');
    });

    it('should support partial symbol matching', () => {
      const tokens = tokenService.findBySymbol('USD');

      expect(tokens).toHaveLength(2);
      expect(tokens.every(t => t.symbol.includes('USD'))).toBe(true);
    });

    it('should return empty array for non-existent symbol', () => {
      const tokens = tokenService.findBySymbol('NONEXISTENT');
      expect(tokens).toEqual([]);
    });
  });

  describe('resolveToken', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ data: mockTokensResponse });
      await tokenService.refreshTokenCache();
    });

    it('should resolve by assetId', () => {
      const token = tokenService.resolveToken('nep141:wrap.near');

      expect(token.symbol).toBe('wNEAR');
      expect(token.assetId).toBe('nep141:wrap.near');
    });

    it('should resolve by symbol when unique', () => {
      const token = tokenService.resolveToken('wNEAR');

      expect(token.symbol).toBe('wNEAR');
      expect(token.blockchain).toBe('near');
    });

    it('should resolve by symbol with chain filter', () => {
      const token = tokenService.resolveToken('USDC', 'near');

      expect(token.symbol).toBe('USDC');
      expect(token.blockchain).toBe('near');
    });

    it('should throw error for non-existent token', () => {
      expect(() => tokenService.resolveToken('NONEXISTENT')).toThrow(
        'Token "NONEXISTENT" not found'
      );
    });

    it('should throw error for ambiguous symbol without chain', () => {
      expect(() => tokenService.resolveToken('USDC')).toThrow(
        'Multiple tokens found for "USDC"'
      );
    });
  });

  describe('getTokenPrice', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ data: mockTokensResponse });
      await tokenService.refreshTokenCache();
    });

    it('should return token price by assetId', () => {
      const price = tokenService.getTokenPrice('nep141:wrap.near');
      expect(price).toBe(2.5);
    });

    it('should throw error for non-existent token', () => {
      expect(() => tokenService.getTokenPrice('nep141:nonexistent.near')).toThrow(
        'Token with assetId "nep141:nonexistent.near" not found'
      );
    });
  });

  describe('getCacheInfo', () => {
    it('should return cache information', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockTokensResponse });
      await tokenService.refreshTokenCache();

      const info = tokenService.getCacheInfo();

      expect(info).toHaveProperty('tokenCount', 3);
      expect(info).toHaveProperty('lastUpdated');
      expect(info).toHaveProperty('isStale', false);
      expect(info).toHaveProperty('blockchains', 2);
    });
  });
});
