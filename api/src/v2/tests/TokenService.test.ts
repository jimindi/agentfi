import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { TokenService } from '../services/TokenService';
import { ValidationError, ExternalServiceError } from '../errors';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('TokenService', () => {
  let tokenService: TokenService;

  const mockTokens = [
    {
      assetId: 'nep141:wrap.near',
      decimals: 24,
      blockchain: 'near',
      symbol: 'wNEAR',
      price: '2.36',
      priceUpdatedAt: '2025-11-14T12:00:00.000Z',
      contractAddress: 'wrap.near',
    },
    {
      assetId: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
      decimals: 6,
      blockchain: 'near',
      symbol: 'USDC',
      price: '1.00',
      priceUpdatedAt: '2025-11-14T12:00:00.000Z',
      contractAddress: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
    },
    {
      assetId: 'eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near',
      decimals: 6,
      blockchain: 'eth',
      symbol: 'USDC',
      price: '1.00',
      priceUpdatedAt: '2025-11-14T12:00:00.000Z',
      contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
    {
      assetId: 'nep141:btc.omft.near',
      decimals: 8,
      blockchain: 'btc',
      symbol: 'BTC',
      price: '95863.00',
      priceUpdatedAt: '2025-11-14T12:00:00.000Z',
      // No contractAddress - native token
    },
    {
      assetId: 'nep141:eth.omft.near',
      decimals: 18,
      blockchain: 'eth',
      symbol: 'ETH',
      price: '3421.50',
      priceUpdatedAt: '2025-11-14T12:00:00.000Z',
      // No contractAddress - native token
    },
  ];

  beforeEach(() => {
    tokenService = new TokenService();
    vi.clearAllMocks();
  });

  describe('refreshTokenCache', () => {
    it('should fetch and cache tokens from OneClick API', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockTokens });

      await tokenService.refreshTokenCache();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://1click.chaindefuser.com/v0/tokens',
        { timeout: 10000 }
      );

      const tokens = tokenService.getAllTokens();
      expect(tokens).toHaveLength(5);
      expect(tokens[0].symbol).toBe('wNEAR');
    });

    it('should handle API errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 500 },
        message: 'Server error',
      };
      
      mockedAxios.get.mockRejectedValueOnce(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(tokenService.refreshTokenCache()).rejects.toThrow(ExternalServiceError);
    });

    it('should handle invalid response format', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: 'invalid' });

      await expect(tokenService.refreshTokenCache()).rejects.toThrow(ExternalServiceError);
    });

    it('should parse prices correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockTokens });

      await tokenService.refreshTokenCache();

      const wNEAR = tokenService.findByAssetId('nep141:wrap.near');
      expect(wNEAR?.price).toBe(2.36);
      expect(typeof wNEAR?.price).toBe('number');
    });
  });

  describe('findByAssetId', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockTokens });
      await tokenService.refreshTokenCache();
    });

    it('should find token by assetId', () => {
      const token = tokenService.findByAssetId('nep141:wrap.near');
      expect(token).toBeDefined();
      expect(token?.symbol).toBe('wNEAR');
      expect(token?.contractAddress).toBe('wrap.near');
    });

    it('should return null for unknown assetId', () => {
      const token = tokenService.findByAssetId('unknown:token');
      expect(token).toBeNull();
    });

    it('should handle native tokens without contractAddress', () => {
      const token = tokenService.findByAssetId('nep141:btc.omft.near');
      expect(token).toBeDefined();
      expect(token?.symbol).toBe('BTC');
      expect(token?.contractAddress).toBeUndefined();
    });
  });

  describe('findBySymbol', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockTokens });
      await tokenService.refreshTokenCache();
    });

    it('should find token by symbol', () => {
      const tokens = tokenService.findBySymbol('wNEAR');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].assetId).toBe('nep141:wrap.near');
    });

    it('should find token by symbol and chain', () => {
      const tokens = tokenService.findBySymbol('USDC', 'near');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].blockchain).toBe('near');
    });

    it('should return multiple tokens with same symbol', () => {
      const tokens = tokenService.findBySymbol('USDC');
      expect(tokens).toHaveLength(2); // NEAR and ETH
    });

    it('should be case-insensitive', () => {
      const tokens = tokenService.findBySymbol('usdc');
      expect(tokens).toHaveLength(2);
    });

    it('should return empty array for unknown symbol', () => {
      const tokens = tokenService.findBySymbol('INVALID');
      expect(tokens).toHaveLength(0);
    });
  });

  describe('resolveToken', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockTokens });
      await tokenService.refreshTokenCache();
    });

    it('should resolve token by assetId', () => {
      const token = tokenService.resolveToken('nep141:wrap.near');
      expect(token.symbol).toBe('wNEAR');
    });

    it('should resolve token by symbol + chain', () => {
      const token = tokenService.resolveToken('USDC', 'near');
      expect(token.assetId).toContain('17208628');
    });

    it('should resolve unique symbol without chain', () => {
      const token = tokenService.resolveToken('wNEAR');
      expect(token.assetId).toBe('nep141:wrap.near');
    });

    it('should throw error for ambiguous symbol without chain', () => {
      expect(() => {
        tokenService.resolveToken('USDC'); // Multiple USDC tokens exist
      }).toThrow('Multiple "USDC" tokens found');
    });

    it('should throw error with available options for ambiguous symbol', () => {
      try {
        tokenService.resolveToken('USDC');
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.details.availableOptions).toHaveLength(2);
        expect(error.details.availableOptions[0]).toHaveProperty('blockchain');
        expect(error.details.availableOptions[0]).toHaveProperty('assetId');
      }
    });

    it('should throw error for invalid assetId', () => {
      expect(() => {
        tokenService.resolveToken('invalid:assetid');
      }).toThrow('Invalid assetId');
    });

    it('should throw error for unknown symbol', () => {
      expect(() => {
        tokenService.resolveToken('INVALID', 'near');
      }).toThrow('Token "INVALID" not found');
    });

    it('should handle native tokens without contractAddress', () => {
      const token = tokenService.resolveToken('BTC', 'btc');
      expect(token.contractAddress).toBeUndefined();
      expect(token.symbol).toBe('BTC');
    });

    it('should handle contract tokens with contractAddress', () => {
      const token = tokenService.resolveToken('wNEAR', 'near');
      expect(token.contractAddress).toBe('wrap.near');
    });
  });

  describe('getTokenPrice', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockTokens });
      await tokenService.refreshTokenCache();
    });

    it('should return token price', () => {
      const price = tokenService.getTokenPrice('nep141:wrap.near');
      expect(price).toBe(2.36);
    });

    it('should throw error for unknown token', () => {
      expect(() => {
        tokenService.getTokenPrice('unknown:token');
      }).toThrow('Token not found');
    });
  });

  describe('getBlockchains', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockTokens });
      await tokenService.refreshTokenCache();
    });

    it('should return list of unique blockchains', () => {
      const blockchains = tokenService.getBlockchains();
      expect(blockchains).toContain('near');
      expect(blockchains).toContain('eth');
      expect(blockchains).toContain('btc');
      expect(blockchains.length).toBeGreaterThan(0);
    });

    it('should return sorted list', () => {
      const blockchains = tokenService.getBlockchains();
      const sorted = [...blockchains].sort();
      expect(blockchains).toEqual(sorted);
    });
  });

  describe('getCacheInfo', () => {
    it('should return cache metadata', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockTokens });
      await tokenService.refreshTokenCache();

      const info = tokenService.getCacheInfo();
      expect(info.lastUpdated).toBeInstanceOf(Date);
      expect(info.tokenCount).toBe(5);
      expect(info.isStale).toBe(false);
    });

    it('should indicate stale cache', () => {
      const info = tokenService.getCacheInfo();
      expect(info.lastUpdated).toBeNull();
      expect(info.tokenCount).toBe(0);
      expect(info.isStale).toBe(true);
    });
  });

  describe('getAllTokens', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockTokens });
      await tokenService.refreshTokenCache();
    });

    it('should return all cached tokens', () => {
      const tokens = tokenService.getAllTokens();
      expect(tokens).toHaveLength(5);
    });

    it('should preserve contractAddress when present', () => {
      const tokens = tokenService.getAllTokens();
      const wNEAR = tokens.find((t) => t.symbol === 'wNEAR');
      expect(wNEAR?.contractAddress).toBe('wrap.near');
    });

    it('should omit contractAddress when not present', () => {
      const tokens = tokenService.getAllTokens();
      const BTC = tokens.find((t) => t.symbol === 'BTC');
      expect(BTC?.contractAddress).toBeUndefined();
    });
  });
});
