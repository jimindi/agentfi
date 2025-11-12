import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SwapController } from '../controllers/SwapController';
import { PrismaClient } from '@prisma/client';

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
    it('should return 400 for amount below minimum', async () => {
      const mockReq = {
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

      await controller.executeSwap(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'AMOUNT_TOO_LOW',
          message: expect.stringContaining('below minimum')
        })
      });
    });

    it('should return 500 on unknown token error', async () => {
      const mockReq = {
        body: {
          from: {
            chain: 'near',
            token: 'UNKNOWN',
            amount: '10000000000000000000000000' // Large amount
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

      await controller.executeSwap(mockReq, mockRes);

      // Unknown decimals error returns 500 (not a validation error per se)
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('getSwapStatus', () => {
    it('should return 404 when intent not found', async () => {
      vi.mocked(mockPrisma.intent.findUnique).mockResolvedValue(null);

      const mockReq = {
        params: {
          intentId: 'nonexistent'
        }
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as any;

      await controller.getSwapStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'INTENT_NOT_FOUND'
        })
      });
    });
  });
});
