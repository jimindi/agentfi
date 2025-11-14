import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SwapController } from '../controllers/SwapController';
import { PrismaClient } from '@prisma/client';
import { ValidationError, UnauthorizedError, NotFoundError } from '../errors';

// Mock Prisma
const mockPrisma = {
  intent: {
    create: vi.fn(),
    findUnique: vi.fn()
  }
} as unknown as PrismaClient;

// Mock TokenService
const mockTokenService = {
  resolveToken: vi.fn((token: string, chain: string) => {
    if (token === 'UNKNOWN') {
      throw new ValidationError(`Unknown token: ${token}`, { token, chain });
    }
    if (token === 'wNEAR' && chain === 'near') {
      return {
        assetId: 'nep141:wrap.near',
        symbol: 'wNEAR',
        blockchain: 'near',
        decimals: 24,
        price: 2.36,
        contractAddress: 'wrap.near'
      };
    }
    if (token === 'USDC' && chain === 'near') {
      return {
        assetId: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
        symbol: 'USDC',
        blockchain: 'near',
        decimals: 6,
        price: 1.0,
        contractAddress: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1'
      };
    }
    throw new ValidationError(`Unknown token: ${token}`, { token, chain });
  })
};

// Mock TokenPriceService
const mockTokenPriceService = {
  validateMinimumAmount: vi.fn((amount: string, decimals: number, assetId: string) => {
    const numericAmount = Number(amount) / Math.pow(10, decimals);
    const price = assetId.includes('wrap.near') ? 2.36 : 1.0;
    const usdValue = numericAmount * price;
    
    if (usdValue < 5.0) {
      throw new ValidationError(
        `Transaction amount ($${usdValue.toFixed(2)}) is below minimum of $5.00`,
        { actualUsd: usdValue, minimumUsd: 5.0 }
      );
    }
  }),
  calculateUsdValue: vi.fn(async (amount: string, decimals: number, assetId: string) => {
    const numericAmount = Number(amount) / Math.pow(10, decimals);
    const price = assetId.includes('wrap.near') ? 2.36 : 1.0;
    return numericAmount * price;
  }),
  formatAmount: vi.fn((amount: string, decimals: number, symbol: string) => {
    const value = Number(amount) / Math.pow(10, decimals);
    return `${value.toFixed(6)} ${symbol}`;
  }),
  formatUsd: vi.fn((usdValue: number) => `$${usdValue.toFixed(2)}`)
};

describe('SwapController', () => {
  let controller: SwapController;

  beforeEach(() => {
    controller = new SwapController(mockPrisma, mockTokenService as any, mockTokenPriceService as any);
    vi.clearAllMocks();
  });

  describe('executeSwap', () => {
    it('should throw ValidationError for amount below minimum', async () => {
      const mockReq = {
        auth: {
          userId: 'test-user-id',
          apiKeyId: 'test-key-id',
          rateLimitPerHour: 1000
        },
        body: {
          from: {
            chain: 'near',
            token: 'wNEAR',
            amount: '10000000000000000000000' // 0.01 wNEAR (~$0.023)
          },
          to: {
            chain: 'near',
            token: 'USDC'
          },
          user: {
            walletAddress: 'test.near'
          }
        }
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as any;

      const mockNext = vi.fn();

      await controller.executeSwap(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(ValidationError);
    });

    it('should throw ValidationError for unknown token', async () => {
      const mockReq = {
        auth: {
          userId: 'test-user-id',
          apiKeyId: 'test-key-id',
          rateLimitPerHour: 1000
        },
        body: {
          from: {
            chain: 'near',
            token: 'UNKNOWN',
            amount: '1000000000000000000000000' // 1 token
          },
          to: {
            chain: 'near',
            token: 'USDC'
          },
          user: {
            walletAddress: 'test.near'
          }
        }
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as any;

      const mockNext = vi.fn();

      await controller.executeSwap(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(ValidationError);
    });

    it('should throw UnauthorizedError when not authenticated', async () => {
      const mockReq = {
        auth: undefined, // No auth
        body: {
          from: { chain: 'near', token: 'wNEAR', amount: '1000000000000000000000000' },
          to: { chain: 'near', token: 'USDC' },
          user: { walletAddress: 'test.near' }
        }
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as any;

      const mockNext = vi.fn();

      await controller.executeSwap(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('getSwapStatus', () => {
    it('should throw NotFoundError when intent not found', async () => {
      const mockReq = {
        params: { intentId: 'nonexistent' }
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as any;

      const mockNext = vi.fn();

      vi.mocked(mockPrisma.intent.findUnique).mockResolvedValue(null);

      await controller.getSwapStatus(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
    });
  });
});
