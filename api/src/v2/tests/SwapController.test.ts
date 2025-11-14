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

describe('SwapController', () => {
  let controller: SwapController;

  beforeEach(() => {
    controller = new SwapController(mockPrisma);
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
