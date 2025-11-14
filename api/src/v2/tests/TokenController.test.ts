import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { TokenController } from '../controllers/TokenController';
import { TokenService } from '../services/TokenService';
import { ValidationError } from '../errors';

describe('TokenController', () => {
  let tokenController: TokenController;
  let mockTokenService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: any;

  beforeEach(() => {
    // Create mock TokenService
    mockTokenService = {
      getAllTokens: vi.fn(),
      getBlockchains: vi.fn(),
      findByAssetId: vi.fn(),
      findBySymbol: vi.fn(),
    };

    tokenController = new TokenController(mockTokenService);

    // Setup mock request and response
    mockRequest = {
      query: {},
      params: {},
    };

    jsonMock = vi.fn();
    mockResponse = {
      json: jsonMock,
    };
  });

  describe('listTokens', () => {
    const mockTokens = [
      {
        assetId: 'nep141:wrap.near',
        symbol: 'wNEAR',
        blockchain: 'near',
        decimals: 24,
        contractAddress: 'wrap.near',
        priceUsd: 2.5,
        icon: 'https://example.com/wnear.png',
      },
      {
        assetId: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
        symbol: 'USDC',
        blockchain: 'near',
        decimals: 6,
        contractAddress: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
        priceUsd: 1.0,
        icon: 'https://example.com/usdc.png',
      },
      {
        assetId: 'erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        blockchain: 'ethereum',
        decimals: 6,
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        priceUsd: 1.0,
        icon: 'https://example.com/usdc.png',
      },
    ];

    it('should list all tokens without filters', async () => {
      mockTokenService.getAllTokens.mockReturnValue(mockTokens);

      await tokenController.listTokens(mockRequest as Request, mockResponse as Response);

      expect(mockTokenService.getAllTokens).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          tokens: expect.arrayContaining([
            expect.objectContaining({ symbol: 'wNEAR' }),
            expect.objectContaining({ symbol: 'USDC' }),
          ]),
          total: 3,
          filters: {
            chain: null,
            symbol: null,
          },
        },
      });
    });

    it('should filter tokens by chain', async () => {
      mockTokenService.getAllTokens.mockReturnValue(mockTokens);
      mockRequest.query = { chain: 'near' };

      await tokenController.listTokens(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          tokens: expect.arrayContaining([
            expect.objectContaining({ blockchain: 'near', symbol: 'wNEAR' }),
            expect.objectContaining({ blockchain: 'near', symbol: 'USDC' }),
          ]),
          total: 2,
          filters: {
            chain: 'near',
            symbol: null,
          },
        },
      });
    });

    it('should filter tokens by symbol (case-insensitive)', async () => {
      mockTokenService.getAllTokens.mockReturnValue(mockTokens);
      mockRequest.query = { symbol: 'usdc' };

      await tokenController.listTokens(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          tokens: expect.arrayContaining([
            expect.objectContaining({ symbol: 'USDC', blockchain: 'ethereum' }),
            expect.objectContaining({ symbol: 'USDC', blockchain: 'near' }),
          ]),
          total: 2,
          filters: {
            chain: null,
            symbol: 'usdc',
          },
        },
      });
    });

    it('should filter tokens by both chain and symbol', async () => {
      mockTokenService.getAllTokens.mockReturnValue(mockTokens);
      mockRequest.query = { chain: 'near', symbol: 'USDC' };

      await tokenController.listTokens(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          tokens: [
            expect.objectContaining({ 
              symbol: 'USDC', 
              blockchain: 'near',
            }),
          ],
          total: 1,
          filters: {
            chain: 'near',
            symbol: 'USDC',
          },
        },
      });
    });

    it('should return empty array when no tokens match filters', async () => {
      mockTokenService.getAllTokens.mockReturnValue(mockTokens);
      mockRequest.query = { chain: 'solana', symbol: 'BTC' };

      await tokenController.listTokens(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          tokens: [],
          total: 0,
          filters: {
            chain: 'solana',
            symbol: 'BTC',
          },
        },
      });
    });

    it('should sort tokens by blockchain then symbol', async () => {
      mockTokenService.getAllTokens.mockReturnValue(mockTokens);

      await tokenController.listTokens(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const tokens = response.data.tokens;

      // Ethereum tokens should come before NEAR tokens (alphabetically)
      expect(tokens[0].blockchain).toBe('ethereum');
      expect(tokens[1].blockchain).toBe('near');
      expect(tokens[2].blockchain).toBe('near');

      // Within NEAR, USDC should come before wNEAR (alphabetically)
      expect(tokens[1].symbol).toBe('USDC');
      expect(tokens[2].symbol).toBe('wNEAR');
    });
  });

  describe('getChains', () => {
    it('should return list of blockchains with token counts', async () => {
      const mockBlockchains = ['near', 'ethereum', 'solana'];
      const mockTokens = [
        { blockchain: 'near', symbol: 'wNEAR' },
        { blockchain: 'near', symbol: 'USDC' },
        { blockchain: 'ethereum', symbol: 'USDC' },
        { blockchain: 'ethereum', symbol: 'WETH' },
        { blockchain: 'ethereum', symbol: 'WBTC' },
        { blockchain: 'solana', symbol: 'SOL' },
      ];

      mockTokenService.getBlockchains.mockReturnValue(mockBlockchains);
      mockTokenService.getAllTokens.mockReturnValue(mockTokens);

      await tokenController.getChains(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          blockchains: [
            { name: 'ethereum', tokenCount: 3 },
            { name: 'near', tokenCount: 2 },
            { name: 'solana', tokenCount: 1 },
          ],
          total: 3,
        },
      });
    });

    it('should handle empty blockchain list', async () => {
      mockTokenService.getBlockchains.mockReturnValue([]);
      mockTokenService.getAllTokens.mockReturnValue([]);

      await tokenController.getChains(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          blockchains: [],
          total: 0,
        },
      });
    });
  });

  describe('getToken', () => {
    const mockToken = {
      assetId: 'nep141:wrap.near',
      symbol: 'wNEAR',
      blockchain: 'near',
      decimals: 24,
      contractAddress: 'wrap.near',
      priceUsd: 2.5,
      icon: 'https://example.com/wnear.png',
    };

    it('should return token details by assetId', async () => {
      mockRequest.params = { assetId: 'nep141:wrap.near' };
      mockTokenService.findByAssetId.mockReturnValue(mockToken);

      await tokenController.getToken(mockRequest as Request, mockResponse as Response);

      expect(mockTokenService.findByAssetId).toHaveBeenCalledWith('nep141:wrap.near');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          token: mockToken,
        },
      });
    });

    it('should throw ValidationError if assetId is missing', async () => {
      mockRequest.params = {};

      await expect(
        tokenController.getToken(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if token not found', async () => {
      mockRequest.params = { assetId: 'nep141:unknown.near' };
      mockTokenService.findByAssetId.mockReturnValue(null);

      await expect(
        tokenController.getToken(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Token with assetId "nep141:unknown.near" not found');
    });
  });

  describe('searchTokens', () => {
    const mockTokens = [
      {
        assetId: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
        symbol: 'USDC',
        blockchain: 'near',
        decimals: 6,
        contractAddress: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
        priceUsd: 1.0,
        icon: 'https://example.com/usdc.png',
      },
      {
        assetId: 'erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        blockchain: 'ethereum',
        decimals: 6,
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        priceUsd: 1.0,
        icon: 'https://example.com/usdc.png',
      },
    ];

    it('should search tokens by symbol', async () => {
      mockRequest.query = { q: 'USDC' };
      mockTokenService.findBySymbol.mockReturnValue(mockTokens);

      await tokenController.searchTokens(mockRequest as Request, mockResponse as Response);

      expect(mockTokenService.findBySymbol).toHaveBeenCalledWith('USDC', undefined);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          tokens: mockTokens,
          total: 2,
          query: {
            search: 'USDC',
            chain: null,
          },
        },
      });
    });

    it('should search tokens by symbol with chain filter', async () => {
      mockRequest.query = { q: 'USDC', chain: 'near' };
      mockTokenService.findBySymbol.mockReturnValue([mockTokens[0]]);

      await tokenController.searchTokens(mockRequest as Request, mockResponse as Response);

      expect(mockTokenService.findBySymbol).toHaveBeenCalledWith('USDC', 'near');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          tokens: [mockTokens[0]],
          total: 1,
          query: {
            search: 'USDC',
            chain: 'near',
          },
        },
      });
    });

    it('should throw ValidationError if query parameter is missing', async () => {
      mockRequest.query = {};

      await expect(
        tokenController.searchTokens(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Search query parameter "q" is required');
    });

    it('should throw ValidationError if query parameter is not a string', async () => {
      mockRequest.query = { q: 123 };

      await expect(
        tokenController.searchTokens(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Search query parameter "q" is required');
    });

    it('should return empty array when no tokens match search', async () => {
      mockRequest.query = { q: 'UNKNOWN' };
      mockTokenService.findBySymbol.mockReturnValue([]);

      await tokenController.searchTokens(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          tokens: [],
          total: 0,
          query: {
            search: 'UNKNOWN',
            chain: null,
          },
        },
      });
    });
  });
});
